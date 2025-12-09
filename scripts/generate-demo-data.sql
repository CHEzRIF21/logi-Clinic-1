-- Script de génération de données de démonstration pour le module Maternité
-- À exécuter après avoir appliqué toutes les migrations

-- ============================================
-- PRÉ-REQUIS: Créer des patients de test
-- ============================================

-- Insérer 3 patientes pour les tests
INSERT INTO patients (id, nom, prenom, date_naissance, sexe, telephone, adresse, groupe_sanguin, rhesus)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'KOUASSI', 'Marie', '1995-03-15', 'F', '+22997123456', 'Cotonou, Quartier Akpakpa', 'O', 'Positif'),
  ('22222222-2222-2222-2222-222222222222', 'GBEDJI', 'Fatima', '1992-08-20', 'F', '+22997234567', 'Porto-Novo, Quartier Ouando', 'A', 'Positif'),
  ('33333333-3333-3333-3333-333333333333', 'SOSSOU', 'Aisha', '1998-11-10', 'F', '+22997345678', 'Cotonou, Quartier Godomey', 'B', 'Négatif')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 1. DOSSIERS OBSTÉTRICAUX DE DÉMONSTRATION
-- ============================================

-- Dossier 1: Patiente normale, 1ère grossesse
INSERT INTO dossier_obstetrical (
  id,
  patient_id,
  date_entree,
  numero_dossier,
  -- Conjoint
  conjoint_nom_prenoms,
  conjoint_profession,
  conjoint_groupe_sanguin,
  conjoint_rhesus,
  -- Antécédents
  gestite,
  parite,
  nombre_enfants_vivants,
  ddr,
  dpa,
  -- Facteurs de surveillance (aucun)
  -- Examens complémentaires
  groupe_sanguin,
  rhesus,
  test_coombs_indirect,
  vih_statut,
  syphilis_statut,
  statut
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '2024-01-15',
  'MAT-2024-001',
  'KOUASSI Jean',
  'Enseignant',
  'O',
  'Positif',
  1, -- 1ère grossesse
  0, -- Nullipare
  0,
  '2024-01-01', -- DDR
  '2024-10-08', -- DPA calculée
  'O',
  'Positif',
  'Négatif',
  false,
  false,
  'en_cours'
);

-- Dossier 2: Patiente avec facteurs de risque (âge > 35, parité élevée)
INSERT INTO dossier_obstetrical (
  id,
  patient_id,
  date_entree,
  numero_dossier,
  conjoint_nom_prenoms,
  conjoint_profession,
  conjoint_groupe_sanguin,
  conjoint_rhesus,
  gestite,
  parite,
  nombre_avortements,
  nombre_enfants_vivants,
  nombre_enfants_decedes,
  ddr,
  dpa,
  -- Facteurs de risque
  age_superieur_35,
  parite_superieure_6,
  hta_connue,
  groupe_sanguin,
  rhesus,
  vih_statut,
  syphilis_statut,
  statut
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  '2024-02-01',
  'MAT-2024-002',
  'GBEDJI Paul',
  'Commerçant',
  'A',
  'Positif',
  7, -- 7ème grossesse
  6, -- 6 enfants
  1, -- 1 avortement
  5, -- 5 vivants
  1, -- 1 décédé
  '2024-02-15',
  '2024-11-22',
  true, -- Âge > 35
  true, -- Parité > 6
  true, -- HTA connue
  'A',
  'Positif',
  false,
  false,
  'en_cours'
);

-- Dossier 3: Patiente jeune (< 16 ans)
INSERT INTO dossier_obstetrical (
  id,
  patient_id,
  date_entree,
  numero_dossier,
  conjoint_nom_prenoms,
  gestite,
  parite,
  nombre_enfants_vivants,
  ddr,
  dpa,
  age_inferieur_16,
  groupe_sanguin,
  rhesus,
  vih_statut,
  syphilis_statut,
  statut
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '33333333-3333-3333-3333-333333333333',
  '2024-03-01',
  'MAT-2024-003',
  'SOSSOU Marc',
  1,
  0,
  0,
  '2024-03-10',
  '2024-12-16',
  true, -- Âge < 16
  'B',
  'Négatif',
  false,
  false,
  'en_cours'
);

