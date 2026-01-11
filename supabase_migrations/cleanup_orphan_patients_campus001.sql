-- Migration: Nettoyage des patients "fantômes" (clinic_id = null) pour CAMPUS-001
-- Date: 2025-01-XX
-- Description: Supprime les patients orphelins qui n'ont pas de clinic_id
-- 
-- PROBLÈME: Des patients existent avec clinic_id = null, ce qui bloque l'utilisation d'identifiants comme PAT001
-- SOLUTION: Supprimer ces patients orphelins

DO $$
DECLARE
  v_clinic_id UUID;
  v_orphan_count INTEGER;
BEGIN
  -- Récupérer le clinic_id pour CAMPUS-001
  SELECT id INTO v_clinic_id
  FROM clinics
  WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 non trouvée';
  END IF;
  
  -- Compter les patients orphelins (clinic_id = null)
  SELECT COUNT(*) INTO v_orphan_count
  FROM patients
  WHERE clinic_id IS NULL;
  
  RAISE NOTICE 'Nombre de patients orphelins (clinic_id = null) trouvés: %', v_orphan_count;
  
  IF v_orphan_count > 0 THEN
    -- Supprimer les patients orphelins et leurs données associées
    -- Note: Les contraintes CASCADE supprimeront automatiquement les données liées
    
    -- Supprimer les rendez-vous liés
    DELETE FROM rendez_vous
    WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id IS NULL);
    
    -- Supprimer les consultations liées
    DELETE FROM consultations
    WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id IS NULL);
    
    -- Supprimer les prescriptions liées
    DELETE FROM prescriptions
    WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id IS NULL);
    
    -- Supprimer les fichiers patients
    DELETE FROM patient_files
    WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id IS NULL);
    
    -- Supprimer les timelines
    DELETE FROM patient_care_timeline
    WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id IS NULL);
    
    -- Supprimer les patients orphelins
    DELETE FROM patients
    WHERE clinic_id IS NULL;
    
    RAISE NOTICE '✅ % patients orphelins supprimés avec succès', v_orphan_count;
  ELSE
    RAISE NOTICE 'Aucun patient orphelin trouvé';
  END IF;
  
END $$;
