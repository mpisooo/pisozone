-- PisoZone Schema v31 — reazioni e kudos sul feed (roadmap v2, pilastro 03 punto 1).
-- Il like binario di v11 diventa una reazione tipizzata: la colonna `kind`
-- distingue 5 reazioni; le righe esistenti restano valide col default 'heart'
-- (i vecchi ❤️ non si perdono). Resta UNA sola reazione per utente per
-- attività (unique v11 invariato): cambiare reazione = upsert sulla stessa
-- riga, per cui serve la policy di UPDATE che v11 non aveva.
-- Esegui nel SQL Editor di Supabase.

alter table activity_likes add column if not exists kind text not null default 'heart';

alter table activity_likes drop constraint if exists activity_likes_kind_check;
alter table activity_likes add constraint activity_likes_kind_check
  check (kind in ('heart', 'muscle', 'fire', 'clap', 'rocket'));

-- Cambio reazione via upsert: ognuno può aggiornare solo la propria riga
-- (insert e delete restano quelle di v11).
drop policy if exists "likes_update" on activity_likes;
create policy "likes_update" on activity_likes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
