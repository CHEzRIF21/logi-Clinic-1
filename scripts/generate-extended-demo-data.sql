-- Script SQL pour générer des données de démonstration étendues
-- Module Maternité - Logi Clinic
-- Date: 2024-12-20

-- Supprimer les anciennes données de démo (optionnel - commenté pour préserver les données existantes)
-- TRUNCATE TABLE grossesses_anterieures CASCADE;
-- TRUNCATE TABLE consultation_prenatale CASCADE;
-- TRUNCATE TABLE traitement_cpn CASCADE;
-- TRUNCATE TABLE conseils_mere CASCADE;
-- TRUNCATE TABLE vaccination_maternelle CASCADE;
-- TRUNCATE TABLE soins_promotionnels CASCADE;
-- TRUNCATE TABLE dossier_obstetrical CASCADE;
-- TRUNCATE TABLE patients CASCADE;

-- ============================================
-- 1. PATIENTS (20 patients supplémentaires)
-- ============================================
INSERT INTO patients (identifiant, nom, prenom, sexe, date_naissance, age, lieu_naissance, nationalite, adresse, telephone, profession, situation_matrimoniale, groupe_sanguin, date_enregistrement, service_initial, statut)
VALUES
-- Patients pour Maternité
('PAT-010', 'ADJOVI', 'Marie-Claire', 'Féminin', '1995-03-15', 29, 'Cotonou', 'Béninoise', 'Quartier Gbégamey, Cotonou', '+229 97 12 34 56', 'Enseignante', 'Marié(e)', 'A', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-011', 'GBAGUIDI', 'Agnès', 'Féminin', '1992-07-22', 32, 'Porto-Novo', 'Béninoise', 'Zone Akpakpa, Cotonou', '+229 96 45 67 89', 'Commerçante', 'Marié(e)', 'O', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-012', 'HOUNKPATIN', 'Bénédicte', 'Féminin', '1998-11-08', 26, 'Abomey-Calavi', 'Béninoise', 'Quartier Zogbo, Cotonou', '+229 95 78 90 12', 'Étudiante', 'Célibataire', 'B', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-013', 'KPODJI', 'Clarisse', 'Féminin', '1990-05-30', 34, 'Parakou', 'Béninoise', 'Zone Avotrou, Cotonou', '+229 94 56 78 90', 'Infirmière', 'Marié(e)', 'AB', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-014', 'MIGAN', 'Dorothée', 'Féminin', '1993-09-12', 31, 'Cotonou', 'Béninoise', 'Quartier Fidjrossè, Cotonou', '+229 93 45 67 89', 'Fonctionnaire', 'Marié(e)', 'A', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-015', 'NOUGBODJI', 'Élise', 'Féminin', '1996-01-25', 28, 'Ouidah', 'Béninoise', 'Zone Agla, Cotonou', '+229 92 34 56 78', 'Secrétaire', 'Marié(e)', 'O', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-016', 'OUEDRAOGO', 'Françoise', 'Féminin', '1991-12-18', 33, 'Natitingou', 'Béninoise', 'Quartier Cadjehoun, Cotonou', '+229 91 23 45 67', 'Comptable', 'Marié(e)', 'B', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-017', 'SAGBO', 'Gisèle', 'Féminin', '1994-08-05', 30, 'Lokossa', 'Béninoise', 'Zone Gbégamey, Cotonou', '+229 90 12 34 56', 'Coiffeuse', 'Marié(e)', 'A', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-018', 'TCHABI', 'Hélène', 'Féminin', '1997-04-20', 27, 'Kandi', 'Béninoise', 'Quartier Akpakpa, Cotonou', '+229 99 89 01 23', 'Vendeuse', 'Célibataire', 'O', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-019', 'VODOUHE', 'Irène', 'Féminin', '1992-10-14', 32, 'Djougou', 'Béninoise', 'Zone Fidjrossè, Cotonou', '+229 98 78 90 12', 'Agricultrice', 'Marié(e)', 'B', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-020', 'YEHOUESSI', 'Joséphine', 'Féminin', '1995-06-28', 29, 'Bohicon', 'Béninoise', 'Quartier Agla, Cotonou', '+229 97 67 89 01', 'Sage-femme', 'Marié(e)', 'A', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-021', 'ZOUNGRANA', 'Karine', 'Féminin', '1993-02-11', 31, 'Savalou', 'Béninoise', 'Zone Cadjehoun, Cotonou', '+229 96 56 78 90', 'Pharmacienne', 'Marié(e)', 'AB', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-022', 'AHOUNOU', 'Laurence', 'Féminin', '1996-11-03', 28, 'Allada', 'Béninoise', 'Quartier Zogbo, Cotonou', '+229 95 45 67 89', 'Éducatrice', 'Marié(e)', 'O', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-023', 'BOKONON', 'Martine', 'Féminin', '1991-07-19', 33, 'Comè', 'Béninoise', 'Zone Avotrou, Cotonou', '+229 94 34 56 78', 'Assistante sociale', 'Marié(e)', 'B', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-024', 'DANSOU', 'Nathalie', 'Féminin', '1994-03-07', 30, 'Dassa-Zoumè', 'Béninoise', 'Quartier Gbégamey, Cotonou', '+229 93 23 45 67', 'Infirmière', 'Marié(e)', 'A', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-025', 'EGBETOKUN', 'Odile', 'Féminin', '1997-09-23', 27, 'Kétou', 'Béninoise', 'Zone Akpakpa, Cotonou', '+229 92 12 34 56', 'Étudiante', 'Célibataire', 'O', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-026', 'FANOU', 'Patricia', 'Féminin', '1990-12-16', 34, 'Pobè', 'Béninoise', 'Quartier Fidjrossè, Cotonou', '+229 91 01 23 45', 'Commerçante', 'Marié(e)', 'B', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-027', 'GLELE', 'Quitterie', 'Féminin', '1993-05-29', 31, 'Sakété', 'Béninoise', 'Zone Agla, Cotonou', '+229 90 90 12 34', 'Fonctionnaire', 'Marié(e)', 'A', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-028', 'HOUNGBEDJI', 'Rosalie', 'Féminin', '1996-01-13', 28, 'Tchaourou', 'Béninoise', 'Quartier Cadjehoun, Cotonou', '+229 99 89 01 23', 'Enseignante', 'Marié(e)', 'AB', CURRENT_DATE, 'Maternité', 'Nouveau'),
('PAT-029', 'KINDE', 'Sylvie', 'Féminin', '1992-08-26', 32, 'Bembèrèkè', 'Béninoise', 'Zone Gbégamey, Cotonou', '+229 98 78 90 12', 'Secrétaire', 'Marié(e)', 'O', CURRENT_DATE, 'Maternité', 'Nouveau')
ON CONFLICT (identifiant) DO NOTHING;

