import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SessionRecord } from '@/types'
import { formatMinutes } from '@/lib/format'
import { localDay } from '@/lib/date-parser'
import { useAuth } from '@/contexts/AuthContext'
import { updateUserGoal } from '@/services/data'

export function History({ sessions }: { sessions: SessionRecord[] }) {
  const nav = useNavigate()
  const { user } = useAuth()

  const defaultGoal = 120
  const userGoal = Number(user?.daily_focus_goal_minutes) || defaultGoal
  const [goal, setGoal] = useState<number>(userGoal)
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(String(userGoal))
  const [saving, setSaving] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState(false)

  useEffect(() => {
    if (user?.daily_focus_goal_minutes) {
      setGoal(Number(user.daily_focus_goal_minutes))
      setInputValue(String(user.daily_focus_goal_minutes))
    }
  }, [user?.daily_focus_goal_minutes])

  const now = new Date()
  const startWeek = new Date(now)
  startWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  startWeek.setHours(0, 0, 0, 0)
  const sum = (items: SessionRecord[]) => items.reduce((n, s) => n + Number(s.duration_minutes), 0)
  const today = sessions.filter((s) => s.session_date.slice(0, 10) === localDay())
  const week = sessions.filter((s) => new Date(s.session_date) >= startWeek)
  const todayTotal = sum(today)

  const persistGoal = async (val: number) => {
    const clamped = Math.min(720, Math.max(15, Math.round(val)))
    setGoal(clamped)
    setInputValue(String(clamped))
    setIsEditing(false)
    if (user?.id && clamped !== user?.daily_focus_goal_minutes) {
      setSaving(true)
      try {
        await updateUserGoal(user.id, clamped)
        setSaveFeedback(true)
        setTimeout(() => setSaveFeedback(false), 2000)
      } catch (err) {
        console.error('Erro ao atualizar meta diária:', err)
      } finally {
        setSaving(false)
      }
    }
  }

  const handleStep = (delta: number) => {
    const next = Math.min(720, Math.max(15, goal + delta))
    persistGoal(next)
  }

  const handleInputSubmit = () => {
    const parsed = parseInt(inputValue, 10)
    if (!Number.isNaN(parsed)) {
      persistGoal(parsed)
    } else {
      setInputValue(String(goal))
      setIsEditing(false)
    }
  }

  const percentage = goal > 0 ? Math.min(100, Math.round((todayTotal / goal) * 100)) : 0
  const isGoalReached = todayTotal >= goal && goal > 0

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

      {/* BLOCO: META DO DIA */}
      <section className={`daily-goal-card ${isGoalReached ? 'goal-reached' : ''}`}>
        <div className="daily-goal-header">
          <div className="daily-goal-tag">
            <span>META DO DIA</span>
            {isGoalReached ? (
              <span className="goal-status-badge reached">META ALCANÇADA</span>
            ) : (
              <span className="goal-status-badge pending">EM PROGRESSO</span>
            )}
          </div>
          <div className="daily-goal-controls">
            <span className="goal-label">CONFIGURAR META:</span>
            {isEditing ? (
              <div className="goal-input-wrap">
                <input
                  type="number"
                  min={15}
                  max={720}
                  step={15}
                  value={inputValue}
                  autoFocus
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleInputSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInputSubmit()
                    if (e.key === 'Escape') {
                      setInputValue(String(goal))
                      setIsEditing(false)
                    }
                  }}
                  className="goal-input"
                />
                <span className="goal-unit">MIN</span>
              </div>
            ) : (
              <div className="goal-stepper-control">
                <button
                  type="button"
                  onClick={() => handleStep(-15)}
                  disabled={goal <= 15 || saving}
                  aria-label="Diminuir meta em 15 minutos"
                  className="goal-step-btn"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="goal-value-btn"
                  title="Clique para editar diretamente"
                >
                  <b>{formatMinutes(goal)}</b>
                </button>
                <button
                  type="button"
                  onClick={() => handleStep(15)}
                  disabled={goal >= 720 || saving}
                  aria-label="Aumentar meta em 15 minutos"
                  className="goal-step-btn"
                >
                  +
                </button>
              </div>
            )}
            {saveFeedback && <span className="goal-feedback">SALVO</span>}
          </div>
        </div>

        <div className="daily-goal-stats">
          <div className="daily-goal-progress-info">
            <span className="goal-current">
              HOJE: <b>{formatMinutes(todayTotal)}</b>
            </span>
            <span className="goal-separator">/</span>
            <span className="goal-target">
              META: <b>{formatMinutes(goal)}</b>
            </span>
          </div>
          <span className={`goal-pct ${isGoalReached ? 'reached' : ''}`}>{percentage}%</span>
        </div>

        <div className="daily-goal-bar-track">
          <div
            className={`daily-goal-bar-fill ${isGoalReached ? 'reached' : ''}`}
            style={{ width: `${Math.min(100, (todayTotal / goal) * 100)}%` }}
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
