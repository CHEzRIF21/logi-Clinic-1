-- ============================================
-- Migration 105: Ajouter facture_id à prescriptions
-- ============================================
-- Lier prescriptions ↔ factures (pharmacie, paiement obligatoire avant délivrance)
-- Résout l'erreur "column prescriptions.facture_id does not exist"
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prescriptions' AND column_name = 'facture_id'
  ) THEN
    ALTER TABLE prescriptions
      ADD COLUMN facture_id UUID REFERENCES factures(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_prescriptions_facture_id ON prescriptions(facture_id);
