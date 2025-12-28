-- ============================================
-- CORRECTION COMPLÈTE : MULTI-TENANCY ET AUTHENTIFICATION
-- VERSION: 23
-- ============================================
-- Ce script corrige les 3 problèmes majeurs:
-- 1. Authentification des comptes démo (CLINIC-001)
-- 2. Mise à jour du statut après changement de mot de passe
-- 3. Isolation des données par clinic_id
-- ============================================

-- ============================================
-- ÉTAPE 1 : FONCTION RPC POUR MISE À JOUR DU STATUT
-- ============================================

-- Fonction pour mettre à jour le statut utilisateur après changement de mot de passe
-- Cette fonction contourne RLS grâce à SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_user_status_after_password_change(
  p_email TEXT,
  p_clinic_id UUID DEFAULT NULL,
  p_auth_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET 
    status = 'ACTIVE',
    temp_code_used = true,
    first_login_at = COALESCE(first_login_at, NOW()),
    updated_at = NOW()
  WHERE 
    LOWER(TRIM(email)) = LOWER(TRIM(p_email))
    AND (p_clinic_id IS NULL OR clinic_id = p_clinic_id)
    AND (p_auth_user_id IS NULL OR auth_user_id = p_auth_user_id);
  
  -- FOUND est automatiquement défini à true si UPDATE a affecté des lignes
  RETURN FOUND;
END;
$$;

-- Vérifier que la fonction existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_user_status_after_password_change'
  ) THEN
    RAISE NOTICE '✅ Fonction update_user_status_after_password_change créée';
  ELSE
    RAISE WARNING '❌ Fonction update_user_status_after_password_change non créée!';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : VÉRIFIER ET CONFIGURER CLINIC001 (DÉMO)
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_admin_password_hash TEXT;
  v_medecin_password_hash TEXT;
  v_infirmier_password_hash TEXT;
  v_receptionniste_password_hash TEXT;
