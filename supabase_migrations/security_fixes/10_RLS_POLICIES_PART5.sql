-- ============================================
-- LOT 10: Correction des politiques RLS permissives - PARTIE 5
-- Tables pharmacie et stock
-- Exécuter ce fichier via Supabase Dashboard > SQL Editor
-- ============================================

-- 1. medicaments
DROP POLICY IF EXISTS "medicaments_anon_all" ON medicaments;
CREATE POLICY "medicaments_clinic_access" ON medicaments
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 2. lots
DROP POLICY IF EXISTS "lots_anon_all" ON lots;
CREATE POLICY "lots_clinic_access" ON lots
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 3. mouvements_stock
DROP POLICY IF EXISTS "mouvements_stock_anon_all" ON mouvements_stock;
CREATE POLICY "mouvements_stock_clinic_access" ON mouvements_stock
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 4. prescriptions
DROP POLICY IF EXISTS "prescriptions_anon_all" ON prescriptions;
CREATE POLICY "prescriptions_clinic_access" ON prescriptions
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 5. prescription_lines
DROP POLICY IF EXISTS "prescription_lines_anon_all" ON prescription_lines;
CREATE POLICY "prescription_lines_clinic_access" ON prescription_lines
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 6. dispensations
DROP POLICY IF EXISTS "dispensations_anon_all" ON dispensations;
CREATE POLICY "dispensations_clinic_access" ON dispensations
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 7. dispensation_lignes
DROP POLICY IF EXISTS "dispensation_lignes_anon_all" ON dispensation_lignes;
CREATE POLICY "dispensation_lignes_clinic_access" ON dispensation_lignes
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 8. dispensation_audit
DROP POLICY IF EXISTS "dispensation_audit_anon_all" ON dispensation_audit;
CREATE POLICY "dispensation_audit_clinic_access" ON dispensation_audit
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 9. fournisseurs
DROP POLICY IF EXISTS "fournisseurs_anon_all" ON fournisseurs;
DROP POLICY IF EXISTS "fournisseurs_authenticated_all" ON fournisseurs;
CREATE POLICY "fournisseurs_clinic_access" ON fournisseurs
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 10. commandes_fournisseur
DROP POLICY IF EXISTS "commandes_fournisseur_anon_all" ON commandes_fournisseur;
DROP POLICY IF EXISTS "commandes_fournisseur_authenticated_all" ON commandes_fournisseur;
CREATE POLICY "commandes_fournisseur_clinic_access" ON commandes_fournisseur
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 11. commandes_fournisseur_lignes
DROP POLICY IF EXISTS "commandes_fournisseur_lignes_anon_all" ON commandes_fournisseur_lignes;
DROP POLICY IF EXISTS "commandes_fournisseur_lignes_authenticated_all" ON commandes_fournisseur_lignes;
CREATE POLICY "commandes_fournisseur_lignes_clinic_access" ON commandes_fournisseur_lignes
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 12. inventaires
DROP POLICY IF EXISTS "inventaires_anon_all" ON inventaires;
CREATE POLICY "inventaires_clinic_access" ON inventaires
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 13. inventaire_lignes
DROP POLICY IF EXISTS "inventaire_lignes_anon_all" ON inventaire_lignes;
CREATE POLICY "inventaire_lignes_clinic_access" ON inventaire_lignes
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 14. pertes_retours
DROP POLICY IF EXISTS "pertes_retours_anon_all" ON pertes_retours;
CREATE POLICY "pertes_retours_clinic_access" ON pertes_retours
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 15. transferts
DROP POLICY IF EXISTS "transferts_anon_all" ON transferts;
CREATE POLICY "transferts_clinic_access" ON transferts
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 16. transfert_lignes
DROP POLICY IF EXISTS "transfert_lignes_anon_all" ON transfert_lignes;
CREATE POLICY "transfert_lignes_clinic_access" ON transfert_lignes
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- 17. stock_audit_log
DROP POLICY IF EXISTS "stock_audit_log_anon_all" ON stock_audit_log;
CREATE POLICY "stock_audit_log_clinic_access" ON stock_audit_log
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

SELECT 'LOT 10 TERMINÉ: 17 politiques RLS pharmacie/stock corrigées' as status;
