-- ============================================
-- MIGRATION 70: CHANGEMENT CODE CLINIQUE PLENITUDE ET RÉINITIALISATION ACCÈS
-- ============================================
-- Cette migration :
-- 1. Change le code de la clinique de 'CLIN-PLENITUDE-001' en 'PLENITUDE-001'
-- 2. Réinitialise le statut des admins à PENDING pour forcer le changement de mot de passe
-- 3. Supprime les liens auth_user_id pour permettre la réinitialisation via bootstrap-clinic-admin-auth
-- ============================================

DO $$
DECLARE
  v_old_code TEXT := 'CLIN-PLENITUDE-001';
  v_new_code TEXT := 'PLENITUDE-001';
  v_clinic_id UUID;
  v_updated_count INT;
  v_admin RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔄 CHANGEMENT CODE CLINIQUE PLENITUDE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Vérifier que la clinique existe avec l'ancien code
  SELECT id INTO v_clinic_id 
  FROM clinics 
  WHERE code = v_old_code;

  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION '❌ Clinique avec le code % non trouvée', v_old_code;
  END IF;

  RAISE NOTICE '✅ Clinique trouvée (ID: %)', v_clinic_id;
  RAISE NOTICE '   Ancien code: %', v_old_code;
  RAISE NOTICE '   Nouveau code: %', v_new_code;
  RAISE NOTICE '';

  -- Vérifier que le nouveau code n'existe pas déjà
  IF EXISTS (SELECT 1 FROM clinics WHERE code = v_new_code AND id != v_clinic_id) THEN
    RAISE EXCEPTION '❌ Le code % existe déjà pour une autre clinique', v_new_code;
  END IF;

  -- Changer le code de la clinique
  RAISE NOTICE '📋 Changement du code clinique...';
  UPDATE clinics 
  SET code = v_new_code,
      updated_at = NOW()
  WHERE id = v_clinic_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  IF v_updated_count = 0 THEN
    RAISE EXCEPTION '❌ Échec du changement de code';
  END IF;

  RAISE NOTICE '✅ Code changé avec succès';
  RAISE NOTICE '';

  -- Réinitialiser le statut des admins à PENDING
  RAISE NOTICE '📋 Réinitialisation du statut des admins...';
  UPDATE users 
  SET status = 'PENDING',
      first_login_at = NULL,
      last_login = NULL,
      auth_user_id = NULL,  -- Supprimer le lien auth pour permettre la réinitialisation
      updated_at = NOW()
  WHERE clinic_id = v_clinic_id 
    AND role = 'CLINIC_ADMIN';
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE '✅ % admin(s) réinitialisé(s) pour %', v_updated_count, v_new_code;
  RAISE NOTICE '';

  -- Afficher les informations des admins
  RAISE NOTICE '📋 Admins de la clinique %:', v_new_code;
  FOR v_admin IN 
    SELECT email, nom, prenom, status 
    FROM users 
    WHERE clinic_id = v_clinic_id 
      AND role = 'CLINIC_ADMIN'
  LOOP
    RAISE NOTICE '   - % % (%): %', 
      v_admin.prenom, v_admin.nom, v_admin.email, v_admin.status;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  PROCHAINES ÉTAPES:';
  RAISE NOTICE '   1. Exécuter le script PowerShell reset_plenitude_mamelles_access.ps1';
  RAISE NOTICE '   2. Les admins pourront se connecter avec les nouveaux mots de passe temporaires';
  RAISE NOTICE '   3. Les admins devront changer leur mot de passe à la première connexion';
  RAISE NOTICE '';

END $$;

-- ============================================
-- RÉINITIALISATION ACCÈS MAMELLES-001
-- ============================================

DO $$
DECLARE
  v_clinic_code TEXT := 'MAMELLES-001';
  v_clinic_id UUID;
  v_updated_count INT;
  v_admin RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔄 RÉINITIALISATION ACCÈS MAMELLES-001';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Vérifier que la clinique existe
  SELECT id INTO v_clinic_id 
  FROM clinics 
  WHERE code = v_clinic_code;

  IF v_clinic_id IS NULL THEN
    RAISE NOTICE '⚠️  Clinique % non trouvée', v_clinic_code;
  ELSE
    RAISE NOTICE '✅ Clinique trouvée (ID: %)', v_clinic_id;
    RAISE NOTICE '';

    -- Réinitialiser le statut des admins à PENDING
    RAISE NOTICE '📋 Réinitialisation du statut des admins...';
    UPDATE users 
    SET status = 'PENDING',
        first_login_at = NULL,
        last_login = NULL,
        auth_user_id = NULL,  -- Supprimer le lien auth pour permettre la réinitialisation
        updated_at = NOW()
    WHERE clinic_id = v_clinic_id 
      AND role = 'CLINIC_ADMIN';
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '✅ % admin(s) réinitialisé(s) pour %', v_updated_count, v_clinic_code;
    RAISE NOTICE '';

    -- Afficher les informations des admins
    RAISE NOTICE '📋 Admins de la clinique %:', v_clinic_code;
    FOR v_admin IN 
      SELECT email, nom, prenom, status 
      FROM users 
      WHERE clinic_id = v_clinic_id 
        AND role = 'CLINIC_ADMIN'
    LOOP
      RAISE NOTICE '   - % % (%): %', 
        v_admin.prenom, v_admin.nom, v_admin.email, v_admin.status;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Réinitialisation MAMELLES-001 terminée';
  END IF;

END $$;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  v_plenitude_id UUID;
  v_mamelles_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 VÉRIFICATION FINALE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Vérifier PLENITUDE-001
  SELECT id INTO v_plenitude_id FROM clinics WHERE code = 'PLENITUDE-001';
  IF v_plenitude_id IS NOT NULL THEN
    RAISE NOTICE '✅ PLENITUDE-001: Code changé avec succès';
  ELSE
    RAISE NOTICE '❌ PLENITUDE-001: Code non trouvé';
  END IF;

  -- Vérifier MAMELLES-001
  SELECT id INTO v_mamelles_id FROM clinics WHERE code = 'MAMELLES-001';
  IF v_mamelles_id IS NOT NULL THEN
    RAISE NOTICE '✅ MAMELLES-001: Clinique trouvée';
  ELSE
    RAISE NOTICE '❌ MAMELLES-001: Clinique non trouvée';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration complète terminée !';
  RAISE NOTICE '';

END $$;
