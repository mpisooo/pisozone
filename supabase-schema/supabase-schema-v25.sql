-- PisoZone Schema v25 — onboarding per i nuovi utenti
-- Flag sul profilo: i nuovi account nascono con false e vedono il tour guidato
-- al primo accesso; gli account esistenti vengono marcati true (conoscono già
-- l'app). Stesso pattern di push_prompt_seen (v20) e terms_accepted_at (v21):
-- finché la colonna non esiste il client non mostra nulla.
-- Esegui nel SQL Editor di Supabase.

alter table profiles
  add column if not exists onboarding_seen boolean;

-- Gli utenti esistenti non devono vedere il tour
update profiles set onboarding_seen = true where onboarding_seen is null;

alter table profiles alter column onboarding_seen set default false;
alter table profiles alter column onboarding_seen set not null;
