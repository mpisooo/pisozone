import { createNamespaceProxy, type Widen } from './proxy'

// Namespace di Social.tsx (1412 righe: messaggi diretti, chat di gruppo, feed
// attività, classifica, amici/richieste) e dei relativi hook (useFriends,
// useMessages, useGroups, useFeed, useLeaderboard, useComments). Diviso in
// sotto-namespace per feature così chi tocca solo la classifica, ad esempio,
// non deve leggere le stringhe della chat.
// `shared` raccoglie le poche stringhe davvero trasversali (unità di misura,
// prefisso livello, label di default) usate da più di una sotto-sezione.
const it = {
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
      // Chi ha reagito (roadmap v6): sheet con avatar+username+emoji di ogni
      // reattore, non solo il conteggio.
      viewReactorsAria: (n: number) => `Vedi chi ha reagito (${n})`,
      reactorsSheetLabel: 'Chi ha reagito',
      reactorsLoading: 'Carico…',
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

    // Amici in comune (roadmap v6): badge nella ricerca e nei suggerimenti.
    mutualFriendsLabel: (n: number) => (n === 1 ? '1 amico in comune' : `${n} amici in comune`),

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

    // Gruppi vivi ed espulsione (roadmap v6): rinomina, foto, aggiungi/rimuovi
    // membri — la RLS lo ammetteva già (v8) tranne l'espulsione (nuova
    // policy v49).
    manage: {
      renameAria: 'Rinomina gruppo',
      namePlaceholder: 'Nome del gruppo',
      saveNameAria: 'Salva nome',
      cancelRenameAria: 'Annulla modifica',
      changePhotoAria: 'Cambia foto del gruppo',
      addMembersTileAria: 'Aggiungi membri',
      addMembersSheetLabel: 'Aggiungi membri',
      addMembersEmptyHint: 'Tutti i tuoi amici sono già nel gruppo',
      addMembersSubmitLabel: (n: number) => (n > 0 ? `Aggiungi (${n})` : 'Aggiungi'),
      addingLabel: 'Aggiunta...',
      removeMemberAria: (username: string) => `Espelli ${username}`,
      removeConfirmSheetLabel: 'Espelli dal gruppo',
      removeConfirmQuestion: (username: string) => `Espellere @${username} dal gruppo?`,
      removeConfirmHint: 'Non potrà più vedere i messaggi del gruppo, ma potrà essere aggiunto di nuovo in futuro.',
      removeConfirmButton: 'Espelli',
    },

    errors: {
      loadFailed: 'Errore nel caricamento dei gruppi. Riprova.',
      membersLoadFailed: 'Errore nel caricamento dei membri del gruppo. Riprova.',
      actionFailed: 'Operazione non riuscita. Riprova.',
      renameFailed: 'Rinomina non riuscita. Riprova.',
      photoUpdateFailed: 'Aggiornamento della foto non riuscito. Riprova.',
      addMembersFailed: 'Aggiunta dei membri non riuscita. Riprova.',
      removeMemberFailed: 'Espulsione non riuscita. Riprova.',
      lastAdminCannotLeave: 'Sei l’unico admin del gruppo: non puoi uscire finché ci sono altri membri.',
    },
  },
} as const

