import { describe, it, expect } from 'vitest'
import {
  emptyDraft,
  cleanExerciseName,
  normalizeExerciseName,
  draftStatus,
  draftsToEntries,
  rowsToDrafts,
  totalVolumeKg,
  buildPrMap,
  detectNewPrs,
  buildGymRecords,
  buildExerciseProgression,
  progressionExercises,
  exerciseSuggestions,
  SETS_MAX,
  REPS_MAX,
  WEIGHT_KG_MAX,
  EXERCISE_NAME_MAX,
  type ExerciseDraft,
} from './exerciseSets'

function draft(partial: Partial<ExerciseDraft>): ExerciseDraft {
  return { ...emptyDraft(), ...partial }
}

describe('cleanExerciseName / normalizeExerciseName', () => {
  it('collassa gli spazi e taglia ai limiti del DB', () => {
    expect(cleanExerciseName('  Panca   piana ')).toBe('Panca piana')
    expect(cleanExerciseName('x'.repeat(EXERCISE_NAME_MAX + 20))).toHaveLength(EXERCISE_NAME_MAX)
  })

  it('la chiave dei PR ignora maiuscole e spazi', () => {
    expect(normalizeExerciseName('Panca  Piana')).toBe(normalizeExerciseName(' panca piana'))
  })
})

describe('draftStatus', () => {
  it('senza nome è una riga vuota, qualunque cosa contengano gli altri campi', () => {
    expect(draftStatus(draft({ sets: '3', reps: '10', weight: '60' }))).toBe('empty')
    expect(draftStatus(draft({ exercise: '   ' }))).toBe('empty')
  })

  it('con nome ma serie o ripetizioni mancanti/non valide è incompleta', () => {
    expect(draftStatus(draft({ exercise: 'Panca', reps: '10' }))).toBe('incomplete')
    expect(draftStatus(draft({ exercise: 'Panca', sets: '0', reps: '10' }))).toBe('incomplete')
    expect(draftStatus(draft({ exercise: 'Panca', sets: '3', reps: 'abc' }))).toBe('incomplete')
  })

  it('il peso non incide sulla validità (corpo libero)', () => {
    expect(draftStatus(draft({ exercise: 'Trazioni', sets: '4', reps: '8' }))).toBe('valid')
  })
})

describe('draftsToEntries', () => {
  it('converte solo le righe valide, scartando vuote e incomplete', () => {
    const entries = draftsToEntries([
      draft({ exercise: 'Panca piana', sets: '3', reps: '10', weight: '60' }),
      draft({}),
      draft({ exercise: 'Squat', sets: '', reps: '5' }),
      draft({ exercise: 'Trazioni', sets: '4', reps: '8', weight: '' }),
    ])
    expect(entries).toEqual([
      { exercise: 'Panca piana', sets: 3, reps: 10, weightKg: 60 },
      { exercise: 'Trazioni', sets: 4, reps: 8, weightKg: null },
    ])
  })

  it('accetta la virgola decimale nel peso', () => {
    const [e] = draftsToEntries([draft({ exercise: 'Curl', sets: '3', reps: '12', weight: '7,5' })])
    expect(e.weightKg).toBe(7.5)
  })

  it('un peso non interpretabile o non positivo vale corpo libero', () => {
    const entries = draftsToEntries([
      draft({ exercise: 'A', sets: '1', reps: '1', weight: 'boh' }),
      draft({ exercise: 'B', sets: '1', reps: '1', weight: '-5' }),
    ])
    expect(entries.map((e) => e.weightKg)).toEqual([null, null])
  })

  it('taglia serie, ripetizioni e peso ai limiti del DB', () => {
    const [e] = draftsToEntries([
      draft({ exercise: 'Mostro', sets: '500', reps: '5000', weight: '99999' }),
    ])
    expect(e).toEqual({ exercise: 'Mostro', sets: SETS_MAX, reps: REPS_MAX, weightKg: WEIGHT_KG_MAX })
  })

  it('arrotonda il peso ai 2 decimali della colonna', () => {
    const [e] = draftsToEntries([draft({ exercise: 'Curl', sets: '1', reps: '1', weight: '7.333' })])
    expect(e.weightKg).toBe(7.33)
  })
})