-- ============================================
-- 2. DOSSIERS OBSTÉTRICAUX (15 dossiers supplémentaires)
-- ============================================
INSERT INTO dossier_obstetrical (
  patient_id, date_entree, numero_dossier, gestite, parite, nombre_enfants_vivants, 
  nombre_enfants_decedes, ddr, dpa, statut, age_superieur_35, hta_connue, diabete
)
SELECT 
  p.id,
  CURRENT_DATE - INTERVAL '30 days' * (ROW_NUMBER() OVER () % 90),
  'DOS-' || LPAD((ROW_NUMBER() OVER () + 3)::TEXT, 4, '0'),
  (ROW_NUMBER() OVER () % 5) + 1,
  (ROW_NUMBER() OVER () % 4),
  (ROW_NUMBER() OVER () % 3),
  CASE WHEN (ROW_NUMBER() OVER () % 10) = 0 THEN 1 ELSE 0 END,
  CURRENT_DATE - INTERVAL '180 days' - (ROW_NUMBER() OVER () % 60) * INTERVAL '1 day',
  CURRENT_DATE - INTERVAL '180 days' - (ROW_NUMBER() OVER () % 60) * INTERVAL '1 day' + INTERVAL '280 days',
  CASE (ROW_NUMBER() OVER () % 4)
    WHEN 0 THEN 'en_cours'
    WHEN 1 THEN 'accouche'
    WHEN 2 THEN 'post_partum'
    ELSE 'clos'
  END,
  CASE WHEN (ROW_NUMBER() OVER () % 3) = 0 THEN true ELSE false END,
  CASE WHEN (ROW_NUMBER() OVER () % 5) = 0 THEN true ELSE false END,
  CASE WHEN (ROW_NUMBER() OVER () % 7) = 0 THEN true ELSE false END
