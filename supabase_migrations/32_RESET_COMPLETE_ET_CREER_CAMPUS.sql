-- ============================================
-- MIGRATION 32: RÉINITIALISATION COMPLÈTE ET CRÉATION CAMPUS-001
-- ============================================
-- Cette migration :
-- 1. Supprime TOUTES les données métier (patients, consultations, etc.)
-- 2. Supprime toutes les cliniques (sauf structure)
-- 3. Garde le SUPER_ADMIN
-- 4. Recrée CAMPUS-001 avec son admin (status PENDING, mot de passe temporaire)
-- 5. Configure pour une première connexion
-- ============================================

-- ============================================
-- ÉTAPE 1 : SUPPRIMER TOUTES LES DONNÉES MÉTIER
-- ============================================
-- IMPORTANT: L'ordre de suppression respecte les contraintes FK
-- On supprime d'abord les tables enfants, puis les tables parentes

DO $$
DECLARE
  -- Tables enfants (qui référencent d'autres tables) - À supprimer EN PREMIER
  v_child_tables TEXT[] := ARRAY[
    -- Tables qui référencent consultations
    'lab_prescriptions',
    'lab_prescriptions_analyses',
    'lab_resultats_consultation',
    'consultation_steps',
    'consultation_entries',
    'consultation_constantes',
    'prescription_lines',  -- Référence prescriptions
    'prescriptions',  -- Référence consultations
    -- Tables qui référencent patients
    'patient_files',
    'patient_care_timeline',
    'patient_antecedents',
    'patient_assurances',
    -- Tables qui référencent factures
    'lignes_facture',
    'paiements',
    'remises_exonerations',
    'credits_facturation',
    'tickets_facturation',
    -- Tables de stock (dépendances)
    'pertes_retours',
    'inventaire_lignes',
    'inventaires',
    'alertes_stock',
    'dispensation_lignes',
    'dispensations',
    'transfert_lignes',
    'transferts',
    'mouvements_stock',
    'lots',
    -- Tables laboratoire
    'lab_requests',
    'lab_examens_maternite',
    'lab_notifications_maternite',
    'lab_verrouillage_resultats',
    'lab_consommation_analyse',
    'lab_examen_reactifs',
    'lab_modeles_examens',
    'lab_valeurs_reference',
    'lab_stocks_reactifs',
    'lab_consommations_reactifs',
    'lab_alertes',
    -- Tables imagerie
    'imaging_requests',
    'imagerie_examens',
    'imagerie_images',
    'imagerie_annotations',
    'imagerie_rapports',
    -- Tables maternité
    'surveillance_post_partum',
    'observation_post_partum',
    'traitement_post_partum',
    'conseils_post_partum',
    'sortie_salle_naissance',
    'complication_post_partum',
    -- Autres tables enfants
    'protocols',
    'journal_caisse'
  ];
  
  -- Tables parentes (référencées par d'autres) - À supprimer APRÈS
  v_parent_tables TEXT[] := ARRAY[
    'consultations',
    'patients',
    'factures',
    'medicaments',
    'consultation_templates',
    'diagnostics',
    'motifs',
    'registration_requests',
    'clinic_temporary_codes'
  ];
  
  v_table TEXT;
  v_deleted_count INT;
  v_error_occurred BOOLEAN := false;
BEGIN
  RAISE NOTICE '🗑️  Suppression de toutes les données métier...';
  RAISE NOTICE '   (Ordre: tables enfants d''abord, puis tables parentes)';
  
  -- ÉTAPE 1.1 : Supprimer les tables enfants
  RAISE NOTICE '';
  RAISE NOTICE '📋 Suppression des tables enfants...';
  
  FOREACH v_table IN ARRAY v_child_tables
  LOOP
    -- Vérifier si la table existe
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = v_table
    ) THEN
      BEGIN
        -- Supprimer toutes les données
        -- Utiliser TRUNCATE CASCADE si possible (plus rapide et gère les FK automatiquement)
        -- Sinon, utiliser DELETE
        BEGIN
          EXECUTE format('TRUNCATE TABLE %I CASCADE', v_table);
          RAISE NOTICE '   ✅ % : vidée (TRUNCATE CASCADE)', v_table;
        EXCEPTION
          WHEN OTHERS THEN
            -- Si TRUNCATE échoue, utiliser DELETE
            EXECUTE format('DELETE FROM %I', v_table);
            GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
            
            IF v_deleted_count > 0 THEN
              RAISE NOTICE '   ✅ % : % lignes supprimées', v_table, v_deleted_count;
            END IF;
        END;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING '   ⚠️  Erreur lors de la suppression de % : %', v_table, SQLERRM;
          v_error_occurred := true;
      END;
    END IF;
  END LOOP;
  
  -- ÉTAPE 1.2 : Supprimer les tables parentes
  RAISE NOTICE '';
  RAISE NOTICE '📋 Suppression des tables parentes...';
  
  FOREACH v_table IN ARRAY v_parent_tables
  LOOP
    -- Vérifier si la table existe
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = v_table
    ) THEN
      BEGIN
        -- Supprimer toutes les données
        -- Utiliser TRUNCATE CASCADE si possible
        BEGIN
          EXECUTE format('TRUNCATE TABLE %I CASCADE', v_table);
          RAISE NOTICE '   ✅ % : vidée (TRUNCATE CASCADE)', v_table;
        EXCEPTION
          WHEN OTHERS THEN
            -- Si TRUNCATE échoue, utiliser DELETE
            EXECUTE format('DELETE FROM %I', v_table);
            GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
            
            IF v_deleted_count > 0 THEN
              RAISE NOTICE '   ✅ % : % lignes supprimées', v_table, v_deleted_count;
            END IF;
        END;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING '   ⚠️  Erreur lors de la suppression de % : %', v_table, SQLERRM;
          v_error_occurred := true;
      END;
    END IF;
  END LOOP;
  
  IF v_error_occurred THEN
    RAISE WARNING '⚠️  Certaines erreurs sont survenues lors de la suppression. Vérifiez les messages ci-dessus.';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ Toutes les données métier supprimées avec succès';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : SUPPRIMER TOUS LES UTILISATEURS (SAUF SUPER_ADMIN)
