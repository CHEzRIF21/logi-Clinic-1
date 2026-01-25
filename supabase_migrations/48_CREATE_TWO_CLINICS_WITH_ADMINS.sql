-- ============================================
-- MIGRATION : CRÉATION DE 2 CLINIQUES AVEC ADMINS
-- VERSION: 48
-- DATE: 2026-01-24
-- ============================================
-- Ce script crée 2 cliniques avec leurs administrateurs respectifs
-- Chaque clinique aura au moins 1 admin à la création
-- ============================================

-- ============================================
-- CONFIGURATION : MODIFIEZ CES VALEURS SELON VOS BESOINS
-- ============================================

-- ⚠️ IMPORTANT : Modifiez les valeurs ci-dessous avant d'exécuter la migration

-- CLINIQUE 1
DO $$
DECLARE
  -- Informations de la clinique 1
  v_clinic1_code TEXT := 'CLIN-PLENITUDE-001';  -- Code unique de la clinique
  v_clinic1_name TEXT := 'Clinique Santé PLENITUDE';  -- Nom de la clinique
  v_clinic1_address TEXT := 'LOKOSSA';  -- Adresse
  v_clinic1_phone TEXT := '+229 0164436342';  -- Téléphone
  v_clinic1_email TEXT := 'laplenitude.hc@yahoo.com';  -- Email de la clinique
  
  -- Informations de l'admin 1 (premier admin)
  v_admin1_email TEXT := 'laplenitude.hc@yahoo.com';  -- Email de l'admin (OBLIGATOIRE)
  v_admin1_nom TEXT := 'BOKO';  -- Nom de l'admin (OBLIGATOIRE)
  v_admin1_prenom TEXT := 'Chantal';  -- Prénom de l'admin (OBLIGATOIRE)
  v_admin1_password TEXT := 'Admin1234!';  -- Mot de passe temporaire (sera changé à la première connexion)
  
  -- Informations de l'admin 2 (deuxième admin pour la même clinique)
  v_admin2_email TEXT := 'hakpovi95@yahoo.fr';  -- Email de l'admin (OBLIGATOIRE)
  v_admin2_nom TEXT := 'AKPOVI';  -- Nom de l'admin (OBLIGATOIRE)
  v_admin2_prenom TEXT := 'Hilaire';  -- Prénom de l'admin (OBLIGATOIRE)
  v_admin2_password TEXT := 'Admin1234!';  -- Mot de passe temporaire (sera changé à la première connexion)

  -- Variables internes
  v_clinic1_id UUID;
  v_admin1_id UUID;
  v_admin2_id UUID;
  v_super_admin_id UUID;
  v_admin1_password_hash TEXT;
  v_admin2_password_hash TEXT;
