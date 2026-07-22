-- PisoZone Schema v51 — Roadmap v8, pilastro 03 "Si ricorda": galleria
-- multi-foto per attività. activities.photo_url (v27) resta invariato come
-- copertina/prima foto — nessun punto del codice che lo legge oggi (feed,
-- card, notifiche) va toccato. Questa tabella copre SOLO le foto aggiuntive
-- della galleria. Stesso pattern relazionale di activity_routes (v29):
-- owner-only, cade in cascata con l'attività — ma con policy DELETE, perché
-- qui (a differenza dei punti GPS) l'utente rimuove singole foto dalla
-- galleria senza toccare il resto. Nessun nuovo bucket Storage: le policy di
-- storage.objects su "activity-photos" (v27) controllano solo il primo
-- segmento del path ({user_id}/...), quindi il path a due livelli usato qui
-- ({user_id}/{activity_id}/{photo_id}.jpg) è già ammesso.
-- Esegui nel SQL Editor di Supabase.

create table if not exists activity_photos (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  url         text not null,
  seq         integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists activity_photos_by_activity on activity_photos(activity_id, seq);

alter table activity_photos enable row level security;
create policy "select own activity_photos" on activity_photos for select using (auth.uid() = user_id);
create policy "insert own activity_photos" on activity_photos for insert with check (auth.uid() = user_id);
create policy "delete own activity_photos" on activity_photos for delete using (auth.uid() = user_id);
