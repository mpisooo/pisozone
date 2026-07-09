-- PisoZone Schema v29 — tracciamento GPS del percorso (corsa/bici/camminata)
-- Flag su activities per sapere se un'attività ha un percorso associato, senza
-- interrogare activity_routes ogni volta. Tabella activity_routes: una riga per
-- campione GPS (stesso pattern relazionale di activity_comments/weight_logs,
-- nessun precedente di colonne jsonb in questo schema). Owner-only, nessuna
-- condivisione con amici in questa versione: RLS semplice come weight_logs,
-- niente join su are_friends(). Cade in cascata con l'attività — nessun codice
-- di pulizia da scrivere in useActivities.deleteActivity o api/account/delete.ts.
-- Esegui nel SQL Editor di Supabase.

alter table activities add column if not exists gps_tracked boolean;
update activities set gps_tracked = false where gps_tracked is null;
alter table activities alter column gps_tracked set default false;
alter table activities alter column gps_tracked set not null;

create table if not exists activity_routes (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  seq         integer not null,
  lat         double precision not null,
  lng         double precision not null,
  recorded_at timestamptz not null,
  accuracy_m  numeric(6,1)
);
create index if not exists activity_routes_by_activity on activity_routes(activity_id, seq);

alter table activity_routes
  add constraint activity_routes_lat_range check (lat between -90 and 90),
  add constraint activity_routes_lng_range check (lng between -180 and 180);

alter table activity_routes enable row level security;
create policy "select own activity_routes" on activity_routes for select using (auth.uid() = user_id);
create policy "insert own activity_routes" on activity_routes for insert with check (auth.uid() = user_id);
