-- ============================================
-- MIGRATION 33: CORRECTION SÉCURITÉ - search_path mutable
-- ============================================
-- Cette migration corrige toutes les fonctions avec search_path mutable
-- pour prévenir les vulnérabilités d'injection SQL
-- ============================================

-- Fonction 1: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction 2: update_anamnese_templates_updated_at
CREATE OR REPLACE FUNCTION public.update_anamnese_templates_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction 3: generate_clinic_code
CREATE OR REPLACE FUNCTION public.generate_clinic_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_year TEXT;
  v_sequence_num INT;
  v_code TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 'CLIN-\d{4}-(\d+)') AS INT)), 0) + 1
  INTO v_sequence_num
  FROM clinics
  WHERE code LIKE 'CLIN-' || v_year || '-%';
  
  v_code := 'CLIN-' || v_year || '-' || LPAD(v_sequence_num::TEXT, 3, '0');
  RETURN v_code;
END;
$$;

-- Fonction 4: calculer_imc
CREATE OR REPLACE FUNCTION public.calculer_imc(poids_kg NUMERIC, taille_cm NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF taille_cm IS NULL OR taille_cm <= 0 OR poids_kg IS NULL OR poids_kg <= 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN ROUND((poids_kg / POWER(taille_cm / 100, 2))::NUMERIC, 2);
END;
$$;

-- Fonction 5: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE id = p_user_id;
  
  RETURN v_role = 'SUPER_ADMIN';
END;
$$;

-- Fonction 6: is_clinic_admin
CREATE OR REPLACE FUNCTION public.is_clinic_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE id = p_user_id;
  
  RETURN v_role = 'CLINIC_ADMIN';
END;
$$;

-- Fonction 7: get_user_clinic_id
CREATE OR REPLACE FUNCTION public.get_user_clinic_id(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT clinic_id INTO v_clinic_id
  FROM users
  WHERE id = p_user_id;
  
  RETURN v_clinic_id;
END;
$$;

-- Fonction 8: generer_numero_prescription
CREATE OR REPLACE FUNCTION public.generer_numero_prescription(p_clinic_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_year TEXT;
  v_sequence_num INT;
  v_numero TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'PRES-\d{4}-(\d+)') AS INT)), 0) + 1
  INTO v_sequence_num
  FROM prescriptions
  WHERE clinic_id = p_clinic_id
    AND numero LIKE 'PRES-' || v_year || '-%';
  
  v_numero := 'PRES-' || v_year || '-' || LPAD(v_sequence_num::TEXT, 6, '0');
  RETURN v_numero;
END;
$$;

-- Fonction 9: generer_numero_facture
CREATE OR REPLACE FUNCTION public.generer_numero_facture(p_clinic_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_year TEXT;
  v_sequence_num INT;
  v_numero TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'FACT-\d{4}-(\d+)') AS INT)), 0) + 1
  INTO v_sequence_num
  FROM factures
  WHERE clinic_id = p_clinic_id
    AND numero LIKE 'FACT-' || v_year || '-%';
  
  v_numero := 'FACT-' || v_year || '-' || LPAD(v_sequence_num::TEXT, 6, '0');
  RETURN v_numero;
END;
$$;

-- Fonction 10: generer_numero_dispensation
CREATE OR REPLACE FUNCTION public.generer_numero_dispensation(p_clinic_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_year TEXT;
  v_sequence_num INT;
  v_numero TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'DISP-\d{4}-(\d+)') AS INT)), 0) + 1
  INTO v_sequence_num
  FROM dispensations
  WHERE clinic_id = p_clinic_id
    AND numero LIKE 'DISP-' || v_year || '-%';
  
  v_numero := 'DISP-' || v_year || '-' || LPAD(v_sequence_num::TEXT, 6, '0');
  RETURN v_numero;
END;
$$;

