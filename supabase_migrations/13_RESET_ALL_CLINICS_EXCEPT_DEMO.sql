-- ============================================
-- RÉINITIALISATION COMPLÈTE DES CLINIQUES RÉELLES
-- PRÉSERVATION DE LA CLINIQUE DÉMO CLINIC001
-- ============================================
-- Ce script :
-- 1. PRÉSERVE COMPLÈTEMENT CLINIC001 (démo) - AUCUNE MODIFICATION
-- 2. RÉINITIALISE COMPLÈTEMENT toutes les autres cliniques (CAMPUS-001, etc.) :
--    - Supprime TOUS les utilisateurs de ces cliniques
--    - Configure le code comme PERMANENT (non modifiable)
--    - Supprime les codes temporaires
--    - Les cliniques restent actives mais sans utilisateurs
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_clinic_code TEXT;
  v_users_deleted INTEGER;
  v_clinic_count INTEGER := 0;
BEGIN
  -- Vérifier que CLINIC001 existe et est préservée
  SELECT COUNT(*) INTO v_clinic_count 
  FROM clinics 
  WHERE code = 'CLINIC001' AND active = true;
  
  IF v_clinic_count > 0 THEN
    RAISE NOTICE '✅ CLINIC001 (démo) détectée - PRÉSERVATION COMPLÈTE';
    RAISE NOTICE '   Aucune modification ne sera apportée à CLINIC001';
  END IF;
  
  -- Parcourir toutes les cliniques SAUF CLINIC001
  FOR v_clinic_id, v_clinic_code IN 
    SELECT id, code 
    FROM clinics 
    WHERE code != 'CLINIC001'  -- Exclure la clinique démo
    AND active = true
  LOOP
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉINITIALISATION COMPLÈTE: % (ID: %)', v_clinic_code, v_clinic_id;
    
    -- 1. SUPPRIMER TOUS LES UTILISATEURS de cette clinique
    -- (sauf le SUPER_ADMIN qui n'est pas lié à une clinique)
    DELETE FROM users
    WHERE clinic_id = v_clinic_id
      AND role != 'SUPER_ADMIN';  -- Préserver le SUPER_ADMIN
    
    GET DIAGNOSTICS v_users_deleted = ROW_COUNT;
    RAISE NOTICE '✅ % utilisateur(s) supprimé(s) de %', v_users_deleted, v_clinic_code;
    
    -- 2. Configurer la clinique comme PERMANENTE
    UPDATE clinics
    SET 
      is_temporary_code = false,
      requires_code_change = false,
      active = true,
      updated_at = NOW()
    WHERE id = v_clinic_id;
    
    RAISE NOTICE '✅ Clinique % configurée comme permanente', v_clinic_code;
    
    -- 3. Supprimer les codes temporaires pour cette clinique
    DELETE FROM clinic_temporary_codes
    WHERE clinic_id = v_clinic_id;
    
    RAISE NOTICE '✅ Codes temporaires supprimés pour %', v_clinic_code;
    
    RAISE NOTICE '✅ Réinitialisation complète terminée pour %', v_clinic_code;
    
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RÉINITIALISATION GLOBALE TERMINÉE';
  RAISE NOTICE '   - CLINIC001 (démo) : PRÉSERVÉE (aucune modification)';
  RAISE NOTICE '   - Autres cliniques : RÉINITIALISÉES (utilisateurs supprimés)';
  RAISE NOTICE '   - Les cliniques sont prêtes pour une nouvelle configuration';
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VÉRIFICATION POST-RÉINITIALISATION
-- ============================================

-- Afficher toutes les cliniques et leur statut
SELECT 
  'VÉRIFICATION' as verification,
  c.code,
  c.name,
  c.is_temporary_code,
  c.requires_code_change,
  c.active,
  COUNT(DISTINCT u.id) as nb_utilisateurs_total,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'CLINIC_ADMIN') as nb_admins,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'MEDECIN') as nb_medecins,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'INFIRMIER') as nb_infirmiers,
  CASE 
    WHEN c.code = 'CLINIC001' THEN '✅ Clinique démo (PRÉSERVÉE - aucune modification)'
    WHEN COUNT(DISTINCT u.id) = 0 THEN '✅ Réinitialisée (aucun utilisateur)'
    WHEN c.is_temporary_code = false AND c.requires_code_change = false THEN '✅ Réinitialisée (code permanent)'
    ELSE '⚠️ Configuration à vérifier'
  END as statut
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id AND u.role != 'SUPER_ADMIN'
WHERE c.active = true
GROUP BY c.id, c.code, c.name, c.is_temporary_code, c.requires_code_change, c.active
ORDER BY 
  CASE WHEN c.code = 'CLINIC001' THEN 1 ELSE 2 END,  -- CLINIC001 en premier
  c.code;

-- Afficher les détails des utilisateurs restants (devrait être uniquement CLINIC001)
SELECT 
  'UTILISATEURS RESTANTS' as info,
  c.code as clinic_code,
  u.email,
  u.nom,
  u.prenom,
  u.role,
  u.status
FROM users u
JOIN clinics c ON u.clinic_id = c.id
WHERE c.active = true
  AND u.role != 'SUPER_ADMIN'
ORDER BY 
  CASE WHEN c.code = 'CLINIC001' THEN 1 ELSE 2 END,
  c.code,
  u.role;

