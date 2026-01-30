-- ============================================
-- LOT 6: Correction des politiques RLS permissives - PARTIE 1
-- Tables: accouchement à delivrance
-- Exécuter ce fichier via Supabase Dashboard > SQL Editor
-- ============================================

-- Helper: Fonction pour vérifier si une politique existe
CREATE OR REPLACE FUNCTION policy_exists(p_table TEXT, p_policy TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = p_table 
    AND policyname = p_policy
  );
END;
$$ LANGUAGE plpgsql;

-- 1. accouchement
DROP POLICY IF EXISTS "accouchement_all_authenticated" ON accouchement;
CREATE POLICY "accouchement_clinic_access" ON accouchement
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 2. carte_infantile
DROP POLICY IF EXISTS "carte_infantile_all_authenticated" ON carte_infantile;
CREATE POLICY "carte_infantile_clinic_access" ON carte_infantile
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 3. conseils_post_partum
DROP POLICY IF EXISTS "conseils_post_partum_all_authenticated" ON conseils_post_partum;
CREATE POLICY "conseils_post_partum_clinic_access" ON conseils_post_partum
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 4. consultation_prenatale
DROP POLICY IF EXISTS "consultation_prenatale_insert_authenticated" ON consultation_prenatale;
DROP POLICY IF EXISTS "consultation_prenatale_update_authenticated" ON consultation_prenatale;
CREATE POLICY "consultation_prenatale_clinic_access" ON consultation_prenatale
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 5. delivrance
DROP POLICY IF EXISTS "delivrance_all_authenticated" ON delivrance;
CREATE POLICY "delivrance_clinic_access" ON delivrance
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 6. dossier_obstetrical
DROP POLICY IF EXISTS "dossier_obstetrical_insert_authenticated" ON dossier_obstetrical;
DROP POLICY IF EXISTS "dossier_obstetrical_update_authenticated" ON dossier_obstetrical;
CREATE POLICY "dossier_obstetrical_clinic_access" ON dossier_obstetrical
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 7. grossesses_anterieures
DROP POLICY IF EXISTS "grossesses_anterieures_all_authenticated" ON grossesses_anterieures;
CREATE POLICY "grossesses_anterieures_clinic_access" ON grossesses_anterieures
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 8. nouveau_ne
DROP POLICY IF EXISTS "nouveau_ne_all_authenticated" ON nouveau_ne;
CREATE POLICY "nouveau_ne_clinic_access" ON nouveau_ne
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- Nettoyage de la fonction helper
DROP FUNCTION IF EXISTS policy_exists(TEXT, TEXT);

SELECT 'LOT 6 TERMINÉ: 8 politiques RLS maternité corrigées' as status;
