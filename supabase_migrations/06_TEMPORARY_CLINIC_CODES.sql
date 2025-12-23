-- ============================================
-- MIGRATION: Système de Codes Cliniques Temporaires
-- VERSION: 1.0
-- DATE: 2024
-- ============================================
-- Ce système permet au Super-Admin de créer une clinique avec un code
-- temporaire valide pour la première connexion uniquement.
-- Après connexion réussie, l'admin clinique définit un code permanent.
-- ============================================

-- ============================================
-- 1. TABLE DES CODES CLINIQUES TEMPORAIRES
-- ============================================

CREATE TABLE IF NOT EXISTS clinic_temporary_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  temporary_code VARCHAR(100) UNIQUE NOT NULL,
  permanent_code VARCHAR(50) UNIQUE,
  is_used BOOLEAN DEFAULT false,
  is_converted BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  used_by_user_id UUID REFERENCES users(id),
  created_by_super_admin UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_temp_codes_clinic_id ON clinic_temporary_codes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_temp_codes_temporary_code ON clinic_temporary_codes(temporary_code);
CREATE INDEX IF NOT EXISTS idx_temp_codes_permanent_code ON clinic_temporary_codes(permanent_code);
CREATE INDEX IF NOT EXISTS idx_temp_codes_is_used ON clinic_temporary_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_temp_codes_is_converted ON clinic_temporary_codes(is_converted);
CREATE INDEX IF NOT EXISTS idx_temp_codes_expires_at ON clinic_temporary_codes(expires_at);

-- ============================================
-- 2. AJOUTER COLONNE temp_code_used À LA TABLE USERS
-- ============================================

DO $$
BEGIN
  -- Ajouter la colonne pour indiquer si l'utilisateur a utilisé un code temporaire
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'temp_code_used'
  ) THEN
    ALTER TABLE users ADD COLUMN temp_code_used BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne temp_code_used ajoutée à la table users';
  END IF;

  -- Ajouter la colonne pour stocker la date de première connexion
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'first_login_at'
  ) THEN
    ALTER TABLE users ADD COLUMN first_login_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Colonne first_login_at ajoutée à la table users';
  END IF;

  -- Ajouter requires_code_change à clinics
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics' 
    AND column_name = 'requires_code_change'
  ) THEN
    ALTER TABLE clinics ADD COLUMN requires_code_change BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne requires_code_change ajoutée à la table clinics';
  END IF;

  -- Ajouter is_temporary_code à clinics
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics' 
    AND column_name = 'is_temporary_code'
  ) THEN
    ALTER TABLE clinics ADD COLUMN is_temporary_code BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne is_temporary_code ajoutée à la table clinics';
  END IF;
END $$;

-- ============================================
-- 3. FONCTION POUR GÉNÉRER UN CODE TEMPORAIRE SÉCURISÉ
-- ============================================

CREATE OR REPLACE FUNCTION generate_secure_temporary_code(clinic_name TEXT DEFAULT '')
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  random_part TEXT;
  timestamp_part TEXT;
  final_code TEXT;
