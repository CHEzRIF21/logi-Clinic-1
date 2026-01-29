-- ============================================
-- MIGRATION 58: CORRECTION MULTI-TENANCY - AJOUT clinic_id AUX TABLES CRITIQUES
-- ============================================
-- Cette migration corrige les failles de sécurité multi-tenant en ajoutant
-- clinic_id aux tables qui n'en ont pas encore et en backfillant les données existantes
-- ============================================

DO $$
DECLARE
  v_first_clinic_id UUID;
BEGIN
  -- Récupérer la première clinique pour le backfill (à adapter selon votre logique)
  SELECT id INTO v_first_clinic_id FROM clinics ORDER BY created_at ASC LIMIT 1;
  
  IF v_first_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Aucune clinique trouvée. Créez au moins une clinique avant d''exécuter cette migration.';
  END IF;

  RAISE NOTICE 'Utilisation de la clinique % pour le backfill', v_first_clinic_id;

  -- ============================================
  -- PATIENTS
  -- ============================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'patients' 
    AND column_name = 'clinic_id'
  ) THEN
    RAISE NOTICE 'Ajout de clinic_id à la table patients...';
    
    ALTER TABLE patients ADD COLUMN clinic_id UUID;
    CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
    
    -- Backfill: Assigner les patients existants à la première clinique
    UPDATE patients SET clinic_id = v_first_clinic_id WHERE clinic_id IS NULL;
    
    -- Ajouter la contrainte FK
    ALTER TABLE patients 
    ADD CONSTRAINT fk_patients_clinic_id 
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    
    -- Rendre NOT NULL après backfill
    ALTER TABLE patients ALTER COLUMN clinic_id SET NOT NULL;
    
    RAISE NOTICE '✅ clinic_id ajouté à patients';
  ELSE
    RAISE NOTICE '⚠️ clinic_id existe déjà dans patients';
  END IF;

  -- ============================================
  -- FACTURES
  -- ============================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'factures' 
    AND column_name = 'clinic_id'
  ) THEN
    RAISE NOTICE 'Ajout de clinic_id à la table factures...';
    
    ALTER TABLE factures ADD COLUMN clinic_id UUID;
    CREATE INDEX idx_factures_clinic_id ON factures(clinic_id);
    
    -- Backfill: Depuis les patients
    UPDATE factures f
    SET clinic_id = p.clinic_id
    FROM patients p
    WHERE f.patient_id = p.id AND f.clinic_id IS NULL;
    
    -- Assigner à la première clinique si pas de patient associé
    UPDATE factures SET clinic_id = v_first_clinic_id WHERE clinic_id IS NULL;
    
    -- Ajouter la contrainte FK
    ALTER TABLE factures 
    ADD CONSTRAINT fk_factures_clinic_id 
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    
    -- Rendre NOT NULL après backfill
    ALTER TABLE factures ALTER COLUMN clinic_id SET NOT NULL;
    
    RAISE NOTICE '✅ clinic_id ajouté à factures';
  ELSE
    RAISE NOTICE '⚠️ clinic_id existe déjà dans factures';
  END IF;

  -- ============================================
  -- OPERATIONS
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operations') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'operations' 
      AND column_name = 'clinic_id'
    ) THEN
      RAISE NOTICE 'Ajout de clinic_id à la table operations...';
      
      ALTER TABLE operations ADD COLUMN clinic_id UUID;
      CREATE INDEX idx_operations_clinic_id ON operations(clinic_id);
      
      -- Backfill: Depuis les patients
      UPDATE operations o
      SET clinic_id = p.clinic_id
      FROM patients p
      WHERE o.patient_id = p.id AND o.clinic_id IS NULL;
      
      -- Assigner à la première clinique si pas de patient associé
      UPDATE operations SET clinic_id = v_first_clinic_id WHERE clinic_id IS NULL;
      
      -- Ajouter la contrainte FK
      ALTER TABLE operations 
      ADD CONSTRAINT fk_operations_clinic_id 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
      
      -- Rendre NOT NULL après backfill
      ALTER TABLE operations ALTER COLUMN clinic_id SET NOT NULL;
      
      RAISE NOTICE '✅ clinic_id ajouté à operations';
    ELSE
      RAISE NOTICE '⚠️ clinic_id existe déjà dans operations';
    END IF;
  END IF;

  -- ============================================
  -- PRODUCTS (si multi-tenant requis)
  -- ============================================
  -- NOTE: Les produits peuvent être partagés ou spécifiques selon votre logique métier
  -- Ici, on les rend multi-tenant. Si vous voulez des produits partagés, commentez cette section
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'clinic_id'
    ) THEN
      RAISE NOTICE 'Ajout de clinic_id à la table products...';
      
      ALTER TABLE products ADD COLUMN clinic_id UUID;
      CREATE INDEX idx_products_clinic_id ON products(clinic_id);
      
      -- Backfill: Assigner à la première clinique
      UPDATE products SET clinic_id = v_first_clinic_id WHERE clinic_id IS NULL;
      
      -- Ajouter la contrainte FK
      ALTER TABLE products 
      ADD CONSTRAINT fk_products_clinic_id 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
      
      -- Rendre NOT NULL après backfill
      ALTER TABLE products ALTER COLUMN clinic_id SET NOT NULL;
      
      -- Modifier l'unique constraint sur code pour inclure clinic_id
      -- Supprimer l'ancienne contrainte si elle existe
      IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_code_key'
      ) THEN
        ALTER TABLE products DROP CONSTRAINT products_code_key;
      END IF;
      
      -- Créer la nouvelle contrainte unique sur (code, clinic_id)
      CREATE UNIQUE INDEX products_code_clinic_id_unique 
      ON products(code, clinic_id) 
      WHERE code IS NOT NULL;
      
      RAISE NOTICE '✅ clinic_id ajouté à products';
    ELSE
      RAISE NOTICE '⚠️ clinic_id existe déjà dans products';
    END IF;
  END IF;

  -- ============================================
  -- ASSURANCES
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assurances') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'assurances' 
      AND column_name = 'clinic_id'
    ) THEN
      RAISE NOTICE 'Ajout de clinic_id à la table assurances...';
      
      ALTER TABLE assurances ADD COLUMN clinic_id UUID;
      CREATE INDEX idx_assurances_clinic_id ON assurances(clinic_id);
      
      -- Backfill: Depuis les patients
      UPDATE assurances a
      SET clinic_id = (
        SELECT DISTINCT p.clinic_id 
        FROM patients p 
        WHERE p.assurance_id = a.id 
        LIMIT 1
      )
      WHERE clinic_id IS NULL;
      
      -- Assigner à la première clinique si pas de patient associé
      UPDATE assurances SET clinic_id = v_first_clinic_id WHERE clinic_id IS NULL;
      
      -- Ajouter la contrainte FK
      ALTER TABLE assurances 
      ADD CONSTRAINT fk_assurances_clinic_id 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
      
      -- Rendre NOT NULL après backfill
      ALTER TABLE assurances ALTER COLUMN clinic_id SET NOT NULL;
      
      -- Modifier l'unique constraint sur numero_police
      IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'assurances_numero_police_key'
      ) THEN
        ALTER TABLE assurances DROP CONSTRAINT assurances_numero_police_key;
      END IF;
      
      -- Créer la nouvelle contrainte unique sur (numero_police, clinic_id)
      CREATE UNIQUE INDEX assurances_numero_police_clinic_id_unique 
      ON assurances(numero_police, clinic_id);
      
      RAISE NOTICE '✅ clinic_id ajouté à assurances';
    ELSE
      RAISE NOTICE '⚠️ clinic_id existe déjà dans assurances';
    END IF;
  END IF;

  -- ============================================
  -- PAIEMENTS
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'paiements') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'paiements' 
      AND column_name = 'clinic_id'
    ) THEN
      RAISE NOTICE 'Ajout de clinic_id à la table paiements...';
      
      ALTER TABLE paiements ADD COLUMN clinic_id UUID;
      CREATE INDEX idx_paiements_clinic_id ON paiements(clinic_id);
      
      -- Backfill: Depuis les factures
      UPDATE paiements p
      SET clinic_id = f.clinic_id
      FROM factures f
      WHERE p.facture_id = f.id AND p.clinic_id IS NULL;
      
      -- Assigner à la première clinique si pas de facture associée
      UPDATE paiements SET clinic_id = v_first_clinic_id WHERE clinic_id IS NULL;
      
      -- Ajouter la contrainte FK
      ALTER TABLE paiements 
      ADD CONSTRAINT fk_paiements_clinic_id 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
      
      -- Rendre NOT NULL après backfill
      ALTER TABLE paiements ALTER COLUMN clinic_id SET NOT NULL;
      
      RAISE NOTICE '✅ clinic_id ajouté à paiements';
    ELSE
      RAISE NOTICE '⚠️ clinic_id existe déjà dans paiements';
    END IF;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION MULTI-TENANCY TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT:';
  RAISE NOTICE '1. Vérifiez que les données ont été correctement assignées';
  RAISE NOTICE '2. Mettez à jour le schéma Prisma pour refléter ces changements';
  RAISE NOTICE '3. Exécutez: npx prisma migrate dev';
  RAISE NOTICE '4. Exécutez: npx prisma generate';
  RAISE NOTICE '5. Mettez à jour tous les services pour utiliser clinic_id';
  RAISE NOTICE '';

END $$;
