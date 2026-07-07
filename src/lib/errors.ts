// Errore sollevato dai trigger di rate limit del DB (schema v23): il messaggio
// PostgREST inizia con 'RATE_LIMIT'. Riconoscerlo permette di mostrare un
// avviso specifico invece del generico "operazione non riuscita".
export function isRateLimitError(error: { message?: string } | null | undefined): boolean {
  return !!error?.message?.includes('RATE_LIMIT')
}
