// src/lib/mcp-server-parser.ts
// Lógica de parser e estruturas do servidor MCP (espelho do hook PocketBase para testes e validação client-side)

export interface ParsedServerRecurrence {
  type: 'daily' | 'weekly' | 'weekly_days' | 'monthly'
  interval: number
  day?: number
  weekdays?: number[]
  token: string
  start: number
  end: number
}

export interface ParsedServerDate {
  date: Date
  token: string
  start: number
  end: number
}

export interface ParsedServerTime {
  time: string
  token: string
  start: number
  end: number
}

export interface ParsedServerPriority {
  priority: number
  token: string
}

export interface CaptureTaskParsedResult {
  title: string
  dueDate: string | null
  dueTime: string | null
  priority: number
  recurrence: {
    type: string
    interval: number
    weekdays?: number[] | null
  } | null
  tags: string[]
  list: string | null
}

export const TAG_COLORS = [
  '#C5A880',
  '#8F9E82',
  '#7E92A2',
  '#B37D6B',
  '#9B6C7B',
  '#7D8899',
  '#BFA16F',
  '#7A8C80',
]

export function formatIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function normalize(value: string): string {
  if (!value) return ''
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function atNoon(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
}

const MONTHS_PT: Record<string, number> = {
  janeiro: 0,
  jan: 0,
  fevereiro: 1,
  fev: 1,
  marco: 2,
  mar: 2,
  abril: 3,
  abr: 3,
  maio: 4,
  mai: 4,
  junho: 5,
  jun: 5,
  julho: 6,
  jul: 6,
  agosto: 7,
  ago: 7,
  setembro: 8,
  set: 8,
  outubro: 9,
  out: 9,
  novembro: 10,
  nov: 10,
  dezembro: 11,
  dez: 11,
}

const WORD_NUMBERS: Record<string, number> = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  quinze: 15,
  vinte: 20,
  trinta: 30,
}

const WEEKDAY_INDEX: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
}

