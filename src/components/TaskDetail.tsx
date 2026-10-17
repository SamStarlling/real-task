import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  X,
  Play,
  Tag as TagIcon,
  Plus,
  Repeat,
  Clock,
  Flag,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  Folder,
  Calendar,
  ExternalLink,
  Edit2,
} from 'lucide-react'
import type {
  ListRecord,
  RecurrenceMode,
  RecurrenceType,
  SessionRecord,
  SubtaskItem,
  TagRecord,
  TaskPriority,
  TaskRecord,
} from '@/types'
import { formatMinutes, formatShortDate } from '@/lib/format'
import { localDay, toPocketDate } from '@/lib/date-parser'
import {
  createTag,
  formatRecurrenceRule,
  getLists,
  getNextTagColor,
  getPriorityMeta,
  getSubtaskProgress,
  getTags,
  sessionsForTask,
  TASK_PRIORITIES,
  updateTask,
} from '@/services/data'
import { usePomodoro } from '@/contexts/PomodoroContext'
import { useAuth } from '@/contexts/AuthContext'
import { EstimateInput } from '@/components/EstimateInput'

/**
 * Renderiza texto convertendo URLs (https://, http:// e obsidian://) em links clicáveis.
 * Preserva quebras de linha e caracteres intactos.
 */
