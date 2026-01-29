-- ============================================
-- MIGRATION 61: DURCISSEMENT RLS ET CONTEXT AUTH
-- ============================================
-- Conforme au plan: policies basées sur auth.uid() / JWT via users.auth_user_id,
-- get_my_clinic_id() et check_is_super_admin(). Correction des policies qui
-- utilisaient users.id = auth.uid() (incorrect: auth.uid() = auth_user_id).
-- ============================================

-- Fonction: vérifier si l'utilisateur connecté est SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1) = 'SUPER_ADMIN';
END;
$$;

-- S'assurer que get_my_clinic_id() utilise auth_user_id (déjà le cas en 31, on confirme)
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
BEGIN
  v_jwt_clinic_id := auth.jwt() ->> 'clinic_id';
  IF v_jwt_clinic_id IS NOT NULL AND v_jwt_clinic_id != '' THEN
    BEGIN
      RETURN v_jwt_clinic_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  SELECT clinic_id INTO v_clinic_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND actif = true
  LIMIT 1;
  RETURN v_clinic_id;
END;
$$;

-- ============================================
-- CORRECTION DES POLICIES: utiliser auth_user_id = auth.uid()
-- ============================================

-- anamnese_templates: clinic_id = get_my_clinic_id() ou check_is_super_admin
DROP POLICY IF EXISTS "Users can view anamnese templates from their clinic" ON anamnese_templates;
CREATE POLICY "Users can view anamnese templates from their clinic"
ON anamnese_templates FOR SELECT TO authenticated
USING (check_is_super_admin() OR clinic_id = get_my_clinic_id());

DROP POLICY IF EXISTS "Users can create anamnese templates" ON anamnese_templates;
CREATE POLICY "Users can create anamnese templates"
ON anamnese_templates FOR INSERT TO authenticated
WITH CHECK (clinic_id = get_my_clinic_id());

DROP POLICY IF EXISTS "Users can update their anamnese templates" ON anamnese_templates;
CREATE POLICY "Users can update their anamnese templates"
ON anamnese_templates FOR UPDATE TO authenticated
USING (check_is_super_admin() OR clinic_id = get_my_clinic_id())
WITH CHECK (clinic_id = get_my_clinic_id());

DROP POLICY IF EXISTS "Users can delete their anamnese templates" ON anamnese_templates;
CREATE POLICY "Users can delete their anamnese templates"
ON anamnese_templates FOR DELETE TO authenticated
USING (check_is_super_admin() OR clinic_id = get_my_clinic_id());

-- registration_requests: super_admin tout voir; sinon clinic_id = get_my_clinic_id()
DROP POLICY IF EXISTS "super_admin_all_registration_requests" ON registration_requests;
CREATE POLICY "super_admin_all_registration_requests"
ON registration_requests FOR ALL TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

DROP POLICY IF EXISTS "clinic_admin_own_clinic_requests" ON registration_requests;
CREATE POLICY "clinic_admin_own_clinic_requests"
ON registration_requests FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE auth_user_id = auth.uid() LIMIT 1) IN ('CLINIC_ADMIN','ADMIN')
  AND clinic_id = get_my_clinic_id()
)
WITH CHECK (
  (SELECT role FROM users WHERE auth_user_id = auth.uid() LIMIT 1) IN ('CLINIC_ADMIN','ADMIN')
  AND clinic_id = get_my_clinic_id()
);

-- users: mise à jour du profil = ligne où auth_user_id = auth.uid()
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
CREATE POLICY "users_update_own_profile"
ON users FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- clinics: super_admin tout
DROP POLICY IF EXISTS "clinics_super_admin_all" ON clinics;
CREATE POLICY "clinics_super_admin_all"
ON clinics FOR ALL TO authenticated
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

-- ============================================
-- RLS ACTIVÉ SUR TABLES MÉTIER (si pas déjà)
-- ============================================
ALTER TABLE IF EXISTS public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clinics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'paiements') THEN
    ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transferts') THEN
    ALTER TABLE public.transferts ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alertes_stock') THEN
    ALTER TABLE public.alertes_stock ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'journal_caisse') THEN
    ALTER TABLE public.journal_caisse ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'imaging_requests') THEN
    ALTER TABLE public.imaging_requests ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Index clinic_id si manquants (éviter full scan sur RLS)
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_factures_clinic_id ON public.factures(clinic_id);
CREATE INDEX IF NOT EXISTS idx_consultations_clinic_id ON public.consultations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_clinic_id ON public.registration_requests(clinic_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'paiements') THEN
    CREATE INDEX IF NOT EXISTS idx_paiements_clinic_id ON public.paiements(clinic_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transferts') THEN
    CREATE INDEX IF NOT EXISTS idx_transferts_clinic_id ON public.transferts(clinic_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alertes_stock') THEN
    CREATE INDEX IF NOT EXISTS idx_alertes_stock_clinic_id ON public.alertes_stock(clinic_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'imaging_requests') THEN
    CREATE INDEX IF NOT EXISTS idx_imaging_requests_clinic_id ON public.imaging_requests(clinic_id);
  END IF;
END $$;
