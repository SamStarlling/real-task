import pb from '@/lib/pocketbase/client'
import type {
  FocusPresetRecord,
  ListRecord,
  NotificationPreferences,
  RecurrenceMode,
  RecurrenceType,
  SessionRecord,
  TagRecord,
  TaskRecord,
  UserRecord,
  WeekdayKey,
  WeeklyFocusGoals,
} from '@/types'
export type {
  NotificationPreferences,
  RecurrenceMode,
  RecurrenceType,
  TagRecord,
  WeekdayKey,
  WeeklyFocusGoals,
} from '@/types'
import { toPocketDate } from '@/lib/date-parser'

/**
 * Paleta de cores discretas (quiet luxury) Barbosa System para etiquetas.
 * Tons nobres, elegantes, nada de neon / arco-íris estridente.
 */
export const TAG_PALETTE = [
  { name: 'Champagne Ouro', color: '#C5A880' },
  { name: 'Verde-Oliva Suave', color: '#8F9E82' },
  { name: 'Azul-Ardósia', color: '#7E92A2' },
  { name: 'Terracota Queimada', color: '#B37D6B' },
  { name: 'Vinho Aveludado', color: '#9B6C7B' },
  { name: 'Cinza-Azulado', color: '#7D8899' },
  { name: 'Âmbar Antigo', color: '#BFA16F' },
  { name: 'Sálvia Escura', color: '#7A8C80' },
] as const

/**
 * Sugere a próxima cor cíclica para uma nova etiqueta com base na contagem existente.
 */
export function getNextTagColor(existingCount: number = 0): string {
  const index = Math.abs(existingCount) % TAG_PALETTE.length
  return TAG_PALETTE[index].color
}

export const DEFAULT_WEEKLY_GOALS: WeeklyFocusGoals = {
  dom: 0,
  seg: 120,
  ter: 120,
  qua: 120,
  qui: 120,
  sex: 120,
  sab: 60,
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  lead_minutes: 5,
  sound_enabled: true,
}

export function resolveNotificationPreferences(
  user?: Partial<UserRecord> | null,
): NotificationPreferences {
  const raw = user?.notification_preferences
  if (raw && typeof raw === 'object') {
    return {
      enabled:
        typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_NOTIFICATION_PREFERENCES.enabled,
      lead_minutes:
        typeof raw.lead_minutes === 'number'
          ? raw.lead_minutes
          : DEFAULT_NOTIFICATION_PREFERENCES.lead_minutes,
      sound_enabled:
        typeof raw.sound_enabled === 'boolean'
          ? raw.sound_enabled
          : DEFAULT_NOTIFICATION_PREFERENCES.sound_enabled,
    }
  }
  return DEFAULT_NOTIFICATION_PREFERENCES
}

export const updateUserNotificationPreferences = async (
  userId: string,
  prefs: NotificationPreferences,
) => {
  const updated = await pb.collection('users').update(userId, {
    notification_preferences: prefs,
  })
  if (pb.authStore.record?.id === userId) {
    pb.authStore.save(pb.authStore.token, updated)
  }
  return updated
}

