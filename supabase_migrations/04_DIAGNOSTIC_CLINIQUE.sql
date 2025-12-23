-- ============================================
-- DIAGNOSTIC : Vérification de la Clinique CAMPUS-001
-- ============================================
-- Ce script vérifie que la clinique existe et est accessible

-- ============================================
-- 1. VÉRIFIER L'EXISTENCE DE LA CLINIQUE
-- ============================================

SELECT 
  'VÉRIFICATION CLINIQUE' as diagnostic,
  id,
  code,
  name,
  active,
  created_at,
  created_by_super_admin
FROM clinics
WHERE code = 'CAMPUS-001';

-- ============================================
-- 2. VÉRIFIER TOUTES LES CLINIQUES
-- ============================================

SELECT 
  'TOUTES LES CLINIQUES' as diagnostic,
  id,
  code,
  name,
  active,
  created_at
FROM clinics
ORDER BY created_at DESC;

-- ============================================
-- 3. VÉRIFIER LES POLITIQUES RLS SUR CLINICS
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'clinics'
ORDER BY policyname;

-- ============================================
-- 4. ACTIVER LA CLINIQUE SI ELLE EXISTE MAIS EST INACTIVE
-- ============================================

DO $$
BEGIN
  -- Vérifier si la clinique existe
  IF EXISTS (SELECT 1 FROM clinics WHERE code = 'CAMPUS-001') THEN
    -- Activer la clinique
    UPDATE clinics
    SET active = true
    WHERE code = 'CAMPUS-001'
    AND active = false;
    
    RAISE NOTICE '✅ Clinique CAMPUS-001 activée';
  ELSE
    RAISE NOTICE '⚠️ Clinique CAMPUS-001 non trouvée';
  END IF;
END $$;

-- ============================================
-- 5. CRÉER LA CLINIQUE SI ELLE N'EXISTE PAS
-- ============================================

DO $$
DECLARE
  v_super_admin_id UUID;
  v_clinic_id UUID;
BEGIN
  -- Vérifier si la clinique existe
  IF NOT EXISTS (SELECT 1 FROM clinics WHERE code = 'CAMPUS-001') THEN
    -- Récupérer l'ID du Super-Admin
    SELECT id INTO v_super_admin_id
    FROM users
    WHERE email = 'babocher21@gmail.com'
    AND role = 'SUPER_ADMIN'
    LIMIT 1;
    
    IF v_super_admin_id IS NULL THEN
      RAISE EXCEPTION 'Super-Admin non trouvé';
    END IF;
    
    -- Créer la clinique
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
    
    -- Lier l'admin clinique à la clinique
    UPDATE users
    SET clinic_id = v_clinic_id
    WHERE email = 'bagarayannick1@gmail.com'
    AND clinic_id IS NULL;
    
    RAISE NOTICE '✅ Admin clinique lié à la clinique';
  ELSE
    RAISE NOTICE 'ℹ️ Clinique CAMPUS-001 existe déjà';
  END IF;
END $$;

-- ============================================
-- 6. VÉRIFICATION FINALE
-- ============================================

SELECT 
  'VÉRIFICATION FINALE' as diagnostic,
  c.id as clinic_id,
  c.code,
  c.name,
  c.active,
  u.id as admin_id,
  u.email as admin_email,
  u.role as admin_role,
  u.clinic_id as user_clinic_id,
  CASE 
    WHEN c.id = u.clinic_id THEN '✅ Lié correctement'
    ELSE '❌ Pas lié'
  END as link_status
FROM clinics c
LEFT JOIN users u ON u.email = 'bagarayannick1@gmail.com'
WHERE c.code = 'CAMPUS-001';

