-- ============================================
-- MIGRATION COMPLÈTE : MULTI-TENANCY FONCTIONNEL
-- VERSION: 16
-- ============================================
-- Ce script implémente un système Multi-Tenancy complet et fonctionnel :
-- Phase 1: Infrastructure Base de Données
-- Phase 2: Automatisation & Sécurité RLS
-- Phase 3: Helpers et Triggers
-- ============================================

-- ============================================
-- PHASE 1.1 : TABLE CLINICS
-- ============================================

-- S'assurer que la table clinics existe avec tous les champs requis
CREATE TABLE IF NOT EXISTS clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  active BOOLEAN DEFAULT true,
  is_demo BOOLEAN DEFAULT false,
  is_temporary_code BOOLEAN DEFAULT false,
  requires_code_change BOOLEAN DEFAULT false,
  created_by_super_admin UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics' 
    AND column_name = 'is_demo'
  ) THEN
    ALTER TABLE clinics ADD COLUMN is_demo BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics' 
    AND column_name = 'clinic_code'
  ) THEN
    -- Ajouter alias clinic_code qui pointe vers code
    COMMENT ON COLUMN clinics.code IS 'Code unique de la clinique (aussi appelé clinic_code)';
  END IF;
END $$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_clinics_code ON clinics(code);
CREATE INDEX IF NOT EXISTS idx_clinics_active ON clinics(active);
CREATE INDEX IF NOT EXISTS idx_clinics_is_demo ON clinics(is_demo);

-- ============================================
-- PHASE 1.2 : TABLE PROFILES (USERS)
-- ============================================

-- S'assurer que la table users existe avec les champs de multi-tenancy
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID UNIQUE,
  nom VARCHAR(255),
  prenom VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  password_hash TEXT,
  role VARCHAR(50) DEFAULT 'STAFF',
  status VARCHAR(50) DEFAULT 'PENDING',
  specialite VARCHAR(255),
  telephone VARCHAR(50),
  adresse TEXT,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  actif BOOLEAN DEFAULT true,
  first_login_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter clinic_id si manquant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE users ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'PENDING';
  END IF;
END $$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- PHASE 1.3 : TABLE REGISTRATION_REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT,
  telephone VARCHAR(50),
  adresse TEXT,
  role_souhaite VARCHAR(50) DEFAULT 'STAFF',
  specialite VARCHAR(255),
  security_questions JSONB,
  clinic_code VARCHAR(50),
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  statut VARCHAR(50) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  raison_rejet TEXT,
  date_approbation TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_registration_requests_clinic_id ON registration_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_statut ON registration_requests(statut);
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON registration_requests(email);

-- ============================================
-- PHASE 1.4 : FONCTIONS HELPERS DE SÉCURITÉ
-- ============================================

-- Fonction pour obtenir l'ID de clinique de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- Récupérer le clinic_id de l'utilisateur depuis la table users
  SELECT clinic_id INTO v_clinic_id
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_clinic_id;
END;
$$;

-- Alias pour compatibilité
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

-- Fonction pour vérifier si l'utilisateur est Admin de sa clinique
CREATE OR REPLACE FUNCTION check_is_clinic_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_role IN ('CLINIC_ADMIN', 'ADMIN', 'SUPER_ADMIN');
END;
$$;

-- Fonction pour vérifier si l'utilisateur est Super Admin
CREATE OR REPLACE FUNCTION check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_role = 'SUPER_ADMIN';
END;
$$;

-- Fonction pour obtenir le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'ANONYMOUS');
END;
$$;

-- ============================================
-- PHASE 1.5 : FONCTION ADMIN_CREATE_CLINIC
-- ============================================

