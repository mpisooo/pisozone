-- PisoZone Schema v7 — livelli utente, temi premium, cornici profilo
-- Esegui nel SQL Editor di Supabase

-- ── Nuove colonne su profiles ──────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level            integer  DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_themes  text[]   DEFAULT ARRAY['dark','light'];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_theme     text     DEFAULT 'dark';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_frames  text[]   DEFAULT ARRAY['none'];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_frame     text     DEFAULT 'none';

-- ── RPC: sblocca il livello successivo (atomica) ───────────────────────────
-- Costi incrementali per livello (quanto costa SALIRE al livello successivo):
--   lv1→2: 100 | lv2→3: 150 | lv3→4: 200 | lv4→5: 280
--   lv5→6: 380 | lv6→7: 500 | lv7→8: 650 | lv8→9: 830 | lv9→10: 1050
CREATE OR REPLACE FUNCTION unlock_next_level(p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_credits int;
  v_level   int;
  v_cost    int;
BEGIN
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

  RETURN json_build_object('success', true, 'new_level', v_level + 1);
END;
$$;

-- ── RPC: acquista un tema premium (atomica) ────────────────────────────────
CREATE OR REPLACE FUNCTION purchase_theme(p_user_id uuid, p_theme_id text, p_cost int)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_credits  int;
  v_unlocked text[];
BEGIN
  SELECT credits, unlocked_themes INTO v_credits, v_unlocked
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_credits IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profilo non trovato');
  END IF;

  IF p_theme_id = ANY(COALESCE(v_unlocked, ARRAY[]::text[])) THEN
    RETURN json_build_object('success', false, 'error', 'Tema già sbloccato');
  END IF;

  IF v_credits < p_cost THEN
    RETURN json_build_object('success', false, 'error', 'Crediti insufficienti');
  END IF;

  UPDATE profiles
  SET credits          = credits - p_cost,
      unlocked_themes  = array_append(COALESCE(unlocked_themes, ARRAY['dark','light']), p_theme_id),
      active_theme     = p_theme_id
  WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;

-- ── RPC: attiva un tema già sbloccato ─────────────────────────────────────
CREATE OR REPLACE FUNCTION activate_theme(p_user_id uuid, p_theme_id text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_unlocked text[];
BEGIN
  SELECT unlocked_themes INTO v_unlocked FROM profiles WHERE id = p_user_id;

  IF NOT (p_theme_id = ANY(COALESCE(v_unlocked, ARRAY['dark','light']))) THEN
    RETURN json_build_object('success', false, 'error', 'Tema non sbloccato');
  END IF;

  UPDATE profiles SET active_theme = p_theme_id WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$;

-- ── RPC: acquista una cornice profilo (atomica) ────────────────────────────
CREATE OR REPLACE FUNCTION purchase_frame(p_user_id uuid, p_frame_id text, p_cost int)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_credits  int;
  v_unlocked text[];
BEGIN
  SELECT credits, unlocked_frames INTO v_credits, v_unlocked
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_credits IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profilo non trovato');
  END IF;

  IF p_frame_id = ANY(COALESCE(v_unlocked, ARRAY['none'])) THEN
    RETURN json_build_object('success', false, 'error', 'Cornice già sbloccata');
  END IF;

  IF v_credits < p_cost THEN
    RETURN json_build_object('success', false, 'error', 'Crediti insufficienti');
  END IF;

  UPDATE profiles
  SET credits         = credits - p_cost,
      unlocked_frames = array_append(COALESCE(unlocked_frames, ARRAY['none']), p_frame_id),
      active_frame    = p_frame_id
  WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;

-- ── RPC: attiva una cornice già sbloccata ─────────────────────────────────
CREATE OR REPLACE FUNCTION activate_frame(p_user_id uuid, p_frame_id text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_unlocked text[];
BEGIN
  SELECT unlocked_frames INTO v_unlocked FROM profiles WHERE id = p_user_id;

  IF NOT (p_frame_id = ANY(COALESCE(v_unlocked, ARRAY['none']))) THEN
    RETURN json_build_object('success', false, 'error', 'Cornice non sbloccata');
  END IF;

  UPDATE profiles SET active_frame = p_frame_id WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$;
