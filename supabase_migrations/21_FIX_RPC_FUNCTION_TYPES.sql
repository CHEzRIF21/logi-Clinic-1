-- ============================================
-- CORRECTION FONCTION RPC authenticate_user_by_email
-- VERSION: 21
-- ============================================
-- Ce script corrige les types de retour de la fonction RPC
-- pour qu'ils correspondent aux types réels de la table users
-- ============================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS authenticate_user_by_email(TEXT, UUID);
DROP FUNCTION IF EXISTS authenticate_user_by_email(UUID, TEXT);

-- Recréer la fonction avec les types corrects
CREATE OR REPLACE FUNCTION authenticate_user_by_email(
  p_email TEXT,
  p_clinic_id UUID
)
RETURNS TABLE(
  id UUID,
  email VARCHAR(255),
  nom VARCHAR(255),
  prenom VARCHAR(255),
  role VARCHAR(50),
  status VARCHAR(50),
  clinic_id UUID,
  actif BOOLEAN,
  password_hash TEXT,
  auth_user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::VARCHAR(255),
    u.nom::VARCHAR(255),
    u.prenom::VARCHAR(255),
    u.role::VARCHAR(50),
    u.status::VARCHAR(50),
    u.clinic_id,
    u.actif,
    u.password_hash,
    u.auth_user_id
  FROM users u
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
    AND u.clinic_id = p_clinic_id
    AND u.actif = true;
END;
$$;

-- Vérifier que la fonction existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'authenticate_user_by_email'
  ) THEN
    RAISE NOTICE '✅ Fonction authenticate_user_by_email créée avec les types corrects';
  ELSE
    RAISE EXCEPTION '❌ Erreur: Fonction non créée';
  END IF;
END $$;

-- Tester la fonction avec l'utilisateur CAMPUS-001
DO $$
DECLARE
  v_clinic_id UUID;
  v_test_result RECORD;
BEGIN
  -- Récupérer l'ID de la clinique
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    RAISE NOTICE '⚠️ Clinique CAMPUS-001 non trouvée';
    RETURN;
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




