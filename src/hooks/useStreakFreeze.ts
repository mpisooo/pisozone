import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useStreakFreeze() {
  const { user } = useAuth()
  const [frozenDates, setFrozenDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [freezing, setFreezing] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('streak_freezes')
      .select('frozen_date')
      .eq('user_id', user.id)
      .order('frozen_date', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setFrozenDates(data?.map((r) => r.frozen_date as string) ?? [])
        setLoading(false)
      })
  }, [user?.id])

  async function freeze(date: string): Promise<{ success: boolean; error?: string }> {
    if (!user || freezing) return { success: false, error: 'Non pronto' }
    setFreezing(true)
    const { data, error } = await supabase.rpc('use_streak_freeze', {
      p_user_id: user.id,
      p_date: date,
    })
    setFreezing(false)
    if (error) return { success: false, error: error.message }
    const result = data as { success: boolean; error?: string }
    if (result.success) setFrozenDates((prev) => [...prev, date])
    return result
  }

  return { frozenDates, loading: loading, freeze, freezing }
}
