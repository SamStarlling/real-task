import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  GripVertical,
  Inbox,
  LogOut,
  Pin,
  Settings,
  Sun,
  Tag as TagIcon,
  Timer,
} from 'lucide-react'
import { Brand } from '@/components/Brand'
import { CaptureBar } from '@/components/CaptureBar'
import { PomodoroWidget } from '@/components/PomodoroWidget'
import { useAuth } from '@/contexts/AuthContext'
import type { ListRecord, TagRecord, TaskRecord } from '@/types'
import { localDay } from '@/lib/date-parser'
import { pbDay } from '@/lib/format'
import {
  reorderLists,
  reorderTags,
  sortPrioritizedItems,
  toggleListPinned,
  toggleTagPinned,
} from '@/services/data'

const links = [
  ['/?view=inbox', 'Inbox', Inbox],
  ['/', 'Hoje', Sun],
  ['/?view=amanha', 'Amanhã', ArrowRight],
  ['/semana', 'Semana', CalendarDays],
  ['/pomodoro', 'Pomodoro', Timer],
  ['/historico', 'Histórico', Clock3],
] as const
export function Layout({
  tasks,
  tags = [],
  lists = [],
  refresh,
}: {
  tasks: TaskRecord[]
  tags?: TagRecord[]
  lists?: ListRecord[]
  refresh: () => void
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const activeUrlTag = searchParams.get('tag')
  const activeUrlList = searchParams.get('list')
  const isPomodoroPage = location.pathname === '/pomodoro'
  const today = localDay()
  const tomorrow = localDay(new Date(Date.now() + 86400000))
  const day6 = localDay(new Date(Date.now() + 6 * 86400000))

  // Estado colapsável memorizado no localStorage
  const [tagsCollapsed, setTagsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('barbosa_sidebar_tags_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [listsCollapsed, setListsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('barbosa_sidebar_lists_collapsed') === 'true'
    } catch {
      return false
    }
  })

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

  const toggleListsCollapse = () => {
    setListsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('barbosa_sidebar_lists_collapsed', String(next))
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

  // Toggle do pin de lista com atualização otimista
  const handleToggleListPin = async (e: React.MouseEvent, list: ListRecord) => {
    e.preventDefault()
    e.stopPropagation()
    const nextPinned = !list.pinned
    setOptimisticLists((prev) =>
      sortPrioritizedItems(prev.map((l) => (l.id === list.id ? { ...l, pinned: nextPinned } : l))),
    )
    try {
      await toggleListPinned(list.id, !!list.pinned)
      refresh()
    } catch (err) {
      console.error('Erro ao alternar pin da lista:', err)
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
                : false),
    ).length

  const initials = String(user?.name || user?.email || 'U')
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-scroll-area">
          <nav>
            {links.map(([to, label, Icon]) => (
              <NavLink
                key={label}
                end={to === '/'}
                to={to}
                className={({ isActive }) =>
                  isActive && !activeUrlTag && !activeUrlList ? 'active' : ''
                }
              >
                <Icon />
                <span>{label}</span>
                {label !== 'Histórico' && label !== 'Pomodoro' && <b>{count(label)}</b>}
              </NavLink>
            ))}
          </nav>

          {/* SEÇÃO NOVA: ETIQUETAS (COLAPSÁVEL + DRAG + PIN 80/20) */}
          <div className="sidebar-custom-section">
            <button
              type="button"
              className="sidebar-section-header"
              onClick={toggleTagsCollapse}
              aria-expanded={!tagsCollapsed}
              title={tagsCollapsed ? 'Expandir etiquetas' : 'Recolher etiquetas'}
            >
              <span className="sidebar-section-title">ETIQUETAS</span>
              <span className="sidebar-section-meta">
                {optimisticTags.length > 0 && (
                  <span className="sidebar-section-count">{optimisticTags.length}</span>
                )}
                {tagsCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
            </button>

            {!tagsCollapsed && (
              <div className="sidebar-custom-list">
                {optimisticTags.length === 0 ? (
                  <div className="sidebar-empty-hint">Nenhuma etiqueta criada</div>
                ) : (
                  optimisticTags.map((tag) => {
                    const tagCount = openCountByTag.get(tag.id) || 0
                    const isPinned = !!tag.pinned
                    const isActive = activeUrlTag === tag.id
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
                          const pos =
                            tagDropTarget?.id === tag.id ? tagDropTarget.position : 'before'
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
                            // Clicar na etiqueta navega para Hoje filtrada por esta etiqueta
                            navigate(`/?view=hoje&tag=${tag.id}`)
                          }}
                          title={`Filtrar por etiqueta @${tag.name}${isPinned ? ' (Prioritária)' : ''}`}
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

                        <button
                          type="button"
                          className={`sidebar-pin-btn ${isPinned ? 'pinned' : ''}`}
                          onClick={(e) => handleToggleTagPin(e, tag)}
                          title={
                            isPinned
                              ? 'Etiqueta prioritária (80/20) · Clique para desmarcar'
                              : 'Fixar como etiqueta prioritária (80/20)'
                          }
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* SEÇÃO NOVA: LISTAS (COLAPSÁVEL + DRAG + PIN 80/20) */}
          <div className="sidebar-custom-section">
            <button
              type="button"
              className="sidebar-section-header"
              onClick={toggleListsCollapse}
              aria-expanded={!listsCollapsed}
              title={listsCollapsed ? 'Expandir listas' : 'Recolher listas'}
            >
              <span className="sidebar-section-title">LISTAS</span>
              <span className="sidebar-section-meta">
                {optimisticLists.length > 0 && (
                  <span className="sidebar-section-count">{optimisticLists.length}</span>
                )}
                {listsCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
            </button>

            {!listsCollapsed && (
              <div className="sidebar-custom-list">
                {optimisticLists.length === 0 ? (
                  <div className="sidebar-empty-hint">Nenhuma lista criada</div>
                ) : (
                  optimisticLists.map((list) => {
                    const listCount = openCountByList.get(list.id) || 0
                    const isPinned = !!list.pinned
                    const isActive = activeUrlList === list.id
                    const isDragging = draggingListId === list.id
                    const dropPos = listDropTarget?.id === list.id ? listDropTarget.position : null

                    return (
                      <div
                        key={list.id}
                        data-list-id={list.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', list.id)
                          e.dataTransfer.effectAllowed = 'move'
                          setDraggingListId(list.id)
                        }}
                        onDragEnd={() => {
                          setDraggingListId(null)
                          setListDropTarget(null)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                          if (!draggingListId || draggingListId === list.id) {
                            setListDropTarget(null)
                            return
                          }
                          const rect = e.currentTarget.getBoundingClientRect()
                          const midY = rect.top + rect.height / 2
                          const position = e.clientY < midY ? 'before' : 'after'
                          setListDropTarget({ id: list.id, position })
                        }}
                        onDrop={async (e) => {
                          e.preventDefault()
                          const sourceId = e.dataTransfer.getData('text/plain') || draggingListId
                          const pos =
                            listDropTarget?.id === list.id ? listDropTarget.position : 'before'
                          setDraggingListId(null)
                          setListDropTarget(null)
                          if (sourceId && sourceId !== list.id) {
                            await commitListReorder(sourceId, list.id, pos)
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
                            listTouchStateRef.current = {
                              activeId: list.id,
                              lastTouchY: touch.clientY,
                            }
                            setDraggingListId(list.id)
                          }}
                        >
                          <GripVertical className="w-3 h-3 text-[#71717A]" />
                        </button>

                        <button
                          type="button"
                          className="sidebar-item-link"
                          onClick={() => {
                            // Clicar na lista navega para a visão filtrada da lista
                            navigate(`/?view=lista&list=${list.id}`)
                          }}
                          title={`Filtrar por lista #${list.name}${isPinned ? ' (Prioritária)' : ''}`}
                        >
                          <span className="sidebar-item-hash">#</span>
                          <span className="sidebar-item-name">{list.name}</span>
                          <span className={`sidebar-item-count ${listCount === 0 ? 'zero' : ''}`}>
                            {listCount}
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`sidebar-pin-btn ${isPinned ? 'pinned' : ''}`}
                          onClick={(e) => handleToggleListPin(e, list)}
                          title={
                            isPinned
                              ? 'Lista prioritária (80/20) · Clique para desmarcar'
                              : 'Fixar como lista prioritária (80/20)'
                          }
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <NavLink
            to="/configuracoes"
            className={({ isActive }) => `sidebar-docs-link ${isActive ? 'active' : ''}`}
            title="Configurações e Metas de Foco"
          >
            <Settings />
            <span>Configurações</span>
          </NavLink>
          <NavLink
            to="/docs"
            className={({ isActive }) => `sidebar-docs-link ${isActive ? 'active' : ''}`}
            title="Documentação do Sistema"
          >
            <BookOpen />
            <span>Documentação</span>
          </NavLink>
          <div className="profile">
            <span className="avatar">{initials}</span>
            <span>{String(user?.name || 'Usuário')}</span>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              title="Encerrar sessão"
            >
              <LogOut />
            </button>
          </div>
        </div>
      </aside>
      <header className="mobile-header">
        <Brand compact />
        <div className="mobile-header-actions">
          <NavLink to="/configuracoes" className="mobile-docs-btn" title="Configurações">
            <Settings />
          </NavLink>
          <NavLink to="/docs" className="mobile-docs-btn" title="Documentação">
            <BookOpen />
          </NavLink>
          <span className="avatar">{initials}</span>
        </div>
      </header>
      <nav className="mobile-nav">
        {links.map(([to, label]) => (
          <NavLink
            key={label}
            end={to === '/'}
            to={to}
            className={({ isActive }) =>
              isActive && !activeUrlTag && !activeUrlList ? 'active' : ''
            }
          >
            {label}
          </NavLink>
        ))}
        {optimisticTags.map((tag) => (
          <NavLink
            key={tag.id}
            to={`/?view=hoje&tag=${tag.id}`}
            className={() => (activeUrlTag === tag.id ? 'active' : '')}
            title={`@${tag.name}`}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: tag.color || '#C5A880',
                display: 'inline-block',
                marginRight: 4,
              }}
            />
            {tag.pinned ? `★ ${tag.name}` : tag.name}
          </NavLink>
        ))}
        {optimisticLists.map((list) => (
          <NavLink
            key={list.id}
            to={`/?view=lista&list=${list.id}`}
            className={() => (activeUrlList === list.id ? 'active' : '')}
            title={`#${list.name}`}
          >
            #{list.pinned ? `★ ${list.name}` : list.name}
          </NavLink>
        ))}
      </nav>
      <main className="main">
        <div className="capture-sticky">
          <CaptureBar onCreated={refresh} />
        </div>
        <Outlet />
      </main>
      <div className="mobile-capture">
        <CaptureBar onCreated={refresh} />
      </div>
      {!isPomodoroPage && <PomodoroWidget />}
    </div>
  )
}
