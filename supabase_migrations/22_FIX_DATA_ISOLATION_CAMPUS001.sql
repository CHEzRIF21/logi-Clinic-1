-- ============================================
-- CORRECTION ISOLATION DES DONNÉES CAMPUS-001
-- VERSION: 22
-- ============================================
-- Ce script corrige l'isolation des données pour s'assurer que:
-- 1. Les données de demo (CLINIC001) restent dans CLINIC001
-- 2. CAMPUS-001 n'a aucune donnée (patients, consultations, etc.)
-- 3. Les politiques RLS fonctionnent correctement
-- ============================================

-- ============================================
-- ÉTAPE 1 : VÉRIFIER ET CORRIGER LES CLINIQUES
-- ============================================

DO $$
DECLARE
  v_clinic_demo_id UUID;
  v_clinic_campus_id UUID;
  v_demo_patients_count INT;
  v_campus_patients_count INT;
  v_demo_consultations_count INT;
  v_campus_consultations_count INT;
BEGIN
  -- Récupérer les IDs des cliniques
  SELECT id INTO v_clinic_demo_id FROM clinics WHERE code = 'CLINIC001';
  SELECT id INTO v_clinic_campus_id FROM clinics WHERE code = 'CAMPUS-001';

  IF v_clinic_demo_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CLINIC001 (demo) non trouvée';
  END IF;

  IF v_clinic_campus_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 non trouvée';
  END IF;

  RAISE NOTICE '✅ Cliniques trouvées:';
  RAISE NOTICE '   - CLINIC001 (demo): %', v_clinic_demo_id;
  RAISE NOTICE '   - CAMPUS-001: %', v_clinic_campus_id;

  -- Compter les patients avant correction
  SELECT COUNT(*) INTO v_demo_patients_count FROM patients WHERE clinic_id = v_clinic_demo_id;
  SELECT COUNT(*) INTO v_campus_patients_count FROM patients WHERE clinic_id = v_clinic_campus_id;
  
  SELECT COUNT(*) INTO v_demo_consultations_count FROM consultations WHERE clinic_id = v_clinic_demo_id;
  SELECT COUNT(*) INTO v_campus_consultations_count FROM consultations WHERE clinic_id = v_clinic_campus_id;

  RAISE NOTICE '';
  RAISE NOTICE '📊 État actuel des données:';
  RAISE NOTICE '   CLINIC001 - Patients: %, Consultations: %', v_demo_patients_count, v_demo_consultations_count;
  RAISE NOTICE '   CAMPUS-001 - Patients: %, Consultations: %', v_campus_patients_count, v_campus_consultations_count;
END $$;

-- ============================================
-- ÉTAPE 2 : ASSIGNER TOUTES LES DONNÉES SANS CLINIC_ID À LA CLINIQUE DEMO
-- ============================================

DO $$
DECLARE
  v_clinic_demo_id UUID;
  v_updated_count INT;
BEGIN
  SELECT id INTO v_clinic_demo_id FROM clinics WHERE code = 'CLINIC001';

  -- Assigner les patients sans clinic_id à la clinique demo
  UPDATE patients
  SET clinic_id = v_clinic_demo_id, updated_at = NOW()
  WHERE clinic_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ % patients sans clinic_id assignés à CLINIC001', v_updated_count;
  END IF;

  -- Assigner les consultations sans clinic_id à la clinique demo
  UPDATE consultations
  SET clinic_id = v_clinic_demo_id, updated_at = NOW()
  WHERE clinic_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ % consultations sans clinic_id assignées à CLINIC001', v_updated_count;
  END IF;

  -- Assigner les prescriptions sans clinic_id à la clinique demo
  UPDATE prescriptions
  SET clinic_id = v_clinic_demo_id, updated_at = NOW()
  WHERE clinic_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ % prescriptions sans clinic_id assignées à CLINIC001', v_updated_count;
  END IF;

  -- Assigner les factures sans clinic_id à la clinique demo
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'factures') THEN
    UPDATE factures
    SET clinic_id = v_clinic_demo_id, updated_at = NOW()
    WHERE clinic_id IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count > 0 THEN
      RAISE NOTICE '✅ % factures sans clinic_id assignées à CLINIC001', v_updated_count;
    END IF;
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : SUPPRIMER TOUTES LES DONNÉES DE CAMPUS-001
-- ============================================

DO $$
DECLARE
  v_clinic_campus_id UUID;
  v_deleted_count INT;
BEGIN
  SELECT id INTO v_clinic_campus_id FROM clinics WHERE code = 'CAMPUS-001';

  RAISE NOTICE '';
  RAISE NOTICE '🗑️  Suppression des données de CAMPUS-001...';

  -- Supprimer dans l'ordre pour respecter les contraintes FK
  
  -- Prescriptions
  DELETE FROM prescriptions WHERE clinic_id = v_clinic_campus_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  IF v_deleted_count > 0 THEN
    RAISE NOTICE '   - % prescriptions supprimées', v_deleted_count;
  END IF;

  -- Consultations
  DELETE FROM consultations WHERE clinic_id = v_clinic_campus_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  IF v_deleted_count > 0 THEN
    RAISE NOTICE '   - % consultations supprimées', v_deleted_count;
  END IF;

  -- Patients
  DELETE FROM patients WHERE clinic_id = v_clinic_campus_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  IF v_deleted_count > 0 THEN
    RAISE NOTICE '   - % patients supprimés', v_deleted_count;
  END IF;

  -- Factures
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'factures') THEN
    DELETE FROM factures WHERE clinic_id = v_clinic_campus_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
      RAISE NOTICE '   - % factures supprimées', v_deleted_count;
    END IF;
  END IF;

  -- Paiements
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'paiements') THEN
    DELETE FROM paiements WHERE clinic_id = v_clinic_campus_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
      RAISE NOTICE '   - % paiements supprimés', v_deleted_count;
    END IF;
  END IF;

  -- Lab requests
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_requests') THEN
    DELETE FROM lab_requests WHERE clinic_id = v_clinic_campus_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
      RAISE NOTICE '   - % demandes lab supprimées', v_deleted_count;
    END IF;
  END IF;

  -- Imaging requests
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'imaging_requests') THEN
    DELETE FROM imaging_requests WHERE clinic_id = v_clinic_campus_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
      RAISE NOTICE '   - % demandes imagerie supprimées', v_deleted_count;
    END IF;
  END IF;

  RAISE NOTICE '✅ Toutes les données de CAMPUS-001 ont été supprimées';
