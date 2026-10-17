import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Clock3,
  Edit2,
  Flag,
  GripHorizontal,
  GripVertical,
  Inbox,
  ListTodo,
  Play,
  Plus,
  Repeat,
  Sparkles,
  X,
} from 'lucide-react'
import type { TaskRecord } from '@/types'
import { formatMinutes, pbDay } from '@/lib/format'
import { localDay, toPocketDate } from '@/lib/date-parser'
import { TaskDetail } from '@/components/TaskDetail'
import { BrandMark } from '@/components/Brand'
import { EstimateInput } from '@/components/EstimateInput'
import {
  compareTasksWithinDay,
  createTask,
  formatRecurrenceRule,
  getPriorityMeta,
  getSubtaskProgress,
  getTaskBig3Source,
  isTaskOverdue,
  reorderTasks,
  toggleTaskDone,
  updateTask,
} from '@/services/data'
import type { ListRecord, TagRecord } from '@/types'
import { usePomodoro } from '@/contexts/PomodoroContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

interface DayColumnInfo {
  dateObj: Date
  dateKey: string // YYYY-MM-DD
  pocketDate: string
  weekdayShort: string // "SEG", "TER", etc.
  weekdayLong: string // "Segunda-feira"
  formattedDayMonth: string // "21/04" ou "21 abr"
  isToday: boolean
}

