-- ============================================
-- Migration 89: Ajouter la colonne "service_consulte" aux consultations
-- Objectif : tracer le service clinique consulté (pédiatrie, maternité, etc.)
-- en respectant l'isolation des données par clinic_id.
-- Migration idempotente : aucune erreur si la colonne existe déjà.
-- ============================================

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS service_consulte varchar;

COMMENT ON COLUMN public.consultations.service_consulte IS
  'Service consulté (ex: PEDIATRIE, MEDECINE_GENERALE, MATERNITE, etc.).';

