import { Pause, Play, Square, X } from 'lucide-react'
import { usePomodoro } from '@/contexts/PomodoroContext'
export function PomodoroWidget() {
  const { state, seconds, toggle, finish, discard } = usePomodoro()
  if (!state) return null

  const minutes = Math.floor(seconds / 60)
  const remainingSec = seconds % 60
  const value = `${String(minutes).padStart(2, '0')}:${String(remainingSec).padStart(2, '0')}`
  const progressRatio =
    state.totalDurationSeconds > 0
      ? Math.max(0, Math.min(1, 1 - seconds / state.totalDurationSeconds))
      : 0

  const phaseLabel =
    state.phase === 'foco'
      ? `FOCO · BLOCO ${state.currentBlock}/${state.totalBlocks}`
      : state.phase === 'descanso_longo'
        ? 'DESCANSO LONGO'
        : 'DESCANSO CURTO'

  return (
    <aside className="pomodoro">
      <div className="eyebrow" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{phaseLabel}</span>
        <span style={{ opacity: 0.7 }}>{state.preset.name}</span>
      </div>
      <strong>{state.task?.title || 'Sem tarefa vinculada'}</strong>
      <div className="pomodoro-row">
        <div
          className="timer"
          style={{ '--progress': `${progressRatio * 360}deg` } as React.CSSProperties}
        >
          <span>{value}</span>
        </div>
        <button
          className="primary icon"
          onClick={toggle}
          title={state.status === 'rodando' ? 'Pausar' : 'Retomar'}
        >
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
