import type { RecordModel } from 'pocketbase'
export interface UserRecord extends RecordModel {
  name: string
  email: string
  avatar?: string
  daily_focus_goal_minutes?: number
}

export interface ListRecord extends RecordModel {
  name: string
  user: string
}
export interface TaskRecord extends RecordModel {
  title: string
  user: string
  list?: string
  due_date?: string
  done: boolean
  estimated_minutes: number
  actual_minutes: number
  completed_at?: string
  expand?: { list?: ListRecord }
}
export interface SessionRecord extends RecordModel {
  task: string
  user: string
  started_at: string
  ended_at: string
  duration_minutes: number
  session_date: string
  status: 'completa' | 'interrompida'
  expand?: { task?: TaskRecord }
}
