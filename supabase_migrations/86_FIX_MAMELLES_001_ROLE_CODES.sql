-- ============================================
-- Correction des role_code pour les utilisateurs MAMELLES-001
-- LogiClinic - Permissions par rôle (default_role_permissions)
-- ============================================
-- Si les utilisateurs ont été créés avec des rôles métier (nurse, midwife, imaging_tech, etc.)
-- au lieu des role_code LogiClinic (infirmier, sage_femme, imagerie, etc.), get_user_permissions
-- ne trouve aucune permission par défaut et tout le monde a le même accès.
-- Cette migration met à jour users.role pour la clinique MAMELLES-001.
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_updated INTEGER;
BEGIN
  SELECT id INTO v_clinic_id FROM public.clinics WHERE code = 'MAMELLES-001' LIMIT 1;
  IF v_clinic_id IS NULL THEN
    RAISE NOTICE 'Clinique MAMELLES-001 non trouvée. Rien à faire.';
    RETURN;
  END IF;

  UPDATE public.users
  SET role = CASE role
    WHEN 'imaging_tech' THEN 'imagerie'
    WHEN 'lab_tech' THEN 'technicien_labo'
    WHEN 'midwife' THEN 'sage_femme'
    WHEN 'nurse' THEN 'infirmier'
    WHEN 'pharmacist' THEN 'pharmacien'
    WHEN 'finance' THEN 'caissier'
    ELSE role
  END,
  updated_at = NOW()
  WHERE clinic_id = v_clinic_id
    AND role IN ('imaging_tech', 'lab_tech', 'midwife', 'nurse', 'pharmacist', 'finance');

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'MAMELLES-001 : % utilisateur(s) mis à jour avec le bon role_code.', v_updated;
END $$;
