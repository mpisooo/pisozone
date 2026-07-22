import { createNamespaceProxy, type Widen } from './proxy'

// Namespace condiviso da Log.tsx (nuova attività), ActivityEditModal.tsx
// (modifica), WorkoutTrackingOverlay.tsx (tracciamento GPS live), PhotoPickerField.tsx,
// RouteShape.tsx e dagli errori di useActivities.ts/useGpsTracking.ts — sono
// tutte UI di "registrazione attività", trattate come un solo dominio.
// Le etichette comuni a Log e ActivityEditModal vivono in `form`; quelle che
// invece differiscono leggermente tra le due schermate (es. "Note (opzionale)"
// vs "Note") restano separate in `new`/`edit` per non cambiare il testo visibile.
const it = {
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
    // Dislivello manuale: per chi non traccia con il GPS ma vuole comunque
    // segnare i metri di salita (trekking, arrampicata...).
    elevationLabel: 'Dislivello (m)',
    elevationPlaceholder: 'es. 450',
    elevationHint: 'Facoltativo — metri di salita, se non hai tracciato con il GPS',
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
      // Superset e drop set (roadmap v4, pilastro 03): il tipo si INFERISCE dal
      // nome al collegamento, l'utente sceglie solo SE collegare due blocchi.
      linkToPrevious: 'Collega al blocco sopra',
      unlinkAria: 'Scollega dal gruppo',
      supersetBadge: 'Superset',
      dropsetBadge: 'Drop set',
      plateCalcAria: 'Calcolatore piastre per questo peso',
      restTimerAria: 'Avvia il timer di recupero',
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

  // Log lampo (roadmap v3, pilastro 02): il chip sotto la griglia degli sport
  // ricopia durata e distanza dell'ultima sessione dello sport selezionato.
  quick: {
    chip: (durationMin: number, distanceKm: number | null) =>
      `Come l'ultima volta: ${durationMin} min${distanceKm ? ` · ${distanceKm.toLocaleString('it-IT')} km` : ''}`,
    chipAria: 'Precompila durata e distanza dall\'ultimo allenamento di questo sport',
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
        : 'preso dal tuo profilo — impostalo nelle Impostazioni per attivare il calcolo auto',
      durationLabel: 'Durata',
      durationDesc: 'ore inserite nella sezione DURATA',
      genderLabel: 'Sesso',
      genderDesc: (gender: 'male' | 'female' | null | undefined) => gender === 'female'
        ? 'femmina (−10% kcal per composizione corporea)'
        : gender === 'male'
        ? 'maschio'
        : 'non impostato — aggiungilo nelle Impostazioni per una stima più precisa',
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
    // che l'utente debba fare nulla. Da v3 pilastro 04 anche foto ed esercizi
    // restano in coda (IndexedDB) invece di essere scartati.
    savedOfflineToast: {
      title: 'Attività salvata, in attesa di rete',
      body: 'Si sincronizzerà da sola appena torni online',
      bodyExtrasQueued: 'Si sincronizzerà da sola appena torni online, foto ed esercizi compresi.',
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
    // Attività ancora in coda offline (roadmap v3, pilastro 04): foto ed
    // esercizi vanno allegati al momento del log, non da qui — qui non c'è
    // ancora un id reale a cui agganciarli.
    pendingExtrasHint: 'Foto ed esercizi non sono modificabili finché l\'attività è in attesa di rete.',
  },

  // Allenamenti a intervalli strutturati (roadmap v4, pilastro 01): builder
  // in Log.tsx (repeats × lavoro a distanza + recupero a tempo, ciascuno con
  // una zona target) e stringhe di stato durante il tracciamento live in
  // WorkoutTrackingOverlay.tsx. Vedi lib/intervalWorkout.ts.
  intervals: {
    toggleLabel: 'Allenamento a intervalli',
    toggleHint: 'Facoltativo — costruisci una sessione a ripetute prima di partire',
    repeatsLabel: 'Ripetute',
    workHeading: 'Lavoro',
    workDistanceLabel: 'Distanza (m)',
    zoneLabel: 'Zona target',
    recoveryHeading: 'Recupero',
    recoverySecLabel: 'Durata (s)',
    summary: (repeats: number, workM: number, recoverySec: number) => `${repeats} × ${workM} m, recupero ${recoverySec}s`,
    invalidHint: 'Controlla i valori: ripetute 2-20, distanza 100-10.000 m, recupero 15-600 s.',
    stepWork: (rep: number, total: number) => `Ripetuta ${rep}/${total}`,
    stepRecovery: (rep: number, total: number) => `Recupero ${rep}/${total}`,
    stepProgressWork: (doneM: number, targetM: number) => `${doneM}/${targetM} m`,
    stepProgressRecovery: (remainingSec: number) => `${remainingSec}s`,
    offTarget: 'Fuori zona',
    allDone: 'Serie completata — continua libero o termina quando vuoi',
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
    // Split live (roadmap v3, pilastro 02): i chip con il tempo degli ultimi
    // km completati durante il tracciamento. Per la bici si mostra la
    // velocità del km, per gli altri sport il passo.
    splitChipPace: (km: number, pace: string) => `Km ${km} · ${pace}`,
    splitChipSpeed: (km: number, kmh: string) => `Km ${km} · ${kmh} km/h`,
    splitsAria: 'Tempo degli ultimi chilometri completati',
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

  // Percorso nel feed (v45): il consenso si rivede anche in modifica.
  routeShare: {
    label: 'Mostra il percorso agli amici nel feed',
    hint: 'Solo la sagoma del giro, mai la mappa.',
  },

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

  // Calcolatore piastre (roadmap v4, pilastro 03): modale aperta dal bottone
  // accanto al peso in ExerciseSetsFields, funzione pura in lib/plateCalculator.ts.
  plateCalculator: {
    title: 'CALCOLATORE PIASTRE',
    close: 'Chiudi',
    dialogAriaLabel: 'Calcolatore piastre',
    targetLabel: 'Peso totale (kg)',
    barLabel: 'Bilanciere (kg)',
    perSideLabel: 'Per lato',
    noPlates: 'Solo il bilanciere, nessuna piastra',
    achievedLabel: 'Carico ottenuto',
    remainderHint: (kg: number) => `Non raggiungibile esattamente con queste piastre: mancano ${kg} kg`,
  },

  // Timer di recupero tra le serie (roadmap v4, pilastro 03): solo client,
  // nessuna persistenza (lib/restTimer.ts + hooks/useRestTimer.ts).
  restTimer: {
    label: 'Recupero',
    adjustLessAria: 'Togli 15 secondi',
    adjustMoreAria: 'Aggiungi 15 secondi',
    dismissAria: 'Chiudi il timer di recupero',
  },

  // Export GPX di un percorso (roadmap v4, pilastro 04): bottone in
  // ActivityEditModal, sotto la mappa/sagoma. lib/gpxExport.ts.
  gpxExport: {
    button: 'Esporta GPX',
  },

  // Import GPX (roadmap v4, pilastro 04): entry point in Log.tsx accanto al
  // bottone GPS, GpxImportModal.tsx, logica pura in lib/gpxImport.ts.
  gpxImport: {
    entryButton: 'Importa un percorso GPX',
    title: 'IMPORTA DA GPX',
    close: 'Chiudi',
    dialogAriaLabel: 'Importa un percorso da un file GPX',
    hint: 'Scegli un file .gpx esportato da un altro strumento (Strava, Garmin Connect, Komoot...): ricostruiamo l\'attività dal percorso registrato.',
    pickFile: 'Scegli un file GPX',
    changeFile: 'Cambia file',
    parseFailed: 'Il file non è un GPX valido, o non contiene abbastanza punti con un orario registrato.',
    typeLabel: 'Tipo di attività',
    previewDate: 'Data',
    previewDuration: 'Durata',
    previewDistance: 'Distanza',
    previewElevation: 'Dislivello',
    importing: 'Importazione...',
    submit: 'Importa attività',
    failed: 'Non sono riuscito a importare l\'attività. Controlla la connessione e riprova.',
    doneToast: 'Attività importata dal file GPX',
  },

  errors: {
    loadFailed: 'Errore nel caricamento delle attività. Riprova.',
    // Un'attività in coda offline che al momento della sincronizzazione viene
    // rifiutata dal server per un motivo NON di rete (validazione, RLS): non
    // ha senso tenerla in coda per sempre, si avvisa e si scarta.
    syncFailed: 'Un\'attività in attesa di rete non è stata accettata dal server ed è stata scartata.',
    // Foto/esercizi accodati offline (IndexedDB): l'attività si è comunque
    // sincronizzata, solo l'allegato non è stato applicato — si riprova dalla
    // modifica, come per l'equivalente fallimento online.
    offlineAttachmentsFailed: 'Attività sincronizzata, ma foto o esercizi in attesa non sono stati salvati. Riprova modificandola dal Calendario.',
  },
} as const

const en: Widen<typeof it> = {
  newActivityTitle: 'LOG ACTIVITY',
  editActivityTitle: 'EDIT ACTIVITY',
  routeTitle: 'ROUTE',
  gpsButton: 'Track with GPS',

  form: {
    activityTypeTitle: 'ACTIVITY TYPE',
    // Selettore indoor/outdoor (solo per gli sport in INDOOR_VARIANTS):
    // facoltativo come RPE/umore, tocca di nuovo per azzerare.
    indoorQuestion: 'Where? Optional — changes the activity name',
    dateTimeTitle: 'DATE AND TIME',
    dateLabel: 'Date',
    timeLabel: 'Time',
    durationTitle: 'DURATION',
    hoursLabel: 'Hours',
    minutesLabel: 'Minutes',
    detailsTitle: 'DETAILS',
    distanceLabel: 'Distance (km)',
    // Dislivello manuale: per chi non traccia con il GPS ma vuole comunque
    // segnare i metri di salita (trekking, arrampicata...).
    elevationLabel: 'Elevation gain (m)',
    elevationPlaceholder: 'e.g. 450',
    elevationHint: 'Optional — meters climbed, if you didn\'t track with GPS',
    perceived: {
      rpeTitle: 'PERCEIVED EFFORT',
      rpeHint: 'Optional — how tough was this session?',
      rpeUnset: 'Not rated yet',
      rpeAriaLabel: (value: number) => `Perceived effort: ${value} out of 10`,
      clear: 'Clear',
      moodTitle: 'MOOD AND ENERGY',
      moodHint: 'Optional — how do you feel after the workout?',
    },
    gym: {
      title: 'EXERCISES',
      hint: 'Optional — log exercises, sets and loads to track progress and personal records.',
      exerciseLabel: 'Exercise',
      exercisePlaceholder: 'e.g. Bench press',
      setsLabel: 'Sets',
      repsLabel: 'Reps',
      weightLabel: 'Weight (kg)',
      weightPlaceholder: 'bodyweight',
      addExercise: 'Add exercise',
      removeAria: (name: string) => name ? `Remove ${name}` : 'Remove exercise',
      incompleteRow: 'Fill in sets and reps, or this row won\'t be saved',
      summary: (count: number, volumeKg: number) => {
        const base = count === 1 ? '1 exercise' : `${count} exercises`
        return volumeKg > 0
          ? `${base} · total volume ${volumeKg.toLocaleString('en-US')} kg`
          : base
      },
      linkToPrevious: 'Link to block above',
      unlinkAria: 'Unlink from group',
      supersetBadge: 'Superset',
      dropsetBadge: 'Drop set',
      plateCalcAria: 'Plate calculator for this weight',
      restTimerAria: 'Start rest timer',
    },
    validation: {
      hoursNotNegative: 'Cannot be negative',
      hoursMax: 'Maximum 12 hours',
      minutesNotNegative: 'Cannot be negative',
      minutesMax: 'Maximum 59 minutes',
      minutesDurationZero: 'Enter a duration greater than zero',
      caloriesNotNegative: 'Cannot be negative',
      distanceNotNegative: 'Cannot be negative',
      unrealisticValue: 'Unrealistic value',
    },
  },

  // Log lampo (roadmap v3, pilastro 02): il chip sotto la griglia degli sport
  // ricopia durata e distanza dell'ultima sessione dello sport selezionato.
  quick: {
    chip: (durationMin: number, distanceKm: number | null) =>
      `Same as last time: ${durationMin} min${distanceKm ? ` · ${distanceKm.toLocaleString('en-US')} km` : ''}`,
    chipAria: 'Prefill duration and distance from the last workout of this sport',
  },

  new: {
    durationTotalPrefix: 'Total:',
    caloriesLabel: 'Calories burned',
    caloriesAutoHint: (kcal: number) => `(auto: ~${kcal} kcal)`,
    caloriesPlaceholderAuto: (kcal: number) => `~${kcal} (auto-calculated)`,
    caloriesPlaceholderManual: 'e.g. 350',
    calorieInfoToggle: 'How is it calculated?',
    calorieInfoAriaLabel: 'How calories are calculated',
    calorieInfo: {
      heading: 'Estimate based on MET',
      intro: 'The calculation uses the standard metabolic equivalent (MET) formula:',
      formula: 'kcal = MET × weight (kg) × duration (hours)',
      metLabel: 'MET',
      metDesc: 'activity intensity (e.g. running = 9.8, yoga = 2.5, swimming = 8.0)',
      weightLabel: 'Weight',
      weightDesc: (weightKg: number | null | undefined) => weightKg
        ? `taken from your profile (${weightKg} kg)`
        : 'taken from your profile — set it in Settings to enable auto-calculation',
      durationLabel: 'Duration',
      durationDesc: 'hours entered in the DURATION section',
      genderLabel: 'Sex',
      genderDesc: (gender: 'male' | 'female' | null | undefined) => gender === 'female'
        ? 'female (−10% kcal for body composition)'
        : gender === 'male'
        ? 'male'
        : 'not set — add it in Settings for a more accurate estimate',
      estimateBefore: 'It\'s an ',
      estimateEmphasis: 'estimate',
      estimateAfter: ': the real value depends on actual intensity, heart rate and your fitness level. You can always override it manually.',
    },
    distancePlaceholder: 'e.g. 5.4',
    notesLabel: 'Notes (optional)',
    notesPlaceholder: 'How did you feel? Workout details...',
    photoLabel: 'Photo (optional)',
    photoHint: 'Will be visible to your friends in the feed.',
    saving: 'Saving...',
    save: 'Save activity',
    savedToast: {
      title: 'Activity saved!',
      credits: (n: number) => `+${n} 💎 credits earned`,
      noCredits: 'Keep it up 💪',
      pr: (exercise: string, weightKg: number) =>
        `🏆 New record: ${exercise} ${weightKg.toLocaleString('en-US')} kg`,
      prExtra: (n: number) => n === 1 ? ' and one more record' : ` and ${n} more records`,
    },
    // Salvataggio senza rete (roadmap v2, pilastro 05): l'attività resta in
    // coda sul dispositivo e si sincronizza da sola al ritorno online, senza
    // che l'utente debba fare nulla. Da v3 pilastro 04 anche foto ed esercizi
    // restano in coda (IndexedDB) invece di essere scartati.
    savedOfflineToast: {
      title: 'Activity saved, waiting for network',
      body: 'It will sync automatically once you\'re back online',
      bodyExtrasQueued: 'It will sync automatically once you\'re back online, photo and exercises included.',
    },
    errorToast: {
      title: 'Save failed',
      body: 'Check your connection and try again',
    },
    photoWarningToast: {
      title: 'Activity saved, but photo not uploaded',
      body: 'Try again from the calendar by editing the activity',
    },
    setsWarningToast: {
      title: 'Activity saved, but exercises not saved',
      body: 'Try again from the calendar by editing the activity',
    },
  },

  edit: {
    ariaLabel: 'Edit activity',
    caloriesLabel: 'Calories',
    caloriesPlaceholder: 'auto',
    notesLabel: 'Notes',
    photoLabel: 'Photo',
    saveChanges: 'Save changes',
    photoUploadFailed: 'Photo upload failed. Check your connection and try again.',
    updateFailed: 'Update failed. Check your connection and try again.',
    setsUpdateFailed: 'Activity updated, but exercises not saved. Check your connection and save again.',
    deleteFailed: 'Delete failed. Check your connection and try again.',
    // Attività ancora in coda offline (roadmap v3, pilastro 04): foto ed
    // esercizi vanno allegati al momento del log, non da qui — qui non c'è
    // ancora un id reale a cui agganciarli.
    pendingExtrasHint: 'Photo and exercises cannot be edited while the activity is waiting for network.',
  },

  intervals: {
    toggleLabel: 'Interval workout',
    toggleHint: 'Optional — build a repeat session before you start',
    repeatsLabel: 'Repeats',
    workHeading: 'Work',
    workDistanceLabel: 'Distance (m)',
    zoneLabel: 'Target zone',
    recoveryHeading: 'Recovery',
    recoverySecLabel: 'Duration (s)',
    summary: (repeats: number, workM: number, recoverySec: number) => `${repeats} × ${workM} m, ${recoverySec}s recovery`,
    invalidHint: 'Check the values: repeats 2-20, distance 100-10,000 m, recovery 15-600 s.',
    stepWork: (rep: number, total: number) => `Repeat ${rep}/${total}`,
    stepRecovery: (rep: number, total: number) => `Recovery ${rep}/${total}`,
    stepProgressWork: (doneM: number, targetM: number) => `${doneM}/${targetM} m`,
    stepProgressRecovery: (remainingSec: number) => `${remainingSec}s`,
    offTarget: 'Off target',
    allDone: 'Set complete — keep going freely or finish whenever you want',
  },

  tracking: {
    dialogAriaLabel: 'Workout in progress',
    acquiringTitle: 'Searching for GPS signal…',
    acquiringHint: 'For a faster lock, make sure you\'re outdoors',
    startErrorTitle: 'Couldn\'t start tracking',
    savingTitle: 'Saving workout…',
    retry: 'Retry',
    discard: 'Discard',
    pausedBadge: 'Paused',
    // Zone Live: il badge con la zona di intensità della velocità recente
    // (l'etichetta — Recupero, Moderata... — è un dato di dominio di lib/zones).
    zoneLive: (label: string) => `${label} Zone`,
    weakSignal: 'Weak GPS signal',
    // Split live (roadmap v3, pilastro 02): i chip con il tempo degli ultimi
    // km completati durante il tracciamento. Per la bici si mostra la
    // velocità del km, per gli altri sport il passo.
    splitChipPace: (km: number, pace: string) => `Km ${km} · ${pace}`,
    splitChipSpeed: (km: number, kmh: string) => `Km ${km} · ${kmh} km/h`,
    splitsAria: 'Time of the last completed kilometers',
    kmUnit: 'km',
    avgSpeedLabel: 'average speed',
    avgPaceLabel: 'average pace',
    kcalEstimateLabel: 'estimated kcal',
    slideToUnlock: 'Slide to unlock →',
    slideAriaLabel: 'Slide to unlock workout controls',
    pause: 'Pause',
    resume: 'Resume',
    finish: 'Finish',
    saveAndFinish: 'Save and finish',
    saveFailed: 'Save failed. Check your connection and try again.',
    hookErrors: {
      permissionDenied: 'GPS permission denied. Enable location in your browser settings to track the route.',
      signalUnavailable: 'GPS signal unavailable. Try again in a more open area.',
      notSupported: 'GPS is not supported on this device/browser.',
      timeout: 'GPS signal not found. Make sure you\'re outdoors and try again.',
    },
  },

  photoPicker: {
    previewAlt: 'Preview of the attached photo',
    removeAria: 'Remove photo',
    addPhoto: 'Add a photo',
  },

  routeShapeAriaLabel: 'Shape of the recorded route',

  // Percorso nel feed (v45): il consenso si rivede anche in modifica.
  routeShare: {
    label: 'Show the route to friends in the feed',
    hint: 'Only the route shape, never the map.',
  },

  map: {
    ariaLabel: 'Map of the recorded route',
  },

  // Split per km sotto la sagoma del percorso (ActivityEditModal): compaiono
  // solo se il percorso ha almeno un km completo. L'ultimo tratto sotto il km
  // mostra la sua distanza reale al posto del numero progressivo.
  splits: {
    title: 'Pace per km',
    kmLabel: (n: number) => `Km ${n}`,
    partialLabel: (km: string) => `${km} km`,
  },

  // Profilo altimetrico (v42): compare solo se il percorso ha la quota salvata
  // (allenamenti tracciati dopo la migrazione, su dispositivi che la forniscono).
  elevation: {
    title: 'Elevation',
    chartAriaLabel: 'Elevation profile of the route',
    gain: (m: number) => `D+ ${m} m`,
    loss: (m: number) => `D− ${m} m`,
    range: (min: number, max: number) => `${min}–${max} m`,
  },

  plateCalculator: {
    title: 'PLATE CALCULATOR',
    close: 'Close',
    dialogAriaLabel: 'Plate calculator',
    targetLabel: 'Total weight (kg)',
    barLabel: 'Barbell (kg)',
    perSideLabel: 'Per side',
    noPlates: 'Bar only, no plates',
    achievedLabel: 'Load achieved',
    remainderHint: (kg: number) => `Not exactly reachable with these plates: ${kg} kg short`,
  },

  restTimer: {
    label: 'Rest',
    adjustLessAria: 'Remove 15 seconds',
    adjustMoreAria: 'Add 15 seconds',
    dismissAria: 'Close the rest timer',
  },

  gpxExport: {
    button: 'Export GPX',
  },

  gpxImport: {
    entryButton: 'Import a GPX route',
    title: 'IMPORT FROM GPX',
    close: 'Close',
    dialogAriaLabel: 'Import a route from a GPX file',
    hint: 'Pick a .gpx file exported from another tool (Strava, Garmin Connect, Komoot...): we\'ll rebuild the activity from the recorded route.',
    pickFile: 'Choose a GPX file',
    changeFile: 'Change file',
    parseFailed: 'That\'s not a valid GPX file, or it doesn\'t have enough timestamped points.',
    typeLabel: 'Activity type',
    previewDate: 'Date',
    previewDuration: 'Duration',
    previewDistance: 'Distance',
    previewElevation: 'Elevation gain',
    importing: 'Importing...',
    submit: 'Import activity',
    failed: 'Couldn\'t import the activity. Check your connection and try again.',
    doneToast: 'Activity imported from the GPX file',
  },

  errors: {
    loadFailed: 'Error loading activities. Try again.',
    // Un'attività in coda offline che al momento della sincronizzazione viene
    // rifiutata dal server per un motivo NON di rete (validazione, RLS): non
    // ha senso tenerla in coda per sempre, si avvisa e si scarta.
    syncFailed: 'An activity waiting for network was rejected by the server and has been discarded.',
    // Foto/esercizi accodati offline (IndexedDB): l'attività si è comunque
    // sincronizzata, solo l'allegato non è stato applicato — si riprova dalla
    // modifica, come per l'equivalente fallimento online.
    offlineAttachmentsFailed: 'Activity synced, but pending photo or exercises weren\'t saved. Try again by editing it from the Calendar.',
  },
}

const log = createNamespaceProxy(it, en)

export default log
