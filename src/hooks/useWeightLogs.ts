import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { WeightLog } from '../types'

export function useWeightLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: true })
      .limit(90)
    if (data) setLogs(data as WeightLog[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const addLog = async (weight_kg: number) => {
    if (!user) return { error: new Error('Not authenticated') }
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('weight_logs')
      .insert({ user_id: user.id, weight_kg, logged_at: today })
      .select()
      .single()
    if (!error && data) {
      setLogs((prev) => [...prev, data as WeightLog])
    }
    return { error }
  }

  return { logs, loading, addLog }
}
