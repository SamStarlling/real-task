import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  User,
  Search,
  Check,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Mail,
  Sliders,
  Bell,
  Volume2,
  VolumeX,
  Tag,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Hash,
  Folder,
  Pin,
  BookOpen,
  Cpu,
  Copy,
  Key,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  resolveNotificationPreferences,
  resolveWeeklyGoals,
  updateUserNotificationPreferences,
  updateUserWeeklyGoals,
  WEEKDAY_ORDER,
  WEEKDAY_LABELS,
  getTags,
  getTasks,
  getLists,
  createTag,
  updateTag,
  deleteTag,
  toggleTagPinned,
  createList,
  updateList,
  deleteList,
  toggleListPinned,
  sortPrioritizedItems,
  TAG_PALETTE,
  getNextTagColor,
  type NotificationPreferences,
  type WeekdayKey,
  type WeeklyFocusGoals,
  type TagRecord,
} from '@/services/data'
import type { ListRecord, TaskRecord } from '@/types'
import { formatMinutes } from '@/lib/format'
import { playReminderSound } from '@/lib/sounds'

import {
  getMcpServerUrl,
  getMcpTokens,
  createMcpToken,
  revokeMcpToken,
  deleteMcpToken,
} from '@/services/mcp'
import type { McpTokenRecord, CreatedMcpTokenResponse } from '@/types'

type SettingsTab = 'produtividade' | 'etiquetas' | 'listas' | 'integracoes' | 'conta'

interface EditingState {
  day: WeekdayKey | null
  value: string
}

