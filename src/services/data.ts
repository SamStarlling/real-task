import pb from '@/lib/pocketbase/client'
import type {
  FocusPresetRecord,
  ListRecord,
  SessionRecord,
  TaskRecord,
  UserRecord,
  WeekdayKey,
  WeeklyFocusGoals,
} from '@/types'
export type { WeekdayKey, WeeklyFocusGoals } from '@/types'

export const DEFAULT_WEEKLY_GOALS: WeeklyFocusGoals = {
  dom: 0,
  seg: 120,
  ter: 120,
  qua: 120,
  qui: 120,
  sex: 120,
  sab: 60,
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
export const getTasks = () =>
  pb.collection<TaskRecord>('tasks').getFullList({ sort: '-created', expand: 'list' })
export const getSessions = () =>
  pb.collection<SessionRecord>('sessions').getFullList({ sort: '-started_at', expand: 'task' })
export const createList = (name: string, user: string) =>
  pb.collection<ListRecord>('lists').create({ name, user })
export const createTask = (data: Record<string, unknown>) =>
  pb.collection<TaskRecord>('tasks').create(data, { expand: 'list' })
export const updateTask = (id: string, data: Record<string, unknown>) =>
  pb.collection<TaskRecord>('tasks').update(id, data, { expand: 'list' })

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
