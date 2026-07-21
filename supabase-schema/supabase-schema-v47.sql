-- PisoZone Schema v47 — segmenti personali, percorsi preferiti, sfide di
-- percorso tra amici (roadmap v4, pilastro 02, punti 1/3/2 — chiude il
-- pilastro insieme alla heatmap di v46). Esegui nel SQL Editor di Supabase
-- (richiede v37 per duels, v29 per activity_routes).
--
-- ── Percorsi preferiti ──
-- Marcato a mano dall'utente in un secondo momento (mai in fase di
-- creazione): nessuna colonna aggiuntiva altrove, solo un filtro nel Calendario.

alter table activities add column if not exists is_favorite boolean not null default false;

-- ── Segmenti personali ──
-- Tratto scelto a mano su un percorso già registrato (due punti lungo la
-- traccia). Mai una classifica pubblica: proprietario-solo, come
-- personal_goals — si modifica cancellando e ricreando, nessuna policy UPDATE.

create table if not exists route_segments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  name          text not null,
  activity_type text not null,
  start_lat     numeric not null,
  start_lng     numeric not null,
  end_lat       numeric not null,
  end_lng       numeric not null,
  distance_m    numeric not null,
  created_at    timestamptz not null default now()
);

alter table route_segments
  add constraint route_segments_type_valid check (activity_type in ('corsa', 'bici', 'camminata', 'trekking')),
  add constraint route_segments_name_len check (char_length(name) between 1 and 60),
  add constraint route_segments_distance_positive check (distance_m > 0),
  add constraint route_segments_start_lat_range check (start_lat between -90 and 90),
  add constraint route_segments_start_lng_range check (start_lng between -180 and 180),
  add constraint route_segments_end_lat_range check (end_lat between -90 and 90),
  add constraint route_segments_end_lng_range check (end_lng between -180 and 180);

create index if not exists route_segments_by_user on route_segments(user_id, created_at desc);

alter table route_segments enable row level security;
create policy "select own route_segments" on route_segments for select using (auth.uid() = user_id);
create policy "insert own route_segments" on route_segments for insert with check (auth.uid() = user_id);

-- Non si può eliminare un segmento referenziato da una sfida ancora aperta:
-- l'avversario perderebbe il senso del bersaglio a metà sfida. Raise
-- esplicito (non un silenzioso "0 righe"), stesso principio delle altre
-- guardie del progetto (guard_duel_update, guard_notification_update).
create or replace function guard_segment_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from duels where segment_id = old.id and status in ('pending', 'active')) then
    raise exception 'SEGMENT_HAS_ACTIVE_DUEL';
  end if;
  return old;
end;
$$;

drop trigger if exists on_segment_delete on route_segments;
create trigger on_segment_delete before delete on route_segments
  for each row execute function guard_segment_delete();

create policy "delete own route_segments" on route_segments for delete using (auth.uid() = user_id);

-- ── Sfide di percorso tra amici: estende duels con un metric 'segment_time' ──
-- Solo 1v1 (mai di gruppo: farsi trovare tutti sullo stesso tratto di strada
-- non è realistico). Le coordinate del segmento sono COPIATE sul duello,
-- non referenziate a runtime: l'avversario non ha una policy SELECT su
-- route_segments del creatore (owner-only), quindi senza questa copia non
-- saprebbe dove andare a correre. Va PRIMA di segment_attempts qui sotto: la
-- sua policy insert legge duels.segment_id, che deve già esistere.

alter table duels add column if not exists segment_id uuid references route_segments(id);
alter table duels add column if not exists segment_name text;
alter table duels add column if not exists segment_activity_type text;
alter table duels add column if not exists segment_start_lat numeric;
alter table duels add column if not exists segment_start_lng numeric;
alter table duels add column if not exists segment_end_lat numeric;
alter table duels add column if not exists segment_end_lng numeric;
alter table duels add column if not exists segment_distance_m numeric;

alter table duels drop constraint if exists duels_metric_valid;
alter table duels add constraint duels_metric_valid
  check (metric in ('sessions', 'minutes', 'km', 'kcal', 'segment_time'));

