import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per i segmenti personali (v47, roadmap v4 pilastro 02):
// SegmentCreateModal, SegmentDuelCreateModal, pages/Segments.tsx e il toggle
// preferiti in ActivityEditModal.
const it = {
  create: {
    entryButton: 'Crea un segmento da questo percorso',
    doneHint: 'Segmento creato — lo trovi nella pagina Segmenti',
    title: 'NUOVO SEGMENTO',
    hint: 'Scegli un tratto di questo percorso: lo ritroverai ogni volta che ci ripassi.',
    close: 'Chiudi',
    dialogAriaLabel: 'Crea un nuovo segmento',
    startLabel: 'Inizio',
    endLabel: 'Fine',
    distanceLabel: 'Distanza',
    timeLabel: 'Tempo',
    tooShortHint: 'L\'intervallo scelto è troppo corto (minimo 50 m).',
    nameLabel: 'Nome del segmento',
    namePlaceholder: 'Es. "La salita di via Roma"',
    saving: 'Salvataggio...',
    submit: 'Crea segmento',
    failed: 'Non sono riuscito a salvare il segmento. Riprova più tardi.',
  },

  favorite: {
    toggleAria: 'Segna come preferita',
  },

  page: {
    pageTitle: 'I TUOI SEGMENTI',
    subtitle: 'Tratti dei tuoi percorsi che si ripetono: ogni volta che ci ripassi, il tempo si registra da solo.',
    entryCard: {
      heading: 'I TUOI SEGMENTI',
      subtitle: 'Tieni un personal best sui tratti che ripeti più spesso — e sfida un amico sullo stesso tratto.',
      button: 'Apri i segmenti',
    },
    emptyState: {
      title: 'Ancora nessun segmento',
      hint: 'Apri un\'attività tracciata col GPS dal Calendario e crea un segmento da un suo tratto.',
    },
    attemptsCount: (n: number) => (n === 1 ? '1 tentativo' : `${n} tentativi`),
    bestLabel: 'Record',
    noAttemptsYet: 'Nessun tentativo ancora oltre a quello di creazione.',
    historyHeading: 'Storico tentativi',
    deleteButton: 'Elimina segmento',
    deleteConfirm: 'Confermi?',
    deleteFailed: 'Non sono riuscito a eliminare il segmento.',
    deleteBlockedByDuel: 'Non puoi eliminarlo: c\'è una sfida di percorso ancora aperta su questo segmento.',
    challengeButton: 'Sfida un amico su questo segmento',
  },

  duelCreate: {
    title: 'SFIDA UN AMICO',
    hint: (segmentName: string) => `Il tuo amico dovrà percorrere lo stesso tratto: "${segmentName}".`,
    close: 'Chiudi',
    dialogAriaLabel: 'Sfida un amico su un segmento',
    friendLabel: 'Amico',
    friendPlaceholder: 'Scegli un amico',
    noFriends: 'Nessun amico da sfidare — aggiungine uno dalla scheda Social.',
    durationLabel: 'Durata della sfida',
    durationOption: (n: number) => `${n} giorni`,
    submit: 'Lancia la sfida',
    creating: 'Invio...',
    failed: 'Non sono riuscito a creare la sfida. Riprova.',
  },
} as const

const en: Widen<typeof it> = {
  create: {
    entryButton: 'Create a segment from this route',
    doneHint: 'Segment created — find it on the Segments page',
    title: 'NEW SEGMENT',
    hint: 'Pick a stretch of this route: you\'ll find it again every time you pass through.',
    close: 'Close',
    dialogAriaLabel: 'Create a new segment',
    startLabel: 'Start',
    endLabel: 'End',
    distanceLabel: 'Distance',
    timeLabel: 'Time',
    tooShortHint: 'The chosen range is too short (minimum 50 m).',
    nameLabel: 'Segment name',
    namePlaceholder: 'E.g. "The hill on Main St"',
    saving: 'Saving...',
    submit: 'Create segment',
    failed: 'Couldn\'t save the segment. Try again later.',
  },

  favorite: {
    toggleAria: 'Mark as favorite',
  },

  page: {
    pageTitle: 'YOUR SEGMENTS',
    subtitle: 'Stretches of your routes that repeat: every time you pass through, the time logs itself.',
    entryCard: {
      heading: 'YOUR SEGMENTS',
      subtitle: 'Keep a personal best on the stretches you repeat most — and challenge a friend on the same one.',
      button: 'Open segments',
    },
    emptyState: {
      title: 'No segments yet',
      hint: 'Open a GPS-tracked activity from the Calendar and create a segment from part of its route.',
    },
    attemptsCount: (n: number) => (n === 1 ? '1 attempt' : `${n} attempts`),
    bestLabel: 'Best',
    noAttemptsYet: 'No attempts yet beyond the one from creation.',
    historyHeading: 'Attempt history',
    deleteButton: 'Delete segment',
    deleteConfirm: 'Confirm?',
    deleteFailed: 'Couldn\'t delete the segment.',
    deleteBlockedByDuel: 'You can\'t delete it: there\'s still an open route challenge on this segment.',
    challengeButton: 'Challenge a friend on this segment',
  },

  duelCreate: {
    title: 'CHALLENGE A FRIEND',
    hint: (segmentName: string) => `Your friend will need to run the same stretch: "${segmentName}".`,
    close: 'Close',
    dialogAriaLabel: 'Challenge a friend on a segment',
    friendLabel: 'Friend',
    friendPlaceholder: 'Choose a friend',
    noFriends: 'No friends to challenge yet — add one from the Social tab.',
    durationLabel: 'Challenge duration',
    durationOption: (n: number) => `${n} days`,
    submit: 'Send challenge',
    creating: 'Sending...',
    failed: 'Couldn\'t create the challenge. Try again.',
  },
}

const segmentsText = createNamespaceProxy(it, en)

export default segmentsText
