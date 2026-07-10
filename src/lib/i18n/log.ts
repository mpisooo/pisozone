// Namespace condiviso da Log.tsx (nuova attività), ActivityEditModal.tsx
// (modifica), WorkoutTrackingOverlay.tsx (tracciamento GPS live), PhotoPickerField.tsx,
// RouteShape.tsx e dagli errori di useActivities.ts/useGpsTracking.ts — sono
// tutte UI di "registrazione attività", trattate come un solo dominio.
// Le etichette comuni a Log e ActivityEditModal vivono in `form`; quelle che
// invece differiscono leggermente tra le due schermate (es. "Note (opzionale)"
// vs "Note") restano separate in `new`/`edit` per non cambiare il testo visibile.
const log = {
  newActivityTitle: 'REGISTRA ATTIVITÀ',
  editActivityTitle: 'MODIFICA ATTIVITÀ',
  routeTitle: 'PERCORSO',
  gpsButton: 'Traccia con il GPS',

  form: {
    activityTypeTitle: 'TIPO DI ATTIVITÀ',
    dateTimeTitle: 'DATA E ORA',
    dateLabel: 'Data',
    timeLabel: 'Ora',
    durationTitle: 'DURATA',
    hoursLabel: 'Ore',
    minutesLabel: 'Minuti',
    detailsTitle: 'DETTAGLI',
    distanceLabel: 'Distanza (km)',
    perceived: {
      rpeTitle: 'SFORZO PERCEPITO',
      rpeHint: 'Facoltativo — quanto ti è costata questa sessione?',
      rpeUnset: 'Non ancora valutato',
      rpeAriaLabel: (value: number) => `Sforzo percepito: ${value} su 10`,
      clear: 'Cancella',
      moodTitle: 'UMORE ED ENERGIA',
      moodHint: 'Facoltativo — come ti senti dopo l\'allenamento?',
    },
    validation: {
      hoursNotNegative: 'Non può essere negativa',
      hoursMax: 'Massimo 12 ore',
      minutesNotNegative: 'Non possono essere negativi',
      minutesMax: 'Massimo 59 minuti',
      minutesDurationZero: 'Inserisci una durata maggiore di zero',
      caloriesNotNegative: 'Non possono essere negative',
      distanceNotNegative: 'Non può essere negativa',
      unrealisticValue: 'Valore non realistico',
    },
  },

  new: {
    durationTotalPrefix: 'Totale:',
    caloriesLabel: 'Calorie bruciate',
    caloriesAutoHint: (kcal: number) => `(auto: ~${kcal} kcal)`,
    caloriesPlaceholderAuto: (kcal: number) => `~${kcal} (calcolato auto)`,
    caloriesPlaceholderManual: 'es. 350',
    calorieInfoToggle: 'Come si calcola?',
    calorieInfoAriaLabel: 'Come vengono calcolate le calorie',
    calorieInfo: {
      heading: 'Stima basata sul MET',
      intro: 'Il calcolo usa la formula standard dell\'equivalente metabolico (MET):',
      formula: 'kcal = MET × peso (kg) × durata (ore)',
      metLabel: 'MET',
      metDesc: 'intensità dell\'attività (es. corsa = 9.8, yoga = 2.5, nuoto = 8.0)',
      weightLabel: 'Peso',
      weightDesc: (weightKg: number | null | undefined) => weightKg
        ? `preso dal tuo profilo (${weightKg} kg)`
        : 'preso dal tuo profilo — impostalo nel Profilo per attivare il calcolo auto',
      durationLabel: 'Durata',
      durationDesc: 'ore inserite nella sezione DURATA',
      genderLabel: 'Sesso',
      genderDesc: (gender: 'male' | 'female' | null | undefined) => gender === 'female'
        ? 'femmina (−10% kcal per composizione corporea)'
        : gender === 'male'
        ? 'maschio'
        : 'non impostato — aggiungilo nel Profilo per una stima più precisa',
      estimateBefore: 'È una ',
      estimateEmphasis: 'stima',
      estimateAfter: ': il valore reale dipende dall\'intensità effettiva, dalla frequenza cardiaca e dalla tua forma fisica. Puoi sempre sovrascriverlo manualmente.',
    },
    distancePlaceholder: 'es. 5.4',
    notesLabel: 'Note (opzionale)',
    notesPlaceholder: 'Come ti sei sentito? Dettagli dell\'allenamento...',
    photoLabel: 'Foto (opzionale)',
    photoHint: 'Sarà visibile ai tuoi amici nel feed.',
    saving: 'Salvataggio...',
    save: 'Salva attività',
    savedToast: {
      title: 'Attività salvata!',
      credits: (n: number) => `+${n} 💎 crediti guadagnati`,
      noCredits: 'Continua così 💪',
    },
    errorToast: {
      title: 'Salvataggio non riuscito',
      body: 'Controlla la connessione e riprova',
    },
    photoWarningToast: {
      title: 'Attività salvata, ma foto non caricata',
      body: 'Riprova dal calendario, modificando l\'attività',
    },
    routeWarningToast: {
      title: 'Attività salvata, ma percorso non salvato',
      body: 'Durata, distanza e calorie sono corrette',
    },
  },

  edit: {
    ariaLabel: 'Modifica attività',
    caloriesLabel: 'Calorie',
    caloriesPlaceholder: 'auto',
    notesLabel: 'Note',
    photoLabel: 'Foto',
    saveChanges: 'Salva modifiche',
    photoUploadFailed: 'Caricamento della foto non riuscito. Controlla la connessione e riprova.',
    updateFailed: 'Modifica non riuscita. Controlla la connessione e riprova.',
    deleteFailed: 'Eliminazione non riuscita. Controlla la connessione e riprova.',
  },

  tracking: {
    dialogAriaLabel: 'Allenamento in corso',
    acquiringTitle: 'In cerca del segnale GPS…',
    acquiringHint: 'Per un aggancio più rapido, assicurati di essere all\'aperto',
    startErrorTitle: 'Non è stato possibile avviare il tracciamento',
    savingTitle: 'Salvataggio allenamento…',
    retry: 'Riprova',
    discard: 'Scarta',
    pausedBadge: 'In pausa',
    weakSignal: 'Segnale GPS debole',
    kmUnit: 'km',
    avgSpeedLabel: 'velocità media',
    avgPaceLabel: 'passo medio',
    kcalEstimateLabel: 'kcal stimate',
    slideToUnlock: 'Scorri per sbloccare →',
    slideAriaLabel: 'Scorri per sbloccare i comandi dell\'allenamento',
    pause: 'Pausa',
    resume: 'Riprendi',
    finish: 'Termina',
    saveAndFinish: 'Salva e termina',
    saveFailed: 'Salvataggio non riuscito. Controlla la connessione e riprova.',
    hookErrors: {
      permissionDenied: 'Permesso GPS negato. Abilita la posizione dalle impostazioni del browser per tracciare il percorso.',
      signalUnavailable: 'Segnale GPS non disponibile. Riprova in un punto più scoperto.',
      notSupported: 'Il GPS non è supportato su questo dispositivo/browser.',
      timeout: 'Segnale GPS non trovato. Assicurati di essere all\'aperto e riprova.',
    },
  },

  photoPicker: {
    previewAlt: 'Anteprima della foto allegata',
    removeAria: 'Rimuovi foto',
    addPhoto: 'Aggiungi una foto',
  },

  routeShapeAriaLabel: 'Sagoma del percorso registrato',

  errors: {
    loadFailed: 'Errore nel caricamento delle attività. Riprova.',
  },
} as const

export default log
