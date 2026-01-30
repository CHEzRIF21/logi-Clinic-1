-- ============================================
-- LOT 7: Correction des politiques RLS permissives - PARTIE 2
-- Tables post-partum et autres maternité
-- Exécuter ce fichier via Supabase Dashboard > SQL Editor
-- ============================================

-- 1. observation_post_partum
DROP POLICY IF EXISTS "observation_post_partum_all_authenticated" ON observation_post_partum;
CREATE POLICY "observation_post_partum_clinic_access" ON observation_post_partum
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 2. soins_immediats
DROP POLICY IF EXISTS "soins_immediats_all_authenticated" ON soins_immediats;
CREATE POLICY "soins_immediats_clinic_access" ON soins_immediats
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 3. soins_promotionnels
DROP POLICY IF EXISTS "soins_promotionnels_all_authenticated" ON soins_promotionnels;
CREATE POLICY "soins_promotionnels_clinic_access" ON soins_promotionnels
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 4. sortie_salle_naissance
DROP POLICY IF EXISTS "sortie_salle_naissance_all_authenticated" ON sortie_salle_naissance;
CREATE POLICY "sortie_salle_naissance_clinic_access" ON sortie_salle_naissance
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 5. surveillance_post_partum
DROP POLICY IF EXISTS "surveillance_post_partum_all_authenticated" ON surveillance_post_partum;
CREATE POLICY "surveillance_post_partum_clinic_access" ON surveillance_post_partum
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 6. traitement_post_partum
DROP POLICY IF EXISTS "traitement_post_partum_all_authenticated" ON traitement_post_partum;
CREATE POLICY "traitement_post_partum_clinic_access" ON traitement_post_partum
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 7. vaccination_maternelle
DROP POLICY IF EXISTS "vaccination_maternelle_all_authenticated" ON vaccination_maternelle;
CREATE POLICY "vaccination_maternelle_clinic_access" ON vaccination_maternelle
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

SELECT 'LOT 7 TERMINÉ: 7 politiques RLS post-partum corrigées' as status;
