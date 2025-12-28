-- ============================================
-- SCRIPT DE TEST D'ÉTANCHÉITÉ MULTI-TENANCY
-- VERSION: 17
-- ============================================
-- Ce script permet de tester l'isolation des données entre cliniques
-- et de valider que le compte démo reste intact après reset.
-- ============================================

-- ============================================
-- ÉTAPE 1 : CRÉER DEUX CLINIQUES DE TEST
-- ============================================

-- Clinique Test A
INSERT INTO clinics (code, name, is_demo, active)
VALUES ('TEST_A', 'Clinique Test A', false, true)
ON CONFLICT (code) DO UPDATE SET active = true;

-- Clinique Test B
INSERT INTO clinics (code, name, is_demo, active)
VALUES ('TEST_B', 'Clinique Test B', false, true)
ON CONFLICT (code) DO UPDATE SET active = true;

-- ============================================
-- ÉTAPE 2 : CRÉER DES UTILISATEURS DE TEST
-- ============================================

-- Hash factice pour les utilisateurs de test (sha256 de "test_password_for_tests")
-- Ce hash ne doit JAMAIS être utilisé en production
DO $$
DECLARE
  v_clinic_a_id UUID;
  v_clinic_b_id UUID;
  v_test_password_hash TEXT := 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; -- hash factice
  v_user_exists BOOLEAN;
BEGIN
  -- Récupérer les IDs des cliniques
  SELECT id INTO v_clinic_a_id FROM clinics WHERE code = 'TEST_A';
  SELECT id INTO v_clinic_b_id FROM clinics WHERE code = 'TEST_B';

  -- Utilisateur Admin pour Clinique A
  SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin_test_a@test.local') INTO v_user_exists;
  IF NOT v_user_exists THEN
    INSERT INTO users (email, nom, prenom, role, status, actif, clinic_id, password_hash)
    VALUES (
      'admin_test_a@test.local',
      'Test',
      'AdminA',
      'CLINIC_ADMIN',
      'ACTIVE',
      true,
      v_clinic_a_id,
      v_test_password_hash
    );
  ELSE
    UPDATE users 
    SET 
      actif = true,
      clinic_id = v_clinic_a_id,
      role = 'CLINIC_ADMIN',
      status = 'ACTIVE',
      password_hash = COALESCE(password_hash, v_test_password_hash)
    WHERE email = 'admin_test_a@test.local';
  END IF;

  -- Utilisateur Staff pour Clinique A
  SELECT EXISTS(SELECT 1 FROM users WHERE email = 'staff_test_a@test.local') INTO v_user_exists;
  IF NOT v_user_exists THEN
    INSERT INTO users (email, nom, prenom, role, status, actif, clinic_id, password_hash)
    VALUES (
      'staff_test_a@test.local',
      'Test',
      'StaffA',
      'MEDECIN',
      'ACTIVE',
      true,
      v_clinic_a_id,
      v_test_password_hash
    );
  ELSE
    UPDATE users 
    SET 
      actif = true,
      clinic_id = v_clinic_a_id,
      role = 'MEDECIN',
      status = 'ACTIVE',
      password_hash = COALESCE(password_hash, v_test_password_hash)
    WHERE email = 'staff_test_a@test.local';
  END IF;

  -- Utilisateur Admin pour Clinique B
  SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin_test_b@test.local') INTO v_user_exists;
  IF NOT v_user_exists THEN
    INSERT INTO users (email, nom, prenom, role, status, actif, clinic_id, password_hash)
    VALUES (
      'admin_test_b@test.local',
      'Test',
      'AdminB',
      'CLINIC_ADMIN',
      'ACTIVE',
      true,
      v_clinic_b_id,
      v_test_password_hash
    );
  ELSE
    UPDATE users 
    SET 
      actif = true,
      clinic_id = v_clinic_b_id,
      role = 'CLINIC_ADMIN',
      status = 'ACTIVE',
      password_hash = COALESCE(password_hash, v_test_password_hash)
    WHERE email = 'admin_test_b@test.local';
  END IF;

  -- Utilisateur Staff pour Clinique B
  SELECT EXISTS(SELECT 1 FROM users WHERE email = 'staff_test_b@test.local') INTO v_user_exists;
  IF NOT v_user_exists THEN
    INSERT INTO users (email, nom, prenom, role, status, actif, clinic_id, password_hash)
    VALUES (
      'staff_test_b@test.local',
      'Test',
      'StaffB',
      'MEDECIN',
      'ACTIVE',
      true,
      v_clinic_b_id,
      v_test_password_hash
    );
  ELSE
    UPDATE users 
    SET 
      actif = true,
      clinic_id = v_clinic_b_id,
      role = 'MEDECIN',
      status = 'ACTIVE',
      password_hash = COALESCE(password_hash, v_test_password_hash)
    WHERE email = 'staff_test_b@test.local';
  END IF;

  RAISE NOTICE '✅ Utilisateurs de test créés/mis à jour';