alter table duels drop constraint if exists duels_segment_valid;
alter table duels add constraint duels_segment_valid check (
  metric <> 'segment_time' or (group_id is null and segment_id is not null)
);

-- Sostituisce la policy v37: aggiunge solo la verifica che, per una sfida di
-- percorso, il segmento referenziato appartenga davvero a chi la crea.
drop policy if exists "insert own duels" on duels;
create policy "insert own duels" on duels for insert with check (
  auth.uid() = creator_id
  and winner_id is null and credits_earned = 0
  and starts_on between current_date - 1 and current_date + 1
  and (metric <> 'segment_time' or exists (
    select 1 from route_segments rs where rs.id = segment_id and rs.user_id = creator_id
  ))
  and (
    (opponent_id is not null and status = 'pending'
      and not is_blocked_between(creator_id, opponent_id)
      and exists (select 1 from friendships f where f.status = 'accepted'
        and ((f.requester_id = creator_id and f.addressee_id = opponent_id)
          or (f.addressee_id = creator_id and f.requester_id = opponent_id))))
    or (group_id is not null and status = 'active' and is_group_member(group_id, auth.uid()))
  )
);

-- ── Tentativi su un segmento ──
-- Un tempo rilevato dal GPS di un'attività, propria o (per l'avversario di
-- una sfida di percorso) su un segmento posseduto dal creatore ma
-- referenziato da un duello a cui si partecipa.

create table if not exists segment_attempts (
  id           uuid primary key default gen_random_uuid(),
  segment_id   uuid not null references route_segments(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  activity_id  uuid not null references activities(id) on delete cascade,
  time_seconds numeric not null,
  created_at   timestamptz not null default now()
);

alter table segment_attempts add constraint segment_attempts_time_positive check (time_seconds > 0);
create index if not exists segment_attempts_by_segment on segment_attempts(segment_id, user_id, time_seconds);

alter table segment_attempts enable row level security;
create policy "select own segment_attempts" on segment_attempts for select using (auth.uid() = user_id);

-- Ammesso su un proprio segmento, oppure su un segmento referenziato da un
-- duello segment_time a cui si partecipa (pending o active): è così che
-- l'avversario, che non possiede route_segments.id, registra comunque il
-- proprio tentativo sullo stesso bersaglio fisico.
create policy "insert own segment_attempts" on segment_attempts for insert with check (
  auth.uid() = user_id
  and (
    exists (select 1 from route_segments rs where rs.id = segment_id and rs.user_id = auth.uid())
    or exists (select 1 from duels d where d.segment_id = segment_attempts.segment_id
      and d.status in ('pending', 'active')
      and (auth.uid() = d.creator_id or auth.uid() = d.opponent_id))
  )
);

-- get_duel_progress (v37) estesa: per segment_time il valore non è un
-- aggregato di activities ma il tempo migliore (minimo) su segment_attempts,
-- e resta NULL (mai 0, che sembrerebbe un tempo perfetto) se il partecipante
-- non ha ancora un tentativo nella finestra. L'ordinamento cambia direzione
-- SOLO per questo metric: più basso è meglio, non più alto.
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
      (case when d.metric = 'segment_time' then (
        select min(sa.time_seconds) from segment_attempts sa
        join activities a on a.id = sa.activity_id
        where sa.segment_id = d.segment_id and sa.user_id = p.id
          and a.date::date between d.starts_on and d.ends_on
      )
      else coalesce((
        select case d.metric
          when 'sessions' then count(a.id)::numeric
          when 'minutes'  then coalesce(sum(a.duration_min), 0)::numeric
          when 'km'       then coalesce(sum(a.distance_km), 0)::numeric
          else                 coalesce(sum(a.calories), 0)::numeric
        end
        from activities a
        where a.user_id = p.id and a.date::date between d.starts_on and d.ends_on
      ), 0)
      end) as value
    from participants pa
    join profiles p on p.id = pa.uid
    order by
      case when d.metric = 'segment_time' then value end asc nulls last,
      case when d.metric <> 'segment_time' then value end desc nulls last;
end;
$$;
