import { createNamespaceProxy, type Widen } from './proxy'

// Namespace condiviso da Auth.tsx (login/registrazione/recupero password) e
// ConsentGate.tsx (blocco di accettazione Privacy Policy/Termini per chi si è
// registrato prima della loro introduzione). Sono trattati come un solo
// dominio perché entrambi gestiscono l'accesso/consenso dell'account, e
// condividono le stesse due etichette dei link legali.
const it = {
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

const en: Widen<typeof it> = {
  subtitle: 'YOUR FITNESS TRACKER',

  legalLinks: {
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
  },

  tabs: {
    login: 'Log in',
    register: 'Sign up',
    backToLogin: 'Back to login',
  },

  errors: {
    serverConfigMissing: 'Server configuration missing — contact the administrator',
    invalidCredentials: 'Incorrect username or password',
    connectionError: 'Connection error to the server',
    usernameFormat: 'Username: 3-20 characters, letters, numbers and _ only',
    passwordMismatch: 'Passwords don\'t match',
    passwordTooShort: 'Password must be at least 6 characters',
    mustAcceptTerms: 'To create an account you must accept the Privacy Policy and Terms of Service',
    usernameTaken: 'Username already taken',
    invalidOrExpiredCode: 'Invalid or expired code. Try again.',
  },

  fields: {
    usernameLabel: 'Username',
    usernamePlaceholder: 'your_username',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'Confirm password',
    newPasswordLabel: 'New password',
    confirmNewPasswordLabel: 'Confirm new password',
  },

  login: {
    forgotPassword: 'Forgot your password?',
    submit: 'Log in',
    submitting: 'Logging in...',
  },

  register: {
    usernameHint: '3–20 characters, letters, numbers and _ only',
    acceptBefore: 'I\'ve read and accept the',
    acceptMiddle: 'and the',
    submit: 'Create account',
    submitting: 'Creating account...',
  },

  recover: {
    email: {
      intro: 'Enter the recovery email you verified in your profile. If it matches an account, you\'ll receive a code to reset your password.',
      label: 'Email',
      placeholder: 'your-email@example.com',
      submit: 'Send code',
      submitting: 'Sending...',
    },
    code: {
      intro: 'Check your email: if the address is verified you\'ll receive a 6-digit code.',
      label: 'Code',
      placeholder: '123456',
      submit: 'Reset password',
      submitting: 'Verifying...',
    },
  },

  consentGate: {
    ariaLabel: 'Accept the terms',
    heading: 'ONE MOMENT!',
    intro: {
      before: 'PisoZone now has a ',
      middle: ' and ',
      after: ': they explain what data we collect, how we protect it and your rights (including export and deletion). To keep using the app you need to accept them.',
    },
    checkboxLabel: 'I\'ve read and accept the Privacy Policy and Terms of Service',
    saveFailed: 'Save failed. Check your connection and try again.',
    accept: 'Accept and continue',
    accepting: 'Saving…',
    decline: 'Decline — sign out',
  },
}

const auth = createNamespaceProxy(it, en)

export default auth
