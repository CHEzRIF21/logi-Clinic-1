-- ============================================
-- Migration 92: Corriger / ajouter clinic_id sur journal_caisse
-- Objectif : rattacher chaque ligne du journal de caisse à une clinique
-- pour garantir l'isolation stricte des données (multi-tenant).
-- La migration est idempotente et ne casse pas les données existantes.
-- ============================================

-- Ajout de la colonne si elle n'existe pas encore
ALTER TABLE public.journal_caisse
  ADD COLUMN IF NOT EXISTS clinic_id uuid;

COMMENT ON COLUMN public.journal_caisse.clinic_id IS
  'Référence vers la clinique propriétaire (isolation multi-tenant).';

