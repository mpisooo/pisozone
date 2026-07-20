import { createNamespaceProxy, type Widen } from './proxy'

// Namespace del centro notifiche in-app (context/NotificationsContext.tsx,
// components/NotificationBell.tsx). I messaggi per tipo sono funzioni: ogni
// riga si costruisce dal nome dell'attore (assente per level_up).
const it = {
  bellAriaLabel: 'Notifiche',
  heading: 'NOTIFICHE',
  emptyTitle: 'Tutto tranquillo',
  emptyHint: 'Le richieste di amicizia, reazioni e commenti che ricevi compaiono qui.',
  deleteAria: (message: string) => `Elimina notifica: ${message}`,
  deleteAllButton: 'Cancella tutte',

  messages: {
    friend_request: (name: string) => `@${name} ti ha inviato una richiesta di amicizia`,
    friend_accepted: (name: string) => `@${name} ha accettato la tua richiesta di amicizia`,
    reaction: (name: string, emoji: string) => `@${name} ha reagito ${emoji} a una tua attività`,
    comment: (name: string) => `@${name} ha commentato una tua attività`,
    level_up: (level: number) => `Sei salito al livello ${level}!`,
    duel_invite: (name: string) => `@${name} ti ha lanciato un duello`,
    duel_accepted: (name: string) => `@${name} ha accettato il tuo duello: si comincia!`,
    duel_won: (name: string) => `@${name} ha vinto il vostro duello`,
    duel_finished_no_winner: 'Il duello si è concluso senza un vincitore',
    seasonal_podium: (title: string, rank: number) =>
      rank === 1
        ? `Hai vinto "${title}"! Riscatta il podio nella pagina Sfide`
        : `Sei sul podio di "${title}" (${rank}º posto): riscatta i tuoi crediti`,
  },

  fallbackActor: 'Qualcuno',
  fallbackSeasonalTitle: 'l\'evento stagionale',
} as const

// Suffisso ordinale inglese per il podio (posizioni 2ª/3ª — la 1ª ha un ramo
// dedicato sopra).
const ordinal = (n: number) => (n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`)

const en: Widen<typeof it> = {
  bellAriaLabel: 'Notifications',
  heading: 'NOTIFICATIONS',
  emptyTitle: 'All quiet',
  emptyHint: 'Friend requests, reactions and comments you receive show up here.',
  deleteAria: (message: string) => `Delete notification: ${message}`,
  deleteAllButton: 'Clear all',

  messages: {
    friend_request: (name: string) => `@${name} sent you a friend request`,
    friend_accepted: (name: string) => `@${name} accepted your friend request`,
    reaction: (name: string, emoji: string) => `@${name} reacted ${emoji} to your activity`,
    comment: (name: string) => `@${name} commented on your activity`,
    level_up: (level: number) => `You've reached level ${level}!`,
    duel_invite: (name: string) => `@${name} challenged you to a duel`,
    duel_accepted: (name: string) => `@${name} accepted your duel: let's go!`,
    duel_won: (name: string) => `@${name} won your duel`,
    duel_finished_no_winner: 'The duel ended with no winner',
    seasonal_podium: (title: string, rank: number) =>
      rank === 1
        ? `You won "${title}"! Claim your podium spot on the Challenges page`
        : `You're on the podium of "${title}" (${ordinal(rank)} place): claim your credits`,
  },

  fallbackActor: 'Someone',
  fallbackSeasonalTitle: 'the seasonal event',
}

const notifications = createNamespaceProxy(it, en)

export default notifications