-- ============================================

DO $$
DECLARE
  v_deleted_count INT;
  v_super_admin_count INT;
BEGIN
  RAISE NOTICE '🗑️  Suppression des utilisateurs (sauf SUPER_ADMIN)...';
  
  -- Compter les SUPER_ADMIN avant suppression
  SELECT COUNT(*) INTO v_super_admin_count
  FROM users
  WHERE role = 'SUPER_ADMIN';
  
  -- Supprimer tous les utilisateurs sauf SUPER_ADMIN
  DELETE FROM users
  WHERE role != 'SUPER_ADMIN' OR role IS NULL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE '   ✅ % utilisateurs supprimés', v_deleted_count;
  RAISE NOTICE '   ✅ % SUPER_ADMIN conservés', v_super_admin_count;
END $$;

-- ============================================
-- ÉTAPE 3 : SUPPRIMER TOUTES LES CLINIQUES
-- ============================================

DO $$
DECLARE
  v_deleted_count INT;
BEGIN
  RAISE NOTICE '🗑️  Suppression de toutes les cliniques...';
  
  -- Supprimer toutes les cliniques
  DELETE FROM clinics;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE '   ✅ % cliniques supprimées', v_deleted_count;
END $$;

-- ============================================
-- ÉTAPE 4 : VÉRIFIER QUE LE SUPER_ADMIN EXISTE
-- ============================================

DO $$
DECLARE
  v_super_admin_id UUID;
  v_super_admin_email TEXT := 'babocher21@gmail.com';
