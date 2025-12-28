-- ============================================
-- CORRECTION CONNEXION CAMPUS-001
-- VERSION: 18
-- ============================================
-- Ce script corrige la configuration de CAMPUS-001 pour permettre la connexion
-- et fournit les informations de connexion de l'admin
-- ============================================

-- ============================================
-- ÉTAPE 1 : CRÉER/VÉRIFIER LA CLINIQUE CAMPUS-001
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_super_admin_id UUID;
BEGIN
  -- Récupérer le Super Admin
  SELECT id INTO v_super_admin_id 
  FROM users 
  WHERE role = 'SUPER_ADMIN' 
  LIMIT 1;

  -- Vérifier si la clinique existe
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';

  IF v_clinic_id IS NULL THEN
    -- Créer la clinique
    INSERT INTO clinics (
      code,
      name,
      address,
      phone,
      email,
      active,
      is_demo,
      is_temporary_code,
      requires_code_change,
      created_by_super_admin,
      created_at,
      updated_at
    )
    VALUES (
      'CAMPUS-001',
      'Clinique du Campus',
      'Quartier Arafat; rue opposée universite ESAE',
      '+229 90904344',
      'cliniquemedicalecampus@gmail.com',
      true,
      false,  -- Pas une démo
      false,  -- Code permanent
      false,  -- Pas de changement de code requis
      v_super_admin_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_clinic_id;
    
    RAISE NOTICE '✅ Clinique CAMPUS-001 créée avec ID: %', v_clinic_id;
  ELSE
    -- Mettre à jour la clinique pour s'assurer qu'elle est active et correctement configurée
    UPDATE clinics
    SET 
      active = true,
      is_demo = false,
      is_temporary_code = false,
      requires_code_change = false,
      updated_at = NOW()
    WHERE id = v_clinic_id;
    
    RAISE NOTICE '✅ Clinique CAMPUS-001 existante mise à jour avec ID: %', v_clinic_id;
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : CRÉER/VÉRIFIER L'ADMIN DE LA CLINIQUE
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_user_id UUID;
  v_password_hash TEXT;
  v_super_admin_id UUID;
  v_existing_clinic_id UUID;
BEGIN
  -- Récupérer l'ID de la clinique
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 non trouvée';
  END IF;

  -- Récupérer le Super Admin pour created_by
  SELECT id INTO v_super_admin_id 
  FROM users 
  WHERE role = 'SUPER_ADMIN' 
  LIMIT 1;

  -- Hash du mot de passe: TempClinic2024!
  -- Utiliser la même méthode que dans le backend (sha256 avec salt)
  v_password_hash := encode(digest('TempClinic2024!' || 'logi_clinic_salt', 'sha256'), 'hex');

  -- Vérifier si l'utilisateur existe (avec trim pour éviter les problèmes d'espaces)
  SELECT id, clinic_id INTO v_user_id, v_existing_clinic_id
  FROM users 
  WHERE LOWER(TRIM(email)) = LOWER(TRIM('bagarayannick1@gmail.com'));

  IF v_user_id IS NULL THEN
    -- Créer l'utilisateur admin
    INSERT INTO users (
      email,
      nom,
      prenom,
      password_hash,
      role,
      status,
      clinic_id,
      actif,
      created_by,
      created_at,
      updated_at
    )
    VALUES (
      LOWER(TRIM('bagarayannick1@gmail.com')),  -- S'assurer que l'email est propre
      'BAGARA',
      'Sabi Yannick',
      v_password_hash,
      'CLINIC_ADMIN',
      'PENDING',  -- Status PENDING pour forcer le changement de mot de passe
      v_clinic_id,
      true,
      v_super_admin_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE '✅ Utilisateur admin créé avec ID: %', v_user_id;
  ELSE
    -- Mettre à jour l'utilisateur pour s'assurer qu'il est correctement configuré
    UPDATE users
    SET 
      email = LOWER(TRIM(email)),  -- Nettoyer l'email s'il a des espaces
      clinic_id = v_clinic_id,  -- S'assurer qu'il est lié à la bonne clinique
      role = 'CLINIC_ADMIN',
      status = 'PENDING',  -- Forcer le changement de mot de passe
      actif = true,
      password_hash = COALESCE(password_hash, v_password_hash),
      updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Vérifier si le clinic_id était différent
    IF v_existing_clinic_id IS DISTINCT FROM v_clinic_id THEN
      RAISE NOTICE '⚠️ Utilisateur était lié à une autre clinique (%), maintenant lié à CAMPUS-001', v_existing_clinic_id;
    END IF;
    
    RAISE NOTICE '✅ Utilisateur admin mis à jour avec ID: %', v_user_id;
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : NETTOYER LES CODES TEMPORAIRES OBSOLÈTES
-- ============================================

-- Supprimer les codes temporaires pour CAMPUS-001 (car c'est un code permanent)
DELETE FROM clinic_temporary_codes
WHERE clinic_id IN (SELECT id FROM clinics WHERE code = 'CAMPUS-001');

-- ============================================
-- ÉTAPE 3.5 : VÉRIFIER/CORRIGER LES POLITIQUES RLS
-- ============================================

-- S'assurer que les cliniques actives sont accessibles pour la validation de code
DO $$
BEGIN
  -- Vérifier si la politique existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clinics' 
    AND policyname = 'clinic_users_read_own_clinic'
  ) THEN
    -- Créer la politique si elle n'existe pas
    CREATE POLICY "clinic_users_read_own_clinic" ON clinics
    FOR SELECT TO authenticated
    USING (
      id = get_my_clinic_id() 
      OR active = true  -- Permettre de voir les cliniques actives pour validation de code
    );
    
    RAISE NOTICE '✅ Politique RLS créée pour clinics';
  ELSE
    RAISE NOTICE 'ℹ️ Politique RLS existe déjà pour clinics';
  END IF;
  
  -- S'assurer que les utilisateurs anonymes peuvent aussi lire les cliniques actives (pour validation de code)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clinics' 
    AND policyname = 'anon_read_active_clinics'
  ) THEN
    CREATE POLICY "anon_read_active_clinics" ON clinics
    FOR SELECT TO anon
    USING (active = true);
    
    RAISE NOTICE '✅ Politique RLS anonyme créée pour clinics';
  ELSE
    RAISE NOTICE 'ℹ️ Politique RLS anonyme existe déjà pour clinics';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3.6 : CRÉER FONCTION POUR AUTHENTIFICATION (CONTOURNE RLS)
