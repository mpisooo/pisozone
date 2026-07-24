-- PisoZone Schema v53 — blocco riposo in un giorno con attività già registrate
-- (audit tecnico del 24/07/2026, P0-4). Decisione prodotto: bloccare a monte,
-- non un "riposo consapevole" con conferma — un giorno con attività non è un
-- giorno di riposo. Il client (lib/recovery.ts, canMarkRest) già impedisce il
-- tocco dalla UI; questo trigger è la seconda linea di difesa lato DB (bypass
-- diretto, corsa tra dispositivi) — stesso principio di guard_segment_delete
-- (v47) e guard_last_admin_removal (v49). Esegui nel SQL Editor di Supabase.

create or replace function guard_rest_activity_conflict()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.rest and exists (
    select 1 from activities
    where user_id = new.user_id
      and (date at time zone 'Europe/Rome')::date = new.day
  ) then
    raise exception 'REST_HAS_ACTIVITY';
  end if;
  return new;
end;
$$;

drop trigger if exists on_recovery_log_rest_conflict on recovery_logs;
create trigger on_recovery_log_rest_conflict before insert or update on recovery_logs
  for each row execute function guard_rest_activity_conflict();
