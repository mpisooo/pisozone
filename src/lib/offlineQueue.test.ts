import { describe, it, expect } from 'vitest'
import {
  pendingActivityId,
  isPendingActivityId,
  toPendingActivity,
  mergeWithPending,
  isNetworkFailure,
  type QueuedActivity,
} from './offlineQueue'
import type { Activity } from '../types'

const payload: QueuedActivity['payload'] = {
  type: 'corsa',
  date: '2026-07-15T10:00:00.000Z',
  duration_min: 30,
  calories: 300,
  distance_km: 5,
  notes: null,
}

const queuedItem: QueuedActivity = {
  localId: 'abc123',
  payload,
  queuedAt: '2026-07-15T10:05:00.000Z',
}

const serverActivity: Activity = {
  id: 'real-1',
  user_id: 'user-1',
  type: 'palestra',
  date: '2026-07-14T09:00:00.000Z',
  duration_min: 45,
  calories: 250,
  distance_km: null,
  notes: null,
  created_at: '2026-07-14T09:01:00.000Z',
  credits_earned: 10,
}

describe('pendingActivityId / isPendingActivityId', () => {
  it('genera un id riconoscibile e lo riconosce come pending', () => {
    const id = pendingActivityId('abc123')
    expect(isPendingActivityId(id)).toBe(true)
  })

  it('non riconosce come pending un id reale del DB', () => {
    expect(isPendingActivityId('real-1')).toBe(false)
  })
})

describe('toPendingActivity', () => {
  it('costruisce un\'attività provvisoria con id sintetico e crediti a zero', () => {
    const pending = toPendingActivity(queuedItem, 'user-1')
    expect(pending.id).toBe('pending-abc123')
    expect(pending.user_id).toBe('user-1')
    expect(pending.credits_earned).toBe(0)
    expect(pending.created_at).toBe(queuedItem.queuedAt)
    expect(pending.type).toBe('corsa')
    expect(pending.duration_min).toBe(30)
  })
})

describe('mergeWithPending', () => {
  it('restituisce le attività server invariate a coda vuota', () => {
    expect(mergeWithPending([serverActivity], [], 'user-1')).toEqual([serverActivity])
  })

  it('antepone le attività in coda a quelle già sincronizzate', () => {
    const merged = mergeWithPending([serverActivity], [queuedItem], 'user-1')
    expect(merged).toHaveLength(2)
    expect(merged[0].id).toBe('pending-abc123')
    expect(merged[1]).toEqual(serverActivity)
  })
})

describe('isNetworkFailure', () => {
  it('riconosce status 0 come fallimento di rete', () => {
    expect(isNetworkFailure(0)).toBe(true)
  })

  it('non tratta un vero codice HTTP come fallimento di rete', () => {
    expect(isNetworkFailure(400)).toBe(false)
    expect(isNetworkFailure(500)).toBe(false)
    expect(isNetworkFailure(200)).toBe(false)
  })
})
