-- ============================================
-- MIGRATION : MAJ UID AUTH SUPER ADMIN (LIEN AUTH ↔ USERS)
-- VERSION: 55
-- DATE: 2026-01-25
-- ============================================
-- Contexte:
-- - Le Super Admin a été supprimé/recréé dans Supabase Auth (nouveau UID)
-- Objectif:
-- - Mettre à jour `public.users.auth_user_id` pour l'email indiqué
-- - Garantir rôle SUPER_ADMIN, status ACTIVE, actif=true
-- - Rendre la migration idempotente et éviter les conflits UNIQUE(auth_user_id)
-- ============================================

DO $$
DECLARE
  v_auth_user_id UUID := 'afb5928a-f344-4359-b5f6-165b7dc80a02';
  v_email TEXT := 'babocher21@gmail.com';
  v_user_id UUID;
BEGIN
  -- 0) Si un autre enregistrement utilise déjà ce nouvel UID, on le déleste (évite conflit UNIQUE)
  UPDATE users
  SET auth_user_id = NULL,
      updated_at = NOW()
  WHERE auth_user_id = v_auth_user_id
    AND LOWER(TRIM(email)) <> LOWER(TRIM(v_email));

  -- 1) Cibler l'utilisateur par email (source de vérité)
  SELECT id
  INTO v_user_id
  FROM users
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_email))
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  -- 2) Créer si absent
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

    RAISE NOTICE '✅ Super Admin créé (email=% , auth_user_id=% , id=%).', v_email, v_auth_user_id, v_user_id;
  ELSE
    -- 3) Mettre à jour le lien Auth + forcer les flags nécessaires au RLS
    UPDATE users
    SET
      auth_user_id = v_auth_user_id,
      role = 'SUPER_ADMIN',
      status = 'ACTIVE',
      actif = true,
      clinic_id = NULL,
      updated_at = NOW()
    WHERE id = v_user_id;

    -- 4) Hygiène: si d'autres lignes ont le même email, on désactive les doublons
    UPDATE users
    SET
      actif = false,
      status = 'SUSPENDED',
      updated_at = NOW()
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_email))
      AND id <> v_user_id
      AND actif = true;

    RAISE NOTICE '✅ Super Admin mis à jour (email=% , auth_user_id=% , id=%).', v_email, v_auth_user_id, v_user_id;
  END IF;
END $$;

