-- ============================================
-- CORRECTION CRITIQUE : RLS Policy registration_requests
-- ============================================
-- Problème : La politique RLS contient "OR true" permettant à tous les utilisateurs
--           de voir toutes les demandes d'inscription, indépendamment de leur clinic_id
-- 
-- Solution : Supprimer "OR true" et forcer le filtrage strict par clinic_id
-- ============================================

-- Supprimer l'ancienne politique permissive
DROP POLICY IF EXISTS "registration_requests_select" ON registration_requests;

-- Créer une nouvelle politique stricte
CREATE POLICY "registration_requests_select" ON registration_requests
FOR SELECT TO authenticated
USING (
  clinic_id = public.get_my_clinic_id() 
  OR public.check_is_super_admin()
);

-- Commentaire explicatif
COMMENT ON POLICY "registration_requests_select" ON registration_requests IS 
'Politique RLS stricte : les utilisateurs ne peuvent voir que les demandes d''inscription de leur clinique. Les Super Admins peuvent voir toutes les demandes.';
