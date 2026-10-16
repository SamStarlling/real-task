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
  updateSessionDetails,
  getFocusPresets,
  resolveNotificationPreferences,
} from '@/services/data'
import pb from '@/lib/pocketbase/client'
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
export type PomodoroTimerMode = 'pomo' | 'stopwatch'

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
  objective?: string
  outcomeStatus?: SessionRecord['outcome_status']
  isEarlyInterrupted?: boolean
  mode?: PomodoroTimerMode
}

export interface PomodoroState {
  mode?: PomodoroTimerMode // 'pomo' | 'stopwatch'
  task: TaskRecord | null
  objective?: string
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
  mode?: PomodoroTimerMode
  state: {
    mode?: PomodoroTimerMode
    task: TaskRecord | null
    objective?: string
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
  timerMode: PomodoroTimerMode
  setTimerMode: (mode: PomodoroTimerMode) => void
  state: PomodoroState | null
  selectedTask: TaskRecord | null
  currentObjective: string
  setCurrentObjective: (objective: string) => void
  seconds: number
  overtimeSeconds: number
  isOvertime: boolean
  stopwatchSeconds: number
  activePreset: ActivePreset
  setActivePreset: (preset: ActivePreset | FocusPresetRecord) => void
  workMinutes: number
  setWorkMinutes: (minutes: number) => void
  shortBreakMinutes: number
  setShortBreakMinutes: (minutes: number) => void
  longBreakMinutes: number
  setLongBreakMinutes: (minutes: number) => void
  applyPresetToDraft: (preset: ActivePreset | FocusPresetRecord) => void
  start: (
    task?: TaskRecord | null,
    customPreset?: ActivePreset | FocusPresetRecord | { workMinutes: number },
    initialObjective?: string,
    forcedMode?: PomodoroTimerMode,
  ) => Promise<void>
  toggle: () => void
  finish: (note?: string) => Promise<SessionRecord | null>
  discard: () => void
  selectTask: (task: TaskRecord | null) => void
  setObjectiveForRunningBlock: (objective: string) => void
  skipToNextPhase: () => Promise<void>
  startBreakFromOvertime: () => Promise<void>
  startNextBlockFromBreak: () => Promise<void>
  pendingNote: PendingSessionNote | null
  submitPendingNote: (
    params:
      | {
          doneText?: string
          nextText?: string
          note?: string
          outcomeStatus?: SessionRecord['outcome_status']
          objective?: string
        }
      | string,
  ) => Promise<void>
  dismissPendingNote: () => void
  isReadOnlyTab: boolean
  activeTabOwner: boolean
}

const Context = createContext<PomodoroContextValue | null>(null)

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activePreset, setActivePresetState] = useState<ActivePreset>(DEFAULT_PRESET)

  // Duração dinâmica (draft) desacoplada do preset:
  // Inicializada a partir do localStorage ou do default (25m foco, 5m pausa, 15m longo)
  const [workMinutes, setWorkMinutesState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('barbosa_pomodoro_work_minutes')
      if (saved) {
        const parsed = Number(saved)
        if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 180) return parsed
      }
    }
    return DEFAULT_PRESET.workMinutes
  })

  const [shortBreakMinutes, setShortBreakMinutesState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('barbosa_pomodoro_break_minutes')
      if (saved) {
        const parsed = Number(saved)
        if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 60) return parsed
      }
    }
    return DEFAULT_PRESET.shortBreakMinutes
  })

  const [longBreakMinutes, setLongBreakMinutesState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('barbosa_pomodoro_long_break_minutes')
      if (saved) {
        const parsed = Number(saved)
        if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 60) return parsed
      }
    }
    return DEFAULT_PRESET.longBreakMinutes
  })

  const [timerMode, setTimerModeState] = useState<PomodoroTimerMode>('pomo')
  const [state, setState] = useState<PomodoroState | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null)
  const [currentObjective, setCurrentObjective] = useState<string>('')
  const [now, setNow] = useState(Date.now())
  const [pendingNote, setPendingNote] = useState<PendingSessionNote | null>(null)
  const pendingNoteRef = useRef(pendingNote)
  pendingNoteRef.current = pendingNote

  // Controle de propriedade de abas (BroadcastChannel)
  const [controllingTabId, setControllingTabId] = useState<string | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state

  const timerModeRef = useRef(timerMode)
  timerModeRef.current = timerMode

  const selectedTaskRef = useRef(selectedTask)
  selectedTaskRef.current = selectedTask

  const currentObjectiveRef = useRef(currentObjective)
  currentObjectiveRef.current = currentObjective

  const activePresetRef = useRef(activePreset)
  activePresetRef.current = activePreset

  const workMinutesRef = useRef(workMinutes)
  workMinutesRef.current = workMinutes

  const shortBreakMinutesRef = useRef(shortBreakMinutes)
  shortBreakMinutesRef.current = shortBreakMinutes

  const longBreakMinutesRef = useRef(longBreakMinutes)
  longBreakMinutesRef.current = longBreakMinutes

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
        const loadedPreset: ActivePreset = {
          id: first.id,
          name: first.name,
          workMinutes: Math.max(1, first.work_minutes),
          shortBreakMinutes: Math.max(1, first.short_break_minutes),
          longBreakMinutes: Math.max(1, first.long_break_minutes),
          blocksBeforeLongBreak: Math.max(1, first.blocks_before_long_break),
        }
        setActivePresetState(loadedPreset)
        // Se o usuário ainda não tinha ajustado localStorage, adota o valor inicial do preset padrão
        if (
          typeof window !== 'undefined' &&
          !localStorage.getItem('barbosa_pomodoro_work_minutes')
        ) {
          setWorkMinutesState(loadedPreset.workMinutes)
          setShortBreakMinutesState(loadedPreset.shortBreakMinutes)
          setLongBreakMinutesState(loadedPreset.longBreakMinutes)
        }
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
            mode: s.mode || timerModeRef.current,
            state: {
              mode: s.mode || 'pomo',
              task: s.task,
              objective: s.objective,
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
          if (msg.state.mode) {
            setTimerModeState(msg.state.mode)
          }
          setState({
            mode: msg.state.mode || 'pomo',
            task: msg.state.task,
            objective: msg.state.objective,
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
          mode: s.mode || timerModeRef.current,
          state: {
            mode: s.mode || 'pomo',
            task: s.task,
            objective: s.objective,
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

  const setTimerMode = useCallback(
    (mode: PomodoroTimerMode) => {
      setTimerModeState(mode)
      if (stateRef.current) {
        setState((curr) => {
          if (!curr) return null
          const updated = { ...curr, mode }
          broadcastState(updated)
          return updated
        })
      }
    },
    [broadcastState],
  )

  const setActivePreset = useCallback((preset: ActivePreset | FocusPresetRecord) => {
    const normalized: ActivePreset =
      'work_minutes' in preset
        ? {
            id: preset.id,
            name: preset.name,
            workMinutes: Math.max(1, preset.work_minutes),
            shortBreakMinutes: Math.max(1, preset.short_break_minutes),
            longBreakMinutes: Math.max(1, preset.long_break_minutes),
            blocksBeforeLongBreak: Math.max(1, preset.blocks_before_long_break),
          }
        : {
            ...preset,
            workMinutes: Math.max(1, preset.workMinutes),
            shortBreakMinutes: Math.max(1, preset.shortBreakMinutes),
            longBreakMinutes: Math.max(1, preset.longBreakMinutes),
            blocksBeforeLongBreak: Math.max(1, preset.blocksBeforeLongBreak),
          }
    setActivePresetState(normalized)
  }, [])

  // Ajustes diretos de duração dinâmica (1 a 1 minuto e digitação direta), desacoplados do preset
  const setWorkMinutes = useCallback((minutes: number) => {
    if (isNaN(minutes)) return
    const clamped = Math.max(1, Math.min(180, Math.round(minutes)))
    setWorkMinutesState(clamped)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('barbosa_pomodoro_work_minutes', String(clamped))
      }
    } catch {
      // Silencioso
    }
  }, [])

  const setShortBreakMinutes = useCallback((minutes: number) => {
    if (isNaN(minutes)) return
    const clamped = Math.max(1, Math.min(60, Math.round(minutes)))
    setShortBreakMinutesState(clamped)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('barbosa_pomodoro_break_minutes', String(clamped))
      }
    } catch {
      // Silencioso
    }
  }, [])

  const setLongBreakMinutes = useCallback((minutes: number) => {
    if (isNaN(minutes)) return
    const clamped = Math.max(1, Math.min(60, Math.round(minutes)))
    setLongBreakMinutesState(clamped)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('barbosa_pomodoro_long_break_minutes', String(clamped))
      }
    } catch {
      // Silencioso
    }
  }, [])

  // Presets viram atalhos: aplicar preset copia suas durações para o draft atual
  // e define activePreset como referência de metadados sem acoplamento permanente
  const applyPresetToDraft = useCallback(
    (preset: ActivePreset | FocusPresetRecord) => {
      setActivePreset(preset)
      const w = 'work_minutes' in preset ? preset.work_minutes : preset.workMinutes
      const sb =
        'short_break_minutes' in preset ? preset.short_break_minutes : preset.shortBreakMinutes
      const lb =
        'long_break_minutes' in preset ? preset.long_break_minutes : preset.longBreakMinutes
      setWorkMinutes(w)
      setShortBreakMinutes(sb)
      setLongBreakMinutes(lb)
    },
    [setActivePreset, setWorkMinutes, setShortBreakMinutes, setLongBreakMinutes],
  )

  const selectTask = useCallback(
    (task: TaskRecord | null) => {
      setSelectedTask(task)
      // Pré-preenche o objetivo como valor editável com o título da tarefa (ou limpa se removeu)
      if (!stateRef.current) {
        setCurrentObjective(task?.title || '')
      }
      setState((curr) => {
        if (!curr) return null
        // Se o bloco já está rodando e a tarefa foi trocada, atualiza o objetivo se estava vazio ou associado à tarefa anterior
        const updatedObjective =
          curr.objective && curr.objective !== curr.task?.title ? curr.objective : task?.title || ''
        const updated = { ...curr, task, objective: updatedObjective }
        if (updatedObjective) {
          setCurrentObjective(updatedObjective)
        }
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

  const setObjectiveForRunningBlock = useCallback(
    (newObjective: string) => {
      setCurrentObjective(newObjective)
      setState((curr) => {
        if (!curr) return null
        const updated = { ...curr, objective: newObjective.trim() }
        broadcastState(updated)
        return updated
      })
    },
    [broadcastState],
  )

  // Timer tick
  useEffect(() => {
    if (!state || state.status !== 'rodando') return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [state?.status])

  // Cálculo de segundos restantes e segundos de excesso (Pomo) ou decorridos (Stopwatch)
  const { seconds, isOvertime, overtimeSeconds, stopwatchSeconds } = useMemo(() => {
    if (!state) {
      // Desacoplado do preset: o timer parado espelha a duração atual do draft (workMinutes)
      return {
        seconds: workMinutes * 60,
        isOvertime: false,
        overtimeSeconds: 0,
        stopwatchSeconds: 0,
      }
    }

    // Modo Stopwatch: contagem crescente
    if (state.mode === 'stopwatch') {
      const elapsedSinceRef =
        state.status === 'rodando' ? Math.floor((now - state.reference) / 1000) : 0
      const totalElapsed = state.focusedSeconds + elapsedSinceRef
      return {
        seconds: 0,
        isOvertime: false,
        overtimeSeconds: 0,
        stopwatchSeconds: Math.max(0, totalElapsed),
      }
    }

    // Modo Pomodoro padrão (contagem regressiva + overtime)
    if (!state.isOvertime) {
      const elapsedSinceRef =
        state.status === 'rodando' ? Math.floor((now - state.reference) / 1000) : 0
      const remainingSec = Math.max(0, state.remaining - elapsedSinceRef)
      return {
        seconds: remainingSec,
        isOvertime: false,
        overtimeSeconds: 0,
        stopwatchSeconds: 0,
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
      stopwatchSeconds: 0,
    }
  }, [state, now, workMinutes])

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
  // Nota: stopwatch não zera (não tem contagem regressiva), então ignora no modo stopwatch.
  const phaseCompletedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!state || state.mode === 'stopwatch' || state.status !== 'rodando' || state.isOvertime)
      return

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
      if (current.mode === 'stopwatch') {
        totalElapsedSec +=
          current.status === 'rodando' ? Math.floor((Date.now() - current.reference) / 1000) : 0
      } else if (current.isOvertime) {
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

      // SÓ blocos de foco registram sessão na coleção `sessions` (stopwatch é sempre fase 'foco')
      if (current.phase === 'foco' && totalElapsedSec > 0) {
        const minutes = totalElapsedSec / 60
        // Em stopwatch, considera completa se correu por ao menos 1 minuto
        const isComplete =
          current.mode === 'stopwatch'
            ? totalElapsedSec >= 60
            : current.isOvertime || totalElapsedSec >= current.totalDurationSeconds - 1
        const activeObjective = current.objective || currentObjectiveRef.current || ''

        try {
          savedSession = await recordSession(
            current.task,
            current.startedAt,
            new Date(),
            Math.max(1 / 60, minutes),
            isComplete ? 'completa' : 'interrompida',
            note,
            activeObjective,
          )
        } catch (err) {
          console.error('Erro ao registrar sessão no finish:', err)
        }

        const taskLabel = current.task?.title ? ` em '${current.task.title}'` : ''
        const roundedMins = Math.max(1, Math.round(minutes))

        // Toast de confirmação mostrando a duração e indicando que a nota pode ser adicionada
        const modeLabel = current.mode === 'stopwatch' ? 'Stopwatch' : 'Sessão'
        toast({
          title: isComplete
            ? `${modeLabel} concluído — ${roundedMins} min${taskLabel}`
            : `${modeLabel} encerrado — ${roundedMins} min${taskLabel}`,
          description: 'Você pode registrar o veredito e anotações agora.',
        })

        // DISPARO DE NOTA PÓS-FOCO EM finish():
        // Idêntico para Pomodoro e Stopwatch
        if (savedSession) {
          setPendingNote({
            sessionId: savedSession.id,
            taskTitle: current.task?.title,
            durationMinutes: roundedMins,
            blockNumber: current.currentBlock,
            totalBlocks: current.totalBlocks,
            objective: activeObjective,
            isEarlyInterrupted: !isComplete && totalElapsedSec < 60,
            mode: current.mode || 'pomo',
          })
        }
      }

      setState(null)
      setSelectedTask(null)
      setCurrentObjective('')
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
    const activeObjective = current.objective || currentObjectiveRef.current || ''
    try {
      createdSession = await recordSession(
        current.task,
        current.startedAt,
        new Date(),
        minutes,
        'completa',
        undefined,
        activeObjective,
      )
    } catch (err) {
      console.error('Erro ao gravar sessão no início da pausa:', err)
    }

    const taskLabel = current.task?.title ? ` em '${current.task.title}'` : ''
    toast({
      title: `Bloco ${current.currentBlock}/${current.totalBlocks} concluído!${taskLabel}`,
      description: 'Hora do descanso. Registre o veredito e anotações do bloco.',
    })

    // 3. Prompt discreto não-bloqueante de nota durante a pausa
    if (createdSession) {
      setPendingNote({
        sessionId: createdSession.id,
        taskTitle: current.task?.title,
        durationMinutes: Math.round(minutes),
        blockNumber: current.currentBlock,
        totalBlocks: current.totalBlocks,
        objective: activeObjective,
        isEarlyInterrupted: false,
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

  // Iniciar timer com um preset opcional, tarefa opcional, objetivo opcional e modo opcional
  const start = useCallback(
    async (
      task?: TaskRecord | null,
      customPreset?: ActivePreset | FocusPresetRecord | { workMinutes: number },
      initialObjective?: string,
      forcedMode?: PomodoroTimerMode,
    ) => {
      unlockAudioContext()
      playFocusStartSound() // Som de início

      if (stateRef.current) {
        await finish()
      }

      setControllingTabId(TAB_ID)

      const effectiveMode: PomodoroTimerMode = forcedMode || timerModeRef.current || 'pomo'
      setTimerModeState(effectiveMode)

      const effectiveTask = task !== undefined ? task : (selectedTaskRef.current ?? null)
      setSelectedTask(effectiveTask)

      const effectiveObjective =
        initialObjective !== undefined && initialObjective !== ''
          ? initialObjective.trim()
          : (currentObjectiveRef.current || effectiveTask?.title || '').trim()

      setCurrentObjective(effectiveObjective)

      // Determina a duração efetiva:
      // Se um preset específico foi passado (ex.: clique no Play da linha de presets), adota suas durações
      // Caso contrário, usa rigorosamente o draft atual (workMinutesRef.current)
      let chosenPreset = activePresetRef.current
      let effectiveWorkMinutes = workMinutesRef.current

      if (customPreset) {
        if ('work_minutes' in customPreset) {
          chosenPreset = {
            id: customPreset.id,
            name: customPreset.name,
            workMinutes: Math.max(1, customPreset.work_minutes),
            shortBreakMinutes: Math.max(1, customPreset.short_break_minutes),
            longBreakMinutes: Math.max(1, customPreset.long_break_minutes),
            blocksBeforeLongBreak: Math.max(1, customPreset.blocks_before_long_break),
          }
          effectiveWorkMinutes = chosenPreset.workMinutes
          setActivePresetState(chosenPreset)
        } else if ('name' in customPreset && 'workMinutes' in customPreset) {
          chosenPreset = {
            ...customPreset,
            workMinutes: Math.max(1, customPreset.workMinutes),
            shortBreakMinutes: Math.max(1, customPreset.shortBreakMinutes),
            longBreakMinutes: Math.max(1, customPreset.longBreakMinutes),
            blocksBeforeLongBreak: Math.max(1, customPreset.blocksBeforeLongBreak),
          }
          effectiveWorkMinutes = chosenPreset.workMinutes
          setActivePresetState(chosenPreset)
        } else if ('workMinutes' in customPreset) {
          effectiveWorkMinutes = Math.max(1, customPreset.workMinutes)
        }
      }

      // Constrói o preset representativo da sessão com a duração do draft
      const sessionPreset: ActivePreset = {
        id: chosenPreset.id,
        name: chosenPreset.name,
        workMinutes: effectiveWorkMinutes,
        shortBreakMinutes: shortBreakMinutesRef.current,
        longBreakMinutes: longBreakMinutesRef.current,
        blocksBeforeLongBreak: chosenPreset.blocksBeforeLongBreak || 4,
      }

      const totalSec = effectiveMode === 'stopwatch' ? 0 : effectiveWorkMinutes * 60
      setNow(Date.now())
      const newState: PomodoroState = {
        mode: effectiveMode,
        task: effectiveTask,
        objective: effectiveObjective,
        status: 'rodando',
        phase: 'foco',
        currentBlock: 1,
        totalBlocks: sessionPreset.blocksBeforeLongBreak,
        preset: sessionPreset,
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
        const initialObj = (currentObjectiveRef.current || initialTask?.title || '').trim()
        const currentMode = timerModeRef.current || 'pomo'
        const draftWork = workMinutesRef.current
        const sessionPreset: ActivePreset = {
          id: activePresetRef.current.id,
          name: activePresetRef.current.name,
          workMinutes: draftWork,
          shortBreakMinutes: shortBreakMinutesRef.current,
          longBreakMinutes: longBreakMinutesRef.current,
          blocksBeforeLongBreak: activePresetRef.current.blocksBeforeLongBreak || 4,
        }
        const totalSec = currentMode === 'stopwatch' ? 0 : draftWork * 60
        const fresh: PomodoroState = {
          mode: currentMode,
          task: initialTask,
          objective: initialObj,
          status: 'rodando',
          phase: 'foco',
          currentBlock: 1,
          totalBlocks: sessionPreset.blocksBeforeLongBreak,
          preset: sessionPreset,
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
        if (current.mode === 'stopwatch') {
          const elapsed = Math.floor((Date.now() - current.reference) / 1000)
          const paused: PomodoroState = {
            ...current,
            status: 'pausado',
            focusedSeconds: current.focusedSeconds + elapsed,
          }
          broadcastState(paused)
          return paused
        }
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
    setCurrentObjective('')
    setControllingTabId(null)
    broadcastState(null)
    resetDynamicFavicon()
  }, [broadcastState])

  // Envio e descarte da nota pós-foco (suporta formato simples de string ou objeto completo com 2 perguntas + veredito)
  const submitPendingNote = useCallback(
    async (
      payload:
        | {
            doneText?: string
            nextText?: string
            note?: string
            outcomeStatus?: SessionRecord['outcome_status']
            objective?: string
          }
        | string,
    ) => {
      const currentPending = pendingNoteRef.current || pendingNote
      if (!currentPending) return

      let finalNote = ''
      let finalOutcome: SessionRecord['outcome_status'] | undefined
      let finalObjective: string | undefined

      if (typeof payload === 'string') {
        finalNote = payload.trim()
      } else {
        const parts: string[] = []
        if (payload.doneText && payload.doneText.trim()) {
          parts.push(`Feito: ${payload.doneText.trim()}`)
        }
        if (payload.nextText && payload.nextText.trim()) {
          parts.push(`Próximo bloco: ${payload.nextText.trim()}`)
        }
        if (parts.length > 0) {
          finalNote = parts.join(' \n')
        } else if (payload.note && payload.note.trim()) {
          finalNote = payload.note.trim()
        }
        finalOutcome = payload.outcomeStatus
        finalObjective = payload.objective
      }

      try {
        const updateData: Record<string, unknown> = {}
        if (finalNote) {
          updateData.note = finalNote.slice(0, 500)
        }
        if (finalOutcome) {
          updateData.outcome_status = finalOutcome
        }
        if (finalObjective !== undefined && finalObjective.trim()) {
          updateData.objective = finalObjective.trim().slice(0, 300)
        }

        if (Object.keys(updateData).length > 0) {
          await pb
            .collection<SessionRecord>('sessions')
            .update(currentPending.sessionId, updateData)
          toast({
            title: 'Registro de foco atualizado',
            description: finalNote
              ? finalNote.length > 50
                ? `${finalNote.slice(0, 50)}...`
                : finalNote
              : 'Veredito gravado com sucesso.',
          })
        }
      } catch (err) {
        console.error('Erro ao atualizar nota/veredito da sessão:', err)
        toast({
          title: 'Erro ao salvar nota da sessão',
          variant: 'destructive',
        })
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

      let savedSession: SessionRecord | null = null
      const activeObjective = current.objective || currentObjectiveRef.current || ''

      if (elapsed > 0) {
        try {
          savedSession = await recordSession(
            current.task,
            current.startedAt,
            new Date(),
            elapsed / 60,
            isComplete ? 'completa' : 'interrompida',
            undefined,
            activeObjective,
          )
        } catch (err) {
          console.error('Erro ao registrar sessão no skip:', err)
        }

        // DISPARO DE NOTA PÓS-FOCO EM skipToNextPhase():
        if (savedSession) {
          const roundedMins = Math.max(1, Math.round(elapsed / 60))
          setPendingNote({
            sessionId: savedSession.id,
            taskTitle: current.task?.title,
            durationMinutes: roundedMins,
            blockNumber: current.currentBlock,
            totalBlocks: current.totalBlocks,
            objective: activeObjective,
            isEarlyInterrupted: !isComplete && elapsed < 60,
          })
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

    const phaseName =
      state.mode === 'stopwatch' ? 'Stopwatch' : state.phase === 'foco' ? 'Foco' : 'Pausa'
    let timeDisplay = ''

    if (state.mode === 'stopwatch') {
      const totalSec = stopwatchSeconds
      const h = Math.floor(totalSec / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = totalSec % 60
      timeDisplay =
        h > 0
          ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
          : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    } else if (state.isOvertime) {
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
      state.mode === 'stopwatch'
        ? 1
        : state.totalDurationSeconds > 0
          ? Math.max(0, Math.min(1, 1 - seconds / state.totalDurationSeconds))
          : 1
    updateDynamicFavicon(progress, state.isOvertime, state.phase === 'foco' ? 'foco' : 'descanso')

    return () => {
      document.title = 'Barbosa System'
      resetDynamicFavicon()
    }
  }, [state, seconds, isOvertime, overtimeSeconds, stopwatchSeconds])

  const value = useMemo(
    () => ({
      timerMode,
      setTimerMode,
      state,
      selectedTask,
      currentObjective,
      setCurrentObjective,
      seconds,
      overtimeSeconds,
      isOvertime,
      stopwatchSeconds,
      activePreset,
      setActivePreset,
      workMinutes,
      setWorkMinutes,
      shortBreakMinutes,
      setShortBreakMinutes,
      longBreakMinutes,
      setLongBreakMinutes,
      applyPresetToDraft,
      start,
      toggle,
      finish,
      discard,
      selectTask,
      setObjectiveForRunningBlock,
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
      timerMode,
      setTimerMode,
      state,
      selectedTask,
      currentObjective,
      seconds,
      overtimeSeconds,
      isOvertime,
      stopwatchSeconds,
      activePreset,
      setActivePreset,
      workMinutes,
      setWorkMinutes,
      shortBreakMinutes,
      setShortBreakMinutes,
      longBreakMinutes,
      setLongBreakMinutes,
      applyPresetToDraft,
      start,
      toggle,
      finish,
      discard,
      selectTask,
      setObjectiveForRunningBlock,
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
