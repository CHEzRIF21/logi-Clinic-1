-- ============================================
-- Migration 101: Corrections critiques schéma
-- LogiClinic - Audit technique 10/02/2026
-- Bloque: consultation_constantes, alertes_maternite
-- ============================================

-- =============================================
-- 1. consultation_constantes : colonne consultation_id
-- Le frontend utilise .eq('consultation_id', id) alors que la table
-- a consult_id. Migration 56 ajoutait UNIQUE(consultation_id) sans
-- créer la colonne -> risque d'échec.
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consultation_constantes') THEN
    -- Ajouter consultation_id si absent
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'consultation_constantes' AND column_name = 'consultation_id'
    ) THEN
      ALTER TABLE public.consultation_constantes
        ADD COLUMN consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE;
      RAISE NOTICE '✅ consultation_constantes.consultation_id ajoutée';
    END IF;

    -- Synchroniser depuis consult_id
    UPDATE public.consultation_constantes
    SET consultation_id = consult_id
    WHERE consultation_id IS NULL AND consult_id IS NOT NULL;

    -- Contrainte UNIQUE si pas déjà présente
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'consultation_constantes' AND c.conname = 'consultation_constantes_unique_consultation_id'
    ) THEN
      ALTER TABLE public.consultation_constantes
        ADD CONSTRAINT consultation_constantes_unique_consultation_id
        UNIQUE (consultation_id);
      RAISE NOTICE '✅ Contrainte UNIQUE(consultation_id) ajoutée';
    END IF;
  END IF;
END $$;

-- =============================================
-- 2. Table alertes_maternite
-- Maternite.tsx requête cette table pour les alertes.
-- =============================================

CREATE TABLE IF NOT EXISTS public.alertes_maternite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  dossier_obstetrical_id UUID REFERENCES public.dossier_obstetrical(id) ON DELETE CASCADE,
  type_alerte VARCHAR(100) NOT NULL,
  message TEXT,
  severite VARCHAR(20) DEFAULT 'info' CHECK (severite IN ('info', 'warning', 'urgence')),
  date_alerte TIMESTAMPTZ DEFAULT NOW(),
  lue BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertes_maternite_clinic ON public.alertes_maternite(clinic_id);
CREATE INDEX IF NOT EXISTS idx_alertes_maternite_dossier ON public.alertes_maternite(dossier_obstetrical_id);
CREATE INDEX IF NOT EXISTS idx_alertes_maternite_patient ON public.alertes_maternite(patient_id);

-- RLS
ALTER TABLE public.alertes_maternite ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alertes_maternite_clinic_access" ON public.alertes_maternite;
CREATE POLICY "alertes_maternite_clinic_access" ON public.alertes_maternite
  FOR ALL TO authenticated
  USING (
    clinic_id = public.get_my_clinic_id()
    OR public.check_is_super_admin()
  )
  WITH CHECK (
    clinic_id = public.get_my_clinic_id()
    OR public.check_is_super_admin()
  );

COMMENT ON TABLE public.alertes_maternite IS 'Alertes du module maternité (CPN, accouchement, post-partum)';

-- =============================================
-- 3. Rafraîchir le cache PostgREST
-- =============================================

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE 'Migration 101 appliquée: consultation_constantes.consultation_id, alertes_maternite';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
