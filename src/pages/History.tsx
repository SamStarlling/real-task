import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sliders } from 'lucide-react'
import type { SessionRecord } from '@/types'
import { formatMinutes } from '@/lib/format'
import { localDay } from '@/lib/date-parser'
import { useAuth } from '@/contexts/AuthContext'
import { getGoalForDate, getWeekdayKey, WEEKDAY_LABELS } from '@/services/data'

export function History({ sessions }: { sessions: SessionRecord[] }) {
  const nav = useNavigate()
  const { user } = useAuth()

  const now = new Date()
  const todayWeekdayKey = getWeekdayKey(now)
  const todayWeekdayLabel = WEEKDAY_LABELS[todayWeekdayKey]

  // Meta do dia da semana correspondente à data de hoje
  const goal = getGoalForDate(now, user)
  const hasGoal = goal > 0

  const startWeek = new Date(now)
  startWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  startWeek.setHours(0, 0, 0, 0)
  const sum = (items: SessionRecord[]) => items.reduce((n, s) => n + Number(s.duration_minutes), 0)
  const today = sessions.filter((s) => s.session_date.slice(0, 10) === localDay())
  const week = sessions.filter((s) => new Date(s.session_date) >= startWeek)
  const todayTotal = sum(today)

  const percentage = hasGoal ? Math.min(100, Math.round((todayTotal / goal) * 100)) : 0
  const isGoalReached = hasGoal && todayTotal >= goal

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

      {/* BLOCO: META DO DIA (somente leitura com link para Configurações) */}
      <section
        className={`daily-goal-card ${isGoalReached ? 'goal-reached' : ''} ${!hasGoal ? 'no-goal' : ''}`}
      >
        <div className="daily-goal-header">
          <div className="daily-goal-tag">
            <span>META DE HOJE ({todayWeekdayLabel.long.toUpperCase()})</span>
            {!hasGoal ? (
              <span className="goal-status-badge off">SEM META (FOLGA)</span>
            ) : isGoalReached ? (
              <span className="goal-status-badge reached">META ALCANÇADA</span>
            ) : (
              <span className="goal-status-badge pending">EM PROGRESSO</span>
            )}
          </div>
          <div className="daily-goal-controls">
            <button
              type="button"
              onClick={() => nav('/configuracoes')}
              className="daily-goal-edit-link"
              title="Ajustar metas semanais em Configurações"
            >
              <Sliders size={13} />
              <span>EDITAR METAS</span>
            </button>
          </div>
        </div>

        <div className="daily-goal-stats">
          <div className="daily-goal-progress-info">
            <span className="goal-current">
              HOJE: <b>{formatMinutes(todayTotal)}</b>
            </span>
            <span className="goal-separator">/</span>
            <span className="goal-target">
              META: <b>{hasGoal ? formatMinutes(goal) : 'SEM META'}</b>
            </span>
          </div>
          <span className={`goal-pct ${isGoalReached ? 'reached' : ''}`}>
            {hasGoal ? `${percentage}%` : '—'}
          </span>
        </div>

        <div className="daily-goal-bar-track">
          <div
            className={`daily-goal-bar-fill ${isGoalReached ? 'reached' : ''}`}
            style={{ width: hasGoal ? `${percentage}%` : '0%' }}
          />
        </div>
      </section>

      <div className="metrics">
        <span>
          HOJE<b>{formatMinutes(todayTotal)}</b>
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
