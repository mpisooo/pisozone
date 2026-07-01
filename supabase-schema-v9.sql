-- ============================================================
-- PisoZone Schema v9 — Fix infinite recursion in group_members RLS
-- Esegui questo script in Supabase → SQL Editor
-- ============================================================

-- 1. Rimuovi le policy ricorsive
DROP POLICY IF EXISTS "view member groups"    ON groups;
DROP POLICY IF EXISTS "admin update group"    ON groups;
DROP POLICY IF EXISTS "view group members"    ON group_members;
DROP POLICY IF EXISTS "join or add member"    ON group_members;
DROP POLICY IF EXISTS "view group messages"   ON group_messages;
DROP POLICY IF EXISTS "send group message"    ON group_messages;

-- 2. Funzioni helper SECURITY DEFINER
--    Girano con i permessi del proprietario (postgres), bypassano RLS.
--    In questo modo le policy non si richiamano mai su se stesse.

CREATE OR REPLACE FUNCTION public.is_group_member(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = gid AND user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Ricrea le policy senza ricorsione

-- groups
CREATE POLICY "view member groups" ON groups FOR SELECT
  USING (public.is_group_member(id));

CREATE POLICY "admin update group" ON groups FOR UPDATE
  USING (public.is_group_admin(id));

-- group_members
CREATE POLICY "view group members" ON group_members FOR SELECT
  USING (public.is_group_member(group_id));

CREATE POLICY "join or add member" ON group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_group_admin(group_id)
  );

-- group_messages
CREATE POLICY "view group messages" ON group_messages FOR SELECT
  USING (public.is_group_member(group_id));

CREATE POLICY "send group message" ON group_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_group_member(group_id)
  );
