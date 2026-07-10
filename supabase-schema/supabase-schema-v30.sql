-- PisoZone Schema v30 — metriche percepite (RPE, umore/energia)
-- roadmap v2, pilastro 02 punto 2. Due colonne opzionali su activities,
-- entrambe nullable per sempre (non "nullable finché non compilate": non
-- ogni attività ha senso valutarla, l'utente può sempre lasciarle vuote).
-- Nessun backfill: le attività esistenti restano NULL.
-- rpe: sforzo percepito 1-10 (scala Borg CR10, coerente con lo slider in
-- Log.tsx/ActivityEditModal.tsx). mood: umore/energia post-sessione 1-5.
-- Esegui nel SQL Editor di Supabase.

alter table activities
  add column if not exists rpe smallint,
  add column if not exists mood smallint;

alter table activities
  add constraint activities_rpe_range check (rpe is null or rpe between 1 and 10),
  add constraint activities_mood_range check (mood is null or mood between 1 and 5);
