import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Sliders,
  Target,
  Trophy,
  TrendingUp,
  TrendingDown,
  XCircle,
  Flame,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import type { SessionRecord } from '@/types'
import { formatMinutes } from '@/lib/format'
import { useAuth } from '@/contexts/AuthContext'
import { computeWeeklyReport } from '@/lib/weekly-report'

export function WeeklyReport({ sessions }: { sessions: SessionRecord[] }) {
  const nav = useNavigate()
  const { user } = useAuth()
  const [weekOffset, setWeekOffset] = useState<number>(0)

  // Recalcular métricas do relatório para a semana selecionada
  const report = useMemo(() => {
    return computeWeeklyReport({
      sessions,
      user,
      referenceDate: new Date(),
      weekOffset,
    })
  }, [sessions, user, weekOffset])

  const hasAnySessionInPeriod = report.totalSessionsCount > 0
  const maxDayMinutes = Math.max(
    ...report.days.map((d) => Math.max(d.focusMinutes, d.goalMinutes)),
    60,
  )

  return (
    <div className="weekly-report-container">
      {/* NAVEGAÇÃO DE SEMANA (Semana corrente / Semanas anteriores) */}
      <section className="weekly-report-nav-bar">
        <div className="weekly-nav-actions">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="weekly-nav-btn"
            title="Ver semana anterior"
            aria-label="Ver semana anterior"
          >
            <ChevronLeft size={16} />
            <span className="weekly-nav-btn-text">ANTERIOR</span>
          </button>

          <div className="weekly-period-info">
            <div className="weekly-period-badge-wrap">
              <span className="weekly-period-label">{report.periodLabel}</span>
              {report.isCurrentWeek ? (
                <span className="weekly-status-tag current">SEMANA ATUAL</span>
              ) : (
                <span className="weekly-status-tag past">HISTÓRICO</span>
              )}
            </div>
            <span className="weekly-period-sub">
              {report.isCurrentWeek
                ? 'SEGUNDA A DOMINGO (EM CURSO)'
                : 'SEGUNDA A DOMINGO (CONSOLIDADA)'}
            </span>
          </div>

          <div className="weekly-nav-right">
            {!report.isCurrentWeek && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="weekly-today-btn"
                title="Voltar para a semana atual"
              >
                <RotateCcw size={12} />
                <span>SEMANA ATUAL</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              disabled={report.isCurrentWeek}
              className="weekly-nav-btn"
              title={report.isCurrentWeek ? 'Semana atual é o limite futuro' : 'Ver próxima semana'}
              aria-label="Ver próxima semana"
            >
              <span className="weekly-nav-btn-text">PRÓXIMA</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* BLOCO EXECUTIVO: 4 NÚMEROS AGREGADOS DA SEMANA */}
      <section className="weekly-metrics-grid">
        {/* CARTÃO 1: TOTAL FOCADO VS META */}
        <div className="weekly-metric-card">
          <div className="weekly-metric-tag">
            <Clock3 size={11} />
            <span>TOTAL FOCADO</span>
          </div>
          <div className="weekly-metric-value-wrap">
            <strong className="weekly-metric-main">
              {formatMinutes(report.totalFocusMinutes)}
            </strong>
            <span className="weekly-metric-goal-sub">
              de {report.totalGoalMinutes > 0 ? formatMinutes(report.totalGoalMinutes) : '0m'}{' '}
              esperados
            </span>
          </div>
          <div className="weekly-metric-footer">
            <span
              className={`weekly-pct-badge ${
                report.overallPercentage >= 100
                  ? 'reached'
                  : report.overallPercentage >= 70
                    ? 'good'
                    : ''
              }`}
            >
              {report.totalGoalMinutes > 0 ? `${report.overallPercentage}% DA META` : 'SEM METAS'}
            </span>
          </div>
        </div>

        {/* CARTÃO 2: DIAS QUE BATERAM A META */}
        <div className="weekly-metric-card">
          <div className="weekly-metric-tag">
            <Target size={11} />
            <span>DIAS CUMPRIDOS</span>
          </div>
          <div className="weekly-metric-value-wrap">
            <strong className="weekly-metric-main">
              {report.daysGoalMetCount} / {report.daysWithGoalCount}
            </strong>
            <span className="weekly-metric-goal-sub">
              {report.daysWithGoalCount > 0
                ? `${Math.round((report.daysGoalMetCount / report.daysWithGoalCount) * 100)}% dos dias com meta`
                : 'Nenhum dia com meta'}
            </span>
          </div>
          <div className="weekly-metric-footer">
            <span
              className={`weekly-goal-days-badge ${
                report.daysGoalMetCount === report.daysWithGoalCount && report.daysWithGoalCount > 0
                  ? 'all-reached'
                  : ''
              }`}
            >
              {report.daysGoalMetCount === report.daysWithGoalCount && report.daysWithGoalCount > 0
                ? '100% DIAS BATIDOS'
                : `${report.daysWithGoalCount - report.daysGoalMetCount} DIA(S) RESTANTE(S)`}
            </span>
          </div>
        </div>

        {/* CARTÃO 3: MELHOR DIA DA SEMANA */}
        <div className="weekly-metric-card">
          <div className="weekly-metric-tag">
            <Trophy size={11} />
            <span>PICO DA SEMANA</span>
          </div>
          <div className="weekly-metric-value-wrap">
            {report.bestDay ? (
              <>
                <strong className="weekly-metric-main">
                  {formatMinutes(report.bestDay.minutes)}
                </strong>
                <span className="weekly-metric-goal-sub">
                  {report.bestDay.weekdayLong.toUpperCase()}
                </span>
              </>
            ) : (
              <>
                <strong className="weekly-metric-main">—</strong>
                <span className="weekly-metric-goal-sub">SEM SESSÕES</span>
              </>
            )}
          </div>
          <div className="weekly-metric-footer">
            {report.bestDay ? (
              <span className="weekly-best-day-badge">
                <Flame size={10} /> MAIOR VOLUME
              </span>
            ) : (
              <span className="weekly-subtle-hint">NENHUM FOCO</span>
            )}
          </div>
        </div>

        {/* CARTÃO 4: COMPARAÇÃO COM A SEMANA ANTERIOR (DELTA) */}
        <div className="weekly-metric-card">
          <div className="weekly-metric-tag">
            {report.deltaMinutes >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>VS. SEMANA ANTERIOR</span>
          </div>
          <div className="weekly-metric-value-wrap">
            <strong
              className={`weekly-metric-main ${
                report.deltaMinutes > 0
                  ? 'delta-positive'
                  : report.deltaMinutes < 0
                    ? 'delta-negative'
                    : ''
              }`}
            >
              {report.deltaMinutes > 0
                ? `+${formatMinutes(report.deltaMinutes)}`
                : report.deltaMinutes < 0
                  ? `-${formatMinutes(Math.abs(report.deltaMinutes))}`
                  : '0 MIN'}
            </strong>
            <span className="weekly-metric-goal-sub">
              anterior: {formatMinutes(report.previousWeekTotalMinutes)}
            </span>
          </div>
          <div className="weekly-metric-footer">
            {report.deltaPercentage !== null ? (
              <span
                className={`weekly-delta-badge ${
                  report.deltaPercentage >= 0 ? 'positive' : 'negative'
                }`}
              >
                {report.deltaPercentage >= 0
                  ? `+${report.deltaPercentage}%`
                  : `${report.deltaPercentage}%`}
              </span>
            ) : (
              <span className="weekly-subtle-hint">SEM BASE ANTERIOR</span>
            )}
          </div>
        </div>
      </section>

      {/* BLOCO PRINCIPAL: CRUZAMENTO SESSÕES × METAS POR DIA DA SEMANA */}
      <section className="weekly-cross-card">
        <header className="weekly-card-header">
          <div className="weekly-card-title-group">
            <h2 className="weekly-section-title">Cruzamento Diário: Foco vs. Meta</h2>
            <span className="weekly-section-subtitle">
              Soma real de sessões confrontada com a meta configurada para cada dia
            </span>
          </div>

          <button
            type="button"
            onClick={() => nav('/configuracoes')}
            className="weekly-edit-goals-btn"
            title="Ajustar metas semanais em Configurações"
          >
            <Sliders size={12} />
            <span>CONFIGURAR METAS</span>
          </button>
        </header>

        {/* GRADE DE DIAS (7 DIAS: SEGUNDA A DOMINGO) */}
        <div className="weekly-days-list">
          {report.days.map((day) => {
            const pctDisplay = day.hasGoal ? `${day.percentage}%` : 'FOLGA'
            const barFillWidth = day.hasGoal
              ? Math.min(100, day.percentage)
              : day.focusMinutes > 0
                ? 100
                : 0

            return (
              <div
                key={day.dateStr}
                className={`weekly-day-row ${day.isGoalReached ? 'is-reached' : ''} ${
                  day.isToday ? 'is-today' : ''
                } ${!day.hasGoal ? 'no-goal' : ''}`}
              >
                {/* COLUNA ESQUERDA: DIA E DATA */}
                <div className="weekly-day-meta-col">
                  <div className="weekly-day-name-row">
                    <span className="weekly-day-short">{day.weekdayShort.toUpperCase()}</span>
                    {day.isToday && <span className="weekly-today-tag">HOJE</span>}
                  </div>
                  <span className="weekly-day-date-str">
                    {day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>

                {/* COLUNA CENTRAL: BARRA DE PROGRESSO E INDICADORES VISUAIS */}
                <div className="weekly-day-bar-col">
                  <div className="weekly-day-bar-header">
                    <div className="weekly-day-times">
                      <span className="weekly-day-actual">
                        FOCO: <b>{formatMinutes(day.focusMinutes)}</b>
                      </span>
                      <span className="weekly-day-divider">/</span>
                      <span className="weekly-day-target">
                        META: <b>{day.hasGoal ? formatMinutes(day.goalMinutes) : 'SEM META'}</b>
                      </span>
                    </div>

                    <div className="weekly-day-status-pill-wrap">
                      {!day.hasGoal ? (
                        day.focusMinutes > 0 ? (
                          <span className="weekly-day-status-pill bonus">
                            +EXTRA {formatMinutes(day.focusMinutes)}
                          </span>
                        ) : (
                          <span className="weekly-day-status-pill off">FOLGA</span>
                        )
                      ) : day.isGoalReached ? (
                        <span className="weekly-day-status-pill reached">
                          <CheckCircle2 size={11} /> ATINGIDA
                        </span>
                      ) : day.focusMinutes > 0 ? (
                        <span className="weekly-day-status-pill pending">
                          FALTAM {formatMinutes(day.goalMinutes - day.focusMinutes)}
                        </span>
                      ) : (
                        <span className="weekly-day-status-pill empty">NÃO INICIADA</span>
                      )}

                      <span className={`weekly-day-pct-text ${day.isGoalReached ? 'reached' : ''}`}>
                        {pctDisplay}
                      </span>
                    </div>
                  </div>

                  {/* TRILHO DA BARRA COM PREENCHIMENTO */}
                  <div className="weekly-day-bar-track">
                    <div
                      className={`weekly-day-bar-fill ${day.isGoalReached ? 'reached' : ''} ${
                        !day.hasGoal && day.focusMinutes > 0 ? 'extra' : ''
                      }`}
                      style={{ width: `${barFillWidth}%` }}
                    />
                  </div>
                </div>

                {/* COLUNA DIREITA: CONTAGEM DE SESSÕES */}
                <div className="weekly-day-sessions-col">
                  <span className="weekly-sessions-count-label">
                    {day.sessionsCount === 1 ? '1 sessão' : `${day.sessionsCount} sessões`}
                  </span>
                  {day.sessionsCount > 0 && (
                    <span className="weekly-sessions-breakdown">
                      {day.completedSessionsCount} comp · {day.interruptedSessionsCount} int
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* RESUMO DE RODAPÉ DA GRADE */}
        <div className="weekly-cross-footer">
          <div className="weekly-footer-legend">
            <span className="weekly-legend-item">
              <i className="weekly-legend-dot reached" /> Meta atingida (champagne)
            </span>
            <span className="weekly-legend-item">
              <i className="weekly-legend-dot pending" /> Em progresso / abaixo
            </span>
            <span className="weekly-legend-item">
              <i className="weekly-legend-dot off" /> Sem meta configurada
            </span>
          </div>

          <div className="weekly-footer-totals">
            <span>
              TOTAL SEMANAL: <b>{formatMinutes(report.totalFocusMinutes)}</b> /{' '}
              {formatMinutes(report.totalGoalMinutes)}
            </span>
          </div>
        </div>
      </section>

      {/* BLOCO ADICIONAL: DISTRIBUIÇÃO E QUALIDADE DE SESSÕES + TOP TAREFAS */}
      <div className="weekly-split-row">
        {/* QUALIDADE DAS SESSÕES: COMPLETAS VS INTERROMPIDAS */}
        <section className="weekly-subcard">
          <h3 className="weekly-subcard-title">Qualidade e Disciplina</h3>
          <p className="weekly-subcard-desc">
            Taxa de sessões concluídas sem interrupção precoce no período
          </p>

          <div className="weekly-quality-stats">
            <div className="weekly-quality-circle-wrap">
              <div className="weekly-quality-number">
                <strong>{report.completionRate}%</strong>
                <span>COMPLETAS</span>
              </div>
            </div>

            <div className="weekly-quality-legend">
              <div className="weekly-quality-row">
                <span className="quality-dot complete" />
                <span className="quality-label">Sessões Completas</span>
                <strong className="quality-val">{report.completedSessionsCount}</strong>
              </div>
              <div className="weekly-quality-row">
                <span className="quality-dot interrupted" />
                <span className="quality-label">Interrompidas</span>
                <strong className="quality-val">{report.interruptedSessionsCount}</strong>
              </div>
              <div className="weekly-quality-row total">
                <span className="quality-label">Total de Blocos</span>
                <strong className="quality-val">{report.totalSessionsCount}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* TOP TAREFAS DA SEMANA */}
        <section className="weekly-subcard">
          <h3 className="weekly-subcard-title">Top Tarefas da Semana</h3>
          <p className="weekly-subcard-desc">
            Distribuição do tempo real dedicado por tarefa nas sessões
          </p>

          <div className="weekly-top-tasks-list">
            {report.topTasks.length === 0 ? (
              <div className="weekly-empty-hint">Nenhuma sessão registrada nesta semana</div>
            ) : (
              report.topTasks.slice(0, 5).map((t, idx) => {
                const taskPct =
                  report.totalFocusMinutes > 0
                    ? Math.round((t.minutes / report.totalFocusMinutes) * 100)
                    : 0

                return (
                  <div
                    key={t.taskId}
                    className="weekly-task-item"
                    onClick={() => {
                      if (t.taskId && t.taskId !== 'sem_tarefa') {
                        nav(`/?taskId=${t.taskId}`)
                      }
                    }}
                    role={t.taskId && t.taskId !== 'sem_tarefa' ? 'button' : undefined}
                    tabIndex={t.taskId && t.taskId !== 'sem_tarefa' ? 0 : undefined}
                  >
                    <div className="weekly-task-rank">{idx + 1}</div>
                    <div className="weekly-task-info">
                      <div className="weekly-task-name-row">
                        <strong className="weekly-task-title">{t.title}</strong>
                        <span className="weekly-task-minutes">{formatMinutes(t.minutes)}</span>
                      </div>
                      <div className="weekly-task-bar-track">
                        <div className="weekly-task-bar-fill" style={{ width: `${taskPct}%` }} />
                      </div>
                      <div className="weekly-task-meta-row">
                        <span>
                          {t.sessionsCount} {t.sessionsCount === 1 ? 'sessão' : 'sessões'} (
                          {taskPct}% do foco)
                        </span>
                        {t.completedCount > 0 && <span>{t.completedCount} sem cortes</span>}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      {/* ESTADO VAZIO LIMPO QUANDO NÃO HÁ SESSÕES NO PERÍODO */}
      {!hasAnySessionInPeriod && (
        <div className="weekly-empty-state-banner">
          <Clock3 size={18} className="weekly-empty-icon" />
          <div className="weekly-empty-content">
            <strong>Nenhuma sessão de foco nesta semana</strong>
            <p>
              Inicie um bloco no temporizador Pomodoro ou capture novas tarefas para cruzar o tempo
              real com suas metas.
            </p>
          </div>
          <button type="button" onClick={() => nav('/pomodoro')} className="weekly-start-focus-btn">
            <span>IR PARA POMODORO</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
