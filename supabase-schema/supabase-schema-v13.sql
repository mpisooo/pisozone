-- PisoZone Schema v13 — crediti per medaglie sbloccate
-- Importi modesti per tier, coerenti con i crediti delle sfide giornaliere (15-50)
-- Esegui nel SQL Editor di Supabase

alter table achievements add column if not exists credits_earned integer not null default 0;

-- Trigger: assegna crediti al profilo ad ogni nuova medaglia sbloccata
create or replace function award_achievement_credits()
returns trigger language plpgsql security definer as $$
begin
  update profiles
  set credits = credits + new.credits_earned
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_achievement_unlock on achievements;
create trigger on_achievement_unlock
  after insert on achievements
  for each row execute function award_achievement_credits();
