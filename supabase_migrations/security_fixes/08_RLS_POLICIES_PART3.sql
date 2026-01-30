-- ============================================
-- LOT 8: Correction des politiques RLS permissives - PARTIE 3
-- Tables facturation et paiements
-- Exécuter ce fichier via Supabase Dashboard > SQL Editor
-- ============================================

-- 1. alertes_stock - Supprimer accès anon
DROP POLICY IF EXISTS "alertes_stock_anon_all" ON alertes_stock;

-- 2. clinic_pricing - Supprimer accès anon, garder authenticated avec restriction
DROP POLICY IF EXISTS "clinic_pricing_anon_all" ON clinic_pricing;
DROP POLICY IF EXISTS "clinic_pricing_authenticated_all" ON clinic_pricing;
CREATE POLICY "clinic_pricing_clinic_access" ON clinic_pricing
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 3. clinic_pricing_history
DROP POLICY IF EXISTS "clinic_pricing_history_anon_all" ON clinic_pricing_history;
DROP POLICY IF EXISTS "clinic_pricing_history_authenticated_all" ON clinic_pricing_history;
CREATE POLICY "clinic_pricing_history_clinic_access" ON clinic_pricing_history
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 4. credits_facturation
DROP POLICY IF EXISTS "credits_facturation_anon_all" ON credits_facturation;
DROP POLICY IF EXISTS "credits_facturation_authenticated_all" ON credits_facturation;
CREATE POLICY "credits_facturation_clinic_access" ON credits_facturation
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 5. factures
DROP POLICY IF EXISTS "factures_anon_all" ON factures;
CREATE POLICY "factures_clinic_access" ON factures
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 6. lignes_facture
DROP POLICY IF EXISTS "lignes_facture_anon_all" ON lignes_facture;
CREATE POLICY "lignes_facture_clinic_access" ON lignes_facture
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 7. paiements
DROP POLICY IF EXISTS "paiements_anon_all" ON paiements;
CREATE POLICY "paiements_clinic_access" ON paiements
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 8. remises_exonerations
DROP POLICY IF EXISTS "remises_exonerations_anon_all" ON remises_exonerations;
DROP POLICY IF EXISTS "remises_exonerations_authenticated_all" ON remises_exonerations;
CREATE POLICY "remises_exonerations_clinic_access" ON remises_exonerations
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 9. journal_caisse
DROP POLICY IF EXISTS "journal_caisse_anon_all" ON journal_caisse;
CREATE POLICY "journal_caisse_clinic_access" ON journal_caisse
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 10. tickets_facturation
DROP POLICY IF EXISTS "tickets_facturation_anon_all" ON tickets_facturation;
CREATE POLICY "tickets_facturation_clinic_access" ON tickets_facturation
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 11. services_facturables
DROP POLICY IF EXISTS "services_facturables_anon_all" ON services_facturables;
CREATE POLICY "services_facturables_clinic_access" ON services_facturables
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

SELECT 'LOT 8 TERMINÉ: 11 politiques RLS facturation corrigées' as status;
