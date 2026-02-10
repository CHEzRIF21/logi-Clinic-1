-- ============================================
-- Migration 88: Ajouter la colonne "type" aux consultations
-- Objectif : permettre de typer les consultations (urgence, suivi, etc.)
-- en restant compatible avec l'isolation multi-tenant par clinic_id.
-- Cette migration est écrite de façon idempotente pour éviter les erreurs
-- si la colonne existe déjà.
-- ============================================

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS type text;

COMMENT ON COLUMN public.consultations.type IS
  'Type de consultation (ex: URGENCE, SUIVI, CONTROLE, etc.).';

