-- ============================================
-- LOT 9: Correction des politiques RLS permissives - PARTIE 4
-- Tables consultations et patients
-- Exécuter ce fichier via Supabase Dashboard > SQL Editor
-- ============================================

-- 1. consultations - Supprimer accès anon dangereux
DROP POLICY IF EXISTS "Consultations are deletable by anon users" ON consultations;
DROP POLICY IF EXISTS "Consultations are insertable by anon users" ON consultations;
DROP POLICY IF EXISTS "Consultations are updatable by anon users" ON consultations;
CREATE POLICY "consultations_clinic_access" ON consultations
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 2. consultation_constantes
DROP POLICY IF EXISTS "consultation_constantes_anon_all" ON consultation_constantes;
CREATE POLICY "consultation_constantes_clinic_access" ON consultation_constantes
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 3. consultation_entries
DROP POLICY IF EXISTS "consultation_entries_anon_all" ON consultation_entries;
CREATE POLICY "consultation_entries_clinic_access" ON consultation_entries
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 4. consultation_roles (table de configuration - lecture pour tous, écriture admin)
DROP POLICY IF EXISTS "consultation_roles_anon_all" ON consultation_roles;
DROP POLICY IF EXISTS "consultation_roles_authenticated_all" ON consultation_roles;
CREATE POLICY "consultation_roles_read" ON consultation_roles
FOR SELECT TO authenticated
USING (true);
CREATE POLICY "consultation_roles_write" ON consultation_roles
FOR INSERT TO authenticated
WITH CHECK (
  public.check_is_super_admin() OR public.check_is_clinic_admin()
);
CREATE POLICY "consultation_roles_update" ON consultation_roles
FOR UPDATE TO authenticated
USING (
  public.check_is_super_admin() OR public.check_is_clinic_admin()
);
CREATE POLICY "consultation_roles_delete" ON consultation_roles
FOR DELETE TO authenticated
USING (
  public.check_is_super_admin() OR public.check_is_clinic_admin()
);

-- 5. consultation_steps (table de configuration)
DROP POLICY IF EXISTS "Allow all for consultation_steps" ON consultation_steps;
CREATE POLICY "consultation_steps_read" ON consultation_steps
FOR SELECT TO authenticated
USING (true);
CREATE POLICY "consultation_steps_write" ON consultation_steps
FOR INSERT TO authenticated
WITH CHECK (
  public.check_is_super_admin() OR public.check_is_clinic_admin()
);
CREATE POLICY "consultation_steps_update" ON consultation_steps
FOR UPDATE TO authenticated
USING (
  public.check_is_super_admin() OR public.check_is_clinic_admin()
);
CREATE POLICY "consultation_steps_delete" ON consultation_steps
FOR DELETE TO authenticated
USING (
  public.check_is_super_admin() OR public.check_is_clinic_admin()
);

-- 6. patients
DROP POLICY IF EXISTS "Allow all operations for anon users" ON patients;
CREATE POLICY "patients_clinic_access" ON patients
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 7. patient_constantes
DROP POLICY IF EXISTS "patient_constantes_anon_all" ON patient_constantes;
CREATE POLICY "patient_constantes_clinic_access" ON patient_constantes
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 8. patient_deparasitage
DROP POLICY IF EXISTS "Allow all for patient_deparasitage" ON patient_deparasitage;
CREATE POLICY "patient_deparasitage_clinic_access" ON patient_deparasitage
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 9. patient_files
DROP POLICY IF EXISTS "Allow all operations for anon users" ON patient_files;
CREATE POLICY "patient_files_clinic_access" ON patient_files
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 10. patient_care_timeline
DROP POLICY IF EXISTS "Allow all operations for anon users" ON patient_care_timeline;
CREATE POLICY "patient_care_timeline_clinic_access" ON patient_care_timeline
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

SELECT 'LOT 9 TERMINÉ: 10 politiques RLS consultations/patients corrigées' as status;
