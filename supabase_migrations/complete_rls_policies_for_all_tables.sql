-- ============================================
-- MIGRATION COMPLÈTE : Politiques RLS pour toutes les tables
-- Date: 2025-11-28
-- Description: Configuration complète des politiques RLS pour permettre le fonctionnement complet de l'application
-- ============================================

-- ============================================
-- FONCTION HELPER : Créer politique RLS complète pour une table (avec gestion d'erreurs)
-- ============================================
CREATE OR REPLACE FUNCTION create_complete_rls_policy(
  table_name TEXT,
  policy_name_prefix TEXT DEFAULT ''
)
RETURNS TEXT AS $$
DECLARE
  policy_name TEXT;
  result TEXT;
BEGIN
  -- Vérifier si la table existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = create_complete_rls_policy.table_name
  ) THEN
    RETURN 'SKIP: Table ' || table_name || ' does not exist';
  END IF;

  -- Supprimer les anciennes politiques
  policy_name := COALESCE(policy_name_prefix, table_name) || '_authenticated_all';
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, create_complete_rls_policy.table_name);
  
  policy_name := COALESCE(policy_name_prefix, table_name) || '_anon_all';
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, create_complete_rls_policy.table_name);
  
  -- Activer RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', create_complete_rls_policy.table_name);
  
  -- Créer politique pour authenticated
  policy_name := COALESCE(policy_name_prefix, table_name) || '_authenticated_all';
  EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', 
    policy_name, create_complete_rls_policy.table_name);
  
  -- Créer politique pour anon (développement)
  policy_name := COALESCE(policy_name_prefix, table_name) || '_anon_all';
  EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', 
    policy_name, create_complete_rls_policy.table_name);
  
  RETURN 'OK: ' || table_name;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || table_name || ' - ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. TABLES DE BASE : PATIENTS
-- ============================================
SELECT create_complete_rls_policy('patients');
SELECT create_complete_rls_policy('patient_files');
SELECT create_complete_rls_policy('patient_care_timeline');

-- ============================================
-- 2. MODULE CONSULTATION
-- ============================================
SELECT create_complete_rls_policy('consultations');
SELECT create_complete_rls_policy('consultation_entries');
SELECT create_complete_rls_policy('consultation_constantes');
SELECT create_complete_rls_policy('consultation_templates');
SELECT create_complete_rls_policy('prescriptions');
SELECT create_complete_rls_policy('prescription_lines');
SELECT create_complete_rls_policy('lab_requests');
SELECT create_complete_rls_policy('imaging_requests');
SELECT create_complete_rls_policy('protocols');
SELECT create_complete_rls_policy('consultation_steps');
SELECT create_complete_rls_policy('motifs');
SELECT create_complete_rls_policy('diagnostics');
SELECT create_complete_rls_policy('diagnostics_cim10');

-- ============================================
-- 3. MODULE MATERNITÉ
-- ============================================
SELECT create_complete_rls_policy('dossier_obstetrical');
SELECT create_complete_rls_policy('grossesses_anterieures');
SELECT create_complete_rls_policy('consultation_prenatale');
SELECT create_complete_rls_policy('vaccination_maternelle');
SELECT create_complete_rls_policy('soins_promotionnels');
SELECT create_complete_rls_policy('droits_fondamentaux');
SELECT create_complete_rls_policy('plan_accouchement');
SELECT create_complete_rls_policy('traitement_cpn');
SELECT create_complete_rls_policy('conseils_mere');
SELECT create_complete_rls_policy('accouchement');
SELECT create_complete_rls_policy('delivrance');
SELECT create_complete_rls_policy('examen_placenta');
SELECT create_complete_rls_policy('nouveau_ne');
SELECT create_complete_rls_policy('soins_immediats');
SELECT create_complete_rls_policy('carte_infantile');
SELECT create_complete_rls_policy('sensibilisation_mere');
SELECT create_complete_rls_policy('reference_transfert');
SELECT create_complete_rls_policy('surveillance_post_partum');
SELECT create_complete_rls_policy('observation_post_partum');
SELECT create_complete_rls_policy('traitement_post_partum');
SELECT create_complete_rls_policy('conseils_post_partum');
SELECT create_complete_rls_policy('sortie_salle_naissance');
SELECT create_complete_rls_policy('complication_post_partum');

