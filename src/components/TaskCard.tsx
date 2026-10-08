import { CheckSquare, Clock, Flag, GripVertical, Play, Repeat } from 'lucide-react'
import type { TaskRecord } from '@/types'
import { formatMinutes, pbDay } from '@/lib/format'
import { localDay } from '@/lib/date-parser'
import {
  formatRecurrenceRule,
  getPriorityMeta,
  getSubtaskProgress,
  isTaskOverdue,
  toggleTaskDone,
} from '@/services/data'
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
  const overdue = isTaskOverdue(task)
  const isRecurrent = task.recurrence_type && task.recurrence_type !== 'none'
  const recurrenceLabel = isRecurrent ? formatRecurrenceRule(task) : ''
  const hasTime = !!(task.due_time && task.due_time.trim())
  const priorityMeta = getPriorityMeta(task.priority)
  const priorityClass = priorityMeta ? `priority-${priorityMeta.code.toLowerCase()}` : ''
  const subtaskProgress = getSubtaskProgress(task.subtasks)

  return (
    <article
      data-task-id={task.id}
      className={`task-card ${task.done ? 'done' : ''} ${overdue ? 'is-overdue-card' : ''} ${priorityClass} ${
        isDragging ? 'is-dragging' : ''
      } ${isDropTarget === 'before' ? 'drop-target-before' : ''} ${
        isDropTarget === 'after' ? 'drop-target-after' : ''
      }`}
      style={{
        animationDelay: `${index * 40}ms`,
        borderLeftColor: priorityMeta && !overdue ? priorityMeta.borderColor : undefined,
      }}
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
          {priorityMeta && (
            <span
              className="tag-chip priority-chip"
              style={{
                borderColor: priorityMeta.borderColor,
                color: priorityMeta.color,
                backgroundColor: priorityMeta.bgSubtle,
              }}
              title={priorityMeta.label}
            >
              <Flag className="w-2.5 h-2.5 inline mr-1" />
              {priorityMeta.code}
            </span>
          )}
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
          {hasTime && (
            <span
              className={`tag-chip time-chip ${overdue ? 'overdue-time-chip' : ''}`}
              title={`Horário agendado: ${task.due_time}`}
            >
              <Clock className="w-2.5 h-2.5 inline mr-1" />
              {task.due_time}
            </span>
          )}
          {subtaskProgress.total > 0 && (
            <span
              className={`tag-chip subtask-chip ${subtaskProgress.allDone ? 'all-done' : ''}`}
              title={`Sub-tarefas: ${subtaskProgress.completed} de ${subtaskProgress.total} concluídas`}
            >
              <CheckSquare className="w-2.5 h-2.5 inline mr-1" />
              {subtaskProgress.completed}/{subtaskProgress.total}
            </span>
          )}
          <span className={overdue ? 'overdue' : ''}>
            {overdue
              ? 'ATRASADA'
              : pbDay(task.due_date) === today
                ? 'HOJE'
                : task.due_date
                  ? pbDay(task.due_date) > today
                    ? 'AGENDADA'
                    : 'AMANHÃ'
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
        {subtaskProgress.total > 0 && (
          <div
            className="subtask-card-progress"
            title={`Checklist: ${subtaskProgress.completed}/${subtaskProgress.total} (${Math.round(subtaskProgress.ratio)}%)`}
          >
            <i
              style={{ width: `${subtaskProgress.ratio}%` }}
              className={subtaskProgress.allDone ? 'all-done' : ''}
            />
          </div>
        )}
      </button>
      <button className="focus" onClick={() => start(task)}>
        <Play />
        FOCUS
      </button>
    </article>
  )
}
