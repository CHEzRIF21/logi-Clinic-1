-- ============================================
-- MIGRATION COMPLÈTE : Système Hiérarchique Super-Admin
-- VERSION CORRIGÉE - Ordre d'exécution garanti
-- ============================================

-- ============================================
-- ÉTAPE 1 : CRÉER LA TABLE CLINICS
-- ============================================

CREATE TABLE IF NOT EXISTS clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_by_super_admin UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinics_code ON clinics(code);
CREATE INDEX IF NOT EXISTS idx_clinics_active ON clinics(active);

-- ============================================
-- ÉTAPE 2 : CRÉER/MODIFIER LA TABLE USERS
-- ============================================

-- Créer la table users avec les colonnes de base seulement
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter TOUTES les colonnes nécessaires une par une
DO $$ 
BEGIN
  -- auth_user_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_user_id') THEN
    ALTER TABLE users ADD COLUMN auth_user_id UUID;
  END IF;
  
  -- nom
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'nom') THEN
    ALTER TABLE users ADD COLUMN nom VARCHAR(100);
  END IF;
  
  -- prenom
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'prenom') THEN
    ALTER TABLE users ADD COLUMN prenom VARCHAR(100);
  END IF;
  
  -- role
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'STAFF';
  END IF;
  
  -- clinic_id (SANS contrainte pour l'instant)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'clinic_id') THEN
    ALTER TABLE users ADD COLUMN clinic_id UUID;
    RAISE NOTICE '✅ Colonne clinic_id ajoutée';
  END IF;
  
  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status') THEN
    ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING';
  END IF;
  
  -- specialite
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'specialite') THEN
    ALTER TABLE users ADD COLUMN specialite VARCHAR(100);
  END IF;
  
  -- telephone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'telephone') THEN
    ALTER TABLE users ADD COLUMN telephone VARCHAR(50);
  END IF;
  
  -- adresse
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'adresse') THEN
    ALTER TABLE users ADD COLUMN adresse TEXT;
  END IF;
  
  -- created_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_by') THEN
    ALTER TABLE users ADD COLUMN created_by UUID;
  END IF;
  
  -- last_login
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_login') THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- actif
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'actif') THEN
    ALTER TABLE users ADD COLUMN actif BOOLEAN DEFAULT true;
  END IF;
  
  RAISE NOTICE '✅ Toutes les colonnes de users vérifiées/ajoutées';
END $$;

-- ============================================
-- ÉTAPE 3 : AJOUTER LES CONTRAINTES
-- ============================================

DO $$
BEGIN
  -- Contrainte auth_user_id -> auth.users
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_user_id') THEN
    -- Supprimer la contrainte si elle existe déjà
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_user_id_fkey;
    -- Ajouter la contrainte
    ALTER TABLE users ADD CONSTRAINT users_auth_user_id_fkey 
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Contrainte clinic_id -> clinics
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'clinic_id') 
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinics') THEN
    -- Supprimer la contrainte si elle existe déjà
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_clinic_id_fkey;
    -- Ajouter la contrainte
    ALTER TABLE users ADD CONSTRAINT users_clinic_id_fkey 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Contrainte clinic_id -> clinics ajoutée';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 4 : CRÉER LES INDEX
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'clinic_id') THEN
    CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);
    RAISE NOTICE '✅ Index sur clinic_id créé';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email') THEN
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  END IF;
END $$;

-- ============================================
-- ÉTAPE 5 : CRÉER LA TABLE REGISTRATION_REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  telephone VARCHAR(50),
  adresse TEXT,
  role_souhaite VARCHAR(50) DEFAULT 'STAFF',
  specialite VARCHAR(100),
  security_questions JSONB,
  clinic_code VARCHAR(50),
  statut VARCHAR(20) DEFAULT 'pending' CHECK (statut IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Ajouter clinic_id si la table existe déjà sans cette colonne
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registration_requests' 
    AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE registration_requests ADD COLUMN clinic_id UUID;
    RAISE NOTICE '✅ Colonne clinic_id ajoutée à registration_requests';
  END IF;
END $$;

-- Ajouter la contrainte clinic_id après création de la table
DO $$
BEGIN
  -- Vérifier que la colonne clinic_id existe dans registration_requests
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registration_requests' 
    AND column_name = 'clinic_id'
  ) 
  AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics'
  ) THEN
    -- Supprimer la contrainte si elle existe déjà
    ALTER TABLE registration_requests DROP CONSTRAINT IF EXISTS registration_requests_clinic_id_fkey;
    -- Ajouter la contrainte
    ALTER TABLE registration_requests ADD CONSTRAINT registration_requests_clinic_id_fkey 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Contrainte clinic_id ajoutée à registration_requests';
  ELSE
    RAISE NOTICE '⚠️ Impossible d''ajouter la contrainte: colonne ou table manquante';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_registration_requests_clinic_id ON registration_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_statut ON registration_requests(statut);
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON registration_requests(email);

