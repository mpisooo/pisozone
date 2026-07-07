-- PisoZone Schema v16 — validazione dati: vincoli su durata/calorie/distanza/peso/altezza
-- Prima non esisteva alcun vincolo server-side su questi campi: un valore negativo o
-- assurdo (es. durata -50, peso 0) poteva essere inserito senza problemi, corrompendo
-- il calcolo dei crediti (v12/v14), le statistiche e il calcolo calorico.
--
-- NOT VALID: il vincolo si applica da subito a inserimenti/modifiche futuri, senza far
-- fallire la migrazione nel caso esistano già righe storiche che non lo rispetterebbero.
-- Esegui nel SQL Editor di Supabase.

ALTER TABLE activities
  ADD CONSTRAINT activities_duration_range CHECK (duration_min > 0 AND duration_min <= 1440) NOT VALID;

ALTER TABLE activities
  ADD CONSTRAINT activities_calories_range CHECK (calories IS NULL OR (calories >= 0 AND calories <= 20000)) NOT VALID;

ALTER TABLE activities
  ADD CONSTRAINT activities_distance_range CHECK (distance_km IS NULL OR (distance_km >= 0 AND distance_km <= 1000)) NOT VALID;

ALTER TABLE weight_logs
  ADD CONSTRAINT weight_logs_weight_range CHECK (weight_kg > 20 AND weight_kg < 400) NOT VALID;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_weight_range CHECK (weight_kg IS NULL OR (weight_kg > 20 AND weight_kg < 400)) NOT VALID;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_height_range CHECK (height_cm IS NULL OR (height_cm > 50 AND height_cm < 250)) NOT VALID;
