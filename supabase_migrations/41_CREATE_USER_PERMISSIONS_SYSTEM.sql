-- Migration pour créer le système complet de permissions utilisateur
-- Inclut la table user_custom_permissions et la fonction get_user_permissions

-- ============================================
-- 1. TABLE user_custom_permissions
-- ============================================
CREATE TABLE IF NOT EXISTS user_custom_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_name VARCHAR(50) NOT NULL,
  permission_action VARCHAR(20) NOT NULL,
  submodule_name VARCHAR(50),
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_name, permission_action, submodule_name)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_user_id ON user_custom_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_module ON user_custom_permissions(module_name);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_user_custom_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_custom_permissions_updated_at
  BEFORE UPDATE ON user_custom_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_custom_permissions_updated_at();

-- RLS Policies pour user_custom_permissions
ALTER TABLE user_custom_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres permissions
CREATE POLICY "Users can view their own custom permissions"
  ON user_custom_permissions
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users 
      WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('CLINIC_ADMIN', 'admin', 'SUPER_ADMIN')
      AND clinic_id = (SELECT clinic_id FROM users WHERE id = user_custom_permissions.user_id)
    )
  );

-- Policy: Les admins peuvent gérer les permissions de leur clinique
CREATE POLICY "Admins can manage permissions for their clinic"
  ON user_custom_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u1.clinic_id = u2.clinic_id
      WHERE u1.auth_user_id = auth.uid()
      AND u1.role IN ('CLINIC_ADMIN', 'admin', 'SUPER_ADMIN')
      AND u2.id = user_custom_permissions.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u1.clinic_id = u2.clinic_id
      WHERE u1.auth_user_id = auth.uid()
      AND u1.role IN ('CLINIC_ADMIN', 'admin', 'SUPER_ADMIN')
      AND u2.id = user_custom_permissions.user_id
    )
  );

-- ============================================
-- 2. FONCTION get_user_permissions
-- ============================================
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  module_name VARCHAR(50),
  permission_action VARCHAR(20),
  submodule_name VARCHAR(50)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role VARCHAR(50);
  v_is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT role, COALESCE(
    EXISTS(SELECT 1 FROM role_definitions WHERE role_code = users.role AND is_admin = true),
    false
  ) INTO v_user_role, v_is_admin
  FROM users
  WHERE id = p_user_id;
  
  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Utilisateur % non trouvé', p_user_id;
  END IF;
  
  -- Si admin, retourner toutes les permissions (vide = toutes)
  IF v_is_admin THEN
    -- Pour les admins, on retourne une structure vide qui sera interprétée comme "toutes les permissions"
    RETURN QUERY
    SELECT NULL::VARCHAR(50), NULL::VARCHAR(20), NULL::VARCHAR(50)
    WHERE false; -- Ne retourner aucun résultat, le frontend interprétera cela comme "admin = toutes permissions"
  END IF;
  
  -- Combiner les permissions par défaut du rôle ET les permissions personnalisées
  -- Utiliser UNION pour s'assurer que toutes les permissions personnalisées sont incluses
  RETURN QUERY
  -- Permissions par défaut du rôle
  SELECT DISTINCT
    drp.module_name,
    drp.permission_action,
    drp.submodule_name
  FROM default_role_permissions drp
  WHERE drp.role_code = v_user_role
  
  UNION
  
  -- Permissions personnalisées (qui peuvent remplacer ou ajouter aux permissions par défaut)
  SELECT DISTINCT
    ucp.module_name,
    ucp.permission_action,
    ucp.submodule_name
  FROM user_custom_permissions ucp
  WHERE ucp.user_id = p_user_id
    AND ucp.granted = true
  
  ORDER BY module_name, permission_action, submodule_name;
END;
$$;

-- ============================================
-- 3. FONCTION reset_user_to_default_permissions
-- ============================================
CREATE OR REPLACE FUNCTION reset_user_to_default_permissions(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role VARCHAR(50);
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT role INTO v_user_role
  FROM users
  WHERE id = p_user_id;
  
  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Utilisateur % non trouvé', p_user_id;
  END IF;
  
  -- Supprimer toutes les permissions personnalisées
  DELETE FROM user_custom_permissions
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================
-- 4. FONCTION user_has_permission
-- ============================================
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_module_name VARCHAR(50),
  p_permission_action VARCHAR(20),
  p_submodule_name VARCHAR(50) DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role VARCHAR(50);
  v_is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT role, COALESCE(
    EXISTS(SELECT 1 FROM role_definitions WHERE role_code = users.role AND is_admin = true),
    false
  ) INTO v_user_role, v_is_admin
  FROM users
  WHERE id = p_user_id;
  
  IF v_user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Les admins ont toutes les permissions
  IF v_is_admin THEN
    RETURN true;
  END IF;
  
  -- Vérifier les permissions personnalisées d'abord
  IF EXISTS (
    SELECT 1 FROM user_custom_permissions
    WHERE user_id = p_user_id
      AND module_name = p_module_name
      AND permission_action = p_permission_action
      AND COALESCE(submodule_name, '') = COALESCE(p_submodule_name, '')
      AND granted = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Vérifier les permissions par défaut du rôle
  RETURN EXISTS (
    SELECT 1 FROM default_role_permissions
    WHERE role_code = v_user_role
      AND module_name = p_module_name
      AND permission_action = p_permission_action
      AND COALESCE(submodule_name, '') = COALESCE(p_submodule_name, '')
  );
END;
$$;

-- Commentaires
COMMENT ON TABLE user_custom_permissions IS 'Permissions personnalisées pour chaque utilisateur (surcharge les permissions par défaut du rôle)';
COMMENT ON FUNCTION get_user_permissions IS 'Récupère toutes les permissions d''un utilisateur (défaut + personnalisées)';
COMMENT ON FUNCTION reset_user_to_default_permissions IS 'Réinitialise les permissions d''un utilisateur aux valeurs par défaut de son rôle';
COMMENT ON FUNCTION user_has_permission IS 'Vérifie si un utilisateur a une permission spécifique';