export function parseServerRecurrence(text: string): ParsedServerRecurrence | null {
  const clean = normalize(text)

  // 1. Mensal em dia específico: "todo dia 15", "todos os dias 15"
  const monthlyDayMatch = clean.match(
    /\b(?:todo|todos)\s+(?:os\s+)?dia(?:s)?\s+([1-9]|[12]\d|3[01])\b/,
  )
  if (monthlyDayMatch && monthlyDayMatch.index !== undefined) {
    return {
      type: 'monthly',
      interval: 1,
      day: Number(monthlyDayMatch[1]),
      token: text.slice(monthlyDayMatch.index, monthlyDayMatch.index + monthlyDayMatch[0].length),
      start: monthlyDayMatch.index,
      end: monthlyDayMatch.index + monthlyDayMatch[0].length,
    }
  }

  // 2. Dias úteis: "todos os dias uteis", "todo dia util", "dias uteis"
  const weekdaysMatch = clean.match(
    /\b(?:(?:todos?\s+(?:os\s+)?)?dia(?:s)?\s+uteis|todo\s+dia\s+util)\b/,
  )
  if (weekdaysMatch && weekdaysMatch.index !== undefined) {
    return {
      type: 'weekly_days',
      interval: 1,
      weekdays: [1, 2, 3, 4, 5],
      token: text.slice(weekdaysMatch.index, weekdaysMatch.index + weekdaysMatch[0].length),
      start: weekdaysMatch.index,
      end: weekdaysMatch.index + weekdaysMatch[0].length,
    }
  }

  // 3. Semanal com dias específicos: "toda segunda e quinta"
  const weekdayNamesRegex =
    /\b(?:tod[ao]s?\s+(?:as?\s+)?)(domingos?|segundas?(?:-feira)?|tercas?(?:-feira)?|quartas?(?:-feira)?|quintas?(?:-feira)?|sextas?(?:-feira)?|sabados?(?:-feira)?)(?:\s*(?:,|e)\s*(domingos?|segundas?(?:-feira)?|tercas?(?:-feira)?|quartas?(?:-feira)?|quintas?(?:-feira)?|sextas?(?:-feira)?|sabados?(?:-feira)?))*\b/
  const weekdayRecMatch = clean.match(weekdayNamesRegex)
  if (weekdayRecMatch && weekdayRecMatch.index !== undefined) {
    const rawMatched = weekdayRecMatch[0]
    const daysFound: number[] = []
    const dayItemRegex = /(domingo|segunda|terca|quarta|quinta|sexta|sabado)/g
    let m: RegExpExecArray | null = null
    while ((m = dayItemRegex.exec(rawMatched)) !== null) {
      const idx = WEEKDAY_INDEX[m[1]]
      if (idx !== undefined && !daysFound.includes(idx)) {
        daysFound.push(idx)
      }
    }
    if (daysFound.length > 0) {
      daysFound.sort((a, b) => a - b)
      return {
        type: 'weekly_days',
        interval: 1,
        weekdays: daysFound,
        token: text.slice(weekdayRecMatch.index, weekdayRecMatch.index + weekdayRecMatch[0].length),
        start: weekdayRecMatch.index,
        end: weekdayRecMatch.index + weekdayRecMatch[0].length,
      }
    }
  }

  // 4. "a cada N dias/semanas/meses"
  const everyNMatch = clean.match(
    /\ba\s+cada\s+(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta)\s+(dias?|semanas?|mes(?:es)?)\b/,
  )
  if (everyNMatch && everyNMatch.index !== undefined) {
    const rawQty = everyNMatch[1]
    const unit = everyNMatch[2]
    const count = /^\d+$/.test(rawQty) ? Number(rawQty) : WORD_NUMBERS[rawQty] || 1
    const recType = unit.startsWith('dia')
      ? 'daily'
      : unit.startsWith('semana')
        ? 'weekly'
        : 'monthly'
    return {
      type: recType,
      interval: Math.max(1, count),
      token: text.slice(everyNMatch.index, everyNMatch.index + everyNMatch[0].length),
      start: everyNMatch.index,
      end: everyNMatch.index + everyNMatch[0].length,
    }
  }

  // 5. Diária simples: "todo dia", "todos os dias", "diariamente"
  const dailyMatch = clean.match(/\b(?:todo\s+dia|todos\s+os\s+dias|diariamente)\b/)
  if (dailyMatch && dailyMatch.index !== undefined) {
    return {
      type: 'daily',
      interval: 1,
      token: text.slice(dailyMatch.index, dailyMatch.index + dailyMatch[0].length),
      start: dailyMatch.index,
      end: dailyMatch.index + dailyMatch[0].length,
    }
  }

  // 6. Semanal simples: "toda semana", "todas as semanas", "semanalmente"
  const weeklyMatch = clean.match(/\b(?:toda\s+semana|todas\s+as\s+semanas|semanalmente)\b/)
  if (weeklyMatch && weeklyMatch.index !== undefined) {
    return {
      type: 'weekly',
      interval: 1,
      token: text.slice(weeklyMatch.index, weeklyMatch.index + weeklyMatch[0].length),
      start: weeklyMatch.index,
      end: weeklyMatch.index + weeklyMatch[0].length,
    }
  }

  // 7. Mensal simples: "todo mes", "todos os meses", "mensalmente"
  const monthlyMatch = clean.match(/\b(?:todo\s+mes|todos\s+os\s+meses|mensalmente)\b/)
  if (monthlyMatch && monthlyMatch.index !== undefined) {
    return {
      type: 'monthly',
      interval: 1,
      token: text.slice(monthlyMatch.index, monthlyMatch.index + monthlyMatch[0].length),
      start: monthlyMatch.index,
      end: monthlyMatch.index + monthlyMatch[0].length,
    }
  }

  return null
}

