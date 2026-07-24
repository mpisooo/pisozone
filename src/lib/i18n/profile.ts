import { createNamespaceProxy, type Widen } from './proxy'

// Namespace condiviso da DUE pagine (roadmap v7, pilastro 01: Profilo/
// Impostazioni si separano): Profile.tsx (vetrina — avatar, livello, bacheca
// medaglie, streak, sport preferiti, "in numeri") e Settings.tsx (dati
// anagrafici, BMI, temi, storico peso, notifiche, lingua, privacy/export) e i
// componenti che vivono solo in quest'ultima: NotificationSettingsCard,
// RecoveryEmailCard, DeleteAccountModal, CreditsInfoModal, LanguageSettingsCard.
// `errors` raccoglie i messaggi di showError() di ProfileContext/useWeightLogs;
// gli altri errori mostrati inline (upload avatar, peso, export...) restano vicino
// alla loro sezione per restare leggibili nel contesto d'uso.
const it = {
  pageTitle: 'PROFILO',
  // Roadmap v7, pilastro 01: Profilo (vetrina) e Impostazioni (configurazione)
  // sono ora due pagine separate — questo è il titolo della seconda.
  settingsPageTitle: 'IMPOSTAZIONI',
  creditsAmount: (n: number) => `${n} 💎`,

  // Impostazioni riorganizzate in 5 sezioni richiudibili (roadmap "PisoZone
  // Next" P1-03, 23/07/2026): stessi contenuti e stesso comportamento di
  // prima, solo raggruppati — vedi CLAUDE.md per il dettaglio della scelta.
  settingsSections: {
    account: 'Account e sicurezza',
    notifications: 'Notifiche',
    appearance: 'Aspetto e lingua',
    profile: 'Dati personali e obiettivi',
    dataHelp: 'Guida e dati account',
  },

  // La stessa card "In numeri" dei profili pubblici (RPC get_public_profile_stats),
  // vista su se stessi: quello che gli altri vedono aprendo il tuo profilo.
  // Roadmap v7: active_days (già restituito dalla RPC v37) entra come 5ª cifra.
  publicStats: {
    title: 'IN NUMERI',
    hint: 'È il biglietto da visita che vedono gli altri sul tuo profilo.',
    activities: 'Attività',
    hours: 'Ore totali',
    km: 'Km totali',
    medals: 'Medaglie',
    activeDays: 'Giorni attivi',
  },

  // Bacheca medaglie vera (roadmap v7): le medaglie realmente sbloccate, non
  // solo il conteggio aggregato di "In numeri". Riusa useAchievements/MEDALS,
  // le stesse fonti di Medals.tsx.
  trophyCase: {
    title: 'BACHECA MEDAGLIE',
    emptyTitle: 'Nessuna medaglia sbloccata ancora',
    emptyHint: 'Registra qualche allenamento per guadagnare la prima.',
    seeAllButton: 'Vedi tutte le medaglie',
  },

  // Streak nella vetrina personale (roadmap v7): stesso calcStreak di Home/
  // Calendario/Sfide, mai ricalcolata a mano.
  streak: {
    title: 'STREAK ATTUALE',
    daysLabel: (n: number) => (n === 1 ? '1 giorno consecutivo' : `${n} giorni consecutivi`),
    zeroHint: 'Registra un\'attività oggi per iniziare una nuova streak.',
  },

  // I tuoi numeri per sport (roadmap v7): riusa activityTypeCounts di computeStats.
  sportBreakdown: {
    title: 'I TUOI NUMERI PER SPORT',
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
    sportSelectedCount: (n: number, max: number) => `${n}/${max} selezionati`,
    sportHint: (max: number) => `Scegli fino a ${max} attività che pratichi di più: compariranno per prime nel picker di Registra`,
    editSportButton: 'Modifica sport preferiti',
    // Roadmap v7: nella vetrina i preferiti sono sola lettura, si modificano
    // dalle Impostazioni (stesso form dei dati personali).
    editInSettings: 'Modifica nelle Impostazioni',
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

  // Switch lingua (roadmap v3, pilastro 04): puramente client (localStorage),
  // nessuna colonna DB. Vedi lib/i18n/language.ts + LanguageSettingsCard.
  language: {
    title: 'LINGUA',
    hint: 'Cambia la lingua di tutta l\'app. Il cambio si applica subito.',
    italian: 'Italiano',
    english: 'Inglese',
  },

  weight: {
    title: 'STORICO PESO',
    saveButtonSaving: '...',
    saveButton: (kg: number) => `Salva ${kg} kg`,
    outOfRange: 'Il peso deve essere tra 20 e 400 kg.',
    saveFailed: 'Salvataggio non riuscito. Controlla la connessione e riprova.',
    emptyHint: 'Nessuna pesata registrata. Inserisci il tuo peso e clicca "Salva peso".',
    needMoreEntries: 'Registra almeno 2 pesate per vedere il grafico.',
    tooltipValue: (v: number) => `${v} kg`,
    chartAriaLabel: 'Grafico dello storico del peso',
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
    exportSuccess: 'Dati esportati con successo',
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
    footer: 'Usa i crediti per sbloccare livelli nel Profilo e temi nelle Impostazioni.',
  },

  // Spiegazione dello streak (roadmap "PisoZone Next" P2-05): stesso pattern
  // on-demand di CreditsInfoModal, prima assente per lo streak.
  streakInfo: {
    ariaLabel: 'Come funziona lo streak',
    title: '🔥 COME FUNZIONA LO STREAK',
    growTitle: 'Un giorno alla volta',
    growDescription: 'Registra almeno un\'attività ogni giorno: lo streak cresce di un giorno consecutivo alla volta.',
    freezeTitle: 'Freeze streak',
    freezeDescription: 'Se salti un giorno, puoi proteggere lo streak spendendo 300 💎 — te lo proponiamo dalla Home quando serve.',
    restTitle: 'Giorno di riposo',
    restDescription: (perWeek: number) => `Fino a ${perWeek} a settimana, gratis: lo segni dalla card Recupero e protegge lo streak come un freeze.`,
    footer: 'Ti aspettano medaglie dedicate allo streak più lungo.',
  },

  errors: {
    profileLoadFailed: 'Errore nel caricamento del profilo. Riprova.',
    weightLoadFailed: 'Errore nel caricamento dello storico peso. Riprova.',
  },

  export: {
    fieldFailed: (key: string, message: string) => `Export di "${key}" non riuscito: ${message}`,
  },
} as const

const en: Widen<typeof it> = {
  pageTitle: 'PROFILE',
  settingsPageTitle: 'SETTINGS',
  creditsAmount: (n: number) => `${n} 💎`,

  settingsSections: {
    account: 'Account and security',
    notifications: 'Notifications',
    appearance: 'Appearance and language',
    profile: 'Personal data and goals',
    dataHelp: 'Guide and account data',
  },

  publicStats: {
    title: 'IN NUMBERS',
    hint: 'This is the calling card others see when they open your profile.',
    activities: 'Activities',
    hours: 'Total hours',
    km: 'Total km',
    medals: 'Medals',
    activeDays: 'Active days',
  },

  trophyCase: {
    title: 'TROPHY CASE',
    emptyTitle: 'No medals unlocked yet',
    emptyHint: 'Log a few workouts to earn your first one.',
    seeAllButton: 'See all medals',
  },

  streak: {
    title: 'CURRENT STREAK',
    daysLabel: (n: number) => (n === 1 ? '1 day in a row' : `${n} days in a row`),
    zeroHint: 'Log an activity today to start a new streak.',
  },

  sportBreakdown: {
    title: 'YOUR NUMBERS BY SPORT',
  },

  account: {
    usernameLabel: 'Username',
    levelPrefix: 'LV.',
    avatarUploadAriaLabel: 'Upload profile photo',
    avatarUploadError: (message: string) => `Upload error: ${message}`,
    changePhotoHint: 'Tap to change photo',
    formTitle: 'PERSONAL INFO',
    nameLabel: 'Name (optional)',
    namePlaceholder: 'Your name',
    genderLabel: 'Gender',
    genderMale: '♂ Male',
    genderFemale: '♀ Female',
    genderHint: 'Used to better estimate calories burned',
    birthDateLabel: 'Date of birth',
    ageSuffix: (age: number) => `${age} years`,
    heightLabel: 'Height (cm)',
    weightLabel: 'Weight (kg)',
    valueTooLow: 'Value too low',
    valueTooHigh: 'Value too high',
    weeklyGoalLabel: 'Weekly goal',
    dailyCalorieGoalLabel: 'Calories/day (kcal)',
    dailyCalorieGoalPlaceholder: 'optional',
    bmiTitle: 'BMI',
    bmiUnderweight: 'Underweight',
    bmiNormal: 'Normal',
    bmiOverweight: 'Overweight',
    bmiObese: 'Obese',
    sportTitle: 'FAVORITE SPORTS',
    sportSelectedCount: (n: number, max: number) => `${n}/${max} selected`,
    sportHint: (max: number) => `Choose up to ${max} activities you practice most: they'll show up first in the Log picker`,
    editSportButton: 'Edit favorite sports',
    editInSettings: 'Edit in Settings',
    saved: '✅ Saved!',
    saving: 'Saving...',
    save: 'Save profile',
  },

  level: {
    title: 'YOUR LEVEL',
    creditsLabel: (n: number) => `${n} 💎 credits`,
    levelOfTen: (level: number) => `Level ${level} of 10`,
    nextPrefix: 'Next: ',
    upgradeButton: (level: number, cost: number) => `Reach Lv.${level} — ${cost} 💎`,
    needMoreCredits: (missing: number) => `Need ${missing} more 💎`,
    maxLevelTitle: '👑 MAX LEVEL REACHED',
    maxLevelSubtitle: 'You\'re among the best PisoZone athletes',
    errorWithMessage: (message: string) => `Error: ${message}`,
    insufficientCredits: 'Insufficient credits',
    purchaseError: 'Purchase error',
    themeUnlockedActivated: 'Theme unlocked and activated!',
    celebrationTitle: (level: number) => `LEVEL ${level}!`,
    celebrationSubtitle: (title: string) => `New title: ${title}`,
  },

  theme: {
    title: 'THEMES',
    active: 'Active',
    activate: 'Activate',
    unlock: (cost: number) => `Unlock ${cost} 💎`,
  },

  language: {
    title: 'LANGUAGE',
    hint: 'Changes the language of the whole app. It applies immediately.',
    italian: 'Italian',
    english: 'English',
  },

  weight: {
    title: 'WEIGHT HISTORY',
    saveButtonSaving: '...',
    saveButton: (kg: number) => `Save ${kg} kg`,
    outOfRange: 'Weight must be between 20 and 400 kg.',
    saveFailed: 'Save failed. Check your connection and try again.',
    emptyHint: 'No weigh-ins recorded yet. Enter your weight and tap "Save weight".',
    needMoreEntries: 'Log at least 2 weigh-ins to see the chart.',
    tooltipValue: (v: number) => `${v} kg`,
    chartAriaLabel: 'Weight history chart',
    entriesCount: (n: number) => `${n} weigh-in${n === 1 ? '' : 's'} logged`,

    goal: {
      inputLabel: 'Weight goal (kg)',
      inputPlaceholder: 'e.g. 78',
      setButton: 'Set',
      badge: (kg: number) => `Goal: ${kg.toLocaleString('en-US')} kg`,
      chartLineLabel: 'Goal',
      removeAria: 'Remove weight goal',
      outOfRange: 'The goal must be between 20 and 400 kg.',
      saveFailed: 'Save failed. Check your connection and try again.',
      ratePerWeek: (kg: string) => `${kg} kg/week`,
      needMoreData: 'Log a few more weigh-ins (at least 3 in a week) to see the projection.',
      onTrack: (rate: string, date: string) => `At your current pace (${rate}) you'll get there around ${date}.`,
      onTrackWeeks: (weeks: number) => weeks === 1 ? 'About one week left.' : `About ${weeks} weeks left.`,
      reached: 'Goal reached! 🎉 Now it\'s about keeping it up.',
      flat: 'Weight has been stable in the last few weeks: the projection will appear once the trend picks a direction.',
      away: (rate: string) => `At your current pace (${rate}) you're moving away from the goal.`,
      tooFar: 'At this pace it would take over a year: the projection will appear once the trend speeds up.',
    },
  },

  guide: {
    title: 'PISOZONE GUIDE',
    body: 'Every feature of the app explained in one place: workouts, GPS, gym, programs, recovery, credits, social…',
    button: 'Open the guide',
  },

  privacy: {
    title: 'PRIVACY & DATA',
    body: 'Your data belongs to you: you can download a full copy in JSON format or permanently delete your account and everything in it.',
    privacyPolicyLink: 'Privacy Policy',
    termsLink: 'Terms of Service',
    exportButton: 'Export my data (JSON)',
    exportingButton: 'Preparing the file…',
    exportSuccess: 'Data exported successfully',
    exportFailed: 'Export failed. Check your connection and try again.',
    deleteAccountButton: 'Delete account',
  },

  notifications: {
    title: 'NOTIFICATIONS',
    unsupported: 'Push notifications aren\'t supported on this browser/device. On iPhone they only work if you add PisoZone to your Home Screen (Share → Add to Home Screen).',
    active: 'Notifications active',
    inactive: 'Notifications disabled',
    disable: 'Disable',
    enable: 'Enable',
    categoriesTitle: 'Notification types',
    categoryWorkoutReminder: 'Evening workout reminder',
    categoryNewMessages: 'New messages',
    categoryFriendRequests: 'Friend requests',
    categoryQuietHours: 'Quiet hours',
    quietFromLabel: 'From',
    quietToLabel: 'To',
    quietStartAriaLabel: 'Quiet hours start time',
    quietEndAriaLabel: 'Quiet hours end time',
    quietHint: 'No push notifications during this time window, for all categories above.',
    iosHint: 'On iPhone notifications only work if you add PisoZone to your Home Screen.',
    prefSaveFailed: 'Couldn\'t save the preference. Try again.',
  },

  recoveryEmail: {
    title: 'RECOVERY EMAIL',
    verifiedSuffix: (email: string) => `${email} verified`,
    introHint: 'Add and verify an email so you can recover access if you forget your password. Without a verified email, password reset isn\'t possible.',
    emailPlaceholder: 'your-email@example.com',
    emailAriaLabel: 'Recovery email',
    sendCodeButton: 'Send code',
    alreadyAssociated: 'This email is already associated with another account.',
    sendFailed: 'Send failed. Check the address and try again.',
    codeSentInfo: 'Code sent! Check your email and enter it below.',
    invalidCode: 'Invalid or expired code. Try again.',
    codePlaceholder: '6-digit code',
    codeAriaLabel: 'Verification code',
    verifyButton: 'Verify',
    changeEmailButton: 'Change email / resend',
  },

  deleteAccount: {
    ariaLabel: 'Delete account',
    title: 'DELETE ACCOUNT',
    warningBefore: 'This action is ',
    warningEmphasis: 'final and irreversible',
    warningAfter: ': your profile, activities, stats, medals, credits, messages, friendships and photos will all be deleted. No data can be recovered.',
    exportHint: 'Want a copy of your data first? Close this window and use "Export my data".',
    confirmLabelPrefix: 'To confirm, type your username: ',
    deleting: 'Deleting…',
    confirmButton: 'Delete forever',
    sessionExpired: 'Session expired: log in again and retry.',
    deleteFailed: 'Deletion failed. Check your connection and try again.',
  },

  credits: {
    ariaLabel: 'How to earn credits',
    title: '💎 HOW TO EARN CREDITS',
    logActivityTitle: 'Log activities',
    logActivityDescription: '1 💎 every 10 minutes of activity, up to a max of 10 💎 per day.',
    dailyChallengesTitle: 'Daily challenges',
    dailyChallengesDescription: (min: number, max: number) => `From ${min} to ${max} 💎 per completed challenge, up to 3 challenges a day.`,
    achievementsTitle: 'Unlocked medals',
    achievementsDescription: (bronze: number, silver: number, gold: number, diamond: number) =>
      `One-time bonus on unlock: 🥉 ${bronze} · 🥈 ${silver} · 🥇 ${gold} · 💎 ${diamond}`,
    footer: 'Use credits to unlock levels in Profile and themes in Settings.',
  },

  streakInfo: {
    ariaLabel: 'How the streak works',
    title: '🔥 HOW THE STREAK WORKS',
    growTitle: 'One day at a time',
    growDescription: 'Log at least one activity every day: the streak grows one consecutive day at a time.',
    freezeTitle: 'Streak freeze',
    freezeDescription: "If you skip a day, you can protect your streak by spending 300 💎 — we'll offer it from Home when it matters.",
    restTitle: 'Rest day',
    restDescription: (perWeek: number) => `Up to ${perWeek} a week, free: mark it from the Recovery card and it protects your streak like a freeze.`,
    footer: 'Medals dedicated to your longest streak are waiting for you.',
  },

  errors: {
    profileLoadFailed: 'Error loading profile. Try again.',
    weightLoadFailed: 'Error loading weight history. Try again.',
  },

  export: {
    fieldFailed: (key: string, message: string) => `Export of "${key}" failed: ${message}`,
  },
}

const profile = createNamespaceProxy(it, en)

export default profile
