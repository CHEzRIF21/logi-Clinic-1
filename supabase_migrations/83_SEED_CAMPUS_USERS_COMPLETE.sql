-- ============================================
-- MIGRATION 83: SEED UTILISATEURS CAMPUS-001 (SQL PURO)
-- LogiClinic - Création des 16 utilisateurs via SQL
-- Date: 2026-02-04
-- ============================================

-- Activer pgcrypto pour le hachage des mots de passe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_clinic_id UUID;
  v_user RECORD;
  v_auth_id UUID;
  v_password TEXT;
  v_role TEXT;
  v_name_parts TEXT[];
  v_prenom TEXT;
  v_nom TEXT;
  v_encrypted_pw TEXT;
BEGIN
  -- 1. Récupérer l'ID de la clinique CAMPUS-001
  SELECT id INTO v_clinic_id FROM public.clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 introuvable. Veuillez exécuter la migration précédente.';
  END IF;
  
  RAISE NOTICE '🏥 Clinique CAMPUS-001 trouvée: %', v_clinic_id;

  -- 2. Définir table temporaire des utilisateurs à créer
  CREATE TEMP TABLE temp_users (
    full_name TEXT,
    email TEXT,
    role TEXT,
    fonction TEXT,
    password TEXT
  ) ON COMMIT DROP;

  INSERT INTO temp_users (full_name, email, role, fonction, password) VALUES
  ('Bagara Yannick', 'bagarayannick1@gmail.com', 'CLINIC_ADMIN', 'Administrateur', 'BagaraYannick@LC'),
  ('Akoutey Pélagie', 'pelagakoute@gmail.com', 'sage_femme', 'Sage-femme', 'Pel@9Aky!27mF'),
  ('Todjiclounon Djijoho Godfreed Ariel', 'arieltodjiclounon@gmail.com', 'infirmier', 'IDE', 'Ar!elT0dj#94Q'),
  ('Seidou Zouléhatou', 'seidouzoulehath@gmail.com', 'technicien_labo', 'Biologiste médicale', 'ZouL3h@t!82S'),
  ('N''Koue Charlotte', 'charlottenkoue8@gmail.com', 'aide_soignant', 'Aide-soignante', 'Ch@rL0t#Nk91'),
  ('Agossoukpe Jesusgnon Jacob Credo', 'jacobcredo38@gmail.com', 'medecin', 'Médecin généraliste', 'DrJc@b!G58Q'),
  ('Maninhou Murielle', 'muriellemaninhou@gmail.com', 'sage_femme', 'Sage-femme / Échographiste', 'MuR!3ll@92H'),
  ('Zannou Amen Christelle', 'zannouchristelle21@gmail.com', 'technicien_labo', 'Tech. sup. laboratoire', 'Am3nZ@n#C47'),
  ('Salifou Ninsiratou', 'ninsiratousalifou97@gmail.com', 'aide_soignant', 'Aide-soignante', 'N!ns@R4tu93'),
  ('Adjamonsi E. Inès-Aurore', 'aurorea135@gmail.com', 'infirmier', 'IDE', 'In3s@ur0r#88'),
  ('Codjo H. Ambroisine', 'ambroisine053@gmail.com', 'aide_soignant', 'Aide-soignante', 'AmbR0s!n#54'),
  ('Dotchamou Yeba Titilokpe Eléonore', 'dotchamouyebaeleonore@gmail.com', 'aide_soignant', 'Aide-soignante', 'El3oN0r@D!71'),
  ('Moukaila Nouriatou', 'moukailanouriatou@gmail.com', 'caissier', 'Caissière', 'N0ur!@T#66M'),
  ('Kouassi Danielle', 'kdanielle985@gmail.com', 'imagerie', 'Tech. imagerie médicale', 'D@n!3ll#K94'),
  ('Solete Ahoueffa Sèhouegnon Élodie Marthe', 'elodiesolete@gmail.com', 'imagerie', 'Imagerie / Écho', 'El0d!e@S#83'),
  ('Moussa Cherifath', 'cherifathmoussa14@gmail.com', 'caissier', 'Caissière', 'Ch3r!F@th#59');

  -- 3. Boucle de création
  FOR v_user IN SELECT * FROM temp_users LOOP
    
    -- Vérifier si l'utilisateur existe déjà dans auth.users
    SELECT id INTO v_auth_id FROM auth.users WHERE email = v_user.email;
    
    -- Extraction Nom/Prénom
    v_name_parts := string_to_array(v_user.full_name, ' ');
    v_prenom := v_name_parts[1]; -- Premier mot comme prénom (simplification)
    -- Le reste comme nom (simplification ou ajuster selon convention locale)
    IF array_length(v_name_parts, 1) > 1 THEN
       v_nom := array_to_string(v_name_parts[2:array_length(v_name_parts, 1)], ' ');
    ELSE
       v_nom := v_user.full_name;
    END IF;
    -- Ajustement inverse pour cohérence avec le script précédent (le premier est souvent le nom de famille en Afrique francophone, mais le script TS faisait prenom=parts[0])
    -- Gardons la logique du script TS : Prenom = parts[0], Nom = reste
    v_prenom := v_name_parts[1];
    v_nom := substring(v_user.full_name from length(v_prenom) + 2);
    IF v_nom IS NULL OR v_nom = '' THEN v_nom := v_prenom; END IF;

    IF v_auth_id IS NULL THEN
      -- CRÉATION AUTH USER
      v_encrypted_pw := crypt(v_user.password, gen_salt('bf'));
      
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- instance_id par défaut
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_user.email,
        v_encrypted_pw,
        NOW(), -- email confirmé
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object(
          'full_name', v_user.full_name,
          'role', v_user.role,
          'clinic_id', v_clinic_id,
          'nom', v_nom,
          'prenom', v_prenom
        ),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
      ) RETURNING id INTO v_auth_id;
      
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        v_auth_id,
        v_auth_id,
        jsonb_build_object('sub', v_auth_id, 'email', v_user.email, 'email_verified', true),
        'email',
        v_auth_id,
        NOW(),
        NOW(),
        NOW()
      );
      
      RAISE NOTICE '✅ Auth créé: % (%)', v_user.email, v_user.role;
    ELSE
      RAISE NOTICE 'ℹ️ Auth existant: %', v_user.email;
    END IF;

    -- CRÉATION / INSERTION PUBLIC USER
    INSERT INTO public.users (
      auth_user_id,
      clinic_id,
      email,
      role,
      nom,
      prenom,
      full_name,
      fonction,
      actif,
      status
    ) VALUES (
      v_auth_id,
      v_clinic_id,
      v_user.email,
      v_user.role,
      v_nom,
      v_prenom,
      v_user.full_name,
      v_user.fonction,
      true,
      'ACTIVE'
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
      clinic_id = EXCLUDED.clinic_id,
      role = EXCLUDED.role,
      fonction = EXCLUDED.fonction,
      updated_at = NOW();
      
    RAISE NOTICE '   -> Profil mis à jour';
    
  END LOOP;
  
END $$;

