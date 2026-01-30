-- ============================================
-- CORRECTION RLS PERMISSIVES - PART4 MISC
-- Tables: alertes_stock, audit_log, patient_care_timeline, patient_files, stock_audit_log
-- Catalogues partagés (hybride): exam_catalog, motifs, services_facturables, consultation_templates, diagnostics
-- Consultation/maternité: consultation_prenatale, consultation_roles, consultation_steps, dossier_obstetrical
-- ============================================

-- --- Tables métier strict ---
ALTER TABLE alertes_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_alertes_stock_policy" ON alertes_stock;
DROP POLICY IF EXISTS "alertes_stock_clinic_access" ON alertes_stock;
CREATE POLICY "alertes_stock_clinic_access" ON alertes_stock
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_audit_log_access" ON audit_log;
DROP POLICY IF EXISTS "audit_log_clinic_access" ON audit_log;
CREATE POLICY "audit_log_clinic_access" ON audit_log
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE patient_care_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_patient_care_timeline_policy" ON patient_care_timeline;
DROP POLICY IF EXISTS "patient_care_timeline_clinic_access" ON patient_care_timeline;
CREATE POLICY "patient_care_timeline_clinic_access" ON patient_care_timeline
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_patient_files_policy" ON patient_files;
DROP POLICY IF EXISTS "patient_files_clinic_access" ON patient_files;
CREATE POLICY "patient_files_clinic_access" ON patient_files
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE stock_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_stock_audit_log_policy" ON stock_audit_log;
DROP POLICY IF EXISTS "stock_audit_log_clinic_access" ON stock_audit_log;
CREATE POLICY "stock_audit_log_clinic_access" ON stock_audit_log
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- --- Catalogues partagés (lecture: clinic_id = mine OR clinic_id IS NULL; écriture: clinic_id = mine) ---
ALTER TABLE exam_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_exam_catalog_policy" ON exam_catalog;
DROP POLICY IF EXISTS "exam_catalog_clinic_access" ON exam_catalog;
CREATE POLICY "exam_catalog_clinic_access" ON exam_catalog
FOR ALL TO authenticated
USING ((clinic_id = public.get_my_clinic_id()) OR (clinic_id IS NULL))
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE motifs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_motifs_policy" ON motifs;
DROP POLICY IF EXISTS "motifs_clinic_access" ON motifs;
CREATE POLICY "motifs_clinic_access" ON motifs
FOR ALL TO authenticated
USING ((clinic_id = public.get_my_clinic_id()) OR (clinic_id IS NULL))
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE services_facturables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_services_facturables_policy" ON services_facturables;
DROP POLICY IF EXISTS "services_facturables_clinic_access" ON services_facturables;
CREATE POLICY "services_facturables_clinic_access" ON services_facturables
FOR ALL TO authenticated
USING ((clinic_id = public.get_my_clinic_id()) OR (clinic_id IS NULL))
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE consultation_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_consultation_templates_policy" ON consultation_templates;
DROP POLICY IF EXISTS "consultation_templates_clinic_access" ON consultation_templates;
CREATE POLICY "consultation_templates_clinic_access" ON consultation_templates
FOR ALL TO authenticated
USING ((clinic_id = public.get_my_clinic_id()) OR (clinic_id IS NULL))
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_diagnostics_policy" ON diagnostics;
DROP POLICY IF EXISTS "diagnostics_clinic_access" ON diagnostics;
CREATE POLICY "diagnostics_clinic_access" ON diagnostics
FOR ALL TO authenticated
USING ((clinic_id = public.get_my_clinic_id()) OR (clinic_id IS NULL))
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- --- Consultation / maternité (consultation_roles, consultation_steps ont clinic_id) ---
ALTER TABLE consultation_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consultation_roles_read" ON consultation_roles;
DROP POLICY IF EXISTS "consultation_roles_clinic_access" ON consultation_roles;
CREATE POLICY "consultation_roles_clinic_access" ON consultation_roles
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE consultation_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consultation_steps_read" ON consultation_steps;
DROP POLICY IF EXISTS "consultation_steps_clinic_access" ON consultation_steps;
CREATE POLICY "consultation_steps_clinic_access" ON consultation_steps
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- --- dossier_obstetrical et consultation_prenatale (sans clinic_id, via patient) ---
ALTER TABLE dossier_obstetrical ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dossier_obstetrical_select_authenticated" ON dossier_obstetrical;
DROP POLICY IF EXISTS "dossier_obstetrical_clinic_access" ON dossier_obstetrical;
CREATE POLICY "dossier_obstetrical_clinic_access" ON dossier_obstetrical
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM patients p WHERE p.id = dossier_obstetrical.patient_id AND p.clinic_id = public.get_my_clinic_id())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM patients p WHERE p.id = dossier_obstetrical.patient_id AND p.clinic_id = public.get_my_clinic_id())
);

ALTER TABLE consultation_prenatale ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consultation_prenatale_select_authenticated" ON consultation_prenatale;
DROP POLICY IF EXISTS "consultation_prenatale_clinic_access" ON consultation_prenatale;
CREATE POLICY "consultation_prenatale_clinic_access" ON consultation_prenatale
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dossier_obstetrical d
    JOIN patients p ON p.id = d.patient_id
    WHERE d.id = consultation_prenatale.dossier_obstetrical_id AND p.clinic_id = public.get_my_clinic_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dossier_obstetrical d
    JOIN patients p ON p.id = d.patient_id
    WHERE d.id = consultation_prenatale.dossier_obstetrical_id AND p.clinic_id = public.get_my_clinic_id()
  )
);
