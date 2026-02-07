-- ============================================
-- MIGRATION 84 : CRÉER/VÉRIFIER PLENITUDE-001 ET MAMELLES-001
-- LogiClinic SaaS - Même logique que CAMPUS-001
-- ============================================
-- Crée ou met à jour UNIQUEMENT les cliniques PLENITUDE-001 et MAMELLES-001.
-- Idempotent : ne supprime aucune autre clinique.
-- Les admins sont créés via le script Node.js (Auth + table users).
-- ============================================

-- ============================================
-- ÉTAPE 1 : CRÉER/VÉRIFIER PLENITUDE-001
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_super_admin_id UUID;
BEGIN
  SELECT id INTO v_super_admin_id
  FROM users
  WHERE role = 'SUPER_ADMIN'
  LIMIT 1;

  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'PLENITUDE-001';

  IF v_clinic_id IS NULL THEN
    INSERT INTO clinics (
      code,
      name,
      address,
      phone,
      email,
      active,
      is_demo,
      is_temporary_code,
      requires_code_change,
      created_by_super_admin,
      created_at,
      updated_at
    )
    VALUES (
      'PLENITUDE-001',
      'Clinique Plénitude',
      NULL,
      NULL,
      'laplenitude.hc@yahoo.com',
      true,
      false,
      false,
      false,
      v_super_admin_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_clinic_id;
    RAISE NOTICE '✅ Clinique PLENITUDE-001 créée avec ID: %', v_clinic_id;
  ELSE
    UPDATE clinics
    SET
      name = 'Clinique Plénitude',
      active = true,
      is_demo = false,
      is_temporary_code = false,
      requires_code_change = false,
      updated_at = NOW()
    WHERE id = v_clinic_id;
    RAISE NOTICE '✅ Clinique PLENITUDE-001 existante mise à jour avec ID: %', v_clinic_id;
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : CRÉER/VÉRIFIER MAMELLES-001
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_super_admin_id UUID;
BEGIN
  SELECT id INTO v_super_admin_id
  FROM users
  WHERE role = 'SUPER_ADMIN'
  LIMIT 1;

  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'MAMELLES-001';

  IF v_clinic_id IS NULL THEN
    INSERT INTO clinics (
      code,
      name,
      address,
      phone,
      email,
      active,
      is_demo,
      is_temporary_code,
      requires_code_change,
      created_by_super_admin,
      created_at,
      updated_at
    )
    VALUES (
      'MAMELLES-001',
      'Clinique Mamelles',
      NULL,
      NULL,
      'dieudange@gmail.com',
      true,
      false,
      false,
      false,
      v_super_admin_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_clinic_id;
    RAISE NOTICE '✅ Clinique MAMELLES-001 créée avec ID: %', v_clinic_id;
  ELSE
    UPDATE clinics
    SET
      name = 'Clinique Mamelles',
      active = true,
      is_demo = false,
      is_temporary_code = false,
      requires_code_change = false,
      updated_at = NOW()
    WHERE id = v_clinic_id;
    RAISE NOTICE '✅ Clinique MAMELLES-001 existante mise à jour avec ID: %', v_clinic_id;
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
  SELECT id INTO v_plenitude_id FROM clinics WHERE code = 'PLENITUDE-001';
  SELECT id INTO v_mamelles_id FROM clinics WHERE code = 'MAMELLES-001';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION 84 TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   PLENITUDE-001 : %', v_plenitude_id;
  RAISE NOTICE '   MAMELLES-001  : %', v_mamelles_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Exécutez le script Node.js pour créer les admins (Auth + users):';
  RAISE NOTICE '   node server/scripts/seed-plenitude-mamelles-admins.js';
  RAISE NOTICE '';
END $$;
