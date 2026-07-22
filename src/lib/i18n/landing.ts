import { createNamespaceProxy, type Widen } from './proxy'

// Landing pubblica (roadmap "PisoZone Next", pilastro Landing — P1-04):
// sostituisce, per chi non è autenticato, il redirect diretto a /auth su "/"
// (vedi components/ProtectedRoute.tsx). Pagina pre-login come Auth/Privacy/
// Termini: nessuna prova sociale inventata (nessun numero utenti o
// testimonianza — non ci sono dati reali da mostrare oggi), nessuna
// funzionalità elencata per intero — una sola promessa centrale (il coach di
// Prontezza) con il resto a supporto.
const it = {
  header: {
    existingAccount: 'Hai già un account?',
    login: 'Accedi',
  },

  hero: {
    kicker: 'IL TUO TRACKER DI ATTIVITÀ FISICA',
    title: 'Sai sempre se oggi è il giorno giusto per spingere.',
    subtitle: 'PisoZone segue oltre 50 sport — dalla corsa alla palestra, dalla bici allo sci — e con i dati che inserisci già ti dice quando allenarti e quando riposare. Nessun sensore da comprare.',
    ctaPrimary: 'Inizia gratis',
    ctaSecondary: 'Guarda come funziona',
  },

  how: {
    heading: 'Come funziona',
    steps: [
      { title: 'Registra', body: 'A mano o con il GPS, in pochi tocchi. Oltre 50 sport, dalla corsa alla palestra.' },
      { title: 'Lascia parlare i dati', body: 'Sforzo percepito, sonno, riposo: il tuo Punteggio di Prontezza si aggiorna da solo.' },
      { title: 'Sai cosa fare oggi', body: 'Spingi, mantieni il ritmo o riposa: un consiglio ogni giorno, non un ordine.' },
    ],
  },

  benefits: {
    heading: 'Perché PisoZone',
    items: [
      { title: 'Un\'app, ogni sport', body: 'Corsa, bici, palestra, arrampicata, sci… non serve un\'app diversa per ognuno.' },
      { title: 'GPS che resta tuo', body: 'Percorsi privati di default. Decidi tu, allenamento per allenamento, se condividerne la sagoma — mai la mappa reale.' },
      { title: 'Un coach senza sensori', body: 'Il Punteggio di Prontezza usa solo i dati che inserisci già: nessun wearable da comprare.' },
      { title: 'Palestra sul serio', body: 'Serie, ripetizioni, carichi, record automatici, calcolatore piastre, timer di recupero.' },
      { title: 'Amici veri, non sconosciuti', body: 'Feed, sfide e classifiche solo con chi conosci davvero.' },
    ],
  },

  privacy: {
    heading: 'Privacy, in breve',
    body: 'Il GPS registra solo mentre il tracciamento è attivo, a schermo acceso. I tuoi percorsi restano privati finché non decidi tu di mostrarne la sagoma a un amico. Puoi esportare tutti i tuoi dati o cancellare l\'account in ogni momento, dalle Impostazioni.',
    link: 'Leggi la Privacy Policy completa',
  },

  install: {
    heading: 'Installa su iPhone e Android',
    ios: { title: 'iPhone (Safari)', body: 'Tocca l\'icona Condividi, poi "Aggiungi a Home". PisoZone si apre come un\'app vera, senza barra del browser.' },
    android: { title: 'Android (Chrome)', body: 'Apri il menu in alto a destra e tocca "Installa app" — o segui il banner che compare da solo.' },
  },

  faq: {
    heading: 'Domande frequenti',
    items: [
      { q: 'Serve un orologio sportivo o una fascia cardio?', a: 'No. Il tracciamento GPS funziona dal telefono, a schermo acceso; il Punteggio di Prontezza usa solo i dati che inserisci tu.' },
      { q: 'I miei percorsi sono pubblici?', a: 'Mai per impostazione predefinita. Decidi tu, allenamento per allenamento, se mostrare la sagoma del percorso ai tuoi amici — mai la mappa reale.' },
      { q: 'Funziona offline?', a: 'Sì: un\'attività registrata senza connessione resta in attesa sul telefono e si sincronizza da sola appena torni online.' },
      { q: 'Posso cancellare i miei dati?', a: 'In qualsiasi momento, dalle Impostazioni: puoi esportare tutti i tuoi dati o eliminare l\'account definitivamente.' },
    ],
  },

  footer: {
    rights: 'PisoZone',
    privacy: 'Privacy',
    terms: 'Termini',
    login: 'Accedi',
  },
} as const

const en: Widen<typeof it> = {
  header: {
    existingAccount: 'Already have an account?',
    login: 'Log in',
  },

  hero: {
    kicker: 'YOUR FITNESS TRACKER',
    title: 'Always know if today is the day to push.',
    subtitle: 'PisoZone tracks over 50 sports — from running to the gym, from cycling to skiing — and with the data you already log, it tells you when to train and when to rest. No sensor to buy.',
    ctaPrimary: 'Start for free',
    ctaSecondary: 'See how it works',
  },

  how: {
    heading: 'How it works',
    steps: [
      { title: 'Log it', body: 'By hand or with GPS, in a few taps. Over 50 sports, from running to the gym.' },
      { title: 'Let the data speak', body: 'Perceived effort, sleep, rest: your Readiness Score updates itself.' },
      { title: 'Know what to do today', body: 'Push, keep steady, or rest: a suggestion every day, never an order.' },
    ],
  },

  benefits: {
    heading: 'Why PisoZone',
    items: [
      { title: 'One app, every sport', body: 'Running, cycling, gym, climbing, skiing… no separate app for each one.' },
      { title: 'GPS that stays yours', body: 'Private routes by default. You decide, workout by workout, whether to share the shape — never the real map.' },
      { title: 'A coach with no sensors', body: 'The Readiness Score uses only the data you already log: no wearable to buy.' },
      { title: 'Gym tracking done right', body: 'Sets, reps, loads, automatic records, plate calculator, rest timer.' },
      { title: 'Real friends, not strangers', body: 'Feed, challenges and leaderboards only with people you actually know.' },
    ],
  },

  privacy: {
    heading: 'Privacy, in short',
    body: 'GPS only records while tracking is active, with the screen on. Your routes stay private until you decide to show their shape to a friend. You can export all your data or delete your account at any time, from Settings.',
    link: 'Read the full Privacy Policy',
  },

  install: {
    heading: 'Install on iPhone and Android',
    ios: { title: 'iPhone (Safari)', body: 'Tap the Share icon, then "Add to Home Screen". PisoZone opens like a real app, with no browser bar.' },
    android: { title: 'Android (Chrome)', body: 'Open the menu in the top right and tap "Install app" — or follow the banner that shows up on its own.' },
  },

  faq: {
    heading: 'Frequently asked questions',
    items: [
      { q: 'Do I need a sports watch or a heart-rate strap?', a: 'No. GPS tracking works from your phone with the screen on; the Readiness Score only uses the data you log yourself.' },
      { q: 'Are my routes public?', a: 'Never by default. You decide, workout by workout, whether to show the route shape to your friends — never the real map.' },
      { q: 'Does it work offline?', a: 'Yes: an activity logged without a connection stays queued on your phone and syncs on its own as soon as you\'re back online.' },
      { q: 'Can I delete my data?', a: 'At any time, from Settings: you can export all your data or delete your account for good.' },
    ],
  },

  footer: {
    rights: 'PisoZone',
    privacy: 'Privacy',
    terms: 'Terms',
    login: 'Log in',
  },
}

const landing = createNamespaceProxy(it, en)

export default landing
