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
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  resolveNotificationPreferences,
  resolveWeeklyGoals,
  updateUserNotificationPreferences,
  updateUserWeeklyGoals,
  WEEKDAY_ORDER,
  WEEKDAY_LABELS,
  type NotificationPreferences,
  type WeekdayKey,
  type WeeklyFocusGoals,
} from '@/services/data'
import { formatMinutes } from '@/lib/format'
import { playReminderSound } from '@/lib/sounds'

type SettingsTab = 'produtividade' | 'conta'

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

  useEffect(() => {
    if (user) {
      setGoals(resolveWeeklyGoals(user))
      setNotifPrefs(resolveNotificationPreferences(user))
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission)
    }
  }, [user])

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
