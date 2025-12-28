-- ============================================
-- MIGRATION COMPLÈTE : MULTI-TENANCY
-- VERSION: 15
-- ============================================
-- Ce script implémente le multi-tenancy complet :
-- 1. Ajoute la colonne is_demo à la table clinics
-- 2. Ajoute clinic_id à toutes les tables métier
-- 3. Active RLS sur toutes les tables avec politiques appropriées
-- ============================================

-- ============================================
-- ÉTAPE 1 : AJOUTER is_demo À LA TABLE CLINICS
-- ============================================

DO $$
BEGIN
  -- Ajouter is_demo si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics' 
    AND column_name = 'is_demo'
  ) THEN
    ALTER TABLE clinics ADD COLUMN is_demo BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne is_demo ajoutée à clinics';
  ELSE
    RAISE NOTICE '⚠️ Colonne is_demo existe déjà dans clinics';
  END IF;
END $$;

-- Marquer CLINIC001 comme clinique démo
UPDATE clinics SET is_demo = true WHERE code = 'CLINIC001';

-- ============================================
-- ÉTAPE 2 : FONCTION HELPER POUR AJOUTER clinic_id
-- ============================================

CREATE OR REPLACE FUNCTION add_clinic_id_to_table(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Vérifier si la colonne existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND information_schema.columns.table_name = add_clinic_id_to_table.table_name 
    AND column_name = 'clinic_id'
  ) THEN
    -- Ajouter la colonne
    EXECUTE format('ALTER TABLE %I ADD COLUMN clinic_id UUID', table_name);
    
    -- Ajouter l'index
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_clinic_id ON %I(clinic_id)', 
                   replace(table_name, '.', '_'), table_name);
    
    -- Ajouter la contrainte FK
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT fk_%s_clinic_id 
                    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE', 
                   table_name, replace(table_name, '.', '_'));
    
    RAISE NOTICE '✅ clinic_id ajouté à %', table_name;
  ELSE
    RAISE NOTICE '⚠️ clinic_id existe déjà dans %', table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ÉTAPE 3 : AJOUTER clinic_id À TOUTES LES TABLES MÉTIER
-- ============================================

DO $$
DECLARE
  tables_to_update TEXT[] := ARRAY[
    -- Patients
    'patients',
    'patient_files',
    'patient_care_timeline',
    'patient_assurances',
    
    -- Consultations
    'consultations',
    'consultation_entries',
    'consultation_constantes',
    'consultation_templates',
    'consultation_roles',
    'consultation_steps',
    'prescriptions',
    'prescription_lines',
    'protocols',
    'motifs',
    'diagnostics',
    'anamnese_templates',
    'diagnostic_codes',
    'patient_deparasitage',
    
    -- Laboratoire
    'lab_requests',
    'lab_prescriptions_analyses',
    'lab_resultats_consultation',
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
    
    -- Imagerie
    'imaging_requests',
    'imagerie_examens',
    'imagerie_images',
    'imagerie_annotations',
    'imagerie_rapports',
    
    -- Facturation
    'factures',
    'lignes_facture',
    'paiements',
    'remises_exonerations',
    'credits_facturation',
    'journal_caisse',
    'tickets_facturation',
    'services_facturables',
    
    -- Stock & Pharmacie
    'stock_audit_log',
    'fournisseurs',
    'commandes_fournisseur',
    'commandes_fournisseur_lignes',
    'dispensation_audit',
    
    -- Assurances
    'assurances',
    
    -- Maternité
    'surveillance_post_partum',
    'observation_post_partum',
    'traitement_post_partum',
    'conseils_post_partum',
    'sortie_salle_naissance',
    'complication_post_partum',
    
    -- Notifications & Alertes
    'notifications_hospitalisation',
    'commandes_achats',
    'alertes_epidemiques',
    'configurations_laboratoire',
    
    -- Paramètres consultations
    'consultation_template_fields',
    'consultation_template_motifs',
    'groupes_therapeutiques',
    'posologies_standard',
    'medicament_molecules',
    'incompatibilites_medicamenteuses',
    'examens_parametres',
    'diagnostics_cim10',
    'diagnostics_favoris',
    'diagnostics_interdits',
    'consultation_role_template_permissions',
    'consultation_integrations',
    'consultation_pdf_templates',
    'consultation_settings',
    
    -- Catalogues
    'exam_catalog',
    
    -- Audit
    'audit_log'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_to_update
  LOOP
    -- Vérifier si la table existe avant d'ajouter clinic_id
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = tbl
    ) THEN
      PERFORM add_clinic_id_to_table(tbl);
    ELSE
      RAISE NOTICE '⚠️ Table % n''existe pas, ignorée', tbl;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- ÉTAPE 4 : METTRE À JOUR LES DONNÉES EXISTANTES
