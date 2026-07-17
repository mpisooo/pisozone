// Namespace del centro notifiche in-app (context/NotificationsContext.tsx,
// components/NotificationBell.tsx). I messaggi per tipo sono funzioni: ogni
// riga si costruisce dal nome dell'attore (assente per level_up).
const notifications = {
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

export default notifications