export function parseServerDate(text: string, nowRef?: Date): ParsedServerDate | null {
  const clean = normalize(text)
  const baseNow = nowRef || new Date()
  const currentNoon = atNoon(baseNow)

  // 1. "depois de amanhã"
  const ddaMatch = clean.match(/\bdepois\s+de\s+amanha\b/)
  if (ddaMatch && ddaMatch.index !== undefined) {
    const d = new Date(currentNoon)
    d.setDate(d.getDate() + 2)
    return {
      date: d,
      token: text.slice(ddaMatch.index, ddaMatch.index + ddaMatch[0].length),
      start: ddaMatch.index,
      end: ddaMatch.index + ddaMatch[0].length,
    }
  }

  // 2. "amanhã"
  const amgMatch = clean.match(/\bamanha\b/)
  if (amgMatch && amgMatch.index !== undefined) {
    const d = new Date(currentNoon)
    d.setDate(d.getDate() + 1)
    return {
      date: d,
      token: text.slice(amgMatch.index, amgMatch.index + amgMatch[0].length),
      start: amgMatch.index,
      end: amgMatch.index + amgMatch[0].length,
    }
  }

  // 3. "hoje"
  const hojeMatch = clean.match(/\bhoje\b/)
  if (hojeMatch && hojeMatch.index !== undefined) {
    return {
      date: new Date(currentNoon),
      token: text.slice(hojeMatch.index, hojeMatch.index + hojeMatch[0].length),
      start: hojeMatch.index,
      end: hojeMatch.index + hojeMatch[0].length,
    }
  }

  // 4. "próxima/proxima <dia_da_semana>"
  const proxMatch = clean.match(
    /\bproxim[ao]\s+(domingo|segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado(?:-feira)?)\b/,
  )
  if (proxMatch && proxMatch.index !== undefined) {
    const dayKey = proxMatch[1].split('-')[0]
    const targetDay = WEEKDAY_INDEX[dayKey]
    const d = new Date(currentNoon)
    const currentDay = d.getDay()
    let delta = (targetDay - currentDay + 7) % 7
    if (delta === 0) delta = 7
    else delta += 7
    d.setDate(d.getDate() + delta)
    return {
      date: d,
      token: text.slice(proxMatch.index, proxMatch.index + proxMatch[0].length),
      start: proxMatch.index,
      end: proxMatch.index + proxMatch[0].length,
    }
  }

  // 5. Relativos: "em N dias/semanas/meses" ou "daqui a N dias/semanas/meses"
  const relRegex =
    /\b(?:daqui\s+(?:a\s+)?|em\s+)(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta)\s+(dias?|semanas?|mes(?:es)?)\b/
  const relMatch = clean.match(relRegex)
  if (relMatch && relMatch.index !== undefined) {
    const rawQty = relMatch[1]
    const unit = relMatch[2]
    const count = /^\d+$/.test(rawQty) ? Number(rawQty) : WORD_NUMBERS[rawQty] || 1
    const d = new Date(currentNoon)
    if (unit.startsWith('dia')) {
      d.setDate(d.getDate() + count)
    } else if (unit.startsWith('semana')) {
      d.setDate(d.getDate() + count * 7)
    } else if (unit.startsWith('mes')) {
      d.setMonth(d.getMonth() + count)
    }
    return {
      date: d,
      token: text.slice(relMatch.index, relMatch.index + relMatch[0].length),
      start: relMatch.index,
      end: relMatch.index + relMatch[0].length,
    }
  }

  // 6. Data numérica explícita: "dd/mm/aaaa" ou "dd/mm"
  const slashRegex = /\b([0-2]?\d|3[01])\/(0?\d|1[0-2])(?:\/(\d{4}))?\b/
  const slashMatch = clean.match(slashRegex)
  if (slashMatch && slashMatch.index !== undefined) {
    const day = Number(slashMatch[1])
    const month = Number(slashMatch[2]) - 1
    let year = slashMatch[3] ? Number(slashMatch[3]) : currentNoon.getFullYear()
    let d = new Date(year, month, day, 12, 0, 0)
    if (!slashMatch[3] && d < currentNoon) {
      year = currentNoon.getFullYear() + 1
      d = new Date(year, month, day, 12, 0, 0)
    }
    return {
      date: d,
      token: text.slice(slashMatch.index, slashMatch.index + slashMatch[0].length),
      start: slashMatch.index,
      end: slashMatch.index + slashMatch[0].length,
    }
  }

  // 7. Data explícita textual: "15 de novembro"
  const textDateRegex =
    /\b(?:dia\s+)?([0-2]?\d|3[01])\s+de\s+(janeiro|jan|fevereiro|fev|marco|mar|abril|abr|maio|mai|junho|jun|julho|jul|agosto|ago|setembro|set|outubro|out|novembro|nov|dezembro|dez)(?:\s+de\s+(\d{4}))?\b/
  const textDateMatch = clean.match(textDateRegex)
  if (textDateMatch && textDateMatch.index !== undefined) {
    const day = Number(textDateMatch[1])
    const monthName = textDateMatch[2]
    const month = MONTHS_PT[monthName] !== undefined ? MONTHS_PT[monthName] : 0
    let year = textDateMatch[3] ? Number(textDateMatch[3]) : currentNoon.getFullYear()
    let d = new Date(year, month, day, 12, 0, 0)
    if (!textDateMatch[3] && d < currentNoon) {
      year = currentNoon.getFullYear() + 1
      d = new Date(year, month, day, 12, 0, 0)
    }
    return {
      date: d,
      token: text.slice(textDateMatch.index, textDateMatch.index + textDateMatch[0].length),
      start: textDateMatch.index,
      end: textDateMatch.index + textDateMatch[0].length,
    }
  }

  // 8. Dia simples do mês: "dia 15"
  const dayOnlyRegex = /(?:^|\s)dia\s+([1-9]|[12]\d|3[01])\b/
  const dayOnlyMatch = clean.match(dayOnlyRegex)
  if (dayOnlyMatch && dayOnlyMatch.index !== undefined) {
    const matchIdx = dayOnlyMatch.index + (dayOnlyMatch[0].startsWith(' ') ? 1 : 0)
    const prefix = clean.slice(Math.max(0, matchIdx - 10), matchIdx).trim()
    if (!prefix.endsWith('todo') && !prefix.endsWith('todos')) {
      const day = Number(dayOnlyMatch[1])
      let d = new Date(currentNoon.getFullYear(), currentNoon.getMonth(), day, 12, 0, 0)
      if (d < currentNoon) {
        d = new Date(currentNoon.getFullYear(), currentNoon.getMonth() + 1, day, 12, 0, 0)
      }
      const tokenLen = dayOnlyMatch[0].trim().length
      return {
        date: d,
        token: text.slice(matchIdx, matchIdx + tokenLen),
        start: matchIdx,
        end: matchIdx + tokenLen,
      }
    }
  }

  // 9. Dia da semana simples: "segunda", "sábado" (próxima ocorrência)
  const weekdayRegex =
    /(?:^|\s)(domingo|segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado(?:-feira)?)\b/
  const weekdayMatch = clean.match(weekdayRegex)
  if (weekdayMatch && weekdayMatch.index !== undefined) {
    const matchIdx = weekdayMatch.index + (weekdayMatch[0].startsWith(' ') ? 1 : 0)
    const prefix = clean.slice(Math.max(0, matchIdx - 10), matchIdx).trim()
    if (
      !prefix.endsWith('toda') &&
      !prefix.endsWith('todo') &&
      !prefix.endsWith('todas') &&
      !prefix.endsWith('todos') &&
      !prefix.endsWith('proxima') &&
      !prefix.endsWith('proximo')
    ) {
      const dayKey = weekdayMatch[1].split('-')[0]
      const targetDay = WEEKDAY_INDEX[dayKey]
      const d = new Date(currentNoon)
      let delta = (targetDay - d.getDay() + 7) % 7
      if (delta === 0) delta = 7
      d.setDate(d.getDate() + delta)
      const tokenLen = weekdayMatch[1].length
      return {
        date: d,
        token: text.slice(matchIdx, matchIdx + tokenLen),
        start: matchIdx,
        end: matchIdx + tokenLen,
      }
    }
  }

  return null
}