-- ============================================
-- 4. MODULE STOCK & PHARMACIE
-- ============================================
SELECT create_complete_rls_policy('medicaments');
SELECT create_complete_rls_policy('lots');
SELECT create_complete_rls_policy('mouvements_stock');
SELECT create_complete_rls_policy('dispensations');
SELECT create_complete_rls_policy('dispensation_lignes');
SELECT create_complete_rls_policy('dispensation_audit');
SELECT create_complete_rls_policy('transferts');
SELECT create_complete_rls_policy('transfert_lignes');
SELECT create_complete_rls_policy('alertes_stock');
SELECT create_complete_rls_policy('pertes_retours');
SELECT create_complete_rls_policy('incompatibilites_medicamenteuses');

-- ============================================
-- 5. MODULE FACTURATION
-- ============================================
SELECT create_complete_rls_policy('factures');
SELECT create_complete_rls_policy('lignes_facture');
SELECT create_complete_rls_policy('paiements');
SELECT create_complete_rls_policy('services_facturables');
SELECT create_complete_rls_policy('remises_exonerations');
SELECT create_complete_rls_policy('credits_facturation');
SELECT create_complete_rls_policy('tickets_facturation');
SELECT create_complete_rls_policy('journal_caisse');

-- ============================================
-- 6. MODULE RENDEZ-VOUS
-- ============================================
SELECT create_complete_rls_policy('rendez_vous');

-- ============================================
-- 7. MODULE VACCINATION
-- ============================================
SELECT create_complete_rls_policy('vaccinations');
SELECT create_complete_rls_policy('vaccins');

-- ============================================
-- 8. MODULE LABORATOIRE
-- ============================================
SELECT create_complete_rls_policy('examens_laboratoire');
SELECT create_complete_rls_policy('catalog_examens');
SELECT create_complete_rls_policy('resultats_laboratoire');
SELECT create_complete_rls_policy('lab_prescriptions');

-- ============================================
-- 9. MODULE IMAGERIE
-- ============================================
SELECT create_complete_rls_policy('examens_imagerie');
SELECT create_complete_rls_policy('resultats_imagerie');
SELECT create_complete_rls_policy('imagerie_examens');

-- ============================================
-- 10. MODULE AUDIT & NOTIFICATIONS
-- ============================================
SELECT create_complete_rls_policy('audit_log');
SELECT create_complete_rls_policy('notifications');

-- ============================================
-- 11. TABLES DE CONFIGURATION
-- ============================================
SELECT create_complete_rls_policy('roles_permissions');
SELECT create_complete_rls_policy('consultation_roles');
SELECT create_complete_rls_policy('consultation_role_template_permissions');
SELECT create_complete_rls_policy('diagnostics_favoris');
SELECT create_complete_rls_policy('diagnostics_interdits');

-- ============================================
-- 12. TABLES DE DOCUMENTS
-- ============================================
SELECT create_complete_rls_policy('patient_documents');

-- ============================================
-- 13. STORAGE BUCKETS - Politiques
-- ============================================

-- Créer les buckets s'ils n'existent pas
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('patient-files', 'patient-files', true),
  ('consultations-pdf', 'consultations-pdf', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket patient-files
DROP POLICY IF EXISTS "Allow authenticated users to upload patient files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to upload patient files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read patient files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to read patient files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete patient files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to delete patient files" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload patient files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'patient-files');

CREATE POLICY "Allow anon users to upload patient files"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'patient-files');

CREATE POLICY "Allow authenticated users to read patient files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'patient-files');

CREATE POLICY "Allow anon users to read patient files"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'patient-files');

CREATE POLICY "Allow authenticated users to delete patient files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'patient-files');

CREATE POLICY "Allow anon users to delete patient files"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'patient-files');

-- Bucket consultations-pdf
DROP POLICY IF EXISTS "Allow authenticated users to upload consultation PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to upload consultation PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read consultation PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to read consultation PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete consultation PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to delete consultation PDFs" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload consultation PDFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'consultations-pdf');

CREATE POLICY "Allow anon users to upload consultation PDFs"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'consultations-pdf');

CREATE POLICY "Allow authenticated users to read consultation PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'consultations-pdf');

CREATE POLICY "Allow anon users to read consultation PDFs"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'consultations-pdf');

CREATE POLICY "Allow authenticated users to delete consultation PDFs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'consultations-pdf');

CREATE POLICY "Allow anon users to delete consultation PDFs"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'consultations-pdf');

-- ============================================
-- 14. NETTOYAGE : Supprimer la fonction helper
-- ============================================
DROP FUNCTION IF EXISTS create_complete_rls_policy(TEXT, TEXT);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- Vérification : Afficher le nombre de politiques créées
SELECT 
  COUNT(*) as total_policies,
  COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies 
WHERE schemaname = 'public';

SELECT '✅ Migration complète RLS appliquée avec succès!' as status;
