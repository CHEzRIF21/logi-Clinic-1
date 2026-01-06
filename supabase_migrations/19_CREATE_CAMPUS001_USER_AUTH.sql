-- ============================================
-- CRÉATION UTILISATEUR CAMPUS-001 DANS SUPABASE AUTH
-- VERSION: 19
-- ============================================
-- Ce script crée l'utilisateur dans Supabase Auth ET dans la table users
-- pour permettre la connexion à CAMPUS-001
-- ============================================

-- ============================================
-- ÉTAPE 1 : VÉRIFIER/CRÉER LA CLINIQUE
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 non trouvée. Exécutez d''abord 18_FIX_CAMPUS001_CONNECTION.sql';
  END IF;
  
  RAISE NOTICE '✅ Clinique CAMPUS-001 trouvée: %', v_clinic_id;
END $$;

-- ============================================
-- ÉTAPE 2 : CRÉER L'UTILISATEUR DANS SUPABASE AUTH
-- ============================================
-- NOTE: Cette étape doit être faite via l'API Supabase Admin
-- ou via le dashboard Supabase car on ne peut pas créer directement
-- dans auth.users via SQL standard
-- ============================================

-- Vérifier si l'utilisateur existe déjà dans auth.users
DO $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'bagarayannick1@gmail.com';
  
  IF v_auth_user_id IS NOT NULL THEN
    RAISE NOTICE '✅ Utilisateur existe déjà dans auth.users: %', v_auth_user_id;
  ELSE
    RAISE NOTICE '⚠️ Utilisateur NON trouvé dans auth.users';
    RAISE NOTICE '📝 ACTION REQUISE: Créez l''utilisateur dans Supabase Auth via:';
    RAISE NOTICE '   1. Dashboard Supabase > Authentication > Users > Add User';
    RAISE NOTICE '   2. Email: bagarayannick1@gmail.com';
    RAISE NOTICE '   3. Password: TempClinic2024!';
    RAISE NOTICE '   4. Auto Confirm User: OUI';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : CRÉER/METTRE À JOUR L'UTILISATEUR DANS LA TABLE USERS
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_auth_user_id UUID;
  v_user_id UUID;
  v_password_hash TEXT;
  v_super_admin_id UUID;
BEGIN
  -- Récupérer l'ID de la clinique
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 non trouvée';
  END IF;

  -- Récupérer l'ID de l'utilisateur dans auth.users (s'il existe)
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'bagarayannick1@gmail.com'
  LIMIT 1;

  -- Récupérer le Super Admin pour created_by
  SELECT id INTO v_super_admin_id 
  FROM users 
  WHERE role = 'SUPER_ADMIN' 
  LIMIT 1;

  -- Hash du mot de passe: TempClinic2024!
  -- Utiliser la même méthode que le backend
  v_password_hash := encode(digest('TempClinic2024!' || 'logi_clinic_salt', 'sha256'), 'hex');

  -- Vérifier si l'utilisateur existe dans la table users
  SELECT id INTO v_user_id 
  FROM users 
  WHERE email = 'bagarayannick1@gmail.com';

  IF v_user_id IS NULL THEN
    -- Créer l'utilisateur
    INSERT INTO users (
      auth_user_id,
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
      v_auth_user_id,  -- NULL si n'existe pas dans auth.users
      'bagarayannick1@gmail.com',
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
    
    RAISE NOTICE '✅ Utilisateur créé dans la table users avec ID: %', v_user_id;
  ELSE
    -- Mettre à jour l'utilisateur
    UPDATE users
    SET 
      auth_user_id = COALESCE(v_auth_user_id, auth_user_id),  -- Mettre à jour si auth_user_id existe
      clinic_id = v_clinic_id,
      role = 'CLINIC_ADMIN',
      status = 'PENDING',  -- Forcer le changement de mot de passe
      actif = true,
      password_hash = COALESCE(password_hash, v_password_hash),  -- Garder l'ancien hash s'il existe
      updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE '✅ Utilisateur mis à jour dans la table users avec ID: %', v_user_id;
  END IF;

  -- Afficher les informations
  RAISE NOTICE '';
  RAISE NOTICE '📋 INFORMATIONS DE CONNEXION:';
  RAISE NOTICE '   Code clinique: CAMPUS-001';
  RAISE NOTICE '   Email: bagarayannick1@gmail.com';
  RAISE NOTICE '   Mot de passe: TempClinic2024!';
  RAISE NOTICE '   Statut: PENDING (changement de mot de passe requis)';
  RAISE NOTICE '';
  
  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE '⚠️ IMPORTANT: L''utilisateur n''existe pas dans Supabase Auth.';
    RAISE NOTICE '   Créez-le via le Dashboard Supabase pour permettre l''authentification.';
  ELSE
    RAISE NOTICE '✅ Utilisateur existe dans Supabase Auth: %', v_auth_user_id;
  END IF;
END $$;

-- ============================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ============================================

SELECT 
  'VÉRIFICATION' as verification,
  c.code as clinic_code,
  c.name as clinic_name,
  c.active as clinic_active,
  u.id as user_id,
  u.email as user_email,
  u.role as user_role,
  u.status as user_status,
  u.actif as user_actif,
  u.auth_user_id,
  CASE 
    WHEN u.auth_user_id IS NOT NULL THEN '✅ Existe dans Supabase Auth'
    ELSE '⚠️ N''existe PAS dans Supabase Auth'
  END as auth_status,
  CASE 
    WHEN u.clinic_id = c.id THEN '✅ Lié à la clinique'
    ELSE '❌ Pas lié à la clinique'
  END as link_status
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id AND u.email = 'bagarayannick1@gmail.com'
WHERE c.code = 'CAMPUS-001';

-- ============================================
-- INSTRUCTIONS POUR CRÉER L'UTILISATEUR DANS SUPABASE AUTH
-- ============================================

-- Si l'utilisateur n'existe pas dans auth.users, créez-le via:
-- 
-- 1. Dashboard Supabase > Authentication > Users
-- 2. Cliquez sur "Add User" ou "Invite User"
-- 3. Remplissez:
--    - Email: bagarayannick1@gmail.com
--    - Password: TempClinic2024!
--    - Auto Confirm User: OUI (pour permettre la connexion immédiate)
-- 4. Cliquez sur "Create User"
--
-- OU via l'API Supabase Admin:
--
-- POST https://[PROJECT_REF].supabase.co/auth/v1/admin/users
-- Headers:
--   Authorization: Bearer [SERVICE_ROLE_KEY]
--   apikey: [SERVICE_ROLE_KEY]
-- Body:
-- {
--   "email": "bagarayannick1@gmail.com",
--   "password": "TempClinic2024!",
--   "email_confirm": true,
--   "user_metadata": {
--     "clinic_code": "CAMPUS-001"
--   }
-- }






