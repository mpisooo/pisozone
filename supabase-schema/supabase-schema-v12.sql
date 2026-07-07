-- PisoZone Schema v12 — crediti guadagnati per attività registrate
-- 1 credito ogni 10 minuti di attività (arrotondato per difetto)
-- Esegui nel SQL Editor di Supabase

alter table activities add column if not exists credits_earned integer not null default 0;

-- Calcola credits_earned dalla durata prima di ogni insert/update della durata
create or replace function compute_activity_credits()
returns trigger language plpgsql as $$
begin
  new.credits_earned := floor(new.duration_min / 10.0)::int;
  return new;
end;
$$;

drop trigger if exists on_activity_credits_compute on activities;
create trigger on_activity_credits_compute
  before insert or update of duration_min on activities
  for each row execute function compute_activity_credits();

-- Sincronizza il saldo crediti del profilo con credits_earned dell'attività
create or replace function sync_activity_credits()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update profiles set credits = credits + new.credits_earned where id = new.user_id;
  elsif tg_op = 'UPDATE' then
    if new.credits_earned <> old.credits_earned then
      update profiles set credits = credits + (new.credits_earned - old.credits_earned) where id = new.user_id;
    end if;
  elsif tg_op = 'DELETE' then
    update profiles set credits = greatest(0, credits - old.credits_earned) where id = old.user_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_activity_credits_sync on activities;
create trigger on_activity_credits_sync
  after insert or update of duration_min or delete on activities
  for each row execute function sync_activity_credits();

-- Backfill: assegna crediti per le attività già registrate prima di questa migrazione
update activities set credits_earned = floor(duration_min / 10.0)::int;

update profiles p
set credits = p.credits + coalesce(a.total, 0)
from (
  select user_id, sum(credits_earned) as total
  from activities
  group by user_id
) a
where a.user_id = p.id;
