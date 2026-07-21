-- PisoZone Schema v49 — Roadmap v6, pilastro 01 "Il social si avvicina":
-- tre interventi che la RLS esistente non permette ancora dal client.
-- Esegui nel SQL Editor di Supabase.

-- ── 1. Bucket "group-photos" (foto di gruppo) ───────────────────────────────
-- Stesso pattern di "activity-photos" (v27): pubblico, path stabile
-- {group_id}/photo.jpg (upsert = sostituzione). A differenza delle foto
-- attività (owner = user_id nel path), qui il primo segmento del path è il
-- group_id: la scrittura è ammessa solo a chi è ADMIN di quel gruppo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('group-photos', 'group-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "group_photos_insert" on storage.objects;
create policy "group_photos_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'group-photos'
    and exists (
      select 1 from group_members gm
      where gm.user_id = auth.uid()
        and gm.role = 'admin'
        and gm.group_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "group_photos_update" on storage.objects;
create policy "group_photos_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'group-photos'
    and exists (
      select 1 from group_members gm
      where gm.user_id = auth.uid()
        and gm.role = 'admin'
        and gm.group_id::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id = 'group-photos'
    and exists (
      select 1 from group_members gm
      where gm.user_id = auth.uid()
        and gm.role = 'admin'
        and gm.group_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "group_photos_delete" on storage.objects;
create policy "group_photos_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'group-photos'
    and exists (
      select 1 from group_members gm
      where gm.user_id = auth.uid()
        and gm.role = 'admin'
        and gm.group_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "group_photos_select" on storage.objects;
create policy "group_photos_select" on storage.objects for select
  using (bucket_id = 'group-photos');

-- ── 2. Espellere un membro dal gruppo ────────────────────────────────────────
-- La policy DELETE storica ("leave group", v8) ammette solo auto-rimozione.
-- Questa si aggiunge (le policy permissive dello stesso comando sono in OR):
-- un admin può rimuovere QUALSIASI altro membro.
create policy "admin remove member" on group_members for delete
  using (
    user_id <> auth.uid()
    and group_id in (select group_id from group_members where user_id = auth.uid() and role = 'admin')
  );

-- Guardia contro il gruppo senza admin: blocca la rimozione (auto-uscita O
-- espulsione) dell'ULTIMO admin quando il gruppo ha ancora altri membri. Un
-- admin solitario (nessun altro membro) può ancora lasciare/abbandonare il
-- gruppo — non c'è nessuno da proteggere in quel caso.
create or replace function guard_last_admin_removal()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'admin'
     and (select count(*) from group_members where group_id = old.group_id and role = 'admin') <= 1
     and exists (select 1 from group_members where group_id = old.group_id and user_id <> old.user_id)
  then
    raise exception 'GROUP_LAST_ADMIN';
  end if;
  return old;
end;
$$;

drop trigger if exists on_group_member_delete on group_members;
create trigger on_group_member_delete before delete on group_members
  for each row execute function guard_last_admin_removal();

-- ── 3. Amici in comune ────────────────────────────────────────────────────────
-- RPC security definer (stesso modello fiduciario di get_public_profile_stats
-- e get_weekly_comparison): mai esporre la lista amici grezza di un altro
-- utente, solo il conteggio dell'intersezione con la MIA lista amici.
-- Batch su più utenti (ricerca/scoperta mostrano fino a 10 risultati): una
-- singola chiamata invece di N round-trip.
create or replace function get_mutual_friends_counts(p_user_ids uuid[])
returns table (user_id uuid, mutual_count bigint)
language sql security definer stable
set search_path = public as $$
  with my_friends as (
    select case when requester_id = auth.uid() then addressee_id else requester_id end as friend_id
    from friendships
    where (requester_id = auth.uid() or addressee_id = auth.uid()) and status = 'accepted'
  ),
  targets as (
    select unnest(p_user_ids) as target_id
  ),
  their_friends as (
    select t.target_id,
           case when f.requester_id = t.target_id then f.addressee_id else f.requester_id end as friend_id
    from friendships f
    join targets t on f.requester_id = t.target_id or f.addressee_id = t.target_id
    where f.status = 'accepted'
  )
  select tf.target_id, count(*)::bigint
  from their_friends tf
  join my_friends mf on mf.friend_id = tf.friend_id
  where tf.target_id <> auth.uid()
    and not is_blocked_between(tf.target_id, auth.uid())
  group by tf.target_id;
$$;
revoke execute on function get_mutual_friends_counts(uuid[]) from anon;