-- Fonction pour créer une clinique complète avec admin
CREATE OR REPLACE FUNCTION admin_create_clinic(
  p_clinic_name TEXT,
  p_clinic_code TEXT,
  p_admin_email TEXT,
  p_admin_password TEXT,
  p_admin_nom TEXT DEFAULT 'Admin',
  p_admin_prenom TEXT DEFAULT 'Clinique',
  p_is_demo BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
  v_user_id UUID;
  v_auth_user_id UUID;
  v_result JSONB;
BEGIN
  -- Vérifier que l'appelant est Super Admin
  IF NOT check_is_super_admin() THEN
    RAISE EXCEPTION 'Seul un Super Admin peut créer une clinique';
  END IF;

  -- Vérifier que le code clinique n'existe pas déjà
  IF EXISTS (SELECT 1 FROM clinics WHERE code = UPPER(TRIM(p_clinic_code))) THEN
    RAISE EXCEPTION 'Le code clinique % existe déjà', p_clinic_code;
  END IF;

  -- Créer la clinique
  INSERT INTO clinics (code, name, is_demo, active, created_by_super_admin)
  VALUES (
    UPPER(TRIM(p_clinic_code)),
    p_clinic_name,
    p_is_demo,
    true,
    auth.uid()
  )
  RETURNING id INTO v_clinic_id;

  -- Créer l'utilisateur admin dans auth.users via Supabase Admin API
  -- Note: Cette partie doit être exécutée via l'API Supabase Admin
  -- Ici on crée uniquement l'entrée dans la table users
  
  INSERT INTO users (
    email,
    nom,
    prenom,
    role,
    status,
    clinic_id,
    actif,
    created_by
  )
  VALUES (
    LOWER(TRIM(p_admin_email)),
    p_admin_nom,
    p_admin_prenom,
    'CLINIC_ADMIN',
    'PENDING',  -- Devra changer son mot de passe
    v_clinic_id,
    true,
    auth.uid()
  )
  RETURNING id INTO v_user_id;

  -- Construire le résultat
  v_result := jsonb_build_object(
    'success', true,
    'clinic_id', v_clinic_id,
    'clinic_code', UPPER(TRIM(p_clinic_code)),
    'clinic_name', p_clinic_name,
    'admin_user_id', v_user_id,
    'admin_email', p_admin_email,
    'message', 'Clinique créée. L''admin doit être créé dans Supabase Auth séparément.'
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================
-- PHASE 2.1 : TRIGGER INSCRIPTION AUTOMATIQUE
-- ============================================

-- Fonction de gestion des nouvelles inscriptions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
  v_clinic_code TEXT;
  v_user_role TEXT;
BEGIN
  -- Récupérer le clinic_code depuis les métadonnées
  v_clinic_code := NEW.raw_user_meta_data->>'clinic_code';
  
  -- Si pas de clinic_code, c'est peut-être un super admin ou une erreur
  IF v_clinic_code IS NULL OR v_clinic_code = '' THEN
    -- Vérifier si c'est le premier utilisateur (devient Super Admin)
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'SUPER_ADMIN') THEN
      INSERT INTO users (
        auth_user_id,
        email,
        nom,
        prenom,
        role,
        status,
        actif
      )
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nom', 'Super'),
        COALESCE(NEW.raw_user_meta_data->>'prenom', 'Admin'),
        'SUPER_ADMIN',
        'ACTIVE',
        true
      );
    END IF;
    RETURN NEW;
  END IF;

  -- Valider le code clinique
  SELECT id INTO v_clinic_id
  FROM clinics
  WHERE code = UPPER(TRIM(v_clinic_code))
    AND active = true;

  -- Si non trouvé, chercher dans les codes temporaires
  IF v_clinic_id IS NULL THEN
    SELECT clinic_id INTO v_clinic_id
    FROM clinic_temporary_codes
    WHERE temporary_code = UPPER(TRIM(v_clinic_code))
      AND is_converted = false
      AND expires_at > NOW();
  END IF;

  -- Si toujours pas trouvé, créer quand même mais sans clinique
  IF v_clinic_id IS NULL THEN
    RAISE WARNING 'Code clinique invalide: %. L''utilisateur sera créé sans clinique assignée.', v_clinic_code;
  END IF;

  -- Déterminer le rôle depuis les métadonnées ou par défaut STAFF
  v_user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'STAFF');

  -- Créer le profil utilisateur avec status pending
  INSERT INTO users (
    auth_user_id,
    email,
    nom,
    prenom,
    role,
    status,
    clinic_id,
    specialite,
    telephone,
    actif
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    v_user_role,
    'PENDING',  -- Status pending en attente de validation
    v_clinic_id,
    NEW.raw_user_meta_data->>'specialite',
    NEW.raw_user_meta_data->>'telephone',
    false  -- Inactif jusqu'à validation par admin
  );

  RETURN NEW;
