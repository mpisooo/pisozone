// Namespace di Challenges.tsx (pagina "Sfide di oggi") e degli errori del
// hook condiviso useDailyChallenges.ts (Home e Challenges).
const challenges = {
  titlePrefix: 'Sfide di ',
  titleHighlight: 'oggi',
  creditsBalanceLabel: 'I tuoi crediti',
  todayCreditsLabel: 'Crediti di oggi',
  allClaimed: '🎉 Hai completato tutte le sfide di oggi!',
  claimedLabel: 'Completata!',
  claiming: 'Ritiro...',
  claimButton: (credits: number) => `Ritira +${credits} crediti`,
  inProgress: 'In corso...',
  footerHint: 'Le sfide si aggiornano ogni giorno. Torna domani per nuove sfide!',

  errors: {
    loadFailed: 'Errore nel caricamento delle sfide. Riprova.',
  },
} as const

export default challenges
