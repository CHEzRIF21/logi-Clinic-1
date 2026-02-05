-- ============================================
-- MIGRATION: 83_FIX_SUPER_ADMIN_ACCESS.sql
-- Description: Allow Super Admin to bypass clinic isolation in auth logic
-- ============================================

-- 1. Update validate_clinic_login to allow SUPER_ADMIN to bypass clinic_id check
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
  v_user_record RECORD;
  v_password_hash TEXT;
  v_result JSONB;
BEGIN
  -- Récupérer l'ID de la clinique ciblée
  v_clinic_id := get_clinic_id_by_code(p_clinic_code);
  
  IF v_clinic_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Code clinique invalide ou clinique inactive'
    );
  END IF;
  
  -- Récupérer l'utilisateur
  -- Changement: Si c'est un SUPER_ADMIN, on ne filtre pas par clinic_id matchant le code
  SELECT * INTO v_user_record
  FROM users
  WHERE email = LOWER(TRIM(p_email))
    AND actif = true
  LIMIT 1;
  
  IF v_user_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé ou inactif'
    );
  END IF;

  -- Vérification Isolation: 
  -- Si l'utilisateur n'est pas SUPER_ADMIN, son clinic_id DOIT correspondre à celui du code fourni
  IF v_user_record.role != 'SUPER_ADMIN' AND v_user_record.clinic_id != v_clinic_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cet utilisateur n''appartient pas à la clinique spécifiée'
    );
  END IF;
  
  -- Vérifier le mot de passe (Hashage standard utilisé dans l'app)
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

  -- Vérifier email_verified pour les comptes APPROVED
  IF v_user_record.status = 'APPROVED' AND (v_user_record.email_verified IS NULL OR v_user_record.email_verified = false) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email non vérifié. Veuillez vérifier votre boîte de réception.'
    );
  END IF;
  
  -- Mettre à jour la dernière connexion
  UPDATE users
  SET last_login = NOW(),
      first_login_at = COALESCE(first_login_at, NOW())
  WHERE id = v_user_record.id;
  
  -- Construire le résultat
  -- Pour un Super Admin se connectant via un code clinique, on renvoie le clinic_id de la CLINIQUE CIBLE
  -- car c'est dans ce contexte qu'il veut travailler.
  v_result := jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user_record.id,
      'email', v_user_record.email,
      'nom', v_user_record.nom,
      'prenom', v_user_record.prenom,
      'role', v_user_record.role,
      'status', v_user_record.status,
      'clinic_id', COALESCE(v_user_record.clinic_id, v_clinic_id), -- Utilise la cible si null
      'clinic_code', p_clinic_code,
      'email_verified', COALESCE(v_user_record.email_verified, false),
      'requires_password_change', (v_user_record.status = 'PENDING')
    )
  );
  
  RETURN v_result;
END;
$$;

-- 2. Ensure get_my_clinic_id handles Super Admin correctly (fallback context)
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
  v_role TEXT;
BEGIN
  SELECT clinic_id, role INTO v_clinic_id, v_role
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  -- Si c'est un Super Admin, il pourrait ne pas avoir de clinic_id.
  -- Dans ce cas, RLS pourrait le bloquer s'il n'y a pas de bypass.
  -- Mais note: nos politiques super_admin_all utilisent check_is_super_admin() bypass.
  RETURN v_clinic_id;
END;
$$;
