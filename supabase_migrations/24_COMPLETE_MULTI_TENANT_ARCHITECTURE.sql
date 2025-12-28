-- ============================================
-- MIGRATION COMPLÈTE : ARCHITECTURE MULTI-TENANT SÉCURISÉE
-- VERSION: 24
-- DATE: 2025-01-XX
-- ============================================
-- Cette migration implémente le système LogiClinic.org selon les spécifications :
-- 1. Création automatique de clinique avec admin
-- 2. Isolation stricte des données (id_clinique partout)
-- 3. RLS renforcé sur toutes les tables
-- 4. Système de connexion multi-clinic
-- ============================================

-- ============================================
-- ÉTAPE 0 : CRÉER LES TABLES DE BASE SI ELLES N'EXISTENT PAS
-- ============================================

-- Table clinics
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

-- Table users
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

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_clinics_code ON clinics(code);
CREATE INDEX IF NOT EXISTS idx_clinics_active ON clinics(active);
CREATE INDEX IF NOT EXISTS idx_clinics_is_demo ON clinics(is_demo);
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- ÉTAPE 1 : AJOUTER clinic_id À TOUTES LES TABLES MÉTIER
-- ============================================

-- Fonction helper pour ajouter clinic_id si manquant
DO $$
DECLARE
  v_table_name TEXT;
  v_tables TEXT[] := ARRAY[
    'patients', 'consultations', 'prescriptions', 'medicaments', 
    'lots', 'mouvements_stock', 'transferts', 'transfert_lignes',
    'dispensations', 'dispensation_lignes', 'alertes_stock',
    'inventaires', 'inventaire_lignes', 'pertes_retours',
    'consultation_templates', 'consultation_entries', 'consultation_constantes',
    'protocols', 'prescription_lines', 'lab_requests', 'imaging_requests',
    'motifs', 'diagnostics'
  ];
BEGIN
  FOREACH v_table_name IN ARRAY v_tables
  LOOP
    -- Vérifier si la colonne existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = v_table_name 
      AND column_name = 'clinic_id'
    ) THEN
      -- Ajouter la colonne clinic_id
      EXECUTE format('ALTER TABLE %I ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE', v_table_name);
      
      -- Rendre la colonne NOT NULL après avoir assigné les données existantes
      -- Pour l'instant, on laisse nullable pour les données existantes
      EXECUTE format('COMMENT ON COLUMN %I.clinic_id IS ''ID de la clinique - OBLIGATOIRE pour isolation des données''', v_table_name);
      
      RAISE NOTICE '✅ Colonne clinic_id ajoutée à la table %', v_table_name;
    ELSE
      RAISE NOTICE 'ℹ️  Colonne clinic_id existe déjà dans la table %', v_table_name;
    END IF;
    
    -- Ajouter un index pour performance
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = v_table_name 
      AND indexname = format('idx_%s_clinic_id', v_table_name)
    ) THEN
      EXECUTE format('CREATE INDEX idx_%s_clinic_id ON %I(clinic_id)', v_table_name, v_table_name);
    END IF;
  END LOOP;
END $$;

-- ============================================
-- ÉTAPE 2 : ASSIGNER clinic_id AUX DONNÉES EXISTANTES
-- ============================================

DO $$
DECLARE
  v_clinic_demo_id UUID;
  v_updated_count INT;
