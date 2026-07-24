// Errore sollevato dai trigger di rate limit del DB (schema v23): il messaggio
// PostgREST inizia con 'RATE_LIMIT'. Riconoscerlo permette di mostrare un
// avviso specifico invece del generico "operazione non riuscita".
export function isRateLimitError(error: { message?: string } | null | undefined): boolean {
  return !!error?.message?.includes('RATE_LIMIT')
}

// Sollevato da guard_segment_delete (v47) quando si prova a eliminare un
// segmento referenziato da una sfida di percorso ancora aperta.
export function isSegmentHasActiveDuelError(error: { message?: string } | null | undefined): boolean {
  return !!error?.message?.includes('SEGMENT_HAS_ACTIVE_DUEL')
}

// Sollevato da guard_last_admin_removal (v49) quando si prova a rimuovere
// (auto-uscita o espulsione) l'unico admin di un gruppo che ha ancora altri
// membri: il gruppo resterebbe orfano.
export function isGroupLastAdminError(error: { message?: string } | null | undefined): boolean {
  return !!error?.message?.includes('GROUP_LAST_ADMIN')
}

// Sollevato da guard_rest_activity_conflict (v53, audit tecnico del
// 24/07/2026 P0-4) quando si prova a segnare riposo in un giorno con
// attività già registrate — il client (canMarkRest) già lo impedisce dalla
// UI, questa è la seconda linea di difesa lato DB.
export function isRestHasActivityError(error: { message?: string } | null | undefined): boolean {
  return !!error?.message?.includes('REST_HAS_ACTIVITY')
}
