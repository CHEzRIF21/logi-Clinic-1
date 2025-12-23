-- ============================================
-- VÉRIFICATION ET CORRECTION DES LIENS AUTH_USERS
-- ============================================
-- Ce script vérifie que les utilisateurs dans la table users
-- ont bien leur auth_user_id lié à auth.users

-- ============================================
-- 1. VÉRIFIER LES UTILISATEURS SANS AUTH_USER_ID
-- ============================================

SELECT 
  'UTILISATEURS SANS AUTH_USER_ID' as verification,
  u.id,
  u.email,
  u.nom,
  u.prenom,
  u.role,
  u.status,
  c.code as clinic_code
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE u.auth_user_id IS NULL
ORDER BY u.role, u.email;

-- ============================================
-- 2. VÉRIFIER LES UTILISATEURS DANS AUTH.USERS
-- ============================================

SELECT 
  'UTILISATEURS DANS AUTH.USERS' as verification,
  au.id as auth_user_id,
  au.email,
  au.email_confirmed_at,
  au.created_at
FROM auth.users au
WHERE au.email IN ('babocher21@gmail.com', 'bagarayannick1@gmail.com')
ORDER BY au.email;

-- ============================================
-- 3. CORRIGER LES LIENS AUTH_USER_ID
-- ============================================
-- ⚠️ REMPLACER LES UUID PAR LES VRAIS UUID DE AUTH.USERS

DO $$
DECLARE
  v_super_admin_auth_id UUID;
  v_clinic_admin_auth_id UUID;
BEGIN
  -- Récupérer les UUID depuis auth.users
  SELECT id INTO v_super_admin_auth_id
  FROM auth.users
  WHERE email = 'babocher21@gmail.com'
  LIMIT 1;
  
  SELECT id INTO v_clinic_admin_auth_id
  FROM auth.users
  WHERE email = 'bagarayannick1@gmail.com'
  LIMIT 1;
  
  -- Mettre à jour le Super-Admin
  IF v_super_admin_auth_id IS NOT NULL THEN
    UPDATE users
    SET auth_user_id = v_super_admin_auth_id
    WHERE email = 'babocher21@gmail.com'
    AND (auth_user_id IS NULL OR auth_user_id != v_super_admin_auth_id);
    
    RAISE NOTICE '✅ Super-Admin mis à jour avec auth_user_id: %', v_super_admin_auth_id;
  ELSE
    RAISE NOTICE '⚠️ Super-Admin non trouvé dans auth.users';
  END IF;
  
  -- Mettre à jour l'Admin Clinique
  IF v_clinic_admin_auth_id IS NOT NULL THEN
    UPDATE users
    SET auth_user_id = v_clinic_admin_auth_id
    WHERE email = 'bagarayannick1@gmail.com'
    AND (auth_user_id IS NULL OR auth_user_id != v_clinic_admin_auth_id);
    
    RAISE NOTICE '✅ Admin Clinique mis à jour avec auth_user_id: %', v_clinic_admin_auth_id;
  ELSE
    RAISE NOTICE '⚠️ Admin Clinique non trouvé dans auth.users';
  END IF;
  
END $$;

-- ============================================
-- 4. VÉRIFICATION FINALE
-- ============================================

SELECT 
  'VÉRIFICATION FINALE' as verification,
  u.email,
  u.nom,
  u.prenom,
  u.role,
  u.auth_user_id,
  CASE 
    WHEN u.auth_user_id IS NULL THEN '❌ Pas de lien Auth'
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = u.auth_user_id) THEN '✅ Lien OK'
    ELSE '⚠️ Lien invalide'
  END as auth_status,
  c.code as clinic_code
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE u.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
ORDER BY u.role;

