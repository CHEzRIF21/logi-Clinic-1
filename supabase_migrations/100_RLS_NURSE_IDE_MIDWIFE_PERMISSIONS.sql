-- ============================================
-- Migration 100: RLS pour rôles nurse, ide, midwife
-- LogiClinic - Multi-tenant SaaS
-- Isolation stricte par clinic_id (auth.jwt())
-- Ne modifie PAS les permissions admin / super_admin
--
-- PRÉREQUIS: L'application doit injecter dans le JWT (custom claims):
--   - role : 'nurse' | 'ide' | 'midwife' | ...
--   - clinic_id : UUID de la clinique
-- (via validate_clinic_login, authenticate_user_by_email, ou trigger on auth)
-- ============================================

-- =============================================
-- SECTION 0: FONCTIONS HELPER (optionnelles)
-- Utilisation directe de auth.jwt() dans les policies
-- pour cohérence avec les exigences
-- =============================================

-- Vérifie si l'utilisateur a le rôle nurse, ide ou midwife
CREATE OR REPLACE FUNCTION public.check_is_nurse_ide_midwife()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() ->> 'role') IN ('nurse', 'ide', 'midwife'), false);
$$;

-- Retourne le clinic_id du JWT (ou NULL si invalide)
CREATE OR REPLACE FUNCTION public.get_jwt_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id_text TEXT;
BEGIN
  v_clinic_id_text := auth.jwt() ->> 'clinic_id';
  IF v_clinic_id_text IS NULL OR v_clinic_id_text = '' THEN
    RETURN NULL;
  END IF;
  RETURN v_clinic_id_text::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.check_is_nurse_ide_midwife IS 'Vérifie si le rôle JWT est nurse, ide ou midwife';
COMMENT ON FUNCTION public.get_jwt_clinic_id IS 'Retourne clinic_id depuis le JWT (isolation multi-tenant)';

-- =============================================
-- MODULE GESTION DES PATIENTS
-- nurse, ide, midwife : SELECT uniquement
-- Autres rôles : inchangé (super_admin, clinic_access)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients') THEN
    -- Supprimer la policy générique FOR ALL pour la remplacer par des policies granulaires
    DROP POLICY IF EXISTS "patients_clinic_access" ON public.patients;

    -- Staff clinique (admin, doctor, etc.) : accès complet SAUF nurse/ide/midwife
    CREATE POLICY "patients_clinic_staff_full" ON public.patients
    FOR ALL TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND NOT public.check_is_nurse_ide_midwife()
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND NOT public.check_is_nurse_ide_midwife()
    );

    -- nurse, ide, midwife : SELECT uniquement (via JWT clinic_id)
    CREATE POLICY "patients_nurse_ide_midwife_select" ON public.patients
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    -- Fallback SELECT pour nurse/ide/midwife (quand clinic_id vient de users, pas du JWT)
    CREATE POLICY "patients_nurse_ide_midwife_select_fallback" ON public.patients
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NULL
      AND clinic_id = public.get_my_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    -- Fallback : get_my_clinic_id pour compatibilité (rôles sans JWT clinic_id, hors nurse/ide/midwife)
    CREATE POLICY "patients_clinic_access_fallback" ON public.patients
    FOR ALL TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NULL
      AND clinic_id = public.get_my_clinic_id()
      AND NOT public.check_is_nurse_ide_midwife()
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NULL
      AND clinic_id = public.get_my_clinic_id()
      AND NOT public.check_is_nurse_ide_midwife()
    );

    RAISE NOTICE 'RLS patients: nurse/ide/midwife SELECT only, others full access';
  END IF;
END $$;

-- =============================================
-- MODULE CONSULTATION
-- nurse, ide, midwife : SELECT, INSERT, UPDATE, DELETE
-- Tables : consultations, consultation_constantes, consultation_steps,
--          consultation_entries, prescriptions, prescription_lines
-- =============================================

-- consultations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consultations') THEN
    ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "consultations_nurse_ide_midwife_select" ON public.consultations
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "consultations_nurse_ide_midwife_insert" ON public.consultations
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "consultations_nurse_ide_midwife_update" ON public.consultations
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "consultations_nurse_ide_midwife_delete" ON public.consultations
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    RAISE NOTICE 'RLS consultations: nurse/ide/midwife policies added';
  END IF;