BEGIN
  RAISE NOTICE '🔍 Vérification du SUPER_ADMIN...';
  
  -- Récupérer le SUPER_ADMIN
  SELECT id INTO v_super_admin_id
  FROM users
  WHERE role = 'SUPER_ADMIN'
  LIMIT 1;
  
  IF v_super_admin_id IS NULL THEN
    RAISE WARNING '⚠️  Aucun SUPER_ADMIN trouvé. Création d''un SUPER_ADMIN par défaut...';
    
    -- Créer un SUPER_ADMIN par défaut
    INSERT INTO users (
      email,
      nom,
      prenom,
      role,
      status,
      actif,
      created_at,
      updated_at
    )
    VALUES (
      v_super_admin_email,
      'Super',
      'Admin',
      'SUPER_ADMIN',
      'ACTIVE',
      true,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_super_admin_id;
    
    RAISE NOTICE '   ✅ SUPER_ADMIN créé avec ID: %', v_super_admin_id;
  ELSE
    RAISE NOTICE '   ✅ SUPER_ADMIN trouvé avec ID: %', v_super_admin_id;
  END IF;
END $$;

-- ============================================
-- ÉTAPE 5 : VÉRIFIER ET AJOUTER LA COLONNE created_by_super_admin SI NÉCESSAIRE
-- ============================================

DO $$
BEGIN
  -- Vérifier si la colonne created_by_super_admin existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics' 
    AND column_name = 'created_by_super_admin'
  ) THEN
    -- Ajouter la colonne si elle n'existe pas
    ALTER TABLE clinics ADD COLUMN created_by_super_admin UUID;
    RAISE NOTICE '✅ Colonne created_by_super_admin ajoutée à la table clinics';
  END IF;
  
  -- Vérifier et ajouter les autres colonnes si nécessaire
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics' 
    AND column_name = 'is_demo'
  ) THEN
    ALTER TABLE clinics ADD COLUMN is_demo BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne is_demo ajoutée à la table clinics';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics' 
    AND column_name = 'is_temporary_code'
  ) THEN
    ALTER TABLE clinics ADD COLUMN is_temporary_code BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne is_temporary_code ajoutée à la table clinics';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics' 
    AND column_name = 'requires_code_change'
  ) THEN
    ALTER TABLE clinics ADD COLUMN requires_code_change BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne requires_code_change ajoutée à la table clinics';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 6 : CRÉER CAMPUS-001 AVEC SON ADMIN
-- ============================================

DO $$
DECLARE
  v_super_admin_id UUID;
  v_clinic_id UUID;
  v_user_id UUID;
  v_clinic_code TEXT := 'CAMPUS-001';
  v_clinic_name TEXT := 'Clinique du Campus';
  v_clinic_address TEXT := 'Quartier Arafat; rue opposée universite ESAE';
  v_clinic_phone TEXT := '+229 90904344';
  v_clinic_email TEXT := 'cliniquemedicalecampus@gmail.com';
  v_admin_email TEXT := 'bagarayannick1@gmail.com';
  v_admin_nom TEXT := 'BAGARA';
  v_admin_prenom TEXT := 'Sabi Yannick';
  v_admin_telephone TEXT := NULL;
  v_temp_password TEXT;
  v_password_hash TEXT;
  v_has_created_by_super_admin BOOLEAN;
