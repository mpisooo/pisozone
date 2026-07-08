-- PisoZone Schema v27 — foto sulle attività nel feed (roadmap punto 13).
-- Esegui nel SQL Editor di Supabase.

-- ── 1. Colonna photo_url sulle attività ─────────────────────────────────────
-- Il client è tollerante: il campo è opzionale nel tipo TS finché la colonna
-- non esiste (stesso pattern di terms_accepted_at / onboarding_seen).
alter table activities add column if not exists photo_url text;

-- ── 2. Bucket "activity-photos" ──────────────────────────────────────────────
-- Pubblico come "avatars": i path contengono UUID non indovinabili e la
-- visibilità nel feed resta governata dalla RLS su activities (photo_url).
-- Limite 5 MB e soli formati immagine (il client comprime in JPEG ~1600px).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('activity-photos', 'activity-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── 3. Policy Storage: ognuno scrive solo nella propria cartella {user_id}/… ─
-- (più strette delle policy storiche di "avatars": lì qualunque autenticato
-- può scrivere ovunque nel bucket)
drop policy if exists "activity_photos_insert" on storage.objects;
create policy "activity_photos_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'activity-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- L'upload con upsert:true fa una UPDATE in caso di conflitto (sostituzione foto)
drop policy if exists "activity_photos_update" on storage.objects;
create policy "activity_photos_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'activity-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'activity-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "activity_photos_delete" on storage.objects;
create policy "activity_photos_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'activity-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "activity_photos_select" on storage.objects;
create policy "activity_photos_select" on storage.objects for select
  using (bucket_id = 'activity-photos');
