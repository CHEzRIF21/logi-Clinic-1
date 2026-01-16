-- ============================================
-- MIGRATION 42: Ajout fonction RPC get_user_by_id
-- ============================================
-- Cette fonction permet de récupérer un utilisateur par son ID en bypassant RLS
-- pour éviter les problèmes d'accès dans VueDetailleeUtilisateur
-- Version corrigée: accepte p_current_user_id pour gérer les cas où auth.uid() est NULL
-- ============================================

DROP FUNCTION IF EXISTS get_user_by_id(UUID, UUID);

CREATE OR REPLACE FUNCTION get_user_by_id(
  p_user_id UUID,
  p_current_user_id UUID DEFAULT NULL
)
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
  v_current_user_id UUID;
BEGIN
  -- Récupérer auth.uid()
  v_current_auth_uid := auth.uid();
  
  -- Déterminer l'ID utilisateur actuel (paramètre ou auth.uid())
  IF p_current_user_id IS NOT NULL THEN
    v_current_user_id := p_current_user_id;
  ELSIF v_current_auth_uid IS NOT NULL THEN
    -- Récupérer l'ID utilisateur depuis auth_user_id
    SELECT u.id INTO v_current_user_id
    FROM users u
    WHERE u.auth_user_id = v_current_auth_uid
    LIMIT 1;
  END IF;
  
  -- Récupérer les informations de l'utilisateur actuel
  IF v_current_user_id IS NOT NULL THEN
    SELECT u.role, u.clinic_id INTO v_current_user_role, v_current_clinic_id
    FROM users u
    WHERE u.id = v_current_user_id
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
  -- 5. Si aucune vérification ne fonctionne, permettre l'accès si les deux utilisateurs sont dans la même clinique
  IF v_current_user_role = 'SUPER_ADMIN' OR
     (v_current_user_role IN ('CLINIC_ADMIN', 'admin', 'ADMIN') AND v_current_clinic_id = v_target_user_clinic_id) OR
     (v_current_clinic_id IS NOT NULL AND v_current_clinic_id = v_target_user_clinic_id) OR
     (v_current_user_id IS NOT NULL AND v_current_user_id = p_user_id) OR
     (v_current_clinic_id IS NOT NULL AND v_target_user_clinic_id IS NOT NULL AND v_current_clinic_id = v_target_user_clinic_id)
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
COMMENT ON FUNCTION get_user_by_id(UUID, UUID) IS 'Récupère un utilisateur par son ID en bypassant RLS. Vérifie les permissions : Super Admin peut voir tous, Clinic Admin peut voir sa clinique, Staff de la même clinique peut voir les autres utilisateurs. Accepte p_current_user_id pour gérer les cas où auth.uid() est NULL.';
