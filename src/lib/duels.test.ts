import { describe, it, expect } from 'vitest'
import { duelState, duelDaysLeft, duelWinnerId, canClaimDuel, formatDuelValue, duelBarPct } from './duels'

const row = (user_id: string, value: number | null) => ({ user_id, username: user_id, photo_url: null, value })

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
  it('il giorno della creazione mostra tutti i giorni della sfida (oggi conta)', () => {
    // Sfida di 7 giorni creata oggi: ends_on = oggi + 6 (useDuels.ts).
    expect(duelDaysLeft({ ends_on: '2026-07-20' }, '2026-07-14')).toBe(7)
  })
  it("l'ultimo giorno utile mostra 1, mai 0 (la sfida è ancora in corso)", () => {
    expect(duelDaysLeft({ ends_on: '2026-07-20' }, '2026-07-20')).toBe(1)
  })
  it('dopo la scadenza resta a 0, mai negativo', () => {
    expect(duelDaysLeft({ ends_on: '2026-07-20' }, '2026-07-21')).toBe(0)
    expect(duelDaysLeft({ ends_on: '2026-07-20' }, '2026-07-25')).toBe(0)
  })
})

describe('duelWinnerId', () => {
  it('vince il valore più alto per i metric ordinari', () => {
    expect(duelWinnerId([row('a', 120), row('b', 90)], 'km')).toBe('a')
  })
  it('parità o zero = nessun vincitore', () => {
    expect(duelWinnerId([row('a', 90), row('b', 90)], 'km')).toBeNull()
    expect(duelWinnerId([row('a', 0), row('b', 0)], 'km')).toBeNull()
    expect(duelWinnerId([], 'km')).toBeNull()
  })
  it('per segment_time vince il tempo più basso', () => {
    expect(duelWinnerId([row('a', 45), row('b', 60)], 'segment_time')).toBe('a')
  })
  it('per segment_time chi non ha ancora un tentativo (null) non vince e non conta per la parità', () => {
    expect(duelWinnerId([row('a', 45), row('b', null)], 'segment_time')).toBe('a')
    expect(duelWinnerId([row('a', null), row('b', null)], 'segment_time')).toBeNull()
  })
})

describe('canClaimDuel', () => {
  const d = { status: 'active', ends_on: '2026-07-20', metric: 'km' } as const
  const rows = [row('me', 100), row('other', 50)]
  it('solo il vincitore a finestra chiusa', () => {
    expect(canClaimDuel(d, rows, 'me', '2026-07-21')).toBe(true)
    expect(canClaimDuel(d, rows, 'other', '2026-07-21')).toBe(false)
    expect(canClaimDuel(d, rows, 'me', '2026-07-20')).toBe(false)
    expect(canClaimDuel({ ...d, status: 'finished' }, rows, 'me', '2026-07-21')).toBe(false)
  })
  it('per segment_time vince chi ha il tempo più basso', () => {
    const segDuel = { status: 'active', ends_on: '2026-07-20', metric: 'segment_time' } as const
    const segRows = [row('me', 45), row('other', 60)]
    expect(canClaimDuel(segDuel, segRows, 'me', '2026-07-21')).toBe(true)
    expect(canClaimDuel(segDuel, segRows, 'other', '2026-07-21')).toBe(false)
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
  it('formatta segment_time come mm:ss', () => {
    expect(formatDuelValue('segment_time', 272)).toBe('4:32')
  })
  it('un valore null è "nessun tentativo", qualunque sia il metric', () => {
    expect(formatDuelValue('km', null)).toBe('—')
    expect(formatDuelValue('segment_time', null)).toBe('—')
  })
})

describe('duelBarPct', () => {
  it('per i metric ordinari è proporzionale al massimo', () => {
    expect(duelBarPct(50, [50, 100], 'km')).toBe(50)
    expect(duelBarPct(100, [50, 100], 'km')).toBe(100)
  })
  it('per segment_time è proporzionale al rapporto col tempo migliore (più basso = barra più piena)', () => {
    expect(duelBarPct(45, [45, 90], 'segment_time')).toBe(100)
    expect(duelBarPct(90, [45, 90], 'segment_time')).toBe(50)
  })
  it('un valore null o assente dà una barra vuota', () => {
    expect(duelBarPct(null, [45, 90], 'segment_time')).toBe(0)
    expect(duelBarPct(0, [0], 'km')).toBe(0)
  })
})
