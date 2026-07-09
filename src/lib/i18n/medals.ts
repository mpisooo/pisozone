// Namespace di Medals.tsx, MedalCelebrationOverlay.tsx (sotto `celebration`)
// e degli errori del hook useAchievements.ts.
const medals = {
  pageTitle: 'MEDAGLIE',
  unlockedLabel: 'sbloccate',
  overallProgress: 'Progresso totale',
  unlockCreditsLabel: (credits: number) => `+${credits} 💎 a sblocco`,
  unlockedStatus: 'Sbloccata',
  claiming: 'Riscatto...',
  claimButton: (credits: number) => `Riscatta +${credits} 💎`,

  celebration: {
    unlockedAriaLabel: (name: string) => `Medaglia sbloccata: ${name}`,
    title: 'MEDAGLIA SBLOCCATA!',
    creditsEarned: (credits: number) => `+${credits} crediti`,
    doneButton: 'Fantastico!',
  },

  errors: {
    loadFailed: 'Errore nel caricamento delle medaglie. Riprova.',
    claimFailed: 'Riscatto medaglia non riuscito. Riprova.',
  },
} as const

export default medals
