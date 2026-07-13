import { useState, useEffect, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import plansText from '../lib/i18n/plans'
import type { PlanEnrollment } from '../types'

// Iscrizioni ai programmi di allenamento (plan_enrollments, v34): al massimo
// una attiva per utente (indice parziale). L'avanzamento NON vive qui: si
// deriva dalle attività con computePlanProgress (lib/plans.ts).
export function useTrainingPlan() {
  const { user } = useAuth()
  const { showError } = useToast()
  const [enrollments, setEnrollments] = useState<PlanEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  const fetchEnrollments = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const { data, error } = await supabase
      .from('plan_enrollments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    // Tollerante pre-migrazione: tabella assente = nessuna iscrizione
    if (!error && data) setEnrollments(data as PlanEnrollment[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchEnrollments() }, [fetchEnrollments])

  const activeEnrollment = useMemo(
    () => enrollments.find((e) => !e.completed_at && !e.abandoned_at) ?? null,
    [enrollments],
  )
  const completedKeys = useMemo(
    () => new Set(enrollments.filter((e) => e.completed_at).map((e) => e.plan_key)),
    [enrollments],
  )

  const startPlan = useCallback(async (planKey: string) => {
    if (!user || working) return false
    setWorking(true)
    const { data, error } = await supabase
      .from('plan_enrollments')
      .insert({ user_id: user.id, plan_key: planKey, started_on: format(new Date(), 'yyyy-MM-dd') })
      .select()
      .single()
    setWorking(false)
    if (error || !data) {
      showError(plansText.errors.startFailed)
      return false
    }
    setEnrollments((prev) => [data as PlanEnrollment, ...prev])
    return true
  }, [user, working, showError])

  const abandonPlan = useCallback(async (enrollmentId: string) => {
    if (working) return false
    setWorking(true)
    const { data, error } = await supabase
      .from('plan_enrollments')
      .update({ abandoned_at: new Date().toISOString() })
      .eq('id', enrollmentId)
      .select()
      .single()
    setWorking(false)
    if (error || !data) {
      showError(plansText.errors.abandonFailed)
      return false
    }
    setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? (data as PlanEnrollment) : e)))
    return true
  }, [working, showError])

  // Il trigger award_plan_credits (v34) accredita credits_earned quando
  // completed_at passa da NULL a valorizzato — una volta sola.
  const claimCompletion = useCallback(async (enrollmentId: string, credits: number) => {
    if (working) return false
    setWorking(true)
    const { data, error } = await supabase
      .from('plan_enrollments')
      .update({ completed_at: new Date().toISOString(), credits_earned: credits })
      .eq('id', enrollmentId)
      .select()
      .single()
    setWorking(false)
    if (error || !data) {
      showError(plansText.errors.claimFailed)
      return false
    }
    setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? (data as PlanEnrollment) : e)))
    return true
  }, [working, showError])

  return { enrollments, activeEnrollment, completedKeys, loading, working, startPlan, abandonPlan, claimCompletion }
}
