import type { RecordModel } from 'pocketbase'
export type WeekdayKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'

export type WeeklyFocusGoals = Record<WeekdayKey, number>

export interface NotificationPreferences {
  enabled: boolean
  lead_minutes: number // Antecedência em minutos (padrão 5)
  sound_enabled: boolean
}

export interface UserRecord extends RecordModel {
  name: string
  email: string
  avatar?: string
  daily_focus_goal_minutes?: number
  weekly_focus_goals?: WeeklyFocusGoals
  notification_preferences?: NotificationPreferences
}

export interface ListRecord extends RecordModel {
  name: string
  user: string
  order?: number
  pinned?: boolean
}

export interface TagRecord extends RecordModel {
  name: string
  user: string
  color: string
  order?: number
  pinned?: boolean
}

export type RecurrenceType = 'none' | 'daily' | 'weekly_days' | 'weekly' | 'monthly'
export type RecurrenceMode = 'from_date' | 'from_completion'
export type TaskPriority = 0 | 1 | 2 | 3 | 4 // 1=P1 (Urgente), 2=P2 (Alta), 3=P3 (Média), 4=P4 (Baixa), 0=Sem prioridade

export interface SubtaskItem {
  id: string
  title: string
  done: boolean
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
  order?: number
  tags?: string[]
  recurrence_type?: RecurrenceType
  recurrence_interval?: number
  recurrence_weekdays?: number[]
  recurrence_mode?: RecurrenceMode
  due_time?: string // Formato "HH:MM"
  priority?: TaskPriority // 1-4 ou 0/undefined
  subtasks?: SubtaskItem[]
  expand?: {
    list?: ListRecord
    tags?: TagRecord[]
  }
}
export interface SessionRecord extends RecordModel {
  task?: string
  user: string
  started_at: string
  ended_at: string
  duration_minutes: number
  session_date: string
  status: 'completa' | 'interrompida'
  note?: string
  expand?: { task?: TaskRecord }
}

export interface FocusPresetRecord extends RecordModel {
  name: string
  user: string
  work_minutes: number // mínimo 5 min
  short_break_minutes: number // mínimo 5 min
  long_break_minutes: number // mínimo 5 min
  blocks_before_long_break: number // mínimo 1
  archived?: boolean
}

export interface McpTokenRecord extends RecordModel {
  name: string
  user: string
  token_hash: string
  last_used_at?: string
  revoked?: boolean
}

export interface CreatedMcpTokenResponse {
  id: string
  name: string
  user: string
  raw_token: string
  created: string
  revoked: boolean
  message: string
}
