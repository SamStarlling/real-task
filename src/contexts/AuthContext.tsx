import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

type AuthValue = {
  user: RecordModel | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}
const AuthContext = createContext<AuthValue | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  useEffect(() => pb.authStore.onChange((_token, record) => setUser(record), true), [])
  return (
    <AuthContext.Provider
      value={{
        user,
        ready: true,
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
