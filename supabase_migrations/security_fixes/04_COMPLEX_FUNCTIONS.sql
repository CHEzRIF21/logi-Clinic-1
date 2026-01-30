-- ============================================
-- LOT 4: Fonctions complexes (TABLE/UUID/JSONB) - 5 fonctions
-- ATTENTION: Certaines fonctions ont un changement de type de retour
-- Exécuter ce fichier via Supabase Dashboard > SQL Editor
-- ============================================

-- 1. get_custom_profile_permissions (RETURNS TABLE)
CREATE OR REPLACE FUNCTION get_custom_profile_permissions(p_profile_id UUID)
RETURNS TABLE(
  module_name VARCHAR(50),
  permission_action VARCHAR(20),
  submodule_name VARCHAR(50)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cpp.module_name,
    cpp.permission_action,
    cpp.submodule_name
  FROM custom_profile_permissions cpp
  WHERE cpp.profile_id = p_profile_id
  ORDER BY cpp.module_name, cpp.permission_action, cpp.submodule_name;
END;
$$;

-- 2. get_default_role_permissions (RETURNS TABLE)
CREATE OR REPLACE FUNCTION get_default_role_permissions(p_role_code VARCHAR(50))
RETURNS TABLE (
  module_name VARCHAR(50),
  permission_action VARCHAR(20),
  submodule_name VARCHAR(50)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    drp.module_name,
    drp.permission_action,
    drp.submodule_name
  FROM default_role_permissions drp
  WHERE drp.role_code = p_role_code
  ORDER BY drp.module_name, drp.permission_action, drp.submodule_name;
END;
$$;

-- 3. create_initial_invoice_for_consultation (RETURNS UUID)
CREATE OR REPLACE FUNCTION create_initial_invoice_for_consultation(p_consultation_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_facture_id UUID;
  v_consultation RECORD;
BEGIN
  SELECT * INTO v_consultation
  FROM consultations
  WHERE id = p_consultation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation non trouvée';
  END IF;
  
  INSERT INTO factures (
    consultation_id,
    patient_id,
    montant_total,
    montant_paye,
    montant_restant,
    statut,
    clinic_id
  ) VALUES (
    p_consultation_id,
    v_consultation.patient_id,
    0,
    0,
    0,
    'en_attente',
    v_consultation.clinic_id
  )
  RETURNING id INTO v_facture_id;
  
  RETURN v_facture_id;
END;
$$;

-- 4. create_custom_profile (RETURNS UUID)
CREATE OR REPLACE FUNCTION create_custom_profile(
  p_name TEXT,
  p_description TEXT,
  p_clinic_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  INSERT INTO custom_profiles (name, description, clinic_id)
  VALUES (p_name, p_description, p_clinic_id)
  RETURNING id INTO v_profile_id;
  RETURN v_profile_id;
END;
$$;

-- 5. verifier_liaisons_inter_modules (RETURNS JSONB)
CREATE OR REPLACE FUNCTION verifier_liaisons_inter_modules(p_consultation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'has_prescription', EXISTS(SELECT 1 FROM prescriptions WHERE consultation_id = p_consultation_id),
    'has_lab_request', EXISTS(SELECT 1 FROM lab_requests WHERE consultation_id = p_consultation_id),
    'has_imaging_request', EXISTS(SELECT 1 FROM imaging_requests WHERE consultation_id = p_consultation_id),
    'has_payment', EXISTS(SELECT 1 FROM factures WHERE consultation_id = p_consultation_id)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

SELECT 'LOT 4 TERMINÉ: 5 fonctions complexes corrigées' as status;