-- ============================================

-- Fonction pour authentifier un utilisateur sans être bloqué par RLS
-- Cette fonction permet de vérifier l'email et le clinic_id même pour les utilisateurs non authentifiés
CREATE OR REPLACE FUNCTION authenticate_user_by_email(
  p_email TEXT,
  p_clinic_id UUID
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  nom TEXT,
  prenom TEXT,
  role TEXT,
  status TEXT,
  clinic_id UUID,
  actif BOOLEAN,
  password_hash TEXT,
  auth_user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    u.password_hash,
    u.auth_user_id
  FROM users u
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
    AND u.clinic_id = p_clinic_id
    AND u.actif = true;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction authenticate_user_by_email créée';
END $$;

-- ============================================
-- ÉTAPE 4 : VÉRIFICATION ET AFFICHAGE DES INFORMATIONS
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_clinic_name TEXT;
  v_clinic_active BOOLEAN;
  v_user_email TEXT;
  v_user_status TEXT;
  v_user_role TEXT;
BEGIN
  -- Récupérer les informations de la clinique
  SELECT id, name, active INTO v_clinic_id, v_clinic_name, v_clinic_active
  FROM clinics WHERE code = 'CAMPUS-001';

  -- Récupérer les informations de l'utilisateur
  SELECT email, status, role INTO v_user_email, v_user_status, v_user_role
  FROM users 
  WHERE clinic_id = v_clinic_id 
    AND role = 'CLINIC_ADMIN'
  LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ CONFIGURATION CAMPUS-001 TERMINÉE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 INFORMATIONS DE CONNEXION:';
  RAISE NOTICE '';
  RAISE NOTICE '   Code clinique: CAMPUS-001';
  RAISE NOTICE '   Email: bagarayannick1@gmail.com';
  RAISE NOTICE '   Mot de passe: TempClinic2024!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ÉTAT:';
  RAISE NOTICE '   Clinique: % (ID: %)', v_clinic_name, v_clinic_id;
  RAISE NOTICE '   Active: %', CASE WHEN v_clinic_active THEN 'Oui' ELSE 'Non' END;
  RAISE NOTICE '   Admin: %', v_user_email;
  RAISE NOTICE '   Statut: %', v_user_status;
  RAISE NOTICE '   Rôle: %', v_user_role;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTE IMPORTANTE:';
  RAISE NOTICE '   À la première connexion, vous devrez changer votre mot de passe.';
  RAISE NOTICE '   Le code clinique CAMPUS-001 est permanent et ne peut pas être modifié.';
  RAISE NOTICE '';
END $$;

-- ============================================
-- ÉTAPE 5 : AFFICHER LES INFORMATIONS DÉTAILLÉES
-- ============================================

SELECT 
  'CAMPUS-001' as code_clinique,
  c.name as nom_clinique,
  c.active as active,
  c.is_demo as est_demo,
  u.email as email_admin,
  u.role as role_admin,
  u.status as statut_admin,
  u.actif as admin_actif,
  CASE 
    WHEN u.status = 'PENDING' THEN 'Changement de mot de passe requis'
    WHEN u.status = 'ACTIVE' THEN 'Compte actif'
    ELSE u.status
  END as note_connexion
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id AND u.role = 'CLINIC_ADMIN'
WHERE c.code = 'CAMPUS-001';

