import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Folder,
  GripVertical,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Star,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { TaskCard } from '@/components/TaskCard'
import { TaskDetail } from '@/components/TaskDetail'
import { BrandMark } from '@/components/Brand'
import { formatMinutes } from '@/lib/format'
import { EstimateInput } from '@/components/EstimateInput'
import {
  createProjectSection,
  createTask,
  deleteProjectSection,
  getProjectById,
  getProjectSections,
  moveTaskToSection,
  reorderTasks,
  toggleProjectFavorite,
  updateProject,
  updateProjectSection,
} from '@/services/data'
import type { ListRecord, ProjectSectionRecord, TagRecord, TaskRecord } from '@/types'
import { toast } from '@/hooks/use-toast'

interface ProjectDetailProps {
  tasks: TaskRecord[]
  tags?: TagRecord[]
  lists?: ListRecord[]
  refresh: () => void
}

export function ProjectDetail({ tasks, tags, lists = [], refresh }: ProjectDetailProps) {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const [project, setProject] = useState<ListRecord | null>(null)
  const [sections, setSections] = useState<ProjectSectionRecord[]>([])
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null)
  const [loading, setLoading] = useState(true)

  // Modais de seção
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<ProjectSectionRecord | null>(null)
  const [sectionName, setSectionName] = useState('')

  // Captura rápida contextual dentro de uma seção
  const [addingTaskSectionId, setAddingTaskSectionId] = useState<string | null>(null)
  const [inlineTaskTitle, setInlineTaskTitle] = useState('')
  const [inlineEstimatedMinutes, setInlineEstimatedMinutes] = useState<number | null>(25)

  // Drag and drop de tarefas
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' } | null>(
    null,
  )
  const [dropSectionTarget, setDropSectionTarget] = useState<string | null>(null)

  // Carregar dados do projeto e seções
  const loadProjectData = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const proj = await getProjectById(id)
      setProject(proj)
      const secs = await getProjectSections(id)
      setSections(secs)
    } catch (err) {
      console.error('Erro ao carregar projeto:', err)
      toast({ title: 'Projeto não encontrado.', variant: 'destructive' })
      navigate('/projetos')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    loadProjectData()
  }, [loadProjectData])

  // Sincronizar tarefa selecionada com a URL (?taskId=...)
  useEffect(() => {
    const taskIdParam = params.get('taskId')
    if (taskIdParam) {
      const found = tasks.find((t) => t.id === taskIdParam)
      if (found) setSelectedTask(found)
    }
  }, [params, tasks])

  // Filtrar tarefas pertencentes a este projeto
  const projectTasks = useMemo(() => {
    if (!id) return []
    return tasks.filter((t) => t.list === id)
  }, [tasks, id])

  // Cálculos de Resumo ESTIMADO × REAL
  const { totalEstimatedMinutes, totalActualMinutes, completedTasksCount, openTasksCount } =
    useMemo(() => {
      let est = 0
      let act = 0
      let comp = 0
      let op = 0
      for (const t of projectTasks) {
        est += Number(t.estimated_minutes) || 0
        act += Number(t.actual_minutes) || 0
        if (t.done) comp++
        else op++
      }
      return {
        totalEstimatedMinutes: est,
        totalActualMinutes: act,
        completedTasksCount: comp,
        openTasksCount: op,
      }
    }, [projectTasks])

  // Proporção de tempo gasto vs estimado (calibração de prazo)
  const timeRatio =
    totalEstimatedMinutes > 0
      ? Math.min(100, Math.round((totalActualMinutes / totalEstimatedMinutes) * 100))
      : 0

  // Tarefas distribuídas por seção (e sem seção)
  const tasksBySection = useMemo(() => {
    const sectionMap = new Map<string, TaskRecord[]>()

    // Chave vazia para tarefas sem seção
    sectionMap.set('__none__', [])
    for (const sec of sections) {
      sectionMap.set(sec.id, [])
    }

    for (const t of projectTasks) {
      if (!t.done) {
        const secId = t.section || '__none__'
        if (sectionMap.has(secId)) {
          sectionMap.get(secId)!.push(t)
        } else {
          sectionMap.get('__none__')!.push(t)
        }
      }
    }

    return sectionMap
  }, [projectTasks, sections])

  // Tarefas concluídas do projeto
  const completedTasks = useMemo(() => {
    return projectTasks.filter((t) => t.done)
  }, [projectTasks])

  // Manipulação de Seções
  const handleSaveSection = async () => {
    const trimmed = sectionName.trim()
    if (!trimmed || !id || !user) return

    try {
      if (editingSection) {
        await updateProjectSection(editingSection.id, { name: trimmed })
        toast({ title: `Seção "${trimmed}" atualizada!` })
      } else {
        await createProjectSection({
          name: trimmed,
          user: user.id,
          project: id,
          order: (sections.length + 1) * 10,
        })
        toast({ title: `Seção "${trimmed}" criada!` })
      }
      setIsSectionModalOpen(false)
      setEditingSection(null)
      setSectionName('')
      const nextSecs = await getProjectSections(id)
      setSections(nextSecs)
    } catch (err) {
      console.error('Erro ao salvar seção:', err)
      toast({ title: 'Erro ao salvar seção.', variant: 'destructive' })
    }
  }

  const handleDeleteSection = async (secId: string) => {
    if (!id) return
    try {
      await deleteProjectSection(secId)
      toast({
        title: 'Seção excluída.',
        description: 'Tarefas foram movidas para "Sem seção".',
      })
      const nextSecs = await getProjectSections(id)
      setSections(nextSecs)
      refresh()
    } catch (err) {
      console.error('Erro ao excluir seção:', err)
      toast({ title: 'Erro ao excluir seção.', variant: 'destructive' })
    }
  }

  // Captura Rápida Contextual dentro de uma seção
  const handleCreateTaskInSection = async (sectionId: string | null) => {
    const title = inlineTaskTitle.trim()
    if (!title || !user || !id) return

    try {
      await createTask({
        title,
        user: user.id,
        list: id,
        section: sectionId || '',
        done: false,
        estimated_minutes: inlineEstimatedMinutes,
        actual_minutes: 0,
        order: 0,
      })
      setInlineTaskTitle('')
      setAddingTaskSectionId(null)
      toast({ title: `Tarefa criada em "${project?.name}"!` })
      refresh()
    } catch (err) {
      console.error('Erro ao criar tarefa na seção:', err)
      toast({ title: 'Erro ao criar tarefa.', variant: 'destructive' })
    }
  }

  // Renderizar descrição como link clicável (incluindo obsidian:// e http/https)
  const renderDescriptionWithLinks = (descText: string) => {
    if (!descText) return null
    // Detecta obsidian:// ou http:// ou https://
    const urlPattern = /(obsidian:\/\/[^\s]+|https?:\/\/[^\s]+)/g
    const parts = descText.split(urlPattern)

    return parts.map((part, idx) => {
      if (
        part.startsWith('obsidian://') ||
        part.startsWith('http://') ||
        part.startsWith('https://')
      ) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#C5A880] hover:underline break-all font-mono text-xs bg-[rgba(197,168,128,0.1)] px-2 py-0.5 rounded border border-[rgba(197,168,128,0.2)]"
          >
            <span>{part}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }

  // Drag and Drop de Reordenação e Mover entre seções
  const commitTaskReorder = useCallback(
    async (
      fromId: string,
      toId: string,
      position: 'before' | 'after',
      targetSectionId?: string | null,
    ) => {
      if (fromId === toId) return

      const allPending = projectTasks.filter((t) => !t.done)
      const fromIndex = allPending.findIndex((t) => t.id === fromId)
      const toIndex = allPending.findIndex((t) => t.id === toId)
      if (fromIndex === -1 || toIndex === -1) return

      const sourceTask = allPending[fromIndex]
      const targetTask = allPending[toIndex]

      // Mover de seção se solto em seção diferente
      const newSection = targetSectionId !== undefined ? targetSectionId : targetTask.section || ''
      if (sourceTask.section !== newSection) {
        await moveTaskToSection(fromId, newSection || null)
      }

      const [moved] = allPending.splice(fromIndex, 1)
      let targetInsertIndex = allPending.findIndex((t) => t.id === toId)
      if (position === 'after') targetInsertIndex += 1
      allPending.splice(targetInsertIndex, 0, moved)

      try {
        await reorderTasks(allPending)
        refresh()
      } catch (err) {
        console.error('Erro ao reordenar tarefas no projeto:', err)
      }
    },
    [projectTasks, refresh],
  )

  if (loading || !project) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[40vh] text-[#A1A1AA]">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-[#C5A880] border-t-transparent animate-spin" />
          <span className="font-mono text-xs">Carregando projeto...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full animate-fade-in text-[#F4F4F6]">
      {/* VOLTAR & BREADCRUMB */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link
          to="/projetos"
          className="text-xs font-mono text-[#A1A1AA] hover:text-[#C5A880] transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Projetos</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await toggleProjectFavorite(project.id, !!project.favorite)
              setProject((prev) => (prev ? { ...prev, favorite: !prev.favorite } : prev))
              refresh()
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              project.favorite
                ? 'bg-[rgba(197,168,128,0.15)] text-[#C5A880] border-[rgba(197,168,128,0.3)]'
                : 'bg-[#12131A] text-[#71717A] border-[rgba(255,255,255,0.08)] hover:text-[#F4F4F6]'
            }`}
            title={project.favorite ? 'Favorito' : 'Marcar como favorito'}
          >
            <Star className={`w-3.5 h-3.5 ${project.favorite ? 'fill-[#C5A880]' : ''}`} />
          </button>
        </div>
      </div>

      {/* CABEÇALHO DO PROJETO */}
      <div className="bg-[#12131A] border border-[rgba(255,255,255,0.07)] rounded-xl p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: project.color || '#C5A880' }}
              />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F4F4F6] tracking-tight">
                {project.name}
              </h1>
              {project.favorite && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[rgba(197,168,128,0.15)] text-[#C5A880] border border-[rgba(197,168,128,0.3)]">
                  FAVORITO
                </span>
              )}
            </div>

            {/* OBJETIVO DO PROJETO EM DESTAQUE */}
            {project.goal && (
              <div className="bg-[#090A0E] border border-[rgba(197,168,128,0.25)] rounded-lg p-3 sm:p-3.5 flex items-start gap-3">
                <Target className="w-5 h-5 text-[#C5A880] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase block font-bold">
                    OBJETIVO MENSURÁVEL DO CICLO
                  </span>
                  <p className="text-sm sm:text-base text-[#F4F4F6] font-serif italic mt-0.5">
                    "{project.goal}"
                  </p>
                </div>
              </div>
            )}

            {/* DESCRIÇÃO / LINK OBSIDIAN */}
            {project.description && (
              <div className="text-xs text-[#A1A1AA] pt-1">
                {renderDescriptionWithLinks(project.description)}
              </div>
            )}
          </div>

          {/* BOTÃO ADICIONAR SEÇÃO */}
          <button
            type="button"
            onClick={() => {
              setEditingSection(null)
              setSectionName('')
              setIsSectionModalOpen(true)
            }}
            className="self-start px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase bg-[#181A24] hover:bg-[#202230] text-[#C5A880] border border-[rgba(197,168,128,0.25)] transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nova Seção</span>
          </button>
        </div>

        {/* RESUMO ESTIMADO × REAL (CALIBRAÇÃO DE PRAZO DO USUÁRIO) */}
        <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#A1A1AA]">
              <Clock className="w-4 h-4 text-[#C5A880]" />
              <span>
                Calibração de Prazo:{' '}
                <b className="text-[#F4F4F6]">Estimado {formatMinutes(totalEstimatedMinutes)}</b> ·{' '}
                <b
                  className={
                    totalActualMinutes > totalEstimatedMinutes ? 'text-[#E57373]' : 'text-[#8F9E82]'
                  }
                >
                  Real {formatMinutes(totalActualMinutes)}
                </b>
              </span>
            </div>

            <div className="flex items-center gap-3 text-[#71717A]">
              <span>
                <b className="text-[#F4F4F6]">{openTasksCount}</b> abertas
              </span>
              <span>
                <b className="text-[#8F9E82]">{completedTasksCount}</b> concluídas
              </span>
              <span className="text-[#C5A880] font-bold">{timeRatio}% tempo estimado gasto</span>
            </div>
          </div>

          {/* BARRA DE PROPORÇÃO DE TEMPO */}
          <div className="w-full bg-[rgba(255,255,255,0.06)] h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                totalActualMinutes > totalEstimatedMinutes ? 'bg-[#E57373]' : 'bg-[#C5A880]'
              }`}
              style={{ width: `${Math.min(100, timeRatio)}%` }}
            />
          </div>
        </div>
      </div>

      {/* SEÇÕES DO PROJETO */}
      <div className="space-y-6">
        {/* SEÇÃO PADRÃO: SEM SEÇÃO (SE HOUVER TAREFAS NELA OU SE NÃO HOUVER NENHUMA SEÇÃO CADASTRADA) */}
        {(tasksBySection.get('__none__')?.length || 0) > 0 || sections.length === 0 ? (
          <div className="bg-[#0F1016] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#71717A]" />
                <h3 className="text-sm font-mono uppercase font-bold text-[#A1A1AA] tracking-wider">
                  {sections.length === 0 ? 'Tarefas do Projeto' : 'Sem Seção'}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[#71717A]">
                  {tasksBySection.get('__none__')?.length || 0}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setAddingTaskSectionId('__none__')}
                className="text-xs font-mono text-[#C5A880] hover:text-[#D4B991] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Tarefa</span>
              </button>
            </div>

            {/* FORMULÁRIO INLINE DE CAPTURA RÁPIDA NA SEÇÃO */}
            {addingTaskSectionId === '__none__' && (
              <div className="mb-3 p-3 bg-[#12131A] rounded-lg border border-[#C5A880] flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={inlineTaskTitle}
                  onChange={(e) => setInlineTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTaskInSection(null)
                    if (e.key === 'Escape') setAddingTaskSectionId(null)
                  }}
                  autoFocus
                  placeholder="Nome da tarefa nesta seção..."
                  className="flex-1 bg-transparent text-sm text-[#F4F4F6] placeholder-[#71717A] focus:outline-none"
                />
                <div className="flex items-center gap-2 justify-end">
                  <select
                    value={inlineEstimatedMinutes}
                    onChange={(e) => setInlineEstimatedMinutes(Number(e.target.value))}
                    className="bg-[#090A0E] text-xs font-mono text-[#C5A880] rounded px-2 py-1 border border-[rgba(255,255,255,0.1)] focus:outline-none"
                  >
                    <option value={15}>15 min</option>
                    <option value={25}>25 min</option>
                    <option value={50}>50 min</option>
                    <option value={90}>90 min</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCreateTaskInSection(null)}
                    className="px-3 py-1 bg-[#C5A880] text-[#090A0E] text-xs font-mono font-bold rounded"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingTaskSectionId(null)}
                    className="p-1 text-[#71717A] hover:text-[#F4F4F6]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* LISTA DE TAREFAS */}
            <div className="space-y-2">
              {(tasksBySection.get('__none__') || []).map((t, idx) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  index={idx}
                  tags={tags}
                  lists={lists}
                  draggable={true}
                  isDragging={draggingTaskId === t.id}
                  isDropTarget={dropTarget?.id === t.id ? dropTarget.position : null}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', t.id)
                    setDraggingTaskId(t.id)
                  }}
                  onDragEnd={() => {
                    setDraggingTaskId(null)
                    setDropTarget(null)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (!draggingTaskId || draggingTaskId === t.id) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const midY = rect.top + rect.height / 2
                    setDropTarget({ id: t.id, position: e.clientY < midY ? 'before' : 'after' })
                  }}
                  onDrop={async (e) => {
                    e.preventDefault()
                    const sourceId = e.dataTransfer.getData('text/plain') || draggingTaskId
                    const pos = dropTarget?.id === t.id ? dropTarget.position : 'before'
                    setDraggingTaskId(null)
                    setDropTarget(null)
                    if (sourceId && sourceId !== t.id) {
                      await commitTaskReorder(sourceId, t.id, pos, null)
                    }
                  }}
                  onChange={refresh}
                  onOpen={() => {
                    setSelectedTask(t)
                    setParams((p) => {
                      p.set('taskId', t.id)
                      return p
                    })
                  }}
                />
              ))}
              {(tasksBySection.get('__none__') || []).length === 0 && !addingTaskSectionId && (
                <div className="py-4 text-center text-xs font-mono text-[#71717A]">
                  Nenhuma tarefa pendente nesta seção.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* SEÇÕES NOMINADAS (Ex.: Saúde, Sistemas, Prospecção ou Diário/Semanal/Mensal) */}
        {sections.map((sec) => {
          const secTasks = tasksBySection.get(sec.id) || []

          return (
            <div
              key={sec.id}
              className="bg-[#0F1016] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-mono uppercase font-bold text-[#F4F4F6] tracking-wider">
                    {sec.name}
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[#A1A1AA]">
                    {secTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddingTaskSectionId(sec.id)}
                    className="text-xs font-mono text-[#C5A880] hover:text-[#D4B991] flex items-center gap-1 mr-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Tarefa</span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="p-1 rounded text-[#71717A] hover:text-[#F4F4F6] hover:bg-[rgba(255,255,255,0.06)]"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 bg-[#12131A] border-[rgba(255,255,255,0.1)] text-[#F4F4F6]"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingSection(sec)
                          setSectionName(sec.name)
                          setIsSectionModalOpen(true)
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-2" />
                        Renomear seção
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteSection(sec.id)}
                        className="text-[#E57373] hover:bg-[rgba(229,115,115,0.1)]"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Excluir seção
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* FORMULÁRIO INLINE DE CAPTURA RÁPIDA NA SEÇÃO */}
              {addingTaskSectionId === sec.id && (
                <div className="mb-3 p-3 bg-[#12131A] rounded-lg border border-[#C5A880] flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inlineTaskTitle}
                      onChange={(e) => setInlineTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTaskInSection(sec.id)
                        if (e.key === 'Escape') setAddingTaskSectionId(null)
                      }}
                      autoFocus
                      placeholder={`Nome da tarefa em "${sec.name}"...`}
                      className="flex-1 bg-transparent text-sm text-[#F4F4F6] placeholder-[#71717A] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCreateTaskInSection(sec.id)}
                      className="px-3 py-1 bg-[#C5A880] text-[#090A0E] text-xs font-mono font-bold rounded"
                    >
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingTaskSectionId(null)}
                      className="p-1 text-[#71717A] hover:text-[#F4F4F6]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                    <EstimateInput
                      value={inlineEstimatedMinutes}
                      onChange={(val) => setInlineEstimatedMinutes(val)}
                      allowClear
                      showQuickChips
                      showWarning
                      variant="compact"
                      onConfirm={() => handleCreateTaskInSection(sec.id)}
                    />
                  </div>
                </div>
              )}

              {/* LISTA DE TAREFAS */}
              <div className="space-y-2">
                {secTasks.map((t, idx) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    index={idx}
                    tags={tags}
                    lists={lists}
                    draggable={true}
                    isDragging={draggingTaskId === t.id}
                    isDropTarget={dropTarget?.id === t.id ? dropTarget.position : null}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', t.id)
                      setDraggingTaskId(t.id)
                    }}
                    onDragEnd={() => {
                      setDraggingTaskId(null)
                      setDropTarget(null)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (!draggingTaskId || draggingTaskId === t.id) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const midY = rect.top + rect.height / 2
                      setDropTarget({ id: t.id, position: e.clientY < midY ? 'before' : 'after' })
                    }}
                    onDrop={async (e) => {
                      e.preventDefault()
                      const sourceId = e.dataTransfer.getData('text/plain') || draggingTaskId
                      const pos = dropTarget?.id === t.id ? dropTarget.position : 'before'
                      setDraggingTaskId(null)
                      setDropTarget(null)
                      if (sourceId && sourceId !== t.id) {
                        await commitTaskReorder(sourceId, t.id, pos, sec.id)
                      }
                    }}
                    onChange={refresh}
                    onOpen={() => {
                      setSelectedTask(t)
                      setParams((p) => {
                        p.set('taskId', t.id)
                        return p
                      })
                    }}
                  />
                ))}
                {secTasks.length === 0 && !addingTaskSectionId && (
                  <div className="py-4 text-center text-xs font-mono text-[#71717A]">
                    Nenhuma tarefa nesta seção.
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* TAREFAS CONCLUÍDAS DO PROJETO */}
        {completedTasks.length > 0 && (
          <details className="completed">
            <summary>Concluídas neste Projeto — {completedTasks.length}</summary>
            {completedTasks.map((t, idx) => (
              <TaskCard
                key={t.id}
                task={t}
                index={idx}
                tags={tags}
                lists={lists}
                draggable={false}
                onChange={refresh}
                onOpen={() => setSelectedTask(t)}
              />
            ))}
          </details>
        )}
      </div>

      {/* MODAL CRIAR / RENOMEAR SEÇÃO */}
      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent className="bg-[#090A0E] border-[rgba(255,255,255,0.12)] text-[#F4F4F6] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-bold text-[#F4F4F6]">
              {editingSection ? 'Renomear Seção' : 'Nova Seção de Projeto'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#A1A1AA]">
              Organize as tarefas por áreas (ex.: Saúde, Sistemas, Prospecção) ou frequência
              (Diário, Semanal).
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              Nome da Seção *
            </label>
            <input
              type="text"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="Ex.: Desenvolvimento / Sistemas"
              autoFocus
              className="w-full bg-[#12131A] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setIsSectionModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6] border border-[rgba(255,255,255,0.1)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveSection}
              className="px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase bg-[#C5A880] text-[#090A0E] hover:bg-[#D4B991]"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE DETALHE DA TAREFA */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onChange={refresh}
          onClose={() => {
            setSelectedTask(null)
            setParams((p) => {
              p.delete('taskId')
              return p
            })
          }}
        />
      )}
    </div>
  )
}
