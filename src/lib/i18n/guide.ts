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
        'Senza connessione l\'attività non va persa: resta in attesa sul telefono (lo vedi da un\'etichetta "In attesa di rete") e si sincronizza da sola appena torni online. Foto ed esercizi allegati in quel momento vanno però riaggiunti dopo la sincronizzazione.',
        'Ogni attività si modifica o elimina dal Calendario, toccandola (tranne quelle ancora in attesa di rete, non ancora modificabili).',
        'Hai fretta? Dalla Home, sotto l\'ultima attività, "Ripeti questo allenamento" apre il form già compilato con sport, durata e distanza. E nella scheda Registra, scelto uno sport, il tocco su "Come l\'ultima volta" ricopia durata e distanza della tua ultima sessione di quel tipo.',
        'Su Android, tenendo premuta l\'icona dell\'app trovi le scorciatoie rapide: Registra, GPS, Sfide e Statistiche.',
      ],
    },
    {
      icon: '🛰️',
      title: 'Tracciamento GPS',
      paragraphs: [
        'Per corsa, bici, camminata e trekking puoi avviare il tracciamento GPS dal pulsante nella scheda Registra: distanza, ritmo e calorie si misurano da soli, e il percorso viene salvato.',
        'Il tracciamento funziona a schermo acceso: l\'app tiene lo schermo attivo per te. I comandi sono protetti da uno "scorri per sbloccare", così i tocchi accidentali in tasca non fermano nulla.',
        'Mentre ti muovi la schermata si tinge della tua zona di intensità del momento — blu, verde, ambra o rosso, la stessa scala dello "Spettro di intensità" in Statistiche — con un badge che la nomina: un colpo d\'occhio e sai quanto stai spingendo.',
        'A ogni chilometro completato compare il suo tempo (per la bici, la velocità), con una leggera vibrazione: sai subito se stai accelerando o rallentando, senza aspettare la fine.',
        'Quando termini e salvi, ti accoglie il recap: mappa del percorso, passo per km, altimetria, crediti e gli eventuali record — prima distanza per quello sport, distanza più lunga di sempre, passo (o velocità) più veloce di sempre. Da lì condividi tutto come immagine con un tocco.',
        'Il percorso lo ritrovi aprendo l\'attività dal Calendario, disegnato su una vera mappa (senza connessione resta la sagoma stilizzata), insieme al passo per ogni chilometro: una barra per km mostra dove hai spinto di più (l\'ultimo tratto sotto il km è indicato con la sua distanza reale). Mappa e passo valgono anche per i percorsi registrati in passato.',
        'Sotto al passo c\'è anche l\'altimetria: il profilo del percorso con il dislivello in salita (D+) e in discesa (D−). Vale per gli allenamenti tracciati d\'ora in poi, se il dispositivo fornisce la quota: i percorsi registrati in passato non ce l\'hanno salvata.',
        'Il percorso è privato. Se vuoi, puoi mostrarne la sagoma agli amici nel feed: lo decidi allenamento per allenamento, dal recap subito dopo il salvataggio o riaprendo l\'attività dal Calendario. Gli amici vedono solo la forma del giro, mai la mappa.',
      ],
    },
    {
      icon: '🏋️',
      title: 'Palestra: esercizi e record',
      paragraphs: [
        'Quando registri una sessione di palestra puoi segnare gli esercizi con serie × ripetizioni × carico (lascia il peso vuoto per il corpo libero).',
        'I nomi degli esercizi ti vengono suggeriti da quelli già usati: scrivere sempre lo stesso nome rende affidabili i record.',
        'Se superi il tuo carico massimo su un esercizio, l\'app te lo annuncia al salvataggio. Tutti i massimali sono nella card "Record palestra" in Statistiche.',
        'Dalla seconda giornata su uno stesso esercizio, in Statistiche compare anche "Progressione carichi": il grafico del tuo massimo giornata per giornata, esercizio per esercizio.',
      ],
    },
    {
      icon: '💪',
      title: 'Sforzo percepito e umore',
      paragraphs: [
        'Su ogni attività puoi indicare quanto ti è costata (scala 1–10) e come ti senti dopo (5 stati). Sono facoltativi: se non li compili, restano vuoti.',
        'Servono a conoscerti meglio: la stessa corsa può essere una passeggiata o una battaglia, e contano entrambe le cose.',
        'Compilare lo sforzo alimenta anche il "Carico settimanale" in Statistiche: sforzo × minuti (il metodo session-RPE), settimana per settimana. Se il carico sale di oltre il 50% rispetto alla settimana prima, l\'app ti avvisa: i salti bruschi sono la strada più corta verso un infortunio.',
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
        'Ancora più in fondo trovi l\'evento stagionale del momento: una classifica a tempo aperta a TUTTA la community, non solo agli amici. A finestra chiusa il podio (primi 3) riscatta crediti — di più per il primo posto — e se ci sei tu, una notifica te lo ricorda. Gli eventi si susseguono tutto l\'anno: estate, rientro, autunno, inverno.',
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
        'Ci sono 22 medaglie in 4 livelli (bronzo, argento, oro, diamante), legate a traguardi reali: chilometri totali, sessioni in palestra, streak, costanza settimanale…',
        'Quattro sono le medaglie della montagna, e si guadagnano col tracciamento GPS: chilometri tracciati (Esploratore, Cartografo) e metri di dislivello in salita accumulati (Scalatore, e Ottomila — gli 8.848 m dell\'Everest, un po\' alla volta). Il dislivello conta per gli allenamenti tracciati d\'ora in poi, quota del dispositivo permettendo.',
        'Ogni medaglia sbloccata vale crediti una tantum. Il progresso verso la più vicina lo vedi in Home.',
      ],
    },
    {
      icon: '📊',
      title: 'Statistiche e calendario',
      paragraphs: [
        'Nella sezione Analisi trovi il calendario con la heatmap dei giorni attivi e le statistiche: andamento nel tempo, spettro di intensità per zone, obiettivo vs reale, carico settimanale, correlazione peso-allenamento e record personali.',
        'La card "Il tuo anno in pixel" è l\'anno intero in un colpo d\'occhio: un quadratino per giorno, colorato con la zona di intensità dominante di quel giorno (blu → rosso). Più l\'anno si riempie, più racconta.',
        'Nel Calendario il bottone "Filtri" ti fa cercare tra le attività: per sport, solo quelle con GPS o con foto, o per testo nelle note ("pioggia", "gara"...). La heatmap si adatta e le attività trovate sono elencate lì sotto, pronte da aprire.',
        'Da lì puoi anche esportare le attività in CSV, pronto per Excel o Google Sheets.',
      ],
    },
    {
      icon: '⚖️',
      title: 'Peso e obiettivo',
      paragraphs: [
        'Nel Profilo, la card "Storico peso" tiene il grafico delle tue pesate: con il peso compilato nei dati personali basta un tocco su "Salva" per registrare quella di oggi.',
        'Puoi fissare un obiettivo di peso: compare come linea tratteggiata sul grafico e, con pesate regolari (almeno 3 in una settimana), l\'app calcola il tuo ritmo in kg a settimana e la data in cui, di questo passo, ci arrivi.',
        'La proiezione è una stima onesta: se il peso è stabile, va nella direzione opposta o il traguardo è troppo lontano, te lo dice — senza inventare date.',
      ],
    },
    {
      icon: '✨',
      title: 'Wrapped, insight e condivisione',
      paragraphs: [
        'In Statistiche trovi "I tuoi insight": osservazioni che emergono dai tuoi dati — la settimana record, il giorno in cui ti alleni più spesso, il ritmo che cresce. Cambiano da soli man mano che ti alleni.',
        'PisoZone Wrapped è il riassunto del mese appena concluso (e dell\'anno, quando finisce) in stile storia: numeri, sport del periodo, record e spettro di intensità, slide dopo slide. Lo apri da Statistiche.',
        'Ogni attività — e il Wrapped stesso — diventa un\'immagine da condividere: apri un\'attività dal Calendario e tocca l\'icona di condivisione in alto. La card con i tuoi numeri è pronta per la chat o le storie. Se l\'attività ha un percorso GPS, sulla card compaiono anche la sagoma del tracciato e le barre del passo per km.',
      ],
    },
    {
      icon: '👥',
      title: 'Social: amici, feed e classifica',
      paragraphs: [
        'Cerca i tuoi amici per username e aggiungili: nel feed vedrai le loro attività, con foto, reazioni (❤️ 💪 🔥 👏 🚀) e commenti. Se un amico ha scelto di condividere un giro GPS, nel feed compare anche la sagoma del suo percorso.',
        'C\'è la chat 1:1, i gruppi e la classifica settimanale — tra amici o globale. Tocca chiunque in classifica per aprire il suo profilo pubblico, con livello, numeri e sport preferiti; nella scheda Amici trovi anche "Persone da scoprire", i più attivi del mese.',
        'Sul profilo di un amico c\'è anche "Io vs te": il confronto della settimana in corso — allenamenti, minuti, chilometri e calorie — tu da un lato, l\'amico dall\'altro. La barra di ogni voce dice a colpo d\'occhio chi è avanti: più rosso, più sei tu.',
        'La card "In numeri" che gli altri vedono sul tuo profilo la trovi anche nel TUO Profilo, subito sotto la foto: attività, ore, km e medaglie totali.',
        'Puoi bloccare o segnalare chi si comporta male: chi è bloccato non può scriverti né mandarti richieste.',
      ],
    },
    {
      icon: '🔔',
      title: 'Notifiche',
      paragraphs: [
        'Le notifiche push ti avvisano per messaggi, richieste di amicizia e con un promemoria serale se alle 22:00 non hai ancora registrato nulla. Toccarne una apre direttamente il punto giusto: la conversazione esatta per un messaggio, la scheda Amici per una richiesta.',
        'Se ti assenti per qualche giorno il promemoria non ti martella: si fa vivo solo ogni tanto, con un invito a ripartire con poco. Al rientro ti accoglie una card dedicata in Home.',
        'Dal Profilo le attivi, le disattivi per singola categoria e imposti una fascia oraria di silenzio.',
        'La campanella in alto (centro notifiche) tiene una cronologia che le push non hanno: richieste di amicizia, accettazioni, reazioni e commenti ricevuti, i tuoi level-up — e ora anche i duelli (sfida ricevuta, accettata, conclusa) e il podio degli eventi stagionali quando c\'è da riscattare. Si apre e si segna letta da sola; toccando una voce vai dritto al punto esatto: l\'attività commentata evidenziata nel feed, la sezione duelli o l\'evento stagionale in fondo a Sfide. Il cestino su ogni voce la elimina, "Cancella tutte" (con conferma) svuota l\'intera lista.',
        'Con l\'app installata (su iPhone: Condividi → Aggiungi a Home, con le notifiche attive), l\'icona mostra un numerino con i messaggi e le notifiche non letti — come le app native. Si azzera da solo quando li leggi.',
      ],
    },
    {
      icon: '🔒',
      title: 'Privacy e i tuoi dati',
      paragraphs: [
        'I tuoi dati sono tuoi: dal Profilo puoi scaricarli tutti in JSON — attività, percorsi GPS punto per punto, messaggi, commenti, tutto — o eliminare l\'account con ciò che contiene.',
        'Privacy policy e termini di servizio sono sempre consultabili dai link nel Profilo.',
      ],
    },
  ],
} as const

export default guide
