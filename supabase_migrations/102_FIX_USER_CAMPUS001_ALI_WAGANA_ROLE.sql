-- ============================================
-- 102_FIX_USER_CAMPUS001_ALI_WAGANA_ROLE.sql
-- Correction du rôle pour l'utilisatrice ALI WAGANA Islamiath
-- Application: LogiClinic - Multi-tenant (isolation par clinic_id)
-- ============================================
-- Objectif:
--  - Corriger le rôle métier dans public.users pour l'utilisateur
--    de la clinique CAMPUS-001.
--  - Rôle actuel supposé : 'receptionist'
--  - Nouveau rôle attendu : 'staff_nurse' (fonction: 'Infirmière')
--
-- IMPORTANT:
--  - Respect de l'isolation par clinic_id: on cible explicitement
--    la clinique CAMPUS-001 via public.clinics.code.
--  - Aucune autre clinique / utilisateur n'est impacté.
-- ============================================

DO $$
DECLARE
  v_clinic_id     UUID;
  v_auth_user_id  UUID;
  v_user_id       UUID;
  v_email         TEXT := 'islamiathaliwag@gmail.com';
BEGIN
  -- 1. Récupérer l'ID de la clinique CAMPUS-001
  SELECT id INTO v_clinic_id
  FROM public.clinics
  WHERE code = 'CAMPUS-001'
  LIMIT 1;

  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique avec code CAMPUS-001 introuvable. Aucune modification appliquée.';
  END IF;

  -- 2. Récupérer l'ID Auth pour l'email cible
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = LOWER(v_email)
  LIMIT 1;

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'Utilisateur Auth non trouvé pour % – aucune modification appliquée.', v_email;
    RETURN;
  END IF;

  -- 3. Vérifier l'existence de la ligne dans public.users
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = v_auth_user_id
    AND clinic_id = v_clinic_id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Aucune ligne public.users trouvée pour auth_user_id=% et clinic_id=% – aucune modification appliquée.', v_auth_user_id, v_clinic_id;
    RETURN;
  END IF;

  -- 4. Mise à jour du rôle et de la fonction métier
  UPDATE public.users
  SET
    role       = 'staff_nurse',
    fonction   = 'Infirmière',
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE 'Rôle corrigé pour % : role=staff_nurse, fonction=Infirmière (clinic_id=%).', v_email, v_clinic_id;
END $$;

-- Fin de la migration 102_FIX_USER_CAMPUS001_ALI_WAGANA_ROLE.sql