-- ============================================
-- ÉTAPE 6 : CRÉER LES TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at
BEFORE UPDATE ON clinics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_registration_requests_updated_at ON registration_requests;
CREATE TRIGGER update_registration_requests_updated_at
BEFORE UPDATE ON registration_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÉTAPE 7 : CRÉER LES FONCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION generate_clinic_code()
RETURNS VARCHAR(50) AS $$
DECLARE
  new_code VARCHAR(50);
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'CLINIC-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM clinics WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_super_admin(user_auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = user_auth_id
    AND role = 'SUPER_ADMIN'
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_clinic_admin(user_auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = user_auth_id
    AND role = 'CLINIC_ADMIN'
    AND status IN ('ACTIVE', 'PENDING')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_clinic_id(user_auth_id UUID)
RETURNS UUID AS $$
DECLARE
  result UUID;
BEGIN
  SELECT clinic_id INTO result
  FROM users
  WHERE auth_user_id = user_auth_id;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÉTAPE 8 : INSÉRER LA CLINIQUE DU CAMPUS
-- ============================================

INSERT INTO clinics (
  code,
  name,
  address,
  phone,
  email,
  active
)
VALUES (
  'CAMPUS-001',
  'Clinique du Campus',
  'Quartier Arafat; rue opposée universite ESAE',
  '+229 90904344',
  'cliniquemedicalecampus@gmail.com',
  true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  updated_at = NOW();

-- ============================================
-- ÉTAPE 9 : CRÉER LES POLITIQUES RLS
-- ============================================

-- Vérification finale avant RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'clinic_id') THEN
    RAISE EXCEPTION '❌ ERREUR: clinic_id n''existe pas. Arrêt de la migration.';
  END IF;
  RAISE NOTICE '✅ Vérification clinic_id OK, création des politiques RLS...';
END $$;

-- RLS pour clinics
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_clinics" ON clinics;
CREATE POLICY "super_admin_all_clinics"
ON clinics FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'SUPER_ADMIN'
    AND users.status = 'ACTIVE'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'SUPER_ADMIN'
    AND users.status = 'ACTIVE'
  )
);

DROP POLICY IF EXISTS "clinic_admin_own_clinic" ON clinics;
CREATE POLICY "clinic_admin_own_clinic"
ON clinics FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT clinic_id FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'CLINIC_ADMIN'
    AND users.status IN ('ACTIVE', 'PENDING')
  )
);

DROP POLICY IF EXISTS "staff_read_own_clinic" ON clinics;
CREATE POLICY "staff_read_own_clinic"
ON clinics FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT clinic_id FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role NOT IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
    AND users.status = 'ACTIVE'
  )
);

-- RLS pour users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_users" ON users;
CREATE POLICY "super_admin_all_users"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid()
    AND u.role = 'SUPER_ADMIN'
    AND u.status = 'ACTIVE'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid()
    AND u.role = 'SUPER_ADMIN'
    AND u.status = 'ACTIVE'
  )
);

DROP POLICY IF EXISTS "clinic_admin_own_clinic_users" ON users;
CREATE POLICY "clinic_admin_own_clinic_users"
ON users FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'CLINIC_ADMIN'
    AND status IN ('ACTIVE', 'PENDING')
  )
  OR auth_user_id = auth.uid()
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'CLINIC_ADMIN'
    AND status IN ('ACTIVE', 'PENDING')
  )
  OR auth_user_id = auth.uid()
);

DROP POLICY IF EXISTS "staff_own_profile_read" ON users;
CREATE POLICY "staff_own_profile_read"
ON users FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "staff_own_profile_update" ON users;
CREATE POLICY "staff_own_profile_update"
ON users FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- RLS pour registration_requests
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_registration_requests" ON registration_requests;
CREATE POLICY "super_admin_all_registration_requests"
ON registration_requests FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'SUPER_ADMIN'
    AND users.status = 'ACTIVE'
  )
);

DROP POLICY IF EXISTS "clinic_admin_own_clinic_requests" ON registration_requests;
CREATE POLICY "clinic_admin_own_clinic_requests"
ON registration_requests FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'CLINIC_ADMIN'
    AND status IN ('ACTIVE', 'PENDING')
  )
);

DROP POLICY IF EXISTS "anyone_create_request" ON registration_requests;
CREATE POLICY "anyone_create_request"
ON registration_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================================
-- ÉTAPE 10 : VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  clinic_count INTEGER;
  table_count INTEGER;
  policy_count INTEGER;
  clinic_id_exists BOOLEAN;
BEGIN
  -- Vérifier la clinique
  SELECT COUNT(*) INTO clinic_count FROM clinics WHERE code = 'CAMPUS-001';
  
  -- Vérifier les tables
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('clinics', 'users', 'registration_requests');
  
  -- Vérifier les politiques RLS
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename IN ('clinics', 'users', 'registration_requests');
  
  -- Vérifier clinic_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'clinic_id'
  ) INTO clinic_id_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ MIGRATION TERMINÉE AVEC SUCCÈS !';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   - Tables créées: %', table_count;
  RAISE NOTICE '   - Clinique du Campus: %', CASE WHEN clinic_count > 0 THEN 'OK' ELSE 'ERREUR' END;
  RAISE NOTICE '   - Politiques RLS: %', policy_count;
  RAISE NOTICE '   - Colonne clinic_id: %', CASE WHEN clinic_id_exists THEN 'OK' ELSE 'ERREUR' END;
  RAISE NOTICE '';
  RAISE NOTICE '👉 PROCHAINES ÉTAPES:';
  RAISE NOTICE '   1. Aller dans Authentication > Users';
  RAISE NOTICE '   2. Créer: babocher21@gmail.com (Super-Admin)';
  RAISE NOTICE '   3. Créer: bagarayannick1@gmail.com (Admin Clinique)';
  RAISE NOTICE '   4. Copier les UUID et exécuter INSERTION_UTILISATEURS.sql';
  RAISE NOTICE '';
END $$;

-- Afficher la clinique créée
SELECT 
  code,
  name,
  address,
  phone,
  email,
  active
FROM clinics 
WHERE code = 'CAMPUS-001';

