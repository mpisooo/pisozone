import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import type { Profile } from '../types'

interface ProfileCtx {
  profile: Profile | null
  loading: boolean
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refetch: () => Promise<void>
}

const ProfileContext = createContext<ProfileCtx | null>(null)

// Stato profilo condiviso da tutti i componenti (TopBar, pagine, modali) così un
// aggiornamento (foto, livello, temi, crediti...) fatto in un punto si riflette ovunque,
// senza dover chiudere/riaprire l'app.
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { showError } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (error) showError('Errore nel caricamento del profilo. Riprova.')
    else setProfile(data as Profile | null)
    setLoading(false)
  }, [user, showError])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') }
    const merged: Profile = {
      username: user.user_metadata?.username ?? '',
      name: null,
      birth_date: null,
      height_cm: null,
      weight_kg: null,
      photo_url: null,
      weekly_goal: 3,
      daily_calorie_goal: null,
      sport_preferiti: [],
      credits: 0,
      gender: null,
      level: 1,
      unlocked_themes: ['dark', 'light'],
      active_theme: 'dark',
      unlocked_frames: ['none'],
      active_frame: 'none',
      push_prompt_seen: false,
      ...(profile ?? {}),
      ...updates,
      id: user.id,
    }
    const { error } = await supabase.from('profiles').upsert(merged)
    if (!error) setProfile(merged)
    return { error }
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile, refetch: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile used outside ProfileProvider')
  return ctx
}