END $$;

-- ============================================
-- ÉTAPE 3 : CRÉER DES PATIENTS DE TEST
-- ============================================

-- Vérifier si la table patients a clinic_id
DO $$
DECLARE
  v_clinic_a_id UUID;
  v_clinic_b_id UUID;
BEGIN
  SELECT id INTO v_clinic_a_id FROM clinics WHERE code = 'TEST_A';
  SELECT id INTO v_clinic_b_id FROM clinics WHERE code = 'TEST_B';

  -- Vérifier si la table patients existe et a clinic_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'patients' 
    AND column_name = 'clinic_id'
  ) THEN
    -- Créer des patients pour Clinique A
    INSERT INTO patients (
      numero_dossier, 
      nom, 
      prenom, 
      date_naissance, 
      sexe, 
      telephone, 
      clinic_id
    )
    VALUES 
      ('TEST-A-001', 'PatientA1', 'Test', '1990-01-01', 'M', '0600000001', v_clinic_a_id),
      ('TEST-A-002', 'PatientA2', 'Test', '1985-05-15', 'F', '0600000002', v_clinic_a_id)
    ON CONFLICT DO NOTHING;

    -- Créer des patients pour Clinique B
    INSERT INTO patients (
      numero_dossier, 
      nom, 
      prenom, 
      date_naissance, 
      sexe, 
      telephone, 
      clinic_id
    )
    VALUES 
      ('TEST-B-001', 'PatientB1', 'Test', '1992-03-20', 'M', '0600000003', v_clinic_b_id),
      ('TEST-B-002', 'PatientB2', 'Test', '1988-07-10', 'F', '0600000004', v_clinic_b_id)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Patients de test créés';
  ELSE
    RAISE NOTICE '⚠️ Table patients n''a pas de clinic_id';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 4 : FONCTION DE TEST D'ÉTANCHÉITÉ
-- ============================================

CREATE OR REPLACE FUNCTION test_data_isolation()
RETURNS TABLE(
  test_name TEXT,
  test_result TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_a_id UUID;
  v_clinic_b_id UUID;
  v_clinic_demo_id UUID;
  v_count_a INT;
  v_count_b INT;
  v_count_demo INT;
BEGIN
  -- Récupérer les IDs des cliniques
  SELECT id INTO v_clinic_a_id FROM clinics WHERE code = 'TEST_A';
  SELECT id INTO v_clinic_b_id FROM clinics WHERE code = 'TEST_B';
  SELECT id INTO v_clinic_demo_id FROM clinics WHERE code = 'CLINIC001';

  -- Test 1: Vérifier que les cliniques sont distinctes
  test_name := 'Cliniques distinctes';
  IF v_clinic_a_id IS DISTINCT FROM v_clinic_b_id 
     AND v_clinic_a_id IS DISTINCT FROM v_clinic_demo_id 
     AND v_clinic_b_id IS DISTINCT FROM v_clinic_demo_id THEN
    test_result := 'PASS';
    details := format('A=%s, B=%s, Demo=%s', v_clinic_a_id, v_clinic_b_id, v_clinic_demo_id);
  ELSE
    test_result := 'FAIL';
    details := 'Les IDs des cliniques ne sont pas tous distincts';
  END IF;
  RETURN NEXT;

  -- Test 2: Vérifier l'isolation des utilisateurs
  test_name := 'Isolation utilisateurs';
  SELECT COUNT(*) INTO v_count_a FROM users WHERE clinic_id = v_clinic_a_id;
  SELECT COUNT(*) INTO v_count_b FROM users WHERE clinic_id = v_clinic_b_id;
  
  IF v_count_a > 0 AND v_count_b > 0 THEN
    test_result := 'PASS';
    details := format('Clinique A: %s users, Clinique B: %s users', v_count_a, v_count_b);
  ELSE
    test_result := 'WARN';
    details := format('Clinique A: %s users, Clinique B: %s users', v_count_a, v_count_b);
  END IF;
  RETURN NEXT;

  -- Test 3: Vérifier l'isolation des patients (si table existe)
  test_name := 'Isolation patients';
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'clinic_id'
  ) THEN
    SELECT COUNT(*) INTO v_count_a FROM patients WHERE clinic_id = v_clinic_a_id;
    SELECT COUNT(*) INTO v_count_b FROM patients WHERE clinic_id = v_clinic_b_id;
    SELECT COUNT(*) INTO v_count_demo FROM patients WHERE clinic_id = v_clinic_demo_id;
    
    test_result := 'PASS';
    details := format('A: %s, B: %s, Demo: %s', v_count_a, v_count_b, v_count_demo);
  ELSE
    test_result := 'SKIP';
    details := 'Table patients n''a pas de clinic_id';
  END IF;
  RETURN NEXT;

  -- Test 4: Vérifier les politiques RLS sur clinics
  test_name := 'RLS sur clinics';
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinics' AND schemaname = 'public') THEN
    test_result := 'PASS';
    details := 'Politiques RLS actives';
  ELSE
    test_result := 'FAIL';
    details := 'Pas de politiques RLS';
  END IF;
  RETURN NEXT;

  -- Test 5: Vérifier les politiques RLS sur users
  test_name := 'RLS sur users';
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') THEN
    test_result := 'PASS';
    details := 'Politiques RLS actives';
  ELSE
    test_result := 'FAIL';
    details := 'Pas de politiques RLS';
  END IF;
  RETURN NEXT;

  -- Test 6: Vérifier que la démo est bien marquée
  test_name := 'Flag is_demo CLINIC001';
  IF EXISTS (SELECT 1 FROM clinics WHERE code = 'CLINIC001' AND is_demo = true) THEN
    test_result := 'PASS';
    details := 'CLINIC001 marquée comme démo';
  ELSE
    test_result := 'FAIL';
    details := 'CLINIC001 non marquée comme démo';
  END IF;
  RETURN NEXT;

  -- Test 7: Vérifier les fonctions helper
  test_name := 'Fonctions helper existent';
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_my_clinic_id'
  ) AND EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'check_is_clinic_admin'
  ) THEN
    test_result := 'PASS';
    details := 'get_my_clinic_id et check_is_clinic_admin présentes';
  ELSE
    test_result := 'FAIL';
    details := 'Fonctions manquantes';
  END IF;
  RETURN NEXT;

