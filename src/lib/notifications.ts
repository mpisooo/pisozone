import type { AppNotification, NotificationType } from '../types'

// Centro notifiche in-app (roadmap v2, pilastro 03): logica pura di
// instradamento e conteggio, testata a parte. La cronologia vera e propria
// vive in notifications (v40), scritta solo dai trigger Postgres — qui c'è
// solo cosa fare col dato una volta arrivato al client.

export const NOTIFICATION_TYPES: NotificationType[] = [
  'friend_request', 'friend_accepted', 'reaction', 'comment', 'level_up',
  'duel_invite', 'duel_accepted', 'duel_finished', 'seasonal_podium',
]

export function countUnread(list: Pick<AppNotification, 'read_at'>[]): number {
  return list.filter((n) => n.read_at == null).length
}

export interface NotificationDestination {
  path: string
  tab?: 'friends' | 'feed'
  // Deep-link (roadmap v3, pilastro 04): l'attività esatta da evidenziare nel
  // feed (reazioni/commenti) e la sezione della pagina Sfide da raggiungere.
  activityId?: string
  section?: 'duels' | 'seasonal'
}

// Dove porta il tap su una notifica: non più solo la scheda giusta (v40) ma
// il punto esatto — l'attività commentata nel feed, la sezione duelli o
// l'evento stagionale in fondo a Sfide. level_up non ha un attore né un
// posto "sociale": porta al Profilo dove vive il livello.
export function notificationTarget(
  n: Pick<AppNotification, 'type' | 'activity_id'>,
): NotificationDestination {
  switch (n.type) {
    case 'friend_request':
    case 'friend_accepted':
      return { path: '/social', tab: 'friends' }
    case 'reaction':
    case 'comment':
      return { path: '/social', tab: 'feed', activityId: n.activity_id ?? undefined }
    case 'level_up':
      return { path: '/profile' }
    case 'duel_invite':
    case 'duel_accepted':
    case 'duel_finished':
      return { path: '/challenges', section: 'duels' }
    case 'seasonal_podium':
      return { path: '/challenges', section: 'seasonal' }
  }
}