-- ============================================
-- Assigner les données existantes à la clinique démo CLINIC001

DO $$
DECLARE
  demo_clinic_id UUID;
  tables_to_update TEXT[] := ARRAY[
    'patients', 'patient_files', 'patient_care_timeline', 'patient_assurances',
    'consultations', 'consultation_entries', 'consultation_constantes',
    'prescriptions', 'prescription_lines', 'protocols',
    'lab_requests', 'imaging_requests',
    'factures', 'lignes_facture', 'paiements', 'journal_caisse', 'tickets_facturation',
    'stock_audit_log', 'dispensation_audit',
    'audit_log'
  ];
  tbl TEXT;
BEGIN
  -- Récupérer l'ID de la clinique démo
  SELECT id INTO demo_clinic_id FROM clinics WHERE code = 'CLINIC001';
  
  IF demo_clinic_id IS NOT NULL THEN
    FOREACH tbl IN ARRAY tables_to_update
    LOOP
      -- Vérifier si la table existe et a clinic_id
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = tbl
        AND column_name = 'clinic_id'
      ) THEN
        -- Mettre à jour les lignes sans clinic_id
        EXECUTE format('UPDATE %I SET clinic_id = $1 WHERE clinic_id IS NULL', tbl) 
        USING demo_clinic_id;
        RAISE NOTICE '✅ Données de % assignées à CLINIC001', tbl;
      END IF;
    END LOOP;
  ELSE
    RAISE WARNING '⚠️ CLINIC001 non trouvée, les données existantes ne seront pas assignées';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 5 : CRÉER LES POLITIQUES RLS
-- ============================================

