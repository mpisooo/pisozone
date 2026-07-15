-- PisoZone Schema v41 — permette di eliminare le proprie notifiche (v40).
-- Esegui nel SQL Editor di Supabase (richiede v40 già applicata).
--
-- Il centro notifiche era pensato come sola lettura (leggi + segna letta);
-- serve anche poter nascondere singole notifiche indesiderate o svuotare
-- tutta la lista. A differenza dell'update (guardato dal trigger
-- guard_notification_update per restare immutabile), la delete non protegge
-- nulla: cancellare la propria cronologia è una scelta legittima dell'utente,
-- non un modo per falsificare crediti o classifiche.

drop policy if exists "delete own notifications" on notifications;
create policy "delete own notifications" on notifications for delete
  using (auth.uid() = user_id);
