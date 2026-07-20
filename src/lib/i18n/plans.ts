import { createNamespaceProxy, type Widen } from './proxy'

// Namespace della pagina Programmi (pages/Plans.tsx) e del widget in Home.
// I CONTENUTI dei programmi (titoli, sessioni, tagline) sono dati di dominio e
// vivono in lib/plans.ts come CHALLENGE_POOL e MEDALS; qui c'è solo il chrome.
const it = {
  pageTitle: 'PROGRAMMI',
  pageSubtitle: 'Obiettivi a più settimane: alleni, e le sessioni si spuntano da sole.',

  active: {
    heading: 'IL TUO PROGRAMMA',
    weekOf: (current: number, total: number) => `Settimana ${current} di ${total}`,
    sessionsProgress: (done: number, total: number) => `${done}/${total} sessioni`,
    endsOn: (dateLabel: string) => `Si conclude ${dateLabel}`,
    weekLabel: (week: number) => `Settimana ${week}`,
    currentWeekTag: 'in corso',
    doneOn: (dateLabel: string) => `fatta · ${dateLabel}`,
    backlogTag: 'da recuperare',
    lockedTag: 'si sblocca più avanti',
    sessionMeta: (minMinutes: number, minKm?: number) =>
      minKm ? `≥ ${minMinutes} min · ≥ ${minKm} km` : `≥ ${minMinutes} min`,
    completedBanner: 'Programma completato! 🎉',
    claimButton: (credits: number) => `Riscatta +${credits} 💎`,
    claiming: 'Un attimo…',
    claimedToastTitle: 'Ricompensa riscattata!',
    claimedToastBody: (credits: number) => `+${credits} 💎 crediti per il programma completato`,
    expiredBanner: 'La finestra del programma è terminata',
    expiredHint: 'Non tutte le sessioni sono state completate. Puoi chiuderlo e ripartire quando vuoi.',
    abandonButton: 'Abbandona programma',
    abandonConfirm: 'Confermi l\'abbandono?',
    closeExpiredButton: 'Chiudi programma',
  },

  catalog: {
    heading: 'SCEGLI UN OBIETTIVO',
    weeksChip: (weeks: number) => `${weeks} settimane`,
    perWeekChip: (n: number) => `${n} sessioni/sett.`,
    creditsChip: (credits: number) => `+${credits} 💎`,
    levelLabels: {
      principiante: 'Principiante',
      intermedio: 'Intermedio',
    },
    startButton: 'Inizia',
    starting: 'Un attimo…',
    startBlockedHint: 'Completa o abbandona il programma attivo per iniziarne un altro',
    completedBadge: 'Completato ✓',
  },

  homeWidget: {
    title: 'Programma di allenamento',
    discoverTitle: 'Programmi di allenamento',
    discoverBody: 'Scegli un obiettivo a più settimane: 5K, palestra, yoga…',
    weekOf: (current: number, total: number) => `Settimana ${current} di ${total}`,
    sessionsShort: (done: number, total: number) => `${done}/${total}`,
    completedHint: 'Completato: riscatta la ricompensa!',
    expiredHint: 'Finestra terminata: passa a chiuderlo',
  },

  errors: {
    startFailed: 'Avvio del programma non riuscito. Riprova.',
    abandonFailed: 'Operazione non riuscita. Riprova.',
    claimFailed: 'Riscatto non riuscito. Controlla la connessione e riprova.',
  },
} as const

const en: Widen<typeof it> = {
  pageTitle: 'PLANS',
  pageSubtitle: 'Multi-week goals: train, and sessions check themselves off.',

  active: {
    heading: 'YOUR PLAN',
    weekOf: (current: number, total: number) => `Week ${current} of ${total}`,
    sessionsProgress: (done: number, total: number) => `${done}/${total} sessions`,
    endsOn: (dateLabel: string) => `Ends ${dateLabel}`,
    weekLabel: (week: number) => `Week ${week}`,
    currentWeekTag: 'in progress',
    doneOn: (dateLabel: string) => `done · ${dateLabel}`,
    backlogTag: 'catch up',
    lockedTag: 'unlocks later',
    sessionMeta: (minMinutes: number, minKm?: number) =>
      minKm ? `≥ ${minMinutes} min · ≥ ${minKm} km` : `≥ ${minMinutes} min`,
    completedBanner: 'Plan completed! 🎉',
    claimButton: (credits: number) => `Claim +${credits} 💎`,
    claiming: 'One sec…',
    claimedToastTitle: 'Reward claimed!',
    claimedToastBody: (credits: number) => `+${credits} 💎 credits for completing the plan`,
    expiredBanner: 'The plan\'s window has ended',
    expiredHint: 'Not all sessions were completed. You can close it and start over whenever you want.',
    abandonButton: 'Abandon plan',
    abandonConfirm: 'Abandon this plan?',
    closeExpiredButton: 'Close plan',
  },

  catalog: {
    heading: 'CHOOSE A GOAL',
    weeksChip: (weeks: number) => `${weeks} weeks`,
    perWeekChip: (n: number) => `${n} sessions/wk`,
    creditsChip: (credits: number) => `+${credits} 💎`,
    levelLabels: {
      principiante: 'Beginner',
      intermedio: 'Intermediate',
    },
    startButton: 'Start',
    starting: 'One sec…',
    startBlockedHint: 'Complete or abandon your active plan to start another one',
    completedBadge: 'Completed ✓',
  },

  homeWidget: {
    title: 'Training plan',
    discoverTitle: 'Training plans',
    discoverBody: 'Pick a multi-week goal: 5K, gym, yoga…',
    weekOf: (current: number, total: number) => `Week ${current} of ${total}`,
    sessionsShort: (done: number, total: number) => `${done}/${total}`,
    completedHint: 'Completed: claim your reward!',
    expiredHint: 'Window ended: go close it',
  },

  errors: {
    startFailed: 'Couldn\'t start the plan. Please try again.',
    abandonFailed: 'Action failed. Please try again.',
    claimFailed: 'Claim failed. Check your connection and try again.',
  },
}

const plans = createNamespaceProxy(it, en)

export default plans
