-- ============================================
-- CORRECTION RLS PERMISSIVES - PART1 CORE
-- Plan: isolation stricte par clinic_id (sans exception Super Admin)
-- Tables: patients, consultations, prescriptions, factures, paiements, journal_caisse, etc.
-- ============================================

-- ----------------------------------------
-- PATIENTS
-- ----------------------------------------
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_patients_access" ON patients;
DROP POLICY IF EXISTS "patients_clinic_access" ON patients;
CREATE POLICY "patients_clinic_access" ON patients
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- CONSULTATIONS (supprimer anon + remplacer unified)
-- ----------------------------------------
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Consultations are viewable by anon users" ON consultations;
DROP POLICY IF EXISTS "unified_consultations_access" ON consultations;
DROP POLICY IF EXISTS "consultations_clinic_access" ON consultations;
CREATE POLICY "consultations_clinic_access" ON consultations
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- CONSULTATION_CONSTANTES
-- ----------------------------------------
ALTER TABLE consultation_constantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_consultation_constantes_policy" ON consultation_constantes;
DROP POLICY IF EXISTS "consultation_constantes_clinic_access" ON consultation_constantes;
CREATE POLICY "consultation_constantes_clinic_access" ON consultation_constantes
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- CONSULTATION_ENTRIES
-- ----------------------------------------
ALTER TABLE consultation_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_consultation_entries_policy" ON consultation_entries;
DROP POLICY IF EXISTS "consultation_entries_clinic_access" ON consultation_entries;
CREATE POLICY "consultation_entries_clinic_access" ON consultation_entries
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- PRESCRIPTIONS
-- ----------------------------------------
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_prescriptions_access" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_clinic_access" ON prescriptions;
CREATE POLICY "prescriptions_clinic_access" ON prescriptions
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- PRESCRIPTION_LINES
-- ----------------------------------------
ALTER TABLE prescription_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_prescription_lines_policy" ON prescription_lines;
DROP POLICY IF EXISTS "prescription_lines_clinic_access" ON prescription_lines;
CREATE POLICY "prescription_lines_clinic_access" ON prescription_lines
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- FACTURES
-- ----------------------------------------
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_factures_access" ON factures;
CREATE POLICY "factures_clinic_access" ON factures
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- LIGNES_FACTURE
-- ----------------------------------------
ALTER TABLE lignes_facture ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_lignes_facture_policy" ON lignes_facture;
DROP POLICY IF EXISTS "lignes_facture_clinic_access" ON lignes_facture;
CREATE POLICY "lignes_facture_clinic_access" ON lignes_facture
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- PAIEMENTS
-- ----------------------------------------
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_paiements_policy" ON paiements;
DROP POLICY IF EXISTS "paiements_clinic_access" ON paiements;
CREATE POLICY "paiements_clinic_access" ON paiements
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- JOURNAL_CAISSE
-- ----------------------------------------
ALTER TABLE journal_caisse ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_journal_caisse_policy" ON journal_caisse;
DROP POLICY IF EXISTS "journal_caisse_clinic_access" ON journal_caisse;
CREATE POLICY "journal_caisse_clinic_access" ON journal_caisse
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- DISPENSATIONS
-- ----------------------------------------
ALTER TABLE dispensations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_dispensations_access" ON dispensations;
DROP POLICY IF EXISTS "dispensations_clinic_access" ON dispensations;
CREATE POLICY "dispensations_clinic_access" ON dispensations
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- DISPENSATION_LIGNES
-- ----------------------------------------
ALTER TABLE dispensation_lignes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_dispensation_lignes_policy" ON dispensation_lignes;
DROP POLICY IF EXISTS "dispensation_lignes_clinic_access" ON dispensation_lignes;
CREATE POLICY "dispensation_lignes_clinic_access" ON dispensation_lignes
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- DISPENSATION_AUDIT
-- ----------------------------------------
ALTER TABLE dispensation_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_dispensation_audit_policy" ON dispensation_audit;
DROP POLICY IF EXISTS "dispensation_audit_clinic_access" ON dispensation_audit;
CREATE POLICY "dispensation_audit_clinic_access" ON dispensation_audit
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- ----------------------------------------
-- TICKETS_FACTURATION
-- ----------------------------------------
ALTER TABLE tickets_facturation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_tickets_facturation_access" ON tickets_facturation;
DROP POLICY IF EXISTS "tickets_facturation_clinic_access" ON tickets_facturation;
CREATE POLICY "tickets_facturation_clinic_access" ON tickets_facturation
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());
