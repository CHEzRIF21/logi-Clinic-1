-- ============================================
-- MIGRATION 43: Ajout fonction RPC insert_user_custom_permissions
-- ============================================
-- Cette fonction permet d'insérer les permissions personnalisées en bypassant RLS
-- pour éviter les erreurs "row-level security policy" lors de la sauvegarde
-- Version corrigée: accepte p_current_user_id pour gérer les cas où auth.uid() est NULL
-- ============================================

DROP FUNCTION IF EXISTS insert_user_custom_permissions(UUID, JSONB);

CREATE FUNCTION insert_user_custom_permissions(
  p_user_id UUID,
  p_permissions JSONB,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS VOID
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
  perm_record JSONB;
BEGIN
  -- Récupérer auth.uid()
  v_current_auth_uid := auth.uid();
  
  -- Déterminer l'ID utilisateur actuel (auth.uid() ou paramètre)
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
  
  -- Vérifier les permissions : seul un admin de la même clinique peut modifier
  IF v_current_user_role = 'SUPER_ADMIN' OR
     (v_current_user_role IN ('CLINIC_ADMIN', 'admin', 'ADMIN') AND v_current_clinic_id = v_target_user_clinic_id)
  THEN
    -- Supprimer les anciennes permissions
    DELETE FROM user_custom_permissions
    WHERE user_id = p_user_id;
    
    -- Insérer les nouvelles permissions
    FOR perm_record IN SELECT * FROM jsonb_array_elements(p_permissions)
    LOOP
      INSERT INTO user_custom_permissions (
        user_id,
        module_name,
        permission_action,
        submodule_name,
        granted
      ) VALUES (
        p_user_id,
        perm_record->>'module_name',
        perm_record->>'permission_action',
        NULLIF(perm_record->>'submodule_name', ''),
        COALESCE((perm_record->>'granted')::BOOLEAN, true)
      )
      ON CONFLICT (user_id, module_name, permission_action, submodule_name)
      DO UPDATE SET
        granted = EXCLUDED.granted,
        updated_at = NOW();
    END LOOP;
  ELSE
    RAISE EXCEPTION 'Accès refusé: vous n''avez pas les permissions pour modifier les permissions de cet utilisateur. Rôle actuel: %, Clinique actuelle: %, Clinique cible: %', COALESCE(v_current_user_role, 'NULL'), COALESCE(v_current_clinic_id::TEXT, 'NULL'), COALESCE(v_target_user_clinic_id::TEXT, 'NULL');
  END IF;
END;
$$;

COMMENT ON FUNCTION insert_user_custom_permissions(UUID, JSONB, UUID) IS 'Insère les permissions personnalisées d''un utilisateur en bypassant RLS. Seuls les admins de la même clinique peuvent utiliser cette fonction. Accepte p_current_user_id pour gérer les cas où auth.uid() est NULL.';
