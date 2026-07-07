import { describe, it, expect } from 'vitest'
import { isRateLimitError } from './errors'

describe('isRateLimitError', () => {
  it('riconosce gli errori dei trigger di rate limit (v23/v24)', () => {
    expect(isRateLimitError({ message: 'RATE_LIMIT: massimo 20 inserimenti in 00:01:00 per messages' })).toBe(true)
  })

  it('ignora gli altri errori e i valori assenti', () => {
    expect(isRateLimitError({ message: 'duplicate key value violates unique constraint' })).toBe(false)
    expect(isRateLimitError({})).toBe(false)
    expect(isRateLimitError(null)).toBe(false)
    expect(isRateLimitError(undefined)).toBe(false)
  })
})
