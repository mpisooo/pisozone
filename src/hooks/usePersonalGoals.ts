import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import goalsText from '../lib/i18n/goals'
import type { PersonalGoal } from '../types'

// Obiettivi personali (personal_goals, v36): mete libere con avanzamento
// derivato dalle attività (lib/goals.ts). Niente update: si modifica
// cancellando e ricreando — gli obiettivi sono piccoli e usa-e-getta.
export function usePersonalGoals() {
  const { user } = useAuth()
  const { showError } = useToast()
  const [goals, setGoals] = useState<PersonalGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    let cancelled = false
    supabase
      .from('personal_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('ends_on', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        // Tollerante pre-migrazione: tabella assente = nessun obiettivo
        if (!error && data) setGoals(data as PersonalGoal[])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const addGoal = useCallback(async (
    goal: Pick<PersonalGoal, 'metric' | 'target' | 'activity_type' | 'starts_on' | 'ends_on'>,
  ) => {
    if (!user || working) return false
    setWorking(true)
    const { data, error } = await supabase
      .from('personal_goals')
      .insert({ ...goal, user_id: user.id })
      .select()
      .single()
    setWorking(false)
    if (error || !data) {
      showError(goalsText.errors.createFailed)
      return false
    }
    setGoals((prev) => [...prev, data as PersonalGoal].sort((a, b) => a.ends_on.localeCompare(b.ends_on)))
    return true
  }, [user, working, showError])

  const deleteGoal = useCallback(async (goalId: string) => {
    const { error } = await supabase.from('personal_goals').delete().eq('id', goalId)
    if (error) {
      showError(goalsText.errors.deleteFailed)
      return false
    }
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
    return true
  }, [showError])

  return { goals, loading, working, addGoal, deleteGoal }
}
