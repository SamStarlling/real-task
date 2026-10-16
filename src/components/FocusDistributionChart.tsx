import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Clock, CheckCircle2, AlertCircle, Target, Layers } from 'lucide-react'
import type { SessionRecord } from '@/types'
import { formatMinutes } from '@/lib/format'

export interface FocusTaskSlice {
  taskId: string | null
  taskTitle: string
  minutes: number
  percentage: number
  color: string
}

export interface FocusPeriodSummary {
  totalMinutes: number
  totalSessions: number
  averageMinutesPerSession: number
  completedCount: number
  interruptedCount: number
  completionRate: number // %
  sessionsWithObjectiveCount: number
  objectivesMetCount: number
  objectivesSuccessRate: number | null // % ou null se 0 declarados
  slices: FocusTaskSlice[]
}

// Paleta harmônica dark-first com Champagne (#C5A880) dominante, sem arco-íris berrante
export const FOCUS_PIE_PALETTE = [
  '#C5A880', // Champagne Ouro Fosco (Dominante / Top 1)
  '#A8895E', // Champagne Escuro / Bronze quente (Top 2)
  '#7A889B', // Titânio Ardósia Azulado (Top 3)
  '#5B6E82', // Aço Grafite (Top 4)
  '#475569', // Ardósia Neutra (Top 5)
  '#27272A', // Zinco Profundo ("Outras")
]

export function computeFocusStats(sessions: SessionRecord[]): FocusPeriodSummary {
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((acc, s) => acc + Number(s.duration_minutes || 0), 0)

  let completedCount = 0
  let interruptedCount = 0
  let sessionsWithObjectiveCount = 0
  let objectivesMetCount = 0

  const taskTimeMap: Record<string, { taskId: string | null; taskTitle: string; minutes: number }> =
    {}

  sessions.forEach((s) => {
    const mins = Number(s.duration_minutes || 0)
    if (s.status === 'completa') {
      completedCount += 1
    } else if (s.status === 'interrompida') {
      interruptedCount += 1
    }

    if (s.objective && s.objective.trim().length > 0) {
      sessionsWithObjectiveCount += 1
      if (s.outcome_status === 'batido') {
        objectivesMetCount += 1
      }
    }

    const taskId = s.task || null
    const key = taskId || '__sem_tarefa__'
    const title = s.expand?.task?.title || (taskId ? 'Tarefa' : 'Foco livre (sem tarefa)')

    if (!taskTimeMap[key]) {
      taskTimeMap[key] = { taskId, taskTitle: title, minutes: 0 }
    }
    taskTimeMap[key].minutes += mins
  })

  const averageMinutesPerSession = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0

  const completionRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0

  const objectivesSuccessRate =
    sessionsWithObjectiveCount > 0
      ? Math.round((objectivesMetCount / sessionsWithObjectiveCount) * 100)
      : null

  // Ordenar tarefas por minutos descrescente
  const sortedTasks = Object.values(taskTimeMap).sort((a, b) => b.minutes - a.minutes)

  let slices: FocusTaskSlice[] = []
  if (totalMinutes > 0 && sortedTasks.length > 0) {
    if (sortedTasks.length <= 5) {
      slices = sortedTasks.map((item, idx) => ({
        taskId: item.taskId,
        taskTitle: item.taskTitle,
        minutes: item.minutes,
        percentage: Math.round((item.minutes / totalMinutes) * 100),
        color: FOCUS_PIE_PALETTE[idx] || FOCUS_PIE_PALETTE[FOCUS_PIE_PALETTE.length - 1],
      }))
    } else {
      const top5 = sortedTasks.slice(0, 5)
      const others = sortedTasks.slice(5)
      const othersMinutes = others.reduce((acc, it) => acc + it.minutes, 0)

      slices = top5.map((item, idx) => ({
        taskId: item.taskId,
        taskTitle: item.taskTitle,
        minutes: item.minutes,
        percentage: Math.round((item.minutes / totalMinutes) * 100),
        color: FOCUS_PIE_PALETTE[idx],
      }))

      if (othersMinutes > 0) {
        slices.push({
          taskId: null,
          taskTitle: `Outras (${others.length} tarefas)`,
          minutes: othersMinutes,
          percentage: Math.max(1, Math.round((othersMinutes / totalMinutes) * 100)),
          color: FOCUS_PIE_PALETTE[5],
        })
      }
    }
  }

  return {
    totalMinutes,
    totalSessions,
    averageMinutesPerSession,
    completedCount,
    interruptedCount,
    completionRate,
    sessionsWithObjectiveCount,
    objectivesMetCount,
    objectivesSuccessRate,
    slices,
  }
}

