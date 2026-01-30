-- ============================================
-- CORRECTION RLS PERMISSIVES - PART3 IMAGING & LAB
-- Tables: imaging_requests, lab_requests, imagerie_*, lab_* (avec clinic_id)
-- ============================================

-- Imaging
ALTER TABLE imaging_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_imaging_requests_policy" ON imaging_requests;
DROP POLICY IF EXISTS "imaging_requests_clinic_access" ON imaging_requests;
CREATE POLICY "imaging_requests_clinic_access" ON imaging_requests
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE imagerie_annotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "imagerie_annotations_select_policy" ON imagerie_annotations;
DROP POLICY IF EXISTS "imagerie_annotations_clinic_access" ON imagerie_annotations;
CREATE POLICY "imagerie_annotations_clinic_access" ON imagerie_annotations
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE imagerie_examens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "imagerie_examens_select_policy" ON imagerie_examens;
DROP POLICY IF EXISTS "imagerie_examens_clinic_access" ON imagerie_examens;
CREATE POLICY "imagerie_examens_clinic_access" ON imagerie_examens
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE imagerie_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "imagerie_images_select_policy" ON imagerie_images;
DROP POLICY IF EXISTS "imagerie_images_clinic_access" ON imagerie_images;
CREATE POLICY "imagerie_images_clinic_access" ON imagerie_images
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE imagerie_rapports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "imagerie_rapports_select_policy" ON imagerie_rapports;
DROP POLICY IF EXISTS "imagerie_rapports_clinic_access" ON imagerie_rapports;
CREATE POLICY "imagerie_rapports_clinic_access" ON imagerie_rapports
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

-- Lab
ALTER TABLE lab_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unified_lab_requests_policy" ON lab_requests;
DROP POLICY IF EXISTS "lab_requests_clinic_access" ON lab_requests;
CREATE POLICY "lab_requests_clinic_access" ON lab_requests
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE lab_alertes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_alertes_select" ON lab_alertes;
DROP POLICY IF EXISTS "lab_alertes_clinic_access" ON lab_alertes;
CREATE POLICY "lab_alertes_clinic_access" ON lab_alertes
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE lab_consommations_reactifs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_consommations_reactifs_select" ON lab_consommations_reactifs;
DROP POLICY IF EXISTS "lab_consommations_reactifs_clinic_access" ON lab_consommations_reactifs;
CREATE POLICY "lab_consommations_reactifs_clinic_access" ON lab_consommations_reactifs
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE lab_modeles_examens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_modeles_examens_select" ON lab_modeles_examens;
DROP POLICY IF EXISTS "lab_modeles_examens_clinic_access" ON lab_modeles_examens;
CREATE POLICY "lab_modeles_examens_clinic_access" ON lab_modeles_examens
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE lab_stocks_reactifs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_stocks_reactifs_select" ON lab_stocks_reactifs;
DROP POLICY IF EXISTS "lab_stocks_reactifs_clinic_access" ON lab_stocks_reactifs;
CREATE POLICY "lab_stocks_reactifs_clinic_access" ON lab_stocks_reactifs
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());

ALTER TABLE lab_valeurs_reference ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_valeurs_reference_select" ON lab_valeurs_reference;
DROP POLICY IF EXISTS "lab_valeurs_reference_clinic_access" ON lab_valeurs_reference;
CREATE POLICY "lab_valeurs_reference_clinic_access" ON lab_valeurs_reference
FOR ALL TO authenticated
USING (clinic_id = public.get_my_clinic_id())
WITH CHECK (clinic_id = public.get_my_clinic_id());