BEGIN
  -- Récupérer l'ID de la clinique démo (CLINIC001)
  SELECT id INTO v_clinic_demo_id 
  FROM clinics 
  WHERE code = 'CLINIC001' 
  LIMIT 1;
  
  -- Si pas de clinique démo, créer une clinique par défaut
  IF v_clinic_demo_id IS NULL THEN
    INSERT INTO clinics (code, name, active, is_demo)
    VALUES ('CLINIC001', 'Clinique Démo', true, true)
    RETURNING id INTO v_clinic_demo_id;
    RAISE NOTICE '✅ Clinique démo CLINIC001 créée';
  END IF;
  
  -- Assigner clinic_id aux données existantes sans clinic_id
  -- Patients
  UPDATE patients SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '   - % patients assignés à CLINIC001', v_updated_count;
  END IF;
  
  -- Consultations
  UPDATE consultations SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '   - % consultations assignées à CLINIC001', v_updated_count;
  END IF;
  
  -- Prescriptions
  UPDATE prescriptions SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '   - % prescriptions assignées à CLINIC001', v_updated_count;
  END IF;
  
  -- Médicaments
  UPDATE medicaments SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '   - % médicaments assignés à CLINIC001', v_updated_count;
  END IF;
  
  -- Lots (via medicament_id)
  UPDATE lots l
  SET clinic_id = v_clinic_demo_id
  FROM medicaments m
  WHERE l.medicament_id = m.id
    AND l.clinic_id IS NULL
    AND m.clinic_id = v_clinic_demo_id;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '   - % lots assignés à CLINIC001', v_updated_count;
  END IF;
  
  -- Autres tables liées
  UPDATE consultation_constantes SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE consultation_entries SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE protocols SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE prescription_lines SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE lab_requests SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE imaging_requests SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  
  -- Tables de stock
  UPDATE mouvements_stock SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE transferts SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE transfert_lignes SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE dispensations SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE dispensation_lignes SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE alertes_stock SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE inventaires SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE inventaire_lignes SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE pertes_retours SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  
  -- Tables de référence (peuvent être partagées ou par clinique)
  -- On les laisse NULL pour l'instant, mais on peut les assigner si nécessaire
  UPDATE motifs SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE diagnostics SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  UPDATE consultation_templates SET clinic_id = v_clinic_demo_id WHERE clinic_id IS NULL;
  
  RAISE NOTICE '✅ Toutes les données existantes ont été assignées à CLINIC001';
END $$;

-- ============================================
-- ÉTAPE 3 : FONCTION CRÉATION AUTOMATIQUE CLINIQUE + ADMIN
-- ============================================

