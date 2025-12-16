-- Migration: Tiers-Payant / Assurances (Phase 3)
-- Date: 2025-12-16
-- Description: Ajout du modèle Assurances + Tiers-payant (part patient / part assurance)

-- =========================================================
-- 0) Fonction utilitaire updated_at (sécurisée)
-- =========================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================
-- 1) Table: assurances
-- =========================================================
CREATE TABLE IF NOT EXISTS assurances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(200) UNIQUE NOT NULL,
  -- Taux en pourcentage (0..100). Exemple: 80 = 80%
  taux_couverture_defaut NUMERIC(5,2) NOT NULL DEFAULT 0,
  -- Plafond en XOF/FCFA. NULL = pas de plafond
  plafond NUMERIC(12,2),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_assurances_updated_at'
  ) THEN
    CREATE TRIGGER update_assurances_updated_at
      BEFORE UPDATE ON assurances
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assurances_actif ON assurances(actif);

-- Données de base (compatibilité couverture_sante existante)
INSERT INTO assurances (nom, taux_couverture_defaut, plafond, actif) VALUES
  ('CNSS', 80, NULL, true),
  ('RAMU', 70, NULL, true),
  ('Mutuelle', 70, NULL, true),
  ('Gratuité', 100, NULL, true)
ON CONFLICT (nom) DO NOTHING;

-- =========================================================
-- 2) Table: patient_assurances (optionnelle mais utile)
-- =========================================================
CREATE TABLE IF NOT EXISTS patient_assurances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assurance_id UUID NOT NULL REFERENCES assurances(id) ON DELETE RESTRICT,
  numero_assure VARCHAR(100),
  taux_couverture_override NUMERIC(5,2),
  plafond_override NUMERIC(12,2),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_id, assurance_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_patient_assurances_updated_at'
  ) THEN
    CREATE TRIGGER update_patient_assurances_updated_at
      BEFORE UPDATE ON patient_assurances
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patient_assurances_patient ON patient_assurances(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_assurances_assurance ON patient_assurances(assurance_id);
CREATE INDEX IF NOT EXISTS idx_patient_assurances_actif ON patient_assurances(actif);

-- =========================================================
-- 3) Dispensations: champs tiers-payant
-- =========================================================
ALTER TABLE dispensations
  ADD COLUMN IF NOT EXISTS assurance_id UUID REFERENCES assurances(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS taux_couverture NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS montant_total NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS montant_assurance NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS montant_patient NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS reference_prise_en_charge VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_dispensations_assurance ON dispensations(assurance_id);

-- =========================================================
-- 4) Tickets de facturation: ajout du payeur (patient vs assurance)
-- =========================================================
ALTER TABLE tickets_facturation
  ADD COLUMN IF NOT EXISTS payeur_type VARCHAR(20) DEFAULT 'patient',
  ADD COLUMN IF NOT EXISTS payeur_id UUID,
  ADD COLUMN IF NOT EXISTS payeur_nom VARCHAR(200);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'tickets_facturation_payeur_type_check'
  ) THEN
    ALTER TABLE tickets_facturation
      ADD CONSTRAINT tickets_facturation_payeur_type_check
      CHECK (payeur_type IN ('patient', 'assurance'));
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Backfill: les anciens tickets sont pour le patient
UPDATE tickets_facturation
SET
  payeur_type = 'patient',
  payeur_id = patient_id
WHERE payeur_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_payeur_type ON tickets_facturation(payeur_type);
CREATE INDEX IF NOT EXISTS idx_tickets_payeur_id ON tickets_facturation(payeur_id);

SELECT 'Migration Tiers-Payant / Assurances appliquée avec succès' as status;

