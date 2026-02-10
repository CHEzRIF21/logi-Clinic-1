-- ============================================
-- Migration 95: Ajouter la contrainte FK entre factures.consultation_id
-- et consultations.id pour permettre les jointures implicites
-- (select imbriqué Supabase: consultations(...)) utilisées
-- dans le module Caisse (PaiementsEnAttente, HistoriquePaiements).
--
-- Isolation:
--  - Les deux tables sont déjà isolées par clinic_id via RLS.
--  - La FK ne modifie pas les policies, elle garantit seulement
--    l'intégrité référentielle entre facture et consultation.
--
-- Idempotence:
--  - La contrainte n'est ajoutée que si elle n'existe pas déjà.
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'factures_consultation_id_fkey'
      AND conrelid = 'public.factures'::regclass
  ) THEN
    ALTER TABLE public.factures
      ADD CONSTRAINT factures_consultation_id_fkey
      FOREIGN KEY (consultation_id)
      REFERENCES public.consultations(id)
      ON DELETE SET NULL;
  END IF;
END $$;

