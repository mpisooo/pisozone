import { parseISO, startOfDay, endOfDay, isWithinInterval, differenceInCalendarDays, isAfter } from 'date-fns'
import { SEASONAL_EVENTS, type SeasonalEventDef } from './seasonalCatalog'

// Eventi stagionali e classifiche a tempo (roadmap v2, pilastro 03): a
// differenza dei duelli (v37, solo amici/gruppo), qui la classifica è aperta
// a TUTTA la community — il gancio di retention più ampio della
// gamification. Il catalogo vive nel codice, stesso pattern di
// PLAN_CATALOG/MEDALS/CHALLENGE_POOL: niente ricorrenza automatica per anno,
// si aggiunge una voce quando si vuole lanciare il prossimo evento. Il podio
// (rank 1-3) si riscatta a finestra chiusa in seasonal_claims (v39): rank e
// crediti sono CALCOLATI dal trigger Postgres dai dati reali, mai dal client
// — stesso principio fiduciario dei duelli.
//
// I DATI (SEASONAL_EVENTS e affini) vivono in lib/seasonalCatalog.ts, senza
// dipendenze: qui restano gli helper con date-fns, e chi ha bisogno solo del
// catalogo (la campanella nel chunk d'ingresso) importa da là.

export * from './seasonalCatalog'

// Entro quanti giorni dalla chiusura un evento appena finito resta proposto
// per il riscatto in UI (il riscatto tecnico resta possibile anche oltre:
// è solo una questione di cosa mostrare, non di scadenza).
const CLAIM_TEASER_DAYS = 14
// Entro quanti giorni dall'inizio un evento futuro compare come anteprima.
const UPCOMING_TEASER_DAYS = 14

function inWindow(now: Date, startsOn: string, endsOn: string): boolean {
  return isWithinInterval(now, { start: startOfDay(parseISO(startsOn)), end: endOfDay(parseISO(endsOn)) })
}

// L'evento attivo oggi, se esiste (il catalogo non dovrebbe avere finestre
// sovrapposte; in caso il primo in ordine vince).
export function getCurrentSeasonalEvent(now: Date = new Date()): SeasonalEventDef | null {
  return SEASONAL_EVENTS.find((e) => inWindow(now, e.startsOn, e.endsOn)) ?? null
}

// Il prossimo evento in arrivo, solo se inizia entro UPCOMING_TEASER_DAYS —
// un'anteprima, non un invito ad attività lontane mesi.
export function getUpcomingSeasonalEvent(now: Date = new Date()): SeasonalEventDef | null {
  const upcoming = SEASONAL_EVENTS
    .filter((e) => isAfter(parseISO(e.startsOn), now))
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn))
  const next = upcoming[0]
  if (!next) return null
  return differenceInCalendarDays(parseISO(next.startsOn), now) <= UPCOMING_TEASER_DAYS ? next : null
}

// Eventi chiusi di recente: finestra di visibilità per proporre il riscatto
// del podio in UI (chi non rientra qui può comunque riscattare da API, ma
// l'app smette di ricordarglielo).
export function getRecentlyEndedEvents(now: Date = new Date()): SeasonalEventDef[] {
  return SEASONAL_EVENTS
    .filter((e) => {
      const end = endOfDay(parseISO(e.endsOn))
      return isAfter(now, end) && differenceInCalendarDays(now, end) <= CLAIM_TEASER_DAYS
    })
    .sort((a, b) => b.endsOn.localeCompare(a.endsOn))
}

export function seasonalDaysLeft(event: Pick<SeasonalEventDef, 'endsOn'>, now: Date = new Date()): number {
  return Math.max(0, differenceInCalendarDays(parseISO(event.endsOn), startOfDay(now)))
}
