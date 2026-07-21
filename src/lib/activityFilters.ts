import type { Activity, ActivityType } from '../types'

// Filtri e ricerca del Calendario (roadmap v3, pilastro 02): sport, solo GPS,
// solo con foto, testo nelle note. Logica pura: la pagina applica il
// risultato a heatmap, pannello del giorno e lista dei risultati.

export interface ActivityFilters {
  types: ActivityType[] // vuoto = tutti gli sport
  gpsOnly: boolean
  photoOnly: boolean
  favoritesOnly: boolean // v47, percorsi preferiti
  query: string // cercato nelle note, case-insensitive
}

export const EMPTY_FILTERS: ActivityFilters = { types: [], gpsOnly: false, photoOnly: false, favoritesOnly: false, query: '' }

export function hasActiveFilters(f: ActivityFilters): boolean {
  return f.types.length > 0 || f.gpsOnly || f.photoOnly || f.favoritesOnly || f.query.trim().length > 0
}

// Quanti filtri sono accesi (per il numerino sul bottone "Filtri").
export function activeFilterCount(f: ActivityFilters): number {
  return f.types.length + (f.gpsOnly ? 1 : 0) + (f.photoOnly ? 1 : 0) + (f.favoritesOnly ? 1 : 0) + (f.query.trim() ? 1 : 0)
}

export function filterActivities(activities: Activity[], f: ActivityFilters): Activity[] {
  if (!hasActiveFilters(f)) return activities
  const q = f.query.trim().toLowerCase()
  return activities.filter((a) => {
    if (f.types.length > 0 && !f.types.includes(a.type)) return false
    if (f.gpsOnly && !a.gps_tracked) return false
    if (f.photoOnly && !a.photo_url) return false
    if (f.favoritesOnly && !a.is_favorite) return false
    if (q && !(a.notes ?? '').toLowerCase().includes(q)) return false
    return true
  })
}

// Gli sport tra cui filtrare: solo quelli davvero presenti nelle attività
// dell'utente, in ordine di frequenza — 20 chip fissi sarebbero quasi tutti
// inutili per chi pratica 2-3 sport.
export function typesInActivities(activities: Activity[]): ActivityType[] {
  const counts = new Map<ActivityType, number>()
  for (const a of activities) counts.set(a.type, (counts.get(a.type) ?? 0) + 1)
  return [...counts.entries()].sort((x, y) => y[1] - x[1]).map(([t]) => t)
}
