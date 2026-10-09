import type { SessionRecord } from '@/types'
import { localDay } from '@/lib/date-parser'

export interface DailyFocusSummary {
  dateStr: string // "YYYY-MM-DD"
  totalMinutes: number
  sessionsCount: number
}

export interface BestDayStats {
  todayStr: string
  todayMinutes: number
  bestDay: DailyFocusSummary | null
  isTodayRecord: boolean
  minutesRemainingToBeat: number
  bestDayOf14Days: DailyFocusSummary | null
  weekdayComparison: {
    weekdayKey: string
    weekdayName: string
    averageMinutes: number
    recordMinutes: number
    totalDaysCount: number
  } | null
}

const WEEKDAY_NAMES = ['Domingos', 'Segundas', 'Terças', 'Quartas', 'Quintas', 'Sextas', 'Sábados']

/**
 * Soma minutos de foco agrupados por session_date ("YYYY-MM-DD").
 * Mantém consistência com o restante do app Barbosa System:
 * soma a duração de todas as sessões registradas no histórico.
 */
export function aggregateSessionsByDay(
  sessions: SessionRecord[],
): Map<string, { totalMinutes: number; sessionsCount: number }> {
  const map = new Map<string, { totalMinutes: number; sessionsCount: number }>()

  for (const s of sessions) {
    const rawDate = s.session_date ? s.session_date.slice(0, 10) : s.started_at.slice(0, 10)
    const dur = Number(s.duration_minutes) || 0
    const prev = map.get(rawDate) || { totalMinutes: 0, sessionsCount: 0 }
    map.set(rawDate, {
      totalMinutes: prev.totalMinutes + dur,
      sessionsCount: prev.sessionsCount + 1,
    })
  }

  return map
}

/**
 * Calcula os recordes de foco do usuário:
 * - Melhor dia absoluto de todo o histórico registrado
 * - Comparação de hoje com o recorde absoluto
 * - Melhor dia dentro da janela dos 14 dias exibidos no histograma
 * - Média e recorde do mesmo dia da semana histórico (ex: "Suas segundas: Média 1h 40m · Recorde 2h 30m")
 */
export function computeBestDayStats(
  sessions: SessionRecord[],
  referenceDate: Date = new Date(),
): BestDayStats {
  const todayStr = localDay(referenceDate)
  const dayMap = aggregateSessionsByDay(sessions)

  const todayData = dayMap.get(todayStr) || { totalMinutes: 0, sessionsCount: 0 }
  const todayMinutes = todayData.totalMinutes

  let bestDay: DailyFocusSummary | null = null

  // Identifica o dia com maior volume de foco
  for (const [dateStr, data] of dayMap.entries()) {
    if (data.totalMinutes <= 0) continue

    if (!bestDay || data.totalMinutes > bestDay.totalMinutes) {
      bestDay = {
        dateStr,
        totalMinutes: data.totalMinutes,
        sessionsCount: data.sessionsCount,
      }
    }
  }

  // Verifica se hoje é o recorde absoluto (ou novo recorde)
  // Caso hoje iguale ou supere o recorde e tenha > 0 minutos de foco
  const isTodayRecord =
    todayMinutes > 0 &&
    (bestDay === null || bestDay.dateStr === todayStr || todayMinutes >= bestDay.totalMinutes)

  // Quanto falta para igualar ou superar o recorde absoluto
  let minutesRemainingToBeat = 0
  if (bestDay && bestDay.totalMinutes > todayMinutes) {
    minutesRemainingToBeat = Math.ceil(bestDay.totalMinutes - todayMinutes)
  }

  // Melhor dia dos últimos 14 dias
  const last14DaysKeys = new Set<string>()
  for (let i = 0; i < 14; i++) {
    const d = new Date(referenceDate)
    d.setDate(d.getDate() - (13 - i))
    last14DaysKeys.add(localDay(d))
  }

  let bestDayOf14Days: DailyFocusSummary | null = null
  for (const dateKey of last14DaysKeys) {
    const data = dayMap.get(dateKey)
    if (data && data.totalMinutes > 0) {
      if (!bestDayOf14Days || data.totalMinutes > bestDayOf14Days.totalMinutes) {
        bestDayOf14Days = {
          dateStr: dateKey,
          totalMinutes: data.totalMinutes,
          sessionsCount: data.sessionsCount,
        }
      }
    }
  }

  // Comparação com o mesmo dia da semana (ex: segundas-feiras)
  const currentWeekdayIndex = referenceDate.getDay() // 0=Dom, 1=Seg...
  const weekdayTotals: number[] = []

  for (const [dateStr, data] of dayMap.entries()) {
    if (data.totalMinutes <= 0) continue
    const [y, m, d] = dateStr.split('-').map(Number)
    if (!y || !m || !d) continue
    const parsedDate = new Date(y, m - 1, d, 12, 0, 0)
    if (parsedDate.getDay() === currentWeekdayIndex) {
      weekdayTotals.push(data.totalMinutes)
    }
  }

  let weekdayComparison: BestDayStats['weekdayComparison'] = null
  if (weekdayTotals.length > 0) {
    const sumWeekday = weekdayTotals.reduce((acc, v) => acc + v, 0)
    const avgWeekday = Math.round(sumWeekday / weekdayTotals.length)
    const maxWeekday = Math.max(...weekdayTotals)

    weekdayComparison = {
      weekdayKey: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][currentWeekdayIndex],
      weekdayName: WEEKDAY_NAMES[currentWeekdayIndex],
      averageMinutes: avgWeekday,
      recordMinutes: maxWeekday,
      totalDaysCount: weekdayTotals.length,
    }
  }

  return {
    todayStr,
    todayMinutes,
    bestDay,
    isTodayRecord,
    minutesRemainingToBeat,
    bestDayOf14Days,
    weekdayComparison,
  }
}