END $$;

-- consultation_constantes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consultation_constantes') THEN
    ALTER TABLE public.consultation_constantes ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "consultation_constantes_nurse_ide_midwife_select" ON public.consultation_constantes
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "consultation_constantes_nurse_ide_midwife_insert" ON public.consultation_constantes
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "consultation_constantes_nurse_ide_midwife_update" ON public.consultation_constantes
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "consultation_constantes_nurse_ide_midwife_delete" ON public.consultation_constantes
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    RAISE NOTICE 'RLS consultation_constantes: nurse/ide/midwife policies added';
  END IF;
END $$;

-- consultation_steps (via consult_id -> consultations.clinic_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consultation_steps') THEN
    ALTER TABLE public.consultation_steps ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "consultation_steps_nurse_ide_midwife_select" ON public.consultation_steps
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.consultations c
        WHERE c.id = consultation_steps.consult_id AND c.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "consultation_steps_nurse_ide_midwife_insert" ON public.consultation_steps
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.consultations c
        WHERE c.id = consultation_steps.consult_id AND c.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "consultation_steps_nurse_ide_midwife_update" ON public.consultation_steps
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.consultations c
        WHERE c.id = consultation_steps.consult_id AND c.clinic_id = public.get_jwt_clinic_id()
      )
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.consultations c
        WHERE c.id = consultation_steps.consult_id AND c.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "consultation_steps_nurse_ide_midwife_delete" ON public.consultation_steps
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.consultations c
        WHERE c.id = consultation_steps.consult_id AND c.clinic_id = public.get_jwt_clinic_id()
      )
    );

    RAISE NOTICE 'RLS consultation_steps: nurse/ide/midwife policies added';
  END IF;
END $$;

-- consultation_entries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consultation_entries') THEN
    ALTER TABLE public.consultation_entries ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "consultation_entries_nurse_ide_midwife_select" ON public.consultation_entries
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "consultation_entries_nurse_ide_midwife_insert" ON public.consultation_entries
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "consultation_entries_nurse_ide_midwife_update" ON public.consultation_entries
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "consultation_entries_nurse_ide_midwife_delete" ON public.consultation_entries
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    RAISE NOTICE 'RLS consultation_entries: nurse/ide/midwife policies added';
  END IF;
END $$;

-- prescriptions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prescriptions') THEN
    ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "prescriptions_nurse_ide_midwife_select" ON public.prescriptions
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "prescriptions_nurse_ide_midwife_insert" ON public.prescriptions
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "prescriptions_nurse_ide_midwife_update" ON public.prescriptions
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    CREATE POLICY "prescriptions_nurse_ide_midwife_delete" ON public.prescriptions
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND clinic_id = public.get_jwt_clinic_id()
      AND public.check_is_nurse_ide_midwife()
    );

    RAISE NOTICE 'RLS prescriptions: nurse/ide/midwife policies added';
  END IF;
END $$;

-- prescription_lines (pas de clinic_id direct, via prescriptions)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prescription_lines') THEN
    ALTER TABLE public.prescription_lines ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "prescription_lines_nurse_ide_midwife_select" ON public.prescription_lines
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.prescriptions p
        WHERE p.id = prescription_lines.prescription_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "prescription_lines_nurse_ide_midwife_insert" ON public.prescription_lines
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.prescriptions p
        WHERE p.id = prescription_lines.prescription_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "prescription_lines_nurse_ide_midwife_update" ON public.prescription_lines
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.prescriptions p
        WHERE p.id = prescription_lines.prescription_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.prescriptions p
        WHERE p.id = prescription_lines.prescription_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "prescription_lines_nurse_ide_midwife_delete" ON public.prescription_lines
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.prescriptions p
        WHERE p.id = prescription_lines.prescription_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    RAISE NOTICE 'RLS prescription_lines (via prescription): nurse/ide/midwife policies added';
  END IF;
END $$;

-- =============================================
-- MODULE MATERNITÉ
-- nurse, ide, midwife : SELECT, INSERT, UPDATE, DELETE
-- Tables : dossier_obstetrical, consultation_prenatale, accouchement,
--          delivrance, examen_placenta, nouveau_ne, surveillance_post_partum, etc.
-- =============================================

