-- ============================================
-- CORRECTION RLS PERMISSIVES - PART2 STOCK
-- Tables: medicaments, lots, inventaires, inventaire_lignes, mouvements_stock, transferts, transfert_lignes, pertes_retours
-- ============================================

ALTER TABLE medicaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_medicaments_access" ON medicaments;
DROP POLICY IF EXISTS "medicaments_clinic_access" ON medicaments;
CREATE POLICY "medicaments_clinic_access" ON medicaments
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_lots_access" ON lots;
DROP POLICY IF EXISTS "lots_clinic_access" ON lots;
CREATE POLICY "lots_clinic_access" ON lots
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE inventaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_inventaires_policy" ON inventaires;
DROP POLICY IF EXISTS "inventaires_clinic_access" ON inventaires;
CREATE POLICY "inventaires_clinic_access" ON inventaires
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE inventaire_lignes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_inventaire_lignes_policy" ON inventaire_lignes;
DROP POLICY IF EXISTS "inventaire_lignes_clinic_access" ON inventaire_lignes;
CREATE POLICY "inventaire_lignes_clinic_access" ON inventaire_lignes
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_mouvements_stock_policy" ON mouvements_stock;
DROP POLICY IF EXISTS "mouvements_stock_clinic_access" ON mouvements_stock;
CREATE POLICY "mouvements_stock_clinic_access" ON mouvements_stock
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE transferts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_transferts_policy" ON transferts;
DROP POLICY IF EXISTS "transferts_clinic_access" ON transferts;
CREATE POLICY "transferts_clinic_access" ON transferts
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE transfert_lignes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_transfert_lignes_policy" ON transfert_lignes;
DROP POLICY IF EXISTS "transfert_lignes_clinic_access" ON transfert_lignes;
CREATE POLICY "transfert_lignes_clinic_access" ON transfert_lignes
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE pertes_retours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_pertes_retours_policy" ON pertes_retours;
DROP POLICY IF EXISTS "pertes_retours_clinic_access" ON pertes_retours;
CREATE POLICY "pertes_retours_clinic_access" ON pertes_retours
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_protocols_policy" ON protocols;
DROP POLICY IF EXISTS "protocols_clinic_access" ON protocols;
CREATE POLICY "protocols_clinic_access" ON protocols
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());