BEGIN
  RAISE NOTICE '🏥 Création de CAMPUS-001 avec son admin...';
  
  -- Récupérer le SUPER_ADMIN
  SELECT id INTO v_super_admin_id
  FROM users
  WHERE role = 'SUPER_ADMIN'
  LIMIT 1;
  
  IF v_super_admin_id IS NULL THEN
    RAISE EXCEPTION 'SUPER_ADMIN non trouvé. Impossible de créer la clinique.';
  END IF;
  
  -- Vérifier si la colonne created_by_super_admin existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics' 
    AND column_name = 'created_by_super_admin'
  ) INTO v_has_created_by_super_admin;
  
  -- Générer le code clinique (format: CLIN-YYYY-XXX)
  -- Mais pour CAMPUS-001, on garde le code spécial
  v_clinic_code := 'CAMPUS-001';
  
  -- Générer un mot de passe temporaire sécurisé
  v_temp_password := 'TempCampus2025!';
  
  -- Hasher le mot de passe
  v_password_hash := encode(digest(v_temp_password || 'logi_clinic_salt', 'sha256'), 'hex');
  
  -- Créer la clinique (avec ou sans created_by_super_admin selon la structure)
  IF v_has_created_by_super_admin THEN
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
      v_clinic_code,
      v_clinic_name,
      v_clinic_address,
      v_clinic_phone,
      v_clinic_email,
      true,
      false,  -- Pas une démo
      false,  -- Code permanent
      false,  -- Pas de changement de code requis
      v_super_admin_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_clinic_id;
  ELSE
    -- Si la colonne n'existe pas, créer sans cette colonne
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
      created_at,
      updated_at
    )
    VALUES (
      v_clinic_code,
      v_clinic_name,
      v_clinic_address,
      v_clinic_phone,
      v_clinic_email,
      true,
      false,  -- Pas une démo
      false,  -- Code permanent
      false,  -- Pas de changement de code requis
      NOW(),
      NOW()
    )
    RETURNING id INTO v_clinic_id;
  END IF;
  
  RAISE NOTICE '   ✅ Clinique CAMPUS-001 créée avec ID: %', v_clinic_id;
  
  -- Créer l'admin de la clinique
  INSERT INTO users (
    email,
    nom,
    prenom,
    telephone,
    role,
    status,
    clinic_id,
    actif,
    password_hash,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    LOWER(TRIM(v_admin_email)),
    v_admin_nom,
    v_admin_prenom,
    v_admin_telephone,
    'CLINIC_ADMIN',
    'PENDING',  -- Devra changer son mot de passe à la première connexion
    v_clinic_id,
    true,
    v_password_hash,
    v_super_admin_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;
  
  RAISE NOTICE '   ✅ Admin créé avec ID: %', v_user_id;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CAMPUS-001 CRÉÉE AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Informations de connexion:';
  RAISE NOTICE '   Code clinique: %', v_clinic_code;
  RAISE NOTICE '   Email admin: %', v_admin_email;
  RAISE NOTICE '   Mot de passe temporaire: %', v_temp_password;
  RAISE NOTICE '   Statut: PENDING (changement de mot de passe obligatoire)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT:';
  RAISE NOTICE '   1. L''admin doit se connecter avec ces identifiants';
  RAISE NOTICE '   2. Le système affichera automatiquement le dialogue de changement de mot de passe';
  RAISE NOTICE '   3. Une fois le mot de passe changé, le statut passera à ACTIVE';
  RAISE NOTICE '';
END $$;

-- ============================================
-- ÉTAPE 7 : VÉRIFICATIONS FINALES
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_user_id UUID;
  v_clinic_count INT;
  v_user_count INT;
  v_data_count INT;
BEGIN
  RAISE NOTICE '🔍 Vérifications finales...';
  
  -- Vérifier la clinique
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  SELECT COUNT(*) INTO v_clinic_count FROM clinics;
  
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION '❌ Erreur: Clinique CAMPUS-001 non trouvée après création';
  END IF;
  
  RAISE NOTICE '   ✅ Clinique CAMPUS-001 trouvée (ID: %)', v_clinic_id;
  RAISE NOTICE '   ✅ Total cliniques: %', v_clinic_count;
  
  -- Vérifier l'admin
  SELECT id INTO v_user_id 
  FROM users 
  WHERE email = 'bagarayannick1@gmail.com' 
    AND clinic_id = v_clinic_id;
  
  SELECT COUNT(*) INTO v_user_count 
  FROM users 
  WHERE role = 'CLINIC_ADMIN';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Erreur: Admin CAMPUS-001 non trouvé après création';
  END IF;
  
  RAISE NOTICE '   ✅ Admin trouvé (ID: %)', v_user_id;
  RAISE NOTICE '   ✅ Total admins clinique: %', v_user_count;
  
  -- Vérifier qu'il n'y a pas de données
  SELECT COUNT(*) INTO v_data_count FROM patients;
  
  IF v_data_count > 0 THEN
    RAISE WARNING '⚠️  Attention: % patients trouvés (devrait être 0)', v_data_count;
  ELSE
    RAISE NOTICE '   ✅ Aucune donnée métier (base vierge)';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RÉINITIALISATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 État final:';
  RAISE NOTICE '   - Cliniques: % (CAMPUS-001 uniquement)', v_clinic_count;
  RAISE NOTICE '   - Admins: % (1 admin CAMPUS-001)', v_user_count;
  RAISE NOTICE '   - Données métier: 0 (base vierge)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes:';
  RAISE NOTICE '   1. Créer/lier l''utilisateur Auth via bootstrap-clinic-admin-auth';
  RAISE NOTICE '   2. Se connecter avec les identifiants temporaires';
  RAISE NOTICE '   3. Changer le mot de passe (obligatoire)';
  RAISE NOTICE '   4. Commencer à utiliser la clinique';
  RAISE NOTICE '';
END $$;

-- ============================================
-- ÉTAPE 8 : AFFICHER LE RÉSUMÉ
-- ============================================

SELECT 
  'RÉINITIALISATION TERMINÉE' as status,
  (SELECT COUNT(*) FROM clinics) as total_clinics,
  (SELECT COUNT(*) FROM users WHERE role = 'CLINIC_ADMIN') as clinic_admins,
  (SELECT COUNT(*) FROM patients) as total_patients,
  (SELECT COUNT(*) FROM consultations) as total_consultations,
  (SELECT code FROM clinics WHERE code = 'CAMPUS-001') as clinic_code,
  (SELECT email FROM users WHERE email = 'bagarayannick1@gmail.com') as admin_email;

