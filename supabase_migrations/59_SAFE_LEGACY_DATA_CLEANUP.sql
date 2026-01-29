-- ============================================
-- MIGRATION 59: NETTOYAGE SÉCURISÉ DES DONNÉES LEGACY
-- ============================================
-- Cette migration nettoie les données legacy créées avant la correction multi-tenant
-- Règles:
-- 1. Assigner chaque enregistrement à sa clinique correcte basé sur des critères sûrs
-- 2. Marquer comme orphelins les enregistrements qu'on ne peut pas assigner sûrement
-- 3. Nettoyer les utilisateurs partagés (sauf SUPER_ADMIN)
-- 4. Ajouter des contraintes NOT NULL et FK
-- 5. NE JAMAIS supprimer de cliniques
-- 6. NE JAMAIS merger de cliniques
-- 7. NE JAMAIS dupliquer de données
-- ============================================

DO $$
DECLARE
  v_orphan_clinic_id UUID;
  v_first_clinic_id UUID;
  v_record_count INTEGER;
  v_updated_count INTEGER;
  v_orphaned_count INTEGER;
  v_log_table_name TEXT := 'data_cleanup_log';
BEGIN
  -- Créer une table de log pour tracer tous les changements
  CREATE TABLE IF NOT EXISTS data_cleanup_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL,
    record_id UUID,
    old_clinic_id UUID,
    new_clinic_id UUID,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Créer une clinique spéciale "ORPHANED" pour les données qu'on ne peut pas assigner
  SELECT id INTO v_orphan_clinic_id FROM clinics WHERE code = 'ORPHANED';
  IF v_orphan_clinic_id IS NULL THEN
    INSERT INTO clinics (code, name, active, created_at, updated_at)
    VALUES ('ORPHANED', 'Données Orphelines (Non Assignables)', false, NOW(), NOW())
    RETURNING id INTO v_orphan_clinic_id;
    RAISE NOTICE '✅ Clinique ORPHANED créée: %', v_orphan_clinic_id;
  END IF;

  -- Récupérer la première clinique pour le fallback (si nécessaire)
  SELECT id INTO v_first_clinic_id FROM clinics WHERE code != 'ORPHANED' ORDER BY created_at ASC LIMIT 1;
  
  IF v_first_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Aucune clinique trouvée. Créez au moins une clinique avant d''exécuter cette migration.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NETTOYAGE DES DONNÉES LEGACY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Clinique ORPHANED: %', v_orphan_clinic_id;
  RAISE NOTICE 'Clinique fallback: %', v_first_clinic_id;
  RAISE NOTICE '';

  -- ============================================
  -- ÉTAPE 1: NETTOYER LES clinic_id INVALIDES (références à des cliniques inexistantes)
  -- ============================================
  RAISE NOTICE '📋 ÉTAPE 1: Nettoyage des clinic_id invalides...';

  -- Patients avec clinic_id invalide
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  UPDATE patients p
  SET clinic_id = NULL
  WHERE p.clinic_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM clinics c WHERE c.id = p.clinic_id);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, old_clinic_id, reason)
    VALUES ('patients', 'INVALID_CLINIC_ID_CLEARED', NULL, format('%s patients avec clinic_id invalide', v_updated_count));
    RAISE NOTICE '   ✅ % patients avec clinic_id invalide nettoyés', v_updated_count;
  END IF;

  -- Factures avec clinic_id invalide
  UPDATE factures f
  SET clinic_id = NULL
  WHERE f.clinic_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM clinics c WHERE c.id = f.clinic_id);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, old_clinic_id, reason)
    VALUES ('factures', 'INVALID_CLINIC_ID_CLEARED', NULL, format('%s factures avec clinic_id invalide', v_updated_count));
    RAISE NOTICE '   ✅ % factures avec clinic_id invalide nettoyées', v_updated_count;
  END IF;

  -- Consultations avec clinic_id invalide
  UPDATE consultations c
  SET clinic_id = NULL
  WHERE c.clinic_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM clinics cl WHERE cl.id = c.clinic_id);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, old_clinic_id, reason)
    VALUES ('consultations', 'INVALID_CLINIC_ID_CLEARED', NULL, format('%s consultations avec clinic_id invalide', v_updated_count));
    RAISE NOTICE '   ✅ % consultations avec clinic_id invalide nettoyées', v_updated_count;
  END IF;

  -- ============================================
  -- ÉTAPE 2: ASSIGNER LES PATIENTS BASÉ SUR LEUR CRÉATEUR
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 ÉTAPE 2: Assignment des patients basé sur leur créateur...';

  -- Patients sans clinic_id: assigner depuis leur créateur (created_by)
  UPDATE patients p
  SET clinic_id = u.clinic_id
  FROM users u
  WHERE p.clinic_id IS NULL
    AND p.created_by IS NOT NULL
    AND u.id = p.created_by
    AND u.clinic_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM clinics c WHERE c.id = u.clinic_id);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, reason)
    VALUES ('patients', 'ASSIGNED_FROM_CREATOR', format('%s patients assignés depuis leur créateur', v_updated_count));
    RAISE NOTICE '   ✅ % patients assignés depuis leur créateur', v_updated_count;
  END IF;

  -- Patients sans clinic_id: assigner depuis la première consultation associée
  UPDATE patients p
  SET clinic_id = c.clinic_id
  FROM consultations c
  WHERE p.clinic_id IS NULL
    AND c.patient_id = p.id
    AND c.clinic_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM clinics cl WHERE cl.id = c.clinic_id)
  LIMIT 1;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, reason)
    VALUES ('patients', 'ASSIGNED_FROM_CONSULTATION', format('%s patients assignés depuis leur première consultation', v_updated_count));
    RAISE NOTICE '   ✅ % patients assignés depuis leur première consultation', v_updated_count;
  END IF;

  -- Patients sans clinic_id: assigner depuis la première facture associée
  UPDATE patients p
  SET clinic_id = f.clinic_id
  FROM factures f
  WHERE p.clinic_id IS NULL
    AND f.patient_id = p.id
    AND f.clinic_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM clinics cl WHERE cl.id = f.clinic_id)
  LIMIT 1;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, reason)
    VALUES ('patients', 'ASSIGNED_FROM_INVOICE', format('%s patients assignés depuis leur première facture', v_updated_count));
    RAISE NOTICE '   ✅ % patients assignés depuis leur première facture', v_updated_count;
  END IF;

  -- Patients restants sans clinic_id: marquer comme orphelins
  UPDATE patients
  SET clinic_id = v_orphan_clinic_id
  WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_orphaned_count = ROW_COUNT;
  IF v_orphaned_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
    VALUES ('patients', 'ORPHANED', v_orphan_clinic_id, format('%s patients marqués comme orphelins', v_orphaned_count));
    RAISE NOTICE '   ⚠️  % patients marqués comme orphelins (non assignables)', v_orphaned_count;
  END IF;

  -- ============================================
  -- ÉTAPE 3: ASSIGNER LES FACTURES BASÉ SUR LEUR PATIENT
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 ÉTAPE 3: Assignment des factures basé sur leur patient...';

  -- Factures sans clinic_id: assigner depuis leur patient
  UPDATE factures f
  SET clinic_id = p.clinic_id
  FROM patients p
  WHERE f.clinic_id IS NULL
    AND f.patient_id = p.id
    AND p.clinic_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, reason)
    VALUES ('factures', 'ASSIGNED_FROM_PATIENT', format('%s factures assignées depuis leur patient', v_updated_count));
    RAISE NOTICE '   ✅ % factures assignées depuis leur patient', v_updated_count;
  END IF;

  -- Factures restantes sans clinic_id: marquer comme orphelines
  UPDATE factures
  SET clinic_id = v_orphan_clinic_id
  WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_orphaned_count = ROW_COUNT;
  IF v_orphaned_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
    VALUES ('factures', 'ORPHANED', v_orphan_clinic_id, format('%s factures marquées comme orphelines', v_orphaned_count));
    RAISE NOTICE '   ⚠️  % factures marquées comme orphelines', v_orphaned_count;
  END IF;

  -- ============================================
  -- ÉTAPE 4: ASSIGNER LES CONSULTATIONS BASÉ SUR LEUR PATIENT
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 ÉTAPE 4: Assignment des consultations basé sur leur patient...';

  -- Consultations sans clinic_id: assigner depuis leur patient
  UPDATE consultations c
  SET clinic_id = p.clinic_id
  FROM patients p
  WHERE c.clinic_id IS NULL
    AND c.patient_id = p.id
    AND p.clinic_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, reason)
    VALUES ('consultations', 'ASSIGNED_FROM_PATIENT', format('%s consultations assignées depuis leur patient', v_updated_count));
    RAISE NOTICE '   ✅ % consultations assignées depuis leur patient', v_updated_count;
  END IF;

  -- Consultations restantes sans clinic_id: marquer comme orphelines
  UPDATE consultations
  SET clinic_id = v_orphan_clinic_id
  WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_orphaned_count = ROW_COUNT;
  IF v_orphaned_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
    VALUES ('consultations', 'ORPHANED', v_orphan_clinic_id, format('%s consultations marquées comme orphelines', v_orphaned_count));
    RAISE NOTICE '   ⚠️  % consultations marquées comme orphelines', v_orphaned_count;
  END IF;

  -- ============================================
  -- ÉTAPE 5: ASSIGNER LES PAIEMENTS BASÉ SUR LEUR FACTURE
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 ÉTAPE 5: Assignment des paiements basé sur leur facture...';

  -- Paiements sans clinic_id: assigner depuis leur facture
  UPDATE paiements p
  SET clinic_id = f.clinic_id
  FROM factures f
  WHERE p.clinic_id IS NULL
    AND p.facture_id = f.id
    AND f.clinic_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, reason)
    VALUES ('paiements', 'ASSIGNED_FROM_INVOICE', format('%s paiements assignés depuis leur facture', v_updated_count));
    RAISE NOTICE '   ✅ % paiements assignés depuis leur facture', v_updated_count;
  END IF;

  -- Paiements restants sans clinic_id: marquer comme orphelins
  UPDATE paiements
  SET clinic_id = v_orphan_clinic_id
  WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_orphaned_count = ROW_COUNT;
  IF v_orphaned_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
    VALUES ('paiements', 'ORPHANED', v_orphan_clinic_id, format('%s paiements marqués comme orphelins', v_orphaned_count));
    RAISE NOTICE '   ⚠️  % paiements marqués comme orphelins', v_orphaned_count;
  END IF;

  -- ============================================
  -- ÉTAPE 6: ASSIGNER LES PRESCRIPTIONS BASÉ SUR LEUR CONSULTATION
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 ÉTAPE 6: Assignment des prescriptions basé sur leur consultation...';

  -- Prescriptions sans clinic_id: assigner depuis leur consultation
  UPDATE prescriptions p
  SET clinic_id = c.clinic_id
  FROM consultations c
  WHERE p.clinic_id IS NULL
    AND p.consultation_id = c.id
    AND c.clinic_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, reason)
    VALUES ('prescriptions', 'ASSIGNED_FROM_CONSULTATION', format('%s prescriptions assignées depuis leur consultation', v_updated_count));
    RAISE NOTICE '   ✅ % prescriptions assignées depuis leur consultation', v_updated_count;
  END IF;

  -- Prescriptions restantes sans clinic_id: marquer comme orphelines
  UPDATE prescriptions
  SET clinic_id = v_orphan_clinic_id
  WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_orphaned_count = ROW_COUNT;
  IF v_orphaned_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
    VALUES ('prescriptions', 'ORPHANED', v_orphan_clinic_id, format('%s prescriptions marquées comme orphelines', v_orphaned_count));
    RAISE NOTICE '   ⚠️  % prescriptions marquées comme orphelines', v_orphaned_count;
  END IF;

  -- ============================================
  -- ÉTAPE 7: ASSIGNER LES LAB_REQUESTS ET IMAGING_REQUESTS
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 ÉTAPE 7: Assignment des lab_requests et imaging_requests...';

  -- Lab requests sans clinic_id: assigner depuis leur consultation
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_requests') THEN
    UPDATE lab_requests lr
    SET clinic_id = c.clinic_id
    FROM consultations c
    WHERE lr.clinic_id IS NULL
      AND lr.consultation_id = c.id
      AND c.clinic_id IS NOT NULL;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count > 0 THEN
      INSERT INTO data_cleanup_log (table_name, action, reason)
      VALUES ('lab_requests', 'ASSIGNED_FROM_CONSULTATION', format('%s lab_requests assignés depuis leur consultation', v_updated_count));
      RAISE NOTICE '   ✅ % lab_requests assignés depuis leur consultation', v_updated_count;
    END IF;

    UPDATE lab_requests
    SET clinic_id = v_orphan_clinic_id
    WHERE clinic_id IS NULL;
    GET DIAGNOSTICS v_orphaned_count = ROW_COUNT;
    IF v_orphaned_count > 0 THEN
      INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
      VALUES ('lab_requests', 'ORPHANED', v_orphan_clinic_id, format('%s lab_requests marqués comme orphelins', v_orphaned_count));
      RAISE NOTICE '   ⚠️  % lab_requests marqués comme orphelins', v_orphaned_count;
    END IF;
  END IF;

  -- Imaging requests sans clinic_id: assigner depuis leur consultation
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'imaging_requests') THEN
    UPDATE imaging_requests ir
    SET clinic_id = c.clinic_id
    FROM consultations c
    WHERE ir.clinic_id IS NULL
      AND ir.consultation_id = c.id
      AND c.clinic_id IS NOT NULL;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count > 0 THEN
      INSERT INTO data_cleanup_log (table_name, action, reason)
      VALUES ('imaging_requests', 'ASSIGNED_FROM_CONSULTATION', format('%s imaging_requests assignés depuis leur consultation', v_updated_count));
      RAISE NOTICE '   ✅ % imaging_requests assignés depuis leur consultation', v_updated_count;
    END IF;

    UPDATE imaging_requests
    SET clinic_id = v_orphan_clinic_id
    WHERE clinic_id IS NULL;
    GET DIAGNOSTICS v_orphaned_count = ROW_COUNT;
    IF v_orphaned_count > 0 THEN
      INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
      VALUES ('imaging_requests', 'ORPHANED', v_orphan_clinic_id, format('%s imaging_requests marqués comme orphelins', v_orphaned_count));
      RAISE NOTICE '   ⚠️  % imaging_requests marqués comme orphelins', v_orphaned_count;
    END IF;
  END IF;

  -- ============================================
  -- ÉTAPE 8: ASSIGNER LES MÉDICAMENTS ET STOCKS
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 ÉTAPE 8: Assignment des médicaments et stocks...';

  -- Médicaments sans clinic_id: assigner depuis leur créateur
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medicaments') THEN
    UPDATE medicaments m
    SET clinic_id = u.clinic_id
    FROM users u
    WHERE m.clinic_id IS NULL
      AND m.created_by IS NOT NULL
      AND u.id = m.created_by
      AND u.clinic_id IS NOT NULL;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count > 0 THEN
      INSERT INTO data_cleanup_log (table_name, action, reason)
      VALUES ('medicaments', 'ASSIGNED_FROM_CREATOR', format('%s médicaments assignés depuis leur créateur', v_updated_count));
      RAISE NOTICE '   ✅ % médicaments assignés depuis leur créateur', v_updated_count;
    END IF;

    -- Médicaments restants: laisser NULL (peuvent être globaux) ou assigner à la première clinique
    -- Ici on les laisse NULL car ils peuvent être partagés entre cliniques
    RAISE NOTICE '   ℹ️  Médicaments sans clinic_id laissés NULL (peuvent être globaux)';
  END IF;

  -- ============================================
  -- ÉTAPE 9: NETTOYER LES UTILISATEURS PARTAGÉS
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 ÉTAPE 9: Nettoyage des utilisateurs partagés...';

  -- Identifier les utilisateurs avec plusieurs clinic_id (via leurs créations)
  -- Si un utilisateur a créé des données pour plusieurs cliniques, garder son clinic_id principal
  -- et réassigner ses créations à sa clinique principale
  
  -- Utilisateurs sans clinic_id mais avec des créations: assigner à la clinique de leur première création
  UPDATE users u
  SET clinic_id = (
    SELECT DISTINCT p.clinic_id 
    FROM patients p 
    WHERE p.created_by = u.id AND p.clinic_id IS NOT NULL 
    LIMIT 1
  )
  WHERE u.clinic_id IS NULL
    AND u.role != 'SUPER_ADMIN'
    AND EXISTS (SELECT 1 FROM patients p WHERE p.created_by = u.id AND p.clinic_id IS NOT NULL);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, reason)
    VALUES ('users', 'ASSIGNED_FROM_CREATIONS', format('%s utilisateurs assignés depuis leurs créations', v_updated_count));
    RAISE NOTICE '   ✅ % utilisateurs assignés depuis leurs créations', v_updated_count;
  END IF;

  -- Utilisateurs restants sans clinic_id (sauf SUPER_ADMIN): assigner à la première clinique
  UPDATE users
  SET clinic_id = v_first_clinic_id
  WHERE clinic_id IS NULL
    AND role != 'SUPER_ADMIN';
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
    VALUES ('users', 'ASSIGNED_TO_FIRST_CLINIC', v_first_clinic_id, format('%s utilisateurs assignés à la première clinique', v_updated_count));
    RAISE NOTICE '   ✅ % utilisateurs assignés à la première clinique', v_updated_count;
  END IF;

  -- ============================================
  -- ÉTAPE 10: AJOUTER LES CONTRAINTES NOT NULL ET FK
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '📋 ÉTAPE 10: Ajout des contraintes NOT NULL et FK...';

  -- Patients: Ajouter FK si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_patients_clinic_id'
  ) THEN
    ALTER TABLE patients 
    ADD CONSTRAINT fk_patients_clinic_id 
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT;
    RAISE NOTICE '   ✅ FK ajoutée à patients.clinic_id';
  END IF;

  -- Factures: Ajouter FK si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_factures_clinic_id'
  ) THEN
    ALTER TABLE factures 
    ADD CONSTRAINT fk_factures_clinic_id 
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT;
    RAISE NOTICE '   ✅ FK ajoutée à factures.clinic_id';
  END IF;

  -- Consultations: Ajouter FK si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_consultations_clinic_id'
  ) THEN
    ALTER TABLE consultations 
    ADD CONSTRAINT fk_consultations_clinic_id 
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT;
    RAISE NOTICE '   ✅ FK ajoutée à consultations.clinic_id';
  END IF;

  -- Paiements: Ajouter FK si elle n'existe pas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'paiements') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_paiements_clinic_id'
    ) THEN
      ALTER TABLE paiements 
      ADD CONSTRAINT fk_paiements_clinic_id 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT;
      RAISE NOTICE '   ✅ FK ajoutée à paiements.clinic_id';
    END IF;
  END IF;

  -- Users: Ajouter FK si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_clinic_id'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT fk_users_clinic_id 
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;
    RAISE NOTICE '   ✅ FK ajoutée à users.clinic_id';
  END IF;

  -- NOTE: On ne rend PAS clinic_id NOT NULL car:
  -- 1. Les SUPER_ADMIN peuvent avoir clinic_id NULL
  -- 2. Certaines données peuvent être globales (médicaments partagés)
  -- 3. La contrainte FK suffit pour garantir l'intégrité référentielle

  -- ============================================
  -- RÉSUMÉ FINAL
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NETTOYAGE TERMINÉ';
  RAISE NOTICE '========================================';
  
  -- Afficher le résumé depuis la table de log
  SELECT COUNT(*) INTO v_record_count FROM data_cleanup_log;
  RAISE NOTICE 'Total d''actions loggées: %', v_record_count;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Consultez la table data_cleanup_log pour le détail de tous les changements.';
  RAISE NOTICE '';

