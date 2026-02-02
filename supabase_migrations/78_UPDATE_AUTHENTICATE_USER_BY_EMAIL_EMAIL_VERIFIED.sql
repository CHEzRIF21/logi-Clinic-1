-- ============================================
-- UPDATE authenticate_user_by_email to include email_verified
-- ============================================
-- Objectif:
-- - Ajouter email_verified dans le retour de la fonction RPC
-- - Permet au frontend de vérifier si l'email est vérifié
-- ============================================

DROP FUNCTION IF EXISTS authenticate_user_by_email(TEXT, UUID);

CREATE OR REPLACE FUNCTION authenticate_user_by_email(
  p_email TEXT,
  p_clinic_id UUID
)
RETURNS TABLE(
  id UUID,
  email VARCHAR(255),
  nom VARCHAR(255),
  prenom VARCHAR(255),
  role VARCHAR(50),
  status VARCHAR(50),
  clinic_id UUID,
  actif BOOLEAN,
  password_hash TEXT,
  auth_user_id UUID,
  email_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::VARCHAR(255),
    u.nom::VARCHAR(255),
    u.prenom::VARCHAR(255),
    u.role::VARCHAR(50),
    u.status::VARCHAR(50),
    u.clinic_id,
    u.actif,
    u.password_hash,
    u.auth_user_id,
    COALESCE(u.email_verified, false) as email_verified
  FROM users u
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
    AND u.clinic_id = p_clinic_id
    AND u.actif = true;
END;
$$;

COMMENT ON FUNCTION authenticate_user_by_email IS 
'Authentifie un utilisateur par email et clinic_id. Retourne aussi email_verified pour vérifier si l''email a été vérifié après approbation.';
