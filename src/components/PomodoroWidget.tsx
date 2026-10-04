import { Pause, Play, Square, X } from 'lucide-react'
import { usePomodoro } from '@/contexts/PomodoroContext'
export function PomodoroWidget() {
  const { state, seconds, toggle, finish, discard } = usePomodoro()
  if (!state) return null
  const value = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  return (
    <aside className="pomodoro">
      <div className="eyebrow">FOCO — TAREFA ATIVA</div>
      <strong>{state.task.title}</strong>
      <div className="pomodoro-row">
        <div
          className="timer"
          style={{ '--progress': `${(1 - seconds / 1500) * 360}deg` } as React.CSSProperties}
        >
          <span>{value}</span>
        </div>
        <button className="primary icon" onClick={toggle}>
          {state.status === 'rodando' ? <Pause /> : <Play />}
        </button>
        <button className="icon" onClick={() => finish()} title="Encerrar e registrar">
          <Square />
        </button>
        <button className="icon" onClick={discard} title="Descartar">
          <X />
        </button>
      </div>
    </aside>
  )
}