BEGIN
  -- Récupérer le Super Admin
  SELECT id INTO v_super_admin_id 
  FROM users 
  WHERE role = 'SUPER_ADMIN' 
  LIMIT 1;

  IF v_super_admin_id IS NULL THEN
    RAISE EXCEPTION '❌ Aucun SUPER_ADMIN trouvé. Créez d''abord un SUPER_ADMIN.';
  END IF;

  RAISE NOTICE '✅ Super Admin trouvé: %', v_super_admin_id;

  -- ============================================
  -- CRÉER LA CLINIQUE 1
  -- ============================================
  
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
    v_clinic1_code,
    v_clinic1_name,
    v_clinic1_address,
    v_clinic1_phone,
    v_clinic1_email,
    true,  -- Active
    false,  -- Pas une démo
    false,  -- Code permanent
    false,  -- Pas de changement de code requis
    v_super_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (code) DO UPDATE SET
    name = v_clinic1_name,
    address = v_clinic1_address,
    phone = v_clinic1_phone,
    email = v_clinic1_email,
    active = true,
    updated_at = NOW()
  RETURNING id INTO v_clinic1_id;

  RAISE NOTICE '✅ Clinique 1 créée/vérifiée: % (ID: %)', v_clinic1_code, v_clinic1_id;

  -- ============================================
  -- CRÉER L'ADMIN 1
  -- ============================================
  
  -- Hasher le mot de passe
  v_admin1_password_hash := encode(digest(v_admin1_password || 'logi_clinic_salt', 'sha256'), 'hex');

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
    LOWER(TRIM(v_admin1_email)),
    v_admin1_nom,
    v_admin1_prenom,
    v_admin1_password_hash,
    'CLINIC_ADMIN',
    'PENDING',  -- Status PENDING pour forcer le changement de mot de passe à la première connexion
    v_clinic1_id,
    true,
    v_super_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    nom = EXCLUDED.nom,
    prenom = EXCLUDED.prenom,
    clinic_id = EXCLUDED.clinic_id,
    role = 'CLINIC_ADMIN',
    status = 'PENDING',
    actif = true,
    password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash),
    updated_at = NOW()
  RETURNING id INTO v_admin1_id;

  RAISE NOTICE '✅ Admin 1 créé/vérifié: % % (Email: %, ID: %)', 
    v_admin1_prenom, v_admin1_nom, v_admin1_email, v_admin1_id;

  -- ============================================
  -- CRÉER L'ADMIN 2 (deuxième admin pour la clinique 1)
  -- ============================================
  
  -- Hasher le mot de passe
  v_admin2_password_hash := encode(digest(v_admin2_password || 'logi_clinic_salt', 'sha256'), 'hex');

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
    LOWER(TRIM(v_admin2_email)),
    v_admin2_nom,
    v_admin2_prenom,
    v_admin2_password_hash,
    'CLINIC_ADMIN',
    'PENDING',  -- Status PENDING pour forcer le changement de mot de passe à la première connexion
    v_clinic1_id,
    true,
    v_super_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    nom = EXCLUDED.nom,
    prenom = EXCLUDED.prenom,
    clinic_id = EXCLUDED.clinic_id,
    role = 'CLINIC_ADMIN',
    status = 'PENDING',
    actif = true,
    password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash),
    updated_at = NOW()
  RETURNING id INTO v_admin2_id;

  RAISE NOTICE '✅ Admin 2 créé/vérifié: % % (Email: %, ID: %)', 
    v_admin2_prenom, v_admin2_nom, v_admin2_email, v_admin2_id;

  RAISE NOTICE '';
  RAISE NOTICE '📋 INFORMATIONS DE CONNEXION CLINIQUE 1:';
  RAISE NOTICE '   Code clinique: %', v_clinic1_code;
  RAISE NOTICE '   Admin 1 - Email: % | Mot de passe: %', v_admin1_email, v_admin1_password;
  RAISE NOTICE '   Admin 2 - Email: % | Mot de passe: %', v_admin2_email, v_admin2_password;
  RAISE NOTICE '   ⚠️ Les admins devront changer leur mot de passe à la première connexion';
  RAISE NOTICE '   ⚠️ Les admins devront être liés à Supabase Auth (voir guide)';
  RAISE NOTICE '';

END $$;

-- ============================================
-- CLINIQUE 2
-- ============================================

DO $$
DECLARE
  -- Informations de la clinique 2
  v_clinic2_code TEXT := 'MAMELLES-001';  -- Code unique de la clinique
  v_clinic2_name TEXT := 'Clinique Santé LES MAMELLES';  -- Nom de la clinique
  v_clinic2_address TEXT := 'Save';  -- Adresse
  v_clinic2_phone TEXT := '+229 0166997940';  -- Téléphone
  v_clinic2_email TEXT := 'dieudange@gmail.com';  -- Email de la clinique
  
  -- Informations de l'admin 2
  v_admin2_email TEXT := 'dieudange@gmail.com';  -- Email de l'admin (OBLIGATOIRE)
  v_admin2_nom TEXT := 'MINHOU';  -- Nom de l'admin (OBLIGATOIRE)
  v_admin2_prenom TEXT := 'Ange Kevin Dieudonne';  -- Prénom de l'admin (OBLIGATOIRE)
  v_admin2_password TEXT := 'Admin1234!';  -- Mot de passe temporaire (sera changé à la première connexion)
  
  -- Variables internes
  v_clinic2_id UUID;
  v_admin2_id UUID;
  v_super_admin_id UUID;
  v_admin2_password_hash TEXT;
