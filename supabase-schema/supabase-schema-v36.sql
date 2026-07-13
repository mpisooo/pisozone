-- PisoZone Schema v36 — obiettivi personali flessibili (roadmap v2, pilastro 04)
-- Tabella personal_goals: mete libere scelte dall'utente ("100 km di corsa
-- questo mese", "20 sessioni di palestra") — metrica + traguardo + sport
-- opzionale + finestra di date. L'avanzamento NON è persistito: si deriva
-- dalle attività registrate (lib/goals.ts), come per i programmi (v34).
-- NIENTE crediti al raggiungimento, per scelta: un obiettivo auto-imposto
-- sarebbe truccabile (basterebbe fissarlo banale) — la ricompensa è la barra
-- piena. Niente policy di UPDATE: si modifica cancellando e ricreando.
-- Esegui nel SQL Editor di Supabase.

create table if not exists personal_goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  metric        text not null,
  target        numeric(8,1) not null,
  activity_type text,          -- null = tutti gli sport
  starts_on     date not null,
  ends_on       date not null,
  created_at    timestamptz not null default now()
);

create index if not exists personal_goals_by_user on personal_goals(user_id, ends_on desc);

alter table personal_goals
  add constraint personal_goals_metric_valid check (metric in ('sessions', 'minutes', 'km', 'kcal')),
  add constraint personal_goals_target_positive check (target > 0),
  add constraint personal_goals_window_valid check (ends_on >= starts_on),
  add constraint personal_goals_type_len check (activity_type is null or char_length(activity_type) between 1 and 30);

alter table personal_goals enable row level security;
create policy "select own personal_goals" on personal_goals for select using (auth.uid() = user_id);
create policy "insert own personal_goals" on personal_goals for insert with check (auth.uid() = user_id);
create policy "delete own personal_goals" on personal_goals for delete using (auth.uid() = user_id);
