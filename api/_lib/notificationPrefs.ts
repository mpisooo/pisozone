// Modulo puro (nessun accesso a rete/env): decide se una notifica push va
// inviata in base alle preferenze utente. Separato da push.ts, che invece
// inizializza web-push/Supabase al import, per poter testare questa logica
// senza le env var VAPID/Supabase.

export type NotificationCategory = 'reminder' | 'messages' | 'friend_requests'

export interface NotificationPrefs {
  notif_reminder_enabled?: boolean | null
  notif_messages_enabled?: boolean | null
  notif_friend_requests_enabled?: boolean | null
  notif_quiet_start?: number | null
  notif_quiet_end?: number | null
}

const CATEGORY_ENABLED_FIELD: Record<NotificationCategory, keyof NotificationPrefs> = {
  reminder: 'notif_reminder_enabled',
  messages: 'notif_messages_enabled',
  friend_requests: 'notif_friend_requests_enabled',
}

// Fascia [start, end) nel fuso Europe/Rome, comune a tutte le categorie.
// Avvolge la mezzanotte se start > end (es. 23 -> 7 copre 23:00-06:59).
// null/undefined o start === end = nessuna fascia impostata.
export function isQuietHour(romeHour: number, start?: number | null, end?: number | null): boolean {
  if (start == null || end == null || start === end) return false
  return start < end ? romeHour >= start && romeHour < end : romeHour >= start || romeHour < end
}

export function allowsNotification(
  prefs: NotificationPrefs | null | undefined,
  category: NotificationCategory,
  romeHour: number,
): boolean {
  if (!prefs) return true
  if (prefs[CATEGORY_ENABLED_FIELD[category]] === false) return false
  return !isQuietHour(romeHour, prefs.notif_quiet_start, prefs.notif_quiet_end)
}
