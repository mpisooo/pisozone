// Namespace di Social.tsx (1412 righe: messaggi diretti, chat di gruppo, feed
// attività, classifica, amici/richieste) e dei relativi hook (useFriends,
// useMessages, useGroups, useFeed, useLeaderboard, useComments). Diviso in
// sotto-namespace per feature così chi tocca solo la classifica, ad esempio,
// non deve leggere le stringhe della chat.
// `shared` raccoglie le poche stringhe davvero trasversali (unità di misura,
// prefisso livello, label di default) usate da più di una sotto-sezione.
const social = {
  pageTitle: 'SOCIAL',

  shared: {
    unknownUser: 'Utente',
    selfFallbackName: 'Tu',
    levelPrefix: 'Lv.',
    units: {
      min: 'min',
      kcal: 'kcal',
      km: 'km',
    },
    actionSheetDefaultLabel: 'Azioni',
  },

  chat: {
    tabLabel: 'Chat',
    sendFailedRetry: '⚠ Non inviato · Riprova',
    messageInputPlaceholder: 'Scrivi un messaggio...',
    sendAria: 'Invia',
    writeToFriendHeading: 'Scrivi a un amico',
    emptyTitle: 'NESSUN MESSAGGIO',
    emptyHint: 'Scrivi a un amico per iniziare una chat',
    conversationActionsLabel: 'Azioni sulla conversazione',
    deleteConversationHint: 'Eliminando la conversazione i messaggi verranno rimossi per entrambi',
    deleteConversationLabel: 'Elimina conversazione',

    dm: {
      emptyState: 'Inizia la conversazione',
      editedLabel: 'modificato',
      editMessageLabel: 'Modifica messaggio',
      editMessagePlaceholder: 'Modifica messaggio...',
      cancelEditAria: 'Annulla modifica',
      messageActionsLabel: 'Azioni sul messaggio',
      messagePreviewHeading: 'Messaggio',
      deleteMessageLabel: 'Elimina messaggio',
    },

    group: {
      showMembersAria: 'Mostra membri',
    },

    errors: {
      rateLimited: 'Stai inviando messaggi troppo in fretta. Attendi un momento e riprova.',
      conversationsLoadFailed: 'Errore nel caricamento delle conversazioni. Riprova.',
      messagesLoadFailed: 'Errore nel caricamento dei messaggi. Riprova.',
      groupMessagesLoadFailed: 'Errore nel caricamento dei messaggi del gruppo. Riprova.',
    },
  },

  feed: {
    tabLabel: 'Feed',
    emptyTitle: 'FEED VUOTO',
    emptyHint: 'Aggiungi amici per vedere le loro attività qui',
    activityPhotoAlt: (username: string) => `Foto dell'attività di ${username}`,
    openPhotoAria: 'Apri la foto a schermo intero',
    showCommentsAria: 'Mostra commenti',
    closeCommentsAria: 'Chiudi commenti',

    reactions: {
      openPickerAria: 'Reagisci all’attività',
      closePickerAria: 'Chiudi le reazioni',
      pickerLabel: 'Scegli una reazione',
      reactWithAria: (label: string) => `Reagisci con ${label}`,
      removeAria: (label: string) => `Rimuovi la reazione ${label}`,
      kindLabels: {
        heart: 'Cuore',
        muscle: 'Forza',
        fire: 'Fuoco',
        clap: 'Applausi',
        rocket: 'Razzo',
      },
    },

    comments: {
      loading: 'Carico i commenti…',
      empty: 'Nessun commento — scrivi il primo!',
      deleteAria: 'Elimina commento',
      inputPlaceholder: 'Scrivi un commento…',
      sendAria: 'Invia commento',
      errors: {
        rateLimited: 'Stai commentando troppo in fretta. Attendi un momento e riprova.',
        sendFailed: 'Commento non inviato. Riprova.',
        deleteFailed: 'Eliminazione non riuscita. Riprova.',
      },
    },

    errors: {
      loadFailed: 'Errore nel caricamento del feed. Riprova.',
    },
  },

  leaderboard: {
    tabLabel: 'Classifica',
    scopeFriendsLabel: 'Amici',
    scopeGlobalLabel: 'Globale',
    weekHeading: 'Questa settimana',
    meSuffix: ' (tu)',
    sessionSingular: 'sessione',
    sessionPlural: 'sessioni',
    emptyFriendsTitle: 'NESSUN AMICO',
    emptyGlobalTitle: 'ANCORA NESSUNO',
    emptyFriendsHint: 'Aggiungi amici per vedere la classifica settimanale',
    emptyGlobalHint: 'Nessuna attività registrata questa settimana',
    errors: {
      globalUnavailable: 'Classifica globale non disponibile. Riprova.',
      loadFailed: 'Errore nel caricamento della classifica. Riprova.',
    },
  },

  friends: {
    tabLabel: 'Amici',
    searchPlaceholder: 'Cerca per username…',
    clearSearchAria: 'Cancella ricerca',
    searchingLabel: 'Ricerca…',
    friendBadge: 'Amico',
    acceptLabel: 'Accetta',
    rejectAria: 'Rifiuta',
    addFriendAria: 'Aggiungi amico',
    receivedRequestsHeading: (n: number) => `Richieste ricevute (${n})`,
    yourFriendsHeading: (n: number) => `I tuoi amici (${n})`,
    sentRequestsHeading: (n: number) => `Richieste inviate (${n})`,
    pendingLabel: 'In attesa',
    cancelRequestAria: 'Annulla richiesta',
    emptyTitle: 'Nessun amico ancora',
    emptyHint: 'Cerca un username per aggiungere amici',

    // Scoperta (v37): utenti attivi suggeriti quando la ricerca è vuota
    suggestionsHeading: 'Persone da scoprire',
    suggestionsSubtitle: 'I più attivi degli ultimi 30 giorni',
    suggestionSessions: (n: number) => (n === 1 ? '1 attività nel mese' : `${n} attività nel mese`),

    profile: {
      title: 'PROFILO',
      favoriteSportsHeading: 'Sport preferiti',
      statsHeading: 'In numeri',
      statActivities: 'Attività',
      statHours: 'Ore totali',
      statKm: 'Km percorsi',
      statMedals: 'Medaglie',
      vsHeading: 'Io vs te',
      vsSubtitle: 'Questa settimana',
      vsYouLabel: 'Tu',
      vsMetricSessions: 'Allenamenti',
      vsMetricMinutes: 'Minuti',
      vsMetricKm: 'Km',
      vsMetricKcal: 'Kcal',
      removeFriendButton: 'Rimuovi amico',
      pendingSentButton: '⏳ In attesa',
      acceptRequestButton: '✓ Accetta richiesta',
      addFriendButton: '+ Aggiungi amico',
      reportButton: 'Segnala',
      blockButton: 'Blocca',
      confirmBlockButton: 'Confermi il blocco?',
      blockWarning: (username: string) => `Bloccando @${username} l'amicizia viene rimossa e non potrà più scriverti, mandarti richieste né vedere le tue attività.`,
      reportSheetLabel: 'Segnala utente',
      reportSheetQuestion: (username: string) => `Perché vuoi segnalare @${username}?`,
      reportSheetHint: 'La segnalazione è anonima e verrà esaminata.',
      reportReasons: ['Spam', 'Contenuti inappropriati', 'Comportamento offensivo', 'Profilo falso'],
      blockFailedMsg: 'Blocco non riuscito. Riprova.',
      reportFailedMsg: 'Segnalazione non inviata. Riprova.',
      reportSentMsg: 'Segnalazione inviata, grazie. La esamineremo al più presto.',
    },

    errors: {
      rateLimited: 'Troppe richieste in poco tempo. Riprova più tardi.',
      actionFailed: 'Operazione non riuscita. Riprova.',
      loadFailed: 'Errore nel caricamento degli amici. Riprova.',
      profilesLoadFailed: 'Errore nel caricamento dei profili amici. Riprova.',
    },
  },

  groups: {
    tabLabel: 'Gruppi',
    createButton: 'Crea nuovo gruppo',
    emptyTitle: 'NESSUN GRUPPO',
    emptyHint: 'Crea un gruppo con i tuoi amici',
    memberSingular: 'membro',
    memberPlural: 'membri',
    adminRole: 'Admin',
    memberRole: 'Membro',
    leaveGroupButton: 'Lascia gruppo',

    create: {
      title: 'NUOVO GRUPPO',
      nameLabel: 'Nome del gruppo',
      namePlaceholder: 'Nome gruppo...',
      addFriendsHeading: (n: number) => `Aggiungi amici (${n} selezionati)`,
      noFriendsHint: 'Aggiungi amici prima di creare un gruppo',
      creatingLabel: 'Creazione...',
      submitLabel: (n: number) => `Crea gruppo${n > 0 ? ` (${n + 1})` : ''}`,
      errors: {
        createFailed: 'Creazione fallita. Controlla la connessione e riprova.',
      },
    },

    errors: {
      loadFailed: 'Errore nel caricamento dei gruppi. Riprova.',
      membersLoadFailed: 'Errore nel caricamento dei membri del gruppo. Riprova.',
    },
  },
} as const

export default social