END $$;

-- ============================================
-- ÉTAPE 4 : VÉRIFIER ET CORRIGER LES POLITIQUES RLS
-- ============================================

DO $$
DECLARE
  v_patients_rls_enabled BOOLEAN;
  v_policy_exists BOOLEAN;
BEGIN
  -- Vérifier si RLS est activé sur patients
  SELECT relrowsecurity INTO v_patients_rls_enabled
  FROM pg_class
  WHERE relname = 'patients' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  IF NOT v_patients_rls_enabled THEN
    ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS activé sur la table patients';
  ELSE
    RAISE NOTICE 'ℹ️  RLS déjà activé sur la table patients';
  END IF;

  -- Vérifier si la politique existe
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patients'
      AND policyname = 'clinic_users_own_patients'
  ) INTO v_policy_exists;

  IF NOT v_policy_exists THEN
    -- Créer la politique RLS pour patients
    CREATE POLICY "clinic_users_own_patients" ON patients
    FOR ALL TO authenticated
    USING (clinic_id = get_my_clinic_id())
    WITH CHECK (clinic_id = get_my_clinic_id());
    
    RAISE NOTICE '✅ Politique RLS créée pour patients';
  ELSE
    RAISE NOTICE 'ℹ️  Politique RLS existe déjà pour patients';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  v_clinic_demo_id UUID;
  v_clinic_campus_id UUID;
  v_demo_patients_count INT;
  v_campus_patients_count INT;
  v_demo_consultations_count INT;
  v_campus_consultations_count INT;
  v_null_patients_count INT;
BEGIN
  SELECT id INTO v_clinic_demo_id FROM clinics WHERE code = 'CLINIC001';
  SELECT id INTO v_clinic_campus_id FROM clinics WHERE code = 'CAMPUS-001';

  -- Compter les patients
  SELECT COUNT(*) INTO v_demo_patients_count FROM patients WHERE clinic_id = v_clinic_demo_id;
  SELECT COUNT(*) INTO v_campus_patients_count FROM patients WHERE clinic_id = v_clinic_campus_id;
  SELECT COUNT(*) INTO v_null_patients_count FROM patients WHERE clinic_id IS NULL;
  
  SELECT COUNT(*) INTO v_demo_consultations_count FROM consultations WHERE clinic_id = v_clinic_demo_id;
  SELECT COUNT(*) INTO v_campus_consultations_count FROM consultations WHERE clinic_id = v_clinic_campus_id;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECTION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 État final des données:';
  RAISE NOTICE '   CLINIC001 (demo):';
  RAISE NOTICE '     - Patients: %', v_demo_patients_count;
  RAISE NOTICE '     - Consultations: %', v_demo_consultations_count;
  RAISE NOTICE '   CAMPUS-001:';
  RAISE NOTICE '     - Patients: %', v_campus_patients_count;
  RAISE NOTICE '     - Consultations: %', v_campus_consultations_count;
  RAISE NOTICE '   Patients sans clinic_id: %', v_null_patients_count;
  RAISE NOTICE '';
  
  IF v_campus_patients_count = 0 AND v_campus_consultations_count = 0 THEN
    RAISE NOTICE '✅ CAMPUS-001 est maintenant vide (comme attendu)';
  ELSE
    RAISE WARNING '⚠️  CAMPUS-001 contient encore des données!';
  END IF;

  IF v_null_patients_count > 0 THEN
    RAISE WARNING '⚠️  Il y a encore % patients sans clinic_id!', v_null_patients_count;
  END IF;
END $$;

-- ============================================
-- ÉTAPE 6 : VÉRIFIER ET CRÉER LA FONCTION get_my_clinic_id()
-- ============================================

-- Créer ou remplacer la fonction get_my_clinic_id()
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
  SELECT clinic_id INTO v_clinic_id
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_clinic_id;
END;
$$;

-- Vérifier que la fonction existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_my_clinic_id'
  ) THEN
    RAISE NOTICE '✅ Fonction get_my_clinic_id() créée/vérifiée';
  ELSE
    RAISE WARNING '⚠️  La fonction get_my_clinic_id() n''a pas pu être créée!';
  END IF;
END $$;

-- ============================================
-- RÉSUMÉ
-- ============================================

SELECT 
  'CORRECTION ISOLATION DES DONNÉES TERMINÉE' as status,
  (SELECT COUNT(*) FROM patients WHERE clinic_id = (SELECT id FROM clinics WHERE code = 'CLINIC001')) as demo_patients,
  (SELECT COUNT(*) FROM patients WHERE clinic_id = (SELECT id FROM clinics WHERE code = 'CAMPUS-001')) as campus_patients,
  (SELECT COUNT(*) FROM patients WHERE clinic_id IS NULL) as null_clinic_patients;