interface FocusDistributionChartProps {
  sessions: SessionRecord[]
  timeFilterLabel?: string
  onSelectTask?: (taskId: string) => void
}

export function FocusDistributionChart({
  sessions,
  timeFilterLabel = '7 dias',
  onSelectTask,
}: FocusDistributionChartProps) {
  const stats = useMemo(() => computeFocusStats(sessions), [sessions])

  const chartData = useMemo(() => {
    return stats.slices.map((slice) => ({
      name: slice.taskTitle,
      value: slice.minutes,
      percentage: slice.percentage,
      color: slice.color,
      taskId: slice.taskId,
    }))
  }, [stats.slices])

  const hasSessions = stats.totalSessions > 0 && stats.totalMinutes > 0

  return (
    <div id="estatisticas" className="focus-distribution-card">
      <header className="focus-distribution-header">
        <div className="focus-distribution-title-group">
          <div className="flex items-center gap-2">
            <h3 className="focus-distribution-title">Estatísticas de foco</h3>
            <span className="focus-distribution-period-chip">{timeFilterLabel}</span>
          </div>
          <p className="focus-distribution-subtitle">
            Distribuição por tarefa e métricas de disciplina no período selecionado
          </p>
        </div>
      </header>

      {/* MÉTRICAS DE RESUMO DO PERÍODO EM 5 CARDS COMPACTOS */}
      <div className="focus-summary-grid">
        {/* TOTAL FOCADO */}
        <div className="focus-summary-card">
          <div className="focus-summary-label">
            <Clock size={11} className="text-[#C5A880]" />
            <span>TOTAL FOCADO</span>
          </div>
          <strong className="focus-summary-value">{formatMinutes(stats.totalMinutes)}</strong>
          <span className="focus-summary-hint">tempo líquido somado</span>
        </div>

        {/* BLOCOS REALIZADOS */}
        <div className="focus-summary-card">
          <div className="focus-summary-label">
            <Layers size={11} className="text-[#A1A1AA]" />
            <span>BLOCOS</span>
          </div>
          <strong className="focus-summary-value">{stats.totalSessions}</strong>
          <span className="focus-summary-hint">
            {stats.totalSessions === 1 ? 'sessão registrada' : 'sessões registradas'}
          </span>
        </div>

        {/* MÉDIA POR BLOCO */}
        <div className="focus-summary-card">
          <div className="focus-summary-label">
            <Clock size={11} className="text-[#A1A1AA]" />
            <span>MÉDIA / BLOCO</span>
          </div>
          <strong className="focus-summary-value">
            {stats.totalSessions > 0 ? formatMinutes(stats.averageMinutesPerSession) : '—'}
          </strong>
          <span className="focus-summary-hint">ritmo por sessão</span>
        </div>

        {/* COMPLETAS VS INTERROMPIDAS */}
        <div className="focus-summary-card">
          <div className="focus-summary-label">
            {stats.completionRate >= 80 ? (
              <CheckCircle2 size={11} className="text-emerald-400" />
            ) : (
              <AlertCircle size={11} className="text-amber-400" />
            )}
            <span>COMPLETAS</span>
          </div>
          <strong className="focus-summary-value">
            {stats.totalSessions > 0 ? `${stats.completionRate}%` : '—'}
          </strong>
          <span className="focus-summary-hint">
            {stats.completedCount} completas · {stats.interruptedCount} int.
          </span>
        </div>

        {/* OBJETIVOS BATIDOS */}
        <div className="focus-summary-card">
          <div className="focus-summary-label">
            <Target size={11} className="text-[#C5A880]" />
            <span>OBJETIVOS BATIDOS</span>
          </div>
          <strong className="focus-summary-value">
            {stats.objectivesSuccessRate !== null ? `${stats.objectivesSuccessRate}%` : '—'}
          </strong>
          <span className="focus-summary-hint">
            {stats.sessionsWithObjectiveCount > 0
              ? `${stats.objectivesMetCount} de ${stats.sessionsWithObjectiveCount} declarados`
              : 'Sem objetivos'}
          </span>
        </div>
      </div>

      {/* GRÁFICO DE PIZZA / DONUT POR TAREFA + LEGENDA */}
      {!hasSessions ? (
        <div className="focus-distribution-empty">
          <Clock size={20} className="text-[#71717A] mb-2" />
          <strong className="text-sm text-[#F4F4F6] block mb-1">
            Nenhum foco registrado neste período
          </strong>
          <p className="text-xs text-[#A1A1AA] max-w-sm m-0">
            Inicie um bloco de foco no temporizador acima ou alterne o filtro de período para
            visualizar o histórico acumulado.
          </p>
        </div>
      ) : (
        <div className="focus-chart-layout">
          {/* GRÁFICO DONUT COM RECHARTS */}
          <div className="focus-chart-donut-wrap">
            <div className="focus-donut-canvas">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const data = payload[0].payload as {
                        name: string
                        value: number
                        percentage: number
                        color: string
                      }
                      return (
                        <div className="focus-chart-tooltip">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: data.color }}
                            />
                            <span className="font-semibold text-xs text-[#F4F4F6] truncate max-w-[200px]">
                              {data.name}
                            </span>
                          </div>
                          <div className="text-[11px] font-['Space_Mono'] text-[#C5A880]">
                            {formatMinutes(data.value)} ({data.percentage}%)
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={84}
                    paddingAngle={2}
                    stroke="#12141C"
                    strokeWidth={2}
                    onClick={(entry: unknown) => {
                      const item = entry as {
                        taskId?: string | null
                        payload?: { taskId?: string | null }
                      }
                      const targetTaskId = item?.taskId || item?.payload?.taskId
                      if (targetTaskId && onSelectTask) {
                        onSelectTask(targetTaskId)
                      }
                    }}
                    cursor="pointer"
                  >
                    {chartData.map((slice, idx) => (
                      <Cell key={`cell-${idx}`} fill={slice.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* RÓTULO CENTRAL DO DONUT */}
              <div className="focus-donut-center-label">
                <span className="focus-donut-center-sub">TOTAL</span>
                <strong className="focus-donut-center-main">
                  {formatMinutes(stats.totalMinutes)}
                </strong>
              </div>
            </div>
          </div>

          {/* LEGENDA HARMÔNICA DE TAREFAS */}
          <div className="focus-legend-list">
            <div className="text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] pb-1 border-b border-white/5 flex justify-between">
              <span>Top Tarefas por Tempo</span>
              <span>Tempo / %</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {stats.slices.map((slice, idx) => {
                const isClickable = Boolean(slice.taskId && onSelectTask)
                return (
                  <div
                    key={`${slice.taskId || 'other'}-${idx}`}
                    onClick={() => {
                      if (isClickable && slice.taskId && onSelectTask) {
                        onSelectTask(slice.taskId)
                      }
                    }}
                    className={`focus-legend-row ${isClickable ? 'is-clickable' : ''}`}
                    title={
                      isClickable
                        ? `Clique para abrir os detalhes de "${slice.taskTitle}"`
                        : slice.taskTitle
                    }
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                  >
                    <div className="focus-legend-left">
                      <span className="focus-legend-dot" style={{ backgroundColor: slice.color }} />
                      <span className="focus-legend-title truncate">{slice.taskTitle}</span>
                    </div>

                    <div className="focus-legend-right">
                      <span className="focus-legend-minutes">{formatMinutes(slice.minutes)}</span>
                      <span className="focus-legend-pct">({slice.percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
