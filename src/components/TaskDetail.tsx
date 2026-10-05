import { useEffect, useState } from 'react'
import { X, Play, Tag as TagIcon, Plus, Repeat } from 'lucide-react'
import type { RecurrenceMode, RecurrenceType, SessionRecord, TagRecord, TaskRecord } from '@/types'
import { formatMinutes } from '@/lib/format'
import { localDay, toPocketDate } from '@/lib/date-parser'
import {
  createTag,
  formatRecurrenceRule,
  getNextTagColor,
  getTags,
  sessionsForTask,
  updateTask,
} from '@/services/data'
import { usePomodoro } from '@/contexts/PomodoroContext'
import { useAuth } from '@/contexts/AuthContext'

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
  const [estimate, setEstimate] = useState(task.estimated_minutes)
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [userTags, setUserTags] = useState<TagRecord[]>([])
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
  const { start } = usePomodoro()

  useEffect(() => {
    setTitle(task.title)
    setEstimate(task.estimated_minutes)
    setRecurrenceType(task.recurrence_type || 'none')
    setRecurrenceInterval(Math.max(1, Number(task.recurrence_interval) || 1))
    setRecurrenceWeekdays(Array.isArray(task.recurrence_weekdays) ? task.recurrence_weekdays : [])
    setRecurrenceMode(task.recurrence_mode || 'from_date')
  }, [task])

  useEffect(() => {
    sessionsForTask(task.id).then(setSessions)
    getTags().then(setUserTags)
  }, [task.id])

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
