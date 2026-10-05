import { useEffect, useState } from 'react'
import { X, Play, Tag as TagIcon, Plus } from 'lucide-react'
import type { SessionRecord, TagRecord, TaskRecord } from '@/types'
import { formatMinutes } from '@/lib/format'
import { localDay, toPocketDate } from '@/lib/date-parser'
import { createTag, getNextTagColor, getTags, sessionsForTask, updateTask } from '@/services/data'
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
  const { start } = usePomodoro()

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
