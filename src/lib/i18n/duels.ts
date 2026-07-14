// Namespace per le sfide 1v1 e di gruppo (lib/duels.ts, hooks/useDuels.ts,
// components/DuelsSection.tsx e DuelCreateModal.tsx nella pagina Sfide).
const duels = {
  heading: 'SFIDE CON GLI AMICI',
  subtitle: 'Duelli a tempo: chi fa di più vince i crediti.',
  newButton: '+ Nuova sfida',
  emptyHint: 'Nessuna sfida in corso. Lancia un duello a un amico o al tuo gruppo!',

  metricLabels: {
    sessions: 'Sessioni',
    minutes: 'Minuti',
    km: 'Chilometri',
    kcal: 'Calorie',
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
    claim: (credits: number) => `Riscatta la vittoria (+${credits} 💰)`,
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

export default duels
