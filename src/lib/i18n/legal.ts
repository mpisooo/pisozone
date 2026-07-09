// Namespace per le pagine legali pubbliche (Privacy.tsx, Terms.tsx) e per il
// loro wrapper condiviso LegalLayout.tsx. Ogni paragrafo/voce di lista del
// testo legale ha una propria chiave (organizzate per rispecchiare le sezioni
// numerate dei due documenti), così una futura traduzione potrà intervenire
// frase per frase senza dover ritoccare la struttura JSX. Dove una frase
// contiene un link o un grassetto in mezzo, il testo è spezzato in
// before/middle/after e l'elemento JSX resta nel componente.
const legal = {
  layout: {
    backLink: 'Torna a PisoZone',
    updatedPrefix: 'Ultimo aggiornamento:',
  },

  privacy: {
    title: 'PRIVACY POLICY',
    updated: '7 luglio 2026',

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
      outro: 'Non raccogliamo dati di localizzazione, non usiamo tracciamento pubblicitario e non vendiamo dati a terzi.',
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
      text: 'Alcuni dati sono visibili agli altri utenti solo nell\'ambito delle funzioni social: il tuo username, la foto profilo, il livello e la cornice sono visibili a chi ti cerca; le tue attività (incluse le foto che vi alleghi), i traguardi e i relativi commenti compaiono nel feed dei tuoi amici; i messaggi sono visibili solo a chi li riceve. Se compari nella classifica globale settimanale, gli altri utenti vedono username, foto e i tuoi totali aggregati della settimana (sessioni, minuti, calorie) — mai le singole attività. Peso, data di nascita, genere, altezza e storico pesate non sono mai visibili ad altri utenti. Puoi bloccare un utente in qualsiasi momento dal suo profilo: non potrà più scriverti, inviarti richieste né vedere le tue attività.',
    },

    retention: {
      heading: '6. PER QUANTO TEMPO',
      text: 'Conserviamo i dati finché il tuo account è attivo. Se elimini l\'account, tutti i tuoi dati — profilo, attività, messaggi, foto, amicizie e ogni altro contenuto — vengono cancellati immediatamente e in modo definitivo. Non esistono copie di backup accessibili una volta completata l\'eliminazione.',
    },

    rights: {
      heading: '7. I TUOI DIRITTI',
      intro: 'In qualsiasi momento, direttamente dalla pagina Profilo → sezione "Privacy e dati", puoi:',
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
      text: 'Il servizio è fornito gratuitamente "così com\'è", senza garanzie di disponibilità continua, assenza di errori o conservazione perpetua dei dati. Ti consigliamo di esportare periodicamente i tuoi dati dalla pagina Profilo. Nei limiti consentiti dalla legge, il titolare non risponde di danni derivanti dall\'uso dell\'app o dall\'indisponibilità del servizio.',
    },

    accountClosure: {
      heading: '7. CHIUSURA DELL\'ACCOUNT',
      text: 'Puoi eliminare il tuo account in autonomia in qualsiasi momento dalla pagina Profilo → "Privacy e dati": la cancellazione è immediata e irreversibile. Il titolare si riserva di sospendere o chiudere account che violino questi termini, previa comunicazione ove possibile.',
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

export default legal
