// Log palestra strutturato (roadmap v2, pilastro 02 punto 1): qui vive SOLO
// la logica pura — bozze dell'editor ⇄ righe valide, rilevamento dei PR,
// record per esercizio, suggerimenti dei nomi — testata con Vitest. La
// persistenza su exercise_sets sta in lib/activityExercises.ts, la UI in
// components/ExerciseSetsFields.tsx.

// Limiti speculari ai check della migrazione v32: il client non deve mai
// produrre una riga che il DB rifiuterebbe.
export const EXERCISE_NAME_MAX = 60
export const SETS_MAX = 99
export const REPS_MAX = 999
export const WEIGHT_KG_MAX = 1000

// Superset (esercizi diversi in successione) o drop set (stesso esercizio,
// carico che scende): due o più blocchi consecutivi condividono un groupId.
// Il tipo si INFERISCE dal nome al momento del collegamento (lib/exerciseSets
// linkToPrevious), non è una scelta esplicita dell'utente — dimezza la UI.
export type SetType = 'superset' | 'dropset'

// Un "blocco" di lavoro valido: esercizio + serie × ripetizioni allo stesso
// carico. weightKg null = corpo libero, non un peso ignoto. groupId/setType
// null = blocco normale, non parte di un superset/drop set.
export interface ExerciseEntry {
  exercise: string
  sets: number
  reps: number
  weightKg: number | null
  groupId: string | null
  setType: SetType | null
}

// Bozza di riga nell'editor: tutti i campi sono stringhe grezze perché ogni
// input deve poter restare vuoto senza fingere un valore (stesso principio
// delle metriche percepite). groupId/setType restano undefined finché non
// collegati a un blocco precedente.
export interface ExerciseDraft {
  key: string
  exercise: string
  sets: string
  reps: string
  weight: string
  groupId?: string
  setType?: SetType
}

let draftCounter = 0
export function emptyDraft(): ExerciseDraft {
  return { key: `draft-${draftCounter++}`, exercise: '', sets: '', reps: '', weight: '' }
}

function newGroupId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `grp-${Math.random().toString(36).slice(2)}`
}

// Collega la bozza al blocco immediatamente precedente: se questo non ha
// ancora un gruppo ne crea uno nuovo condiviso, altrimenti il blocco corrente
// lo eredita. Il tipo si inferisce dal nome normalizzato: stesso esercizio
// del precedente = drop set (stesso movimento, carico che scende), nome
// diverso = superset. Nessun effetto se la bozza è già la prima della lista.
export function linkToPrevious(drafts: ExerciseDraft[], key: string): ExerciseDraft[] {
  const i = drafts.findIndex((d) => d.key === key)
  if (i <= 0) return drafts
  const prev = drafts[i - 1]
  const groupId = prev.groupId ?? newGroupId()
  const setType: SetType = normalizeExerciseName(prev.exercise) === normalizeExerciseName(drafts[i].exercise)
    ? 'dropset'
    : 'superset'
  return drafts.map((d, idx) => (idx === i - 1 || idx === i ? { ...d, groupId, setType } : d))
}

// Scollega la bozza dal suo gruppo. Un gruppo rimasto con un solo membro non
// significa più nulla: torna anche lui un blocco normale.
export function unlinkFromGroup(drafts: ExerciseDraft[], key: string): ExerciseDraft[] {
  const target = drafts.find((d) => d.key === key)
  if (!target?.groupId) return drafts
  const groupId = target.groupId
  const cleared = drafts.map((d) => (d.key === key ? { ...d, groupId: undefined, setType: undefined } : d))
  return pruneOrphanGroups(cleared, groupId)
}

// Da chiamare dopo aver rimosso un blocco dalla lista: se un gruppo resta con
// un solo membro, quel membro torna un blocco normale. Se onlyGroupId è
// passato si limita il lavoro a quel gruppo (chiamata da unlinkFromGroup).
export function pruneOrphanGroups(drafts: ExerciseDraft[], onlyGroupId?: string): ExerciseDraft[] {
  const counts = new Map<string, number>()
  for (const d of drafts) {
    if (!d.groupId || (onlyGroupId && d.groupId !== onlyGroupId)) continue
    counts.set(d.groupId, (counts.get(d.groupId) ?? 0) + 1)
  }
  if (counts.size === 0) return drafts
  return drafts.map((d) => (d.groupId && counts.get(d.groupId) === 1 ? { ...d, groupId: undefined, setType: undefined } : d))
}