-- Grossesses antérieures pour le dossier 2
INSERT INTO grossesses_anterieures (dossier_id, annee, evolution, poids, sexe, etat_enfant)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2015, 'Terme', 3.2, 'M', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2017, 'Terme', 3.5, 'F', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2018, 'Avortement', NULL, NULL, 'Décédé'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2019, 'Terme', 3.8, 'M', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2021, 'Terme', 3.4, 'F', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2023, 'Prématuré', 2.8, 'M', 'Décédé');

-- ============================================
-- 2. VACCINATIONS MATERNELLES
-- ============================================

-- Vaccination pour dossier 1 (complète)
INSERT INTO vaccination_maternelle (
  dossier_obstetrical_id,
  vat1_date,
  vat2_date,
  vat3_date,
  vat4_date,
  vat5_date,
  prochaine_dose,
  statut
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '2024-01-20',
  '2024-02-17',
  '2024-08-17',
  '2025-08-17',
  '2026-08-17',
  'Complet',
  'complete'
);

-- Vaccination pour dossier 2 (incomplète - 3 doses)
INSERT INTO vaccination_maternelle (
  dossier_obstetrical_id,
  vat1_date,
  vat2_date,
  vat3_date,
  prochaine_dose,
  date_prochaine_dose,
  statut
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '2024-02-05',
  '2024-03-04',
  '2024-09-04',
  'VAT4',
  '2025-09-04',
  'en_cours'
);

-- ============================================
-- 3. CONSULTATIONS PRÉNATALES (CPN)
-- ============================================

-- CPN pour dossier 1 (4 CPN complètes)
INSERT INTO consultation_prenatale (
  dossier_obstetrical_id,
  numero_cpn,
  trimestre,
  date_consultation,
  terme_semaines,
  poids,
  hauteur_uterine,
  tension_arterielle,
  temperature,
  presentation,
  bruit_coeur_foetal,
  mouvements_foetaux,
  oedemes,
  etat_general,
  test_vih,
  test_syphilis,
  hemoglobine,
  diagnostic,
  decision,
  prochain_rdv,
  statut
) VALUES 
  -- CPN1 (1er trimestre)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'T1', '2024-02-15', 7, 58.5, 10, '110/70', 36.8, 'Non évalué', false, false, false, 'Bon', 'Négatif', 'Négatif', 12.5, 'Grossesse évolutive', 'CPN normale, continuer suivi', '2024-03-15', 'terminee'),
  -- CPN2 (2e trimestre)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'T2', '2024-04-20', 16, 62.0, 16, '115/75', 37.0, 'Céphalique', true, true, false, 'Bon', NULL, NULL, 11.8, 'Grossesse évolutive', 'CPN normale, continuer suivi', '2024-05-25', 'terminee'),
  -- CPN3 (3e trimestre)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'T3', '2024-06-30', 29, 68.0, 28, '120/80', 37.1, 'Céphalique', true, true, false, 'Bon', NULL, NULL, 11.2, 'Grossesse évolutive', 'Grossesse à terme proche', '2024-08-05', 'terminee'),
  -- CPN4 (3e trimestre)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'T3', '2024-08-10', 36, 72.0, 35, '125/80', 37.2, 'Céphalique', true, true, false, 'Bon', NULL, NULL, 10.9, 'Grossesse à terme', 'Surveillance accouchement', '2024-09-01', 'terminee');

-- CPN pour dossier 2 (2 CPN avec facteurs de risque)
INSERT INTO consultation_prenatale (
  dossier_obstetrical_id,
  numero_cpn,
  trimestre,
  date_consultation,
  terme_semaines,
  poids,
  hauteur_uterine,
  tension_arterielle,
  temperature,
  presentation,
  bruit_coeur_foetal,
  mouvements_foetaux,
  oedemes,
  etat_general,
  test_vih,
  test_syphilis,
  hemoglobine,
  signes_danger,
  diagnostic,
  decision,
  reference_necessaire,
  centre_reference,
  motif_reference,
  prochain_rdv,
  statut
) VALUES 
  -- CPN1
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'T1', '2024-03-01', 10, 75.0, 12, '145/95', 37.0, 'Non évalué', false, false, true, 'Moyen', 'Négatif', 'Négatif', 10.2, 'Œdèmes des membres inférieurs', 'Grossesse à risque - HTA', 'Surveillance rapprochée', true, 'CHU Cotonou', 'HTA + Grande multiparité', '2024-03-20', 'terminee'),
  -- CPN2
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 'T2', '2024-04-15', 18, 78.0, 18, '150/95', 37.2, 'Céphalique', true, true, true, 'Moyen', NULL, NULL, 9.8, 'Œdèmes persistants', 'Grossesse à risque', 'Surveillance continue HTA', false, NULL, NULL, '2024-05-15', 'terminee');

