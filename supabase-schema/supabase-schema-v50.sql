-- PisoZone Schema v50 — Roadmap v7, pilastro 02 "Il profilo racconta una
-- storia": il profilo di un amico mostra la bacheca medaglie vera e i numeri
-- per sport, non solo gli aggregati di get_public_profile_stats (v37).
-- Esegui nel SQL Editor di Supabase.

-- ── 1. Bacheca medaglie sul profilo di un amico ─────────────────────────────
-- "achievements" ha RLS owner-only ("select own achievements", v2): un amico
-- non può leggere le righe altrui. Stesso modello fiduciario di
-- get_public_profile_stats — solo i medal_key sbloccati, mai altro.
create or replace function get_public_profile_medals(p_user_id uuid)
returns table (medal_key text)
language sql security definer stable
set search_path = public as $$
  select ac.medal_key
  from achievements ac
  where ac.user_id = p_user_id
    and auth.uid() is not null
    and not is_blocked_between(p_user_id, auth.uid());
$$;
revoke execute on function get_public_profile_medals(uuid) from anon;

-- ── 2. Numeri per sport sul profilo di un amico ─────────────────────────────
-- Stesso principio: solo un aggregato presentabile (conteggio per tipo
-- attività), mai le attività grezze.
create or replace function get_public_profile_sport_breakdown(p_user_id uuid)
returns table (type text, count bigint)
language sql security definer stable
set search_path = public as $$
  select a.type, count(*)::bigint
  from activities a
  where a.user_id = p_user_id
    and auth.uid() is not null
    and not is_blocked_between(p_user_id, auth.uid())
  group by a.type
  order by count(*) desc;
$$;
revoke execute on function get_public_profile_sport_breakdown(uuid) from anon;
