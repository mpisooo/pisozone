// Namespace condiviso da Auth.tsx (login/registrazione/recupero password) e
// ConsentGate.tsx (blocco di accettazione Privacy Policy/Termini per chi si è
// registrato prima della loro introduzione). Sono trattati come un solo
// dominio perché entrambi gestiscono l'accesso/consenso dell'account, e
// condividono le stesse due etichette dei link legali.
const auth = {
  subtitle: 'IL TUO TRACKER DI ATTIVITÀ FISICA',

  legalLinks: {
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Termini di Servizio',
  },

  tabs: {
    login: 'Accedi',
    register: 'Registrati',
    backToLogin: 'Torna al login',
  },

  errors: {
    serverConfigMissing: 'Configurazione server mancante — contatta l\'amministratore',
    invalidCredentials: 'Username o password non corretti',
    connectionError: 'Errore di connessione al server',
    usernameFormat: 'Username: 3-20 caratteri, solo lettere, numeri e _',
    passwordMismatch: 'Le password non coincidono',
    passwordTooShort: 'La password deve essere di almeno 6 caratteri',
    mustAcceptTerms: 'Per creare un account devi accettare la Privacy Policy e i Termini di Servizio',
    usernameTaken: 'Username già in uso',
    invalidOrExpiredCode: 'Codice non valido o scaduto. Riprova.',
  },

  fields: {
    usernameLabel: 'Username',
    usernamePlaceholder: 'il_tuo_username',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'Conferma password',
    newPasswordLabel: 'Nuova password',
    confirmNewPasswordLabel: 'Conferma nuova password',
  },

  login: {
    forgotPassword: 'Password dimenticata?',
    submit: 'Accedi',
    submitting: 'Accesso...',
  },

  register: {
    usernameHint: '3–20 caratteri, solo lettere, numeri e _',
    acceptBefore: 'Ho letto e accetto la',
    acceptMiddle: 'e i',
    submit: 'Crea account',
    submitting: 'Creazione account...',
  },

  recover: {
    email: {
      intro: 'Inserisci l\'email di recupero che hai verificato nel tuo profilo. Se corrisponde a un account, riceverai un codice per reimpostare la password.',
      label: 'Email',
      placeholder: 'la-tua-email@esempio.com',
      submit: 'Invia codice',
      submitting: 'Invio...',
    },
    code: {
      intro: 'Controlla la tua email: se l\'indirizzo è verificato riceverai un codice a 6 cifre.',
      label: 'Codice',
      placeholder: '123456',
      submit: 'Reimposta password',
      submitting: 'Verifica...',
    },
  },

  consentGate: {
    ariaLabel: 'Accetta le condizioni',
    heading: 'UN ATTIMO!',
    intro: {
      before: 'PisoZone ora ha una ',
      middle: ' e dei ',
      after: ': spiegano quali dati raccogliamo, come li proteggiamo e i tuoi diritti (esportazione e cancellazione inclusi). Per continuare a usare l\'app devi accettarli.',
    },
    checkboxLabel: 'Ho letto e accetto la Privacy Policy e i Termini di Servizio',
    saveFailed: 'Salvataggio non riuscito. Controlla la connessione e riprova.',
    accept: 'Accetto e continuo',
    accepting: 'Salvataggio…',
    decline: 'Non accetto — esci dall\'account',
  },
} as const

export default auth
