import pb from '@/lib/pocketbase/client'
import type { ListRecord, SessionRecord, TaskRecord } from '@/types'
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
export const sessionsForTask = (task: string) =>
  pb
    .collection<SessionRecord>('sessions')
    .getFullList({ filter: pb.filter('task = {:task}', { task }), sort: '-started_at' })
export async function recordSession(
  task: TaskRecord,
  startedAt: Date,
  endedAt: Date,
  minutes: number,
  status: SessionRecord['status'],
) {
  const user = pb.authStore.record!.id
  const midnight = new Date(endedAt.getFullYear(), endedAt.getMonth(), endedAt.getDate())
  const session = await pb
    .collection<SessionRecord>('sessions')
    .create({
      task: task.id,
      user,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_minutes: minutes,
      session_date: midnight.toISOString(),
      status,
    })
  const current = await pb.collection<TaskRecord>('tasks').getOne(task.id)
  await pb
    .collection<TaskRecord>('tasks')
    .update(task.id, { actual_minutes: Number(current.actual_minutes || 0) + minutes })
  return session
}