BEGIN
  -- Générer les hash de mots de passe pour les comptes démo
  v_admin_password_hash := encode(digest('admin123' || 'logi_clinic_salt', 'sha256'), 'hex');
  v_medecin_password_hash := encode(digest('medecin123' || 'logi_clinic_salt', 'sha256'), 'hex');
  v_infirmier_password_hash := encode(digest('infirmier123' || 'logi_clinic_salt', 'sha256'), 'hex');
  v_receptionniste_password_hash := encode(digest('receptionniste123' || 'logi_clinic_salt', 'sha256'), 'hex');

  -- 1. S'assurer que CLINIC001 existe et est marquée comme démo
  INSERT INTO clinics (
    code,
    name,
    address,
    phone,
    email,
    active,
    is_demo,
    is_temporary_code,
    requires_code_change,
    created_at,
    updated_at
  )
  VALUES (
    'CLINIC001',
    'Clinique Démo',
    'Adresse de démonstration',
    '+229 00000000',
    'demo@clinique.local',
    true,
    true,  -- Marquée comme démo
    false,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (code) DO UPDATE SET
    name = 'Clinique Démo',
    active = true,
    is_demo = true,
    is_temporary_code = false,
    requires_code_change = false,
    updated_at = NOW()
  RETURNING id INTO v_clinic_id;

  RAISE NOTICE '✅ Clinique CLINIC001 configurée comme démo (ID: %)', v_clinic_id;

  -- 2. Créer/Mettre à jour les utilisateurs démo avec status ACTIVE
  -- Admin
  INSERT INTO users (
    email, nom, prenom, role, clinic_id, status, actif, password_hash, created_at, updated_at
  ) VALUES (
    'admin', 'Admin', 'Démo', 'CLINIC_ADMIN', v_clinic_id, 'ACTIVE', true, v_admin_password_hash, NOW(), NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    clinic_id = v_clinic_id,
    role = 'CLINIC_ADMIN',
    status = 'ACTIVE',
    actif = true,
    password_hash = v_admin_password_hash,
    updated_at = NOW();

  -- Médecin
  INSERT INTO users (
    email, nom, prenom, role, clinic_id, status, actif, password_hash, created_at, updated_at
  ) VALUES (
    'medecin', 'Médecin', 'Démo', 'MEDECIN', v_clinic_id, 'ACTIVE', true, v_medecin_password_hash, NOW(), NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    clinic_id = v_clinic_id,
    role = 'MEDECIN',
    status = 'ACTIVE',
    actif = true,
    password_hash = v_medecin_password_hash,
    updated_at = NOW();

  -- Infirmier
  INSERT INTO users (
    email, nom, prenom, role, clinic_id, status, actif, password_hash, created_at, updated_at
  ) VALUES (
    'infirmier', 'Infirmier', 'Démo', 'INFIRMIER', v_clinic_id, 'ACTIVE', true, v_infirmier_password_hash, NOW(), NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    clinic_id = v_clinic_id,
    role = 'INFIRMIER',
    status = 'ACTIVE',
    actif = true,
    password_hash = v_infirmier_password_hash,
    updated_at = NOW();

  -- Réceptionniste
  INSERT INTO users (
    email, nom, prenom, role, clinic_id, status, actif, password_hash, created_at, updated_at
  ) VALUES (
    'receptionniste', 'Réceptionniste', 'Démo', 'RECEPTIONNISTE', v_clinic_id, 'ACTIVE', true, v_receptionniste_password_hash, NOW(), NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    clinic_id = v_clinic_id,
    role = 'RECEPTIONNISTE',
    status = 'ACTIVE',
    actif = true,
    password_hash = v_receptionniste_password_hash,
    updated_at = NOW();

  RAISE NOTICE '✅ Utilisateurs démo créés/mis à jour avec status ACTIVE';
END $$;

-- ============================================
-- ÉTAPE 3 : ISOLATION DES DONNÉES - ASSIGNER clinic_id
-- ============================================

DO $$
DECLARE
  v_clinic_demo_id UUID;
  v_clinic_campus_id UUID;
  v_updated_count INT;
BEGIN
  SELECT id INTO v_clinic_demo_id FROM clinics WHERE code = 'CLINIC001';
  SELECT id INTO v_clinic_campus_id FROM clinics WHERE code = 'CAMPUS-001';

  IF v_clinic_demo_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CLINIC001 non trouvée';
  END IF;

  RAISE NOTICE '📊 Correction de l''isolation des données...';

  -- Assigner tous les patients sans clinic_id à la clinique démo
  UPDATE patients
  SET clinic_id = v_clinic_demo_id, updated_at = NOW()
  WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '   - % patients sans clinic_id assignés à CLINIC001', v_updated_count;
  END IF;

  -- Assigner toutes les consultations sans clinic_id à la clinique démo
  UPDATE consultations
  SET clinic_id = v_clinic_demo_id, updated_at = NOW()
  WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '   - % consultations sans clinic_id assignées à CLINIC001', v_updated_count;
  END IF;

  -- Assigner toutes les prescriptions sans clinic_id à la clinique démo
  UPDATE prescriptions
  SET clinic_id = v_clinic_demo_id, updated_at = NOW()
  WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '   - % prescriptions sans clinic_id assignées à CLINIC001', v_updated_count;
  END IF;

  -- Supprimer les données de CAMPUS-001 si elles existent
  IF v_clinic_campus_id IS NOT NULL THEN
    DELETE FROM prescriptions WHERE clinic_id = v_clinic_campus_id;
    DELETE FROM consultations WHERE clinic_id = v_clinic_campus_id;
    DELETE FROM patients WHERE clinic_id = v_clinic_campus_id;
    RAISE NOTICE '✅ Données de CAMPUS-001 nettoyées (clinique vide)';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 4 : FONCTION HELPER POUR RÉCUPÉRER clinic_id DEPUIS LE CONTEXTE
-- ============================================

-- Créer ou remplacer la fonction get_current_user_clinic_id
CREATE OR REPLACE FUNCTION get_current_user_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- Essayer de récupérer via auth.uid()
  SELECT clinic_id INTO v_clinic_id
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_clinic_id;
END;
$$;

-- Alias pour compatibilité
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN get_current_user_clinic_id();
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonctions get_current_user_clinic_id et get_my_clinic_id créées';
END $$;

-- ============================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  v_clinic_demo_id UUID;
  v_clinic_campus_id UUID;
  v_demo_patients INT;
  v_campus_patients INT;
  v_null_patients INT;
  v_demo_users INT;
BEGIN
  SELECT id INTO v_clinic_demo_id FROM clinics WHERE code = 'CLINIC001';
  SELECT id INTO v_clinic_campus_id FROM clinics WHERE code = 'CAMPUS-001';

  -- Compter les patients par clinique
  SELECT COUNT(*) INTO v_demo_patients FROM patients WHERE clinic_id = v_clinic_demo_id;
  SELECT COUNT(*) INTO v_campus_patients FROM patients WHERE clinic_id = v_clinic_campus_id;
  SELECT COUNT(*) INTO v_null_patients FROM patients WHERE clinic_id IS NULL;
  
  -- Compter les utilisateurs démo
  SELECT COUNT(*) INTO v_demo_users 
  FROM users 
  WHERE clinic_id = v_clinic_demo_id 
    AND email IN ('admin', 'medecin', 'infirmier', 'receptionniste');

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION 23 TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 État des données:';
  RAISE NOTICE '   CLINIC001 (démo):';
  RAISE NOTICE '     - Patients: %', v_demo_patients;
  RAISE NOTICE '     - Utilisateurs démo: %', v_demo_users;
  RAISE NOTICE '   CAMPUS-001:';
  RAISE NOTICE '     - Patients: % (devrait être 0)', v_campus_patients;
  RAISE NOTICE '   Patients sans clinic_id: % (devrait être 0)', v_null_patients;
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Comptes démo disponibles:';
  RAISE NOTICE '   - admin / admin123 (CLINIC_ADMIN)';
  RAISE NOTICE '   - medecin / medecin123 (MEDECIN)';
  RAISE NOTICE '   - infirmier / infirmier123 (INFIRMIER)';
  RAISE NOTICE '   - receptionniste / receptionniste123 (RECEPTIONNISTE)';
  RAISE NOTICE '';
END $$;

-- Afficher le résumé final
SELECT 
  c.code as clinic_code,
  c.name as clinic_name,
  c.is_demo,
  c.active,
  (SELECT COUNT(*) FROM patients p WHERE p.clinic_id = c.id) as patients_count,
  (SELECT COUNT(*) FROM users u WHERE u.clinic_id = c.id) as users_count
FROM clinics c
WHERE c.code IN ('CLINIC001', 'CAMPUS-001')
ORDER BY c.code;

