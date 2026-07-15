-- PisoZone Schema v39 — eventi stagionali e classifiche a tempo (roadmap v2,
-- pilastro 03). Esegui nel SQL Editor di Supabase.
--
-- A differenza dei duelli (v37, solo tra amici o dentro un gruppo), qui la
-- classifica è aperta a TUTTA la community. Gli eventi (finestra di date +
-- metrica + sport opzionale) vivono nel codice client (SEASONAL_EVENTS in
-- lib/seasonalEvents.ts), non in una tabella: il DB registra solo il
-- riscatto one-shot del podio a finestra chiusa. Rank e crediti NON arrivano
-- dal client: li calcola il trigger dai dati reali di activities, stesso
-- principio fiduciario di guard_duel_update (v37).

create table if not exists seasonal_claims (
  id             uuid primary key default gen_random_uuid(),
  event_key      text not null,
  user_id        uuid not null references profiles(id) on delete cascade,
  metric         text not null,
  activity_type  text,
  starts_on      date not null,
  ends_on        date not null,
  rank           integer not null default 0,
  credits_earned integer not null default 0,
  created_at     timestamptz not null default now()
);

alter table seasonal_claims
  add constraint seasonal_claims_metric_valid check (metric in ('sessions', 'minutes', 'km', 'kcal')),
  add constraint seasonal_claims_window_valid check (ends_on >= starts_on and ends_on <= starts_on + 120),
  add constraint seasonal_claims_rank_valid check (rank between 0 and 3),
  add constraint seasonal_claims_credits_range check (credits_earned between 0 and 150),
  add constraint seasonal_claims_unique unique (event_key, user_id);

create index if not exists seasonal_claims_by_user on seasonal_claims(user_id, created_at desc);

alter table seasonal_claims enable row level security;

create policy "select own seasonal claims" on seasonal_claims for select using (auth.uid() = user_id);

-- Il riscatto è un'unica scrittura, mai un aggiornamento: la finestra deve
-- essere già chiusa (il trigger sotto ricalcola tutto il resto dai dati reali
-- e respinge chi non è davvero sul podio).
create policy "insert own seasonal claims" on seasonal_claims for insert with check (
  auth.uid() = user_id and current_date > ends_on
);

-- Rank e crediti sono CALCOLATI qui, mai fidati dal client: si riaggrega la
-- metrica dichiarata nella finestra dichiarata (esattamente come fa
-- get_seasonal_leaderboard più sotto) e si confronta con tutti gli altri
-- utenti per trovare la posizione reale. Oltre il podio (rank > 3) l'inserimento
-- viene respinto: non c'è nulla da accreditare.
create or replace function guard_seasonal_claim()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  my_value numeric;
  computed_rank integer;
begin
  select case new.metric
    when 'sessions' then count(a.id)::numeric
    when 'minutes'  then coalesce(sum(a.duration_min), 0)::numeric
    when 'km'       then coalesce(sum(a.distance_km), 0)::numeric
    else                 coalesce(sum(a.calories), 0)::numeric
  end into my_value
  from activities a
  where a.user_id = new.user_id
    and a.date::date between new.starts_on and new.ends_on
    and (new.activity_type is null or a.type = new.activity_type);

  if coalesce(my_value, 0) <= 0 then
    raise exception 'SEASON_NO_ACTIVITY';
  end if;

  select count(*) + 1 into computed_rank
  from (
    select a.user_id,
      case new.metric
        when 'sessions' then count(a.id)::numeric
        when 'minutes'  then coalesce(sum(a.duration_min), 0)::numeric
        when 'km'       then coalesce(sum(a.distance_km), 0)::numeric
        else                 coalesce(sum(a.calories), 0)::numeric
      end as val
    from activities a
    where a.date::date between new.starts_on and new.ends_on
      and (new.activity_type is null or a.type = new.activity_type)
      and a.user_id <> new.user_id
    group by a.user_id
  ) others
  where others.val > my_value;

  if computed_rank > 3 then
    raise exception 'SEASON_NOT_TOP3';
  end if;

  new.rank := computed_rank;
  new.credits_earned := case computed_rank when 1 then 150 when 2 then 100 else 60 end;

  update profiles set credits = credits + new.credits_earned where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_seasonal_claim_insert on seasonal_claims;
create trigger on_seasonal_claim_insert before insert on seasonal_claims
  for each row execute function guard_seasonal_claim();

-- Classifica live dell'evento in corso: aggregati per TUTTI gli utenti nella
-- finestra data (mai attività grezze di sconosciuti, stesso principio di
-- get_global_leaderboard/get_duel_progress). I parametri (finestra, metrica,
-- sport) arrivano dal catalogo client SEASONAL_EVENTS.
create or replace function get_seasonal_leaderboard(
  p_start date, p_end date, p_metric text, p_activity_type text default null
)
returns table (user_id uuid, username text, photo_url text, value numeric)
language sql security definer stable
set search_path = public as $$
  select p.id, p.username, p.photo_url,
    case p_metric
      when 'sessions' then count(a.id)::numeric
      when 'minutes'  then coalesce(sum(a.duration_min), 0)::numeric
      when 'km'       then coalesce(sum(a.distance_km), 0)::numeric
      else                 coalesce(sum(a.calories), 0)::numeric
    end as value
  from profiles p
  join activities a on a.user_id = p.id
    and a.date::date between p_start and p_end
    and (p_activity_type is null or a.type = p_activity_type)
  where auth.uid() is not null
    and not is_blocked_between(p.id, auth.uid())
  group by p.id, p.username, p.photo_url
  having case p_metric
      when 'sessions' then count(a.id)::numeric
      when 'minutes'  then coalesce(sum(a.duration_min), 0)::numeric
      when 'km'       then coalesce(sum(a.distance_km), 0)::numeric
      else                 coalesce(sum(a.calories), 0)::numeric
    end > 0
  order by value desc
  limit 50;
$$;
revoke execute on function get_seasonal_leaderboard(date, date, text, text) from anon;
