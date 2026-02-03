-- ============================================
-- MIGRATION 81: Corriger la récursion infinie RLS sur la table users
-- ============================================
-- Problème: Les policies sur users utilisent get_my_clinic_id() ou
-- check_is_super_admin() / check_is_clinic_admin(), qui lisent la table users.
-- Lors de l'évaluation RLS (ex: requête sur notification_recipients qui
-- référence users), Postgres entre en récursion infinie → 500 et
-- "infinite recursion detected in policy for relation 'users'".
--
-- Solution: Sur la table users uniquement, ne plus utiliser de fonction qui
-- lit users. Lecture = uniquement sa propre ligne (auth_user_id = auth.uid()).
-- Les accès "admin / même clinique" pour lister les users restent possibles
-- via des RPC SECURITY DEFINER (ex: get_users_by_clinic) si besoin.
-- ============================================

BEGIN;

-- 1. Supprimer les policies sur users qui provoquent la récursion
--    (elles appellent get_my_clinic_id, check_is_super_admin, check_is_clinic_admin
--     qui font un SELECT sur users)
DROP POLICY IF EXISTS "users_read_own_profile" ON public.users;
DROP POLICY IF EXISTS "super_admin_all_users" ON public.users;
DROP POLICY IF EXISTS "clinic_admin_manage_clinic_users" ON public.users;
DROP POLICY IF EXISTS "users_super_admin_all" ON public.users;
DROP POLICY IF EXISTS "users_clinic_admin_same_clinic" ON public.users;

-- 2. Réautoriser uniquement la lecture de sa propre ligne (sans appeler users)
CREATE POLICY "users_read_own_profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- 3. Conserver la mise à jour de son propre profil (déjà sans récursion)
--    Si la policy n'existe plus après les DROP, la recréer.
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
CREATE POLICY "users_update_own_profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- 4. Super admin: accès complet sans lire users dans la policy
--    On utilise auth.jwt() ->> 'role' si présent, sinon pas d'accès étendu ici.
--    Les super admins peuvent continuer à passer par des RPC ou par le service role.
--    (Optionnel: réactiver une policy "super_admin_all" si vous stockez role dans le JWT.)

COMMIT;
