import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per le sfide 1v1 e di gruppo (lib/duels.ts, hooks/useDuels.ts,
// components/DuelsSection.tsx e DuelCreateModal.tsx nella pagina Sfide).
const it = {
  heading: 'SFIDE CON GLI AMICI',
  subtitle: 'Duelli a tempo: chi fa di più vince i crediti.',
  newButton: '+ Nuova sfida',
  emptyHint: 'Nessuna sfida in corso. Lancia un duello a un amico o al tuo gruppo!',

  metricLabels: {
    sessions: 'Sessioni',
    minutes: 'Minuti',
    km: 'Chilometri',
    kcal: 'Calorie',
    segment_time: 'Tempo sul segmento',
  } as Record<string, string>,

  card: {
    vs: (name: string) => `vs @${name}`,
    group: (name: string) => `Gruppo ${name}`,
    daysLeft: (n: number) => (n === 0 ? 'Ultimo giorno' : n === 1 ? '1 giorno rimasto' : `${n} giorni rimasti`),
    pendingIncoming: (name: string) => `@${name} ti sfida!`,
    pendingOutgoing: 'In attesa di risposta…',
    declined: 'Sfida rifiutata',
    accept: 'Accetta',
    decline: 'Rifiuta',
    withdraw: 'Ritira',
    claim: (credits: number) => `Riscatta la vittoria (+${credits} 💎)`,
    claiming: 'Riscatto…',
    wonBy: (name: string) => `🏆 Vinta da @${name}`,
    wonByYou: '🏆 Hai vinto tu!',
    draw: 'Pareggio: nessun vincitore',
    close: 'Archivia',
    youSuffix: ' (tu)',
  },

  create: {
    title: 'NUOVA SFIDA',
    dialogAriaLabel: 'Crea una nuova sfida',
    typeLabel: 'Chi sfidi?',
    friendTab: 'Un amico',
    groupTab: 'Un gruppo',
    friendPlaceholder: 'Scegli un amico',
    groupPlaceholder: 'Scegli un gruppo',
    noFriends: 'Aggiungi prima un amico dalla sezione Social.',
    noGroups: 'Non fai parte di nessun gruppo.',
    metricLabel: 'Su cosa vi sfidate?',
    durationLabel: 'Per quanti giorni?',
    durationOption: (n: number) => `${n} giorni`,
    submit: 'Lancia la sfida',
    creating: 'Creo…',
    createFailed: 'Creazione non riuscita. Riprova.',
    groupHint: 'La sfida di gruppo parte subito per tutti i membri.',
    friendHint: 'L\'amico dovrà accettare prima che la sfida parta.',
  },

  errors: {
    respondFailed: 'Operazione non riuscita. Riprova.',
    claimFailed: 'Riscatto non riuscito. Riprova.',
  },
} as const

const en: Widen<typeof it> = {
  heading: 'CHALLENGES WITH FRIENDS',
  subtitle: 'Timed duels: whoever does more wins the credits.',
  newButton: '+ New challenge',
  emptyHint: 'No challenges in progress. Challenge a friend or your group to a duel!',

  metricLabels: {
    sessions: 'Sessions',
    minutes: 'Minutes',
    km: 'Kilometers',
    kcal: 'Calories',
    segment_time: 'Segment time',
  } as Record<string, string>,

  card: {
    vs: (name: string) => `vs @${name}`,
    group: (name: string) => `Group ${name}`,
    daysLeft: (n: number) => (n === 0 ? 'Last day' : n === 1 ? '1 day left' : `${n} days left`),
    pendingIncoming: (name: string) => `@${name} is challenging you!`,
    pendingOutgoing: 'Waiting for a response…',
    declined: 'Challenge declined',
    accept: 'Accept',
    decline: 'Decline',
    withdraw: 'Withdraw',
    claim: (credits: number) => `Claim your win (+${credits} 💎)`,
    claiming: 'Claiming…',
    wonBy: (name: string) => `🏆 Won by @${name}`,
    wonByYou: '🏆 You won!',
    draw: 'Draw: no winner',
    close: 'Archive',
    youSuffix: ' (you)',
  },

  create: {
    title: 'NEW CHALLENGE',
    dialogAriaLabel: 'Create a new challenge',
    typeLabel: 'Who are you challenging?',
    friendTab: 'A friend',
    groupTab: 'A group',
    friendPlaceholder: 'Choose a friend',
    groupPlaceholder: 'Choose a group',
    noFriends: 'Add a friend from the Social section first.',
    noGroups: "You're not part of any group.",
    metricLabel: 'What are you competing on?',
    durationLabel: 'For how many days?',
    durationOption: (n: number) => `${n} days`,
    submit: 'Launch challenge',
    creating: 'Creating…',
    createFailed: 'Failed to create. Please try again.',
    groupHint: 'Group challenges start right away for all members.',
    friendHint: 'Your friend needs to accept before the challenge starts.',
  },

  errors: {
    respondFailed: 'Action failed. Please try again.',
    claimFailed: 'Claim failed. Please try again.',
  },
}

const duels = createNamespaceProxy(it, en)

export default duels
