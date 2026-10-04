import { useEffect, useState } from 'react'
import { X, Play } from 'lucide-react'
import type { SessionRecord, TaskRecord } from '@/types'
import { formatMinutes } from '@/lib/format'
import { localDay, toPocketDate } from '@/lib/date-parser'
import { sessionsForTask, updateTask } from '@/services/data'
import { usePomodoro } from '@/contexts/PomodoroContext'
export function TaskDetail({
  task,
  onClose,
  onChange,
}: {
  task: TaskRecord
  onClose: () => void
  onChange: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [estimate, setEstimate] = useState(task.estimated_minutes)
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const { start } = usePomodoro()
  useEffect(() => {
    sessionsForTask(task.id).then(setSessions)
  }, [task.id])
  const save = async (data: Record<string, unknown>) => {
    await updateTask(task.id, data)
    onChange()
  }
  const date = (delta: number) => {
    const d = new Date()
    d.setDate(d.getDate() + delta)
    return toPocketDate(d)
  }
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>
          <X />
        </button>
        <div className="eyebrow">DETALHE DA TAREFA</div>
        <input
          className="detail-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && save({ title: title.trim() })}
        />
        <label className="detail-label">DATA</label>
        <div className="option-row">
          <button onClick={() => save({ due_date: date(0) })}>Hoje</button>
          <button onClick={() => save({ due_date: date(1) })}>Amanhã</button>
          <label>
            Escolher
            <input
              type="date"
              onChange={(e) =>
                e.target.value &&
                save({ due_date: toPocketDate(new Date(`${e.target.value}T12:00:00`)) })
              }
            />
          </label>
          <button onClick={() => save({ due_date: '' })}>Remover</button>
        </div>
        <label className="detail-label">ESTIMATIVA</label>
        <div className="estimate">
          <button onClick={() => setEstimate(Math.max(5, estimate - 5))}>−</button>
          <span>{estimate} MIN</span>
          <button onClick={() => setEstimate(Math.min(240, estimate + 5))}>+</button>
          <button onClick={() => save({ estimated_minutes: estimate })}>Salvar</button>
        </div>
        <div className="compare">
          <span>PREVISTO {formatMinutes(estimate)}</span>
          <span>REAL {formatMinutes(task.actual_minutes)}</span>
          <i>
            <b style={{ width: `${Math.min(100, (task.actual_minutes / estimate) * 100)}%` }} />
          </i>
        </div>
        <button className="primary" onClick={() => start(task)}>
          <Play /> Iniciar Pomodoro
        </button>
        <section className="session-list">
          <h2>Sessões</h2>
          {sessions.length ? (
            sessions.map((s) => (
              <div key={s.id}>
                <span>
                  {new Date(s.started_at).toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: '2-digit',
                  })}
                </span>
                <span>{formatMinutes(s.duration_minutes)}</span>
                <span>{s.status.toUpperCase()}</span>
              </div>
            ))
          ) : (
            <p>Nenhuma sessão ainda</p>
          )}
        </section>
        <small className="muted">
          Criada em {new Date(task.created).toLocaleDateString('pt-BR')} · {localDay(new Date())}
        </small>
      </aside>
    </div>
  )
}