// Nome ripulito per il salvataggio: spazi collassati, lunghezza entro il
// check del DB. La chiave dei PR è la versione minuscola, così "Panca Piana"
// e "panca piana" contano come lo stesso esercizio.
export function cleanExerciseName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, EXERCISE_NAME_MAX)
}

export function normalizeExerciseName(raw: string): string {
  return cleanExerciseName(raw).toLowerCase()
}

function parseCount(raw: string, max: number): number | null {
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1) return null
  return Math.min(n, max)
}

// Peso: '' = corpo libero. Accetta la virgola decimale (tastiera italiana),
// arrotonda ai 2 decimali della colonna numeric(6,2).
function parseWeight(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const n = Number.parseFloat(trimmed.replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(Math.min(n, WEIGHT_KG_MAX) * 100) / 100
}

// Stato di una bozza, per il feedback nell'editor: 'empty' è una riga
// placeholder (si scarta in silenzio), 'incomplete' ha un nome ma serie o
// ripetizioni non valide (va segnalata, altrimenti sparirebbe al salvataggio).
export type DraftStatus = 'empty' | 'incomplete' | 'valid'

export function draftStatus(draft: ExerciseDraft): DraftStatus {
  if (cleanExerciseName(draft.exercise) === '') return 'empty'
  if (parseCount(draft.sets, SETS_MAX) === null || parseCount(draft.reps, REPS_MAX) === null) {
    return 'incomplete'
  }
  return 'valid'
}

// Le sole righe complete diventano voci salvabili; le altre restano bozze.
export function draftsToEntries(drafts: ExerciseDraft[]): ExerciseEntry[] {
  const entries: ExerciseEntry[] = []
  for (const draft of drafts) {
    if (draftStatus(draft) !== 'valid') continue
    entries.push({
      exercise: cleanExerciseName(draft.exercise),
      sets: parseCount(draft.sets, SETS_MAX)!,
      reps: parseCount(draft.reps, REPS_MAX)!,
      weightKg: parseWeight(draft.weight),
      groupId: draft.groupId ?? null,
      setType: draft.setType ?? null,
    })
  }
  return entries
}

// Righe già salvate → bozze modificabili (ActivityEditModal).
export function rowsToDrafts(rows: { exercise: string; sets: number; reps: number; weight_kg: number | null; group_id?: string | null; set_type?: SetType | null }[]): ExerciseDraft[] {
  return rows.map((r) => ({
    key: `draft-${draftCounter++}`,
    exercise: r.exercise,
    sets: String(r.sets),
    reps: String(r.reps),
    weight: r.weight_kg == null ? '' : String(Number(r.weight_kg)),
    groupId: r.group_id ?? undefined,
    setType: r.set_type ?? undefined,
  }))
}

// Volume totale della sessione (Σ serie × rip × kg, solo esercizi con carico)
// per la riga di riepilogo dell'editor.
export function totalVolumeKg(entries: ExerciseEntry[]): number {
  return Math.round(entries.reduce((sum, e) => sum + (e.weightKg ?? 0) * e.sets * e.reps, 0))
}

type HistoryRow = { exercise: string; weight_kg: number | null }

// Carico massimo mai registrato per esercizio (chiave normalizzata): la base
// di confronto per i nuovi PR.
export function buildPrMap(rows: HistoryRow[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of rows) {
    if (row.weight_kg == null) continue
    const key = normalizeExerciseName(row.exercise)
    if (key === '') continue
    const w = Number(row.weight_kg)
    if (!Number.isFinite(w) || w <= 0) continue
    if (w > (map.get(key) ?? 0)) map.set(key, w)
  }
  return map
}

export interface PrRecord {
  exercise: string
  weightKg: number
  // null = primo carico mai registrato per questo esercizio
  previousKg: number | null
}

// Confronta le voci appena inserite con lo storico: PR = carico che supera il
// massimo noto (o primo carico in assoluto per l'esercizio). Più voci dello
// stesso esercizio nella stessa sessione contano una volta sola, col massimo.
export function detectNewPrs(entries: ExerciseEntry[], prMap: Map<string, number>): PrRecord[] {
  const bestByKey = new Map<string, { exercise: string; weightKg: number }>()
  for (const e of entries) {
    if (e.weightKg == null) continue
    const key = normalizeExerciseName(e.exercise)
    const current = bestByKey.get(key)
    if (!current || e.weightKg > current.weightKg) {
      bestByKey.set(key, { exercise: e.exercise, weightKg: e.weightKg })
    }
  }
  const prs: PrRecord[] = []
  for (const [key, best] of bestByKey) {
    const previous = prMap.get(key)
    if (previous === undefined || best.weightKg > previous) {
      prs.push({ exercise: best.exercise, weightKg: best.weightKg, previousKg: previous ?? null })
    }
  }
  return prs
}

export interface GymRecord {
  exercise: string
  weightKg: number
}

// Record personali per la card in Statistiche: massimo di sempre per ogni
// esercizio con carico, dal più pesante. Il nome mostrato è quello della riga
// che ha stabilito il record.
export function buildGymRecords(rows: HistoryRow[]): GymRecord[] {
  const best = new Map<string, GymRecord>()
  for (const row of rows) {
    if (row.weight_kg == null) continue
    const key = normalizeExerciseName(row.exercise)
    if (key === '') continue
    const w = Number(row.weight_kg)
    if (!Number.isFinite(w) || w <= 0) continue
    const current = best.get(key)
    if (!current || w > current.weightKg) {
      best.set(key, { exercise: cleanExerciseName(row.exercise), weightKg: w })
    }
  }
  return [...best.values()].sort((a, b) => b.weightKg - a.weightKg)
}

// — Progressione carichi (roadmap v3, pilastro 01 punto 4) —

type DatedHistoryRow = { exercise: string; weight_kg: number | null; date?: string }

export interface ProgressionPoint {
  date: string // yyyy-MM-dd
  weightKg: number
}

// Serie della progressione per un esercizio: il carico massimo di ogni
// giornata di allenamento (chiave = nome normalizzato, come per i PR), in
// ordine cronologico. Le righe senza data o senza carico non contribuiscono.
export function buildExerciseProgression(rows: DatedHistoryRow[], exercise: string): ProgressionPoint[] {
  const key = normalizeExerciseName(exercise)
  if (key === '') return []
  const bestByDay = new Map<string, number>()
  for (const row of rows) {
    if (row.weight_kg == null || row.date == null) continue
    if (normalizeExerciseName(row.exercise) !== key) continue
    const w = Number(row.weight_kg)
    if (!Number.isFinite(w) || w <= 0) continue
    const day = row.date.slice(0, 10)
    if (w > (bestByDay.get(day) ?? 0)) bestByDay.set(day, w)
  }
  return [...bestByDay.entries()]
    .map(([date, weightKg]) => ({ date, weightKg }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Esercizi con una progressione da mostrare (almeno 2 giornate con carico),
// dal più allenato: i chip del selettore nella card di Statistiche. Il nome
// mostrato è quello della prima riga incontrata, ripulito.
export function progressionExercises(rows: DatedHistoryRow[], max = 8): string[] {
  const byKey = new Map<string, { name: string; days: Set<string> }>()
  for (const row of rows) {
    if (row.weight_kg == null || row.date == null) continue
    const key = normalizeExerciseName(row.exercise)
    if (key === '') continue
    const w = Number(row.weight_kg)
    if (!Number.isFinite(w) || w <= 0) continue
    const entry = byKey.get(key) ?? { name: cleanExerciseName(row.exercise), days: new Set<string>() }
    entry.days.add(row.date.slice(0, 10))
    byKey.set(key, entry)
  }
  return [...byKey.values()]
    .filter((e) => e.days.size >= 2)
    .sort((a, b) => b.days.size - a.days.size || a.name.localeCompare(b.name))
    .slice(0, max)
    .map((e) => e.name)
}

// Nomi già usati, dal più frequente, per la <datalist> dell'editor: aiuta a
// scrivere sempre lo stesso nome, che è ciò che rende i PR affidabili.
export function exerciseSuggestions(rows: { exercise: string }[], max = 12): string[] {
  const freq = new Map<string, { name: string; count: number }>()
  for (const row of rows) {
    const key = normalizeExerciseName(row.exercise)
    if (key === '') continue
    const entry = freq.get(key)
    if (entry) entry.count++
    else freq.set(key, { name: cleanExerciseName(row.exercise), count: 1 })
  }
  return [...freq.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, max)
    .map((e) => e.name)
}