-- ============================================
-- 4. SOINS PROMOTIONNELS
-- ============================================

INSERT INTO soins_promotionnels (
  dossier_obstetrical_id,
  info_vih_ptme,
  date_info_vih_ptme,
  info_paludisme,
  date_info_paludisme,
  info_nutrition,
  date_info_nutrition,
  info_espacement_naissances,
  date_info_espacement_naissances,
  moustiquaire,
  date_moustiquaire,
  quantite_moustiquaire,
  fer_acide_folique,
  date_fer_acide_folique,
  quantite_fer_acide_folique,
  deparasitage,
  date_deparasitage
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  true,
  '2024-02-15',
  true,
  '2024-02-15',
  true,
  '2024-02-15',
  true,
  '2024-04-20',
  true,
  '2024-02-15',
  2,
  true,
  '2024-02-15',
  90,
  true,
  '2024-02-15'
);

-- ============================================
-- 5. ACCOUCHEMENT (pour le dossier 1 - simulation)
-- ============================================

-- Accouchement normal
INSERT INTO accouchement (
  id,
  dossier_obstetrical_id,
  date_accouchement,
  heure_debut_travail,
  heure_accouchement,
  duree_travail,
  type_accouchement,
  presentation,
  issue_grossesse,
  nombre_enfants,
  hemorragie,
  volume_hemorragie,
  ocytociques,
  heure_ocytociques,
  statut
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '2024-10-08 14:30:00',
  '08:00',
  '14:30',
  390, -- 6h30
  'Voie basse',
  'Céphalique',
  'Vivant',
  1,
  false,
  250,
  true,
  '14:40',
  'termine'
);

-- Délivrance
INSERT INTO delivrance (
  accouchement_id,
  heure_delivrance,
  duree_delivrance,
  perte_sang,
  placenta_complet,
  cordon_normal,
  membranes_completes,
  episiotomie,
  dechirures_perineales,
  degre_dechirure,
  reparation_perineale
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '14:45',
  15,
  300,
  true,
  true,
  true,
  false,
  true,
  1,
  true
);

-- Examen du placenta
INSERT INTO examen_placenta (
  accouchement_id,
  heure_delivrance,
  longueur_cordon,
  presence_anomalies,
  parite
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '14:45',
  55.0,
  false,
  1
);

-- ============================================
-- 6. NOUVEAU-NÉ avec Score Apgar
-- ============================================

INSERT INTO nouveau_ne (
  id,
  accouchement_id,
  numero_ordre,
  sexe,
  rang_naissance,
  poids,
  taille,
  perimetre_cranien,
  -- Scores Apgar 1 min (score total = 8)
  apgar_respiration_1min,
  apgar_frequence_cardiaque_1min,
  apgar_tonus_1min,
  apgar_reflexe_1min,
  apgar_coloration_1min,
  apgar_score_1min,
  -- Scores Apgar 5 min (score total = 10)
  apgar_respiration_5min,
  apgar_frequence_cardiaque_5min,
  apgar_tonus_5min,
  apgar_reflexe_5min,
  apgar_coloration_5min,
  apgar_score_5min,
  -- Scores Apgar 10 min (score total = 10)
  apgar_respiration_10min,
  apgar_frequence_cardiaque_10min,
  apgar_tonus_10min,
  apgar_reflexe_10min,
  apgar_coloration_10min,
  apgar_score_10min,
  temperature,
  etat_clinique_normal,
  etat_naissance,
  reanimation_necessaire
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  1,
  'Féminin',
  1,
  3.2,
  48.5,
  34.0,
  -- Apgar 1 min: 8/10 (Normal)
  2, 2, 2, 1, 1, 8,
  -- Apgar 5 min: 10/10 (Excellent)
  2, 2, 2, 2, 2, 10,
  -- Apgar 10 min: 10/10 (Excellent)
  2, 2, 2, 2, 2, 10,
  36.8,
  true,
  'Vivant',
  false
);

