-- ============================================
-- Migration 99: Ajouter la colonne numero_prescription à prescriptions
-- Objectif :
--   - Aligner le schéma avec le frontend (WorkflowStep10Ordonnance,
--     Pharmacie, dispensation) qui lit prescriptions.numero_prescription.
--   - Ne pas casser les données existantes : la colonne est ajoutée
--     sans contrainte, les anciennes lignes restent avec NULL.
--   - Le libellé affiché côté UI utilise déjà un fallback sur l'id
--     si numero_prescription est nul.
--
-- NOTE :
--   Une évolution ultérieure pourra brancher cette colonne sur la
--   fonction public.generer_numero_prescription(UUID) via un trigger
--   BEFORE INSERT pour générer automatiquement un numéro du type
--   PRES-YYYY-000001 par clinique.
-- ============================================

ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS numero_prescription TEXT;

