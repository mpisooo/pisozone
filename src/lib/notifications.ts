import type { AppNotification, NotificationType } from '../types'

// Centro notifiche in-app (roadmap v2, pilastro 03): logica pura di
// instradamento e conteggio, testata a parte. La cronologia vera e propria
// vive in notifications (v40), scritta solo dai trigger Postgres — qui c'è
// solo cosa fare col dato una volta arrivato al client.

export const NOTIFICATION_TYPES: NotificationType[] = [
  'friend_request', 'friend_accepted', 'reaction', 'comment', 'level_up',
]

export function countUnread(list: Pick<AppNotification, 'read_at'>[]): number {
  return list.filter((n) => n.read_at == null).length
}

// Dove porta il tap su una notifica: le sociali aprono Social sulla scheda
// giusta (stesso meccanismo di navigate('/social', { state: { tab } }) già
// usato da Home per classifica/amici); level_up non ha un attore né un
// posto "sociale", porta al Profilo dove vive il livello.
export function notificationTarget(type: NotificationType): { path: string; tab?: 'friends' | 'feed' } {
  switch (type) {
    case 'friend_request':
    case 'friend_accepted':
      return { path: '/social', tab: 'friends' }
    case 'reaction':
    case 'comment':
      return { path: '/social', tab: 'feed' }
    case 'level_up':
      return { path: '/profile' }
  }
}
