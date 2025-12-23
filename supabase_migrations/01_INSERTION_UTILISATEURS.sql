-- ============================================
-- INSERTION DES UTILISATEURS SUPER-ADMIN ET ADMIN CLINIQUE
-- ============================================
--
-- ⚠️ EXÉCUTER CE SCRIPT APRÈS AVOIR CRÉÉ LES UTILISATEURS DANS SUPABASE AUTH
--
-- 📋 ÉTAPES PRÉALABLES:
-- 1. Aller dans Authentication > Users
-- 2. Créer l'utilisateur babocher21@gmail.com
-- 3. Créer l'utilisateur bagarayannick1@gmail.com
-- 4. Copier les UUID de chaque utilisateur
-- 5. Remplacer les UUID ci-dessous
-- 6. Exécuter ce script
--
-- ============================================

-- ⬇️⬇️⬇️ REMPLACER CES UUID PAR LES VRAIS UUID ⬇️⬇️⬇️

DO $$
DECLARE
  -- REMPLACER PAR LES VRAIS UUID COPIÉS DEPUIS SUPABASE AUTH
  v_super_admin_auth_id UUID := '64ff9a06-bb4c-439f-841f-a06278251375';  -- ← REMPLACER
  v_clinic_admin_auth_id UUID := '75be5f7b-bade-4065-83fa-b9a7db8ae6a2'; -- ← REMPLACER
  
  v_campus_clinic_id UUID;
  v_super_admin_id UUID;
BEGIN
  
  -- Vérifier que la clinique existe
  SELECT id INTO v_campus_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_campus_clinic_id IS NULL THEN
    RAISE EXCEPTION '❌ La Clinique CAMPUS-001 n''existe pas. Exécuter d''abord MIGRATION_COMPLETE_HIERARCHIQUE.sql';
  END IF;
  
  RAISE NOTICE '✅ Clinique CAMPUS-001 trouvée: %', v_campus_clinic_id;
  
  -- ============================================
  -- 1. CRÉER LE SUPER-ADMIN
  -- ============================================
  
  INSERT INTO users (
    auth_user_id,
    nom,
    prenom,
    email,
    role,
    clinic_id,
    status,
    actif,
    created_at,
    updated_at
  )
  VALUES (
    v_super_admin_auth_id,
    'BABONI M.',
    'Cherif',
    'babocher21@gmail.com',
    'SUPER_ADMIN',
    NULL,  -- SUPER_ADMIN n'est pas lié à une clinique spécifique
    'ACTIVE',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    role = 'SUPER_ADMIN',
    status = 'ACTIVE',
    updated_at = NOW()
  RETURNING id INTO v_super_admin_id;
  
  RAISE NOTICE '✅ Super-Admin créé: babocher21@gmail.com';
  
  -- ============================================
  -- 2. CRÉER L'ADMIN DE LA CLINIQUE DU CAMPUS
  -- ============================================
  
  INSERT INTO users (
    auth_user_id,
    nom,
    prenom,
    email,
    role,
    clinic_id,
    status,
    actif,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    v_clinic_admin_auth_id,
    'BAGARA',
    'Sabi Yannick',
    'bagarayannick1@gmail.com',
    'CLINIC_ADMIN',
    v_campus_clinic_id,
    'PENDING',  -- Doit changer son mot de passe au premier login
    true,
    v_super_admin_auth_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    role = 'CLINIC_ADMIN',
    clinic_id = v_campus_clinic_id,
    status = 'PENDING',
    updated_at = NOW();
  
  RAISE NOTICE '✅ Admin Clinique créé: bagarayannick1@gmail.com';
  
  -- ============================================
  -- 3. METTRE À JOUR LA CLINIQUE
  -- ============================================
  
  UPDATE clinics
  SET created_by_super_admin = v_super_admin_auth_id,
      updated_at = NOW()
  WHERE code = 'CAMPUS-001';
  
  RAISE NOTICE '✅ Clinique CAMPUS-001 mise à jour avec created_by_super_admin';
  
  -- ============================================
  -- RÉSUMÉ
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ UTILISATEURS CRÉÉS AVEC SUCCÈS !';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Super-Admin:';
  RAISE NOTICE '   Email: babocher21@gmail.com';
  RAISE NOTICE '   Rôle: SUPER_ADMIN';
  RAISE NOTICE '   Status: ACTIVE';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Admin Clinique:';
  RAISE NOTICE '   Email: bagarayannick1@gmail.com';
  RAISE NOTICE '   Rôle: CLINIC_ADMIN';
  RAISE NOTICE '   Clinique: CAMPUS-001';
  RAISE NOTICE '   Status: PENDING (doit changer mot de passe)';
  RAISE NOTICE '';
  
END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT 
  u.email,
  u.nom,
  u.prenom,
  u.role,
  u.status,
  c.code as clinic_code,
  c.name as clinic_name
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE u.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
ORDER BY u.role;

