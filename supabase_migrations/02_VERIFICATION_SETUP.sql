-- ============================================
-- SCRIPT DE VÉRIFICATION - Système Hiérarchique
-- ============================================
-- Exécuter ce script pour vérifier que tout est en place

-- ============================================
-- 1. VÉRIFIER LA CLINIQUE DU CAMPUS
-- ============================================

SELECT 
  'CLINIQUE DU CAMPUS' as verification,
  code,
  name,
  address,
  phone,
  email,
  active,
  created_at
FROM clinics 
WHERE code = 'CAMPUS-001';

-- ============================================
-- 2. VÉRIFIER LES UTILISATEURS
-- ============================================

SELECT 
  'UTILISATEURS' as verification,
  u.email,
  u.nom,
  u.prenom,
  u.role,
  u.status,
  u.auth_user_id,
  c.code as clinic_code,
  c.name as clinic_name,
  CASE 
    WHEN u.auth_user_id IS NULL THEN '❌ Pas de lien avec Auth'
    ELSE '✅ Lien Auth OK'
  END as auth_status
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE u.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
ORDER BY u.role;

-- ============================================
-- 3. VÉRIFIER LES COLONNES DE LA TABLE USERS
-- ============================================

SELECT 
  'COLONNES USERS' as verification,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('auth_user_id', 'clinic_id', 'role', 'status', 'nom', 'prenom')
ORDER BY column_name;

-- ============================================
-- 4. VÉRIFIER LES POLITIQUES RLS
-- ============================================

SELECT 
  'POLITIQUES RLS' as verification,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('clinics', 'users', 'registration_requests')
ORDER BY tablename, policyname;

-- ============================================
-- 5. VÉRIFIER LES FONCTIONS
-- ============================================

SELECT 
  'FONCTIONS' as verification,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'is_super_admin',
  'is_clinic_admin',
  'get_user_clinic_id',
  'generate_clinic_code'
)
ORDER BY routine_name;

-- ============================================
-- 6. COMPTEUR DE DONNÉES
-- ============================================

SELECT 
  'COMPTEUR' as verification,
  (SELECT COUNT(*) FROM clinics) as total_clinics,
  (SELECT COUNT(*) FROM clinics WHERE code = 'CAMPUS-001') as campus_clinic_exists,
  (SELECT COUNT(*) FROM users WHERE role = 'SUPER_ADMIN') as total_super_admins,
  (SELECT COUNT(*) FROM users WHERE role = 'CLINIC_ADMIN') as total_clinic_admins,
  (SELECT COUNT(*) FROM users WHERE clinic_id IS NOT NULL) as users_with_clinic,
  (SELECT COUNT(*) FROM registration_requests) as total_registration_requests;

-- ============================================
-- 7. VÉRIFIER LES CONTRAINTES
-- ============================================

SELECT 
  'CONTRAINTES' as verification,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('users', 'clinics', 'registration_requests')
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

