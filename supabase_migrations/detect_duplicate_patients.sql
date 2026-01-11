-- Script: Détection des patients en double
-- Date: 2025-01-XX
-- Description: Détecte les patients avec le même nom et prénom dans une même clinique
-- 
-- UTILISATION: Exécuter ce script pour identifier les doublons existants avant d'appliquer la contrainte unique

-- Afficher tous les patients en double (même nom + prénom dans la même clinique)
SELECT 
  clinic_id,
  UPPER(TRIM(nom)) as nom_normalise,
  UPPER(TRIM(prenom)) as prenom_normalise,
  COUNT(*) as nombre_doublons,
  STRING_AGG(identifiant, ', ' ORDER BY identifiant) as identifiants,
  STRING_AGG(id::text, ', ' ORDER BY id) as ids,
  STRING_AGG(date_enregistrement::text, ', ' ORDER BY date_enregistrement) as dates_enregistrement
FROM patients
WHERE clinic_id IS NOT NULL
GROUP BY clinic_id, UPPER(TRIM(nom)), UPPER(TRIM(prenom))
HAVING COUNT(*) > 1
ORDER BY clinic_id, nom_normalise, prenom_normalise;

-- Compter le nombre total de doublons
SELECT 
  COUNT(*) as total_groupes_doublons,
  SUM(nombre_doublons - 1) as total_patients_en_doublon
FROM (
  SELECT 
    clinic_id,
    UPPER(TRIM(nom)) as nom_normalise,
    UPPER(TRIM(prenom)) as prenom_normalise,
    COUNT(*) as nombre_doublons
  FROM patients
  WHERE clinic_id IS NOT NULL
  GROUP BY clinic_id, UPPER(TRIM(nom)), UPPER(TRIM(prenom))
  HAVING COUNT(*) > 1
) doublons;
