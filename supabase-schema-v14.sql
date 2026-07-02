-- PisoZone Schema v14 — tetto giornaliero ai crediti guadagnati dalle attività
-- Max 10 crediti/giorno dai minuti di attività registrata (evita abusi con durate esagerate)
-- Esegui nel SQL Editor di Supabase (richiede v12 già applicata)

create or replace function compute_activity_credits()
returns trigger language plpgsql as $$
declare
  day_start    timestamptz;
  day_end      timestamptz;
  earned_today int;
  raw_credits  int;
  remaining    int;
begin
  day_start := date_trunc('day', new.date);
  day_end   := day_start + interval '1 day';

  select coalesce(sum(credits_earned), 0) into earned_today
  from activities
  where user_id = new.user_id
    and date >= day_start and date < day_end
    and id <> new.id;

  raw_credits := floor(new.duration_min / 10.0)::int;
  remaining   := greatest(0, 10 - earned_today);
  new.credits_earned := least(raw_credits, remaining);

  return new;
end;
$$;

drop trigger if exists on_activity_credits_compute on activities;
create trigger on_activity_credits_compute
  before insert or update of duration_min, date on activities
  for each row execute function compute_activity_credits();

drop trigger if exists on_activity_credits_sync on activities;
create trigger on_activity_credits_sync
  after insert or update of duration_min, date or delete on activities
  for each row execute function sync_activity_credits();

-- Ricalcola retroattivamente i crediti applicando il tetto giornaliero alle attività esistenti.
-- Snapshot in una tabella temporanea, così le due update successive leggono sempre i valori
-- "prima" e "dopo" corretti invece di rincorrersi a vicenda.
drop table if exists _credit_recalc;
create temporary table _credit_recalc as
select
  a.id,
  a.user_id,
  a.credits_earned as old_credits,
  least(
    floor(a.duration_min / 10.0)::int,
    greatest(0, 10 - coalesce(sum(floor(a.duration_min / 10.0)::int) over (
      partition by a.user_id, date_trunc('day', a.date)
      order by a.created_at
      rows between unbounded preceding and 1 preceding
    ), 0))
  ) as new_credits
from activities a;

update activities a
set credits_earned = r.new_credits
from _credit_recalc r
where a.id = r.id and a.credits_earned <> r.new_credits;

update profiles p
set credits = greatest(0, p.credits - adj.total_reduction)
from (
  select user_id, sum(old_credits - new_credits) as total_reduction
  from _credit_recalc
  group by user_id
) adj
where adj.user_id = p.id and adj.total_reduction <> 0;

drop table if exists _credit_recalc;
