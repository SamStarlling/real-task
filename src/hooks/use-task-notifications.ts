import { useEffect, useRef } from 'react'
import type { TaskRecord, UserRecord } from '@/types'
import { localDay } from '@/lib/date-parser'
import { resolveNotificationPreferences } from '@/services/data'
import { playReminderSound } from '@/lib/sounds'

/**
 * Hook global responsável por monitorar tarefas com horário (due_time) agendadas para hoje
 * e emitir notificações nativas do navegador com áudio Web Audio suave, conforme preferências do usuário.
 */
export function useTaskNotifications(tasks: TaskRecord[], user: Partial<UserRecord> | null) {
  // Guarda os IDs das tarefas já notificadas na sessão atual para evitar disparos repetidos
  const notifiedKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return

    const prefs = resolveNotificationPreferences(user)
    if (!prefs.enabled) return

    // Se o navegador não suporta ou permissão negada, não faz nada
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const checkAlarms = () => {
      const now = new Date()
      const today = localDay(now)
      const currentHours = now.getHours()
      const currentMinutes = now.getMinutes()
      const nowTotalMin = currentHours * 60 + currentMinutes

      const todayTasks = tasks.filter(
        (t) =>
          !t.done &&
          t.due_date &&
          t.due_date.slice(0, 10) === today &&
          t.due_time &&
          t.due_time.trim().length === 5,
      )

      for (const task of todayTasks) {
        const [h, m] = (task.due_time || '').split(':').map(Number)
        if (isNaN(h) || isNaN(m)) continue
        const taskTotalMin = h * 60 + m
        const diffMinutes = taskTotalMin - nowTotalMin

        // Disparar se a tarefa está no intervalo de antecedência configurado (ex: diff <= lead_minutes e diff >= 0)
        // ou se acabou de atingir o minuto exato
        const lead = Math.max(0, prefs.lead_minutes || 5)
        const shouldTrigger = diffMinutes <= lead && diffMinutes >= -1

        const notificationKey = `${task.id}-${today}-${task.due_time}-${lead}`

        if (shouldTrigger && !notifiedKeysRef.current.has(notificationKey)) {
          notifiedKeysRef.current.add(notificationKey)

          // Tocar som suave se habilitado
          if (prefs.sound_enabled) {
            try {
              playReminderSound()
            } catch (err) {
              console.warn('Erro ao tocar som de lembrete:', err)
            }
          }

          // Disparar Notificação nativa
          try {
            const timeDesc =
              diffMinutes === 0
                ? 'Começando agora!'
                : diffMinutes > 0
                  ? `Começa em ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} (${task.due_time})`
                  : `Agendada para às ${task.due_time}`

            const n = new Notification(`Lembrete: ${task.title}`, {
              body: `${timeDesc} · Barbosa System`,
              tag: `barbosa-task-${task.id}`,
              icon: '/favicon.ico',
            })

            n.onclick = () => {
              window.focus()
              n.close()
            }
          } catch (err) {
            console.error('Erro ao emitir notificação nativa:', err)
          }
        }
      }
    }

    // Checagem imediata e a cada 20 segundos
    checkAlarms()
    const interval = setInterval(checkAlarms, 20000)

    return () => clearInterval(interval)
  }, [tasks, user])
}
