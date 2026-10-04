import { Play } from 'lucide-react'
import type { TaskRecord } from '@/types'
import { formatMinutes, pbDay } from '@/lib/format'
import { localDay } from '@/lib/date-parser'
import { updateTask } from '@/services/data'
import { usePomodoro } from '@/contexts/PomodoroContext'
export function TaskCard({
  task,
  index,
  onChange,
  onOpen,
}: {
  task: TaskRecord
  index: number
  onChange: () => void
  onOpen: () => void
}) {
  const { start } = usePomodoro()
  const today = localDay()
  const ratio = Math.min(100, (task.actual_minutes / task.estimated_minutes) * 100)
  const overdue = !task.done && pbDay(task.due_date) < today
  return (
    <article
      className={`task-card ${task.done ? 'done' : ''}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <button
        className="check"
        aria-label="Concluir"
        onClick={async () => {
          await updateTask(task.id, {
            done: !task.done,
            completed_at: !task.done ? new Date().toISOString() : '',
          })
          onChange()
        }}
      >
        {task.done ? '✓' : ''}
      </button>
      <button className="task-body" onClick={onOpen}>
        <h3>{task.title}</h3>
        <div className="meta">
          {task.expand?.list && <span>#{task.expand.list.name}</span>}
          <span className={overdue ? 'overdue' : ''}>
            {overdue
              ? 'ATRASADA'
              : pbDay(task.due_date) === today
                ? 'HOJE'
                : task.due_date
                  ? 'AMANHÃ'
                  : 'INBOX'}
          </span>
          <span>
            EST. {formatMinutes(task.estimated_minutes)} ·{' '}
            <b className={task.actual_minutes > task.estimated_minutes ? 'exceeded' : ''}>
              REAL {formatMinutes(task.actual_minutes)}
            </b>
          </span>
        </div>
        <div
          className="progress"
          title={`Real ${Math.round(task.actual_minutes)} min / Estimado ${task.estimated_minutes} min`}
        >
          <i style={{ width: `${ratio}%` }} />
        </div>
      </button>
      <button className="focus" onClick={() => start(task)}>
        <Play />
        FOCUS
      </button>
    </article>
  )
}
