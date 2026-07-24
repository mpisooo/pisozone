import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per le pagine legali pubbliche (Privacy.tsx, Terms.tsx) e per il
// loro wrapper condiviso LegalLayout.tsx. Ogni paragrafo/voce di lista del
// testo legale ha una propria chiave (organizzate per rispecchiare le sezioni
// numerate dei due documenti), così una futura traduzione potrà intervenire
// frase per frase senza dover ritoccare la struttura JSX. Dove una frase
// contiene un link o un grassetto in mezzo, il testo è spezzato in
// before/middle/after e l'elemento JSX resta nel componente.
const it = {
  layout: {
    backLink: 'Torna a PisoZone',
    updatedPrefix: 'Ultimo aggiornamento:',
  },

  privacy: {
    title: 'PRIVACY POLICY',
    updated: '24 luglio 2026',

    controller: {
      heading: '1. TITOLARE DEL TRATTAMENTO',
      before: 'Il titolare del trattamento dei dati è Mattia Pisati, sviluppatore e gestore di PisoZone. Per qualsiasi richiesta relativa ai tuoi dati puoi scrivere a',
      after: '.',
    },

    dataCollected: {
      heading: '2. QUALI DATI RACCOGLIAMO',
      intro: 'PisoZone raccoglie soltanto i dati che inserisci tu per usare l\'app:',
      account: {
        label: 'Account',
        text: ' — username e password (conservata in forma cifrata); email di recupero, solo se decidi di aggiungerla.',
      },
      profile: {
        label: 'Profilo',
        text: ' — nome, data di nascita, genere, altezza, peso e storico delle pesate, foto profilo, obiettivi e sport preferiti. Sono tutti campi facoltativi.',
      },
      activities: {
        label: 'Attività sportive',
        text: ' — tipo di sport, data, durata, calorie, distanza ed eventuali note e foto che decidi di allegare.',
      },
      gps: {
        label: 'Percorsi GPS',
        text: ' — se tracci un allenamento con il GPS (corsa, bici, camminata, trekking), il tracciato punto per punto (posizione e, se disponibile, quota) associato a quell\'attività.',
      },
      social: {
        label: 'Funzioni social',
        text: ' — amicizie, richieste di amicizia, messaggi privati e di gruppo, "mi piace" alle attività degli amici.',
      },
      gamification: {
        label: 'Gamification',
        text: ' — crediti, livello, medaglie, sfide completate, streak.',
      },
      push: {
        label: 'Notifiche push',
        text: ' — se le attivi, l\'identificativo tecnico (endpoint) fornito dal tuo browser per recapitarle.',
      },
      technical: {
        label: 'Dati tecnici',
        text: ' — in caso di errori dell\'app, informazioni diagnostiche (tipo di errore, pagina, browser) tramite il servizio Sentry, associate al tuo id utente e username ma a nessun altro dato personale.',
      },
      outro: 'Non usiamo tracciamento pubblicitario e non vendiamo dati a terzi. I dati di localizzazione (percorsi GPS) restano privati per te di default: li vedi solo tu, a meno che tu non scelga di condividere il percorso di una specifica attività con i tuoi amici (vedi sezione 5).',
    },

    purpose: {
      heading: '3. PERCHÉ LI TRATTIAMO',
      text: 'I dati servono esclusivamente a far funzionare PisoZone: calcolare statistiche e calorie, mostrare i tuoi progressi, gestire le funzioni social e le notifiche che hai richiesto (base giuridica: esecuzione del servizio, art. 6.1.b GDPR). Il monitoraggio degli errori si basa sul legittimo interesse a mantenere l\'app funzionante e sicura (art. 6.1.f GDPR).',
    },

    storage: {
      heading: '4. DOVE SONO CONSERVATI',
      intro: 'PisoZone si appoggia a tre fornitori tecnici, che agiscono da responsabili del trattamento:',
      privacyPolicyLinkText: 'privacy policy',
      supabase: {
        label: 'Supabase',
        before: ' — database e archiviazione delle foto (profilo e attività) (',
        after: ')',
      },
      vercel: {
        label: 'Vercel',
        before: ' — hosting dell\'applicazione (',
        after: ')',
      },
      sentry: {
        label: 'Sentry',
        before: ' — monitoraggio errori, con dati ospitati nell\'Unione Europea (',
        after: ')',
      },
      outro: 'Nessun altro soggetto ha accesso ai tuoi dati.',
    },

    whoSeesWhat: {
      heading: '5. CHI VEDE COSA',
      text: 'Alcuni dati sono visibili agli altri utenti solo nell\'ambito delle funzioni social: il tuo username, la foto profilo, il livello e la cornice sono visibili a chi ti cerca; le tue attività (incluse le foto che vi alleghi), i traguardi e i relativi commenti compaiono nel feed dei tuoi amici; i messaggi sono visibili solo a chi li riceve. Se compari nella classifica globale settimanale, gli altri utenti vedono username, foto e i tuoi totali aggregati della settimana (sessioni, minuti, calorie) — mai le singole attività. I percorsi GPS restano visibili solo a te di default: puoi scegliere, attività per attività, di mostrarne la forma agli amici nel feed (mai la mappa reale né le coordinate esatte); la tua mappa di calore personale non è mai condivisa. Se crei una sfida di percorso, le coordinate di inizio e fine del segmento scelto vengono condivise solo con l\'amico che sfidi, perché possa percorrerlo. Peso, data di nascita, genere, altezza e storico pesate non sono mai visibili ad altri utenti. Puoi bloccare un utente in qualsiasi momento dal suo profilo: non potrà più scriverti, inviarti richieste né vedere le tue attività.',
    },

    retention: {
      heading: '6. PER QUANTO TEMPO',
      text: 'Conserviamo i dati finché il tuo account è attivo. Se elimini l\'account, tutti i tuoi dati — profilo, attività, messaggi, foto, amicizie e ogni altro contenuto — vengono cancellati immediatamente e in modo definitivo. Non esistono copie di backup accessibili una volta completata l\'eliminazione.',
    },

    rights: {
      heading: '7. I TUOI DIRITTI',
      intro: 'In qualsiasi momento, direttamente dalla pagina Impostazioni → sezione "Privacy e dati", puoi:',
      export: {
        label: 'Esportare',
        text: ' una copia completa di tutti i tuoi dati in formato JSON (diritto alla portabilità, art. 20 GDPR).',
      },
      delete: {
        label: 'Eliminare',
        text: ' definitivamente l\'account e tutti i dati (diritto alla cancellazione, art. 17 GDPR).',
      },
      rectify: {
        label: 'Rettificare',
        text: ' i dati del profilo, modificandoli direttamente.',
      },
      exerciseBefore: 'Hai inoltre diritto di accesso, limitazione e opposizione al trattamento (artt. 15–21 GDPR): per esercitarli scrivi a',
      exerciseMiddle: '. Se ritieni che il trattamento violi la normativa, puoi presentare reclamo al Garante per la Protezione dei Dati Personali (',
      exerciseAfter: ').',
    },

    cookies: {
      heading: '8. COOKIE E ARCHIVIAZIONE LOCALE',
      text: 'PisoZone non usa cookie di profilazione né strumenti di analytics. Il browser conserva localmente solo dati tecnici indispensabili: la sessione di accesso, il tema grafico scelto e la cache dell\'app per il funzionamento offline (PWA).',
    },

    minors: {
      heading: '9. MINORI',
      text: 'PisoZone non è destinata a minori di 14 anni. Se hai meno di 14 anni non creare un account; se un genitore o tutore ritiene che un minore ci abbia fornito dati personali, può contattarci per la rimozione immediata.',
    },

    changes: {
      heading: '10. MODIFICHE',
      text: 'Se questa informativa cambia in modo sostanziale, la data di aggiornamento in cima alla pagina verrà aggiornata e le modifiche rilevanti saranno segnalate nell\'app.',
    },
  },

  terms: {
    title: 'TERMINI DI SERVIZIO',
    updated: '7 luglio 2026',

    service: {
      heading: '1. IL SERVIZIO',
      before: 'PisoZone è un\'app gratuita per il tracciamento personale dell\'attività fisica, con funzioni social tra amici e meccaniche di gioco (crediti, livelli, medaglie, sfide). Creando un account accetti questi termini e la',
      privacyPolicyLinkText: 'Privacy Policy',
      after: '.',
    },

    account: {
      heading: '2. ACCOUNT',
      text: 'Sei responsabile della custodia delle tue credenziali e di ciò che avviene tramite il tuo account. L\'email di recupero è facoltativa, ma senza di essa non è possibile reimpostare la password: in caso di smarrimento l\'account non sarà recuperabile.',
    },

    content: {
      heading: '3. USO CORRETTO E CONTENUTI',
      text: 'Nei contenuti che pubblichi (messaggi, foto profilo, note delle attività, nomi dei gruppi) non sono ammessi materiali illeciti, offensivi, discriminatori o che violino diritti di terzi. Non è consentito usare l\'app per spam, molestie o tentativi di accesso a dati di altri utenti. In caso di violazioni l\'account può essere sospeso o eliminato.',
    },

    virtualItems: {
      heading: '4. CREDITI E OGGETTI VIRTUALI',
      text: 'Crediti, livelli, medaglie, temi e cornici sono elementi di gioco puramente virtuali: non hanno valore monetario, non sono acquistabili con denaro reale, non sono trasferibili né rimborsabili, e possono essere modificati o azzerati per esigenze di bilanciamento del gioco.',
    },

    notMedical: {
      heading: '5. NON È UN SERVIZIO MEDICO',
      text: 'PisoZone fornisce stime indicative (ad esempio le calorie, calcolate su valori MET medi, o il BMI) che non costituiscono in alcun modo consulenza medica, diagnostica o nutrizionale. Prima di iniziare o modificare un programma di allenamento consulta un medico, specialmente in presenza di condizioni di salute preesistenti.',
    },

    liability: {
      heading: '6. LIMITAZIONE DI RESPONSABILITÀ',
      text: 'Il servizio è fornito gratuitamente "così com\'è", senza garanzie di disponibilità continua, assenza di errori o conservazione perpetua dei dati. Ti consigliamo di esportare periodicamente i tuoi dati dalla pagina Impostazioni. Nei limiti consentiti dalla legge, il titolare non risponde di danni derivanti dall\'uso dell\'app o dall\'indisponibilità del servizio.',
    },

    accountClosure: {
      heading: '7. CHIUSURA DELL\'ACCOUNT',
      text: 'Puoi eliminare il tuo account in autonomia in qualsiasi momento dalla pagina Impostazioni → "Privacy e dati": la cancellazione è immediata e irreversibile. Il titolare si riserva di sospendere o chiudere account che violino questi termini, previa comunicazione ove possibile.',
    },

    termsChanges: {
      heading: '8. MODIFICHE AI TERMINI',
      text: 'Questi termini possono essere aggiornati; le modifiche sostanziali saranno segnalate nell\'app. L\'uso continuato del servizio dopo una modifica ne costituisce accettazione.',
    },

    lawAndContacts: {
      heading: '9. LEGGE APPLICABILE E CONTATTI',
      before: 'Questi termini sono regolati dalla legge italiana. Per qualsiasi domanda scrivi a',
      after: '.',
    },
  },
} as const

