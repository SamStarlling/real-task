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
  Target,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckSquare,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { usePomodoro, type ActivePreset } from '@/contexts/PomodoroContext'
import { useAuth } from '@/contexts/AuthContext'
import type { FocusPresetRecord, SessionRecord, TaskRecord } from '@/types'
import {
  getFocusPresets,
  createFocusPreset,
  updateFocusPreset,
  deleteFocusPreset,
  updateSessionDetails,
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
    selectedTask,
    currentObjective,
    setCurrentObjective,
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
    setObjectiveForRunningBlock,
    startBreakFromOvertime,
    startNextBlockFromBreak,
    pendingNote,
    submitPendingNote,
    dismissPendingNote,
    isReadOnlyTab,
  } = usePomodoro()

  // Formulário do painel de notas pós-foco
  const [doneInput, setDoneInput] = useState('')
  const [nextInput, setNextInput] = useState('')
  const [pendingVerdict, setPendingVerdict] = useState<SessionRecord['outcome_status'] | null>(null)

  // Filtro de período da timeline (Hoje | 7 dias | 30 dias | Tudo)
  const [timeFilter, setTimeFilter] = useState<'hoje' | '7dias' | '30dias' | 'tudo'>('7dias')
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({})

  // Modal de edição de sessão existente na timeline
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(null)
  const [editSessionNote, setEditSessionNote] = useState('')
  const [editSessionObjective, setEditSessionObjective] = useState('')
  const [editSessionOutcome, setEditSessionOutcome] = useState<
    SessionRecord['outcome_status'] | ''
  >('')
  const [savingEditSession, setSavingEditSession] = useState(false)

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
    start(state?.task ?? selectedTask, preset)
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

  // Filtro de data: Hoje · 7 dias (padrão) · 30 dias · Tudo
  const filteredSessions = useMemo(() => {
    if (timeFilter === 'tudo') return sessions
    const now = new Date()
    const nowLocal = localDay(now)

    if (timeFilter === 'hoje') {
      return sessions.filter(
        (s) =>
          (s.session_date ? s.session_date.slice(0, 10) : s.started_at.slice(0, 10)) === nowLocal,
      )
    }

    const daysCount = timeFilter === '7dias' ? 7 : 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - (daysCount - 1))
    cutoffDate.setHours(0, 0, 0, 0)
    const cutoffIso = cutoffDate.toISOString().slice(0, 10)

    return sessions.filter((s) => {
      const d = s.session_date ? s.session_date.slice(0, 10) : s.started_at.slice(0, 10)
      return d >= cutoffIso
    })
  }, [sessions, timeFilter])

  // Agrupamento cronológico da timeline "Foco em registro"
  const sessionsByDay = useMemo(() => {
    const groups: Record<string, SessionRecord[]> = {}
    filteredSessions.forEach((s) => {
      const day = s.session_date ? s.session_date.slice(0, 10) : s.started_at.slice(0, 10)
      if (!groups[day]) groups[day] = []
      groups[day].push(s)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredSessions])

  // Agrupamento por mês quando 'tudo' estiver ativo para agrupamento colapsável
  const sessionsByMonth = useMemo(() => {
    if (timeFilter !== 'tudo') return null
    const months: Record<
      string,
      { monthKey: string; monthLabel: string; days: [string, SessionRecord[]][] }
    > = {}

    sessionsByDay.forEach(([day, daySessions]) => {
      const [y, m] = day.split('-').map(Number)
      const monthKey = `${y}-${String(m).padStart(2, '0')}`
      const date = new Date(y, m - 1, 1, 12, 0, 0)
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

      if (!months[monthKey]) {
        months[monthKey] = {
          monthKey,
          monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          days: [],
        }
      }
      months[monthKey].days.push([day, daySessions])
    })

    return Object.values(months).sort((a, b) => b.monthKey.localeCompare(a.monthKey))
  }, [sessionsByDay, timeFilter])

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

  // Abertura do modal de edição de sessão da timeline
  const handleOpenEditSession = (session: SessionRecord) => {
    setEditingSession(session)
    setEditSessionNote(session.note || '')
    setEditSessionObjective(session.objective || '')
    setEditSessionOutcome(session.outcome_status || '')
  }

  // Renderizador do card individual da sessão com redesign completo
  const renderSessionCard = (s: SessionRecord) => {
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
    const task = s.expand?.task

    return (
      <div
        key={s.id}
        onClick={() => handleOpenEditSession(s)}
        className={`pomodoro-timeline-card ${s.objective ? 'has-objective' : ''}`}
        title="Clique para editar nota, objetivo ou veredito"
      >
        <div className="pomodoro-timeline-card-header">
          <div className="pomodoro-timeline-badge-group">
            {/* Badge de status de término: Completa / Interrompida */}
            <span className={`pomodoro-status-pill ${s.status}`}>
              {s.status === 'completa' ? (
                <>
                  <Check size={10} />
                  Completa
                </>
              ) : (
                <>
                  <AlertCircle size={10} />
                  Interrompida
                </>
              )}
            </span>

            {/* Selo do veredito: Batido / Parcial / Não foi */}
            {s.outcome_status && (
              <span className={`pomodoro-outcome-badge ${s.outcome_status}`}>
                {s.outcome_status === 'batido' && (
                  <>
                    <Check size={10} />
                    Batido
                  </>
                )}
                {s.outcome_status === 'parcial' && (
                  <>
                    <span>~</span>
                    Parcial
                  </>
                )}
                {s.outcome_status === 'nao_foi' && (
                  <>
                    <XIcon size={10} />
                    Não foi
                  </>
                )}
              </span>
            )}

            {/* Chip da tarefa vinculada clicável */}
            {task ? (
              <span
                className="pomodoro-task-chip-btn"
                title={`Tarefa: ${task.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenEditSession(s)
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] shrink-0" />
                <span className="truncate">{task.title}</span>
              </span>
            ) : (
              <span className="text-[11px] font-['Space_Mono'] text-[#71717A]">Foco livre</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-['Space_Mono'] text-[11px] text-[#A1A1AA]">{timeRange}</span>
            <span className="font-['Space_Mono'] text-xs font-bold text-[#F4F4F6] bg-white/5 px-2 py-0.5 rounded">
              {durationFormatted}
            </span>
            <span className="pomodoro-timeline-edit-hint hidden sm:inline-flex">
              <Edit2 size={11} />
            </span>
          </div>
        </div>

        {/* Objetivo declarado visível */}
        {s.objective && (
          <div className="pomodoro-timeline-objective-line">
            <span className="objective-tag">OBJETIVO:</span>
            <span className="truncate">{s.objective}</span>
          </div>
        )}

        {/* Nota da sessão */}
        {s.note && s.note.trim() && <div className="pomodoro-timeline-note-body">{s.note}</div>}
      </div>
    )
  }

  const handleSaveEditedSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSession) return
    setSavingEditSession(true)
    try {
      await updateSessionDetails(editingSession.id, {
        note: editSessionNote,
        objective: editSessionObjective,
        outcome_status: editSessionOutcome || null,
      })
      toast({ title: 'Sessão atualizada com sucesso' })
      setEditingSession(null)
      if (refreshSessions) refreshSessions()
    } catch {
      toast({ title: 'Erro ao atualizar sessão', variant: 'destructive' })
    } finally {
      setSavingEditSession(false)
    }
  }

  // Sincroniza estado inicial do veredito quando o pendingNote mudar
  useEffect(() => {
    if (pendingNote) {
      setDoneInput('')
      setNextInput('')
      setPendingVerdict(pendingNote.outcomeStatus || null)
    }
  }, [pendingNote])

  // Helper de minutos / segundos do timer da barra fixa
  const timerMinutes = Math.floor(seconds / 60)
  const timerSeconds = seconds % 60
  const formattedTimer = isOvertime
    ? `+${String(Math.floor(overtimeSeconds / 60)).padStart(2, '0')}:${String(overtimeSeconds % 60).padStart(2, '0')}`
    : `${String(timerMinutes).padStart(2, '0')}:${String(timerSeconds).padStart(2, '0')}`

  const isRunning = state?.status === 'rodando'
  const isPaused = state?.status === 'pausado'
  const hasActiveSession = !!state
  const currentLinkedTask = state?.task ?? selectedTask

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

          {/* TIMELINE: FOCO EM REGISTRO COM FILTRO DE DATA E REDESIGN DE CARDS */}
          <div className="pomodoro-timeline-section">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[17px] font-['Clash_Display'] font-semibold text-[#F4F4F6]">
                  Foco em registro
                </h3>
                <span className="text-[11px] font-['Space_Mono'] text-[#A1A1AA]">
                  {filteredSessions.length}{' '}
                  {filteredSessions.length === 1 ? 'bloco registrado' : 'blocos registrados'}
                </span>
              </div>

              {/* Seletor de período: Hoje · 7 dias · 30 dias · Tudo */}
              <div className="inline-flex items-center gap-1 bg-[#12141C] border border-[#C5A880]/20 rounded-lg p-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTimeFilter('hoje')}
                  className={`px-2.5 py-1 text-[11px] font-['Space_Mono'] rounded transition-colors ${
                    timeFilter === 'hoje'
                      ? 'bg-[#C5A880] text-[#090A0E] font-bold shadow-sm'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('7dias')}
                  className={`px-2.5 py-1 text-[11px] font-['Space_Mono'] rounded transition-colors ${
                    timeFilter === '7dias'
                      ? 'bg-[#C5A880] text-[#090A0E] font-bold shadow-sm'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                  }`}
                >
                  7 dias
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('30dias')}
                  className={`px-2.5 py-1 text-[11px] font-['Space_Mono'] rounded transition-colors ${
                    timeFilter === '30dias'
                      ? 'bg-[#C5A880] text-[#090A0E] font-bold shadow-sm'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                  }`}
                >
                  30 dias
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('tudo')}
                  className={`px-2.5 py-1 text-[11px] font-['Space_Mono'] rounded transition-colors ${
                    timeFilter === 'tudo'
                      ? 'bg-[#C5A880] text-[#090A0E] font-bold shadow-sm'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                  }`}
                >
                  Tudo
                </button>
              </div>
            </div>

            {sessionsByDay.length === 0 ? (
              <p className="pomodoro-timeline-empty">Nenhuma sessão registrada neste período.</p>
            ) : timeFilter === 'tudo' && sessionsByMonth ? (
              /* MODO TUDO: Agrupado e colapsável por mês */
              <div className="space-y-6">
                {sessionsByMonth.map((monthGroup) => {
                  const isCollapsed = !!collapsedMonths[monthGroup.monthKey]
                  const monthTotalMin = monthGroup.days.reduce(
                    (acc, [, dSessions]) =>
                      acc + dSessions.reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0),
                    0,
                  )
                  const monthBlockCount = monthGroup.days.reduce(
                    (acc, [, dSessions]) => acc + dSessions.length,
                    0,
                  )

                  return (
                    <div
                      key={monthGroup.monthKey}
                      className="border border-white/5 rounded-xl bg-[#090a0e]/40 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedMonths((curr) => ({
                            ...curr,
                            [monthGroup.monthKey]: !curr[monthGroup.monthKey],
                          }))
                        }
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#12141c]/60 hover:bg-[#12141c] transition-colors border-b border-white/5 text-left"
                      >
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight size={15} className="text-[#C5A880]" />
                          ) : (
                            <ChevronDown size={15} className="text-[#C5A880]" />
                          )}
                          <span className="font-['Clash_Display'] font-semibold text-sm text-[#F4F4F6]">
                            {monthGroup.monthLabel}
                          </span>
                        </div>
                        <span className="text-[11px] font-['Space_Mono'] text-[#A1A1AA]">
                          {formatTotalTime(monthTotalMin)} · {monthBlockCount}{' '}
                          {monthBlockCount === 1 ? 'bloco' : 'blocos'}
                        </span>
                      </button>

                      {!isCollapsed && (
                        <div className="p-3 space-y-4">
                          {monthGroup.days.map(([day, daySessions]) => {
                            const dayTotalMin = daySessions.reduce(
                              (acc, s) => acc + Number(s.duration_minutes || 0),
                              0,
                            )
                            return (
                              <div key={day} className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-['Space_Mono'] text-[#A1A1AA] pb-1 border-b border-white/5">
                                  <span className="uppercase tracking-wider font-bold text-[#F4F4F6]">
                                    {formatDayHeader(day)}
                                  </span>
                                  <span>
                                    {formatTotalTime(dayTotalMin)} · {daySessions.length}{' '}
                                    {daySessions.length === 1 ? 'bloco' : 'blocos'}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {daySessions.map((s) => renderSessionCard(s))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* MODO NORMAL (Hoje, 7 dias, 30 dias): Agrupado por dia */
              <div className="pomodoro-timeline-days">
                {sessionsByDay.map(([day, daySessions]) => {
                  const dayTotalMin = daySessions.reduce(
                    (acc, s) => acc + Number(s.duration_minutes || 0),
                    0,
                  )
                  return (
                    <div key={day} className="pomodoro-timeline-day-group">
                      <div className="flex items-center justify-between text-[11px] font-['Space_Mono'] text-[#A1A1AA] pb-1 border-b border-white/5">
                        <span className="uppercase tracking-wider font-bold text-[#F4F4F6]">
                          {formatDayHeader(day)}
                        </span>
                        <span>
                          {formatTotalTime(dayTotalMin)} · {daySessions.length}{' '}
                          {daySessions.length === 1 ? 'bloco' : 'blocos'}
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {daySessions.map((s) => renderSessionCard(s))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* CARD DESTACADO DE DEFINIÇÃO DO OBJETIVO DO BLOCO (ANTES DO FOCO) */}
      {!hasActiveSession && !isReadOnlyTab && (
        <div className="pomodoro-objective-card">
          <div
            className={`pomodoro-objective-card-inner ${
              selectedTask && currentObjective === selectedTask.title ? 'is-compact' : ''
            }`}
          >
            <div className="pomodoro-objective-header">
              <label htmlFor="pomodoro-block-objective-input" className="pomodoro-objective-label">
                <Target size={13} className="text-[#C5A880] shrink-0" />
                <span>OBJETIVO DO BLOCO</span>
              </label>
              {selectedTask && (
                <span className="text-[10px] font-['Space_Mono'] text-[#A1A1AA] truncate max-w-[220px]">
                  Tarefa: {selectedTask.title}
                </span>
              )}
            </div>

            <div className="pomodoro-objective-input-wrap">
              <input
                id="pomodoro-block-objective-input"
                type="text"
                maxLength={300}
                value={currentObjective}
                onChange={(e) => setCurrentObjective(e.target.value)}
                placeholder={
                  selectedTask
                    ? selectedTask.title
                    : 'O que deve existir ao fim destes 25 min? (opcional)'
                }
                title="Objetivo do bloco: valor pré-preenchido editável salvo ao dar play"
                className="pomodoro-objective-input"
              />
            </div>

            <p className="pomodoro-objective-hint">
              Será pedido o veredito ao fim do bloco — ✓ Batido · ~ Parcial · ✗ Não foi
            </p>
          </div>
        </div>
      )}

      {/* BARRA INFERIOR FIXA DO TIMER (ESTILO TICKTICK / DESIGN SYSTEM BARBOSA) */}
      <footer className="pomodoro-bottom-bar">
        <div className="pomodoro-bottom-bar-inner">
          <div className="pomodoro-bottom-left flex-wrap md:flex-nowrap">
            {/* Ícone de status sutil */}
            <div
              className={`pomodoro-bottom-avatar ${isRunning ? 'running' : ''}`}
              title={phaseLabel}
            >
              <span className="pomodoro-bottom-avatar-icon" />
            </div>

            <div className="pomodoro-bottom-meta">
              <span className="pomodoro-bottom-eyebrow">{phaseLabel}</span>

              <div className="pomodoro-bottom-time-row flex-wrap gap-2">
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
                        {currentLinkedTask ? currentLinkedTask.title : 'Vincular tarefa...'}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="bg-[#12141C] border border-[#C5A880]/20 text-[#F4F4F6] w-72 max-h-64 overflow-y-auto"
                  >
                    <DropdownMenuItem
                      onClick={() => selectTask(null)}
                      className="cursor-pointer hover:bg-white/5 text-xs font-['Plus_Jakarta_Sans'] flex items-center justify-between"
                    >
                      <em>Nenhuma tarefa vinculada (foco livre)</em>
                      {!currentLinkedTask && (
                        <Check size={12} className="text-[#C5A880] ml-2 shrink-0" />
                      )}
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
                          {currentLinkedTask?.id === t.id && (
                            <Check size={12} className="text-[#C5A880] ml-2 shrink-0" />
                          )}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* ÂNCORA ANTI-DRIFT VISÍVEL DURANTE O FOCO (Pill reforçada com borda champagne) */}
              {isRunning && (state?.objective || currentObjective) && (
                <div
                  className="pomodoro-anti-drift-bar mt-1.5"
                  title="Objetivo ativo deste bloco (âncora anti-drift)"
                >
                  <Target size={12} className="text-[#090A0E] shrink-0" />
                  <span className="pomodoro-anti-drift-tag">OBJETIVO</span>
                  <span className="truncate font-medium text-xs text-[#F4F4F6]">
                    {state?.objective || currentObjective}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pomodoro-bottom-controls flex-wrap justify-end gap-2">
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

            {/* PAINEL DE NOTA / VEREDITO PÓS-FOCO EXPANDIDO (VEREDITO DE 1 TOQUE + 2 PERGUNTAS) */}
            {pendingNote && (
              <div className="bg-[#12141C] border border-[#C5A880]/40 rounded-xl p-3 shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-['Space_Mono'] uppercase tracking-wider text-[#C5A880] font-bold">
                      Bloco {pendingNote.blockNumber} finalizado · {pendingNote.durationMinutes} min
                    </span>
                    {pendingNote.taskTitle && (
                      <span
                        className="text-xs text-[#A1A1AA] truncate max-w-[160px]"
                        title={pendingNote.taskTitle}
                      >
                        ({pendingNote.taskTitle})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      dismissPendingNote()
                      setDoneInput('')
                      setNextInput('')
                      setPendingVerdict(null)
                    }}
                    className="text-[#A1A1AA] hover:text-[#F4F4F6] p-1"
                    title="Fechar sem salvar notas adicionais (Esc)"
                  >
                    <XIcon size={14} />
                  </button>
                </div>

                {/* Veredito de 1 toque: se o bloco tinha objetivo */}
                {pendingNote.objective && (
                  <div className="mb-2.5 bg-[#090A0E] border border-[#C5A880]/30 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Target size={12} className="text-[#C5A880] shrink-0" />
                      <span className="font-['Space_Mono'] text-[10px] font-bold uppercase tracking-wider text-[#C5A880]">
                        OBJETIVO DO BLOCO
                      </span>
                    </div>
                    <div className="text-xs text-[#F4F4F6] font-medium mb-2 pl-4 border-l-2 border-[#C5A880]/40 break-words">
                      "{pendingNote.objective}"
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPendingVerdict('batido')}
                        className={`py-1 px-2 text-[11px] font-['Space_Mono'] rounded-md border flex items-center justify-center gap-1 transition-all ${
                          pendingVerdict === 'batido'
                            ? 'bg-[#C5A880] text-[#090A0E] border-[#C5A880] font-bold'
                            : 'bg-white/5 text-[#F4F4F6] border-white/10 hover:border-[#C5A880]/40'
                        }`}
                      >
                        <Check size={12} />
                        Batido
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingVerdict('parcial')}
                        className={`py-1 px-2 text-[11px] font-['Space_Mono'] rounded-md border flex items-center justify-center gap-1 transition-all ${
                          pendingVerdict === 'parcial'
                            ? 'bg-[#F59E0B] text-[#090A0E] border-[#F59E0B] font-bold'
                            : 'bg-white/5 text-[#F4F4F6] border-white/10 hover:border-[#F59E0B]/40'
                        }`}
                      >
                        <span>~</span>
                        Parcial
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingVerdict('nao_foi')}
                        className={`py-1 px-2 text-[11px] font-['Space_Mono'] rounded-md border flex items-center justify-center gap-1 transition-all ${
                          pendingVerdict === 'nao_foi'
                            ? 'bg-[#71717A] text-[#F4F4F6] border-[#71717A] font-bold'
                            : 'bg-white/5 text-[#F4F4F6] border-white/10 hover:border-[#71717A]/40'
                        }`}
                      >
                        <XIcon size={12} />
                        Não foi
                      </button>
                    </div>
                  </div>
                )}

                {/* Duas perguntas de texto: 'O que foi feito?' e 'O que fica para o próximo bloco?' */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    submitPendingNote({
                      doneText: doneInput,
                      nextText: nextInput,
                      outcomeStatus: pendingVerdict || undefined,
                      objective: pendingNote.objective,
                    })
                    setDoneInput('')
                    setNextInput('')
                    setPendingVerdict(null)
                    if (refreshSessions) refreshSessions()
                  }}
                  className="space-y-2"
                >
                  <div>
                    <input
                      type="text"
                      autoFocus={!pendingNote.objective}
                      maxLength={250}
                      placeholder="O que foi feito neste bloco? (opcional)"
                      value={doneInput}
                      onChange={(e) => setDoneInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          dismissPendingNote()
                        }
                      }}
                      className="w-full bg-[#090A0E] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-[#F4F4F6] placeholder:text-[#71717A] focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      maxLength={250}
                      placeholder="O que fica para o próximo bloco? (opcional)"
                      value={nextInput}
                      onChange={(e) => setNextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          dismissPendingNote()
                        }
                      }}
                      className="w-full bg-[#090A0E] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-[#F4F4F6] placeholder:text-[#71717A] focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-['Space_Mono'] text-[#71717A]">
                      Enter salva · Esc pula
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          dismissPendingNote()
                          setDoneInput('')
                          setNextInput('')
                          setPendingVerdict(null)
                        }}
                        className="px-2 py-1 text-[11px] font-['Space_Mono'] text-[#A1A1AA] hover:text-[#F4F4F6]"
                      >
                        Pular
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-[#C5A880] hover:bg-[#d6bc96] text-[#090A0E] font-bold text-xs font-['Space_Mono'] uppercase tracking-wider rounded-md"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {!isReadOnlyTab && (
              <>
                {/* Botão Play / Pause */}
                <button
                  type="button"
                  className="pomodoro-bottom-action-btn primary"
                  onClick={() => {
                    if (!isRunning) {
                      start(state?.task ?? selectedTask, activePreset, currentObjective)
                    } else {
                      toggle()
                    }
                  }}
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

      {/* MODAL DE EDIÇÃO DE SESSÃO / NOTA / OBJETIVO / VEREDITO */}
      <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
        <DialogContent className="bg-[#12141C] border border-[#C5A880]/20 text-[#F4F4F6] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Clash_Display'] font-semibold text-lg text-[#F4F4F6]">
              Editar Registro de Sessão
            </DialogTitle>
          </DialogHeader>

          {editingSession && (
            <form onSubmit={handleSaveEditedSession} className="space-y-4 py-2">
              <div className="flex items-center justify-between text-xs font-['Space_Mono'] bg-[#090A0E] p-2.5 rounded-lg border border-white/5">
                <span className="text-[#A1A1AA]">
                  {editingSession.expand?.task?.title || 'Foco livre'}
                </span>
                <span className="font-bold text-[#C5A880]">
                  {formatTotalTime(Number(editingSession.duration_minutes || 0))} ·{' '}
                  {editingSession.status}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Objetivo do Bloco
                </label>
                <input
                  type="text"
                  maxLength={300}
                  placeholder="Ex.: Redigir a introdução do relatório"
                  value={editSessionObjective}
                  onChange={(e) => setEditSessionObjective(e.target.value)}
                  className="w-full bg-[#090A0E] border border-[rgba(197,168,128,0.22)] rounded-lg px-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Veredito do Objetivo
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditSessionOutcome('')}
                    className={`py-1.5 text-xs font-['Space_Mono'] rounded-md border transition-all ${
                      editSessionOutcome === ''
                        ? 'bg-white/20 text-[#F4F4F6] border-white/40 font-bold'
                        : 'bg-white/5 text-[#A1A1AA] border-white/10 hover:text-[#F4F4F6]'
                    }`}
                  >
                    Nenhum
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSessionOutcome('batido')}
                    className={`py-1.5 text-xs font-['Space_Mono'] rounded-md border transition-all flex items-center justify-center gap-1 ${
                      editSessionOutcome === 'batido'
                        ? 'bg-[#C5A880] text-[#090A0E] border-[#C5A880] font-bold'
                        : 'bg-white/5 text-[#F4F4F6] border-white/10 hover:border-[#C5A880]/40'
                    }`}
                  >
                    <Check size={12} />
                    Batido
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSessionOutcome('parcial')}
                    className={`py-1.5 text-xs font-['Space_Mono'] rounded-md border transition-all flex items-center justify-center gap-1 ${
                      editSessionOutcome === 'parcial'
                        ? 'bg-[#F59E0B] text-[#090A0E] border-[#F59E0B] font-bold'
                        : 'bg-white/5 text-[#F4F4F6] border-white/10 hover:border-[#F59E0B]/40'
                    }`}
                  >
                    <span>~</span>
                    Parcial
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSessionOutcome('nao_foi')}
                    className={`py-1.5 text-xs font-['Space_Mono'] rounded-md border transition-all flex items-center justify-center gap-1 ${
                      editSessionOutcome === 'nao_foi'
                        ? 'bg-[#71717A] text-[#F4F4F6] border-[#71717A] font-bold'
                        : 'bg-white/5 text-[#F4F4F6] border-white/10 hover:border-[#71717A]/40'
                    }`}
                  >
                    <XIcon size={12} />
                    Não foi
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Anotações da Sessão
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="O que foi feito e o que ficou pendente..."
                  value={editSessionNote}
                  onChange={(e) => setEditSessionNote(e.target.value)}
                  className="w-full bg-[#090A0E] border border-[rgba(197,168,128,0.22)] rounded-lg px-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880] resize-none"
                />
              </div>

              <DialogFooter className="pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 text-xs font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] hover:text-[#F4F4F6] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEditSession}
                  className="px-4 py-2 bg-[#C5A880] hover:bg-[#d6bc96] text-[#090A0E] font-medium text-xs font-['Space_Mono'] uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
                >
                  {savingEditSession ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
                <span className="text-[11px] text-[#A1A1AA] font-['Space_Mono'] mt-1 block">
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
                <span className="text-[11px] text-[#A1A1AA] font-['Space_Mono'] mt-1 block">
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
                <span className="text-[11px] text-[#A1A1AA] font-['Space_Mono'] mt-1 block">
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
                <span className="text-[11px] text-[#A1A1AA] font-['Space_Mono'] mt-1 block">
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