BEGIN
  -- Récupérer le Super Admin
  SELECT id INTO v_super_admin_id 
  FROM users 
  WHERE role = 'SUPER_ADMIN' 
  LIMIT 1;

  IF v_super_admin_id IS NULL THEN
    RAISE EXCEPTION '❌ Aucun SUPER_ADMIN trouvé. Créez d''abord un SUPER_ADMIN.';
  END IF;

  -- ============================================
  -- CRÉER LA CLINIQUE 2
  -- ============================================
  
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
    v_clinic2_code,
    v_clinic2_name,
    v_clinic2_address,
    v_clinic2_phone,
    v_clinic2_email,
    true,  -- Active
    false,  -- Pas une démo
    false,  -- Code permanent
    false,  -- Pas de changement de code requis
    v_super_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (code) DO UPDATE SET
    name = v_clinic2_name,
    address = v_clinic2_address,
    phone = v_clinic2_phone,
    email = v_clinic2_email,
    active = true,
    updated_at = NOW()
  RETURNING id INTO v_clinic2_id;

  RAISE NOTICE '✅ Clinique 2 créée/vérifiée: % (ID: %)', v_clinic2_code, v_clinic2_id;

  -- ============================================
  -- CRÉER L'ADMIN 2
  -- ============================================
  
  -- Hasher le mot de passe
  v_admin2_password_hash := encode(digest(v_admin2_password || 'logi_clinic_salt', 'sha256'), 'hex');

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
    LOWER(TRIM(v_admin2_email)),
    v_admin2_nom,
    v_admin2_prenom,
    v_admin2_password_hash,
    'CLINIC_ADMIN',
    'PENDING',  -- Status PENDING pour forcer le changement de mot de passe à la première connexion
    v_clinic2_id,
    true,
    v_super_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    nom = EXCLUDED.nom,
    prenom = EXCLUDED.prenom,
    clinic_id = EXCLUDED.clinic_id,
    role = 'CLINIC_ADMIN',
    status = 'PENDING',
    actif = true,
    password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash),
    updated_at = NOW()
  RETURNING id INTO v_admin2_id;

  RAISE NOTICE '✅ Admin 2 créé/vérifié: % % (Email: %, ID: %)', 
    v_admin2_prenom, v_admin2_nom, v_admin2_email, v_admin2_id;

  RAISE NOTICE '';
  RAISE NOTICE '📋 INFORMATIONS DE CONNEXION CLINIQUE 2:';
  RAISE NOTICE '   Code clinique: %', v_clinic2_code;
  RAISE NOTICE '   Email admin: %', v_admin2_email;
  RAISE NOTICE '   Mot de passe temporaire: %', v_admin2_password;
  RAISE NOTICE '   ⚠️ L''admin devra changer son mot de passe à la première connexion';
  RAISE NOTICE '   ⚠️ L''admin devra être lié à Supabase Auth (voir guide)';
  RAISE NOTICE '';

END $$;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  v_clinic1_id UUID;
  v_clinic2_id UUID;
  v_admin1_count INT;
  v_admin2_count INT;
BEGIN
  -- Vérifier les cliniques
  SELECT id INTO v_clinic1_id FROM clinics WHERE code = 'CLIN-PLENITUDE-001';
  SELECT id INTO v_clinic2_id FROM clinics WHERE code = 'MAMELLES-001';

  -- Vérifier les admins
  SELECT COUNT(*) INTO v_admin1_count 
  FROM users 
  WHERE clinic_id = v_clinic1_id 
    AND role = 'CLINIC_ADMIN'
    AND actif = true;

  SELECT COUNT(*) INTO v_admin2_count 
  FROM users 
  WHERE clinic_id = v_clinic2_id 
    AND role = 'CLINIC_ADMIN'
    AND actif = true;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 État final:';
  RAISE NOTICE '   Clinique 1 (CLIN-PLENITUDE-001): %', 
    CASE WHEN v_clinic1_id IS NOT NULL THEN '✅ Créée' ELSE '❌ Non trouvée' END;
  RAISE NOTICE '   Admin(s) clinique 1: %', v_admin1_count;
  RAISE NOTICE '   Clinique 2: %', 
    CASE WHEN v_clinic2_id IS NOT NULL THEN '✅ Créée' ELSE '❌ Non trouvée' END;
  RAISE NOTICE '   Admin(s) clinique 2: %', v_admin2_count;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ PROCHAINES ÉTAPES:';
  RAISE NOTICE '   1. Lier les admins à Supabase Auth (voir GUIDE_CREATION_CLINIQUES.md)';
  RAISE NOTICE '   2. Transmettre les identifiants aux admins via un canal sécurisé';
  RAISE NOTICE '   3. Les admins devront changer leur mot de passe à la première connexion';
  RAISE NOTICE '';
END $$;