END;
$$;

-- Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- PHASE 2.2 : ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur la table clinics
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Politiques pour clinics
DROP POLICY IF EXISTS "super_admin_all_clinics" ON clinics;
CREATE POLICY "super_admin_all_clinics" ON clinics
FOR ALL TO authenticated
USING (check_is_super_admin());

DROP POLICY IF EXISTS "clinic_users_read_own_clinic" ON clinics;
CREATE POLICY "clinic_users_read_own_clinic" ON clinics
FOR SELECT TO authenticated
USING (
  id = get_my_clinic_id() 
  OR active = true  -- Permettre de voir les cliniques actives pour validation de code
);

-- Activer RLS sur la table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politiques pour users
DROP POLICY IF EXISTS "super_admin_all_users" ON users;
CREATE POLICY "super_admin_all_users" ON users
FOR ALL TO authenticated
USING (check_is_super_admin());

DROP POLICY IF EXISTS "clinic_admin_manage_clinic_users" ON users;
CREATE POLICY "clinic_admin_manage_clinic_users" ON users
FOR ALL TO authenticated
USING (
  clinic_id = get_my_clinic_id() 
  AND check_is_clinic_admin()
);

DROP POLICY IF EXISTS "users_read_own_profile" ON users;
CREATE POLICY "users_read_own_profile" ON users
FOR SELECT TO authenticated
USING (
  auth_user_id = auth.uid()
  OR clinic_id = get_my_clinic_id()
);

DROP POLICY IF EXISTS "users_update_own_profile" ON users;
CREATE POLICY "users_update_own_profile" ON users
FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Activer RLS sur registration_requests
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_requests" ON registration_requests;
CREATE POLICY "super_admin_all_requests" ON registration_requests
FOR ALL TO authenticated
USING (check_is_super_admin());

DROP POLICY IF EXISTS "clinic_admin_manage_requests" ON registration_requests;
CREATE POLICY "clinic_admin_manage_requests" ON registration_requests
FOR ALL TO authenticated
USING (
  clinic_id = get_my_clinic_id()
  AND check_is_clinic_admin()
);

DROP POLICY IF EXISTS "anon_insert_requests" ON registration_requests;
CREATE POLICY "anon_insert_requests" ON registration_requests
FOR INSERT TO anon
WITH CHECK (true);

-- ============================================
-- PHASE 2.3 : RLS SUR TABLES MÉTIER PRINCIPALES
-- ============================================

-- Fonction helper pour créer les politiques RLS standard
CREATE OR REPLACE FUNCTION create_clinic_rls_policies(p_table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Activer RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table_name);
  
  -- Supprimer les anciennes politiques
  EXECUTE format('DROP POLICY IF EXISTS "super_admin_all_%s" ON %I', 
                 replace(p_table_name, '.', '_'), p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "clinic_users_own_%s" ON %I', 
                 replace(p_table_name, '.', '_'), p_table_name);
  
  -- Politique Super Admin (accès total)
  EXECUTE format('
    CREATE POLICY "super_admin_all_%s" ON %I
    FOR ALL TO authenticated
    USING (check_is_super_admin())',
    replace(p_table_name, '.', '_'), p_table_name);
  
  -- Politique utilisateurs de la clinique
  EXECUTE format('
    CREATE POLICY "clinic_users_own_%s" ON %I
    FOR ALL TO authenticated
    USING (clinic_id = get_my_clinic_id())
    WITH CHECK (clinic_id = get_my_clinic_id())',
    replace(p_table_name, '.', '_'), p_table_name);
  
  RAISE NOTICE '✅ RLS activé pour %', p_table_name;
END;
$$ LANGUAGE plpgsql;

-- Appliquer RLS aux tables métier existantes
DO $$
DECLARE
  tables_to_secure TEXT[] := ARRAY[
    'patients',
    'consultations',
    'prescriptions',
    'lab_requests',
    'imaging_requests',
    'factures',
    'paiements',
    'journal_caisse',
    'audit_log'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_to_secure
  LOOP
    -- Vérifier si la table existe ET a clinic_id
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'clinic_id'
    ) THEN
      PERFORM create_clinic_rls_policies(tbl);
    ELSE
      RAISE NOTICE '⚠️ Table % ignorée (n''existe pas ou pas de clinic_id)', tbl;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- PHASE 2.4 : PROTECTION CLINIQUE DÉMO
