import { GripVertical, Play, Repeat } from 'lucide-react'
import type { TaskRecord } from '@/types'
import { formatMinutes, pbDay } from '@/lib/format'
import { localDay } from '@/lib/date-parser'
import { formatRecurrenceRule, toggleTaskDone } from '@/services/data'
import { usePomodoro } from '@/contexts/PomodoroContext'

export interface TaskCardProps {
  task: TaskRecord
  index: number
  onChange: () => void
  onOpen: () => void
  draggable?: boolean
  isDragging?: boolean
  isDropTarget?: 'before' | 'after' | null
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onTouchStartHandle?: (e: React.TouchEvent) => void
}

export function TaskCard({
  task,
  index,
  onChange,
  onOpen,
  draggable = false,
  isDragging = false,
  isDropTarget = null,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTouchStartHandle,
}: TaskCardProps) {
  const { start } = usePomodoro()
  const today = localDay()
  const ratio = Math.min(100, (task.actual_minutes / task.estimated_minutes) * 100)
  const overdue = !task.done && pbDay(task.due_date) < today
  const isRecurrent = task.recurrence_type && task.recurrence_type !== 'none'
  const recurrenceLabel = isRecurrent ? formatRecurrenceRule(task) : ''

  return (
    <article
      data-task-id={task.id}
      className={`task-card ${task.done ? 'done' : ''} ${isDragging ? 'is-dragging' : ''} ${
        isDropTarget === 'before' ? 'drop-target-before' : ''
      } ${isDropTarget === 'after' ? 'drop-target-after' : ''}`}
      style={{ animationDelay: `${index * 40}ms` }}
      draggable={draggable && !task.done}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {draggable && !task.done && (
        <div
          className="task-drag-handle"
          title="Arrastar para reordenar"
          onTouchStart={onTouchStartHandle}
        >
          <GripVertical />
        </div>
      )}
      <button
        className="check"
        aria-label="Concluir"
        onClick={async (e) => {
          e.stopPropagation()
          await toggleTaskDone(task)
          onChange()
        }}
      >
        {task.done ? '✓' : ''}
      </button>
      <button className="task-body" onClick={onOpen}>
        <div className="task-title-row">
          <h3>{task.title}</h3>
          {isRecurrent && (
            <span className="recurrence-indicator" title={recurrenceLabel || 'Tarefa recorrente'}>
              <Repeat className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
        <div className="meta">
          {task.expand?.list && <span>#{task.expand.list.name}</span>}
          {task.expand?.tags &&
            task.expand.tags.map((tag) => (
              <span
                key={tag.id}
                className="tag-chip"
                style={{
                  borderColor: tag.color,
                  color: tag.color,
                }}
              >
                @{tag.name}
              </span>
            ))}
          {isRecurrent && recurrenceLabel && (
            <span
              className="tag-chip recurrence-chip"
              style={{
                borderColor: 'rgba(197, 168, 128, 0.35)',
                color: '#C5A880',
              }}
              title={`Regra: ${recurrenceLabel}`}
            >
              <Repeat className="w-2.5 h-2.5 inline mr-1" />
              {recurrenceLabel.replace(/^repete\s*·\s*/, '')}
            </span>
          )}
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