-- ============================================
-- 7. SOINS IMMÉDIATS DU NOUVEAU-NÉ
-- ============================================

INSERT INTO soins_immediats (
  nouveau_ne_id,
  sechage,
  heure_sechage,
  rechauffement,
  heure_rechauffement,
  contact_peau_a_peau,
  heure_contact_peau_a_peau,
  duree_contact_peau_a_peau,
  allaitement_precoce,
  heure_allaitement_precoce,
  prophylaxie_oculaire,
  produit_prophylaxie_oculaire,
  heure_prophylaxie_oculaire,
  vitamine_k1,
  dose_vitamine_k1,
  voie_vitamine_k1,
  heure_vitamine_k1,
  pesee,
  chapelet_identification,
  numero_chapelet,
  soins_cordon,
  antiseptique_cordon,
  heure_soins_cordon
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  true,
  '14:31',
  true,
  '14:32',
  true,
  '14:35',
  60,
  true,
  '14:40',
  true,
  'Tétracycline 1%',
  '14:33',
  true,
  '1 mg',
  'IM',
  '14:34',
  true,
  true,
  'BB-2024-001',
  true,
  'Chlorhexidine 7,1%',
  '14:36'
);

-- ============================================
-- 8. CARTE INFANTILE
-- ============================================

INSERT INTO carte_infantile (
  nouveau_ne_id,
  carte_remplie,
  date_remplissage,
  bcg,
  date_bcg,
  heure_bcg,
  polio_0,
  date_polio_0,
  heure_polio_0,
  acceptation_mere,
  acceptation_pere
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  true,
  '2024-10-08',
  true,
  '2024-10-08',
  '15:00',
  true,
  '2024-10-08',
  '15:00',
  true,
  true
);

-- ============================================
-- 9. SURVEILLANCE POST-PARTUM
-- ============================================

-- Créer la surveillance post-partum
INSERT INTO surveillance_post_partum (
  id,
  accouchement_id,
  date_debut_surveillance,
  duree_surveillance,
  statut,
  agent_responsable
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '2024-10-08 14:45:00',
  120,
  'termine',
  'Sage-femme Adjoua'
);

-- Générer les 8 observations (toutes les 15 minutes)
-- Observation à 0 min (14:45)
INSERT INTO observation_post_partum (
  surveillance_post_partum_id,
  heure_observation,
  minute_observation,
  timestamp_observation,
  temperature,
  tension_arterielle_systolique,
  tension_arterielle_diastolique,
  pouls,
  respiration,
  contraction_uterine,
  saignement_qualite,
  saignement_quantite,
  douleurs,
  oedemes,
  etat_perinee,
  etat_general,
  mictions,
  conscience,
  agent_observation
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff', '14:45', 0, '2024-10-08 14:45:00',
  37.0, 120, 75, 82, 18, 'Présente', 'Normal', 150, 'Modérées', false,
  'Normal', 'Bon', 'Normales', 'Normale', 'Sage-femme Adjoua'
);

-- Observation à 15 min (15:00)
INSERT INTO observation_post_partum (
  surveillance_post_partum_id,
  heure_observation,
  minute_observation,
  timestamp_observation,
  temperature,
  tension_arterielle_systolique,
  tension_arterielle_diastolique,
  pouls,
  respiration,
  contraction_uterine,
  saignement_qualite,
  saignement_quantite,
  douleurs,
  oedemes,
  etat_perinee,
  etat_general,
  mictions,
  conscience,
  agent_observation
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff', '15:00', 15, '2024-10-08 15:00:00',
  37.1, 118, 74, 80, 17, 'Présente', 'Normal', 100, 'Légères', false,
  'Normal', 'Bon', 'Normales', 'Normale', 'Sage-femme Adjoua'
);

