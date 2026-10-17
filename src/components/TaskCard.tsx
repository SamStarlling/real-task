import React, { useRef, useState } from 'react'
import { CheckSquare, Clock, Edit2, Flag, Flame, GripVertical, Play, Repeat } from 'lucide-react'
import type { TaskRecord } from '@/types'
import { formatMinutes, pbDay } from '@/lib/format'
import { localDay } from '@/lib/date-parser'
import {
  formatRecurrenceRule,
  getPriorityMeta,
  getSubtaskProgress,
  getTaskBig3Source,
  isTaskOverdue,
  toggleTaskDone,
  updateTask,
} from '@/services/data'
import type { ListRecord, TagRecord } from '@/types'
import { usePomodoro } from '@/contexts/PomodoroContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface TaskCardProps {
  task: TaskRecord
  index: number
  onChange: () => void
  onOpen: () => void
  tags?: TagRecord[]
  lists?: ListRecord[]
  draggable?: boolean
  isDragging?: boolean
  isDropTarget?: 'before' | 'after' | null
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onTouchStartHandle?: (e: React.TouchEvent) => void
  compact?: boolean
  className?: string
}

export function TaskCard({
  task,
  index,
  onChange,
  onOpen,
  tags,
  lists,
  draggable = false,
  isDragging = false,
  isDropTarget = null,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTouchStartHandle,
  compact = false,
  className = '',
}: TaskCardProps) {
  const { start, state: pomodoroState } = usePomodoro()
  const today = localDay()
  const hasEstimate = typeof task.estimated_minutes === 'number' && task.estimated_minutes > 0
  const ratio = hasEstimate
    ? Math.min(100, (task.actual_minutes / task.estimated_minutes) * 100)
    : 0
  const overdue = isTaskOverdue(task)
  const isRecurrent = task.recurrence_type && task.recurrence_type !== 'none'
  const recurrenceLabel = isRecurrent ? formatRecurrenceRule(task) : ''
  const hasTime = !!(task.due_time && task.due_time.trim())
  const priorityMeta = getPriorityMeta(task.priority)
  const priorityClass = priorityMeta ? `priority-${priorityMeta.code.toLowerCase()}` : ''
  const subtaskProgress = getSubtaskProgress(task.subtasks)
  const big3Source = getTaskBig3Source(task, tags, lists)

  // Verifica se a tarefa está atualmente em foco pelo Pomodoro
  const isTaskInFocus = Boolean(
    pomodoroState &&
    pomodoroState.status === 'rodando' &&
    pomodoroState.phase === 'foco' &&
    pomodoroState.task?.id === task.id,
  )
  // Gestão de swipe no mobile (Touch events)
  // Swipe direito (offset positivo >= 64px) ativa ação rápida de FOCUS
  const [touchOffset, setTouchOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isHorizontalSwipeRef = useRef<boolean | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    // Se tocou no handle de drag, deixa o drag-and-drop cuidar
    const target = e.target as HTMLElement
    if (target.closest('.task-drag-handle') || target.closest('.check')) {
      return
    }
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    isHorizontalSwipeRef.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    // Determina se o gesto é primariamente horizontal (swipe) ou vertical (scroll)
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY)
      }
    }

    if (isHorizontalSwipeRef.current) {
      // Permitir swipe apenas para a direita (revelando FOCUS) até um máximo de 88px
      if (deltaX > 0) {
        setIsSwiping(true)
        const damped = Math.min(84, deltaX)
        setTouchOffset(damped)
      } else {
        setTouchOffset(0)
      }
    }
  }

  const handleTouchEnd = () => {
    if (isSwiping && touchOffset >= 54) {
      // Dispara o FOCUS via swipe mobile
      start(task)
    }
    setTouchOffset(0)
    setIsSwiping(false)
    touchStartRef.current = null
    isHorizontalSwipeRef.current = null
  }

  const handleQuickPriorityChange = async (newPriority: number) => {
    try {
      await updateTask(task.id, { priority: newPriority })
      onChange()
    } catch {
      // Silencioso
    }
  }

  return (
    <div className={`task-card-wrapper ${className}`}>
      {/* Background do swipe mobile revelando ação FOCUS à esquerda */}
      <div
        className={`task-swipe-action-bg ${touchOffset > 10 ? 'is-visible' : ''}`}
        aria-hidden="true"
      >
        <span className="task-swipe-hint">
          <Play className="w-4 h-4 fill-current" />
          <span>FOCUS</span>
        </span>
      </div>

      <article
        data-task-id={task.id}
        className={`task-card ${task.done ? 'done' : ''} ${overdue ? 'is-overdue-card' : ''} ${priorityClass} ${
          isDragging ? 'is-dragging' : ''
        } ${isDropTarget === 'before' ? 'drop-target-before' : ''} ${
          isDropTarget === 'after' ? 'drop-target-after' : ''
        } ${big3Source ? 'has-big3-source' : ''} ${isTaskInFocus ? 'is-in-focus' : ''}`}
        style={{
          animationDelay: `${index * 30}ms`,
          borderLeftColor: priorityMeta && !overdue ? priorityMeta.borderColor : undefined,
          transform: touchOffset > 0 ? `translateX(${touchOffset}px)` : undefined,
          transition: isSwiping
            ? 'none'
            : 'transform 200ms ease, border-color 150ms ease, box-shadow 150ms ease',
        }}
        draggable={draggable && !task.done}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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
          type="button"
          aria-label={task.done ? 'Reabrir tarefa' : 'Concluir tarefa'}
          onClick={async (e) => {
            e.stopPropagation()
            await toggleTaskDone(task)
            onChange()
          }}
        >
          {task.done ? '✓' : ''}
        </button>

        <button
          type="button"
          className="task-body"
          onClick={onOpen}
          aria-label={`Abrir detalhes de ${task.title}`}
        >
          <div className="task-title-row">
            <h3>{task.title}</h3>
            {isRecurrent && (
              <span className="recurrence-indicator" title={recurrenceLabel || 'Tarefa recorrente'}>
                <Repeat className="w-3.5 h-3.5" />
              </span>
            )}
            {isTaskInFocus && (
              <span
                className="task-active-focus-pill"
                title="Esta tarefa está com o bloco Pomodoro ativo agora"
              >
                <span className="focus-pulsing-dot" />
                EM FOCO
              </span>
            )}
          </div>

          <div className="meta">
            {/* Indicador discreto BIG3 quiet luxury com o ponto da cor da etiqueta/lista prioritária */}
            {big3Source && (
              <span
                className="tag-chip big3-indicator-chip"
                title={`Item prioritário Big3 (80/20) via ${big3Source.label}`}
              >
                <span
                  className="big3-dot"
                  style={{ backgroundColor: big3Source.color || '#C5A880' }}
                />
                BIG3
              </span>
            )}

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

            {task.expand?.list && (
              <span className="meta-list-chip" title={`#${task.expand.list.name}`}>
                #{task.expand.list.name}
              </span>
            )}

            {task.expand?.tags &&
              (() => {
                const maxTags = compact ? 2 : 4
                const visibleTags = task.expand.tags.slice(0, maxTags)
                const overflowCount = task.expand.tags.length - visibleTags.length
                return (
                  <>
                    {visibleTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="tag-chip"
                        style={{
                          borderColor: tag.color,
                          color: tag.color,
                        }}
                        title={`@${tag.name}`}
                      >
                        <span className="tag-chip-label">@{tag.name}</span>
                      </span>
                    ))}
                    {overflowCount > 0 && (
                      <span
                        className="tag-chip overflow-chip"
                        title={`${overflowCount} outra(s) etiqueta(s)`}
                      >
                        +{overflowCount}
                      </span>
                    )}
                  </>
                )
              })()}

            {isRecurrent && recurrenceLabel && (
              <span
                className="tag-chip recurrence-chip"
                style={{
                  borderColor: 'rgba(197, 168, 128, 0.35)',
                  color: '#C5A880',
                }}
                title={`Regra: ${recurrenceLabel}`}
              >
                <Repeat className="w-2.5 h-2.5 inline mr-1 flex-shrink-0" />
                <span className="recurrence-chip-text">
                  {recurrenceLabel.replace(/^repete\s*·\s*/, '')}
                </span>
              </span>
            )}

            {hasTime && (
              <span
                className={`tag-chip time-chip ${overdue ? 'overdue-time-chip' : ''}`}
                title={`Horário agendado: ${task.due_time}`}
              >
                <Clock className="w-2.5 h-2.5 inline mr-1 flex-shrink-0" />
                {task.due_time}
              </span>
            )}

            {subtaskProgress.total > 0 && (
              <span
                className={`tag-chip subtask-chip ${subtaskProgress.allDone ? 'all-done' : ''}`}
                title={`Sub-tarefas: ${subtaskProgress.completed} de ${subtaskProgress.total} concluídas`}
              >
                <CheckSquare className="w-2.5 h-2.5 inline mr-1 flex-shrink-0" />
                {subtaskProgress.completed}/{subtaskProgress.total}
              </span>
            )}

            <span className={`meta-status-chip ${overdue ? 'overdue' : ''}`}>
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

            <span
              className="meta-times"
              title={
                hasEstimate
                  ? `Estimado: ${formatMinutes(task.estimated_minutes)} · Realizado: ${formatMinutes(task.actual_minutes)}`
                  : `Sem estimativa · Realizado: ${formatMinutes(task.actual_minutes)}`
              }
            >
              EST. {hasEstimate ? formatMinutes(task.estimated_minutes) : '—'} ·{' '}
              <b
                className={
                  hasEstimate && task.actual_minutes > task.estimated_minutes ? 'exceeded' : ''
                }
              >
                REAL {formatMinutes(task.actual_minutes)}
              </b>
            </span>
          </div>

          <div
            className="progress"
            title={
              hasEstimate
                ? `Real ${Math.round(task.actual_minutes)} min / Estimado ${task.estimated_minutes} min`
                : `Realizado ${Math.round(task.actual_minutes)} min (sem estimativa)`
            }
          >
            <i style={{ width: hasEstimate ? `${ratio}%` : '0%' }} />
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

        {/* AÇÕES DE HOVER (DESKTOP) — Padrão Todoist / Linear: ocultas por padrão, surgem no hover */}
        {!task.done && (
          <aside className="task-hover-actions" aria-label="Ações rápidas">
            {/* Ação primária: Iniciar Foco Pomodoro */}
            <button
              type="button"
              className="task-action-btn focus-action-btn"
              title="Iniciar foco Pomodoro nesta tarefa"
              aria-label="Foco Pomodoro"
              onClick={(e) => {
                e.stopPropagation()
                start(task)
              }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="task-action-label">FOCUS</span>
            </button>

            {/* Ação secundária: Alterar Prioridade Rápida (Dropdown discreto) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="task-action-btn icon-only"
                  title="Alterar prioridade rápida (P1-P4)"
                  aria-label="Prioridade"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-36 bg-[#12131A] border-[rgba(255,255,255,0.1)] text-[#F4F4F6] text-xs font-mono p-1 shadow-xl"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickPriorityChange(1)
                  }}
                  className="flex items-center gap-2 cursor-pointer hover:bg-[rgba(197,168,128,0.15)] hover:text-[#C5A880]"
                >
                  <Flag className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>P1 · Urgente</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickPriorityChange(2)
                  }}
                  className="flex items-center gap-2 cursor-pointer hover:bg-[rgba(255,255,255,0.06)]"
                >
                  <Flag className="w-3.5 h-3.5 text-[#D8C7B0]" />
                  <span>P2 · Alta</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickPriorityChange(3)
                  }}
                  className="flex items-center gap-2 cursor-pointer hover:bg-[rgba(255,255,255,0.06)]"
                >
                  <Flag className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>P3 · Média</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickPriorityChange(4)
                  }}
                  className="flex items-center gap-2 cursor-pointer hover:bg-[rgba(255,255,255,0.06)]"
                >
                  <Flag className="w-3.5 h-3.5 text-[#5F606A]" />
                  <span>P4 · Baixa</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickPriorityChange(0)
                  }}
                  className="flex items-center gap-2 cursor-pointer text-[#71717A] hover:text-[#F4F4F6]"
                >
                  <span>Nenhuma prioridade</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Ação terciária: Abrir Painel de Detalhes */}
            <button
              type="button"
              className="task-action-btn icon-only"
              title="Abrir detalhes e editar"
              aria-label="Editar tarefa"
              onClick={(e) => {
                e.stopPropagation()
                onOpen()
              }}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </aside>
        )}
      </article>
    </div>
  )
}
