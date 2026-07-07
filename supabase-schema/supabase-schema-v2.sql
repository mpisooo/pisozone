-- ============================================================
-- PisoZone — Schema v2 (multi-utente con Supabase Auth)
-- Esegui nel SQL Editor di Supabase dopo aver:
--   1. Disabilitato "Confirm email" in Authentication > Providers > Email
-- ============================================================

-- Drop vecchie tabelle (se esistono dalla v1)
drop table if exists achievements cascade;
drop table if exists activities   cascade;
drop table if exists profiles     cascade;

-- ── Profiles ────────────────────────────────────────────────
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  name            text,
  birth_date      date,
  height_cm       numeric(5,1),
  weight_kg       numeric(5,1),
  photo_url       text,
  weekly_goal     integer not null default 3,
  sport_preferiti text[]  not null default '{}'
);

-- ── Activities ───────────────────────────────────────────────
create table activities (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  type         text        not null,
  date         timestamptz not null,
  duration_min integer     not null,
  calories     integer,
  distance_km  numeric(8,2),
  notes        text,
  created_at   timestamptz not null default now()
);

create index activities_user_date on activities(user_id, date desc);

-- ── Achievements ─────────────────────────────────────────────
create table achievements (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  medal_key   text        not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, medal_key)
);

-- ── Row Level Security ───────────────────────────────────────
alter table profiles     enable row level security;
alter table activities   enable row level security;
alter table achievements enable row level security;

-- profiles
create policy "select own profile"  on profiles for select using (auth.uid() = id);
create policy "insert own profile"  on profiles for insert with check (auth.uid() = id);
create policy "update own profile"  on profiles for update using (auth.uid() = id);

-- activities
create policy "select own activities" on activities for select using (auth.uid() = user_id);
create policy "insert own activities" on activities for insert with check (auth.uid() = user_id);
create policy "update own activities" on activities for update using (auth.uid() = user_id);
create policy "delete own activities" on activities for delete using (auth.uid() = user_id);

-- achievements
create policy "select own achievements" on achievements for select using (auth.uid() = user_id);
create policy "insert own achievements" on achievements for insert with check (auth.uid() = user_id);

-- ── Trigger: crea profilo automaticamente alla registrazione ─
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, weekly_goal, sport_preferiti)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    3,
    '{}'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Storage: policy per bucket "avatars" ─────────────────────
-- Esegui separatamente se necessario:
create policy "Authenticated users can upload avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

create policy "Authenticated users can update avatars"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars');

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');