-- ============================================

-- Fonction pour vérifier si une modification touche la démo
CREATE OR REPLACE FUNCTION protect_demo_clinic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_demo BOOLEAN;
  v_is_super_admin BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur est super admin
  v_is_super_admin := check_is_super_admin();
  
  -- Si super admin, autoriser toutes les modifications
  IF v_is_super_admin THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Pour DELETE, vérifier l'ancien enregistrement
  IF TG_OP = 'DELETE' THEN
    SELECT c.is_demo INTO v_is_demo
    FROM clinics c
    WHERE c.id = OLD.clinic_id;
    
    IF v_is_demo THEN
      RAISE EXCEPTION 'Impossible de supprimer des données de la clinique démo';
    END IF;
    RETURN OLD;
  END IF;

  -- Pour UPDATE, vérifier l'ancien ET le nouveau
  IF TG_OP = 'UPDATE' THEN
    SELECT c.is_demo INTO v_is_demo
    FROM clinics c
    WHERE c.id = OLD.clinic_id;
    
    IF v_is_demo THEN
      RAISE EXCEPTION 'Impossible de modifier des données de la clinique démo';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Appliquer la protection démo aux tables principales
DO $$
DECLARE
  tables_to_protect TEXT[] := ARRAY[
    'patients',
    'consultations',
    'prescriptions'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_to_protect
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'clinic_id'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS protect_demo_%s ON %I', 
                     replace(tbl, '.', '_'), tbl);
      EXECUTE format('
        CREATE TRIGGER protect_demo_%s
        BEFORE UPDATE OR DELETE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION protect_demo_clinic()',
        replace(tbl, '.', '_'), tbl);
      RAISE NOTICE '✅ Protection démo activée pour %', tbl;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- PHASE 3 : FONCTIONS DE VALIDATION
-- ============================================