BEGIN
  -- Créer un préfixe basé sur le nom de la clinique (3 premières lettres)
  IF clinic_name != '' THEN
    prefix := UPPER(LEFT(REGEXP_REPLACE(clinic_name, '[^a-zA-Z]', '', 'g'), 3));
    IF LENGTH(prefix) < 3 THEN
      prefix := prefix || REPEAT('X', 3 - LENGTH(prefix));
    END IF;
  ELSE
    prefix := 'TMP';
  END IF;
  
  -- Partie aléatoire sécurisée (8 caractères alphanumériques)
  random_part := UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
  
  -- Partie timestamp (4 derniers chiffres de l'epoch)
  timestamp_part := RIGHT(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 4);
  
  -- Assembler le code: PREFIX-RANDOM-TIMESTAMP
  final_code := prefix || '-TEMP-' || random_part || '-' || timestamp_part;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. FONCTION POUR VALIDER UN CODE TEMPORAIRE
-- ============================================

CREATE OR REPLACE FUNCTION validate_temporary_code(
  p_temp_code TEXT,
  p_user_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  clinic_id UUID,
  clinic_name TEXT,
  message TEXT,
  requires_password_change BOOLEAN,
  requires_code_conversion BOOLEAN
) AS $$
DECLARE
  v_temp_record RECORD;
  v_clinic_record RECORD;
BEGIN
  -- Rechercher le code temporaire
  SELECT 
    ctc.*,
    c.id as clinic_id,
    c.name as clinic_name,
    c.code as clinic_code,
    c.active as clinic_active
  INTO v_temp_record
  FROM clinic_temporary_codes ctc
  JOIN clinics c ON c.id = ctc.clinic_id
  WHERE ctc.temporary_code = UPPER(TRIM(p_temp_code))
  LIMIT 1;
  
  -- Code non trouvé
  IF v_temp_record IS NULL THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      NULL::UUID,
      NULL::TEXT,
      'Code temporaire invalide ou inexistant'::TEXT,
      false::BOOLEAN,
      false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Code déjà utilisé et converti
  IF v_temp_record.is_converted THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      v_temp_record.clinic_id,
      v_temp_record.clinic_name,
      'Ce code temporaire a déjà été converti. Utilisez le code permanent: ' || COALESCE(v_temp_record.permanent_code, v_temp_record.clinic_code)::TEXT,
      false::BOOLEAN,
      false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Code expiré
  IF v_temp_record.expires_at < NOW() THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      v_temp_record.clinic_id,
      v_temp_record.clinic_name,
      'Ce code temporaire a expiré. Contactez le Super-Admin pour obtenir un nouveau code.'::TEXT,
      false::BOOLEAN,
      false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Clinique inactive
  IF NOT v_temp_record.clinic_active THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      v_temp_record.clinic_id,
      v_temp_record.clinic_name,
      'La clinique associée à ce code est inactive.'::TEXT,
      false::BOOLEAN,
      false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Code valide
  RETURN QUERY SELECT 
    true::BOOLEAN,
    v_temp_record.clinic_id,
    v_temp_record.clinic_name,
    'Code temporaire valide. Première connexion requise.'::TEXT,
    true::BOOLEAN,
    NOT v_temp_record.is_used::BOOLEAN;
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. FONCTION POUR MARQUER LE CODE COMME UTILISÉ
-- ============================================

CREATE OR REPLACE FUNCTION mark_temporary_code_used(
  p_temp_code TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE clinic_temporary_codes
  SET 
    is_used = true,
    used_at = NOW(),
    used_by_user_id = p_user_id,
    updated_at = NOW()
  WHERE temporary_code = UPPER(TRIM(p_temp_code))
    AND is_used = false
    AND is_converted = false
    AND expires_at > NOW();
  
  IF FOUND THEN
    -- Mettre à jour l'utilisateur
    UPDATE users
    SET 
      temp_code_used = true,
      first_login_at = COALESCE(first_login_at, NOW()),
      updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. FONCTION POUR CONVERTIR LE CODE TEMPORAIRE EN PERMANENT
-- ============================================

CREATE OR REPLACE FUNCTION convert_temporary_to_permanent_code(
  p_temp_code TEXT,
  p_new_permanent_code TEXT,
  p_admin_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_clinic_code TEXT
) AS $$
DECLARE
  v_temp_record RECORD;
  v_existing_code RECORD;
BEGIN
  -- Vérifier si le nouveau code permanent existe déjà
  SELECT id INTO v_existing_code
  FROM clinics
  WHERE code = UPPER(TRIM(p_new_permanent_code))
  LIMIT 1;
  
  IF v_existing_code IS NOT NULL THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      'Ce code clinique est déjà utilisé par une autre clinique.'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Récupérer le code temporaire
  SELECT * INTO v_temp_record
  FROM clinic_temporary_codes
  WHERE temporary_code = UPPER(TRIM(p_temp_code))
    AND is_used = true
    AND is_converted = false;
  
  IF v_temp_record IS NULL THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      'Code temporaire non trouvé ou déjà converti.'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Vérifier que l'utilisateur appartient à cette clinique
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_user_id 
    AND clinic_id = v_temp_record.clinic_id
    AND role IN ('CLINIC_ADMIN', 'ADMIN')
  ) THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      'Vous n''êtes pas autorisé à modifier ce code clinique.'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Mettre à jour la clinique avec le nouveau code permanent
  UPDATE clinics
  SET 
    code = UPPER(TRIM(p_new_permanent_code)),
    is_temporary_code = false,
    requires_code_change = false,
    updated_at = NOW()
  WHERE id = v_temp_record.clinic_id;
  
  -- Marquer le code temporaire comme converti
  UPDATE clinic_temporary_codes
  SET 
    is_converted = true,
    converted_at = NOW(),
    permanent_code = UPPER(TRIM(p_new_permanent_code)),
    updated_at = NOW()
  WHERE id = v_temp_record.id;
  
  -- Mettre à jour le status de l'admin à ACTIVE
  UPDATE users
  SET 
    status = 'ACTIVE',
    updated_at = NOW()
  WHERE id = p_admin_user_id;
  
  RETURN QUERY SELECT 
    true::BOOLEAN,
    'Code clinique permanent défini avec succès.'::TEXT,
    UPPER(TRIM(p_new_permanent_code))::TEXT;
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. FONCTION POUR CRÉER UNE CLINIQUE AVEC CODE TEMPORAIRE
-- ============================================

CREATE OR REPLACE FUNCTION create_clinic_with_temporary_code(
  p_clinic_name TEXT,
  p_admin_email TEXT,
  p_admin_nom TEXT,
  p_admin_prenom TEXT,
  p_address TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_clinic_email TEXT DEFAULT NULL,
  p_super_admin_id UUID DEFAULT NULL,
  p_temp_password TEXT DEFAULT NULL,
  p_validity_hours INTEGER DEFAULT 72
)
RETURNS TABLE (
  success BOOLEAN,
  clinic_id UUID,
  clinic_code TEXT,
  temporary_code TEXT,
  admin_user_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  message TEXT
) AS $$
DECLARE
  v_clinic_id UUID;
  v_temp_code TEXT;
  v_user_id UUID;
  v_password_hash TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Générer le code temporaire
  v_temp_code := generate_secure_temporary_code(p_clinic_name);
  v_expires_at := NOW() + (p_validity_hours || ' hours')::INTERVAL;
  
  -- Hash du mot de passe temporaire
  v_password_hash := encode(digest(COALESCE(p_temp_password, 'TempClinic2024!') || 'logi_clinic_salt', 'sha256'), 'hex');
  
  -- Créer la clinique avec le code temporaire
  INSERT INTO clinics (
    code,
    name,
    address,
    phone,
    email,
    active,
    is_temporary_code,
    requires_code_change,
    created_by_super_admin,
    created_at,
    updated_at
  ) VALUES (
    v_temp_code,
    p_clinic_name,
    p_address,
    p_phone,
    p_clinic_email,
    true,
    true,
    true,
    p_super_admin_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_clinic_id;
  
  -- Créer l'administrateur de la clinique
  INSERT INTO users (
    email,
    nom,
    prenom,
    role,
    password_hash,
    clinic_id,
    status,
    actif,
    temp_code_used,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    LOWER(p_admin_email),
    p_admin_nom,
    p_admin_prenom,
    'CLINIC_ADMIN',
    v_password_hash,
    v_clinic_id,
    'PENDING',
    true,
    false,
    p_super_admin_id::TEXT,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;
  
  -- Créer l'entrée du code temporaire
  INSERT INTO clinic_temporary_codes (
    clinic_id,
    temporary_code,
    expires_at,
    created_by_super_admin,
    created_at,
    updated_at
  ) VALUES (
    v_clinic_id,
    v_temp_code,
    v_expires_at,
    p_super_admin_id,
    NOW(),
    NOW()
  );
  
  RETURN QUERY SELECT 
    true::BOOLEAN,
    v_clinic_id,
    v_temp_code,
    v_temp_code,
    v_user_id,
    v_expires_at,
    'Clinique créée avec succès. Le code temporaire expire le ' || v_expires_at::TEXT;
  RETURN;
  
EXCEPTION WHEN OTHERS THEN
  -- Rollback implicite en cas d'erreur
  RETURN QUERY SELECT 
    false::BOOLEAN,
    NULL::UUID,
    NULL::TEXT,
    NULL::TEXT,
    NULL::UUID,
    NULL::TIMESTAMP WITH TIME ZONE,
    'Erreur lors de la création: ' || SQLERRM;
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. RLS POLICIES POUR LA TABLE clinic_temporary_codes
-- ============================================

ALTER TABLE clinic_temporary_codes ENABLE ROW LEVEL SECURITY;

-- Policy pour SUPER_ADMIN (accès complet)
-- Utiliser DROP + CREATE car PostgreSQL ne supporte pas CREATE POLICY IF NOT EXISTS
DO $$
BEGIN
  -- Supprimer la policy si elle existe déjà
  DROP POLICY IF EXISTS "super_admin_full_access_temp_codes" ON clinic_temporary_codes;
EXCEPTION WHEN undefined_object THEN
  -- La table ou la policy n'existe pas encore, ignorer
  NULL;
END $$;

CREATE POLICY "super_admin_full_access_temp_codes" ON clinic_temporary_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
      AND users.status = 'ACTIVE'
    )
  );

-- Policy pour CLINIC_ADMIN (lecture seule de leur clinique)
DO $$
BEGIN
  -- Supprimer la policy si elle existe déjà
  DROP POLICY IF EXISTS "clinic_admin_read_own_temp_codes" ON clinic_temporary_codes;
EXCEPTION WHEN undefined_object THEN
  -- La table ou la policy n'existe pas encore, ignorer
  NULL;
END $$;

CREATE POLICY "clinic_admin_read_own_temp_codes" ON clinic_temporary_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'CLINIC_ADMIN'
      AND users.clinic_id = clinic_temporary_codes.clinic_id
    )
  );

