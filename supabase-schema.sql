-- Esegui questo script nel SQL Editor di Supabase
-- supabase.com > tuo progetto > SQL Editor

-- Profilo utente (uso personale: un solo record con id = 'demo-user')
create table if not exists profiles (
  id          text primary key default 'demo-user',
  name        text not null default 'Atleta',
  birth_date  date,
  height_cm   numeric(5,1),
  weight_kg   numeric(5,1),
  photo_url   text,
  weekly_goal integer not null default 3
);

-- Attività fisiche
create table if not exists activities (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null default 'demo-user',
  type         text not null,
  date         timestamptz not null,
  duration_min integer not null,
  calories     integer,
  distance_km  numeric(8,2),
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists activities_user_date on activities(user_id, date desc);

-- Medaglie sbloccate
create table if not exists achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null default 'demo-user',
  medal_key   text not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, medal_key)
);

-- Row Level Security: disabilita per uso personale (demo-user)
-- Se vuoi autenticazione multi-utente, abilita RLS e crea policy.
alter table profiles    disable row level security;
alter table activities  disable row level security;
alter table achievements disable row level security;

-- Bucket per le foto profilo
-- Crea manualmente su: Storage > New bucket > nome: "avatars" > Public: true
