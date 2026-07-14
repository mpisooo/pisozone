import { describe, it, expect } from 'vitest'
import { daysSinceLastActivity, isComeback } from './comeback'
import type { Activity } from '../types'

const act = (date: string): Activity => ({
  id: date, user_id: 'u', type: 'corsa', date, duration_min: 30, calories: null,
  distance_km: null, notes: null, created_at: date, credits_earned: 0,
})

const NOW = new Date(2026, 6, 14, 12, 0)

describe('daysSinceLastActivity', () => {
  it('conta i giorni di calendario dall\'ultima attività', () => {
    expect(daysSinceLastActivity([act('2026-07-14T08:00:00'), act('2026-07-01T08:00:00')], NOW)).toBe(0)
    expect(daysSinceLastActivity([act('2026-07-09T22:00:00')], NOW)).toBe(5)
  })
  it('null senza attività', () => {
    expect(daysSinceLastActivity([], NOW)).toBeNull()
  })
})

describe('isComeback', () => {
  it('scatta da 4 giorni in su', () => {
    expect(isComeback(3)).toBe(false)
    expect(isComeback(4)).toBe(true)
    expect(isComeback(30)).toBe(true)
    expect(isComeback(null)).toBe(false)
  })
})
