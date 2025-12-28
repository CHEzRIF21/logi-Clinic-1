-- ============================================
-- MIGRATION 25: Fix get_my_clinic_id() avec fallback
-- ============================================
-- Cette migration améliore la fonction get_my_clinic_id() pour qu'elle fonctionne
-- même si l'utilisateur n'est pas authentifié via Supabase Auth
-- IMPORTANT: On utilise CREATE OR REPLACE pour préserver les dépendances RLS
-- ============================================

-- Créer d'abord la version avec paramètre (surcharge)
-- Cette fonction accepte un paramètre optionnel user_id pour le fallback
CREATE OR REPLACE FUNCTION get_my_clinic_id(p_user_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- Méthode 1: Essayer avec auth.uid() (Supabase Auth)
  v_auth_user_id := auth.uid();
  
  IF v_auth_user_id IS NOT NULL THEN
    SELECT clinic_id INTO v_clinic_id
    FROM users
    WHERE auth_user_id = v_auth_user_id
      AND actif = true
    LIMIT 1;
    
    IF v_clinic_id IS NOT NULL THEN
      RETURN v_clinic_id;
    END IF;
  END IF;
  
  -- Méthode 2: Fallback avec p_user_id si fourni
  IF p_user_id IS NOT NULL THEN
    SELECT clinic_id INTO v_clinic_id
    FROM users
    WHERE id = p_user_id
      AND actif = true
    LIMIT 1;
    
    IF v_clinic_id IS NOT NULL THEN
      RETURN v_clinic_id;
    END IF;
  END IF;
  
  -- Retourner NULL si aucune méthode n'a fonctionné
  RETURN NULL;
END;
$$;

-- Remplacer la version sans paramètre (IMPORTANT: même signature pour préserver les dépendances RLS)
-- Cette fonction est utilisée par toutes les politiques RLS
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Appeler la version avec paramètre avec NULL
  RETURN get_my_clinic_id(NULL);
END;
$$;

-- Mettre à jour l'alias pour compatibilité
CREATE OR REPLACE FUNCTION get_current_user_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN get_my_clinic_id();
END;
$$;

-- Commentaires
COMMENT ON FUNCTION get_my_clinic_id() IS 'Récupère l''ID de la clinique de l''utilisateur connecté. Fonctionne avec Supabase Auth ou avec un user_id en paramètre. Version améliorée avec fallback.';
COMMENT ON FUNCTION get_my_clinic_id(UUID) IS 'Récupère l''ID de la clinique pour un utilisateur spécifique (fallback si auth.uid() ne fonctionne pas).';

-- Vérification que la fonction fonctionne
DO $$
BEGIN
  -- Test simple pour vérifier que la fonction existe et fonctionne
  IF get_my_clinic_id() IS NULL THEN
    RAISE NOTICE '✅ Fonction get_my_clinic_id() créée avec succès (retourne NULL si aucun utilisateur connecté, c''est normal)';
  ELSE
    RAISE NOTICE '✅ Fonction get_my_clinic_id() créée avec succès et retourne un clinic_id';
  END IF;
END $$;