export function WeekPage({
  tasks,
  tags,
  lists,
  refresh,
}: {
  tasks: TaskRecord[]
  tags?: TagRecord[]
  lists?: ListRecord[]
  refresh: () => void
}) {
  const { user } = useAuth()
  const { start } = usePomodoro()
  const [params, setParams] = useSearchParams()
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null)
  const [activeTagId, setActiveTagId] = useState<string | null>(null)
  const urlTagParam = params.get('tag')
  const urlListParam = params.get('list')

  // Regime mobile (≤900px): seleção do dia ativo via chips
  const [selectedMobileDayKey, setSelectedMobileDayKey] = useState<string | null>(null)

  // Referências para carrossel e overflow da Inbox
  const gridScrollRef = useRef<HTMLDivElement>(null)
  const inboxScrollRef = useRef<HTMLDivElement>(null)

  // Estado de recolhimento da Inbox na /semana (colapsado por padrão conforme item 4)
  const [isInboxExpanded, setIsInboxExpanded] = useState(false)

  // Estados de scroll e fade
  const [gridCanScrollLeft, setGridCanScrollLeft] = useState(false)
  const [gridCanScrollRight, setGridCanScrollRight] = useState(false)
  const [inboxCanScrollLeft, setInboxCanScrollLeft] = useState(false)
  const [inboxCanScrollRight, setInboxCanScrollRight] = useState(false)
  const [inboxHiddenCount, setInboxHiddenCount] = useState(0)

  // Sincroniza seleção de tarefa com a URL ?taskId=... e filtro de tag ?tag=...
  useEffect(() => {
    const id = params.get('taskId')
    if (id) {
      const task = tasks.find((t) => t.id === id)
      if (task) setSelectedTask(task)
    }
  }, [params, tasks])

  useEffect(() => {
    if (urlTagParam) {
      setActiveTagId(urlTagParam)
    }
  }, [urlTagParam])

  // Gerar a janela dos 7 dias: hoje + 6 dias seguintes (sem dias passados)
  const days: DayColumnInfo[] = useMemo(() => {
    const list: DayColumnInfo[] = []
    const now = new Date()
    const todayStr = localDay(now)

    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12, 0, 0)
      const dateKey = localDay(d)
      const isToday = dateKey === todayStr

      // Formatação Space Mono elegante
      const weekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
        .format(d)
        .replace(/\./g, '')
        .toUpperCase()
      const weekdayLong = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(d)
      const formattedDayMonth = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
        .format(d)
        .replace(/\./g, '')
        .toUpperCase()

      list.push({
        dateObj: d,
        dateKey,
        pocketDate: toPocketDate(d),
        weekdayShort,
        weekdayLong,
        formattedDayMonth,
        isToday,
      })
    }
    return list
  }, [])

  const todayStr = days[0]?.dateKey || localDay()
  const lastDayStr = days[days.length - 1]?.dateKey || todayStr

  // Etiquetas que têm tarefas nesta semana (Inbox ou agendadas nos 7 dias)
  const availableTagsInWeek = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string; count: number }>()
    for (const t of tasks) {
      // Verificar se a tarefa pertence ao período da semana ou ao Inbox
      const isInbox = !t.due_date && !t.done
      const day = t.due_date ? pbDay(t.due_date) : ''
      const isWeek = day >= todayStr && day <= lastDayStr
      if (isInbox || isWeek) {
        const tagsList = t.expand?.tags || []
        for (const tag of tagsList) {
          if (!map.has(tag.id)) {
            map.set(tag.id, { id: tag.id, name: tag.name, color: tag.color, count: 1 })
          } else {
            map.get(tag.id)!.count++
          }
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [tasks, todayStr, lastDayStr])

  // Tarefas da Inbox filtradas por etiqueta ou lista se ativa
  const inboxTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.due_date || t.done) return false
        if (urlListParam && t.list !== urlListParam) return false
        if (!activeTagId) return true
        const tagIds = t.tags || []
        const expandedTagIds = t.expand?.tags?.map((tag) => tag.id) || []
        return tagIds.includes(activeTagId) || expandedTagIds.includes(activeTagId)
      })
      .sort((a, b) => {
        const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : 999999
        const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : 999999
        if (orderA !== orderB) return orderA - orderB
        return new Date(b.created).getTime() - new Date(a.created).getTime()
      })
  }, [tasks, activeTagId, urlListParam])

  // Inicializa o dia móvel selecionado com Hoje
  useEffect(() => {
    if (!selectedMobileDayKey && todayStr) {
      setSelectedMobileDayKey(todayStr)
    }
  }, [selectedMobileDayKey, todayStr])

  // Monitora scroll da grade semanal para setas e fade
  const updateGridScrollState = useCallback(() => {
    const el = gridScrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const tolerance = 4
    setGridCanScrollLeft(scrollLeft > tolerance)
    setGridCanScrollRight(scrollLeft + clientWidth < scrollWidth - tolerance)
  }, [])

  // Monitora scroll da Inbox para fade e contador +N tarefas ocultas
  const updateInboxScrollState = useCallback(() => {
    const el = inboxScrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const tolerance = 4
    setInboxCanScrollLeft(scrollLeft > tolerance)
    setInboxCanScrollRight(scrollLeft + clientWidth < scrollWidth - tolerance)

    // Calcula quantos cards estão ocultos além da borda direita visível
    const children = Array.from(el.querySelectorAll<HTMLElement>('.inbox-shelf-item'))
    if (children.length === 0) {
      setInboxHiddenCount(0)
      return
    }
    const containerRight = el.getBoundingClientRect().right
    let hidden = 0
    for (const child of children) {
      const childRect = child.getBoundingClientRect()
      if (childRect.right > containerRight + 10) {
        hidden++
      }
    }
    setInboxHiddenCount(hidden)
  }, [])

  // Posiciona a coluna de HOJE como âncora inicial em telas intermediárias (1200-1640px)
  useEffect(() => {
    const el = gridScrollRef.current
    if (!el) return

    updateGridScrollState()

    const todayCol = el.querySelector<HTMLElement>('.week-column.is-today-column')
    if (todayCol && el.scrollWidth > el.clientWidth) {
      const timer = setTimeout(() => {
        const colLeft = todayCol.offsetLeft
        // Centraliza ou posiciona no início com folga visual confortável
        el.scrollTo({ left: Math.max(0, colLeft - 14), behavior: 'smooth' })
        updateGridScrollState()
      }, 120)
      return () => clearTimeout(timer)
    }
  }, [days, updateGridScrollState])

  // Ouvintes de scroll e redimensionamento da janela
  useEffect(() => {
    const gridEl = gridScrollRef.current
    const inboxEl = inboxScrollRef.current

    const handleResize = () => {
      updateGridScrollState()
      updateInboxScrollState()
    }

    if (gridEl) {
      gridEl.addEventListener('scroll', updateGridScrollState, { passive: true })
    }
    if (inboxEl) {
      inboxEl.addEventListener('scroll', updateInboxScrollState, { passive: true })
    }
    window.addEventListener('resize', handleResize)

    updateGridScrollState()
    updateInboxScrollState()

    return () => {
      if (gridEl) gridEl.removeEventListener('scroll', updateGridScrollState)
      if (inboxEl) inboxEl.removeEventListener('scroll', updateInboxScrollState)
      window.removeEventListener('resize', handleResize)
    }
  }, [updateGridScrollState, updateInboxScrollState, inboxTasks.length])

  // Ações das setas ‹ › para deslizar a grade
  const scrollGrid = (direction: 'left' | 'right') => {
    const el = gridScrollRef.current
    if (!el) return
    const amount = direction === 'left' ? -320 : 320
    el.scrollBy({ left: amount, behavior: 'smooth' })
    setTimeout(updateGridScrollState, 350)
  }

  // Ações para deslizar a Inbox
  const scrollInbox = (direction: 'left' | 'right') => {
    const el = inboxScrollRef.current
    if (!el) return
    const amount = direction === 'left' ? -260 : 260
    el.scrollBy({ left: amount, behavior: 'smooth' })
    setTimeout(updateInboxScrollState, 350)
  }

  // Mapa de tarefas organizadas por dia (dateKey -> { pending: TaskRecord[], done: TaskRecord[] })
  // Também acolhe tarefas atrasadas pendentes no dia de "hoje"
  const tasksByDay = useMemo(() => {
    const map: Record<string, { pending: TaskRecord[]; done: TaskRecord[] }> = {}
    for (const d of days) {
      map[d.dateKey] = { pending: [], done: [] }
    }

    for (const t of tasks) {
      if (!t.due_date) continue

      if (urlListParam && t.list !== urlListParam) {
        continue
      }

      // Filtro ativo de etiqueta
      if (activeTagId) {
        const tagIds = t.tags || []
        const expandedTagIds = t.expand?.tags?.map((tag) => tag.id) || []
        if (!tagIds.includes(activeTagId) && !expandedTagIds.includes(activeTagId)) {
          continue
        }
      }

      const day = pbDay(t.due_date)
      let targetDayKey = day

      // Se a tarefa está atrasada (due_date < hoje), exibimos na coluna de hoje para execução imediata
      if (day < todayStr) {
        targetDayKey = todayStr
      }

      if (map[targetDayKey]) {
        if (t.done) {
          map[targetDayKey].done.push(t)
        } else {
          map[targetDayKey].pending.push(t)
        }
      }
    }

    // Ordenação interna estável de cada dia por due_time (com horário primeiro), order e created
    for (const key of Object.keys(map)) {
      map[key].pending.sort((a, b) => {
        return compareTasksWithinDay(a, b)
      })
    }

    return map
  }, [days, tasks, todayStr, activeTagId, urlListParam])

  // Totalizadores da semana inteira
  const summary = useMemo(() => {
    let totalPendingCount = 0
    let totalEstimatedMinutes = 0
    let totalActualMinutes = 0
    let totalDoneCount = 0

    for (const d of days) {
      const bucket = tasksByDay[d.dateKey]
      if (bucket) {
        for (const t of bucket.pending) {
          totalPendingCount++
          totalEstimatedMinutes += t.estimated_minutes || 0
          totalActualMinutes += t.actual_minutes || 0
        }
        totalDoneCount += bucket.done.length
      }
    }

    return {
      totalPendingCount,
      totalEstimatedMinutes,
      totalActualMinutes,
      totalDoneCount,
    }
  }, [days, tasksByDay])

  // Estados de Drag & Drop
  // draggingTaskId: id da tarefa que está sendo arrastada
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  // draggingSource: de onde veio ('inbox' ou 'day:YYYY-MM-DD')
  const [draggingSource, setDraggingSource] = useState<string | null>(null)
  // activeDropCol: coluna alvo atualmente sob o cursor
  const [activeDropCol, setActiveDropCol] = useState<string | null>(null)
  // dropTargetInsideCol: reordenação interna dentro da coluna
  const [dropTargetInsideCol, setDropTargetInsideCol] = useState<{
    id: string
    position: 'before' | 'after'
  } | null>(null)

  // Referência touch mobile
  const touchStateRef = useRef<{
    activeId: string | null
    source: string | null
    lastTouchX: number
    lastTouchY: number
  }>({ activeId: null, source: null, lastTouchX: 0, lastTouchY: 0 })

  // Estados de captura inline por coluna (+ no rodapé)
  const [activeInlineDay, setActiveInlineDay] = useState<string | null>(null)
  const [inlineTitle, setInlineTitle] = useState('')
  const [inlineMinutes, setInlineMinutes] = useState<number | null>(25)
  const [isSubmittingInline, setIsSubmittingInline] = useState(false)
  const inlineInputRef = useRef<HTMLInputElement>(null)

  // Foco no input de captura inline quando aberto
  useEffect(() => {
    if (activeInlineDay) {
      setTimeout(() => {
        inlineInputRef.current?.focus()
      }, 50)
    }
  }, [activeInlineDay])

  // Envio de nova tarefa direto no dia específico
  const handleCreateInline = async (dayInfo: DayColumnInfo) => {
    const title = inlineTitle.trim()
    if (!title || !user) return

    setIsSubmittingInline(true)
    try {
      await createTask({
        title,
        user: user.id,
        list: '',
        due_date: dayInfo.pocketDate,
        done: false,
        estimated_minutes: inlineMinutes,
        actual_minutes: 0,
        order: (tasksByDay[dayInfo.dateKey]?.pending.length || 0) * 10 + 10,
      })
      toast({
        title: `Tarefa criada em ${dayInfo.weekdayShort} (${dayInfo.formattedDayMonth})`,
      })
      setInlineTitle('')
      setInlineMinutes(25)
      setActiveInlineDay(null)
      refresh()
    } catch (err) {
      console.error('Erro ao criar tarefa no dia:', err)
      toast({ title: 'Erro ao criar tarefa no dia.', variant: 'destructive' })
    } finally {
      setIsSubmittingInline(false)
    }
  }

  // Executa a movimentação da tarefa para outra coluna e/ou reordenação interna
  const handleMoveOrReorder = useCallback(
    async (
      sourceTaskId: string,
      targetDayKey: string,
      targetTaskId?: string | null,
      targetPosition?: 'before' | 'after' | null,
    ) => {
      const task = tasks.find((t) => t.id === sourceTaskId)
      if (!task) return

      const dayObj = days.find((d) => d.dateKey === targetDayKey)
      if (!dayObj) return

      const currentDayKey = task.due_date ? pbDay(task.due_date) : null
      const isMovingBetweenDays = currentDayKey !== targetDayKey

      // Lista atual de pendentes do dia alvo
      const targetPendingList = [...(tasksByDay[targetDayKey]?.pending || [])]

      if (isMovingBetweenDays) {
        // Tarefa vem do Inbox ou de outro dia -> atualiza due_date e ajusta ordem
        const updatedTask: TaskRecord = {
          ...task,
          due_date: dayObj.pocketDate,
        }

        // Se soltou sobre uma tarefa específica na coluna
        if (targetTaskId && targetTaskId !== sourceTaskId) {
          const insertIdx = targetPendingList.findIndex((t) => t.id === targetTaskId)
          if (insertIdx !== -1) {
            const finalIdx = targetPosition === 'after' ? insertIdx + 1 : insertIdx
            targetPendingList.splice(finalIdx, 0, updatedTask)
          } else {
            targetPendingList.push(updatedTask)
          }
        } else {
          // Soltou na coluna vazia ou no corpo geral da coluna -> vai para o fim
          targetPendingList.push(updatedTask)
        }

        try {
          // Persiste a nova data no banco de dados imediatamente
          await updateTask(task.id, {
            due_date: dayObj.pocketDate,
          })
          // Persiste a nova sequência de order
          await reorderTasks(targetPendingList)
          toast({
            title: `Tarefa agendada para ${dayObj.weekdayShort} (${dayObj.formattedDayMonth})`,
          })
          refresh()
        } catch (err) {
          console.error('Erro ao mover tarefa entre dias:', err)
          toast({ title: 'Erro ao mover tarefa.', variant: 'destructive' })
        }
      } else {
        // Mesma coluna: reordenação interna simples respeitando o order
        if (!targetTaskId || targetTaskId === sourceTaskId) return

        const fromIndex = targetPendingList.findIndex((t) => t.id === sourceTaskId)
        const toIndex = targetPendingList.findIndex((t) => t.id === targetTaskId)
        if (fromIndex === -1 || toIndex === -1) return

        const [movedItem] = targetPendingList.splice(fromIndex, 1)
        let insertIndex = targetPendingList.findIndex((t) => t.id === targetTaskId)
        if (targetPosition === 'after') {
          insertIndex += 1
        }
        targetPendingList.splice(insertIndex, 0, movedItem)

        try {
          await reorderTasks(targetPendingList)
          refresh()
        } catch (err) {
          console.error('Erro ao reordenar tarefas na coluna:', err)
        }
      }
    },
    [days, tasks, tasksByDay, refresh],
  )

  // Handlers Desktop HTML5 Drag & Drop
  const handleDragStartTask = (e: React.DragEvent, taskId: string, source: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.setData('application/x-source', source)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingTaskId(taskId)
    setDraggingSource(source)
  }

  const handleDragEndTask = () => {
    setDraggingTaskId(null)
    setDraggingSource(null)
    setActiveDropCol(null)
    setDropTargetInsideCol(null)
  }

  const handleDragOverColumn = (e: React.DragEvent, dayKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (activeDropCol !== dayKey) {
      setActiveDropCol(dayKey)
    }
  }

  const handleDragOverTask = (e: React.DragEvent, taskId: string, dayKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (activeDropCol !== dayKey) {
      setActiveDropCol(dayKey)
    }

    if (!draggingTaskId || draggingTaskId === taskId) {
      setDropTargetInsideCol(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const position = e.clientY < midY ? 'before' : 'after'
    setDropTargetInsideCol({ id: taskId, position })
  }

  const handleDropOnColumn = async (e: React.DragEvent, dayKey: string) => {
    e.preventDefault()
    const sourceTaskId = e.dataTransfer.getData('text/plain') || draggingTaskId
    const targetTaskId = dropTargetInsideCol?.id || null
    const position = dropTargetInsideCol?.position || null

    handleDragEndTask()

    if (sourceTaskId) {
      await handleMoveOrReorder(sourceTaskId, dayKey, targetTaskId, position)
    }
  }

  // Handlers Touch Mobile
  const handleTouchStartHandle = (e: React.TouchEvent, taskId: string, source: string) => {
    const touch = e.touches[0]
    touchStateRef.current = {
      activeId: taskId,
      source,
      lastTouchX: touch.clientX,
      lastTouchY: touch.clientY,
    }
    setDraggingTaskId(taskId)
    setDraggingSource(source)
  }

  useEffect(() => {
    if (!draggingTaskId) return

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      touchStateRef.current.lastTouchX = touch.clientX
      touchStateRef.current.lastTouchY = touch.clientY

      const elem = document.elementFromPoint(touch.clientX, touch.clientY)

      // Identificar coluna alvo sob o toque
      const colElem = elem?.closest<HTMLElement>('.week-column[data-day-key]')
      const dayKey = colElem?.getAttribute('data-day-key') || null
      setActiveDropCol(dayKey)

      // Identificar card alvo sob o toque
      const cardElem = elem?.closest<HTMLElement>('.task-card[data-task-id]')
      if (cardElem) {
        const targetId = cardElem.getAttribute('data-task-id')
        if (targetId && targetId !== draggingTaskId) {
          const rect = cardElem.getBoundingClientRect()
          const midY = rect.top + rect.height / 2
          const position = touch.clientY < midY ? 'before' : 'after'
          setDropTargetInsideCol({ id: targetId, position })
        }
      } else {
        setDropTargetInsideCol(null)
      }
    }

    const handleTouchEnd = async () => {
      const activeId = touchStateRef.current.activeId
      const targetCol = activeDropCol
      const targetCard = dropTargetInsideCol

      touchStateRef.current = { activeId: null, source: null, lastTouchX: 0, lastTouchY: 0 }
      setDraggingTaskId(null)
      setDraggingSource(null)
      setActiveDropCol(null)
      setDropTargetInsideCol(null)

      if (activeId && targetCol) {
        await handleMoveOrReorder(
          activeId,
          targetCol,
          targetCard?.id || null,
          targetCard?.position || null,
        )
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
  }, [draggingTaskId, activeDropCol, dropTargetInsideCol, handleMoveOrReorder])

  return (
    <div className="week-page-container">
      {/* CABEÇALHO DA VISÃO */}
      <header className="week-header">
        <div className="week-header-title">
          <div className="week-eyebrow">
            <CalendarDays />
            <span>PLANEJAMENTO SEMANAL</span>
          </div>
          <h1>Visão Semana</h1>
          <p className="week-period">
            Próximos 7 dias — de {days[0]?.weekdayShort} {days[0]?.formattedDayMonth} a{' '}
            {days[days.length - 1]?.weekdayShort} {days[days.length - 1]?.formattedDayMonth}
          </p>
        </div>

        {/* RESUMO NO TOPO EM SPACE MONO */}
        <div className="week-summary-cards">
          <div className="week-metric-card">
            <span className="metric-label">CARGA DA SEMANA</span>
            <div className="metric-value-wrap">
              <span className="metric-number">{summary.totalPendingCount}</span>
              <span className="metric-unit">
                {summary.totalPendingCount === 1 ? 'TAREFA' : 'TAREFAS'}
              </span>
            </div>
            <span className="metric-sub">
              {summary.totalDoneCount > 0
                ? `${summary.totalDoneCount} concluídas`
                : 'Planejamento ativo'}
            </span>
          </div>

          <div className="week-metric-card">
            <span className="metric-label">ESTIMATIVA TOTAL</span>
            <div className="metric-value-wrap">
              <span className="metric-number">{formatMinutes(summary.totalEstimatedMinutes)}</span>
            </div>
            <span className="metric-sub">
              Realizado: {formatMinutes(summary.totalActualMinutes)}
            </span>
          </div>

          <div className="week-metric-card inbox-metric-card">
            <span className="metric-label">INBOX NÃO AGENDADA</span>
            <div className="metric-value-wrap">
              <span className="metric-number">{inboxTasks.length}</span>
              <span className="metric-unit">DISPONÍVEIS</span>
            </div>
            <span className="metric-sub">Arraste para um dia abaixo</span>
          </div>
        </div>
      </header>

      {/* FILTRO DISCRETO DE ETIQUETAS NA SEMANA */}
      {availableTagsInWeek.length > 0 && (
        <div className="tags-filter-bar week-tags-filter-bar">
          <span className="tags-filter-label">ETIQUETAS NA SEMANA:</span>
          <div className="tags-filter-chips">
            {availableTagsInWeek.map((tag) => {
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
                onClick={() => {
                  setActiveTagId(null)
                  if (urlTagParam) {
                    setParams((p) => {
                      p.delete('tag')
                      return p
                    })
                  }
                }}
              >
                Limpar filtro de etiqueta
              </button>
            )}
            {urlListParam && (
              <button
                type="button"
                className="tag-filter-clear-btn"
                onClick={() => {
                  setParams((p) => {
                    p.delete('list')
                    return p
                  })
                }}
              >
                Limpar filtro de lista
              </button>
            )}
          </div>
        </div>
      )}

      {/* FAIXA DO INBOX NO TOPO: Cartão compacto recolhível por padrão */}
      <section className={`week-inbox-shelf ${isInboxExpanded ? 'is-expanded' : ''}`}>
        <button
          type="button"
          className="inbox-shelf-header-btn"
          onClick={() => setIsInboxExpanded((prev) => !prev)}
          aria-expanded={isInboxExpanded}
          aria-label={
            isInboxExpanded
              ? 'Recolher tarefas da Inbox'
              : 'Expandir tarefas da Inbox para arrastar aos dias'
          }
        >
          <div className="inbox-shelf-header">
            <div className="inbox-shelf-title">
              <Inbox />
              <span>
                INBOX — TAREFAS NÃO AGENDADAS ({inboxTasks.length})
                {inboxTasks.length > 0 && (
                  <>
                    {' · '}
                    EST. TOTAL:{' '}
                    {formatMinutes(
                      inboxTasks.reduce((acc, t) => acc + (t.estimated_minutes || 0), 0),
                    )}
                  </>
                )}
              </span>
              {isInboxExpanded && inboxHiddenCount > 0 && (
                <span
                  className="inbox-hidden-counter-badge"
                  title={`${inboxHiddenCount} tarefas além do limite visível`}
                >
                  +{inboxHiddenCount}
                </span>
              )}
              <span className="inbox-shelf-hint">
                {isInboxExpanded
                  ? '· Arraste para o dia desejado'
                  : '· Clique para expandir e arrastar aos dias'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isInboxExpanded && inboxTasks.length > 0 && (
                <div className="inbox-shelf-nav" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="inbox-nav-arrow"
                    aria-label="Rolar Inbox para a esquerda"
                    disabled={!inboxCanScrollLeft}
                    onClick={() => scrollInbox('left')}
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    type="button"
                    className="inbox-nav-arrow"
                    aria-label="Rolar Inbox para a direita"
                    disabled={!inboxCanScrollRight}
                    onClick={() => scrollInbox('right')}
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}

              <span className="inbox-shelf-expand-indicator">
                <span>{isInboxExpanded ? 'Recolher' : 'Ver tarefas'}</span>
                <ChevronDown className={isInboxExpanded ? 'is-open' : ''} />
              </span>
            </div>
          </div>
        </button>

        {isInboxExpanded && (
          <div className="inbox-shelf-content-body">
            {inboxTasks.length > 0 ? (
              <div className="inbox-shelf-cards-wrapper">
                {inboxCanScrollLeft && (
                  <div className="inbox-shelf-fade inbox-fade-left" aria-hidden="true" />
                )}
                {inboxCanScrollRight && (
                  <div className="inbox-shelf-fade inbox-fade-right" aria-hidden="true" />
                )}
                <div ref={inboxScrollRef} className="inbox-shelf-cards">
                  {inboxTasks.map((task) => {
                    const priorityMeta = getPriorityMeta(task.priority)
                    const priorityClass = priorityMeta
                      ? `priority-${priorityMeta.code.toLowerCase()}`
                      : ''
                    const subtaskProgress = getSubtaskProgress(task.subtasks)
                    const big3Source = getTaskBig3Source(task, tags, lists)
                    const hasEstimate =
                      typeof task.estimated_minutes === 'number' && task.estimated_minutes > 0
                    return (
                      <div
                        key={task.id}
                        data-task-id={task.id}
                        className={`inbox-shelf-item ${priorityClass} ${draggingTaskId === task.id ? 'is-dragging' : ''} ${big3Source ? 'has-big3-source' : ''}`}
                        style={{
                          borderLeftColor: priorityMeta ? priorityMeta.borderColor : undefined,
                        }}
                        draggable
                        onDragStart={(e) => handleDragStartTask(e, task.id, 'inbox')}
                        onDragEnd={handleDragEndTask}
                      >
                        <div
                          className="inbox-item-drag-handle"
                          onTouchStart={(e) => handleTouchStartHandle(e, task.id, 'inbox')}
                          title="Arrastar para agendar no dia"
                        >
                          <GripHorizontal />
                        </div>
                        <button
                          type="button"
                          className="inbox-item-body"
                          onClick={() => {
                            setSelectedTask(task)
                            setParams((p) => {
                              p.set('taskId', task.id)
                              return p
                            })
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="inbox-item-title" title={task.title}>
                              {task.title}
                            </span>
                            {task.recurrence_type && task.recurrence_type !== 'none' && (
                              <span
                                className="recurrence-indicator"
                                title={formatRecurrenceRule(task) || 'Tarefa recorrente'}
                              >
                                <Repeat className="w-3 h-3 text-[#C5A880]" />
                              </span>
                            )}
                          </div>
                          <div className="inbox-item-meta">
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
                              <span
                                className="inbox-list-chip meta-list-chip"
                                title={`#${task.expand.list.name}`}
                              >
                                #{task.expand.list.name}
                              </span>
                            )}
                            {task.expand?.tags &&
                              (() => {
                                const visibleTags = task.expand.tags.slice(0, 2)
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
                            {task.recurrence_type && task.recurrence_type !== 'none' && (
                              <span
                                className="tag-chip recurrence-chip"
                                style={{
                                  borderColor: 'rgba(197, 168, 128, 0.35)',
                                  color: '#C5A880',
                                }}
                                title={`Regra: ${formatRecurrenceRule(task)}`}
                              >
                                <Repeat className="w-2.5 h-2.5 inline mr-1 flex-shrink-0" />
                                <span className="recurrence-chip-text">
                                  {formatRecurrenceRule(task).replace(/^repete\s*·\s*/, '')}
                                </span>
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
                            <span
                              className="inbox-est-chip meta-times"
                              title={
                                hasEstimate
                                  ? `Estimado: ${formatMinutes(task.estimated_minutes)}`
                                  : 'Sem estimativa prévia'
                              }
                            >
                              EST. {hasEstimate ? formatMinutes(task.estimated_minutes) : '—'}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="inbox-item-focus"
                          title="Iniciar Pomodoro"
                          onClick={(e) => {
                            e.stopPropagation()
                            start(task)
                          }}
                        >
                          <Play />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="inbox-shelf-empty">
                <BrandMark />
                <span>Inbox limpa. Todas as tarefas estão agendadas para esta semana.</span>
              </div>
            )}
          </div>
        )}
      </section>
      {/* SELETOR MOBILE DE DIA EM CHIPS (≤900px) */}
      <section className="week-mobile-day-selector" aria-label="Seletor de dias da semana">
        <div className="week-mobile-chips-scroll">
          {days.map((d) => {
            const isSelected = (selectedMobileDayKey || todayStr) === d.dateKey
            const bucket = tasksByDay[d.dateKey]
            const count = bucket ? bucket.pending.length : 0
            return (
              <button
                key={d.dateKey}
                type="button"
                className={`week-day-chip ${isSelected ? 'active' : ''} ${d.isToday ? 'is-today' : ''}`}
                onClick={() => setSelectedMobileDayKey(d.dateKey)}
              >
                <span className="chip-weekday">{d.weekdayShort}</span>
                <span className="chip-date">{d.formattedDayMonth}</span>
                {d.isToday && <span className="chip-today-dot" title="Hoje" />}
                {count > 0 && <span className="chip-count-badge">{count}</span>}
              </button>
            )
          })}
          <button
            type="button"
            className={`week-day-chip ${selectedMobileDayKey === 'all' ? 'active' : ''}`}
            onClick={() =>
              setSelectedMobileDayKey(selectedMobileDayKey === 'all' ? todayStr : 'all')
            }
          >
            <span className="chip-weekday">TODOS</span>
            <span className="chip-date">7 dias</span>
          </button>
        </div>
      </section>

      {/* GRADE DOS 7 DIAS (Desktop 7 colunas / Carrossel 1.200–1.640px / Mobile filtrado) */}
      <section className="week-grid-container">
        {/* Cabeçalho da Grade com Controles do Carrossel ‹ › */}
        <div className="week-grid-top-bar">
          <div className="week-grid-top-info">
            <span className="week-grid-top-label">DIAS DA SEMANA</span>
            <span className="week-grid-top-sub">
              {days[0]?.weekdayShort} {days[0]?.formattedDayMonth} —{' '}
              {days[days.length - 1]?.weekdayShort} {days[days.length - 1]?.formattedDayMonth}
            </span>
          </div>

          <div className="week-grid-nav-controls">
            <button
              type="button"
              className="week-carousel-btn"
              title="Rolar dias anteriores"
              aria-label="Dias anteriores"
              disabled={!gridCanScrollLeft}
              onClick={() => scrollGrid('left')}
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              className="week-carousel-btn"
              title="Rolar próximos dias"
              aria-label="Próximos dias"
              disabled={!gridCanScrollRight}
              onClick={() => scrollGrid('right')}
            >
              <ChevronRight />
            </button>
          </div>
        </div>

        {/* Container com scroll-snap e fade suave nas bordas */}
        <div className="week-columns-grid-wrapper">
          {gridCanScrollLeft && (
            <div className="week-grid-fade week-fade-left" aria-hidden="true" />
          )}
          {gridCanScrollRight && (
            <div className="week-grid-fade week-fade-right" aria-hidden="true" />
          )}

          <div ref={gridScrollRef} className="week-columns-grid">
            {days.map((day) => {
              const bucket = tasksByDay[day.dateKey] || { pending: [], done: [] }
              const dayPendingCount = bucket.pending.length
              const dayTotalEstimated = bucket.pending.reduce(
                (acc, t) => acc + (t.estimated_minutes || 0),
                0,
              )
              const isColumnDropTarget = activeDropCol === day.dateKey
              const isInlineActive = activeInlineDay === day.dateKey

              // No mobile (≤900px), filtra pelo dia selecionado se não for "all"
              const isHiddenOnMobile =
                selectedMobileDayKey &&
                selectedMobileDayKey !== 'all' &&
                selectedMobileDayKey !== day.dateKey

              return (
                <div
                  key={day.dateKey}
                  data-day-key={day.dateKey}
                  className={`week-column ${day.isToday ? 'is-today-column' : ''} ${
                    isColumnDropTarget ? 'column-drop-active' : ''
                  } ${isHiddenOnMobile ? 'mobile-hidden-column' : ''}`}
                  onDragOver={(e) => handleDragOverColumn(e, day.dateKey)}
                  onDrop={(e) => handleDropOnColumn(e, day.dateKey)}
                >
                  {/* CABEÇALHO DA COLUNA (Translúcido + backdrop-blur) */}
                  <div className="column-header">
                    <div className="col-header-top">
                      <span className={`col-weekday ${day.isToday ? 'today-accent' : ''}`}>
                        {day.weekdayShort}
                      </span>
                      <span className="col-date">{day.formattedDayMonth}</span>
                      {day.isToday && <span className="today-badge">HOJE</span>}
                    </div>
                    <div className="col-load-metric">
                      <span>
                        {dayPendingCount} {dayPendingCount === 1 ? 'tarefa' : 'tarefas'} ·{' '}
                        {formatMinutes(dayTotalEstimated)}
                      </span>
                    </div>
                  </div>

                  {/* LISTA DE TAREFAS PENDENTES DO DIA */}
                  <div className="column-body">
                    {bucket.pending.map((task) => {
                      const priorityMeta = getPriorityMeta(task.priority)
                      const priorityClass = priorityMeta
                        ? `priority-${priorityMeta.code.toLowerCase()}`
                        : ''
                      const isOverdue = isTaskOverdue(task)
                      const subtaskProgress = getSubtaskProgress(task.subtasks)
                      const big3Source = getTaskBig3Source(task, tags, lists)
                      const hasEstimate =
                        typeof task.estimated_minutes === 'number' && task.estimated_minutes > 0
                      const progressRatio = hasEstimate
                        ? Math.min(
                            100,
                            Math.round((task.actual_minutes / task.estimated_minutes!) * 100),
                          )
                        : 0

                      return (
                        <article
                          key={task.id}
                          data-task-id={task.id}
                          className={`task-card week-task-card ${isOverdue ? 'is-overdue-card' : ''} ${priorityClass} ${
                            draggingTaskId === task.id ? 'is-dragging' : ''
                          } ${
                            dropTargetInsideCol?.id === task.id
                              ? dropTargetInsideCol.position === 'before'
                                ? 'drop-target-before'
                                : 'drop-target-after'
                              : ''
                          } ${big3Source ? 'has-big3-source' : ''}`}
                          style={{
                            borderLeftColor:
                              priorityMeta && !isOverdue ? priorityMeta.borderColor : undefined,
                          }}
                          draggable
                          onDragStart={(e) => handleDragStartTask(e, task.id, `day:${day.dateKey}`)}
                          onDragEnd={handleDragEndTask}
                          onDragOver={(e) => handleDragOverTask(e, task.id, day.dateKey)}
                          onDrop={(e) => {
                            e.stopPropagation()
                            handleDropOnColumn(e, day.dateKey)
                          }}
                        >
                          <div
                            className="task-drag-handle"
                            title="Arrastar para outro dia ou reordenar"
                            onTouchStart={(e) =>
                              handleTouchStartHandle(e, task.id, `day:${day.dateKey}`)
                            }
                          >
                            <GripVertical />
                          </div>

                          <button
                            type="button"
                            className="check"
                            aria-label="Concluir tarefa"
                            onClick={async (e) => {
                              e.stopPropagation()
                              await toggleTaskDone(task, true)
                              refresh()
                            }}
                          >
                            {task.done ? '✓' : ''}
                          </button>

                          <button
                            type="button"
                            className="task-body"
                            onClick={() => {
                              setSelectedTask(task)
                              setParams((p) => {
                                p.set('taskId', task.id)
                                return p
                              })
                            }}
                          >
                            <div className="task-title-row">
                              <h3 title={task.title}>{task.title}</h3>
                              {task.recurrence_type && task.recurrence_type !== 'none' && (
                                <span
                                  className="recurrence-indicator"
                                  title={formatRecurrenceRule(task) || 'Tarefa recorrente'}
                                >
                                  <Repeat className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="meta">
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
                                <span
                                  className="meta-list-chip"
                                  title={`#${task.expand.list.name}`}
                                >
                                  #{task.expand.list.name}
                                </span>
                              )}
                              {task.expand?.tags &&
                                (() => {
                                  const visibleTags = task.expand.tags.slice(0, 2)
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
                              {task.recurrence_type && task.recurrence_type !== 'none' && (
                                <span
                                  className="tag-chip recurrence-chip"
                                  style={{
                                    borderColor: 'rgba(197, 168, 128, 0.35)',
                                    color: '#C5A880',
                                  }}
                                  title={`Regra: ${formatRecurrenceRule(task)}`}
                                >
                                  <Repeat className="w-2.5 h-2.5 inline mr-1 flex-shrink-0" />
                                  <span className="recurrence-chip-text">
                                    {formatRecurrenceRule(task).replace(/^repete\s*·\s*/, '')}
                                  </span>
                                </span>
                              )}
                              {task.due_time && (
                                <span
                                  className={`tag-chip time-chip ${isTaskOverdue(task) ? 'overdue-time-chip' : ''}`}
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
                                    hasEstimate && task.actual_minutes > task.estimated_minutes!
                                      ? 'exceeded'
                                      : ''
                                  }
                                >
                                  REAL {formatMinutes(task.actual_minutes)}
                                </b>
                              </span>
                            </div>

                            {/* Barra de progresso Previsto × Real: renderizada SOMENTE quando estimated_minutes > 0 (previne NaN) */}
                            {hasEstimate && (
                              <div
                                className="progress"
                                title={`Real ${Math.round(task.actual_minutes)} min / Estimado ${task.estimated_minutes} min (${progressRatio}%)`}
                              >
                                <i style={{ width: `${progressRatio}%` }} />
                              </div>
                            )}

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

                          {/* AÇÕES DE HOVER (DESKTOP) — Padrão Todoist / Linear */}
                          <aside className="task-hover-actions" aria-label="Ações rápidas">
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
                            <button
                              type="button"
                              className="task-action-btn icon-only"
                              title="Editar tarefa"
                              aria-label="Editar tarefa"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTask(task)
                                setParams((p) => {
                                  p.set('taskId', task.id)
                                  return p
                                })
                              }}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </aside>
                        </article>
                      )
                    })}

                    {/* DROP ZONE SUTIL QUANDO A COLUNA ESTÁ VAZIA */}
                    {bucket.pending.length === 0 && (
                      <div className="column-empty-dropzone">
                        <span>Sem tarefas</span>
                        <small>Arraste para cá</small>
                      </div>
                    )}

                    {/* TAREFAS CONCLUÍDAS DO DIA */}
                    {bucket.done.length > 0 && (
                      <details className="column-completed">
                        <summary>Concluídas ({bucket.done.length})</summary>
                        {bucket.done.map((task) => (
                          <article key={task.id} className="task-card week-task-card done">
                            <button
                              type="button"
                              className="check"
                              aria-label="Reabrir tarefa"
                              onClick={async (e) => {
                                e.stopPropagation()
                                await toggleTaskDone(task, false)
                                refresh()
                              }}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="task-body"
                              onClick={() => {
                                setSelectedTask(task)
                                setParams((p) => {
                                  p.set('taskId', task.id)
                                  return p
                                })
                              }}
                            >
                              <h3 title={task.title}>{task.title}</h3>
                              <div className="meta">
                                <span>REAL {formatMinutes(task.actual_minutes)}</span>
                              </div>
                            </button>
                          </article>
                        ))}
                      </details>
                    )}
                  </div>

                  {/* ADICIONAR DIRETO NO DIA */}
                  <div className="column-footer">
                    {isInlineActive ? (
                      <form
                        className="inline-capture-form"
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleCreateInline(day)
                        }}
                      >
                        <div className="inline-capture-input-row">
                          <input
                            ref={inlineInputRef}
                            value={inlineTitle}
                            onChange={(e) => setInlineTitle(e.target.value)}
                            placeholder={`Nova tarefa para ${day.weekdayShort}...`}
                            disabled={isSubmittingInline}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setActiveInlineDay(null)
                                setInlineTitle('')
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="inline-cancel-btn"
                            title="Cancelar"
                            onClick={() => {
                              setActiveInlineDay(null)
                              setInlineTitle('')
                            }}
                          >
                            <X />
                          </button>
                        </div>

                        <div className="inline-capture-actions flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <EstimateInput
                            value={inlineMinutes}
                            onChange={(val) => setInlineMinutes(val)}
                            allowClear
                            showQuickChips={false}
                            showWarning
                            variant="compact"
                            onConfirm={() => handleCreateInline(day)}
                          />
                          <button
                            type="submit"
                            className="inline-confirm-btn"
                            disabled={!inlineTitle.trim() || isSubmittingInline}
                          >
                            <Check /> Adicionar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="column-add-btn"
                        onClick={() => {
                          setActiveInlineDay(day.dateKey)
                          setInlineMinutes(25)
                          setInlineTitle('')
                        }}
                      >
                        <Plus />
                        <span>Adicionar tarefa</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* DRAWER LATERAL DE DETALHES DE TAREFA */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onChange={refresh}
          onClose={() => {
            setSelectedTask(null)
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
