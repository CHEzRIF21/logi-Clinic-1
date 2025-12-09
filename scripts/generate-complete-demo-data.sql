-- ============================================
-- SCRIPT COMPLET DE DONNÉES DE DÉMONSTRATION
-- Module Maternité - Patients + Dossiers Complets
-- ============================================
-- Ce script crée TOUT ce qui est nécessaire pour tester le module Maternité
-- À exécuter dans Supabase SQL Editor APRÈS avoir appliqué toutes les migrations

-- ============================================
-- 1. CRÉER DES PATIENTS DE DÉMONSTRATION
-- ============================================

-- Supprimer les anciennes données de démo si elles existent (optionnel)
-- DELETE FROM observation_post_partum WHERE surveillance_post_partum_id IN (SELECT id FROM surveillance_post_partum WHERE accouchement_id IN (SELECT id FROM accouchement WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc')));
-- DELETE FROM surveillance_post_partum WHERE accouchement_id IN (SELECT id FROM accouchement WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc'));
-- DELETE FROM carte_infantile WHERE nouveau_ne_id IN (SELECT id FROM nouveau_ne WHERE accouchement_id IN (SELECT id FROM accouchement WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc')));
-- DELETE FROM soins_immediats WHERE nouveau_ne_id IN (SELECT id FROM nouveau_ne WHERE accouchement_id IN (SELECT id FROM accouchement WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc')));
-- DELETE FROM nouveau_ne WHERE accouchement_id IN (SELECT id FROM accouchement WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc'));
-- DELETE FROM delivrance WHERE accouchement_id IN (SELECT id FROM accouchement WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc'));
-- DELETE FROM examen_placenta WHERE accouchement_id IN (SELECT id FROM accouchement WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc'));
-- DELETE FROM accouchement WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
-- DELETE FROM consultation_prenatale WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
-- DELETE FROM vaccination_maternelle WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
-- DELETE FROM soins_promotionnels WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
-- DELETE FROM grossesses_anterieures WHERE dossier_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
-- DELETE FROM dossier_obstetrical WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
-- DELETE FROM patients WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

-- Insérer 3 patientes pour les tests
INSERT INTO patients (
  id, 
  identifiant,
  nom, 
  prenom, 
  date_naissance, 
  sexe, 
  telephone, 
  adresse, 
  groupe_sanguin, 
  rhesus,
  nationalite,
  profession,
  situation_matrimoniale,
  date_enregistrement,
  statut
)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'PAT-2024-001',
    'KOUASSI', 
    'Marie', 
    '1995-03-15', 
    'Féminin', 
    '+22997123456', 
    'Cotonou, Quartier Akpakpa, Rue 123', 
    'O', 
    'Positif',
    'Béninoise',
    'Enseignante',
    'Marié(e)',
    CURRENT_DATE,
    'Connu'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'PAT-2024-002',
    'GBEDJI', 
    'Fatima', 
    '1988-08-20', 
    'Féminin', 
    '+22997234567', 
    'Porto-Novo, Quartier Ouando, Avenue 456', 
    'A', 
    'Positif',
    'Béninoise',
    'Commerçante',
    'Marié(e)',
    CURRENT_DATE,
    'Connu'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'PAT-2024-003',
    'SOSSOU', 
    'Aisha', 
    '2008-11-10', 
    'Féminin', 
    '+22997345678', 
    'Cotonou, Quartier Godomey, Boulevard 789', 
    'B', 
    'Négatif',
    'Béninoise',
    'Étudiante',
    'Célibataire',
    CURRENT_DATE,
    'Nouveau'
  )
ON CONFLICT (id) DO UPDATE SET
  identifiant = EXCLUDED.identifiant,
  nom = EXCLUDED.nom,
  prenom = EXCLUDED.prenom,
  date_naissance = EXCLUDED.date_naissance,
  sexe = EXCLUDED.sexe,
  telephone = EXCLUDED.telephone,
  adresse = EXCLUDED.adresse,
  groupe_sanguin = EXCLUDED.groupe_sanguin,
  rhesus = EXCLUDED.rhesus,
  nationalite = EXCLUDED.nationalite,
  profession = EXCLUDED.profession,
  situation_matrimoniale = EXCLUDED.situation_matrimoniale;

-- ============================================
-- 2. CRÉER DES DOSSIERS OBSTÉTRICAUX COMPLETS
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
  personne_contacter_nom,
  personne_contacter_telephone,
  -- Antécédents
  gestite,
  parite,
  nombre_enfants_vivants,
  nombre_enfants_decedes,
  ddr,
  dpa,
  -- Examens complémentaires
  groupe_sanguin,
  rhesus,
  test_coombs_indirect,
  vih_statut,
  syphilis_statut,
  hemoglobine,
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
  'KOUASSI Jean',
  '+22997123456',
  1, -- 1ère grossesse
  0, -- Nullipare
  0,
  0,
  '2024-01-01', -- DDR
  '2024-10-08', -- DPA calculée
  'O',
  'Positif',
  'Négatif',
  false,
  false,
  12.5,
  'en_cours'
)
ON CONFLICT (id) DO UPDATE SET
  patient_id = EXCLUDED.patient_id,
  date_entree = EXCLUDED.date_entree,
  numero_dossier = EXCLUDED.numero_dossier,
  ddr = EXCLUDED.ddr,
  dpa = EXCLUDED.dpa;

-- Dossier 2: Patiente avec facteurs de risque
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
  hemoglobine,
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
  1,
  5,
  1,
  '2024-02-15',
  '2024-11-22',
  true, -- Âge > 35
  true, -- Parité > 6
  true, -- HTA connue
  'A',
  'Positif',
  false,
  false,
  10.2,
  'en_cours'
)
ON CONFLICT (id) DO UPDATE SET
  patient_id = EXCLUDED.patient_id,
  date_entree = EXCLUDED.date_entree,
  numero_dossier = EXCLUDED.numero_dossier,
  ddr = EXCLUDED.ddr,
  dpa = EXCLUDED.dpa;

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
  hemoglobine,
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
  11.8,
  'en_cours'
)
ON CONFLICT (id) DO UPDATE SET
  patient_id = EXCLUDED.patient_id,
  date_entree = EXCLUDED.date_entree,
  numero_dossier = EXCLUDED.numero_dossier,
  ddr = EXCLUDED.ddr,
  dpa = EXCLUDED.dpa;

-- Grossesses antérieures pour le dossier 2
INSERT INTO grossesses_anterieures (dossier_id, annee, evolution, poids, sexe, etat_enfant)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2015, 'Terme', 3.2, 'M', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2017, 'Terme', 3.5, 'F', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2018, 'Avortement', NULL, NULL, 'Décédé'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2019, 'Terme', 3.8, 'M', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2021, 'Terme', 3.4, 'F', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2023, 'Prématuré', 2.8, 'M', 'Décédé')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. VACCINATIONS MATERNELLES
-- ============================================

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
)
ON CONFLICT (dossier_obstetrical_id) DO UPDATE SET
  vat1_date = EXCLUDED.vat1_date,
  vat2_date = EXCLUDED.vat2_date,
  vat3_date = EXCLUDED.vat3_date,
  vat4_date = EXCLUDED.vat4_date,
  vat5_date = EXCLUDED.vat5_date,
  prochaine_dose = EXCLUDED.prochaine_dose,
  statut = EXCLUDED.statut;

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
)
ON CONFLICT (dossier_obstetrical_id) DO UPDATE SET
  vat1_date = EXCLUDED.vat1_date,
  vat2_date = EXCLUDED.vat2_date,
  vat3_date = EXCLUDED.vat3_date,
  prochaine_dose = EXCLUDED.prochaine_dose,
  date_prochaine_dose = EXCLUDED.date_prochaine_dose,
  statut = EXCLUDED.statut;

-- ============================================
-- 4. CONSULTATIONS PRÉNATALES (CPN)
-- ============================================

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
  -- CPN1 (1er trimestre) - Dossier 1
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'T1', '2024-02-15', 7, 58.5, 10, '110/70', 36.8, 'Non évalué', false, false, false, 'Bon', 'Négatif', 'Négatif', 12.5, 'Grossesse évolutive', 'CPN normale, continuer suivi', '2024-03-15', 'terminee'),
  -- CPN2 (2e trimestre) - Dossier 1
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'T2', '2024-04-20', 16, 62.0, 16, '115/75', 37.0, 'Céphalique', true, true, false, 'Bon', NULL, NULL, 11.8, 'Grossesse évolutive', 'CPN normale, continuer suivi', '2024-05-25', 'terminee'),
  -- CPN3 (3e trimestre) - Dossier 1
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'T3', '2024-06-30', 29, 68.0, 28, '120/80', 37.1, 'Céphalique', true, true, false, 'Bon', NULL, NULL, 11.2, 'Grossesse évolutive', 'Grossesse à terme proche', '2024-08-05', 'terminee'),
  -- CPN4 (3e trimestre) - Dossier 1
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'T3', '2024-08-10', 36, 72.0, 35, '125/80', 37.2, 'Céphalique', true, true, false, 'Bon', NULL, NULL, 10.9, 'Grossesse à terme', 'Surveillance accouchement', '2024-09-01', 'terminee'),
  -- CPN1 - Dossier 2 (avec facteurs de risque)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'T1', '2024-03-01', 10, 75.0, 12, '145/95', 37.0, 'Non évalué', false, false, true, 'Moyen', 'Négatif', 'Négatif', 10.2, 'Grossesse à risque - HTA', 'Surveillance rapprochée', '2024-03-20', 'terminee'),
  -- CPN2 - Dossier 2
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 'T2', '2024-04-15', 18, 78.0, 18, '150/95', 37.2, 'Céphalique', true, true, true, 'Moyen', NULL, NULL, 9.8, 'Grossesse à risque', 'Surveillance continue HTA', '2024-05-15', 'terminee')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. SOINS PROMOTIONNELS
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
  true, '2024-02-15',
  true, '2024-02-15',
  true, '2024-02-15',
  true, '2024-04-20',
  true, '2024-02-15', 2,
  true, '2024-02-15', 90,
  true, '2024-02-15'
)
ON CONFLICT (dossier_obstetrical_id) DO UPDATE SET
  info_vih_ptme = EXCLUDED.info_vih_ptme,
  moustiquaire = EXCLUDED.moustiquaire,
  fer_acide_folique = EXCLUDED.fer_acide_folique;

-- ============================================
-- RÉSUMÉ DES DONNÉES CRÉÉES
-- ============================================

SELECT 
  '✅ DONNÉES DE DÉMONSTRATION CRÉÉES AVEC SUCCÈS!' as message,
  (SELECT COUNT(*) FROM patients WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')) as patients_crees,
  (SELECT COUNT(*) FROM dossier_obstetrical WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc')) as dossiers_crees,
  (SELECT COUNT(*) FROM consultation_prenatale WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')) as cpn_crees,
  (SELECT COUNT(*) FROM vaccination_maternelle WHERE dossier_obstetrical_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')) as vaccinations_crees;

