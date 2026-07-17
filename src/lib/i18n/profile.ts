// Namespace della pagina Profilo (dati personali, BMI, sport preferiti, livello,
// crediti, temi, storico peso, privacy/export) e dei componenti che vive solo lì:
// NotificationSettingsCard, RecoveryEmailCard, DeleteAccountModal, CreditsInfoModal.
// `errors` raccoglie i messaggi di showError() di ProfileContext/useWeightLogs;
// gli altri errori mostrati inline (upload avatar, peso, export...) restano vicino
// alla loro sezione per restare leggibili nel contesto d'uso.
const profile = {
  pageTitle: 'PROFILO',
  creditsAmount: (n: number) => `${n} 💎`,

  // La stessa card "In numeri" dei profili pubblici (RPC get_public_profile_stats),
  // vista su se stessi: quello che gli altri vedono aprendo il tuo profilo.
  publicStats: {
    title: 'IN NUMERI',
    hint: 'È il biglietto da visita che vedono gli altri sul tuo profilo.',
    activities: 'Attività',
    hours: 'Ore totali',
    km: 'Km totali',
    medals: 'Medaglie',
  },

  account: {
    usernameLabel: 'Username',
    levelPrefix: 'LV.',
    avatarUploadAriaLabel: 'Carica foto profilo',
    avatarUploadError: (message: string) => `Errore upload: ${message}`,
    changePhotoHint: 'Tocca per cambiare foto',
    formTitle: 'DATI PERSONALI',
    nameLabel: 'Nome (opzionale)',
    namePlaceholder: 'Il tuo nome',
    genderLabel: 'Sesso',
    genderMale: '♂ Maschio',
    genderFemale: '♀ Femmina',
    genderHint: 'Usato per stimare meglio le calorie bruciate',
    birthDateLabel: 'Data di nascita',
    ageSuffix: (age: number) => `${age} anni`,
    heightLabel: 'Altezza (cm)',
    weightLabel: 'Peso (kg)',
    valueTooLow: 'Valore troppo basso',
    valueTooHigh: 'Valore troppo alto',
    weeklyGoalLabel: 'Obiettivo settimanale',
    dailyCalorieGoalLabel: 'Calorie/giorno (kcal)',
    dailyCalorieGoalPlaceholder: 'opzionale',
    bmiTitle: 'BMI',
    bmiUnderweight: 'Sottopeso',
    bmiNormal: 'Normale',
    bmiOverweight: 'Sovrappeso',
    bmiObese: 'Obeso',
    sportTitle: 'SPORT PREFERITI',
    sportSelectedCount: (n: number) => `${n}/3 selezionati`,
    sportHint: 'Scegli fino a 3 attività che pratichi di più',
    saved: '✅ Salvato!',
    saving: 'Salvataggio...',
    save: 'Salva profilo',
  },

  level: {
    title: 'IL TUO LIVELLO',
    creditsLabel: (n: number) => `${n} 💎 crediti`,
    levelOfTen: (level: number) => `Livello ${level} di 10`,
    nextPrefix: 'Prossimo: ',
    upgradeButton: (level: number, cost: number) => `Sali a Lv.${level} — ${cost} 💎`,
    needMoreCredits: (missing: number) => `Servono ${missing} 💎 in più`,
    maxLevelTitle: '👑 LIVELLO MASSIMO RAGGIUNTO',
    maxLevelSubtitle: 'Sei tra i migliori atleti di PisoZone',
    errorWithMessage: (message: string) => `Errore: ${message}`,
    insufficientCredits: 'Crediti insufficienti',
    purchaseError: 'Errore acquisto',
    themeUnlockedActivated: 'Tema sbloccato e attivato!',
    celebrationTitle: (level: number) => `LIVELLO ${level}!`,
    celebrationSubtitle: (title: string) => `Nuovo titolo: ${title}`,
  },

  theme: {
    title: 'TEMI',
    active: 'Attivo',
    activate: 'Attiva',
    unlock: (cost: number) => `Sblocca ${cost} 💎`,
  },

  weight: {
    title: 'STORICO PESO',
    saveButtonSaving: '...',
    saveButton: (kg: number) => `Salva ${kg} kg`,
    outOfRange: 'Il peso deve essere tra 20 e 400 kg.',
    saveFailed: 'Salvataggio non riuscito. Controlla la connessione e riprova.',
    emptyHint: 'Nessuna pesata registrata. Inserisci il tuo peso e clicca "Salva peso".',
    needMoreEntries: 'Registra almeno 2 pesate per vedere il grafico.',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- valore Recharts (number | string | array)
    tooltipValue: (v: any) => `${v} kg`,
    tooltipLabel: 'Peso',
    entriesCount: (n: number) => `${n} ${n === 1 ? 'pesata' : 'pesate'} registrate`,

    // Obiettivo peso con proiezione (roadmap v3, pilastro 02): traguardo su
    // profiles (v43) + regressione sulle pesate recenti (lib/weightTrend.ts).
    goal: {
      inputLabel: 'Obiettivo di peso (kg)',
      inputPlaceholder: 'es. 78',
      setButton: 'Imposta',
      badge: (kg: number) => `Obiettivo: ${kg.toLocaleString('it-IT')} kg`,
      chartLineLabel: 'Obiettivo',
      removeAria: 'Rimuovi obiettivo di peso',
      outOfRange: 'L\'obiettivo deve essere tra 20 e 400 kg.',
      saveFailed: 'Salvataggio non riuscito. Controlla la connessione e riprova.',
      ratePerWeek: (kg: string) => `${kg} kg/settimana`,
      needMoreData: 'Registra qualche pesata in più (almeno 3 in una settimana) per vedere la proiezione.',
      onTrack: (rate: string, date: string) => `Al ritmo attuale (${rate}) ci arrivi intorno al ${date}.`,
      onTrackWeeks: (weeks: number) => weeks === 1 ? 'Manca circa una settimana.' : `Mancano circa ${weeks} settimane.`,
      reached: 'Obiettivo raggiunto! 🎉 Ora si tratta di mantenerlo.',
      flat: 'Peso stabile nelle ultime settimane: la proiezione comparirà quando il trend prenderà una direzione.',
      away: (rate: string) => `Al ritmo attuale (${rate}) ti stai allontanando dall'obiettivo.`,
      tooFar: 'A questo ritmo servirebbe più di un anno: la proiezione comparirà quando il trend accelererà.',
    },
  },

  guide: {
    title: 'GUIDA DI PISOZONE',
    body: 'Tutte le funzioni dell\'app spiegate in un posto solo: allenamenti, GPS, palestra, programmi, recupero, crediti, social…',
    button: 'Apri la guida',
  },

  privacy: {
    title: 'PRIVACY E DATI',
    body: 'I tuoi dati ti appartengono: puoi scaricarne una copia completa in formato JSON o eliminare definitivamente l\'account con tutto ciò che contiene.',
    privacyPolicyLink: 'Privacy Policy',
    termsLink: 'Termini di Servizio',
    exportButton: 'Esporta i miei dati (JSON)',
    exportingButton: 'Preparazione del file…',
    exportFailed: 'Esportazione non riuscita. Controlla la connessione e riprova.',
    deleteAccountButton: 'Elimina account',
  },

  notifications: {
    title: 'NOTIFICHE',
    unsupported: 'Le notifiche push non sono supportate su questo browser/dispositivo. Su iPhone funzionano solo se aggiungi PisoZone alla schermata Home (Condividi → Aggiungi a Home).',
    active: 'Notifiche attive',
    inactive: 'Notifiche disattivate',
    disable: 'Disattiva',
    enable: 'Attiva',
    categoriesTitle: 'Tipi di notifica',
    categoryWorkoutReminder: 'Promemoria allenamento serale',
    categoryNewMessages: 'Nuovi messaggi',
    categoryFriendRequests: 'Richieste di amicizia',
    categoryQuietHours: 'Fascia di silenzio',
    quietFromLabel: 'Dalle',
    quietToLabel: 'Alle',
    quietStartAriaLabel: 'Ora di inizio della fascia di silenzio',
    quietEndAriaLabel: 'Ora di fine della fascia di silenzio',
    quietHint: 'Nessuna notifica push in questa fascia oraria, per tutte le categorie sopra.',
    iosHint: 'Su iPhone le notifiche funzionano solo se aggiungi PisoZone alla schermata Home.',
    prefSaveFailed: 'Impossibile salvare la preferenza. Riprova.',
  },

  recoveryEmail: {
    title: 'EMAIL DI RECUPERO',
    verifiedSuffix: (email: string) => `${email} verificata`,
    introHint: 'Aggiungi e verifica un\'email per poter recuperare l\'accesso se dimentichi la password. Senza un\'email verificata il reset password non è possibile.',
    emailPlaceholder: 'la-tua-email@esempio.com',
    emailAriaLabel: 'Email di recupero',
    sendCodeButton: 'Invia codice',
    alreadyAssociated: 'Questa email è già associata a un altro account.',
    sendFailed: 'Invio non riuscito. Controlla l\'indirizzo e riprova.',
    codeSentInfo: 'Codice inviato! Controlla la tua email e inseriscilo qui sotto.',
    invalidCode: 'Codice non valido o scaduto. Riprova.',
    codePlaceholder: 'Codice a 6 cifre',
    codeAriaLabel: 'Codice di verifica',
    verifyButton: 'Verifica',
    changeEmailButton: 'Cambia email / invia di nuovo',
  },

  deleteAccount: {
    ariaLabel: 'Elimina account',
    title: 'ELIMINA ACCOUNT',
    warningBefore: 'Questa azione è ',
    warningEmphasis: 'definitiva e irreversibile',
    warningAfter: ': verranno eliminati profilo, attività, statistiche, medaglie, crediti, messaggi, amicizie e foto. Nessun dato potrà essere recuperato.',
    exportHint: 'Vuoi prima una copia dei tuoi dati? Chiudi questa finestra e usa "Esporta i miei dati".',
    confirmLabelPrefix: 'Per confermare, scrivi il tuo username: ',
    deleting: 'Eliminazione…',
    confirmButton: 'Elimina per sempre',
    sessionExpired: 'Sessione scaduta: fai di nuovo il login e riprova.',
    deleteFailed: 'Eliminazione non riuscita. Controlla la connessione e riprova.',
  },

  credits: {
    ariaLabel: 'Come guadagnare crediti',
    title: '💎 COME GUADAGNARE CREDITI',
    logActivityTitle: 'Registra attività',
    logActivityDescription: '1 💎 ogni 10 minuti di attività, fino a un massimo di 10 💎 al giorno.',
    dailyChallengesTitle: 'Sfide giornaliere',
    dailyChallengesDescription: (min: number, max: number) => `Da ${min} a ${max} 💎 a sfida completata, fino a 3 sfide al giorno.`,
    achievementsTitle: 'Medaglie sbloccate',
    achievementsDescription: (bronze: number, silver: number, gold: number, diamond: number) =>
      `Bonus una tantum allo sblocco: 🥉 ${bronze} · 🥈 ${silver} · 🥇 ${gold} · 💎 ${diamond}`,
    footer: 'Usa i crediti per sbloccare livelli, temi e cornici nella pagina Profilo.',
  },

  errors: {
    profileLoadFailed: 'Errore nel caricamento del profilo. Riprova.',
    weightLoadFailed: 'Errore nel caricamento dello storico peso. Riprova.',
  },

  export: {
    fieldFailed: (key: string, message: string) => `Export di "${key}" non riuscito: ${message}`,
  },
} as const

export default profile
