export type ParsedDate = { date: Date; token: string; start: number; end: number }
export type ParsedTime = { time: string; token: string; start: number; end: number } // time no formato HH:MM
export type ParsedRecurrence = {
  type: 'daily' | 'weekly' | 'weekly_days' | 'monthly'
  interval: number
  weekdays?: number[] | null
  token: string
  start: number
  end: number
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const atNoon = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)

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

/**
 * Reconhece datas em português do Brasil:
 * - "depois de amanhã", "amanhã", "hoje"
 * - Relativos com "em / daqui a": "em 3 dias", "daqui a duas semanas", "daqui 5 dias", "em 1 mes"
 * - "próxima segunda" / "proxima sexta" (salto obrigatório para a próxima semana — nunca a atual)
 * - Dias da semana isolados: "segunda", "terça-feira", etc. (próxima ocorrência)
 * - Data explícita: "12/11", "12/11/2025", "15 de novembro", "dia 15 de novembro"
 * - Dia simples: "dia 15"
 */
export function parsePortugueseDate(text: string, now = new Date()): ParsedDate | null {
  const clean = normalize(text)
  const currentNoon = atNoon(now)

  // 1. "depois de amanhã"
  const ddaMatch = clean.match(/\bdepois\s+de\s+amanha\b/)
  if (ddaMatch?.index !== undefined) {
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
  if (amgMatch?.index !== undefined) {
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
  if (hojeMatch?.index !== undefined) {
    return {
      date: new Date(currentNoon),
      token: text.slice(hojeMatch.index, hojeMatch.index + hojeMatch[0].length),
      start: hojeMatch.index,
      end: hojeMatch.index + hojeMatch[0].length,
    }
  }

  // 4. "próxima/proxima <dia_da_semana>"
  // REGRA: resolver para a SEGUNDA-FEIRA SEGUINTE (semana que vem), nunca a atual.
  const proxMatch = clean.match(
    /\bproxim[ao]\s+(domingo|segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado(?:-feira)?)\b/,
  )
  if (proxMatch?.index !== undefined) {
    const dayKey = proxMatch[1].split('-')[0]
    const targetDay = WEEKDAY_INDEX[dayKey]
    const d = new Date(currentNoon)
    const currentDay = d.getDay()
    let delta = (targetDay - currentDay + 7) % 7
    // Se delta == 0 (é hoje), ou mesmo que caia nesta mesma semana, "próxima" exige pular para a próxima semana
    // Portanto se delta <= 0, delta = 7. Para garantir que é a semana seguinte sempre:
    if (delta === 0) {
      delta = 7
    } else {
      // Avança mais 7 dias para garantir que cai na semana seguinte se cair nesta
      delta += 7
    }
    d.setDate(d.getDate() + delta)
    return {
      date: d,
      token: text.slice(proxMatch.index, proxMatch.index + proxMatch[0].length),
      start: proxMatch.index,
      end: proxMatch.index + proxMatch[0].length,
    }
  }

  // 5. Relativos: "em N dias/semanas/meses" ou "daqui a N dias/semanas/meses" (com ou sem 'a')
  // Suporta números dígitos (1..99) e palavras ("duas semanas", "tres dias", etc.)
  const relRegex =
    /\b(?:daqui\s+(?:a\s+)?|em\s+)(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta)\s+(dias?|semanas?|mes(?:es)?)\b/
  const relMatch = clean.match(relRegex)
  if (relMatch?.index !== undefined) {
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

  // 6. Data explícita numérica: "dd/mm/aaaa" ou "dd/mm" (ex: "12/11", "12/11/2025")
  const slashRegex = /\b([0-2]?\d|3[01])\/(0?\d|1[0-2])(?:\/(\d{4}))?\b/
  const slashMatch = clean.match(slashRegex)
  if (slashMatch?.index !== undefined) {
    const day = Number(slashMatch[1])
    const month = Number(slashMatch[2]) - 1 // 0-indexed
    let year = slashMatch[3] ? Number(slashMatch[3]) : currentNoon.getFullYear()
    let d = new Date(year, month, day, 12)
    // Se o ano não foi fornecido e a data calculada já passou hoje, projeta para o próximo ano
    if (!slashMatch[3] && d < currentNoon) {
      year = currentNoon.getFullYear() + 1
      d = new Date(year, month, day, 12)
    }
    return {
      date: d,
      token: text.slice(slashMatch.index, slashMatch.index + slashMatch[0].length),
      start: slashMatch.index,
      end: slashMatch.index + slashMatch[0].length,
    }
  }

  // 7. Data explícita textual: "(dia )?15 de novembro (de 2025)?"
  const textDateRegex =
    /\b(?:dia\s+)?([0-2]?\d|3[01])\s+de\s+(janeiro|jan|fevereiro|fev|marco|mar|abril|abr|maio|mai|junho|jun|julho|jul|agosto|ago|setembro|set|outubro|out|novembro|nov|dezembro|dez)(?:\s+de\s+(\d{4}))?\b/
  const textDateMatch = clean.match(textDateRegex)
  if (textDateMatch?.index !== undefined) {
    const day = Number(textDateMatch[1])
    const monthName = textDateMatch[2]
    const month = MONTHS_PT[monthName] ?? 0
    let year = textDateMatch[3] ? Number(textDateMatch[3]) : currentNoon.getFullYear()
    let d = new Date(year, month, day, 12)
    if (!textDateMatch[3] && d < currentNoon) {
      year = currentNoon.getFullYear() + 1
      d = new Date(year, month, day, 12)
    }
    return {
      date: d,
      token: text.slice(textDateMatch.index, textDateMatch.index + textDateMatch[0].length),
      start: textDateMatch.index,
      end: textDateMatch.index + textDateMatch[0].length,
    }
  }

  // 8. Dia simples do mês: "dia 15"
  // ATENÇÃO: NÃO casar se for antecedido por "todo" ("todo dia 15" é recorrência mensal!)
  const dayOnlyRegex = /(?<!\btodo\s+)\bdia\s+([1-9]|[12]\d|3[01])\b/
  const dayOnlyMatch = clean.match(dayOnlyRegex)
  if (dayOnlyMatch?.index !== undefined) {
    const day = Number(dayOnlyMatch[1])
    let d = new Date(currentNoon.getFullYear(), currentNoon.getMonth(), day, 12)
    if (d < currentNoon) {
      d = new Date(currentNoon.getFullYear(), currentNoon.getMonth() + 1, day, 12)
    }
    return {
      date: d,
      token: text.slice(dayOnlyMatch.index, dayOnlyMatch.index + dayOnlyMatch[0].length),
      start: dayOnlyMatch.index,
      end: dayOnlyMatch.index + dayOnlyMatch[0].length,
    }
  }

  // 9. Dia da semana simples: "segunda", "terça-feira", "sábado"
  // ATENÇÃO: NÃO casar se for antecedido por "toda" ou "todo" ("toda segunda" é recorrência!)
  const weekdayRegex =
    /(?<!\bto[da]s?\s+)\b(domingo|segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado(?:-feira)?)\b/
  const weekdayMatch = clean.match(weekdayRegex)
  if (weekdayMatch?.index !== undefined) {
    const dayKey = weekdayMatch[1].split('-')[0]
    const targetDay = WEEKDAY_INDEX[dayKey]
    const d = new Date(currentNoon)
    let delta = (targetDay - d.getDay() + 7) % 7
    if (delta === 0) delta = 7
    d.setDate(d.getDate() + delta)
    return {
      date: d,
      token: text.slice(weekdayMatch.index, weekdayMatch.index + weekdayMatch[0].length),
      start: weekdayMatch.index,
      end: weekdayMatch.index + weekdayMatch[0].length,
    }
  }

  return null
}

export const cleanDateToken = (text: string, parsed: ParsedDate | null) =>
  parsed
    ? `${text.slice(0, parsed.start)} ${text.slice(parsed.end)}`.replace(/\s+/g, ' ').trim()
    : text.trim()

export const toPocketDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 12:00:00.000Z`

export const localDay = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/**
 * Reconhece horário em português do Brasil:
 * - "14:30", "09:00", "9:00"
 * - "às 14:30", "as 9h30", "às 9h"
 * - "14h30", "14h", "9h", "18h00"
 * Retorna HH:MM normalizado (24 horas) e o token para remoção do texto da tarefa.
 */
export function parsePortugueseTime(text: string): ParsedTime | null {
  const clean = normalize(text)

  // Padrão 1: "às/as HH:MM" ou "HH:MM" (com dois pontos)
  const colonRegex = /\b(?:as\s+|as\s*)?([01]?\d|2[0-3]):([0-5]\d)\b/
  const colonMatch = clean.match(colonRegex)
  if (colonMatch?.index !== undefined) {
    const hours = String(Number(colonMatch[1])).padStart(2, '0')
    const minutes = colonMatch[2]
    return {
      time: `${hours}:${minutes}`,
      token: text.slice(colonMatch.index, colonMatch.index + colonMatch[0].length),
      start: colonMatch.index,
      end: colonMatch.index + colonMatch[0].length,
    }
  }

  // Padrão 2: "às/as 9h30", "14h30", "9h", "18h", "às 18h"
  const hRegex = /\b(?:as\s+|as\s*)?([01]?\d|2[0-3])h([0-5]\d)?\b/
  const hMatch = clean.match(hRegex)
  if (hMatch?.index !== undefined) {
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

export const cleanTimeToken = (text: string, parsed: ParsedTime | null) =>
  parsed
    ? `${text.slice(0, parsed.start)} ${text.slice(parsed.end)}`.replace(/\s+/g, ' ').trim()
    : text.trim()

/**
 * Reconhece expressões de recorrência em português do Brasil:
 * - "todo dia", "todos os dias", "diariamente" → daily (interval: 1)
 * - "a cada N dias" → daily (interval: N)
 * - "toda semana", "todas as semanas", "semanalmente" → weekly (interval: 1)
 * - "a cada N semanas" → weekly (interval: N)
 * - "toda segunda", "toda terça-feira", "toda quarta e sexta"... → weekly_days
 * - "todo dia 15", "todo dia 1º", "todo dia 1" → monthly (com dia fixo deduzível)
 * - "todo mês", "todos os meses", "mensalmente" → monthly (interval: 1)
 * - "a cada N meses" → monthly (interval: N)
 *
 * Cuidados com ambiguidade:
 * - "todo dia 15" DEVE ser avaliado antes de "todo dia" para não fragmentar o token.
 * - "toda segunda" DEVE ser weekly_days com weekdays=[1].
 * - "todos os dias úteis" / "dias úteis" → weekly_days [1,2,3,4,5]
 */
export function parsePortugueseRecurrence(text: string): ParsedRecurrence | null {
  const clean = normalize(text)

  // 1. Mensal em dia específico: "todo(s)? (os )?dia(s)? N" (ex: "todo dia 15", "todo dia 1", "todo dia 31")
  const monthlyDayMatch = clean.match(
    /\b(?:todo|todos)\s+(?:os\s+)?dia(?:s)?\s+([1-9]|[12]\d|3[01])\b/,
  )
  if (monthlyDayMatch?.index !== undefined) {
    return {
      type: 'monthly',
      interval: 1,
      token: text.slice(monthlyDayMatch.index, monthlyDayMatch.index + monthlyDayMatch[0].length),
      start: monthlyDayMatch.index,
      end: monthlyDayMatch.index + monthlyDayMatch[0].length,
    }
  }

  // 2. Dias úteis: "todos os dias uteis", "todo dia util", "dias uteis"
  const weekdaysMatch = clean.match(
    /\b(?:(?:todos?\s+(?:os\s+)?)?dia(?:s)?\s+uteis|todo\s+dia\s+util)\b/,
  )
  if (weekdaysMatch?.index !== undefined) {
    return {
      type: 'weekly_days',
      interval: 1,
      weekdays: [1, 2, 3, 4, 5],
      token: text.slice(weekdaysMatch.index, weekdaysMatch.index + weekdaysMatch[0].length),
      start: weekdaysMatch.index,
      end: weekdaysMatch.index + weekdaysMatch[0].length,
    }
  }

  // 3. Semanal com dia(s) específico(s): "toda segunda", "todas as quartas", "todo domingo", "toda sexta-feira"
  // Permite combinações simples como "toda terca e quinta", "toda segunda, quarta e sexta"
  const weekdayNamesRegex =
    /\b(?:tod[ao]s?\s+(?:as?\s+)?)(domingos?|segundas?(?:-feira)?|tercas?(?:-feira)?|quartas?(?:-feira)?|quintas?(?:-feira)?|sextas?(?:-feira)?|sabados?(?:-feira)?)(?:\s*(?:,|e)\s*(domingos?|segundas?(?:-feira)?|tercas?(?:-feira)?|quartas?(?:-feira)?|quintas?(?:-feira)?|sextas?(?:-feira)?|sabados?(?:-feira)?))*\b/
  const weekdayRecMatch = clean.match(weekdayNamesRegex)
  if (weekdayRecMatch?.index !== undefined) {
    const rawMatched = weekdayRecMatch[0]
    // Extrai todos os dias mencionados
    const daysFound: number[] = []
    const dayItemRegex = /(domingo|segunda|terca|quarta|quinta|sexta|sabado)/g
    let m: RegExpExecArray | null
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
  if (everyNMatch?.index !== undefined) {
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

  // 5. Diária: "todo dia", "todos os dias", "diariamente"
  const dailyMatch = clean.match(/\b(?:todo\s+dia|todos\s+os\s+dias|diariamente)\b/)
  if (dailyMatch?.index !== undefined) {
    return {
      type: 'daily',
      interval: 1,
      token: text.slice(dailyMatch.index, dailyMatch.index + dailyMatch[0].length),
      start: dailyMatch.index,
      end: dailyMatch.index + dailyMatch[0].length,
    }
  }

  // 6. Semanal: "toda semana", "todas as semanas", "semanalmente"
  const weeklyMatch = clean.match(/\b(?:toda\s+semana|todas\s+as\s+semanas|semanalmente)\b/)
  if (weeklyMatch?.index !== undefined) {
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
  if (monthlyMatch?.index !== undefined) {
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

export const cleanRecurrenceToken = (text: string, parsed: ParsedRecurrence | null) =>
  parsed
    ? `${text.slice(0, parsed.start)} ${text.slice(parsed.end)}`.replace(/\s+/g, ' ').trim()
    : text.trim()
