-- ============================================
-- MIGRATION 35: OPTIMISATION POLITIQUES RLS
-- ============================================
-- Cette migration optimise les politiques RLS en utilisant (select auth.uid())
-- au lieu de auth.uid() pour éviter la réévaluation pour chaque ligne
-- ============================================

-- Table: anamnese_templates
-- Optimiser la politique SELECT
DROP POLICY IF EXISTS "Users can view anamnese templates from their clinic" ON anamnese_templates;
CREATE POLICY "Users can view anamnese templates from their clinic"
ON anamnese_templates FOR SELECT
TO authenticated
USING (clinic_id = (SELECT clinic_id FROM users WHERE id = (select auth.uid())));

-- Optimiser la politique INSERT
DROP POLICY IF EXISTS "Users can create anamnese templates" ON anamnese_templates;
CREATE POLICY "Users can create anamnese templates"
ON anamnese_templates FOR INSERT
TO authenticated
WITH CHECK (clinic_id = (SELECT clinic_id FROM users WHERE id = (select auth.uid())));

-- Optimiser la politique UPDATE
DROP POLICY IF EXISTS "Users can update their anamnese templates" ON anamnese_templates;
CREATE POLICY "Users can update their anamnese templates"
ON anamnese_templates FOR UPDATE
TO authenticated
USING (clinic_id = (SELECT clinic_id FROM users WHERE id = (select auth.uid())))
WITH CHECK (clinic_id = (SELECT clinic_id FROM users WHERE id = (select auth.uid())));

-- Optimiser la politique DELETE
DROP POLICY IF EXISTS "Users can delete their anamnese templates" ON anamnese_templates;
CREATE POLICY "Users can delete their anamnese templates"
ON anamnese_templates FOR DELETE
TO authenticated
USING (clinic_id = (SELECT clinic_id FROM users WHERE id = (select auth.uid())));

-- Table: registration_requests
-- Optimiser la politique super_admin
DROP POLICY IF EXISTS "super_admin_all_registration_requests" ON registration_requests;
CREATE POLICY "super_admin_all_registration_requests"
ON registration_requests FOR ALL
TO authenticated
USING ((SELECT role FROM users WHERE id = (select auth.uid())) = 'SUPER_ADMIN')
WITH CHECK ((SELECT role FROM users WHERE id = (select auth.uid())) = 'SUPER_ADMIN');

-- Optimiser la politique clinic_admin
DROP POLICY IF EXISTS "clinic_admin_own_clinic_requests" ON registration_requests;
CREATE POLICY "clinic_admin_own_clinic_requests"
ON registration_requests FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE id = (select auth.uid())) = 'CLINIC_ADMIN'
  AND clinic_id = (SELECT clinic_id FROM users WHERE id = (select auth.uid()))
)
WITH CHECK (
  (SELECT role FROM users WHERE id = (select auth.uid())) = 'CLINIC_ADMIN'
  AND clinic_id = (SELECT clinic_id FROM users WHERE id = (select auth.uid()))
);

-- Table: users
-- Optimiser la politique UPDATE
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
CREATE POLICY "users_update_own_profile"
ON users FOR UPDATE
TO authenticated
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

-- Table: clinics
-- Optimiser la politique super_admin
DROP POLICY IF EXISTS "clinics_super_admin_all" ON clinics;
CREATE POLICY "clinics_super_admin_all"
ON clinics FOR ALL
TO authenticated
USING ((SELECT role FROM users WHERE id = (select auth.uid())) = 'SUPER_ADMIN')
WITH CHECK ((SELECT role FROM users WHERE id = (select auth.uid())) = 'SUPER_ADMIN');

COMMENT ON POLICY "Users can view anamnese templates from their clinic" ON anamnese_templates IS 'Optimisé: utilise (select auth.uid()) pour meilleure performance';
COMMENT ON POLICY "Users can create anamnese templates" ON anamnese_templates IS 'Optimisé: utilise (select auth.uid()) pour meilleure performance';
COMMENT ON POLICY "Users can update their anamnese templates" ON anamnese_templates IS 'Optimisé: utilise (select auth.uid()) pour meilleure performance';
COMMENT ON POLICY "Users can delete their anamnese templates" ON anamnese_templates IS 'Optimisé: utilise (select auth.uid()) pour meilleure performance';
COMMENT ON POLICY "super_admin_all_registration_requests" ON registration_requests IS 'Optimisé: utilise (select auth.uid()) pour meilleure performance';
COMMENT ON POLICY "clinic_admin_own_clinic_requests" ON registration_requests IS 'Optimisé: utilise (select auth.uid()) pour meilleure performance';
COMMENT ON POLICY "users_update_own_profile" ON users IS 'Optimisé: utilise (select auth.uid()) pour meilleure performance';
COMMENT ON POLICY "clinics_super_admin_all" ON clinics IS 'Optimisé: utilise (select auth.uid()) pour meilleure performance';

