import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { generateDailyChallenges } from '../lib/challenges'
import type { Activity } from '../types'

interface ChallengesBadgeCtx {
  claimable: number
  refresh: () => void
}

// Default no-op: come UnreadContext, usare l'hook fuori dal provider non rompe.
const ChallengesBadgeContext = createContext<ChallengesBadgeCtx>({ claimable: 0, refresh: () => {} })
export const useChallengesBadge = () => useContext(ChallengesBadgeContext)

// Conta le sfide di oggi completate ma non ancora riscattate, per il badge
// sulla voce Sfide della Navbar (stesso pattern del badge messaggi di
// UnreadContext). Niente realtime: si aggiorna a ogni cambio di rotta, al
// ritorno in primo piano della PWA e su richiesta esplicita — refresh() è
// chiamato da useActivities (un'attività può completare o s-completare una
// sfida) e da useDailyChallenges dopo un riscatto.
export function ChallengesBadgeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [claimable, setClaimable] = useState(0)

  const refresh = useCallback(async () => {
    if (!user) { setClaimable(0); return }
    const today = format(new Date(), 'yyyy-MM-dd')
    const [actsRes, compsRes] = await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', `${today}T00:00:00+00:00`),
      supabase
        .from('daily_challenge_completions')
        .select('challenge_key')
        .eq('user_id', user.id)
        .eq('challenge_date', today),
    ])
    // Best effort: un badge non merita un toast d'errore
    if (actsRes.error || compsRes.error) return
    // Stesso filtro a prefisso di useDailyChallenges, così il conteggio
    // combacia sempre con quello che l'utente trova nella pagina Sfide
    const todayActivities = ((actsRes.data as Activity[]) ?? []).filter((a) => a.date.startsWith(today))
    const claimedKeys = new Set((compsRes.data ?? []).map((c) => c.challenge_key as string))
    // streak = 0: per regola di design nessuna sfida del pool dipende dallo
    // streak (devono essere completabili in giornata) — vedi CLAUDE.md
    const count = generateDailyChallenges(user.id, today)
      .filter((t) => t.check(todayActivities, 0) && !claimedKeys.has(t.key))
      .length
    setClaimable(count)
  }, [user])

  useEffect(() => { refresh() }, [refresh, pathname])

  // PWA ripresa dallo standby: il giorno (e quindi le sfide) può essere cambiato
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  return (
    <ChallengesBadgeContext.Provider value={{ claimable, refresh }}>
      {children}
    </ChallengesBadgeContext.Provider>
  )
}
