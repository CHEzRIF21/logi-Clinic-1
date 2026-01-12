-- ============================================
-- Migration 38: Table pour les profils personnalisés
-- Permet de créer des profils réutilisables avec permissions personnalisées
-- ============================================

-- Table pour stocker les profils personnalisés
CREATE TABLE IF NOT EXISTS custom_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  role_code VARCHAR(50) NOT NULL REFERENCES role_definitions(role_code),
  is_admin BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, nom) -- Un nom de profil unique par clinique
);

-- Table pour stocker les permissions personnalisées des profils
CREATE TABLE IF NOT EXISTS custom_profile_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES custom_profiles(id) ON DELETE CASCADE,
  module_name VARCHAR(50) NOT NULL,
  permission_action VARCHAR(20) NOT NULL,
  submodule_name VARCHAR(50),
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, module_name, permission_action, submodule_name)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_custom_profiles_clinic_id ON custom_profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_custom_profiles_role_code ON custom_profiles(role_code);
CREATE INDEX IF NOT EXISTS idx_custom_profile_permissions_profile_id ON custom_profile_permissions(profile_id);
CREATE INDEX IF NOT EXISTS idx_custom_profile_permissions_module ON custom_profile_permissions(module_name);

-- Fonction pour obtenir les permissions d'un profil personnalisé
CREATE OR REPLACE FUNCTION get_custom_profile_permissions(p_profile_id UUID)
RETURNS TABLE (
  module_name VARCHAR(50),
  permission_action VARCHAR(20),
  submodule_name VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cpp.module_name,
    cpp.permission_action,
    cpp.submodule_name
  FROM custom_profile_permissions cpp
  WHERE cpp.profile_id = p_profile_id
    AND cpp.granted = true
  ORDER BY cpp.module_name, cpp.permission_action, cpp.submodule_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer un profil personnalisé avec ses permissions
CREATE OR REPLACE FUNCTION create_custom_profile(
  p_clinic_id UUID,
  p_nom VARCHAR(255),
  p_description TEXT,
  p_role_code VARCHAR(50),
  p_is_admin BOOLEAN DEFAULT false,
  p_permissions JSONB DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
  perm_item JSONB;
  submodule_item JSONB;
BEGIN
  -- Créer le profil
  INSERT INTO custom_profiles (
    clinic_id,
    nom,
    description,
    role_code,
    is_admin,
    created_by
  ) VALUES (
    p_clinic_id,
    p_nom,
    p_description,
    p_role_code,
    p_is_admin,
    p_created_by
  )
  RETURNING id INTO v_profile_id;

  -- Si le profil est admin, pas besoin de permissions explicites
  IF NOT p_is_admin AND p_permissions IS NOT NULL THEN
    -- Insérer les permissions
    FOR perm_item IN SELECT * FROM jsonb_array_elements(p_permissions)
    LOOP
      -- Permissions au niveau module
      IF perm_item->'actions' IS NOT NULL THEN
        INSERT INTO custom_profile_permissions (
          profile_id,
          module_name,
          permission_action,
          submodule_name
        )
        SELECT 
          v_profile_id,
          perm_item->>'module',
          action_value::VARCHAR(20),
          NULL
        FROM jsonb_array_elements_text(perm_item->'actions') AS action_value
        ON CONFLICT (profile_id, module_name, permission_action, submodule_name) DO NOTHING;
      END IF;

      -- Permissions au niveau sous-module
      IF perm_item->'submodules' IS NOT NULL THEN
        FOR submodule_item IN SELECT * FROM jsonb_array_elements(perm_item->'submodules')
        LOOP
          INSERT INTO custom_profile_permissions (
            profile_id,
            module_name,
            permission_action,
            submodule_name
          )
          SELECT 
            v_profile_id,
            perm_item->>'module',
            action_value::VARCHAR(20),
            submodule_item->>'submodule'
          FROM jsonb_array_elements_text(submodule_item->'actions') AS action_value
          ON CONFLICT (profile_id, module_name, permission_action, submodule_name) DO NOTHING;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE custom_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_profile_permissions ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent (pour éviter les erreurs de duplication)
DROP POLICY IF EXISTS "custom_profiles_clinic_isolation" ON custom_profiles;
DROP POLICY IF EXISTS "custom_profile_permissions_access" ON custom_profile_permissions;

-- Politique pour custom_profiles : accès par clinic_id
CREATE POLICY "custom_profiles_clinic_isolation" ON custom_profiles
  FOR ALL TO authenticated
  USING (
    clinic_id = get_current_user_clinic_id()
    OR check_is_super_admin()
  )
  WITH CHECK (
    clinic_id = get_current_user_clinic_id()
    OR check_is_super_admin()
  );

-- Politique pour custom_profile_permissions : accès via le profil
CREATE POLICY "custom_profile_permissions_access" ON custom_profile_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_profiles cp
      WHERE cp.id = custom_profile_permissions.profile_id
        AND (
          cp.clinic_id = get_current_user_clinic_id()
          OR check_is_super_admin()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_profiles cp
      WHERE cp.id = custom_profile_permissions.profile_id
        AND (
          cp.clinic_id = get_current_user_clinic_id()
          OR check_is_super_admin()
        )
    )
  );

COMMENT ON TABLE custom_profiles IS 'Profils personnalisés réutilisables avec permissions spécifiques';
COMMENT ON TABLE custom_profile_permissions IS 'Permissions associées aux profils personnalisés';
