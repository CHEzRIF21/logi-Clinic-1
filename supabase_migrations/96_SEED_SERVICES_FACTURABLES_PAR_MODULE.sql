-- ============================================
-- Migration 96: Catalogue complet des actes facturables par module
-- Objectif :
--  - Enrichir la table services_facturables avec une liste
--    structurée d'actes pour chaque module / service.
--  - Garder la compatibilité avec les interconnexions existantes :
--      * tickets_facturation.service_origine (consultation, pharmacie, laboratoire, etc.)
--      * facturationService.getServicesFacturables(type_service)
--  - Ne PAS casser les tarifs existants : on ajoute uniquement
--    des lignes manquantes, en utilisant ON CONFLICT (code) DO UPDATE
--    pour mettre à jour le libellé / type si besoin.
--
-- Rappel type_service autorisés :
--   'consultation', 'pharmacie', 'laboratoire', 'maternite',
--   'vaccination', 'imagerie', 'autre'
-- ============================================

-- CONSULTATION MÉDICALE
INSERT INTO public.services_facturables (code, nom, type_service, tarif_base, unite, description, actif) VALUES
  ('CONS-GEN',  'Consultation générale',          'consultation', 2000, 'unité', 'Consultation médicale générale', true),
  ('CONS-SPEC', 'Consultation spécialisée',       'consultation', 5000, 'unité', 'Consultation avec spécialiste', true),
  ('CONS-VISIT', 'Visite de contrôle',           'consultation', 1500, 'unité', 'Visite de contrôle standard', true),
  ('CONS-URG',  'Consultation d’urgence',         'consultation', 5000, 'unité', 'Consultation en urgence', true),
  ('CONS-PED',  'Consultation pédiatrique',       'consultation', 2500, 'unité', 'Consultation pour enfant', true),
  ('CONS-GYN',  'Consultation gynécologique',     'consultation', 3000, 'unité', 'Consultation gynécologique', true),
  ('CONS-SUIVI','Consultation de suivi',          'consultation', 1500, 'unité', 'Visite de contrôle / suivi', true)
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    type_service = EXCLUDED.type_service,
    description = EXCLUDED.description,
    actif = EXCLUDED.actif;

-- SOINS INFIRMIERS (type_service = 'autre' car pas de catégorie dédiée)
INSERT INTO public.services_facturables (code, nom, type_service, tarif_base, unite, description, actif) VALUES
  ('INF-INJ-IM',     'Injection intramusculaire (IM)', 'autre',  500,  'acte', 'Injection intramusculaire', true),
  ('INF-INJ-IV',     'Injection intraveineuse (IV)',   'autre',  800,  'acte', 'Injection intraveineuse', true),
  ('INF-PANS-S',     'Pansement simple',               'autre', 1000,  'acte', 'Pansement simple', true),
  ('INF-PANS-C',     'Pansement complexe',             'autre', 2000,  'acte', 'Pansement complexe', true),
  ('INF-PERF',       'Perfusion',                      'autre', 1500,  'acte', 'Pose et surveillance de perfusion', true),
  ('INF-CATH',       'Pose de cathéter',               'autre', 1500,  'acte', 'Pose de cathéter', true),
  ('INF-SURV',       'Surveillance médicale',          'autre',  800,  'jour', 'Surveillance infirmière / médicale', true),
  ('INF-TA',         'Prise de tension',               'autre',  300,  'acte', 'Prise de tension artérielle', true),
  ('INF-SUT-S',      'Suture simple',                  'autre', 2500,  'acte', 'Suture simple', true),
  ('INF-PREL-SANG',  'Prélèvement sanguin',            'autre',  800,  'acte', 'Prélèvement sanguin', true)
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    type_service = EXCLUDED.type_service,
    description = EXCLUDED.description,
    actif = EXCLUDED.actif;

