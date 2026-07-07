-- PisoZone Schema v3 — esegui nel SQL Editor di Supabase

-- Obiettivo calorico giornaliero nel profilo
alter table profiles add column if not exists daily_calorie_goal integer;

-- Storico pesate
create table if not exists weight_logs (
  id         uuid         primary key default gen_random_uuid(),
  user_id    uuid         not null references auth.users(id) on delete cascade,
  weight_kg  numeric(5,1) not null,
  logged_at  date         not null default current_date
);

create index if not exists weight_logs_user_date on weight_logs(user_id, logged_at desc);

alter table weight_logs enable row level security;
create policy "select own weight_logs" on weight_logs for select using (auth.uid() = user_id);
create policy "insert own weight_logs" on weight_logs for insert with check (auth.uid() = user_id);
create policy "delete own weight_logs" on weight_logs for delete using (auth.uid() = user_id);
