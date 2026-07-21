import { supabase } from './supabase'
import type { WorkoutRoutine, RoutineExercise } from '../types'
import type { ExerciseEntry } from './exerciseSets'

// I/O per le routine salvate (workout_routines/workout_routine_exercises —
// v48, roadmap v4 pilastro 03). Funzioni semplici come routeSegments.ts, non
// un hook: una routine è un template MAI collegato a un'attività, letto sia
// dalla pagina di gestione (/routines) sia dal picker in Log.tsx.

export const ROUTINE_MAX = 20

export interface RoutineWithExercises extends WorkoutRoutine {
  exercises: RoutineExercise[]
}

export async function fetchRoutines(userId: string): Promise<{ routines: RoutineWithExercises[]; error: Error | null }> {
  const { data: routineRows, error } = await supabase
    .from('workout_routines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return { routines: [], error }
  const routines = (routineRows ?? []) as WorkoutRoutine[]
  if (routines.length === 0) return { routines: [], error: null }

  const { data: exerciseRows, error: exError } = await supabase
    .from('workout_routine_exercises')
    .select('*')
    .in('routine_id', routines.map((r) => r.id))
    .order('seq')
  if (exError) return { routines: [], error: exError }

  const byRoutine = new Map<string, RoutineExercise[]>()
  for (const row of (exerciseRows ?? []) as RoutineExercise[]) {
    const list = byRoutine.get(row.routine_id) ?? []
    list.push(row)
    byRoutine.set(row.routine_id, list)
  }
  return {
    routines: routines.map((r) => ({ ...r, exercises: byRoutine.get(r.id) ?? [] })),
    error: null,
  }
}

// Crea la routine e i suoi blocchi in due insert: se il secondo fallisce la
// routine resta orfana (senza esercizi) invece di sparire del tutto —
// l'utente la vede vuota in /routines e può eliminarla e riprovare.
export async function createRoutine(
  userId: string,
  name: string,
  entries: Pick<ExerciseEntry, 'exercise' | 'sets' | 'reps' | 'weightKg'>[],
): Promise<{ routine: WorkoutRoutine | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('workout_routines')
    .insert({ user_id: userId, name })
    .select()
    .single()
  if (error || !data) return { routine: null, error: error ?? new Error('insert failed') }
  const routine = data as WorkoutRoutine

  if (entries.length > 0) {
    const rows = entries.map((e, seq) => ({
      routine_id: routine.id,
      user_id: userId,
      seq,
      exercise: e.exercise,
      sets: e.sets,
      reps: e.reps,
      weight_kg: e.weightKg,
    }))
    const { error: exError } = await supabase.from('workout_routine_exercises').insert(rows)
    if (exError) return { routine, error: exError }
  }
  return { routine, error: null }
}

export async function deleteRoutine(routineId: string, userId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('workout_routines').delete().eq('id', routineId).eq('user_id', userId)
  return { error }
}
