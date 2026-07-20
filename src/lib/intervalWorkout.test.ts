import { describe, it, expect } from 'vitest'
import {
  isValidIntervalPlan, buildIntervalSteps, isStepComplete, nextStepIndex,
  type IntervalPlan,
} from './intervalWorkout'

const PLAN: IntervalPlan = {
  repeats: 3,
  workDistanceM: 800,
  workZoneId: 4,
  recoverySec: 90,
  recoveryZoneId: 1,
}

describe('isValidIntervalPlan', () => {
  it('accetta un piano nei limiti', () => {
    expect(isValidIntervalPlan(PLAN)).toBe(true)
  })

  it('rifiuta ripetute fuori limite o non intere', () => {
    expect(isValidIntervalPlan({ ...PLAN, repeats: 1 })).toBe(false)
    expect(isValidIntervalPlan({ ...PLAN, repeats: 21 })).toBe(false)
    expect(isValidIntervalPlan({ ...PLAN, repeats: 2.5 })).toBe(false)
  })

  it('rifiuta distanza di lavoro o recupero fuori limite', () => {
    expect(isValidIntervalPlan({ ...PLAN, workDistanceM: 50 })).toBe(false)
    expect(isValidIntervalPlan({ ...PLAN, workDistanceM: 20000 })).toBe(false)
    expect(isValidIntervalPlan({ ...PLAN, recoverySec: 5 })).toBe(false)
    expect(isValidIntervalPlan({ ...PLAN, recoverySec: 900 })).toBe(false)
  })
})

describe('buildIntervalSteps', () => {
  it('alterna lavoro e recupero per ogni ripetuta, nell\'ordine', () => {
    const steps = buildIntervalSteps(PLAN)
    expect(steps).toHaveLength(6) // 3 ripetute × (lavoro + recupero)
    expect(steps.map((s) => s.kind)).toEqual(['work', 'recovery', 'work', 'recovery', 'work', 'recovery'])
    expect(steps.map((s) => s.repNumber)).toEqual([1, 1, 2, 2, 3, 3])
    expect(steps[0]).toMatchObject({ index: 0, zoneId: 4, target: 800 })
    expect(steps[1]).toMatchObject({ index: 1, zoneId: 1, target: 90 })
  })
})

describe('isStepComplete', () => {
  const steps = buildIntervalSteps(PLAN)
  const work = steps[0] // 800m target
  const recovery = steps[1] // 90s target

  it('uno step "work" si conclude in base alla distanza, non al tempo', () => {
    expect(isStepComplete(work, 799, 999)).toBe(false)
    expect(isStepComplete(work, 800, 0)).toBe(true)
    expect(isStepComplete(work, 900, 0)).toBe(true)
  })

  it('uno step "recovery" si conclude in base al tempo, non alla distanza', () => {
    expect(isStepComplete(recovery, 9999, 89)).toBe(false)
    expect(isStepComplete(recovery, 0, 90)).toBe(true)
  })
})

describe('nextStepIndex', () => {
  const steps = buildIntervalSteps(PLAN)

  it('resta fermo se lo step corrente non è concluso', () => {
    expect(nextStepIndex(steps, 0, 400, 0)).toBe(0)
  })

  it('avanza di uno step quando quello corrente è concluso', () => {
    expect(nextStepIndex(steps, 0, 800, 0)).toBe(1)
  })

  it('resta sull\'ultimo indice una volta esaurita la sequenza', () => {
    expect(nextStepIndex(steps, steps.length, 99999, 99999)).toBe(steps.length)
  })
})
