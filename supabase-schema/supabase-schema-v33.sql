-- PisoZone Schema v33 — recupero: riposo, idratazione, sonno (roadmap v2, pilastro 02 punto 5)
-- Tabella recovery_logs: una riga per utente per giorno, tutti i campi
-- facoltativi — rest = giorno di riposo intenzionale (protegge la streak come
-- un freeze, ma è gratuito e dichiarato IL GIORNO STESSO: retrodatarlo
-- svuoterebbe di senso i freeze a crediti; il limite di 2 a settimana è
-- applicato dal client in lib/recovery.ts), water_ml = idratazione del giorno,
-- sleep_hours = ore dormite la notte precedente. NULL = non tracciato, non
-- c'è default che finga un valore mai inserito (stesso principio di rpe/mood).
-- Il cron del promemoria serale legge la tabella col service role per non
-- disturbare chi ha dichiarato riposo.
-- Esegui nel SQL Editor di Supabase.

create table if not exists recovery_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  day         date not null,
  rest        boolean not null default false,
  water_ml    integer,
  sleep_hours numeric(3,1),
  updated_at  timestamptz not null default now(),
  unique (user_id, day)
);

alter table recovery_logs
  add constraint recovery_logs_water_range check (water_ml is null or water_ml between 0 and 20000),
  add constraint recovery_logs_sleep_range check (sleep_hours is null or sleep_hours between 0 and 24);

alter table recovery_logs enable row level security;
create policy "select own recovery_logs" on recovery_logs for select using (auth.uid() = user_id);
create policy "insert own recovery_logs" on recovery_logs for insert with check (auth.uid() = user_id);
create policy "update own recovery_logs" on recovery_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
