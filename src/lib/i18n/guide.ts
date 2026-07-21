import { createNamespaceProxy, type Widen } from './proxy'

// Namespace della Guida (pages/Guide.tsx): la "wiki" di tutte le funzionalità
// dell'app, raggiungibile dal Profilo e dall'annuncio Novità. Ogni sezione è
// un accordion; i paragrafi sono frasi brevi, dalla parte dell'utente.
const it = {
  pageTitle: 'GUIDA',
  intro: 'Tutto quello che PisoZone sa fare, in un posto solo. Tocca una sezione per aprirla. In Home, Statistiche e Feed puoi anche trascinare verso il basso in cima alla pagina per aggiornare i dati.',

  sections: [
    {
      icon: '🏃',
      title: 'Registrare un\'attività',
      paragraphs: [
        'Dalla scheda Registra scegli uno dei 20 sport, imposta data, ora e durata e aggiungi se vuoi distanza, note e una foto (visibile agli amici nel feed).',
        'Per corsa, bici, camminata, nuoto e arrampicata puoi indicare anche il "dove": al chiuso l\'attività prende il suo nome vero — tapis roulant, cyclette, piscina. È facoltativo: tocca di nuovo per azzerare.',
        'Per corsa, bici, camminata, trekking, arrampicata e motocross puoi anche segnare a mano il dislivello positivo (metri di salita), utile quando non tracci con il GPS — una gita in montagna o una falesia contano comunque per le medaglie della montagna.',
        'Le calorie si calcolano da sole in base a peso, sesso e intensità dello sport (formula MET): puoi sempre scriverle a mano per sovrascriverle.',
        'Senza connessione l\'attività non va persa: resta in attesa sul telefono (lo vedi da un\'etichetta "In attesa di rete") e si sincronizza da sola appena torni online, foto ed esercizi allegati compresi.',
        'Ogni attività si modifica o elimina dal Calendario, toccandola — anche quelle ancora in attesa di rete.',
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
        'Arrivi da un altro strumento (Strava, Garmin Connect, Komoot...)? Nella scheda Registra, sotto il pulsante del GPS, trovi "Importa un percorso GPX": scegli il file esportato dall\'altra app, scegli lo sport e l\'attività si ricostruisce da sola — distanza, durata, dislivello compresi.',
        'Ogni percorso tracciato si può anche esportare in GPX (il formato che ogni strumento GPS legge): il bottone è nella scheda dell\'attività, sotto la mappa. Utile per portare i tuoi giri fuori da PisoZone, non solo per tenerli qui.',
      ],
    },
    {
      icon: '🗺️',
      title: 'La tua heatmap personale',
      paragraphs: [
        'In Statistiche, se hai almeno un\'attività tracciata col GPS, trovi "Apri la heatmap": una mappa con TUTTI i tuoi percorsi sovrapposti, dal primo all\'ultimo.',
        'Dove sei passato più spesso la linea si vede più accesa; le strade percorse una volta sola restano appena visibili. È un modo diverso di rivedere la tua storia di allenamenti, non una statistica in più.',
        'È sempre e solo tua: a differenza della sagoma di un singolo percorso, questa mappa non si condivide mai, nemmeno con gli amici.',
      ],
    },
    {
      icon: '🚩',
      title: 'Segmenti personali e sfide di percorso',
      paragraphs: [
        'Apri un\'attività tracciata col GPS dal Calendario: sotto la mappa trovi "Crea un segmento da questo percorso". Scegli un tratto con due cursori (es. una salita, o il vialetto sotto casa) e dagli un nome: è un segmento personale.',
        'Ogni volta che una tua futura attività ripassa da quello stesso tratto, il tempo si registra da solo — lo trovi nella pagina Segmenti (raggiungibile da Statistiche), con il tuo record e lo storico dei tentativi.',
        'Da lì puoi anche sfidare un amico sullo stesso tratto di strada: lui dovrà davvero percorrerlo, e vince chi lo fa nel tempo più basso — stessa cornice delle Sfide, ma sul luogo invece che sui chilometri totali.',
        'Nessuna classifica pubblica: i segmenti sono sempre tuoi, li vede solo l\'amico che inviti a una sfida specifica.',
        'Il tuo record su un segmento si condivide come immagine con l\'icona accanto al pulsante "Sfida" nella pagina Segmenti.',
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
        'Fai sempre la stessa scheda? Salvala come routine ("Le tue routine", link sopra gli esercizi): la prossima volta il pulsante "Usa una routine salvata" precompila tutti i blocchi, pronti da confermare o correggere.',
        'Due blocchi di seguito senza pausa? Tocca "Collega al blocco sopra": se è lo stesso esercizio diventa un drop set, se è un altro esercizio un superset — la scheda lo capisce da sola dal nome.',
        'Accanto al peso trovi l\'icona del calcolatore piastre: indica il peso totale (e il bilanciere, se diverso da 20 kg) e ti dice quali piastre caricare per lato.',
        'L\'icona del cronometro accanto a ogni esercizio avvia un timer di recupero (90 secondi di default, regolabile a passi di 15): una vibrazione ti avvisa quando è finito.',
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
      icon: '🧠',
      title: 'Il coach: prontezza, gara e intervalli',
      paragraphs: [
        'In Home, la card "Prontezza" riassume in un numero da 0 a 100 come stai messo oggi: incrocia sforzo percepito, carico settimanale, sonno e riposo — tutti dati che inserisci già altrove, nessun sensore richiesto. Sotto il numero trovi il consiglio: spingi, mantieni il ritmo o riposa.',
        'Serve almeno un po\' di storico (uno sforzo percepito compilato o qualche giorno di Recupero) prima che compaia: senza dati a sufficienza, niente numero inventato. Anche il punteggio di Prontezza si condivide come immagine, con l\'icona accanto al titolo della card.',
        'In Statistiche, se hai corso negli ultimi 90 giorni, trovi anche il "Passo gara previsto": dalla tua corsa più veloce recente stima il tempo su 5K, 10K, mezza maratona e maratona. Si aggiorna da solo a ogni nuovo record, e si condivide come immagine con l\'icona accanto al titolo della card.',
        'Nella pagina Programmi, se sei indietro di almeno due sessioni rispetto alla settimana in corso, un avviso te lo segnala — e se in più il carico sta già salendo, il consiglio cambia: prima recuperare piano, poi rimettersi in pari.',
        'Prima di tracciare col GPS (corsa, bici, camminata, trekking), nella scheda Registra puoi attivare "Allenamento a intervalli": scegli quante ripetute, la distanza e la zona target per il lavoro, la durata e la zona per il recupero. Durante il tracciamento un indicatore ti segue passo per passo e ti avvisa se esci dalla zona giusta.',
        'Il promemoria serale delle 22:00 tiene conto anche della prontezza: se il segnale dice già "riposa", il messaggio cambia tono — niente spinta ad allenarti se il corpo sta chiedendo una pausa.',
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
        'Quattro sono le medaglie della montagna: chilometri tracciati col GPS (Esploratore, Cartografo) e metri di dislivello in salita accumulati (Scalatore, e Ottomila — gli 8.848 m dell\'Everest, un po\' alla volta), dal GPS o inseriti a mano. Contano solo gli allenamenti registrati d\'ora in poi.',
        'Ogni medaglia sbloccata vale crediti una tantum. Il progresso verso la più vicina lo vedi in Home.',
      ],
    },
    {
      icon: '📊',
      title: 'Statistiche e calendario',
      paragraphs: [
        'Nella sezione Analisi trovi il calendario con la heatmap dei giorni attivi e le statistiche: andamento nel tempo, spettro di intensità per zone, obiettivo vs reale, carico settimanale, correlazione peso-allenamento e record personali.',
        'La card "Il tuo anno in pixel" è l\'anno intero in un colpo d\'occhio: un quadratino per giorno, colorato con la zona di intensità dominante di quel giorno (blu → rosso). Più l\'anno si riempie, più racconta.',
        'Nel Calendario il bottone "Filtri" ti fa cercare tra le attività: per sport, solo quelle con GPS, con foto o preferite, o per testo nelle note ("pioggia", "gara"...). La heatmap si adatta e le attività trovate sono elencate lì sotto, pronte da aprire.',
        'Un\'attività diventa preferita aprendola dal Calendario e toccando la stella in alto: utile per ritrovare al volo un giro o un allenamento che vuoi ricordare.',
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

const en: Widen<typeof it> = {
  pageTitle: 'GUIDE',
  intro: 'Everything PisoZone can do, all in one place. Tap a section to open it. On Home, Stats and Feed you can also pull down at the top of the page to refresh the data.',

  sections: [
    {
      icon: '🏃',
      title: 'Logging an activity',
      paragraphs: [
        'From the Log tab, pick one of 20 sports, set the date, time and duration, and optionally add distance, notes and a photo (visible to friends in the feed).',
        'For running, cycling, walking, swimming and climbing you can also specify "where": indoors, the activity takes its real name — treadmill, stationary bike, pool. It\'s optional: tap again to clear it.',
        'For running, cycling, walking, trekking, climbing and motocross you can also log elevation gain by hand (climbing meters), handy when you\'re not tracking with GPS — a mountain hike or a climbing crag still counts toward the mountain medals.',
        'Calories are calculated automatically based on your weight, sex and the sport\'s intensity (MET formula): you can always type them in by hand to override the value.',
        'Without a connection, the activity isn\'t lost: it stays queued on your phone (you\'ll see a "Waiting for network" label) and syncs on its own as soon as you\'re back online, attached photos and exercises included.',
        'Every activity can be edited or deleted from the Calendar by tapping it — even the ones still waiting for network.',
        'In a hurry? From Home, under your last activity, "Repeat this workout" opens the form pre-filled with sport, duration and distance. And in the Log tab, once you\'ve picked a sport, tapping "Same as last time" copies over the duration and distance of your last session of that type.',
        'On Android, long-pressing the app icon gives you quick shortcuts: Log, GPS, Challenges and Stats.',
      ],
    },
    {
      icon: '🛰️',
      title: 'GPS tracking',
      paragraphs: [
        'For running, cycling, walking and trekking you can start GPS tracking from the button in the Log tab: distance, pace and calories are measured automatically, and the route is saved.',
        'Tracking works with the screen on: the app keeps your screen active for you. The controls are protected by a "slide to unlock" gesture, so accidental taps in your pocket won\'t stop anything.',
        'As you move, the screen tints itself with your current intensity zone — blue, green, amber or red, the same scale as the "Intensity spectrum" in Stats — with a badge naming it: one glance and you know how hard you\'re pushing.',
        'At every completed kilometer its time appears (for cycling, its speed), with a light vibration: you know instantly whether you\'re speeding up or slowing down, without waiting for the end.',
        'When you finish and save, a recap greets you: route map, pace per km, elevation profile, credits and any records — first-ever distance for that sport, longest distance ever, fastest-ever pace (or speed). From there you can share it all as an image with one tap.',
        'You can find the route again by opening the activity from the Calendar, drawn on a real map (offline it falls back to the stylized shape), together with the pace for every kilometer: a bar per km shows where you pushed hardest (the last stretch under a km is shown with its real distance). The map and pace also apply to routes recorded in the past.',
        'Below the pace there\'s also the elevation profile: the route\'s shape with elevation gain (D+) and elevation loss (D−). It applies to workouts tracked from now on, if your device provides altitude data: routes recorded in the past don\'t have it saved.',
        'The route is private. If you want, you can show its shape to friends in the feed: you decide workout by workout, from the recap right after saving or by reopening the activity from the Calendar. Friends only see the shape of your route, never the map.',
        'Coming from another tool (Strava, Garmin Connect, Komoot...)? In the Log tab, under the GPS button, you\'ll find "Import a GPX route": pick the file exported from the other app, choose the sport, and the activity rebuilds itself — distance, duration and elevation gain included.',
        'Every tracked route can also be exported as GPX (the format every GPS tool reads): the button is on the activity screen, under the map. Handy for taking your routes out of PisoZone, not just keeping them here.',
      ],
    },
    {
      icon: '🗺️',
      title: 'Your personal heatmap',
      paragraphs: [
        'In Stats, if you have at least one GPS-tracked activity, you\'ll find "Open heatmap": a map with ALL your routes overlaid, from the very first to the latest.',
        'Where you\'ve passed most often the line glows brighter; streets you\'ve only walked once stay barely visible. It\'s a different way to revisit your training history, not just another statistic.',
        'It\'s always and only yours: unlike a single route\'s shape, this map is never shared, not even with friends.',
      ],
    },
    {
      icon: '🚩',
      title: 'Personal segments and route challenges',
      paragraphs: [
        'Open a GPS-tracked activity from the Calendar: below the map you\'ll find "Create a segment from this route". Pick a stretch with two sliders (a hill, the street below your house...) and name it: that\'s a personal segment.',
        'Every time a future activity of yours passes through that same stretch, the time logs itself — you\'ll find it on the Segments page (reachable from Stats), with your best time and the full attempt history.',
        'From there you can also challenge a friend on the same stretch of road: they\'ll actually need to run it, and whoever posts the lowest time wins — same frame as Duels, but tied to a place instead of total distance.',
        'No public leaderboard: segments are always yours, seen only by a friend you invite to a specific challenge.',
        'Your best time on a segment shares as an image, with the icon next to the "Challenge" button on the Segments page.',
      ],
    },
    {
      icon: '🏋️',
      title: 'Gym: exercises and records',
      paragraphs: [
        'When you log a gym session you can record exercises with sets × reps × load (leave the weight empty for bodyweight).',
        'Exercise names are suggested from the ones you\'ve already used: typing the same name consistently keeps your records reliable.',
        'If you beat your max load on an exercise, the app announces it when you save. All your maxes live in the "Gym records" card in Stats.',
        'From your second day on the same exercise, Stats also shows "Load progression": a chart of your max, day by day, exercise by exercise.',
        'Do the same routine every time? Save it ("Your routines", the link above the exercises): next time the "Use a saved routine" button prefills every block, ready to confirm or tweak.',
        'Two blocks back to back with no rest? Tap "Link to block above": same exercise turns it into a drop set, a different one into a superset — the app figures it out from the name.',
        'Next to the weight field you\'ll find the plate calculator icon: enter the total weight (and the barbell weight, if not 20 kg) and it tells you which plates to load per side.',
        'The stopwatch icon next to each exercise starts a rest timer (90 seconds by default, adjustable in 15-second steps): a vibration lets you know when it\'s done.',
      ],
    },
    {
      icon: '💪',
      title: 'Perceived effort and mood',
      paragraphs: [
        'On every activity you can rate how much it took out of you (1–10 scale) and how you feel afterward (5 states). Both are optional: if you skip them, they stay empty.',
        'They help the app get to know you better: the same run can be a stroll or a battle, and both versions matter.',
        'Logging your effort also feeds "Weekly load" in Stats: effort × minutes (the session-RPE method), week by week. If your load jumps more than 50% over the previous week, the app warns you: sudden spikes are the shortest path to an injury.',
      ],
    },
    {
      icon: '🎯',
      title: 'Training plans',
      paragraphs: [
        'From Home (the "Your journey" section) you\'ll find multi-week programs: 5K, 10K, gym, back to movement, yoga.',
        'There\'s nothing to check off: you log activities as usual and the plan\'s sessions settle themselves. Each session unlocks in its own week — no jumping ahead — but you can catch up on ones you\'ve fallen behind on.',
        'At the finish line you claim a credit reward. You can have one active program at a time and drop it whenever you want, with no penalty.',
      ],
    },
    {
      icon: '🎯',
      title: 'Personal goals',
      paragraphs: [
        'Beyond the weekly goal, in Home you can set your own targets: "100 km of running this month", "20 gym sessions", "5,000 calories this week"…',
        'Choose what to count (sessions, minutes, kilometers or calories), an optional sport, the target and the deadline: the bar fills in on its own as you log activities.',
        'You can have up to 5 active goals; delete one with two taps on the trash icon.',
      ],
    },
    {
      icon: '🛌',
      title: 'Recovery: rest, water and sleep',
      paragraphs: [
        'In the "Today\'s recovery" card in Home you can declare a rest day: your streak won\'t break. You get 2 a week, and it only applies to the current day.',
        'The same card tracks your water (250 ml glasses toward a 2-liter goal) and hours slept.',
        'On rest days, the evening reminder leaves you alone.',
      ],
    },
    {
      icon: '🧠',
      title: 'The coach: readiness, race pace and intervals',
      paragraphs: [
        'In Home, the "Readiness" card sums up how you\'re doing today in one number from 0 to 100: it combines perceived effort, weekly load, sleep and rest — all data you already log elsewhere, no sensor required. Below the number you get the advice: push, keep steady, or rest.',
        'It needs a bit of history first (a logged perceived effort or a few days of Recovery) before it shows up: without enough data, no invented number. The Readiness score also shares as an image, with the icon next to the card\'s title.',
        'In Stats, if you\'ve run in the last 90 days, you\'ll also find "Predicted race pace": from your fastest recent run it estimates your time over 5K, 10K, half marathon and marathon. It updates itself with every new record, and shares as an image with the icon next to the card\'s title.',
        'On the Plans page, if you\'re at least two sessions behind the current week, a warning lets you know — and if your load is already climbing on top of that, the advice changes: ease back in first, then catch up.',
        'Before tracking with GPS (running, cycling, walking, trekking), the Log tab lets you turn on "Interval workout": choose how many repeats, the distance and target zone for the work, the duration and zone for the recovery. During tracking, an indicator follows you step by step and warns you if you drift out of the right zone.',
        'The 10 PM evening reminder also takes readiness into account: if the signal already says "rest", the message changes tone — no push to train if your body is asking for a break.',
      ],
    },
    {
      icon: '🔥',
      title: 'Streak and freeze',
      paragraphs: [
        'Your streak counts consecutive days with at least one activity (or a declared rest day).',
        'Missed yesterday and your streak is about to break? Home will offer to freeze it for 300 credits: the freeze covers the missed day.',
      ],
    },
    {
      icon: '⚡',
      title: 'Daily challenges',
      paragraphs: [
        'Every day you get 3 personalized challenges (on the Challenges page and in Home). You complete them by training, and they expire at midnight.',
        'When a challenge is marked complete, claim it to collect the credits. A little number on the Challenges tab at the bottom reminds you how many you have to claim.',
        'At the bottom of the Challenges page are challenges with friends: launch a timed duel — sessions, minutes, kilometers or calories — against a friend (who has to accept) or against one of your groups (it starts right away for everyone). Once the window closes, whoever did more claims 100 credits; in case of a tie, there\'s no winner.',
        'Even further down you\'ll find the current seasonal event: a timed leaderboard open to the WHOLE community, not just friends. Once the window closes, the podium (top 3) claims credits — more for first place — and if you\'re on it, a notification reminds you. Events run all year round: summer, back-to-school, fall, winter.',
      ],
    },
    {
      icon: '💎',
      title: 'Credits, levels and shop',
      paragraphs: [
        'Credits are earned by logging activities, completing daily challenges, unlocking medals and finishing training plans.',
        'Spend them in Profile: 10 levels to unlock in sequence, 6 color themes for the whole app, and special frames for your avatar. And on streak freezes.',
      ],
    },
    {
      icon: '🏅',
      title: 'Medals',
      paragraphs: [
        'There are 22 medals across 4 tiers (bronze, silver, gold, diamond), tied to real milestones: total kilometers, gym sessions, streak, weekly consistency…',
        'Four are the mountain medals: kilometers tracked with GPS (Esploratore, Cartografo) and meters of elevation gain accumulated (Scalatore, and Ottomila — Everest\'s 8,848 m, a little at a time), from GPS or entered by hand. Only workouts logged from now on count.',
        'Every unlocked medal is worth a one-time credit reward. Your progress toward the nearest one is shown in Home.',
      ],
    },
    {
      icon: '📊',
      title: 'Stats and calendar',
      paragraphs: [
        'In the Stats section you\'ll find the calendar with a heatmap of your active days, plus stats: trends over time, intensity spectrum by zone, goal vs actual, weekly load, weight-training correlation and personal records.',
        'The "Your year in pixels" card is your whole year at a glance: one little square per day, colored with that day\'s dominant intensity zone (blue → red). The fuller the year, the more it tells you.',
        'In the Calendar, the "Filters" button lets you search your activities: by sport, GPS-only, photo-only or favorites-only, or by text in the notes ("rain", "race"...). The heatmap adapts and the matching activities are listed right below, ready to open.',
        'An activity becomes a favorite by opening it from the Calendar and tapping the star at the top — handy for finding a run or workout you want to remember.',
        'From there you can also export your activities to CSV, ready for Excel or Google Sheets.',
      ],
    },
    {
      icon: '⚖️',
      title: 'Weight and goal',
      paragraphs: [
        'In Profile, the "Weight history" card charts your weigh-ins: with your weight filled in under personal data, one tap on "Save" logs today\'s.',
        'You can set a weight goal: it shows up as a dashed line on the chart, and with regular weigh-ins (at least 3 in a week), the app calculates your pace in kg per week and the date you\'ll reach it at that rate.',
        'The projection is an honest estimate: if your weight is stable, moving the other way, or the goal is too far off, it tells you so — without making up dates.',
      ],
    },
    {
      icon: '✨',
      title: 'Wrapped, insights and sharing',
      paragraphs: [
        'In Stats you\'ll find "Your insights": observations drawn from your data — your record week, the day you train most often, your improving pace. They update on their own as you keep training.',
        'PisoZone Wrapped is a story-style recap of the month that just ended (and of the year, when it wraps up): numbers, the period\'s sports, records and intensity spectrum, slide after slide. Open it from Stats.',
        'Every activity — and Wrapped itself — turns into a shareable image: open an activity from the Calendar and tap the share icon at the top. The card with your numbers is ready for chat or stories. If the activity has a GPS route, the card also shows the route\'s shape and the per-km pace bars.',
      ],
    },
    {
      icon: '👥',
      title: 'Social: friends, feed and leaderboard',
      paragraphs: [
        'Search for your friends by username and add them: in the feed you\'ll see their activities, with photos, reactions (❤️ 💪 🔥 👏 🚀) and comments. If a friend chose to share a GPS route, the feed also shows the shape of their route.',
        'There\'s 1:1 chat, groups, and the weekly leaderboard — among friends or global. Tap anyone on the leaderboard to open their public profile, with level, numbers and favorite sports; in the Friends tab you\'ll also find "People to discover", the month\'s most active users.',
        'On a friend\'s profile there\'s also "Me vs you": a comparison for the current week — workouts, minutes, kilometers and calories — you on one side, your friend on the other. Each row\'s bar shows at a glance who\'s ahead: the more red, the more it\'s you.',
        'The "By the numbers" card that others see on your profile is also on YOUR Profile, right below your photo: total activities, hours, km and medals.',
        'You can block or report anyone behaving badly: someone you\'ve blocked can\'t message you or send you requests.',
      ],
    },
    {
      icon: '🔔',
      title: 'Notifications',
      paragraphs: [
        'Push notifications alert you for messages, friend requests, and with an evening reminder if you haven\'t logged anything by 10 PM. Tapping one opens the right place directly: the exact conversation for a message, the Friends tab for a request.',
        'If you\'re away for a few days, the reminder won\'t hound you: it only shows up now and then, inviting you to ease back in. When you return, a dedicated card welcomes you back in Home.',
        'From Profile you can turn them on or off per category and set a quiet hours window.',
        'The bell at the top (notification center) keeps a history that push doesn\'t: friend requests, acceptances, reactions and comments received, your level-ups — and now also duels (challenge received, accepted, finished) and the seasonal event podium when there\'s something to claim. It opens and marks itself read automatically; tapping an entry takes you straight to the exact spot: the commented activity highlighted in the feed, the duels section, or the seasonal event at the bottom of Challenges. The trash icon on each entry deletes it, "Delete all" (with confirmation) clears the whole list.',
        'With the app installed (on iPhone: Share → Add to Home Screen, with notifications enabled), the icon shows a badge with your unread messages and notifications — just like native apps. It clears itself once you\'ve read them.',
      ],
    },
    {
      icon: '🔒',
      title: 'Privacy and your data',
      paragraphs: [
        'Your data is yours: from Profile you can download all of it as JSON — activities, point-by-point GPS routes, messages, comments, everything — or delete your account along with everything it contains.',
        'The privacy policy and terms of service are always available via the links in Profile.',
      ],
    },
  ],
}

const guide = createNamespaceProxy(it, en)

export default guide
