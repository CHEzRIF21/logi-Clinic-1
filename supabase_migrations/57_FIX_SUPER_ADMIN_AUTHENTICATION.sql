-- ============================================
-- MIGRATION : CORRECTION AUTHENTIFICATION SUPER ADMIN
-- VERSION: 57
-- DATE: 2026-01-29
-- ============================================
-- Problème:
-- - La fonction authenticate_user_by_email cherche uniquement les utilisateurs
--   avec clinic_id = p_clinic_id, ce qui exclut les Super Admins (clinic_id = NULL)
-- Solution:
-- - Modifier la fonction pour accepter aussi les Super Admins
-- ============================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS authenticate_user_by_email(TEXT, UUID);

-- Recréer la fonction avec support pour Super Admin
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
    AND u.actif = true
    AND (
      -- Utilisateurs normaux: doivent appartenir à la clinique spécifiée
      u.clinic_id = p_clinic_id
      OR
      -- Super Admins: peuvent se connecter avec n'importe quelle clinique
      (u.clinic_id IS NULL AND UPPER(TRIM(u.role)) = 'SUPER_ADMIN')
    );
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
    RAISE NOTICE '✅ Fonction authenticate_user_by_email mise à jour avec support Super Admin';
  ELSE
    RAISE EXCEPTION '❌ Erreur: Fonction non créée';
  END IF;
END $$;

-- Tester la fonction avec le Super Admin
DO $$
DECLARE
  v_clinic_id UUID;
  v_test_result RECORD;
BEGIN
  -- Récupérer l'ID d'une clinique (n'importe laquelle)
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001' LIMIT 1;
  
  IF v_clinic_id IS NULL THEN
    RAISE NOTICE '⚠️ Aucune clinique trouvée pour le test';
    RETURN;
  END IF;
  
  -- Tester la fonction avec le Super Admin
  SELECT * INTO v_test_result
  FROM authenticate_user_by_email('arafathimorou@gmail.com', v_clinic_id);
  
  IF v_test_result IS NOT NULL THEN
    RAISE NOTICE '✅ Fonction RPC fonctionne correctement pour Super Admin';
    RAISE NOTICE '   Utilisateur trouvé: % (ID: %)', v_test_result.email, v_test_result.id;
    RAISE NOTICE '   Role: %, Status: %, Clinic ID: %', v_test_result.role, v_test_result.status, v_test_result.clinic_id;
  ELSE
    RAISE NOTICE '⚠️ Super Admin non trouvé - vérifiez que l''utilisateur existe avec role = SUPER_ADMIN';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors du test de la fonction RPC: %', SQLERRM;
END $$;
