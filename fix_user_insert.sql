-- ============================================
-- SCRIPT CORRIGÉ : Création/Mise à jour utilisateur CLINIC_ADMIN
-- ============================================
-- Ce script inclut password_hash pour éviter l'erreur de contrainte NOT NULL

DO $$
DECLARE
  v_clinic_id UUID;
  v_auth_user_id UUID := '75be5f7b-bade-4065-83fa-b9a7db8ae6a2'; -- Votre ID Auth détecté dans les logs
  v_password_hash TEXT;
BEGIN
  -- Récupérer l'ID de la clinique CAMPUS-001
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';

  -- Générer le hash du mot de passe (utilisez le mot de passe temporaire approprié)
  -- Si l'utilisateur utilise Supabase Auth, ce hash peut être un placeholder
  -- Sinon, utilisez le vrai mot de passe temporaire
  v_password_hash := encode(digest('TempClinic2024!' || 'logi_clinic_salt', 'sha256'), 'hex');

  -- Créer ou mettre à jour le profil utilisateur
  INSERT INTO users (
    auth_user_id,
    email,
    nom,
    prenom,
    role,
    clinic_id,
    status,
    actif,
    password_hash
  ) VALUES (
    v_auth_user_id,
    'bagarayannick1@gmail.com',
    'BAGARA',
    'Sabi Yannick',
    'CLINIC_ADMIN',
    v_clinic_id,
    'PENDING', -- Sera passé à ACTIVE après la définition du code permanent
    true,
    v_password_hash
     )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = v_auth_user_id,
    clinic_id = v_clinic_id,
    role = 'CLINIC_ADMIN',
    status = 'PENDING',
    actif = true,
    password_hash = COALESCE(EXCLUDED.password_hash, v_password_hash);

  RAISE NOTICE '✅ Profil utilisateur lié à la clinique CAMPUS-001 avec succès.';
END $$;

