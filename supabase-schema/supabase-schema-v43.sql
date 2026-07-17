-- PisoZone Schema v43 — obiettivo peso con proiezione (roadmap v3,
-- pilastro 02 punto 5). Esegui nel SQL Editor di Supabase.
--
-- Meta di peso scelta dall'utente, affiancata allo storico pesate
-- (weight_logs): trend e data prevista di raggiungimento sono CALCOLATI dal
-- client (lib/weightTrend.ts, regressione sulle pesate recenti), qui si
-- persiste solo il traguardo. Nullable per sempre: nessun default che finga
-- un obiettivo mai scelto. Nessun dato più sensibile di weight_kg, già
-- presente su profiles con le stesse policy.
--
-- Il client è tollerante pre-migrazione: campo opzionale nel tipo Profile,
-- la UI dell'obiettivo compare solo quando la colonna esiste e il campo non
-- entra nell'upsert finché è undefined.

alter table profiles add column if not exists weight_goal_kg numeric;