-- LABORATOIRE : on s’appuie sur le catalogue d’examens existant.
-- Ici on ajoute un acte générique de bilan, le détail des examens
-- reste dans lab_exam_catalog / lab_examens_maternite.
INSERT INTO public.services_facturables (code, nom, type_service, tarif_base, unite, description, actif) VALUES
  ('LAB-BILAN-GEN', 'Bilan de laboratoire complet', 'laboratoire', 0, 'forfait', 'Regroupe un ensemble d’examens de laboratoire définis dans le module labo', true)
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    type_service = EXCLUDED.type_service,
    description = EXCLUDED.description,
    actif = EXCLUDED.actif;

-- IMAGERIE MÉDICALE
INSERT INTO public.services_facturables (code, nom, type_service, tarif_base, unite, description, actif) VALUES
  ('IMG-RX-THX',  'Radiographie thorax',          'imagerie', 5000, 'acte', 'Radiographie du thorax', true),
  ('IMG-RX-MBR',  'Radiographie membre',          'imagerie', 5000, 'acte', 'Radiographie d’un membre', true),
  ('IMG-ECHO-ABD','Échographie abdominale',       'imagerie', 8000, 'acte', 'Échographie abdominale', true),
  ('IMG-ECHO-OBS','Échographie obstétricale',     'imagerie', 9000, 'acte', 'Échographie obstétricale', true),
  ('IMG-ECHO-PELV','Échographie pelvienne',       'imagerie', 8000, 'acte', 'Échographie pelvienne', true),
  ('IMG-SCAN',    'Scanner',                      'imagerie',15000, 'acte', 'Tomodensitométrie (Scanner)', true),
  ('IMG-IRM',     'IRM',                          'imagerie',20000, 'acte', 'Imagerie par Résonance Magnétique', true),
  ('IMG-ECG',     'ECG',                          'imagerie', 4000, 'acte', 'Electrocardiogramme', true)
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    type_service = EXCLUDED.type_service,
    description = EXCLUDED.description,
    actif = EXCLUDED.actif;

-- PHARMACIE : acte générique, le détail vient du module stock/médicaments
INSERT INTO public.services_facturables (code, nom, type_service, tarif_base, unite, description, actif) VALUES
  ('PHAR-MED', 'Médicament (unité / boîte)', 'pharmacie', 0, 'unité', 'Facturation des médicaments selon le catalogue pharmacie (prix par unité ou par boîte)', true)
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    description = EXCLUDED.description,
    type_service = EXCLUDED.type_service,
    actif = EXCLUDED.actif;

-- VACCINATION
INSERT INTO public.services_facturables (code, nom, type_service, tarif_base, unite, description, actif) VALUES
  ('VAC-VACCIN',   'Vaccin (par type)',      'vaccination', 0, 'dose', 'Vaccination selon le type de vaccin (tarif défini par vaccin)', true),
  ('VAC-INJ-FEE',  'Frais d’injection',      'vaccination', 500, 'acte', 'Frais techniques pour l’injection du vaccin', true),
  ('VAC-CARTE',    'Carte de vaccination',   'vaccination', 500, 'unité', 'Émission de la carte de vaccination', true)
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    type_service = EXCLUDED.type_service,
    description = EXCLUDED.description,
    actif = EXCLUDED.actif;

-- MATERNITÉ
INSERT INTO public.services_facturables (code, nom, type_service, tarif_base, unite, description, actif) VALUES
  ('MAT-CPN',        'Consultation prénatale (CPN)', 'maternite', 2000, 'acte', 'Consultation prénatale', true),
  ('MAT-POSTN',      'Consultation postnatale',      'maternite', 2000, 'acte', 'Consultation post-natale', true),
  ('MAT-ACCO-NORM',  'Accouchement normal',          'maternite',30000, 'acte', 'Accouchement sans complication', true),
  ('MAT-ACCO-CPLX',  'Accouchement compliqué',      'maternite',40000, 'acte', 'Accouchement avec complications', true),
  ('MAT-CESAR',      'Césarienne',                   'maternite',60000, 'acte', 'Intervention de césarienne', true),
  ('MAT-SOINS-POST', 'Soins post-nataux',            'maternite',10000, 'forfait', 'Soins post-natals mère et/ou enfant', true),
  ('MAT-CARNET',     'Carnet CPN/Maternité',         'maternite',1000, 'unité', 'Carnet de suivi CPN / maternité', true)
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    type_service = EXCLUDED.type_service,
    description = EXCLUDED.description,
    actif = EXCLUDED.actif;

