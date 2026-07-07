-- PisoZone Schema v23 — rate limiting su messaggi, messaggi di gruppo e
-- richieste di amicizia.
-- Le scritture arrivano dal client direttamente a Supabase (via RLS), quindi
-- l'unico punto di enforcement reale è il database: un trigger BEFORE INSERT
-- conta le righe recenti dell'utente e blocca l'inserimento oltre soglia.
-- Ogni insert bloccato = anche nessuna notifica push (i webhook partono
-- dall'insert), quindi lo spam si ferma alla radice.
-- Esegui nel SQL Editor di Supabase.

-- Funzione generica: argomenti = (colonna_utente, finestra1, max1 [, finestra2, max2, ...])
-- Il messaggio d'errore inizia con 'RATE_LIMIT': il client lo riconosce e
-- mostra un avviso dedicato invece dell'errore generico.
create or replace function public.enforce_insert_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_col text := tg_argv[0];
  uid uuid;
  i int := 1;
  win interval;
  max_rows int;
  cnt int;
begin
  execute format('select ($1).%I', user_col) into uid using new;

  while i + 1 < tg_nargs loop
    win := tg_argv[i]::interval;
    max_rows := tg_argv[i + 1]::int;
    execute format(
      'select count(*) from %I where %I = $1 and created_at > now() - $2',
      tg_table_name, user_col
    ) into cnt using uid, win;
    if cnt >= max_rows then
      raise exception 'RATE_LIMIT: massimo % inserimenti in % per %', max_rows, win, tg_table_name
        using errcode = 'P0001';
    end if;
    i := i + 2;
  end loop;

  return new;
end $$;

-- Messaggi diretti: 20 al minuto, 300 all'ora per mittente
drop trigger if exists messages_rate_limit on messages;
create trigger messages_rate_limit
  before insert on messages
  for each row execute function enforce_insert_rate_limit('sender_id', '1 minute', '20', '1 hour', '300');

-- Messaggi di gruppo: stesse soglie dei DM
drop trigger if exists group_messages_rate_limit on group_messages;
create trigger group_messages_rate_limit
  before insert on group_messages
  for each row execute function enforce_insert_rate_limit('sender_id', '1 minute', '20', '1 hour', '300');

-- Richieste di amicizia: 10 all'ora, 30 al giorno per richiedente.
-- Copre anche il ciclo annulla+reinvia verso la stessa persona (ogni reinvio
-- è un nuovo insert e genera una nuova push al destinatario).
drop trigger if exists friendships_rate_limit on friendships;
create trigger friendships_rate_limit
  before insert on friendships
  for each row execute function enforce_insert_rate_limit('requester_id', '1 hour', '10', '1 day', '30');

-- Indici per rendere economico il count del trigger a ogni insert
-- (friendships ha già friendships_requester dalla v17)
create index if not exists messages_sender_recent on messages (sender_id, created_at desc);
create index if not exists group_messages_sender_recent on group_messages (sender_id, created_at desc);
