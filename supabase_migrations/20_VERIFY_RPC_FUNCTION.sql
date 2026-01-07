-- ============================================
-- VÉRIFICATION FONCTION RPC authenticate_user_by_email
-- VERSION: 20
-- ============================================
-- Ce script vérifie que la fonction RPC existe et fonctionne correctement
-- ============================================

-- Vérifier si la fonction existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
        AND p.proname = 'authenticate_user_by_email'
    ) THEN '✅ Fonction RPC existe'
    ELSE '❌ Fonction RPC N''EXISTE PAS'
  END as function_status;

-- Afficher la définition de la fonction si elle existe
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'authenticate_user_by_email';

-- Tester la fonction avec l'utilisateur CAMPUS-001
DO $$
DECLARE
  v_clinic_id UUID;
  v_test_result RECORD;
BEGIN
  -- Récupérer l'ID de la clinique
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 non trouvée';
  END IF;
  
  -- Tester la fonction
  SELECT * INTO v_test_result
  FROM authenticate_user_by_email('bagarayannick1@gmail.com', v_clinic_id);
  
  IF v_test_result IS NOT NULL THEN
    RAISE NOTICE '✅ Fonction RPC fonctionne correctement';
    RAISE NOTICE '   Utilisateur trouvé: % (ID: %)', v_test_result.email, v_test_result.id;
    RAISE NOTICE '   Role: %, Status: %', v_test_result.role, v_test_result.status;
  ELSE
    RAISE NOTICE '⚠️ Fonction RPC ne retourne aucun résultat';
    RAISE NOTICE '   Vérifiez que l''utilisateur existe dans la table users';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors du test de la fonction RPC: %', SQLERRM;
END $$;

-- Vérifier que l'utilisateur existe dans la table users
SELECT 
  'VÉRIFICATION UTILISATEUR' as check_type,
  u.id,
  u.email,
  u.role,
  u.status,
  u.clinic_id,
  c.code as clinic_code,
  u.actif,
  CASE 
    WHEN u.auth_user_id IS NOT NULL THEN '✅ Lié à Supabase Auth'
    ELSE '⚠️ NON lié à Supabase Auth'
  END as auth_link
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE u.email = 'bagarayannick1@gmail.com';









