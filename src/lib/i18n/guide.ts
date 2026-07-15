// Namespace della Guida (pages/Guide.tsx): la "wiki" di tutte le funzionalità
// dell'app, raggiungibile dal Profilo e dall'annuncio Novità. Ogni sezione è
// un accordion; i paragrafi sono frasi brevi, dalla parte dell'utente.
const guide = {
  pageTitle: 'GUIDA',
  intro: 'Tutto quello che PisoZone sa fare, in un posto solo. Tocca una sezione per aprirla.',

  sections: [
    {
      icon: '🏃',
      title: 'Registrare un\'attività',
      paragraphs: [
        'Dalla scheda Registra scegli uno dei 20 sport, imposta data, ora e durata e aggiungi se vuoi distanza, note e una foto (visibile agli amici nel feed).',
        'Per corsa, bici, camminata, nuoto e arrampicata puoi indicare anche il "dove": al chiuso l\'attività prende il suo nome vero — tapis roulant, cyclette, piscina. È facoltativo: tocca di nuovo per azzerare.',
        'Le calorie si calcolano da sole in base a peso, sesso e intensità dello sport (formula MET): puoi sempre scriverle a mano per sovrascriverle.',
        'Ogni attività si modifica o elimina dal Calendario, toccandola.',
        'Su Android, tenendo premuta l\'icona dell\'app trovi le scorciatoie rapide: Registra, GPS, Sfide e Statistiche.',
      ],
    },
    {
      icon: '🛰️',
      title: 'Tracciamento GPS',
      paragraphs: [
        'Per corsa, bici, camminata e trekking puoi avviare il tracciamento GPS dal pulsante nella scheda Registra: distanza, ritmo e calorie si misurano da soli, e il percorso viene salvato.',
        'Il tracciamento funziona a schermo acceso: l\'app tiene lo schermo attivo per te. I comandi sono protetti da uno "scorri per sbloccare", così i tocchi accidentali in tasca non fermano nulla.',
        'La sagoma del percorso la ritrovi aprendo l\'attività dal Calendario.',
      ],
    },
    {
      icon: '🏋️',
      title: 'Palestra: esercizi e record',
      paragraphs: [
        'Quando registri una sessione di palestra puoi segnare gli esercizi con serie × ripetizioni × carico (lascia il peso vuoto per il corpo libero).',
        'I nomi degli esercizi ti vengono suggeriti da quelli già usati: scrivere sempre lo stesso nome rende affidabili i record.',
        'Se superi il tuo carico massimo su un esercizio, l\'app te lo annuncia al salvataggio. Tutti i massimali sono nella card "Record palestra" in Statistiche.',
      ],
    },
    {
      icon: '💪',
      title: 'Sforzo percepito e umore',
      paragraphs: [
        'Su ogni attività puoi indicare quanto ti è costata (scala 1–10) e come ti senti dopo (5 stati). Sono facoltativi: se non li compili, restano vuoti.',
        'Servono a conoscerti meglio: la stessa corsa può essere una passeggiata o una battaglia, e contano entrambe le cose.',
      ],
    },
    {
      icon: '🎯',
      title: 'Programmi di allenamento',
      paragraphs: [
        'Dalla Home (sezione "Il tuo percorso") trovi i programmi a più settimane: 5K, 10K, palestra, ritorno al movimento, yoga.',
        'Non c\'è niente da spuntare: registri le attività come sempre e le sessioni del piano si saldano da sole. Ogni sessione si sblocca nella sua settimana — niente anticipi — ma le arretrate si possono recuperare.',
        'Al traguardo riscatti una ricompensa in crediti. Puoi avere un programma attivo alla volta e abbandonarlo quando vuoi, senza penalità.',
      ],
    },
    {
      icon: '🎯',
      title: 'Obiettivi personali',
      paragraphs: [
        'Oltre all\'obiettivo settimanale, in Home puoi fissare mete libere: "100 km di corsa questo mese", "20 sessioni di palestra", "5.000 calorie questa settimana"…',
        'Scegli cosa contare (sessioni, minuti, chilometri o calorie), un eventuale sport, il traguardo e la scadenza: la barra avanza da sola con le attività che registri.',
        'Puoi avere fino a 5 obiettivi attivi; si eliminano con due tocchi sul cestino.',
      ],
    },
    {
      icon: '🛌',
      title: 'Recupero: riposo, acqua e sonno',
      paragraphs: [
        'Nella card "Recupero di oggi" in Home puoi dichiarare un giorno di riposo: lo streak non si spezza. Ne hai 2 a settimana e vale solo per il giorno stesso.',
        'Sempre lì tieni il conto dell\'acqua (bicchieri da 250 ml verso l\'obiettivo di 2 litri) e delle ore dormite.',
        'Nei giorni di riposo il promemoria serale non ti disturba.',
      ],
    },
    {
      icon: '🔥',
      title: 'Streak e freeze',
      paragraphs: [
        'Lo streak conta i giorni consecutivi con almeno un\'attività (o un giorno di riposo dichiarato).',
        'Hai saltato ieri e lo streak sta per spezzarsi? In Home compare l\'offerta di congelarlo con 300 crediti: il freeze copre il giorno mancato.',
      ],
    },
    {
      icon: '⚡',
      title: 'Sfide giornaliere',
      paragraphs: [
        'Ogni giorno ricevi 3 sfide personalizzate (nella pagina Sfide e in Home). Si completano allenandosi e scadono a mezzanotte.',
        'Quando una sfida risulta completata, riscattala per incassare i crediti. Un numerino sulla voce Sfide in basso ti ricorda quante ne hai da riscattare.',
        'In fondo alla pagina Sfide ci sono le sfide con gli amici: lancia un duello a tempo — sessioni, minuti, chilometri o calorie — a un amico (che deve accettare) o a un tuo gruppo (parte subito per tutti). A finestra chiusa, chi ha fatto di più riscatta 100 crediti; in caso di parità nessun vincitore.',
        'Ancora più in fondo trovi l\'evento stagionale del momento: una classifica a tempo aperta a TUTTA la community, non solo agli amici. A finestra chiusa il podio (primi 3) riscatta crediti — di più per il primo posto.',
      ],
    },
    {
      icon: '💎',
      title: 'Crediti, livelli e negozio',
      paragraphs: [
        'I crediti si guadagnano registrando attività, completando sfide giornaliere, sbloccando medaglie e chiudendo i programmi di allenamento.',
        'Si spendono nel Profilo: 10 livelli da sbloccare in sequenza, 6 temi colore per tutta l\'app e cornici speciali per l\'avatar. E per i freeze dello streak.',
      ],
    },
    {
      icon: '🏅',
      title: 'Medaglie',
      paragraphs: [
        'Ci sono 18 medaglie in 4 livelli (bronzo, argento, oro, diamante), legate a traguardi reali: chilometri totali, sessioni in palestra, streak, costanza settimanale…',
        'Ogni medaglia sbloccata vale crediti una tantum. Il progresso verso la più vicina lo vedi in Home.',
      ],
    },
    {
      icon: '📊',
      title: 'Statistiche e calendario',
      paragraphs: [
        'Nella sezione Analisi trovi il calendario con la heatmap dei giorni attivi e le statistiche: andamento nel tempo, spettro di intensità per zone, obiettivo vs reale, correlazione peso-allenamento e record personali.',
        'Da lì puoi anche esportare le attività in CSV, pronto per Excel o Google Sheets.',
      ],
    },
    {
      icon: '✨',
      title: 'Wrapped, insight e condivisione',
      paragraphs: [
        'In Statistiche trovi "I tuoi insight": osservazioni che emergono dai tuoi dati — la settimana record, il giorno in cui ti alleni più spesso, il ritmo che cresce. Cambiano da soli man mano che ti alleni.',
        'PisoZone Wrapped è il riassunto del mese appena concluso (e dell\'anno, quando finisce) in stile storia: numeri, sport del periodo, record e spettro di intensità, slide dopo slide. Lo apri da Statistiche.',
        'Ogni attività — e il Wrapped stesso — diventa un\'immagine da condividere: apri un\'attività dal Calendario e tocca l\'icona di condivisione in alto. La card con i tuoi numeri è pronta per la chat o le storie.',
      ],
    },
    {
      icon: '👥',
      title: 'Social: amici, feed e classifica',
      paragraphs: [
        'Cerca i tuoi amici per username e aggiungili: nel feed vedrai le loro attività, con foto, reazioni (❤️ 💪 🔥 👏 🚀) e commenti.',
        'C\'è la chat 1:1, i gruppi e la classifica settimanale — tra amici o globale. Tocca chiunque in classifica per aprire il suo profilo pubblico, con livello, numeri e sport preferiti; nella scheda Amici trovi anche "Persone da scoprire", i più attivi del mese.',
        'La card "In numeri" che gli altri vedono sul tuo profilo la trovi anche nel TUO Profilo, subito sotto la foto: attività, ore, km e medaglie totali.',
        'Puoi bloccare o segnalare chi si comporta male: chi è bloccato non può scriverti né mandarti richieste.',
      ],
    },
    {
      icon: '🔔',
      title: 'Notifiche',
      paragraphs: [
        'Le notifiche push ti avvisano per messaggi, richieste di amicizia e con un promemoria serale se alle 22:00 non hai ancora registrato nulla.',
        'Se ti assenti per qualche giorno il promemoria non ti martella: si fa vivo solo ogni tanto, con un invito a ripartire con poco. Al rientro ti accoglie una card dedicata in Home.',
        'Dal Profilo le attivi, le disattivi per singola categoria e imposti una fascia oraria di silenzio.',
      ],
    },
    {
      icon: '🔒',
      title: 'Privacy e i tuoi dati',
      paragraphs: [
        'I tuoi dati sono tuoi: dal Profilo puoi scaricarli tutti in JSON o eliminare l\'account con tutto ciò che contiene.',
        'Privacy policy e termini di servizio sono sempre consultabili dai link nel Profilo.',
      ],
    },
  ],
} as const

export default guide