export const WEEKDAY_ORDER: WeekdayKey[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']

export const WEEKDAY_LABELS: Record<WeekdayKey, { short: string; long: string }> = {
  seg: { short: 'Seg', long: 'Segunda-feira' },
  ter: { short: 'Ter', long: 'Terça-feira' },
  qua: { short: 'Qua', long: 'Quarta-feira' },
  qui: { short: 'Qui', long: 'Quinta-feira' },
  sex: { short: 'Sex', long: 'Sexta-feira' },
  sab: { short: 'Sáb', long: 'Sábado' },
  dom: { short: 'Dom', long: 'Domingo' },
}

/**
 * Obtém a chave do dia da semana ('seg'..'dom') a partir de um objeto Date ou número (0=dom, 1=seg, ...).
 */
export function getWeekdayKey(date: Date | number = new Date()): WeekdayKey {
  const day = typeof date === 'number' ? date : date.getDay()
  const map: Record<number, WeekdayKey> = {
    0: 'dom',
    1: 'seg',
    2: 'ter',
    3: 'qua',
    4: 'qui',
    5: 'sex',
    6: 'sab',
  }
  return map[day] || 'seg'
}

/**
 * Retorna as metas semanais resolvidas do usuário com fallback seguro.
 */
export function resolveWeeklyGoals(user?: Partial<UserRecord> | null): WeeklyFocusGoals {
  const fallback = Number(user?.daily_focus_goal_minutes) || 120
  const raw = user?.weekly_focus_goals

  if (raw && typeof raw === 'object') {
    return {
      seg: typeof raw.seg === 'number' ? raw.seg : fallback,
      ter: typeof raw.ter === 'number' ? raw.ter : fallback,
      qua: typeof raw.qua === 'number' ? raw.qua : fallback,
      qui: typeof raw.qui === 'number' ? raw.qui : fallback,
      sex: typeof raw.sex === 'number' ? raw.sex : fallback,
      sab: typeof raw.sab === 'number' ? raw.sab : fallback,
      dom: typeof raw.dom === 'number' ? raw.dom : fallback,
    }
  }

  return {
    seg: fallback,
    ter: fallback,
    qua: fallback,
    qui: fallback,
    sex: fallback,
    sab: fallback,
    dom: fallback,
  }
}

/**
 * Retorna a meta de foco em minutos para uma data específica (ou hoje por padrão).
 */
export function getGoalForDate(date: Date = new Date(), user?: Partial<UserRecord> | null): number {
  const goals = resolveWeeklyGoals(user)
  const key = getWeekdayKey(date)
  return goals[key] ?? 0
}

export const getLists = () => pb.collection<ListRecord>('lists').getFullList({ sort: 'name' })
export const getTags = () => pb.collection<TagRecord>('tags').getFullList({ sort: 'name' })
export const getTasks = () =>
  pb.collection<TaskRecord>('tasks').getFullList({ sort: 'order,-created', expand: 'list,tags' })
export const getSessions = () =>
  pb.collection<SessionRecord>('sessions').getFullList({ sort: '-started_at', expand: 'task' })
export const createList = (name: string, user: string) =>
  pb.collection<ListRecord>('lists').create({ name, user })
export const createTag = (data: { name: string; user: string; color: string }) =>
  pb.collection<TagRecord>('tags').create(data)
export const deleteTag = (id: string) => pb.collection<TagRecord>('tags').delete(id)
export const createTask = (data: Record<string, unknown>) =>
  pb.collection<TaskRecord>('tasks').create(data, { expand: 'list,tags' })
export const updateTask = (id: string, data: Record<string, unknown>) =>
  pb.collection<TaskRecord>('tasks').update(id, data, { expand: 'list,tags' })

/**
 * Reordena uma lista ordenada de tarefas afetadas, persistindo o novo índice sequencial no banco.
 * Apenas atualiza as tarefas cujo campo `order` difere da nova sequência planejada.
 */
export async function reorderTasks(orderedTasks: TaskRecord[]): Promise<void> {
  const updates: Promise<unknown>[] = []
  orderedTasks.forEach((task, idx) => {
    const newOrder = (idx + 1) * 10
    if (task.order !== newOrder) {
      updates.push(pb.collection('tasks').update(task.id, { order: newOrder }))
    }
  })
  if (updates.length > 0) {
    await Promise.all(updates)
  }
}

export const updateUserGoal = async (userId: string, minutes: number) => {
  const updated = await pb.collection('users').update(userId, { daily_focus_goal_minutes: minutes })
  if (pb.authStore.record?.id === userId) {
    pb.authStore.save(pb.authStore.token, updated)
  }
  return updated
}

export const updateUserWeeklyGoals = async (userId: string, goals: WeeklyFocusGoals) => {
  const updated = await pb.collection('users').update(userId, {
    weekly_focus_goals: goals,
  })
  if (pb.authStore.record?.id === userId) {
    pb.authStore.save(pb.authStore.token, updated)
  }
  return updated
}
export const sessionsForTask = (task: string) =>
  pb
    .collection<SessionRecord>('sessions')
    .getFullList({ filter: pb.filter('task = {:task}', { task }), sort: '-started_at' })

export const getFocusPresets = (includeArchived: boolean = true) =>
  pb.collection<FocusPresetRecord>('focus_presets').getFullList({
    sort: 'created',
    ...(includeArchived ? {} : { filter: 'archived = false' }),
  })

export const createFocusPreset = (data: {
  name: string
  user: string
  work_minutes: number
  short_break_minutes: number
  long_break_minutes: number
  blocks_before_long_break: number
  archived?: boolean
}) => pb.collection<FocusPresetRecord>('focus_presets').create(data)

export const updateFocusPreset = (id: string, data: Partial<FocusPresetRecord>) =>
  pb.collection<FocusPresetRecord>('focus_presets').update(id, data)

export const deleteFocusPreset = (id: string) =>
  pb.collection<FocusPresetRecord>('focus_presets').delete(id)

export async function recordSession(
  task: TaskRecord | null | undefined,
  startedAt: Date,
  endedAt: Date,
  minutes: number,
  status: SessionRecord['status'],
  note?: string,
) {
  const user = pb.authStore.record!.id
  const midnight = new Date(endedAt.getFullYear(), endedAt.getMonth(), endedAt.getDate())
  const payload: Record<string, unknown> = {
    task: task ? task.id : '',
    user,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    duration_minutes: minutes,
    session_date: midnight.toISOString(),
    status,
  }
  if (note && note.trim()) {
    payload.note = note.trim().slice(0, 500)
  }
  const session = await pb.collection<SessionRecord>('sessions').create(payload)
  if (task) {
    const current = await pb.collection<TaskRecord>('tasks').getOne(task.id)
    await pb
      .collection<TaskRecord>('tasks')
      .update(task.id, { actual_minutes: Number(current.actual_minutes || 0) + minutes })
  }
  return session
}

export async function updateSessionNote(sessionId: string, note: string) {
  return pb.collection<SessionRecord>('sessions').update(sessionId, {
    note: note.trim().slice(0, 500),
  })
}

/**
 * Retorna uma descrição legível em pt-BR da regra de recorrência da tarefa.
 * Ex.: "repete · diária", "repete · a cada 2 dias", "repete · seg, qua, sex", "repete · mensal (dia 15)"
 */
/**
 * Função utilitária de comparação para ordenação estável de tarefas dentro de um mesmo dia:
 * 1. Tarefas COM horário (due_time) ordenam ANTES das tarefas sem horário.
 * 2. Entre as COM horário, ordena crescentemente pela hora ("08:00" < "14:30").
 * 3. Preserva o campo `order` como critério de desempate/ordem manual dentro de cada grupo.
 * 4. Por fim, critério cronológico de criação (-created).
 */
export function compareTasksWithinDay(a: TaskRecord, b: TaskRecord): number {
  const hasTimeA = !!(a.due_time && a.due_time.trim())
  const hasTimeB = !!(b.due_time && b.due_time.trim())

  if (hasTimeA && !hasTimeB) return -1
  if (!hasTimeA && hasTimeB) return 1

  if (hasTimeA && hasTimeB) {
    const timeCompare = (a.due_time || '').localeCompare(b.due_time || '')
    if (timeCompare !== 0) return timeCompare
  }

  // Desempate por order manual (valores > 0 válidos, 999999 para sem ordem)
  const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : 999999
  const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : 999999
  if (orderA !== orderB) return orderA - orderB

  return new Date(b.created).getTime() - new Date(a.created).getTime()
}

/**
 * Verifica se uma tarefa está atrasada considerando tanto a data (due_date) quanto o horário (due_time).
 * Retorna true se:
 * - done = false E
 * - (due_date < hoje) OU (due_date == hoje E due_time definido E horário atual > due_time)
 */
export function isTaskOverdue(task: TaskRecord, now = new Date()): boolean {
  if (task.done || !task.due_date) return false

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const taskDay = task.due_date.slice(0, 10)

  if (taskDay < todayStr) return true
  if (taskDay > todayStr) return false

  // Se é hoje e tem horário definido:
  if (task.due_time && task.due_time.trim()) {
    const [taskH, taskM] = task.due_time.split(':').map(Number)
    const currentH = now.getHours()
    const currentM = now.getMinutes()
    if (currentH > taskH || (currentH === taskH && currentM > taskM)) {
      return true
    }
  }

  return false
}

export function formatRecurrenceRule(task: Partial<TaskRecord>): string {
  const type = task.recurrence_type || 'none'
  if (type === 'none') return ''

  const interval = Math.max(1, Number(task.recurrence_interval) || 1)
  const modeSuffix = task.recurrence_mode === 'from_completion' ? ' (da conclusão)' : ''

  if (type === 'daily') {
    if (interval === 1) return `repete · todos os dias${modeSuffix}`
    return `repete · a cada ${interval} dias${modeSuffix}`
  }

  if (type === 'weekly') {
    if (interval === 1) return `repete · semanal${modeSuffix}`
    return `repete · a cada ${interval} semanas${modeSuffix}`
  }

  if (type === 'weekly_days') {
    const rawDays = Array.isArray(task.recurrence_weekdays) ? task.recurrence_weekdays : []
    const dayNames = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
    const sortedDays = [...rawDays].sort((a, b) => a - b).map((d) => dayNames[d] || '')
    const daysStr = sortedDays.filter(Boolean).join(', ')
    if (interval === 1) {
      return `repete · ${daysStr || 'dias da semana'}${modeSuffix}`
    }
    return `repete · a cada ${interval} sem (${daysStr})${modeSuffix}`
  }

  if (type === 'monthly') {
    let dayNum: number | null = null
    if (task.due_date) {
      const parsed = new Date(task.due_date)
      if (!isNaN(parsed.getTime())) {
        dayNum = parsed.getUTCDate()
      }
    }
    const dayStr = dayNum ? ` (dia ${dayNum})` : ''
    if (interval === 1) return `repete · mensal${dayStr}${modeSuffix}`
    return `repete · a cada ${interval} meses${dayStr}${modeSuffix}`
  }

  return ''
}

/**
 * Calcula a próxima data de vencimento (due_date) para uma tarefa recorrente.
 * Edge cases tratados:
 * - Sem due_date: retorna null (não gera próxima tarefa sem data base)
 * - Mensal com clamp para o último dia do mês (ex.: 31 de janeiro -> 28/29 de fevereiro)
 * - Modo "from_date" vs "from_completion"
 * - Multi-seleção de dias da semana (weekly_days): acha o próximo dia da lista no intervalo
 */
export function computeNextDueDate(
  task: Pick<
    TaskRecord,
    | 'due_date'
    | 'recurrence_type'
    | 'recurrence_interval'
    | 'recurrence_weekdays'
    | 'recurrence_mode'
  >,
  completionDate: Date = new Date(),
): string | null {
  const type = task.recurrence_type || 'none'
  if (type === 'none') return null

  // Se a tarefa não tem data de vencimento base no modo from_date, não calcula
  if (!task.due_date && task.recurrence_mode !== 'from_completion') {
    return null
  }

  const interval = Math.max(1, Number(task.recurrence_interval) || 1)
  const isFromCompletion = task.recurrence_mode === 'from_completion'

  // Data base de partida (em horário local do usuário com meio-dia para evitar deslocamentos UTC)
  let baseDate: Date
  if (isFromCompletion) {
    baseDate = new Date(
      completionDate.getFullYear(),
      completionDate.getMonth(),
      completionDate.getDate(),
      12,
      0,
      0,
    )
  } else if (task.due_date) {
    const raw = new Date(task.due_date)
    baseDate = new Date(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate(), 12, 0, 0)
  } else {
    baseDate = new Date(
      completionDate.getFullYear(),
      completionDate.getMonth(),
      completionDate.getDate(),
      12,
      0,
      0,
    )
  }

  if (type === 'daily') {
    const next = new Date(baseDate)
    next.setDate(next.getDate() + interval)
    return toPocketDate(next)
  }

  if (type === 'weekly') {
    const next = new Date(baseDate)
    next.setDate(next.getDate() + interval * 7)
    return toPocketDate(next)
  }

  if (type === 'weekly_days') {
    const rawDays =
      Array.isArray(task.recurrence_weekdays) && task.recurrence_weekdays.length > 0
        ? task.recurrence_weekdays
        : [baseDate.getDay()]
    const sortedDays = Array.from(new Set(rawDays)).sort((a, b) => a - b)

    if (isFromCompletion) {
      // A partir da conclusão: procura o próximo dia da lista após completionDate
      const currentDay = baseDate.getDay()
      let daysToAdd = 1
      while (daysToAdd <= 7 * interval + 7) {
        const candidate = new Date(baseDate)
        candidate.setDate(candidate.getDate() + daysToAdd)
        if (sortedDays.includes(candidate.getDay())) {
          return toPocketDate(candidate)
        }
        daysToAdd++
      }
      return toPocketDate(new Date(baseDate.getTime() + 86400000 * 7 * interval))
    }

    // Modo from_date: avança dentro da mesma semana se houver dia posterior;
    // se não houver, pula (interval - 1) semanas completas e pega o primeiro dia da semana seguinte
    const currentDay = baseDate.getDay()
    const nextDayThisWeek = sortedDays.find((d) => d > currentDay)
    if (nextDayThisWeek !== undefined) {
      const diff = nextDayThisWeek - currentDay
      const next = new Date(baseDate)
      next.setDate(next.getDate() + diff)
      return toPocketDate(next)
    }

    // Passou de todos os dias da semana atual: pula para o primeiro dia após o intervalo de semanas
    const firstDayNextCycle = sortedDays[0]
    const daysUntilNextWeek = 7 - currentDay
    const additionalWeeks = (interval - 1) * 7
    const totalDaysToAdd = daysUntilNextWeek + additionalWeeks + firstDayNextCycle
    const next = new Date(baseDate)
    next.setDate(next.getDate() + totalDaysToAdd)
    return toPocketDate(next)
  }

  if (type === 'monthly') {
    // Dia original do mês fixo (com clamp para último dia de meses com menos dias)
    const targetDay = baseDate.getDate()
    const targetYear = baseDate.getFullYear()
    const targetMonth = baseDate.getMonth() + interval

    // Descobrir o número de dias no mês de destino (ano bissexto incluso)
    // new Date(year, month + 1, 0).getDate() dá o último dia daquele mês
    const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
    const clampedDay = Math.min(targetDay, daysInTargetMonth)

    const next = new Date(targetYear, targetMonth, clampedDay, 12, 0, 0)
    return toPocketDate(next)
  }

  return null
}

/**
 * Conclui ou reabre uma tarefa.
 * Se estiver marcando como concluída (done=true) e a tarefa possuir regra de recorrência
 * ativa (recurrence_type !== 'none'), cria automaticamente a próxima instância no PocketBase
 * com o mesmo título, lista, tags, estimated_minutes e nova due_date calculada,
 * preservando a tarefa concluída para o histórico.
 */
export async function toggleTaskDone(
  task: TaskRecord,
  isDone?: boolean,
): Promise<{
  completedTask: TaskRecord
  createdNextTask?: TaskRecord | null
}> {
  const targetDone = isDone !== undefined ? isDone : !task.done
  const now = new Date()
  const completedAt = targetDone ? now.toISOString() : ''

  // 1. Atualizar a tarefa atual
  const completedTask = await updateTask(task.id, {
    done: targetDone,
    completed_at: completedAt,
  })

  let createdNextTask: TaskRecord | null = null

  // 2. Se a tarefa foi concluída e tem recorrência ativa, criar a próxima instância
  const isRecurrent = task.recurrence_type && task.recurrence_type !== 'none'
  if (targetDone && isRecurrent) {
    const nextDueDate = computeNextDueDate(task, now)

    // Se temos uma próxima data válida calculada
    if (nextDueDate) {
      // Obter tags atuais
      const tagIds = task.tags || task.expand?.tags?.map((t) => t.id) || []

      // Preparar payload da próxima instância com a mesma regra de recorrência
      const nextTaskPayload: Record<string, unknown> = {
        title: task.title,
        user: task.user,
        list: task.list || '',
        tags: tagIds,
        due_date: nextDueDate,
        done: false,
        estimated_minutes: task.estimated_minutes || 25,
        actual_minutes: 0,
        order: (task.order || 0) + 1,
        recurrence_type: task.recurrence_type,
        recurrence_interval: task.recurrence_interval || 1,
        recurrence_weekdays: task.recurrence_weekdays || null,
        recurrence_mode: task.recurrence_mode || 'from_date',
        due_time: task.due_time || '',
      }

      try {
        createdNextTask = await createTask(nextTaskPayload)
      } catch (err) {
        console.error('Erro ao gerar próxima instância recorrente:', err)
      }
    }
  }

  return { completedTask, createdNextTask }
}
