-- PisoZone Schema v17 — documenta la tabella "friendships" nello schema versionato
-- La tabella esiste già sul database (creata manualmente fuori versione, con RLS
-- correttamente abilitata e policy proprie: verificato con
--   select relrowsecurity from pg_class where relname = 'friendships';        -> true
--   select policyname, cmd, qual from pg_policies where tablename='friendships';
-- Questo script non cambia nulla di funzionante: usa IF NOT EXISTS / ripropone le
-- stesse policy già presenti, solo per rendere lo schema riproducibile da zero.
-- Esegui nel SQL Editor di Supabase.

create table if not exists friendships (
  id            uuid        primary key default gen_random_uuid(),
  requester_id  uuid        not null references auth.users(id) on delete cascade,
  addressee_id  uuid        not null references auth.users(id) on delete cascade,
  status        text        not null default 'pending' check (status in ('pending', 'accepted')),
  created_at    timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

create index if not exists friendships_requester on friendships(requester_id);
create index if not exists friendships_addressee on friendships(addressee_id);

alter table friendships enable row level security;

drop policy if exists "friendships_select" on friendships;
create policy "friendships_select" on friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "friendships_insert" on friendships;
create policy "friendships_insert" on friendships
  for insert with check (auth.uid() = requester_id);

drop policy if exists "friendships_update" on friendships;
create policy "friendships_update" on friendships
  for update using (auth.uid() = addressee_id);

drop policy if exists "friendships_delete" on friendships;
create policy "friendships_delete" on friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);