const en: Widen<typeof it> = {
  pageTitle: 'SOCIAL',

  shared: {
    unknownUser: 'User',
    selfFallbackName: 'You',
    levelPrefix: 'Lv.',
    units: {
      min: 'min',
      kcal: 'kcal',
      km: 'km',
    },
    actionSheetDefaultLabel: 'Actions',
  },

  chat: {
    tabLabel: 'Chat',
    sendFailedRetry: '⚠ Not sent · Retry',
    messageInputPlaceholder: 'Write a message...',
    sendAria: 'Send',
    writeToFriendHeading: 'Message a friend',
    emptyTitle: 'NO MESSAGES',
    emptyHint: 'Message a friend to start a chat',
    conversationActionsLabel: 'Conversation actions',
    deleteConversationHint: 'Deleting the conversation removes the messages for both of you',
    deleteConversationLabel: 'Delete conversation',

    dm: {
      emptyState: 'Start the conversation',
      editedLabel: 'edited',
      editMessageLabel: 'Edit message',
      editMessagePlaceholder: 'Edit message...',
      cancelEditAria: 'Cancel edit',
      messageActionsLabel: 'Message actions',
      messagePreviewHeading: 'Message',
      deleteMessageLabel: 'Delete message',
    },

    group: {
      showMembersAria: 'Show members',
    },

    errors: {
      rateLimited: 'You are sending messages too fast. Wait a moment and try again.',
      conversationsLoadFailed: 'Error loading conversations. Try again.',
      messagesLoadFailed: 'Error loading messages. Try again.',
      groupMessagesLoadFailed: 'Error loading group messages. Try again.',
    },
  },

  feed: {
    tabLabel: 'Feed',
    emptyTitle: 'EMPTY FEED',
    emptyHint: 'Add friends to see their activities here',
    activityPhotoAlt: (username: string) => `${username}'s activity photo`,
    openPhotoAria: 'Open photo fullscreen',
    showCommentsAria: 'Show comments',
    closeCommentsAria: 'Close comments',

    reactions: {
      openPickerAria: 'React to the activity',
      closePickerAria: 'Close reactions',
      pickerLabel: 'Choose a reaction',
      reactWithAria: (label: string) => `React with ${label}`,
      removeAria: (label: string) => `Remove ${label} reaction`,
      kindLabels: {
        heart: 'Heart',
        muscle: 'Muscle',
        fire: 'Fire',
        clap: 'Clap',
        rocket: 'Rocket',
      },
      viewReactorsAria: (n: number) => `See who reacted (${n})`,
      reactorsSheetLabel: 'Who reacted',
      reactorsLoading: 'Loading…',
    },

    comments: {
      loading: 'Loading comments…',
      empty: 'No comments yet — be the first!',
      deleteAria: 'Delete comment',
      inputPlaceholder: 'Write a comment…',
      sendAria: 'Send comment',
      errors: {
        rateLimited: 'You are commenting too fast. Wait a moment and try again.',
        sendFailed: 'Comment not sent. Try again.',
        deleteFailed: 'Delete failed. Try again.',
      },
    },

    errors: {
      loadFailed: 'Error loading the feed. Try again.',
    },
  },

  leaderboard: {
    tabLabel: 'Leaderboard',
    scopeFriendsLabel: 'Friends',
    scopeGlobalLabel: 'Global',
    weekHeading: 'This week',
    meSuffix: ' (you)',
    sessionSingular: 'session',
    sessionPlural: 'sessions',
    emptyFriendsTitle: 'NO FRIENDS',
    emptyGlobalTitle: 'NOBODY YET',
    emptyFriendsHint: 'Add friends to see the weekly leaderboard',
    emptyGlobalHint: 'No activities logged this week',
    errors: {
      globalUnavailable: 'Global leaderboard unavailable. Try again.',
      loadFailed: 'Error loading the leaderboard. Try again.',
    },
  },

  friends: {
    tabLabel: 'Friends',
    searchPlaceholder: 'Search by username…',
    clearSearchAria: 'Clear search',
    searchingLabel: 'Searching…',
    friendBadge: 'Friend',
    acceptLabel: 'Accept',
    rejectAria: 'Decline',
    addFriendAria: 'Add friend',
    receivedRequestsHeading: (n: number) => `Received requests (${n})`,
    yourFriendsHeading: (n: number) => `Your friends (${n})`,
    sentRequestsHeading: (n: number) => `Sent requests (${n})`,
    pendingLabel: 'Pending',
    cancelRequestAria: 'Cancel request',
    emptyTitle: 'No friends yet',
    emptyHint: 'Search a username to add friends',

    // Scoperta (v37): utenti attivi suggeriti quando la ricerca è vuota
    suggestionsHeading: 'People to discover',
    suggestionsSubtitle: 'The most active over the last 30 days',
    suggestionSessions: (n: number) => (n === 1 ? '1 activity this month' : `${n} activities this month`),

    // Amici in comune (roadmap v6): badge nella ricerca e nei suggerimenti.
    mutualFriendsLabel: (n: number) => (n === 1 ? '1 mutual friend' : `${n} mutual friends`),

    profile: {
      title: 'PROFILE',
      favoriteSportsHeading: 'Favorite sports',
      statsHeading: 'By the numbers',
      statActivities: 'Activities',
      statHours: 'Total hours',
      statKm: 'Km covered',
      statMedals: 'Medals',
      vsHeading: 'Me vs you',
      vsSubtitle: 'This week',
      vsYouLabel: 'You',
      vsMetricSessions: 'Workouts',
      vsMetricMinutes: 'Minutes',
      vsMetricKm: 'Km',
      vsMetricKcal: 'Kcal',
      removeFriendButton: 'Remove friend',
      pendingSentButton: '⏳ Pending',
      acceptRequestButton: '✓ Accept request',
      addFriendButton: '+ Add friend',
      reportButton: 'Report',
      blockButton: 'Block',
      confirmBlockButton: 'Confirm block?',
      blockWarning: (username: string) => `Blocking @${username} removes the friendship — they won't be able to message you, send requests, or see your activities anymore.`,
      reportSheetLabel: 'Report user',
      reportSheetQuestion: (username: string) => `Why do you want to report @${username}?`,
      reportSheetHint: 'The report is anonymous and will be reviewed.',
      reportReasons: ['Spam', 'Inappropriate content', 'Offensive behavior', 'Fake profile'],
      blockFailedMsg: 'Block failed. Try again.',
      reportFailedMsg: 'Report not sent. Try again.',
      reportSentMsg: 'Report sent, thanks. We will review it shortly.',
    },

    errors: {
      rateLimited: 'Too many requests in a short time. Try again later.',
      actionFailed: 'Action failed. Try again.',
      loadFailed: 'Error loading friends. Try again.',
      profilesLoadFailed: 'Error loading friend profiles. Try again.',
    },
  },

  groups: {
    tabLabel: 'Groups',
    createButton: 'Create new group',
    emptyTitle: 'NO GROUPS',
    emptyHint: 'Create a group with your friends',
    memberSingular: 'member',
    memberPlural: 'members',
    adminRole: 'Admin',
    memberRole: 'Member',
    leaveGroupButton: 'Leave group',

    create: {
      title: 'NEW GROUP',
      nameLabel: 'Group name',
      namePlaceholder: 'Group name...',
      addFriendsHeading: (n: number) => `Add friends (${n} selected)`,
      noFriendsHint: 'Add friends before creating a group',
      creatingLabel: 'Creating...',
      submitLabel: (n: number) => `Create group${n > 0 ? ` (${n + 1})` : ''}`,
      errors: {
        createFailed: 'Creation failed. Check your connection and try again.',
      },
    },

    manage: {
      renameAria: 'Rename group',
      namePlaceholder: 'Group name',
      saveNameAria: 'Save name',
      cancelRenameAria: 'Cancel edit',
      changePhotoAria: 'Change group photo',
      addMembersTileAria: 'Add members',
      addMembersSheetLabel: 'Add members',
      addMembersEmptyHint: 'All your friends are already in the group',
      addMembersSubmitLabel: (n: number) => (n > 0 ? `Add (${n})` : 'Add'),
      addingLabel: 'Adding...',
      removeMemberAria: (username: string) => `Remove ${username}`,
      removeConfirmSheetLabel: 'Remove from group',
      removeConfirmQuestion: (username: string) => `Remove @${username} from the group?`,
      removeConfirmHint: 'They will no longer see the group messages, but can be added again later.',
      removeConfirmButton: 'Remove',
    },

    errors: {
      loadFailed: 'Error loading groups. Try again.',
      membersLoadFailed: 'Error loading group members. Try again.',
      actionFailed: 'Action failed. Try again.',
      renameFailed: 'Rename failed. Try again.',
      photoUpdateFailed: 'Photo update failed. Try again.',
      addMembersFailed: 'Adding members failed. Try again.',
      removeMemberFailed: 'Removal failed. Try again.',
      lastAdminCannotLeave: 'You are the only admin: you can’t leave while other members are still in the group.',
    },
  },
}

const social = createNamespaceProxy(it, en)

export default social
