-- ============================================
-- UPDATE validate_clinic_login to check email_verified
-- ============================================
-- Objectif:
-- - Modifier la fonction RPC validate_clinic_login pour vérifier email_verified
-- - Bloquer la connexion si status='APPROVED' et email_verified=false
-- ============================================

CREATE OR REPLACE FUNCTION validate_clinic_login(
  p_clinic_code TEXT,
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
  v_user_id UUID;
  v_user_record RECORD;
  v_password_hash TEXT;
  v_result JSONB;
BEGIN
  -- Récupérer l'ID de la clinique
  v_clinic_id := get_clinic_id_by_code(p_clinic_code);
  
  IF v_clinic_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Code clinique invalide ou clinique inactive'
    );
  END IF;
  
  -- Récupérer l'utilisateur (inclure email_verified)
  SELECT * INTO v_user_record
  FROM users
  WHERE email = LOWER(TRIM(p_email))
    AND clinic_id = v_clinic_id
    AND actif = true
  LIMIT 1;
  
  IF v_user_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé ou inactif'
    );
  END IF;
  
  -- Vérifier le mot de passe
  v_password_hash := encode(digest(p_password || 'logi_clinic_salt', 'sha256'), 'hex');
  
  IF v_user_record.password_hash != v_password_hash THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Mot de passe incorrect'
    );
  END IF;
  
  -- Vérifier le statut
  IF v_user_record.status = 'SUSPENDED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Compte suspendu'
    );
  END IF;

  -- NOUVEAU: Vérifier que l'email est vérifié pour les comptes APPROVED
  IF v_user_record.status = 'APPROVED' AND (v_user_record.email_verified IS NULL OR v_user_record.email_verified = false) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email non vérifié. Veuillez vérifier votre boîte de réception et cliquer sur le lien de vérification.'
    );
  END IF;
  
  -- Mettre à jour la dernière connexion
  UPDATE users
  SET last_login = NOW(),
      first_login_at = COALESCE(first_login_at, NOW())
  WHERE id = v_user_record.id;
  
  -- Construire le résultat (inclure email_verified)
  v_result := jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user_record.id,
      'email', v_user_record.email,
      'nom', v_user_record.nom,
      'prenom', v_user_record.prenom,
      'role', v_user_record.role,
      'status', v_user_record.status,
      'clinic_id', v_user_record.clinic_id,
      'clinic_code', p_clinic_code,
      'email_verified', COALESCE(v_user_record.email_verified, false),
      'requires_password_change', (v_user_record.status = 'PENDING')
    )
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION validate_clinic_login IS 
'Valide les identifiants de connexion avec code clinique. Vérifie aussi email_verified pour les comptes APPROVED.';
