-- PisoZone Schema v26 — feed social maturo: commenti, blocco/segnalazione
-- utenti e classifica globale (roadmap punto 11).
-- Esegui nel SQL Editor di Supabase.

-- ── 1. Blocchi tra utenti ───────────────────────────────────────────────────
create table if not exists user_blocks (
  id         uuid        primary key default gen_random_uuid(),
  blocker_id uuid        not null references auth.users(id) on delete cascade,
  blocked_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table user_blocks enable row level security;

-- Ognuno vede e gestisce solo i propri blocchi (chi è bloccato non lo sa)
drop policy if exists "blocks_select" on user_blocks;
create policy "blocks_select" on user_blocks for select using (auth.uid() = blocker_id);
drop policy if exists "blocks_insert" on user_blocks;
create policy "blocks_insert" on user_blocks for insert with check (auth.uid() = blocker_id);
drop policy if exists "blocks_delete" on user_blocks;
create policy "blocks_delete" on user_blocks for delete using (auth.uid() = blocker_id);

-- Helper security definer: le policy di altre tabelle possono controllare i
-- blocchi senza incappare nella RLS di user_blocks (che nasconde i blocchi altrui).
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from user_blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- Un utente bloccato non può più mandare messaggi né richieste di amicizia
drop policy if exists "send message" on messages;
create policy "send message" on messages for insert
  with check (
    sender_id = auth.uid()
    and not is_blocked_between(sender_id, receiver_id)
  );

drop policy if exists "friendships_insert" on friendships;
create policy "friendships_insert" on friendships for insert
  with check (
    auth.uid() = requester_id
    and not is_blocked_between(requester_id, addressee_id)
  );

-- ── 2. Segnalazioni ────────────────────────────────────────────────────────
-- Solo insert dal client: si leggono dalla dashboard Supabase (service role).
create table if not exists user_reports (
  id          uuid        primary key default gen_random_uuid(),
  reporter_id uuid        not null references auth.users(id) on delete cascade,
  reported_id uuid        not null references auth.users(id) on delete cascade,
  reason      text        not null,
  created_at  timestamptz not null default now()
);

alter table user_reports enable row level security;

drop policy if exists "reports_insert" on user_reports;
create policy "reports_insert" on user_reports for insert
  with check (auth.uid() = reporter_id and reporter_id <> reported_id);

-- Anti-spam sulle segnalazioni (riusa il trigger v24)
drop trigger if exists user_reports_rate_limit on user_reports;
create trigger user_reports_rate_limit
  before insert on user_reports
  for each row execute function enforce_insert_rate_limit('reporter_id', '1 hour', '10');

-- ── 3. Commenti sulle attività ─────────────────────────────────────────────
create table if not exists activity_comments (
  id          uuid        primary key default gen_random_uuid(),
  activity_id uuid        not null references activities(id) on delete cascade,
  user_id     uuid        not null references profiles(id) on delete cascade,
  content     text        not null check (char_length(content) between 1 and 500),
  created_at  timestamptz not null default now()
);

create index if not exists activity_comments_by_activity
  on activity_comments (activity_id, created_at);

alter table activity_comments enable row level security;

-- Helper: amicizia accettata tra due utenti (security definer, riusabile)
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

-- Vede/commenta chi può vedere l'attività (proprietario o suo amico),
-- senza blocchi in mezzo tra chi guarda e l'autore del commento.
drop policy if exists "comments_select" on activity_comments;
create policy "comments_select" on activity_comments for select
  using (
    exists (
      select 1 from activities a
      where a.id = activity_id
        and (a.user_id = auth.uid() or are_friends(a.user_id, auth.uid()))
    )
    and not is_blocked_between(user_id, auth.uid())
  );

drop policy if exists "comments_insert" on activity_comments;
create policy "comments_insert" on activity_comments for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from activities a
      where a.id = activity_id
        and (a.user_id = auth.uid() or are_friends(a.user_id, auth.uid()))
        and not is_blocked_between(a.user_id, auth.uid())
    )
  );

-- Cancella: l'autore del commento, oppure il proprietario dell'attività
-- (moderazione della propria bacheca)
drop policy if exists "comments_delete" on activity_comments;
create policy "comments_delete" on activity_comments for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from activities a where a.id = activity_id and a.user_id = auth.uid())
  );

-- Anti-spam sui commenti (stesse infrastrutture v24)
drop trigger if exists activity_comments_rate_limit on activity_comments;
create trigger activity_comments_rate_limit
  before insert on activity_comments
  for each row execute function enforce_insert_rate_limit('user_id', '1 minute', '10', '1 hour', '150');

-- ── 4. Classifica globale settimanale ──────────────────────────────────────
-- La RLS impedisce di leggere le attività degli sconosciuti: la classifica
-- globale espone SOLO aggregati settimanali (conteggio/minuti/calorie) via
-- funzione security definer, mai le attività grezze.
create or replace function public.get_global_leaderboard(p_start timestamptz)
returns table (
  user_id uuid,
  username text,
  photo_url text,
  calories bigint,
  minutes bigint,
  count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.username, p.photo_url,
         coalesce(sum(a.calories), 0)::bigint,
         coalesce(sum(a.duration_min), 0)::bigint,
         count(a.id)::bigint
  from profiles p
  join activities a on a.user_id = p.id and a.date >= p_start
  where auth.uid() is not null
    and not is_blocked_between(p.id, auth.uid())
  group by p.id, p.username, p.photo_url
  order by coalesce(sum(a.calories), 0) desc
  limit 50;
$$;

revoke execute on function public.get_global_leaderboard(timestamptz) from anon;
