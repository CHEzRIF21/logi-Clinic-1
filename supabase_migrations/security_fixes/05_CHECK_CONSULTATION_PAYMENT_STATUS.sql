-- ============================================
-- LOT 5: check_consultation_payment_status (RETURNS TABLE - SPÉCIAL)
-- ATTENTION: Cette fonction peut avoir un type de retour différent
-- On la supprime et recrée pour éviter l'erreur 42P13
-- Exécuter ce fichier via Supabase Dashboard > SQL Editor
-- ============================================

-- Supprimer l'ancienne fonction (toutes les signatures possibles)
DROP FUNCTION IF EXISTS check_consultation_payment_status(uuid) CASCADE;

-- Recréer avec le bon type de retour et search_path
CREATE OR REPLACE FUNCTION check_consultation_payment_status(p_consultation_id UUID)
RETURNS TABLE (
  statut_paiement VARCHAR(20),
  peut_consulter BOOLEAN,
  message TEXT,
  facture_id UUID,
  montant_restant DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_statut VARCHAR(20);
  v_facture_id UUID;
  v_config_obligatoire BOOLEAN;
  v_clinic_id UUID;
  v_montant_restant DECIMAL(12,2);
BEGIN
  -- Récupérer le statut et la facture de la consultation
  SELECT c.statut_paiement, c.facture_initial_id, c.clinic_id
  INTO v_statut, v_facture_id, v_clinic_id
  FROM consultations c
  WHERE c.id = p_consultation_id;
  
  IF v_statut IS NULL THEN
    RETURN QUERY SELECT 
      'non_facture'::VARCHAR(20),
      true::BOOLEAN,
      'Consultation introuvable'::TEXT,
      NULL::UUID,
      0::DECIMAL(12,2);
    RETURN;
  END IF;
  
  -- Récupérer la configuration de la clinique
  SELECT paiement_obligatoire_avant_consultation
  INTO v_config_obligatoire
  FROM configurations_facturation
  WHERE clinic_id = v_clinic_id;
  
  -- Si paiement non obligatoire, tout est autorisé
  IF v_config_obligatoire IS FALSE OR v_config_obligatoire IS NULL THEN
    RETURN QUERY SELECT 
      v_statut,
      true::BOOLEAN,
      'Paiement non obligatoire pour cette clinique'::TEXT,
      v_facture_id,
      0::DECIMAL(12,2);
    RETURN;
  END IF;
  
  -- Calculer le montant restant si facture existe
  IF v_facture_id IS NOT NULL THEN
    SELECT f.montant_restant INTO v_montant_restant
    FROM factures f
    WHERE f.id = v_facture_id;
  ELSE
    v_montant_restant := 0;
  END IF;
  
  -- Vérifier le statut
  CASE v_statut
    WHEN 'paye' THEN
      RETURN QUERY SELECT 
        v_statut,
        true::BOOLEAN,
        'Consultation payée - Accès autorisé'::TEXT,
        v_facture_id,
        v_montant_restant;
    WHEN 'exonere' THEN
      RETURN QUERY SELECT 
        v_statut,
        true::BOOLEAN,
        'Consultation exonérée - Accès autorisé'::TEXT,
        v_facture_id,
        v_montant_restant;
    WHEN 'urgence_autorisee' THEN
      RETURN QUERY SELECT 
        v_statut,
        true::BOOLEAN,
        'Consultation urgence autorisée par médecin'::TEXT,
        v_facture_id,
        v_montant_restant;
    WHEN 'en_attente' THEN
      RETURN QUERY SELECT 
        v_statut,
        false::BOOLEAN,
        'Paiement en attente - Consultation bloquée'::TEXT,
        v_facture_id,
        v_montant_restant;
    ELSE -- 'non_facture'
      RETURN QUERY SELECT 
        v_statut,
        false::BOOLEAN,
        'Facture non générée ou paiement requis'::TEXT,
        v_facture_id,
        v_montant_restant;
  END CASE;
END;
$$;

SELECT 'LOT 5 TERMINÉ: check_consultation_payment_status recréée' as status;
