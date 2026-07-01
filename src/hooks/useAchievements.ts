import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MEDALS, TIER_CREDITS } from '../lib/constants'
import type { Achievement, AchievementStats } from '../types'

export interface NewlyUnlockedMedal {
  key: string
  name: string
  icon: string
  credits: number
}

// Sincronizza le medaglie sbloccate (derivate da AchievementStats) con la tabella
// achievements, assegnando i crediti una tantum alla prima registrazione di ognuna.
export function useAchievements(stats: AchievementStats) {
  const { user } = useAuth()
  const [recorded, setRecorded] = useState<Achievement[] | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<NewlyUnlockedMedal[]>([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => setRecorded((data as Achievement[]) ?? []))
  }, [user?.id])

  useEffect(() => {
    if (!user || recorded === null) return

    const unlockedNow = MEDALS.filter((m) => {
      const { current, target } = m.checkProgress(stats)
      return current >= target
    })
    const recordedKeys = new Set(recorded.map((a) => a.medal_key))
    const missing = unlockedNow.filter((m) => !recordedKeys.has(m.key))
    if (missing.length === 0) return

    const rows = missing.map((m) => ({
      user_id: user.id,
      medal_key: m.key,
      credits_earned: TIER_CREDITS[m.tier],
    }))

    supabase
      .from('achievements')
      .upsert(rows, { onConflict: 'user_id,medal_key', ignoreDuplicates: true })
      .select()
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) return
        const insertedKeys = new Set((data as Achievement[]).map((a) => a.medal_key))
        setRecorded((prev) => [...(prev ?? []), ...(data as Achievement[])])
        setNewlyUnlocked((prev) => [
          ...prev,
          ...missing
            .filter((m) => insertedKeys.has(m.key))
            .map((m) => ({ key: m.key, name: m.name, icon: m.icon, credits: TIER_CREDITS[m.tier] })),
        ])
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, recorded, stats])

  const dismissNewlyUnlocked = useCallback(() => setNewlyUnlocked([]), [])

  return { newlyUnlocked, dismissNewlyUnlocked }
}
