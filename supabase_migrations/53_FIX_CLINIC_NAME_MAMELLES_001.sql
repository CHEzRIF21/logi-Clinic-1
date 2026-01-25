-- ============================================
-- MIGRATION : CORRECTION NOM CLINIQUE MAMELLES-001
-- VERSION: 53
-- DATE: 2026-01-25
-- ============================================
-- Objectif:
-- - Corriger le nom de la clinique ayant le code 'MAMELLES-001'
-- - Migration idempotente (peut être rejouée sans effet de bord)

DO $$
DECLARE
  v_code TEXT := 'MAMELLES-001';
  v_expected_name TEXT := 'Clinique Santé LES MAMELLES';
  v_updated_count INT := 0;
BEGIN
  UPDATE clinics
  SET
    name = v_expected_name,
    updated_at = NOW()
  WHERE code = v_code
    AND (name IS DISTINCT FROM v_expected_name);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RAISE NOTICE 'ℹ️ Aucune mise à jour: clinique % introuvable ou déjà correcte.', v_code;
  ELSE
    RAISE NOTICE '✅ Clinique % mise à jour: name = %.', v_code, v_expected_name;
  END IF;
END $$;

