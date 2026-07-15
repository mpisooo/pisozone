import { describe, it, expect } from 'vitest'
import { countUnread, notificationTarget, NOTIFICATION_TYPES } from './notifications'

describe('countUnread', () => {
  it('conta solo le righe senza read_at', () => {
    expect(countUnread([{ read_at: null }, { read_at: '2026-07-16T10:00:00' }, { read_at: null }])).toBe(2)
  })

  it('zero su lista vuota o tutta letta', () => {
    expect(countUnread([])).toBe(0)
    expect(countUnread([{ read_at: '2026-07-16T10:00:00' }])).toBe(0)
  })
})

describe('notificationTarget', () => {
  it('le notifiche sociali con attore portano a Social sulla scheda giusta', () => {
    expect(notificationTarget('friend_request')).toEqual({ path: '/social', tab: 'friends' })
    expect(notificationTarget('friend_accepted')).toEqual({ path: '/social', tab: 'friends' })
    expect(notificationTarget('reaction')).toEqual({ path: '/social', tab: 'feed' })
    expect(notificationTarget('comment')).toEqual({ path: '/social', tab: 'feed' })
  })

  it('level_up porta al Profilo, senza scheda', () => {
    expect(notificationTarget('level_up')).toEqual({ path: '/profile' })
  })

  it('ogni tipo dichiarato ha un target', () => {
    for (const type of NOTIFICATION_TYPES) {
      expect(notificationTarget(type).path).toBeTruthy()
    }
  })
})
