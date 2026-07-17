-- PisoZone Schema v45 — percorso nel feed + notifiche per duelli e podi
-- (roadmap v3, pilastro 03 punti 1 e 2). Esegui nel SQL Editor di Supabase
-- (richiede v37 per duels, v39 per gli eventi stagionali, v40 per notifications).
--
-- ── Percorso nel feed: consenso esplicito per attività ──
-- I propri giri sono un dato sensibile: il percorso resta visibile solo al
-- proprietario finché lui non lo condivide, attività per attività. Default
-- FALSE anche per il passato: nessun percorso già registrato diventa
-- visibile retroattivamente senza un gesto esplicito.

alter table activities add column if not exists route_visible boolean not null default false;

-- Gli AMICI (accettati, non bloccati) possono leggere i punti di un percorso
-- SOLO se l'attività lo espone. Le policy si sommano in OR: quella owner-only
-- di v29 resta e continua a coprire il proprietario.
drop policy if exists "friends read shared routes" on activity_routes;
create policy "friends read shared routes" on activity_routes for select using (
  exists (
    select 1 from activities a
    where a.id = activity_routes.activity_id
      and a.route_visible
      and not is_blocked_between(a.user_id, auth.uid())
      and exists (select 1 from friendships f where f.status = 'accepted'
        and ((f.requester_id = a.user_id and f.addressee_id = auth.uid())
          or (f.addressee_id = a.user_id and f.requester_id = auth.uid())))
  )
);

-- ── Notifiche per duelli e podi stagionali ──
-- Il centro notifiche (v40) escludeva deliberatamente i duelli: qui si chiude
-- il cerchio. Tipi nuovi: sfida ricevuta, sfida accettata, duello concluso,
-- podio stagionale da riscattare (quest'ultimo scritto dal cron serale con
-- service role — un trigger non può scattare "allo scadere" di una finestra).

alter table notifications drop constraint if exists notifications_type_valid;
alter table notifications add constraint notifications_type_valid
  check (type in ('friend_request', 'friend_accepted', 'reaction', 'comment', 'level_up',
                  'duel_invite', 'duel_accepted', 'duel_finished', 'seasonal_podium'));

-- Sfida ricevuta: 1v1 → all'avversario; di gruppo → a tutti i membri tranne
-- il creatore (il duello di gruppo parte subito attivo, v37).
create or replace function notify_duel_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.opponent_id is not null then
    insert into notifications (user_id, type, actor_id)
    values (new.opponent_id, 'duel_invite', new.creator_id);
  elsif new.group_id is not null then
    insert into notifications (user_id, type, actor_id)
    select gm.user_id, 'duel_invite', new.creator_id
    from group_members gm
    where gm.group_id = new.group_id
      and gm.user_id <> new.creator_id
      and not is_blocked_between(gm.user_id, new.creator_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_duel_insert_notify on duels;
create trigger on_duel_insert_notify after insert on duels
  for each row execute function notify_duel_insert();

-- Sfida accettata → al creatore. Duello concluso → a tutti i partecipanti
-- TRANNE chi lo ha chiuso (che lo sa già); il vincitore, se c'è, coincide
-- sempre con chi chiude (guard_duel_update: DUEL_CLAIM_OWN), quindi il
-- payload registra solo se un vincitore esiste. Il rifiuto resta silenzioso:
-- una proposta declinata non merita una notifica che metta in imbarazzo.
create or replace function notify_duel_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'pending' and new.status = 'active' then
    insert into notifications (user_id, type, actor_id)
    values (new.creator_id, 'duel_accepted', new.opponent_id);
  elsif old.status = 'active' and new.status = 'finished' then
    insert into notifications (user_id, type, actor_id, payload)
    select p.uid, 'duel_finished', auth.uid(),
           jsonb_build_object('winner', new.winner_id is not null)
    from (
      select new.creator_id as uid
      union select new.opponent_id where new.opponent_id is not null
      union select gm.user_id from group_members gm
        where new.group_id is not null and gm.group_id = new.group_id
    ) p
    where p.uid <> auth.uid()
      and not is_blocked_between(p.uid, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists on_duel_update_notify on duels;
create trigger on_duel_update_notify after update on duels
  for each row execute function notify_duel_update();