-- Fonction helper pour créer les politiques RLS standard
CREATE OR REPLACE FUNCTION create_standard_rls_policies(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Activer RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  
  -- Supprimer les anciennes politiques si elles existent
  EXECUTE format('DROP POLICY IF EXISTS "super_admin_all_%s" ON %I', 
                 replace(table_name, '.', '_'), table_name);
  EXECUTE format('DROP POLICY IF EXISTS "clinic_users_own_clinic_%s" ON %I', 
                 replace(table_name, '.', '_'), table_name);
  
  -- Politique pour Super Admin (accès total)
  EXECUTE format('
    CREATE POLICY "super_admin_all_%s" ON %I
    FOR ALL TO authenticated
    USING (check_is_super_admin())
    WITH CHECK (check_is_super_admin())',
    replace(table_name, '.', '_'), table_name);
  
  -- Politique pour les utilisateurs de la clinique
  EXECUTE format('
    CREATE POLICY "clinic_users_own_clinic_%s" ON %I
    FOR ALL TO authenticated
    USING (clinic_id = get_current_user_clinic_id())
    WITH CHECK (clinic_id = get_current_user_clinic_id())',
    replace(table_name, '.', '_'), table_name);
  
  RAISE NOTICE '✅ Politiques RLS créées pour %', table_name;
END;
$$ LANGUAGE plpgsql;

-- Appliquer RLS à toutes les tables métier principales
DO $$
DECLARE
  tables_with_rls TEXT[] := ARRAY[
    'patients',
    'patient_files',
    'patient_care_timeline',
    'consultations',
    'consultation_entries',
    'consultation_constantes',
    'prescriptions',
    'prescription_lines',
    'lab_requests',
    'imaging_requests',
    'factures',
    'lignes_facture',
    'paiements',
    'journal_caisse',
    'tickets_facturation',
    'stock_audit_log',
    'dispensation_audit',
    'audit_log'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_with_rls
  LOOP
    -- Vérifier si la table existe
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = tbl
    ) THEN
      PERFORM create_standard_rls_policies(tbl);
    ELSE
      RAISE NOTICE '⚠️ Table % n''existe pas pour RLS, ignorée', tbl;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- ÉTAPE 6 : POLITIQUES RLS SPÉCIALES
-- ============================================

-- Pour les tables de paramètres/configuration (lecture partagée, écriture par admin)
DO $$
DECLARE
  config_tables TEXT[] := ARRAY[
    'consultation_templates',
    'motifs',
    'diagnostics',
    'exam_catalog',
    'services_facturables',
    'groupes_therapeutiques',
    'posologies_standard',
    'medicament_molecules',
    'diagnostics_cim10'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY config_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = tbl
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = tbl
      AND column_name = 'clinic_id'
    ) THEN
      -- Activer RLS
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      
      -- Supprimer les anciennes politiques
      EXECUTE format('DROP POLICY IF EXISTS "super_admin_all_%s" ON %I', 
                     replace(tbl, '.', '_'), tbl);
      EXECUTE format('DROP POLICY IF EXISTS "clinic_read_%s" ON %I', 
                     replace(tbl, '.', '_'), tbl);
      EXECUTE format('DROP POLICY IF EXISTS "clinic_admin_write_%s" ON %I', 
                     replace(tbl, '.', '_'), tbl);
      
      -- Super Admin: accès total
      EXECUTE format('
        CREATE POLICY "super_admin_all_%s" ON %I
        FOR ALL TO authenticated
        USING (check_is_super_admin())',
        replace(tbl, '.', '_'), tbl);
      
      -- Lecture pour tous les utilisateurs de la clinique
      EXECUTE format('
        CREATE POLICY "clinic_read_%s" ON %I
        FOR SELECT TO authenticated
        USING (clinic_id = get_current_user_clinic_id() OR clinic_id IS NULL)',
        replace(tbl, '.', '_'), tbl);
      
      -- Écriture uniquement pour admin de la clinique
      EXECUTE format('
        CREATE POLICY "clinic_admin_write_%s" ON %I
        FOR INSERT TO authenticated
        WITH CHECK (
          clinic_id = get_current_user_clinic_id() 
          AND check_is_clinic_admin()
        )',
        replace(tbl, '.', '_'), tbl);
      
      EXECUTE format('
        CREATE POLICY "clinic_admin_update_%s" ON %I
        FOR UPDATE TO authenticated
        USING (clinic_id = get_current_user_clinic_id() AND check_is_clinic_admin())
        WITH CHECK (clinic_id = get_current_user_clinic_id() AND check_is_clinic_admin())',
        replace(tbl, '.', '_'), tbl);
      
      EXECUTE format('
        CREATE POLICY "clinic_admin_delete_%s" ON %I
        FOR DELETE TO authenticated
        USING (clinic_id = get_current_user_clinic_id() AND check_is_clinic_admin())',
        replace(tbl, '.', '_'), tbl);
      
      RAISE NOTICE '✅ Politiques RLS config créées pour %', tbl;
    ELSE
      RAISE NOTICE '⚠️ Table % ignorée pour RLS config', tbl;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- ÉTAPE 7 : FONCTION POUR VALIDER LE CODE CLINIQUE
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_clinic_code(p_clinic_code TEXT)
RETURNS TABLE(
  clinic_id UUID,
  clinic_name TEXT,
  is_valid BOOLEAN,
  is_demo BOOLEAN,
  is_active BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as clinic_id,
    c.name as clinic_name,
    true as is_valid,
    COALESCE(c.is_demo, false) as is_demo,
    c.active as is_active
  FROM clinics c
  WHERE c.code = UPPER(TRIM(p_clinic_code))
    AND c.active = true;
  
  -- Si aucun résultat, vérifier dans les codes temporaires
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      c.id as clinic_id,
      c.name as clinic_name,
      true as is_valid,
      COALESCE(c.is_demo, false) as is_demo,
      c.active as is_active
    FROM clinic_temporary_codes ctc
    JOIN clinics c ON c.id = ctc.clinic_id
    WHERE ctc.temporary_code = UPPER(TRIM(p_clinic_code))
      AND ctc.is_converted = false
      AND ctc.expires_at > NOW()
      AND c.active = true;
  END IF;
END;
$$;

-- ============================================
-- ÉTAPE 8 : VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  tables_count INTEGER;
  tables_with_clinic_id INTEGER;
  rls_policies_count INTEGER;
BEGIN
  -- Compter les tables métier
  SELECT COUNT(*) INTO tables_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
  
  -- Compter les tables avec clinic_id
  SELECT COUNT(DISTINCT table_name) INTO tables_with_clinic_id
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND column_name = 'clinic_id';
  
  -- Compter les politiques RLS
  SELECT COUNT(*) INTO rls_policies_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ MIGRATION MULTI-TENANCY TERMINÉE !';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   - Tables totales: %', tables_count;
  RAISE NOTICE '   - Tables avec clinic_id: %', tables_with_clinic_id;
  RAISE NOTICE '   - Politiques RLS: %', rls_policies_count;
  RAISE NOTICE '';
  RAISE NOTICE '👉 Vérifiez que is_demo = true pour CLINIC001';
  RAISE NOTICE '';
END $$;

-- Afficher les cliniques avec le nouveau flag is_demo
SELECT 
  code,
  name,
  active,
  is_demo,
  is_temporary_code,
  requires_code_change
FROM clinics
ORDER BY is_demo DESC, code;

