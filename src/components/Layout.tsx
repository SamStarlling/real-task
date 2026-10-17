import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Archive,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Edit2,
  FolderKanban,
  GripVertical,
  Inbox,
  LogOut,
  Menu,
  MoreHorizontal,
  Pin,
  PinOff,
  Plus,
  SlidersHorizontal,
  Star,
  StarOff,
  Sun,
  Tag as TagIcon,
  Timer,
  X,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Brand } from '@/components/Brand'
import { CaptureModal } from '@/components/CaptureModal'
import { PomodoroWidget } from '@/components/PomodoroWidget'
import { useAuth } from '@/contexts/AuthContext'
import type { ListRecord, SavedFilterRecord, TagRecord, TaskRecord } from '@/types'
import { localDay } from '@/lib/date-parser'
import { pbDay } from '@/lib/format'
import { isTokenNearExpiry, refreshAuthSession } from '@/lib/pocketbase/auth-session'
import {
  getSavedFilters,
  reorderLists,
  reorderTags,
  sortPrioritizedItems,
  taskMatchesFilterCriteria,
  toggleProjectArchived,
  toggleProjectFavorite,
  toggleSavedFilterPinned,
  toggleTagPinned,
  updateProject,
  TAG_PALETTE,
} from '@/services/data'

// As 4 visões fixas no topo ao estilo Todoist (Nova ordem: Inbox → Hoje → Amanhã → Semana)
const todoistViews = [
  { to: '/?view=inbox', label: 'Inbox', icon: Inbox },
  { to: '/', label: 'Hoje', icon: Sun },
  { to: '/?view=amanha', label: 'Amanhã', icon: ArrowRight },
  { to: '/semana', label: 'Semana', icon: CalendarDays },
] as const

// Links utilitários complementares (Pomodoro e Histórico)
const utilityNavLinks = [
  ['/pomodoro', 'Pomodoro', Timer],
  ['/historico', 'Histórico', Clock3],
] as const

