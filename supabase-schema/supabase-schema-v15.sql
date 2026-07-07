-- PisoZone Schema v15 — fix sicurezza: le RPC di livelli/temi/cornici accettavano
-- p_user_id come parametro qualsiasi senza verificare che corrispondesse a auth.uid().
-- Un utente autenticato poteva quindi chiamare queste RPC passando l'id di un altro
-- utente e modificargli credito/livello/temi/cornici. Aggiunto controllo in ognuna.
-- Esegui nel SQL Editor di Supabase (richiede v7 già applicata)

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

  RETURN json_build_object('success', true, 'new_level', v_level + 1);
END;
$$;

CREATE OR REPLACE FUNCTION purchase_theme(p_user_id uuid, p_theme_id text, p_cost int)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_credits  int;
  v_unlocked text[];
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Non autorizzato');
  END IF;

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

CREATE OR REPLACE FUNCTION activate_theme(p_user_id uuid, p_theme_id text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_unlocked text[];
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Non autorizzato');
  END IF;

  SELECT unlocked_themes INTO v_unlocked FROM profiles WHERE id = p_user_id;

  IF NOT (p_theme_id = ANY(COALESCE(v_unlocked, ARRAY['dark','light']))) THEN
    RETURN json_build_object('success', false, 'error', 'Tema non sbloccato');
  END IF;

  UPDATE profiles SET active_theme = p_theme_id WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION purchase_frame(p_user_id uuid, p_frame_id text, p_cost int)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_credits  int;
  v_unlocked text[];
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Non autorizzato');
  END IF;

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

CREATE OR REPLACE FUNCTION activate_frame(p_user_id uuid, p_frame_id text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_unlocked text[];
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Non autorizzato');
  END IF;

  SELECT unlocked_frames INTO v_unlocked FROM profiles WHERE id = p_user_id;

  IF NOT (p_frame_id = ANY(COALESCE(v_unlocked, ARRAY['none']))) THEN
    RETURN json_build_object('success', false, 'error', 'Cornice non sbloccata');
  END IF;

  UPDATE profiles SET active_frame = p_frame_id WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$;
