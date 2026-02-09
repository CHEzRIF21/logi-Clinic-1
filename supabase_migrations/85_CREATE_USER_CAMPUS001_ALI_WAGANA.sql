-- ============================================
-- CRÉATION UTILISATEUR CAMPUS-001 : ALI WAGANA Islamiath
-- LogiClinic - Multi-tenant (isolation par clinic_id)
-- ============================================
-- Ce script insère/met à jour l'enregistrement dans public.users
-- pour l'utilisateur dont l'email est islamiathaliwag@gmail.com.
--
-- PRÉREQUIS : L'utilisateur doit déjà exister dans Supabase Auth.
-- Si ce n'est pas le cas, exécutez d'abord :
--   node server/scripts/create-user-campus001-ali-wagana.js
-- ou créez l'utilisateur via Dashboard > Authentication > Users.
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_auth_user_id UUID;
  v_user_id UUID;
  v_nom TEXT := 'ALI WAGANA';
  v_prenom TEXT := 'Islamiath';
  v_full_name TEXT := 'ALI WAGANA Islamiath';
  v_email TEXT := 'islamiathaliwag@gmail.com';
  v_role TEXT := 'staff_nurse';
  v_fonction TEXT := 'Infirmière';
BEGIN
  -- 1. Récupérer clinic_id pour CAMPUS-001
  SELECT id INTO v_clinic_id FROM public.clinics WHERE code = 'CAMPUS-001' LIMIT 1;
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 introuvable.';
  END IF;

  -- 2. Récupérer l'ID Auth (auth.users) pour l'email
  SELECT id INTO v_auth_user_id FROM auth.users WHERE email = v_email LIMIT 1;
  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'Utilisateur Auth non trouvé pour %. Créez-le d''abord via le script create-user-campus001-ali-wagana.js ou le Dashboard Supabase.', v_email;
    RETURN;
  END IF;

  -- 3. Vérifier si l'enregistrement existe déjà dans public.users
  SELECT id INTO v_user_id FROM public.users WHERE auth_user_id = v_auth_user_id LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Mise à jour pour garantir clinic_id, role, fonction
    UPDATE public.users
    SET
      clinic_id = v_clinic_id,
      full_name = v_full_name,
      nom = v_nom,
      prenom = v_prenom,
      role = v_role,
      fonction = v_fonction,
      actif = true,
      status = 'ACTIVE',
      updated_at = NOW()
    WHERE id = v_user_id;
    RAISE NOTICE 'Utilisateur public.users mis à jour (id=%, clinic_id=%)', v_user_id, v_clinic_id;
  ELSE
    -- Insertion
    INSERT INTO public.users (
      auth_user_id,
      clinic_id,
      email,
      full_name,
      nom,
      prenom,
      role,
      fonction,
      actif,
      status,
      created_at,
      updated_at
    )
    VALUES (
      v_auth_user_id,
      v_clinic_id,
      LOWER(v_email),
      v_full_name,
      v_nom,
      v_prenom,
      v_role,
      v_fonction,
      true,
      'ACTIVE',
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Utilisateur public.users créé pour % (clinic_id=%)', v_email, v_clinic_id;
  END IF;
END $$;
