import type { SessionRecord, UserRecord, WeekdayKey, WeeklyFocusGoals } from '@/types'
import { localDay } from '@/lib/date-parser'
import { resolveWeeklyGoals, WEEKDAY_LABELS, WEEKDAY_ORDER } from '@/services/data'

export interface WeeklyReportDayItem {
  weekdayKey: WeekdayKey
  weekdayShort: string
  weekdayLong: string
  dateStr: string // "YYYY-MM-DD"
  date: Date
  focusMinutes: number
  goalMinutes: number
  isGoalReached: boolean
  hasGoal: boolean
  percentage: number
  sessionsCount: number
  completedSessionsCount: number
  interruptedSessionsCount: number
  isToday: boolean
}

export interface WeeklyTopTask {
  taskId: string
  title: string
  minutes: number
  sessionsCount: number
  completedCount: number
}

export interface WeeklyReportData {
  // Intervalo da semana (segunda-feira 00:00:00 até domingo 23:59:59)
  weekStart: Date
  weekEnd: Date
  startStr: string // "YYYY-MM-DD"
  endStr: string // "YYYY-MM-DD"
  periodLabel: string // ex: "21 a 27 de out" ou "21 out – 27 out 2025"
  isCurrentWeek: boolean

  // Agregações de tempo
  totalFocusMinutes: number
  totalGoalMinutes: number
  overallPercentage: number // 0 a N (sem cap de 100 para dar a real taxa de realização)

  // Metas por dia
  daysWithGoalCount: number
  daysGoalMetCount: number

  // Contagem de sessões da semana
  totalSessionsCount: number
  completedSessionsCount: number
  interruptedSessionsCount: number
  completionRate: number // % de sessões completas

  // Detalhe diário (7 dias: seg -> dom)
  days: WeeklyReportDayItem[]

  // Melhor dia da semana
  bestDay: {
    dateStr: string
    weekdayLong: string
    minutes: number
  } | null

  // Comparação com semana imediatamente anterior
  previousWeekTotalMinutes: number
  deltaMinutes: number // totalFocusMinutes - previousWeekTotalMinutes
  deltaPercentage: number | null // variação relativa ou null se semana anterior zerada

  // Distribuição por tarefa (top tarefas no período)
  topTasks: WeeklyTopTask[]
}

/**
 * Retorna a segunda-feira da semana de uma data de referência (00:00:00 local).
 * No Brasil e na ISO-8601, a semana começa na segunda-feira.
 */
