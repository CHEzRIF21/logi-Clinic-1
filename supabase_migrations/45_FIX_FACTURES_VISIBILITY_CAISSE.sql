-- ============================================
-- Migration 45: Correction Visibilité Factures dans la Caisse
-- Date: 2025-01-XX
-- Description: S'assurer que toutes les factures en attente sont visibles dans le module Caisse
-- ============================================

-- ============================================
-- 1. CORRECTION DES FACTURES EXISTANTES
-- ============================================

-- Mettre à jour les factures qui ont un montant_restant > 0 mais un statut incorrect
UPDATE factures
SET statut = CASE
  WHEN montant_restant = 0 AND montant_paye > 0 THEN 'payee'
  WHEN montant_restant > 0 AND montant_paye > 0 THEN 'partiellement_payee'
  WHEN montant_restant > 0 AND montant_paye = 0 THEN 'en_attente'
  ELSE statut
END,
updated_at = NOW()
WHERE (statut NOT IN ('en_attente', 'partiellement_payee', 'payee', 'annulee', 'exoneree'))
  OR (montant_restant > 0 AND statut = 'payee')
  OR (montant_restant = 0 AND montant_paye > 0 AND statut != 'payee');

-- S'assurer que toutes les factures avec consultation_id ont service_origine = 'consultation'
UPDATE factures
SET service_origine = 'consultation'
WHERE consultation_id IS NOT NULL
  AND (service_origine IS NULL OR service_origine = '');

-- S'assurer que montant_restant est correctement calculé
UPDATE factures
SET montant_restant = montant_total - COALESCE(montant_paye, 0),
    updated_at = NOW()
WHERE montant_restant != (montant_total - COALESCE(montant_paye, 0));

-- ============================================
-- 2. AMÉLIORATION DE LA VUE FACTURES_EN_ATTENTE
-- ============================================

-- Supprimer la vue existante pour éviter les conflits de colonnes
-- CASCADE supprime aussi les dépendances (vues, fonctions, etc.)
DROP VIEW IF EXISTS factures_en_attente CASCADE;

-- Recréer la vue pour inclure toutes les factures en attente
CREATE VIEW factures_en_attente AS
SELECT 
  f.id,
  f.numero_facture,
  f.patient_id,
  f.consultation_id,
  f.date_facture,
  f.montant_total,
  f.montant_paye,
  f.montant_restant,
  f.statut,
  f.type_facture_detail,
  f.service_origine,
  f.created_at,
  f.updated_at,
  c.id as consultation_id_ref,
  c.statut_paiement as consultation_statut_paiement,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  p.identifiant as patient_identifiant
FROM factures f
LEFT JOIN consultations c ON f.consultation_id = c.id
LEFT JOIN patients p ON f.patient_id = p.id
WHERE f.statut IN ('en_attente', 'partiellement_payee')
  AND f.montant_restant > 0
ORDER BY f.date_facture DESC, f.created_at DESC;

COMMENT ON VIEW factures_en_attente IS 
'Vue des factures en attente de paiement pour le module Caisse - Inclut toutes les factures avec consultation_id ou sans';

-- ============================================
-- 3. FONCTION DE VÉRIFICATION ET CORRECTION
-- ============================================

CREATE OR REPLACE FUNCTION verify_facture_for_caisse(p_facture_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_facture RECORD;
BEGIN
  SELECT * INTO v_facture
  FROM factures
  WHERE id = p_facture_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Vérifier que la facture est visible dans la caisse
  IF v_facture.statut IN ('en_attente', 'partiellement_payee') 
     AND v_facture.montant_restant > 0 THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. INDEX POUR PERFORMANCE
-- ============================================

-- Index composite pour les requêtes de la caisse
CREATE INDEX IF NOT EXISTS idx_factures_caisse_lookup 
ON factures(statut, montant_restant, date_facture DESC)
WHERE statut IN ('en_attente', 'partiellement_payee') AND montant_restant > 0;

-- Index sur consultation_id pour les jointures
CREATE INDEX IF NOT EXISTS idx_factures_consultation_id_lookup
ON factures(consultation_id)
WHERE consultation_id IS NOT NULL;

-- Index sur service_origine
CREATE INDEX IF NOT EXISTS idx_factures_service_origine
ON factures(service_origine)
WHERE service_origine IS NOT NULL;

-- ============================================
-- 5. TRIGGER POUR MAINTENIR LA COHÉRENCE
-- ============================================

-- Fonction trigger pour s'assurer que montant_restant est toujours correct
CREATE OR REPLACE FUNCTION update_facture_montant_restant()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer montant_restant si montant_total ou montant_paye change
  IF TG_OP = 'UPDATE' AND (
    OLD.montant_total != NEW.montant_total OR
    OLD.montant_paye != NEW.montant_paye
  ) THEN
    NEW.montant_restant := NEW.montant_total - COALESCE(NEW.montant_paye, 0);
    
    -- Mettre à jour le statut si nécessaire
    IF NEW.montant_restant <= 0 AND NEW.montant_paye > 0 THEN
      NEW.statut := 'payee';
    ELSIF NEW.montant_restant > 0 AND NEW.montant_paye > 0 THEN
      NEW.statut := 'partiellement_payee';
    ELSIF NEW.montant_restant > 0 AND NEW.montant_paye = 0 THEN
      NEW.statut := 'en_attente';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger si il n'existe pas déjà
DROP TRIGGER IF EXISTS trigger_update_facture_montant_restant ON factures;
CREATE TRIGGER trigger_update_facture_montant_restant
BEFORE UPDATE ON factures
FOR EACH ROW
EXECUTE FUNCTION update_facture_montant_restant();

COMMENT ON FUNCTION update_facture_montant_restant() IS 
'Trigger pour maintenir la cohérence de montant_restant et statut des factures';