describe('rowsToDrafts', () => {
  it('riporta le righe salvate a bozze modificabili (peso null = campo vuoto)', () => {
    const drafts = rowsToDrafts([
      { exercise: 'Panca piana', sets: 3, reps: 10, weight_kg: 60 },
      { exercise: 'Trazioni', sets: 4, reps: 8, weight_kg: null },
    ])
    expect(drafts[0]).toMatchObject({ exercise: 'Panca piana', sets: '3', reps: '10', weight: '60' })
    expect(drafts[1].weight).toBe('')
    expect(drafts[0].key).not.toBe(drafts[1].key)
  })

  it('round-trip: le bozze generate tornano alle stesse voci', () => {
    const rows = [{ exercise: 'Squat', sets: 5, reps: 5, weight_kg: 82.5 }]
    expect(draftsToEntries(rowsToDrafts(rows))).toEqual([
      { exercise: 'Squat', sets: 5, reps: 5, weightKg: 82.5 },
    ])
  })
})

describe('totalVolumeKg', () => {
  it('somma serie × rip × kg ignorando il corpo libero', () => {
    expect(totalVolumeKg([
      { exercise: 'Panca', sets: 3, reps: 10, weightKg: 60 },
      { exercise: 'Trazioni', sets: 4, reps: 8, weightKg: null },
      { exercise: 'Curl', sets: 2, reps: 12, weightKg: 7.5 },
    ])).toBe(1980)
  })
})

describe('buildPrMap / detectNewPrs', () => {
  const history = [
    { exercise: 'Panca piana', weight_kg: 70 },
    { exercise: 'panca  piana', weight_kg: 75 },
    { exercise: 'Squat', weight_kg: 100 },
    { exercise: 'Trazioni', weight_kg: null },
  ]

  it('la mappa tiene il massimo per chiave normalizzata', () => {
    const map = buildPrMap(history)
    expect(map.get('panca piana')).toBe(75)
    expect(map.get('squat')).toBe(100)
    expect(map.has('trazioni')).toBe(false)
  })

  it('segnala il PR quando il carico supera il massimo storico', () => {
    const prs = detectNewPrs(
      [{ exercise: 'Panca Piana', sets: 1, reps: 3, weightKg: 80 }],
      buildPrMap(history),
    )
    expect(prs).toEqual([{ exercise: 'Panca Piana', weightKg: 80, previousKg: 75 }])
  })

  it('eguagliare il massimo non è un PR', () => {
    expect(detectNewPrs(
      [{ exercise: 'Squat', sets: 1, reps: 1, weightKg: 100 }],
      buildPrMap(history),
    )).toEqual([])
  })

  it('il primo carico in assoluto per un esercizio è un PR con previous null', () => {
    const prs = detectNewPrs(
      [{ exercise: 'Stacco', sets: 1, reps: 5, weightKg: 90 }],
      buildPrMap(history),
    )
    expect(prs).toEqual([{ exercise: 'Stacco', weightKg: 90, previousKg: null }])
  })

  it('più voci dello stesso esercizio contano una volta sola, col massimo', () => {
    const prs = detectNewPrs(
      [
        { exercise: 'Panca piana', sets: 3, reps: 8, weightKg: 77.5 },
        { exercise: 'Panca piana', sets: 1, reps: 1, weightKg: 82.5 },
      ],
      buildPrMap(history),
    )
    expect(prs).toEqual([{ exercise: 'Panca piana', weightKg: 82.5, previousKg: 75 }])
  })

  it('gli esercizi a corpo libero non generano PR', () => {
    expect(detectNewPrs(
      [{ exercise: 'Trazioni', sets: 5, reps: 10, weightKg: null }],
      buildPrMap(history),
    )).toEqual([])
  })
})

