import { describe, it, expect } from 'vitest'
import { isQuietHour, allowsNotification, type NotificationPrefs } from './notificationPrefs'

describe('isQuietHour', () => {
  it('nessuna fascia impostata: mai in silenzio', () => {
    expect(isQuietHour(3)).toBe(false)
    expect(isQuietHour(3, null, null)).toBe(false)
    expect(isQuietHour(3, 22, undefined)).toBe(false)
  })

  it('fascia nello stesso giorno (8-18)', () => {
    expect(isQuietHour(7, 8, 18)).toBe(false)
    expect(isQuietHour(8, 8, 18)).toBe(true)
    expect(isQuietHour(17, 8, 18)).toBe(true)
    expect(isQuietHour(18, 8, 18)).toBe(false)
  })

  it('fascia a cavallo di mezzanotte (23-7)', () => {
    expect(isQuietHour(23, 23, 7)).toBe(true)
    expect(isQuietHour(0, 23, 7)).toBe(true)
    expect(isQuietHour(6, 23, 7)).toBe(true)
    expect(isQuietHour(7, 23, 7)).toBe(false)
    expect(isQuietHour(12, 23, 7)).toBe(false)
  })

  it('start === end: nessuna fascia (evita silenzio permanente per errore)', () => {
    expect(isQuietHour(10, 10, 10)).toBe(false)
  })
})

describe('allowsNotification', () => {
  it('senza preferenze salvate (pre-migrazione), tutto è consentito', () => {
    expect(allowsNotification(null, 'reminder', 22)).toBe(true)
    expect(allowsNotification(undefined, 'messages', 3)).toBe(true)
  })

  it('categoria disattivata blocca a prescindere dall\'ora', () => {
    const prefs: NotificationPrefs = { notif_messages_enabled: false }
    expect(allowsNotification(prefs, 'messages', 12)).toBe(false)
  })

  it('categoria attiva ma dentro la fascia di silenzio: bloccata', () => {
    const prefs: NotificationPrefs = { notif_quiet_start: 23, notif_quiet_end: 7 }
    expect(allowsNotification(prefs, 'reminder', 2)).toBe(false)
    expect(allowsNotification(prefs, 'reminder', 12)).toBe(true)
  })

  it('la fascia di silenzio si applica a tutte le categorie', () => {
    const prefs: NotificationPrefs = { notif_friend_requests_enabled: true, notif_quiet_start: 22, notif_quiet_end: 8 }
    expect(allowsNotification(prefs, 'friend_requests', 23)).toBe(false)
  })
})