-- Fonction améliorée pour créer une clinique avec son admin automatiquement
CREATE OR REPLACE FUNCTION super_admin_create_clinic(
  p_clinic_name TEXT,
  p_clinic_address TEXT DEFAULT NULL,
  p_clinic_phone TEXT DEFAULT NULL,
  p_clinic_email TEXT DEFAULT NULL,
  p_admin_email TEXT,
  p_admin_nom TEXT DEFAULT 'Admin',
  p_admin_prenom TEXT DEFAULT 'Clinique',
  p_admin_telephone TEXT DEFAULT NULL,
  p_is_demo BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
  v_clinic_code TEXT;
  v_user_id UUID;
  v_password_hash TEXT;
  v_temp_password TEXT;
  v_result JSONB;
  v_year TEXT;
  v_sequence_num INT;
BEGIN
  -- Vérifier que l'appelant est Super Admin
  -- Note: Pour la première exécution, on peut bypass cette vérification
  -- En production, cette vérification sera active
  IF EXISTS (SELECT 1 FROM users WHERE role = 'SUPER_ADMIN') THEN
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'SUPER_ADMIN' AND auth_user_id = auth.uid()) THEN
      RAISE EXCEPTION 'Seul un Super Admin peut créer une clinique';
    END IF;
  END IF;
  
  -- Générer le code clinique unique (format: CLIN-YYYY-XXX)
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  -- Trouver le prochain numéro de séquence pour cette année
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 'CLIN-\d{4}-(\d+)') AS INT)), 0) + 1
  INTO v_sequence_num
  FROM clinics
  WHERE code LIKE 'CLIN-' || v_year || '-%';
  
  -- Générer le code
  v_clinic_code := 'CLIN-' || v_year || '-' || LPAD(v_sequence_num::TEXT, 3, '0');
  
  -- Vérifier que le code n'existe pas (sécurité)
  IF EXISTS (SELECT 1 FROM clinics WHERE code = v_clinic_code) THEN
    RAISE EXCEPTION 'Le code clinique généré existe déjà: %', v_clinic_code;
  END IF;
  
  -- Générer un mot de passe temporaire sécurisé
  v_temp_password := 'Temp' || SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8) || '!';
  
  -- Hasher le mot de passe
  v_password_hash := encode(digest(v_temp_password || 'logi_clinic_salt', 'sha256'), 'hex');
  
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
    v_clinic_code,
    p_clinic_name,
    p_clinic_address,
    p_clinic_phone,
    p_clinic_email,
    true,
    p_is_demo,
    false,
    false,
    auth.uid(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_clinic_id;
  
  -- Créer l'admin de la clinique
  INSERT INTO users (
    email,
    nom,
    prenom,
    telephone,
    role,
    status,
    clinic_id,
    actif,
    password_hash,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    LOWER(TRIM(p_admin_email)),
    p_admin_nom,
    p_admin_prenom,
    p_admin_telephone,
    'CLINIC_ADMIN',
    'PENDING',  -- Devra changer son mot de passe à la première connexion
    v_clinic_id,
    true,
    v_password_hash,
    auth.uid(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;
  
  -- Construire le résultat
  v_result := jsonb_build_object(
    'success', true,
    'clinic', jsonb_build_object(
      'id', v_clinic_id,
      'code', v_clinic_code,
      'name', p_clinic_name,
      'active', true
    ),
    'admin', jsonb_build_object(
      'id', v_user_id,
      'email', p_admin_email,
      'nom', p_admin_nom,
      'prenom', p_admin_prenom,
      'role', 'CLINIC_ADMIN',
      'status', 'PENDING'
    ),
    'temp_password', v_temp_password,
    'message', 'Clinique créée avec succès. L''admin doit se connecter avec le code clinique et changer son mot de passe.'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

-- Permettre l'exécution par les Super Admins
GRANT EXECUTE ON FUNCTION super_admin_create_clinic TO authenticated;

-- Commentaire
COMMENT ON FUNCTION super_admin_create_clinic IS 
'Crée automatiquement une clinique avec son admin. Génère un code clinique unique (CLIN-YYYY-XXX) et un mot de passe temporaire pour l''admin.';

-- ============================================
-- ÉTAPE 4 : RENFORCER LES POLITIQUES RLS
-- ============================================

-- Activer RLS sur toutes les tables métier
DO $$
DECLARE
  v_table_name TEXT;
  v_tables TEXT[] := ARRAY[
    'patients', 'consultations', 'prescriptions', 'medicaments', 
    'lots', 'mouvements_stock', 'transferts', 'transfert_lignes',
    'dispensations', 'dispensation_lignes', 'alertes_stock',
    'inventaires', 'inventaire_lignes', 'pertes_retours',
    'consultation_templates', 'consultation_entries', 'consultation_constantes',
    'protocols', 'prescription_lines', 'lab_requests', 'imaging_requests',
    'motifs', 'diagnostics'
  ];
BEGIN
  FOREACH v_table_name IN ARRAY v_tables
  LOOP
    -- Activer RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', v_table_name);
    
    -- Supprimer les anciennes politiques
    EXECUTE format('DROP POLICY IF EXISTS "clinic_isolation_%s" ON %I', v_table_name, v_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "super_admin_all_%s" ON %I', v_table_name, v_table_name);
    
    -- Politique pour les utilisateurs : accès uniquement à leur clinique
    EXECUTE format('
      CREATE POLICY "clinic_isolation_%s" ON %I
      FOR ALL TO authenticated
      USING (
        clinic_id = get_current_user_clinic_id()
        OR check_is_super_admin()
      )
      WITH CHECK (
        clinic_id = get_current_user_clinic_id()
        OR check_is_super_admin()
      )
    ', v_table_name, v_table_name);
    
    RAISE NOTICE '✅ RLS activé et politique créée pour la table %', v_table_name;
  END LOOP;
END $$;

-- ============================================
-- ÉTAPE 4.5 : CRÉER LES FONCTIONS HELPER SI ELLES N'EXISTENT PAS
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
  
  RETURN COALESCE(v_role = 'SUPER_ADMIN', false);
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
  
  RETURN COALESCE(v_role = 'CLINIC_ADMIN', false);
END;
$$;

-- ============================================
-- ÉTAPE 5 : FONCTION HELPER POUR RÉCUPÉRER clinic_id DEPUIS LE CODE
-- ============================================

-- Fonction pour récupérer clinic_id depuis le code clinique (pour connexion)
CREATE OR REPLACE FUNCTION get_clinic_id_by_code(p_clinic_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id
  FROM clinics
  WHERE code = UPPER(TRIM(p_clinic_code))
    AND active = true
  LIMIT 1;
  
  RETURN v_clinic_id;
END;
$$;

-- Permettre l'exécution publique (pour validation de code avant connexion)
GRANT EXECUTE ON FUNCTION get_clinic_id_by_code(TEXT) TO anon, authenticated;

-- ============================================
-- ÉTAPE 6 : FONCTION DE CONNEXION MULTI-CLINIC
-- ============================================

-- Fonction pour valider les credentials avec code clinique
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
  v_user_id UUID;
  v_user_record RECORD;
  v_password_hash TEXT;
  v_result JSONB;
BEGIN
  -- Récupérer l'ID de la clinique
  v_clinic_id := get_clinic_id_by_code(p_clinic_code);
  
  IF v_clinic_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Code clinique invalide ou clinique inactive'
    );
  END IF;
  
  -- Récupérer l'utilisateur
  SELECT * INTO v_user_record
  FROM users
  WHERE email = LOWER(TRIM(p_email))
    AND clinic_id = v_clinic_id
    AND actif = true
  LIMIT 1;
  
  IF v_user_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé ou inactif'
    );
  END IF;
  
  -- Vérifier le mot de passe
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
  
  -- Mettre à jour la dernière connexion
  UPDATE users
  SET last_login = NOW(),
      first_login_at = COALESCE(first_login_at, NOW())
  WHERE id = v_user_record.id;
  
  -- Construire le résultat
  v_result := jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user_record.id,
      'email', v_user_record.email,
      'nom', v_user_record.nom,
      'prenom', v_user_record.prenom,
      'role', v_user_record.role,
      'status', v_user_record.status,
      'clinic_id', v_user_record.clinic_id,
      'clinic_code', p_clinic_code,
      'requires_password_change', v_user_record.status = 'PENDING'
    )
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

-- Permettre l'exécution publique (pour connexion)
GRANT EXECUTE ON FUNCTION validate_clinic_login(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ============================================
-- ÉTAPE 7 : VÉRIFICATIONS FINALES
-- ============================================

DO $$
DECLARE
  v_tables_without_clinic_id INT;
  v_rls_disabled INT;
  v_clinics_count INT;
  v_demo_clinic_exists BOOLEAN;
BEGIN
  -- Vérifier que toutes les tables métier ont clinic_id
  SELECT COUNT(*) INTO v_tables_without_clinic_id
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT IN ('clinics', 'users', 'clinic_temporary_codes', 'registration_requests', 'schema_migrations')
    AND t.table_name NOT LIKE 'pg_%'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name 
      AND column_name = 'clinic_id'
    );
  
  IF v_tables_without_clinic_id > 0 THEN
    RAISE WARNING '⚠️  % tables métier n''ont pas encore clinic_id', v_tables_without_clinic_id;
  ELSE
    RAISE NOTICE '✅ Toutes les tables métier ont clinic_id';
  END IF;
  
  -- Vérifier RLS
  SELECT COUNT(*) INTO v_rls_disabled
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT IN ('schema_migrations')
    AND t.table_name NOT LIKE 'pg_%'
    AND NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = t.table_name 
      AND rowsecurity = true
    );
  
  IF v_rls_disabled > 0 THEN
    RAISE WARNING '⚠️  % tables n''ont pas RLS activé', v_rls_disabled;
  ELSE
    RAISE NOTICE '✅ RLS activé sur toutes les tables';
  END IF;
  
  -- Vérifier les cliniques
  SELECT COUNT(*) INTO v_clinics_count FROM clinics;
  SELECT EXISTS(SELECT 1 FROM clinics WHERE code = 'CLINIC001' AND is_demo = true) INTO v_demo_clinic_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION 24 TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 État du système:';
  RAISE NOTICE '   - Cliniques: %', v_clinics_count;
  RAISE NOTICE '   - Clinique démo (CLINIC001): %', CASE WHEN v_demo_clinic_exists THEN 'OUI' ELSE 'NON' END;
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Fonctions disponibles:';
  RAISE NOTICE '   - super_admin_create_clinic() : Créer une clinique avec admin';
  RAISE NOTICE '   - validate_clinic_login() : Valider connexion multi-clinic';
  RAISE NOTICE '   - get_clinic_id_by_code() : Récupérer ID depuis code';
  RAISE NOTICE '';
END $$;

-- Afficher le résumé final
SELECT 
  'Migration 24 terminée' as status,
  (SELECT COUNT(*) FROM clinics) as total_clinics,
  (SELECT COUNT(*) FROM clinics WHERE is_demo = true) as demo_clinics,
  (SELECT COUNT(*) FROM users WHERE role = 'CLINIC_ADMIN') as clinic_admins,
  (SELECT COUNT(*) FROM patients WHERE clinic_id IS NOT NULL) as patients_with_clinic_id;

