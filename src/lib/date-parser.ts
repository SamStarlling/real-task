export type ParsedDate = { date: Date; token: string; start: number; end: number }
export type ParsedTime = { time: string; token: string; start: number; end: number } // time no formato HH:MM

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
const atNoon = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)

export function parsePortugueseDate(text: string, now = new Date()): ParsedDate | null {
  const clean = normalize(text)
  const patterns: Array<{ regex: RegExp; resolve: (match: RegExpMatchArray) => Date }> = [
    {
      regex: /\bdepois\s+de\s+amanha\b/,
      resolve: () => {
        const d = atNoon(now)
        d.setDate(d.getDate() + 2)
        return d
      },
    },
    {
      regex: /\bamanha\b/,
      resolve: () => {
        const d = atNoon(now)
        d.setDate(d.getDate() + 1)
        return d
      },
    },
    { regex: /\bhoje\b/, resolve: () => atNoon(now) },
    {
      regex: /\bdia\s+([1-9]|[12]\d|3[01])\b/,
      resolve: (m) => {
        const day = Number(m[1])
        let d = new Date(now.getFullYear(), now.getMonth(), day, 12)
        if (d < atNoon(now)) d = new Date(now.getFullYear(), now.getMonth() + 1, day, 12)
        return d
      },
    },
  ]
  for (const item of patterns) {
    const match = clean.match(item.regex)
    if (match?.index !== undefined)
      return {
        date: item.resolve(match),
        token: text.slice(match.index, match.index + match[0].length),
        start: match.index,
        end: match.index + match[0].length,
      }
  }
  const weekdays: Record<string, number> = {
    domingo: 0,
    segunda: 1,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sabado: 6,
  }
  const match = clean.match(
    /\b(domingo(?:-feira)?|segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado(?:-feira)?)\b/,
  )
  if (match?.index !== undefined) {
    const target = weekdays[match[1].split('-')[0]]
    const d = atNoon(now)
    let delta = (target - d.getDay() + 7) % 7
    if (delta === 0) delta = 7
    d.setDate(d.getDate() + delta)
    return {
      date: d,
      token: text.slice(match.index, match.index + match[0].length),
      start: match.index,
      end: match.index + match[0].length,
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

  // Padrão 1: "às/as HH:MM" ou "às/as H:MM" ou "HH:MM" (com dois pontos)
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