export function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<SettingsTab>('produtividade')
  const [searchTerm, setSearchTerm] = useState('')
  const [goals, setGoals] = useState<WeeklyFocusGoals>(() => resolveWeeklyGoals(user))
  const [editing, setEditing] = useState<EditingState>({ day: null, value: '' })
  const [savingDay, setSavingDay] = useState<WeekdayKey | null>(null)
  const [savedFeedback, setSavedFeedback] = useState<WeekdayKey | null>(null)
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null)

  // Estado de Etiquetas (Tags)
  const [tags, setTags] = useState<TagRecord[]>([])
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [lists, setLists] = useState<ListRecord[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [listsLoading, setListsLoading] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState<string>(TAG_PALETTE[0].color)
  const [tagCreating, setTagCreating] = useState(false)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingTagName, setEditingTagName] = useState('')
  const [editingTagColor, setEditingTagColor] = useState('')
  const [tagActionError, setTagActionError] = useState<string | null>(null)

  // Estado de Listas
  const [newListName, setNewListName] = useState('')
  const [listCreating, setListCreating] = useState(false)
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editingListName, setEditingListName] = useState('')
  const [listActionError, setListActionError] = useState<string | null>(null)

  // Estado de Integrações / Tokens MCP
  const [mcpTokens, setMcpTokens] = useState<McpTokenRecord[]>([])
  const [mcpLoading, setMcpLoading] = useState(false)
  const [newMcpTokenName, setNewMcpTokenName] = useState('')
  const [mcpCreating, setMcpCreating] = useState(false)
  const [mcpActionError, setMcpActionError] = useState<string | null>(null)
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<CreatedMcpTokenResponse | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)
  const [revokingTokenId, setRevokingTokenId] = useState<string | null>(null)
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null)

  // Estado de Notificações / Alertas (Etapa 3)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() =>
    resolveNotificationPreferences(user),
  )
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'default'
  })
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null)

  const loadTagsAndTasks = async () => {
    setTagsLoading(true)
    setListsLoading(true)
    try {
      const [allTags, allTasks, allLists] = await Promise.all([getTags(), getTasks(), getLists()])
      setTags(sortPrioritizedItems(allTags))
      setTasks(allTasks)
      setLists(sortPrioritizedItems(allLists))
    } catch (err) {
      console.error('Erro ao carregar etiquetas, listas e tarefas:', err)
    } finally {
      setTagsLoading(false)
      setListsLoading(false)
    }
  }

  const loadMcpTokens = async () => {
    setMcpLoading(true)
    try {
      const tokens = await getMcpTokens()
      setMcpTokens(tokens)
    } catch (err) {
      console.error('Erro ao carregar tokens MCP:', err)
    } finally {
      setMcpLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      setGoals(resolveWeeklyGoals(user))
      setNotifPrefs(resolveNotificationPreferences(user))
      loadTagsAndTasks()
      loadMcpTokens()
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission)
    }
  }, [user])

  const handleCreateMcpToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newMcpTokenName.trim()
    if (!trimmed) {
      setMcpActionError('Digite um nome para o token (ex: "Claude Code", "Gemini CLI").')
      return
    }
    setMcpCreating(true)
    setMcpActionError(null)
    try {
      const created = await createMcpToken(trimmed)
      setNewlyCreatedToken(created)
      setNewMcpTokenName('')
      await loadMcpTokens()
    } catch (err) {
      console.error('Erro ao criar token MCP:', err)
      setMcpActionError('Não foi possível gerar o token. Verifique os dados e tente novamente.')
    } finally {
      setMcpCreating(false)
    }
  }

  const handleRevokeMcpToken = async (token: McpTokenRecord) => {
    if (
      !window.confirm(
        `Deseja revogar o token "${token.name}"? Qualquer cliente (Claude, Gemini) conectado com este token perderá o acesso imediatamente.`,
      )
    ) {
      return
    }
    setRevokingTokenId(token.id)
    try {
      await revokeMcpToken(token.id)
      setMcpTokens((prev) => prev.map((t) => (t.id === token.id ? { ...t, revoked: true } : t)))
    } catch (err) {
      console.error('Erro ao revogar token:', err)
      setMcpActionError('Falha ao revogar token.')
    } finally {
      setRevokingTokenId(null)
    }
  }

  const handleDeleteMcpToken = async (token: McpTokenRecord) => {
    if (!window.confirm(`Excluir permanentemente o token "${token.name}"?`)) {
      return
    }
    setDeletingTokenId(token.id)
    try {
      await deleteMcpToken(token.id)
      setMcpTokens((prev) => prev.filter((t) => t.id !== token.id))
    } catch (err) {
      console.error('Erro ao excluir token:', err)
      setMcpActionError('Falha ao excluir token.')
    } finally {
      setDeletingTokenId(null)
    }
  }

  const handleCopyMcpUrl = () => {
    const url = getMcpServerUrl()
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const handleCopyRawToken = (tokenValue: string) => {
    navigator.clipboard.writeText(tokenValue)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const handleCreateTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newTagName.trim()
    if (!trimmed || !user?.id) return
    setTagCreating(true)
    setTagActionError(null)
    try {
      const created = await createTag({
        name: trimmed,
        user: user.id,
        color: newTagColor || getNextTagColor(tags.length),
      })
      setTags((prev) => [...prev, created])
      setNewTagName('')
      // Cicla para a próxima cor da paleta recomendada
      const nextIdx = (tags.length + 1) % TAG_PALETTE.length
      setNewTagColor(TAG_PALETTE[nextIdx].color)
    } catch (err) {
      console.error('Erro ao criar etiqueta:', err)
      setTagActionError('Não foi possível criar a etiqueta. Verifique o nome digitado.')
    } finally {
      setTagCreating(false)
    }
  }

  const handleStartEditTag = (tag: TagRecord) => {
    setEditingTagId(tag.id)
    setEditingTagName(tag.name)
    setEditingTagColor(tag.color)
  }

  const handleSaveEditTag = async () => {
    if (!editingTagId) return
    const trimmed = editingTagName.trim()
    if (!trimmed) {
      setTagActionError('O nome da etiqueta não pode ficar vazio.')
      return
    }
    try {
      const updated = await updateTag(editingTagId, {
        name: trimmed,
        color: editingTagColor,
      })
      setTags((prev) => prev.map((t) => (t.id === editingTagId ? updated : t)))
      setEditingTagId(null)
      setEditingTagName('')
      setEditingTagColor('')
      setTagActionError(null)
    } catch (err) {
      console.error('Erro ao atualizar etiqueta:', err)
      setTagActionError('Falha ao salvar etiqueta.')
    }
  }

  const handleToggleTagPin = async (tag: TagRecord) => {
    const nextPinned = !tag.pinned
    setTags((prev) =>
      sortPrioritizedItems(prev.map((t) => (t.id === tag.id ? { ...t, pinned: nextPinned } : t))),
    )
    try {
      await toggleTagPinned(tag.id, !!tag.pinned)
    } catch (err) {
      console.error('Erro ao alternar pin da etiqueta:', err)
      loadTagsAndTasks()
    }
  }

  const handleDeleteTag = async (tag: TagRecord) => {
    const count = tasks.filter((t) => Array.isArray(t.tags) && t.tags.includes(tag.id)).length
    const confirmMsg =
      count > 0
        ? `Excluir a etiqueta "${tag.name}"? Ela será removida de ${count} tarefa(s) vinculada(s).`
        : `Deseja excluir a etiqueta "${tag.name}"?`
    if (!window.confirm(confirmMsg)) return

    try {
      await deleteTag(tag.id)
      setTags((prev) => prev.filter((t) => t.id !== tag.id))
      // Atualiza lista local de tarefas desvinculadas
      setTasks((prev) =>
        prev.map((tk) => ({
          ...tk,
          tags: Array.isArray(tk.tags) ? tk.tags.filter((id) => id !== tag.id) : [],
        })),
      )
      if (editingTagId === tag.id) {
        setEditingTagId(null)
      }
    } catch (err) {
      console.error('Erro ao remover etiqueta:', err)
      setTagActionError('Não foi possível excluir a etiqueta.')
    }
  }

  // Operações de Listas
  const handleCreateList = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newListName.trim()
    if (!trimmed || !user?.id) return
    setListCreating(true)
    setListActionError(null)
    try {
      const created = await createList(trimmed, user.id, (lists.length + 1) * 10)
      setLists((prev) => sortPrioritizedItems([...prev, created]))
      setNewListName('')
    } catch (err) {
      console.error('Erro ao criar lista:', err)
      setListActionError('Não foi possível criar a lista. Verifique o nome digitado.')
    } finally {
      setListCreating(false)
    }
  }

  const handleStartEditList = (list: ListRecord) => {
    setEditingListId(list.id)
    setEditingListName(list.name)
  }

  const handleSaveEditList = async () => {
    if (!editingListId) return
    const trimmed = editingListName.trim()
    if (!trimmed) {
      setListActionError('O nome da lista não pode ficar vazio.')
      return
    }
    try {
      const updated = await updateList(editingListId, { name: trimmed })
      setLists((prev) =>
        sortPrioritizedItems(prev.map((l) => (l.id === editingListId ? updated : l))),
      )
      setEditingListId(null)
      setEditingListName('')
      setListActionError(null)
    } catch (err) {
      console.error('Erro ao atualizar lista:', err)
      setListActionError('Falha ao salvar lista.')
    }
  }

  const handleToggleListPin = async (list: ListRecord) => {
    const nextPinned = !list.pinned
    setLists((prev) =>
      sortPrioritizedItems(prev.map((l) => (l.id === list.id ? { ...l, pinned: nextPinned } : l))),
    )
    try {
      await toggleListPinned(list.id, !!list.pinned)
    } catch (err) {
      console.error('Erro ao alternar pin da lista:', err)
      loadTagsAndTasks()
    }
  }

  const handleDeleteList = async (list: ListRecord) => {
    const count = tasks.filter((t) => t.list === list.id).length
    const confirmMsg =
      count > 0
        ? `Excluir a lista "${list.name}"? Ela será desvinculada de ${count} tarefa(s).`
        : `Deseja excluir a lista "${list.name}"?`
    if (!window.confirm(confirmMsg)) return

    try {
      await deleteList(list.id)
      setLists((prev) => prev.filter((l) => l.id !== list.id))
      setTasks((prev) => prev.map((tk) => (tk.list === list.id ? { ...tk, list: '' } : tk)))
      if (editingListId === list.id) {
        setEditingListId(null)
      }
    } catch (err) {
      console.error('Erro ao remover lista:', err)
      setListActionError('Não foi possível excluir a lista.')
    }
  }

  const persistNotifPrefs = async (updated: NotificationPreferences) => {
    setNotifPrefs(updated)
    if (!user?.id) return
    setNotifSaving(true)
    try {
      await updateUserNotificationPreferences(user.id, updated)
      setNotifFeedback('Preferências salvas')
      setTimeout(() => setNotifFeedback(null), 2000)
    } catch (err) {
      console.error('Erro ao salvar preferências de notificação:', err)
    } finally {
      setNotifSaving(false)
    }
  }

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Seu navegador não suporta a Notification API.')
      return
    }

    try {
      const perm = await Notification.requestPermission()
      setBrowserPermission(perm)
      if (perm === 'granted') {
        persistNotifPrefs({ ...notifPrefs, enabled: true })
      } else if (perm === 'denied') {
        persistNotifPrefs({ ...notifPrefs, enabled: false })
      }
    } catch (err) {
      console.error('Erro ao pedir permissão de notificação:', err)
    }
  }

  const persistWeeklyGoals = async (updated: WeeklyFocusGoals, specificDay?: WeekdayKey) => {
    setGoals(updated)
    if (!user?.id) return

    if (specificDay) setSavingDay(specificDay)
    try {
      await updateUserWeeklyGoals(user.id, updated)
      if (specificDay) {
        setSavedFeedback(specificDay)
        setTimeout(() => setSavedFeedback(null), 1800)
      }
    } catch (err) {
      console.error('Erro ao salvar metas semanais:', err)
    } finally {
      if (specificDay) setSavingDay(null)
    }
  }

  const handleStep = (day: WeekdayKey, delta: number) => {
    const current = goals[day] ?? 0
    // se estiver em 0 e subir delta +15 => 15 min; limites 15..720 (ou 0 se zerar)
    let next = current + delta
    if (delta > 0 && current === 0) {
      next = 15
    } else if (delta < 0 && current <= 15) {
      next = 0 // permitir zerar (sem meta para aquele dia)
    } else {
      next = Math.min(720, Math.max(0, next))
    }
    const updated: WeeklyFocusGoals = { ...goals, [day]: next }
    persistWeeklyGoals(updated, day)
  }

  const handleStartEditing = (day: WeekdayKey) => {
    setEditing({ day, value: String(goals[day] ?? 0) })
  }

  const handleCommitEditing = () => {
    if (!editing.day) return
    const parsed = parseInt(editing.value, 10)
    let next = 0
    if (!Number.isNaN(parsed)) {
      if (parsed <= 0) next = 0
      else next = Math.min(720, Math.max(15, parsed))
    } else {
      next = goals[editing.day] ?? 0
    }
    const day = editing.day
    setEditing({ day: null, value: '' })
    const updated: WeeklyFocusGoals = { ...goals, [day]: next }
    persistWeeklyGoals(updated, day)
  }

  // Atalho: aplicar aos dias úteis (Seg a Sex)
  const applyToWeekdays = async () => {
    const baseValue = goals.seg || 120
    const updated: WeeklyFocusGoals = {
      ...goals,
      seg: baseValue,
      ter: baseValue,
      qua: baseValue,
      qui: baseValue,
      sex: baseValue,
    }
    await persistWeeklyGoals(updated)
    setBulkFeedback('Dias úteis atualizados com a meta de Segunda')
    setTimeout(() => setBulkFeedback(null), 2400)
  }

  // Atalho: aplicar ao fim de semana (Sáb e Dom)
  const applyToWeekend = async () => {
    const baseValue = goals.sab ?? 60
    const updated: WeeklyFocusGoals = {
      ...goals,
      sab: baseValue,
      dom: baseValue,
    }
    await persistWeeklyGoals(updated)
    setBulkFeedback('Fim de semana sincronizado com a meta de Sábado')
    setTimeout(() => setBulkFeedback(null), 2400)
  }

  const totalWeeklyMinutes = (Object.values(goals) as number[]).reduce(
    (acc: number, v: number) => acc + (Number(v) || 0),
    0,
  )
  const activeDaysCount = (Object.values(goals) as number[]).filter(
    (v: number) => Number(v) > 0,
  ).length

  // Seções disponíveis filtradas pela busca
  const sections = [
    {
      id: 'produtividade',
      label: 'Produtividade & Alertas',
      desc: 'Metas de foco, horários e notificações',
      icon: TrendingUp,
    },
    {
      id: 'etiquetas',
      label: 'Etiquetas & Tags',
      desc: 'Cores, prioridade 80/20 e tarefas vinculadas',
      icon: Tag,
    },
    {
      id: 'listas',
      label: 'Listas & Projetos',
      desc: 'Organização estrutural, prioridade e tarefas',
      icon: Folder,
    },
    {
      id: 'integracoes',
      label: 'Integrações & MCP',
      desc: 'Servidor MCP, tokens de acesso e agentes AI',
      icon: Cpu,
    },
    {
      id: 'conta',
      label: 'Conta',
      desc: 'Perfil e credenciais de acesso',
      icon: User,
    },
    {
      id: 'documentacao',
      label: 'Documentação',
      desc: 'Guia do sistema, arquitetura e atalhos',
      icon: BookOpen,
      isExternalLink: true,
      onClick: () => navigate('/docs'),
    },
  ]

  const filteredSections = sections.filter(
    (s) =>
      s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const initials = String(user?.name || user?.email || 'U')
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="page settings-page">
      <header className="view-title">
        <div>
          <h1>Configurações</h1>
          <span>PREFERÊNCIAS E METAS DO SISTEMA</span>
        </div>
      </header>

      <div className="settings-container">
        {/* SIDEBAR ESQUERDA ESTILO TODOIST */}
        <aside className="settings-sidebar">
          <div className="settings-search-wrap">
            <Search className="settings-search-icon" />
            <input
              type="text"
              placeholder="Buscar configurações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="settings-search-input"
            />
          </div>

          <nav className="settings-nav">
            {filteredSections.map((sec) => {
              const Icon = sec.icon
              const isActive = !sec.isExternalLink && activeTab === sec.id
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    if (sec.onClick) {
                      sec.onClick()
                    } else {
                      setActiveTab(sec.id as SettingsTab)
                    }
                  }}
                  className={`settings-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="settings-nav-icon" />
                  <div className="settings-nav-meta">
                    <span className="settings-nav-label">{sec.label}</span>
                    <span className="settings-nav-sub">{sec.desc}</span>
                  </div>
                  {sec.isExternalLink && (
                    <ArrowRight className="w-3.5 h-3.5 text-[#71717A] ml-auto flex-none" />
                  )}
                </button>
              )
            })}
          </nav>

          <div className="settings-sidebar-summary">
            <span className="summary-label">META SEMANAL TOTAL</span>
            <b className="summary-value">{formatMinutes(totalWeeklyMinutes)}</b>
            <span className="summary-sub">{activeDaysCount} de 7 dias com foco programado</span>
          </div>
        </aside>

        {/* PAINEL DIREITO DE CONTEÚDO */}
        <section className="settings-content">
          {activeTab === 'produtividade' && (
            <div className="settings-panel productivity-panel">
              <header className="panel-header">
                <div>
                  <h2>Produtividade</h2>
                  <p>
                    Defina objetivos de foco dedicados para cada dia da semana. Metas personalizadas
                    permitem calibrar o esforço entre dias de pico comercial e dias de descanso.
                  </p>
                </div>
              </header>

              {/* Bloco de atalhos e resumo */}
              <div className="productivity-hero-card">
                <div className="hero-stat-item">
                  <span className="stat-label">TOTAL PROGRAMADO NA SEMANA</span>
                  <div className="stat-val-group">
                    <b className="stat-val">{formatMinutes(totalWeeklyMinutes)}</b>
                    <span className="stat-pill">{Math.round(totalWeeklyMinutes / 60)} HORAS</span>
                  </div>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat-item">
                  <span className="stat-label">RITMO ESTIMADO</span>
                  <div className="stat-val-group">
                    <b className="stat-val">
                      {activeDaysCount > 0
                        ? formatMinutes(Math.round(totalWeeklyMinutes / activeDaysCount))
                        : '0m'}
                    </b>
                    <span className="stat-pill-sub">MÉDIA / DIA ATIVO</span>
                  </div>
                </div>
              </div>

              {/* SEÇÃO PRINCIPAL: META DE FOCO POR DIA DA SEMANA */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <div>
                    <div className="card-tag">OBJETIVOS DIÁRIOS DE FOCO</div>
                    <h3>Metas por dia da semana</h3>
                    <p>
                      Ajuste granular de 15 min a 12 horas por dia (ou 0 min para folga sem meta). O
                      Histórico utilizará automaticamente a meta correspondente ao dia de hoje.
                    </p>
                  </div>
                  <div className="bulk-actions">
                    {' '}
                    <button
                      type="button"
                      onClick={applyToWeekdays}
                      className="bulk-btn"
                      title="Copia a meta de Segunda-feira para Terça a Sexta"
                    >
                      <Sparkles size={13} />
                      <span>Copiar Seg para úteis</span>
                    </button>
                    <button
                      type="button"
                      onClick={applyToWeekend}
                      className="bulk-btn"
                      title="Sincroniza Sábado e Domingo"
                    >
                      <Calendar size={13} />
                      <span>Sincronizar fim de semana</span>
                    </button>
                  </div>
                </div>

                {bulkFeedback && <div className="bulk-alert">{bulkFeedback}</div>}

                {/* Grade dos 7 dias */}
                <div className="weekday-goals-grid">
                  {WEEKDAY_ORDER.map((day) => {
                    const label = WEEKDAY_LABELS[day]
                    const val = goals[day] ?? 0
                    const isSaving = savingDay === day
                    const isSaved = savedFeedback === day
                    const isZero = val === 0
                    const isCurrentEditing = editing.day === day

                    return (
                      <div key={day} className={`weekday-goal-row ${isZero ? 'is-off' : ''}`}>
                        <div className="weekday-identity">
                          <div className="weekday-badge">{label.short}</div>
                          <div className="weekday-details">
                            <span className="weekday-fullname">{label.long}</span>
                            <span className="weekday-substatus">
                              {isZero
                                ? 'Sem meta configurada (folga)'
                                : `${formatMinutes(val)} de foco`}
                            </span>
                          </div>
                        </div>

                        <div className="weekday-stepper-wrap">
                          {isCurrentEditing ? (
                            <div className="goal-input-wrap settings-input-wrap">
                              <input
                                type="number"
                                min={0}
                                max={720}
                                step={15}
                                value={editing.value}
                                autoFocus
                                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                onBlur={handleCommitEditing}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCommitEditing()
                                  if (e.key === 'Escape') setEditing({ day: null, value: '' })
                                }}
                                className="goal-input"
                              />
                              <span className="goal-unit">MIN</span>
                            </div>
                          ) : (
                            <div className="goal-stepper-control settings-stepper">
                              <button
                                type="button"
                                onClick={() => handleStep(day, -15)}
                                disabled={val <= 0 || isSaving}
                                aria-label={`Diminuir meta de ${label.long}`}
                                className="goal-step-btn"
                              >
                                −
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEditing(day)}
                                className="goal-value-btn settings-value-btn"
                                title="Clique para digitar os minutos diretamente"
                              >
                                <b>{isZero ? 'SEM META' : formatMinutes(val)}</b>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStep(day, 15)}
                                disabled={val >= 720 || isSaving}
                                aria-label={`Aumentar meta de ${label.long}`}
                                className="goal-step-btn"
                              >
                                +
                              </button>
                            </div>
                          )}

                          <div className="feedback-slot">
                            {isSaved && <span className="goal-feedback">SALVO</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SEÇÃO ALERTAS E NOTIFICAÇÕES (ETAPA 3) */}
              <div className="settings-section-card notif-section-card">
                <div className="section-card-header">
                  <div>
                    <div className="card-tag">ALERTAS & NOTIFICAÇÕES (ETAPA 3)</div>
                    <h3>Lembretes do Navegador & Som</h3>
                    <p>
                      Receba avisos pontuais de tarefas com horário quando o Barbosa System estiver
                      aberto na aba. Inclui alerta nativo do navegador e áudio suave Web Audio.
                    </p>
                  </div>
                  {notifFeedback && <span className="goal-feedback">{notifFeedback}</span>}
                </div>

                <div className="notif-controls-list">
                  {/* Item 1: Ativação / Permissão */}
                  <div className="notif-control-row">
                    <div className="notif-control-info">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#C5A880]" />
                        <span className="notif-control-title">Notificações do Navegador</span>
                      </div>
                      <span className="notif-control-sub">
                        Status de permissão no navegador:{' '}
                        <strong className="uppercase">
                          {browserPermission === 'granted'
                            ? 'Permitido'
                            : browserPermission === 'denied'
                              ? 'Bloqueado no navegador'
                              : 'Pendente de autorização'}
                        </strong>
                      </span>
                    </div>

                    <div className="notif-control-action">
                      {browserPermission !== 'granted' ? (
                        <button
                          type="button"
                          className="primary notif-permit-btn"
                          onClick={handleRequestPermission}
                        >
                          Autorizar no navegador
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`notif-toggle-btn ${notifPrefs.enabled ? 'active' : ''}`}
                          onClick={() =>
                            persistNotifPrefs({ ...notifPrefs, enabled: !notifPrefs.enabled })
                          }
                          disabled={notifSaving}
                        >
                          {notifPrefs.enabled ? 'ATIVADO' : 'DESATIVADO'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Item 2: Antecedência configurável */}
                  <div className="notif-control-row">
                    <div className="notif-control-info">
                      <span className="notif-control-title">Antecedência do Lembrete</span>
                      <span className="notif-control-sub">
                        Tempo antes do horário agendado da tarefa em que o aviso será disparado.
                      </span>
                    </div>

                    <div className="notif-pills-row">
                      {[
                        { val: 0, label: 'Na hora exata' },
                        { val: 5, label: '5 min antes' },
                        { val: 10, label: '10 min antes' },
                        { val: 15, label: '15 min antes' },
                      ].map((item) => {
                        const isSel = notifPrefs.lead_minutes === item.val
                        return (
                          <button
                            key={item.val}
                            type="button"
                            className={`notif-lead-pill ${isSel ? 'active' : ''}`}
                            onClick={() =>
                              persistNotifPrefs({ ...notifPrefs, lead_minutes: item.val })
                            }
                          >
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Item 3: Som Web Audio */}
                  <div className="notif-control-row">
                    <div className="notif-control-info">
                      <div className="flex items-center gap-2">
                        {notifPrefs.sound_enabled ? (
                          <Volume2 className="w-4 h-4 text-[#C5A880]" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-[#a1a1aa]" />
                        )}
                        <span className="notif-control-title">Efeito Sonoro Suave (Web Audio)</span>
                      </div>
                      <span className="notif-control-sub">
                        Toca um acorde harmônico suave e discreto quando a notificação disparar.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="notif-test-sound-btn"
                        onClick={() => playReminderSound()}
                        title="Ouvir som de lembrete agora"
                      >
                        Testar som
                      </button>
                      <button
                        type="button"
                        className={`notif-toggle-btn ${notifPrefs.sound_enabled ? 'active' : ''}`}
                        onClick={() =>
                          persistNotifPrefs({
                            ...notifPrefs,
                            sound_enabled: !notifPrefs.sound_enabled,
                          })
                        }
                      >
                        {notifPrefs.sound_enabled ? 'SOM LIGADO' : 'MUDO'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cartão de integração com Histórico */}
              <div className="settings-info-card">
                <div className="info-icon-wrap">
                  <Sliders size={18} />
                </div>
                <div className="info-text">
                  <h4>Sincronização em Tempo Real</h4>
                  <p>
                    As alterações salvas aqui são refletidas imediatamente no cartão "META DO DIA"
                    da página Histórico. Aos sábados ou domingos com meta reduzida ou zerada, a
                    barra de progresso do histórico adapta-se à rotina planejada.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'etiquetas' && (
            <div className="settings-panel tags-panel">
              <header className="panel-header">
                <div>
                  <h2>Gerenciamento de Etiquetas</h2>
                  <p>
                    Crie, renomeie, personalize cores e visualize a contagem de tarefas vinculadas a
                    cada etiqueta do sistema. Padrão minimalista e integrado às capturas do Barbosa
                    System.
                  </p>
                </div>
              </header>

              {/* CARD: CRIAR NOVA ETIQUETA */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <div>
                    <div className="card-tag">NOVA ETIQUETA</div>
                    <h3>Adicionar ao acervo</h3>
                    <p>
                      Defina um nome e escolha uma das cores recomendadas da paleta suave do
                      sistema.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateTag} className="tag-create-form">
                  <div className="tag-input-group">
                    <div className="tag-input-field-wrap">
                      <Hash size={14} className="tag-input-icon" />
                      <input
                        type="text"
                        placeholder="Nome da etiqueta (ex.: Backend, Foco Profundo, Pessoal)..."
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="tag-text-input"
                      />
                    </div>

                    <div className="tag-color-picker-row">
                      <span className="tag-color-label">COR:</span>
                      <div className="tag-palette-bubbles">
                        {TAG_PALETTE.map((pal) => {
                          const isSelected = newTagColor.toLowerCase() === pal.color.toLowerCase()
                          return (
                            <button
                              key={pal.name}
                              type="button"
                              onClick={() => setNewTagColor(pal.color)}
                              className={`tag-color-bubble ${isSelected ? 'active' : ''}`}
                              style={{ backgroundColor: pal.color }}
                              title={`${pal.name} (${pal.color})`}
                              aria-label={pal.name}
                            >
                              {isSelected && <Check size={11} className="tag-bubble-check" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!newTagName.trim() || tagCreating}
                      className="primary tag-create-btn"
                    >
                      <Plus size={14} />
                      <span>{tagCreating ? 'Criando...' : 'Criar etiqueta'}</span>
                    </button>
                  </div>
                </form>

                {tagActionError && (
                  <div className="tag-error-banner">
                    <AlertCircle size={14} />
                    <span>{tagActionError}</span>
                  </div>
                )}
              </div>

              {/* CARD: LISTA DE ETIQUETAS EXISTENTES */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <div>
                    <div className="card-tag">ACERVO CADASTRADO</div>
                    <h3>Etiquetas em uso ({tags.length})</h3>
                    <p>
                      Visualize a quantidade de tarefas em que cada etiqueta é utilizada, edite seus
                      nomes ou cores e remova etiquetas que não usa mais.
                    </p>
                  </div>

                  <div className="tag-list-search-wrap">
                    <Search size={13} className="text-[#a1a1aa]" />
                    <input
                      type="text"
                      placeholder="Filtrar etiquetas..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      className="tag-list-search-input"
                    />
                  </div>
                </div>

                {tagsLoading ? (
                  <div className="tags-loading-state">
                    <span>Carregando etiquetas do sistema...</span>
                  </div>
                ) : tags.length === 0 ? (
                  <div className="tags-empty-state">
                    <Tag size={24} className="text-[#C5A880]/50 mb-2" />
                    <h4>Nenhuma etiqueta cadastrada</h4>
                    <p>
                      Crie sua primeira etiqueta acima para organizar suas tarefas por contexto ou
                      tema.
                    </p>
                  </div>
                ) : (
                  <div className="tags-table-wrap">
                    <div className="tags-table-header">
                      <span className="col-tag">ETIQUETA</span>
                      <span className="col-color">CÓDIGO HEX</span>
                      <span className="col-count">TAREFAS</span>
                      <span className="col-pin">80/20</span>
                      <span className="col-actions">AÇÕES</span>
                    </div>

                    <div className="tags-table-body">
                      {tags
                        .filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                        .map((tag) => {
                          const isEditing = editingTagId === tag.id
                          const isPinned = !!tag.pinned
                          const linkedCount = tasks.filter(
                            (tk) => Array.isArray(tk.tags) && tk.tags.includes(tag.id),
                          ).length

                          if (isEditing) {
                            return (
                              <div key={tag.id} className="tags-table-row editing">
                                <div className="col-tag">
                                  <input
                                    type="text"
                                    value={editingTagName}
                                    onChange={(e) => setEditingTagName(e.target.value)}
                                    className="tag-edit-input"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEditTag()
                                      if (e.key === 'Escape') setEditingTagId(null)
                                    }}
                                  />
                                </div>
                                <div className="col-color">
                                  <div className="tag-palette-bubbles sm">
                                    {TAG_PALETTE.map((pal) => {
                                      const isSel =
                                        editingTagColor.toLowerCase() === pal.color.toLowerCase()
                                      return (
                                        <button
                                          key={pal.name}
                                          type="button"
                                          onClick={() => setEditingTagColor(pal.color)}
                                          className={`tag-color-bubble sm ${isSel ? 'active' : ''}`}
                                          style={{ backgroundColor: pal.color }}
                                          title={pal.name}
                                        />
                                      )
                                    })}
                                  </div>
                                </div>
                                <div className="col-count">
                                  <span className="tag-task-badge">{linkedCount} tarefa(s)</span>
                                </div>
                                <div className="col-pin">
                                  <span className="text-xs text-[#71717A]">—</span>
                                </div>
                                <div className="col-actions">
                                  <button
                                    type="button"
                                    onClick={handleSaveEditTag}
                                    className="tag-action-icon-btn save"
                                    title="Salvar alterações"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTagId(null)}
                                    className="tag-action-icon-btn cancel"
                                    title="Cancelar edição"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div key={tag.id} className="tags-table-row">
                              <div className="col-tag">
                                <div className="tag-pill-preview">
                                  <span
                                    className="tag-dot-indicator"
                                    style={{ backgroundColor: tag.color || '#C5A880' }}
                                  />
                                  <span className="tag-name-text">{tag.name}</span>
                                </div>
                              </div>
                              <div className="col-color">
                                <code className="tag-hex-code">{tag.color || '#C5A880'}</code>
                              </div>
                              <div className="col-count">
                                <span
                                  className={`tag-task-badge ${linkedCount > 0 ? 'has-tasks' : ''}`}
                                >
                                  {linkedCount} {linkedCount === 1 ? 'tarefa' : 'tarefas'}
                                </span>
                              </div>
                              <div className="col-pin">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTagPin(tag)}
                                  className={`settings-pin-btn ${isPinned ? 'pinned' : ''}`}
                                  title={
                                    isPinned
                                      ? 'Etiqueta prioritária (80/20) · Clique para desmarcar'
                                      : 'Fixar como prioritária no topo (80/20)'
                                  }
                                >
                                  <Pin size={13} />
                                  <span>{isPinned ? 'Prioritária' : 'Normal'}</span>
                                </button>
                              </div>
                              <div className="col-actions">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditTag(tag)}
                                  className="tag-action-icon-btn"
                                  title="Editar etiqueta"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTag(tag)}
                                  className="tag-action-icon-btn danger"
                                  title="Excluir etiqueta"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* DICA DE USABILIDADE / ATALHOS */}
              <div className="settings-info-card">
                <div className="info-icon-wrap">
                  <Tag size={18} />
                </div>
                <div className="info-text">
                  <h4>Priorização 80/20 & Captura Rápida com # na Barra</h4>
                  <p>
                    Marque etiquetas estratégicas (ex.: <code>Big3</code>,{' '}
                    <code>Foco Profundo</code>) como <strong>Prioritária</strong> para fixá-las no
                    topo da sidebar com destaque champagne. Ao digitar uma nova tarefa na barra
                    superior, use a hashtag (ex.: <code>Planejar sprint #Big3 amanhã às 14h</code>).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'listas' && (
            <div className="settings-panel lists-panel">
              <header className="panel-header">
                <div>
                  <h2>Gerenciamento de Listas & Projetos</h2>
                  <p>
                    Crie, renomeie, defina prioridade 80/20 e gerencie as listas e projetos do
                    Barbosa System. A sidebar reflete a ordem e a fixação prioritária
                    instantaneamente.
                  </p>
                </div>
              </header>

              {/* CARD: CRIAR NOVA LISTA */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <div>
                    <div className="card-tag">NOVA LISTA</div>
                    <h3>Criar lista ou projeto</h3>
                    <p>Defina o nome da nova lista estrutural de tarefas.</p>
                  </div>
                </div>

                <form onSubmit={handleCreateList} className="tag-create-form">
                  <div className="tag-input-group">
                    <div className="tag-input-field-wrap">
                      <Folder size={14} className="tag-input-icon text-[#C5A880]" />
                      <input
                        type="text"
                        placeholder="Nome da lista (ex.: Trabalho, Estudos, Pessoal, Big3)..."
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="tag-text-input"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!newListName.trim() || listCreating}
                      className="primary tag-create-btn"
                    >
                      <Plus size={14} />
                      <span>{listCreating ? 'Criando...' : 'Criar lista'}</span>
                    </button>
                  </div>
                </form>

                {listActionError && (
                  <div className="tag-error-banner">
                    <AlertCircle size={14} />
                    <span>{listActionError}</span>
                  </div>
                )}
              </div>

              {/* CARD: LISTA DE LISTAS EXISTENTES */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <div>
                    <div className="card-tag">LISTAS CADASTRADAS</div>
                    <h3>Acervo de listas ({lists.length})</h3>
                    <p>
                      Visualize a quantidade de tarefas em cada lista, altere o status de prioridade
                      80/20, renomeie ou remova listas descontinuadas.
                    </p>
                  </div>

                  <div className="tag-list-search-wrap">
                    <Search size={13} className="text-[#a1a1aa]" />
                    <input
                      type="text"
                      placeholder="Filtrar listas..."
                      value={listSearch}
                      onChange={(e) => setListSearch(e.target.value)}
                      className="tag-list-search-input"
                    />
                  </div>
                </div>

                {listsLoading ? (
                  <div className="tags-loading-state">
                    <span>Carregando listas do sistema...</span>
                  </div>
                ) : lists.length === 0 ? (
                  <div className="tags-empty-state">
                    <Folder size={24} className="text-[#C5A880]/50 mb-2" />
                    <h4>Nenhuma lista cadastrada</h4>
                    <p>Crie sua primeira lista acima para agrupar e organizar suas tarefas.</p>
                  </div>
                ) : (
                  <div className="tags-table-wrap">
                    <div className="tags-table-header">
                      <span className="col-tag">LISTA</span>
                      <span className="col-count">TAREFAS VINCULADAS</span>
                      <span className="col-pin">80/20</span>
                      <span className="col-actions">AÇÕES</span>
                    </div>

                    <div className="tags-table-body">
                      {lists
                        .filter((l) => l.name.toLowerCase().includes(listSearch.toLowerCase()))
                        .map((list) => {
                          const isEditing = editingListId === list.id
                          const isPinned = !!list.pinned
                          const linkedCount = tasks.filter((tk) => tk.list === list.id).length

                          if (isEditing) {
                            return (
                              <div key={list.id} className="tags-table-row editing">
                                <div className="col-tag">
                                  <input
                                    type="text"
                                    value={editingListName}
                                    onChange={(e) => setEditingListName(e.target.value)}
                                    className="tag-edit-input"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEditList()
                                      if (e.key === 'Escape') setEditingListId(null)
                                    }}
                                  />
                                </div>
                                <div className="col-count">
                                  <span className="tag-task-badge">{linkedCount} tarefa(s)</span>
                                </div>
                                <div className="col-pin">
                                  <span className="text-xs text-[#71717A]">—</span>
                                </div>
                                <div className="col-actions">
                                  <button
                                    type="button"
                                    onClick={handleSaveEditList}
                                    className="tag-action-icon-btn save"
                                    title="Salvar alterações"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingListId(null)}
                                    className="tag-action-icon-btn cancel"
                                    title="Cancelar edição"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div key={list.id} className="tags-table-row">
                              <div className="col-tag">
                                <div className="tag-pill-preview">
                                  <span className="font-mono text-[#C5A880] font-bold text-xs">
                                    #
                                  </span>
                                  <span className="tag-name-text">{list.name}</span>
                                </div>
                              </div>
                              <div className="col-count">
                                <span
                                  className={`tag-task-badge ${linkedCount > 0 ? 'has-tasks' : ''}`}
                                >
                                  {linkedCount} {linkedCount === 1 ? 'tarefa' : 'tarefas'}
                                </span>
                              </div>
                              <div className="col-pin">
                                <button
                                  type="button"
                                  onClick={() => handleToggleListPin(list)}
                                  className={`settings-pin-btn ${isPinned ? 'pinned' : ''}`}
                                  title={
                                    isPinned
                                      ? 'Lista prioritária (80/20) · Clique para desmarcar'
                                      : 'Fixar como prioritária no topo (80/20)'
                                  }
                                >
                                  <Pin size={13} />
                                  <span>{isPinned ? 'Prioritária' : 'Normal'}</span>
                                </button>
                              </div>
                              <div className="col-actions">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditList(list)}
                                  className="tag-action-icon-btn"
                                  title="Editar lista"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteList(list)}
                                  className="tag-action-icon-btn danger"
                                  title="Excluir lista"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* DICA */}
              <div className="settings-info-card">
                <div className="info-icon-wrap">
                  <Folder size={18} />
                </div>
                <div className="info-text">
                  <h4>Priorização 80/20 na Sidebar</h4>
                  <p>
                    Listas marcadas como prioritárias são fixadas imediatamente no topo da seção
                    LISTAS da barra lateral. Você pode ordená-las por arrastar e soltar livremente
                    tanto no desktop quanto no mobile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integracoes' && (
            <div className="settings-panel integrations-panel">
              <header className="panel-header">
                <div>
                  <h2>Integrações & Servidor MCP</h2>
                  <p>
                    Conecte o Claude Code, Claude Desktop ou Gemini CLI ao seu Barbosa System usando
                    o protocolo aberto Model Context Protocol (MCP) com autenticação pessoal Bearer.
                  </p>
                </div>
              </header>

              {/* BLOCO 1: URL DO SERVIDOR MCP */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <div>
                    <div className="card-tag">TRANSPORTE STREAMABLE HTTP</div>
                    <h3>URL do Servidor MCP</h3>
                    <p>
                      Endpoint compatível com clientes JSON-RPC 2.0 (Streamable HTTP / SSE) com
                      isolamento estrito de dados para a sua conta.
                    </p>
                  </div>
                </div>

                <div className="mcp-url-box flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 bg-[#121214] border border-[#27272A] rounded-md">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono tracking-wider text-[#A1A1AA] uppercase block mb-1">
                      ENDPOINT OFICIAL MCP
                    </span>
                    <code className="text-xs sm:text-sm font-mono text-[#C5A880] break-all select-all">
                      {getMcpServerUrl()}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyMcpUrl}
                    className="flex-none inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#1C1C1F] hover:bg-[#27272A] border border-[#3F3F46] text-[#E4E4E7] text-xs font-mono rounded transition-colors"
                    title="Copiar URL do endpoint MCP"
                  >
                    {copiedUrl ? (
                      <>
                        <Check size={14} className="text-[#C5A880]" />
                        <span>COPIADO</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>COPIAR URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* MODAL / BANNER DE NOVO TOKEN GERADO (EXIBE UMA ÚNICA VEZ) */}
              {newlyCreatedToken && (
                <div className="mcp-token-banner p-4 rounded-md border border-[#C5A880]/50 bg-[#171511] mb-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#C5A880]" />
                      <h4 className="text-sm font-semibold text-[#F4F4F5]">
                        Token &quot;{newlyCreatedToken.name}&quot; Gerado com Sucesso
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewlyCreatedToken(null)}
                      className="text-[#A1A1AA] hover:text-[#F4F4F5] p-1"
                      title="Fechar aviso de token gerado"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mb-3">
                    Este valor <strong>nunca mais será exibido</strong>. O Barbosa System armazena
                    apenas o hash criptográfico seguro (SHA-256). Copie agora e guarde na sua
                    configuração do Claude ou Gemini:
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-[#0D0D0E] border border-[#C5A880]/40 rounded font-mono text-xs">
                    <code className="flex-1 text-[#C5A880] break-all select-all">
                      {newlyCreatedToken.raw_token}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyRawToken(newlyCreatedToken.raw_token)}
                      className="flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#C5A880] hover:bg-[#D8C7B0] text-[#121214] font-medium text-xs rounded transition-colors"
                    >
                      {copiedToken ? (
                        <>
                          <Check size={13} />
                          <span>COPIADO</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>COPIAR TOKEN</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* BLOCO 2: FORMULÁRIO DE NOVO TOKEN E LISTAGEM */}
              <div className="settings-section-card">
                <div className="section-card-header">
                  <div>
                    <div className="card-tag">CREDENCIAS PESSOAIS (BEARER)</div>
                    <h3>Tokens de Acesso Pessoal</h3>
                    <p>
                      Conecte o Claude Code, Claude Desktop ou Gemini CLI ao seu Barbosa System
                      usando este token como Bearer. Cada token opera de forma restrita e segura sob
                      o seu usuário.
                    </p>
                  </div>
                </div>

                {mcpActionError && (
                  <div className="p-3 mb-4 rounded bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-center gap-2">
                    <AlertCircle size={14} className="flex-none" />
                    <span>{mcpActionError}</span>
                  </div>
                )}

                {/* Formulário de criação inline */}
                <form onSubmit={handleCreateMcpToken} className="mb-6">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Nome do token (ex: Claude Desktop, Gemini CLI, Terminal Pessoal)..."
                        value={newMcpTokenName}
                        onChange={(e) => setNewMcpTokenName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#121214] border border-[#27272A] focus:border-[#C5A880] focus:outline-none rounded text-sm text-[#F4F4F5] placeholder-[#71717A]"
                        maxLength={100}
                        disabled={mcpCreating}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={mcpCreating || !newMcpTokenName.trim()}
                      className="flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C5A880] hover:bg-[#D8C7B0] disabled:opacity-40 disabled:hover:bg-[#C5A880] text-[#121214] text-xs font-semibold uppercase tracking-wider rounded transition-colors"
                    >
                      <Plus size={15} />
                      <span>{mcpCreating ? 'Gerando...' : 'Criar Token'}</span>
                    </button>
                  </div>
                </form>

                {/* Lista de Tokens */}
                <div className="mcp-tokens-list">
                  {mcpLoading ? (
                    <div className="py-8 text-center text-xs text-[#71717A] font-mono">
                      CARREGANDO TOKENS MCP...
                    </div>
                  ) : mcpTokens.length === 0 ? (
                    <div className="py-8 px-4 text-center border border-dashed border-[#27272A] rounded-md bg-[#121214]/50">
                      <Cpu size={24} className="mx-auto text-[#71717A] mb-2 opacity-50" />
                      <p className="text-xs text-[#A1A1AA] mb-1">
                        Nenhum token MCP criado até o momento.
                      </p>
                      <span className="text-[11px] text-[#71717A]">
                        Gere um token acima para conectar agentes inteligentes ao Barbosa System.
                      </span>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#27272A] border border-[#27272A] rounded-md overflow-hidden bg-[#121214]">
                      {mcpTokens.map((token) => {
                        const isRevoked = !!token.revoked
                        const isRevoking = revokingTokenId === token.id
                        const isDeleting = deletingTokenId === token.id

                        return (
                          <div
                            key={token.id}
                            className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isRevoked ? 'opacity-60 bg-[#161618]/50' : 'hover:bg-[#18181B]'
                            } transition-colors`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-[#F4F4F5] truncate">
                                  {token.name}
                                </span>
                                {isRevoked ? (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/60 text-red-300 uppercase">
                                    REVOGADO
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C5A880]/10 border border-[#C5A880]/30 text-[#C5A880] uppercase">
                                    ATIVO
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-[#71717A]">
                                <span>
                                  Criado em:{' '}
                                  <strong className="text-[#A1A1AA]">
                                    {new Date(token.created).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })}
                                  </strong>
                                </span>
                                <span>·</span>
                                <span>
                                  Último uso:{' '}
                                  <strong className="text-[#A1A1AA]">
                                    {token.last_used_at
                                      ? new Date(token.last_used_at).toLocaleDateString('pt-BR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : 'Nunca utilizado'}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-none">
                              {!isRevoked && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeMcpToken(token)}
                                  disabled={isRevoking}
                                  className="px-2.5 py-1.5 text-xs text-[#A1A1AA] hover:text-red-300 hover:bg-red-950/40 border border-[#27272A] hover:border-red-800/60 rounded transition-colors"
                                  title="Revogar este token imediatamente"
                                >
                                  {isRevoking ? 'Revogando...' : 'Revogar'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteMcpToken(token)}
                                disabled={isDeleting}
                                className="p-1.5 text-[#71717A] hover:text-red-400 hover:bg-[#27272A] rounded transition-colors"
                                title="Excluir registro do token"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 3: 7 FERRAMENTAS MCP NUCLEARES DISPONÍVEIS */}
              <div className="settings-info-card">
                <div className="info-icon-wrap">
                  <Cpu size={18} />
                </div>
                <div className="info-text">
                  <h4>7 Ferramentas MCP Ativas no Servidor</h4>
                  <p className="mb-2">
                    O servidor MCP do Barbosa System expõe nativamente 7 operações idempotentes
                    executadas sobre o banco de dados do usuário:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-[#A1A1AA] mt-2">
                    <div className="p-2 rounded bg-[#121214] border border-[#27272A]">
                      <strong className="text-[#C5A880]">create_task</strong>: título, data, hora,
                      prioridade, lista e tags
                    </div>
                    <div className="p-2 rounded bg-[#121214] border border-[#27272A]">
                      <strong className="text-[#C5A880]">list_tasks</strong>: filtros por visão
                      (hoje/amanhã/inbox/semana), tag, lista e status
                    </div>
                    <div className="p-2 rounded bg-[#121214] border border-[#27272A]">
                      <strong className="text-[#C5A880]">complete_task</strong>: conclusão com
                      cálculo automático de recorrência
                    </div>
                    <div className="p-2 rounded bg-[#121214] border border-[#27272A]">
                      <strong className="text-[#C5A880]">update_task</strong>: ajuste de campos e
                      metadados da tarefa
                    </div>
                    <div className="p-2 rounded bg-[#121214] border border-[#27272A]">
                      <strong className="text-[#C5A880]">delete_task</strong>: remoção de tarefas do
                      usuário
                    </div>
                    <div className="p-2 rounded bg-[#121214] border border-[#27272A]">
                      <strong className="text-[#C5A880]">get_focus_summary</strong>: métricas de
                      foco, minutos e melhor dia (recorde)
                    </div>
                    <div className="p-2 rounded bg-[#121214] border border-[#27272A] sm:col-span-2">
                      <strong className="text-[#C5A880]">log_focus_session</strong>: registro de
                      sessão com duração, nota e vínculo de tarefa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conta' && (
            <div className="settings-panel account-panel">
              <header className="panel-header">
                <div>
                  <h2>Conta & Perfil</h2>
                  <p>Informações de autenticação e identidade de usuário no Barbosa System.</p>
                </div>
              </header>

              <div className="settings-section-card">
                <div className="account-profile-header">
                  <div className="account-avatar-large">{initials}</div>
                  <div className="account-profile-info">
                    <h3>{String(user?.name || 'Usuário')}</h3>
                    <span className="account-email">{String(user?.email || '')}</span>
                    <div className="account-badge-verified">
                      <ShieldCheck size={13} />
                      <span>Conta Ativa & Verificada</span>
                    </div>
                  </div>
                </div>

                <div className="account-fields-grid">
                  <div className="account-field-item">
                    <span className="field-item-label">ID NO SISTEMA</span>
                    <code className="field-item-code">{user?.id || '—'}</code>
                  </div>
                  <div className="account-field-item">
                    <span className="field-item-label">E-MAIL PRINCIPAL</span>
                    <div className="field-item-val">
                      <Mail size={13} />
                      <span>{user?.email || '—'}</span>
                    </div>
                  </div>
                  <div className="account-field-item">
                    <span className="field-item-label">PROVEDOR</span>
                    <span className="field-item-val">PocketBase Auth (Skip Cloud)</span>
                  </div>
                  <div className="account-field-item">
                    <span className="field-item-label">CRIADO EM</span>
                    <span className="field-item-val">
                      {user?.created
                        ? new Date(user.created).toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
