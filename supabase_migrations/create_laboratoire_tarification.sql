-- Migration: Ajout de la tarification au module Laboratoire
-- Date: 2025-01-XX
-- Description: Ajout des champs de tarification et des tables pour gérer les analyses avec leurs tarifs

-- 1. Ajout des champs de tarification aux prescriptions
DO $$ 
BEGIN
  -- Ajouter montant_total si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_prescriptions' AND column_name = 'montant_total'
  ) THEN
    ALTER TABLE lab_prescriptions 
    ADD COLUMN montant_total DECIMAL(12,2) DEFAULT 0;
  END IF;

  -- Ajouter statut_paiement si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_prescriptions' AND column_name = 'statut_paiement'
  ) THEN
    ALTER TABLE lab_prescriptions 
    ADD COLUMN statut_paiement VARCHAR(20) CHECK (statut_paiement IN ('non_paye','en_attente','paye','partiel')) DEFAULT 'non_paye';
  END IF;

  -- Ajouter facture_id si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_prescriptions' AND column_name = 'facture_id'
  ) THEN
    ALTER TABLE lab_prescriptions 
    ADD COLUMN facture_id UUID REFERENCES factures(id);
  END IF;

  -- Ajouter ticket_facturation_id si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_prescriptions' AND column_name = 'ticket_facturation_id'
  ) THEN
    ALTER TABLE lab_prescriptions 
    ADD COLUMN ticket_facturation_id UUID REFERENCES tickets_facturation(id);
  END IF;
END $$;

-- 2. Table pour stocker les analyses sélectionnées avec leurs tarifs
CREATE TABLE IF NOT EXISTS lab_prescriptions_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES lab_prescriptions(id) ON DELETE CASCADE,
  numero_analyse VARCHAR(10) NOT NULL, -- Numéro de l'analyse dans la fiche de tarification
  nom_analyse VARCHAR(200) NOT NULL,
  code_analyse VARCHAR(50), -- Code unique de l'analyse
  prix DECIMAL(12,2) NOT NULL, -- Prix en XOF
  tube_requis VARCHAR(100), -- Type de tube requis
  quantite INTEGER DEFAULT 1,
  montant_ligne DECIMAL(12,2) NOT NULL, -- prix * quantite
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prescription_id, code_analyse)
);

-- 3. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_lab_prescriptions_analyses_prescription ON lab_prescriptions_analyses(prescription_id);
CREATE INDEX IF NOT EXISTS idx_lab_prescriptions_analyses_code ON lab_prescriptions_analyses(code_analyse);
CREATE INDEX IF NOT EXISTS idx_lab_prescriptions_facture ON lab_prescriptions(facture_id);
CREATE INDEX IF NOT EXISTS idx_lab_prescriptions_ticket ON lab_prescriptions(ticket_facturation_id);
CREATE INDEX IF NOT EXISTS idx_lab_prescriptions_statut_paiement ON lab_prescriptions(statut_paiement);

-- 4. Trigger pour mettre à jour le montant_total de la prescription
CREATE OR REPLACE FUNCTION update_prescription_montant_total()
RETURNS TRIGGER AS $$
DECLARE
  total DECIMAL(12,2);
