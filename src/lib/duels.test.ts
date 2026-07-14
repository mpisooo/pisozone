import { describe, it, expect } from 'vitest'
import { duelState, duelDaysLeft, duelWinnerId, canClaimDuel, formatDuelValue } from './duels'

const row = (user_id: string, value: number) => ({ user_id, username: user_id, photo_url: null, value })

describe('duelState', () => {
  it('distingue in corso e finestra chiusa', () => {
    const d = { status: 'active', ends_on: '2026-07-20' } as const
    expect(duelState(d, '2026-07-20')).toBe('running')
    expect(duelState(d, '2026-07-21')).toBe('ended')
  })
  it('rispetta gli stati espliciti', () => {
    expect(duelState({ status: 'pending', ends_on: '2026-07-20' } as const, '2026-07-25')).toBe('pending')
    expect(duelState({ status: 'declined', ends_on: '2026-07-20' } as const, '2026-07-10')).toBe('declined')
    expect(duelState({ status: 'finished', ends_on: '2026-07-20' } as const, '2026-07-25')).toBe('finished')
  })
})

describe('duelDaysLeft', () => {
  it('conta i giorni rimanenti, mai negativi', () => {
    expect(duelDaysLeft({ ends_on: '2026-07-20' }, '2026-07-18')).toBe(2)
    expect(duelDaysLeft({ ends_on: '2026-07-20' }, '2026-07-25')).toBe(0)
  })
})

describe('duelWinnerId', () => {
  it('vince il valore più alto', () => {
    expect(duelWinnerId([row('a', 120), row('b', 90)])).toBe('a')
  })
  it('parità o zero = nessun vincitore', () => {
    expect(duelWinnerId([row('a', 90), row('b', 90)])).toBeNull()
    expect(duelWinnerId([row('a', 0), row('b', 0)])).toBeNull()
    expect(duelWinnerId([])).toBeNull()
  })
})

describe('canClaimDuel', () => {
  const d = { status: 'active', ends_on: '2026-07-20' } as const
  const rows = [row('me', 100), row('other', 50)]
  it('solo il vincitore a finestra chiusa', () => {
    expect(canClaimDuel(d, rows, 'me', '2026-07-21')).toBe(true)
    expect(canClaimDuel(d, rows, 'other', '2026-07-21')).toBe(false)
    expect(canClaimDuel(d, rows, 'me', '2026-07-20')).toBe(false)
    expect(canClaimDuel({ ...d, status: 'finished' }, rows, 'me', '2026-07-21')).toBe(false)
  })
})

describe('formatDuelValue', () => {
  it('formatta secondo la metrica', () => {
    expect(formatDuelValue('sessions', 4)).toBe('4')
    expect(formatDuelValue('minutes', 95)).toBe('95 min')
    expect(formatDuelValue('km', 12.34)).toBe('12,3 km')
    // it-IT raggruppa le migliaia solo da 5 cifre in su (strategia min2 ICU)
    expect(formatDuelValue('kcal', 1520)).toBe('1520 kcal')
    expect(formatDuelValue('kcal', 15200)).toBe('15.200 kcal')
  })
})
