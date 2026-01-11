-- Migration: Contrainte unique nom + prénom par clinique
-- Date: 2025-01-XX
-- Description: Empêche la création de patients en double (même nom + prénom) dans une même clinique
-- 
-- PROBLÈME: Un patient peut avoir plusieurs dossiers avec le même nom et prénom dans une même clinique
-- SOLUTION: Nettoyer les doublons existants, puis ajouter une contrainte unique

DO $$
DECLARE
  v_duplicate_count INTEGER;
  v_kept_patient_id UUID;
  v_duplicate_patient_id UUID;
  v_clinic_id UUID;
  v_nom_normalise TEXT;
  v_prenom_normalise TEXT;
BEGIN
  RAISE NOTICE '🔍 Détection des patients en double...';
  
  -- Compter les groupes de doublons
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT clinic_id, UPPER(TRIM(nom)), UPPER(TRIM(prenom))
    FROM patients
    WHERE clinic_id IS NOT NULL
    GROUP BY clinic_id, UPPER(TRIM(nom)), UPPER(TRIM(prenom))
    HAVING COUNT(*) > 1
  ) doublons;
  
  RAISE NOTICE 'Nombre de groupes de doublons trouvés: %', v_duplicate_count;
  
  -- Nettoyer les doublons en gardant le patient le plus ancien
  IF v_duplicate_count > 0 THEN
    RAISE NOTICE '🧹 Nettoyage des doublons en cours...';
    
    -- Pour chaque groupe de doublons, garder le patient le plus ancien
    FOR v_clinic_id, v_nom_normalise, v_prenom_normalise IN
      SELECT DISTINCT 
        clinic_id, 
        UPPER(TRIM(nom)), 
        UPPER(TRIM(prenom))
      FROM patients
      WHERE clinic_id IS NOT NULL
      GROUP BY clinic_id, UPPER(TRIM(nom)), UPPER(TRIM(prenom))
      HAVING COUNT(*) > 1
    LOOP
      -- Identifier le patient à conserver (le plus ancien)
      SELECT id INTO v_kept_patient_id
      FROM patients
      WHERE clinic_id = v_clinic_id
        AND UPPER(TRIM(nom)) = v_nom_normalise
        AND UPPER(TRIM(prenom)) = v_prenom_normalise
      ORDER BY date_enregistrement ASC, created_at ASC
      LIMIT 1;
      
      RAISE NOTICE 'Conservation du patient ID: % (nom: %, prénom: %)', 
        v_kept_patient_id, v_nom_normalise, v_prenom_normalise;
      
      -- Transférer les données associées vers le patient conservé et supprimer les doublons
      FOR v_duplicate_patient_id IN
        SELECT id
        FROM patients
        WHERE clinic_id = v_clinic_id
          AND UPPER(TRIM(nom)) = v_nom_normalise
          AND UPPER(TRIM(prenom)) = v_prenom_normalise
          AND id != v_kept_patient_id
        ORDER BY date_enregistrement ASC, created_at ASC
      LOOP
        RAISE NOTICE '  → Transfert des données du patient ID: % vers le patient ID: %', 
          v_duplicate_patient_id, v_kept_patient_id;
        
        -- Transférer les consultations
        UPDATE consultations
        SET patient_id = v_kept_patient_id
        WHERE patient_id = v_duplicate_patient_id;
        
        -- Transférer les rendez-vous
        UPDATE rendez_vous
        SET patient_id = v_kept_patient_id
        WHERE patient_id = v_duplicate_patient_id;
        
        -- Transférer les prescriptions
        UPDATE prescriptions
        SET patient_id = v_kept_patient_id
        WHERE patient_id = v_duplicate_patient_id;
        
        -- Transférer les fichiers patients
        UPDATE patient_files
        SET patient_id = v_kept_patient_id
        WHERE patient_id = v_duplicate_patient_id;
        
        -- Transférer les timelines
        UPDATE patient_care_timeline
        SET patient_id = v_kept_patient_id
        WHERE patient_id = v_duplicate_patient_id;
        
        -- Transférer les dossiers obstétricaux (si la table existe)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dossier_obstetrical') THEN
          UPDATE dossier_obstetrical
          SET patient_id = v_kept_patient_id
          WHERE patient_id = v_duplicate_patient_id;
        END IF;
        
        -- Transférer les consultations CPN (si la table existe)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consultations_cpn') THEN
          UPDATE consultations_cpn
          SET patient_id = v_kept_patient_id
          WHERE patient_id = v_duplicate_patient_id;
        END IF;
        
        -- Transférer les examens laboratoire (si la table existe)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'examens_laboratoire') THEN
          UPDATE examens_laboratoire
          SET patient_id = v_kept_patient_id
          WHERE patient_id = v_duplicate_patient_id;
        END IF;
        
        -- Transférer les examens imagerie (si la table existe)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'examens_imagerie') THEN
          UPDATE examens_imagerie
          SET patient_id = v_kept_patient_id
          WHERE patient_id = v_duplicate_patient_id;
        END IF;
        
        -- Supprimer le patient doublon
        DELETE FROM patients WHERE id = v_duplicate_patient_id;
        
        RAISE NOTICE '  ✅ Patient doublon supprimé: %', v_duplicate_patient_id;
      END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ Nettoyage des doublons terminé';
  ELSE
    RAISE NOTICE 'Aucun doublon trouvé';
  END IF;
  
  -- Créer l'index unique pour empêcher les futurs doublons
  RAISE NOTICE '🔒 Création de l''index unique...';
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'patients_unique_nom_prenom_clinic_idx'
  ) THEN
    CREATE UNIQUE INDEX patients_unique_nom_prenom_clinic_idx 
    ON patients (clinic_id, UPPER(TRIM(nom)), UPPER(TRIM(prenom)))
    WHERE clinic_id IS NOT NULL;
    
    RAISE NOTICE '✅ Index unique créé: patients_unique_nom_prenom_clinic_idx';
  ELSE
    RAISE NOTICE 'Index unique existe déjà: patients_unique_nom_prenom_clinic_idx';
  END IF;
  
  -- Commentaire pour documenter la contrainte
  COMMENT ON INDEX patients_unique_nom_prenom_clinic_idx IS 
    'Empêche la création de patients en double (même nom + prénom) dans une même clinique. Normalise les noms avec UPPER et TRIM pour être insensible à la casse et aux espaces.';
  
  RAISE NOTICE '✅ Migration terminée avec succès';
END $$;
