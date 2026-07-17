-- PisoZone Schema v44 — medaglie della montagna + "Io vs te" (roadmap v3,
-- pilastro 03 punti 3 e 4). Esegui nel SQL Editor di Supabase.
--
-- ── Dislivello persistito ──
-- D+ dell'attività (metri, interi) calcolato dal CLIENT al salvataggio con la
-- stessa logica dell'altimetria (computeElevationProfile in lib/gps.ts: media
-- mobile + isteresi contro il rumore GPS) e persistito qui, così le medaglie
-- della montagna leggono una colonna invece di riscaricare ogni percorso
-- punto per punto (achievementStats resta veloce). Nullable per sempre:
-- attività manuali, pre-v44 o senza quota non hanno un D+ — non si inventa.
-- Il client è tollerante pre-migrazione: se l'insert con la colonna fallisce,
-- riprova senza (stesso pattern di altitude_m in v42) — mai perdere
-- l'attività per colpa del dislivello.

alter table activities add column if not exists elevation_gain_m integer;

-- ── "Io vs te": confronto settimanale tra amici ──
-- Aggregati della settimana in corso (lunedì→oggi, fuso Europe/Rome come il
-- resto dell'app) per l'utente chiamante e un SUO AMICO: due righe, una per
-- testa. Stesso modello di get_public_profile_stats (security definer, solo
-- aggregati, mai attività grezze), ma più restrittivo: qui il dettaglio è
-- settimanale, quindi si esige l'amicizia accettata oltre al non-blocco —
-- per un estraneo la funzione non restituisce righe e la UI non mostra nulla.
create or replace function get_weekly_comparison(p_friend_id uuid)
returns table (user_id uuid, sessions bigint, minutes bigint, km numeric, kcal bigint)
language sql security definer stable
set search_path = public as $$
  with monday as (
    select date_trunc('week', (now() at time zone 'Europe/Rome'))::date as d
  )
  select u.uid,
         count(a.id)::bigint,
         coalesce(sum(a.duration_min), 0)::bigint,
         coalesce(sum(a.distance_km), 0)::numeric,
         coalesce(sum(a.calories), 0)::bigint
  from (select auth.uid() as uid union select p_friend_id) u
  left join activities a
    on a.user_id = u.uid
   and (a.date at time zone 'Europe/Rome')::date >= (select d from monday)
  where auth.uid() is not null
    and p_friend_id <> auth.uid()
    and not is_blocked_between(p_friend_id, auth.uid())
    and exists (select 1 from friendships f where f.status = 'accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = p_friend_id)
        or (f.addressee_id = auth.uid() and f.requester_id = p_friend_id)))
  group by u.uid;
$$;
revoke execute on function get_weekly_comparison(uuid) from anon;
