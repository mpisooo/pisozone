-- PisoZone Schema v52 — secondi precisi per la corsa inserita a mano: duration_min
-- resta un integer arrotondato al minuto più vicino (usato da calorie/crediti/vincolo
-- esistente, invariato) — questa colonna aggiunge SOLO i secondi totali quando l'utente
-- li inserisce a mano nel form di Log/modifica (corsa, senza GPS): serve il passo esatto
-- per i futuri record personali su distanze standard (1K/5K/10K...), che con soli minuti
-- interi sarebbero imprecisi fino a 59 secondi per chilometro.
-- NOT VALID: si applica da subito a inserimenti/modifiche futuri, senza far fallire la
-- migrazione per righe storiche (che qui non esistono comunque, la colonna è nuova).
-- Esegui nel SQL Editor di Supabase.

alter table activities add column if not exists duration_seconds integer null;

alter table activities
  add constraint activities_duration_seconds_range
  check (duration_seconds is null or (duration_seconds > 0 and duration_seconds <= 86400)) not valid;
