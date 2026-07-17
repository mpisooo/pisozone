// Badge numerico sull'icona dell'app (Badging API, roadmap v3, pilastro 02):
// messaggi non letti + notifiche non lette, visibile ad app chiusa come per
// le app native. Su iPhone funziona nella PWA installata da iOS 16.4+ (e
// richiede il permesso notifiche); dove l'API non esiste è un no-op totale.
//
// Le due fonti (UnreadContext per i messaggi, NotificationsContext per il
// centro notifiche) riportano ognuna il proprio conteggio quando cambia: il
// modulo li tiene separati, somma e applica — così nessuna delle due
// sovrascrive l'altra.

export type BadgeSource = 'messages' | 'notifications'

const counts = new Map<BadgeSource, number>()

// Somma difensiva: conteggi negativi o non numerici valgono zero.
export function badgeTotal(values: Iterable<number>): number {
  let total = 0
  for (const v of values) {
    if (Number.isFinite(v) && v > 0) total += Math.floor(v)
  }
  return total
}

export function reportBadgeCount(source: BadgeSource, count: number): void {
  counts.set(source, count)
  applyBadge(badgeTotal(counts.values()))
}

function applyBadge(total: number): void {
  // La lib DOM di TypeScript dichiara già setAppBadge/clearAppBadge, ma a
  // runtime esistono solo su browser recenti (e su iOS solo nella PWA
  // installata): la guardia typeof resta indispensabile.
  if (typeof navigator === 'undefined' || typeof navigator.setAppBadge !== 'function') return
  // Best effort: senza permesso notifiche (o su piattaforme che rifiutano)
  // la promise viene respinta e il badge semplicemente non compare.
  const result = total > 0
    ? navigator.setAppBadge(total)
    : typeof navigator.clearAppBadge === 'function' ? navigator.clearAppBadge() : navigator.setAppBadge(0)
  result.catch(() => {})
}
