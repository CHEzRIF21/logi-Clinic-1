-- ============================================
-- Migration 97: Assouplir la RLS sur services_facturables
-- Objectif :
--   - Rendre visibles les actes \"généraux\" (clinic_id IS NULL) pour
--     toutes les cliniques, tout en conservant l'isolation stricte pour
--     les lignes spécifiques à une clinique.
--   - Éviter que le module de sélection d'actes à facturer n'affiche
--     aucune ligne alors que le catalogue global est rempli.
--
-- Règle :
--   - Lecture / écriture autorisée si :
--       clinic_id = get_current_user_clinic_id()
--       OR clinic_id IS NULL
--       OR check_is_super_admin()
--
-- Les actes avec clinic_id IS NULL sont donc des modèles globaux
-- partagés, non sensibles en termes de données patient.
-- ============================================

ALTER POLICY clinic_isolation_safe_services_facturables
ON public.services_facturables
USING (
  (clinic_id = get_current_user_clinic_id())
  OR (clinic_id IS NULL)
  OR check_is_super_admin()
)
WITH CHECK (
  (clinic_id = get_current_user_clinic_id())
  OR (clinic_id IS NULL)
  OR check_is_super_admin()
);

