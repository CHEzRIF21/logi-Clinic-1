-- ============================================
-- CORRECTIF DÉFINITIF : RÉCURSION INFINIE RLS
-- ============================================
-- Ce script remplace les politiques récursives par des fonctions SECURITY DEFINER.
-- Exécutez ce script dans le SQL Editor de Supabase.

-- 1. NETTOYAGE DES ANCIENNES POLITIQUES
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('users', 'clinics', 'clinic_temporary_codes')) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. CRÉATION DES FONCTIONS DE SÉCURITÉ (SECURITY DEFINER)
-- Ces fonctions ignorent le RLS et évitent la récursion.

CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'SUPER_ADMIN'
    AND status = 'ACTIVE'
    AND actif = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_clinic_admin()
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'CLINIC_ADMIN'
    AND status IN ('ACTIVE', 'PENDING')
    AND actif = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_clinic_id()
RETURNS UUID 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT clinic_id FROM users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- 3. NOUVELLES POLITIQUES POUR 'users'
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent toujours lire leur propre profil (Condition prioritaire)
CREATE POLICY "users_read_own_profile" ON users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- Les Super Admins ont accès à tout
CREATE POLICY "users_super_admin_all" ON users
  FOR ALL TO authenticated
  USING (check_is_super_admin());

-- Les Admins de clinique ont accès aux utilisateurs de leur clinique
CREATE POLICY "users_clinic_admin_same_clinic" ON users
  FOR ALL TO authenticated
  USING (
    clinic_id = get_current_user_clinic_id() 
    AND check_is_clinic_admin()
  );

-- Les utilisateurs peuvent mettre à jour certains champs de leur propre profil
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- 4. NOUVELLES POLITIQUES POUR 'clinics'
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour la validation
CREATE POLICY "clinics_public_read" ON clinics
  FOR SELECT TO anon, authenticated
  USING (active = true);

-- Accès complet Super Admin
CREATE POLICY "clinics_super_admin_all" ON clinics
  FOR ALL TO authenticated
  USING (check_is_super_admin());

-- 5. NOUVELLES POLITIQUES POUR 'clinic_temporary_codes'
ALTER TABLE clinic_temporary_codes ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour validation
CREATE POLICY "temp_codes_public_read" ON clinic_temporary_codes
  FOR SELECT TO anon, authenticated
  USING (is_converted = false AND expires_at > NOW());

-- Accès complet Super Admin
CREATE POLICY "temp_codes_super_admin_all" ON clinic_temporary_codes
  FOR ALL TO authenticated
  USING (check_is_super_admin());

-- Mise à jour pour les admins de clinique (marquer comme utilisé)
CREATE POLICY "temp_codes_clinic_admin_update" ON clinic_temporary_codes
  FOR UPDATE TO authenticated
  USING (
    clinic_id = get_current_user_clinic_id()
    AND check_is_clinic_admin()
  );

-- 6. RÉ-INSERTION / VÉRIFICATION DE CAMPUS-001
DO $$
DECLARE
  v_clinic_id UUID;
  v_super_admin_auth_id UUID := '00000000-0000-0000-0000-000000000000'; -- Placeholder, à remplacer par le vrai UUID si connu
  v_admin_email TEXT := 'bagarayannick1@gmail.com';
BEGIN
  -- S'assurer que la clinique existe
  INSERT INTO clinics (code, name, active, is_temporary_code, requires_code_change)
  VALUES ('CAMPUS-001', 'Clinique du Campus', true, true, true)
  ON CONFLICT (code) DO UPDATE SET active = true, is_temporary_code = true, requires_code_change = true
  RETURNING id INTO v_clinic_id;

  -- S'assurer qu'un code temporaire existe pour cette clinique
  INSERT INTO clinic_temporary_codes (clinic_id, temporary_code, expires_at, is_used, is_converted)
  VALUES (v_clinic_id, 'CAMPUS-001', NOW() + INTERVAL '1 year', false, false)
  ON CONFLICT (temporary_code) DO NOTHING;

  RAISE NOTICE '✅ Correctif RLS appliqué. Clinique CAMPUS-001 prête pour connexion.';
END $$;

