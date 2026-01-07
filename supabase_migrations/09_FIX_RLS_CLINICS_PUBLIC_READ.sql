-- ============================================
-- CORRECTION RLS POUR PERMETTRE LA LECTURE PUBLIQUE DES CLINIQUES
-- ============================================
-- Permet la lecture des cliniques lors de la validation du code temporaire
-- ============================================

-- Policy pour permettre la lecture publique des cliniques actives
-- Nécessaire pour valider le code temporaire lors de la connexion
DO $$
BEGIN
  -- Supprimer la policy si elle existe déjà
  DROP POLICY IF EXISTS "public_read_active_clinics" ON clinics;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

CREATE POLICY "public_read_active_clinics" ON clinics
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Permettre la lecture des cliniques actives pour la validation
    active = true
  );

-- Policy pour permettre la lecture des cliniques par ID lors de la validation du code temporaire
-- Cette policy est plus permissive car elle permet de lire n'importe quelle clinique active
-- par son ID (nécessaire quand on a le clinic_id depuis clinic_temporary_codes)
DO $$
BEGIN
  DROP POLICY IF EXISTS "public_read_clinic_by_id_for_temp_code" ON clinics;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

CREATE POLICY "public_read_clinic_by_id_for_temp_code" ON clinics
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Permettre la lecture si la clinique est active
    -- Cette policy est nécessaire pour récupérer la clinique via clinic_id
    active = true
  );

-- Vérification des policies créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'clinics'
ORDER BY policyname;

DO $$
BEGIN
  RAISE NOTICE '✅ Policies RLS configurées pour permettre la lecture publique des cliniques actives';
END $$;












