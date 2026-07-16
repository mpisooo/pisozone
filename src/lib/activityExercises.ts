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

// Riga dello storico esercizi: le colonne che servono a PR/suggerimenti/
// record, più la data dell'attività (dal join su activities) per la
// progressione carichi. `date` resta opzionale: le righe aggiunte in locale
// dopo un salvataggio (appendLocal) e ogni riga senza join non la portano.
export interface ExerciseHistoryRow {
  exercise: string
  weight_kg: number | null
  date?: string
}

// Storico completo dell'utente. Tollerante pre-migrazione: tabella assente =
// storico vuoto. exercise_sets non ha una data propria: la si prende
// dall'attività madre (FK activity_id), che è la data vera dell'allenamento
// anche quando è stato registrato a posteriori.
export async function fetchExerciseHistory(
  userId: string,
): Promise<{ rows: ExerciseHistoryRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('exercise, weight_kg, activities(date)')
    .eq('user_id', userId)
  if (error) return { rows: [], error }
  // La relazione è molti-a-uno: a runtime PostgREST restituisce un oggetto,
  // ma senza tipi generati il client la inferisce come array — si accettano
  // entrambe le forme invece di fidarsi di una sola.
  type Fetched = Pick<ExerciseSet, 'exercise' | 'weight_kg'> & {
    activities: { date: string } | { date: string }[] | null
  }
  const rows = ((data ?? []) as unknown as Fetched[]).map((r) => ({
    exercise: r.exercise,
    weight_kg: r.weight_kg,
    date: Array.isArray(r.activities) ? r.activities[0]?.date : r.activities?.date,
  }))
  return { rows, error: null }
}