-- HOSPITALISATION (type_service = 'autre')
INSERT INTO public.services_facturables (code, nom, type_service, tarif_base, unite, description, actif) VALUES
  ('HOSP-ADMI',   'Frais d’admission',        'autre', 5000, 'unité', 'Frais d’admission en hospitalisation', true),
  ('HOSP-JOUR',   'Frais journaliers',        'autre', 3000, 'jour',  'Frais journaliers standard', true),
  ('HOSP-CH-ST',  'Chambre standard',         'autre', 5000, 'jour',  'Séjour en chambre standard', true),
  ('HOSP-CH-VIP', 'Chambre VIP',              'autre',10000, 'jour',  'Séjour en chambre VIP', true),
  ('HOSP-SOINS',  'Soins hospitaliers',       'autre', 4000, 'jour',  'Soins hospitaliers pendant l’hospitalisation', true),
  ('HOSP-SURV',   'Surveillance médicale',    'autre', 3000, 'jour',  'Surveillance médicale en hospitalisation', true)
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    type_service = EXCLUDED.type_service,
    description = EXCLUDED.description,
    actif = EXCLUDED.actif;

-- BILAN MÉDICAL (type_service = 'autre' ou 'consultation' selon usage)
INSERT INTO public.services_facturables (code, nom, type_service, tarif_base, unite, description, actif) VALUES
  ('BIL-GEN',   'Bilan de santé général', 'autre', 0, 'forfait', 'Bilan de santé général (consultation + examens définis)', true),
  ('BIL-BIO',   'Bilan biologique',       'laboratoire', 0, 'forfait', 'Pack d’examens biologiques', true),
  ('BIL-PREN',  'Bilan prénatal',         'maternite', 0, 'forfait', 'Bilan complet prénatal (consultation + examens)', true),
  ('BIL-CERT',  'Certificat médical',     'consultation', 2000, 'acte', 'Délivrance d’un certificat médical', true)
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    type_service = EXCLUDED.type_service,
    description = EXCLUDED.description,
    actif = EXCLUDED.actif;

-- DOCUMENTS (type_service = 'autre')
INSERT INTO public.services_facturables (code, nom, type_service, tarif_base, unite, description, actif) VALUES
  ('DOC-CARN-SOIN',    'Carnet de Soins',                 'autre', 1000, 'unité', 'Carnet de soins', true),
  ('DOC-CARN-SANTE',   'Carnet de Santé',                 'autre', 1000, 'unité', 'Carnet de santé adulte', true),
  ('DOC-CARN-ENF',     'Carnet de santé de l’enfant',     'autre', 1000, 'unité', 'Carnet de santé de l’enfant', true),
  ('DOC-CARN-CPN',     'Carnet CPN / Maternité',          'autre', 1000, 'unité', 'Carnet CPN / maternité', true),
  ('DOC-CARTE-VACC',   'Carte de vaccination',            'autre',  500, 'unité', 'Carte de vaccination', true),
  ('DOC-OUV-DOS',      'Ouverture de dossier',            'autre', 1000, 'unité', 'Frais d’ouverture de dossier patient', true),
  ('DOC-CERT-MED',     'Certificat médical',              'autre', 2000, 'unité', 'Délivrance de certificat médical', true),
  ('DOC-RAPPORT-MED',  'Rapport médical',                 'autre', 5000, 'unité', 'Rapport médical détaillé', true),
  ('DOC-IMP-RESULT',   'Impression résultats',            'autre',  500, 'unité', 'Impression de résultats (labo, imagerie, etc.)', true)
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    type_service = EXCLUDED.type_service,
    description = EXCLUDED.description,
    actif = EXCLUDED.actif;

