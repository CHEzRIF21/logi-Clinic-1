-- ============================================
-- CORRECTION DES FAILLES CRITIQUES D'ISOLATION MULTI-TENANT
-- Date: 29 Janvier 2026
-- Audit: MCP Test Sprite
-- ============================================

-- ============================================
-- 1. RENDEZ_VOUS - CRITIQUE
-- ============================================

ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rendez_vous_clinic_access" ON rendez_vous;
CREATE POLICY "rendez_vous_clinic_access" ON rendez_vous
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);

-- ============================================
-- 2. LAB_ANALYSES - CRITIQUE (via lab_prelevements → lab_prescriptions → consultations)
-- ============================================

ALTER TABLE lab_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_analyses_clinic_access" ON lab_analyses;
CREATE POLICY "lab_analyses_clinic_access" ON lab_analyses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_prelevements lpr
    JOIN lab_prescriptions lp ON lp.id = lpr.prescription_id
    JOIN consultations c ON c.id = lp.consultation_id
    JOIN patients p ON p.id = c.patient_id
    WHERE lpr.id = lab_analyses.prelevement_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lab_prelevements lpr
    JOIN lab_prescriptions lp ON lp.id = lpr.prescription_id
    JOIN consultations c ON c.id = lp.consultation_id
    JOIN patients p ON p.id = c.patient_id
    WHERE lpr.id = lab_analyses.prelevement_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
);

-- ============================================
-- 3. LAB_PRELEVEMENTS - CRITIQUE (via lab_prescriptions → consultations)
-- ============================================

ALTER TABLE lab_prelevements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_prelevements_clinic_access" ON lab_prelevements;
CREATE POLICY "lab_prelevements_clinic_access" ON lab_prelevements
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_prescriptions lp
    JOIN consultations c ON c.id = lp.consultation_id
    JOIN patients p ON p.id = c.patient_id
    WHERE lp.id = lab_prelevements.prescription_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lab_prescriptions lp
    JOIN consultations c ON c.id = lp.consultation_id
    JOIN patients p ON p.id = c.patient_id
    WHERE lp.id = lab_prelevements.prescription_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
);

-- ============================================
-- 4. LAB_PRESCRIPTIONS - CRITIQUE (via consultations)
-- ============================================

ALTER TABLE lab_prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_prescriptions_clinic_access" ON lab_prescriptions;
CREATE POLICY "lab_prescriptions_clinic_access" ON lab_prescriptions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM consultations c
    JOIN patients p ON p.id = c.patient_id
    WHERE c.id = lab_prescriptions.consultation_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM consultations c
    JOIN patients p ON p.id = c.patient_id
    WHERE c.id = lab_prescriptions.consultation_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
);

-- ============================================
-- 5. LAB_RAPPORTS - CRITIQUE (via lab_prelevements → lab_prescriptions → consultations)
-- ============================================

ALTER TABLE lab_rapports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_rapports_clinic_access" ON lab_rapports;
CREATE POLICY "lab_rapports_clinic_access" ON lab_rapports
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_prelevements lpr
    JOIN lab_prescriptions lp ON lp.id = lpr.prescription_id
    JOIN consultations c ON c.id = lp.consultation_id
    JOIN patients p ON p.id = c.patient_id
    WHERE lpr.id = lab_rapports.prelevement_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lab_prelevements lpr
    JOIN lab_prescriptions lp ON lp.id = lpr.prescription_id
    JOIN consultations c ON c.id = lp.consultation_id
    JOIN patients p ON p.id = c.patient_id
    WHERE lpr.id = lab_rapports.prelevement_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
);

-- ============================================
-- 6. LAB_PRESCRIPTIONS_ANALYSES - CRITIQUE (via lab_prescriptions)
-- ============================================

ALTER TABLE lab_prescriptions_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_prescriptions_analyses_clinic_access" ON lab_prescriptions_analyses;
CREATE POLICY "lab_prescriptions_analyses_clinic_access" ON lab_prescriptions_analyses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_prescriptions lp
    JOIN consultations c ON c.id = lp.consultation_id
    JOIN patients p ON p.id = c.patient_id
    WHERE lp.id = lab_prescriptions_analyses.prescription_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lab_prescriptions lp
    JOIN consultations c ON c.id = lp.consultation_id
    JOIN patients p ON p.id = c.patient_id
    WHERE lp.id = lab_prescriptions_analyses.prescription_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
);

-- ============================================
-- 7. CLINIC_PRICING - MAJEUR
-- ============================================

ALTER TABLE clinic_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_pricing_clinic_access" ON clinic_pricing;
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

-- ============================================
-- 8. CLINIC_PRICING_HISTORY - MAJEUR (via clinic_pricing)
-- ============================================

ALTER TABLE clinic_pricing_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_pricing_history_clinic_access" ON clinic_pricing_history;
CREATE POLICY "clinic_pricing_history_clinic_access" ON clinic_pricing_history
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clinic_pricing cp
    WHERE cp.id = clinic_pricing_history.clinic_pricing_id
    AND (cp.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clinic_pricing cp
    WHERE cp.id = clinic_pricing_history.clinic_pricing_id
    AND (cp.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
);

-- ============================================
-- 9. CREDITS_FACTURATION - MAJEUR
-- ============================================

ALTER TABLE credits_facturation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credits_facturation_clinic_access" ON credits_facturation;
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

-- ============================================
-- 10. TABLES POST-PARTUM - MAJEUR
-- ============================================

-- conseils_post_partum
ALTER TABLE conseils_post_partum ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conseils_post_partum_clinic_access" ON conseils_post_partum;
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

-- observation_post_partum
ALTER TABLE observation_post_partum ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "observation_post_partum_clinic_access" ON observation_post_partum;
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

-- patient_deparasitage
ALTER TABLE patient_deparasitage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patient_deparasitage_clinic_access" ON patient_deparasitage;
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

-- sortie_salle_naissance
ALTER TABLE sortie_salle_naissance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sortie_salle_naissance_clinic_access" ON sortie_salle_naissance;
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

-- surveillance_post_partum
ALTER TABLE surveillance_post_partum ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "surveillance_post_partum_clinic_access" ON surveillance_post_partum;
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

-- traitement_post_partum
ALTER TABLE traitement_post_partum ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "traitement_post_partum_clinic_access" ON traitement_post_partum;
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

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON POLICY "rendez_vous_clinic_access" ON rendez_vous IS 'Isolation multi-tenant: Accès aux rendez-vous uniquement pour la clinique de l''utilisateur';
COMMENT ON POLICY "lab_analyses_clinic_access" ON lab_analyses IS 'Isolation multi-tenant: Accès aux analyses via relations (prelevements → consultations → patients)';
COMMENT ON POLICY "lab_prelevements_clinic_access" ON lab_prelevements IS 'Isolation multi-tenant: Accès aux prélèvements via consultations';
COMMENT ON POLICY "lab_prescriptions_clinic_access" ON lab_prescriptions IS 'Isolation multi-tenant: Accès aux prescriptions lab via consultations';
COMMENT ON POLICY "lab_rapports_clinic_access" ON lab_rapports IS 'Isolation multi-tenant: Accès aux rapports via prélèvements';
COMMENT ON POLICY "clinic_pricing_clinic_access" ON clinic_pricing IS 'Isolation multi-tenant: Accès aux tarifs uniquement pour la clinique de l''utilisateur';
