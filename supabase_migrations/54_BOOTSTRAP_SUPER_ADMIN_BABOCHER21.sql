-- ============================================
-- MIGRATION : BOOTSTRAP SUPER ADMIN (LIEN AUTH ↔ USERS)
-- VERSION: 54
-- DATE: 2026-01-25
-- ============================================
-- Objectif:
-- - Associer un utilisateur Supabase Auth existant (UID) à la table publique `users`
-- - Lui attribuer le rôle SUPER_ADMIN (supervision globale)
-- - Forcer status = ACTIVE et actif = true (compatible avec check_is_super_admin())
-- ============================================

DO $$
DECLARE
  v_auth_user_id UUID := '64ff9a06-bb4c-439f-841f-a06278251375';
  v_email TEXT := 'babocher21@gmail.com';
  v_user_id UUID;
BEGIN
  -- 1) Trouver un user existant (priorité au auth_user_id, sinon email)
  SELECT id
  INTO v_user_id
  FROM users
  WHERE auth_user_id = v_auth_user_id
     OR LOWER(TRIM(email)) = LOWER(TRIM(v_email))
  ORDER BY (auth_user_id = v_auth_user_id) DESC
  LIMIT 1;

  -- 2) Créer ou mettre à jour
  IF v_user_id IS NULL THEN
    INSERT INTO users (
      auth_user_id,
      email,
      nom,
      prenom,
      role,
      status,
      actif,
      clinic_id,
      created_at,
      updated_at
    ) VALUES (
      v_auth_user_id,
      LOWER(TRIM(v_email)),
      'Super',
      'Admin',
      'SUPER_ADMIN',
      'ACTIVE',
      true,
      NULL,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE '✅ Super Admin créé dans public.users (id=% , auth_user_id=% , email=%).', v_user_id, v_auth_user_id, v_email;
  ELSE
    UPDATE users
    SET
      auth_user_id = v_auth_user_id,
      email = LOWER(TRIM(v_email)),
      role = 'SUPER_ADMIN',
      status = 'ACTIVE',
      actif = true,
      updated_at = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE '✅ Super Admin mis à jour dans public.users (id=% , auth_user_id=% , email=%).', v_user_id, v_auth_user_id, v_email;
  END IF;
END $$;

