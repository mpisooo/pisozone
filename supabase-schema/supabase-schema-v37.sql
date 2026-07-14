-- PisoZone Schema v37 — sfide 1v1/di gruppo + profili pubblici e scoperta
-- (roadmap v2, pilastro 03). Esegui nel SQL Editor di Supabase.
--
-- Duelli: "chi fa più km questa settimana" tra due amici o dentro un gruppo.
-- L'avanzamento NON è persistito: lo calcola get_duel_progress dalle attività
-- (security definer, così i membri di un gruppo non devono essere tutti amici
-- tra loro). Crediti al vincitore col modello fiduciario di sfide/programmi:
-- l'importo arriva dal client ma è vincolato (0..150) e accreditato una sola
-- volta, con la macchina a stati protetta dal trigger.

create table if not exists duels (
  id             uuid primary key default gen_random_uuid(),
  creator_id     uuid not null references profiles(id) on delete cascade,
  opponent_id    uuid references profiles(id) on delete cascade, -- 1v1; null per i gruppi
  group_id       uuid references groups(id) on delete cascade,   -- gruppo; null per 1v1
  metric         text not null,
  starts_on      date not null,
  ends_on        date not null,
  status         text not null default 'pending',
  winner_id      uuid references profiles(id),
  credits_earned integer not null default 0,
  created_at     timestamptz not null default now()
);

alter table duels
  add constraint duels_metric_valid check (metric in ('sessions', 'minutes', 'km', 'kcal')),
  add constraint duels_status_valid check (status in ('pending', 'active', 'declined', 'finished')),
  add constraint duels_target_valid check (
    (opponent_id is not null and group_id is null) or (opponent_id is null and group_id is not null)),
  add constraint duels_not_self check (opponent_id is null or opponent_id <> creator_id),
  add constraint duels_window_valid check (ends_on >= starts_on and ends_on <= starts_on + 30),
  add constraint duels_credits_range check (credits_earned between 0 and 150);

create index if not exists duels_by_creator  on duels(creator_id, created_at desc);
create index if not exists duels_by_opponent on duels(opponent_id, created_at desc);
create index if not exists duels_by_group    on duels(group_id, created_at desc);

-- Appartenenza a un gruppo senza passare dalla RLS di group_members
create or replace function is_group_member(g uuid, u uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from group_members where group_id = g and user_id = u);
$$;

alter table duels enable row level security;

create policy "select duels as participant" on duels for select using (
  auth.uid() = creator_id or auth.uid() = opponent_id
  or (group_id is not null and is_group_member(group_id, auth.uid()))
);

-- 1v1: solo verso un amico accettato e non bloccato, parte 'pending';
-- gruppo: solo da un membro, parte subito 'active'. Finestra ancorata a oggi.
create policy "insert own duels" on duels for insert with check (
  auth.uid() = creator_id
  and winner_id is null and credits_earned = 0
  and starts_on between current_date - 1 and current_date + 1
  and (
    (opponent_id is not null and status = 'pending'
      and not is_blocked_between(creator_id, opponent_id)
      and exists (select 1 from friendships f where f.status = 'accepted'
        and ((f.requester_id = creator_id and f.addressee_id = opponent_id)
          or (f.addressee_id = creator_id and f.requester_id = opponent_id))))
    or (group_id is not null and status = 'active' and is_group_member(group_id, auth.uid()))
  )
);

create policy "update duels as participant" on duels for update using (
  auth.uid() = creator_id or auth.uid() = opponent_id
  or (group_id is not null and is_group_member(group_id, auth.uid()))
);

-- Il creatore può ritirare una proposta non ancora accettata
create policy "delete own pending duels" on duels for delete using (
  auth.uid() = creator_id and status in ('pending', 'declined')
);