FROM patients p
WHERE p.identifiant LIKE 'PAT-0%'
AND p.id NOT IN (SELECT patient_id FROM dossier_obstetrical)
LIMIT 15;

-- ============================================
-- 3. GROSSESSES ANTÉRIEURES (30 enregistrements supplémentaires)
-- ============================================
INSERT INTO grossesses_anterieures (dossier_obstetrical_id, annee, evolution, poids, sexe, etat_enfants)
SELECT 
  d.id,
  2020 + (ROW_NUMBER() OVER () % 5),
  CASE (ROW_NUMBER() OVER () % 4)
    WHEN 0 THEN 'Accouchement voie basse'
    WHEN 1 THEN 'Césarienne'
    WHEN 2 THEN 'Accouchement voie basse'
    ELSE 'Accouchement voie basse'
  END,
  2.5 + (ROW_NUMBER() OVER () % 30) * 0.1,
  CASE (ROW_NUMBER() OVER () % 2) WHEN 0 THEN 'Masculin' ELSE 'Féminin' END,
  CASE (ROW_NUMBER() OVER () % 10)
    WHEN 0 THEN 'Décédé'
    ELSE 'Vivant'
  END
FROM dossier_obstetrical d
CROSS JOIN generate_series(1, 2) gs
WHERE d.id NOT IN (SELECT DISTINCT dossier_obstetrical_id FROM grossesses_anterieures)
LIMIT 30;

-- ============================================
-- 4. CONSULTATIONS PRÉNATALES (40 CPN supplémentaires)
-- ============================================
INSERT INTO consultation_prenatale (
  dossier_obstetrical_id, numero_cpn, trimestre, date_consultation, terme_semaines,
  poids, taille_uterine, position_foetale, mouvements_foetaux, bruit_coeur_foetal,
  oedemes, etat_general, tension_arterielle, temperature, presentation,
  hauteur_uterine, test_albumine, test_nitrite, test_vih, test_syphilis,
  hemoglobine, groupe_sanguin, prochain_rdv, statut
)
SELECT 
  d.id,
  (ROW_NUMBER() OVER (PARTITION BY d.id ORDER BY RANDOM()) % 4) + 1,
  CASE 
    WHEN (ROW_NUMBER() OVER (PARTITION BY d.id ORDER BY RANDOM()) % 4) = 1 THEN 1
    WHEN (ROW_NUMBER() OVER (PARTITION BY d.id ORDER BY RANDOM()) % 4) = 2 THEN 2
    ELSE 3
  END,
  CURRENT_DATE - INTERVAL '30 days' * (ROW_NUMBER() OVER () % 120),
  8 + (ROW_NUMBER() OVER () % 32),
  55 + (ROW_NUMBER() OVER () % 25),
  10 + (ROW_NUMBER() OVER () % 20),
  CASE (ROW_NUMBER() OVER () % 3) WHEN 0 THEN 'Céphalique' WHEN 1 THEN 'Siège' ELSE 'Transverse' END,
  true,
  true,
  CASE WHEN (ROW_NUMBER() OVER () % 5) = 0 THEN true ELSE false END,
  'Bon',
  '120/' || (70 + (ROW_NUMBER() OVER () % 20)),
  36.5 + (ROW_NUMBER() OVER () % 2) * 0.5,
  CASE (ROW_NUMBER() OVER () % 3) WHEN 0 THEN 'Céphalique' WHEN 1 THEN 'Siège' ELSE 'Transverse' END,
  15 + (ROW_NUMBER() OVER () % 25),
  CASE (ROW_NUMBER() OVER () % 10) WHEN 0 THEN 'Positif' ELSE 'Négatif' END,
  'Négatif',
  'Négatif',
  'Négatif',
  10 + (ROW_NUMBER() OVER () % 5),
  CASE (ROW_NUMBER() OVER () % 4) WHEN 0 THEN 'A' WHEN 1 THEN 'B' WHEN 2 THEN 'AB' ELSE 'O' END,
  CURRENT_DATE - INTERVAL '30 days' * (ROW_NUMBER() OVER () % 120) + INTERVAL '4 weeks',
  'terminee'
