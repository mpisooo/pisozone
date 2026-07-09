-- PisoZone Schema v28 — notifiche push granulari
-- Toggle separati per categoria di notifica (promemoria allenamento serale,
-- messaggi, richieste di amicizia) + una fascia oraria di silenzio opzionale
-- (nessuna push in quell'intervallo, fuso Europe/Rome, si applica a tutte le
-- categorie). Stesso pattern delle colonne one-shot precedenti: default
-- esplicito, finché la colonna non esiste il client considera "tutto attivo,
-- nessun silenzio" (vedi api/_lib/notificationPrefs.ts).
-- Esegui nel SQL Editor di Supabase.

alter table profiles
  add column if not exists notif_reminder_enabled boolean,
  add column if not exists notif_messages_enabled boolean,
  add column if not exists notif_friend_requests_enabled boolean,
  add column if not exists notif_quiet_start smallint,
  add column if not exists notif_quiet_end smallint;

update profiles set notif_reminder_enabled = true where notif_reminder_enabled is null;
update profiles set notif_messages_enabled = true where notif_messages_enabled is null;
update profiles set notif_friend_requests_enabled = true where notif_friend_requests_enabled is null;

alter table profiles alter column notif_reminder_enabled set default true;
alter table profiles alter column notif_reminder_enabled set not null;
alter table profiles alter column notif_messages_enabled set default true;
alter table profiles alter column notif_messages_enabled set not null;
alter table profiles alter column notif_friend_requests_enabled set default true;
alter table profiles alter column notif_friend_requests_enabled set not null;

-- notif_quiet_start/end restano nullable: null = nessuna fascia di silenzio.
alter table profiles
  add constraint profiles_notif_quiet_start_check check (notif_quiet_start is null or notif_quiet_start between 0 and 23),
  add constraint profiles_notif_quiet_end_check check (notif_quiet_end is null or notif_quiet_end between 0 and 23);
