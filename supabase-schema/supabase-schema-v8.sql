-- ============================================================
-- PisoZone Schema v8 — Social: Messaggi, Gruppi, Feed
-- Esegui questo script in Supabase → SQL Editor
-- ============================================================

-- 1. Messaggi diretti (DM)
CREATE TABLE IF NOT EXISTS messages (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  read_at     timestamptz
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own messages" ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "send message" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "mark as read" ON messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- Abilita realtime per messaggi
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Gruppi
CREATE TABLE IF NOT EXISTS groups (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  photo_url  text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- 3. Membri dei gruppi
CREATE TABLE IF NOT EXISTS group_members (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id  uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id   uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role      text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLS gruppi
CREATE POLICY "view member groups" ON groups FOR SELECT
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "create group" ON groups FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "admin update group" ON groups FOR UPDATE
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS group_members
CREATE POLICY "view group members" ON group_members FOR SELECT
  USING (group_id IN (SELECT gm.group_id FROM group_members gm WHERE gm.user_id = auth.uid()));
CREATE POLICY "join or add member" ON group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "leave group" ON group_members FOR DELETE
  USING (user_id = auth.uid());

-- 4. Messaggi di gruppo
CREATE TABLE IF NOT EXISTS group_messages (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id  uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content   text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view group messages" ON group_messages FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "send group message" ON group_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Abilita realtime per messaggi di gruppo
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;

-- 5. Aggiorna RLS activities per mostrare attività degli amici
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE tablename = 'activities' AND schemaname = 'public' AND cmd = 'SELECT'
  ) LOOP
    EXECUTE format('DROP POLICY %I ON activities', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "view own and friends activities" ON activities FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT CASE WHEN requester_id = auth.uid() THEN addressee_id ELSE requester_id END
      FROM friendships
      WHERE (requester_id = auth.uid() OR addressee_id = auth.uid())
        AND status = 'accepted'
    )
  );

-- 6. Aggiorna RLS profiles per permettere lettura di tutti i profili autenticati
--    (necessario per ricerca utenti e profili amici)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE tablename = 'profiles' AND schemaname = 'public' AND cmd = 'SELECT'
  ) LOOP
    EXECUTE format('DROP POLICY %I ON profiles', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "authenticated users can read profiles" ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
