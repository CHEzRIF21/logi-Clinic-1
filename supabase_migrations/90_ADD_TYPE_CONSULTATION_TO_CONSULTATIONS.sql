-- ============================================
-- Migration 90: Ajouter la colonne "type_consultation" aux consultations
-- Objectif : préciser la nature de la consultation (nouvelle, contrôle, etc.)
-- tout en gardant la compatibilité avec l'isolation par clinic_id.
-- Migration idempotente : l''ajout échoue silencieusement si la colonne existe déjà.
-- ============================================

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS type_consultation varchar;

COMMENT ON COLUMN public.consultations.type_consultation IS
  'Nature de la consultation (ex: NOUVELLE, CONTROLE, SUIVI).';

