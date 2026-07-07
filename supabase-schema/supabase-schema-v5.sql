-- PisoZone Schema v5 — sesso nel profilo
-- Esegui nel SQL Editor di Supabase

alter table profiles
  add column if not exists gender text check (gender in ('male', 'female'));
