import { describe, it, expect } from 'vitest'
import {
  REACTION_KINDS,
  REACTION_EMOJI,
  normalizeKind,
  emptyReactionSummary,
  buildReactionSummaries,
  withMyReaction,
  topKinds,
} from './reactions'

describe('normalizeKind', () => {
  it('riconosce tutti i tipi validi', () => {
    for (const k of REACTION_KINDS) expect(normalizeKind(k)).toBe(k)
  })

  it('ripiega su heart per valori sconosciuti, null o assenti (righe pre-v31)', () => {
    expect(normalizeKind(undefined)).toBe('heart')
    expect(normalizeKind(null)).toBe('heart')
    expect(normalizeKind('like')).toBe('heart')
    expect(normalizeKind(42)).toBe('heart')
  })
})

describe('REACTION_EMOJI', () => {
  it('copre ogni tipo con una emoji', () => {
    for (const k of REACTION_KINDS) expect(REACTION_EMOJI[k].length).toBeGreaterThan(0)
  })
})

describe('buildReactionSummaries', () => {
  it('aggrega conteggi per attività e per tipo', () => {
    const map = buildReactionSummaries(
      [
        { activity_id: 'a1', user_id: 'u1', kind: 'fire' },
        { activity_id: 'a1', user_id: 'u2', kind: 'fire' },
        { activity_id: 'a1', user_id: 'u3', kind: 'clap' },
        { activity_id: 'a2', user_id: 'u1', kind: 'heart' },
      ],
      'me'
    )
    expect(map.get('a1')?.total).toBe(3)
    expect(map.get('a1')?.byKind.fire).toBe(2)
    expect(map.get('a1')?.byKind.clap).toBe(1)
    expect(map.get('a1')?.mine).toBeNull()
    expect(map.get('a2')?.total).toBe(1)
    expect(map.has('a3')).toBe(false)
  })

  it('riconosce la reazione dell’utente corrente', () => {
    const map = buildReactionSummaries(
      [
        { activity_id: 'a1', user_id: 'me', kind: 'rocket' },
        { activity_id: 'a1', user_id: 'u2', kind: 'heart' },
      ],
      'me'
    )
    expect(map.get('a1')?.mine).toBe('rocket')
  })

  it('tratta le righe senza kind come heart (compatibilità pre-migrazione)', () => {
    const map = buildReactionSummaries([{ activity_id: 'a1', user_id: 'u1' }], 'me')
    expect(map.get('a1')?.byKind.heart).toBe(1)
    expect(map.get('a1')?.total).toBe(1)
  })
})

describe('withMyReaction', () => {
  it('aggiunge una reazione dove non c’era', () => {
    const next = withMyReaction(emptyReactionSummary(), 'muscle')
    expect(next.total).toBe(1)
    expect(next.byKind.muscle).toBe(1)
    expect(next.mine).toBe('muscle')
  })

  it('cambia tipo senza alterare il totale', () => {
    const base = withMyReaction(emptyReactionSummary(), 'heart')
    const next = withMyReaction(base, 'fire')
    expect(next.total).toBe(1)
    expect(next.byKind.heart).toBe(0)
    expect(next.byKind.fire).toBe(1)
    expect(next.mine).toBe('fire')
  })

  it('rimuove la reazione con null', () => {
    const base = withMyReaction(emptyReactionSummary(), 'clap')
    const next = withMyReaction(base, null)
    expect(next.total).toBe(0)
    expect(next.byKind.clap).toBe(0)
    expect(next.mine).toBeNull()
  })

  it('non muta il riepilogo di partenza (serve al rollback)', () => {
    const base = withMyReaction(emptyReactionSummary(), 'heart')
    withMyReaction(base, 'rocket')
    expect(base.byKind.heart).toBe(1)
    expect(base.mine).toBe('heart')
  })
})

describe('topKinds', () => {
  it('ordina per conteggio decrescente e taglia a max', () => {
    const s = emptyReactionSummary()
    s.byKind.fire = 3
    s.byKind.heart = 1
    s.byKind.rocket = 2
    s.byKind.clap = 5
    s.total = 11
    expect(topKinds(s)).toEqual(['clap', 'fire', 'rocket'])
    expect(topKinds(s, 2)).toEqual(['clap', 'fire'])
  })

  it('a parità di conteggio mantiene l’ordine canonico', () => {
    const s = emptyReactionSummary()
    s.byKind.rocket = 1
    s.byKind.heart = 1
    s.total = 2
    expect(topKinds(s)).toEqual(['heart', 'rocket'])
  })

  it('è vuoto senza reazioni', () => {
    expect(topKinds(emptyReactionSummary())).toEqual([])
  })
})
