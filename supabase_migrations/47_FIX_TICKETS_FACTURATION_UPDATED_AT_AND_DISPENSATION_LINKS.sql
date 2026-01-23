-- Migration: Fix tickets_facturation updated_at et liaisons dispensation/consultation → paiement
-- Date: 2025-01-23
-- Description: 
--   1. Ajoute la colonne updated_at manquante à tickets_facturation
--   2. Crée un trigger pour mettre à jour automatiquement updated_at
--   3. Vérifie et améliore les liaisons entre dispensation/consultation et paiement

-- =========================================================
-- 1) S'assurer que la fonction update_updated_at_column existe
-- =========================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 2) Ajouter les colonnes manquantes à tickets_facturation
-- =========================================================
DO $$
BEGIN
  -- Ajouter updated_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tickets_facturation'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE tickets_facturation
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    -- Mettre à jour les enregistrements existants avec la date de création
    UPDATE tickets_facturation
    SET updated_at = COALESCE(date_creation, created_at, NOW())
    WHERE updated_at IS NULL;
  END IF;

  -- Ajouter payeur_type si elle n'existe pas (pour tiers-payant)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tickets_facturation'
    AND column_name = 'payeur_type'
  ) THEN
    ALTER TABLE tickets_facturation
    ADD COLUMN payeur_type VARCHAR(20) DEFAULT 'patient',
    ADD COLUMN payeur_id UUID,
    ADD COLUMN payeur_nom VARCHAR(200);
    
    -- Backfill: les anciens tickets sont pour le patient
    UPDATE tickets_facturation
    SET payeur_type = 'patient',
        payeur_id = patient_id
    WHERE payeur_id IS NULL;
  END IF;
END $$;

-- =========================================================
-- 3) Créer le trigger pour mettre à jour automatiquement updated_at
-- =========================================================
DROP TRIGGER IF EXISTS update_tickets_facturation_updated_at ON tickets_facturation;
CREATE TRIGGER update_tickets_facturation_updated_at
  BEFORE UPDATE ON tickets_facturation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- 4) Améliorer les index pour les liaisons dispensation/consultation → paiement
-- =========================================================

-- Index pour améliorer les recherches de tickets par référence origine (dispensation, consultation)
CREATE INDEX IF NOT EXISTS idx_tickets_reference_origine ON tickets_facturation(reference_origine);
CREATE INDEX IF NOT EXISTS idx_tickets_service_origine ON tickets_facturation(service_origine);
CREATE INDEX IF NOT EXISTS idx_tickets_facture_id ON tickets_facturation(facture_id);

-- Index composite pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_tickets_patient_service_statut ON tickets_facturation(patient_id, service_origine, statut);

-- =========================================================
-- 5) Fonction pour lier automatiquement les tickets aux factures lors du paiement
-- =========================================================
CREATE OR REPLACE FUNCTION update_ticket_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si un paiement est enregistré pour une facture
  -- Mettre à jour le statut des tickets liés à cette facture
  IF NEW.facture_id IS NOT NULL THEN
    UPDATE tickets_facturation
    SET 
      updated_at = NOW()
    WHERE facture_id = NEW.facture_id
    AND statut = 'facture';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les tickets lors d'un paiement
DROP TRIGGER IF EXISTS trigger_update_ticket_on_payment ON paiements;
CREATE TRIGGER trigger_update_ticket_on_payment
  AFTER INSERT OR UPDATE ON paiements
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_on_payment();

-- =========================================================
-- 6) Vue pour faciliter la recherche des tickets en attente par service
-- =========================================================
CREATE OR REPLACE VIEW vue_tickets_en_attente_par_service AS
SELECT 
  t.id,
  t.patient_id,
  p.nom || ' ' || COALESCE(p.prenom, '') AS patient_nom,
  t.service_origine,
  t.type_acte,
  t.montant,
  t.date_creation,
  t.reference_origine,
  COALESCE(t.payeur_type, 'patient') AS payeur_type,
  t.payeur_nom,
  CASE 
    WHEN t.service_origine = 'pharmacie' THEN 'Dispensation Pharmacie'
    WHEN t.service_origine = 'consultation' THEN 'Consultation'
    WHEN t.service_origine = 'laboratoire' THEN 'Examen Laboratoire'
    ELSE t.service_origine
  END AS libelle_service,
  t.created_at,
  t.updated_at
