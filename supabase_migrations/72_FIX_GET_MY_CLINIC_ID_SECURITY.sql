-- ============================================
-- MIGRATION 72: CORRECTION get_my_clinic_id() - Vérification actif/status
-- ============================================
-- Problème: La fonction get_my_clinic_id() ne vérifie pas si l'utilisateur est actif
-- Impact: Les policies RLS peuvent permettre l'accès aux données même si l'utilisateur est inactif
-- Solution: Ajouter vérification actif=true et status IN ('ACTIVE', 'APPROVED')
-- ============================================

BEGIN;

-- ============================================
-- 1. CORRIGER get_my_clinic_id() SANS PARAMÈTRE
-- ============================================
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- SÉCURITÉ: Vérifier que l'utilisateur est actif et approuvé
  SELECT clinic_id INTO v_clinic_id
  FROM users
  WHERE auth_user_id = auth.uid()
    AND actif = true
    AND status IN ('ACTIVE', 'APPROVED') -- Exclure PENDING, SUSPENDED, REJECTED
  LIMIT 1;
  
  RETURN v_clinic_id;
END;
$$;

COMMENT ON FUNCTION get_my_clinic_id() IS 
  'Récupère l''ID de la clinique de l''utilisateur connecté. Retourne NULL si l''utilisateur est inactif, en attente, suspendu ou rejeté. Utilisé par les policies RLS pour l''isolation multi-tenant.';

-- ============================================
-- 2. CORRIGER get_my_clinic_id() AVEC PARAMÈTRE (si existe)
-- ============================================
-- Vérifier si la version avec paramètre existe
DO $$
BEGIN
  -- Si la fonction avec paramètre existe, la mettre à jour aussi
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'get_my_clinic_id'
      AND pg_get_function_arguments(p.oid) LIKE '%uuid%'
  ) THEN
    -- Recréer la version avec paramètre (sans DEFAULT pour éviter ambiguïté)
    EXECUTE '
      CREATE OR REPLACE FUNCTION get_my_clinic_id(p_user_id uuid)
      RETURNS uuid
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      STABLE
      AS $func$
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
            AND status IN (''ACTIVE'', ''APPROVED'')
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
            AND status IN (''ACTIVE'', ''APPROVED'')
          LIMIT 1;

          IF v_clinic_id IS NOT NULL THEN
            RETURN v_clinic_id;
          END IF;
        END IF;

        RETURN NULL;
      END;
      $func$;
    ';
    
    RAISE NOTICE '✅ Version paramétrée de get_my_clinic_id() mise à jour';
  ELSE
    RAISE NOTICE 'ℹ️ Version paramétrée de get_my_clinic_id() n''existe pas, ignorée';
  END IF;
END $$;

-- ============================================
-- 3. METTRE À JOUR L'ALIAS get_current_user_clinic_id()
-- ============================================
CREATE OR REPLACE FUNCTION get_current_user_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN get_my_clinic_id();
END;
$$;

COMMENT ON FUNCTION get_current_user_clinic_id() IS 
  'Alias pour get_my_clinic_id(). Récupère l''ID de la clinique de l''utilisateur connecté.';

-- ============================================
-- 4. VÉRIFIER QUE LES POLICIES RLS UTILISENT LA FONCTION
-- ============================================
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  -- Compter les policies qui utilisent get_my_clinic_id()
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual LIKE '%get_my_clinic_id%' OR with_check LIKE '%get_my_clinic_id%');
  
  RAISE NOTICE '✅ % policies RLS utilisent get_my_clinic_id()', v_policy_count;
  
  IF v_policy_count = 0 THEN
    RAISE WARNING '⚠️ Aucune policy RLS n''utilise get_my_clinic_id(). Vérifiez la configuration.';
  END IF;
END $$;

COMMIT;

-- ============================================
-- NOTES DE MIGRATION
-- ============================================
-- Cette migration corrige une faille de sécurité critique:
-- - AVANT: Un utilisateur inactif pouvait toujours avoir son clinic_id retourné
-- - APRÈS: Seuls les utilisateurs actifs et approuvés peuvent avoir leur clinic_id retourné
--
-- Impact sur les policies RLS:
-- - Toutes les policies qui utilisent get_my_clinic_id() bénéficient automatiquement de cette correction
-- - Les utilisateurs PENDING, SUSPENDED, REJECTED ne pourront plus accéder aux données de leur clinique
--
-- Tests recommandés après migration:
-- 1. Créer un utilisateur avec status='PENDING', actif=false
-- 2. Tenter d'accéder aux données via API
-- 3. Vérifier que l'accès est refusé (get_my_clinic_id() retourne NULL)
