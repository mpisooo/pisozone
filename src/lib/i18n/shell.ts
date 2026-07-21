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
    profileSettings: 'Impostazioni profilo',
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
    retryHint: 'Potrai riprovare quando vuoi da Profilo → Notifiche.',
    toggleHint: 'Potrai disattivarle o riattivarle quando vuoi da Profilo → Notifiche.',
  },
  onboarding: {
    ariaLabel: 'Benvenuto su PisoZone',
    stepIndicator: (step: number, total: number) => `Passo ${step} di ${total}`,
    back: 'Indietro',
    next: 'Avanti',
    finish: 'Registra il primo allenamento!',
    skip: 'Salta il tour',
    steps: [
      {
        icon: '🏃',
        title: 'BENVENUTO SU PISOZONE!',
        text: 'Registra ogni allenamento: 15 sport tra cui scegliere, con le calorie calcolate automaticamente in base al tuo profilo.',
      },
      {
        icon: '🏋️',
        title: 'REGISTRA COME VUOI',
        text: 'Corsa, bici e camminata si tracciano col GPS. In palestra segni esercizi, serie e carichi: l\'app riconosce da sola i tuoi record personali.',
      },
      {
        icon: '🎯',
        title: 'PROGRAMMI DI ALLENAMENTO',
        text: 'Scegli un obiettivo a più settimane — 5K, 10K, palestra, yoga — e allenati: le sessioni del piano si spuntano da sole.',
      },
      {
        icon: '💎',
        title: 'GUADAGNA CREDITI',
        text: 'Ogni attività ti fa guadagnare crediti, e ogni giorno hai 3 sfide personalizzate che ne valgono altri. Completale prima di mezzanotte!',
      },
      {
        icon: '🔥',
        title: 'STREAK E RECUPERO',
        text: 'Allenati con costanza per far crescere il tuo streak. Ti serve una pausa? Segna un giorno di riposo dalla Home e lo streak non si spezza. Ti aspettano 22 medaglie e 10 livelli.',
      },
      {
        icon: '🎨',
        title: 'FAI TUO IL TUO SPAZIO',
        text: 'Spendi i crediti nella pagina Profilo: 6 temi colore per tutta l\'app e cornici speciali per il tuo avatar.',
      },
      {
        icon: '👥',
        title: 'MEGLIO IN COMPAGNIA',
        text: 'Nella sezione Amici trovi feed con reazioni e commenti, classifica settimanale, messaggi e gruppi: aggiungi i tuoi amici e sfidatevi.',
      },
    ],
    guideHint: 'Tutte le funzioni sono spiegate nella Guida: la trovi nel tuo Profilo.',
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
    profileSettings: 'Profile settings',
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
    retryHint: 'You can try again anytime from Profile → Notifications.',
    toggleHint: 'You can turn them on or off anytime from Profile → Notifications.',
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
        text: 'Log every workout: 15 sports to choose from, with calories calculated automatically based on your profile.',
      },
      {
        icon: '🏋️',
        title: 'LOG IT YOUR WAY',
        text: 'Running, cycling and walking track with GPS. At the gym you log exercises, sets and loads: the app spots your personal records on its own.',
      },
      {
        icon: '🎯',
        title: 'TRAINING PLANS',
        text: 'Pick a multi-week goal — 5K, 10K, gym, yoga — and train: the plan\'s sessions tick themselves off.',
      },
      {
        icon: '💎',
        title: 'EARN CREDITS',
        text: 'Every activity earns you credits, and every day you get 3 personalized challenges worth even more. Complete them before midnight!',
      },
      {
        icon: '🔥',
        title: 'STREAK AND RECOVERY',
        text: 'Train consistently to grow your streak. Need a break? Mark a rest day from Home and your streak won\'t break. 22 medals and 10 levels are waiting for you.',
      },
      {
        icon: '🎨',
        title: 'MAKE IT YOURS',
        text: 'Spend your credits on the Profile page: 6 color themes for the whole app and special frames for your avatar.',
      },
      {
        icon: '👥',
        title: 'BETTER TOGETHER',
        text: 'In the Friends section you\'ll find a feed with reactions and comments, a weekly leaderboard, messages and groups: add your friends and challenge them.',
      },
    ],
    guideHint: 'Every feature is explained in the Guide: find it in your Profile.',
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
