-- PisoZone Schema v54 — rimozione della classifica globale (audit tecnico del
-- 24/07/2026, P0-7). Decisione prodotto: la landing promette "classifiche
-- solo con chi conosci davvero", ma get_global_leaderboard (v26) esponeva
-- username/foto/aggregati settimanali a QUALUNQUE utente autenticato, non
-- solo agli amici — un disallineamento tra promessa e prodotto con un
-- rischio privacy reale (medio), non solo un problema di copy. Il client non
-- la chiama più da questa versione (useLeaderboard.ts, LeaderboardTab.tsx):
-- questa migrazione elimina la funzione anche lato DB, non solo la UI —
-- altrimenti resterebbe comunque chiamabile via RPC diretta da chiunque sia
-- autenticato, vanificando lo scopo della rimozione.
-- Esegui nel SQL Editor di Supabase.

drop function if exists public.get_global_leaderboard(timestamptz);
