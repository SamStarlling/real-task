import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import {
  isTokenExpired,
  invalidateSessionAndRedirect,
  SESSION_EXPIRED_MESSAGE,
} from '@/lib/pocketbase/auth-session'

type AuthValue = {
  user: RecordModel | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: RecordModel | null) => void
}
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  const [ready, setReady] = useState<boolean>(!pb.authStore.token)

  useEffect(() => {
    return pb.authStore.onChange((_token, record) => {
      setUser(record)
    }, true)
  }, [])

  // 1. Bootstrap da sessão: se há token salvo no localStorage, validar e renovar via authRefresh
  useEffect(() => {
    const bootstrap = async () => {
      if (!pb.authStore.token) {
        setReady(true)
        return
      }

      // Se o token persistido já estiver matematicamente expirado, limpa e redireciona de imediato
      if (isTokenExpired(pb.authStore.token)) {
        invalidateSessionAndRedirect({ reason: SESSION_EXPIRED_MESSAGE })
        setReady(true)
        return
      }

      try {
        await pb.collection('users').authRefresh()
        setUser(pb.authStore.record)
      } catch (err: unknown) {
        console.warn('Falha no authRefresh durante o bootstrap da sessão:', err)
        invalidateSessionAndRedirect({ reason: SESSION_EXPIRED_MESSAGE })
      } finally {
        setReady(true)
      }
    }

    bootstrap()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        setUser,
        login: async (email, password) => {
          await pb.collection('users').authWithPassword(email, password)
        },
        logout: () => pb.authStore.clear(),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider ausente')
  return value
}
