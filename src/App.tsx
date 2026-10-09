import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { PomodoroProvider } from '@/contexts/PomodoroContext'
import { Layout } from '@/components/Layout'
import { Index } from '@/pages/Index'
import { History } from '@/pages/History'
import { Docs } from '@/pages/Docs'
import { WeekPage } from '@/pages/Week'
import { Settings } from '@/pages/Settings'
import { PomodoroPage } from '@/pages/Pomodoro'
import { AuthPage } from '@/pages/AuthPages'
import { getLists, getSessions, getTags, getTasks } from '@/services/data'
import type { ListRecord, SessionRecord, TagRecord, TaskRecord } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import { useTaskNotifications } from '@/hooks/use-task-notifications'

function Protected() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [tags, setTags] = useState<TagRecord[]>([])
  const [lists, setLists] = useState<ListRecord[]>([])
  const refresh = useCallback(() => {
    if (!user) return
    getTasks().then(setTasks)
    getSessions().then(setSessions)
    getTags().then(setTags)
    getLists().then(setLists)
  }, [user])
  useEffect(refresh, [refresh])
  useRealtime<TaskRecord>('tasks', refresh, !!user)
  useRealtime<SessionRecord>('sessions', refresh, !!user)
  useRealtime<TagRecord>('tags', refresh, !!user)
  useRealtime<ListRecord>('lists', refresh, !!user)

  // Alertas nativos e som Web Audio em background enquanto o app estiver aberto
  useTaskNotifications(tasks, user)

  if (!user) return <Navigate to="/login" replace />
  return (
    <Routes>
      <Route element={<Layout tasks={tasks} tags={tags} lists={lists} refresh={refresh} />}>
        <Route
          path="/"
          element={<Index tasks={tasks} tags={tags} lists={lists} refresh={refresh} />}
        />
        <Route
          path="/semana"
          element={<WeekPage tasks={tasks} tags={tags} lists={lists} refresh={refresh} />}
        />
        <Route
          path="/pomodoro"
          element={<PomodoroPage sessions={sessions} tasks={tasks} refreshSessions={refresh} />}
        />
        <Route path="/historico" element={<History sessions={sessions} />} />
        <Route path="/configuracoes" element={<Settings />} />
        <Route path="/docs" element={<Docs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PomodoroProvider>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/verify-email" element={<AuthPage mode="verify" />} />
            <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
            <Route path="/reset-password" element={<AuthPage mode="reset" />} />
            <Route path="/*" element={<Protected />} />
          </Routes>
          <Toaster />
        </PomodoroProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
