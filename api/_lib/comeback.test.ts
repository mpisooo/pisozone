import { describe, it, expect } from 'vitest'
import { classifyReminder } from './comeback'

describe('classifyReminder', () => {
  it('assenza breve = promemoria standard', () => {
    expect(classifyReminder(1)).toBe('standard')
    expect(classifyReminder(2)).toBe('standard')
  })
  it('pietre miliari = messaggio di rientro', () => {
    for (const d of [3, 7, 14, 30]) expect(classifyReminder(d)).toBe('comeback')
  })
  it('tutto il resto = silenzio', () => {
    for (const d of [4, 5, 6, 10, 20, 45]) expect(classifyReminder(d)).toBe('skip')
    expect(classifyReminder(null)).toBe('skip')
  })
})
