import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  ArrowRight,
  Clock,
  Flag,
  Folder,
  Minus,
  Plus,
  Repeat,
  Tag as TagIcon,
  X,
} from 'lucide-react'
import {
  cleanDateToken,
  cleanRecurrenceToken,
  cleanTimeToken,
  parsePortugueseDate,
  parsePortugueseRecurrence,
  parsePortugueseTime,
  toPocketDate,
} from '@/lib/date-parser'
import { formatShortDate } from '@/lib/format'
import {
  cleanPriorityToken,
  createList,
  createTag,
  createTask,
  formatRecurrenceRule,
  getLists,
  getNextTagColor,
  getPriorityMeta,
  getTags,
  parsePriorityToken,
  TASK_PRIORITIES,
} from '@/services/data'
import type { ListRecord, RecurrenceMode, RecurrenceType, TagRecord, TaskPriority } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

export function CaptureBar({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [minutes, setMinutes] = useState(25)
  const [lists, setLists] = useState<ListRecord[]>([])
  const [tags, setTags] = useState<TagRecord[]>([])
  const [selectedList, setSelectedList] = useState<ListRecord | null>(null)
  const [selectedTags, setSelectedTags] = useState<TagRecord[]>([])
  const [manualRecurrenceType, setManualRecurrenceType] = useState<RecurrenceType | null>(null)
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([1, 3, 5])
  const [recurrenceMode, setRecurrenceMode] = useState<RecurrenceMode>('from_date')
  const [isRecurrencePopoverOpen, setIsRecurrencePopoverOpen] = useState(false)
  const [priorityOverride, setPriorityOverride] = useState<TaskPriority | null>(null)
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [manualTime, setManualTime] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      getLists().then(setLists)
      getTags().then(setTags)
    }
  }, [user])

  const parsed = parsePortugueseDate(text)
  const parsedTime = parsePortugueseTime(text)
  const parsedRecurrence = parsePortugueseRecurrence(text)

  const effectiveTime = manualTime !== null ? manualTime : parsedTime?.time || null
  const parsedPriority = parsePriorityToken(text)
  const effectivePriority: TaskPriority =
    priorityOverride !== null ? priorityOverride : parsedPriority ? parsedPriority.priority : 0
  const priorityMeta = getPriorityMeta(effectivePriority)

  const effectiveRecurrenceType: RecurrenceType =
    manualRecurrenceType !== null
      ? manualRecurrenceType
      : parsedRecurrence
        ? parsedRecurrence.type
        : 'none'

  const effectiveRecurrenceInterval: number =
    manualRecurrenceType !== null
      ? recurrenceInterval
      : parsedRecurrence
        ? parsedRecurrence.interval
        : recurrenceInterval

  const effectiveRecurrenceWeekdays: number[] =
    manualRecurrenceType !== null
      ? recurrenceWeekdays
      : parsedRecurrence && parsedRecurrence.weekdays && parsedRecurrence.weekdays.length > 0
        ? parsedRecurrence.weekdays
        : recurrenceWeekdays

  // Detecção de # (Listas)
  const hashMatch = text.match(/(?:^|\s)#([^\s]*)$/)
  const isHashOpen = !!hashMatch
  const hashQuery = hashMatch?.[1] || ''
  const listMatches = lists.filter((l) => l.name.toLowerCase().includes(hashQuery.toLowerCase()))
  const listOptions =
    hashQuery && !listMatches.some((l) => l.name.toLowerCase() === hashQuery.toLowerCase())
      ? [null, ...listMatches]
      : listMatches

  // Detecção de @ (Etiquetas/Tags)
  const atMatch = text.match(/(?:^|\s)@([^\s]*)$/)
  const isAtOpen = !isHashOpen && !!atMatch
  const atQuery = atMatch?.[1] || ''
  const tagMatches = tags.filter((t) => t.name.toLowerCase().includes(atQuery.toLowerCase()))
  const tagOptions =
    atQuery && !tagMatches.some((t) => t.name.toLowerCase() === atQuery.toLowerCase())
      ? [null, ...tagMatches]
      : tagMatches

  // Detecção de Autocomplete de Prioridade: "p", "p1"-"p4" ou "!" no cursor
  const prioMatch = text.match(/(?:^|\s)(p[1-4]?|!{1,2})$/i)
  const isPrioAutocompleteOpen = !isHashOpen && !isAtOpen && !!prioMatch
  const prioQuery = prioMatch?.[1]?.toLowerCase() || ''
  const priorityOptions: Array<{ level: TaskPriority; meta: (typeof TASK_PRIORITIES)[number] }> = (
    [
      { level: 1 as const, meta: TASK_PRIORITIES[1] },
      { level: 2 as const, meta: TASK_PRIORITIES[2] },
      { level: 3 as const, meta: TASK_PRIORITIES[3] },
      { level: 4 as const, meta: TASK_PRIORITIES[4] },
    ] as const
  ).filter((opt) => {
    if (!prioQuery) return true
    if (prioQuery === 'p') return true
    if (prioQuery === '!') return opt.level === 1 || opt.level === 2
    if (prioQuery === '!!') return opt.level === 2 || opt.level === 1
    if (prioQuery === 'p1') return opt.level === 1
    if (prioQuery === 'p2') return opt.level === 2
    if (prioQuery === 'p3') return opt.level === 3
    if (prioQuery === 'p4') return opt.level === 4
    return true
  })

  const chooseList = (list: ListRecord | null) => {
    if (list) setSelectedList(list)
    else setSelectedList({ id: 'new', name: hashQuery, user: user!.id } as ListRecord)
    setText(text.replace(/(?:^|\s)#[^\s]*$/, '').trimEnd() + ' ')
  }

  const chooseTag = (tag: TagRecord | null) => {
    if (tag) {
      if (
        !selectedTags.some(
          (t) => t.id === tag.id || t.name.toLowerCase() === tag.name.toLowerCase(),
        )
      ) {
        setSelectedTags((prev) => [...prev, tag])
      }
    } else {
      const newTagPlaceholder = {
        id: `new-${Date.now()}`,
        name: atQuery.slice(0, 30),
        user: user!.id,
        color: getNextTagColor(tags.length + selectedTags.length),
        created: '',
        updated: '',
        collectionId: 'tags',
        collectionName: 'tags',
      } as unknown as TagRecord
      if (
        !selectedTags.some((t) => t.name.toLowerCase() === newTagPlaceholder.name.toLowerCase())
      ) {
        setSelectedTags((prev) => [...prev, newTagPlaceholder])
      }
    }
    setText(text.replace(/(?:^|\s)@[^\s]*$/, '').trimEnd() + ' ')
  }

  const choosePriority = (level: TaskPriority) => {
    setPriorityOverride(level)
    // Remove o token digitado de prioridade (ex: p1, p2, !, !!) e acrescenta espaço
    setText(text.replace(/(?:^|\s)(?:p[1-4]?|!{1,2})$/i, '').trimEnd() + ' ')
    setActive(0)
  }

  const removeTag = (tagId: string) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId))
  }

  const submit = async () => {
    // 1. Limpar recorrência detectada em linguagem natural
    let title = cleanRecurrenceToken(text, parsedRecurrence)
    // 2. Limpar data detectada
    title = cleanDateToken(title, parsed)
    // 3. Limpar horário detectado
    if (parsedTime) {
      title = cleanTimeToken(title, parsedTime)
    }
    // 4. Limpar tokens de prioridade
    if (parsedPriority) {
      title = cleanPriorityToken(title, parsedPriority.token)
    }
    title = title
      .replace(/(?:^|\s)p[1-4](?=\s|$)/gi, ' ')
      .replace(/(?:^|\s)!+(?=\s|$)/g, ' ')
      .replace(/(?:^|\s)#[^\s]+/g, '')
      .replace(/(?:^|\s)@[^\s]+/g, '')
      .trim()

    if (!title) {
      toast({ title: 'Digite o título da tarefa.', variant: 'destructive' })
      return
    }

    // Resolver lista nova ou existente
    let list = selectedList
    if (list?.id === 'new') {
      list = await createList(list.name, user!.id)
      setLists((prev) => [...prev, list!])
    }

    // Resolver tags novas ou existentes
    const finalTagIds: string[] = []
    const updatedTagsList = [...tags]
    for (const tagItem of selectedTags) {
      if (tagItem.id.startsWith('new-')) {
        try {
          const created = await createTag({
            name: tagItem.name,
            user: user!.id,
            color: tagItem.color || getNextTagColor(updatedTagsList.length),
          })
          finalTagIds.push(created.id)
          updatedTagsList.push(created)
        } catch (err) {
          console.error('Erro ao criar etiqueta durante captura:', err)
        }
      } else {
        finalTagIds.push(tagItem.id)
      }
    }
    setTags(updatedTagsList)

    // Se o usuário digitou um horário ou recorrência diária sem data específica, assume hoje
    const effectiveDueDate = parsed
      ? toPocketDate(parsed.date)
      : effectiveTime || effectiveRecurrenceType !== 'none'
        ? toPocketDate(new Date())
        : ''

    await createTask({
      title,
      user: user!.id,
      list: list?.id || '',
      tags: finalTagIds,
      due_date: effectiveDueDate,
      due_time: effectiveTime || '',
      done: false,
      estimated_minutes: minutes,
      actual_minutes: 0,
      order: 0,
      priority: effectivePriority,
      recurrence_type: effectiveRecurrenceType,
      recurrence_interval: effectiveRecurrenceInterval,
      recurrence_weekdays:
        effectiveRecurrenceType === 'weekly_days' ? effectiveRecurrenceWeekdays : null,
      recurrence_mode: recurrenceMode,
    })

    const recurrenceSuffix =
      effectiveRecurrenceType !== 'none'
        ? ` · ${formatRecurrenceRule({
            recurrence_type: effectiveRecurrenceType,
            recurrence_interval: effectiveRecurrenceInterval,
            recurrence_weekdays: effectiveRecurrenceWeekdays,
            recurrence_mode: recurrenceMode,
            due_date: effectiveDueDate,
          })}`
        : ''
    const timeSuffix = effectiveTime ? ` às ${effectiveTime}` : ''
    const prioritySuffix = priorityMeta ? ` · ${priorityMeta.code}` : ''

    toast({
      title: `Tarefa capturada — ${parsed ? formatShortDate(parsed.date) : effectiveDueDate ? 'Hoje' : 'Inbox'}${timeSuffix}${prioritySuffix}${recurrenceSuffix}`,
    })
    setText('')
    setSelectedList(null)
    setSelectedTags([])
    setManualTime(null)
    setPriorityOverride(null)
    setIsPriorityPopoverOpen(false)
    setManualRecurrenceType(null)
    setRecurrenceInterval(1)
    setRecurrenceWeekdays([1, 3, 5])
    setRecurrenceMode('from_date')
    setIsRecurrencePopoverOpen(false)
    setMinutes(25)
    onCreated()
    setTimeout(() => input.current?.focus(), 0)
  }

  const key = (e: KeyboardEvent) => {
    if (isPrioAutocompleteOpen && priorityOptions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((active + 1) % priorityOptions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((active - 1 + priorityOptions.length) % priorityOptions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        choosePriority(priorityOptions[active].level)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setText(text.replace(/(?:^|\s)(?:p[1-4]?|!{1,2})$/i, ''))
      }
    } else if (isHashOpen && listOptions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((active + 1) % listOptions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((active - 1 + listOptions.length) % listOptions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        chooseList(listOptions[active])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setText(text.replace(/(?:^|\s)#[^\s]*$/, ''))
      }
    } else if (isAtOpen && tagOptions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((active + 1) % tagOptions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((active - 1 + tagOptions.length) % tagOptions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        chooseTag(tagOptions[active])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setText(text.replace(/(?:^|\s)@[^\s]*$/, ''))
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="capture-wrap">
      <div className="capture">
        <div className="capture-input">
          <input
            ref={input}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setActive(0)
            }}
            onKeyDown={key}
            placeholder="O que precisa ser feito? (@tag, #lista, p1–p4 ou !, amanhã...)"
          />
          {parsed && <span className="chip">{formatShortDate(parsed.date)}</span>}
          {priorityMeta && (
            <span
              className="chip priority-capture-chip inline-flex items-center gap-1 cursor-pointer"
              style={{
                borderColor: priorityMeta.borderColor,
                color: priorityMeta.color,
                backgroundColor: priorityMeta.bgSubtle,
              }}
              title={`Prioridade ${priorityMeta.code} (${priorityMeta.label}) — clique para alterar`}
              onClick={() => setIsPriorityPopoverOpen(!isPriorityPopoverOpen)}
            >
              <Flag className="w-2.5 h-2.5" />
              {priorityMeta.code}
              <X
                className="w-2.5 h-2.5 cursor-pointer opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  setPriorityOverride(0)
                  if (parsedPriority) {
                    setText(cleanPriorityToken(text, parsedPriority.token))
                  }
                }}
              />
            </span>
          )}
          {effectiveTime && (
            <span
              className="chip time-capture-chip inline-flex items-center gap-1"
              title="Horário identificado (clique no X para remover)"
            >
              <Clock className="w-2.5 h-2.5" />
              {effectiveTime}
              <X
                className="w-2.5 h-2.5 cursor-pointer opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  setManualTime('')
                }}
              />
            </span>
          )}
          {selectedList && (
            <span className="chip" title="Lista selecionada">
              #{selectedList.name}
            </span>
          )}
          {selectedTags.map((t) => (
            <span
              key={t.id}
              className="tag-chip inline-flex items-center gap-1"
              style={{
                borderColor: t.color,
                color: t.color,
                backgroundColor: `${t.color}14`,
              }}
              title="Etiqueta selecionada (clique para remover)"
              onClick={() => removeTag(t.id)}
            >
              <TagIcon className="w-2.5 h-2.5" />@{t.name}
              <X className="w-2.5 h-2.5 cursor-pointer opacity-70 hover:opacity-100" />
            </span>
          ))}
          {effectiveRecurrenceType !== 'none' && (
            <span
              className="tag-chip inline-flex items-center gap-1 cursor-pointer"
              style={{
                borderColor: '#C5A880',
                color: '#C5A880',
                backgroundColor: 'rgba(197, 168, 128, 0.12)',
              }}
              title="Recorrência ativa (clique para alterar)"
              onClick={() => setIsRecurrencePopoverOpen(!isRecurrencePopoverOpen)}
            >
              <Repeat className="w-2.5 h-2.5" />
              {effectiveRecurrenceType === 'daily' &&
                (effectiveRecurrenceInterval === 1 ? 'Diária' : `${effectiveRecurrenceInterval}d`)}
              {effectiveRecurrenceType === 'weekly' &&
                (effectiveRecurrenceInterval === 1
                  ? 'Semanal'
                  : `${effectiveRecurrenceInterval}sem`)}
              {effectiveRecurrenceType === 'weekly_days' && 'Dias da sem.'}
              {effectiveRecurrenceType === 'monthly' &&
                (effectiveRecurrenceInterval === 1 ? 'Mensal' : `${effectiveRecurrenceInterval}m`)}
              <X
                className="w-2.5 h-2.5 cursor-pointer opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  setManualRecurrenceType('none')
                  if (parsedRecurrence) {
                    setText(cleanRecurrenceToken(text, parsedRecurrence))
                  }
                }}
              />
            </span>
          )}
        </div>
        {/* Botão de prioridade na barra de captura */}
        <button
          type="button"
          className={`capture-action-trigger ${effectivePriority > 0 ? 'is-active' : ''}`}
          style={{
            borderColor: priorityMeta ? priorityMeta.borderColor : undefined,
            color: priorityMeta ? priorityMeta.color : undefined,
          }}
          title={
            priorityMeta
              ? `Prioridade ${priorityMeta.code} (${priorityMeta.label})`
              : 'Definir prioridade (P1–P4 ou !)'
          }
          onClick={() => {
            setIsPriorityPopoverOpen(!isPriorityPopoverOpen)
            setIsRecurrencePopoverOpen(false)
          }}
        >
          <Flag />
        </button>

        {/* Botão de recorrência rápida na barra de captura */}
        <button
          type="button"
          className={`capture-recurrence-trigger ${effectiveRecurrenceType !== 'none' ? 'is-active' : ''}`}
          title={
            effectiveRecurrenceType !== 'none'
              ? `Recorrência configurada: ${formatRecurrenceRule({
                  recurrence_type: effectiveRecurrenceType,
                  recurrence_interval: effectiveRecurrenceInterval,
                  recurrence_weekdays: effectiveRecurrenceWeekdays,
                  recurrence_mode: recurrenceMode,
                })}`
              : 'Configurar repetição da tarefa'
          }
          onClick={() => setIsRecurrencePopoverOpen(!isRecurrencePopoverOpen)}
        >
          <Repeat />
        </button>

        <div className="stepper">
          <button onClick={() => setMinutes(Math.max(5, minutes - 5))}>
            <Minus />
          </button>
          <span>{minutes} MIN</span>
          <button onClick={() => setMinutes(Math.min(240, minutes + 5))}>
            <Plus />
          </button>
        </div>
        <button className="send" onClick={submit} aria-label="Capturar tarefa">
          <ArrowRight />
        </button>
      </div>

      {/* Popover flutuante de Prioridade na captura rápida */}
      {isPriorityPopoverOpen && (
        <div className="capture-priority-popover">
          <div className="capture-popover-header">
            <span className="capture-popover-title">
              <Flag className="w-3.5 h-3.5 inline mr-1 text-[#C5A880]" />
              Prioridade da Tarefa
            </span>
            <button
              type="button"
              className="capture-popover-close"
              onClick={() => setIsPriorityPopoverOpen(false)}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="capture-priority-options">
            <button
              type="button"
              className={`capture-priority-pill ${effectivePriority === 0 ? 'active' : ''}`}
              onClick={() => {
                setPriorityOverride(0)
                setIsPriorityPopoverOpen(false)
              }}
            >
              Nenhuma
            </button>
            {([1, 2, 3, 4] as const).map((lvl) => {
              const meta = TASK_PRIORITIES[lvl]
              const isSelected = effectivePriority === lvl
              return (
                <button
                  key={lvl}
                  type="button"
                  className={`capture-priority-pill ${isSelected ? 'active' : ''}`}
                  style={{
                    borderColor: meta.borderColor,
                    color: isSelected ? '#090A0E' : meta.color,
                    backgroundColor: isSelected ? meta.color : meta.bgSubtle,
                  }}
                  onClick={() => {
                    setPriorityOverride(lvl)
                    setIsPriorityPopoverOpen(false)
                  }}
                >
                  <Flag className="w-3 h-3 inline mr-1" />
                  {meta.code} · {meta.label.split('·')[1]?.trim()}
                </button>
              )
            })}
          </div>
          <small className="capture-priority-hint">
            Dica: você também pode digitar <code>p1</code>, <code>p2</code>, <code>p3</code>,{' '}
            <code>p4</code> ou <code>!</code> no texto.
          </small>
        </div>
      )}

      {/* Popover flutuante de recorrência na captura rápida */}
      {isRecurrencePopoverOpen && (
        <div className="capture-recurrence-popover">
          <div className="capture-popover-header">
            <span className="capture-popover-title">
              <Repeat className="w-3.5 h-3.5 inline mr-1 text-[#C5A880]" />
              Repetir Tarefa
            </span>
            <button
              type="button"
              className="capture-popover-close"
              onClick={() => setIsRecurrencePopoverOpen(false)}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="capture-popover-types">
            {[
              { type: 'none', label: 'Nunca' },
              { type: 'daily', label: 'Diária' },
              { type: 'weekly', label: 'Semanal' },
              { type: 'weekly_days', label: 'Dias úteis' },
              { type: 'monthly', label: 'Mensal' },
            ].map((opt) => (
              <button
                key={opt.type}
                type="button"
                className={`capture-popover-pill ${effectiveRecurrenceType === opt.type ? 'active' : ''}`}
                onClick={() => {
                  setManualRecurrenceType(opt.type as RecurrenceType)
                  if (opt.type === 'weekly_days' && recurrenceWeekdays.length === 0) {
                    setRecurrenceWeekdays([1, 2, 3, 4, 5])
                  }
                  if (opt.type === 'none') {
                    setIsRecurrencePopoverOpen(false)
                  }
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {effectiveRecurrenceType !== 'none' && (
            <div className="capture-popover-body">
              <div className="capture-popover-row">
                <span className="text-xs text-[#a1a1aa]">A cada</span>
                <div className="recurrence-stepper mini">
                  <button
                    type="button"
                    onClick={() => setRecurrenceInterval(Math.max(1, recurrenceInterval - 1))}
                  >
                    −
                  </button>
                  <span>{recurrenceInterval}</span>
                  <button
                    type="button"
                    onClick={() => setRecurrenceInterval(recurrenceInterval + 1)}
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-[#a1a1aa]">
                  {effectiveRecurrenceType === 'daily' &&
                    (recurrenceInterval === 1 ? 'dia' : 'dias')}
                  {effectiveRecurrenceType === 'weekly' &&
                    (recurrenceInterval === 1 ? 'semana' : 'semanas')}
                  {effectiveRecurrenceType === 'weekly_days' && 'semanas'}
                  {effectiveRecurrenceType === 'monthly' &&
                    (recurrenceInterval === 1 ? 'mês' : 'meses')}
                </span>
              </div>

              {effectiveRecurrenceType === 'weekly_days' && (
                <div className="recurrence-weekdays-picker mini">
                  {[
                    { idx: 1, label: 'seg' },
                    { idx: 2, label: 'ter' },
                    { idx: 3, label: 'qua' },
                    { idx: 4, label: 'qui' },
                    { idx: 5, label: 'sex' },
                    { idx: 6, label: 'sáb' },
                    { idx: 0, label: 'dom' },
                  ].map((d) => {
                    const sel = effectiveRecurrenceWeekdays.includes(d.idx)
                    return (
                      <button
                        key={d.idx}
                        type="button"
                        className={`recurrence-day-btn ${sel ? 'selected' : ''}`}
                        onClick={() => {
                          const exists = recurrenceWeekdays.includes(d.idx)
                          if (exists) {
                            const next = recurrenceWeekdays.filter((x) => x !== d.idx)
                            setRecurrenceWeekdays(next.length ? next : [d.idx])
                          } else {
                            setRecurrenceWeekdays(
                              [...recurrenceWeekdays, d.idx].sort((a, b) => a - b),
                            )
                          }
                        }}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="capture-popover-mode">
                <button
                  type="button"
                  className={`capture-mode-btn ${recurrenceMode === 'from_date' ? 'active' : ''}`}
                  onClick={() => setRecurrenceMode('from_date')}
                >
                  Da data
                </button>
                <button
                  type="button"
                  className={`capture-mode-btn ${
                    recurrenceMode === 'from_completion' ? 'active' : ''
                  }`}
                  onClick={() => setRecurrenceMode('from_completion')}
                >
                  Da conclusão
                </button>
              </div>

              <button
                type="button"
                className="capture-popover-done-btn"
                onClick={() => setIsRecurrencePopoverOpen(false)}
              >
                Concluir
              </button>
            </div>
          )}
        </div>
      )}

      {/* Menu suspenso para Autocomplete de Prioridade (p1-p4, !) */}
      {isPrioAutocompleteOpen && (
        <div className="list-menu">
          {priorityOptions.length ? (
            priorityOptions.map((item, i) => (
              <button
                type="button"
                className={i === active ? 'active' : ''}
                key={item.level}
                onClick={() => choosePriority(item.level)}
                style={{
                  color: item.meta.color,
                }}
              >
                <Flag style={{ color: item.meta.color }} />
                <span>{item.meta.label}</span>
                <span className="capture-priority-menu-desc">
                  {item.meta.description.split('·')[1]?.trim() || item.meta.code}
                </span>
              </button>
            ))
          ) : (
            <span className="text-xs text-muted-foreground px-2 py-1">
              Nenhuma prioridade correspondente
            </span>
          )}
        </div>
      )}

      {/* Menu suspenso para # Listas */}
      {isHashOpen && (
        <div className="list-menu">
          {listOptions.length ? (
            listOptions.map((item, i) => (
              <button
                type="button"
                className={i === active ? 'active' : ''}
                key={item?.id || 'new'}
                onClick={() => chooseList(item)}
              >
                <Folder />
                {item ? item.name : `Criar lista '${hashQuery}'`}
              </button>
            ))
          ) : (
            <span className="text-xs text-muted-foreground px-2 py-1">
              Nenhuma lista encontrada
            </span>
          )}
        </div>
      )}

      {/* Menu suspenso para @ Etiquetas */}
      {isAtOpen && (
        <div className="list-menu">
          {tagOptions.length ? (
            tagOptions.map((item, i) => (
              <button
                type="button"
                className={i === active ? 'active' : ''}
                key={item?.id || 'new'}
                onClick={() => chooseTag(item)}
                style={{
                  color: item ? item.color : undefined,
                }}
              >
                <TagIcon
                  style={{
                    color: item ? item.color : getNextTagColor(tags.length + selectedTags.length),
                  }}
                />
                {item ? (
                  <span>@{item.name}</span>
                ) : (
                  <span>Criar etiqueta &apos;@{atQuery}&apos;</span>
                )}
              </button>
            ))
          ) : (
            <span className="text-xs text-muted-foreground px-2 py-1">
              Nenhuma etiqueta encontrada
            </span>
          )}
        </div>
      )}

      {/* Faixa de dicas de sintaxe em linguagem natural */}
      <div className="capture-hints-bar">
        <span className="capture-hint-item">
          <kbd>p1–p4 / !</kbd> prioridade
        </span>
        <span className="capture-hint-item">
          <kbd>@tag</kbd> etiqueta
        </span>
        <span className="capture-hint-item">
          <kbd>#lista</kbd> projeto
        </span>
        <span className="capture-hint-item">
          <kbd>todo dia / toda semana / todo dia 15</kbd> repetição
        </span>
        <span className="capture-hint-item">
          <kbd>12/11 · 15 de nov · em 3 dias · próx segunda</kbd> lembrete
        </span>
        <span className="capture-hint-item">
          <kbd>14:00 / às 9h30</kbd> horário
        </span>
      </div>
    </div>
  )
}
