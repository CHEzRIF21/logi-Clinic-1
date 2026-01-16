-- ============================================
-- Migration 44: Sécurisation Paiements - Caisse Uniquement
-- Date: 2025-01-XX
-- Description: S'assurer que tous les paiements passent par le module Caisse
-- ============================================

-- ============================================
-- 1. VÉRIFICATION DES CONTRAINTES EXISTANTES
-- ============================================

-- Vérifier que la table paiements existe et a les bonnes colonnes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'paiements'
  ) THEN
    RAISE EXCEPTION 'Table paiements non trouvée';
  END IF;
END $$;

-- ============================================
-- 2. INDEX POUR PERFORMANCE
-- ============================================

-- Index sur statut des factures pour les requêtes de la Caisse
CREATE INDEX IF NOT EXISTS idx_factures_statut_en_attente 
ON factures(statut) 
WHERE statut IN ('en_attente', 'partiellement_payee');

-- Index sur type_facture_detail pour distinguer factures initiales et complémentaires
CREATE INDEX IF NOT EXISTS idx_factures_type_detail 
ON factures(type_facture_detail) 
WHERE type_facture_detail IS NOT NULL;

-- Index sur consultation_id pour les factures liées aux consultations
CREATE INDEX IF NOT EXISTS idx_factures_consultation_id 
ON factures(consultation_id) 
WHERE consultation_id IS NOT NULL;

-- ============================================
-- 3. VUE POUR FACTURES EN ATTENTE (CAISSE)
-- ============================================

CREATE OR REPLACE VIEW factures_en_attente AS
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
  f.created_at,
  f.updated_at,
  c.id as consultation_id_ref,
  c.statut_paiement as consultation_statut_paiement
FROM factures f
LEFT JOIN consultations c ON f.consultation_id = c.id
WHERE f.statut IN ('en_attente', 'partiellement_payee')
  AND f.montant_restant > 0
ORDER BY f.date_facture DESC, f.created_at DESC;

COMMENT ON VIEW factures_en_attente IS 
'Vue des factures en attente de paiement pour le module Caisse';

-- ============================================
-- 4. FONCTION DE VÉRIFICATION PAIEMENT REQUIS
-- ============================================

CREATE OR REPLACE FUNCTION check_payment_required_for_consultation(
  p_consultation_id UUID
)
RETURNS TABLE (
  payment_required BOOLEAN,
  facture_id UUID,
  montant_restant DECIMAL(12,2),
  message TEXT
) AS $$
DECLARE
  v_clinic_id UUID;
  v_payment_required BOOLEAN;
  v_facture_id UUID;
  v_montant_restant DECIMAL(12,2);
  v_statut_paiement VARCHAR(20);
BEGIN
  -- Récupérer le clinic_id et le statut de paiement de la consultation
  SELECT c.clinic_id, c.statut_paiement, c.facture_initial_id
  INTO v_clinic_id, v_statut_paiement, v_facture_id
  FROM consultations c
  WHERE c.id = p_consultation_id;

  IF v_clinic_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Consultation non trouvée'::TEXT;
    RETURN;
  END IF;

  -- Vérifier la configuration de la clinique
  SELECT COALESCE(paiement_obligatoire_avant_consultation, false)
  INTO v_payment_required
  FROM configurations_facturation
  WHERE clinic_id = v_clinic_id;

  IF NOT v_payment_required THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Paiement non obligatoire pour cette clinique'::TEXT;
    RETURN;
  END IF;

  -- Vérifier le statut de paiement
  IF v_statut_paiement IN ('paye', 'exonere', 'urgence_autorisee') THEN
    RETURN QUERY SELECT false, v_facture_id, 0::DECIMAL, 'Consultation déjà payée ou exonérée'::TEXT;
    RETURN;
  END IF;

  -- Récupérer le montant restant de la facture initiale
  IF v_facture_id IS NOT NULL THEN
    SELECT montant_restant
    INTO v_montant_restant
    FROM factures
    WHERE id = v_facture_id;
  END IF;

  -- Vérifier aussi les factures complémentaires
  SELECT COALESCE(SUM(montant_restant), 0)
  INTO v_montant_restant
  FROM factures
  WHERE consultation_id = p_consultation_id
    AND statut IN ('en_attente', 'partiellement_payee')
    AND montant_restant > 0;

  IF v_montant_restant > 0 THEN
    RETURN QUERY SELECT true, v_facture_id, v_montant_restant, 
      format('Paiement requis: %s XOF restants', v_montant_restant)::TEXT;
  ELSE
    RETURN QUERY SELECT false, v_facture_id, 0::DECIMAL, 'Aucun montant restant'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_payment_required_for_consultation IS 
'Vérifie si un paiement est requis pour une consultation';

-- ============================================
-- 5. POLITIQUE RLS POUR LA VUE
-- ============================================

-- La vue hérite des politiques RLS de la table factures
-- Pas besoin de politique supplémentaire

-- ============================================
-- 6. COMMENTAIRES
-- ============================================

COMMENT ON INDEX idx_factures_statut_en_attente IS 
'Index pour optimiser les requêtes de factures en attente dans le module Caisse';

COMMENT ON INDEX idx_factures_type_detail IS 
'Index pour distinguer rapidement les factures initiales et complémentaires';

COMMENT ON INDEX idx_factures_consultation_id IS 
'Index pour les jointures avec les consultations';