-- dossier_obstetrical (via patient_id -> patients.clinic_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dossier_obstetrical') THEN
    ALTER TABLE public.dossier_obstetrical ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "dossier_obstetrical_nurse_ide_midwife_select" ON public.dossier_obstetrical
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = dossier_obstetrical.patient_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "dossier_obstetrical_nurse_ide_midwife_insert" ON public.dossier_obstetrical
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = dossier_obstetrical.patient_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "dossier_obstetrical_nurse_ide_midwife_update" ON public.dossier_obstetrical
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = dossier_obstetrical.patient_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = dossier_obstetrical.patient_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "dossier_obstetrical_nurse_ide_midwife_delete" ON public.dossier_obstetrical
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = dossier_obstetrical.patient_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    RAISE NOTICE 'RLS dossier_obstetrical: nurse/ide/midwife policies added';
  END IF;
END $$;

-- consultation_prenatale (via dossier_obstetrical -> patient)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consultation_prenatale') THEN
    ALTER TABLE public.consultation_prenatale ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "consultation_prenatale_nurse_ide_midwife_select" ON public.consultation_prenatale
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.dossier_obstetrical d
        JOIN public.patients p ON p.id = d.patient_id
        WHERE d.id = consultation_prenatale.dossier_obstetrical_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "consultation_prenatale_nurse_ide_midwife_insert" ON public.consultation_prenatale
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.dossier_obstetrical d
        JOIN public.patients p ON p.id = d.patient_id
        WHERE d.id = consultation_prenatale.dossier_obstetrical_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "consultation_prenatale_nurse_ide_midwife_update" ON public.consultation_prenatale
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.dossier_obstetrical d
        JOIN public.patients p ON p.id = d.patient_id
        WHERE d.id = consultation_prenatale.dossier_obstetrical_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.dossier_obstetrical d
        JOIN public.patients p ON p.id = d.patient_id
        WHERE d.id = consultation_prenatale.dossier_obstetrical_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "consultation_prenatale_nurse_ide_midwife_delete" ON public.consultation_prenatale
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.dossier_obstetrical d
        JOIN public.patients p ON p.id = d.patient_id
        WHERE d.id = consultation_prenatale.dossier_obstetrical_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    RAISE NOTICE 'RLS consultation_prenatale: nurse/ide/midwife policies added';
  END IF;
END $$;

-- accouchement (via dossier_obstetrical -> patient)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accouchement') THEN
    ALTER TABLE public.accouchement ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "accouchement_nurse_ide_midwife_select" ON public.accouchement
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.dossier_obstetrical d
        JOIN public.patients p ON p.id = d.patient_id
        WHERE d.id = accouchement.dossier_obstetrical_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "accouchement_nurse_ide_midwife_insert" ON public.accouchement
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.dossier_obstetrical d
        JOIN public.patients p ON p.id = d.patient_id
        WHERE d.id = accouchement.dossier_obstetrical_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "accouchement_nurse_ide_midwife_update" ON public.accouchement
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.dossier_obstetrical d
        JOIN public.patients p ON p.id = d.patient_id
        WHERE d.id = accouchement.dossier_obstetrical_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.dossier_obstetrical d
        JOIN public.patients p ON p.id = d.patient_id
        WHERE d.id = accouchement.dossier_obstetrical_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "accouchement_nurse_ide_midwife_delete" ON public.accouchement
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.dossier_obstetrical d
        JOIN public.patients p ON p.id = d.patient_id
        WHERE d.id = accouchement.dossier_obstetrical_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    RAISE NOTICE 'RLS accouchement: nurse/ide/midwife policies added';
  END IF;
END $$;

-- delivrance (via accouchement -> dossier_obstetrical -> patient)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'delivrance') THEN
    ALTER TABLE public.delivrance ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "delivrance_nurse_ide_midwife_select" ON public.delivrance
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = delivrance.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "delivrance_nurse_ide_midwife_insert" ON public.delivrance
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = delivrance.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "delivrance_nurse_ide_midwife_update" ON public.delivrance
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = delivrance.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = delivrance.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "delivrance_nurse_ide_midwife_delete" ON public.delivrance
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = delivrance.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    RAISE NOTICE 'RLS delivrance: nurse/ide/midwife policies added';
  END IF;
