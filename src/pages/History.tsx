import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BarChart3, Clock3, Sliders, Trophy } from 'lucide-react'
import type { SessionRecord } from '@/types'
import { formatMinutes } from '@/lib/format'
import { localDay } from '@/lib/date-parser'
import { useAuth } from '@/contexts/AuthContext'
import { getGoalForDate, getWeekdayKey, WEEKDAY_LABELS } from '@/services/data'
import { computeBestDayStats } from '@/lib/best-day'
import { WeeklyReport } from '@/components/WeeklyReport'

function formatRecordDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  const date = new Date(y, m - 1, d, 12, 0, 0)
  return date
    .toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    })
    .replace('.', '')
}

export function History({ sessions }: { sessions: SessionRecord[] }) {
  const nav = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Aba ativa: 'relatorio' (Relatório semanal de foco) ou 'sessoes' (Histórico geral e timeline)
  const initialTab = searchParams.get('aba') === 'relatorio' ? 'relatorio' : 'sessoes'
  const [activeTab, setActiveTab] = useState<'sessoes' | 'relatorio'>(initialTab)

  // Sincroniza tab com parâmetros de URL sem recarregar a página
  useEffect(() => {
    const tabInUrl = searchParams.get('aba') === 'relatorio' ? 'relatorio' : 'sessoes'
    if (tabInUrl !== activeTab) {
      setActiveTab(tabInUrl)
    }
  }, [searchParams, activeTab])

  const handleTabChange = (tab: 'sessoes' | 'relatorio') => {
    setActiveTab(tab)
    const nextParams = new URLSearchParams(searchParams)
    if (tab === 'relatorio') {
      nextParams.set('aba', 'relatorio')
    } else {
      nextParams.delete('aba')
    }
    setSearchParams(nextParams, { replace: true })
  }

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

  // Estatísticas de melhor dia e recordes derivados do histórico completo
  const stats = useMemo(() => computeBestDayStats(sessions, now), [sessions])

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
        <div className="view-title-main">
          <h1>Histórico</h1>
          <span>TEMPO REAL DE FOCO</span>
        </div>

        {/* NAVEGADOR DE ABAS: SESSÕES vs RELATÓRIO SEMANAL */}
        <div className="history-tab-switcher" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sessoes'}
            onClick={() => handleTabChange('sessoes')}
            className={`history-tab-btn ${activeTab === 'sessoes' ? 'active' : ''}`}
          >
            <Clock3 size={13} />
            <span>SESSÕES DO DIA</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'relatorio'}
            onClick={() => handleTabChange('relatorio')}
            className={`history-tab-btn ${activeTab === 'relatorio' ? 'active' : ''}`}
          >
            <BarChart3 size={13} />
            <span>RELATÓRIO SEMANAL</span>
          </button>
        </div>
      </header>

      {activeTab === 'relatorio' ? (
        <WeeklyReport sessions={sessions} />
      ) : (
        <>
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

            {/* COMPARAÇÃO DISCRETA COM O MESMO DIA DA SEMANA */}
            {stats.weekdayComparison && stats.weekdayComparison.totalDaysCount > 0 && (
              <div className="history-weekday-benchmark">
                <span className="benchmark-name">
                  SUAS {stats.weekdayComparison.weekdayName.toUpperCase()}:
                </span>
                <span>
                  MÉDIA <b>{formatMinutes(stats.weekdayComparison.averageMinutes)}</b>
                </span>
                <span>·</span>
                <span>
                  RECORDE{' '}
                  <b className="highlight">
                    {formatMinutes(stats.weekdayComparison.recordMinutes)}
                  </b>
                </span>
              </div>
            )}
          </section>

          {/* PAINEL DE MÉTRICAS (4 CARTÕES: HOJE, ESTA SEMANA, TOTAL, MELHOR DIA) */}
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
            <div className={`metrics-best-day ${stats.isTodayRecord ? 'is-record-holder' : ''}`}>
              <div className="metrics-card-tag">
                <Trophy size={11} />
                <span>MELHOR DIA</span>
              </div>
              {stats.bestDay ? (
                <>
                  <b>
                    {formatMinutes(stats.bestDay.totalMinutes)}
                    <span className="metrics-subtext">
                      {' '}
                      ({formatRecordDate(stats.bestDay.dateStr)})
                    </span>
                  </b>
                  {stats.isTodayRecord ? (
                    <span className="metrics-record-badge current-record">
                      <Trophy size={9} />
                      HOJE É O RECORDE
                    </span>
                  ) : (
                    <span className="metrics-record-badge diff-record">
                      FALTAM {formatMinutes(stats.minutesRemainingToBeat)}
                    </span>
                  )}
                </>
              ) : (
                <b>—</b>
              )}
            </div>
          </div>

          {/* GRÁFICO DE BARRAS DOS ÚLTIMOS 14 DIAS COM DESTAQUE DO MELHOR DIA */}
          <div className="chart">
            {days.map((d) => {
              const isBestOf14 =
                stats.bestDayOf14Days &&
                stats.bestDayOf14Days.dateStr === d.key &&
                stats.bestDayOf14Days.totalMinutes > 0

              return (
                <div
                  key={d.key}
                  className={isBestOf14 ? 'is-best-day' : ''}
                  title={`${d.date.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}: ${formatMinutes(d.total)}${isBestOf14 ? ' (Melhor dia do período)' : ''}`}
                >
                  {isBestOf14 && (
                    <span className="chart-bar-badge">
                      <Trophy size={8} />
                      RECORDE
                    </span>
                  )}
                  <i>
                    <b style={{ height: `${(d.total / max) * 100}%` }} />
                  </i>
                  <span>
                    {d.date
                      .toLocaleDateString('pt-BR', { weekday: 'short' })
                      .slice(0, 3)
                      .toUpperCase()}
                  </span>
                </div>
              )
            })}
          </div>

          {/* LISTA CRONOLÓGICA DE SESSÕES AGRUPADA POR DIA */}
          <div className="history-list">
            {Object.entries(groups)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([day, items]) => {
                const isAbsoluteRecord =
                  stats.bestDay && stats.bestDay.dateStr === day && stats.bestDay.totalMinutes > 0

                return (
                  <section key={day}>
                    <header>
                      <div className="history-day-title-wrap">
                        <h2>
                          {new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </h2>
                        {isAbsoluteRecord && (
                          <span
                            className="history-record-pill"
                            title="Dia com maior volume de foco de todo o histórico"
                          >
                            <Trophy size={10} />
                            RECORDE
                          </span>
                        )}
                      </div>
                      <span>{formatMinutes(sum(items || []))}</span>
                    </header>
                    {(items || []).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => nav(`/?taskId=${s.task}`)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto auto',
                          gap: '12px',
                          alignItems: 'center',
                        }}
                      >
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
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            textAlign: 'left',
                            minWidth: 0,
                          }}
                        >
                          <strong>{s.expand?.task?.title || 'Tarefa'}</strong>
                          {s.note && s.note.trim() && (
                            <span className="session-note-text" style={{ margin: 0 }}>
                              {s.note}
                            </span>
                          )}
                        </div>
                        <span>{formatMinutes(s.duration_minutes)}</span>
                        <em className={s.status}>{s.status.toUpperCase()}</em>
                      </button>
                    ))}
                  </section>
                )
              })}
          </div>
          {!sessions.length && <p className="history-empty">Nenhuma sessão registrada ainda.</p>}
        </>
      )}
    </div>
  )
}
