-- ============================================
-- FONCTION POUR RÉCUPÉRER LES DONNÉES CLINIQUE PAR CODE TEMPORAIRE
-- ============================================
-- Cette fonction permet de récupérer les données de la clinique
-- même si les RLS policies bloquent l'accès direct
-- ============================================

CREATE OR REPLACE FUNCTION get_clinic_by_temp_code(p_temp_code TEXT)
RETURNS TABLE (
  clinic_id UUID,
  clinic_code TEXT,
  clinic_name TEXT,
  clinic_active BOOLEAN,
  is_temporary_code BOOLEAN,
  requires_code_change BOOLEAN,
  temp_code_expires_at TIMESTAMP WITH TIME ZONE,
  temp_code_is_used BOOLEAN,
  temp_code_is_converted BOOLEAN
) 
SECURITY DEFINER -- Exécute avec les privilèges du créateur, contourne RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as clinic_id,
    ctc.temporary_code::text as clinic_code,
    c.name::text as clinic_name,
    c.active as clinic_active,
    COALESCE(c.is_temporary_code, true) as is_temporary_code,
    COALESCE(c.requires_code_change, true) as requires_code_change,
    ctc.expires_at as temp_code_expires_at,
    ctc.is_used as temp_code_is_used,
    ctc.is_converted as temp_code_is_converted
  FROM clinic_temporary_codes ctc
  JOIN clinics c ON c.id = ctc.clinic_id
  WHERE ctc.temporary_code = UPPER(TRIM(p_temp_code))
    AND ctc.is_converted = false
    AND ctc.expires_at > NOW()
    AND c.active = true
  LIMIT 1;
END;
$$;

-- Permettre l'exécution publique de cette fonction
GRANT EXECUTE ON FUNCTION get_clinic_by_temp_code(TEXT) TO anon, authenticated;

-- Commentaire
COMMENT ON FUNCTION get_clinic_by_temp_code IS 
'Récupère les données de la clinique associée à un code temporaire. 
Contourne les RLS policies en utilisant SECURITY DEFINER.';

-- Test de la fonction
DO $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM get_clinic_by_temp_code('CAMPUS-001');
  
  IF v_result IS NOT NULL THEN
    RAISE NOTICE '✅ Fonction testée avec succès';
    RAISE NOTICE '   Clinic ID: %', v_result.clinic_id;
    RAISE NOTICE '   Clinic Name: %', v_result.clinic_name;
  ELSE
    RAISE NOTICE '⚠️ Aucun résultat pour CAMPUS-001 (peut être normal si non configuré)';
  END IF;
END $$;