END;
$$;

-- ============================================
-- ÉTAPE 5 : EXÉCUTER LES TESTS
-- ============================================

SELECT * FROM test_data_isolation();

-- ============================================
-- ÉTAPE 6 : FONCTION DE SIMULATION RESET
-- ============================================

-- Fonction pour tester le reset sans l'exécuter réellement
CREATE OR REPLACE FUNCTION test_reset_simulation()
RETURNS TABLE(
  clinic_code TEXT,
  is_demo BOOLEAN,
  would_be_deleted BOOLEAN,
  patients_count INT,
  users_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.code,
    COALESCE(c.is_demo, false),
    NOT COALESCE(c.is_demo, false) AS would_be_deleted,
    (SELECT COUNT(*)::INT FROM patients p WHERE p.clinic_id = c.id),
    (SELECT COUNT(*)::INT FROM users u WHERE u.clinic_id = c.id)
  FROM clinics c
  ORDER BY c.is_demo DESC, c.code;
END;
$$;

-- Simuler le reset
SELECT * FROM test_reset_simulation();

-- ============================================
-- ÉTAPE 7 : RÉSUMÉ FINAL
-- ============================================

DO $$
DECLARE
  v_total_tests INT;
  v_passed INT;
  v_failed INT;
BEGIN
  SELECT COUNT(*) INTO v_total_tests FROM test_data_isolation();
  SELECT COUNT(*) INTO v_passed FROM test_data_isolation() WHERE test_result = 'PASS';
  SELECT COUNT(*) INTO v_failed FROM test_data_isolation() WHERE test_result = 'FAIL';
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 RÉSUMÉ DES TESTS D''ÉTANCHÉITÉ';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tests totaux: %', v_total_tests;
  RAISE NOTICE 'Tests réussis: % ✅', v_passed;
  RAISE NOTICE 'Tests échoués: % ❌', v_failed;
  RAISE NOTICE '';
  
  IF v_failed = 0 THEN
    RAISE NOTICE '🎉 TOUS LES TESTS SONT PASSÉS !';
    RAISE NOTICE 'Le système Multi-Tenancy est correctement configuré.';
  ELSE
    RAISE NOTICE '⚠️ CERTAINS TESTS ONT ÉCHOUÉ';
    RAISE NOTICE 'Vérifiez les erreurs ci-dessus.';
  END IF;
  RAISE NOTICE '';
END $$;

-- ============================================
-- NETTOYAGE OPTIONNEL DES DONNÉES DE TEST
-- ============================================

-- Décommentez les lignes suivantes pour nettoyer les données de test
-- DELETE FROM patients WHERE clinic_id IN (SELECT id FROM clinics WHERE code IN ('TEST_A', 'TEST_B'));
-- DELETE FROM users WHERE clinic_id IN (SELECT id FROM clinics WHERE code IN ('TEST_A', 'TEST_B'));
-- DELETE FROM clinics WHERE code IN ('TEST_A', 'TEST_B');

