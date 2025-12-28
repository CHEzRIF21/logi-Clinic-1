-- ============================================
-- CRÉATION/VÉRIFICATION DE LA CLINIQUE DÉMO CLINIC001
-- ============================================
-- Ce script s'assure que la clinique démo CLINIC001 existe
-- avec tous ses utilisateurs démo (admin, medecin, infirmier, etc.)
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_super_admin_id UUID;
  v_admin_password_hash TEXT;
  v_medecin_password_hash TEXT;
  v_infirmier_password_hash TEXT;
  v_receptionniste_password_hash TEXT;
BEGIN
  -- Générer les hash de mots de passe pour les comptes démo
  v_admin_password_hash := encode(digest('admin123' || 'logi_clinic_salt', 'sha256'), 'hex');
  v_medecin_password_hash := encode(digest('medecin123' || 'logi_clinic_salt', 'sha256'), 'hex');
  v_infirmier_password_hash := encode(digest('infirmier123' || 'logi_clinic_salt', 'sha256'), 'hex');
  v_receptionniste_password_hash := encode(digest('receptionniste123' || 'logi_clinic_salt', 'sha256'), 'hex');
  -- ============================================
  -- 1. CRÉER OU VÉRIFIER LA CLINIQUE CLINIC001
  -- ============================================
  
  INSERT INTO clinics (
    code,
    name,
    adresse,
    telephone,
    email,
    active,
    is_temporary_code,
    requires_code_change,
    created_at,
    updated_at
  )
  VALUES (
    'CLINIC001',
    'Clinique Démo',
    'Adresse de démonstration',
    '+229 00000000',
    'demo@clinique.local',
    true,  -- Active
    false, -- Code permanent (pas temporaire)
    false, -- Pas de changement de code requis
    NOW(),
    NOW()
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    active = true,
    is_temporary_code = false,
    requires_code_change = false,
    updated_at = NOW()
  RETURNING id INTO v_clinic_id;

  RAISE NOTICE '✅ Clinique CLINIC001 créée/vérifiée (ID: %)', v_clinic_id;

  -- ============================================
  -- 2. RÉCUPÉRER LE SUPER-ADMIN (pour created_by)
  -- ============================================
  
  SELECT id INTO v_super_admin_id 
  FROM users 
  WHERE role = 'SUPER_ADMIN' 
  LIMIT 1;

  IF v_super_admin_id IS NULL THEN
    RAISE WARNING '⚠️ Aucun SUPER_ADMIN trouvé. Les utilisateurs seront créés sans created_by.';
  END IF;

  -- ============================================
  -- 3. CRÉER LES UTILISATEURS DÉMO
  -- ============================================

  -- 3.1. ADMIN DÉMO
  -- Note: L'auth_user_id sera NULL car c'est un compte démo local
  -- Le système devra gérer l'authentification différemment pour les comptes démo
  INSERT INTO users (
    auth_user_id,
    email,
    nom,
    prenom,
    role,
    clinic_id,
    status,
    actif,
    password_hash,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    NULL, -- Pas d'auth_user_id pour les comptes démo
    'admin',
    'Admin',
    'Démo',
    'CLINIC_ADMIN',
    v_clinic_id,
    'ACTIVE', -- Actif directement (pas de changement de mot de passe requis)
    true,
    v_admin_password_hash,
    v_super_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    clinic_id = v_clinic_id,
    role = 'CLINIC_ADMIN',
    status = 'ACTIVE',
    actif = true,
    password_hash = v_admin_password_hash,
    updated_at = NOW();

  RAISE NOTICE '✅ Admin démo créé/vérifié (admin)';

  -- 3.2. MÉDECIN DÉMO
  INSERT INTO users (
    auth_user_id,
    email,
    nom,
    prenom,
    role,
    clinic_id,
    status,
    actif,
    password_hash,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    NULL,
    'medecin',
    'Médecin',
    'Démo',
    'MEDECIN',
    v_clinic_id,
    'ACTIVE',
    true,
    v_medecin_password_hash,
    v_super_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    clinic_id = v_clinic_id,
    role = 'MEDECIN',
    status = 'ACTIVE',
    actif = true,
    password_hash = v_medecin_password_hash,
    updated_at = NOW();

  RAISE NOTICE '✅ Médecin démo créé/vérifié (medecin)';

  -- 3.3. INFIRMIER DÉMO
  INSERT INTO users (
    auth_user_id,
    email,
    nom,
    prenom,
    role,
    clinic_id,
    status,
    actif,
    password_hash,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    NULL,
    'infirmier',
    'Infirmier',
    'Démo',
    'INFIRMIER',
    v_clinic_id,
    'ACTIVE',
    true,
    v_infirmier_password_hash,
    v_super_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    clinic_id = v_clinic_id,
    role = 'INFIRMIER',
    status = 'ACTIVE',
    actif = true,
    password_hash = v_infirmier_password_hash,
    updated_at = NOW();

  RAISE NOTICE '✅ Infirmier démo créé/vérifié (infirmier)';

  -- 3.4. RÉCEPTIONNISTE DÉMO
  INSERT INTO users (
    auth_user_id,
    email,
    nom,
    prenom,
    role,
    clinic_id,
    status,
    actif,
    password_hash,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    NULL,
    'receptionniste',
    'Réceptionniste',
    'Démo',
    'RECEPTIONNISTE',
    v_clinic_id,
    'ACTIVE',
    true,
    v_receptionniste_password_hash,
    v_super_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    clinic_id = v_clinic_id,
    role = 'RECEPTIONNISTE',
    status = 'ACTIVE',
    actif = true,
    password_hash = v_receptionniste_password_hash,
    updated_at = NOW();

  RAISE NOTICE '✅ Réceptionniste démo créé/vérifié (receptionniste)';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CLINIC001 (DÉMO) CONFIGURÉE AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Comptes démo disponibles:';
  RAISE NOTICE '  - admin / admin123 (CLINIC_ADMIN)';
  RAISE NOTICE '  - medecin / medecin123 (MEDECIN)';
  RAISE NOTICE '  - infirmier / infirmier123 (INFIRMIER)';
  RAISE NOTICE '  - receptionniste / receptionniste123 (RECEPTIONNISTE)';
  RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT 
  'VÉRIFICATION CLINIC001' as verification,
  c.code,
  c.name,
  c.active,
  c.is_temporary_code,
  c.requires_code_change,
  COUNT(DISTINCT u.id) as nb_utilisateurs,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'CLINIC_ADMIN') as nb_admins,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'MEDECIN') as nb_medecins,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'INFIRMIER') as nb_infirmiers,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'RECEPTIONNISTE') as nb_receptionnistes
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id
WHERE c.code = 'CLINIC001'
GROUP BY c.id, c.code, c.name, c.active, c.is_temporary_code, c.requires_code_change;

-- Afficher tous les utilisateurs de CLINIC001
SELECT 
  'UTILISATEURS CLINIC001' as info,
  u.email,
  u.nom,
  u.prenom,
  u.role,
  u.status,
  u.actif
FROM users u
JOIN clinics c ON u.clinic_id = c.id
WHERE c.code = 'CLINIC001'
ORDER BY u.role;

