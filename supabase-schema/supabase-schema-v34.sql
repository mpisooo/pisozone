-- PisoZone Schema v34 — piani e programmi di allenamento (roadmap v2, pilastro 02 punto 4)
-- I programmi sono template nel codice client (PLAN_CATALOG in lib/plans.ts,
-- stesso pattern di CHALLENGE_POOL): il DB registra solo l'iscrizione e il suo
-- esito. L'avanzamento NON è persistito: si deriva dalle attività registrate
-- (matching puro in lib/plans.ts), quindi niente tabella plan_sessions.
-- Esegui nel SQL Editor di Supabase.

create table if not exists plan_enrollments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  plan_key       text not null,
  started_on     date not null,
  completed_at   timestamptz,
  abandoned_at   timestamptz,
  credits_earned integer not null default 0,
  created_at     timestamptz not null default now()
);

-- Un solo programma attivo per utente: abbandonare o completare libera lo slot
create unique index if not exists plan_enrollments_one_active
  on plan_enrollments(user_id) where completed_at is null and abandoned_at is null;
create index if not exists plan_enrollments_by_user on plan_enrollments(user_id, created_at desc);

alter table plan_enrollments
  add constraint plan_enrollments_key_len check (char_length(plan_key) between 1 and 40),
  add constraint plan_enrollments_credits_range check (credits_earned between 0 and 300);

alter table plan_enrollments enable row level security;
create policy "select own plan_enrollments" on plan_enrollments for select using (auth.uid() = user_id);
-- started_on ancorato a oggi (±1 giorno per il fuso): partire nel passato
-- permetterebbe di completare un programma con attività già registrate.
create policy "insert own plan_enrollments" on plan_enrollments for insert
  with check (auth.uid() = user_id and started_on between current_date - 1 and current_date + 1);
create policy "update own plan_enrollments" on plan_enrollments for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Crediti alla chiusura del programma: stesso modello fiduciario delle sfide
-- giornaliere (award_challenge_credits, v4) — l'importo arriva dal client ma è
-- vincolato dal check 0..300 e accreditato UNA volta sola: il trigger scatta
-- quando completed_at passa da NULL a valorizzato e il completamento non si
-- può più annullare né modificare.
create or replace function award_plan_credits()
returns trigger language plpgsql security definer as $$
begin
  if old.completed_at is not null then
    if new.completed_at is distinct from old.completed_at
       or new.credits_earned is distinct from old.credits_earned then
      raise exception 'PLAN_ALREADY_COMPLETED';
    end if;
    return new;
  end if;
  if new.completed_at is not null then
    if new.abandoned_at is not null then
      raise exception 'PLAN_ABANDONED';
    end if;
    update profiles set credits = credits + new.credits_earned where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_plan_completion on plan_enrollments;
create trigger on_plan_completion
  before update on plan_enrollments
  for each row execute function award_plan_credits();
