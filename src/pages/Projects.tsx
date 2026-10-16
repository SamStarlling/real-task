import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  ChevronRight,
  ExternalLink,
  FolderPlus,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Folder,
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
import { useAuth } from '@/contexts/AuthContext'
import {
  createProject,
  deleteProject,
  TAG_PALETTE,
  toggleProjectArchived,
  toggleProjectFavorite,
  updateProject,
} from '@/services/data'
import type { ListRecord, TaskRecord } from '@/types'
import { toast } from '@/hooks/use-toast'

interface ProjectsPageProps {
  tasks: TaskRecord[]
  lists: ListRecord[]
  refresh: () => void
}

export function ProjectsPage({ tasks, lists, refresh }: ProjectsPageProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  // Estados de modal de criação/edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ListRecord | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectColor, setProjectColor] = useState('#C5A880')
  const [projectGoal, setProjectGoal] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectParent, setProjectParent] = useState('')
  const [projectFavorite, setProjectFavorite] = useState(false)

  // Estado de confirmação de exclusão
  const [projectToDelete, setProjectToDelete] = useState<ListRecord | null>(null)

  // Estatísticas de tarefas por projeto (calculadas em tempo real)
  const statsByProject = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number
        done: number
        open: number
        progress: number
        estimatedMinutes: number
        actualMinutes: number
      }
    >()

    for (const l of lists) {
      map.set(l.id, {
        total: 0,
        done: 0,
        open: 0,
        progress: 0,
        estimatedMinutes: 0,
        actualMinutes: 0,
      })
    }

    for (const t of tasks) {
      if (t.list && map.has(t.list)) {
        const curr = map.get(t.list)!
        curr.total += 1
        if (t.done) {
          curr.done += 1
        } else {
          curr.open += 1
        }
        curr.estimatedMinutes += Number(t.estimated_minutes) || 0
        curr.actualMinutes += Number(t.actual_minutes) || 0
      }
    }

    for (const [, stat] of map.entries()) {
      stat.progress = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0
    }

    return map
  }, [lists, tasks])

  // Filtragem e separação hierárquica (Projetos Pai vs Sub-projetos)
  const filteredProjects = useMemo(() => {
    return lists.filter((p) => {
      // Toggle de arquivados
      const isArchived = !!p.archived
      if (showArchived !== isArchived) return false

      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.goal && p.goal.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      )
    })
  }, [lists, showArchived, search])

  // Agrupamento hierárquico (pais no topo, filhos aninhados)
  const hierarchicalProjects = useMemo(() => {
    const rootProjects = filteredProjects.filter((p) => !p.parent)
    const childProjects = filteredProjects.filter((p) => !!p.parent)

    const listWithChildren: Array<{
      project: ListRecord
      isChild: boolean
      children: ListRecord[]
    }> = []

    // Adiciona raízes com seus filhos
    for (const root of rootProjects) {
      const kids = childProjects.filter((c) => c.parent === root.id)
      listWithChildren.push({
        project: root,
        isChild: false,
        children: kids,
      })
    }

    // Se houver algum projeto filho cujo pai foi filtrado pela busca, exibe isolado
    const handledKids = new Set(listWithChildren.flatMap((x) => x.children.map((c) => c.id)))
    for (const child of childProjects) {
      if (!handledKids.has(child.id)) {
        listWithChildren.push({
          project: child,
          isChild: true,
          children: [],
        })
      }
    }

    // Ordenação: Favoritos primeiro, depois pinned, depois order
    return listWithChildren.sort((a, b) => {
      if (!!a.project.favorite !== !!b.project.favorite) {
        return a.project.favorite ? -1 : 1
      }
      if (!!a.project.pinned !== !!b.project.pinned) {
        return a.project.pinned ? -1 : 1
      }
      const orderA = a.project.order || 999999
      const orderB = b.project.order || 999999
      if (orderA !== orderB) return orderA - orderB
      return a.project.name.localeCompare(b.project.name, 'pt-BR')
    })
  }, [filteredProjects])

  const openCreateModal = () => {
    setEditingProject(null)
    setProjectName('')
    setProjectColor('#C5A880')
    setProjectGoal('')
    setProjectDescription('')
    setProjectParent('')
    setProjectFavorite(false)
    setIsModalOpen(true)
  }

  const openEditModal = (p: ListRecord) => {
    setEditingProject(p)
    setProjectName(p.name)
    setProjectColor(p.color || '#C5A880')
    setProjectGoal(p.goal || '')
    setProjectDescription(p.description || '')
    setProjectParent(p.parent || '')
    setProjectFavorite(!!p.favorite)
    setIsModalOpen(true)
  }

  const handleSaveProject = async () => {
    const trimmed = projectName.trim()
    if (!trimmed) {
      toast({ title: 'Informe o nome do projeto.', variant: 'destructive' })
      return
    }
    if (!user) return

    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: trimmed,
          color: projectColor,
          goal: projectGoal.trim(),
          description: projectDescription.trim(),
          parent: projectParent || '',
          favorite: projectFavorite,
        })
        toast({ title: `Projeto "${trimmed}" atualizado!` })
      } else {
        await createProject(trimmed, user.id, {
          color: projectColor,
          goal: projectGoal.trim(),
          description: projectDescription.trim(),
          parent: projectParent || '',
          favorite: projectFavorite,
        })
        toast({ title: `Projeto "${trimmed}" criado com sucesso!` })
      }
      setIsModalOpen(false)
      refresh()
    } catch (err) {
      console.error('Erro ao salvar projeto:', err)
      toast({
        title: 'Não foi possível salvar o projeto. Verifique o nome.',
        variant: 'destructive',
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return
    try {
      await deleteProject(projectToDelete.id)
      toast({
        title: `Projeto "${projectToDelete.name}" excluído.`,
        description: 'Tarefas vinculadas foram movidas para a Inbox.',
      })
      setProjectToDelete(null)
      refresh()
    } catch (err) {
      console.error('Erro ao excluir projeto:', err)
      toast({ title: 'Erro ao excluir projeto.', variant: 'destructive' })
    }
  }

  const handleToggleFavorite = async (p: ListRecord) => {
    try {
      await toggleProjectFavorite(p.id, !!p.favorite)
      refresh()
    } catch (err) {
      console.error('Erro ao alternar favorito:', err)
    }
  }

  const handleToggleArchived = async (p: ListRecord) => {
    try {
      await toggleProjectArchived(p.id, !!p.archived)
      toast({
        title: p.archived ? `Projeto "${p.name}" desarquivado!` : `Projeto "${p.name}" arquivado.`,
      })
      refresh()
    } catch (err) {
      console.error('Erro ao alternar arquivamento:', err)
    }
  }

  // Lista de projetos candidatos a "Pai" (exclui o próprio projeto em edição)
  const parentCandidates = lists.filter((l) => !editingProject || l.id !== editingProject.id)

  const totalArchivedCount = lists.filter((l) => l.archived).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full animate-fade-in text-[#F4F4F6]">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[rgba(255,255,255,0.07)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-widest text-[#C5A880] uppercase">
              Todoist Architecture · Barbosa System
            </span>
            {showArchived && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(197,168,128,0.12)] text-[#C5A880] border border-[rgba(197,168,128,0.25)]">
                ARQUIVADOS
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F4F4F6] tracking-tight">
            Meus Projetos
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-0.5">
            Gerencie seus ciclos de 12 semanas, rotinas recorrentes e metas com objetivos
            mensuráveis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-medium border transition-colors flex items-center gap-1.5 ${
              showArchived
                ? 'bg-[#C5A880] text-[#090A0E] border-[#C5A880]'
                : 'bg-[#12131A] text-[#A1A1AA] border-[rgba(255,255,255,0.08)] hover:text-[#F4F4F6] hover:border-[rgba(255,255,255,0.15)]'
            }`}
          >
            {showArchived ? (
              <ArchiveRestore className="w-3.5 h-3.5" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
            <span>{showArchived ? 'Ver Ativos' : `Arquivados (${totalArchivedCount})`}</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase bg-[#C5A880] hover:bg-[#D4B991] text-[#090A0E] transition-all flex items-center gap-1.5 shadow-[0_2px_12px_rgba(197,168,128,0.25)]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Projeto</span>
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="mt-6 mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, objetivo ou obsidian..."
            className="w-full bg-[#12131A] border border-[rgba(255,255,255,0.08)] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F4F4F6] placeholder-[#71717A] focus:outline-none focus:border-[#C5A880] transition-colors"
          />
        </div>

        <div className="text-xs font-mono text-[#71717A] flex items-center gap-2 self-end sm:self-auto">
          <span>{filteredProjects.length} projeto(s) listado(s)</span>
        </div>
      </div>

      {/* LISTA DE PROJETOS */}
      {hierarchicalProjects.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#12131A] border border-[rgba(255,255,255,0.06)] flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[rgba(197,168,128,0.1)] border border-[rgba(197,168,128,0.2)] flex items-center justify-center mb-3">
            <Folder className="w-6 h-6 text-[#C5A880]" />
          </div>
          <h3 className="text-base font-semibold text-[#F4F4F6]">
            {search
              ? 'Nenhum projeto encontrado para esta busca.'
              : showArchived
                ? 'Nenhum projeto arquivado.'
                : 'Nenhum projeto cadastrado ainda.'}
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-1 max-w-md">
            {search
              ? 'Tente outros termos ou limpe a busca.'
              : 'Organize seu trabalho em Ciclos de 12 Semanas ou Projetos de Rotinas Recorrentes com objetivos mensuráveis.'}
          </p>
          {!showArchived && !search && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase bg-[#C5A880] text-[#090A0E] hover:bg-[#D4B991] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Adicionar Primeiro Projeto</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {hierarchicalProjects.map(({ project, isChild, children }) => {
            const stat = statsByProject.get(project.id) || {
              total: 0,
              done: 0,
              open: 0,
              progress: 0,
              estimatedMinutes: 0,
              actualMinutes: 0,
            }

            return (
              <div key={project.id} className="space-y-2">
                {/* CARD PROJETO PAI OU ISOLADO */}
                <div
                  className={`group relative bg-[#12131A] hover:bg-[#161822] border transition-all rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    project.favorite
                      ? 'border-[rgba(197,168,128,0.35)] shadow-[0_2px_14px_rgba(197,168,128,0.06)]'
                      : 'border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)]'
                  } ${isChild ? 'ml-6 sm:ml-8 border-l-2 border-l-[#C5A880]' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: project.color || '#C5A880' }}
                      />

                      <Link
                        to={`/projetos/${project.id}`}
                        className="text-base sm:text-lg font-bold text-[#F4F4F6] hover:text-[#C5A880] transition-colors flex items-center gap-1.5"
                      >
                        <span>{project.name}</span>
                        <ChevronRight className="w-4 h-4 text-[#71717A] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>

                      {project.favorite && (
                        <span title="Favorito" className="text-[#C5A880] flex items-center">
                          <Star className="w-3.5 h-3.5 fill-[#C5A880]" />
                        </span>
                      )}

                      {children.length > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[#A1A1AA] border border-[rgba(255,255,255,0.08)]">
                          {children.length} sub-projeto(s)
                        </span>
                      )}

                      {project.archived && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(161,161,170,0.15)] text-[#A1A1AA] border border-[rgba(161,161,170,0.3)]">
                          Arquivado
                        </span>
                      )}
                    </div>

                    {/* OBJETIVO DO PROJETO EM DESTAQUE */}
                    {project.goal && (
                      <div className="mt-2 text-xs text-[#E4E4E7] flex items-center gap-1.5">
                        <span className="text-[10px] font-mono tracking-wider uppercase text-[#C5A880] font-bold px-1.5 py-0.5 rounded bg-[rgba(197,168,128,0.1)] border border-[rgba(197,168,128,0.2)]">
                          OBJETIVO
                        </span>
                        <span className="line-clamp-1 italic font-serif">"{project.goal}"</span>
                      </div>
                    )}

                    {/* DESCRIÇÃO / OBSIDIAN */}
                    {project.description && (
                      <div className="mt-1.5 text-xs text-[#71717A] line-clamp-1 flex items-center gap-1">
                        <span>{project.description}</span>
                      </div>
                    )}
                  </div>

                  {/* ESTATÍSTICAS E BARRA DE PROGRESSO */}
                  <div className="flex flex-col sm:items-end gap-2 sm:min-w-[240px]">
                    <div className="flex items-center gap-4 text-xs font-mono text-[#A1A1AA]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#F4F4F6] font-bold">{stat.open}</span>
                        <span className="text-[#71717A]">abertas</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#8F9E82] font-bold">{stat.done}</span>
                        <span className="text-[#71717A]">concluídas</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#C5A880] font-bold">
                        <span>{stat.progress}%</span>
                      </div>
                    </div>

                    {/* BARRA DE PROGRESSO */}
                    <div className="w-full bg-[rgba(255,255,255,0.06)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#C5A880] h-full transition-all duration-300 rounded-full"
                        style={{ width: `${stat.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* MENU DE AÇÕES */}
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(project)}
                      className={`p-2 rounded-lg transition-colors ${
                        project.favorite
                          ? 'text-[#C5A880] hover:bg-[rgba(197,168,128,0.15)]'
                          : 'text-[#71717A] hover:text-[#F4F4F6] hover:bg-[rgba(255,255,255,0.06)]'
                      }`}
                      title={project.favorite ? 'Remover dos favoritos' : 'Favoritar projeto'}
                    >
                      <Star className={`w-4 h-4 ${project.favorite ? 'fill-[#C5A880]' : ''}`} />
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="p-2 rounded-lg text-[#71717A] hover:text-[#F4F4F6] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                          title="Opções do projeto"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-[#12131A] border-[rgba(255,255,255,0.1)] text-[#F4F4F6]"
                      >
                        <DropdownMenuItem
                          onClick={() => navigate(`/projetos/${project.id}`)}
                          className="cursor-pointer hover:bg-[rgba(255,255,255,0.06)]"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                          Abrir projeto
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditModal(project)}
                          className="cursor-pointer hover:bg-[rgba(255,255,255,0.06)]"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-2 text-[#A1A1AA]" />
                          Editar detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleArchived(project)}
                          className="cursor-pointer hover:bg-[rgba(255,255,255,0.06)]"
                        >
                          {project.archived ? (
                            <>
                              <ArchiveRestore className="w-3.5 h-3.5 mr-2 text-[#8F9E82]" />
                              Desarquivar
                            </>
                          ) : (
                            <>
                              <Archive className="w-3.5 h-3.5 mr-2 text-[#A1A1AA]" />
                              Arquivar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.08)]" />
                        <DropdownMenuItem
                          onClick={() => setProjectToDelete(project)}
                          className="cursor-pointer text-[#E57373] hover:bg-[rgba(229,115,115,0.1)] hover:text-[#E57373]"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Excluir projeto
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* FILHOS / SUB-PROJETOS ANINHADOS */}
                {children.map((child) => {
                  const childStat = statsByProject.get(child.id) || {
                    total: 0,
                    done: 0,
                    open: 0,
                    progress: 0,
                    estimatedMinutes: 0,
                    actualMinutes: 0,
                  }

                  return (
                    <div
                      key={child.id}
                      className="group relative ml-6 sm:ml-10 bg-[#0F1016] hover:bg-[#151620] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.12)] border-l-2 border-l-[#C5A880] transition-all rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: child.color || '#C5A880' }}
                          />
                          <Link
                            to={`/projetos/${child.id}`}
                            className="text-sm sm:text-base font-semibold text-[#F4F4F6] hover:text-[#C5A880] transition-colors"
                          >
                            {child.name}
                          </Link>
                          <span className="text-[10px] font-mono text-[#71717A]">sub-projeto</span>
                          {child.favorite && (
                            <Star className="w-3 h-3 text-[#C5A880] fill-[#C5A880]" />
                          )}
                        </div>
                        {child.goal && (
                          <div className="mt-1 text-xs text-[#A1A1AA] italic">"{child.goal}"</div>
                        )}
                      </div>

                      <div className="flex flex-col sm:items-end gap-1.5 sm:min-w-[200px]">
                        <div className="flex items-center gap-3 text-xs font-mono text-[#71717A]">
                          <span>
                            <b className="text-[#F4F4F6]">{childStat.open}</b> abertas
                          </span>
                          <span>
                            <b className="text-[#8F9E82]">{childStat.done}</b> feitas
                          </span>
                          <span className="text-[#C5A880] font-bold">{childStat.progress}%</span>
                        </div>
                        <div className="w-full bg-[rgba(255,255,255,0.05)] h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-[#C5A880] h-full transition-all duration-300 rounded-full"
                            style={{ width: `${childStat.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-[#71717A] hover:text-[#F4F4F6] hover:bg-[rgba(255,255,255,0.06)]"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44 bg-[#12131A] border-[rgba(255,255,255,0.1)] text-[#F4F4F6]"
                          >
                            <DropdownMenuItem onClick={() => navigate(`/projetos/${child.id}`)}>
                              <ExternalLink className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                              Abrir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(child)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setProjectToDelete(child)}>
                              <Trash2 className="w-3.5 h-3.5 mr-2 text-[#E57373]" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL CRIAR / EDITAR PROJETO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#090A0E] border-[rgba(255,255,255,0.12)] text-[#F4F4F6] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-bold text-[#F4F4F6]">
              {editingProject ? 'Editar Projeto' : 'Adicionar Projeto'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#A1A1AA]">
              Configure o nome, objetivo mensurável e vínculos do projeto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                Nome do Projeto *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ex.: Ciclo 12 Semanas · Q2 ou Recorrentes"
                className="w-full bg-[#12131A] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* PALETA DE COR */}
            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                Cor de Identificação
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {TAG_PALETTE.map((pal) => (
                  <button
                    key={pal.color}
                    type="button"
                    onClick={() => setProjectColor(pal.color)}
                    style={{ backgroundColor: pal.color }}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      projectColor === pal.color
                        ? 'ring-2 ring-white scale-110 shadow-sm'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    title={pal.name}
                  />
                ))}
              </div>
            </div>

            {/* OBJETIVO MENSURÁVEL */}
            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                Objetivo do Projeto (Opcional)
              </label>
              <input
                type="text"
                value={projectGoal}
                onChange={(e) => setProjectGoal(e.target.value)}
                placeholder="Ex.: Faturar R$10k em 12 semanas ou Treinar 4x/semana"
                className="w-full bg-[#12131A] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
              />
              <p className="text-[11px] text-[#71717A] mt-1">
                A meta mensurável definida antes de iniciar o ciclo.
              </p>
            </div>

            {/* DESCRIÇÃO / LINK OBSIDIAN */}
            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                Descrição ou Link Obsidian (Opcional)
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Ex.: obsidian://open?vault=SegundoCerebro&file=Projetos%2FCicloQ2"
                rows={2}
                className="w-full bg-[#12131A] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880] resize-none"
              />
            </div>

            {/* PROJETO PAI (SUB-PROJETO) */}
            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                Projeto-Pai (Para Sub-Projetos)
              </label>
              <select
                value={projectParent}
                onChange={(e) => setProjectParent(e.target.value)}
                className="w-full bg-[#12131A] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
              >
                <option value="">Nenhum (Projeto Principal)</option>
                {parentCandidates.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </div>

            {/* CHECKBOX FAVORITO */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="modalProjectFavorite"
                checked={projectFavorite}
                onChange={(e) => setProjectFavorite(e.target.checked)}
                className="rounded border-[rgba(255,255,255,0.2)] bg-[#12131A] text-[#C5A880] focus:ring-[#C5A880]"
              />
              <label
                htmlFor="modalProjectFavorite"
                className="text-xs text-[#E4E4E7] cursor-pointer"
              >
                Destacar como Projeto Favorito (Fixado no topo da sidebar e na lista)
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.06)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveProject}
              className="px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase bg-[#C5A880] text-[#090A0E] hover:bg-[#D4B991] transition-all"
            >
              {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO */}
      <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <DialogContent className="bg-[#090A0E] border-[rgba(255,255,255,0.12)] text-[#F4F4F6] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-bold text-[#E57373] flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Excluir Projeto
            </DialogTitle>
            <DialogDescription className="text-xs text-[#A1A1AA] space-y-2 pt-2">
              <p>
                Tem certeza que deseja excluir o projeto{' '}
                <b className="text-[#F4F4F6]">"{projectToDelete?.name}"</b>?
              </p>
              <p className="text-[#E4E4E7] bg-[rgba(229,115,115,0.08)] p-2.5 rounded border border-[rgba(229,115,115,0.2)]">
                <b>Política de segurança:</b> Nenhuma tarefa será perdida. As tarefas vinculadas a
                este projeto perderão a associação e voltarão imediatamente para sua <b>Inbox</b>.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <button
              type="button"
              onClick={() => setProjectToDelete(null)}
              className="px-4 py-2 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6] border border-[rgba(255,255,255,0.1)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase bg-[#E57373] text-white hover:bg-[#EF5350] transition-all"
            >
              Excluir Projeto
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
