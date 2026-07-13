// Namespace degli obiettivi personali (roadmap v2, pilastro 04): widget in
// Home (components/GoalsCard.tsx) + modale di creazione (GoalCreateModal.tsx)
// + errori di usePersonalGoals.ts.
const goals = {
  cardTitle: 'I MIEI OBIETTIVI',
  newGoal: 'Nuovo obiettivo',
  limitReached: 'Massimo 5 obiettivi attivi: concludine o eliminane uno per crearne altri',
  discoverTitle: 'Obiettivi personali',
  discoverBody: 'Fissa una meta libera: "100 km questo mese", "20 sessioni di palestra"…',

  metricLabels: {
    sessions: 'Sessioni',
    minutes: 'Minuti',
    km: 'Chilometri',
    kcal: 'Calorie',
  },
  // Titolo derivato dell'obiettivo, es. "100 km · Corsa" / "20 sessioni"
  goalTitle: (targetLabel: string, sportLabel: string | null) =>
    sportLabel ? `${targetLabel} · ${sportLabel}` : targetLabel,
  targetLabels: {
    sessions: (n: number) => n === 1 ? '1 sessione' : `${n.toLocaleString('it-IT')} sessioni`,
    minutes: (n: number) => `${n.toLocaleString('it-IT')} min`,
    km: (n: number) => `${n.toLocaleString('it-IT')} km`,
    kcal: (n: number) => `${n.toLocaleString('it-IT')} kcal`,
  },
  progressValue: (current: number, target: number) =>
    `${current.toLocaleString('it-IT')} / ${target.toLocaleString('it-IT')}`,
  daysLeft: (n: number) =>
    n === 0 ? 'scade oggi' : n === 1 ? 'manca 1 giorno' : `mancano ${n} giorni`,
  reachedBadge: 'Raggiunto ✓',
  expiredBadge: 'Scaduto',
  deleteAria: (title: string) => `Elimina obiettivo ${title}`,
  deleteConfirm: 'Sicuro?',

  create: {
    dialogAriaLabel: 'Crea un obiettivo personale',
    title: 'NUOVO OBIETTIVO',
    metricLabel: 'Cosa vuoi contare?',
    sportLabel: 'Sport',
    allSports: 'Tutti gli sport',
    targetLabel: 'Traguardo',
    targetPlaceholder: 'es. 100',
    targetInvalid: 'Inserisci un numero maggiore di zero',
    periodLabel: 'Entro quando?',
    periodWeek: 'Questa settimana',
    periodMonth: 'Questo mese',
    periodCustom: 'Personalizzato',
    customStartLabel: 'Dal',
    customEndLabel: 'Al',
    customEndInvalid: 'La scadenza non può essere nel passato né prima dell\'inizio',
    submit: 'Crea obiettivo',
    creating: 'Un attimo…',
    cancel: 'Annulla',
  },

  errors: {
    createFailed: 'Creazione dell\'obiettivo non riuscita. Riprova.',
    deleteFailed: 'Eliminazione non riuscita. Riprova.',
  },
} as const

export default goals
