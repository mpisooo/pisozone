-- PisoZone Schema v22 — valida i vincoli CHECK rimasti NOT VALID dalla v16
-- I vincoli NOT VALID si applicano solo alle scritture nuove: le righe storiche
-- non sono mai state verificate. VALIDATE CONSTRAINT le controlla tutte e, se
-- passano, il vincolo diventa pieno (il planner può anche sfruttarlo).
--
-- PASSO 1 — Diagnosi: conta le righe storiche che violerebbero i vincoli.
-- Se tutte le count sono 0, salta al passo 3.

select 'activities_duration_range'  as vincolo, count(*) from activities  where not (duration_min > 0 and duration_min <= 1440)
union all
select 'activities_calories_range',  count(*) from activities  where not (calories is null or (calories >= 0 and calories <= 20000))
union all
select 'activities_distance_range',  count(*) from activities  where not (distance_km is null or (distance_km >= 0 and distance_km <= 1000))
union all
select 'weight_logs_weight_range',   count(*) from weight_logs where not (weight_kg > 20 and weight_kg < 400)
union all
select 'profiles_weight_range',      count(*) from profiles    where not (weight_kg is null or (weight_kg > 20 and weight_kg < 400))
union all
select 'profiles_height_range',      count(*) from profiles    where not (height_cm is null or (height_cm > 50 and height_cm < 250));

-- PASSO 2 — Solo se qualche count è > 0: ispeziona e correggi a mano le righe
-- (sono dati inseriti prima della v16, quasi certamente refusi). Esempi:
--   select id, user_id, type, date, duration_min, calories, distance_km
--     from activities where not (duration_min > 0 and duration_min <= 1440);
--   update activities set calories = null where calories < 0 or calories > 20000;

-- PASSO 3 — Validazione (fallisce con errore esplicito se restano violazioni):

alter table activities  validate constraint activities_duration_range;
alter table activities  validate constraint activities_calories_range;
alter table activities  validate constraint activities_distance_range;
alter table weight_logs validate constraint weight_logs_weight_range;
alter table profiles    validate constraint profiles_weight_range;
alter table profiles    validate constraint profiles_height_range;
