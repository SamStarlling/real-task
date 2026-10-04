import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SessionRecord } from '@/types'
import { formatMinutes } from '@/lib/format'
import { localDay } from '@/lib/date-parser'
export function History({ sessions }: { sessions: SessionRecord[] }) {
  const nav = useNavigate()
  const now = new Date()
  const startWeek = new Date(now)
  startWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  startWeek.setHours(0, 0, 0, 0)
  const sum = (items: SessionRecord[]) => items.reduce((n, s) => n + Number(s.duration_minutes), 0)
  const today = sessions.filter((s) => s.session_date.slice(0, 10) === localDay())
  const week = sessions.filter((s) => new Date(s.session_date) >= startWeek)
  const days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (13 - i))
        const key = localDay(d)
        return {
          key,
          date: d,
          total: sum(sessions.filter((s) => s.session_date.slice(0, 10) === key)),
        }
      }),
    [sessions],
  )
  const max = Math.max(...days.map((d) => d.total), 1)
  const groups = Object.groupBy(sessions, (s) => s.session_date.slice(0, 10))
  return (
    <div className="page history">
      <header className="view-title">
        <h1>Histórico</h1>
        <span>TEMPO REAL DE FOCO</span>
      </header>
      <div className="metrics">
        <span>
          HOJE<b>{formatMinutes(sum(today))}</b>
        </span>
        <span>
          ESTA SEMANA<b>{formatMinutes(sum(week))}</b>
        </span>
        <span>
          TOTAL<b>{formatMinutes(sum(sessions))}</b>
        </span>
      </div>
      <div className="chart">
        {days.map((d) => (
          <div key={d.key} title={formatMinutes(d.total)}>
            <i>
              <b style={{ height: `${(d.total / max) * 100}%` }} />
            </i>
            <span>
              {d.date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3).toUpperCase()}
            </span>
          </div>
        ))}
      </div>
      <div className="history-list">
        {Object.entries(groups)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([day, items]) => (
            <section key={day}>
              <header>
                <h2>
                  {new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h2>
                <span>{formatMinutes(sum(items || []))}</span>
              </header>
              {(items || []).map((s) => (
                <button key={s.id} onClick={() => nav(`/?taskId=${s.task}`)}>
                  <span>
                    {new Date(s.started_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    –{' '}
                    {new Date(s.ended_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <strong>{s.expand?.task?.title || 'Tarefa'}</strong>
                  <span>{formatMinutes(s.duration_minutes)}</span>
                  <em className={s.status}>{s.status.toUpperCase()}</em>
                </button>
              ))}
            </section>
          ))}
      </div>
      {!sessions.length && <p className="history-empty">Nenhuma sessão registrada ainda.</p>}
    </div>
  )
}
