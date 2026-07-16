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
    // Selettore indoor/outdoor (solo per gli sport in INDOOR_VARIANTS):
    // facoltativo come RPE/umore, tocca di nuovo per azzerare.
    indoorQuestion: 'Dove? Facoltativo — cambia il nome dell\'attività',
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
    gym: {
      title: 'ESERCIZI',
      hint: 'Facoltativo — segna esercizi, serie e carichi per seguire progressi e record personali.',
      exerciseLabel: 'Esercizio',
      exercisePlaceholder: 'es. Panca piana',
      setsLabel: 'Serie',
      repsLabel: 'Ripetizioni',
      weightLabel: 'Peso (kg)',
      weightPlaceholder: 'corpo libero',
      addExercise: 'Aggiungi esercizio',
      removeAria: (name: string) => name ? `Rimuovi ${name}` : 'Rimuovi esercizio',
      incompleteRow: 'Completa serie e ripetizioni, o questa riga non verrà salvata',
      summary: (count: number, volumeKg: number) => {
        const base = count === 1 ? '1 esercizio' : `${count} esercizi`
        return volumeKg > 0
          ? `${base} · volume totale ${volumeKg.toLocaleString('it-IT')} kg`
          : base
      },
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
      pr: (exercise: string, weightKg: number) =>
        `🏆 Nuovo record: ${exercise} ${weightKg.toLocaleString('it-IT')} kg`,
      prExtra: (n: number) => n === 1 ? ' e un altro record' : ` e altri ${n} record`,
    },
    // Salvataggio senza rete (roadmap v2, pilastro 05): l'attività resta in
    // coda sul dispositivo e si sincronizza da sola al ritorno online, senza
    // che l'utente debba fare nulla.
    savedOfflineToast: {
      title: 'Attività salvata, in attesa di rete',
      body: 'Si sincronizzerà da sola appena torni online',
      bodyExtrasSkipped: 'Si sincronizzerà da sola appena torni online. Foto ed esercizi non sono stati inclusi: aggiungili di nuovo modificandola in seguito.',
    },
    errorToast: {
      title: 'Salvataggio non riuscito',
      body: 'Controlla la connessione e riprova',
    },
    photoWarningToast: {
      title: 'Attività salvata, ma foto non caricata',
      body: 'Riprova dal calendario, modificando l\'attività',
    },
    setsWarningToast: {
      title: 'Attività salvata, ma esercizi non salvati',
      body: 'Riprova dal calendario, modificando l\'attività',
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
    setsUpdateFailed: 'Attività aggiornata, ma esercizi non salvati. Controlla la connessione e salva di nuovo.',
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
    // Zone Live: il badge con la zona di intensità della velocità recente
    // (l'etichetta — Recupero, Moderata... — è un dato di dominio di lib/zones).
    zoneLive: (label: string) => `Zona ${label}`,
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

  map: {
    ariaLabel: 'Mappa del percorso registrato',
  },

  // Split per km sotto la sagoma del percorso (ActivityEditModal): compaiono
  // solo se il percorso ha almeno un km completo. L'ultimo tratto sotto il km
  // mostra la sua distanza reale al posto del numero progressivo.
  splits: {
    title: 'Passo per km',
    kmLabel: (n: number) => `Km ${n}`,
    partialLabel: (km: string) => `${km} km`,
  },

  // Profilo altimetrico (v42): compare solo se il percorso ha la quota salvata
  // (allenamenti tracciati dopo la migrazione, su dispositivi che la forniscono).
  elevation: {
    title: 'Altimetria',
    chartAriaLabel: 'Profilo altimetrico del percorso',
    gain: (m: number) => `D+ ${m} m`,
    loss: (m: number) => `D− ${m} m`,
    range: (min: number, max: number) => `${min}–${max} m`,
  },

  errors: {
    loadFailed: 'Errore nel caricamento delle attività. Riprova.',
    // Un'attività in coda offline che al momento della sincronizzazione viene
    // rifiutata dal server per un motivo NON di rete (validazione, RLS): non
    // ha senso tenerla in coda per sempre, si avvisa e si scarta.
    syncFailed: 'Un\'attività in attesa di rete non è stata accettata dal server ed è stata scartata.',
  },
} as const

export default log
