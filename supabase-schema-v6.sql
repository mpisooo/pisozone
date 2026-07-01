-- PisoZone Schema v6 — streak freeze
-- Esegui nel SQL Editor di Supabase

-- Tabella congelamenti streak
create table if not exists streak_freezes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  frozen_date date        not null,
  used_at     timestamptz not null default now(),
  unique(user_id, frozen_date)
);

create index if not exists sf_user_date on streak_freezes(user_id, frozen_date desc);

alter table streak_freezes enable row level security;

create policy "Utenti gestiscono i propri freeze"
  on streak_freezes for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Funzione atomica: controlla crediti, inserisce freeze e scala 300 in un'unica transazione
create or replace function use_streak_freeze(p_user_id uuid, p_date date)
returns json language plpgsql security definer as $$
declare
  v_credits int;
begin
  -- lock sulla riga per evitare race condition
  select credits into v_credits from profiles where id = p_user_id for update;

  if v_credits is null then
    return json_build_object('success', false, 'error', 'Profilo non trovato');
  end if;

  if v_credits < 300 then
    return json_build_object('success', false, 'error', 'Crediti insufficienti');
  end if;

  insert into streak_freezes(user_id, frozen_date) values (p_user_id, p_date);
  update profiles set credits = credits - 300 where id = p_user_id;

  return json_build_object('success', true);
exception when unique_violation then
  return json_build_object('success', false, 'error', 'Streak già congelato per questo giorno');
end;
$$;
