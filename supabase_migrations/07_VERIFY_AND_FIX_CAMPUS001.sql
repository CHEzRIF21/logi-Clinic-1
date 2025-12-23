-- ============================================
-- SCRIPT DE VÉRIFICATION ET CORRECTION CAMPUS-001
-- ============================================
-- Ce script vérifie et corrige la configuration de CAMPUS-001
-- pour le système de codes temporaires
-- ============================================

-- 1. VÉRIFIER L'EXISTENCE DE LA CLINIQUE
DO $$
DECLARE
  v_clinic_id UUID;
  v_user_id UUID;
  v_super_admin_id UUID;
  v_temp_code_exists BOOLEAN := false;
BEGIN
  -- Vérifier si la clinique existe
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    RAISE NOTICE '❌ Clinique CAMPUS-001 non trouvée dans la table clinics';
    RAISE NOTICE 'ℹ️ Vérifiez que la migration 05_FIX_USERS_AND_CLINIC_CAMPUS.sql a été exécutée';
  ELSE
    RAISE NOTICE '✅ Clinique CAMPUS-001 trouvée avec ID: %', v_clinic_id;
    
    -- Vérifier les flags temporaires
    SELECT is_temporary_code, requires_code_change INTO v_temp_code_exists
    FROM clinics WHERE id = v_clinic_id;
    
    IF NOT v_temp_code_exists THEN
      RAISE NOTICE '⚠️ La clinique n''est pas marquée comme ayant un code temporaire';
      RAISE NOTICE 'ℹ️ Mise à jour des flags...';
      
      UPDATE clinics
      SET 
        is_temporary_code = true,
        requires_code_change = true,
        updated_at = NOW()
      WHERE id = v_clinic_id;
      
      RAISE NOTICE '✅ Flags mis à jour';
    END IF;
  END IF;
END $$;

-- 2. VÉRIFIER ET CRÉER L'ENTRÉE DANS clinic_temporary_codes
DO $$
DECLARE
  v_clinic_id UUID;
  v_super_admin_id UUID;
  v_temp_code_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE := NOW() + INTERVAL '72 hours';
BEGIN
  -- Récupérer l'ID de la clinique
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NOT NULL THEN
    -- Vérifier si une entrée existe déjà
    SELECT id INTO v_temp_code_id 
    FROM clinic_temporary_codes 
    WHERE clinic_id = v_clinic_id 
    AND temporary_code = 'CAMPUS-001';
    
    IF v_temp_code_id IS NULL THEN
      RAISE NOTICE '⚠️ Aucune entrée trouvée dans clinic_temporary_codes';
      RAISE NOTICE 'ℹ️ Création de l''entrée...';
      
      -- Récupérer l'ID du super-admin
      SELECT id INTO v_super_admin_id 
      FROM users 
      WHERE email = 'babocher21@gmail.com' 
      AND role = 'SUPER_ADMIN' 
      LIMIT 1;
      
      -- Supprimer les anciennes entrées pour cette clinique
      DELETE FROM clinic_temporary_codes WHERE clinic_id = v_clinic_id;
      
      -- Créer la nouvelle entrée
      INSERT INTO clinic_temporary_codes (
        clinic_id,
        temporary_code,
        expires_at,
        created_by_super_admin,
        is_used,
        is_converted,
        created_at,
        updated_at
      ) VALUES (
        v_clinic_id,
        'CAMPUS-001',
        v_expires_at,
        v_super_admin_id,
        false,
        false,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE '✅ Entrée créée dans clinic_temporary_codes';
      RAISE NOTICE 'ℹ️ Code temporaire: CAMPUS-001';
      RAISE NOTICE 'ℹ️ Expire le: %', v_expires_at;
    ELSE
      RAISE NOTICE '✅ Entrée existante trouvée dans clinic_temporary_codes';
      
      -- Vérifier et mettre à jour si nécessaire
      UPDATE clinic_temporary_codes
      SET 
        expires_at = GREATEST(expires_at, NOW() + INTERVAL '72 hours'),
        is_used = false,
        is_converted = false,
        updated_at = NOW()
      WHERE id = v_temp_code_id
      AND (is_converted = true OR expires_at < NOW());
      
      IF FOUND THEN
        RAISE NOTICE '✅ Entrée réinitialisée (code non converti, valide)';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE '❌ Impossible de créer l''entrée: clinique CAMPUS-001 non trouvée';
  END IF;
END $$;

-- 3. VÉRIFIER L'UTILISATEUR ADMIN
DO $$
DECLARE
  v_user_id UUID;
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NOT NULL THEN
    SELECT id INTO v_user_id 
    FROM users 
    WHERE email = 'bagarayannick1@gmail.com' 
    AND clinic_id = v_clinic_id;
    
    IF v_user_id IS NULL THEN
      RAISE NOTICE '⚠️ Utilisateur bagarayannick1@gmail.com non trouvé pour CAMPUS-001';
    ELSE
      RAISE NOTICE '✅ Utilisateur admin trouvé avec ID: %', v_user_id;
      
      -- S'assurer que le status est PENDING pour forcer la conversion
      UPDATE users
      SET 
        status = 'PENDING',
        temp_code_used = false,
        updated_at = NOW()
      WHERE id = v_user_id
      AND (status != 'PENDING' OR temp_code_used = true);
      
      IF FOUND THEN
        RAISE NOTICE '✅ Status utilisateur mis à jour à PENDING';
      END IF;
    END IF;
  END IF;
END $$;

-- 4. RAPPORT FINAL DE VÉRIFICATION
SELECT 
  '=== RAPPORT DE VÉRIFICATION ===' as rapport,
  c.id as clinic_id,
  c.code as clinic_code,
  c.name as clinic_name,
  c.active as clinic_active,
  c.is_temporary_code,
  c.requires_code_change,
  ctc.id as temp_code_id,
  ctc.temporary_code,
  ctc.expires_at,
  ctc.is_used,
  ctc.is_converted,
  u.id as user_id,
  u.email as admin_email,
  u.status as admin_status,
  u.temp_code_used,
  CASE 
    WHEN c.id IS NULL THEN '❌ Clinique non trouvée'
    WHEN ctc.id IS NULL THEN '⚠️ Code temporaire non configuré'
    WHEN ctc.is_converted THEN '⚠️ Code déjà converti'
    WHEN ctc.expires_at < NOW() THEN '⚠️ Code expiré'
    WHEN u.id IS NULL THEN '⚠️ Admin non trouvé'
    ELSE '✅ Configuration OK'
  END as statut
FROM clinics c
LEFT JOIN clinic_temporary_codes ctc ON ctc.clinic_id = c.id AND ctc.temporary_code = 'CAMPUS-001'
LEFT JOIN users u ON u.clinic_id = c.id AND u.email = 'bagarayannick1@gmail.com'
WHERE c.code = 'CAMPUS-001';

-- 5. INSTRUCTIONS POUR TESTER
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VÉRIFICATION TERMINÉE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Pour tester la connexion:';
  RAISE NOTICE '  Code clinique: CAMPUS-001';
  RAISE NOTICE '  Email: bagarayannick1@gmail.com';
  RAISE NOTICE '  Mot de passe: TempClinic2024!';
  RAISE NOTICE '';
  RAISE NOTICE 'Si le code n''est toujours pas trouvé:';
  RAISE NOTICE '  1. Vérifiez que la table clinic_temporary_codes existe';
  RAISE NOTICE '  2. Vérifiez les RLS policies (doivent permettre la lecture)';
  RAISE NOTICE '  3. Vérifiez les logs Supabase pour les erreurs RLS';
  RAISE NOTICE '============================================';
END $$;

