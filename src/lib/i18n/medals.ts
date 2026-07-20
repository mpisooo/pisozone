import { createNamespaceProxy, type Widen } from './proxy'

// Namespace di Medals.tsx, MedalCelebrationOverlay.tsx (sotto `celebration`)
// e degli errori del hook useAchievements.ts.
const it = {
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

const en: Widen<typeof it> = {
  pageTitle: 'MEDALS',
  unlockedLabel: 'unlocked',
  overallProgress: 'Overall progress',
  unlockCreditsLabel: (credits: number) => `+${credits} 💎 on unlock`,
  unlockedStatus: 'Unlocked',
  claiming: 'Claiming...',
  claimButton: (credits: number) => `Claim +${credits} 💎`,

  celebration: {
    unlockedAriaLabel: (name: string) => `Medal unlocked: ${name}`,
    title: 'MEDAL UNLOCKED!',
    creditsEarned: (credits: number) => `+${credits} credits`,
    doneButton: 'Awesome!',
  },

  errors: {
    loadFailed: 'Failed to load medals. Please try again.',
    claimFailed: 'Failed to claim medal. Please try again.',
  },
}

const medals = createNamespaceProxy(it, en)

export default medals