export function parseServerTime(text: string): ParsedServerTime | null {
  const clean = normalize(text)

  const colonRegex = /\b(?:as\s+|as\s*)?([01]?\d|2[0-3]):([0-5]\d)\b/
  const colonMatch = clean.match(colonRegex)
  if (colonMatch && colonMatch.index !== undefined) {
    const hours = String(Number(colonMatch[1])).padStart(2, '0')
    const minutes = colonMatch[2]
    return {
      time: `${hours}:${minutes}`,
      token: text.slice(colonMatch.index, colonMatch.index + colonMatch[0].length),
      start: colonMatch.index,
      end: colonMatch.index + colonMatch[0].length,
    }
  }

  const hRegex = /\b(?:as\s+|as\s*)?([01]?\d|2[0-3])h([0-5]\d)?\b/
  const hMatch = clean.match(hRegex)
  if (hMatch && hMatch.index !== undefined) {
    const hours = String(Number(hMatch[1])).padStart(2, '0')
    const minutes = hMatch[2] ? hMatch[2] : '00'
    return {
      time: `${hours}:${minutes}`,
      token: text.slice(hMatch.index, hMatch.index + hMatch[0].length),
      start: hMatch.index,
      end: hMatch.index + hMatch[0].length,
    }
  }

  return null
}

