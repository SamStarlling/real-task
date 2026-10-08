import { useState, useEffect } from 'react'
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
  createTag,
  updateTag,
  deleteTag,
  TAG_PALETTE,
  getNextTagColor,
  type NotificationPreferences,
  type WeekdayKey,
  type WeeklyFocusGoals,
  type TagRecord,
} from '@/services/data'
import type { TaskRecord } from '@/types'
import { formatMinutes } from '@/lib/format'
import { playReminderSound } from '@/lib/sounds'

type SettingsTab = 'produtividade' | 'etiquetas' | 'conta'

interface EditingState {
  day: WeekdayKey | null
  value: string
}

export function Settings() {
  const { user } = useAuth()
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
  const [tagsLoading, setTagsLoading] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState<string>(TAG_PALETTE[0].color)
  const [tagCreating, setTagCreating] = useState(false)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingTagName, setEditingTagName] = useState('')
  const [editingTagColor, setEditingTagColor] = useState('')
  const [tagActionError, setTagActionError] = useState<string | null>(null)

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
    try {
      const [allTags, allTasks] = await Promise.all([getTags(), getTasks()])
      setTags(allTags)
      setTasks(allTasks)
    } catch (err) {
      console.error('Erro ao carregar etiquetas e tarefas:', err)
    } finally {
      setTagsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      setGoals(resolveWeeklyGoals(user))
      setNotifPrefs(resolveNotificationPreferences(user))
      loadTagsAndTasks()
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission)
    }
  }, [user])

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
      id: 'produtividade' as SettingsTab,
      label: 'Produtividade & Alertas',
      desc: 'Metas de foco, horários e notificações',
      icon: TrendingUp,
    },
    {
      id: 'etiquetas' as SettingsTab,
      label: 'Etiquetas & Tags',
      desc: 'Cores, renomeação e tarefas vinculadas',
      icon: Tag,
    },
    {
      id: 'conta' as SettingsTab,
      label: 'Conta',
      desc: 'Perfil e credenciais de acesso',
      icon: User,
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
              const isActive = activeTab === sec.id
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id)}
                  className={`settings-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="settings-nav-icon" />
                  <div className="settings-nav-meta">
                    <span className="settings-nav-label">{sec.label}</span>
                    <span className="settings-nav-sub">{sec.desc}</span>
                  </div>
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
                      <span className="col-count">TAREFAS VINCULADAS</span>
                      <span className="col-actions">AÇÕES</span>
                    </div>

                    <div className="tags-table-body">
                      {tags
                        .filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                        .map((tag) => {
                          const isEditing = editingTagId === tag.id
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
                  <h4>Captura Rápida com # na Barra</h4>
                  <p>
                    Ao digitar uma nova tarefa na barra de captura superior, use a hashtag como no
                    TickTick ou Todoist (ex.: <code>Planejar sprint #Trabalho amanhã às 14h</code>).
                    O sistema reconhece e associa a etiqueta automaticamente.
                  </p>
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