-- Fonction pour valider le code clinique (accessible publiquement)
CREATE OR REPLACE FUNCTION validate_clinic_code(p_clinic_code TEXT)
RETURNS TABLE(
  clinic_id UUID,
  clinic_name TEXT,
  is_valid BOOLEAN,
  is_demo BOOLEAN,
  is_active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- D'abord chercher dans la table clinics
  RETURN QUERY
  SELECT 
    c.id as clinic_id,
    c.name as clinic_name,
    true as is_valid,
    COALESCE(c.is_demo, false) as is_demo,
    c.active as is_active
  FROM clinics c
  WHERE c.code = UPPER(TRIM(p_clinic_code))
    AND c.active = true;
  
  -- Si aucun résultat, chercher dans les codes temporaires
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      c.id as clinic_id,
      c.name as clinic_name,
      true as is_valid,
      COALESCE(c.is_demo, false) as is_demo,
      c.active as is_active
    FROM clinic_temporary_codes ctc
    JOIN clinics c ON c.id = ctc.clinic_id
    WHERE ctc.temporary_code = UPPER(TRIM(p_clinic_code))
      AND ctc.is_converted = false
      AND ctc.expires_at > NOW()
      AND c.active = true;
  END IF;
END;
$$;

-- Fonction pour valider le statut d'un utilisateur (admin)
CREATE OR REPLACE FUNCTION admin_validate_user(
  p_user_id UUID,
  p_new_status TEXT DEFAULT 'ACTIVE'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_clinic_id UUID;
  v_admin_clinic_id UUID;
BEGIN
  -- Vérifier que l'appelant est admin de clinique ou super admin
  IF NOT check_is_clinic_admin() AND NOT check_is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée');
  END IF;

  -- Récupérer le clinic_id de l'utilisateur à valider
  SELECT clinic_id INTO v_user_clinic_id FROM users WHERE id = p_user_id;
  
  -- Récupérer le clinic_id de l'admin
  v_admin_clinic_id := get_my_clinic_id();
  
  -- Vérifier que l'admin peut valider cet utilisateur
  IF NOT check_is_super_admin() AND v_user_clinic_id != v_admin_clinic_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous ne pouvez valider que les utilisateurs de votre clinique');
  END IF;

  -- Mettre à jour le statut
  UPDATE users 
  SET 
    status = p_new_status,
    actif = (p_new_status = 'ACTIVE'),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', format('Statut de l''utilisateur mis à jour: %s', p_new_status)
  );
END;
$$;

-- ============================================
-- PHASE 4.1 : SCRIPT DE RESET CLINIQUES NON-DÉMO
-- ============================================

-- Fonction pour réinitialiser les données des cliniques non-démo
CREATE OR REPLACE FUNCTION reset_non_demo_clinics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_patients INT := 0;
  v_deleted_consultations INT := 0;
  v_deleted_users INT := 0;
  v_non_demo_clinic_ids UUID[];
BEGIN
  -- Vérifier super admin
  IF NOT check_is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée');
  END IF;

  -- Récupérer les IDs des cliniques non-démo
  SELECT ARRAY_AGG(id) INTO v_non_demo_clinic_ids
  FROM clinics
  WHERE is_demo = false OR is_demo IS NULL;

  IF v_non_demo_clinic_ids IS NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'Aucune clinique non-démo à réinitialiser');
  END IF;

  -- Supprimer les données dans l'ordre pour respecter les contraintes FK
  
  -- Prescriptions
  DELETE FROM prescriptions WHERE clinic_id = ANY(v_non_demo_clinic_ids);
  
  -- Consultations
  WITH deleted AS (
    DELETE FROM consultations WHERE clinic_id = ANY(v_non_demo_clinic_ids) RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_consultations FROM deleted;
  
  -- Patients
  WITH deleted AS (
    DELETE FROM patients WHERE clinic_id = ANY(v_non_demo_clinic_ids) RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_patients FROM deleted;
  
  -- Utilisateurs (sauf admins)
  WITH deleted AS (
    DELETE FROM users 
    WHERE clinic_id = ANY(v_non_demo_clinic_ids) 
      AND role NOT IN ('CLINIC_ADMIN', 'SUPER_ADMIN')
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_users FROM deleted;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_patients', v_deleted_patients,
    'deleted_consultations', v_deleted_consultations,
    'deleted_users', v_deleted_users,
    'clinics_affected', array_length(v_non_demo_clinic_ids, 1)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- INITIALISATION : CLINIQUE DÉMO CLINIC001
-- ============================================

-- S'assurer que la clinique démo existe
INSERT INTO clinics (code, name, is_demo, active)
VALUES ('CLINIC001', 'Clinique Démo', true, true)
ON CONFLICT (code) DO UPDATE SET is_demo = true;

-- Marquer la clinique démo
UPDATE clinics SET is_demo = true WHERE code = 'CLINIC001';

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  v_clinics_count INT;
  v_users_count INT;
  v_tables_with_rls INT;
  v_functions_count INT;
BEGIN
  SELECT COUNT(*) INTO v_clinics_count FROM clinics;
  SELECT COUNT(*) INTO v_users_count FROM users;
  
  SELECT COUNT(DISTINCT tablename) INTO v_tables_with_rls
  FROM pg_policies WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO v_functions_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname IN ('get_my_clinic_id', 'check_is_clinic_admin', 'check_is_super_admin');
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ MIGRATION MULTI-TENANCY V16 TERMINÉE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   - Cliniques: %', v_clinics_count;
  RAISE NOTICE '   - Utilisateurs: %', v_users_count;
  RAISE NOTICE '   - Tables avec RLS: %', v_tables_with_rls;
  RAISE NOTICE '   - Fonctions helpers: %', v_functions_count;
  RAISE NOTICE '';
  RAISE NOTICE '📝 Fonctions disponibles:';
  RAISE NOTICE '   - get_my_clinic_id()';
  RAISE NOTICE '   - check_is_clinic_admin()';
  RAISE NOTICE '   - check_is_super_admin()';
  RAISE NOTICE '   - admin_create_clinic()';
  RAISE NOTICE '   - admin_validate_user()';
  RAISE NOTICE '   - validate_clinic_code()';
  RAISE NOTICE '   - reset_non_demo_clinics()';
  RAISE NOTICE '';
END $$;

-- Afficher l'état des cliniques
SELECT 
  code,
  name,
  active,
  COALESCE(is_demo, false) as is_demo,
  created_at
FROM clinics
ORDER BY is_demo DESC, code;

