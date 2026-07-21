import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per le routine salvate (v48, roadmap v4 pilastro 03): il picker
// in Log.tsx, la pagina di gestione /routines e RoutineCreateModal.
const it = {
  entryButton: 'Usa una routine salvata',
  manageLink: 'Le tue routine',

  picker: {
    title: 'USA UNA ROUTINE',
    close: 'Chiudi',
    dialogAriaLabel: 'Scegli una routine salvata',
    hint: 'I campi si precompilano: potrai modificarli prima di salvare.',
    exercisesCount: (n: number) => (n === 1 ? '1 esercizio' : `${n} esercizi`),
  },

  page: {
    pageTitle: 'LE TUE ROUTINE',
    subtitle: 'Salva le combinazioni di esercizi che ripeti più spesso: la prossima volta le trovi già pronte in Registra.',
    newButton: 'Nuova routine',
    emptyState: {
      title: 'Ancora nessuna routine',
      hint: 'Crea la tua prima routine per non riscrivere ogni volta gli stessi esercizi.',
    },
    exercisesCount: (n: number) => (n === 1 ? '1 esercizio' : `${n} esercizi`),
    deleteButton: 'Elimina routine',
    deleteConfirm: 'Confermi?',
    deleteFailed: 'Non sono riuscito a eliminare la routine.',
  },

  create: {
    entryAria: 'Crea una nuova routine',
    title: 'NUOVA ROUTINE',
    close: 'Chiudi',
    dialogAriaLabel: 'Crea una nuova routine',
    nameLabel: 'Nome della routine',
    namePlaceholder: 'Es. "Push day"',
    exercisesTitle: 'ESERCIZI',
    exercisesHint: 'Serie, ripetizioni e carico di riferimento — li potrai comunque cambiare ogni volta che la usi.',
    saving: 'Salvataggio...',
    submit: 'Crea routine',
    failed: 'Non sono riuscito a salvare la routine. Riprova più tardi.',
    limitReached: (max: number) => `Hai raggiunto il limite di ${max} routine salvate.`,
  },
} as const

const en: Widen<typeof it> = {
  entryButton: 'Use a saved routine',
  manageLink: 'Your routines',

  picker: {
    title: 'USE A ROUTINE',
    close: 'Close',
    dialogAriaLabel: 'Choose a saved routine',
    hint: 'Fields will be prefilled: you can still edit them before saving.',
    exercisesCount: (n: number) => (n === 1 ? '1 exercise' : `${n} exercises`),
  },

  page: {
    pageTitle: 'YOUR ROUTINES',
    subtitle: 'Save the exercise combos you repeat most often: find them ready to go next time in Log.',
    newButton: 'New routine',
    emptyState: {
      title: 'No routines yet',
      hint: 'Create your first routine so you don\'t have to retype the same exercises every time.',
    },
    exercisesCount: (n: number) => (n === 1 ? '1 exercise' : `${n} exercises`),
    deleteButton: 'Delete routine',
    deleteConfirm: 'Confirm?',
    deleteFailed: 'Couldn\'t delete the routine.',
  },

  create: {
    entryAria: 'Create a new routine',
    title: 'NEW ROUTINE',
    close: 'Close',
    dialogAriaLabel: 'Create a new routine',
    nameLabel: 'Routine name',
    namePlaceholder: 'E.g. "Push day"',
    exercisesTitle: 'EXERCISES',
    exercisesHint: 'Sets, reps and reference load — you can still change them every time you use it.',
    saving: 'Saving...',
    submit: 'Create routine',
    failed: 'Couldn\'t save the routine. Try again later.',
    limitReached: (max: number) => `You've reached the limit of ${max} saved routines.`,
  },
}

const routinesText = createNamespaceProxy(it, en)

export default routinesText
