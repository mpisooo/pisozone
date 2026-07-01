import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Profile } from '../types'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data as Profile | null)
    setLoading(false)
  }, [user])

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
      ...(profile ?? {}),
      ...updates,
      id: user.id,
    }
    const { error } = await supabase.from('profiles').upsert(merged)
    if (!error) setProfile(merged)
    return { error }
  }

  return { profile, loading, updateProfile, refetch: fetchProfile }
}
