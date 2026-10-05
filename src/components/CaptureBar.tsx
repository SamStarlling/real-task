import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowRight, Folder, Minus, Plus, Tag as TagIcon, X } from 'lucide-react'
import { cleanDateToken, parsePortugueseDate, toPocketDate } from '@/lib/date-parser'
import { formatShortDate } from '@/lib/format'
import {
  createList,
  createTag,
  createTask,
  getLists,
  getNextTagColor,
  getTags,
} from '@/services/data'
import type { ListRecord, TagRecord } from '@/types'
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
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      getLists().then(setLists)
      getTags().then(setTags)
    }
  }, [user])

  const parsed = parsePortugueseDate(text)

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

    await createTask({
      title,
      user: user!.id,
      list: list?.id || '',
      tags: finalTagIds,
      due_date: parsed ? toPocketDate(parsed.date) : '',
      done: false,
      estimated_minutes: minutes,
      actual_minutes: 0,
      order: 0,
    })

    toast({ title: `Tarefa capturada — ${parsed ? formatShortDate(parsed.date) : 'Inbox'}` })
    setText('')
    setSelectedList(null)
    setSelectedTags([])
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
            placeholder="O que precisa ser feito? (@tag, #lista, amanhã...)"
          />
          {parsed && <span className="chip">{formatShortDate(parsed.date)}</span>}
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
        </div>
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
