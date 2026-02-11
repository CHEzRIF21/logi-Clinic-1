-- ============================================
-- Migration 98: Ajouter la colonne started_at à consultations
-- Objectif :
--   - Aligner le schéma avec les services frontend (patientHistoryService,
--     useDashboardData, impression de consultation) qui utilisent
--     consultations.started_at pour trier et afficher l'historique.
--   - Ne pas casser les données existantes : on recopie opened_at ou
--     created_at pour les lignes déjà présentes.
--
-- Notes :
--   - La table dispose déjà de opened_at / created_at.
--   - started_at sert de point d'entrée canonique pour la chronologie
--     côté UI, sans impact sur l'isolation par clinic_id.
-- ============================================

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Renseigner les lignes existantes
UPDATE public.consultations
SET started_at = COALESCE(opened_at, created_at, NOW())
WHERE started_at IS NULL;

-- Valeur par défaut pour les nouvelles consultations
ALTER TABLE public.consultations
  ALTER COLUMN started_at SET DEFAULT NOW();