FROM tickets_facturation t
LEFT JOIN patients p ON t.patient_id = p.id
WHERE t.statut = 'en_attente'
ORDER BY t.date_creation DESC;

-- =========================================================
-- 7) Fonction pour vérifier l'intégrité des liaisons dispensation → ticket → facture → paiement
-- =========================================================
CREATE OR REPLACE FUNCTION verifier_liaison_dispensation_paiement(p_dispensation_id UUID)
RETURNS TABLE (
  dispensation_id UUID,
  ticket_id UUID,
  facture_id UUID,
  paiement_id UUID,
  statut_ticket VARCHAR,
  statut_facture VARCHAR,
  montant_ticket DECIMAL,
  montant_paye DECIMAL,
  montant_restant DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id AS dispensation_id,
    t.id AS ticket_id,
    t.facture_id,
    p.id AS paiement_id,
    t.statut AS statut_ticket,
    f.statut AS statut_facture,
    t.montant AS montant_ticket,
    COALESCE(SUM(p.montant), 0) AS montant_paye,
    t.montant - COALESCE(SUM(p.montant), 0) AS montant_restant
  FROM dispensations d
  LEFT JOIN tickets_facturation t ON t.reference_origine = d.id AND t.service_origine = 'pharmacie'
  LEFT JOIN factures f ON t.facture_id = f.id
  LEFT JOIN paiements p ON f.id = p.facture_id
  WHERE d.id = p_dispensation_id
  GROUP BY d.id, t.id, t.facture_id, p.id, t.statut, f.statut, t.montant;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 8) Fonction similaire pour les consultations
-- =========================================================
CREATE OR REPLACE FUNCTION verifier_liaison_consultation_paiement(p_consultation_id UUID)
RETURNS TABLE (
  consultation_id UUID,
  ticket_id UUID,
  facture_id UUID,
  paiement_id UUID,
  statut_ticket VARCHAR,
  statut_facture VARCHAR,
  montant_ticket DECIMAL,
  montant_paye DECIMAL,
  montant_restant DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS consultation_id,
    t.id AS ticket_id,
    t.facture_id,
    p.id AS paiement_id,
    t.statut AS statut_ticket,
    f.statut AS statut_facture,
    t.montant AS montant_ticket,
    COALESCE(SUM(p.montant), 0) AS montant_paye,
    t.montant - COALESCE(SUM(p.montant), 0) AS montant_restant
  FROM consultations c
  LEFT JOIN tickets_facturation t ON t.reference_origine = c.id AND t.service_origine = 'consultation'
  LEFT JOIN factures f ON t.facture_id = f.id
  LEFT JOIN paiements p ON f.id = p.facture_id
  WHERE c.id = p_consultation_id
  GROUP BY c.id, t.id, t.facture_id, p.id, t.statut, f.statut, t.montant;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 9) Commentaires pour documentation
-- =========================================================
COMMENT ON COLUMN tickets_facturation.updated_at IS 'Date de dernière mise à jour du ticket';
COMMENT ON FUNCTION update_ticket_on_payment() IS 'Met à jour les tickets lors de l''enregistrement d''un paiement';
COMMENT ON FUNCTION verifier_liaison_dispensation_paiement(UUID) IS 'Vérifie l''intégrité de la chaîne dispensation → ticket → facture → paiement';
COMMENT ON FUNCTION verifier_liaison_consultation_paiement(UUID) IS 'Vérifie l''intégrité de la chaîne consultation → ticket → facture → paiement';
COMMENT ON VIEW vue_tickets_en_attente_par_service IS 'Vue des tickets en attente de facturation groupés par service';

-- =========================================================
-- 10) Message de confirmation
-- =========================================================
SELECT 'Migration 47 appliquée avec succès: Colonne updated_at ajoutée à tickets_facturation et liaisons dispensation/consultation → paiement améliorées' as status;