function renderDescriptionWithLinks(text: string): ReactNode[] {
  // Regex para casar https://..., http://... e obsidian://...
  const urlRegex = /(https?:\/\/[^\s]+|obsidian:\/\/[^\s]+)/g
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = urlRegex.exec(text)) !== null) {
    const matchIndex = match.index
    const url = match[0]

    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex))
    }

    const isObsidian = url.startsWith('obsidian://')
    parts.push(
      <a
        key={`${matchIndex}-${url}`}
        href={url}
        target={isObsidian ? '_self' : '_blank'}
        rel={isObsidian ? undefined : 'noopener noreferrer'}
        className={`task-description-link ${isObsidian ? 'obsidian-link' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          if (isObsidian) {
            // Permite que o protocolo nativo obsidian:// abra direto
            window.location.href = url
          }
        }}
        title={isObsidian ? `Abrir nota no Obsidian: ${url}` : `Abrir link externo: ${url}`}
      >
        {url}
        {!isObsidian && <ExternalLink className="w-3 h-3 inline-block ml-1 opacity-70" />}
      </a>,
    )

    lastIndex = matchIndex + url.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export function TaskDetail({
  task,
  onClose,
  onChange,
}: {
  task: TaskRecord
  onClose: () => void
  onChange: () => void
}) {
  const { user } = useAuth()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [estimate, setEstimate] = useState<number | null>(
    typeof task.estimated_minutes === 'number' && task.estimated_minutes > 0
      ? task.estimated_minutes
      : null,
  )
  const [isEditingEstimate, setIsEditingEstimate] = useState(false)
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [userTags, setUserTags] = useState<TagRecord[]>([])
  const [allProjects, setAllProjects] = useState<ListRecord[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    task.recurrence_type || 'none',
  )
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(
    Math.max(1, Number(task.recurrence_interval) || 1),
  )
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>(
    Array.isArray(task.recurrence_weekdays) ? task.recurrence_weekdays : [],
  )
  const [recurrenceMode, setRecurrenceMode] = useState<RecurrenceMode>(
    task.recurrence_mode || 'from_date',
  )
  const [priority, setPriority] = useState<TaskPriority>(task.priority || 0)
  const [dueTime, setDueTime] = useState<string>(task.due_time || '')
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>(
    Array.isArray(task.subtasks) ? task.subtasks : [],
  )
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('')
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const { start, state: pomodoroState } = usePomodoro()
  const isCurrentlyInFocus = Boolean(
    pomodoroState &&
    pomodoroState.status === 'rodando' &&
    pomodoroState.phase === 'foco' &&
    pomodoroState.task?.id === task.id,
  )
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setEstimate(
      typeof task.estimated_minutes === 'number' && task.estimated_minutes > 0
        ? task.estimated_minutes
        : null,
    )
    setPriority(task.priority || 0)
    setRecurrenceType(task.recurrence_type || 'none')
    setRecurrenceInterval(Math.max(1, Number(task.recurrence_interval) || 1))
    setDueTime(task.due_time || '')
    setSubtasks(Array.isArray(task.subtasks) ? task.subtasks : [])
    setRecurrenceWeekdays(Array.isArray(task.recurrence_weekdays) ? task.recurrence_weekdays : [])
    setRecurrenceMode(task.recurrence_mode || 'from_date')
  }, [task])

  useEffect(() => {
    sessionsForTask(task.id).then(setSessions)
    getTags().then(setUserTags)
    getLists(true).then(setAllProjects)
  }, [task.id])

  // Auto-ajuste de altura da textarea de descrição
  useEffect(() => {
    if (isEditingDescription && descriptionTextareaRef.current) {
      const el = descriptionTextareaRef.current
      el.style.height = 'auto'
      el.style.height = `${Math.max(84, el.scrollHeight)}px`
    }
  }, [isEditingDescription, description])

  // Lista dos IDs das tags associadas à tarefa
  const assignedTagIds = task.tags || []
  const assignedTags = userTags.filter((t) => assignedTagIds.includes(t.id))
  const unassignedTags = userTags.filter((t) => !assignedTagIds.includes(t.id))

  const save = async (data: Record<string, unknown>) => {
    await updateTask(task.id, data)
    onChange()
  }

  const handleToggleTag = async (tagId: string) => {
    const isCurrentlyAssigned = assignedTagIds.includes(tagId)
    const nextTagIds = isCurrentlyAssigned
      ? assignedTagIds.filter((id) => id !== tagId)
      : [...assignedTagIds, tagId]

    await save({ tags: nextTagIds })
  }

  const handleCreateAndAssignTag = async () => {
    const trimmed = newTagName.trim()
    if (!trimmed || !user) return

    try {
      const existing = userTags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
      let tagToAssignId = existing?.id

      if (!tagToAssignId) {
        const nextColor = getNextTagColor(userTags.length)
        const created = await createTag({
          name: trimmed.slice(0, 30),
          user: user.id,
          color: nextColor,
        })
        setUserTags((prev) => [...prev, created])
        tagToAssignId = created.id
      }

      if (tagToAssignId && !assignedTagIds.includes(tagToAssignId)) {
        await save({ tags: [...assignedTagIds, tagToAssignId] })
      }
      setNewTagName('')
      setIsAddingTag(false)
    } catch (err) {
      console.error('Erro ao criar etiqueta no detalhe:', err)
    }
  }
  const handleRecurrenceChange = async (
    nextType: RecurrenceType,
    nextInterval: number = recurrenceInterval,
    nextWeekdays: number[] = recurrenceWeekdays,
    nextMode: RecurrenceMode = recurrenceMode,
  ) => {
    setRecurrenceType(nextType)
    setRecurrenceInterval(nextInterval)
    setRecurrenceWeekdays(nextWeekdays)
    setRecurrenceMode(nextMode)

    await save({
      recurrence_type: nextType,
      recurrence_interval: nextInterval,
      recurrence_weekdays: nextType === 'weekly_days' ? nextWeekdays : null,
      recurrence_mode: nextMode,
    })
  }

  const toggleWeekday = async (dayIndex: number) => {
    const current = [...recurrenceWeekdays]
    const exists = current.includes(dayIndex)
    let next: number[]
    if (exists) {
      next = current.filter((d) => d !== dayIndex)
      // Garante ao menos 1 dia selecionado se estiver em weekly_days
      if (next.length === 0) next = [dayIndex]
    } else {
      next = [...current, dayIndex].sort((a, b) => a - b)
    }
    setRecurrenceWeekdays(next)
    await save({ recurrence_weekdays: next })
  }

  // --- SUB-TAREFAS ---
  const handleAddSubtask = async () => {
    const trimmed = newSubtaskTitle.trim()
    if (!trimmed) return

    const newItem: SubtaskItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: trimmed,
      done: false,
    }

    const nextList = [...subtasks, newItem]
    setSubtasks(nextList)
    setNewSubtaskTitle('')
    await save({ subtasks: nextList })
  }

  const handleToggleSubtaskDone = async (id: string) => {
    const nextList = subtasks.map((st) => (st.id === id ? { ...st, done: !st.done } : st))
    setSubtasks(nextList)
    await save({ subtasks: nextList })
  }

  const handleStartEditingSubtask = (st: SubtaskItem) => {
    setEditingSubtaskId(st.id)
    setEditingSubtaskTitle(st.title)
  }

  const handleSaveSubtaskTitle = async (id: string) => {
    const trimmed = editingSubtaskTitle.trim()
    if (!trimmed) {
      // Se deixou em branco, cancela a edição mantendo o anterior
      setEditingSubtaskId(null)
      setEditingSubtaskTitle('')
      return
    }

    const nextList = subtasks.map((st) => (st.id === id ? { ...st, title: trimmed } : st))
    setSubtasks(nextList)
    setEditingSubtaskId(null)
    setEditingSubtaskTitle('')
    await save({ subtasks: nextList })
  }

  const handleDeleteSubtask = async (id: string) => {
    const nextList = subtasks.filter((st) => st.id !== id)
    setSubtasks(nextList)
    if (editingSubtaskId === id) {
      setEditingSubtaskId(null)
      setEditingSubtaskTitle('')
    }
    await save({ subtasks: nextList })
  }

  const handleMoveSubtask = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= subtasks.length) return

    const nextList = [...subtasks]
    const temp = nextList[index]
    nextList[index] = nextList[targetIndex]
    nextList[targetIndex] = temp

    setSubtasks(nextList)
    await save({ subtasks: nextList })
  }

  const subtaskProgress = getSubtaskProgress(subtasks)

  const readableRecurrence = formatRecurrenceRule({
    due_date: task.due_date,
    recurrence_type: recurrenceType,
    recurrence_interval: recurrenceInterval,
    recurrence_weekdays: recurrenceWeekdays,
    recurrence_mode: recurrenceMode,
  })

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

        {/* METADADOS DO CABEÇALHO: PROJETO E DATA/PRAZO (ETAPA 1.5) */}
        {(() => {
          const currentProject = allProjects.find((p) => p.id === task.list) || task.expand?.list
          return (
            <div className="detail-meta-row">
              {/* Projeto com dot de cor e seletor inline */}
              <div className="inline-flex items-center gap-1.5 flex-1 min-w-0">
                <Folder className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Projeto:
                </span>
                <select
                  value={task.list || ''}
                  onChange={(e) => save({ list: e.target.value || null, section: null })}
                  className="bg-transparent text-xs text-foreground font-sans border-0 border-b border-border/40 focus:border-[#C5A880] focus:ring-0 py-0.5 px-1 cursor-pointer outline-none max-w-[170px] truncate"
                  title="Alterar projeto da tarefa"
                >
                  <option value="" className="bg-[#12141C] text-[#f4f4f6]">
                    📥 Inbox (Sem projeto)
                  </option>
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#12141C] text-[#f4f4f6]">
                      {p.name}
                    </option>
                  ))}
                </select>
                {currentProject && (
                  <span
                    className="detail-meta-dot"
                    style={{ backgroundColor: currentProject.color || '#C5A880' }}
                    title={`Cor do projeto: ${currentProject.color || '#C5A880'}`}
                  />
                )}
              </div>

              {/* Prazo/Data de uma linha */}
              <div className="inline-flex items-center gap-1.5 flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[#C5A880] flex-shrink-0" />
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Prazo:
                </span>
                <span className="text-xs font-mono text-[#f4f4f6]">
                  {task.due_date
                    ? formatShortDate(new Date(task.due_date.replace(' ', 'T')))
                    : 'Sem data'}
                </span>
              </div>
            </div>
          )
        })()}

        <input
          className="detail-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && save({ title: title.trim() })}
        />

        {/* SEÇÃO DESCRIÇÃO (ETAPA 1.5 TODOIST REVERSE-ENGINEERING) */}
        <label className="detail-label flex items-center justify-between">
          <span>DESCRIÇÃO</span>
          {description.trim() && !isEditingDescription && (
            <button
              type="button"
              onClick={() => setIsEditingDescription(true)}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[#C5A880] hover:underline"
              title="Editar descrição da tarefa"
            >
              <Edit2 className="w-2.5 h-2.5" />
              Editar
            </button>
          )}
        </label>
        <div className="task-description-box">
          {isEditingDescription ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={descriptionTextareaRef}
                value={description}
                placeholder="Cole aqui links do Obsidian, cursos, referências… (opcional)"
                onChange={(e) => setDescription(e.target.value)}
                onBlur={async () => {
                  setIsEditingDescription(false)
                  if (description !== (task.description || '')) {
                    await save({ description: description.trim() })
                  }
                }}
                onKeyDown={(e) => {
                  // Ctrl+Enter ou Cmd+Enter salva
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault()
                    e.currentTarget.blur()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    setDescription(task.description || '')
                    setIsEditingDescription(false)
                  }
                }}
                className="task-description-textarea"
                autoFocus
                maxLength={5000}
              />
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-[10px] font-mono text-[#71717a]">
                  {description.length}/5000 · URLs e obsidian:// viram links
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDescription(task.description || '')
                      setIsEditingDescription(false)
                    }}
                    className="text-[11px] font-mono text-muted-foreground hover:text-foreground px-2 py-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsEditingDescription(false)
                      if (description !== (task.description || '')) {
                        await save({ description: description.trim() })
                      }
                    }}
                    className="text-[11px] font-mono font-semibold bg-[#C5A880] text-[#090A0E] px-3 py-1 rounded hover:bg-[#d8c29d]"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          ) : description.trim() ? (
            <div
              className="task-description-display"
              onClick={() => setIsEditingDescription(true)}
              title="Clique para editar a descrição"
            >
              {renderDescriptionWithLinks(description)}
            </div>
          ) : (
            <div
              className="task-description-placeholder"
              onClick={() => setIsEditingDescription(true)}
              title="Clique para adicionar descrição"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Cole aqui links do Obsidian, cursos, referências… (opcional)</span>
            </div>
          )}
        </div>

        {/* SEÇÃO PRIORIDADE (P1–P4 + NENHUMA) */}
        <label className="detail-label flex items-center justify-between">
          <span>PRIORIDADE</span>
          {priority > 0 && getPriorityMeta(priority) && (
            <span
              className="detail-priority-badge"
              style={{
                color: getPriorityMeta(priority)!.color,
                borderColor: getPriorityMeta(priority)!.borderColor,
                backgroundColor: getPriorityMeta(priority)!.bgSubtle,
              }}
            >
              <Flag className="w-2.5 h-2.5 inline mr-1" />
              {getPriorityMeta(priority)!.label}
            </span>
          )}
        </label>
        <div className="option-row priority-row">
          <button
            type="button"
            className={`priority-pill-btn ${priority === 0 ? 'active-priority-btn' : ''}`}
            onClick={async () => {
              setPriority(0)
              await save({ priority: 0 })
            }}
          >
            Nenhuma
          </button>
          {([1, 2, 3, 4] as const).map((lvl) => {
            const meta = TASK_PRIORITIES[lvl]
            const isSelected = priority === lvl
            return (
              <button
                key={lvl}
                type="button"
                className={`priority-pill-btn ${isSelected ? 'active-priority-btn' : ''}`}
                style={{
                  borderColor: meta.borderColor,
                  color: isSelected ? '#090A0E' : meta.color,
                  backgroundColor: isSelected ? meta.color : meta.bgSubtle,
                }}
                onClick={async () => {
                  setPriority(lvl)
                  await save({ priority: lvl })
                }}
              >
                <Flag className="w-3 h-3 inline mr-1" />
                {meta.code}
              </button>
            )
          })}
        </div>

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

        {/* HORÁRIO (ETAPA 3) */}
        <label className="detail-label flex items-center justify-between">
          <span>HORÁRIO ESPECÍFICO</span>
          {dueTime && (
            <span className="detail-due-time-badge">
              <Clock className="w-3 h-3 inline mr-1" />
              {dueTime}
            </span>
          )}
        </label>
        <div className="option-row due-time-row">
          <div className="due-time-input-wrap">
            <input
              type="time"
              value={dueTime}
              onChange={(e) => {
                const val = e.target.value
                setDueTime(val)
                save({ due_time: val })
              }}
              className="detail-time-input"
            />
          </div>
          {['09:00', '14:00', '18:00'].map((presetTime) => (
            <button
              key={presetTime}
              type="button"
              className={dueTime === presetTime ? 'active-recurrence-btn' : ''}
              onClick={() => {
                setDueTime(presetTime)
                save({ due_time: presetTime })
              }}
            >
              {presetTime}
            </button>
          ))}
          {dueTime && (
            <button
              type="button"
              onClick={() => {
                setDueTime('')
                save({ due_time: '' })
              }}
              className="due-time-clear-btn"
              title="Remover horário agendado"
            >
              Remover
            </button>
          )}
        </div>
        <label className="detail-label">ETIQUETAS</label>
        <div className="detail-tags-section">
          <div className="detail-tags-list">
            {assignedTags.map((tag) => (
              <span
                key={tag.id}
                className="tag-chip active-tag-chip inline-flex items-center gap-1.5"
                style={{
                  borderColor: tag.color,
                  color: tag.color,
                  backgroundColor: `${tag.color}14`,
                }}
              >
                <TagIcon className="w-3 h-3" />@{tag.name}
                <button
                  type="button"
                  className="tag-remove-btn"
                  title="Remover etiqueta da tarefa"
                  onClick={() => handleToggleTag(tag.id)}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {!assignedTags.length && !isAddingTag && (
              <span className="text-xs text-muted-foreground italic">
                Nenhuma etiqueta associada
              </span>
            )}
          </div>

          {/* Adicionar / Criar etiqueta */}
          {isAddingTag ? (
            <div className="detail-add-tag-box">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome da etiqueta..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateAndAssignTag()
                    } else if (e.key === 'Escape') {
                      setIsAddingTag(false)
                      setNewTagName('')
                    }
                  }}
                  autoFocus
                  className="detail-tag-input"
                />
                <button
                  type="button"
                  className="detail-tag-confirm-btn"
                  onClick={handleCreateAndAssignTag}
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  className="detail-tag-cancel-btn"
                  onClick={() => {
                    setIsAddingTag(false)
                    setNewTagName('')
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {unassignedTags.length > 0 && (
                <div className="detail-unassigned-tags-wrap">
                  <span className="detail-tags-hint">Ou escolha existente:</span>
                  <div className="detail-tags-list">
                    {unassignedTags.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className="tag-chip tag-picker-item inline-flex items-center gap-1"
                        style={{
                          borderColor: `${t.color}60`,
                          color: t.color,
                        }}
                        onClick={() => handleToggleTag(t.id)}
                      >
                        <Plus className="w-2.5 h-2.5" />@{t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="detail-add-tag-trigger"
              onClick={() => setIsAddingTag(true)}
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span>Gerenciar / Adicionar Etiqueta</span>
            </button>
          )}
        </div>

        {/* SEÇÃO SUB-TAREFAS (CHECKLIST ESTILO TICKTICK / TODOIST) */}
        <label className="detail-label flex items-center justify-between">
          <span>
            SUB-TAREFAS
            {subtaskProgress.total > 0 && (
              <span
                className={`detail-subtasks-count ${subtaskProgress.allDone ? 'all-done' : ''}`}
                title={
                  subtaskProgress.allDone
                    ? 'Todas as sub-tarefas concluídas'
                    : `${subtaskProgress.completed} de ${subtaskProgress.total} concluídas`
                }
              >
                · {subtaskProgress.completed}/{subtaskProgress.total}
                {subtaskProgress.allDone && ' ✓'}
              </span>
            )}
          </span>
          {subtaskProgress.total > 0 && (
            <span className="detail-subtasks-progress-track">
              <i
                style={{ width: `${subtaskProgress.ratio}%` }}
                className={subtaskProgress.allDone ? 'complete' : ''}
              />
            </span>
          )}
        </label>
        <div className="subtasks-section">
          {/* Lista de sub-tarefas existentes */}
          {subtasks.length > 0 && (
            <ul className="subtasks-list">
              {subtasks.map((st, idx) => {
                const isEditing = editingSubtaskId === st.id
                return (
                  <li
                    key={st.id}
                    className={`subtask-item ${st.done ? 'subtask-done' : ''} ${
                      isEditing ? 'is-editing' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className={`subtask-checkbox ${st.done ? 'checked' : ''}`}
                      onClick={() => handleToggleSubtaskDone(st.id)}
                      aria-label={st.done ? 'Marcar como não concluída' : 'Marcar como concluída'}
                      title={st.done ? 'Concluída' : 'Marcar feita'}
                    >
                      {st.done ? <Check className="w-3 h-3" /> : null}
                    </button>

                    {isEditing ? (
                      <div className="subtask-edit-wrap">
                        <input
                          type="text"
                          className="subtask-edit-input"
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSaveSubtaskTitle(st.id)
                            } else if (e.key === 'Escape') {
                              e.preventDefault()
                              setEditingSubtaskId(null)
                              setEditingSubtaskTitle('')
                            }
                          }}
                          onBlur={() => handleSaveSubtaskTitle(st.id)}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span
                        className="subtask-title"
                        onClick={() => handleStartEditingSubtask(st)}
                        title="Clique para editar"
                      >
                        {st.title}
                      </span>
                    )}

                    <div className="subtask-actions">
                      <button
                        type="button"
                        className="subtask-action-btn"
                        disabled={idx === 0}
                        onClick={() => handleMoveSubtask(idx, 'up')}
                        title="Mover para cima"
                        aria-label="Mover para cima"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="subtask-action-btn"
                        disabled={idx === subtasks.length - 1}
                        onClick={() => handleMoveSubtask(idx, 'down')}
                        title="Mover para baixo"
                        aria-label="Mover para baixo"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="subtask-action-btn delete-btn"
                        onClick={() => handleDeleteSubtask(st.id)}
                        title="Excluir sub-tarefa"
                        aria-label="Excluir sub-tarefa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Adicionar sub-tarefa inline (Enter cria, Esc cancela) */}
          <div className="subtask-add-row">
            <Plus className="subtask-add-icon" />
            <input
              type="text"
              className="subtask-add-input"
              placeholder="Adicionar sub-tarefa... (Enter para criar)"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddSubtask()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  setNewSubtaskTitle('')
                  e.currentTarget.blur()
                }
              }}
            />
          </div>
        </div>

        {/* SEÇÃO RECORRÊNCIA ESTILO TICKTICK */}
        <label className="detail-label">
          RECORRÊNCIA
          {readableRecurrence && (
            <span className="detail-recurrence-badge">
              <Repeat className="w-3 h-3 inline mr-1" />
              {readableRecurrence}
            </span>
          )}
        </label>
        <div className="recurrence-box">
          {/* Seletor do tipo de repetição */}
          <div className="option-row recurrence-type-row">
            <button
              type="button"
              className={recurrenceType === 'none' ? 'active-recurrence-btn' : ''}
              onClick={() => handleRecurrenceChange('none')}
            >
              Nunca
            </button>
            <button
              type="button"
              className={recurrenceType === 'daily' ? 'active-recurrence-btn' : ''}
              onClick={() => handleRecurrenceChange('daily')}
            >
              Diária
            </button>
            <button
              type="button"
              className={recurrenceType === 'weekly' ? 'active-recurrence-btn' : ''}
              onClick={() => handleRecurrenceChange('weekly')}
            >
              Semanal
            </button>
            <button
              type="button"
              className={recurrenceType === 'weekly_days' ? 'active-recurrence-btn' : ''}
              onClick={() => {
                const initialWeekdays =
                  recurrenceWeekdays.length > 0 ? recurrenceWeekdays : [1, 3, 5] // seg, qua, sex por padrão amigável
                handleRecurrenceChange('weekly_days', recurrenceInterval, initialWeekdays)
              }}
            >
              Dias da semana
            </button>
            <button
              type="button"
              className={recurrenceType === 'monthly' ? 'active-recurrence-btn' : ''}
              onClick={() => handleRecurrenceChange('monthly')}
            >
              Mensal
            </button>
          </div>

          {/* Configurações contextuais quando há repetição ativa */}
          {recurrenceType !== 'none' && (
            <div className="recurrence-details-panel">
              {/* Intervalo "A cada N ..." */}
              <div className="recurrence-interval-row">
                <span className="recurrence-sublabel">A cada</span>
                <div className="recurrence-stepper">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(1, recurrenceInterval - 1)
                      handleRecurrenceChange(recurrenceType, next)
                    }}
                  >
                    −
                  </button>
                  <span>{recurrenceInterval}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = recurrenceInterval + 1
                      handleRecurrenceChange(recurrenceType, next)
                    }}
                  >
                    +
                  </button>
                </div>
                <span className="recurrence-unit-text">
                  {recurrenceType === 'daily' && (recurrenceInterval === 1 ? 'dia' : 'dias')}
                  {recurrenceType === 'weekly' && (recurrenceInterval === 1 ? 'semana' : 'semanas')}
                  {recurrenceType === 'weekly_days' &&
                    (recurrenceInterval === 1 ? 'semana nos dias:' : 'semanas nos dias:')}
                  {recurrenceType === 'monthly' && (recurrenceInterval === 1 ? 'mês' : 'meses')}
                </span>
              </div>

              {/* Seletor multi-seleção de dias da semana (quando weekly_days) */}
              {recurrenceType === 'weekly_days' && (
                <div className="recurrence-weekdays-picker">
                  {[
                    { idx: 1, label: 'seg' },
                    { idx: 2, label: 'ter' },
                    { idx: 3, label: 'qua' },
                    { idx: 4, label: 'qui' },
                    { idx: 5, label: 'sex' },
                    { idx: 6, label: 'sáb' },
                    { idx: 0, label: 'dom' },
                  ].map((day) => {
                    const isSelected = recurrenceWeekdays.includes(day.idx)
                    return (
                      <button
                        key={day.idx}
                        type="button"
                        className={`recurrence-day-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleWeekday(day.idx)}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Mensagem informativa sobre dia do mês se mensal */}
              {recurrenceType === 'monthly' && (
                <div className="recurrence-monthly-hint">
                  {task.due_date ? (
                    <span>
                      Repete no dia {new Date(task.due_date).getUTCDate()} de cada mês (com ajuste
                      para meses curtos).
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground">
                      Defina uma data acima para fixar o dia do mês.
                    </span>
                  )}
                </div>
              )}

              {/* Modo de base (estilo TickTick: a partir da data vs da conclusão) */}
              <div className="recurrence-mode-section">
                <span className="recurrence-sublabel">Modo de cálculo</span>
                <div className="recurrence-mode-toggle">
                  <button
                    type="button"
                    className={`recurrence-mode-btn ${
                      recurrenceMode === 'from_date' ? 'active' : ''
                    }`}
                    onClick={() =>
                      handleRecurrenceChange(
                        recurrenceType,
                        recurrenceInterval,
                        recurrenceWeekdays,
                        'from_date',
                      )
                    }
                  >
                    A partir da data
                  </button>
                  <button
                    type="button"
                    className={`recurrence-mode-btn ${
                      recurrenceMode === 'from_completion' ? 'active' : ''
                    }`}
                    onClick={() =>
                      handleRecurrenceChange(
                        recurrenceType,
                        recurrenceInterval,
                        recurrenceWeekdays,
                        'from_completion',
                      )
                    }
                  >
                    A partir da conclusão
                  </button>
                </div>
                <small className="recurrence-mode-desc">
                  {recurrenceMode === 'from_date'
                    ? 'A próxima data é calculada a partir do prazo agendado (ideal para prazos fixos).'
                    : 'A próxima data é calculada após você concluir a tarefa (ideal para hábitos e rotinas).'}
                </small>
              </div>
            </div>
          )}
        </div>

        <label className="detail-label flex items-center justify-between">
          <span>ESTIMATIVA</span>
          {estimate !== null && !isEditingEstimate && (
            <button
              type="button"
              onClick={() => setIsEditingEstimate(true)}
              className="text-[11px] font-mono text-[#C5A880] hover:underline"
            >
              Editar
            </button>
          )}
        </label>

        {isEditingEstimate || estimate === null ? (
          <div className="p-3 bg-[#12141C] border border-[#C5A880]/20 rounded-lg mb-3">
            <EstimateInput
              value={estimate}
              onChange={async (newVal) => {
                setEstimate(newVal)
                await save({ estimated_minutes: newVal })
                if (newVal !== null) {
                  setIsEditingEstimate(false)
                }
              }}
              allowClear
              showQuickChips
              showWarning
              variant="full"
              autoFocus={isEditingEstimate}
              onConfirm={() => setIsEditingEstimate(false)}
            />
            {estimate === null && (
              <div className="mt-2 text-[11px] font-mono text-[#71717a] flex items-center justify-between">
                <span>Clique em um atalho ou digite de 1 a 600 min</span>
              </div>
            )}
          </div>
        ) : (
          <div
            className="estimate cursor-pointer hover:border-[#C5A880]/50 transition-colors"
            onClick={() => setIsEditingEstimate(true)}
            title="Clique para editar estimativa livre (1–600 min)"
          >
            <span>{estimate} MIN</span>
            <button
              type="button"
              className="text-[11px] text-[#C5A880] ml-auto font-mono hover:underline"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditingEstimate(true)
              }}
            >
              Alterar
            </button>
          </div>
        )}

        <div className="compare">
          <span>PREVISTO {estimate !== null ? formatMinutes(estimate) : '—'}</span>
          <span>REAL {formatMinutes(task.actual_minutes)}</span>
          <i>
            <b
              style={{
                width:
                  estimate !== null && estimate > 0
                    ? `${Math.min(100, (task.actual_minutes / estimate) * 100)}%`
                    : '0%',
              }}
            />
          </i>
        </div>
        <button
          type="button"
          className={`primary focus-primary-action-btn ${isCurrentlyInFocus ? 'is-focus-running' : ''}`}
          onClick={() => {
            start(task)
            onClose()
          }}
          title={
            isCurrentlyInFocus
              ? 'Bloco Pomodoro em andamento nesta tarefa'
              : 'Iniciar bloco de foco Pomodoro nesta tarefa'
          }
        >
          <Play className="fill-current w-4 h-4" />
          <span>{isCurrentlyInFocus ? 'Pomodoro Em Foco Agora' : 'FOCUS · Iniciar Pomodoro'}</span>
        </button>
        <section className="session-list">
          <h2>Sessões</h2>
          {sessions.length ? (
            sessions.map((s) => (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>
                    {new Date(s.started_at).toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                    })}
                  </span>
                  <span>{formatMinutes(s.duration_minutes)}</span>
                  <span>{s.status.toUpperCase()}</span>
                </div>
                {s.note && s.note.trim() && (
                  <div className="session-note-text" title="Descrição da sessão">
                    {s.note}
                  </div>
                )}
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
