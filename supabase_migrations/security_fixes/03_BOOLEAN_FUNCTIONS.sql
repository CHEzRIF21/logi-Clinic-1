-- ============================================
-- LOT 3: Fonctions RETURNS BOOLEAN (6 fonctions)
-- Exécuter ce fichier via Supabase Dashboard > SQL Editor
-- ============================================

-- 1. verify_facture_for_caisse
CREATE OR REPLACE FUNCTION verify_facture_for_caisse(p_facture_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM factures
    WHERE id = p_facture_id
    AND statut IN ('en_attente', 'partiellement_payee')
  ) INTO v_exists;
  RETURN v_exists;
END;
$$;

-- 2. check_payment_required_for_consultation
CREATE OR REPLACE FUNCTION check_payment_required_for_consultation(p_consultation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requires_payment BOOLEAN;
BEGIN
  SELECT COALESCE(requiert_paiement, false) INTO v_requires_payment
  FROM consultations
  WHERE id = p_consultation_id;
  RETURN v_requires_payment;
END;
$$;

-- 3. role_has_permission
CREATE OR REPLACE FUNCTION role_has_permission(
  p_role_code VARCHAR(50),
  p_module_name VARCHAR(50),
  p_permission_action VARCHAR(20),
  p_submodule_name VARCHAR(50) DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM role_definitions
    WHERE role_code = p_role_code AND is_admin = true
  ) THEN
    RETURN true;
  END IF;

  IF p_submodule_name IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM default_role_permissions
      WHERE role_code = p_role_code
        AND module_name = p_module_name
        AND permission_action = p_permission_action
        AND submodule_name IS NULL
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM default_role_permissions
      WHERE role_code = p_role_code
        AND module_name = p_module_name
        AND permission_action = p_permission_action
        AND submodule_name = p_submodule_name
    );
  END IF;
END;
$$;

-- 4. verifier_liaison_dispensation_paiement
CREATE OR REPLACE FUNCTION verifier_liaison_dispensation_paiement(p_dispensation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_payment BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM paiements p
    JOIN factures f ON p.facture_id = f.id
    WHERE f.service_origine = 'pharmacie'
    AND f.reference_origine = p_dispensation_id::TEXT
  ) INTO v_has_payment;
  RETURN v_has_payment;
END;
$$;

-- 5. verifier_liaison_consultation_paiement
CREATE OR REPLACE FUNCTION verifier_liaison_consultation_paiement(p_consultation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_payment BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM paiements p
    JOIN factures f ON p.facture_id = f.id
    WHERE f.consultation_id = p_consultation_id
  ) INTO v_has_payment;
  RETURN v_has_payment;
END;
$$;

-- 6. attendre_synchronisation_paiement
CREATE OR REPLACE FUNCTION attendre_synchronisation_paiement(p_facture_id UUID, p_timeout_seconds INTEGER DEFAULT 5)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_is_synced BOOLEAN := false;
BEGIN
  v_start_time := NOW();
  
  WHILE (EXTRACT(EPOCH FROM (NOW() - v_start_time)) < p_timeout_seconds) AND NOT v_is_synced
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM factures
      WHERE id = p_facture_id
      AND statut IN ('payee', 'partiellement_payee')
    ) INTO v_is_synced;
    
    IF NOT v_is_synced THEN
      PERFORM pg_sleep(0.1);
    END IF;
  END LOOP;
  
  RETURN v_is_synced;
END;
$$;

SELECT 'LOT 3 TERMINÉ: 6 fonctions BOOLEAN corrigées' as status;
