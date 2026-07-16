-- PisoZone Schema v42 — altimetria sul percorso GPS (roadmap v2, pilastro 02,
-- "GPS potenziato" sotto-punto 2 di 3). Esegui nel SQL Editor di Supabase.
--
-- Quota in metri di ogni campione, presa da coords.altitude del Geolocation
-- API (WGS84, può mancare: alcuni dispositivi/browser non la forniscono).
-- Nullable per sempre: i percorsi già registrati non ce l'hanno e nessun
-- default deve fingere una misura mai fatta (stesso principio di rpe/mood,
-- v30). Il client è tollerante in entrambe le direzioni: se questa migrazione
-- non è ancora stata eseguita, salvataggio e lettura del percorso ripiegano
-- da soli su lat/lng senza fallire; se la colonna esiste ma i valori sono
-- null (percorsi vecchi), il profilo altimetrico semplicemente non compare.

alter table activity_routes add column if not exists altitude_m double precision;
