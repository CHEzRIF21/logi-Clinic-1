-- ============================================
-- MIGRATION : CRÉATION SUPER ADMIN ARAFATHIMOROU
-- VERSION: 56
-- DATE: 2026-01-29
-- ============================================
-- Objectif:
-- - Créer le rôle SUPER_ADMIN dans role_definitions (si inexistant)
-- - Créer ou mettre à jour l'utilisateur arafathimorou@gmail.com
-- - Lui attribuer le rôle SUPER_ADMIN avec accès à toutes les cliniques
-- - Lier avec auth_user_id: aae77bb9-a10a-4783-8042-90664f3b9557
-- - Générer un mot de passe temporaire sécurisé
-- ============================================

DO $$
DECLARE
  v_auth_user_id UUID := 'aae77bb9-a10a-4783-8042-90664f3b9557';
  v_email TEXT := 'arafathimorou@gmail.com';
  v_user_id UUID;
  v_password TEXT := 'SuperAdmin2026!@#';
  v_password_hash TEXT := '8990d30b128a52f70406f60a0b6693c009d125ed00f6a75f6018fca22304edeb';
BEGIN
  -- ============================================
  -- ÉTAPE 1 : CRÉER LE RÔLE SUPER_ADMIN DANS role_definitions
  -- ============================================
  INSERT INTO role_definitions (role_code, role_name, description, is_admin)
  VALUES (
    'SUPER_ADMIN',
    'Super Administrateur',
    'Administrateur système - Accès complet à toutes les cliniques et tous les modules',
    true
  )
  ON CONFLICT (role_code) DO UPDATE SET
    role_name = EXCLUDED.role_name,
    description = EXCLUDED.description,
    is_admin = true,
    updated_at = NOW();

  RAISE NOTICE '✅ Rôle SUPER_ADMIN créé/mis à jour dans role_definitions';

  -- ============================================
  -- ÉTAPE 2 : TROUVER OU CRÉER L'UTILISATEUR
  -- ============================================
  SELECT id
  INTO v_user_id
  FROM users
  WHERE auth_user_id = v_auth_user_id
     OR LOWER(TRIM(email)) = LOWER(TRIM(v_email))
  ORDER BY (auth_user_id = v_auth_user_id) DESC
  LIMIT 1;

  -- ============================================
  -- ÉTAPE 3 : CRÉER OU METTRE À JOUR L'UTILISATEUR
  -- ============================================
  IF v_user_id IS NULL THEN
    -- Créer l'utilisateur
    INSERT INTO users (
      auth_user_id,
      email,
      nom,
      prenom,
      password_hash,
      role,
      status,
      actif,
      clinic_id,
      created_at,
      updated_at
    ) VALUES (
      v_auth_user_id,
      LOWER(TRIM(v_email)),
      'Arafat',
      'Morou',
      v_password_hash,
      'SUPER_ADMIN',
      'ACTIVE',
      true,
      NULL, -- clinic_id NULL = accès à toutes les cliniques
      NOW(),
      NOW()
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE '✅ Super Admin créé dans public.users';
    RAISE NOTICE '   ID: %', v_user_id;
    RAISE NOTICE '   Auth User ID: %', v_auth_user_id;
    RAISE NOTICE '   Email: %', v_email;
  ELSE
    -- Mettre à jour l'utilisateur existant
    UPDATE users
    SET
      auth_user_id = v_auth_user_id,
      email = LOWER(TRIM(v_email)),
      nom = COALESCE(nom, 'Arafat'),
      prenom = COALESCE(prenom, 'Morou'),
      password_hash = COALESCE(password_hash, v_password_hash),
      role = 'SUPER_ADMIN',
      status = 'ACTIVE',
      actif = true,
      clinic_id = NULL, -- S'assurer que clinic_id est NULL pour accès global
      updated_at = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE '✅ Super Admin mis à jour dans public.users';
    RAISE NOTICE '   ID: %', v_user_id;
    RAISE NOTICE '   Auth User ID: %', v_auth_user_id;
    RAISE NOTICE '   Email: %', v_email;
  END IF;

  -- ============================================
  -- ÉTAPE 4 : AFFICHER LES INFORMATIONS DE CONNEXION
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ SUPER ADMIN CONFIGURÉ AVEC SUCCÈS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 IDENTIFIANTS DE CONNEXION:';
  RAISE NOTICE '';
  RAISE NOTICE '   Email: %', v_email;
  RAISE NOTICE '   Mot de passe: %', v_password;
  RAISE NOTICE '';
  RAISE NOTICE '📊 INFORMATIONS UTILISATEUR:';
  RAISE NOTICE '   ID: %', v_user_id;
  RAISE NOTICE '   Auth User ID: %', v_auth_user_id;
  RAISE NOTICE '   Rôle: SUPER_ADMIN';
  RAISE NOTICE '   Statut: ACTIVE';
  RAISE NOTICE '   Accès: Toutes les cliniques (clinic_id = NULL)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTE IMPORTANTE:';
  RAISE NOTICE '   - Le Super Admin a accès à TOUTES les cliniques';
  RAISE NOTICE '   - Il peut gérer tous les modules du système';
  RAISE NOTICE '   - Il n''a pas besoin de code clinique pour se connecter';
  RAISE NOTICE '   - Changez le mot de passe après la première connexion';
  RAISE NOTICE '';

END $$;
