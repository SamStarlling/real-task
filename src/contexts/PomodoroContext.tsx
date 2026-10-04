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
import type { TaskRecord } from '@/types'
import { recordSession } from '@/services/data'
import { toast } from '@/hooks/use-toast'

const TOTAL = 25 * 60
type State = {
  task: TaskRecord
  status: 'rodando' | 'pausado'
  remaining: number
  startedAt: Date
  focusedSeconds: number
  reference: number
} | null
type PomodoroValue = {
  state: State
  seconds: number
  start: (task: TaskRecord) => Promise<void>
  toggle: () => void
  finish: () => Promise<void>
  discard: () => void
}
const Context = createContext<PomodoroValue | null>(null)
export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(null)
  const [now, setNow] = useState(Date.now())
  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => {
    if (!state || state.status !== 'rodando') return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [state?.status])
  const seconds = state
    ? Math.max(
        0,
        state.remaining -
          (state.status === 'rodando' ? Math.floor((now - state.reference) / 1000) : 0),
      )
    : TOTAL
  const finish = useCallback(async () => {
    const current = stateRef.current
    if (!current) return
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
        elapsed >= TOTAL ? 'completa' : 'interrompida',
      )
      toast({
        title: `Sessão registrada — ${Math.round(elapsed / 60)} min em '${current.task.title}'`,
      })
    }
    setState(null)
  }, [])
  const start = useCallback(
    async (task: TaskRecord) => {
      if (stateRef.current) await finish()
      setNow(Date.now())
      setState({
        task,
        status: 'rodando',
        remaining: TOTAL,
        startedAt: new Date(),
        focusedSeconds: 0,
        reference: Date.now(),
      })
    },
    [finish],
  )
  const toggle = () =>
    setState((current) => {
      if (!current) return null
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
  const value = useMemo(
    () => ({ state, seconds, start, toggle, finish, discard: () => setState(null) }),
    [state, seconds, start, finish],
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export const usePomodoro = () => {
  const value = useContext(Context)
  if (!value) throw new Error('PomodoroProvider ausente')
  return value
}
