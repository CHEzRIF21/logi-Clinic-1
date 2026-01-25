-- ============================================
-- MIGRATION : Lier prescriptions ↔ factures (pharmacie)
-- VERSION: 52
-- DATE: 2026-01-25
-- ============================================
-- Objectif :
-- - Permettre de bloquer la délivrance en pharmacie tant que la facture n'est pas payée
-- - Référencer la facture créée lors de l'ordonnance médicamenteuse
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'prescriptions'
      AND column_name = 'facture_id'
  ) THEN
    ALTER TABLE prescriptions
      ADD COLUMN facture_id UUID REFERENCES factures(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour les jointures et filtres rapides
CREATE INDEX IF NOT EXISTS idx_prescriptions_facture_id ON prescriptions(facture_id);

-- (Optionnel) Index composite utile côté pharmacie
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_statut ON prescriptions(clinic_id, statut);

