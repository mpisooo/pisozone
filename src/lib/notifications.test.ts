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
  const n = (type: (typeof NOTIFICATION_TYPES)[number], activity_id: string | null = null) => ({ type, activity_id })

  it('le notifiche sociali con attore portano a Social sulla scheda giusta', () => {
    expect(notificationTarget(n('friend_request'))).toEqual({ path: '/social', tab: 'friends' })
    expect(notificationTarget(n('friend_accepted'))).toEqual({ path: '/social', tab: 'friends' })
  })

  it('reazioni e commenti portano all\'attività esatta nel feed (deep-link, pilastro 04)', () => {
    expect(notificationTarget(n('reaction', 'act-1'))).toEqual({ path: '/social', tab: 'feed', activityId: 'act-1' })
    expect(notificationTarget(n('comment', 'act-2'))).toEqual({ path: '/social', tab: 'feed', activityId: 'act-2' })
    // Riga storica senza activity_id: si degrada alla sola scheda
    expect(notificationTarget(n('reaction'))).toEqual({ path: '/social', tab: 'feed', activityId: undefined })
  })

  it('level_up porta al Profilo, senza scheda', () => {
    expect(notificationTarget(n('level_up'))).toEqual({ path: '/profile' })
  })

  it('duelli e podio stagionale portano alla sezione giusta di Sfide', () => {
    expect(notificationTarget(n('duel_invite'))).toEqual({ path: '/challenges', section: 'duels' })
    expect(notificationTarget(n('duel_accepted'))).toEqual({ path: '/challenges', section: 'duels' })
    expect(notificationTarget(n('duel_finished'))).toEqual({ path: '/challenges', section: 'duels' })
    expect(notificationTarget(n('seasonal_podium'))).toEqual({ path: '/challenges', section: 'seasonal' })
  })

  it('ogni tipo dichiarato ha un target', () => {
    for (const type of NOTIFICATION_TYPES) {
      expect(notificationTarget(n(type)).path).toBeTruthy()
    }
  })
})
