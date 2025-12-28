-- ============================================
-- RÉINITIALISATION CAMPUS-001 : Code Permanent
-- ============================================
-- Ce script configure CAMPUS-001 comme code permanent
-- et réinitialise l'état de l'admin pour permettre uniquement
-- le changement de mot de passe (pas de changement de code)
-- 
-- NOTE IMPORTANTE: Le code clinique est TOUJOURS créé par le backend
-- et ne peut JAMAIS être modifié par l'admin de la clinique.
-- Seul le mot de passe peut être changé à la première connexion.
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_user_id UUID;
BEGIN
  -- 1. Récupérer l'ID de la clinique CAMPUS-001
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 non trouvée';
  END IF;

  -- 2. Configurer la clinique comme PERMANENTE (pas temporaire)
  -- Le code clinique ne peut JAMAIS être modifié par l'admin
  UPDATE clinics
  SET 
    is_temporary_code = false,
    requires_code_change = false,
    active = true,
    updated_at = NOW()
  WHERE id = v_clinic_id;

  -- 3. Supprimer les entrées de codes temporaires pour cette clinique
  -- (elles ne sont plus nécessaires car le code est permanent)
  DELETE FROM clinic_temporary_codes
  WHERE clinic_id = v_clinic_id;

  -- 4. Réinitialiser le statut de l'admin pour forcer le changement de mot de passe
  UPDATE users
  SET 
    status = 'PENDING', -- Force le changement de mot de passe à la première connexion
    first_login_at = NULL, -- Réinitialise la date de première connexion
    updated_at = NOW()
  WHERE clinic_id = v_clinic_id
    AND role = 'CLINIC_ADMIN'
    AND email = 'bagarayannick1@gmail.com';

  RAISE NOTICE '✅ Configuration réinitialisée pour CAMPUS-001';
  RAISE NOTICE '   - Code clinique: PERMANENT (CAMPUS-001 ne peut pas être changé)';
  RAISE NOTICE '   - Admin devra changer son mot de passe à la première connexion';
  RAISE NOTICE '   - Le code clinique ne pourra PAS être modifié par l''admin';
END $$;

-- Vérification
SELECT 
  'VÉRIFICATION' as verification,
  c.code,
  c.name,
  c.is_temporary_code,
  c.requires_code_change,
  c.active,
  u.email as admin_email,
  u.status as admin_status,
  u.temp_code_used,
  CASE 
    WHEN c.is_temporary_code = false AND c.requires_code_change = false THEN '✅ Code permanent configuré'
    ELSE '❌ Configuration incorrecte'
  END as config_status
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id AND u.role = 'CLINIC_ADMIN'
WHERE c.code = 'CAMPUS-001';