export function getMondayOfIsoWeek(referenceDate: Date = new Date()): Date {
  const d = new Date(referenceDate)
  // getDay(): 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  const day = d.getDay()
  // distância até a segunda-feira anterior:
  // Seg (1) -> 0; Ter (2) -> 1; ... Dom (0) -> 6
  const diffToMonday = (day + 6) % 7
  d.setDate(d.getDate() - diffToMonday)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Formata o período de 7 dias (ex.: "13 a 19 de out de 2025" ou "28 de out a 03 de nov de 2025").
 */
export function formatWeekPeriodLabel(startDate: Date, endDate: Date): string {
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  const startMonth = startDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const endMonth = endDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startDay} a ${endDay} de ${startMonth} de ${startYear}`
    }
    return `${startDay} de ${startMonth} a ${endDay} de ${endMonth} de ${startYear}`
  }
  return `${startDay} de ${startMonth} de ${startYear} a ${endDay} de ${endMonth} de ${endYear}`
}

/**
 * Agrega e cruza as sessões de foco do usuário com as metas configuradas por dia da semana
 * para uma semana específica dada por weekOffset (0 = semana corrente, -1 = semana anterior, etc.)
 */
export function computeWeeklyReport({
  sessions,
  user,
  referenceDate = new Date(),
  weekOffset = 0,
}: {
  sessions: SessionRecord[]
  user?: Partial<UserRecord> | null
  referenceDate?: Date
  weekOffset?: number
}): WeeklyReportData {
  const todayStr = localDay(referenceDate)
  const baseMonday = getMondayOfIsoWeek(referenceDate)

  // Aplicar deslocamento de semanas (+0 = atual, -1 = semana passada, etc.)
  const targetMonday = new Date(baseMonday)
  targetMonday.setDate(targetMonday.getDate() + weekOffset * 7)
  targetMonday.setHours(0, 0, 0, 0)

  const targetSunday = new Date(targetMonday)
  targetSunday.setDate(targetSunday.getDate() + 6)
  targetSunday.setHours(23, 59, 59, 999)

  const startStr = localDay(targetMonday)
  const endStr = localDay(targetSunday)
  const isCurrentWeek = weekOffset === 0

  const resolvedGoals: WeeklyFocusGoals = resolveWeeklyGoals(user)

  // Criar os 7 dias da semana alvo (segunda a domingo)
  const dayDates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(targetMonday)
    d.setDate(d.getDate() + i)
    dayDates.push(d)
  }

  // Filtrar sessões pertencentes a essa semana (por session_date ou started_at local)
  const weekSessions = sessions.filter((s) => {
    const dateStr = s.session_date ? s.session_date.slice(0, 10) : s.started_at.slice(0, 10)
    return dateStr >= startStr && dateStr <= endStr
  })

  // Agrupamento por session_date
  const sessionsByDay = new Map<string, SessionRecord[]>()
  for (const s of weekSessions) {
    const dateStr = s.session_date ? s.session_date.slice(0, 10) : s.started_at.slice(0, 10)
    const list = sessionsByDay.get(dateStr) || []
    list.push(s)
    sessionsByDay.set(dateStr, list)
  }

  // Agrupar por tarefa
  const taskMap = new Map<
    string,
    { title: string; minutes: number; sessionsCount: number; completedCount: number }
  >()
  for (const s of weekSessions) {
    const tid = s.task || 'sem_tarefa'
    const title = s.expand?.task?.title || (s.task ? 'Tarefa vinculada' : 'Foco avulso')
    const dur = Number(s.duration_minutes) || 0
    const prev = taskMap.get(tid) || {
      title,
      minutes: 0,
      sessionsCount: 0,
      completedCount: 0,
    }
    taskMap.set(tid, {
      title: s.expand?.task?.title || prev.title,
      minutes: prev.minutes + dur,
      sessionsCount: prev.sessionsCount + 1,
      completedCount: prev.completedCount + (s.status === 'completa' ? 1 : 0),
    })
  }

  const topTasks: WeeklyTopTask[] = Array.from(taskMap.entries())
    .map(([taskId, val]) => ({
      taskId,
      title: val.title,
      minutes: val.minutes,
      sessionsCount: val.sessionsCount,
      completedCount: val.completedCount,
    }))
    .sort((a, b) => b.minutes - a.minutes)

  let totalFocusMinutes = 0
  let totalGoalMinutes = 0
  let daysWithGoalCount = 0
  let daysGoalMetCount = 0
  let totalSessionsCount = 0
  let completedSessionsCount = 0
  let interruptedSessionsCount = 0

  let bestDayItem: { dateStr: string; weekdayLong: string; minutes: number } | null = null

  const days: WeeklyReportDayItem[] = dayDates.map((date, idx) => {
    const weekdayKey = WEEKDAY_ORDER[idx]
    const dateStr = localDay(date)
    const goalMinutes = Number(resolvedGoals[weekdayKey]) || 0
    const hasGoal = goalMinutes > 0

    const daySessions = sessionsByDay.get(dateStr) || []
    let focusMinutes = 0
    let completedCount = 0
    let interruptedCount = 0

    for (const s of daySessions) {
      focusMinutes += Number(s.duration_minutes) || 0
      if (s.status === 'completa') {
        completedCount++
      } else {
        interruptedCount++
      }
    }

    const isGoalReached = hasGoal && focusMinutes >= goalMinutes
    const percentage = hasGoal ? Math.round((focusMinutes / goalMinutes) * 100) : 0

    totalFocusMinutes += focusMinutes
    totalGoalMinutes += goalMinutes
    if (hasGoal) {
      daysWithGoalCount++
      if (isGoalReached) {
        daysGoalMetCount++
      }
    }

    totalSessionsCount += daySessions.length
    completedSessionsCount += completedCount
    interruptedSessionsCount += interruptedCount

    if (focusMinutes > 0) {
      if (!bestDayItem || focusMinutes > bestDayItem.minutes) {
        bestDayItem = {
          dateStr,
          weekdayLong: WEEKDAY_LABELS[weekdayKey].long,
          minutes: focusMinutes,
        }
      }
    }

    return {
      weekdayKey,
      weekdayShort: WEEKDAY_LABELS[weekdayKey].short,
      weekdayLong: WEEKDAY_LABELS[weekdayKey].long,
      dateStr,
      date,
      focusMinutes,
      goalMinutes,
      isGoalReached,
      hasGoal,
      percentage,
      sessionsCount: daySessions.length,
      completedSessionsCount: completedCount,
      interruptedSessionsCount: interruptedCount,
      isToday: dateStr === todayStr,
    }
  })

  // % geral da semana cumprido (sem cap para ver sobrecumprimento, ex.: 112%)
  const overallPercentage =
    totalGoalMinutes > 0 ? Math.round((totalFocusMinutes / totalGoalMinutes) * 100) : 0

  const completionRate =
    totalSessionsCount > 0 ? Math.round((completedSessionsCount / totalSessionsCount) * 100) : 0

  // Semana anterior para cálculo do delta
  const prevMonday = new Date(targetMonday)
  prevMonday.setDate(prevMonday.getDate() - 7)
  const prevSunday = new Date(prevMonday)
  prevSunday.setDate(prevSunday.getDate() + 6)
  const prevStartStr = localDay(prevMonday)
  const prevEndStr = localDay(prevSunday)

  const prevWeekSessions = sessions.filter((s) => {
    const dateStr = s.session_date ? s.session_date.slice(0, 10) : s.started_at.slice(0, 10)
    return dateStr >= prevStartStr && dateStr <= prevEndStr
  })

  const previousWeekTotalMinutes = prevWeekSessions.reduce(
    (acc, s) => acc + (Number(s.duration_minutes) || 0),
    0,
  )

  const deltaMinutes = totalFocusMinutes - previousWeekTotalMinutes
  let deltaPercentage: number | null = null
  if (previousWeekTotalMinutes > 0) {
    deltaPercentage = Math.round((deltaMinutes / previousWeekTotalMinutes) * 100)
  }

  return {
    weekStart: targetMonday,
    weekEnd: targetSunday,
    startStr,
    endStr,
    periodLabel: formatWeekPeriodLabel(targetMonday, targetSunday),
    isCurrentWeek,
    totalFocusMinutes,
    totalGoalMinutes,
    overallPercentage,
    daysWithGoalCount,
    daysGoalMetCount,
    totalSessionsCount,
    completedSessionsCount,
    interruptedSessionsCount,
    completionRate,
    days,
    bestDay: bestDayItem,
    previousWeekTotalMinutes,
    deltaMinutes,
    deltaPercentage,
    topTasks,
  }
}
