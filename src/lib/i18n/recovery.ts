import { createNamespaceProxy, type Widen } from './proxy'

// Namespace del recupero (roadmap v2, pilastro 02 punto 5): card "Recupero di
// oggi" in Home (components/RecoveryCard.tsx) + errori di useRecovery.ts.
// Le stringhe del calendario (indicatore riposo nel pannello giorno) restano
// nel namespace calendar, che è la loro pagina.
const it = {
  cardTitle: 'RECUPERO DI OGGI',

  rest: {
    label: 'Giorno di riposo',
    hintAvailable: (remaining: number) =>
      remaining === 1
        ? 'La streak non si spezza · ne resta 1 questa settimana'
        : `La streak non si spezza · ne restano ${remaining} questa settimana`,
    hintActive: 'Riposo segnato: la streak è al sicuro anche senza allenarti',
    hintExhausted: 'Hai usato i riposi di questa settimana',
    ariaLabel: 'Segna oggi come giorno di riposo',
  },

  water: {
    label: 'Idratazione',
    value: (ml: number, goalMl: number) =>
      `${(ml / 1000).toLocaleString('it-IT', { maximumFractionDigits: 2 })} / ${(goalMl / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} L`,
    addAria: 'Aggiungi un bicchiere d\'acqua (250 ml)',
    removeAria: 'Togli un bicchiere d\'acqua (250 ml)',
    goalReached: 'Obiettivo raggiunto 💧',
  },

  sleep: {
    label: 'Sonno',
    unset: '—',
    value: (hours: number) => `${hours.toLocaleString('it-IT', { maximumFractionDigits: 1 })} h`,
    addAria: 'Aggiungi mezz\'ora di sonno',
    removeAria: 'Togli mezz\'ora di sonno',
    hint: 'Ore dormite stanotte',
    clear: 'Cancella',
  },

  errors: {
    saveFailed: 'Salvataggio del recupero non riuscito. Riprova.',
  },
} as const

const en: Widen<typeof it> = {
  cardTitle: "TODAY'S RECOVERY",

  rest: {
    label: 'Rest day',
    hintAvailable: (remaining: number) =>
      remaining === 1
        ? 'Your streak stays safe · 1 left this week'
        : `Your streak stays safe · ${remaining} left this week`,
    hintActive: 'Rest day logged: your streak is safe even without training',
    hintExhausted: "You've used up this week's rest days",
    ariaLabel: 'Mark today as a rest day',
  },

  water: {
    label: 'Hydration',
    // Locale cambiato in en-US (rispetto a it-IT) per un separatore decimale
    // corretto in inglese: la logica di formattazione resta identica.
    value: (ml: number, goalMl: number) =>
      `${(ml / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} / ${(goalMl / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} L`,
    addAria: 'Add a glass of water (250 ml)',
    removeAria: 'Remove a glass of water (250 ml)',
    goalReached: 'Goal reached 💧',
  },

  sleep: {
    label: 'Sleep',
    unset: '—',
    value: (hours: number) => `${hours.toLocaleString('en-US', { maximumFractionDigits: 1 })} h`,
    addAria: 'Add half an hour of sleep',
    removeAria: 'Remove half an hour of sleep',
    hint: 'Hours slept last night',
    clear: 'Clear',
  },

  errors: {
    saveFailed: 'Failed to save recovery data. Please try again.',
  },
}

const recovery = createNamespaceProxy(it, en)

export default recovery
