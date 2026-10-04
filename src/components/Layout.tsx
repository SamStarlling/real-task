import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ArrowRight, Clock3, Inbox, LogOut, Sun } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { CaptureBar } from '@/components/CaptureBar'
import { PomodoroWidget } from '@/components/PomodoroWidget'
import { useAuth } from '@/contexts/AuthContext'
import type { TaskRecord } from '@/types'
import { localDay } from '@/lib/date-parser'
import { pbDay } from '@/lib/format'

const links = [
  ['/', 'Hoje', Sun],
  ['/?view=amanha', 'Amanhã', ArrowRight],
  ['/?view=inbox', 'Inbox', Inbox],
  ['/historico', 'Histórico', Clock3],
] as const
export function Layout({ tasks, refresh }: { tasks: TaskRecord[]; refresh: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const today = localDay()
  const tomorrow = localDay(new Date(Date.now() + 86400000))
  const count = (label: string) =>
    tasks.filter(
      (t) =>
        !t.done &&
        (label === 'Hoje'
          ? pbDay(t.due_date) <= today && !!t.due_date
          : label === 'Amanhã'
            ? pbDay(t.due_date) === tomorrow
            : label === 'Inbox'
              ? !t.due_date
              : false),
    ).length
  const initials = String(user?.name || user?.email || 'U')
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav>
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={label}
              end={to === '/'}
              to={to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon />
              <span>{label}</span>
              {label !== 'Histórico' && <b>{count(label)}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="profile">
          <span className="avatar">{initials}</span>
          <span>{String(user?.name || 'Usuário')}</span>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            <LogOut />
          </button>
        </div>
      </aside>
      <header className="mobile-header">
        <Brand compact />
        <span className="avatar">{initials}</span>
      </header>
      <nav className="mobile-nav">
        {links.map(([to, label]) => (
          <NavLink key={label} end={to === '/'} to={to}>
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="main">
        <div className="capture-sticky">
          <CaptureBar onCreated={refresh} />
        </div>
        <Outlet />
      </main>
      <div className="mobile-capture">
        <CaptureBar onCreated={refresh} />
      </div>
      <PomodoroWidget />
    </div>
  )
}
