import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { FocusPresetRecord, SessionRecord, TaskRecord } from '@/types'
import {
  recordSession,
  updateSessionNote,
  getFocusPresets,
  resolveNotificationPreferences,
} from '@/services/data'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import {
  unlockAudioContext,
  playFocusStartSound,
  playFocusCompleteSound,
  playBreakCompleteSound,
} from '@/lib/sounds'
import { updateDynamicFavicon, resetDynamicFavicon } from '@/lib/dynamic-favicon'

export type PomodoroPhase = 'foco' | 'descanso_curto' | 'descanso_longo'

export interface ActivePreset {
  id?: string
  name: string
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  blocksBeforeLongBreak: number
}

export const DEFAULT_PRESET: ActivePreset = {
  name: 'Foco',
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  blocksBeforeLongBreak: 4,
}

export interface PendingSessionNote {
  sessionId: string
  taskTitle?: string
  durationMinutes: number
  blockNumber: number
  totalBlocks: number
}

export interface PomodoroState {
  task: TaskRecord | null
  status: 'rodando' | 'pausado'
  phase: PomodoroPhase
  currentBlock: number // 1-based (ex: 1, 2, 3, 4)
  totalBlocks: number // preset.blocksBeforeLongBreak
  preset: ActivePreset
  totalDurationSeconds: number
  remaining: number
  startedAt: Date
  focusedSeconds: number
  reference: number
  isOvertime: boolean
  overtimeSeconds: number
  overtimeStartedAt?: number
}

// Mensagens sincronizadas entre abas via BroadcastChannel
interface PomodoroSyncMessage {
  type: 'STATE_UPDATE' | 'DISCARD' | 'REQUEST_SYNC' | 'HEARTBEAT'
  tabId: string
  state: {
    task: TaskRecord | null
    status: 'rodando' | 'pausado'
    phase: PomodoroPhase
    currentBlock: number
    totalBlocks: number
    preset: ActivePreset
    totalDurationSeconds: number
    remaining: number
    startedAtIso: string
    focusedSeconds: number
    reference: number
    isOvertime: boolean
    overtimeSeconds: number
    overtimeStartedAt?: number
  } | null
  timestamp: number
}