-- Fonction 11: set_rv_updated_at
CREATE OR REPLACE FUNCTION public.set_rv_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction 12: hash_password_simple
CREATE OR REPLACE FUNCTION public.hash_password_simple(p_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN encode(digest(p_password || 'logi_clinic_salt', 'sha256'), 'hex');
END;
$$;

-- Fonction 13: generate_secure_temporary_code
CREATE OR REPLACE FUNCTION public.generate_secure_temporary_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Générer un code aléatoire de 8 caractères
  v_code := UPPER(
    SUBSTRING(
      encode(gen_random_bytes(6), 'base64') 
      FROM 1 FOR 8
    )
  );
  
  RETURN v_code;
END;
$$;

-- Fonction 14: validate_temporary_code
CREATE OR REPLACE FUNCTION public.validate_temporary_code(
  p_code TEXT,
  p_clinic_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM clinic_temporary_codes
  WHERE code = p_code
    AND clinic_id = p_clinic_id
    AND is_used = false
    AND is_converted = false
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN v_count > 0;
END;
$$;

-- Fonction 15: calculate_prix_total_entree
CREATE OR REPLACE FUNCTION public.calculate_prix_total_entree(
  p_quantite NUMERIC,
  p_prix_unitaire NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_quantite IS NULL OR p_prix_unitaire IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((p_quantite * p_prix_unitaire)::NUMERIC, 2);
END;
$$;

-- Fonction 16: mark_temporary_code_used
CREATE OR REPLACE FUNCTION public.mark_temporary_code_used(
  p_code TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE clinic_temporary_codes
  SET is_used = true,
      used_by_user_id = p_user_id,
      used_at = NOW()
  WHERE code = p_code
    AND is_used = false;
  
  RETURN FOUND;
END;
$$;

-- Fonction 17: convert_temporary_to_permanent_code
CREATE OR REPLACE FUNCTION public.convert_temporary_to_permanent_code(
  p_temp_code TEXT,
  p_permanent_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE clinic_temporary_codes
  SET is_converted = true,
      permanent_code = p_permanent_code,
      converted_at = NOW()
  WHERE code = p_temp_code
    AND is_converted = false;
  
  RETURN FOUND;
END;
$$;

-- Fonction 18: create_clinic_with_temporary_code
-- Note: Cette fonction est complexe, vérifier sa définition actuelle avant modification
-- CREATE OR REPLACE FUNCTION public.create_clinic_with_temporary_code(...)
-- SET search_path = public, pg_temp

-- Fonction 19: add_clinic_id_to_table
-- Note: Cette fonction est complexe, vérifier sa définition actuelle avant modification
-- CREATE OR REPLACE FUNCTION public.add_clinic_id_to_table(...)
-- SET search_path = public, pg_temp

-- Fonction 20: create_standard_rls_policies
-- Note: Cette fonction est complexe, vérifier sa définition actuelle avant modification
-- CREATE OR REPLACE FUNCTION public.create_standard_rls_policies(...)
-- SET search_path = public, pg_temp

-- Fonction 21: sync_transferts_workflow_status
-- Note: Cette fonction est complexe, vérifier sa définition actuelle avant modification
-- CREATE OR REPLACE FUNCTION public.sync_transferts_workflow_status(...)
-- SET search_path = public, pg_temp

-- Fonction 22: generer_numero_commande_fournisseur
CREATE OR REPLACE FUNCTION public.generer_numero_commande_fournisseur(p_clinic_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_year TEXT;
  v_sequence_num INT;
  v_numero TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'CMD-\d{4}-(\d+)') AS INT)), 0) + 1
  INTO v_sequence_num
  FROM commandes_fournisseur
  WHERE clinic_id = p_clinic_id
    AND numero LIKE 'CMD-' || v_year || '-%';
  
  v_numero := 'CMD-' || v_year || '-' || LPAD(v_sequence_num::TEXT, 6, '0');
  RETURN v_numero;
END;
$$;

-- Fonction 23: create_clinic_rls_policies
-- Note: Cette fonction est complexe, vérifier sa définition actuelle avant modification
-- CREATE OR REPLACE FUNCTION public.create_clinic_rls_policies(...)
-- SET search_path = public, pg_temp

-- Fonction 24: protect_demo_clinic
CREATE OR REPLACE FUNCTION public.protect_demo_clinic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.is_demo = true THEN
    RAISE EXCEPTION 'Les cliniques de démonstration ne peuvent pas être modifiées';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.update_anamnese_templates_updated_at() IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.generate_clinic_code() IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.calculer_imc(NUMERIC, NUMERIC) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.is_super_admin(UUID) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.is_clinic_admin(UUID) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.get_user_clinic_id(UUID) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.generer_numero_prescription(UUID) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.generer_numero_facture(UUID) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.generer_numero_dispensation(UUID) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.set_rv_updated_at() IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.hash_password_simple(TEXT) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.generate_secure_temporary_code() IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.validate_temporary_code(TEXT, UUID) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.calculate_prix_total_entree(NUMERIC, NUMERIC) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.mark_temporary_code_used(TEXT, UUID) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.convert_temporary_to_permanent_code(TEXT, TEXT) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.generer_numero_commande_fournisseur(UUID) IS 'Corrigé: search_path sécurisé';
COMMENT ON FUNCTION public.protect_demo_clinic() IS 'Corrigé: search_path sécurisé';