-- Policy pour permettre la lecture publique des codes temporaires (pour la validation)
DO $$
BEGIN
  DROP POLICY IF EXISTS "public_read_temp_codes_for_validation" ON clinic_temporary_codes;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

CREATE POLICY "public_read_temp_codes_for_validation" ON clinic_temporary_codes
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Permettre la lecture pour valider le code lors de la connexion
    is_converted = false AND expires_at > NOW()
  );

-- ============================================
-- 9. CRÉER LE CODE TEMPORAIRE POUR CAMPUS-001
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_user_id UUID;
  v_super_admin_id UUID;
  v_temp_code TEXT := 'CAMPUS-TEMP-' || UPPER(SUBSTRING(MD5(NOW()::TEXT) FROM 1 FOR 8)) || '-' || RIGHT(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 4);
  v_expires_at TIMESTAMP WITH TIME ZONE := NOW() + INTERVAL '72 hours';
BEGIN
  -- Récupérer l'ID de la clinique CAMPUS-001
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NOT NULL THEN
    -- Récupérer l'ID du super-admin
    SELECT id INTO v_super_admin_id FROM users WHERE email = 'babocher21@gmail.com' AND role = 'SUPER_ADMIN' LIMIT 1;
    
    -- Récupérer l'ID de l'admin clinique
    SELECT id INTO v_user_id FROM users WHERE email = 'bagarayannick1@gmail.com' LIMIT 1;
    
    -- Marquer la clinique comme ayant un code temporaire à convertir
    UPDATE clinics
    SET 
      is_temporary_code = true,
      requires_code_change = true,
      updated_at = NOW()
    WHERE id = v_clinic_id;
    
    -- Supprimer les anciens codes temporaires pour cette clinique
    DELETE FROM clinic_temporary_codes WHERE clinic_id = v_clinic_id;
    
    -- Créer le nouveau code temporaire avec le code CAMPUS-001 comme code temporaire initial
    INSERT INTO clinic_temporary_codes (
      clinic_id,
      temporary_code,
      expires_at,
      created_by_super_admin,
      is_used,
      is_converted
    ) VALUES (
      v_clinic_id,
      'CAMPUS-001', -- Le code actuel devient le code temporaire
      v_expires_at,
      v_super_admin_id,
      false,
      false
    );
    
    RAISE NOTICE '✅ Code temporaire CAMPUS-001 configuré pour la clinique';
    RAISE NOTICE 'ℹ️ Expire le: %', v_expires_at;
    RAISE NOTICE 'ℹ️ Admin: bagarayannick1@gmail.com avec mot de passe: TempClinic2024!';
  ELSE
    RAISE NOTICE '❌ Clinique CAMPUS-001 non trouvée';
  END IF;
END $$;

-- ============================================
-- 10. VÉRIFICATION FINALE
-- ============================================

SELECT 
  'Configuration Code Temporaire' as verification,
  c.code as clinic_code,
  c.name as clinic_name,
  c.is_temporary_code,
  c.requires_code_change,
  ctc.temporary_code,
  ctc.expires_at,
  ctc.is_used,
  ctc.is_converted,
  u.email as admin_email,
  u.status as admin_status
FROM clinics c
LEFT JOIN clinic_temporary_codes ctc ON ctc.clinic_id = c.id
LEFT JOIN users u ON u.clinic_id = c.id AND u.role = 'CLINIC_ADMIN'
WHERE c.code = 'CAMPUS-001';

-- Messages de confirmation (dans un bloc DO car RAISE NOTICE nécessite PL/pgSQL)
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'CONFIGURATION TERMINÉE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Pour tester la connexion avec code temporaire:';
  RAISE NOTICE 'Code clinique: CAMPUS-001';
  RAISE NOTICE 'Email: bagarayannick1@gmail.com';
  RAISE NOTICE 'Mot de passe: TempClinic2024!';
  RAISE NOTICE '============================================';
END $$;

