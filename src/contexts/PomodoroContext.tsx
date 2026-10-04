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
import { recordSession, updateSessionNote, getFocusPresets } from '@/services/data'
import { toast } from '@/hooks/use-toast'
import { playFocusCompleteSound, playBreakCompleteSound } from '@/lib/sounds'

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
}

interface PomodoroContextValue {
  state: PomodoroState | null
  seconds: number
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
  pendingNote: PendingSessionNote | null
  submitPendingNote: (note: string) => Promise<void>
  dismissPendingNote: () => void
}

const Context = createContext<PomodoroContextValue | null>(null)

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [activePreset, setActivePresetState] = useState<ActivePreset>(DEFAULT_PRESET)
  const [state, setState] = useState<PomodoroState | null>(null)
  const [now, setNow] = useState(Date.now())
  const [pendingNote, setPendingNote] = useState<PendingSessionNote | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state

  const activePresetRef = useRef(activePreset)
  activePresetRef.current = activePreset

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
          workMinutes: first.work_minutes,
          shortBreakMinutes: first.short_break_minutes,
          longBreakMinutes: first.long_break_minutes,
          blocksBeforeLongBreak: first.blocks_before_long_break,
        })
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const setActivePreset = useCallback((preset: ActivePreset | FocusPresetRecord) => {
    const normalized: ActivePreset =
      'work_minutes' in preset
        ? {
            id: preset.id,
            name: preset.name,
            workMinutes: preset.work_minutes,
            shortBreakMinutes: preset.short_break_minutes,
            longBreakMinutes: preset.long_break_minutes,
            blocksBeforeLongBreak: preset.blocks_before_long_break,
          }
        : preset
    setActivePresetState(normalized)
    // Se o timer estiver parado/idle, o preset ativo reflete imediatamente
  }, [])

  const selectTask = useCallback((task: TaskRecord | null) => {
    setState((curr) => {
      if (!curr) return null
      return { ...curr, task }
    })
  }, [])

  // Timer tick
  useEffect(() => {
    if (!state || state.status !== 'rodando') return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [state?.status])

  // Cálculo de segundos restantes
  const seconds = state
    ? Math.max(
        0,
        state.remaining -
          (state.status === 'rodando' ? Math.floor((now - state.reference) / 1000) : 0),
      )
    : activePreset.workMinutes * 60

  // Finalização manual ou transição
  const finish = useCallback(async (note?: string): Promise<SessionRecord | null> => {
    const current = stateRef.current
    if (!current) return null

    let savedSession: SessionRecord | null = null

    const elapsedInPhase =
      current.focusedSeconds +
      (current.status === 'rodando'
        ? Math.min(current.remaining, (Date.now() - current.reference) / 1000)
        : 0)

    // SÓ blocos de foco registram sessão na coleção `sessions`
    if (current.phase === 'foco' && elapsedInPhase > 0) {
      const minutes = elapsedInPhase / 60
      const isComplete = elapsedInPhase >= current.totalDurationSeconds - 1
      savedSession = await recordSession(
        current.task,
        current.startedAt,
        new Date(),
        minutes,
        isComplete ? 'completa' : 'interrompida',
        note,
      )
      const taskLabel = current.task?.title ? ` em '${current.task.title}'` : ''
      toast({
        title: `Sessão registrada — ${Math.max(1, Math.round(minutes))} min${taskLabel}`,
      })
    }

    setState(null)
    return savedSession
  }, [])

  // Transição automática quando o timer zera
  const handlePhaseComplete = useCallback(async () => {
    const current = stateRef.current
    if (!current) return

    if (current.phase === 'foco') {
      // 1. Toca som de término de foco
      playFocusCompleteSound()

      // 2. Grava a sessão completa de foco (apenas bloco de foco grava)
      const minutes = current.totalDurationSeconds / 60
      let createdSession: SessionRecord | null = null
      try {
        createdSession = await recordSession(
          current.task,
          current.startedAt,
          new Date(),
          minutes,
          'completa',
        )
      } catch {
        // Ignora erro de gravação para não travar a transição de descanso
      }

      const taskLabel = current.task?.title ? ` em '${current.task.title}'` : ''
      toast({
        title: `Bloco ${current.currentBlock}/${current.totalBlocks} concluído!${taskLabel}`,
        description: 'Hora do descanso. O que foi feito nesse bloco?',
      })

      // 3. Se a sessão foi gravada com sucesso, ativa o prompt discreto de nota
      // A pausa NÃO trava: ela inicia imediatamente e o prompt de nota fica disponível durante a pausa
      if (createdSession) {
        setPendingNote({
          sessionId: createdSession.id,
          taskTitle: current.task?.title,
          durationMinutes: Math.round(minutes),
          blockNumber: current.currentBlock,
          totalBlocks: current.totalBlocks,
        })
      }

      // 4. Determina se a próxima fase é descanso curto ou descanso longo e inicia imediatamente
      const isLongBreak = current.currentBlock >= current.totalBlocks
      const nextPhase: PomodoroPhase = isLongBreak ? 'descanso_longo' : 'descanso_curto'
      const breakMinutes = isLongBreak
        ? current.preset.longBreakMinutes
        : current.preset.shortBreakMinutes

      const totalSec = breakMinutes * 60
      setNow(Date.now())
      setState({
        ...current,
        phase: nextPhase,
        status: 'rodando',
        totalDurationSeconds: totalSec,
        remaining: totalSec,
        startedAt: new Date(),
        focusedSeconds: 0,
        reference: Date.now(),
      })
    } else {
      // Fim do descanso (curto ou longo)
      // 1. Toca som de volta ao trabalho
      playBreakCompleteSound()

      toast({
        title: 'Descanso finalizado!',
        description: 'Pronto para retomar o foco?',
      })

      // 2. Prepara o próximo bloco de foco
      const nextBlock = current.phase === 'descanso_longo' ? 1 : current.currentBlock + 1

      const totalSec = current.preset.workMinutes * 60
      setNow(Date.now())
      setState({
        ...current,
        phase: 'foco',
        status: 'rodando',
        currentBlock: nextBlock,
        totalDurationSeconds: totalSec,
        remaining: totalSec,
        startedAt: new Date(),
        focusedSeconds: 0,
        reference: Date.now(),
      })
    }
  }, [])

  // Observa quando os segundos chegam a 0 durante o timer rodando
  const lastCompletedPhaseRef = useRef<string | null>(null)
  useEffect(() => {
    if (!state || state.status !== 'rodando') return
    if (seconds <= 0) {
      const phaseKey = `${state.phase}-${state.currentBlock}-${state.startedAt.getTime()}`
      if (lastCompletedPhaseRef.current !== phaseKey) {
        lastCompletedPhaseRef.current = phaseKey
        handlePhaseComplete()
      }
    }
  }, [seconds, state, handlePhaseComplete])

  // Iniciar timer com um preset opcional e tarefa opcional
  const start = useCallback(
    async (task?: TaskRecord | null, customPreset?: ActivePreset | FocusPresetRecord) => {
      if (stateRef.current) {
        await finish()
      }

      let chosenPreset = activePresetRef.current
      if (customPreset) {
        chosenPreset =
          'work_minutes' in customPreset
            ? {
                id: customPreset.id,
                name: customPreset.name,
                workMinutes: customPreset.work_minutes,
                shortBreakMinutes: customPreset.short_break_minutes,
                longBreakMinutes: customPreset.long_break_minutes,
                blocksBeforeLongBreak: customPreset.blocks_before_long_break,
              }
            : customPreset
        setActivePresetState(chosenPreset)
      }

      const totalSec = chosenPreset.workMinutes * 60
      setNow(Date.now())
      setState({
        task: task !== undefined ? task : null,
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
      })
    },
    [finish],
  )

  const toggle = useCallback(() => {
    setState((current) => {
      if (!current) {
        // Se estava inativo, inicia com o preset atual
        const totalSec = activePresetRef.current.workMinutes * 60
        return {
          task: null,
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
        }
      }
      if (current.status === 'rodando') {
        const elapsed = Math.min(current.remaining, (Date.now() - current.reference) / 1000)
        return {
          ...current,
          status: 'pausado',
          remaining: current.remaining - elapsed,
          focusedSeconds: current.focusedSeconds + elapsed,
        }
      }
      return { ...current, status: 'rodando', reference: Date.now() }
    })
  }, [])

  const discard = useCallback(() => {
    setState(null)
  }, [])

  // Envio e descarte da nota pós-foco
  const submitPendingNote = useCallback(
    async (noteText: string) => {
      if (!pendingNote) return
      const trimmed = noteText.trim()
      if (trimmed) {
        try {
          await updateSessionNote(pendingNote.sessionId, trimmed)
          toast({
            title: 'Nota de foco registrada',
            description: trimmed.length > 50 ? `${trimmed.slice(0, 50)}...` : trimmed,
          })
        } catch {
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

  const skipToNextPhase = useCallback(async () => {
    const current = stateRef.current
    if (!current) return
    // Pula para a próxima fase sem tocar som de transição
    if (current.phase === 'foco') {
      const elapsed =
        current.focusedSeconds +
        (current.status === 'rodando'
          ? Math.min(current.remaining, (Date.now() - current.reference) / 1000)
          : 0)
      if (elapsed > 0) {
        await recordSession(
          current.task,
          current.startedAt,
          new Date(),
          elapsed / 60,
          'interrompida',
        )
      }
      const isLongBreak = current.currentBlock >= current.totalBlocks
      const nextPhase: PomodoroPhase = isLongBreak ? 'descanso_longo' : 'descanso_curto'
      const breakMinutes = isLongBreak
        ? current.preset.longBreakMinutes
        : current.preset.shortBreakMinutes
      const totalSec = breakMinutes * 60
      setNow(Date.now())
      setState({
        ...current,
        phase: nextPhase,
        status: 'rodando',
        totalDurationSeconds: totalSec,
        remaining: totalSec,
        startedAt: new Date(),
        focusedSeconds: 0,
        reference: Date.now(),
      })
    } else {
      const nextBlock = current.phase === 'descanso_longo' ? 1 : current.currentBlock + 1
      const totalSec = current.preset.workMinutes * 60
      setNow(Date.now())
      setState({
        ...current,
        phase: 'foco',
        status: 'rodando',
        currentBlock: nextBlock,
        totalDurationSeconds: totalSec,
        remaining: totalSec,
        startedAt: new Date(),
        focusedSeconds: 0,
        reference: Date.now(),
      })
    }
  }, [])

  const value = useMemo(
    () => ({
      state,
      seconds,
      activePreset,
      setActivePreset,
      start,
      toggle,
      finish,
      discard,
      selectTask,
      skipToNextPhase,
      pendingNote,
      submitPendingNote,
      dismissPendingNote,
    }),
    [
      state,
      seconds,
      activePreset,
      setActivePreset,
      start,
      toggle,
      finish,
      discard,
      selectTask,
      skipToNextPhase,
      pendingNote,
      submitPendingNote,
      dismissPendingNote,
    ],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const usePomodoro = () => {
  const value = useContext(Context)
  if (!value) throw new Error('PomodoroProvider ausente')
  return value
}