const mobileBottomNavLinks = [
  ['/', 'Hoje', Sun],
  ['/?view=amanha', 'Amanhã', ArrowRight],
  ['/semana', 'Semana', CalendarDays],
  ['/projetos', 'Projetos', FolderKanban],
  ['/pomodoro', 'Pomodoro', Timer],
  ['/historico', 'Histórico', Clock3],
] as const
export function Layout({
  tasks,
  tags = [],
  lists = [],
  savedFilters = [],
  refresh,
}: {
  tasks: TaskRecord[]
  tags?: TagRecord[]
  lists?: ListRecord[]
  savedFilters?: SavedFilterRecord[]
  refresh: () => void
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const activeUrlTag = searchParams.get('tag')
  const activeUrlList = searchParams.get('list')
  const activeUrlFilter = searchParams.get('filterId')
  const isPomodoroPage = location.pathname === '/pomodoro'
  const today = localDay()
  const tomorrow = localDay(new Date(Date.now() + 86400000))
  const day6 = localDay(new Date(Date.now() + 6 * 86400000))

  // Estados colapsáveis das seções Todoist memorizados no localStorage
  const [viewsCollapsed, setViewsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('barbosa_sidebar_views_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [favoritesCollapsed, setFavoritesCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('barbosa_sidebar_favorites_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [projectsCollapsed, setProjectsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('barbosa_sidebar_projects_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [tagsCollapsed, setTagsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('barbosa_sidebar_tags_collapsed') === 'true'
    } catch {
      return false
    }
  })

  // Estado de expansão de projetos-pai com subprojetos
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('barbosa_sidebar_expanded_projects')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const toggleParentProject = (parentId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    setExpandedParents((prev) => {
      const next = { ...prev, [parentId]: !prev[parentId] }
      try {
        localStorage.setItem('barbosa_sidebar_expanded_projects', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const toggleViewsCollapse = () => {
    setViewsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('barbosa_sidebar_views_collapsed', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const toggleFavoritesCollapse = () => {
    setFavoritesCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('barbosa_sidebar_favorites_collapsed', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const toggleProjectsCollapse = () => {
    setProjectsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('barbosa_sidebar_projects_collapsed', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const toggleTagsCollapse = () => {
    setTagsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('barbosa_sidebar_tags_collapsed', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  // Contagem de tarefas abertas por etiqueta
  const openCountByTag = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      if (!t.done) {
        const tagIds = t.tags || []
        const expTagIds = t.expand?.tags?.map((x) => x.id) || []
        const unique = Array.from(new Set([...tagIds, ...expTagIds]))
        for (const tid of unique) {
          map.set(tid, (map.get(tid) || 0) + 1)
        }
      }
    }
    return map
  }, [tasks])

  // Contagem de tarefas abertas por lista
  const openCountByList = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      if (!t.done && t.list) {
        map.set(t.list, (map.get(t.list) || 0) + 1)
      }
    }
    return map
  }, [tasks])

  // Itens ordenados com suporte a estado otimista para drag-and-drop
  const sortedTags = useMemo(() => sortPrioritizedItems(tags), [tags])
  const sortedLists = useMemo(() => sortPrioritizedItems(lists), [lists])

  const [optimisticTags, setOptimisticTags] = useState<TagRecord[]>(sortedTags)
  const [optimisticLists, setOptimisticLists] = useState<ListRecord[]>(sortedLists)

  // Estado para modal rápido de renomeação de projeto na sidebar
  const [renamingProject, setRenamingProject] = useState<ListRecord | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameColor, setRenameColor] = useState('#C5A880')

  useEffect(() => {
    setOptimisticTags(sortedTags)
  }, [sortedTags])

  useEffect(() => {
    setOptimisticLists(sortedLists)
  }, [sortedLists])

  // Estados de Drag & Drop para Etiquetas
  const [draggingTagId, setDraggingTagId] = useState<string | null>(null)
  const [tagDropTarget, setTagDropTarget] = useState<{
    id: string
    position: 'before' | 'after'
  } | null>(null)
  const tagTouchStateRef = useRef<{ activeId: string | null; lastTouchY: number }>({
    activeId: null,
    lastTouchY: 0,
  })

  // Estados de Drag & Drop para Listas
  const [draggingListId, setDraggingListId] = useState<string | null>(null)
  const [listDropTarget, setListDropTarget] = useState<{
    id: string
    position: 'before' | 'after'
  } | null>(null)
  const listTouchStateRef = useRef<{ activeId: string | null; lastTouchY: number }>({
    activeId: null,
    lastTouchY: 0,
  })

  // Reordenação de etiquetas respeitando limites de prioridade (pinned vs non-pinned)
  const commitTagReorder = useCallback(
    async (fromId: string, toId: string, position: 'before' | 'after') => {
      if (fromId === toId) return
      const currentList = [...optimisticTags]
      const fromIndex = currentList.findIndex((t) => t.id === fromId)
      const toIndex = currentList.findIndex((t) => t.id === toId)
      if (fromIndex === -1 || toIndex === -1) return

      const sourceTag = currentList[fromIndex]
      const targetTag = currentList[toIndex]

      // Não permite arrastar tag não-pinned para cima dos pinned e vice-versa
      // para manter o modelo 80/20 estrito onde os pinned formam o grupo de topo
      if (!!sourceTag.pinned !== !!targetTag.pinned) {
        return
      }

      const [movedItem] = currentList.splice(fromIndex, 1)
      let targetInsertIndex = currentList.findIndex((t) => t.id === toId)
      if (position === 'after') {
        targetInsertIndex += 1
      }
      currentList.splice(targetInsertIndex, 0, movedItem)

      setOptimisticTags(currentList)
      try {
        await reorderTags(currentList)
        refresh()
      } catch (err) {
        console.error('Erro ao reordenar etiquetas na sidebar:', err)
        setOptimisticTags(sortedTags)
      }
    },
    [optimisticTags, sortedTags, refresh],
  )

  // Reordenação de listas respeitando limites de prioridade (pinned vs non-pinned)
  const commitListReorder = useCallback(
    async (fromId: string, toId: string, position: 'before' | 'after') => {
      if (fromId === toId) return
      const currentList = [...optimisticLists]
      const fromIndex = currentList.findIndex((l) => l.id === fromId)
      const toIndex = currentList.findIndex((l) => l.id === toId)
      if (fromIndex === -1 || toIndex === -1) return

      const sourceList = currentList[fromIndex]
      const targetList = currentList[toIndex]

      if (!!sourceList.pinned !== !!targetList.pinned) {
        return
      }

      const [movedItem] = currentList.splice(fromIndex, 1)
      let targetInsertIndex = currentList.findIndex((l) => l.id === toId)
      if (position === 'after') {
        targetInsertIndex += 1
      }
      currentList.splice(targetInsertIndex, 0, movedItem)

      setOptimisticLists(currentList)
      try {
        await reorderLists(currentList)
        refresh()
      } catch (err) {
        console.error('Erro ao reordenar listas na sidebar:', err)
        setOptimisticLists(sortedLists)
      }
    },
    [optimisticLists, sortedLists, refresh],
  )

  // Touch listener global para reordenação de etiquetas na sidebar
  useEffect(() => {
    if (!draggingTagId) return
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      tagTouchStateRef.current.lastTouchY = touch.clientY
      const elem = document.elementFromPoint(touch.clientX, touch.clientY)
      const item = elem?.closest<HTMLElement>('.sidebar-custom-item[data-tag-id]')
      if (item) {
        const targetId = item.getAttribute('data-tag-id')
        if (targetId && targetId !== draggingTagId) {
          const rect = item.getBoundingClientRect()
          const midY = rect.top + rect.height / 2
          const position = touch.clientY < midY ? 'before' : 'after'
          setTagDropTarget({ id: targetId, position })
        }
      }
    }

    const handleTouchEnd = async () => {
      const activeId = tagTouchStateRef.current.activeId
      const target = tagDropTarget
      tagTouchStateRef.current = { activeId: null, lastTouchY: 0 }
      setDraggingTagId(null)
      setTagDropTarget(null)

      if (activeId && target && activeId !== target.id) {
        await commitTagReorder(activeId, target.id, target.position)
      }
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)
    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [draggingTagId, tagDropTarget, commitTagReorder])

  // Touch listener global para reordenação de listas na sidebar
  useEffect(() => {
    if (!draggingListId) return
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      listTouchStateRef.current.lastTouchY = touch.clientY
      const elem = document.elementFromPoint(touch.clientX, touch.clientY)
      const item = elem?.closest<HTMLElement>('.sidebar-custom-item[data-list-id]')
      if (item) {
        const targetId = item.getAttribute('data-list-id')
        if (targetId && targetId !== draggingListId) {
          const rect = item.getBoundingClientRect()
          const midY = rect.top + rect.height / 2
          const position = touch.clientY < midY ? 'before' : 'after'
          setListDropTarget({ id: targetId, position })
        }
      }
    }

    const handleTouchEnd = async () => {
      const activeId = listTouchStateRef.current.activeId
      const target = listDropTarget
      listTouchStateRef.current = { activeId: null, lastTouchY: 0 }
      setDraggingListId(null)
      setListDropTarget(null)

      if (activeId && target && activeId !== target.id) {
        await commitListReorder(activeId, target.id, target.position)
      }
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)
    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [draggingListId, listDropTarget, commitListReorder])

  // Toggle do pin de etiqueta com atualização otimista
  const handleToggleTagPin = async (e: React.MouseEvent, tag: TagRecord) => {
    e.preventDefault()
    e.stopPropagation()
    const nextPinned = !tag.pinned
    setOptimisticTags((prev) =>
      sortPrioritizedItems(prev.map((t) => (t.id === tag.id ? { ...t, pinned: nextPinned } : t))),
    )
    try {
      await toggleTagPinned(tag.id, !!tag.pinned)
      refresh()
    } catch (err) {
      console.error('Erro ao alternar pin da etiqueta:', err)
      setOptimisticTags(sortedTags)
    }
  }

  // Toggle do favorito de projeto com atualização otimista
  const handleToggleProjectFavorite = async (e: React.MouseEvent, list: ListRecord) => {
    e.preventDefault()
    e.stopPropagation()
    const nextFavorite = !list.favorite
    setOptimisticLists((prev) =>
      prev.map((l) => (l.id === list.id ? { ...l, favorite: nextFavorite } : l)),
    )
    try {
      await toggleProjectFavorite(list.id, !!list.favorite)
      refresh()
    } catch (err) {
      console.error('Erro ao alternar favorito do projeto:', err)
      setOptimisticLists(sortedLists)
    }
  }

  // Toggle de arquivar projeto na sidebar
  const handleToggleProjectArchived = async (list: ListRecord) => {
    const nextArchived = !list.archived
    setOptimisticLists((prev) =>
      prev.map((l) => (l.id === list.id ? { ...l, archived: nextArchived } : l)),
    )
    try {
      await toggleProjectArchived(list.id, !!list.archived)
      refresh()
    } catch (err) {
      console.error('Erro ao arquivar/desarquivar projeto:', err)
      setOptimisticLists(sortedLists)
    }
  }

  // Salvar renomeação de projeto
  const handleSaveProjectRename = async () => {
    if (!renamingProject || !renameValue.trim()) return
    const id = renamingProject.id
    const name = renameValue.trim()
    const color = renameColor
    setRenamingProject(null)
    setOptimisticLists((prev) => prev.map((l) => (l.id === id ? { ...l, name, color } : l)))
    try {
      await updateProject(id, { name, color })
      refresh()
    } catch (err) {
      console.error('Erro ao renomear projeto:', err)
      setOptimisticLists(sortedLists)
    }
  }

  const count = (label: string) =>
    tasks.filter(
      (t) =>
        !t.done &&
        (label === 'Hoje'
          ? pbDay(t.due_date) <= today && !!t.due_date
          : label === 'Amanhã'
            ? pbDay(t.due_date) === tomorrow
            : label === 'Semana'
              ? !!t.due_date && pbDay(t.due_date) >= today && pbDay(t.due_date) <= day6
              : label === 'Inbox'
                ? !t.due_date
                : label === 'Projetos'
                  ? !!t.list
                  : false),
    ).length

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileCaptureOpen, setMobileCaptureOpen] = useState(false)
  const [captureModalOpen, setCaptureModalOpen] = useState(false)

  // Atalho global de teclado: tecla C abre o modal de captura em qualquer tela
  // Ignora quando foco estiver em input, textarea, select ou elemento com contenteditable
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Se pressionou 'c' ou 'C'
      if (e.key === 'c' || e.key === 'C') {
        // Ignora se modificadores como Ctrl/Cmd/Alt estiverem pressionados
        if (e.ctrlKey || e.metaKey || e.altKey) return

        const activeEl = document.activeElement
        const tagName = activeEl?.tagName.toLowerCase()
        const isEditable =
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          activeEl?.getAttribute('contenteditable') === 'true'

        // Se houver algum input focado, não intercepta a digitação
        if (isEditable) return

        // Se o modal já estiver aberto, não faz nada
        if (captureModalOpen) return

        e.preventDefault()
        setCaptureModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [captureModalOpen])

  // Fecha o drawer automaticamente ao mudar de rota ou parâmetros
  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [location.pathname, location.search])

  // Renovação proativa de sessão: na montagem, ao retomar visibilidade da aba e ao voltar o foco
  const renewSessionIfCloseToExpiry = useCallback(() => {
    if (!pb.authStore.token || !pb.authStore.record) return
    if (isTokenNearExpiry(pb.authStore.token)) {
      refreshAuthSession()
    }
  }, [])

  useEffect(() => {
    renewSessionIfCloseToExpiry()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        renewSessionIfCloseToExpiry()
      }
    }
    window.addEventListener('focus', renewSessionIfCloseToExpiry)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', renewSessionIfCloseToExpiry)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [renewSessionIfCloseToExpiry])

  const initials = String(user?.name || user?.email || 'U')
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Cálculos agregados para as 4 seções do modelo Todoist
  // 1. VISÕES: contagem total de itens das visões (Hoje + Amanhã + Semana + Inbox)
  const viewsAggregateCount = useMemo(() => {
    return count('Hoje') + count('Amanhã') + count('Semana') + count('Inbox')
  }, [tasks])

  // 2. PROJETOS ATIVOS (archived != true): cálculo de hierarquia pai/filho
  const activeProjects = useMemo(() => {
    return optimisticLists.filter((l) => !l.archived)
  }, [optimisticLists])

  // Contagem de tarefas abertas somadas de todos os projetos ativos
  const projectsAggregateCount = useMemo(() => {
    let sum = 0
    for (const p of activeProjects) {
      sum += openCountByList.get(p.id) || 0
    }
    return sum
  }, [activeProjects, openCountByList])

  // Árvore de projetos para exibição hierárquica
  const hierarchicalProjects = useMemo(() => {
    const roots = activeProjects.filter((p) => !p.parent)
    const children = activeProjects.filter((p) => !!p.parent)

    // Ordenação dos pais: favorite desc, depois pinned desc, depois order asc, depois name asc
    roots.sort((a, b) => {
      if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
      const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : 999999
      const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : 999999
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name, 'pt-BR')
    })

    return roots.map((root) => {
      const kids = children.filter((c) => c.parent === root.id)
      kids.sort((a, b) => {
        if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1
        const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : 999999
        const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : 999999
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name, 'pt-BR')
      })
      return { root, kids }
    })
  }, [activeProjects])

  // 3. FAVORITOS: itens pinados de qualquer tipo (projetos com favorite=true, etiquetas pinned=true e filtros salvos pinned=true)
  const favoriteProjects = useMemo(() => {
    return activeProjects.filter((p) => !!p.favorite)
  }, [activeProjects])

  const favoriteTags = useMemo(() => {
    return optimisticTags.filter((t) => !!t.pinned)
  }, [optimisticTags])

  const favoriteFilters = useMemo(() => {
    return savedFilters.filter((f) => !!f.pinned)
  }, [savedFilters])

  // Contagem aberta para filtros salvos favoritados
  const openCountByFilter = useMemo(() => {
    const map = new Map<string, number>()
    const now = new Date()
    for (const filter of favoriteFilters) {
      const c = tasks.filter(
        (t) => !t.done && taskMatchesFilterCriteria(t, filter.criteria, now),
      ).length
      map.set(filter.id, c)
    }
    return map
  }, [tasks, favoriteFilters])

  const favoritesAggregateCount = useMemo(() => {
    let sum = 0
    for (const p of favoriteProjects) {
      sum += openCountByList.get(p.id) || 0
    }
    for (const t of favoriteTags) {
      sum += openCountByTag.get(t.id) || 0
    }
    for (const f of favoriteFilters) {
      sum += openCountByFilter.get(f.id) || 0
    }
    return sum
  }, [
    favoriteProjects,
    favoriteTags,
    favoriteFilters,
    openCountByList,
    openCountByTag,
    openCountByFilter,
  ])

  const totalFavoritesCount = favoriteProjects.length + favoriteTags.length + favoriteFilters.length

  // 4. ETIQUETAS: contagem agregada de tarefas abertas de todas as etiquetas
  const tagsAggregateCount = useMemo(() => {
    let sum = 0
    for (const t of optimisticTags) {
      sum += openCountByTag.get(t.id) || 0
    }
    return sum
  }, [optimisticTags, openCountByTag])

  // Função auxiliar para renderizar a árvore de navegação completa da sidebar
  // compartilhada entre a barra lateral do desktop e o drawer mobile
  const renderSidebarBody = (onItemClick?: () => void) => (
    <>
      <div className="sidebar-scroll-area">
        {/* ============================================================== */}
        {/* 1. SEÇÃO VISÕES: Hoje, Amanhã, Semana, Inbox                    */}
        {/* ============================================================== */}
        <div className="sidebar-custom-section !pt-0 !border-t-0">
          <button
            type="button"
            className="sidebar-section-header"
            onClick={toggleViewsCollapse}
            aria-expanded={!viewsCollapsed}
            title={viewsCollapsed ? 'Expandir visões' : 'Recolher visões'}
          >
            <span className="sidebar-section-title">VISÕES</span>
            <span className="sidebar-section-meta">
              {viewsCollapsed && viewsAggregateCount > 0 && (
                <span className="sidebar-section-count">{viewsAggregateCount}</span>
              )}
              {viewsCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </span>
          </button>

          {!viewsCollapsed && (
            <nav className="sidebar-nav-group">
              {todoistViews.map(({ to, label, icon: Icon }) => {
                const isItemActive = (() => {
                  const path = location.pathname
                  const viewParam = searchParams.get('view')
                  // Não pode estar com filtro de etiqueta ou de projeto ativo
                  if (activeUrlTag || activeUrlList || activeUrlFilter) return false

                  if (label === 'Inbox') {
                    return (path === '/' || path === '') && viewParam === 'inbox'
                  }
                  if (label === 'Hoje') {
                    return (path === '/' || path === '') && (viewParam === 'hoje' || !viewParam)
                  }
                  if (label === 'Amanhã') {
                    return (path === '/' || path === '') && viewParam === 'amanha'
                  }
                  if (label === 'Semana') {
                    return path === '/semana'
                  }
                  return false
                })()

                const itemCount = count(label)

                return (
                  <NavLink
                    key={label}
                    to={to}
                    onClick={onItemClick}
                    className={() => `sidebar-todoist-view-item ${isItemActive ? 'active' : ''}`}
                  >
                    <Icon className="sidebar-view-icon" />
                    <span className="sidebar-view-label">{label}</span>
                    <span className={`sidebar-item-count ${itemCount === 0 ? 'zero' : ''}`}>
                      {itemCount}
                    </span>
                  </NavLink>
                )
              })}
            </nav>
          )}
        </div>

        {/* ============================================================== */}
        {/* 2. SEÇÃO FAVORITOS: Projetos favoritos + Etiquetas pinadas      */}
        {/* ============================================================== */}
        <div className="sidebar-custom-section">
          <button
            type="button"
            className="sidebar-section-header"
            onClick={toggleFavoritesCollapse}
            aria-expanded={!favoritesCollapsed}
            title={favoritesCollapsed ? 'Expandir favoritos' : 'Recolher favoritos'}
          >
            <span className="sidebar-section-title flex items-center gap-1.5">
              <span>FAVORITOS</span>
              {totalFavoritesCount > 0 && (
                <Star className="w-2.5 h-2.5 text-[#C5A880] fill-[#C5A880]" />
              )}
            </span>
            <span className="sidebar-section-meta">
              {favoritesCollapsed ? (
                <>
                  {favoritesAggregateCount > 0 && (
                    <span className="sidebar-section-count">{favoritesAggregateCount}</span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  {totalFavoritesCount > 0 && (
                    <span className="sidebar-section-count">{totalFavoritesCount}</span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </span>
          </button>

          {!favoritesCollapsed && (
            <div className="sidebar-custom-list">
              {totalFavoritesCount === 0 ? (
                <div className="sidebar-empty-hint">
                  Fixe projetos ou etiquetas para vê-los aqui
                </div>
              ) : (
                <>
                  {/* Projetos favoritados */}
                  {favoriteProjects.map((project) => {
                    const projectCount = openCountByList.get(project.id) || 0
                    const isActive =
                      location.pathname === `/projetos/${project.id}` ||
                      (location.pathname === '/' && activeUrlList === project.id)
                    return (
                      <div
                        key={`fav-p-${project.id}`}
                        className={`sidebar-custom-item ${isActive ? 'active' : ''}`}
                      >
                        <button
                          type="button"
                          className="sidebar-item-link"
                          onClick={() => {
                            navigate(`/projetos/${project.id}`)
                            onItemClick?.()
                          }}
                          title={`Projeto favorito: ${project.name}`}
                        >
                          <span
                            className="sidebar-item-dot"
                            style={{ backgroundColor: project.color || '#C5A880' }}
                          />
                          <span className="sidebar-item-name">{project.name}</span>
                          <span
                            className={`sidebar-item-count ${projectCount === 0 ? 'zero' : ''}`}
                          >
                            {projectCount}
                          </span>
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="sidebar-action-menu-trigger"
                              title="Mais opções do projeto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-3.5 h-3.5 text-[#71717A]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#12141C] border border-[rgba(197,168,128,0.2)] text-[#F4F4F6] min-w-[160px]"
                          >
                            <DropdownMenuItem
                              onClick={(e) => handleToggleProjectFavorite(e, project)}
                              className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                            >
                              <StarOff className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                              <span>Remover dos favoritos</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setRenamingProject(project)
                                setRenameValue(project.name)
                                setRenameColor(project.color || '#C5A880')
                              }}
                              className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-2 text-[#A1A1AA]" />
                              <span>Renomear</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.08)]" />
                            <DropdownMenuItem
                              onClick={() => handleToggleProjectArchived(project)}
                              className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                            >
                              <Archive className="w-3.5 h-3.5 mr-2 text-[#A1A1AA]" />
                              <span>Arquivar projeto</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })}

                  {/* Filtros salvos favoritados (pinned) */}
                  {favoriteFilters.map((filter) => {
                    const filterCount = openCountByFilter.get(filter.id) || 0
                    const isActive =
                      location.pathname === '/filtros' && activeUrlFilter === filter.id

                    return (
                      <div
                        key={`fav-f-${filter.id}`}
                        className={`sidebar-custom-item ${isActive ? 'active' : ''}`}
                      >
                        <button
                          type="button"
                          className="sidebar-item-link"
                          onClick={() => {
                            navigate(`/filtros?filterId=${filter.id}`)
                            onItemClick?.()
                          }}
                          title={`Filtro salvo favorito: ${filter.name}`}
                        >
                          <SlidersHorizontal
                            className="w-3.5 h-3.5 flex-shrink-0"
                            style={{ color: filter.color || '#C5A880' }}
                          />
                          <span className="sidebar-item-name">{filter.name}</span>
                          <span className={`sidebar-item-count ${filterCount === 0 ? 'zero' : ''}`}>
                            {filterCount}
                          </span>
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="sidebar-action-menu-trigger"
                              title="Mais opções do filtro"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-3.5 h-3.5 text-[#71717A]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#12141C] border border-[rgba(197,168,128,0.2)] text-[#F4F4F6] min-w-[160px]"
                          >
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation()
                                await toggleSavedFilterPinned(filter.id, !!filter.pinned)
                                refresh()
                              }}
                              className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                            >
                              <PinOff className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                              <span>Remover dos favoritos</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })}

                  {/* Etiquetas favoritadas (pinned) */}
                  {favoriteTags.map((tag) => {
                    const tagCount = openCountByTag.get(tag.id) || 0
                    const isActive =
                      (location.pathname === '/' || location.pathname === '') &&
                      activeUrlTag === tag.id

                    return (
                      <div
                        key={`fav-t-${tag.id}`}
                        className={`sidebar-custom-item ${isActive ? 'active' : ''}`}
                      >
                        <button
                          type="button"
                          className="sidebar-item-link"
                          onClick={() => {
                            navigate(`/?view=hoje&tag=${tag.id}`)
                            onItemClick?.()
                          }}
                          title={`Etiqueta favoritada: @${tag.name}`}
                        >
                          <span
                            className="sidebar-item-dot"
                            style={{ backgroundColor: tag.color || '#C5A880' }}
                          />
                          <span className="sidebar-item-name">{tag.name}</span>
                          <span className={`sidebar-item-count ${tagCount === 0 ? 'zero' : ''}`}>
                            {tagCount}
                          </span>
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="sidebar-action-menu-trigger"
                              title="Mais opções da etiqueta"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-3.5 h-3.5 text-[#71717A]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#12141C] border border-[rgba(197,168,128,0.2)] text-[#F4F4F6] min-w-[160px]"
                          >
                            <DropdownMenuItem
                              onClick={(e) => handleToggleTagPin(e, tag)}
                              className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                            >
                              <PinOff className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                              <span>Remover dos favoritos</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 3. SEÇÃO PROJETOS: Cores + Contagens + Subprojetos aninhados    */}
        {/* ============================================================== */}
        <div className="sidebar-custom-section">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              className="sidebar-section-header flex-1 !p-1"
              onClick={toggleProjectsCollapse}
              aria-expanded={!projectsCollapsed}
              title={projectsCollapsed ? 'Expandir projetos' : 'Recolher projetos'}
            >
              <span className="sidebar-section-title">PROJETOS</span>
              <span className="sidebar-section-meta">
                {projectsCollapsed ? (
                  <>
                    {projectsAggregateCount > 0 && (
                      <span className="sidebar-section-count">{projectsAggregateCount}</span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    {activeProjects.length > 0 && (
                      <span className="sidebar-section-count">{activeProjects.length}</span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigate('/projetos')
                onItemClick?.()
              }}
              className="text-[#71717A] hover:text-[#C5A880] p-1.5 rounded transition-colors"
              title="Gerenciar e criar projetos (/projetos)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {!projectsCollapsed && (
            <div className="sidebar-custom-list">
              {activeProjects.length === 0 ? (
                <div className="sidebar-empty-hint">Nenhum projeto ativo</div>
              ) : (
                hierarchicalProjects.map(({ root: project, kids }) => {
                  const projectCount = openCountByList.get(project.id) || 0
                  const isFav = !!project.favorite
                  const isActive =
                    location.pathname === `/projetos/${project.id}` ||
                    (location.pathname === '/' && activeUrlList === project.id)
                  const isDragging = draggingListId === project.id
                  const dropPos = listDropTarget?.id === project.id ? listDropTarget.position : null
                  const hasKids = kids.length > 0
                  const isExpanded = !!expandedParents[project.id]

                  return (
                    <div key={project.id} className="sidebar-project-tree-item">
                      <div
                        data-list-id={project.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', project.id)
                          e.dataTransfer.effectAllowed = 'move'
                          setDraggingListId(project.id)
                        }}
                        onDragEnd={() => {
                          setDraggingListId(null)
                          setListDropTarget(null)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                          if (!draggingListId || draggingListId === project.id) {
                            setListDropTarget(null)
                            return
                          }
                          const rect = e.currentTarget.getBoundingClientRect()
                          const midY = rect.top + rect.height / 2
                          const position = e.clientY < midY ? 'before' : 'after'
                          setListDropTarget({ id: project.id, position })
                        }}
                        onDrop={async (e) => {
                          e.preventDefault()
                          const sourceId = e.dataTransfer.getData('text/plain') || draggingListId
                          const pos =
                            listDropTarget?.id === project.id ? listDropTarget.position : 'before'
                          setDraggingListId(null)
                          setListDropTarget(null)
                          if (sourceId && sourceId !== project.id) {
                            await commitListReorder(sourceId, project.id, pos)
                          }
                        }}
                        className={`sidebar-custom-item ${isFav ? 'is-pinned' : ''} ${
                          isActive ? 'active' : ''
                        } ${isDragging ? 'is-dragging' : ''} ${
                          dropPos ? `drop-indicator-${dropPos}` : ''
                        }`}
                      >
                        {/* Chevron para projetos com sub-projetos filhos */}
                        {hasKids ? (
                          <button
                            type="button"
                            className="sidebar-tree-toggle-btn"
                            onClick={(e) => toggleParentProject(project.id, e)}
                            title={
                              isExpanded
                                ? 'Recolher subprojetos'
                                : `Expandir ${kids.length} subprojetos`
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-[#A1A1AA]" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-[#A1A1AA]" />
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="sidebar-drag-handle"
                            title="Arrastar para reordenar"
                            onTouchStart={(e) => {
                              const touch = e.touches[0]
                              listTouchStateRef.current = {
                                activeId: project.id,
                                lastTouchY: touch.clientY,
                              }
                              setDraggingListId(project.id)
                            }}
                          >
                            <GripVertical className="w-3 h-3 text-[#71717A]" />
                          </button>
                        )}

                        <button
                          type="button"
                          className="sidebar-item-link"
                          onClick={() => {
                            navigate(`/projetos/${project.id}`)
                            onItemClick?.()
                          }}
                          title={`Projeto: ${project.name}${isFav ? ' (Favorito)' : ''}`}
                        >
                          <span
                            className="sidebar-item-dot"
                            style={{ backgroundColor: project.color || '#C5A880' }}
                          />
                          <span className="sidebar-item-name flex items-center gap-1">
                            <span>{project.name}</span>
                            {isFav && (
                              <Star className="w-2.5 h-2.5 text-[#C5A880] fill-[#C5A880]" />
                            )}
                          </span>
                          <span
                            className={`sidebar-item-count ${projectCount === 0 ? 'zero' : ''}`}
                          >
                            {projectCount}
                          </span>
                        </button>

                        {/* Menu de contexto (...) para Ações Rápidas */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="sidebar-action-menu-trigger"
                              title="Mais opções do projeto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-3.5 h-3.5 text-[#71717A]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#12141C] border border-[rgba(197,168,128,0.2)] text-[#F4F4F6] min-w-[170px]"
                          >
                            <DropdownMenuItem
                              onClick={(e) => handleToggleProjectFavorite(e, project)}
                              className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                            >
                              {isFav ? (
                                <>
                                  <StarOff className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                                  <span>Desafixar dos favoritos</span>
                                </>
                              ) : (
                                <>
                                  <Star className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                                  <span>Fixar nos favoritos</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setRenamingProject(project)
                                setRenameValue(project.name)
                                setRenameColor(project.color || '#C5A880')
                              }}
                              className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-2 text-[#A1A1AA]" />
                              <span>Renomear</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.08)]" />
                            <DropdownMenuItem
                              onClick={() => handleToggleProjectArchived(project)}
                              className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                            >
                              <Archive className="w-3.5 h-3.5 mr-2 text-[#A1A1AA]" />
                              <span>Arquivar projeto</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* SUBPROJETOS ANINHADOS (indentação e exibição quando expandido) */}
                      {hasKids && isExpanded && (
                        <div className="sidebar-subprojects-container pl-4 ml-2 border-l border-[rgba(255,255,255,0.06)] space-y-0.5 mt-0.5">
                          {kids.map((child) => {
                            const childCount = openCountByList.get(child.id) || 0
                            const isChildFav = !!child.favorite
                            const isChildActive =
                              location.pathname === `/projetos/${child.id}` ||
                              (location.pathname === '/' && activeUrlList === child.id)

                            return (
                              <div
                                key={child.id}
                                className={`sidebar-custom-item sidebar-subproject-item ${
                                  isChildActive ? 'active' : ''
                                }`}
                              >
                                <button
                                  type="button"
                                  className="sidebar-item-link"
                                  onClick={() => {
                                    navigate(`/projetos/${child.id}`)
                                    onItemClick?.()
                                  }}
                                  title={`Subprojeto: ${child.name}`}
                                >
                                  <span
                                    className="sidebar-item-dot"
                                    style={{ backgroundColor: child.color || '#C5A880' }}
                                  />
                                  <span className="sidebar-item-name text-xs flex items-center gap-1">
                                    <span>{child.name}</span>
                                    {isChildFav && (
                                      <Star className="w-2 h-2 text-[#C5A880] fill-[#C5A880]" />
                                    )}
                                  </span>
                                  <span
                                    className={`sidebar-item-count ${childCount === 0 ? 'zero' : ''}`}
                                  >
                                    {childCount}
                                  </span>
                                </button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="sidebar-action-menu-trigger"
                                      title="Mais opções do subprojeto"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="w-3.5 h-3.5 text-[#71717A]" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="bg-[#12141C] border border-[rgba(197,168,128,0.2)] text-[#F4F4F6] min-w-[170px]"
                                  >
                                    <DropdownMenuItem
                                      onClick={(e) => handleToggleProjectFavorite(e, child)}
                                      className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                                    >
                                      {isChildFav ? (
                                        <>
                                          <StarOff className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                                          <span>Desafixar dos favoritos</span>
                                        </>
                                      ) : (
                                        <>
                                          <Star className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                                          <span>Fixar nos favoritos</span>
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setRenamingProject(child)
                                        setRenameValue(child.name)
                                        setRenameColor(child.color || '#C5A880')
                                      }}
                                      className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 mr-2 text-[#A1A1AA]" />
                                      <span>Renomear</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.08)]" />
                                    <DropdownMenuItem
                                      onClick={() => handleToggleProjectArchived(child)}
                                      className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                                    >
                                      <Archive className="w-3.5 h-3.5 mr-2 text-[#A1A1AA]" />
                                      <span>Arquivar subprojeto</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {/* Botão de Rodapé da Seção Projetos */}
              <button
                type="button"
                onClick={() => {
                  navigate('/projetos')
                  onItemClick?.()
                }}
                className="sidebar-manage-projects-btn"
                title="Ver e gerenciar todos os projetos"
              >
                <FolderKanban className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Gerenciar projetos</span>
              </button>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 4. SEÇÃO ETIQUETAS: Contagens, Ordenação & Drag-and-Drop       */}
        {/* ============================================================== */}
        <div className="sidebar-custom-section">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              className="sidebar-section-header flex-1 !p-1"
              onClick={toggleTagsCollapse}
              aria-expanded={!tagsCollapsed}
              title={tagsCollapsed ? 'Expandir etiquetas' : 'Recolher etiquetas'}
            >
              <span className="sidebar-section-title">ETIQUETAS</span>
              <span className="sidebar-section-meta">
                {tagsCollapsed ? (
                  <>
                    {tagsAggregateCount > 0 && (
                      <span className="sidebar-section-count">{tagsAggregateCount}</span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    {optimisticTags.length > 0 && (
                      <span className="sidebar-section-count">{optimisticTags.length}</span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigate('/filtros?tab=etiquetas')
                onItemClick?.()
              }}
              className="text-[#71717A] hover:text-[#C5A880] p-1.5 rounded transition-colors"
              title="Hub de Etiquetas & Filtros (/filtros)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {!tagsCollapsed && (
            <div className="sidebar-custom-list">
              {optimisticTags.length === 0 ? (
                <div className="sidebar-empty-hint">Nenhuma etiqueta criada</div>
              ) : (
                optimisticTags.map((tag) => {
                  const tagCount = openCountByTag.get(tag.id) || 0
                  const isPinned = !!tag.pinned
                  const isActive =
                    (location.pathname === '/' || location.pathname === '') &&
                    activeUrlTag === tag.id
                  const isDragging = draggingTagId === tag.id
                  const dropPos = tagDropTarget?.id === tag.id ? tagDropTarget.position : null

                  return (
                    <div
                      key={tag.id}
                      data-tag-id={tag.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', tag.id)
                        e.dataTransfer.effectAllowed = 'move'
                        setDraggingTagId(tag.id)
                      }}
                      onDragEnd={() => {
                        setDraggingTagId(null)
                        setTagDropTarget(null)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        if (!draggingTagId || draggingTagId === tag.id) {
                          setTagDropTarget(null)
                          return
                        }
                        const rect = e.currentTarget.getBoundingClientRect()
                        const midY = rect.top + rect.height / 2
                        const position = e.clientY < midY ? 'before' : 'after'
                        setTagDropTarget({ id: tag.id, position })
                      }}
                      onDrop={async (e) => {
                        e.preventDefault()
                        const sourceId = e.dataTransfer.getData('text/plain') || draggingTagId
                        const pos = tagDropTarget?.id === tag.id ? tagDropTarget.position : 'before'
                        setDraggingTagId(null)
                        setTagDropTarget(null)
                        if (sourceId && sourceId !== tag.id) {
                          await commitTagReorder(sourceId, tag.id, pos)
                        }
                      }}
                      className={`sidebar-custom-item ${isPinned ? 'is-pinned' : ''} ${
                        isActive ? 'active' : ''
                      } ${isDragging ? 'is-dragging' : ''} ${
                        dropPos ? `drop-indicator-${dropPos}` : ''
                      }`}
                    >
                      <button
                        type="button"
                        className="sidebar-drag-handle"
                        title="Arrastar para reordenar"
                        onTouchStart={(e) => {
                          const touch = e.touches[0]
                          tagTouchStateRef.current = {
                            activeId: tag.id,
                            lastTouchY: touch.clientY,
                          }
                          setDraggingTagId(tag.id)
                        }}
                      >
                        <GripVertical className="w-3 h-3 text-[#71717A]" />
                      </button>

                      <button
                        type="button"
                        className="sidebar-item-link"
                        onClick={() => {
                          navigate(`/?view=hoje&tag=${tag.id}`)
                          onItemClick?.()
                        }}
                        title={`Filtrar por etiqueta @${tag.name}${isPinned ? ' (Fixada nos favoritos)' : ''}`}
                      >
                        <span
                          className="sidebar-item-dot"
                          style={{ backgroundColor: tag.color || '#C5A880' }}
                        />
                        <span className="sidebar-item-name">{tag.name}</span>
                        <span className={`sidebar-item-count ${tagCount === 0 ? 'zero' : ''}`}>
                          {tagCount}
                        </span>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="sidebar-action-menu-trigger"
                            title="Opções da etiqueta"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5 text-[#71717A]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#12141C] border border-[rgba(197,168,128,0.2)] text-[#F4F4F6] min-w-[170px]"
                        >
                          <DropdownMenuItem
                            onClick={(e) => handleToggleTagPin(e, tag)}
                            className="text-xs cursor-pointer focus:bg-[rgba(197,168,128,0.1)] focus:text-[#C5A880]"
                          >
                            {isPinned ? (
                              <>
                                <PinOff className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                                <span>Desafixar dos favoritos</span>
                              </>
                            ) : (
                              <>
                                <Pin className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
                                <span>Fixar nos favoritos</span>
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })
              )}

              {/* Botão de Rodapé da Seção Etiquetas -> Hub /filtros */}
              <button
                type="button"
                onClick={() => {
                  navigate('/filtros')
                  onItemClick?.()
                }}
                className="sidebar-manage-projects-btn"
                title="Hub de Etiquetas & Filtros Salvos (/filtros)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Etiquetas & Filtros</span>
              </button>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* NAVEGAÇÃO SECUNDÁRIA: Hub Filtros, Pomodoro & Histórico        */}
        {/* ============================================================== */}
        <div className="sidebar-custom-section !pt-2">
          <nav className="sidebar-nav-group">
            <NavLink
              to="/filtros"
              onClick={onItemClick}
              className={({ isActive }) => `sidebar-todoist-view-item ${isActive ? 'active' : ''}`}
            >
              <SlidersHorizontal className="sidebar-view-icon text-[#C5A880]" />
              <span className="sidebar-view-label">Etiquetas & Filtros</span>
            </NavLink>

            {utilityNavLinks.map(([to, label, Icon]) => (
              <NavLink
                key={label}
                to={to}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `sidebar-todoist-view-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon className="sidebar-view-icon" />
                <span className="sidebar-view-label">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-profile-row">
          <button
            type="button"
            className={`sidebar-profile-btn ${location.pathname === '/configuracoes' ? 'active' : ''}`}
            onClick={() => {
              navigate('/configuracoes')
              onItemClick?.()
            }}
            title="Ir para Configurações do perfil"
          >
            <span className="avatar">{initials}</span>
            <span className="sidebar-profile-name">{String(user?.name || 'Usuário')}</span>
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="sidebar-logout-btn"
                title="Encerrar sessão"
                aria-label="Encerrar sessão"
              >
                <LogOut className="w-4 h-4 text-[#a1a1aa]" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={8}
              className="logout-popover-content"
            >
              <div className="logout-confirm-box">
                <div className="logout-confirm-title">Sair da conta?</div>
                <p className="logout-confirm-desc">
                  Você precisará fazer login novamente para acessar o sistema.
                </p>
                <div className="logout-confirm-actions">
                  <button
                    type="button"
                    className="logout-confirm-btn"
                    onClick={() => {
                      logout()
                      navigate('/login')
                    }}
                  >
                    Sair
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  )

  return (
    <div className="app-shell">
      {/* MODAL DE RENOMEAÇÃO RÁPIDA DE PROJETO (ACIONADO VIA SIDEBAR) */}
      <Dialog
        open={!!renamingProject}
        onOpenChange={(open) => {
          if (!open) setRenamingProject(null)
        }}
      >
        <DialogContent className="bg-[#12141C] border border-[rgba(197,168,128,0.25)] text-[#F4F4F6] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Clash_Display'] text-lg font-semibold text-[#F4F4F6]">
              Renomear Projeto
            </DialogTitle>
            <DialogDescription className="text-xs text-[#A1A1AA]">
              Altere o nome e a cor de destaque do projeto diretamente na sidebar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1">
                Nome do Projeto
              </label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveProjectRename()
                  }
                }}
                autoFocus
                placeholder="Ex.: Ciclo 12S · Faturamento"
                className="w-full bg-[#090A0E] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C5A880]"
              />
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
                    onClick={() => setRenameColor(pal.color)}
                    style={{ backgroundColor: pal.color }}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      renameColor === pal.color
                        ? 'ring-2 ring-white scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    title={pal.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setRenamingProject(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveProjectRename}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#C5A880] text-[#090A0E] hover:bg-[#D4B991] transition-all"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* SIDEBAR DESKTOP (≥1025px) - Mantida intacta */}
      <aside className="sidebar">
        <Brand />
        {renderSidebarBody()}
      </aside>

      {/* CABEÇALHO MOBILE LIMPO (<1025px): Hambúrguer · Monograma compacto · Avatar */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileDrawerOpen(true)}
            title="Abrir menu de navegação"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-5 h-5 text-[#f4f4f6]" />
          </button>
          <Brand compact />
        </div>
        <div className="mobile-header-actions">
          <button
            type="button"
            className="mobile-avatar-btn"
            onClick={() => navigate('/configuracoes')}
            title="Ir para Configurações"
            aria-label="Ir para Configurações"
          >
            <span className="avatar">{initials}</span>
          </button>
        </div>
      </header>

      {/* DRAWER LATERAL MOBILE VIA SHEET: Desliza da esquerda com a sidebar completa */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent
          side="left"
          className="mobile-drawer-sheet p-0 w-[300px] sm:w-[320px] bg-[#090a0e] border-r border-[rgba(255,255,255,0.08)] flex flex-col h-full text-[#f4f4f6]"
        >
          <SheetHeader className="p-4 border-b border-[rgba(255,255,255,0.06)] flex flex-row items-center justify-between text-left space-y-0">
            <div className="flex items-center">
              <Brand compact />
            </div>
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <SheetDescription className="sr-only">
              Navegação principal, etiquetas e listas do Barbosa System
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 flex flex-col min-h-0 px-4 py-3">
            {renderSidebarBody(() => setMobileDrawerOpen(false))}
          </div>
        </SheetContent>
      </Sheet>

      {/* CONTEÚDO PRINCIPAL (Header de página limpo sem a barra fixa de captura) */}
      <main className="main">
        {!isPomodoroPage && (
          <div className="global-capture-shortcut-banner">
            <button
              type="button"
              onClick={() => setCaptureModalOpen(true)}
              className="global-capture-trigger-hint"
              title="Abrir captura rápida global (atalho: C)"
            >
              <span className="hint-label">Pressione</span>
              <kbd className="hint-kbd">C</kbd>
              <span className="hint-label">para capturar em qualquer tela</span>
            </button>
          </div>
        )}
        <Outlet />
      </main>

      {/* MODAL GLOBAL DE CAPTURA (Acionado pela tecla C ou pelo FAB mobile) */}
      <CaptureModal
        open={captureModalOpen}
        onOpenChange={setCaptureModalOpen}
        onCreated={refresh}
      />

      {/* BOTÃO FLUTUANTE DE CAPTURA (+) NO MOBILE (Abre o mesmo modal global de captura) */}
      {!isPomodoroPage && (
        <div className="mobile-capture-container">
          <button
            type="button"
            className="mobile-capture-fab"
            onClick={() => setCaptureModalOpen(true)}
            title="Nova tarefa rápida (C)"
            aria-label="Nova tarefa rápida"
          >
            <Plus className="w-6 h-6 text-[#090a0e]" strokeWidth={2.2} />
          </button>
        </div>
      )}

      {/* WIDGET POMODORO FLUTUANTE: Posicionado acima da bottom nav no mobile */}
      {!isPomodoroPage && <PomodoroWidget />}

      {/* BARRA INFERIOR DE NAVEGAÇÃO FIXA (BOTTOM NAV) NO MOBILE */}
      <nav className="mobile-bottom-nav">
        {mobileBottomNavLinks.map(([to, label, Icon]) => {
          const isItemActive =
            to === '/'
              ? (location.pathname === '/' || location.pathname === '') &&
                (searchParams.get('view') === 'hoje' || !searchParams.get('view')) &&
                !activeUrlTag &&
                !activeUrlList
              : to === '/?view=amanha'
                ? searchParams.get('view') === 'amanha'
                : to === '/semana'
                  ? location.pathname === '/semana'
                  : to === '/pomodoro'
                    ? location.pathname === '/pomodoro'
                    : to === '/historico'
                      ? location.pathname === '/historico'
                      : false

          return (
            <NavLink
              key={label}
              to={to}
              className={`mobile-bottom-nav-item ${isItemActive ? 'active' : ''}`}
            >
              <div className="mobile-bottom-nav-icon-wrap">
                <Icon className="w-5 h-5" />
                {label === 'Hoje' && count('Hoje') > 0 && (
                  <span className="mobile-bottom-nav-badge">{count('Hoje')}</span>
                )}
                {label === 'Amanhã' && count('Amanhã') > 0 && (
                  <span className="mobile-bottom-nav-badge">{count('Amanhã')}</span>
                )}
                {label === 'Semana' && count('Semana') > 0 && (
                  <span className="mobile-bottom-nav-badge">{count('Semana')}</span>
                )}
              </div>
              <span className="mobile-bottom-nav-label">{label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
