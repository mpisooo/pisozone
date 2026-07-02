import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { MEDALS, TIER_CREDITS } from '../lib/constants'
import type { Achievement, AchievementStats, MedalTier } from '../types'

export interface NewlyUnlockedMedal {
  key: string
  name: string
  icon: string
  tier: MedalTier
  credits: number
}

// Le medaglie idonee (criteri raggiunti) restano da riscattare manualmente:
// l'insert in achievements (e quindi il credito via trigger DB) avviene solo
// al click su "Riscatta", non appena i criteri sono soddisfatti.
export function useAchievements(stats: AchievementStats) {
  const { user } = useAuth()
  const { showError } = useToast()
  const [recorded, setRecorded] = useState<Achievement[] | null>(null)
  const [claimingKey, setClaimingKey] = useState<string | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<NewlyUnlockedMedal | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) showError('Errore nel caricamento delle medaglie. Riprova.')
        setRecorded((data as Achievement[]) ?? [])
      })
  }, [user?.id, showError])

  const claimedKeys = useMemo(
    () => new Set((recorded ?? []).map((a) => a.medal_key)),
    [recorded],
  )

  const eligibleKeys = useMemo(
    () => new Set(
      MEDALS.filter((m) => {
        const { current, target } = m.checkProgress(stats)
        return current >= target
      }).map((m) => m.key)
    ),
    [stats],
  )

  const claimMedal = useCallback(async (key: string): Promise<boolean> => {
    if (!user || claimingKey || claimedKeys.has(key) || !eligibleKeys.has(key)) return false
    const medal = MEDALS.find((m) => m.key === key)
    if (!medal) return false

    setClaimingKey(key)
    const { data, error } = await supabase
      .from('achievements')
      .upsert(
        { user_id: user.id, medal_key: key, credits_earned: TIER_CREDITS[medal.tier] },
        { onConflict: 'user_id,medal_key', ignoreDuplicates: true },
      )
      .select()
    setClaimingKey(null)

    if (error || !data || data.length === 0) {
      showError('Riscatto medaglia non riuscito. Riprova.')
      return false
    }

    setRecorded((prev) => [...(prev ?? []), ...(data as Achievement[])])
    setNewlyUnlocked({
      key: medal.key,
      name: medal.name,
      icon: medal.icon,
      tier: medal.tier,
      credits: TIER_CREDITS[medal.tier],
    })
    return true
  }, [user, claimingKey, claimedKeys, eligibleKeys, showError])

  const dismissNewlyUnlocked = useCallback(() => setNewlyUnlocked(null), [])

  return { claimedKeys, eligibleKeys, claimingKey, claimMedal, newlyUnlocked, dismissNewlyUnlocked }
}