-- Observation à 30 min (15:15) - Tout normal
INSERT INTO observation_post_partum (
  surveillance_post_partum_id,
  heure_observation,
  minute_observation,
  timestamp_observation,
  temperature,
  tension_arterielle_systolique,
  tension_arterielle_diastolique,
  pouls,
  respiration,
  contraction_uterine,
  saignement_qualite,
  saignement_quantite,
  douleurs,
  oedemes,
  etat_perinee,
  etat_general,
  mictions,
  conscience,
  agent_observation
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff', '15:15', 30, '2024-10-08 15:15:00',
  36.9, 115, 72, 78, 16, 'Présente', 'Normal', 80, 'Légères', false,
  'Normal', 'Bon', 'Normales', 'Normale', 'Sage-femme Adjoua'
);

-- Observation à 45 min - Tout normal
INSERT INTO observation_post_partum (
  surveillance_post_partum_id,
  heure_observation,
  minute_observation,
  timestamp_observation,
  temperature,
  tension_arterielle_systolique,
  tension_arterielle_diastolique,
  pouls,
  respiration,
  contraction_uterine,
  saignement_qualite,
  saignement_quantite,
  douleurs,
  oedemes,
  etat_perinee,
  etat_general,
  mictions,
  conscience,
  agent_observation
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff', '15:30', 45, '2024-10-08 15:30:00',
  36.8, 112, 70, 76, 16, 'Présente', 'Normal', 50, 'Absentes', false,
  'Normal', 'Bon', 'Normales', 'Normale', 'Sage-femme Adjoua'
);

-- Observation à 60 min
INSERT INTO observation_post_partum (
  surveillance_post_partum_id,
  heure_observation,
  minute_observation,
  timestamp_observation,
  temperature,
  tension_arterielle_systolique,
  tension_arterielle_diastolique,
  pouls,
  respiration,
  contraction_uterine,
  saignement_qualite,
  saignement_quantite,
  douleurs,
  oedemes,
  etat_perinee,
  etat_general,
  mictions,
  conscience,
  agent_observation
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff', '15:45', 60, '2024-10-08 15:45:00',
  37.0, 110, 70, 74, 15, 'Présente', 'Normal', 50, 'Absentes', false,
  'Normal', 'Bon', 'Normales', 'Normale', 'Sage-femme Adjoua'
);

-- Observation à 75 min
INSERT INTO observation_post_partum (
  surveillance_post_partum_id,
  heure_observation,
  minute_observation,
  timestamp_observation,
  temperature,
  tension_arterielle_systolique,
  tension_arterielle_diastolique,
  pouls,
  respiration,
  contraction_uterine,
  saignement_qualite,
  saignement_quantite,
  douleurs,
  oedemes,
  etat_perinee,
  etat_general,
  mictions,
  conscience,
  agent_observation
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff', '16:00', 75, '2024-10-08 16:00:00',
  36.9, 115, 72, 75, 16, 'Présente', 'Normal', 40, 'Absentes', false,
  'Normal', 'Bon', 'Normales', 'Normale', 'Sage-femme Adjoua'
);

-- Observation à 90 min
INSERT INTO observation_post_partum (
  surveillance_post_partum_id,
  heure_observation,
  minute_observation,
  timestamp_observation,
  temperature,
  tension_arterielle_systolique,
  tension_arterielle_diastolique,
  pouls,
  respiration,
  contraction_uterine,
  saignement_qualite,
  saignement_quantite,
  douleurs,
  oedemes,
  etat_perinee,
  etat_general,
  mictions,
  conscience,
  agent_observation
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff', '16:15', 90, '2024-10-08 16:15:00',
  37.0, 118, 75, 76, 16, 'Présente', 'Normal', 30, 'Absentes', false,
  'Normal', 'Bon', 'Normales', 'Normale', 'Sage-femme Adjoua'
);

