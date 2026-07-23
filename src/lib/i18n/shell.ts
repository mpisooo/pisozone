import { createNamespaceProxy, type Widen } from './proxy'

// Componenti globali montati una volta in App.tsx/AppLayout (non specifici
// di una singola pagina): TopBar, Navbar, ErrorBoundary, PushNotificationPrompt,
// OnboardingTour, PhotoLightbox, SplashScreen. I nomi di brand ("PISOZONE",
// "PISO"/"ZONE") restano scritti a mano nel JSX, non sono testo da tradurre.
const it = {
  errorBoundary: {
    title: 'QUALCOSA È ANDATO STORTO',
    body: 'Si è verificato un errore imprevisto. Ricarica la pagina per riprovare.',
    reload: 'Ricarica pagina',
  },
  updatePrompt: {
    title: 'Nuova versione disponibile',
    action: 'Aggiorna',
  },
  // Prompt di installazione PWA (P2-02, roadmap "PisoZone Next"): compare
  // dopo un primo segnale di valore (almeno un'attività registrata), non al
  // primo caricamento — vedi lib/pwaInstall.ts e PwaInstallPrompt.tsx.
  pwaInstallPrompt: {
    androidTitle: 'Installa PisoZone sulla home',
    androidAction: 'Installa',
    iosTitle: 'Aggiungi PisoZone alla home',
    iosBody: 'Tocca l\'icona Condividi, poi "Aggiungi a Home". Si apre come un\'app vera, senza barra del browser.',
    iosAction: 'Ho capito',
    dismissAria: 'Nascondi',
  },
  navbar: {
    home: 'Home',
    log: 'Registra',
    analysis: 'Analisi',
    challenges: 'Sfide',
    social: 'Social',
  },
  topBar: {
    profileMenuLabel: 'Menu profilo',
    levelPrefix: 'Lv.',
    creditsSuffix: 'crediti',
    creditsInfoLabel: 'Come guadagnare crediti',
    // Roadmap v7, pilastro 01: Profilo (vetrina) e Impostazioni
    // (configurazione) sono due voci distinte, non più una sola.
    profileMenuItem: 'Profilo',
    settingsMenuItem: 'Impostazioni',
    signOut: 'Esci',
  },
  pushPrompt: {
    dialogAriaLabel: 'Attiva le notifiche',
    title: 'ATTIVA LE NOTIFICHE',
    body: 'Ricevi un promemoria se non ti alleni entro le 22:00, e un avviso per nuovi messaggi e richieste di amicizia — anche ad app chiusa.',
    notNow: 'Non ora',
    enable: 'Attiva',
    enabling: 'Attivazione...',
    understood: 'Ho capito',
    retryHint: 'Potrai riprovare quando vuoi da Impostazioni → Notifiche.',
    toggleHint: 'Potrai disattivarle o riattivarle quando vuoi da Impostazioni → Notifiche.',
  },
  onboarding: {
    ariaLabel: 'Benvenuto su PisoZone',
    stepIndicator: (step: number, total: number) => `Passo ${step} di ${total}`,
    back: 'Indietro',
    next: 'Avanti',
    finish: 'Registra il primo allenamento!',
    skip: 'Salta il tour',
    // Tour ridotto da 7 a 2 slide (roadmap "PisoZone Next" P1-02, 23/07/2026):
    // il resto (programmi, crediti/sfide, streak/recupero, temi/livelli,
    // social) non si spiega più a memoria prima di qualunque azione reale —
    // compare come ContextualTip la prima volta che l'utente apre davvero
    // quella sezione (Sfide, Social; Programmi si spiega già da sé col
    // sottotitolo di pagina). Obiettivo: arrivare alla prima attività
    // registrata più in fretta.
    steps: [
      {
        icon: '🏃',
        title: 'BENVENUTO SU PISOZONE!',
        text: 'Registra ogni allenamento: 50 sport tra cui scegliere — corsa, bici e camminata col GPS, in palestra esercizi e carichi — con le calorie calcolate in automatico.',
      },
      {
        icon: '🚀',
        title: 'IL RESTO LO SCOPRI STRADA FACENDO',
        text: 'Crediti, sfide, streak, programmi e amici si sbloccano man mano che li incontri nell\'app. Registra il tuo primo allenamento per iniziare!',
      },
    ],
    guideHint: 'Tutte le funzioni sono spiegate nella Guida: la trovi nelle Impostazioni.',
  },

  // Annuncio one-shot delle novità per chi usa già l'app (WhatsNewOverlay):
  // gli item descrivono l'ondata corrente (NEWS_VERSION nel componente).
  whatsNew: {
    ariaLabel: 'Novità di PisoZone',
    title: 'NOVITÀ SU PISOZONE',
    subtitle: 'Ecco cosa è arrivato dall\'ultima volta:',
    gotIt: 'Ho capito',
    openGuide: 'Apri la guida completa',
    items: [
      {
        icon: '🧠',
        title: 'Il coach di PisoZone',
        text: 'Un nuovo Punteggio di Prontezza in Home (sforzo, sonno, carico e riposo in un numero solo) e una stima del tuo passo gara in Statistiche — nessun sensore richiesto, solo i dati che inserisci già.',
      },
      {
        icon: '⏱️',
        title: 'Allenamenti a intervalli',
        text: 'Costruisci una sessione a ripetute prima di tracciare col GPS: l\'app ti segue zona per zona, passo dopo passo. E se un programma attivo va fuori rotta, ora te lo dice.',
      },
      {
        icon: '🗺️',
        title: 'La tua heatmap personale',
        text: 'In Statistiche, se hai attività tracciate col GPS, trovi una mappa con tutti i tuoi percorsi sovrapposti: dove passi più spesso la linea si accende. Privatissima: mai visibile ad altri.',
      },
      {
        icon: '🚩',
        title: 'Segmenti personali e sfide di percorso',
        text: 'Crea un tratto preferito da un percorso GPS e tieni il tuo record ogni volta che ci ripassi — o sfida un amico a batterti sullo stesso tratto. In più, ora puoi segnare le attività come preferite e ritrovarle dal Calendario.',
      },
      {
        icon: '🏋️',
        title: 'Palestra da veterano',
        text: 'Salva le tue schede come routine e precompilale con un tocco, collega blocchi in superset o drop set, carica il bilanciere col calcolatore piastre e usa il nuovo timer di recupero tra le serie.',
      },
      {
        icon: '🛰️',
        title: 'Importa ed esporta i tuoi percorsi',
        text: 'Arrivi da Strava, Garmin Connect o Komoot? Importa un file GPX dalla scheda Registra. Ogni percorso tracciato si può anche esportare in GPX. E il promemoria serale ora tiene conto della tua prontezza: niente spinte ad allenarti se il corpo chiede riposo.',
      },
    ],
  },
  photoLightbox: {
    close: 'Chiudi',
  },
  splash: {
    tagline: 'ALLENATI · CRESCI · DOMINA',
  },
} as const

