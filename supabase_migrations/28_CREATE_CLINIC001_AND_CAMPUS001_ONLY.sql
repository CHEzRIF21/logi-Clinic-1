-- ============================================
-- MIGRATION CONSOLIDÉE : CLINIC001 ET CAMPUS-001 UNIQUEMENT
-- ============================================
-- Ce script crée/vérifie uniquement les deux cliniques nécessaires :
-- 1. CLINIC001 - Clinique Démo (avec comptes démo)
-- 2. CAMPUS-001 - Clinique du Campus (avec compte admin)
-- ============================================

-- ============================================
-- ÉTAPE 1 : CRÉER/VÉRIFIER CLINIC001 (DÉMO)
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_super_admin_id UUID;
  v_admin_password_hash TEXT;
  v_medecin_password_hash TEXT;
  v_infirmier_password_hash TEXT;
  v_receptionniste_password_hash TEXT;
BEGIN
  -- Récupérer le Super Admin
  SELECT id INTO v_super_admin_id 
  FROM users 
  WHERE role = 'SUPER_ADMIN' 
  LIMIT 1;

  -- Générer les hash de mots de passe pour les comptes démo
  v_admin_password_hash := encode(digest('admin123' || 'logi_clinic_salt', 'sha256'), 'hex');
  v_medecin_password_hash := encode(digest('medecin123' || 'logi_clinic_salt', 'sha256'), 'hex');
  v_infirmier_password_hash := encode(digest('infirmier123' || 'logi_clinic_salt', 'sha256'), 'hex');
  v_receptionniste_password_hash := encode(digest('receptionniste123' || 'logi_clinic_salt', 'sha256'), 'hex');

  -- Créer ou mettre à jour la clinique démo
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
    created_by_super_admin,
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
    false, -- Code permanent
    false, -- Pas de changement de code requis
    v_super_admin_id,
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

  RAISE NOTICE '✅ Clinique CLINIC001 créée/vérifiée (ID: %)', v_clinic_id;

  -- Créer/Mettre à jour les utilisateurs démo
  -- Admin
  INSERT INTO users (
    auth_user_id,
    email,
    nom,
    prenom,
    role,
    clinic_id,
    status,
    actif,
    password_hash,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    NULL,
    'admin',
    'Admin',
    'Démo',
    'CLINIC_ADMIN',
    v_clinic_id,
    'ACTIVE',
    true,
    v_admin_password_hash,
    v_super_admin_id,
    NOW(),
    NOW()
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
    auth_user_id,
    email,
    nom,
    prenom,
    role,
    clinic_id,
    status,
    actif,
    password_hash,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    NULL,
    'medecin',
    'Médecin',
    'Démo',
    'MEDECIN',
    v_clinic_id,
    'ACTIVE',
    true,
    v_medecin_password_hash,
    v_super_admin_id,
    NOW(),
    NOW()
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
    auth_user_id,
    email,
    nom,
    prenom,
    role,
    clinic_id,
    status,
    actif,
    password_hash,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    NULL,
    'infirmier',
    'Infirmier',
    'Démo',
    'INFIRMIER',
    v_clinic_id,
    'ACTIVE',
    true,
    v_infirmier_password_hash,
    v_super_admin_id,
    NOW(),
    NOW()
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
    auth_user_id,
    email,
    nom,
    prenom,
    role,
    clinic_id,
    status,
    actif,
    password_hash,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    NULL,
    'receptionniste',
    'Réceptionniste',
    'Démo',
    'RECEPTIONNISTE',
    v_clinic_id,
    'ACTIVE',
    true,
    v_receptionniste_password_hash,
    v_super_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    clinic_id = v_clinic_id,
    role = 'RECEPTIONNISTE',
    status = 'ACTIVE',
    actif = true,
    password_hash = v_receptionniste_password_hash,
    updated_at = NOW();

  RAISE NOTICE '✅ Utilisateurs démo CLINIC001 créés/mis à jour';
END $$;

-- ============================================
-- ÉTAPE 2 : CRÉER/VÉRIFIER CAMPUS-001
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_super_admin_id UUID;
  v_user_id UUID;
  v_password_hash TEXT;
  v_existing_clinic_id UUID;
BEGIN
  -- Récupérer le Super Admin
  SELECT id INTO v_super_admin_id 
  FROM users 
  WHERE role = 'SUPER_ADMIN' 
  LIMIT 1;

  -- Vérifier si la clinique existe
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';

  IF v_clinic_id IS NULL THEN
    -- Créer la clinique
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
      created_by_super_admin,
      created_at,
      updated_at
    )
    VALUES (
      'CAMPUS-001',
      'Clinique du Campus',
      'Quartier Arafat; rue opposée universite ESAE',
      '+229 90904344',
      'cliniquemedicalecampus@gmail.com',
      true,
      false,  -- Pas une démo
      false,  -- Code permanent
      false,  -- Pas de changement de code requis
      v_super_admin_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_clinic_id;
    
    RAISE NOTICE '✅ Clinique CAMPUS-001 créée avec ID: %', v_clinic_id;
  ELSE
    -- Mettre à jour la clinique
    UPDATE clinics
    SET 
      active = true,
      is_demo = false,
      is_temporary_code = false,
      requires_code_change = false,
      updated_at = NOW()
    WHERE id = v_clinic_id;
    
    RAISE NOTICE '✅ Clinique CAMPUS-001 existante mise à jour avec ID: %', v_clinic_id;
  END IF;

  -- Hash du mot de passe: TempClinic2024!
  v_password_hash := encode(digest('TempClinic2024!' || 'logi_clinic_salt', 'sha256'), 'hex');

  -- Vérifier si l'utilisateur admin existe
  SELECT id, clinic_id INTO v_user_id, v_existing_clinic_id
  FROM users 
  WHERE LOWER(TRIM(email)) = LOWER(TRIM('bagarayannick1@gmail.com'));

  IF v_user_id IS NULL THEN
    -- Créer l'utilisateur admin
    INSERT INTO users (
      email,
      nom,
      prenom,
      password_hash,
      role,
      status,
      clinic_id,
      actif,
      created_by,
      created_at,
      updated_at
    )
    VALUES (
      LOWER(TRIM('bagarayannick1@gmail.com')),
      'BAGARA',
      'Sabi Yannick',
      v_password_hash,
      'CLINIC_ADMIN',
      'PENDING',  -- Status PENDING pour forcer le changement de mot de passe
      v_clinic_id,
      true,
      v_super_admin_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE '✅ Utilisateur admin CAMPUS-001 créé avec ID: %', v_user_id;
  ELSE
    -- Mettre à jour l'utilisateur
    UPDATE users
    SET 
      email = LOWER(TRIM(email)),
      clinic_id = v_clinic_id,
      role = 'CLINIC_ADMIN',
      status = 'PENDING',
      actif = true,
      password_hash = COALESCE(password_hash, v_password_hash),
      updated_at = NOW()
    WHERE id = v_user_id;
    
    IF v_existing_clinic_id IS DISTINCT FROM v_clinic_id THEN
      RAISE NOTICE '⚠️ Utilisateur était lié à une autre clinique (%), maintenant lié à CAMPUS-001', v_existing_clinic_id;
    END IF;
    
    RAISE NOTICE '✅ Utilisateur admin CAMPUS-001 mis à jour avec ID: %', v_user_id;
  END IF;

  -- Supprimer les codes temporaires pour CAMPUS-001 (code permanent)
  DELETE FROM clinic_temporary_codes
  WHERE clinic_id = v_clinic_id;

  RAISE NOTICE '✅ Configuration CAMPUS-001 terminée';
END $$;

-- ============================================
-- ÉTAPE 3 : NETTOYER LES AUTRES CLINIQUES
-- ============================================

-- Supprimer toutes les autres cliniques (sauf CLINIC001 et CAMPUS-001)
DELETE FROM clinics
WHERE code NOT IN ('CLINIC001', 'CAMPUS-001');

RAISE NOTICE '✅ Autres cliniques supprimées (seulement CLINIC001 et CAMPUS-001 conservées)';

-- ============================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  v_clinic_demo_id UUID;
  v_clinic_campus_id UUID;
  v_demo_users INT;
  v_campus_users INT;
BEGIN
  SELECT id INTO v_clinic_demo_id FROM clinics WHERE code = 'CLINIC001';
  SELECT id INTO v_clinic_campus_id FROM clinics WHERE code = 'CAMPUS-001';

  SELECT COUNT(*) INTO v_demo_users 
  FROM users 
  WHERE clinic_id = v_clinic_demo_id 
    AND email IN ('admin', 'medecin', 'infirmier', 'receptionniste');

  SELECT COUNT(*) INTO v_campus_users 
  FROM users 
  WHERE clinic_id = v_clinic_campus_id 
    AND role = 'CLINIC_ADMIN';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 État final:';
  RAISE NOTICE '   CLINIC001 (démo):';
  RAISE NOTICE '     - ID: %', v_clinic_demo_id;
  RAISE NOTICE '     - Utilisateurs démo: %', v_demo_users;
  RAISE NOTICE '   CAMPUS-001:';
  RAISE NOTICE '     - ID: %', v_clinic_campus_id;
  RAISE NOTICE '     - Admins: %', v_campus_users;
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Comptes démo CLINIC001:';
  RAISE NOTICE '   - admin / admin123 (CLINIC_ADMIN)';
  RAISE NOTICE '   - medecin / medecin123 (MEDECIN)';
  RAISE NOTICE '   - infirmier / infirmier123 (INFIRMIER)';
  RAISE NOTICE '   - receptionniste / receptionniste123 (RECEPTIONNISTE)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Compte CAMPUS-001:';
  RAISE NOTICE '   - Code: CAMPUS-001';
  RAISE NOTICE '   - Email: bagarayannick1@gmail.com';
  RAISE NOTICE '   - Mot de passe: TempClinic2024!';
  RAISE NOTICE '   - ⚠️ Changement de mot de passe requis à la première connexion';
  RAISE NOTICE '';
END $$;






