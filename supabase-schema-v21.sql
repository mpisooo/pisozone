-- ── Consenso Privacy Policy / Termini di Servizio (GDPR) ───────────────────
-- Gli utenti esistenti restano a NULL → alla prossima apertura l'app mostra
-- un blocco non dismissibile finché non accettano le condizioni.
-- I nuovi profili nascono con now(): la registrazione richiede già la spunta
-- obbligatoria di Privacy Policy e Termini di Servizio.

alter table profiles
  add column if not exists terms_accepted_at timestamptz;

-- Il default va impostato DOPO l'add: così le righe esistenti restano NULL
-- e solo i profili creati d'ora in poi ricevono now().
alter table profiles
  alter column terms_accepted_at set default now();