const TAB_ID =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab_${Math.random().toString(36).slice(2)}_${Date.now()}`

const CHANNEL_NAME = 'barbosa_pomodoro_sync_v1'

export interface PomodoroContextValue {
  state: PomodoroState | null
  selectedTask: TaskRecord | null
  seconds: number
  overtimeSeconds: number
  isOvertime: boolean
  activePreset: ActivePreset
  setActivePreset: (preset: ActivePreset | FocusPresetRecord) => void
  start: (
    task?: TaskRecord | null,
    customPreset?: ActivePreset | FocusPresetRecord,
  ) => Promise<void>
  toggle: () => void
  finish: (note?: string) => Promise<SessionRecord | null>
  discard: () => void
  selectTask: (task: TaskRecord | null) => void
  skipToNextPhase: () => Promise<void>
  startBreakFromOvertime: () => Promise<void>
  startNextBlockFromBreak: () => Promise<void>
  pendingNote: PendingSessionNote | null
  submitPendingNote: (note: string) => Promise<void>
  dismissPendingNote: () => void
  isReadOnlyTab: boolean
  activeTabOwner: boolean
}

const Context = createContext<PomodoroContextValue | null>(null)

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activePreset, setActivePresetState] = useState<ActivePreset>(DEFAULT_PRESET)
  const [state, setState] = useState<PomodoroState | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null)
  const [now, setNow] = useState(Date.now())
  const [pendingNote, setPendingNote] = useState<PendingSessionNote | null>(null)
  const pendingNoteRef = useRef(pendingNote)
  pendingNoteRef.current = pendingNote

  // Controle de propriedade de abas (BroadcastChannel)
  const [controllingTabId, setControllingTabId] = useState<string | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state

  const selectedTaskRef = useRef(selectedTask)
  selectedTaskRef.current = selectedTask

  const activePresetRef = useRef(activePreset)
  activePresetRef.current = activePreset

  const userRef = useRef(user)
  userRef.current = user

  const activeTabOwner = !controllingTabId || controllingTabId === TAB_ID
  const isReadOnlyTab = !!controllingTabId && controllingTabId !== TAB_ID && !!state

  // Carrega o preset padrão inicial do banco quando disponível
  useEffect(() => {
    let mounted = true
    getFocusPresets(false)
      .then((presets) => {
        if (!mounted || presets.length === 0) return
        const first = presets[0]
        setActivePresetState({
          id: first.id,
          name: first.name,
          workMinutes: Math.max(5, first.work_minutes),
          shortBreakMinutes: Math.max(5, first.short_break_minutes),
          longBreakMinutes: Math.max(5, first.long_break_minutes),
          blocksBeforeLongBreak: Math.max(1, first.blocks_before_long_break),
        })
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  // Inicializa BroadcastChannel para sincronização entre abas
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return

    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = (event: MessageEvent<PomodoroSyncMessage>) => {
      const msg = event.data
      if (!msg || msg.tabId === TAB_ID) return

      if (msg.type === 'REQUEST_SYNC') {
        // Se esta aba está controlando um timer ativo, responde com o estado atual
        if (stateRef.current && (!controllingTabId || controllingTabId === TAB_ID)) {
          const s = stateRef.current
          channel.postMessage({
            type: 'STATE_UPDATE',
            tabId: TAB_ID,
            state: {
              task: s.task,
              status: s.status,
              phase: s.phase,
              currentBlock: s.currentBlock,
              totalBlocks: s.totalBlocks,
              preset: s.preset,
              totalDurationSeconds: s.totalDurationSeconds,
              remaining: s.remaining,
              startedAtIso: s.startedAt.toISOString(),
              focusedSeconds: s.focusedSeconds,
              reference: s.reference,
              isOvertime: s.isOvertime,
              overtimeSeconds: s.overtimeSeconds,
              overtimeStartedAt: s.overtimeStartedAt,
            },
            timestamp: Date.now(),
          } satisfies PomodoroSyncMessage)
        }
        return
      }

      if (msg.type === 'STATE_UPDATE') {
        if (msg.state) {
          setControllingTabId(msg.tabId)
          setState({
            task: msg.state.task,
            status: msg.state.status,
            phase: msg.state.phase,
            currentBlock: msg.state.currentBlock,
            totalBlocks: msg.state.totalBlocks,
            preset: msg.state.preset,
            totalDurationSeconds: msg.state.totalDurationSeconds,
            remaining: msg.state.remaining,
            startedAt: new Date(msg.state.startedAtIso),
            focusedSeconds: msg.state.focusedSeconds,
            reference: msg.state.reference,
            isOvertime: msg.state.isOvertime,
            overtimeSeconds: msg.state.overtimeSeconds,
            overtimeStartedAt: msg.state.overtimeStartedAt,
          })
        } else {
          setControllingTabId(null)
          setState(null)
        }
        return
      }

      if (msg.type === 'DISCARD') {
        setControllingTabId(null)
        setState(null)
      }
    }

    // Pede estado para abas já ativas
    channel.postMessage({
      type: 'REQUEST_SYNC',
      tabId: TAB_ID,
      state: null,
      timestamp: Date.now(),
    } satisfies PomodoroSyncMessage)

    return () => {
      channel.close()
    }
  }, [controllingTabId])

  // Função helper para difundir estado para as outras abas
  const broadcastState = useCallback((s: PomodoroState | null) => {
    if (!channelRef.current) return
    try {
      if (s) {
        channelRef.current.postMessage({
          type: 'STATE_UPDATE',
          tabId: TAB_ID,
          state: {
            task: s.task,
            status: s.status,
            phase: s.phase,
            currentBlock: s.currentBlock,
            totalBlocks: s.totalBlocks,
            preset: s.preset,
            totalDurationSeconds: s.totalDurationSeconds,
            remaining: s.remaining,
            startedAtIso: s.startedAt.toISOString(),
            focusedSeconds: s.focusedSeconds,
            reference: s.reference,
            isOvertime: s.isOvertime,
            overtimeSeconds: s.overtimeSeconds,
            overtimeStartedAt: s.overtimeStartedAt,
          },
          timestamp: Date.now(),
        } satisfies PomodoroSyncMessage)
      } else {
        channelRef.current.postMessage({
          type: 'DISCARD',
          tabId: TAB_ID,
          state: null,
          timestamp: Date.now(),
        } satisfies PomodoroSyncMessage)
      }
    } catch {
      // Silencioso
    }
  }, [])

  const setActivePreset = useCallback((preset: ActivePreset | FocusPresetRecord) => {
    const normalized: ActivePreset =
      'work_minutes' in preset
        ? {
            id: preset.id,
            name: preset.name,
            workMinutes: Math.max(5, preset.work_minutes),
            shortBreakMinutes: Math.max(5, preset.short_break_minutes),
            longBreakMinutes: Math.max(5, preset.long_break_minutes),
            blocksBeforeLongBreak: Math.max(1, preset.blocks_before_long_break),
          }
        : {
            ...preset,
            workMinutes: Math.max(5, preset.workMinutes),
            shortBreakMinutes: Math.max(5, preset.shortBreakMinutes),
            longBreakMinutes: Math.max(5, preset.longBreakMinutes),
            blocksBeforeLongBreak: Math.max(1, preset.blocksBeforeLongBreak),
          }
    setActivePresetState(normalized)
  }, [])

  const selectTask = useCallback(
    (task: TaskRecord | null) => {
      setSelectedTask(task)
      setState((curr) => {
        if (!curr) return null
        const updated = { ...curr, task }
        broadcastState(updated)
        return updated
      })

      if (task) {
        toast({
          title: 'Tarefa vinculada ao Pomodoro',
          description: task.title,
        })
      } else {
        toast({
          title: 'Vínculo removido',
          description: 'Pomodoro em modo foco livre.',
        })
      }
    },
    [broadcastState],
  )

  // Timer tick
  useEffect(() => {
    if (!state || state.status !== 'rodando') return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [state?.status])

  // Cálculo de segundos restantes e segundos de excesso
  const { seconds, isOvertime, overtimeSeconds } = useMemo(() => {
    if (!state) {
      return {
        seconds: activePreset.workMinutes * 60,
        isOvertime: false,
        overtimeSeconds: 0,
      }
    }

    if (!state.isOvertime) {
      const elapsedSinceRef =
        state.status === 'rodando' ? Math.floor((now - state.reference) / 1000) : 0
      const remainingSec = Math.max(0, state.remaining - elapsedSinceRef)
      return {
        seconds: remainingSec,
        isOvertime: false,
        overtimeSeconds: 0,
      }
    }

    // Em modo de excesso:
    const additionalOvertime =
      state.status === 'rodando' ? Math.floor((now - state.reference) / 1000) : 0
    const totalOt = state.overtimeSeconds + additionalOvertime
    return {
      seconds: 0,
      isOvertime: true,
      overtimeSeconds: totalOt,
    }
  }, [state, now, activePreset.workMinutes])

  // Disparo de notificação nativa como backup para aba em segundo plano (document.hidden)
  const sendBackgroundNotification = useCallback((title: string, body: string) => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return
      if (Notification.permission !== 'granted') return
      const prefs = resolveNotificationPreferences(userRef.current)
      if (!prefs.enabled) return

      const n = new Notification(title, {
        body: `${body} · Barbosa System`,
        tag: 'barbosa-pomodoro-phase',
        icon: '/favicon.ico',
      })
      n.onclick = () => {
        window.focus()
        n.close()
      }
    } catch (err) {
      console.warn('Erro ao disparar notificação do Pomodoro:', err)
    }
  }, [])

  // MÁQUINA DE ESTADOS: Transição quando o timer previsto zera (00:00)
  // REGRA CRÍTICA: NÃO transita automaticamente para pausa nem inicia novo bloco sozinho!
  // Toca o som respectivo, envia notificação de backup se aba oculta e ENTRA EM MODO DE EXCESSO.
  const phaseCompletedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!state || state.status !== 'rodando' || state.isOvertime) return

    // Se a contagem regressiva chegou a zero:
    if (seconds <= 0) {
      const phaseKey = `${state.phase}-${state.currentBlock}-${state.startedAt.getTime()}`
      if (phaseCompletedRef.current !== phaseKey) {
        phaseCompletedRef.current = phaseKey

        if (state.phase === 'foco') {
          // 1. Toca som de finalização de foco
          playFocusCompleteSound()

          // 2. Notificação nativa se aba oculta
          if (document.hidden) {
            sendBackgroundNotification(
              'Bloco de foco concluído',
              'O tempo previsto acabou! O timer está contando excesso. Inicie a pausa quando desejar.',
            )
          }

          toast({
            title: `Bloco de foco ${state.currentBlock}/${state.totalBlocks} finalizado!`,
            description: 'Contando excesso. Clique em "Iniciar Pausa" para descansar.',
          })

          // 3. Entra em modo de excesso, mantendo 'foco' rodando
          const updatedState: PomodoroState = {
            ...state,
            remaining: 0,
            focusedSeconds: state.focusedSeconds + state.remaining,
            isOvertime: true,
            overtimeSeconds: 0,
            overtimeStartedAt: Date.now(),
            reference: Date.now(),
          }
          setState(updatedState)
          broadcastState(updatedState)
        } else {
          // Fase de descanso (curto ou longo) zerou
          // 1. Toca som de volta ao trabalho (fim da pausa)
          playBreakCompleteSound()

          // 2. Notificação nativa se aba oculta
          if (document.hidden) {
            sendBackgroundNotification(
              'Pausa concluída',
              'Sua pausa terminou! Inicie o próximo bloco de foco quando estiver pronto.',
            )
          }

          toast({
            title: 'Descanso concluído!',
            description: 'Pronto para retomar? Clique em "Iniciar Próximo Bloco".',
          })

          // 3. Entra em modo de excesso de pausa
          const updatedState: PomodoroState = {
            ...state,
            remaining: 0,
            isOvertime: true,
            overtimeSeconds: 0,
            overtimeStartedAt: Date.now(),
            reference: Date.now(),
          }
          setState(updatedState)
          broadcastState(updatedState)
        }
      }
    }
  }, [seconds, state, sendBackgroundNotification, broadcastState])

  // Finalização manual ou gravação da sessão de foco
  const finish = useCallback(
    async (note?: string): Promise<SessionRecord | null> => {
      const current = stateRef.current
      if (!current) return null

      unlockAudioContext()
      let savedSession: SessionRecord | null = null

      // Tempo decorrido nesta fase de foco
      let totalElapsedSec = current.focusedSeconds
      if (current.isOvertime) {
        totalElapsedSec +=
          current.totalDurationSeconds +
          current.overtimeSeconds +
          (current.status === 'rodando' ? Math.floor((Date.now() - current.reference) / 1000) : 0)
      } else {
        totalElapsedSec +=
          current.status === 'rodando'
            ? Math.min(current.remaining, (Date.now() - current.reference) / 1000)
            : 0
      }

      // SÓ blocos de foco registram sessão na coleção `sessions`
      if (current.phase === 'foco' && totalElapsedSec > 0) {
        const minutes = totalElapsedSec / 60
        // Se já passou do tempo previsto ou está em excesso: "completa"; antes do tempo: "interrompida"
        const isComplete = current.isOvertime || totalElapsedSec >= current.totalDurationSeconds - 1
        try {
          savedSession = await recordSession(
            current.task,
            current.startedAt,
            new Date(),
            minutes,
            isComplete ? 'completa' : 'interrompida',
            note,
          )
        } catch (err) {
          console.error('Erro ao registrar sessão no finish:', err)
        }
        const taskLabel = current.task?.title ? ` em '${current.task.title}'` : ''
        toast({
          title: `Sessão registrada — ${Math.max(1, Math.round(minutes))} min${taskLabel}`,
        })
      }
      setState(null)
      setSelectedTask(null)
      setControllingTabId(null)
      broadcastState(null)
      resetDynamicFavicon()
      return savedSession
    },
    [broadcastState],
  )

  // AÇÃO OBRIGATÓRIA A: Iniciar pausa após o foco (quando estiver em excesso ou manual)
  // Grava a sessão de foco com tempo TOTAL incluindo excesso, status "completa", inicia a pausa
  // e exibe o prompt não-bloqueante "O que foi feito?"
  const startBreakFromOvertime = useCallback(async () => {
    const current = stateRef.current
    if (!current || current.phase !== 'foco') return

    unlockAudioContext()

    // 1. Calcula tempo total de foco com precisão
    let totalElapsedSec = current.totalDurationSeconds + current.overtimeSeconds
    if (current.status === 'rodando') {
      totalElapsedSec += Math.floor((Date.now() - current.reference) / 1000)
    }
    const minutes = Math.max(1 / 60, totalElapsedSec / 60)

    // 2. Grava a sessão com status "completa"
    let createdSession: SessionRecord | null = null
    try {
      createdSession = await recordSession(
        current.task,
        current.startedAt,
        new Date(),
        minutes,
        'completa',
      )
    } catch (err) {
      console.error('Erro ao gravar sessão no início da pausa:', err)
    }

    const taskLabel = current.task?.title ? ` em '${current.task.title}'` : ''
    toast({
      title: `Bloco ${current.currentBlock}/${current.totalBlocks} concluído!${taskLabel}`,
      description: 'Hora do descanso. O que foi feito nesse bloco?',
    })

    // 3. Prompt discreto não-bloqueante de nota durante a pausa
    if (createdSession) {
      setPendingNote({
        sessionId: createdSession.id,
        taskTitle: current.task?.title,
        durationMinutes: Math.round(minutes),
        blockNumber: current.currentBlock,
        totalBlocks: current.totalBlocks,
      })
    }

    // 4. Inicia a pausa (curta ou longa)
    const isLongBreak = current.currentBlock >= current.totalBlocks
    const nextPhase: PomodoroPhase = isLongBreak ? 'descanso_longo' : 'descanso_curto'
    const breakMinutes = isLongBreak
      ? current.preset.longBreakMinutes
      : current.preset.shortBreakMinutes

    const totalSec = breakMinutes * 60
    setNow(Date.now())
    const nextState: PomodoroState = {
      ...current,
      phase: nextPhase,
      status: 'rodando',
      totalDurationSeconds: totalSec,
      remaining: totalSec,
      startedAt: new Date(),
      focusedSeconds: 0,
      reference: Date.now(),
      isOvertime: false,
      overtimeSeconds: 0,
      overtimeStartedAt: undefined,
    }
    setState(nextState)
    broadcastState(nextState)
  }, [broadcastState])

  // AÇÃO OBRIGATÓRIA A: Iniciar próximo bloco de foco após a pausa (ação manual do usuário)
  const startNextBlockFromBreak = useCallback(async () => {
    const current = stateRef.current
    if (!current || current.phase === 'foco') return

    unlockAudioContext()
    playFocusStartSound() // Toca som de início de bloco de foco

    const nextBlock = current.phase === 'descanso_longo' ? 1 : current.currentBlock + 1
    const totalSec = current.preset.workMinutes * 60

    setNow(Date.now())
    const nextState: PomodoroState = {
      ...current,
      phase: 'foco',
      status: 'rodando',
      currentBlock: nextBlock,
      totalDurationSeconds: totalSec,
      remaining: totalSec,
      startedAt: new Date(),
      focusedSeconds: 0,
      reference: Date.now(),
      isOvertime: false,
      overtimeSeconds: 0,
      overtimeStartedAt: undefined,
    }
    setState(nextState)
    broadcastState(nextState)

    toast({
      title: `Bloco ${nextBlock}/${current.totalBlocks} iniciado!`,
      description: 'Bom trabalho! Mantenha a concentração.',
    })
  }, [broadcastState])

  // Iniciar timer com um preset opcional e tarefa opcional
  const start = useCallback(
    async (task?: TaskRecord | null, customPreset?: ActivePreset | FocusPresetRecord) => {
      unlockAudioContext()
      playFocusStartSound() // Som de início

      if (stateRef.current) {
        await finish()
      }

      setControllingTabId(TAB_ID)

      const effectiveTask = task !== undefined ? task : (selectedTaskRef.current ?? null)
      setSelectedTask(effectiveTask)

      let chosenPreset = activePresetRef.current
      if (customPreset) {
        chosenPreset =
          'work_minutes' in customPreset
            ? {
                id: customPreset.id,
                name: customPreset.name,
                workMinutes: Math.max(5, customPreset.work_minutes),
                shortBreakMinutes: Math.max(5, customPreset.short_break_minutes),
                longBreakMinutes: Math.max(5, customPreset.long_break_minutes),
                blocksBeforeLongBreak: Math.max(1, customPreset.blocks_before_long_break),
              }
            : {
                ...customPreset,
                workMinutes: Math.max(5, customPreset.workMinutes),
                shortBreakMinutes: Math.max(5, customPreset.shortBreakMinutes),
                longBreakMinutes: Math.max(5, customPreset.longBreakMinutes),
                blocksBeforeLongBreak: Math.max(1, customPreset.blocksBeforeLongBreak),
              }
        setActivePresetState(chosenPreset)
      }

      const totalSec = chosenPreset.workMinutes * 60
      setNow(Date.now())
      const newState: PomodoroState = {
        task: effectiveTask,
        status: 'rodando',
        phase: 'foco',
        currentBlock: 1,
        totalBlocks: chosenPreset.blocksBeforeLongBreak,
        preset: chosenPreset,
        totalDurationSeconds: totalSec,
        remaining: totalSec,
        startedAt: new Date(),
        focusedSeconds: 0,
        reference: Date.now(),
        isOvertime: false,
        overtimeSeconds: 0,
      }
      setState(newState)
      broadcastState(newState)
    },
    [finish, broadcastState],
  )

  const toggle = useCallback(() => {
    unlockAudioContext()
    setControllingTabId(TAB_ID)

    setState((current) => {
      if (!current) {
        // Se estava inativo, inicia com o preset atual e tarefa pendente selecionada
        playFocusStartSound()
        const initialTask = selectedTaskRef.current ?? null
        const totalSec = activePresetRef.current.workMinutes * 60
        const fresh: PomodoroState = {
          task: initialTask,
          status: 'rodando',
          phase: 'foco',
          currentBlock: 1,
          totalBlocks: activePresetRef.current.blocksBeforeLongBreak,
          preset: activePresetRef.current,
          totalDurationSeconds: totalSec,
          remaining: totalSec,
          startedAt: new Date(),
          focusedSeconds: 0,
          reference: Date.now(),
          isOvertime: false,
          overtimeSeconds: 0,
        }
        broadcastState(fresh)
        return fresh
      }

      if (current.status === 'rodando') {
        if (current.isOvertime) {
          const add = Math.floor((Date.now() - current.reference) / 1000)
          const paused: PomodoroState = {
            ...current,
            status: 'pausado',
            overtimeSeconds: current.overtimeSeconds + add,
          }
          broadcastState(paused)
          return paused
        }
        const elapsed = Math.min(current.remaining, (Date.now() - current.reference) / 1000)
        const paused: PomodoroState = {
          ...current,
          status: 'pausado',
          remaining: current.remaining - elapsed,
          focusedSeconds: current.focusedSeconds + elapsed,
        }
        broadcastState(paused)
        return paused
      }

      // Estava pausado, retoma
      const resumed: PomodoroState = { ...current, status: 'rodando', reference: Date.now() }
      broadcastState(resumed)
      return resumed
    })
  }, [broadcastState])

  const discard = useCallback(() => {
    unlockAudioContext()
    setState(null)
    setSelectedTask(null)
    setControllingTabId(null)
    broadcastState(null)
    resetDynamicFavicon()
  }, [broadcastState])

  // Envio e descarte da nota pós-foco
  const submitPendingNote = useCallback(
    async (noteText: string) => {
      const currentPending = pendingNoteRef.current || pendingNote
      if (!currentPending) return
      const trimmed = noteText.trim()
      if (trimmed) {
        try {
          await updateSessionNote(currentPending.sessionId, trimmed)
          toast({
            title: 'Nota de foco registrada',
            description: trimmed.length > 50 ? `${trimmed.slice(0, 50)}...` : trimmed,
          })
        } catch (err) {
          console.error('Erro ao atualizar nota da sessão:', err)
          toast({
            title: 'Erro ao salvar nota da sessão',
            variant: 'destructive',
          })
        }
      }
      setPendingNote(null)
    },
    [pendingNote],
  )

  const dismissPendingNote = useCallback(() => {
    setPendingNote(null)
  }, [])

  // Pular manualmente para próxima fase
  const skipToNextPhase = useCallback(async () => {
    const current = stateRef.current
    if (!current) return
    unlockAudioContext()

    if (current.phase === 'foco') {
      let elapsed = current.focusedSeconds
      if (current.isOvertime) {
        elapsed +=
          current.totalDurationSeconds +
          current.overtimeSeconds +
          (current.status === 'rodando' ? Math.floor((Date.now() - current.reference) / 1000) : 0)
      } else {
        elapsed +=
          current.status === 'rodando'
            ? Math.min(current.remaining, (Date.now() - current.reference) / 1000)
            : 0
      }
      const isComplete = current.isOvertime || elapsed >= current.totalDurationSeconds - 1

      if (elapsed > 0) {
        try {
          await recordSession(
            current.task,
            current.startedAt,
            new Date(),
            elapsed / 60,
            isComplete ? 'completa' : 'interrompida',
          )
        } catch (err) {
          console.error('Erro ao registrar sessão no skip:', err)
        }
      }

      const isLongBreak = current.currentBlock >= current.totalBlocks
      const nextPhase: PomodoroPhase = isLongBreak ? 'descanso_longo' : 'descanso_curto'
      const breakMinutes = isLongBreak
        ? current.preset.longBreakMinutes
        : current.preset.shortBreakMinutes
      const totalSec = breakMinutes * 60
      setNow(Date.now())
      const nextState: PomodoroState = {
        ...current,
        phase: nextPhase,
        status: 'rodando',
        totalDurationSeconds: totalSec,
        remaining: totalSec,
        startedAt: new Date(),
        focusedSeconds: 0,
        reference: Date.now(),
        isOvertime: false,
        overtimeSeconds: 0,
        overtimeStartedAt: undefined,
      }
      setState(nextState)
      broadcastState(nextState)
    } else {
      // Pular da pausa para próximo bloco de foco
      playFocusStartSound()
      const nextBlock = current.phase === 'descanso_longo' ? 1 : current.currentBlock + 1
      const totalSec = current.preset.workMinutes * 60
      setNow(Date.now())
      const nextState: PomodoroState = {
        ...current,
        phase: 'foco',
        status: 'rodando',
        currentBlock: nextBlock,
        totalDurationSeconds: totalSec,
        remaining: totalSec,
        startedAt: new Date(),
        focusedSeconds: 0,
        reference: Date.now(),
        isOvertime: false,
        overtimeSeconds: 0,
        overtimeStartedAt: undefined,
      }
      setState(nextState)
      broadcastState(nextState)
    }
  }, [broadcastState])

  // F. CONTAGEM NO TÍTULO DA ABA + FAVICON DINÂMICO
  useEffect(() => {
    if (!state) {
      document.title = 'Barbosa System'
      resetDynamicFavicon()
      return
    }

    const phaseName = state.phase === 'foco' ? 'Foco' : 'Pausa'
    let timeDisplay = ''

    if (state.isOvertime) {
      const otM = Math.floor(overtimeSeconds / 60)
      const otS = overtimeSeconds % 60
      timeDisplay = `+${String(otM).padStart(2, '0')}:${String(otS).padStart(2, '0')}`
    } else {
      const min = Math.floor(seconds / 60)
      const sec = seconds % 60
      timeDisplay = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    }

    const statusMark = state.status === 'pausado' ? ' (pausado)' : ''
    document.title = `${timeDisplay} · ${phaseName}${statusMark} — Barbosa System`

    // Favicon dinâmico
    const progress =
      state.totalDurationSeconds > 0
        ? Math.max(0, Math.min(1, 1 - seconds / state.totalDurationSeconds))
        : 1
    updateDynamicFavicon(progress, state.isOvertime, state.phase === 'foco' ? 'foco' : 'descanso')

    return () => {
      document.title = 'Barbosa System'
      resetDynamicFavicon()
    }
  }, [state, seconds, isOvertime, overtimeSeconds])

  const value = useMemo(
    () => ({
      state,
      selectedTask,
      seconds,
      overtimeSeconds,
      isOvertime,
      activePreset,
      setActivePreset,
      start,
      toggle,
      finish,
      discard,
      selectTask,
      skipToNextPhase,
      startBreakFromOvertime,
      startNextBlockFromBreak,
      pendingNote,
      submitPendingNote,
      dismissPendingNote,
      isReadOnlyTab,
      activeTabOwner,
    }),
    [
      state,
      selectedTask,
      seconds,
      overtimeSeconds,
      isOvertime,
      activePreset,
      setActivePreset,
      start,
      toggle,
      finish,
      discard,
      selectTask,
      skipToNextPhase,
      startBreakFromOvertime,
      startNextBlockFromBreak,
      pendingNote,
      submitPendingNote,
      dismissPendingNote,
      isReadOnlyTab,
      activeTabOwner,
    ],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const usePomodoro = () => {
  const value = useContext(Context)
  if (!value) throw new Error('PomodoroProvider ausente')
  return value
}
