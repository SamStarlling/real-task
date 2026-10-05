import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TaskRecord } from '@/types'
import { formatLongDate, formatMinutes, pbDay } from '@/lib/format'
import { localDay } from '@/lib/date-parser'
import { TaskCard } from '@/components/TaskCard'
import { TaskDetail } from '@/components/TaskDetail'
import { BrandMark } from '@/components/Brand'
import { reorderTasks } from '@/services/data'

export function Index({ tasks, refresh }: { tasks: TaskRecord[]; refresh: () => void }) {
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState<TaskRecord | null>(null)
  const [activeTagId, setActiveTagId] = useState<string | null>(null)
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

  // Tarefas da visão ativa antes do filtro de etiqueta
  const viewTasks = useMemo(
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

  // Etiquetas que possuem tarefas nesta visão específica
  const availableTagsInView = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string; count: number }>()
    for (const task of viewTasks) {
      const tagsList = task.expand?.tags || []
      for (const tag of tagsList) {
        if (!map.has(tag.id)) {
          map.set(tag.id, { id: tag.id, name: tag.name, color: tag.color, count: 1 })
        } else {
          map.get(tag.id)!.count++
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [viewTasks])

  // Filtragem adicional por etiqueta se selecionada
  const filtered = useMemo(
    () =>
      viewTasks.filter((t) => {
        if (!activeTagId) return true
        const tagIds = t.tags || []
        const expandedTagIds = t.expand?.tags?.map((tag) => tag.id) || []
        return tagIds.includes(activeTagId) || expandedTagIds.includes(activeTagId)
      }),
    [viewTasks, activeTagId],
  )

  // Separar concluídas e pendentes com ordenação estável por order e created
  const serverPending = useMemo(() => {
    return filtered
      .filter((t) => !t.done)
      .sort((a, b) => {
        const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : 999999
        const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : 999999
        if (orderA !== orderB) return orderA - orderB
        return new Date(b.created).getTime() - new Date(a.created).getTime()
      })
  }, [filtered])

  const done = useMemo(() => {
    return filtered.filter((t) => t.done)
  }, [filtered])

  // Estado local otimista de pendentes para drag-and-drop instantâneo
  const [optimisticPending, setOptimisticPending] = useState<TaskRecord[]>(serverPending)

  // Sincroniza com as tarefas do servidor quando houver atualização externa ou troca de view
  useEffect(() => {
    setOptimisticPending(serverPending)
  }, [serverPending])

  // Estados do Drag-and-Drop
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' } | null>(
    null,
  )

  // Referência para o container de tarefas para detecção touch
  const tasksContainerRef = useRef<HTMLElement>(null)
  const touchStateRef = useRef<{
    activeId: string | null
    lastTouchY: number
  }>({ activeId: null, lastTouchY: 0 })

  // Reordena o array e persiste no banco
  const commitReorder = useCallback(
    async (fromId: string, toId: string, position: 'before' | 'after') => {
      if (fromId === toId) return

      const currentList = [...optimisticPending]
      const fromIndex = currentList.findIndex((t) => t.id === fromId)
      const toIndex = currentList.findIndex((t) => t.id === toId)
      if (fromIndex === -1 || toIndex === -1) return

      const [movedItem] = currentList.splice(fromIndex, 1)
      let targetInsertIndex = currentList.findIndex((t) => t.id === toId)
      if (position === 'after') {
        targetInsertIndex += 1
      }
      currentList.splice(targetInsertIndex, 0, movedItem)

      // Atualização otimista imediata na UI
      setOptimisticPending(currentList)

      try {
        await reorderTasks(currentList)
        refresh()
      } catch (err) {
        console.error('Erro ao reordenar tarefas:', err)
        setOptimisticPending(serverPending)
      }
    },
    [optimisticPending, serverPending, refresh],
  )

  // Handlers para HTML5 Drag and Drop (Mouse / Desktop)
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingTaskId(taskId)
  }

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!draggingTaskId || draggingTaskId === taskId) {
      setDropTarget(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const position = e.clientY < midY ? 'before' : 'after'
    setDropTarget({ id: taskId, position })
  }

  const handleDragEnd = () => {
    setDraggingTaskId(null)
    setDropTarget(null)
  }

  const handleDrop = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault()
    const sourceTaskId = e.dataTransfer.getData('text/plain') || draggingTaskId
    const currentPosition = dropTarget?.id === targetTaskId ? dropTarget.position : 'before'

    setDraggingTaskId(null)
    setDropTarget(null)

    if (sourceTaskId && sourceTaskId !== targetTaskId) {
      await commitReorder(sourceTaskId, targetTaskId, currentPosition)
    }
  }

  // Handlers para Touch / Mobile
  const handleTouchStartHandle = (e: React.TouchEvent, taskId: string) => {
    const touch = e.touches[0]
    touchStateRef.current = {
      activeId: taskId,
      lastTouchY: touch.clientY,
    }
    setDraggingTaskId(taskId)
  }

  // Listener global de touchmove e touchend durante drag mobile
  useEffect(() => {
    if (!draggingTaskId) return

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      touchStateRef.current.lastTouchY = touch.clientY

      // Elemento sob o ponto do dedo
      const elem = document.elementFromPoint(touch.clientX, touch.clientY)
      const card = elem?.closest<HTMLElement>('.task-card[data-task-id]')
      if (card) {
        const targetId = card.getAttribute('data-task-id')
        if (targetId && targetId !== draggingTaskId) {
          const rect = card.getBoundingClientRect()
          const midY = rect.top + rect.height / 2
          const position = touch.clientY < midY ? 'before' : 'after'
          setDropTarget({ id: targetId, position })
        }
      }
    }

    const handleTouchEnd = async () => {
      const activeId = touchStateRef.current.activeId
      const target = dropTarget
      touchStateRef.current = { activeId: null, lastTouchY: 0 }
      setDraggingTaskId(null)
      setDropTarget(null)

      if (activeId && target && activeId !== target.id) {
        await commitReorder(activeId, target.id, target.position)
      }
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [draggingTaskId, dropTarget, commitReorder])

  const title = view === 'hoje' ? 'Hoje' : view === 'amanha' ? 'Amanhã' : 'Inbox'
  const estimated = optimisticPending.reduce((n, t) => n + t.estimated_minutes, 0),
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

      {/* Fileira discreta de filtro por etiqueta */}
      {availableTagsInView.length > 0 && (
        <div className="tags-filter-bar">
          <span className="tags-filter-label">ETIQUETAS:</span>
          <div className="tags-filter-chips">
            {availableTagsInView.map((tag) => {
              const isSelected = activeTagId === tag.id
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-filter-chip ${isSelected ? 'active' : ''}`}
                  style={{
                    borderColor: tag.color,
                    color: isSelected ? '#090A0E' : tag.color,
                    backgroundColor: isSelected ? tag.color : `${tag.color}14`,
                  }}
                  onClick={() => setActiveTagId(isSelected ? null : tag.id)}
                  title={isSelected ? 'Clique para limpar filtro' : `Filtrar por @${tag.name}`}
                >
                  @{tag.name}
                  <span className="tag-filter-count">({tag.count})</span>
                </button>
              )
            })}
            {activeTagId && (
              <button
                type="button"
                className="tag-filter-clear-btn"
                onClick={() => setActiveTagId(null)}
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>
      )}

      <section className="tasks" ref={tasksContainerRef}>
        {optimisticPending.map((task, i) => (
          <TaskCard
            key={task.id}
            task={task}
            index={i}
            draggable={true}
            isDragging={draggingTaskId === task.id}
            isDropTarget={dropTarget?.id === task.id ? dropTarget.position : null}
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, task.id)}
            onDrop={(e) => handleDrop(e, task.id)}
            onTouchStartHandle={(e) => handleTouchStartHandle(e, task.id)}
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
        {!optimisticPending.length && (
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
                draggable={false}
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
