-- PisoZone Schema v24 — rate limiting a prova di cancellazione
-- La v23 conta le righe presenti in tabella: cancellare i propri messaggi o
-- annullare le richieste di amicizia azzera il conteggio, ma ogni insert ha
-- già generato la sua notifica push → lo spam resta possibile con il ciclo
-- "invia 20 → cancella tutto → ripeti". Qui il conteggio passa a un registro
-- di soli insert, che le cancellazioni non toccano.
-- I trigger creati dalla v23 restano invariati: cambia solo la funzione.
-- Esegui nel SQL Editor di Supabase.

create table if not exists rate_limit_events (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  bucket     text        not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_lookup
  on rate_limit_events (user_id, bucket, created_at desc);

-- RLS attiva senza alcuna policy: i client non possono né leggere né scrivere;
-- scrive solo la funzione trigger (security definer).
alter table rate_limit_events enable row level security;

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

  -- Pulizia opportunistica: eventi più vecchi della finestra più ampia in uso
  -- (1 giorno, friendships) — il registro resta piccolo senza cron dedicati.
  delete from rate_limit_events
    where user_id = uid and bucket = tg_table_name and created_at < now() - interval '1 day';

  while i + 1 < tg_nargs loop
    win := tg_argv[i]::interval;
    max_rows := tg_argv[i + 1]::int;
    select count(*) into cnt from rate_limit_events
      where user_id = uid and bucket = tg_table_name and created_at > now() - win;
    if cnt >= max_rows then
      raise exception 'RATE_LIMIT: massimo % inserimenti in % per %', max_rows, win, tg_table_name
        using errcode = 'P0001';
    end if;
    i := i + 2;
  end loop;

  -- Registra l'evento solo se tutti i controlli passano: se l'insert esterno
  -- fallisce per altri motivi, il rollback della transazione rimuove anche questo.
  insert into rate_limit_events (user_id, bucket) values (uid, tg_table_name);
  return new;
end $$;
