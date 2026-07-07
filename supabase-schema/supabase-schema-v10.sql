-- ============================================================
-- PisoZone Schema v10 — Edit / delete messages
-- Esegui questo script in Supabase → SQL Editor
-- ============================================================

-- 1. Aggiunge la colonna edited_at (null se non modificato)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- 2. REPLICA IDENTITY FULL: necessario per ricevere il vecchio valore nelle
--    notifiche realtime di DELETE (altrimenti arriva solo l'id).
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 3. Policy UPDATE: il mittente può modificare il contenuto del proprio messaggio.
--    "mark as read" (ricevente) già esiste — le policy UPDATE vengono OR-ate,
--    quindi entrambe restano attive.
DROP POLICY IF EXISTS "edit own message" ON messages;
CREATE POLICY "edit own message" ON messages FOR UPDATE
  USING  (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- 4. Policy DELETE: mittente O destinatario possono eliminare un messaggio
--    (elimina l'intera conversazione per entrambi).
DROP POLICY IF EXISTS "delete own message" ON messages;
CREATE POLICY "delete own message" ON messages FOR DELETE
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
