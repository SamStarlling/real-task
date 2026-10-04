import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowRight, Folder, Minus, Plus } from 'lucide-react'
import { cleanDateToken, parsePortugueseDate, toPocketDate } from '@/lib/date-parser'
import { formatShortDate } from '@/lib/format'
import { createList, createTask, getLists } from '@/services/data'
import type { ListRecord } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

export function CaptureBar({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [minutes, setMinutes] = useState(25)
  const [lists, setLists] = useState<ListRecord[]>([])
  const [selected, setSelected] = useState<ListRecord | null>(null)
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    getLists().then(setLists)
  }, [])
  const parsed = parsePortugueseDate(text)
  const hash = text.match(/(?:^|\s)#([^\s]*)$/)
  const query = hash?.[1] || ''
  const matches = lists.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
  const options =
    query && !matches.some((l) => l.name.toLowerCase() === query.toLowerCase())
      ? [null, ...matches]
      : matches
  const choose = (list: ListRecord | null) => {
    if (list) setSelected(list)
    else setSelected({ id: 'new', name: query, user: user!.id } as ListRecord)
    setText(text.replace(/(?:^|\s)#[^\s]*$/, '').trimEnd() + ' ')
  }
  const submit = async () => {
    let title = cleanDateToken(text, parsed)
      .replace(/(?:^|\s)#[^\s]+/g, '')
      .trim()
    if (!title) {
      toast({ title: 'Digite o título da tarefa.', variant: 'destructive' })
      return
    }
    let list = selected
    if (list?.id === 'new') list = await createList(list.name, user!.id)
    await createTask({
      title,
      user: user!.id,
      list: list?.id || '',
      due_date: parsed ? toPocketDate(parsed.date) : '',
      done: false,
      estimated_minutes: minutes,
      actual_minutes: 0,
      order: 0,
    })
    toast({ title: `Tarefa capturada — ${parsed ? formatShortDate(parsed.date) : 'Inbox'}` })
    setText('')
    setSelected(null)
    setMinutes(25)
    onCreated()
    setTimeout(() => input.current?.focus(), 0)
  }
  const key = (e: KeyboardEvent) => {
    if (options.length && hash) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((active + 1) % options.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((active - 1 + options.length) % options.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        choose(options[active])
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
            placeholder="O que precisa ser feito? (ex.: Revisar contrato amanhã)"
          />
          {parsed && <span className="chip">{formatShortDate(parsed.date)}</span>}
          {selected && <span className="chip">#{selected.name}</span>}
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
      {hash && (
        <div className="list-menu">
          {options.length ? (
            options.map((item, i) => (
              <button
                className={i === active ? 'active' : ''}
                key={item?.id || 'new'}
                onClick={() => choose(item)}
              >
                <Folder />
                {item ? item.name : `Criar lista '${query}'`}
              </button>
            ))
          ) : (
            <span>Nenhuma lista encontrada</span>
          )}
        </div>
      )}
    </div>
  )
}
