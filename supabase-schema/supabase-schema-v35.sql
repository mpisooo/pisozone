-- PisoZone Schema v35 — annuncio "Novità" versionato
-- Colonna sul profilo per il pannello one-shot delle novità (WhatsNewOverlay):
-- ogni "ondata" di funzioni nuove incrementa NEWS_VERSION nel codice; chi ha
-- news_seen_version più basso vede l'annuncio al rientro, poi il valore si
-- allinea. Gli utenti esistenti partono da 0 (vedranno la versione 1); chi
-- completa l'onboarding viene allineato subito (il tour copre già tutto).
-- Stesso pattern one-shot di push_prompt_seen / onboarding_seen.
-- Esegui nel SQL Editor di Supabase.

alter table profiles add column if not exists news_seen_version integer not null default 0;