const en: Widen<typeof it> = {
  errorBoundary: {
    title: 'SOMETHING WENT WRONG',
    body: 'An unexpected error occurred. Reload the page to try again.',
    reload: 'Reload page',
  },
  updatePrompt: {
    title: 'New version available',
    action: 'Update',
  },
  pwaInstallPrompt: {
    androidTitle: 'Install PisoZone on your home screen',
    androidAction: 'Install',
    iosTitle: 'Add PisoZone to your home screen',
    iosBody: 'Tap the Share icon, then "Add to Home Screen". It opens like a real app, with no browser bar.',
    iosAction: 'Got it',
    dismissAria: 'Dismiss',
  },
  navbar: {
    home: 'Home',
    log: 'Log',
    analysis: 'Stats',
    challenges: 'Challenges',
    social: 'Social',
  },
  topBar: {
    profileMenuLabel: 'Profile menu',
    levelPrefix: 'Lv.',
    creditsSuffix: 'credits',
    creditsInfoLabel: 'How to earn credits',
    profileMenuItem: 'Profile',
    settingsMenuItem: 'Settings',
    signOut: 'Sign out',
  },
  pushPrompt: {
    dialogAriaLabel: 'Enable notifications',
    title: 'ENABLE NOTIFICATIONS',
    body: 'Get a reminder if you haven\'t worked out by 10 PM, plus alerts for new messages and friend requests — even with the app closed.',
    notNow: 'Not now',
    enable: 'Enable',
    enabling: 'Enabling...',
    understood: 'Got it',
    retryHint: 'You can try again anytime from Settings → Notifications.',
    toggleHint: 'You can turn them on or off anytime from Settings → Notifications.',
  },
  onboarding: {
    ariaLabel: 'Welcome to PisoZone',
    stepIndicator: (step: number, total: number) => `Step ${step} of ${total}`,
    back: 'Back',
    next: 'Next',
    finish: 'Log your first workout!',
    skip: 'Skip tour',
    steps: [
      {
        icon: '🏃',
        title: 'WELCOME TO PISOZONE!',
        text: 'Log every workout: 50 sports to choose from — running, cycling and walking with GPS, gym sets and loads — with calories calculated automatically.',
      },
      {
        icon: '🚀',
        title: "YOU'LL DISCOVER THE REST ALONG THE WAY",
        text: 'Credits, challenges, streaks, plans and friends unlock as you come across them in the app. Log your first workout to get started!',
      },
    ],
    guideHint: 'Every feature is explained in the Guide: find it in Settings.',
  },

  // Annuncio one-shot delle novità per chi usa già l'app (WhatsNewOverlay):
  // gli item descrivono l'ondata corrente (NEWS_VERSION nel componente).
  whatsNew: {
    ariaLabel: 'What\'s new on PisoZone',
    title: 'WHAT\'S NEW ON PISOZONE',
    subtitle: 'Here\'s what\'s new since last time:',
    gotIt: 'Got it',
    openGuide: 'Open the full guide',
    items: [
      {
        icon: '🧠',
        title: 'The PisoZone coach',
        text: 'A new Readiness score in Home (effort, sleep, load and rest in one number) and a predicted race pace in Stats — no sensor required, just the data you already log.',
      },
      {
        icon: '⏱️',
        title: 'Interval workouts',
        text: 'Build a repeat session before tracking with GPS: the app follows you zone by zone, step by step. And if an active plan drifts off track, it now tells you.',
      },
      {
        icon: '🗺️',
        title: 'Your personal heatmap',
        text: 'In Stats, if you have GPS-tracked activities, you\'ll find a map with all your routes overlaid: the more you pass through a place, the brighter the line glows. Fully private: never visible to anyone else.',
      },
      {
        icon: '🚩',
        title: 'Personal segments and route challenges',
        text: 'Create a favorite stretch from a GPS route and keep your best time every time you pass through — or challenge a friend to beat you on the same stretch. Plus, you can now mark activities as favorites and find them again from the Calendar.',
      },
      {
        icon: '🏋️',
        title: 'Gym, veteran mode',
        text: 'Save your workouts as routines and prefill them in one tap, link blocks into supersets or drop sets, load the bar with the new plate calculator, and use the new rest timer between sets.',
      },
      {
        icon: '🛰️',
        title: 'Import and export your routes',
        text: 'Coming from Strava, Garmin Connect or Komoot? Import a GPX file from the Log tab. Every tracked route can also be exported as GPX. And the evening reminder now factors in your readiness: no push to train if your body is asking for rest.',
      },
    ],
  },
  photoLightbox: {
    close: 'Close',
  },
  splash: {
    tagline: 'TRAIN · GROW · DOMINATE',
  },
}

const shell = createNamespaceProxy(it, en)

export default shell