FROM dossier_obstetrical d
CROSS JOIN generate_series(1, 3) gs
LIMIT 40;

-- ============================================
-- 5. VACCINATIONS MATERNELLES (20 vaccinations supplémentaires)
-- ============================================
INSERT INTO vaccination_maternelle (dossier_obstetrical_id, vat1_date, vat2_date, vat3_date, prochaine_dose, date_prochaine_dose)
SELECT 
  d.id,
  CURRENT_DATE - INTERVAL '120 days',
  CURRENT_DATE - INTERVAL '90 days',
  CASE WHEN (ROW_NUMBER() OVER () % 2) = 0 THEN CURRENT_DATE - INTERVAL '60 days' ELSE NULL END,
  CASE WHEN (ROW_NUMBER() OVER () % 2) = 0 THEN 'VAT4' ELSE 'VAT3' END,
  CASE WHEN (ROW_NUMBER() OVER () % 2) = 0 THEN CURRENT_DATE + INTERVAL '30 days' ELSE CURRENT_DATE + INTERVAL '15 days' END
FROM dossier_obstetrical d
WHERE d.id NOT IN (SELECT dossier_obstetrical_id FROM vaccination_maternelle)
LIMIT 20;

-- ============================================
-- 6. SOINS PROMOTIONNELS (15 enregistrements supplémentaires)
-- ============================================
INSERT INTO soins_promotionnels (
  dossier_obstetrical_id, info_vih_ptme, date_info_vih_ptme, info_paludisme, date_info_paludisme,
  info_nutrition, date_info_nutrition, moustiquaire, date_moustiquaire, quantite_moustiquaire,
  fer_acide_folique, date_fer_acide_folique, quantite_fer_acide_folique
)
SELECT 
  d.id,
  true,
  CURRENT_DATE - INTERVAL '60 days',
  true,
  CURRENT_DATE - INTERVAL '60 days',
  true,
  CURRENT_DATE - INTERVAL '60 days',
  true,
  CURRENT_DATE - INTERVAL '45 days',
  1,
  true,
  CURRENT_DATE - INTERVAL '45 days',
  30
FROM dossier_obstetrical d
WHERE d.id NOT IN (SELECT dossier_obstetrical_id FROM soins_promotionnels)
LIMIT 15;

-- ============================================
-- 7. ACCOUCHEMENTS (10 accouchements supplémentaires)
-- ============================================
INSERT INTO accouchement (
  dossier_obstetrical_id, date_accouchement, heure_accouchement, type_accouchement,
  presentation, issue_grossesse, nombre_enfants, hemorragie, statut
)
SELECT 
  d.id,
  CURRENT_DATE - INTERVAL '10 days' * (ROW_NUMBER() OVER () % 30),
  (CURRENT_TIME - INTERVAL '1 hour' * (ROW_NUMBER() OVER () % 12))::TIME,
  CASE (ROW_NUMBER() OVER () % 4)
    WHEN 0 THEN 'Voie basse'
    WHEN 1 THEN 'Césarienne'
    WHEN 2 THEN 'Voie basse'
    ELSE 'Voie basse'
  END,
  CASE (ROW_NUMBER() OVER () % 3) WHEN 0 THEN 'Céphalique' WHEN 1 THEN 'Siège' ELSE 'Céphalique' END,
  'Vivant',
  1,
  CASE WHEN (ROW_NUMBER() OVER () % 10) = 0 THEN true ELSE false END,
  'termine'
