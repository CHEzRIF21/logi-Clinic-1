-- ============================================
-- CORRECTION : Validation du Code Clinique
-- VERSION: 25
-- ============================================
-- Problèmes corrigés :
-- 1. Fonction validate_clinic_code avec type de retour incorrect
-- 2. Politiques RLS qui bloquent l'accès anonyme
-- ============================================

-- ============================================
-- ÉTAPE 1 : SUPPRIMER L'ANCIENNE FONCTION validate_clinic_code
-- ============================================

DROP FUNCTION IF EXISTS validate_clinic_code(TEXT);

-- ============================================
-- ÉTAPE 2 : CRÉER LA FONCTION validate_clinic_code AVEC JSONB
-- ============================================

CREATE OR REPLACE FUNCTION validate_clinic_code(p_clinic_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic RECORD;
  v_result JSONB;
BEGIN
  -- Rechercher la clinique par code
  SELECT 
    id,
    code,
    name,
    active,
    is_demo,
    is_temporary_code,
    requires_code_change
  INTO v_clinic
  FROM clinics
  WHERE code = UPPER(TRIM(p_clinic_code))
  LIMIT 1;
  
  IF v_clinic IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Code clinique introuvable'
    );
  END IF;
  
  IF NOT v_clinic.active THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Clinique inactive'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'clinic', jsonb_build_object(
      'id', v_clinic.id,
      'code', v_clinic.code,
      'name', v_clinic.name,
      'active', v_clinic.active,
      'is_demo', COALESCE(v_clinic.is_demo, false),
      'is_temporary_code', COALESCE(v_clinic.is_temporary_code, false),
      'requires_code_change', COALESCE(v_clinic.requires_code_change, false)
    )
  );
END;
$$;

-- Permettre l'exécution publique
GRANT EXECUTE ON FUNCTION validate_clinic_code(TEXT) TO anon, authenticated;

-- ============================================
-- ÉTAPE 3 : CORRIGER LES POLITIQUES RLS POUR CLINICS
-- ============================================

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques pour repartir à zéro
DROP POLICY IF EXISTS "clinics_public_read" ON clinics;
DROP POLICY IF EXISTS "clinics_authenticated_read" ON clinics;
DROP POLICY IF EXISTS "clinics_super_admin_all" ON clinics;
DROP POLICY IF EXISTS "public_read_active_clinics" ON clinics;
DROP POLICY IF EXISTS "anon_read_active_clinics" ON clinics;
DROP POLICY IF EXISTS "clinic_users_read_own_clinic" ON clinics;
DROP POLICY IF EXISTS "super_admin_all_clinics" ON clinics;

-- Politique 1 : Lecture publique des cliniques actives (pour validation du code)
CREATE POLICY "clinics_public_read" ON clinics
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Politique 2 : Lecture pour utilisateurs authentifiés (toutes les cliniques)
CREATE POLICY "clinics_authenticated_read" ON clinics
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique 3 : Accès complet pour Super Admins
CREATE POLICY "clinics_super_admin_all" ON clinics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- ÉTAPE 4 : VÉRIFICATION
-- ============================================

DO $$
DECLARE
  v_policy_count INT;
  v_test_result JSONB;
BEGIN
  -- Compter les politiques
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' 
    AND tablename = 'clinics';
  
  RAISE NOTICE '✅ Politiques RLS sur clinics: %', v_policy_count;
  
  -- Tester la fonction
  SELECT validate_clinic_code('CLIN-2025-001') INTO v_test_result;
  
  IF v_test_result->>'success' = 'true' THEN
    RAISE NOTICE '✅ Fonction validate_clinic_code fonctionne correctement';
  ELSE
    RAISE WARNING '⚠️ Fonction validate_clinic_code retourne une erreur: %', v_test_result->>'error';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION 25 TERMINÉE';
  RAISE NOTICE '========================================';
END $$;

-- Afficher le résumé
SELECT 
  'Migration 25 terminée' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clinics') as rls_policies_count,
  (SELECT validate_clinic_code('CLIN-2025-001')->>'success') as test_function_result;

