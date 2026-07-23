import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'pz-pending-invite'

// Invito diretto (P3-03, roadmap "PisoZone Next"): Auth.tsx salva lo username
// dell'invitante in sessionStorage subito dopo una registrazione riuscita
// (signUp non restituisce lo user id sincronicamente lì). Appena la sessione
// è pronta qui, si risolve lo username in un id e si manda una richiesta di
// amicizia — sempre best-effort e silenzioso: se fallisce (utente non
// trovato, già amici, rate limit) non deve bloccare né disturbare il nuovo
// account con un errore su qualcosa che non ha chiesto esplicitamente ora.
export default function PendingInviteHandler() {
  const { user } = useAuth()
  const handledRef = useRef(false)

  useEffect(() => {
    if (!user || handledRef.current) return
    const inviterUsername = sessionStorage.getItem(STORAGE_KEY)
    if (!inviterUsername) return
    handledRef.current = true
    sessionStorage.removeItem(STORAGE_KEY)

    async function applyInvite() {
      try {
        const { data: inviter } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', inviterUsername as string)
          .maybeSingle()
        if (!inviter || inviter.id === user!.id) return
        await supabase.from('friendships').insert({ requester_id: user!.id, addressee_id: inviter.id })
      } catch {
        // Best effort: nessun invito applicato, nessun problema per l'utente
      }
    }
    applyInvite()
  }, [user])

  return null
}