-- Macchina a stati + crediti: pending→active/declined solo dall'avversario;
-- active→finished solo a finestra chiusa; chi chiude può dichiararsi
-- vincitore (fiduciario) e incassa una sola volta; tutto il resto immutabile.
create or replace function guard_duel_update()
returns trigger language plpgsql security definer as $$
begin
  if new.creator_id <> old.creator_id
     or new.opponent_id is distinct from old.opponent_id
     or new.group_id is distinct from old.group_id
     or new.metric <> old.metric
     or new.starts_on <> old.starts_on
     or new.ends_on <> old.ends_on then
    raise exception 'DUEL_IMMUTABLE';
  end if;
  if old.status in ('finished', 'declined') then
    raise exception 'DUEL_CLOSED';
  end if;

  if old.status = 'pending' then
    if new.status not in ('active', 'declined') or auth.uid() <> old.opponent_id
       or new.winner_id is not null or new.credits_earned <> 0 then
      raise exception 'DUEL_BAD_TRANSITION';
    end if;
    return new;
  end if;

  -- old.status = 'active'
  if new.status <> 'finished' then
    raise exception 'DUEL_BAD_TRANSITION';
  end if;
  if current_date <= old.ends_on then
    raise exception 'DUEL_STILL_RUNNING';
  end if;
  if new.winner_id is not null then
    if new.winner_id <> auth.uid() then
      raise exception 'DUEL_CLAIM_OWN';
    end if;
    update profiles set credits = credits + new.credits_earned where id = new.winner_id;
  elsif new.credits_earned <> 0 then
    raise exception 'DUEL_BAD_TRANSITION';
  end if;
  return new;
end;
$$;

drop trigger if exists on_duel_update on duels;
create trigger on_duel_update before update on duels
  for each row execute function guard_duel_update();

-- Avanzamento del duello: aggregati per partecipante nella finestra, solo per
-- chi vi partecipa. Security definer: in un gruppo non tutti sono amici, le
-- attività grezze non sarebbero visibili via RLS (e non devono diventarlo).
create or replace function get_duel_progress(p_duel_id uuid)
returns table (user_id uuid, username text, photo_url text, value numeric)
language plpgsql security definer stable
set search_path = public as $$
declare d duels%rowtype;
begin
  select * into d from duels where id = p_duel_id;
  if d.id is null then raise exception 'DUEL_NOT_FOUND'; end if;
  if not (auth.uid() = d.creator_id or auth.uid() = d.opponent_id
          or (d.group_id is not null and is_group_member(d.group_id, auth.uid()))) then
    raise exception 'DUEL_FORBIDDEN';
  end if;
  return query
    with participants as (
      select d.creator_id as uid
      union select d.opponent_id where d.opponent_id is not null
      union select gm.user_id from group_members gm
        where d.group_id is not null and gm.group_id = d.group_id
    )
    select p.id, p.username, p.photo_url,
      coalesce((
        select case d.metric
          when 'sessions' then count(a.id)::numeric
          when 'minutes'  then coalesce(sum(a.duration_min), 0)::numeric
          when 'km'       then coalesce(sum(a.distance_km), 0)::numeric
          else                 coalesce(sum(a.calories), 0)::numeric
        end
        from activities a
        where a.user_id = p.id and a.date::date between d.starts_on and d.ends_on
      ), 0)
    from participants pa
    join profiles p on p.id = pa.uid
    order by 4 desc;
end;
$$;
revoke execute on function get_duel_progress(uuid) from anon;

-- ── Profili pubblici: aggregati presentabili di qualunque utente ──
-- Solo totali, mai attività grezze (stesso principio di get_global_leaderboard).
create or replace function get_public_profile_stats(p_user_id uuid)
returns table (total_activities bigint, total_minutes bigint, total_km numeric, medals bigint, active_days bigint)
language sql security definer stable
set search_path = public as $$
  select count(a.id)::bigint,
         coalesce(sum(a.duration_min), 0)::bigint,
         coalesce(sum(a.distance_km), 0)::numeric,
         (select count(*) from achievements ac where ac.user_id = p_user_id)::bigint,
         count(distinct a.date::date)::bigint
  from activities a
  where a.user_id = p_user_id
    and auth.uid() is not null
    and not is_blocked_between(p_user_id, auth.uid());
$$;
revoke execute on function get_public_profile_stats(uuid) from anon;

-- ── Scoperta: gli utenti più attivi degli ultimi 30 giorni non ancora amici ──
create or replace function get_suggested_users()
returns table (user_id uuid, username text, photo_url text, count bigint)
language sql security definer stable
set search_path = public as $$
  select p.id, p.username, p.photo_url, count(a.id)::bigint
  from profiles p
  join activities a on a.user_id = p.id and a.date >= now() - interval '30 days'
  where auth.uid() is not null
    and p.id <> auth.uid()
    and not is_blocked_between(p.id, auth.uid())
    and not exists (select 1 from friendships f
      where (f.requester_id = auth.uid() and f.addressee_id = p.id)
         or (f.addressee_id = auth.uid() and f.requester_id = p.id))
  group by p.id, p.username, p.photo_url
  order by count(a.id) desc
  limit 5;
$$;
revoke execute on function get_suggested_users() from anon;
