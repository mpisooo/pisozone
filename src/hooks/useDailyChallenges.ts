import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { generateDailyChallenges } from '../lib/challenges'
import type { Activity, DailyChallengeCompletion, EnrichedChallenge } from '../types'

export function useDailyChallenges(activities: Activity[], streak: number) {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [completions, setCompletions] = useState<DailyChallengeCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingKey, setClaimingKey] = useState<string | null>(null)

  const todayActivities = useMemo(
    () => activities.filter((a) => a.date.startsWith(today)),
    [activities, today],
  )

  const templates = useMemo(
    () => (user ? generateDailyChallenges(user.id, today) : []),
    [user?.id, today],
  )

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('daily_challenge_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_date', today)
      .then(({ data }) => {
        setCompletions((data as DailyChallengeCompletion[]) ?? [])
        setLoading(false)
      })
  }, [user?.id, today])

  const challenges: EnrichedChallenge[] = useMemo(
    () =>
      templates.map((template) => ({
        template,
        eligible: template.check(todayActivities, streak),
        claimed: completions.some((c) => c.challenge_key === template.key),
      })),
    [templates, todayActivities, streak, completions],
  )

  async function claimChallenge(key: string): Promise<boolean> {
    if (!user || claimingKey) return false
    const template = templates.find((t) => t.key === key)
    if (!template) return false

    setClaimingKey(key)
    const { error } = await supabase.from('daily_challenge_completions').insert({
      user_id: user.id,
      challenge_date: today,
      challenge_key: key,
      credits_earned: template.credits,
    })
    setClaimingKey(null)

    if (error) return false

    setCompletions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        user_id: user.id,
        challenge_date: today,
        challenge_key: key,
        credits_earned: template.credits,
        completed_at: new Date().toISOString(),
      },
    ])
    return true
  }

  const totalEarnable = templates.reduce((s, t) => s + t.credits, 0)
  const totalEarned = completions.reduce((s, c) => s + c.credits_earned, 0)

  return { challenges, loading, claimingKey, claimChallenge, totalEarnable, totalEarned }
}
