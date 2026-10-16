import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  Edit2,
  Filter,
  GitMerge,
  Layers,
  MoreHorizontal,
  Pin,
  PinOff,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { TaskCard } from '@/components/TaskCard'
import { TaskDetail } from '@/components/TaskDetail'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import type {
  FilterCriteria,
  FilterPeriod,
  FilterPriority,
  FilterStatus,
  ListRecord,
  SavedFilterRecord,
  TagRecord,
  TaskRecord,
} from '@/types'
import {
  createSavedFilter,
  createTag,
  deleteSavedFilter,
  deleteTag,
  formatCriteriaSummary,
  getNextTagColor,
  getSavedFilters,
  mergeTags,
  reorderTasks,
  TAG_PALETTE,
  taskMatchesFilterCriteria,
  toggleSavedFilterPinned,
  toggleTagPinned,
  updateSavedFilter,
  updateTag,
} from '@/services/data'

interface FiltersHubProps {
  tasks: TaskRecord[]
  tags: TagRecord[]
  lists: ListRecord[]
  refresh: () => void
}

export function FiltersHubPage({ tasks, tags, lists, refresh }: FiltersHubProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()

  const [savedFilters, setSavedFilters] = useState<SavedFilterRecord[]>([])
  const [loadingFilters, setLoadingFilters] = useState(true)

  // Sub-visão ou aba: 'hub' (geral), 'tag-tasks' (tarefas de uma tag), 'filter-view' (execução de filtro)
  const activeTab = (params.get('tab') as 'filtros' | 'etiquetas') || 'filtros'
  const activeFilterId = params.get('filterId')
  const activeTagId = params.get('tagId')

  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null)

  // Carrega filtros salvos do backend
  const loadFilters = useCallback(async () => {
    if (!user) return
    try {
      setLoadingFilters(true)
      const list = await getSavedFilters()
      setSavedFilters(list)
    } catch (err) {
      console.error('Erro ao carregar filtros salvos:', err)
    } finally {
      setLoadingFilters(false)
    }
  }, [user])

  useEffect(() => {
    loadFilters()
  }, [loadFilters])

  // ==========================================
  // CONTAGENS DE TAREFAS POR ETIQUETA
  // ==========================================
  const openCountByTag = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      if (!t.done) {
        const tagIds = t.tags || []
        const exp = t.expand?.tags?.map((x) => x.id) || []
        const all = Array.from(new Set([...tagIds, ...exp]))
        for (const tid of all) {
          map.set(tid, (map.get(tid) || 0) + 1)
        }
      }
    }
    return map
  }, [tasks])

  // Contagem de tarefas abertas por filtro salvo
  const openCountByFilter = useMemo(() => {
    const map = new Map<string, number>()
    const now = new Date()
    for (const filter of savedFilters) {
      const count = tasks.filter(
        (t) => !t.done && taskMatchesFilterCriteria(t, filter.criteria, now),
      ).length
      map.set(filter.id, count)
    }
    return map
  }, [tasks, savedFilters])

  // ==========================================
  // ESTADOS DE MODAL (Etiquetas)
  // ==========================================
  const [tagModalMode, setTagModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingTag, setEditingTag] = useState<TagRecord | null>(null)
  const [tagNameInput, setTagNameInput] = useState('')
  const [tagColorInput, setTagColorInput] = useState('#C5A880')

  const [deletingTag, setDeletingTag] = useState<TagRecord | null>(null)
  const [mergingTag, setMergingTag] = useState<TagRecord | null>(null)
  const [mergeTargetTagId, setMergeTargetTagId] = useState<string>('')

  // ==========================================
  // ESTADOS DE MODAL (Filtros Salvos)
  // ==========================================
  const [filterModalMode, setFilterModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingFilter, setEditingFilter] = useState<SavedFilterRecord | null>(null)
  const [filterNameInput, setFilterNameInput] = useState('')
  const [filterColorInput, setFilterColorInput] = useState('#C5A880')

  // Critérios guiados do formulário
  const [criteriaPeriod, setCriteriaPeriod] = useState<FilterPeriod>('any')
  const [criteriaPriority, setCriteriaPriority] = useState<FilterPriority>('any')
  const [criteriaTagId, setCriteriaTagId] = useState<string>('any')
  const [criteriaProjectId, setCriteriaProjectId] = useState<string>('any')
  const [criteriaStatus, setCriteriaStatus] = useState<FilterStatus>('open')

  const [deletingFilter, setDeletingFilter] = useState<SavedFilterRecord | null>(null)

  // Abrir modal de criação de tag
  const handleOpenCreateTag = () => {
    setTagModalMode('create')
    setEditingTag(null)
    setTagNameInput('')
    setTagColorInput(getNextTagColor(tags.length))
  }

  // Abrir modal de edição de tag
  const handleOpenEditTag = (tag: TagRecord) => {
    setTagModalMode('edit')
    setEditingTag(tag)
    setTagNameInput(tag.name)
    setTagColorInput(tag.color || '#C5A880')
  }

  // Salvar tag (criar ou editar)
  const handleSaveTag = async () => {
    if (!tagNameInput.trim() || !user) return
    const cleanName = tagNameInput.trim().replace(/^@/, '')
    try {
      if (tagModalMode === 'create') {
        await createTag({
          name: cleanName,
          user: user.id,
          color: tagColorInput,
          order: (tags.length + 1) * 10,
        })
        toast({
          title: 'Etiqueta criada',
          description: `@${cleanName} pronta para uso nas tarefas.`,
        })
      } else if (editingTag) {
        await updateTag(editingTag.id, {
          name: cleanName,
          color: tagColorInput,
        })
        toast({
          title: 'Etiqueta atualizada',
          description: `@${cleanName} foi atualizada.`,
        })
      }
      setTagModalMode(null)
      refresh()
    } catch (err: unknown) {
      console.error('Erro ao salvar etiqueta:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a etiqueta. Verifique se o nome já existe.',
      })
    }
  }

  // Confirmar exclusão de tag
  const handleConfirmDeleteTag = async () => {
    if (!deletingTag) return
    const id = deletingTag.id
    const name = deletingTag.name
    setDeletingTag(null)
    try {
      await deleteTag(id)
      toast({
        title: 'Etiqueta excluída',
        description: `@${name} foi removida e desvinculada das tarefas.`,
      })
      if (activeTagId === id) {
        params.delete('tagId')
        setParams(params)
      }
      refresh()
    } catch (err) {
      console.error('Erro ao excluir tag:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a etiqueta.',
      })
    }
  }

  // Confirmar mesclagem de tags
  const handleConfirmMergeTags = async () => {
    if (!mergingTag || !mergeTargetTagId) return
    const source = mergingTag
    const target = tags.find((t) => t.id === mergeTargetTagId)
    if (!target) return
    setMergingTag(null)
    try {
      await mergeTags(source.id, target.id, true)
      toast({
        title: 'Etiquetas mescladas com sucesso',
        description: `Tarefas de @${source.name} foram movidas para @${target.name}.`,
      })
      if (activeTagId === source.id) {
        params.set('tagId', target.id)
        setParams(params)
      }
      refresh()
    } catch (err) {
      console.error('Erro ao mesclar etiquetas:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao mesclar',
        description: 'Falha ao transferir tarefas entre etiquetas.',
      })
    }
  }

  // Abrir modal de criação de filtro
  const handleOpenCreateFilter = (preset?: {
    name: string
    color?: string
    criteria: FilterCriteria
  }) => {
    setFilterModalMode('create')
    setEditingFilter(null)
    if (preset) {
      setFilterNameInput(preset.name)
      setFilterColorInput(preset.color || '#C5A880')
      setCriteriaPeriod(preset.criteria.period || 'any')
      setCriteriaPriority(preset.criteria.priority !== undefined ? preset.criteria.priority : 'any')
      setCriteriaTagId(preset.criteria.tagId || 'any')
      setCriteriaProjectId(preset.criteria.projectId || 'any')
      setCriteriaStatus(preset.criteria.status || 'open')
    } else {
      setFilterNameInput('')
      setFilterColorInput('#C5A880')
      setCriteriaPeriod('any')
      setCriteriaPriority('any')
      setCriteriaTagId('any')
      setCriteriaProjectId('any')
      setCriteriaStatus('open')
    }
  }

  // Abrir modal de edição de filtro
  const handleOpenEditFilter = (filter: SavedFilterRecord) => {
    setFilterModalMode('edit')
    setEditingFilter(filter)
    setFilterNameInput(filter.name)
    setFilterColorInput(filter.color || '#C5A880')
    const crit = filter.criteria || {}
    setCriteriaPeriod(crit.period || 'any')
    setCriteriaPriority(crit.priority !== undefined ? crit.priority : 'any')
    setCriteriaTagId(crit.tagId || 'any')
    setCriteriaProjectId(crit.projectId || 'any')
    setCriteriaStatus(crit.status || 'open')
  }

  // Salvar filtro
  const handleSaveFilter = async () => {
    if (!filterNameInput.trim() || !user) return
    const criteria: FilterCriteria = {
      period: criteriaPeriod,
      priority: criteriaPriority,
      tagId: criteriaTagId,
      projectId: criteriaProjectId,
      status: criteriaStatus,
    }

    try {
      if (filterModalMode === 'create') {
        const created = await createSavedFilter({
          name: filterNameInput.trim(),
          user: user.id,
          color: filterColorInput,
          criteria,
          order: (savedFilters.length + 1) * 10,
        })
        setSavedFilters((prev) => [created, ...prev])
        toast({
          title: 'Filtro salvo',
          description: `"${created.name}" pronto para visualização.`,
        })
      } else if (editingFilter) {
        const updated = await updateSavedFilter(editingFilter.id, {
          name: filterNameInput.trim(),
          color: filterColorInput,
          criteria,
        })
        setSavedFilters((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
        toast({
          title: 'Filtro atualizado',
          description: `Critérios de "${updated.name}" atualizados.`,
        })
      }
      setFilterModalMode(null)
    } catch (err) {
      console.error('Erro ao salvar filtro salvo:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o filtro.',
      })
    }
  }

  // Confirmar exclusão de filtro
  const handleConfirmDeleteFilter = async () => {
    if (!deletingFilter) return
    const id = deletingFilter.id
    const name = deletingFilter.name
    setDeletingFilter(null)
    try {
      await deleteSavedFilter(id)
      setSavedFilters((prev) => prev.filter((f) => f.id !== id))
      toast({
        title: 'Filtro excluído',
        description: `"${name}" foi removido dos filtros salvos.`,
      })
      if (activeFilterId === id) {
        params.delete('filterId')
        setParams(params)
      }
    } catch (err) {
      console.error('Erro ao excluir filtro salvo:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o filtro.',
      })
    }
  }

  // Toggle do pin de filtro
  const handleToggleFilterPinned = async (filter: SavedFilterRecord) => {
    const nextPinned = !filter.pinned
    setSavedFilters((prev) =>
      prev.map((f) => (f.id === filter.id ? { ...f, pinned: nextPinned } : f)),
    )
    try {
      await toggleSavedFilterPinned(filter.id, !!filter.pinned)
      toast({
        title: nextPinned ? 'Filtro fixado' : 'Filtro desafixado',
        description: nextPinned
          ? `"${filter.name}" agora aparece na seção Favoritos da sidebar.`
          : `"${filter.name}" foi removido dos Favoritos da sidebar.`,
      })
    } catch (err) {
      console.error('Erro ao alternar pin do filtro:', err)
      loadFilters()
    }
  }

  // Toggle do pin de tag
  const handleToggleTagPinned = async (tag: TagRecord) => {
    try {
      await toggleTagPinned(tag.id, !!tag.pinned)
      refresh()
      toast({
        title: !tag.pinned ? 'Etiqueta fixada' : 'Etiqueta desafixada',
        description: !tag.pinned
          ? `@${tag.name} adicionada aos favoritos da sidebar.`
          : `@${tag.name} removida dos favoritos.`,
      })
    } catch (err) {
      console.error('Erro ao alternar pin da tag:', err)
    }
  }

  // ==========================================
  // RESOLUÇÃO DE VISÃO DE FILTRO EXECUTADO OU TAG EXECUTADA
  // ==========================================
  const currentExecutedFilter = useMemo(() => {
    if (!activeFilterId) return null
    return savedFilters.find((f) => f.id === activeFilterId) || null
  }, [activeFilterId, savedFilters])

  const currentExecutedTag = useMemo(() => {
    if (!activeTagId) return null
    return tags.find((t) => t.id === activeTagId) || null
  }, [activeTagId, tags])

  // Tarefas filtradas quando um filtro salvo está selecionado
  const executedFilterTasks = useMemo(() => {
    if (!currentExecutedFilter) return []
    const now = new Date()
    return tasks.filter((t) => taskMatchesFilterCriteria(t, currentExecutedFilter.criteria, now))
  }, [currentExecutedFilter, tasks])

  // Tarefas da tag selecionada
  const executedTagTasks = useMemo(() => {
    if (!currentExecutedTag) return []
    return tasks.filter((t) => {
      const tagIds = t.tags || []
      const exp = t.expand?.tags?.map((x) => x.id) || []
      return tagIds.includes(currentExecutedTag.id) || exp.includes(currentExecutedTag.id)
    })
  }, [currentExecutedTag, tasks])

  // ==========================================
  // RENDERIZAÇÃO: MODO EXECUÇÃO DE FILTRO SALVO
  // ==========================================
  if (currentExecutedFilter) {
    const openTasks = executedFilterTasks.filter((t) => !t.done)
    const doneTasks = executedFilterTasks.filter((t) => t.done)
    const summary = formatCriteriaSummary(currentExecutedFilter.criteria, tags, lists)

    return (
      <div className="hub-page-container p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Cabeçalho do Filtro Executado */}
        <div className="bg-[#12141C] border border-[rgba(197,168,128,0.2)] rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: currentExecutedFilter.color || '#C5A880' }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border"
                style={{
                  backgroundColor: 'rgba(18,20,28,0.9)',
                  borderColor: currentExecutedFilter.color || '#C5A880',
                  color: currentExecutedFilter.color || '#C5A880',
                }}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-['Clash_Display'] font-semibold text-[#F4F4F6]">
                    {currentExecutedFilter.name}
                  </h1>
                  {currentExecutedFilter.pinned && (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[rgba(197,168,128,0.15)] text-[#C5A880] border border-[rgba(197,168,128,0.3)] flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5" />
                      Fixado
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#A1A1AA] mt-1 flex items-center gap-2 flex-wrap">
                  <span>Critérios:</span>
                  <span className="font-mono text-[#E4D5BC] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.08)]">
                    {summary}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleToggleFilterPinned(currentExecutedFilter)}
                className={`p-2 rounded-lg text-xs font-mono transition-colors border ${
                  currentExecutedFilter.pinned
                    ? 'bg-[rgba(197,168,128,0.15)] text-[#C5A880] border-[rgba(197,168,128,0.4)]'
                    : 'bg-[#090A0E] text-[#A1A1AA] border-[rgba(255,255,255,0.1)] hover:text-[#F4F4F6]'
                }`}
                title={
                  currentExecutedFilter.pinned
                    ? 'Desafixar dos favoritos'
                    : 'Fixar nos favoritos da sidebar'
                }
              >
                {currentExecutedFilter.pinned ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOpenEditFilter(currentExecutedFilter)}
                className="p-2 rounded-lg text-xs font-mono bg-[#090A0E] text-[#A1A1AA] border border-[rgba(255,255,255,0.1)] hover:text-[#F4F4F6] transition-colors"
                title="Editar critérios do filtro"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  params.delete('filterId')
                  setParams(params)
                }}
                className="px-3 py-2 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6] bg-[#090A0E] border border-[rgba(255,255,255,0.1)] transition-colors"
              >
                Voltar ao Hub
              </button>
            </div>
          </div>
        </div>

        {/* Resumo numérico */}
        <div className="flex items-center justify-between text-xs font-mono text-[#A1A1AA] px-1">
          <div>
            RESULTADO: <span className="text-[#C5A880] font-bold">{openTasks.length}</span>{' '}
            {openTasks.length === 1 ? 'tarefa aberta' : 'tarefas abertas'}
            {doneTasks.length > 0 && ` · ${doneTasks.length} concluída(s)`}
          </div>
        </div>

        {/* Lista de tarefas do filtro */}
        {executedFilterTasks.length === 0 ? (
          <div className="bg-[#12141C] border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 text-center">
            <SlidersHorizontal className="w-10 h-10 text-[#71717A] mx-auto mb-3 opacity-60" />
            <p className="text-sm text-[#A1A1AA] font-mono">
              Nenhuma tarefa corresponde a este filtro salvo no momento.
            </p>
            <p className="text-xs text-[#71717A] mt-1">
              Novas tarefas que atenderem aos critérios aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {openTasks.length > 0 && (
              <div className="space-y-2">
                {openTasks.map((task, idx) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={idx}
                    tags={tags}
                    lists={lists}
                    onChange={refresh}
                    onOpen={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            )}

            {doneTasks.length > 0 && (
              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-[#71717A] px-1">
                  Concluídas ({doneTasks.length})
                </div>
                {doneTasks.map((task, idx) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={idx}
                    tags={tags}
                    lists={lists}
                    onChange={refresh}
                    onOpen={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onChange={() => {
              refresh()
              const updated = tasks.find((t) => t.id === selectedTask.id)
              if (updated) setSelectedTask(updated)
            }}
          />
        )}
      </div>
    )
  }

  // ==========================================
  // RENDERIZAÇÃO: MODO TAREFAS DE UMA ETIQUETA
  // ==========================================
  if (currentExecutedTag) {
    const openTasks = executedTagTasks.filter((t) => !t.done)
    const doneTasks = executedTagTasks.filter((t) => t.done)

    return (
      <div className="hub-page-container p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="bg-[#12141C] border border-[rgba(197,168,128,0.2)] rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: currentExecutedTag.color || '#C5A880' }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border"
                style={{
                  backgroundColor: 'rgba(18,20,28,0.9)',
                  borderColor: currentExecutedTag.color || '#C5A880',
                  color: currentExecutedTag.color || '#C5A880',
                }}
              >
                <TagIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-['Clash_Display'] font-semibold text-[#F4F4F6]">
                    @{currentExecutedTag.name}
                  </h1>
                  {currentExecutedTag.pinned && (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[rgba(197,168,128,0.15)] text-[#C5A880] border border-[rgba(197,168,128,0.3)] flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5" />
                      Fixada
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  {openTasks.length} {openTasks.length === 1 ? 'tarefa aberta' : 'tarefas abertas'}
                  {doneTasks.length > 0 && ` · ${doneTasks.length} concluída(s)`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleToggleTagPinned(currentExecutedTag)}
                className={`p-2 rounded-lg text-xs font-mono transition-colors border ${
                  currentExecutedTag.pinned
                    ? 'bg-[rgba(197,168,128,0.15)] text-[#C5A880] border-[rgba(197,168,128,0.4)]'
                    : 'bg-[#090A0E] text-[#A1A1AA] border-[rgba(255,255,255,0.1)] hover:text-[#F4F4F6]'
                }`}
                title={
                  currentExecutedTag.pinned ? 'Desafixar dos favoritos' : 'Fixar nos favoritos'
                }
              >
                {currentExecutedTag.pinned ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOpenEditTag(currentExecutedTag)}
                className="p-2 rounded-lg text-xs font-mono bg-[#090A0E] text-[#A1A1AA] border border-[rgba(255,255,255,0.1)] hover:text-[#F4F4F6] transition-colors"
                title="Renomear e trocar cor"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  params.delete('tagId')
                  setParams(params)
                }}
                className="px-3 py-2 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6] bg-[#090A0E] border border-[rgba(255,255,255,0.1)] transition-colors"
              >
                Voltar ao Hub
              </button>
            </div>
          </div>
        </div>

        {/* Lista de tarefas da etiqueta */}
        {executedTagTasks.length === 0 ? (
          <div className="bg-[#12141C] border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 text-center">
            <TagIcon className="w-10 h-10 text-[#71717A] mx-auto mb-3 opacity-60" />
            <p className="text-sm text-[#A1A1AA] font-mono">
              Nenhuma tarefa com esta etiqueta encontrada.
            </p>
            <p className="text-xs text-[#71717A] mt-1">
              Atribua @{currentExecutedTag.name} nas tarefas pela barra de captura ou drawer.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {openTasks.length > 0 && (
              <div className="space-y-2">
                {openTasks.map((task, idx) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={idx}
                    tags={tags}
                    lists={lists}
                    onChange={refresh}
                    onOpen={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            )}

            {doneTasks.length > 0 && (
              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-[#71717A] px-1">
                  Concluídas ({doneTasks.length})
                </div>
                {doneTasks.map((task, idx) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={idx}
                    tags={tags}
                    lists={lists}
                    onChange={refresh}
                    onOpen={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onChange={() => {
              refresh()
              const updated = tasks.find((t) => t.id === selectedTask.id)
              if (updated) setSelectedTask(updated)
            }}
          />
        )}
      </div>
    )
  }

  // ==========================================
  // RENDERIZAÇÃO: HUB PRINCIPAL (TABS FILTROS E ETIQUETAS)
  // ==========================================
  return (
    <div className="hub-page-container p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Hero do Hub */}
      <div className="bg-[#12141C] border border-[rgba(197,168,128,0.2)] rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-[#C5A880] uppercase">
              Todoist Engineering · Etapa 3
            </span>
            <h1 className="text-2xl md:text-3xl font-['Clash_Display'] font-semibold text-[#F4F4F6] mt-1">
              Etiquetas & Filtros Salvos
            </h1>
            <p className="text-xs md:text-sm text-[#A1A1AA] mt-1.5 max-w-2xl leading-relaxed">
              Central de inteligência visual: gerencie seu vocabulário de etiquetas, crie visões
              salvas personalizadas com combinações guiadas e fixe o essencial na sua sidebar.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenCreateFilter()}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#C5A880] text-[#090A0E] hover:bg-[#D4B991] transition-all flex items-center gap-2 shadow-lg shadow-[rgba(197,168,128,0.2)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Filtro</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreateTag}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-[#090A0E] text-[#F4F4F6] hover:text-[#C5A880] border border-[rgba(255,255,255,0.12)] hover:border-[#C5A880] transition-all flex items-center gap-2"
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span>Nova Etiqueta</span>
            </button>
          </div>
        </div>

        {/* Abas do Hub */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[rgba(255,255,255,0.06)]">
          <button
            type="button"
            onClick={() => {
              params.set('tab', 'filtros')
              setParams(params)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
              activeTab === 'filtros'
                ? 'bg-[rgba(197,168,128,0.15)] text-[#C5A880] border border-[rgba(197,168,128,0.3)] font-semibold'
                : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros Salvos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[rgba(255,255,255,0.06)]">
              {savedFilters.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              params.set('tab', 'etiquetas')
              setParams(params)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
              activeTab === 'etiquetas'
                ? 'bg-[rgba(197,168,128,0.15)] text-[#C5A880] border border-[rgba(197,168,128,0.3)] font-semibold'
                : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
            }`}
          >
            <TagIcon className="w-3.5 h-3.5" />
            <span>Etiquetas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[rgba(255,255,255,0.06)]">
              {tags.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: FILTROS SALVOS                                         */}
      {/* ============================================================== */}
      {activeTab === 'filtros' && (
        <div className="space-y-6">
          {/* Sugestões rápidas de filtros (Presets populares de produtividade) */}
          <div className="bg-[#12141C] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#F4F4F6]">
                Combinações Inteligentes Sugeridas
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] mb-4">
              Crie rapidamente visões salvas com um clique a partir das regras mais úteis:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() =>
                  handleOpenCreateFilter({
                    name: 'Atrasadas Críticas',
                    color: '#B37D6B',
                    criteria: { period: 'overdue', status: 'open' },
                  })
                }
                className="p-3 rounded-xl bg-[#090A0E] border border-[rgba(255,255,255,0.08)] hover:border-[#C5A880] text-left transition-all group"
              >
                <div className="text-xs font-semibold text-[#F4F4F6] group-hover:text-[#C5A880]">
                  Atrasadas
                </div>
                <div className="text-[11px] text-[#71717A] mt-1 font-mono">
                  Prazo vencido anterior a hoje
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleOpenCreateFilter({
                    name: 'Hoje & P1 Urgente',
                    color: '#C5A880',
                    criteria: { period: 'today', priority: 1, status: 'open' },
                  })
                }
                className="p-3 rounded-xl bg-[#090A0E] border border-[rgba(255,255,255,0.08)] hover:border-[#C5A880] text-left transition-all group"
              >
                <div className="text-xs font-semibold text-[#F4F4F6] group-hover:text-[#C5A880]">
                  Hoje & P1 Urgente
                </div>
                <div className="text-[11px] text-[#71717A] mt-1 font-mono">
                  Foco máximo do dia atual
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleOpenCreateFilter({
                    name: 'Sem Data & Sem Etiqueta',
                    color: '#7D8899',
                    criteria: {
                      period: 'no_date',
                      tagId: 'none',
                      status: 'open',
                    },
                  })
                }
                className="p-3 rounded-xl bg-[#090A0E] border border-[rgba(255,255,255,0.08)] hover:border-[#C5A880] text-left transition-all group"
              >
                <div className="text-xs font-semibold text-[#F4F4F6] group-hover:text-[#C5A880]">
                  Sem data & Sem etiqueta
                </div>
                <div className="text-[11px] text-[#71717A] mt-1 font-mono">
                  Tarefas soltas para triagem
                </div>
              </button>
            </div>
          </div>

          {/* Lista de Filtros Salvos Existentes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-[#A1A1AA] px-1">
              <span>Seus Filtros Salvos ({savedFilters.length})</span>
              <span>Abertas</span>
            </div>

            {loadingFilters ? (
              <div className="p-8 text-center text-xs font-mono text-[#71717A]">
                Carregando filtros salvos...
              </div>
            ) : savedFilters.length === 0 ? (
              <div className="bg-[#12141C] border border-[rgba(255,255,255,0.06)] rounded-2xl p-10 text-center">
                <SlidersHorizontal className="w-8 h-8 text-[#71717A] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-mono text-[#A1A1AA]">
                  Nenhum filtro salvo ainda. Crie sua primeira visão guiada acima!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {savedFilters.map((filter) => {
                  const filterCount = openCountByFilter.get(filter.id) || 0
                  const summary = formatCriteriaSummary(filter.criteria, tags, lists)

                  return (
                    <div
                      key={filter.id}
                      className="bg-[#12141C] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(197,168,128,0.35)] rounded-xl p-3.5 flex items-center justify-between transition-all group"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          params.set('filterId', filter.id)
                          setParams(params)
                        }}
                        className="flex-1 flex items-center gap-3 text-left min-w-0"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: filter.color || '#C5A880' }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#F4F4F6] group-hover:text-[#C5A880] transition-colors truncate">
                              {filter.name}
                            </span>
                            {filter.pinned && (
                              <Pin className="w-3 h-3 text-[#C5A880] flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-[#71717A] font-mono truncate mt-0.5">
                            {summary}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-3 pl-3 flex-shrink-0">
                        <span
                          className={`text-xs font-mono px-2 py-0.5 rounded ${
                            filterCount > 0
                              ? 'bg-[rgba(197,168,128,0.15)] text-[#C5A880] font-bold'
                              : 'text-[#71717A]'
                          }`}
                        >
                          {filterCount}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.06)] text-[#71717A] hover:text-[#F4F4F6] transition-colors"
                              title="Opções do filtro"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#12141C] border border-[rgba(197,168,128,0.2)] text-[#F4F4F6] min-w-[170px]"
                          >
                            <DropdownMenuItem
                              onClick={() => {
                                params.set('filterId', filter.id)
                                setParams(params)
                              }}
                              className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                            >
                              <ChevronRight className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                              <span>Abrir tarefas</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleToggleFilterPinned(filter)}
                              className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                            >
                              {filter.pinned ? (
                                <>
                                  <PinOff className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                                  <span>Desafixar dos Favoritos</span>
                                </>
                              ) : (
                                <>
                                  <Pin className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                                  <span>Fixar nos Favoritos</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleOpenEditFilter(filter)}
                              className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-2 text-[#A1A1AA]" />
                              <span>Editar critérios</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.08)]" />

                            <DropdownMenuItem
                              onClick={() => setDeletingFilter(filter)}
                              className="text-xs cursor-pointer text-[#B37D6B] focus:bg-[rgba(179,125,107,0.15)] focus:text-[#B37D6B]"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2 text-[#B37D6B]" />
                              <span>Excluir filtro</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: GERENCIAMENTO DE ETIQUETAS                              */}
      {/* ============================================================== */}
      {activeTab === 'etiquetas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#A1A1AA] px-1">
            <span>Vocabulário de Etiquetas ({tags.length})</span>
            <span>Tarefas abertas</span>
          </div>

          {tags.length === 0 ? (
            <div className="bg-[#12141C] border border-[rgba(255,255,255,0.06)] rounded-2xl p-10 text-center">
              <TagIcon className="w-8 h-8 text-[#71717A] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-mono text-[#A1A1AA]">
                Nenhuma etiqueta cadastrada ainda. Crie etiquetas para categorizar suas tarefas!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tags.map((tag) => {
                const count = openCountByTag.get(tag.id) || 0

                return (
                  <div
                    key={tag.id}
                    className="bg-[#12141C] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(197,168,128,0.35)] rounded-xl p-3.5 flex items-center justify-between transition-all group"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        params.set('tagId', tag.id)
                        setParams(params)
                      }}
                      className="flex-1 flex items-center gap-3 text-left min-w-0"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color || '#C5A880' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#F4F4F6] group-hover:text-[#C5A880] transition-colors truncate">
                            @{tag.name}
                          </span>
                          {tag.pinned && <Pin className="w-3 h-3 text-[#C5A880] flex-shrink-0" />}
                        </div>
                        <span className="text-[11px] text-[#71717A] font-mono">
                          {count} {count === 1 ? 'aberta' : 'abertas'}
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.06)] text-[#71717A] hover:text-[#F4F4F6] transition-colors"
                            title="Opções da etiqueta"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#12141C] border border-[rgba(197,168,128,0.2)] text-[#F4F4F6] min-w-[170px]"
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              params.set('tagId', tag.id)
                              setParams(params)
                            }}
                            className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                          >
                            <ChevronRight className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                            <span>Ver tarefas (@{tag.name})</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleToggleTagPinned(tag)}
                            className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                          >
                            {tag.pinned ? (
                              <>
                                <PinOff className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                                <span>Desafixar dos Favoritos</span>
                              </>
                            ) : (
                              <>
                                <Pin className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                                <span>Fixar nos Favoritos</span>
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleOpenEditTag(tag)}
                            className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-2 text-[#A1A1AA]" />
                            <span>Renomear / Trocar Cor</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setMergingTag(tag)
                              const other = tags.find((t) => t.id !== tag.id)
                              setMergeTargetTagId(other ? other.id : '')
                            }}
                            className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                          >
                            <GitMerge className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                            <span>Mesclar com outra etiqueta...</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.08)]" />

                          <DropdownMenuItem
                            onClick={() => setDeletingTag(tag)}
                            className="text-xs cursor-pointer text-[#B37D6B] focus:bg-[rgba(179,125,107,0.15)] focus:text-[#B37D6B]"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2 text-[#B37D6B]" />
                            <span>Excluir etiqueta</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CRIAR / EDITAR ETIQUETA                                */}
      {/* ============================================================== */}
      <Dialog open={!!tagModalMode} onOpenChange={(open) => !open && setTagModalMode(null)}>
        <DialogContent className="bg-[#12141C] border border-[rgba(197,168,128,0.25)] text-[#F4F4F6] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Clash_Display'] text-lg font-semibold text-[#F4F4F6]">
              {tagModalMode === 'create' ? 'Nova Etiqueta' : 'Editar Etiqueta'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#A1A1AA]">
              Etiquetas organizam o contexto da tarefa (ex.: trabalho, saúde, pessoal).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1">
                Nome da Etiqueta
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-[#71717A] font-mono">@</span>
                <input
                  type="text"
                  value={tagNameInput}
                  onChange={(e) => setTagNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSaveTag()
                    }
                  }}
                  autoFocus
                  placeholder="foco, urgente, casa"
                  className="w-full bg-[#090A0E] border border-[rgba(255,255,255,0.1)] rounded-lg pl-7 pr-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                Cor de Destaque
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {TAG_PALETTE.map((pal) => (
                  <button
                    key={pal.color}
                    type="button"
                    onClick={() => setTagColorInput(pal.color)}
                    style={{ backgroundColor: pal.color }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      tagColorInput === pal.color
                        ? 'ring-2 ring-white scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    title={pal.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setTagModalMode(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveTag}
              disabled={!tagNameInput.trim()}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#C5A880] text-[#090A0E] hover:bg-[#D4B991] transition-all disabled:opacity-50"
            >
              Salvar Etiqueta
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL: EXCLUIR ETIQUETA (COM CONFIRMAÇÃO E REGRAS CLARAS)      */}
      {/* ============================================================== */}
      <Dialog open={!!deletingTag} onOpenChange={(open) => !open && setDeletingTag(null)}>
        <DialogContent className="bg-[#12141C] border border-[rgba(179,125,107,0.35)] text-[#F4F4F6] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Clash_Display'] text-lg font-semibold text-[#B37D6B] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#B37D6B]" />
              Excluir Etiqueta @{deletingTag?.name}?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#A1A1AA] leading-relaxed pt-2">
              Esta ação excluirá permanentemente a etiqueta.
              <strong className="block text-[#F4F4F6] mt-1.5">
                Suas tarefas NÃO serão apagadas:
              </strong>
              a referência à etiqueta @{deletingTag?.name} será removida de todas as tarefas
              existentes de forma segura.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <button
              type="button"
              onClick={() => setDeletingTag(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteTag}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#B37D6B] text-[#090A0E] hover:bg-[#C88E7C] transition-all"
            >
              Confirmar Exclusão
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL: MESCLAR ETIQUETAS (TRANSFERÊNCIA DE TAREFAS)             */}
      {/* ============================================================== */}
      <Dialog open={!!mergingTag} onOpenChange={(open) => !open && setMergingTag(null)}>
        <DialogContent className="bg-[#12141C] border border-[rgba(197,168,128,0.35)] text-[#F4F4F6] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Clash_Display'] text-lg font-semibold text-[#F4F4F6] flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-[#C5A880]" />
              Mesclar Etiqueta @{mergingTag?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#A1A1AA] leading-relaxed pt-1">
              Transfere todas as tarefas de @{mergingTag?.name} para outra etiqueta existente e
              remove @{mergingTag?.name} ao finalizar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block">
              Mover tarefas para a etiqueta de destino:
            </label>
            <select
              value={mergeTargetTagId}
              onChange={(e) => setMergeTargetTagId(e.target.value)}
              className="w-full bg-[#090A0E] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
            >
              <option value="" disabled>
                Selecione a etiqueta destino...
              </option>
              {tags
                .filter((t) => t.id !== mergingTag?.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    @{t.name}
                  </option>
                ))}
            </select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <button
              type="button"
              onClick={() => setMergingTag(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmMergeTags}
              disabled={!mergeTargetTagId}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#C5A880] text-[#090A0E] hover:bg-[#D4B991] transition-all disabled:opacity-50"
            >
              Mesclar Tarefas
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL: CRIAR / EDITAR FILTRO SALVO COM COMBINAÇÕES GUIADAS     */}
      {/* ============================================================== */}
      <Dialog open={!!filterModalMode} onOpenChange={(open) => !open && setFilterModalMode(null)}>
        <DialogContent className="bg-[#12141C] border border-[rgba(197,168,128,0.25)] text-[#F4F4F6] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Clash_Display'] text-lg font-semibold text-[#F4F4F6]">
              {filterModalMode === 'create' ? 'Novo Filtro Salvo' : 'Editar Filtro Salvo'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#A1A1AA]">
              Configure critérios guiados (período, prioridade, etiqueta, projeto e status) para
              salvar como visão customizada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nome do Filtro */}
            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1">
                Nome do Filtro
              </label>
              <input
                type="text"
                value={filterNameInput}
                onChange={(e) => setFilterNameInput(e.target.value)}
                placeholder="Ex.: Hoje & P1, Atrasadas Críticas, Triagem"
                autoFocus
                className="w-full bg-[#090A0E] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Cor de Destaque */}
            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                Cor de Destaque
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {TAG_PALETTE.map((pal) => (
                  <button
                    key={pal.color}
                    type="button"
                    onClick={() => setFilterColorInput(pal.color)}
                    style={{ backgroundColor: pal.color }}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      filterColorInput === pal.color
                        ? 'ring-2 ring-white scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    title={pal.name}
                  />
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090A0E] border border-[rgba(255,255,255,0.06)] space-y-3.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#C5A880] block">
                Critérios Guiados de Filtragem
              </span>

              {/* 1. Período */}
              <div>
                <label className="text-xs text-[#A1A1AA] block mb-1 font-mono">
                  1. Período da Tarefa
                </label>
                <select
                  value={criteriaPeriod}
                  onChange={(e) => setCriteriaPeriod(e.target.value as FilterPeriod)}
                  className="w-full bg-[#12141C] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-xs text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="any">Qualquer período</option>
                  <option value="today">Hoje</option>
                  <option value="tomorrow">Amanhã</option>
                  <option value="this_week">Esta semana (próximos 7 dias)</option>
                  <option value="overdue">Atrasadas (vencidas)</option>
                  <option value="no_date">Sem data de vencimento (Inbox)</option>
                </select>
              </div>

              {/* 2. Prioridade */}
              <div>
                <label className="text-xs text-[#A1A1AA] block mb-1 font-mono">2. Prioridade</label>
                <select
                  value={criteriaPriority}
                  onChange={(e) => {
                    const val = e.target.value
                    setCriteriaPriority(val === 'any' ? 'any' : (Number(val) as FilterPriority))
                  }}
                  className="w-full bg-[#12141C] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-xs text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="any">Qualquer prioridade</option>
                  <option value="1">P1 · Urgente (Champagne Ouro)</option>
                  <option value="2">P2 · Alta (Champagne Claro)</option>
                  <option value="3">P3 · Média (Titânio)</option>
                  <option value="4">P4 · Baixa (Grafite)</option>
                  <option value="0">Sem prioridade definida</option>
                </select>
              </div>

              {/* 3. Etiqueta */}
              <div>
                <label className="text-xs text-[#A1A1AA] block mb-1 font-mono">3. Etiqueta</label>
                <select
                  value={criteriaTagId}
                  onChange={(e) => setCriteriaTagId(e.target.value)}
                  className="w-full bg-[#12141C] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-xs text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="any">Qualquer etiqueta (ou sem)</option>
                  <option value="none">Apenas tarefas SEM etiqueta</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      Apenas @{t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Projeto */}
              <div>
                <label className="text-xs text-[#A1A1AA] block mb-1 font-mono">4. Projeto</label>
                <select
                  value={criteriaProjectId}
                  onChange={(e) => setCriteriaProjectId(e.target.value)}
                  className="w-full bg-[#12141C] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-xs text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="any">Qualquer projeto (ou sem)</option>
                  <option value="none">Apenas tarefas SEM projeto</option>
                  {lists
                    .filter((l) => !l.archived)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        Apenas #{l.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* 5. Estado */}
              <div>
                <label className="text-xs text-[#A1A1AA] block mb-1 font-mono">
                  5. Estado da Tarefa
                </label>
                <select
                  value={criteriaStatus}
                  onChange={(e) => setCriteriaStatus(e.target.value as FilterStatus)}
                  className="w-full bg-[#12141C] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-xs text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="open">Apenas tarefas abertas (padrão)</option>
                  <option value="done">Apenas tarefas concluídas</option>
                  <option value="any">Abertas e concluídas</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setFilterModalMode(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveFilter}
              disabled={!filterNameInput.trim()}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#C5A880] text-[#090A0E] hover:bg-[#D4B991] transition-all disabled:opacity-50"
            >
              Salvar Filtro
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL: EXCLUIR FILTRO SALVO                                    */}
      {/* ============================================================== */}
      <Dialog open={!!deletingFilter} onOpenChange={(open) => !open && setDeletingFilter(null)}>
        <DialogContent className="bg-[#12141C] border border-[rgba(179,125,107,0.35)] text-[#F4F4F6] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Clash_Display'] text-lg font-semibold text-[#B37D6B] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#B37D6B]" />
              Excluir Filtro Salvo?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#A1A1AA] leading-relaxed pt-2">
              Tem certeza de que deseja excluir o filtro "{deletingFilter?.name}"?
              <span className="block text-[#F4F4F6] mt-1">
                Suas tarefas NÃO serão afetadas; apenas a visualização salva será removida.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <button
              type="button"
              onClick={() => setDeletingFilter(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteFilter}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#B37D6B] text-[#090A0E] hover:bg-[#C88E7C] transition-all"
            >
              Confirmar Exclusão
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
