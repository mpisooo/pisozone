import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per pages/Heatmap.tsx (roadmap v4, pilastro 02) e per la sua
// card d'ingresso in Stats.tsx. Da non confondere con l'"Anno in pixel" di
// stats.ts (yearPixels): quella è una griglia calendario, questa è una vera
// mappa dei percorsi GPS.
const it = {
  entryCard: {
    heading: 'LA TUA HEATMAP',
    subtitle: 'Tutti i tuoi percorsi GPS sovrapposti sulla stessa mappa. Privata: solo tu la vedi.',
    button: 'Apri la heatmap',
  },

  pageTitle: 'LA TUA HEATMAP',
  subtitle: 'Ogni percorso GPS che hai registrato, sovrapposto sulla stessa mappa: dove passi più spesso, la linea si accende di più.',
  privacyNote: 'È privata: non è mai visibile ad amici o altri utenti.',
  routesCount: (n: number) => (n === 1 ? '1 percorso' : `${n} percorsi`),
  mapAriaLabel: 'Mappa con tutti i tuoi percorsi GPS sovrapposti',
  loading: 'Sto raccogliendo i tuoi percorsi...',

  mapUnavailable: {
    title: 'Mappa non disponibile',
    hint: 'Serve una connessione a Internet per caricare la mappa. Riprova quando sei online.',
  },

  loadError: {
    title: 'Non riesco a caricare i tuoi percorsi',
    hint: 'Controlla la connessione e riprova tra poco.',
  },

  emptyState: {
    title: 'Ancora nessun percorso',
    hint: 'Traccia un\'attività con il GPS (corsa, bici, camminata o trekking) per iniziare a costruire la tua heatmap.',
    cta: '+ Registra allenamento',
  },
} as const

const en: Widen<typeof it> = {
  entryCard: {
    heading: 'YOUR HEATMAP',
    subtitle: 'All your GPS routes overlaid on the same map. Private: only you can see it.',
    button: 'Open heatmap',
  },

  pageTitle: 'YOUR HEATMAP',
  subtitle: 'Every GPS route you\'ve ever logged, overlaid on the same map: the more you pass through a place, the brighter the line glows.',
  privacyNote: 'It\'s private: never visible to friends or other users.',
  routesCount: (n: number) => (n === 1 ? '1 route' : `${n} routes`),
  mapAriaLabel: 'Map with all your GPS routes overlaid',
  loading: 'Gathering your routes...',

  mapUnavailable: {
    title: 'Map unavailable',
    hint: 'You need an internet connection to load the map. Try again once you\'re online.',
  },

  loadError: {
    title: 'Can\'t load your routes',
    hint: 'Check your connection and try again shortly.',
  },

  emptyState: {
    title: 'No routes yet',
    hint: 'Track an activity with GPS (running, cycling, walking or hiking) to start building your heatmap.',
    cta: '+ Log a workout',
  },
}

const heatmap = createNamespaceProxy(it, en)

export default heatmap
