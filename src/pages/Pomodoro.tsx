import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Square,
  Plus,
  RotateCcw,
  Check,
  Archive,
  ArchiveRestore,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Trophy,
  X as XIcon,
} from 'lucide-react'
import { usePomodoro, type ActivePreset } from '@/contexts/PomodoroContext'
import { useAuth } from '@/contexts/AuthContext'
import type { FocusPresetRecord, SessionRecord, TaskRecord } from '@/types'
import {
  getFocusPresets,
  createFocusPreset,
  updateFocusPreset,
  deleteFocusPreset,
} from '@/services/data'
import { toast } from '@/hooks/use-toast'
import { formatMinutes } from '@/lib/format'
import { localDay } from '@/lib/date-parser'
import { computeBestDayStats } from '@/lib/best-day'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PomodoroPageProps {
  sessions: SessionRecord[]
  tasks: TaskRecord[]
  refreshSessions?: () => void
}

export function PomodoroPage({ sessions, tasks, refreshSessions }: PomodoroPageProps) {
  const { user } = useAuth()
  const {
    state,
    seconds,
    overtimeSeconds,
    isOvertime,
    activePreset,
    setActivePreset,
    start,
    toggle,
    finish,
    discard,
    selectTask,
    startBreakFromOvertime,
    startNextBlockFromBreak,
    pendingNote,
    submitPendingNote,
    dismissPendingNote,
    isReadOnlyTab,
  } = usePomodoro()

  // Estado do campo inline de nota na barra inferior
  const [bottomNoteInput, setBottomNoteInput] = useState('')

  // Lista de Presets vinda do PocketBase
  const [presets, setPresets] = useState<FocusPresetRecord[]>([])
  const [loadingPresets, setLoadingPresets] = useState(true)
  const [tab, setTab] = useState<'ativo' | 'arquivado'>('ativo')

  // Modal de criação / edição de preset
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<FocusPresetRecord | null>(null)
  const [presetForm, setPresetForm] = useState({
    name: '',
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    blocksBeforeLongBreak: 4,
  })
  const [savingPreset, setSavingPreset] = useState(false)

  // Seletor de tarefa para vincular na barra inferior
  const [taskPickerOpen, setTaskPickerOpen] = useState(false)

  // Carrega os presets reais do usuário
  const loadPresets = useCallback(async () => {
    if (!user) return
    try {
      const data = await getFocusPresets(true)
      setPresets(data)
    } catch {
      toast({
        title: 'Erro ao carregar presets de foco',
        variant: 'destructive',
      })
    } finally {
      setLoadingPresets(false)
    }
  }, [user])

  useEffect(() => {
    loadPresets()
  }, [loadPresets])

  // Filtragem por Ativo / Arquivado
  const filteredPresets = useMemo(() => {
    return presets.filter((p) => (tab === 'ativo' ? !p.archived : !!p.archived))
  }, [presets, tab])

  // Modal helpers
  const handleOpenCreate = () => {
    setEditingPreset(null)
    setPresetForm({
      name: '',
      workMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      blocksBeforeLongBreak: 4,
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (preset: FocusPresetRecord) => {
    setEditingPreset(preset)
    setPresetForm({
      name: preset.name,
      workMinutes: preset.work_minutes,
      shortBreakMinutes: preset.short_break_minutes,
      longBreakMinutes: preset.long_break_minutes,
      blocksBeforeLongBreak: preset.blocks_before_long_break,
    })
    setModalOpen(true)
  }

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!presetForm.name.trim()) {
      toast({ title: 'Informe o nome do preset', variant: 'destructive' })
      return
    }

    // Validação estrita: mínimo de 5 min para foco e pausas; blocos >= 1
    if (presetForm.workMinutes < 5) {
      toast({
        title: 'Tempo de foco inválido',
        description: 'O tempo de foco deve ser de no mínimo 5 minutos.',
        variant: 'destructive',
      })
      return
    }
    if (presetForm.shortBreakMinutes < 5) {
      toast({
        title: 'Descanso curto inválido',
        description: 'O descanso curto deve ser de no mínimo 5 minutos.',
        variant: 'destructive',
      })
      return
    }
    if (presetForm.longBreakMinutes < 5) {
      toast({
        title: 'Descanso longo inválido',
        description: 'O descanso longo deve ser de no mínimo 5 minutos.',
        variant: 'destructive',
      })
      return
    }
    if (presetForm.blocksBeforeLongBreak < 1) {
      toast({
        title: 'Quantidade de blocos inválida',
        description: 'A quantidade de blocos antes do descanso longo deve ser de pelo menos 1.',
        variant: 'destructive',
      })
      return
    }

    setSavingPreset(true)
    try {
      if (editingPreset) {
        const updated = await updateFocusPreset(editingPreset.id, {
          name: presetForm.name.trim(),
          work_minutes: Math.max(5, Math.round(presetForm.workMinutes)),
          short_break_minutes: Math.max(5, Math.round(presetForm.shortBreakMinutes)),
          long_break_minutes: Math.max(5, Math.round(presetForm.longBreakMinutes)),
          blocks_before_long_break: Math.max(1, Math.round(presetForm.blocksBeforeLongBreak)),
        })
        toast({ title: `Preset '${updated.name}' atualizado` })
        if (activePreset.id === updated.id) {
          setActivePreset(updated)
        }
      } else {
        const created = await createFocusPreset({
          name: presetForm.name.trim(),
          user: user.id,
          work_minutes: Math.max(5, Math.round(presetForm.workMinutes)),
          short_break_minutes: Math.max(5, Math.round(presetForm.shortBreakMinutes)),
          long_break_minutes: Math.max(5, Math.round(presetForm.longBreakMinutes)),
          blocks_before_long_break: Math.max(1, Math.round(presetForm.blocksBeforeLongBreak)),
          archived: false,
        })
        toast({ title: `Preset '${created.name}' criado` })
      }
      setModalOpen(false)
      loadPresets()
    } catch {
      toast({ title: 'Erro ao salvar preset', variant: 'destructive' })
    } finally {
      setSavingPreset(false)
    }
  }

  const handleToggleArchive = async (preset: FocusPresetRecord) => {
    try {
      const willArchive = !preset.archived
      await updateFocusPreset(preset.id, { archived: willArchive })
      toast({
        title: willArchive
          ? `Preset '${preset.name}' arquivado`
          : `Preset '${preset.name}' desarquivado`,
      })
      loadPresets()
    } catch {
      toast({ title: 'Erro ao atualizar preset', variant: 'destructive' })
    }
  }

  const handleDeletePreset = async (preset: FocusPresetRecord) => {
    if (!window.confirm(`Deseja excluir permanentemente o preset '${preset.name}'?`)) return
    try {
      await deleteFocusPreset(preset.id)
      toast({ title: `Preset '${preset.name}' excluído` })
      loadPresets()
    } catch {
      toast({ title: 'Erro ao excluir preset', variant: 'destructive' })
    }
  }

  // Executar preset via botão Play na linha
  const handlePlayPreset = (preset: FocusPresetRecord) => {
    setActivePreset(preset)
    // Se o timer já está rodando nesta mesma tarefa/preset, apenas segue; senão inicia com este preset
    start(state?.task || null, preset)
  }

  // MÉTRICAS DO PAINEL DIREITO "Visão geral"
  const todayStr = localDay()
  const todaySessions = useMemo(
    () => sessions.filter((s) => s.session_date.slice(0, 10) === todayStr),
    [sessions, todayStr],
  )
  const pomosDeHoje = todaySessions.length
  const focoDeHojeMinutos = useMemo(
    () => todaySessions.reduce((acc, s) => acc + Number(s.duration_minutes || 0), 0),
    [todaySessions],
  )
  const pomoTotal = sessions.length
  const duracaoTotalMinutos = useMemo(
    () => sessions.reduce((acc, s) => acc + Number(s.duration_minutes || 0), 0),
    [sessions],
  )

  // Estatísticas de recordes derivadas para a visão geral
  const bestDayStats = useMemo(() => computeBestDayStats(sessions, new Date()), [sessions])

  // Formato estilo print TickTick: "339h 58m" ou "0m"
  const formatTotalTime = (totalMin: number) => {
    const totalRounded = Math.round(totalMin)
    const hours = Math.floor(totalRounded / 60)
    const mins = totalRounded % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Agrupamento cronológico da timeline "Foco em registro"
  const sessionsByDay = useMemo(() => {
    const groups: Record<string, SessionRecord[]> = {}
    sessions.forEach((s) => {
      const day = s.session_date ? s.session_date.slice(0, 10) : s.started_at.slice(0, 10)
      if (!groups[day]) groups[day] = []
      groups[day].push(s)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [sessions])

  // Formatação de data amigável estilo print: "1 out", "30 set", "Hoje", "Ontem"
  const formatDayHeader = (dayStr: string) => {
    const [y, m, d] = dayStr.split('-').map(Number)
    const date = new Date(y, m - 1, d, 12, 0, 0)
    const now = new Date()
    const isToday = dayStr === localDay(now)
    const isYesterday = dayStr === localDay(new Date(Date.now() - 86400000))

    if (isToday) return 'Hoje'
    if (isYesterday) return 'Ontem'

    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
  }

  // Helper de minutos / segundos do timer da barra fixa
  const timerMinutes = Math.floor(seconds / 60)
  const timerSeconds = seconds % 60
  const formattedTimer = isOvertime
    ? `+${String(Math.floor(overtimeSeconds / 60)).padStart(2, '0')}:${String(overtimeSeconds % 60).padStart(2, '0')}`
    : `${String(timerMinutes).padStart(2, '0')}:${String(timerSeconds).padStart(2, '0')}`

  const isRunning = state?.status === 'rodando'
  const isPaused = state?.status === 'pausado'
  const hasActiveSession = !!state

  // Fase e bloco
  const currentBlock = state?.currentBlock ?? 1
  const totalBlocks = state?.totalBlocks ?? activePreset.blocksBeforeLongBreak
  const phaseLabel =
    state?.phase === 'foco'
      ? `FOCO · BLOCO ${currentBlock}/${totalBlocks}${isOvertime ? ' (EXCESSO)' : ''}`
      : state?.phase === 'descanso_longo'
        ? `DESCANSO LONGO · BLOCO ${currentBlock}/${totalBlocks}${isOvertime ? ' (EXCESSO)' : ''}`
        : state?.phase === 'descanso_curto'
          ? `DESCANSO CURTO · BLOCO ${currentBlock}/${totalBlocks}${isOvertime ? ' (EXCESSO)' : ''}`
          : `FOCO · ${activePreset.name.toUpperCase()}`

  return (
    <div className="pomodoro-page-container">
      <div className="pomodoro-columns-layout">
        {/* COLUNA ESQUERDA: PRESETS */}
        <section className="pomodoro-presets-column">
          <header className="pomodoro-presets-header">
            <h1 className="pomodoro-title">Pomodoro</h1>
            <div className="pomodoro-presets-actions">
              {/* Chips Ativo / Arquivado estilo TickTick */}
              <div className="pomodoro-tab-chips">
                <button
                  type="button"
                  className={`pomodoro-tab-chip ${tab === 'ativo' ? 'active' : ''}`}
                  onClick={() => setTab('ativo')}
                >
                  Ativo
                </button>
                <button
                  type="button"
                  className={`pomodoro-tab-chip ${tab === 'arquivado' ? 'active' : ''}`}
                  onClick={() => setTab('arquivado')}
                >
                  Arquivado
                </button>
              </div>

              <button
                type="button"
                className="pomodoro-add-preset-btn"
                onClick={handleOpenCreate}
                title="Novo preset de foco"
              >
                <Plus size={16} />
              </button>
            </div>
          </header>

          {/* LISTA DE PRESETS */}
          <div className="pomodoro-presets-list">
            {loadingPresets ? (
              <div className="pomodoro-presets-empty">Carregando presets...</div>
            ) : filteredPresets.length === 0 ? (
              <div className="pomodoro-presets-empty">
                {tab === 'ativo'
                  ? 'Nenhum preset ativo. Clique no botão "+" para criar.'
                  : 'Nenhum preset arquivado.'}
              </div>
            ) : (
              filteredPresets.map((preset) => {
                const isSelected = activePreset.id === preset.id
                return (
                  <div
                    key={preset.id}
                    className={`pomodoro-preset-row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setActivePreset(preset)}
                  >
                    <div className="pomodoro-preset-left">
                      <span className="pomodoro-preset-bullet" />
                      <span className="pomodoro-preset-name" title={preset.name}>
                        {preset.name}
                      </span>
                    </div>

                    <div className="pomodoro-preset-right" onClick={(e) => e.stopPropagation()}>
                      <span className="pomodoro-preset-time">{preset.work_minutes}m</span>

                      {tab === 'ativo' ? (
                        <button
                          type="button"
                          className="pomodoro-preset-play-btn"
                          onClick={() => handlePlayPreset(preset)}
                          title={`Iniciar '${preset.name}'`}
                        >
                          <Play size={13} fill="currentColor" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="pomodoro-preset-restore-btn"
                          onClick={() => handleToggleArchive(preset)}
                          title="Desarquivar preset"
                        >
                          <ArchiveRestore size={14} />
                        </button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="pomodoro-preset-menu-btn"
                            title="Opções do preset"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#12141C] border border-[#C5A880]/20 text-[#F4F4F6]"
                        >
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(preset)}
                            className="cursor-pointer hover:bg-white/5 text-xs font-['Plus_Jakarta_Sans']"
                          >
                            <Edit2 size={13} className="mr-2 text-[#C5A880]" />
                            Editar preset
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleArchive(preset)}
                            className="cursor-pointer hover:bg-white/5 text-xs font-['Plus_Jakarta_Sans']"
                          >
                            {preset.archived ? (
                              <>
                                <ArchiveRestore size={13} className="mr-2 text-[#C5A880]" />
                                Desarquivar
                              </>
                            ) : (
                              <>
                                <Archive size={13} className="mr-2 text-[#A1A1AA]" />
                                Arquivar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePreset(preset)}
                            className="cursor-pointer hover:bg-red-500/10 text-xs font-['Plus_Jakarta_Sans'] text-red-400"
                          >
                            <Trash2 size={13} className="mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* COLUNA DIREITA: VISÃO GERAL (4 CARTÕES + TIMELINE) */}
        <section className="pomodoro-overview-column">
          <header className="pomodoro-overview-header">
            <h2 className="pomodoro-overview-title">Visão geral</h2>
          </header>

          {/* 4 CARTÕES DE MÉTRICAS COM MARCAÇÃO DISCRETA DE RECORDE */}
          <div className="pomodoro-metrics-grid">
            <div className="pomodoro-metric-card">
              <span className="pomodoro-metric-label">Pomos de hoje</span>
              <strong className="pomodoro-metric-value">{pomosDeHoje}</strong>
            </div>

            <div className="pomodoro-metric-card">
              <div className="pomodoro-metric-label-row">
                <span className="pomodoro-metric-label">Foco de hoje</span>
                {bestDayStats.isTodayRecord && (
                  <span
                    className="pomodoro-metric-record-chip"
                    title="Hoje é o seu recorde absoluto de foco"
                  >
                    <Trophy size={8} />
                    RECORDE
                  </span>
                )}
              </div>
              <strong className="pomodoro-metric-value">
                {formatTotalTime(focoDeHojeMinutos)}
              </strong>
              {bestDayStats.bestDay &&
                !bestDayStats.isTodayRecord &&
                bestDayStats.minutesRemainingToBeat > 0 && (
                  <span className="pomodoro-metric-subhint">
                    Faltam {formatTotalTime(bestDayStats.minutesRemainingToBeat)} p/ recorde
                  </span>
                )}
            </div>

            <div className="pomodoro-metric-card">
              <span className="pomodoro-metric-label">Pomo Total</span>
              <strong className="pomodoro-metric-value">{pomoTotal}</strong>
            </div>

            <div className="pomodoro-metric-card">
              <span className="pomodoro-metric-label">Duração Total Focada</span>
              <strong className="pomodoro-metric-value">
                {formatTotalTime(duracaoTotalMinutos)}
              </strong>
            </div>
          </div>

          {/* TIMELINE: FOCO EM REGISTRO */}
          <div className="pomodoro-timeline-section">
            <div className="pomodoro-timeline-header">
              <h3>Foco em registro.</h3>
            </div>

            {sessionsByDay.length === 0 ? (
              <p className="pomodoro-timeline-empty">Nenhuma sessão registrada ainda.</p>
            ) : (
              <div className="pomodoro-timeline-days">
                {sessionsByDay.map(([day, daySessions]) => (
                  <div key={day} className="pomodoro-timeline-day-group">
                    <span className="pomodoro-timeline-day-title">{formatDayHeader(day)}</span>

                    <div className="pomodoro-timeline-events">
                      {daySessions.map((s, idx) => {
                        const startD = new Date(s.started_at)
                        const endD = new Date(s.ended_at)
                        const timeRange = `${startD.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} - ${endD.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                        const durationFormatted = formatTotalTime(Number(s.duration_minutes || 0))
                        const taskName = s.expand?.task?.title || 'Foco livre'

                        return (
                          <div key={s.id} className="pomodoro-timeline-item">
                            <div className="pomodoro-timeline-left-node">
                              <span className="pomodoro-timeline-dot" />
                              {idx < daySessions.length - 1 && (
                                <span className="pomodoro-timeline-connector" />
                              )}
                            </div>

                            <div className="pomodoro-timeline-content">
                              <div className="pomodoro-timeline-row">
                                <span className="pomodoro-timeline-hours">{timeRange}</span>
                                <span className="pomodoro-timeline-duration">
                                  {durationFormatted}
                                </span>
                              </div>
                              <div className="pomodoro-timeline-task-name">{taskName}</div>
                              {s.note && s.note.trim() && (
                                <div
                                  className="pomodoro-timeline-note"
                                  title="Nota do bloco de foco"
                                >
                                  {s.note}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* BARRA INFERIOR FIXA DO TIMER (ESTILO TICKTICK / DESIGN SYSTEM BARBOSA) */}
      <footer className="pomodoro-bottom-bar">
        <div className="pomodoro-bottom-bar-inner">
          <div className="pomodoro-bottom-left">
            {/* Ícone de status sutil */}
            <div
              className={`pomodoro-bottom-avatar ${isRunning ? 'running' : ''}`}
              title={phaseLabel}
            >
              <span className="pomodoro-bottom-avatar-icon" />
            </div>

            <div className="pomodoro-bottom-meta">
              <span className="pomodoro-bottom-eyebrow">{phaseLabel}</span>
              <div className="pomodoro-bottom-time-row">
                <span className={`pomodoro-bottom-digits ${isOvertime ? 'is-overtime' : ''}`}>
                  {formattedTimer}
                </span>

                {/* Seletor de tarefa para vinculação */}
                <DropdownMenu open={taskPickerOpen} onOpenChange={setTaskPickerOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="pomodoro-bottom-task-tag"
                      title="Clique para vincular ou alterar a tarefa em foco"
                    >
                      <span className="pomodoro-task-dot" />
                      <span className="pomodoro-task-title">
                        {state?.task ? state.task.title : 'Vincular tarefa...'}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="bg-[#12141C] border border-[#C5A880]/20 text-[#F4F4F6] w-72 max-h-64 overflow-y-auto"
                  >
                    <DropdownMenuItem
                      onClick={() => selectTask(null)}
                      className="cursor-pointer hover:bg-white/5 text-xs font-['Plus_Jakarta_Sans']"
                    >
                      <em>Nenhuma tarefa vinculada (foco livre)</em>
                    </DropdownMenuItem>
                    {tasks
                      .filter((t) => !t.done)
                      .map((t) => (
                        <DropdownMenuItem
                          key={t.id}
                          onClick={() => selectTask(t)}
                          className="cursor-pointer hover:bg-white/5 text-xs font-['Plus_Jakarta_Sans'] flex items-center justify-between"
                        >
                          <span className="truncate">{t.title}</span>
                          {state?.task?.id === t.id && (
                            <Check size={12} className="text-[#C5A880] ml-2 shrink-0" />
                          )}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="pomodoro-bottom-controls">
            {/* Aviso discreto de trava de abas */}
            {isReadOnlyTab && (
              <span className="pomodoro-readonly-badge">
                Timer ativo em outra aba (somente leitura)
              </span>
            )}

            {/* Botão de transição manual exigido pelo usuário */}
            {isOvertime && !isReadOnlyTab && (
              <>
                {state?.phase === 'foco' ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await startBreakFromOvertime()
                      if (refreshSessions) refreshSessions()
                    }}
                    className="pomodoro-transition-btn"
                    title="Encerrar foco, registrar sessão e iniciar descanso"
                  >
                    Iniciar Pausa
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await startNextBlockFromBreak()
                      if (refreshSessions) refreshSessions()
                    }}
                    className="pomodoro-transition-btn"
                    title="Iniciar o próximo bloco de foco"
                  >
                    Iniciar Próximo Bloco
                  </button>
                )}
              </>
            )}

            {/* Prompt discreto de nota pós-foco */}
            {pendingNote && (
              <form
                className="pomodoro-bottom-note-prompt"
                onSubmit={(e) => {
                  e.preventDefault()
                  submitPendingNote(bottomNoteInput)
                  setBottomNoteInput('')
                  if (refreshSessions) refreshSessions()
                }}
              >
                <span className="pomodoro-bottom-note-label">
                  <MessageSquare size={12} />
                  Bloco {pendingNote.blockNumber}:
                </span>
                <input
                  type="text"
                  autoFocus
                  maxLength={500}
                  placeholder="O que foi feito? (opcional)"
                  value={bottomNoteInput}
                  onChange={(e) => setBottomNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      dismissPendingNote()
                      setBottomNoteInput('')
                    }
                  }}
                  className="pomodoro-bottom-note-input"
                />
                <button
                  type="submit"
                  className="pomodoro-bottom-note-confirm-btn"
                  title="Confirmar nota (Enter)"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismissPendingNote()
                    setBottomNoteInput('')
                  }}
                  className="pomodoro-bottom-note-skip-btn"
                  title="Pular nota (Esc)"
                >
                  <XIcon size={14} />
                </button>
              </form>
            )}

            {!isReadOnlyTab && (
              <>
                {/* Botão Play / Pause */}
                <button
                  type="button"
                  className="pomodoro-bottom-action-btn primary"
                  onClick={toggle}
                  title={isRunning ? 'Pausar foco' : 'Iniciar foco'}
                >
                  {isRunning ? (
                    <Pause size={18} fill="currentColor" />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                </button>

                {/* Botão Encerrar e Registrar */}
                <button
                  type="button"
                  className="pomodoro-bottom-action-btn"
                  onClick={async () => {
                    await finish()
                    if (refreshSessions) refreshSessions()
                  }}
                  disabled={!hasActiveSession}
                  title="Encerrar e registrar tempo"
                >
                  <Square size={16} />
                </button>

                {/* Botão Descartar sem registrar */}
                {hasActiveSession && (
                  <button
                    type="button"
                    className="pomodoro-bottom-action-btn text-muted"
                    onClick={discard}
                    title="Descartar timer sem registrar"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </footer>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE PRESET */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#12141C] border border-[#C5A880]/20 text-[#F4F4F6] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Clash_Display'] font-semibold text-lg text-[#F4F4F6]">
              {editingPreset ? 'Editar Preset de Foco' : 'Novo Preset de Foco'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePreset} className="space-y-4 py-2">
            <div>
              <label className="block text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1">
                Nome do Preset
              </label>
              <input
                type="text"
                required
                maxLength={60}
                placeholder="Ex.: Deep Work, Estudo, Leitura"
                value={presetForm.name}
                onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })}
                className="w-full bg-[#090A0E] border border-[rgba(197,168,128,0.22)] rounded-lg px-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Foco (minutos)
                </label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  required
                  value={presetForm.workMinutes}
                  onChange={(e) =>
                    setPresetForm({ ...presetForm, workMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-[#090A0E] border border-[rgba(197,168,128,0.22)] rounded-lg px-3 py-2 text-sm font-['Space_Mono'] text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                />
                <span className="text-[10px] text-[#A1A1AA] font-['Space_Mono'] mt-1 block">
                  Mínimo 5 min
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Descanso Curto (min)
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  required
                  value={presetForm.shortBreakMinutes}
                  onChange={(e) =>
                    setPresetForm({ ...presetForm, shortBreakMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-[#090A0E] border border-[rgba(197,168,128,0.22)] rounded-lg px-3 py-2 text-sm font-['Space_Mono'] text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                />
                <span className="text-[10px] text-[#A1A1AA] font-['Space_Mono'] mt-1 block">
                  Mínimo 5 min
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Descanso Longo (min)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  required
                  value={presetForm.longBreakMinutes}
                  onChange={(e) =>
                    setPresetForm({ ...presetForm, longBreakMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-[#090A0E] border border-[rgba(197,168,128,0.22)] rounded-lg px-3 py-2 text-sm font-['Space_Mono'] text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                />
                <span className="text-[10px] text-[#A1A1AA] font-['Space_Mono'] mt-1 block">
                  Mínimo 5 min
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Blocos p/ Longo
                </label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  required
                  value={presetForm.blocksBeforeLongBreak}
                  onChange={(e) =>
                    setPresetForm({
                      ...presetForm,
                      blocksBeforeLongBreak: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#090A0E] border border-[rgba(197,168,128,0.22)] rounded-lg px-3 py-2 text-sm font-['Space_Mono'] text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                />
                <span className="text-[10px] text-[#A1A1AA] font-['Space_Mono'] mt-1 block">
                  Mínimo 1 bloco
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] hover:text-[#F4F4F6] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingPreset}
                className="px-4 py-2 bg-[#C5A880] hover:bg-[#d6bc96] text-[#090A0E] font-medium text-xs font-['Space_Mono'] uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
              >
                {savingPreset ? 'Salvando...' : 'Salvar Preset'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