const en: Widen<typeof it> = {
  layout: {
    backLink: 'Back to PisoZone',
    updatedPrefix: 'Last updated:',
  },

  privacy: {
    title: 'PRIVACY POLICY',
    updated: 'July 24, 2026',

    controller: {
      heading: '1. DATA CONTROLLER',
      before: 'The data controller is Mattia Pisati, developer and operator of PisoZone. For any request regarding your data, you can write to',
      after: '.',
    },

    dataCollected: {
      heading: '2. WHAT DATA WE COLLECT',
      intro: 'PisoZone only collects the data you enter to use the app:',
      account: {
        label: 'Account',
        text: ' — username and password (stored encrypted); recovery email, only if you choose to add one.',
      },
      profile: {
        label: 'Profile',
        text: ' — name, date of birth, gender, height, weight and weigh-in history, profile photo, goals and favorite sports. All of these fields are optional.',
      },
      activities: {
        label: 'Sports activities',
        text: ' — sport type, date, duration, calories, distance, and any notes and photos you choose to attach.',
      },
      gps: {
        label: 'GPS routes',
        text: ' — if you track a workout with GPS (running, cycling, walking, hiking), the point-by-point route (location and, if available, elevation) linked to that activity.',
      },
      social: {
        label: 'Social features',
        text: ' — friendships, friend requests, private and group messages, "likes" on friends\' activities.',
      },
      gamification: {
        label: 'Gamification',
        text: ' — credits, level, medals, completed challenges, streak.',
      },
      push: {
        label: 'Push notifications',
        text: ' — if you enable them, the technical identifier (endpoint) provided by your browser to deliver them.',
      },
      technical: {
        label: 'Technical data',
        text: ' — in the event of app errors, diagnostic information (error type, page, browser) via the Sentry service, linked to your user id and username but to no other personal data.',
      },
      outro: 'We do not use advertising tracking and we do not sell data to third parties. Location data (GPS routes) stays private to you by default: only you can see it, unless you choose to share a specific activity\'s route with your friends (see section 5).',
    },

    purpose: {
      heading: '3. WHY WE PROCESS IT',
      text: 'The data is used exclusively to make PisoZone work: calculating statistics and calories, showing your progress, managing the social features and the notifications you requested (legal basis: performance of the service, art. 6.1.b GDPR). Error monitoring is based on the legitimate interest of keeping the app working and secure (art. 6.1.f GDPR).',
    },

    storage: {
      heading: '4. WHERE IT IS STORED',
      intro: 'PisoZone relies on three technical providers, who act as data processors:',
      privacyPolicyLinkText: 'privacy policy',
      supabase: {
        label: 'Supabase',
        before: ' — database and photo storage (profile and activities) (',
        after: ')',
      },
      vercel: {
        label: 'Vercel',
        before: ' — application hosting (',
        after: ')',
      },
      sentry: {
        label: 'Sentry',
        before: ' — error monitoring, with data hosted in the European Union (',
        after: ')',
      },
      outro: 'No other party has access to your data.',
    },

    whoSeesWhat: {
      heading: '5. WHO SEES WHAT',
      text: 'Some data is visible to other users only within the social features: your username, profile photo, level and frame are visible to anyone who looks you up; your activities (including any photos you attach to them), milestones and their comments appear in your friends\' feed; messages are visible only to their recipient. If you appear on the global weekly leaderboard, other users see your username, photo and your aggregated totals for the week (sessions, minutes, calories) — never individual activities. GPS routes stay visible only to you by default: you can choose, activity by activity, to show their shape to friends in the feed (never the real map or exact coordinates); your personal heatmap is never shared. If you create a route challenge (segment duel), the start and end coordinates of the chosen segment are shared only with the friend you challenge, so they can run it too. Weight, date of birth, gender, height and weigh-in history are never visible to other users. You can block a user at any time from their profile: they will no longer be able to message you, send you requests, or see your activities.',
    },

    retention: {
      heading: '6. HOW LONG WE KEEP IT',
      text: 'We keep your data for as long as your account is active. If you delete your account, all your data — profile, activities, messages, photos, friendships and any other content — is deleted immediately and permanently. No accessible backup copies exist once deletion is complete.',
    },

    rights: {
      heading: '7. YOUR RIGHTS',
      intro: 'At any time, directly from the Settings page → "Privacy and data" section, you can:',
      export: {
        label: 'Export',
        text: ' a complete copy of all your data in JSON format (right to data portability, art. 20 GDPR).',
      },
      delete: {
        label: 'Delete',
        text: ' your account and all your data permanently (right to erasure, art. 17 GDPR).',
      },
      rectify: {
        label: 'Correct',
        text: ' your profile data by editing it directly.',
      },
      exerciseBefore: 'You also have the right to access, restrict and object to the processing (arts. 15–21 GDPR): to exercise these rights, write to',
      exerciseMiddle: '. If you believe the processing violates the law, you can file a complaint with the Italian data protection authority, the Garante per la Protezione dei Dati Personali (',
      exerciseAfter: ').',
    },

    cookies: {
      heading: '8. COOKIES AND LOCAL STORAGE',
      text: 'PisoZone does not use profiling cookies or analytics tools. Your browser stores locally only the technical data strictly necessary: your login session, your chosen color theme, and the app cache for offline functionality (PWA).',
    },

    minors: {
      heading: '9. MINORS',
      text: 'PisoZone is not intended for children under 14. If you are under 14, please do not create an account; if a parent or guardian believes a minor has provided us with personal data, they can contact us for its immediate removal.',
    },

    changes: {
      heading: '10. CHANGES',
      text: 'If this policy changes substantially, the update date at the top of the page will be revised and significant changes will be announced in the app.',
    },
  },

  terms: {
    title: 'TERMS OF SERVICE',
    updated: 'July 7, 2026',

    service: {
      heading: '1. THE SERVICE',
      before: 'PisoZone is a free app for personal fitness tracking, with social features among friends and game mechanics (credits, levels, medals, challenges). By creating an account you accept these terms and the',
      privacyPolicyLinkText: 'Privacy Policy',
      after: '.',
    },

    account: {
      heading: '2. ACCOUNT',
      text: 'You are responsible for safeguarding your credentials and for everything that happens through your account. The recovery email is optional, but without it you cannot reset your password: if you lose access, the account cannot be recovered.',
    },

    content: {
      heading: '3. PROPER USE AND CONTENT',
      text: 'Content you publish (messages, profile photos, activity notes, group names) must not include unlawful, offensive, discriminatory material, or material that violates the rights of others. You may not use the app for spam, harassment, or attempts to access other users\' data. Violations may result in the account being suspended or deleted.',
    },

    virtualItems: {
      heading: '4. CREDITS AND VIRTUAL ITEMS',
      text: 'Credits, levels, medals, themes and frames are purely virtual game elements: they have no monetary value, cannot be purchased with real money, are not transferable or refundable, and may be changed or reset for game-balancing purposes.',
    },

    notMedical: {
      heading: '5. NOT A MEDICAL SERVICE',
      text: 'PisoZone provides indicative estimates (for example calories, calculated from average MET values, or BMI) that in no way constitute medical, diagnostic or nutritional advice. Before starting or changing a training program, consult a doctor, especially if you have pre-existing health conditions.',
    },

    liability: {
      heading: '6. LIMITATION OF LIABILITY',
      text: 'The service is provided free of charge "as is", with no guarantee of continuous availability, error-free operation, or permanent data retention. We recommend periodically exporting your data from the Settings page. To the extent permitted by law, the controller is not liable for damages arising from use of the app or from unavailability of the service.',
    },

    accountClosure: {
      heading: '7. ACCOUNT CLOSURE',
      text: 'You can delete your account yourself at any time from the Settings page → "Privacy and data": deletion is immediate and irreversible. The controller reserves the right to suspend or close accounts that violate these terms, with prior notice where possible.',
    },

    termsChanges: {
      heading: '8. CHANGES TO THESE TERMS',
      text: 'These terms may be updated; substantial changes will be announced in the app. Continued use of the service after a change constitutes acceptance of it.',
    },

    lawAndContacts: {
      heading: '9. GOVERNING LAW AND CONTACTS',
      before: 'These terms are governed by Italian law. For any questions, write to',
      after: '.',
    },
  },
}

const legal = createNamespaceProxy(it, en)

export default legal
