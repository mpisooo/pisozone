import { createNamespaceProxy, type Widen } from './proxy'

// Namespace degli obiettivi personali (roadmap v2, pilastro 04): widget in
// Home (components/GoalsCard.tsx) + modale di creazione (GoalCreateModal.tsx)
// + errori di usePersonalGoals.ts.
const it = {
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

const en: Widen<typeof it> = {
  cardTitle: 'MY GOALS',
  newGoal: 'New goal',
  limitReached: 'Max 5 active goals: finish or delete one to create another',
  discoverTitle: 'Personal goals',
  discoverBody: 'Set your own target: "100 km this month", "20 gym sessions"…',

  metricLabels: {
    sessions: 'Sessions',
    minutes: 'Minutes',
    km: 'Kilometers',
    kcal: 'Calories',
  },
  goalTitle: (targetLabel: string, sportLabel: string | null) =>
    sportLabel ? `${targetLabel} · ${sportLabel}` : targetLabel,
  targetLabels: {
    sessions: (n: number) => n === 1 ? '1 session' : `${n.toLocaleString('en-US')} sessions`,
    minutes: (n: number) => `${n.toLocaleString('en-US')} min`,
    km: (n: number) => `${n.toLocaleString('en-US')} km`,
    kcal: (n: number) => `${n.toLocaleString('en-US')} kcal`,
  },
  progressValue: (current: number, target: number) =>
    `${current.toLocaleString('en-US')} / ${target.toLocaleString('en-US')}`,
  daysLeft: (n: number) =>
    n === 0 ? 'due today' : n === 1 ? '1 day left' : `${n} days left`,
  reachedBadge: 'Reached ✓',
  expiredBadge: 'Expired',
  deleteAria: (title: string) => `Delete goal ${title}`,
  deleteConfirm: 'Sure?',

  create: {
    dialogAriaLabel: 'Create a personal goal',
    title: 'NEW GOAL',
    metricLabel: 'What do you want to track?',
    sportLabel: 'Sport',
    allSports: 'All sports',
    targetLabel: 'Target',
    targetPlaceholder: 'e.g. 100',
    targetInvalid: 'Enter a number greater than zero',
    periodLabel: 'By when?',
    periodWeek: 'This week',
    periodMonth: 'This month',
    periodCustom: 'Custom',
    customStartLabel: 'From',
    customEndLabel: 'To',
    customEndInvalid: 'The deadline can\'t be in the past or before the start date',
    submit: 'Create goal',
    creating: 'One sec…',
    cancel: 'Cancel',
  },

  errors: {
    createFailed: 'Couldn\'t create the goal. Please try again.',
    deleteFailed: 'Couldn\'t delete it. Please try again.',
  },
}

const goals = createNamespaceProxy(it, en)

export default goals
