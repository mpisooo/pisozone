import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { removeActivityPhoto } from '../lib/activityPhotos'
import type { Activity } from '../types'

export function useActivities() {
  const { user } = useAuth()
  const { showError } = useToast()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (error) showError('Errore nel caricamento delle attività. Riprova.')
    else if (data) setActivities(data as Activity[])
    setLoading(false)
  }, [user, showError])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  const addActivity = async (activity: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'credits_earned'>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('activities')
      .insert({ ...activity, user_id: user.id })
      .select()
      .single()
    if (!error && data) setActivities((prev) => [data as Activity, ...prev])
    return { data, error }
  }

  const updateActivity = async (
    id: string,
    updates: Partial<Omit<Activity, 'id' | 'user_id' | 'created_at' | 'credits_earned'>>
  ) => {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setActivities((prev) => prev.map((a) => a.id === id ? data as Activity : a))
    }
    return { data, error }
  }

  const deleteActivity = async (id: string) => {
    const target = activities.find((a) => a.id === id)
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (!error) {
      setActivities((prev) => prev.filter((a) => a.id !== id))
      // La riga nel DB cade, il file nello Storage no: pulizia best effort
      if (target?.photo_url && user) removeActivityPhoto(user.id, id)
    }
    return { error }
  }

  return { activities, loading, addActivity, updateActivity, deleteActivity, refetch: fetchActivities }
}
