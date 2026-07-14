// Componenti globali montati una volta in App.tsx/AppLayout (non specifici
// di una singola pagina): TopBar, Navbar, ErrorBoundary, PushNotificationPrompt,
// OnboardingTour, PhotoLightbox, SplashScreen. I nomi di brand ("PISOZONE",
// "PISO"/"ZONE") restano scritti a mano nel JSX, non sono testo da tradurre.
const shell = {
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
        text: 'Allenati con costanza per far crescere il tuo streak. Ti serve una pausa? Segna un giorno di riposo dalla Home e lo streak non si spezza. Ti aspettano 18 medaglie e 10 livelli.',
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
        icon: '⚔️',
        title: 'Sfide con gli amici',
        text: 'Duelli a tempo 1 contro 1 o di gruppo — sessioni, minuti, km o calorie. Chi fa di più vince 100 crediti. In fondo alla pagina Sfide.',
      },
      {
        icon: '👤',
        title: 'Profili pubblici e scoperta',
        text: 'Tocca chiunque in classifica per vedere il suo profilo con numeri e medaglie; in Amici trovi le persone più attive da scoprire.',
      },
      {
        icon: '✨',
        title: 'Insight e Wrapped',
        text: 'In Statistiche l\'app ti racconta cosa emerge dai tuoi dati, e il Wrapped riassume il tuo mese in stile storia — condivisibile come immagine.',
      },
      {
        icon: '🌅',
        title: 'Rientro morbido',
        text: 'Se ti assenti qualche giorno, al ritorno ti accoglie una card dedicata — e il promemoria serale smette di martellare.',
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

export default shell
