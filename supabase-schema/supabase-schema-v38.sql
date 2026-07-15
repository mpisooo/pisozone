-- PisoZone Schema v38 — indoor/outdoor sulle attività (roadmap v3, pilastro
-- allenamento). Esegui nel SQL Editor di Supabase.
--
-- true = al chiuso (tapis roulant, cyclette, piscina, parete indoor...),
-- false = all'aperto, null = non indicato — tutte le attività esistenti
-- restano null, nessun default che finga una risposta mai data (stesso
-- principio di rpe/mood, v30). I nuovi sport (beach volley, ping pong,
-- salto con la corda, trekking, boxe) NON richiedono DDL: activities.type
-- è text senza vincolo sui valori.

alter table activities add column if not exists indoor boolean;
