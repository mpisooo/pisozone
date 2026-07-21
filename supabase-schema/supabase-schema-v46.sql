-- PisoZone Schema v46 — indice di supporto per la heatmap personale
-- (roadmap v4, pilastro 02). Esegui nel SQL Editor di Supabase.
--
-- La heatmap interroga activity_routes filtrando SOLO su user_id (tutti i
-- percorsi dell'utente, indipendentemente dall'attività): l'unico indice
-- esistente su questa tabella è (activity_id, seq) da v29, quindi la query
-- sarebbe una scansione completa. Nessun cambio di RLS/colonne, solo velocità.

create index if not exists activity_routes_by_user on activity_routes(user_id, activity_id, seq);