describe('buildGymRecords', () => {
  it('un record per esercizio, dal carico più alto, col nome della riga migliore', () => {
    expect(buildGymRecords([
      { exercise: 'panca piana', weight_kg: 70 },
      { exercise: 'Panca piana', weight_kg: 80 },
      { exercise: 'Squat', weight_kg: 100 },
      { exercise: 'Trazioni', weight_kg: null },
    ])).toEqual([
      { exercise: 'Squat', weightKg: 100 },
      { exercise: 'Panca piana', weightKg: 80 },
    ])
  })
})

describe('buildExerciseProgression', () => {
  const rows = [
    { exercise: 'Panca piana', weight_kg: 60, date: '2026-06-01T10:00:00' },
    { exercise: 'panca piana', weight_kg: 70, date: '2026-06-01T18:00:00' }, // stesso giorno: vince il max
    { exercise: 'Panca Piana', weight_kg: 65, date: '2026-06-08T10:00:00' },
    { exercise: 'Squat', weight_kg: 100, date: '2026-06-01T10:00:00' }, // altro esercizio
    { exercise: 'Panca piana', weight_kg: null, date: '2026-06-15T10:00:00' }, // corpo libero: fuori
    { exercise: 'Panca piana', weight_kg: 80 }, // senza data: fuori
  ]

  it('un punto per giornata col massimo del giorno, in ordine cronologico', () => {
    expect(buildExerciseProgression(rows, 'panca PIANA')).toEqual([
      { date: '2026-06-01', weightKg: 70 },
      { date: '2026-06-08', weightKg: 65 },
    ])
  })

  it('esercizio sconosciuto o vuoto = serie vuota', () => {
    expect(buildExerciseProgression(rows, 'Stacco')).toEqual([])
    expect(buildExerciseProgression(rows, '  ')).toEqual([])
  })
})

describe('progressionExercises', () => {
  it('propone solo esercizi con almeno 2 giornate con carico, dal più allenato', () => {
    const rows = [
      { exercise: 'Panca piana', weight_kg: 60, date: '2026-06-01T10:00:00' },
      { exercise: 'panca piana', weight_kg: 65, date: '2026-06-08T10:00:00' },
      { exercise: 'Panca piana', weight_kg: 70, date: '2026-06-15T10:00:00' },
      { exercise: 'Squat', weight_kg: 100, date: '2026-06-01T10:00:00' },
      { exercise: 'Squat', weight_kg: 105, date: '2026-06-08T10:00:00' },
      { exercise: 'Stacco', weight_kg: 120, date: '2026-06-01T10:00:00' }, // una sola giornata
      { exercise: 'Trazioni', weight_kg: null, date: '2026-06-01T10:00:00' }, // corpo libero
    ]
    expect(progressionExercises(rows)).toEqual(['Panca piana', 'Squat'])
  })

  it('due sessioni nello stesso giorno contano come una giornata', () => {
    const rows = [
      { exercise: 'Squat', weight_kg: 100, date: '2026-06-01T10:00:00' },
      { exercise: 'Squat', weight_kg: 105, date: '2026-06-01T18:00:00' },
    ]
    expect(progressionExercises(rows)).toEqual([])
  })
})

describe('exerciseSuggestions', () => {
  it('dal più usato, senza duplicati per casing, entro il limite', () => {
    const rows = [
      { exercise: 'Squat' },
      { exercise: 'Panca piana' },
      { exercise: 'panca  piana' },
      { exercise: 'Curl' },
      { exercise: 'Panca Piana' },
    ]
    expect(exerciseSuggestions(rows)).toEqual(['Panca piana', 'Curl', 'Squat'])
    expect(exerciseSuggestions(rows, 1)).toEqual(['Panca piana'])
  })
})
