import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import recovery from '../lib/i18n/recovery'
import type { RecoveryLog } from '../types'

// Orizzonte più ampio dei 60 giorni dei freeze: i giorni di riposo si vedono
// anche sfogliando il calendario nei mesi passati.
const HISTORY_DAYS = 180

// Registro del recupero (recovery_logs, v33): una riga per giorno con riposo/
// acqua/sonno. Condiviso da Home (card + streak), Calendar e Challenges — i
// giorni di riposo entrano in calcStreak insieme alle frozenDates.
export function useRecovery() {
  const { user } = useAuth()
  const { showError } = useToast()
  const [logs, setLogs] = useState<Map<string, RecoveryLog>>(new Map())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user) { setLoaded(true); return }
    let cancelled = false
    const since = format(subDays(new Date(), HISTORY_DAYS), 'yyyy-MM-dd')
    supabase
      .from('recovery_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('day', since)
      .then(({ data, error }) => {
        if (cancelled) return
        // Tollerante pre-migrazione: tabella assente = nessun log, la card
        // resta usabile e l'eventuale scrittura fallita mostra il toast.
        if (!error && data) {
          setLogs(new Map((data as RecoveryLog[]).map((l) => [l.day, l])))
        }
        setLoaded(true)
      })
    return () => { cancelled = true }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const restDates = useMemo(
    () => [...logs.values()].filter((l) => l.rest).map((l) => l.day),
    [logs],
  )

  // Upsert ottimistico della riga del giorno: la UI risponde al tocco,
  // rollback + toast se la scrittura fallisce.
  const patchDay = useCallback(async (
    day: string,
    patch: Partial<Pick<RecoveryLog, 'rest' | 'water_ml' | 'sleep_hours'>>,
  ) => {
    if (!user) return
    const previous = logs.get(day)
    const next: RecoveryLog = {
      id: previous?.id ?? `optimistic-${day}`,
      user_id: user.id,
      day,
      rest: previous?.rest ?? false,
      water_ml: previous?.water_ml ?? null,
      sleep_hours: previous?.sleep_hours ?? null,
      ...patch,
    }
    setLogs((prev) => new Map(prev).set(day, next))

    const { data, error } = await supabase
      .from('recovery_logs')
      .upsert(
        {
          user_id: user.id,
          day,
          rest: next.rest,
          water_ml: next.water_ml,
          sleep_hours: next.sleep_hours,
        },
        { onConflict: 'user_id,day' },
      )
      .select()
      .single()

    if (error) {
      setLogs((prev) => {
        const rolled = new Map(prev)
        if (previous) rolled.set(day, previous)
        else rolled.delete(day)
        return rolled
      })
      showError(recovery.errors.saveFailed)
      return
    }
    if (data) setLogs((prev) => new Map(prev).set(day, data as RecoveryLog))
  }, [user, logs, showError])

  return { logs, restDates, loaded, patchDay }
}
