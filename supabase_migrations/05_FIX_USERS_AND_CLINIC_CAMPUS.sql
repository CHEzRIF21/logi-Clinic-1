-- ============================================
-- SCRIPT DE CORRECTION - Utilisateurs et Clinique CAMPUS-001
-- ============================================
-- Ce script corrige les utilisateurs et crée/vérifie la clinique CAMPUS-001
-- Exécuter ce script dans Supabase SQL Editor

-- ============================================
-- 1. CRÉER LA CLINIQUE CAMPUS-001 SI ELLE N'EXISTE PAS
-- ============================================

DO $$
DECLARE
  v_super_admin_id UUID;
  v_clinic_id UUID;
BEGIN
  -- Vérifier si la clinique existe
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    -- Récupérer l'ID du Super-Admin
    SELECT id INTO v_super_admin_id
    FROM users
    WHERE email = 'babocher21@gmail.com'
    AND role = 'SUPER_ADMIN'
    LIMIT 1;
    
    -- Si le super-admin n'existe pas, créer la clinique sans created_by
    IF v_super_admin_id IS NULL THEN
      INSERT INTO clinics (
        code,
        name,
        address,
        phone,
        email,
        active,
        created_at,
        updated_at
      ) VALUES (
        'CAMPUS-001',
        'Clinique du Campus',
        'Quartier Arafat; rue opposée universite ESAE',
        '+229 90904344',
        'cliniquemedicalecampus@gmail.com',
        true,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_clinic_id;
      
      RAISE NOTICE '✅ Clinique CAMPUS-001 créée (sans super-admin)';
    ELSE
      INSERT INTO clinics (
        code,
        name,
        address,
        phone,
        email,
        active,
        created_by_super_admin,
        created_at,
        updated_at
      ) VALUES (
        'CAMPUS-001',
        'Clinique du Campus',
        'Quartier Arafat; rue opposée universite ESAE',
        '+229 90904344',
        'cliniquemedicalecampus@gmail.com',
        true,
        v_super_admin_id,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_clinic_id;
      
      RAISE NOTICE '✅ Clinique CAMPUS-001 créée avec ID: %', v_clinic_id;
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Clinique CAMPUS-001 existe déjà avec ID: %', v_clinic_id;
    -- S'assurer qu'elle est active
    UPDATE clinics SET active = true WHERE id = v_clinic_id;
  END IF;
END $$;

-- ============================================
-- 2. FONCTION POUR HASHER LES MOTS DE PASSE
-- ============================================

CREATE OR REPLACE FUNCTION hash_password_simple(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(password || 'logi_clinic_salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CRÉER/METTRE À JOUR LE SUPER-ADMIN
-- ============================================

DO $$
DECLARE
  v_password_hash TEXT;
  v_user_id UUID;
BEGIN
  -- Hash du mot de passe: SuperAdmin2024!
  v_password_hash := hash_password_simple('SuperAdmin2024!');
  
  -- Vérifier si l'utilisateur existe
  SELECT id INTO v_user_id FROM users WHERE email = 'babocher21@gmail.com';
  
  IF v_user_id IS NULL THEN
    -- Créer le super-admin
    INSERT INTO users (
      email,
      nom,
      prenom,
      role,
      password_hash,
      status,
      actif,
      created_at,
      updated_at
    ) VALUES (
      'babocher21@gmail.com',
      'BABONI M.',
      'Cherif',
      'SUPER_ADMIN',
      v_password_hash,
      'ACTIVE',
      true,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE '✅ Super-Admin créé: babocher21@gmail.com';
  ELSE
    -- Mettre à jour le super-admin
    UPDATE users
    SET 
      nom = 'BABONI M.',
      prenom = 'Cherif',
      role = 'SUPER_ADMIN',
      password_hash = v_password_hash,
      status = 'ACTIVE',
      actif = true,
      updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE '✅ Super-Admin mis à jour: babocher21@gmail.com';
  END IF;
END $$;

-- ============================================
-- 4. CRÉER/METTRE À JOUR L'ADMIN CLINIQUE
-- ============================================

DO $$
DECLARE
  v_password_hash TEXT;
  v_user_id UUID;
  v_clinic_id UUID;
  v_super_admin_id UUID;
BEGIN
  -- Hash du mot de passe: TempClinic2024!
  v_password_hash := hash_password_simple('TempClinic2024!');
  
  -- Récupérer l'ID de la clinique
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 non trouvée';
  END IF;
  
  -- Récupérer l'ID du super-admin pour created_by
  SELECT id INTO v_super_admin_id FROM users WHERE email = 'babocher21@gmail.com' LIMIT 1;
  
  -- Vérifier si l'utilisateur existe
  SELECT id INTO v_user_id FROM users WHERE email = 'bagarayannick1@gmail.com';
  
  IF v_user_id IS NULL THEN
    -- Créer l'admin clinique
    INSERT INTO users (
      email,
      nom,
      prenom,
      role,
      password_hash,
      clinic_id,
      status,
      actif,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      'bagarayannick1@gmail.com',
      'BAGARA',
      'Sabi Yannick',
      'CLINIC_ADMIN',
      v_password_hash,
      v_clinic_id,
      'PENDING',
      true,
      v_super_admin_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE '✅ Admin clinique créé: bagarayannick1@gmail.com';
  ELSE
    -- Mettre à jour l'admin clinique
    UPDATE users
    SET 
      nom = 'BAGARA',
      prenom = 'Sabi Yannick',
      role = 'CLINIC_ADMIN',
      password_hash = v_password_hash,
      clinic_id = v_clinic_id,
      status = COALESCE(status, 'PENDING'),
      actif = true,
      updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE '✅ Admin clinique mis à jour: bagarayannick1@gmail.com';
  END IF;
END $$;

-- ============================================
-- 5. VÉRIFICATION FINALE
-- ============================================

SELECT 
  'VÉRIFICATION FINALE' as verification,
  c.id as clinic_id,
  c.code as clinic_code,
  c.name as clinic_name,
  c.active as clinic_active,
  u.id as user_id,
  u.email as user_email,
  u.nom as user_nom,
  u.prenom as user_prenom,
  u.role as user_role,
  u.status as user_status,
  u.actif as user_actif,
  CASE 
    WHEN u.clinic_id = c.id THEN '✅ Lié correctement'
    ELSE '❌ Pas lié'
  END as link_status
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id
WHERE c.code = 'CAMPUS-001'
ORDER BY u.role;

-- ============================================
-- 6. TEST DES HASHES DE MOT DE PASSE
-- ============================================

SELECT 
  'TEST HASH' as test,
  email,
  password_hash,
  hash_password_simple('SuperAdmin2024!') as expected_hash_super_admin,
  hash_password_simple('TempClinic2024!') as expected_hash_clinic_admin,
  CASE 
    WHEN email = 'babocher21@gmail.com' AND password_hash = hash_password_simple('SuperAdmin2024!') THEN '✅ Hash correct'
    WHEN email = 'bagarayannick1@gmail.com' AND password_hash = hash_password_simple('TempClinic2024!') THEN '✅ Hash correct'
    ELSE '❌ Hash incorrect'
  END as hash_status
FROM users
WHERE email IN ('babocher21@gmail.com', 'bagarayannick1@gmail.com');

-- ============================================
-- NETTOYAGE: Supprimer la fonction temporaire
-- ============================================

-- DROP FUNCTION IF EXISTS hash_password_simple(TEXT);

