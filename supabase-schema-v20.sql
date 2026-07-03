-- ── Prompt notifiche push per utenti esistenti ─────────────────────────────
-- Gli account creati prima dell'introduzione delle push (v19) non sanno che
-- esistono. Aggiunge un flag per mostrare una volta sola, in Home, una scelta
-- esplicita (attiva/non ora) — poi non si ripresenta più, a prescindere dalla
-- risposta.

alter table profiles
  add column if not exists push_prompt_seen boolean not null default false;
