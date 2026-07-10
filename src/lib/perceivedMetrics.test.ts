import { describe, it, expect } from 'vitest'
import {
  rpeLabel, rpeZone, moodOption, MOOD_OPTIONS,
  RPE_MIN, RPE_MAX, MOOD_MIN, MOOD_MAX,
} from './perceivedMetrics'

describe('rpeLabel', () => {
  it('assegna un\'etichetta a ogni valore dell\'intera scala 1-10', () => {
    for (let rpe = RPE_MIN; rpe <= RPE_MAX; rpe++) {
      expect(rpeLabel(rpe), `rpe=${rpe}`).toBeTruthy()
    }
  })

  it('è monotona: valori più alti non tornano a un\'etichetta precedente', () => {
    const labels = Array.from({ length: RPE_MAX }, (_, i) => rpeLabel(i + 1))
    const uniqueInOrder = [...new Set(labels)]
    // Le etichette devono comparire in blocchi contigui (1,1,2,2,3,3...),
    // mai intervallate: se ricompare un'etichetta già vista e "chiusa", c'è un buco nei range.
    const seen = new Set<string>()
    let prev = ''
    for (const l of labels) {
      if (l !== prev) {
        expect(seen.has(l), `"${l}" ricompare fuori sequenza`).toBe(false)
        seen.add(l)
        prev = l
      }
    }
    expect(uniqueInOrder.length).toBeGreaterThan(1)
  })

  it('il minimo è "Leggero" e il massimo è "Massimale"', () => {
    expect(rpeLabel(RPE_MIN)).toBe('Leggero')
    expect(rpeLabel(RPE_MAX)).toBe('Massimale')
  })
})

describe('rpeZone', () => {
  it('cresce verso la zona 4 (Picco) man mano che l\'RPE sale', () => {
    expect(rpeZone(RPE_MIN).id).toBe(1)
    expect(rpeZone(RPE_MAX).id).toBe(4)
  })

  it('non decresce mai all\'aumentare dell\'RPE', () => {
    let prevId = 0
    for (let rpe = RPE_MIN; rpe <= RPE_MAX; rpe++) {
      const id = rpeZone(rpe).id
      expect(id, `rpe=${rpe}`).toBeGreaterThanOrEqual(prevId)
      prevId = id
    }
  })
})

describe('MOOD_OPTIONS / moodOption', () => {
  it('copre esattamente la scala 1-5, in ordine', () => {
    expect(MOOD_OPTIONS.map((o) => o.value)).toEqual([1, 2, 3, 4, 5])
    expect(MOOD_OPTIONS.length).toBe(MOOD_MAX - MOOD_MIN + 1)
  })

  it('ogni opzione ha un\'etichetta e un\'icona', () => {
    for (const o of MOOD_OPTIONS) {
      expect(o.label).toBeTruthy()
      expect(o.Icon).toBeTruthy()
    }
  })

  it('moodOption trova la voce corretta e torna undefined fuori scala', () => {
    expect(moodOption(3)?.label).toBe('Nella norma')
    expect(moodOption(0)).toBeUndefined()
    expect(moodOption(6)).toBeUndefined()
  })
})