END $$;

-- Créer un index sur la table de log pour faciliter les requêtes
CREATE INDEX IF NOT EXISTS idx_data_cleanup_log_table_name ON data_cleanup_log(table_name);
CREATE INDEX IF NOT EXISTS idx_data_cleanup_log_action ON data_cleanup_log(action);
CREATE INDEX IF NOT EXISTS idx_data_cleanup_log_created_at ON data_cleanup_log(created_at);

-- Vérification finale: compter les enregistrements orphelins
DO $$
DECLARE
  v_orphan_clinic_id UUID;
  v_orphan_count INTEGER;
BEGIN
  SELECT id INTO v_orphan_clinic_id FROM clinics WHERE code = 'ORPHANED';
  
  IF v_orphan_clinic_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VÉRIFICATION FINALE';
    RAISE NOTICE '========================================';
    
    SELECT COUNT(*) INTO v_orphan_count FROM patients WHERE clinic_id = v_orphan_clinic_id;
    RAISE NOTICE 'Patients orphelins: %', v_orphan_count;
    
    SELECT COUNT(*) INTO v_orphan_count FROM factures WHERE clinic_id = v_orphan_clinic_id;
    RAISE NOTICE 'Factures orphelines: %', v_orphan_count;
    
    SELECT COUNT(*) INTO v_orphan_count FROM consultations WHERE clinic_id = v_orphan_clinic_id;
    RAISE NOTICE 'Consultations orphelines: %', v_orphan_count;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Les données orphelines sont assignées à la clinique ORPHANED';
    RAISE NOTICE 'et peuvent être révisées manuellement si nécessaire.';
  END IF;
END $$;
