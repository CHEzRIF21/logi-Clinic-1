-- ============================================
-- MIGRATION 82: POLITIQUES RLS COMPLÈTES MULTI-TENANT (SÉCURISÉE)
-- LogiClinic - SaaS Médical Sécurisé
-- Date: 2026-02-04
-- ============================================

-- =============================================
-- SECTION 1: FONCTIONS HELPER SÉCURISÉES
-- =============================================

CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
  v_jwt_clinic_id TEXT;
  users_exists BOOLEAN;
BEGIN
  -- Priorité 1: clinic_id dans le JWT (si configuré)
  v_jwt_clinic_id := auth.jwt() ->> 'clinic_id';
  IF v_jwt_clinic_id IS NOT NULL AND v_jwt_clinic_id != '' THEN
    BEGIN
      RETURN v_jwt_clinic_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  
  -- Vérifier si la table users existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO users_exists;
  
  IF NOT users_exists THEN
    RETURN NULL;
  END IF;
  
  -- Priorité 2: Chercher dans la table users via auth_user_id
  SELECT clinic_id INTO v_clinic_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND actif = true
  LIMIT 1;
    
  RETURN v_clinic_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
  users_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO users_exists;
  
  IF NOT users_exists THEN
    RETURN false;
  END IF;

  SELECT role INTO v_role
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND actif = true
  LIMIT 1;
  
  RETURN COALESCE(v_role = 'SUPER_ADMIN', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_clinic_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
  users_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO users_exists;
  
  IF NOT users_exists THEN
    RETURN false;
  END IF;

  SELECT role INTO v_role
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND actif = true
  LIMIT 1;
  
  RETURN COALESCE(v_role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'ADMIN', 'admin'), false);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
  users_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO users_exists;
  
  IF NOT users_exists THEN
    RETURN NULL;
  END IF;

  SELECT role INTO v_role
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND actif = true
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

-- =============================================
-- SECTION 2: TABLES CORE (Clinics, Users)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinics') THEN
    EXECUTE 'ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "clinics_access" ON public.clinics';
    EXECUTE 'DROP POLICY IF EXISTS "clinics_super_admin_all" ON public.clinics';
    EXECUTE 'DROP POLICY IF EXISTS "clinics_read_active" ON public.clinics';
    EXECUTE 'DROP POLICY IF EXISTS "clinics_read_own_or_active" ON public.clinics';
    EXECUTE 'DROP POLICY IF EXISTS "clinics_anon_validate" ON public.clinics'; -- Ensure clean slate
    
    EXECUTE 'CREATE POLICY "clinics_super_admin_all" ON public.clinics FOR ALL TO authenticated USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin())';
    EXECUTE 'CREATE POLICY "clinics_read_own_or_active" ON public.clinics FOR SELECT TO authenticated USING (active = true OR id = public.get_my_clinic_id())';
    EXECUTE 'CREATE POLICY "clinics_anon_validate" ON public.clinics FOR SELECT TO anon USING (active = true)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "users_read_own_profile" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "users_update_own_profile" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "users_clinic_admin_read" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "users_clinic_admin_manage" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "users_super_admin_all" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "users_staff_read_colleagues" ON public.users';
    
    EXECUTE 'CREATE POLICY "users_super_admin_all" ON public.users FOR ALL TO authenticated USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin())';
    EXECUTE 'CREATE POLICY "users_read_own_profile" ON public.users FOR SELECT TO authenticated USING (auth_user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "users_update_own_profile" ON public.users FOR UPDATE TO authenticated USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "users_clinic_admin_read" ON public.users FOR SELECT TO authenticated USING (public.check_is_clinic_admin() AND clinic_id = public.get_my_clinic_id())';
    EXECUTE 'CREATE POLICY "users_clinic_admin_manage" ON public.users FOR ALL TO authenticated USING (public.check_is_clinic_admin() AND clinic_id = public.get_my_clinic_id() AND role NOT IN (''SUPER_ADMIN'')) WITH CHECK (public.check_is_clinic_admin() AND clinic_id = public.get_my_clinic_id() AND role NOT IN (''SUPER_ADMIN''))';
    EXECUTE 'CREATE POLICY "users_staff_read_colleagues" ON public.users FOR SELECT TO authenticated USING (clinic_id = public.get_my_clinic_id())';
  END IF;
END $$;

-- =============================================
-- SECTION 3: TABLES METIER
-- =============================================

DO $$
DECLARE
  v_table_name TEXT;
  table_list TEXT[] := ARRAY[
    'patients', 'consultations', 'rendez_vous', 'factures', 'paiements',
    'medicaments', 'lots', 'prescriptions', 'lab_demandes', 'lab_analyses', 'lab_resultats',
    'imagerie_demandes', 'imaging_requests', 'vaccination_records', 
    'cpn_consultations', 'accouchements', 'registration_requests',
    -- AJOUTS SUPPLEMENTAIRES
    'dossier_obstetrical', 'nouveau_ne', 'surveillance_post_partum',
    'lab_prescriptions', 'lab_prelevements', 'imagerie_examens'
  ];
BEGIN
  FOREACH v_table_name IN ARRAY table_list
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = v_table_name) THEN
         -- Check if clinic_id column exists
         IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = v_table_name AND column_name = 'clinic_id') THEN
             
             EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table_name);
             EXECUTE format('DROP POLICY IF EXISTS "%I_clinic_access" ON public.%I', v_table_name, v_table_name);
             EXECUTE format('DROP POLICY IF EXISTS "%I_super_admin" ON public.%I', v_table_name, v_table_name);
             
             EXECUTE format('CREATE POLICY "%I_super_admin" ON public.%I FOR ALL TO authenticated USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin())', v_table_name, v_table_name);
             EXECUTE format('CREATE POLICY "%I_clinic_access" ON public.%I FOR ALL TO authenticated USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id())', v_table_name, v_table_name);
             
         END IF;
    END IF;
  END LOOP;
END $$;
