-- PisoZone Schema v40 — centro notifiche in-app (roadmap v2, pilastro 03).
-- Esegui nel SQL Editor di Supabase (richiede v31 già applicata: usa la
-- colonna activity_likes.kind).
--
-- Oggi le uniche notifiche sono push effimere (messaggi/richieste amicizia)
-- o non esistono affatto (reazioni, commenti, level-up — "aspettano il
-- centro notifiche", v31). Questa migrazione aggiunge una cronologia
-- persistente: una tabella insert-only alimentata da trigger security
-- definer sulle tabelle sorgente, mai scritta direttamente dal client (che
-- può solo leggere le proprie righe e segnarle lette).

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade, -- destinatario
  type        text not null,
  actor_id    uuid references profiles(id) on delete set null, -- chi ha generato l'evento; null per eventi di sistema (level_up)
  activity_id uuid references activities(id) on delete cascade, -- opzionale: reaction/comment
  payload     jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table notifications drop constraint if exists notifications_type_valid;
alter table notifications add constraint notifications_type_valid
  check (type in ('friend_request', 'friend_accepted', 'reaction', 'comment', 'level_up'));

create index if not exists notifications_by_user on notifications(user_id, created_at desc);
create index if not exists notifications_unread on notifications(user_id) where read_at is null;

alter table notifications enable row level security;

drop policy if exists "select own notifications" on notifications;
create policy "select own notifications" on notifications for select using (auth.uid() = user_id);

-- Nessuna policy INSERT per il client: solo i trigger security definer sotto
-- possono scrivere qui (devono poter notificare un utente diverso da chi
-- genera l'evento, fuori dalla portata della RLS ordinaria).
drop policy if exists "mark own notifications read" on notifications;
create policy "mark own notifications read" on notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Un aggiornamento può solo valorizzare read_at (mai il contrario, mai
-- toccare gli altri campi): la notifica letta resta letta, il contenuto è
-- immutabile.
create or replace function guard_notification_update()
returns trigger language plpgsql as $$
begin
  if new.user_id <> old.user_id
     or new.type <> old.type
     or new.actor_id is distinct from old.actor_id
     or new.activity_id is distinct from old.activity_id
     or new.payload <> old.payload
     or new.created_at <> old.created_at then
    raise exception 'NOTIFICATION_IMMUTABLE';
  end if;
  if old.read_at is not null and new.read_at is null then
    raise exception 'NOTIFICATION_READ_IRREVERSIBLE';
  end if;
  return new;
end;
$$;

drop trigger if exists on_notification_update on notifications;
create trigger on_notification_update before update on notifications
  for each row execute function guard_notification_update();

-- ── Richiesta di amicizia ricevuta ──
create or replace function notify_friend_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'pending' then
    insert into notifications (user_id, type, actor_id)
    values (new.addressee_id, 'friend_request', new.requester_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_friendship_insert_notify on friendships;
create trigger on_friendship_insert_notify after insert on friendships
  for each row execute function notify_friend_request();

-- ── Richiesta di amicizia accettata ──
create or replace function notify_friend_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'pending' and new.status = 'accepted' then
    insert into notifications (user_id, type, actor_id)
    values (new.requester_id, 'friend_accepted', new.addressee_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_friendship_update_notify on friendships;
create trigger on_friendship_update_notify after update on friendships
  for each row execute function notify_friend_accepted();

-- ── Reazione ricevuta su una propria attività (mai per la propria) ──
create or replace function notify_reaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select user_id into v_owner from activities where id = new.activity_id;
  if v_owner is not null and v_owner <> new.user_id and not is_blocked_between(v_owner, new.user_id) then
    insert into notifications (user_id, type, actor_id, activity_id, payload)
    values (v_owner, 'reaction', new.user_id, new.activity_id, jsonb_build_object('kind', new.kind));
  end if;
  return new;
end;
$$;

drop trigger if exists on_activity_like_notify on activity_likes;
create trigger on_activity_like_notify after insert or update of kind on activity_likes
  for each row execute function notify_reaction();

-- ── Commento ricevuto su una propria attività (mai per la propria) ──
create or replace function notify_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select user_id into v_owner from activities where id = new.activity_id;
  if v_owner is not null and v_owner <> new.user_id and not is_blocked_between(v_owner, new.user_id) then
    insert into notifications (user_id, type, actor_id, activity_id, payload)
    values (v_owner, 'comment', new.user_id, new.activity_id, jsonb_build_object('preview', left(new.content, 140)));
  end if;
  return new;
end;
$$;

drop trigger if exists on_activity_comment_notify on activity_comments;
create trigger on_activity_comment_notify after insert on activity_comments
  for each row execute function notify_comment();

-- ── Level up: stessa RPC di v7/v15, con l'aggiunta della notifica ──
CREATE OR REPLACE FUNCTION unlock_next_level(p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_credits int;
  v_level   int;
  v_cost    int;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Non autorizzato');
  END IF;

  SELECT credits, level INTO v_credits, v_level
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_level IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profilo non trovato');
  END IF;

  IF v_level >= 10 THEN
    RETURN json_build_object('success', false, 'error', 'Livello massimo raggiunto');
  END IF;

  v_cost := CASE v_level
    WHEN 1 THEN 100
    WHEN 2 THEN 150
    WHEN 3 THEN 200
    WHEN 4 THEN 280
    WHEN 5 THEN 380
    WHEN 6 THEN 500
    WHEN 7 THEN 650
    WHEN 8 THEN 830
    WHEN 9 THEN 1050
    ELSE 99999
  END;

  IF v_credits < v_cost THEN
    RETURN json_build_object(
      'success', false,
      'error',   'Crediti insufficienti',
      'needed',  v_cost,
      'have',    v_credits
    );
  END IF;

  UPDATE profiles
  SET credits = credits - v_cost,
      level   = level + 1
  WHERE id = p_user_id;

  INSERT INTO notifications (user_id, type, payload)
  VALUES (p_user_id, 'level_up', jsonb_build_object('level', v_level + 1));

  RETURN json_build_object('success', true, 'new_level', v_level + 1);
END;
$$;
