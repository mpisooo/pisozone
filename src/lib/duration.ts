// Ore/minuti/secondi ⇄ minuti totali o secondi totali. activities.duration_min
// nel DB è un integer (vincolo 1-1440): non può mai ricevere una frazione, va
// sempre arrotondato al minuto. La precisione al secondo (serve il passo
// esatto per i futuri record personali su distanze standard, corsa) vive
// SOLO nella colonna opzionale duration_seconds (v52) — decomposeDurationMin
// resta il fallback quando quella colonna non c'è (pre-migrazione o attività
// non di corsa): decompone un valore già arrotondato al minuto, quindi i
// secondi risultanti sono sempre 0.
export interface DurationParts {
  hours: number
  minutes: number
  seconds: number
}

export function decomposeDurationMin(durationMin: number): DurationParts {
  return decomposeDurationSeconds(durationMin * 60)
}

export function composeDurationMin(hours: number, minutes: number, seconds: number): number {
  return hours * 60 + minutes + seconds / 60
}

export function decomposeDurationSeconds(totalSeconds: number): DurationParts {
  const s = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  return { hours, minutes, seconds }
}

export function composeDurationSeconds(hours: number, minutes: number, seconds: number): number {
  return hours * 3600 + minutes * 60 + seconds
}

// Minuti interi da salvare in duration_min: arrotondato, mai sotto 1 (il
// vincolo DB richiede duration_min > 0).
export function durationMinFromSeconds(totalSeconds: number): number {
  return Math.max(1, Math.round(totalSeconds / 60))
}
