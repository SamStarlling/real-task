import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TaskRecord } from '@/types'
import { formatLongDate, formatMinutes, pbDay } from '@/lib/format'
import { localDay } from '@/lib/date-parser'
import { TaskCard } from '@/components/TaskCard'
import { TaskDetail } from '@/components/TaskDetail'
import { BrandMark } from '@/components/Brand'
export function Index({ tasks, refresh }: { tasks: TaskRecord[]; refresh: () => void }) {
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState<TaskRecord | null>(null)
  const view = params.get('view') || 'hoje'
  const today = localDay()
  const tomorrow = localDay(new Date(Date.now() + 86400000))
  useEffect(() => {
    const id = params.get('taskId')
    if (id) {
      const task = tasks.find((t) => t.id === id)
      if (task) setSelected(task)
    }
  }, [params, tasks])
  const filtered = useMemo(
    () =>
      tasks.filter((t) =>
        view === 'hoje'
          ? !!t.due_date && pbDay(t.due_date) <= today
          : view === 'amanha'
            ? pbDay(t.due_date) === tomorrow
            : !t.due_date,
      ),
    [tasks, view, today, tomorrow],
  )
  const pending = filtered.filter((t) => !t.done),
    done = filtered.filter((t) => t.done)
  const title = view === 'hoje' ? 'Hoje' : view === 'amanha' ? 'Amanhã' : 'Inbox'
  const estimated = pending.reduce((n, t) => n + t.estimated_minutes, 0),
    actual = filtered.reduce((n, t) => n + t.actual_minutes, 0)
  return (
    <div className="page">
      <header className="view-title">
        <h1>{title}</h1>
        <span>
          {formatLongDate(view === 'amanha' ? new Date(Date.now() + 86400000) : new Date())}
        </span>
      </header>
      {view === 'hoje' && (
        <div className="focus-summary">
          <span>FOCO HOJE — {formatMinutes(actual)}</span>
          <div>
            <i style={{ width: `${estimated ? Math.min(100, (actual / estimated) * 100) : 0}%` }} />
          </div>
        </div>
      )}
      <section className="tasks">
        {pending.map((task, i) => (
          <TaskCard
            key={task.id}
            task={task}
            index={i}
            onChange={refresh}
            onOpen={() => {
              setSelected(task)
              setParams((p) => {
                p.set('taskId', task.id)
                return p
              })
            }}
          />
        ))}
        {!pending.length && (
          <div className="empty">
            <BrandMark />
            <p>
              Nada para {view === 'inbox' ? 'a Inbox' : title.toLowerCase()}. Capture a próxima
              tarefa acima.
            </p>
          </div>
        )}
        {done.length > 0 && (
          <details className="completed">
            <summary>Concluídas — {done.length}</summary>
            {done.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                onChange={refresh}
                onOpen={() => setSelected(task)}
              />
            ))}
          </details>
        )}
      </section>
      {selected && (
        <TaskDetail
          task={selected}
          onChange={refresh}
          onClose={() => {
            setSelected(null)
            setParams((p) => {
              p.delete('taskId')
              return p
            })
          }}
        />
      )}
    </div>
  )
}
