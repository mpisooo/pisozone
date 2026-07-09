// Stringhe condivise da più pagine/componenti (pulsanti generici, stati
// ricorrenti). Le stringhe specifiche di una sola pagina vivono invece nel
// namespace di quella pagina, anche se il testo è simile — evita che una
// futura modifica in un punto cambi per sbaglio il testo altrove.
const common = {
  save: 'Salva',
  cancel: 'Annulla',
  delete: 'Elimina',
  confirmQuestion: 'Conferma?',
  loading: 'Caricamento...',
  close: 'Chiudi',
  back: 'Indietro',
  retryHint: 'Controlla la connessione e riprova.',
} as const

export default common
