-- ── Fix: activity_likes leggibile senza autenticazione ─────────────────────
-- La policy "likes_select" introdotta in v11 usava `using (true)`, pensata per
-- permettere a "tutti" di vedere i like e calcolarne il conteggio nel feed.
-- In pratica "tutti" includeva anche il ruolo anon (nessun login, sola anon
-- key pubblica): chiunque poteva leggere id/activity_id/user_id/created_at di
-- ogni like nel sistema senza autenticarsi. Verificato ed eseguito in
-- produzione il 2026-07-02.
--
-- useFeed.ts interroga già solo le attività proprie e degli amici, quindi
-- restringere la lettura ai soli utenti autenticati non cambia il
-- comportamento dell'app.

drop policy if exists "likes_select" on activity_likes;

create policy "likes_select" on activity_likes
  for select using (auth.uid() is not null);
