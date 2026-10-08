import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowRight, Clock, Folder, Minus, Plus, Repeat, Tag as TagIcon, X } from 'lucide-react'
import {
  cleanDateToken,
  cleanTimeToken,
  localDay,
  parsePortugueseDate,
  parsePortugueseTime,
  toPocketDate,
} from '@/lib/date-parser'
import { formatShortDate } from '@/lib/format'
import {
  createList,
  createTag,
  createTask,
  formatRecurrenceRule,
  getLists,
  getNextTagColor,
  getTags,
} from '@/services/data'
import type { ListRecord, RecurrenceMode, RecurrenceType, TagRecord } from '@/types'
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
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([1, 3, 5])
  const [recurrenceMode, setRecurrenceMode] = useState<RecurrenceMode>('from_date')
  const [isRecurrencePopoverOpen, setIsRecurrencePopoverOpen] = useState(false)
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
  const effectiveTime = manualTime !== null ? manualTime : parsedTime?.time || null

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

  const removeTag = (tagId: string) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId))
  }

  const submit = async () => {
    let title = cleanDateToken(text, parsed)
    if (parsedTime) {
      title = cleanTimeToken(title, parsedTime)
    }
    title = title
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

    // Se o usuário digitou um horário mas nenhuma data específica, assume hoje
    const effectiveDueDate = parsed
      ? toPocketDate(parsed.date)
      : effectiveTime
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
      recurrence_type: recurrenceType,
      recurrence_interval: recurrenceInterval,
      recurrence_weekdays: recurrenceType === 'weekly_days' ? recurrenceWeekdays : null,
      recurrence_mode: recurrenceMode,
    })

    const recurrenceSuffix =
      recurrenceType !== 'none'
        ? ` · ${formatRecurrenceRule({
            recurrence_type: recurrenceType,
            recurrence_interval: recurrenceInterval,
            recurrence_weekdays: recurrenceWeekdays,
            recurrence_mode: recurrenceMode,
            due_date: parsed ? toPocketDate(parsed.date) : '',
          })}`
        : ''
    const timeSuffix = effectiveTime ? ` às ${effectiveTime}` : ''

    toast({
      title: `Tarefa capturada — ${parsed ? formatShortDate(parsed.date) : effectiveTime ? 'Hoje' : 'Inbox'}${timeSuffix}${recurrenceSuffix}`,
    })
    setText('')
    setSelectedList(null)
    setSelectedTags([])
    setManualTime(null)
    setRecurrenceType('none')
    setRecurrenceInterval(1)
    setRecurrenceWeekdays([1, 3, 5])
    setRecurrenceMode('from_date')
    setIsRecurrencePopoverOpen(false)
    setMinutes(25)
    onCreated()
    setTimeout(() => input.current?.focus(), 0)
  }

  const key = (e: KeyboardEvent) => {
    if (isHashOpen && listOptions.length) {
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
            placeholder="O que precisa ser feito? (@tag, #lista, amanhã... ex: #Trabalho)"
          />
          {parsed && <span className="chip">{formatShortDate(parsed.date)}</span>}
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
          {recurrenceType !== 'none' && (
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
              {recurrenceType === 'daily' &&
                (recurrenceInterval === 1 ? 'Diária' : `${recurrenceInterval}d`)}
              {recurrenceType === 'weekly' &&
                (recurrenceInterval === 1 ? 'Semanal' : `${recurrenceInterval}sem`)}
              {recurrenceType === 'weekly_days' && 'Dias da sem.'}
              {recurrenceType === 'monthly' &&
                (recurrenceInterval === 1 ? 'Mensal' : `${recurrenceInterval}m`)}
              <X
                className="w-2.5 h-2.5 cursor-pointer opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  setRecurrenceType('none')
                }}
              />
            </span>
          )}
        </div>
        {/* Botão de recorrência rápida na barra de captura */}
        <button
          type="button"
          className={`capture-recurrence-trigger ${recurrenceType !== 'none' ? 'is-active' : ''}`}
          title={
            recurrenceType !== 'none'
              ? `Recorrência configurada: ${formatRecurrenceRule({
                  recurrence_type: recurrenceType,
                  recurrence_interval: recurrenceInterval,
                  recurrence_weekdays: recurrenceWeekdays,
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
                className={`capture-popover-pill ${recurrenceType === opt.type ? 'active' : ''}`}
                onClick={() => {
                  setRecurrenceType(opt.type as RecurrenceType)
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

          {recurrenceType !== 'none' && (
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
                  {recurrenceType === 'daily' && (recurrenceInterval === 1 ? 'dia' : 'dias')}
                  {recurrenceType === 'weekly' && (recurrenceInterval === 1 ? 'semana' : 'semanas')}
                  {recurrenceType === 'weekly_days' && 'semanas'}
                  {recurrenceType === 'monthly' && (recurrenceInterval === 1 ? 'mês' : 'meses')}
                </span>
              </div>

              {recurrenceType === 'weekly_days' && (
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
                    const sel = recurrenceWeekdays.includes(d.idx)
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

      {/* Menu suspenso para # Listas */}
      {isHashOpen && (
        <div className="list-menu">
          {listOptions.length ? (
            listOptions.map((item, i) => (
              <button
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
    </div>
  )
}
