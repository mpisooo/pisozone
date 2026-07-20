import { createNamespaceProxy, type Widen } from './proxy'

// Stringhe condivise da più pagine/componenti (pulsanti generici, stati
// ricorrenti). Le stringhe specifiche di una sola pagina vivono invece nel
// namespace di quella pagina, anche se il testo è simile — evita che una
// futura modifica in un punto cambi per sbaglio il testo altrove.
const it = {
  save: 'Salva',
  cancel: 'Annulla',
  delete: 'Elimina',
  confirmQuestion: 'Conferma?',
  loading: 'Caricamento...',
  close: 'Chiudi',
  back: 'Indietro',
  retryHint: 'Controlla la connessione e riprova.',
  // Attività registrata offline, ancora in coda sul dispositivo (roadmap v2,
  // pilastro 05, offline-first): si sincronizza da sola, ma è già modificabile.
  pendingSyncBadge: 'In attesa di rete',
} as const

const en: Widen<typeof it> = {
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  confirmQuestion: 'Confirm?',
  loading: 'Loading...',
  close: 'Close',
  back: 'Back',
  retryHint: 'Check your connection and try again.',
  pendingSyncBadge: 'Waiting for network',
}

const common = createNamespaceProxy(it, en)

export default common
