import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthCtx {
  user: User | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>
  signUp: (username: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

function toEmail(username: string) {
  return `${username.toLowerCase().trim()}@pisozone.local`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    })
    return { error }
  }

  const signUp = async (username: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email: toEmail(username),
      password,
      options: { data: { username } },
    })
    return { error }
  }

  const signOut = async () => { await supabase.auth.signOut() }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth used outside AuthProvider')
  return ctx
}
