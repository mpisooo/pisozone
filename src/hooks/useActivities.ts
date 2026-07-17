import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useChallengesBadge } from '../context/ChallengesBadgeContext'
import { removeActivityPhoto } from '../lib/activityPhotos'
import {
  mergeWithPending, toPendingActivity, pendingActivityId, isNetworkFailure, isPendingActivityId,
  type QueuedActivity, type QueuedActivityPayload,
} from '../lib/offlineQueue'
import log from '../lib/i18n/log'
import type { Activity } from '../types'

const QUEUE_STORAGE_KEY = 'pisozone-offline-queue'

// La coda sopravvive a un reload/kill dell'app (comune su iOS sotto pressione
// di memoria): senza persistenza, un'attività registrata offline e poi
// "perduta" al riavvio sarebbe esattamente il problema che la coda risolve.
function loadQueue(): QueuedActivity[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedActivity[]) {
  try {
    if (queue.length === 0) localStorage.removeItem(QUEUE_STORAGE_KEY)
    else localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // Storage pieno o non disponibile (Safari in privata): la coda resta solo in memoria per questa sessione
  }
}

export function useActivities() {
  const { user } = useAuth()
  const { showError } = useToast()
  // Ogni mutazione può completare (o s-completare) una sfida di oggi: il
  // badge sulla Navbar va ricalcolato. No-op fuori dal provider.
  const { refresh: refreshChallengesBadge } = useChallengesBadge()
  const [serverActivities, setServerActivities] = useState<Activity[]>([])
  // Attività registrate senza rete, in attesa di sincronizzazione (roadmap v2,
  // pilastro 05 "offline-first robusto"). Niente Background Sync nel service
  // worker: su iOS Safari (il dispositivo dell'utente) l'API non esiste affatto
  // — stesso limite già noto per il GPS "a schermo acceso". Si riprova quando
  // l'app è davvero aperta: al ritorno online e ad ogni rientro in primo piano.
  const [queue, setQueue] = useState<QueuedActivity[]>(() => loadQueue())
  const [loading, setLoading] = useState(true)
  const flushingRef = useRef(false)

  useEffect(() => { saveQueue(queue) }, [queue])

  const activities = mergeWithPending(serverActivities, queue, user?.id ?? '')

  const fetchActivities = useCallback(async () => {
    if (!user) { setServerActivities([]); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (error) showError(log.errors.loadFailed)
    else if (data) setServerActivities(data as Activity[])
    setLoading(false)
  }, [user, showError])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  // La colonna elevation_gain_m esiste solo dalla v44: PostgREST rifiuta
  // l'insert di una colonna sconosciuta (PGRST204, il messaggio la nomina).
  // Come per altitude_m nei percorsi si riprova senza — meglio perdere il
  // dislivello che l'attività.
  const insertActivity = useCallback(async (payload: QueuedActivityPayload, userId: string) => {
    let result = await supabase
      .from('activities')
      .insert({ ...payload, user_id: userId })
      .select()
      .single()
    if (result.error?.message?.includes('elevation_gain_m') && payload.elevation_gain_m !== undefined) {
      const { elevation_gain_m: _dropped, ...rest } = payload
      result = await supabase
        .from('activities')
        .insert({ ...rest, user_id: userId })
        .select()
        .single()
    }
    return result
  }, [])

  const flushQueue = useCallback(async () => {
    if (!user || flushingRef.current || queue.length === 0) return
    flushingRef.current = true
    let synced = 0
    for (const item of queue) {
      const { data, error, status } = await insertActivity(item.payload, user.id)
      if (!error && data) {
        setQueue((prev) => prev.filter((q) => q.localId !== item.localId))
        setServerActivities((prev) => [data as Activity, ...prev])
        synced++
      } else if (error && !isNetworkFailure(status)) {
        // Errore vero (non di rete): tenerla in coda per sempre non la
        // risolverebbe, meglio avvisare e scartarla.
        setQueue((prev) => prev.filter((q) => q.localId !== item.localId))
        showError(log.errors.syncFailed)
      }
      // Fallimento di rete: resta in coda, si riprova al prossimo trigger.
    }
    flushingRef.current = false
    if (synced > 0) refreshChallengesBadge()
  }, [user, queue, showError, refreshChallengesBadge, insertActivity])

  useEffect(() => {
    const onOnline = () => { flushQueue() }
    const onVisible = () => { if (document.visibilityState === 'visible') flushQueue() }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    flushQueue()
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [flushQueue])

  const enqueueLocally = (activity: QueuedActivityPayload): Activity => {
    const localId = crypto.randomUUID()
    const item: QueuedActivity = { localId, payload: activity, queuedAt: new Date().toISOString() }
    setQueue((prev) => [...prev, item])
    return toPendingActivity(item, user!.id)
  }

  const addActivity = async (activity: QueuedActivityPayload) => {
    if (!user) return { data: null, error: new Error('Not authenticated') }

    // Offline noto in anticipo: niente fetch da far fallire, si mette subito in coda.
    if (!navigator.onLine) {
      return { data: enqueueLocally(activity), error: null }
    }

    const { data, error, status } = await insertActivity(activity, user.id)

    if (error && isNetworkFailure(status)) {
      return { data: enqueueLocally(activity), error: null }
    }
    if (!error && data) {
      setServerActivities((prev) => [data as Activity, ...prev])
      refreshChallengesBadge()
    }
    return { data, error }
  }

  const updateActivity = async (
    id: string,
    updates: Partial<Omit<Activity, 'id' | 'user_id' | 'created_at' | 'credits_earned'>>
  ) => {
    // Non ancora sincronizzata: non esiste ancora una riga DB da aggiornare.
    if (isPendingActivityId(id)) return { data: null, error: new Error('Pending, not yet synced') }
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setServerActivities((prev) => prev.map((a) => a.id === id ? data as Activity : a))
      refreshChallengesBadge()
    }
    return { data, error }
  }

  const deleteActivity = async (id: string) => {
    // Non ancora sincronizzata: rimuoverla dalla coda locale basta, niente da cancellare sul server.
    if (isPendingActivityId(id)) {
      setQueue((prev) => prev.filter((q) => pendingActivityId(q.localId) !== id))
      return { error: null }
    }
    const target = serverActivities.find((a) => a.id === id)
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (!error) {
      setServerActivities((prev) => prev.filter((a) => a.id !== id))
      // La riga nel DB cade, il file nello Storage no: pulizia best effort
      if (target?.photo_url && user) removeActivityPhoto(user.id, id)
      refreshChallengesBadge()
    }
    return { error }
  }

  return { activities, loading, addActivity, updateActivity, deleteActivity, refetch: fetchActivities, hasPendingSync: queue.length > 0 }
}
