-- ============================================
-- MIGRATION 42: Ajout fonction RPC get_user_by_id
-- ============================================
-- Cette fonction permet de récupérer un utilisateur par son ID en bypassant RLS
-- pour éviter les problèmes d'accès dans VueDetailleeUtilisateur
-- Version corrigée: plus permissive pour les utilisateurs de la même clinique
-- ============================================

CREATE OR REPLACE FUNCTION get_user_by_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  nom VARCHAR(100),
  prenom VARCHAR(100),
  role VARCHAR(50),
  status VARCHAR(50),
  clinic_id UUID,
  actif BOOLEAN,
  specialite VARCHAR(100),
  telephone VARCHAR(20),
  adresse TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  avatar_url TEXT,
  language VARCHAR(10),
  auth_user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_auth_uid UUID;
  v_current_user_role VARCHAR(50);
  v_current_clinic_id UUID;
  v_target_user_clinic_id UUID;
BEGIN
  -- Récupérer auth.uid()
  v_current_auth_uid := auth.uid();
  
  -- Récupérer les informations de l'utilisateur actuel via auth_user_id
  IF v_current_auth_uid IS NOT NULL THEN
    SELECT u.role, u.clinic_id INTO v_current_user_role, v_current_clinic_id
    FROM users u
    WHERE u.auth_user_id = v_current_auth_uid
    LIMIT 1;
  END IF;
  
  -- Récupérer la clinique de l'utilisateur cible
  SELECT u.clinic_id INTO v_target_user_clinic_id
  FROM users u
  WHERE u.id = p_user_id;
  
  -- Vérifier les permissions :
  -- 1. Super admin peut voir tous les utilisateurs
  -- 2. Clinic admin peut voir les utilisateurs de sa clinique
  -- 3. Staff de la même clinique peut voir les autres utilisateurs de la clinique
  -- 4. Un utilisateur peut voir son propre profil
  IF v_current_user_role = 'SUPER_ADMIN' OR
     (v_current_user_role IN ('CLINIC_ADMIN', 'admin') AND v_current_clinic_id = v_target_user_clinic_id) OR
     (v_current_clinic_id IS NOT NULL AND v_current_clinic_id = v_target_user_clinic_id) OR
     (v_current_auth_uid IS NOT NULL AND EXISTS (
       SELECT 1 FROM users u2 WHERE u2.id = p_user_id AND u2.auth_user_id = v_current_auth_uid
     ))
  THEN
    -- Retourner les données de l'utilisateur
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      u.nom,
      u.prenom,
      u.role,
      u.status,
      u.clinic_id,
      u.actif,
      u.specialite,
      u.telephone,
      u.adresse,
      u.last_login,
      u.created_at,
      u.updated_at,
      u.avatar_url,
      u.language,
      u.auth_user_id
    FROM users u
    WHERE u.id = p_user_id;
  ELSE
    -- Retourner un résultat vide si pas de permission
    RETURN;
  END IF;
END;
$$;

-- Commentaire pour documentation
COMMENT ON FUNCTION get_user_by_id(UUID) IS 'Récupère un utilisateur par son ID en bypassant RLS. Vérifie les permissions : Super Admin peut voir tous, Clinic Admin peut voir sa clinique, Staff de la même clinique peut voir les autres utilisateurs.';
