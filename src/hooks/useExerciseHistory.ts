import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchExerciseHistory, type ExerciseHistoryRow } from '../lib/activityExercises'
import type { ExerciseEntry } from '../lib/exerciseSets'

// Storico esercizi dell'utente (tutte le righe di exercise_sets, due colonne):
// alimenta la mappa dei PR e i suggerimenti nomi in Log/ActivityEditModal e la
// card "Record palestra" in Statistiche. Caricato una volta quando serve
// (enabled); `loaded` resta false se il fetch fallisce (es. migrazione v32 non
// eseguita), e in quel caso NON si annunciano PR: senza storico ogni carico
// sembrerebbe un record.
export function useExerciseHistory(enabled: boolean) {
  const { user } = useAuth()
  const [rows, setRows] = useState<ExerciseHistoryRow[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!enabled || !user || loaded) return
    let cancelled = false
    fetchExerciseHistory(user.id).then(({ rows: fetched, error }) => {
      if (cancelled || error) return
      setRows(fetched)
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [enabled, user, loaded])

  // Dopo un salvataggio riuscito lo storico locale si aggiorna subito: un
  // secondo allenamento nella stessa sessione non ri-annuncia lo stesso PR.
  // La data è "adesso": basta per la progressione, senza rifare il fetch.
  const appendLocal = useCallback((entries: ExerciseEntry[]) => {
    const date = new Date().toISOString()
    setRows((prev) => [
      ...prev,
      ...entries.map((e) => ({ exercise: e.exercise, weight_kg: e.weightKg, date })),
    ])
  }, [])

  return { rows, loaded, appendLocal }
}
