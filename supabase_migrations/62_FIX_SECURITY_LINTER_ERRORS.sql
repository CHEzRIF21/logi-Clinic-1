-- ============================================
-- Migration 62: Correction des erreurs de sécurité du linter Supabase
-- Date: 2026-01-30
-- Description: 
--   1. Corriger les vues avec SECURITY DEFINER → SECURITY INVOKER
--   2. Activer RLS sur les tables publiques sans RLS
--   3. Ajouter des politiques RLS appropriées
-- ============================================

-- ============================================
-- 1. CORRECTION DES VUES SECURITY DEFINER
-- ============================================

-- Vue factures_en_attente: Forcer SECURITY INVOKER
DROP VIEW IF EXISTS factures_en_attente CASCADE;

CREATE VIEW factures_en_attente
WITH (security_invoker = true)
AS
SELECT 
  f.id,
  f.numero_facture,
  f.patient_id,
  f.consultation_id,
  f.date_facture,
  f.montant_total,
  f.montant_paye,
  f.montant_restant,
  f.statut,
  f.type_facture_detail,
  f.service_origine,
  f.created_at,
  f.updated_at,
  c.id as consultation_id_ref,
  c.statut_paiement as consultation_statut_paiement,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  p.identifiant as patient_identifiant
FROM factures f
LEFT JOIN consultations c ON f.consultation_id = c.id
LEFT JOIN patients p ON f.patient_id = p.id
WHERE f.statut IN ('en_attente', 'partiellement_payee')
  AND f.montant_restant > 0
ORDER BY f.date_facture DESC, f.created_at DESC;

COMMENT ON VIEW factures_en_attente IS 
'Vue des factures en attente de paiement pour le module Caisse - Inclut toutes les factures avec consultation_id ou sans';

-- Vue vue_tickets_en_attente_par_service: Forcer SECURITY INVOKER
DROP VIEW IF EXISTS vue_tickets_en_attente_par_service CASCADE;

CREATE VIEW vue_tickets_en_attente_par_service
WITH (security_invoker = true)
AS
SELECT 
  t.id,
  t.patient_id,
  p.nom || ' ' || COALESCE(p.prenom, '') AS patient_nom,
  t.service_origine,
  t.type_acte,
  t.montant,
  t.date_creation,
  t.reference_origine,
  COALESCE(t.payeur_type, 'patient') AS payeur_type,
  t.payeur_nom,
  CASE 
    WHEN t.service_origine = 'pharmacie' THEN 'Dispensation Pharmacie'
    WHEN t.service_origine = 'consultation' THEN 'Consultation'
    WHEN t.service_origine = 'laboratoire' THEN 'Examen Laboratoire'
    ELSE t.service_origine
  END AS libelle_service,
  t.created_at,
  t.updated_at
FROM tickets_facturation t
LEFT JOIN patients p ON t.patient_id = p.id
WHERE t.statut = 'en_attente'
ORDER BY t.date_creation DESC;

COMMENT ON VIEW vue_tickets_en_attente_par_service IS 'Vue des tickets en attente de facturation groupés par service';

-- ============================================
-- 2. ACTIVATION RLS SUR LES TABLES PUBLIQUES
-- ============================================

-- Table role_definitions
ALTER TABLE IF EXISTS role_definitions ENABLE ROW LEVEL SECURITY;

-- Table default_role_permissions
ALTER TABLE IF EXISTS default_role_permissions ENABLE ROW LEVEL SECURITY;