BEGIN
  -- Calculer le total des analyses
  SELECT COALESCE(SUM(montant_ligne), 0) INTO total
  FROM lab_prescriptions_analyses
  WHERE prescription_id = COALESCE(NEW.prescription_id, OLD.prescription_id);
  
  -- Mettre à jour la prescription
  UPDATE lab_prescriptions
  SET montant_total = total
  WHERE id = COALESCE(NEW.prescription_id, OLD.prescription_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour automatiquement le montant total
DROP TRIGGER IF EXISTS trigger_update_prescription_montant_insert ON lab_prescriptions_analyses;
CREATE TRIGGER trigger_update_prescription_montant_insert
  AFTER INSERT ON lab_prescriptions_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_prescription_montant_total();

DROP TRIGGER IF EXISTS trigger_update_prescription_montant_update ON lab_prescriptions_analyses;
CREATE TRIGGER trigger_update_prescription_montant_update
  AFTER UPDATE ON lab_prescriptions_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_prescription_montant_total();

DROP TRIGGER IF EXISTS trigger_update_prescription_montant_delete ON lab_prescriptions_analyses;
CREATE TRIGGER trigger_update_prescription_montant_delete
  AFTER DELETE ON lab_prescriptions_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_prescription_montant_total();

-- 5. Trigger pour mettre à jour updated_at
CREATE TRIGGER update_lab_prescriptions_analyses_updated_at 
  BEFORE UPDATE ON lab_prescriptions_analyses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Fonction pour créer automatiquement un ticket de facturation
CREATE OR REPLACE FUNCTION create_ticket_facturation_laboratoire()
RETURNS TRIGGER AS $$
DECLARE
  ticket_id UUID;
  patient_uuid UUID;
BEGIN
  -- Récupérer le patient_id de la prescription
  SELECT patient_id INTO patient_uuid
  FROM lab_prescriptions
  WHERE id = NEW.id;
  
  -- Créer un ticket de facturation si le montant > 0
  IF NEW.montant_total > 0 AND NEW.ticket_facturation_id IS NULL THEN
    INSERT INTO tickets_facturation (
      patient_id,
      service_origine,
      reference_origine,
      description,
      montant,
      statut,
      date_creation
    ) VALUES (
      patient_uuid,
      'laboratoire',
      NEW.id::TEXT,
      'Prescription laboratoire: ' || NEW.type_examen,
      NEW.montant_total,
      'en_attente',
      NOW()
    )
    RETURNING id INTO ticket_id;
    
    -- Mettre à jour la prescription avec le ticket_id
    UPDATE lab_prescriptions
    SET ticket_facturation_id = ticket_id
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement le ticket de facturation
DROP TRIGGER IF EXISTS trigger_create_ticket_facturation ON lab_prescriptions;
CREATE TRIGGER trigger_create_ticket_facturation
  AFTER INSERT OR UPDATE OF montant_total ON lab_prescriptions
  FOR EACH ROW
  WHEN (NEW.montant_total > 0)
  EXECUTE FUNCTION create_ticket_facturation_laboratoire();

-- 7. Vue pour les prescriptions avec détails de tarification
CREATE OR REPLACE VIEW v_lab_prescriptions_tarification AS
SELECT 
  p.id,
  p.patient_id,
  p.type_examen,
  p.montant_total,
  p.statut_paiement,
  p.facture_id,
  p.ticket_facturation_id,
  p.date_prescription,
  p.statut,
  COUNT(pa.id) as nombre_analyses,
  STRING_AGG(pa.nom_analyse, ', ' ORDER BY pa.numero_analyse) as analyses_liste
FROM lab_prescriptions p
LEFT JOIN lab_prescriptions_analyses pa ON p.id = pa.prescription_id
GROUP BY p.id, p.patient_id, p.type_examen, p.montant_total, p.statut_paiement, 
         p.facture_id, p.ticket_facturation_id, p.date_prescription, p.statut;

-- 8. Commentaires
COMMENT ON TABLE lab_prescriptions_analyses IS 'Analyses sélectionnées pour une prescription avec leurs tarifs';
COMMENT ON COLUMN lab_prescriptions.montant_total IS 'Montant total de la prescription en XOF';
COMMENT ON COLUMN lab_prescriptions.statut_paiement IS 'Statut du paiement de la prescription';
COMMENT ON COLUMN lab_prescriptions.facture_id IS 'Référence à la facture créée';
COMMENT ON COLUMN lab_prescriptions.ticket_facturation_id IS 'Référence au ticket de facturation créé automatiquement';
COMMENT ON VIEW v_lab_prescriptions_tarification IS 'Vue agrégée des prescriptions avec leurs analyses et tarifs';

