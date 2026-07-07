-- PisoZone Schema v4 — sfide giornaliere e crediti
-- Esegui nel SQL Editor di Supabase

-- Colonna crediti nel profilo (default 0)
alter table profiles add column if not exists credits integer not null default 0;

-- Tabella completamenti sfide giornaliere
create table if not exists daily_challenge_completions (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  challenge_date date        not null,
  challenge_key  text        not null,
  credits_earned integer     not null,
  completed_at   timestamptz not null default now(),
  unique(user_id, challenge_date, challenge_key)
);

create index if not exists dcc_user_date
  on daily_challenge_completions(user_id, challenge_date desc);

alter table daily_challenge_completions enable row level security;

create policy "Utenti gestiscono i propri completamenti"
  on daily_challenge_completions
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: assegna crediti al profilo ad ogni completamento
create or replace function award_challenge_credits()
returns trigger language plpgsql security definer as $$
begin
  update profiles
  set credits = credits + new.credits_earned
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_challenge_completion on daily_challenge_completions;
create trigger on_challenge_completion
  after insert on daily_challenge_completions
  for each row execute function award_challenge_credits();
