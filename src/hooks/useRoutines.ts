import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchRoutines, deleteRoutine as deleteRoutineIo, type RoutineWithExercises } from '../lib/workoutRoutines'

// Routine salvate dell'utente (v48, roadmap v4 pilastro 03): alimenta il
// picker "Usa una routine" in Log.tsx e la pagina di gestione /routines.
// Caricato una volta quando serve (enabled), stesso pattern di useExerciseHistory.
export function useRoutines(enabled: boolean) {
  const { user } = useAuth()
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!enabled || !user || loaded) return
    let cancelled = false
    fetchRoutines(user.id).then(({ routines: fetched, error }) => {
      if (cancelled || error) return
      setRoutines(fetched)
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [enabled, user, loaded])

  const addLocal = useCallback((routine: RoutineWithExercises) => {
    setRoutines((prev) => [routine, ...prev])
  }, [])

  const removeLocal = useCallback(async (routineId: string) => {
    if (!user) return { error: new Error('not authenticated') }
    const { error } = await deleteRoutineIo(routineId, user.id)
    if (!error) setRoutines((prev) => prev.filter((r) => r.id !== routineId))
    return { error }
  }, [user])

  return { routines, loaded, addLocal, removeLocal }
}
