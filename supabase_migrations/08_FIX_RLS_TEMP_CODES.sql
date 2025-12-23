-- ============================================
-- CORRECTION DES RLS POLICIES POUR clinic_temporary_codes
-- ============================================
-- Assure que les codes temporaires peuvent être lus pour validation
-- ============================================

-- Supprimer toutes les policies existantes pour repartir à zéro
DO $$
BEGIN
  DROP POLICY IF EXISTS "super_admin_full_access_temp_codes" ON clinic_temporary_codes;
  DROP POLICY IF EXISTS "clinic_admin_read_own_temp_codes" ON clinic_temporary_codes;
  DROP POLICY IF EXISTS "public_read_temp_codes_for_validation" ON clinic_temporary_codes;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erreur lors de la suppression des policies: %', SQLERRM;
END $$;

-- Policy 1: Permettre la lecture publique des codes temporaires non convertis et non expirés
-- C'est nécessaire pour que le formulaire de connexion puisse valider le code
CREATE POLICY "public_read_temp_codes_for_validation" ON clinic_temporary_codes
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Permettre la lecture pour valider le code lors de la connexion
    is_converted = false 
    AND expires_at > NOW()
  );

-- Policy 2: SUPER_ADMIN a accès complet
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
      AND users.status = 'ACTIVE'
    )
  );

-- Policy 3: CLINIC_ADMIN peut lire les codes de sa clinique
CREATE POLICY "clinic_admin_read_own_temp_codes" ON clinic_temporary_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('CLINIC_ADMIN', 'ADMIN')
      AND users.clinic_id = clinic_temporary_codes.clinic_id
    )
  );

-- Policy 4: Permettre la mise à jour du code temporaire lors de la connexion
-- (pour marquer is_used = true)
CREATE POLICY "allow_mark_temp_code_used" ON clinic_temporary_codes
  FOR UPDATE
  TO authenticated
  USING (
    -- Permettre si l'utilisateur appartient à la clinique
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.clinic_id = clinic_temporary_codes.clinic_id
      AND users.role IN ('CLINIC_ADMIN', 'ADMIN')
    )
    AND is_converted = false
    AND expires_at > NOW()
  )
  WITH CHECK (
    -- Permettre uniquement la mise à jour de is_used et used_at
    is_converted = false
    AND expires_at > NOW()
  );

-- Vérification des policies créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'clinic_temporary_codes'
ORDER BY policyname;

DO $$
BEGIN
  RAISE NOTICE '✅ Policies RLS configurées pour clinic_temporary_codes';
END $$;

