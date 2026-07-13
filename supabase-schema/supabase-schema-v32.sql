-- PisoZone Schema v32 — log palestra strutturato (roadmap v2, pilastro 02 punto 1)
-- Tabella exercise_sets: una riga per "blocco" di lavoro di una sessione in
-- palestra — esercizio + serie × ripetizioni allo stesso carico. weight_kg
-- NULL = esercizio a corpo libero (trazioni, plank...), non un peso ignoto.
-- Stesso pattern relazionale di activity_routes: owner-only, cascata da
-- activities (niente pulizia manuale in deleteActivity / api/account/delete.ts).
-- A differenza di activity_routes qui c'è anche la policy di DELETE: la
-- modifica dal client è delete+reinsert dell'intero blocco (i punti GPS sono
-- immutabili, gli esercizi no).
-- Esegui nel SQL Editor di Supabase.

create table if not exists exercise_sets (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  seq         integer not null,
  exercise    text not null,
  sets        smallint not null,
  reps        smallint not null,
  weight_kg   numeric(6,2)
);
create index if not exists exercise_sets_by_activity on exercise_sets(activity_id, seq);
-- Per lo storico completo dell'utente (mappa dei PR + suggerimenti nomi)
create index if not exists exercise_sets_by_user on exercise_sets(user_id);

alter table exercise_sets
  add constraint exercise_sets_exercise_len check (char_length(exercise) between 1 and 60),
  add constraint exercise_sets_sets_range   check (sets between 1 and 99),
  add constraint exercise_sets_reps_range   check (reps between 1 and 999),
  add constraint exercise_sets_weight_range check (weight_kg is null or (weight_kg > 0 and weight_kg <= 1000));

alter table exercise_sets enable row level security;
create policy "select own exercise_sets" on exercise_sets for select using (auth.uid() = user_id);
create policy "insert own exercise_sets" on exercise_sets for insert with check (auth.uid() = user_id);
create policy "delete own exercise_sets" on exercise_sets for delete using (auth.uid() = user_id);
