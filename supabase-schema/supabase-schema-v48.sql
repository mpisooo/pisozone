-- PisoZone Schema v48 — palestra da veterano (roadmap v4, pilastro 03):
-- routine salvate e riutilizzabili, superset/drop set. Il calcolatore piastre
-- e il timer di recupero sono client-only, senza persistenza (nessuna riga
-- qui sotto per loro). Esegui nel SQL Editor di Supabase (richiede v32 per
-- exercise_sets).

-- ── Superset e drop set ──
-- Un blocco di exercise_sets può appartenere a un gruppo (group_id condiviso
-- da 2+ righe consecutive create nella stessa sessione): set_type distingue
-- "drop set" (stesso esercizio, carico che scende) da "superset" (esercizi
-- diversi in successione), inferito lato client dal nome, mai imposto qui.

alter table exercise_sets add column if not exists group_id uuid;
alter table exercise_sets add column if not exists set_type text;

alter table exercise_sets drop constraint if exists exercise_sets_set_type_valid;
alter table exercise_sets add constraint exercise_sets_set_type_valid
  check (set_type is null or set_type in ('superset', 'dropset'));

-- ── Routine salvate e riutilizzabili ──
-- Un template con nome + lista ordinata di blocchi (stessa forma di
-- exercise_sets: esercizio + serie × ripetizioni @ carico), MAI collegato a
-- un'attività: si "parte" da una routine per precompilare il log palestra in
-- Log.tsx, poi si salva come al solito su exercise_sets. Owner-only, NO
-- update (si cancella e ricrea, pattern personal_goals/route_segments).

create table if not exists workout_routines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

alter table workout_routines
  add constraint workout_routines_name_len check (char_length(name) between 1 and 60);

create index if not exists workout_routines_by_user on workout_routines(user_id, created_at desc);

alter table workout_routines enable row level security;
create policy "select own workout_routines" on workout_routines for select using (auth.uid() = user_id);
create policy "insert own workout_routines" on workout_routines for insert with check (auth.uid() = user_id);
create policy "delete own workout_routines" on workout_routines for delete using (auth.uid() = user_id);

create table if not exists workout_routine_exercises (
  id         uuid primary key default gen_random_uuid(),
  routine_id uuid not null references workout_routines(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  seq        integer not null,
  exercise   text not null,
  sets       integer not null,
  reps       integer not null,
  weight_kg  numeric(6,2)
);

-- Stessi limiti della migrazione v32 per exercise_sets: il client non deve
-- mai produrre per una routine una riga che exercise_sets rifiuterebbe una
-- volta avviata come attività vera.
alter table workout_routine_exercises
  add constraint workout_routine_exercises_name_len check (char_length(exercise) between 1 and 60),
  add constraint workout_routine_exercises_sets_range check (sets between 1 and 99),
  add constraint workout_routine_exercises_reps_range check (reps between 1 and 999),
  add constraint workout_routine_exercises_weight_positive check (weight_kg is null or weight_kg > 0);

create index if not exists workout_routine_exercises_by_routine on workout_routine_exercises(routine_id, seq);

alter table workout_routine_exercises enable row level security;
create policy "select own workout_routine_exercises" on workout_routine_exercises for select using (auth.uid() = user_id);
create policy "insert own workout_routine_exercises" on workout_routine_exercises for insert with check (
  auth.uid() = user_id
  and exists (select 1 from workout_routines wr where wr.id = routine_id and wr.user_id = auth.uid())
);
create policy "delete own workout_routine_exercises" on workout_routine_exercises for delete using (auth.uid() = user_id);
