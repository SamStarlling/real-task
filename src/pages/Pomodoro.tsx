import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Square,
  Plus,
  Minus,
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
  Timer,
  Clock,
  Save,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { usePomodoro, type ActivePreset } from '@/contexts/PomodoroContext'
import { useAuth } from '@/contexts/AuthContext'
import type { FocusPresetRecord, SessionRecord, TaskRecord } from '@/types'
import { FocusDistributionChart } from '@/components/FocusDistributionChart'
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface PomodoroPageProps {
  sessions: SessionRecord[]
  tasks: TaskRecord[]
  refreshSessions?: () => void
}

export function PomodoroPage({ sessions, tasks, refreshSessions }: PomodoroPageProps) {
  const { user } = useAuth()
  const {
    timerMode,
    setTimerMode,
    state,
    selectedTask,
    currentObjective,
    setCurrentObjective,
    seconds,
    overtimeSeconds,
    isOvertime,
    stopwatchSeconds,
    activePreset,
    setActivePreset,
    workMinutes,
    setWorkMinutes,
    shortBreakMinutes,
    setShortBreakMinutes,
    longBreakMinutes,
    applyPresetToDraft,
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

  // Filtro de período da timeline e estatísticas (Hoje | 7 dias | 30 dias | Tudo)
  const [timeFilter, setTimeFilter] = useState<'hoje' | '7dias' | '30dias' | 'tudo'>('7dias')
  // Filtros extras da timeline: por tarefa e por status (todas / completas / interrompidas)
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('todas')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    'todas' | 'completa' | 'interrompida'
  >('todas')
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({})

  // Estado do Acordeão / Seção unificada de Métricas e Estatísticas
  // Padrão inteligente: aberto quando ocioso/parado, colapsado quando há foco ativo
  const [metricsSectionOpen, setMetricsSectionOpen] = useState(state?.status !== 'rodando')
  const [metricsTab, setMetricsTab] = useState<'resumo' | 'estatisticas'>('resumo')

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

  // Seletor de tarefa para vincular
  const [taskPickerOpen, setTaskPickerOpen] = useState(false)

  // MODO FOCO EM TELA CHEIA (Etapa 3)
  const [isFullscreenFocus, setIsFullscreenFocus] = useState(false)

  // Tecla Esc sai do modo tela cheia
  useEffect(() => {
    if (!isFullscreenFocus) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreenFocus(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreenFocus])

  // Colapsa automaticamente a seção de estatísticas quando o foco é iniciado
  // mantendo a tela do timer despoluída e focada
  useEffect(() => {
    if (state?.status === 'rodando') {
      setMetricsSectionOpen(false)
    }
  }, [state?.status])

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

    // Validação de 1 a 1 minuto: mínimo de 1 min para foco e pausas; blocos >= 1
    if (presetForm.workMinutes < 1) {
      toast({
        title: 'Tempo de foco inválido',
        description: 'O tempo de foco deve ser de no mínimo 1 minuto.',
        variant: 'destructive',
      })
      return
    }
    if (presetForm.shortBreakMinutes < 1) {
      toast({
        title: 'Descanso curto inválido',
        description: 'O descanso curto deve ser de no mínimo 1 minuto.',
        variant: 'destructive',
      })
      return
    }
    if (presetForm.longBreakMinutes < 1) {
      toast({
        title: 'Descanso longo inválido',
        description: 'O descanso longo deve ser de no mínimo 1 minuto.',
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
          work_minutes: Math.max(1, Math.round(presetForm.workMinutes)),
          short_break_minutes: Math.max(1, Math.round(presetForm.shortBreakMinutes)),
          long_break_minutes: Math.max(1, Math.round(presetForm.longBreakMinutes)),
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
          work_minutes: Math.max(1, Math.round(presetForm.workMinutes)),
          short_break_minutes: Math.max(1, Math.round(presetForm.shortBreakMinutes)),
          long_break_minutes: Math.max(1, Math.round(presetForm.longBreakMinutes)),
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

  // Criar preset a partir da duração atual do timer
  const handleCreateFromCurrent = () => {
    setEditingPreset(null)
    setPresetForm({
      name: `${workMinutes}m Foco`,
      workMinutes: workMinutes,
      shortBreakMinutes: shortBreakMinutes,
      longBreakMinutes: longBreakMinutes,
      blocksBeforeLongBreak: activePreset.blocksBeforeLongBreak || 4,
    })
    setModalOpen(true)
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
    applyPresetToDraft(preset)
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

  // Sessões filtradas estritamente pelo período (alimenta o gráfico de pizza e a base dos filtros de timeline)
  const periodSessions = useMemo(() => {
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

  // Lista de tarefas únicas presentes nas sessões do período selecionado (para o dropdown de filtro)
  const tasksInPeriod = useMemo(() => {
    const map = new Map<string, string>()
    let hasUntracked = false

    periodSessions.forEach((s) => {
      if (s.task) {
        const title = s.expand?.task?.title || 'Tarefa'
        map.set(s.task, title)
      } else {
        hasUntracked = true
      }
    })

    const list = Array.from(map.entries()).map(([id, title]) => ({ id, title }))
    list.sort((a, b) => a.title.localeCompare(b.title))

    if (hasUntracked) {
      list.push({ id: '__sem_tarefa__', title: 'Foco livre (sem tarefa)' })
    }

    return list
  }, [periodSessions])

  // Sessões filtradas para a timeline combinando Período + Tarefa + Status
  const filteredSessions = useMemo(() => {
    return periodSessions.filter((s) => {
      // Filtro por Tarefa
      if (selectedTaskFilter !== 'todas') {
        if (selectedTaskFilter === '__sem_tarefa__') {
          if (s.task) return false
        } else if (s.task !== selectedTaskFilter) {
          return false
        }
      }

      // Filtro por Status
      if (selectedStatusFilter !== 'todas') {
        if (s.status !== selectedStatusFilter) return false
      }

      return true
    })
  }, [periodSessions, selectedTaskFilter, selectedStatusFilter])

  // Rótulo textual do período selecionado
  const timeFilterLabel = useMemo(() => {
    switch (timeFilter) {
      case 'hoje':
        return 'Hoje'
      case '7dias':
        return 'Últimos 7 dias'
      case '30dias':
        return 'Últimos 30 dias'
      case 'tudo':
        return 'Histórico Completo'
    }
  }, [timeFilter])

  // Indicador de se algum filtro extra de timeline está ativo
  const hasExtraFiltersActive = selectedTaskFilter !== 'todas' || selectedStatusFilter !== 'todas'

  // Limpa todos os filtros extras da timeline
  const handleClearTimelineFilters = () => {
    setSelectedTaskFilter('todas')
    setSelectedStatusFilter('todas')
  }

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

  // Formatação do timer da barra fixa (suporta Stopwatch contagem crescente mm:ss ou hh:mm:ss)
  const currentMode = state?.mode || timerMode
  const isStopwatch = currentMode === 'stopwatch'

  let formattedTimer = ''
  if (isStopwatch) {
    const totalSec = stopwatchSeconds
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    formattedTimer =
      h > 0
        ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  } else if (isOvertime) {
    formattedTimer = `+${String(Math.floor(overtimeSeconds / 60)).padStart(2, '0')}:${String(overtimeSeconds % 60).padStart(2, '0')}`
  } else {
    const timerMinutes = Math.floor(seconds / 60)
    const timerSeconds = seconds % 60
    formattedTimer = `${String(timerMinutes).padStart(2, '0')}:${String(timerSeconds).padStart(2, '0')}`
  }

  const isRunning = state?.status === 'rodando'
  const isPaused = state?.status === 'pausado'
  const hasActiveSession = !!state
  const currentLinkedTask = state?.task ?? selectedTask

  // Fase e bloco
  const currentBlock = state?.currentBlock ?? 1
  const totalBlocks = state?.totalBlocks ?? activePreset.blocksBeforeLongBreak
  const phaseLabel = isStopwatch
    ? 'STOPWATCH · FOCO LIVRE CRESCENTE'
    : state?.phase === 'foco'
      ? `FOCO · BLOCO ${currentBlock}/${totalBlocks}${isOvertime ? ' (EXCESSO)' : ''}`
      : state?.phase === 'descanso_longo'
        ? `DESCANSO LONGO · BLOCO ${currentBlock}/${totalBlocks}${isOvertime ? ' (EXCESSO)' : ''}`
        : state?.phase === 'descanso_curto'
          ? `DESCANSO CURTO · BLOCO ${currentBlock}/${totalBlocks}${isOvertime ? ' (EXCESSO)' : ''}`
          : `FOCO · ${activePreset.name.toUpperCase()}`

  return (
    <div className="pomodoro-page-container">
      {/* =========================================================
          HERO TIMER CENTRAL (PROTAGONISTA VISUAL DA PÁGINA /pomodoro)
          ========================================================= */}
      <section className="pomodoro-hero-section">
        <div
          className={`pomodoro-hero-card ${isRunning ? 'is-running' : ''} ${
            isOvertime ? 'is-overtime' : ''
          }`}
        >
          {/* TOPO DO HERO: FASE / CICLO E BOTÃO TELA CHEIA */}
          <div className="pomodoro-hero-topbar">
            <div className="pomodoro-hero-phase-badge">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning
                    ? 'bg-[#C5A880] animate-pulse'
                    : isPaused
                      ? 'bg-amber-400'
                      : 'bg-[#71717A]'
                }`}
              />
              <span>{phaseLabel}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreenFocus(true)}
              className="pomodoro-hero-fullscreen-trigger"
              title="Expandir para o modo imersivo de tela cheia (ou clique no timer)"
            >
              <Maximize2 size={13} className="text-[#C5A880]" />
              <span>Foco em tela cheia</span>
            </button>
          </div>

          {/* ÁREA CENTRAL DO TIMER (CLICÁVEL PARA EXPANDIR EM TELA CHEIA) */}
          <div
            className="pomodoro-hero-clock-wrap"
            onClick={() => setIsFullscreenFocus(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsFullscreenFocus(true)
              }
            }}
            title="Clique para modo imersivo em tela cheia"
          >
            <div className={`pomodoro-hero-time-digits ${isOvertime ? 'is-overtime' : ''}`}>
              {formattedTimer}
            </div>
            <span className="pomodoro-hero-hint-subtext">
              <Maximize2 size={11} />
              <span>Clique no timer para focar em tela cheia</span>
            </span>
          </div>

          {/* CONTROLE DE DURAÇÃO JUNTO AO TIMER NO HERO (QUANDO PARADO E EM MODO POMO) */}
          {!hasActiveSession && !isReadOnlyTab && timerMode === 'pomo' && (
            <div className="pomodoro-hero-duration-bar">
              <span className="pomodoro-hero-duration-label">Duração:</span>
              <div className="pomodoro-hero-stepper">
                <button
                  type="button"
                  onClick={() => setWorkMinutes(workMinutes - 1)}
                  disabled={workMinutes <= 1}
                  className="pomodoro-hero-stepper-btn"
                  title="Diminuir 1 minuto (-1 min)"
                >
                  <Minus size={12} />
                </button>
                <div className="pomodoro-hero-duration-input-wrap">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={workMinutes}
                    onChange={(e) => setWorkMinutes(Number(e.target.value))}
                    className="pomodoro-hero-duration-input"
                    title="Digite o tempo desejado em minutos (ex: 23)"
                  />
                  <span className="pomodoro-hero-duration-unit">min</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkMinutes(workMinutes + 1)}
                  disabled={workMinutes >= 180}
                  className="pomodoro-hero-stepper-btn"
                  title="Aumentar 1 minuto (+1 min)"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )}

          {/* PILL DO OBJETIVO DO BLOCO (DURANTE FOCO OU EDITADO) */}
          {(state?.objective || currentObjective) && (
            <div className="pomodoro-hero-objective-pill" title="Objetivo do bloco fixado">
              <span className="tag">OBJETIVO</span>
              <span className="text">{state?.objective || currentObjective}</span>
            </div>
          )}

          {/* CONTROLES CENTRAIS DO HERO */}
          <div className="pomodoro-hero-controls">
            {/* Botão de transição manual exigido em overtime */}
            {isOvertime && !isReadOnlyTab && (
              <>
                {state?.phase === 'foco' ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await startBreakFromOvertime()
                      if (refreshSessions) refreshSessions()
                    }}
                    className="pomodoro-hero-btn primary"
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
                    className="pomodoro-hero-btn primary"
                    title="Iniciar o próximo bloco de foco"
                  >
                    Iniciar Próximo Bloco
                  </button>
                )}
              </>
            )}

            {!isReadOnlyTab && !isOvertime && (
              <>
                {/* Botão Play / Pause Principal */}
                <button
                  type="button"
                  className="pomodoro-hero-btn primary"
                  onClick={() => {
                    if (!isRunning) {
                      start(state?.task ?? selectedTask, undefined, currentObjective)
                    } else {
                      toggle()
                    }
                  }}
                  title={isRunning ? 'Pausar foco' : 'Iniciar foco'}
                >
                  {isRunning ? (
                    <>
                      <Pause size={18} fill="currentColor" />
                      <span>Pausar</span>
                    </>
                  ) : isPaused ? (
                    <>
                      <Play size={18} fill="currentColor" />
                      <span>Retomar</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" />
                      <span>Começar</span>
                    </>
                  )}
                </button>

                {/* Botão Encerrar e Registrar */}
                <button
                  type="button"
                  className="pomodoro-hero-btn"
                  onClick={async () => {
                    await finish()
                    if (refreshSessions) refreshSessions()
                  }}
                  disabled={!hasActiveSession}
                  title="Encerrar bloco e registrar tempo"
                >
                  <Square size={16} />
                  <span>Encerrar</span>
                </button>

                {/* Botão Descartar sem registrar */}
                {hasActiveSession && (
                  <button
                    type="button"
                    className="pomodoro-hero-btn text-muted"
                    onClick={discard}
                    title="Descartar timer sem registrar"
                  >
                    <RotateCcw size={15} />
                    <span>Descartar</span>
                  </button>
                )}
              </>
            )}

            {isReadOnlyTab && (
              <span className="pomodoro-readonly-badge">
                Timer ativo em outra aba (somente leitura)
              </span>
            )}
          </div>

          {/* BARRA DE PREPARAÇÃO: MODO (POMO/STOPWATCH) + VINCULAR TAREFA */}
          <div className="pomodoro-hero-prep-bar">
            {/* Controles Agrupados e Compactos da Barra de Preparação */}
            <div className="pomodoro-prep-unified-cluster">
              {/* Seletor Pomo / Stopwatch */}
              <div className="inline-flex items-center bg-[#090A0E] p-1 rounded-xl border border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setTimerMode('pomo')}
                  className={`px-2.5 py-1 text-xs font-['Space_Mono'] rounded-lg transition-all flex items-center gap-1.5 ${
                    timerMode === 'pomo'
                      ? 'bg-[#C5A880] text-[#090A0E] font-bold shadow-sm'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                  }`}
                  title="Modo Pomodoro (contagem regressiva + blocos)"
                >
                  <Timer size={13} />
                  <span>Pomodoro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimerMode('stopwatch')}
                  className={`px-2.5 py-1 text-xs font-['Space_Mono'] rounded-lg transition-all flex items-center gap-1.5 ${
                    timerMode === 'stopwatch'
                      ? 'bg-[#C5A880] text-[#090A0E] font-bold shadow-sm'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                  }`}
                  title="Modo Stopwatch (contagem crescente contínua)"
                >
                  <Clock size={13} />
                  <span>Stopwatch</span>
                </button>
              </div>

              {/* Seletor / Menu Compacto de Preset no Hero */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#090A0E] border border-white/10 hover:border-[#C5A880]/40 text-xs font-['Space_Mono'] text-[#F4F4F6] transition-colors shrink-0"
                    title={`Preset base: ${activePreset.name} (${workMinutes}m) · Clique para alternar`}
                  >
                    <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] hidden sm:inline">
                      Preset:
                    </span>
                    <strong className="text-[#C5A880] font-bold truncate max-w-[110px]">
                      {activePreset.name}
                    </strong>
                    <span className="text-[10px] text-[#A1A1AA] font-normal">{workMinutes}m</span>
                    <ChevronDown size={12} className="text-[#A1A1AA] ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="bg-[#12141C] border border-[#C5A880]/20 text-[#F4F4F6] w-64 max-h-72 overflow-y-auto"
                >
                  <DropdownMenuLabel className="text-[10px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA]">
                    Presets Disponíveis
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  {filteredPresets.map((preset) => {
                    const isSelected = activePreset.id === preset.id
                    return (
                      <DropdownMenuItem
                        key={preset.id}
                        onClick={() => applyPresetToDraft(preset)}
                        className="cursor-pointer hover:bg-white/5 text-xs font-['Space_Mono'] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isSelected ? 'bg-[#C5A880]' : 'bg-[#71717A]'
                            }`}
                          />
                          <span className="truncate">{preset.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[11px] text-[#A1A1AA]">{preset.work_minutes}m</span>
                          {isSelected && <Check size={12} className="text-[#C5A880] shrink-0" />}
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    onClick={handleOpenCreate}
                    className="cursor-pointer hover:bg-white/5 text-xs font-['Space_Mono'] text-[#C5A880] flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Criar novo preset...</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dropdown de vincular tarefa */}
              <DropdownMenu open={taskPickerOpen} onOpenChange={setTaskPickerOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090A0E] border border-white/10 hover:border-[#C5A880]/40 text-xs font-['Plus_Jakarta_Sans'] text-[#F4F4F6] transition-colors max-w-[260px] truncate"
                    title="Clique para vincular ou alterar a tarefa em foco"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#C5A880] shrink-0" />
                    <span className="truncate">
                      {currentLinkedTask ? currentLinkedTask.title : 'Vincular tarefa...'}
                    </span>
                    <ChevronDown size={12} className="text-[#A1A1AA] shrink-0 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
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
                  <label
                    htmlFor="pomodoro-block-objective-input"
                    className="pomodoro-objective-label"
                  >
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
                        : 'O que deve existir ao fim deste bloco? (opcional)'
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

          {/* PAINEL DE NOTA / VEREDITO PÓS-FOCO NO HERO (QUANDO PENDENTE) */}
          {pendingNote && (
            <div className="mt-4 bg-[#12141C] border border-[#C5A880]/40 rounded-xl p-3.5 shadow-2xl max-w-lg w-full animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#C5A880] font-bold">
                    Bloco {pendingNote.blockNumber} finalizado · {pendingNote.durationMinutes} min
                  </span>
                  {pendingNote.taskTitle && (
                    <span
                      className="text-xs text-[#A1A1AA] truncate max-w-[180px]"
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

              {/* Veredito de 1 toque: selo visual padronizado do objetivo pós-foco */}
              {pendingNote.objective && (
                <div className="mb-2.5 bg-[#090A0E] border border-[rgba(197,168,128,0.3)] rounded-lg p-2.5 text-left">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Target size={12} className="text-[#C5A880] shrink-0" />
                    <span className="font-['Space_Mono'] text-[10px] font-bold uppercase tracking-wider text-[#C5A880]">
                      OBJETIVO DO BLOCO
                    </span>
                  </div>
                  <div className="text-xs text-[#F4F4F6] font-medium mb-2.5 pl-3 border-l-2 border-[#C5A880] break-words leading-relaxed font-['Plus_Jakarta_Sans']">
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
                className="space-y-2 text-left"
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
        </div>
      </section>

      {/* SEÇÃO PRINCIPAL EM COLUNAS: PRESETS (ESQ) & VISÃO GERAL + TIMELINE (DIR) */}
      <div className="pomodoro-columns-layout">
        {/* COLUNA ESQUERDA: PRESETS E DURAÇÃO */}
        <section className="pomodoro-presets-column">
          <header className="pomodoro-presets-header">
            <h2 className="font-['Clash_Display'] font-semibold text-lg text-[#F4F4F6]">
              Presets de Foco
            </h2>
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

          {/* AJUSTE RÁPIDO DE DURAÇÃO LIVRE (1 A 1 MINUTO) */}
          <div className="mx-4 mb-3 p-3 rounded-xl bg-[#090A0E] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-['Space_Mono'] text-[#A1A1AA]">
              <span className="uppercase tracking-wider font-semibold text-[#F4F4F6]">
                Duração Atual (1 em 1 min)
              </span>
              <button
                type="button"
                onClick={handleCreateFromCurrent}
                className="text-[#C5A880] hover:underline flex items-center gap-1 text-[10px]"
                title="Criar novo preset a partir dos minutos atuais"
              >
                <Save size={11} /> Salvar como preset
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Stepper Foco */}
              <div className="bg-[#12141C] p-2 rounded-lg border border-white/5">
                <span className="block text-[10px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Foco
                </span>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setWorkMinutes(workMinutes - 1)}
                    disabled={workMinutes <= 1}
                    className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-[#F4F4F6] disabled:opacity-30 text-xs"
                    title="-1 minuto"
                  >
                    <Minus size={11} />
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={workMinutes}
                      onChange={(e) => setWorkMinutes(Number(e.target.value))}
                      className="w-12 text-center bg-transparent border border-white/10 focus:border-[#C5A880] rounded py-0.5 text-xs font-['Space_Mono'] font-bold text-[#C5A880] outline-none"
                    />
                    <span className="text-[10px] font-['Space_Mono'] text-[#71717A]">min</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWorkMinutes(workMinutes + 1)}
                    disabled={workMinutes >= 180}
                    className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-[#F4F4F6] disabled:opacity-30 text-xs"
                    title="+1 minuto"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {/* Stepper Pausa Curta */}
              <div className="bg-[#12141C] p-2 rounded-lg border border-white/5">
                <span className="block text-[10px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Pausa
                </span>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setShortBreakMinutes(shortBreakMinutes - 1)}
                    disabled={shortBreakMinutes <= 1}
                    className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-[#F4F4F6] disabled:opacity-30 text-xs"
                    title="-1 minuto"
                  >
                    <Minus size={11} />
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={shortBreakMinutes}
                      onChange={(e) => setShortBreakMinutes(Number(e.target.value))}
                      className="w-12 text-center bg-transparent border border-white/10 focus:border-[#C5A880] rounded py-0.5 text-xs font-['Space_Mono'] font-bold text-[#C5A880] outline-none"
                    />
                    <span className="text-[10px] font-['Space_Mono'] text-[#71717A]">min</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShortBreakMinutes(shortBreakMinutes + 1)}
                    disabled={shortBreakMinutes >= 60}
                    className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-[#F4F4F6] disabled:opacity-30 text-xs"
                    title="+1 minuto"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE PRESETS (ATALHOS) */}
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
                    onClick={() => applyPresetToDraft(preset)}
                    title={`Aplicar duração de '${preset.name}' (${preset.work_minutes}m)`}
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

        {/* COLUNA DIREITA: VISÃO GERAL E ESTATÍSTICAS UNIFICADAS + TIMELINE */}
        <section className="pomodoro-overview-column">
          {/* PAINEL UNIFICADO E COLAPSÁVEL DE MÉTRICAS E ESTATÍSTICAS */}
          <Collapsible
            open={metricsSectionOpen}
            onOpenChange={setMetricsSectionOpen}
            className="pomodoro-unified-stats-card mb-6"
          >
            <div className="pomodoro-unified-stats-header">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="pomodoro-unified-stats-toggle"
                  title={
                    metricsSectionOpen
                      ? 'Recolher métricas e estatísticas'
                      : 'Expandir métricas e estatísticas'
                  }
                >
                  <div className="flex items-center gap-2">
                    {metricsSectionOpen ? (
                      <ChevronDown size={16} className="text-[#C5A880]" />
                    ) : (
                      <ChevronRight size={16} className="text-[#C5A880]" />
                    )}
                    <span className="font-['Clash_Display'] font-semibold text-base text-[#F4F4F6]">
                      Visão geral e Estatísticas
                    </span>
                  </div>

                  {/* Resumo compacto quando fechado para visualização rápida */}
                  {!metricsSectionOpen && (
                    <div className="flex items-center gap-3 text-xs font-['Space_Mono'] text-[#A1A1AA]">
                      <span className="hidden sm:inline">
                        Hoje:{' '}
                        <strong className="text-[#F4F4F6]">
                          {formatTotalTime(focoDeHojeMinutos)}
                        </strong>{' '}
                        ({pomosDeHoje} {pomosDeHoje === 1 ? 'pomo' : 'pomos'})
                      </span>
                      <span>
                        Total:{' '}
                        <strong className="text-[#C5A880]">
                          {formatTotalTime(duracaoTotalMinutos)}
                        </strong>
                      </span>
                    </div>
                  )}
                </button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
              <div className="p-4 pt-1 border-t border-white/5">
                <Tabs
                  value={metricsTab}
                  onValueChange={(val) => setMetricsTab(val as 'resumo' | 'estatisticas')}
                  className="w-full"
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <TabsList className="bg-[#090A0E] border border-white/10 p-0.5 rounded-lg h-8">
                      <TabsTrigger
                        value="resumo"
                        className="text-xs font-['Space_Mono'] data-[state=active]:bg-[#C5A880] data-[state=active]:text-[#090A0E] data-[state=active]:font-bold px-3 py-1 rounded"
                      >
                        Resumo Geral
                      </TabsTrigger>
                      <TabsTrigger
                        value="estatisticas"
                        className="text-xs font-['Space_Mono'] data-[state=active]:bg-[#C5A880] data-[state=active]:text-[#090A0E] data-[state=active]:font-bold px-3 py-1 rounded"
                      >
                        Distribuição & Donut
                      </TabsTrigger>
                    </TabsList>

                    <span className="text-[11px] font-['Space_Mono'] text-[#71717A] hidden sm:inline">
                      {metricsTab === 'resumo'
                        ? 'Métricas consolidadas'
                        : `Filtro ativo: ${timeFilterLabel}`}
                    </span>
                  </div>

                  {/* ABA 1: RESUMO (4 CARTÕES DE MÉTRICAS) */}
                  <TabsContent value="resumo" className="mt-0 focus-visible:outline-none">
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
                              Faltam {formatTotalTime(bestDayStats.minutesRemainingToBeat)} p/
                              recorde
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
                  </TabsContent>

                  {/* ABA 2: ESTATÍSTICAS (DONUT INTERATIVO + 5 MÉTRICAS DE DISCIPLINA) */}
                  <TabsContent value="estatisticas" className="mt-0 focus-visible:outline-none">
                    <div className="pt-1">
                      <FocusDistributionChart
                        sessions={periodSessions}
                        timeFilterLabel={timeFilterLabel}
                        onSelectTask={(taskId) => {
                          const foundTask = tasks.find((t) => t.id === taskId)
                          if (foundTask) {
                            selectTask(foundTask)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                            toast({ title: `Tarefa "${foundTask.title}" selecionada para foco` })
                          }
                        }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CollapsibleContent>
          </Collapsible>

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

            {/* BARRA DE FILTROS EXTRAS DA TIMELINE (TAREFA + STATUS + LIMPAR) */}
            <div className="pomodoro-timeline-filter-bar">
              <div className="pomodoro-timeline-filter-group">
                <span className="pomodoro-timeline-filter-icon">
                  <Filter size={12} className="text-[#C5A880]" />
                </span>

                {/* FILTRO POR TAREFA */}
                <div className="pomodoro-filter-control">
                  <label htmlFor="pomodoro-task-filter" className="sr-only">
                    Filtrar por tarefa
                  </label>
                  <select
                    id="pomodoro-task-filter"
                    value={selectedTaskFilter}
                    onChange={(e) => setSelectedTaskFilter(e.target.value)}
                    className="pomodoro-filter-select"
                  >
                    <option value="todas">Todas as tarefas ({tasksInPeriod.length})</option>
                    {tasksInPeriod.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FILTRO POR STATUS DE CONCLUSÃO */}
                <div className="pomodoro-filter-control">
                  <label htmlFor="pomodoro-status-filter" className="sr-only">
                    Filtrar por status
                  </label>
                  <select
                    id="pomodoro-status-filter"
                    value={selectedStatusFilter}
                    onChange={(e) =>
                      setSelectedStatusFilter(
                        e.target.value as 'todas' | 'completa' | 'interrompida',
                      )
                    }
                    className="pomodoro-filter-select"
                  >
                    <option value="todas">Todos os status</option>
                    <option value="completa">Completas</option>
                    <option value="interrompida">Interrompidas</option>
                  </select>
                </div>
              </div>

              {hasExtraFiltersActive && (
                <button
                  type="button"
                  onClick={handleClearTimelineFilters}
                  className="pomodoro-filter-clear-btn"
                  title="Limpar filtros de tarefa e status da timeline"
                >
                  <XIcon size={12} />
                  <span>Limpar filtros</span>
                </button>
              )}
            </div>

            {sessionsByDay.length === 0 ? (
              <p className="pomodoro-timeline-empty">
                Nenhuma sessão encontrada para os filtros aplicados.
              </p>
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

      {/* =========================================================
          MODO FOCO EM TELA CHEIA (IMERSÃO TOTAL · BARBOSA SYSTEM)
          ========================================================= */}
      {isFullscreenFocus && (
        <div className="pomodoro-fullscreen-overlay">
          {/* TOPO: FASE E BOTÃO SAIR DE TELA CHEIA */}
          <div className="pomodoro-fullscreen-header">
            <div className="pomodoro-fullscreen-phase">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning
                    ? 'bg-[#C5A880] animate-pulse'
                    : isPaused
                      ? 'bg-amber-400'
                      : 'bg-[#71717A]'
                }`}
              />
              <span>{phaseLabel}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreenFocus(false)}
              className="pomodoro-fullscreen-close-btn"
              title="Sair do modo tela cheia (Esc)"
            >
              <Minimize2 size={15} className="text-[#C5A880]" />
              <span>Sair da tela cheia</span>
            </button>
          </div>

          {/* CENTRO: TIMER GIGANTE + OBJETIVO DO BLOCO + TAREFA */}
          <div className="pomodoro-fullscreen-center">
            <div className={`pomodoro-fullscreen-digits ${isOvertime ? 'is-overtime' : ''}`}>
              {formattedTimer}
            </div>

            {(state?.objective || currentObjective) && (
              <div className="pomodoro-fullscreen-objective" title="Objetivo ativo deste bloco">
                <span className="tag">OBJETIVO</span>
                <span className="title">{state?.objective || currentObjective}</span>
              </div>
            )}

            {currentLinkedTask && (
              <div className="pomodoro-fullscreen-task-sub">
                <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
                <span className="truncate">Tarefa: {currentLinkedTask.title}</span>
              </div>
            )}
          </div>

          {/* RODAPÉ: CONTROLES MÍNIMOS (PLAY/PAUSE, ENCERRAR, DESCARTAR) */}
          <div className="pomodoro-fullscreen-footer">
            <div className="pomodoro-fullscreen-controls">
              {/* Botão transição em overtime */}
              {isOvertime && !isReadOnlyTab && (
                <>
                  {state?.phase === 'foco' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await startBreakFromOvertime()
                        if (refreshSessions) refreshSessions()
                      }}
                      className="pomodoro-fullscreen-btn primary"
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
                      className="pomodoro-fullscreen-btn primary"
                    >
                      Iniciar Próximo Bloco
                    </button>
                  )}
                </>
              )}

              {!isReadOnlyTab && !isOvertime && (
                <>
                  <button
                    type="button"
                    className="pomodoro-fullscreen-btn primary"
                    onClick={() => {
                      if (!isRunning) {
                        start(state?.task ?? selectedTask, undefined, currentObjective)
                      } else {
                        toggle()
                      }
                    }}
                    title={isRunning ? 'Pausar foco' : 'Iniciar/Retomar foco'}
                  >
                    {isRunning ? (
                      <>
                        <Pause size={20} fill="currentColor" />
                        <span>Pausar</span>
                      </>
                    ) : isPaused ? (
                      <>
                        <Play size={20} fill="currentColor" />
                        <span>Retomar</span>
                      </>
                    ) : (
                      <>
                        <Play size={20} fill="currentColor" />
                        <span>Começar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="pomodoro-fullscreen-btn"
                    onClick={async () => {
                      await finish()
                      if (refreshSessions) refreshSessions()
                      setIsFullscreenFocus(false)
                    }}
                    disabled={!hasActiveSession}
                    title="Encerrar e registrar tempo"
                  >
                    <Square size={18} />
                    <span>Encerrar</span>
                  </button>

                  {hasActiveSession && (
                    <button
                      type="button"
                      className="pomodoro-fullscreen-btn"
                      onClick={() => {
                        discard()
                        setIsFullscreenFocus(false)
                      }}
                      title="Descartar timer"
                    >
                      <RotateCcw size={16} />
                      <span>Descartar</span>
                    </button>
                  )}
                </>
              )}
            </div>

            <span className="pomodoro-fullscreen-hint">
              Pressione Esc para voltar à visão completa
            </span>
          </div>
        </div>
      )}

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
                  min={1}
                  max={240}
                  required
                  value={presetForm.workMinutes}
                  onChange={(e) =>
                    setPresetForm({ ...presetForm, workMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-[#090A0E] border border-[rgba(197,168,128,0.22)] rounded-lg px-3 py-2 text-sm font-['Space_Mono'] text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                />
                <span className="text-[11px] text-[#A1A1AA] font-['Space_Mono'] mt-1 block">
                  1 em 1 min (mínimo 1 min)
                </span>{' '}
              </div>

              <div>
                <label className="block text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Descanso Curto (min)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={presetForm.shortBreakMinutes}
                  onChange={(e) =>
                    setPresetForm({ ...presetForm, shortBreakMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-[#090A0E] border border-[rgba(197,168,128,0.22)] rounded-lg px-3 py-2 text-sm font-['Space_Mono'] text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                />
                <span className="text-[11px] text-[#A1A1AA] font-['Space_Mono'] mt-1 block">
                  1 em 1 min (mínimo 1 min)
                </span>{' '}
              </div>

              <div>
                <label className="block text-[11px] font-['Space_Mono'] uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Descanso Longo (min)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  required
                  value={presetForm.longBreakMinutes}
                  onChange={(e) =>
                    setPresetForm({ ...presetForm, longBreakMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-[#090A0E] border border-[rgba(197,168,128,0.22)] rounded-lg px-3 py-2 text-sm font-['Space_Mono'] text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                />
                <span className="text-[11px] text-[#A1A1AA] font-['Space_Mono'] mt-1 block">
                  1 em 1 min (mínimo 1 min)
                </span>{' '}
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