FROM dossier_obstetrical d
WHERE d.statut = 'accouche' OR d.statut = 'post_partum'
LIMIT 10;

-- ============================================
-- 8. NOUVEAU-NÉS (10 nouveau-nés supplémentaires)
-- ============================================
INSERT INTO nouveau_ne (
  accouchement_id, sexe, poids, taille, perimetre_cranien,
  apgar_respiration_1min, apgar_frequence_cardiaque_1min, apgar_tonus_1min,
  apgar_reflexe_1min, apgar_coloration_1min,
  apgar_respiration_5min, apgar_frequence_cardiaque_5min, apgar_tonus_5min,
  apgar_reflexe_5min, apgar_coloration_5min,
  temperature, etat_clinique_normal, etat_naissance
)
SELECT 
  a.id,
  CASE (ROW_NUMBER() OVER () % 2) WHEN 0 THEN 'Masculin' ELSE 'Féminin' END,
  2.5 + (ROW_NUMBER() OVER () % 30) * 0.1,
  45 + (ROW_NUMBER() OVER () % 10),
  32 + (ROW_NUMBER() OVER () % 4),
  2, 2, 2, 2, 2,
  2, 2, 2, 2, 2,
  36.5 + (ROW_NUMBER() OVER () % 2) * 0.5,
  true,
  'Vivant'
FROM accouchement a
WHERE a.id NOT IN (SELECT accouchement_id FROM nouveau_ne)
LIMIT 10;

-- ============================================
-- 9. SOINS IMMÉDIATS (10 enregistrements supplémentaires)
-- ============================================
INSERT INTO soins_immediats (
  nouveau_ne_id, sechage, rechauffement, contact_peau_a_peau, allaitement_precoce,
  prophylaxie_oculaire, vitamine_k1, dose_vitamine_k1, voie_vitamine_k1, pesee
)
SELECT 
  n.id,
  true,
  true,
  true,
  true,
  true,
  true,
  '1 mg',
  'IM',
  true
FROM nouveau_ne n
WHERE n.id NOT IN (SELECT nouveau_ne_id FROM soins_immediats)
LIMIT 10;

-- ============================================
-- 10. CARTES INFANTILES (10 enregistrements supplémentaires)
-- ============================================
INSERT INTO carte_infantile (
  nouveau_ne_id, carte_remplie, bcg, date_bcg, polio_0, date_polio_0,
  acceptation_mere, acceptation_pere
)
SELECT 
  n.id,
  true,
  true,
  CURRENT_DATE - INTERVAL '5 days',
  true,
  CURRENT_DATE - INTERVAL '5 days',
  true,
  true
FROM nouveau_ne n
WHERE n.id NOT IN (SELECT nouveau_ne_id FROM carte_infantile)
LIMIT 10;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================
SELECT 
  '✅ DONNÉES DE DÉMONSTRATION GÉNÉRÉES!' as message,
  (SELECT COUNT(*) FROM patients) as total_patients,
  (SELECT COUNT(*) FROM dossier_obstetrical) as total_dossiers,
  (SELECT COUNT(*) FROM grossesses_anterieures) as total_grossesses_anterieures,
  (SELECT COUNT(*) FROM consultation_prenatale) as total_cpn,
  (SELECT COUNT(*) FROM vaccination_maternelle) as total_vaccinations,
  (SELECT COUNT(*) FROM soins_promotionnels) as total_soins_promotionnels,
  (SELECT COUNT(*) FROM accouchement) as total_accouchements,
  (SELECT COUNT(*) FROM nouveau_ne) as total_nouveau_nes,
  (SELECT COUNT(*) FROM soins_immediats) as total_soins_immediats,
  (SELECT COUNT(*) FROM carte_infantile) as total_cartes_infantiles;

