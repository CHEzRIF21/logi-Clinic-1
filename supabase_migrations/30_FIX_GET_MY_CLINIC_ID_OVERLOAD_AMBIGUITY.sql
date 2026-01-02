-- ============================================
-- MIGRATION 30: Fix ambiguity get_my_clinic_id (PostgREST + SQL)
-- ============================================
-- Problème observé en runtime:
-- - PostgREST: PGRST203 (300) "Could not choose the best candidate function"
-- - PostgreSQL: 42725 "function get_my_clinic_id() is not unique"
--
-- Cause:
-- Deux fonctions existent:
--   - get_my_clinic_id()
--   - get_my_clinic_id(p_user_id uuid DEFAULT NULL)
-- Le DEFAULT rend l'appel get_my_clinic_id() ambigu (Postgres et PostgREST).
--
-- Fix:
-- - Conserver un wrapper sans paramètre (utilisé par RLS/policies)
-- - Conserver une version paramétrée MAIS SANS DEFAULT (pas appelable sans argument)
-- - Le wrapper appelle explicitement la version paramétrée avec NULL::uuid
-- ============================================

-- 1) Recréer la version paramétrée SANS DEFAULT (nécessite drop)
DROP FUNCTION IF EXISTS public.get_my_clinic_id(uuid);

CREATE OR REPLACE FUNCTION public.get_my_clinic_id(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id uuid;
  v_auth_user_id uuid;
BEGIN
  -- Méthode 1: Supabase Auth (JWT)
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NOT NULL THEN
    SELECT clinic_id INTO v_clinic_id
    FROM public.users
    WHERE auth_user_id = v_auth_user_id
      AND actif = true
    LIMIT 1;

    IF v_clinic_id IS NOT NULL THEN
      RETURN v_clinic_id;
    END IF;
  END IF;

  -- Méthode 2: fallback par id utilisateur (optionnel)
  IF p_user_id IS NOT NULL THEN
    SELECT clinic_id INTO v_clinic_id
    FROM public.users
    WHERE id = p_user_id
      AND actif = true
    LIMIT 1;

    IF v_clinic_id IS NOT NULL THEN
      RETURN v_clinic_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- 2) Wrapper sans paramètre: non ambigu (et utilisé par RLS)
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN public.get_my_clinic_id(NULL::uuid);
END;
$$;

-- 3) Alias compatibilité
CREATE OR REPLACE FUNCTION public.get_current_user_clinic_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN public.get_my_clinic_id();
END;
$$;

COMMENT ON FUNCTION public.get_my_clinic_id() IS
  'Récupère l''ID de la clinique de l''utilisateur connecté (wrapper non ambigu pour RLS).';
COMMENT ON FUNCTION public.get_my_clinic_id(uuid) IS
  'Récupère l''ID de la clinique; accepte un user_id (fallback). Version sans DEFAULT pour éviter ambiguïté.';