export function parseServerPriority(text: string): ParsedServerPriority | null {
  const pMatch = text.match(/(?:^|\s)(p[1-4])(?:\s|$)/i)
  if (pMatch) {
    const num = parseInt(pMatch[1].toLowerCase().replace('p', ''), 10)
    if (num >= 1 && num <= 4) {
      return { priority: num, token: pMatch[1] }
    }
  }

  const exclMatch = text.match(/(?:^|\s)(!{1,3})(?:\s|$)/)
  if (exclMatch) {
    const marks = exclMatch[1].length
    const prio = marks === 1 ? 1 : marks === 2 ? 2 : 1
    return { priority: prio, token: exclMatch[1] }
  }

  return null
}

export function parseCaptureTaskInput(rawInput: string, nowRef?: Date): CaptureTaskParsedResult {
  const now = nowRef || new Date()
  const parsedRec = parseServerRecurrence(rawInput)
  const parsedDate = parseServerDate(rawInput, now)
  const parsedTime = parseServerTime(rawInput)
  const parsedPrio = parseServerPriority(rawInput)

  const listNamesFound: string[] = []
  const listRegex = /(?:^|\s)#([a-zA-Z0-9À-ÿ_-]+)/g
  let listMatch: RegExpExecArray | null = null
  while ((listMatch = listRegex.exec(rawInput)) !== null) {
    const lName = listMatch[1].trim()
    if (lName && !listNamesFound.includes(lName)) {
      listNamesFound.push(lName)
    }
  }

  const tagNamesFound: string[] = []
  const tagRegex = /(?:^|\s)@([a-zA-Z0-9À-ÿ_-]+)/g
  let tagMatch: RegExpExecArray | null = null
  while ((tagMatch = tagRegex.exec(rawInput)) !== null) {
    const tName = tagMatch[1].trim()
    if (tName && !tagNamesFound.includes(tName)) {
      tagNamesFound.push(tName)
    }
  }

  let cleanTitle = rawInput

  if (parsedRec && parsedRec.token) {
    cleanTitle = cleanTitle.replace(parsedRec.token, ' ')
  }
  if (parsedDate && parsedDate.token) {
    cleanTitle = cleanTitle.replace(parsedDate.token, ' ')
  }
  if (parsedTime && parsedTime.token) {
    cleanTitle = cleanTitle.replace(parsedTime.token, ' ')
  }
  if (parsedPrio && parsedPrio.token) {
    const escaped = parsedPrio.token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    cleanTitle = cleanTitle.replace(new RegExp(`(?:^|\\s)${escaped}(?=\\s|$)`, 'i'), ' ')
  }

  cleanTitle = cleanTitle
    .replace(/(?:^|\s)p[1-4](?=\s|$)/gi, ' ')
    .replace(/(?:^|\s)!+(?=\s|$)/g, ' ')
    .replace(/(?:^|\s)#[a-zA-Z0-9À-ÿ_-]+/g, ' ')
    .replace(/(?:^|\s)@[a-zA-Z0-9À-ÿ_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanTitle) {
    cleanTitle = 'Nova tarefa'
  }

  let effectiveDueDateStr: string | null = null
  if (parsedDate) {
    effectiveDueDateStr = formatIsoDate(parsedDate.date)
  } else if (parsedTime || parsedRec) {
    effectiveDueDateStr = formatIsoDate(now)
  }

  return {
    title: cleanTitle,
    dueDate: effectiveDueDateStr,
    dueTime: parsedTime ? parsedTime.time : null,
    priority: parsedPrio ? parsedPrio.priority : 0,
    recurrence: parsedRec
      ? {
          type: parsedRec.type,
          interval: parsedRec.interval,
          weekdays: parsedRec.weekdays || null,
        }
      : null,
    tags: tagNamesFound,
    list: listNamesFound.length > 0 ? listNamesFound[0] : null,
  }
}
