// Namespace della pagina Programmi (pages/Plans.tsx) e del widget in Home.
// I CONTENUTI dei programmi (titoli, sessioni, tagline) sono dati di dominio e
// vivono in lib/plans.ts come CHALLENGE_POOL e MEDALS; qui c'è solo il chrome.
const plans = {
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

export default plans