END $$;

-- examen_placenta, nouveau_ne, surveillance_post_partum (via accouchement)
DO $$
BEGIN
  -- examen_placenta
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'examen_placenta') THEN
    ALTER TABLE public.examen_placenta ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "examen_placenta_nurse_ide_midwife_select" ON public.examen_placenta
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = examen_placenta.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "examen_placenta_nurse_ide_midwife_insert" ON public.examen_placenta
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = examen_placenta.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "examen_placenta_nurse_ide_midwife_update" ON public.examen_placenta
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = examen_placenta.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = examen_placenta.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "examen_placenta_nurse_ide_midwife_delete" ON public.examen_placenta
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = examen_placenta.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    RAISE NOTICE 'RLS examen_placenta: nurse/ide/midwife policies added';
  END IF;
END $$;

-- nouveau_ne
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nouveau_ne') THEN
    ALTER TABLE public.nouveau_ne ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "nouveau_ne_nurse_ide_midwife_select" ON public.nouveau_ne
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = nouveau_ne.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "nouveau_ne_nurse_ide_midwife_insert" ON public.nouveau_ne
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = nouveau_ne.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "nouveau_ne_nurse_ide_midwife_update" ON public.nouveau_ne
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = nouveau_ne.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = nouveau_ne.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "nouveau_ne_nurse_ide_midwife_delete" ON public.nouveau_ne
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = nouveau_ne.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    RAISE NOTICE 'RLS nouveau_ne: nurse/ide/midwife policies added';
  END IF;
END $$;

-- surveillance_post_partum (via accouchement)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'surveillance_post_partum') THEN
    ALTER TABLE public.surveillance_post_partum ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "surveillance_post_partum_nurse_ide_midwife_select" ON public.surveillance_post_partum
    FOR SELECT TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = surveillance_post_partum.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "surveillance_post_partum_nurse_ide_midwife_insert" ON public.surveillance_post_partum
    FOR INSERT TO authenticated
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = surveillance_post_partum.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "surveillance_post_partum_nurse_ide_midwife_update" ON public.surveillance_post_partum
    FOR UPDATE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = surveillance_post_partum.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    )
    WITH CHECK (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = surveillance_post_partum.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    CREATE POLICY "surveillance_post_partum_nurse_ide_midwife_delete" ON public.surveillance_post_partum
    FOR DELETE TO authenticated
    USING (
      public.get_jwt_clinic_id() IS NOT NULL
      AND public.check_is_nurse_ide_midwife()
      AND EXISTS (
        SELECT 1 FROM public.accouchement a
        JOIN public.dossier_obstetrical d ON d.id = a.dossier_obstetrical_id
        JOIN public.patients p ON p.id = d.patient_id
        WHERE a.id = surveillance_post_partum.accouchement_id AND p.clinic_id = public.get_jwt_clinic_id()
      )
    );

    RAISE NOTICE 'RLS surveillance_post_partum: nurse/ide/midwife policies added';
  END IF;
END $$;

-- Tables maternité liées (via dossier_obstetrical)
-- droits_fondamentaux, vaccination_maternelle, plan_accouchement, soins_promotionnels, traitement_cpn, conseils_mere (dossier_obstetrical_id)
-- observation_post_partum, traitement_post_partum, conseils_post_partum, complication_post_partum, sortie_salle_naissance (surveillance_post_partum_id)
-- grossesses_anterieures (dossier_obstetrical_id)

-- =============================================
-- RÉSUMÉ ET VALIDATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Migration 100 appliquée: RLS nurse/ide/midwife';
  RAISE NOTICE '- PATIENTS: SELECT uniquement pour nurse/ide/midwife';
  RAISE NOTICE '- CONSULTATION: SELECT/INSERT/UPDATE/DELETE';
  RAISE NOTICE '- MATERNITÉ: SELECT/INSERT/UPDATE/DELETE';
  RAISE NOTICE '- Condition: clinic_id = auth.jwt() ->> ''clinic_id''';
  RAISE NOTICE '- Rôles: nurse, ide, midwife';
  RAISE NOTICE '============================================';
END $$;