-- Observation à 105 min
INSERT INTO observation_post_partum (
  surveillance_post_partum_id,
  heure_observation,
  minute_observation,
  timestamp_observation,
  temperature,
  tension_arterielle_systolique,
  tension_arterielle_diastolique,
  pouls,
  respiration,
  contraction_uterine,
  saignement_qualite,
  saignement_quantite,
  douleurs,
  oedemes,
  etat_perinee,
  etat_general,
  mictions,
  conscience,
  agent_observation
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff', '16:30', 105, '2024-10-08 16:30:00',
  36.8, 112, 70, 74, 15, 'Présente', 'Normal', 25, 'Absentes', false,
  'Normal', 'Bon', 'Normales', 'Normale', 'Sage-femme Adjoua'
);

-- ============================================
-- 10. CONSEILS POST-PARTUM
-- ============================================

INSERT INTO conseils_post_partum (
  surveillance_post_partum_id,
  signes_danger,
  date_signes_danger,
  agent_signes_danger,
  nutrition_hydratation,
  date_nutrition,
  agent_nutrition,
  hygiene_perineale,
  date_hygiene_perineale,
  agent_hygiene_perineale,
  allaitement,
  date_allaitement,
  agent_allaitement,
  planification_familiale,
  date_planification_familiale,
  agent_planification_familiale,
  retour_consultation,
  date_retour_consultation,
  agent_retour_consultation
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  true, '2024-10-08 16:30:00', 'Sage-femme Adjoua',
  true, '2024-10-08 16:30:00', 'Sage-femme Adjoua',
  true, '2024-10-08 16:30:00', 'Sage-femme Adjoua',
  true, '2024-10-08 16:30:00', 'Sage-femme Adjoua',
  true, '2024-10-08 16:30:00', 'Sage-femme Adjoua',
  true, '2024-11-19', 'Sage-femme Adjoua'
);

-- ============================================
-- 11. SORTIE SALLE DE NAISSANCE
-- ============================================

INSERT INTO sortie_salle_naissance (
  surveillance_post_partum_id,
  heure_sortie,
  date_sortie,
  etat_mere,
  etat_detaille,
  destination,
  service_destination,
  accompagnant_present,
  nom_accompagnant,
  transport_utilise,
  dossier_transfere,
  service_receveur,
  agent_sortie,
  observations
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '16:45',
  '2024-10-08',
  'Stable',
  'Mère en bon état général, constantes stables',
  'Maternité',
  'Service Post-Partum',
  true,
  'KOUASSI Jean (Conjoint)',
  'Brancard',
  true,
  'Service Post-Partum',
  'Sage-femme Adjoua',
  'Surveillance post-partum complète sans complication. Mère et bébé en bonne santé.'
);

-- ============================================
-- VÉRIFICATIONS ET STATISTIQUES
-- ============================================

-- Statistiques finales
SELECT 'DONNÉES DE DÉMONSTRATION CRÉÉES AVEC SUCCÈS!' as message;

-- Résumé des données créées
SELECT 
  'Patients' as table_name,
  COUNT(*) as count,
  'Patientes de test' as description
FROM patients
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
UNION ALL
SELECT 'Dossiers Obstétricaux', COUNT(*), 'Dossiers de test'
FROM dossier_obstetrical
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
)
UNION ALL
SELECT 'Consultations CPN', COUNT(*), 'CPN de test'
FROM consultation_prenatale
WHERE dossier_obstetrical_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
)
UNION ALL
SELECT 'Accouchements', COUNT(*), 'Accouchement de test'
FROM accouchement
WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
UNION ALL
SELECT 'Nouveau-nés', COUNT(*), 'Nouveau-né avec score Apgar'
FROM nouveau_ne
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
UNION ALL
SELECT 'Observations Post-Partum', COUNT(*), 'Observations toutes les 15 min'
FROM observation_post_partum
WHERE surveillance_post_partum_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Détails du score Apgar du nouveau-né
SELECT 
  'Score Apgar du nouveau-né (démonstration)' as titre,
  apgar_score_1min as apgar_1min,
  apgar_score_5min as apgar_5min,
  apgar_score_10min as apgar_10min,
  CASE 
    WHEN apgar_score_5min >= 7 THEN 'Normal (Vert)'
    WHEN apgar_score_5min >= 4 THEN 'Modéré (Orange)'
    ELSE 'Critique (Rouge)'
  END as interpretation
FROM nouveau_ne
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