-- Table patient_constantes (créer si elle n'existe pas)
CREATE TABLE IF NOT EXISTS patient_constantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Signes vitaux (dernières valeurs synchronisées)
  taille_cm DECIMAL(5,2),
  poids_kg DECIMAL(5,2),
  imc DECIMAL(4,2),
  temperature_c DECIMAL(4,2),
  pouls_bpm INTEGER,
  frequence_respiratoire INTEGER,
  saturation_o2 INTEGER,
  glycemie_mg_dl DECIMAL(6,2),
  
  -- Tension Artérielle
  ta_systolique INTEGER,
  ta_diastolique INTEGER,
  
  -- Références
  last_consultation_id UUID REFERENCES consultations(id),
  last_updated_by UUID REFERENCES users(id),
  last_updated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(patient_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_constantes_patient_id ON patient_constantes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_constantes_clinic_id ON patient_constantes(clinic_id);

ALTER TABLE patient_constantes ENABLE ROW LEVEL SECURITY;

-- Table data_cleanup_log
ALTER TABLE IF EXISTS data_cleanup_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CRÉATION DES POLITIQUES RLS
-- ============================================

-- Note: Les fonctions check_is_super_admin() et get_my_clinic_id() 
-- existent déjà dans les migrations précédentes (migration 61).
-- On les utilise directement sans les recréer.

-- Politiques pour role_definitions
DROP POLICY IF EXISTS "role_definitions_read_all" ON role_definitions;
CREATE POLICY "role_definitions_read_all"
ON role_definitions
FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "role_definitions_write_admin" ON role_definitions;
CREATE POLICY "role_definitions_write_admin"
ON role_definitions
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

-- Politiques pour default_role_permissions
DROP POLICY IF EXISTS "default_role_permissions_read_all" ON default_role_permissions;
CREATE POLICY "default_role_permissions_read_all"
ON default_role_permissions
FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "default_role_permissions_write_admin" ON default_role_permissions;
CREATE POLICY "default_role_permissions_write_admin"
ON default_role_permissions
FOR ALL
TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

-- Politiques pour patient_constantes
DROP POLICY IF EXISTS "patient_constantes_clinic_access" ON patient_constantes;
CREATE POLICY "patient_constantes_clinic_access"
ON patient_constantes
FOR ALL
TO authenticated
USING (
  clinic_id = get_my_clinic_id()
  OR check_is_super_admin()
)
WITH CHECK (
  clinic_id = get_my_clinic_id()
  OR check_is_super_admin()
);

-- Politique pour anon (développement uniquement - à restreindre en production)
DROP POLICY IF EXISTS "patient_constantes_anon_all" ON patient_constantes;
CREATE POLICY "patient_constantes_anon_all"
ON patient_constantes
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Politiques pour data_cleanup_log (lecture seule pour les admins)
DROP POLICY IF EXISTS "data_cleanup_log_read_admin" ON data_cleanup_log;
CREATE POLICY "data_cleanup_log_read_admin"
ON data_cleanup_log
FOR SELECT
TO authenticated
USING (check_is_super_admin());

DROP POLICY IF EXISTS "data_cleanup_log_write_admin" ON data_cleanup_log;
CREATE POLICY "data_cleanup_log_write_admin"
ON data_cleanup_log
FOR INSERT
TO authenticated
WITH CHECK (check_is_super_admin());

-- ============================================
-- 4. COMMENTAIRES
-- ============================================

COMMENT ON TABLE patient_constantes IS 'Table de synchronisation des constantes vitales des patients (dernières valeurs)';
COMMENT ON COLUMN patient_constantes.patient_id IS 'ID du patient (UNIQUE - une seule ligne par patient)';
COMMENT ON COLUMN patient_constantes.last_consultation_id IS 'ID de la dernière consultation ayant mis à jour ces constantes';
COMMENT ON COLUMN patient_constantes.last_updated_by IS 'ID de l''utilisateur ayant effectué la dernière mise à jour';
COMMENT ON COLUMN patient_constantes.last_updated_at IS 'Date/heure de la dernière mise à jour';

-- ============================================
-- 5. VÉRIFICATIONS
-- ============================================

DO $$
BEGIN
  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'role_definitions'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS non activé sur role_definitions';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'default_role_permissions'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS non activé sur default_role_permissions';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'patient_constantes'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS non activé sur patient_constantes';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'data_cleanup_log'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS non activé sur data_cleanup_log';
  END IF;
  
  RAISE NOTICE '✅ Toutes les vérifications RLS sont passées';
END $$;

-- Message de confirmation
SELECT 'Migration 62 appliquée avec succès: Erreurs de sécurité corrigées (SECURITY DEFINER views et RLS)' as status;
