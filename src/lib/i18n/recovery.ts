// Namespace del recupero (roadmap v2, pilastro 02 punto 5): card "Recupero di
// oggi" in Home (components/RecoveryCard.tsx) + errori di useRecovery.ts.
// Le stringhe del calendario (indicatore riposo nel pannello giorno) restano
// nel namespace calendar, che è la loro pagina.
const recovery = {
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

export default recovery
