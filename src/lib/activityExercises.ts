import { supabase } from './supabase'
import type { ExerciseEntry } from './exerciseSets'
import type { ExerciseSet } from '../types'

// Persistenza del log palestra su exercise_sets (v32) — stesso ruolo di
// activityRoutes.ts per i percorsi GPS: il salvataggio è best effort e arriva
// DOPO l'insert dell'attività (serve l'id). Se fallisce (rete, migrazione non
// ancora eseguita) l'attività resta salvata e si avvisa con un toast dedicato.

function entriesToRows(userId: string, activityId: string, entries: ExerciseEntry[]) {
  return entries.map((e, seq) => ({
    activity_id: activityId,
    user_id: userId,
    seq,
    exercise: e.exercise,
    sets: e.sets,
    reps: e.reps,
    weight_kg: e.weightKg,
  }))
}

export async function saveActivityExercises(
  userId: string,
  activityId: string,
  entries: ExerciseEntry[],
): Promise<{ error: Error | null }> {
  if (entries.length === 0) return { error: null }
  const { error } = await supabase.from('exercise_sets').insert(entriesToRows(userId, activityId, entries))
  return { error }
}

// Modifica = delete + reinsert dell'intero blocco (policy DELETE di v32):
// molto più semplice di un diff riga per riga e le sessioni sono piccole.
// Se l'insert fallisce dopo il delete i vecchi set sono persi: il chiamante
// mostra l'errore e tiene aperto l'editor, così le bozze restano e si riprova.
export async function replaceActivityExercises(
  userId: string,
  activityId: string,
  entries: ExerciseEntry[],
): Promise<{ error: Error | null }> {
  const { error: deleteError } = await supabase
    .from('exercise_sets')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', userId)
  if (deleteError) return { error: deleteError }
  return saveActivityExercises(userId, activityId, entries)
}

export async function fetchActivityExercises(
  activityId: string,
): Promise<{ rows: ExerciseSet[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('*')
    .eq('activity_id', activityId)
    .order('seq')
  if (error) return { rows: [], error }
  return { rows: (data ?? []) as ExerciseSet[], error: null }
}

// Storico completo dell'utente, solo le colonne che servono a PR/suggerimenti/
// record. Tollerante pre-migrazione: tabella assente = storico vuoto.
export async function fetchExerciseHistory(
  userId: string,
): Promise<{ rows: Pick<ExerciseSet, 'exercise' | 'weight_kg'>[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('exercise, weight_kg')
    .eq('user_id', userId)
  if (error) return { rows: [], error }
  return { rows: (data ?? []) as Pick<ExerciseSet, 'exercise' | 'weight_kg'>[], error: null }
}
