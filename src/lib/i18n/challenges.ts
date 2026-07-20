import { createNamespaceProxy, type Widen } from './proxy'

// Namespace di Challenges.tsx (pagina "Sfide di oggi") e degli errori del
// hook condiviso useDailyChallenges.ts (Home e Challenges).
const it = {
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

const en: Widen<typeof it> = {
  titlePrefix: 'Challenges for ',
  titleHighlight: 'today',
  creditsBalanceLabel: 'Your credits',
  todayCreditsLabel: "Today's credits",
  allClaimed: "🎉 You've completed all of today's challenges!",
  claimedLabel: 'Completed!',
  claiming: 'Claiming...',
  claimButton: (credits: number) => `Claim +${credits} credits`,
  inProgress: 'In progress...',
  footerHint: 'Challenges refresh every day. Come back tomorrow for new ones!',

  errors: {
    loadFailed: 'Failed to load challenges. Please try again.',
  },
}

const challenges = createNamespaceProxy(it, en)

export default challenges
