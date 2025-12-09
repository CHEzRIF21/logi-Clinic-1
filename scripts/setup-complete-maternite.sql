-- ============================================
-- SCRIPT COMPLET DE CONFIGURATION
-- Module Maternité - Création de toutes les tables + Données de démo
-- ============================================
-- À exécuter dans Supabase SQL Editor
-- Ce script crée TOUT ce qui est nécessaire pour le module Maternité

-- ============================================
-- ÉTAPE 1: CRÉER LA TABLE PATIENTS (si elle n'existe pas)
-- ============================================

CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifiant VARCHAR(50) UNIQUE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  sexe VARCHAR(20) CHECK (sexe IN ('Masculin', 'Féminin')),
  date_naissance DATE NOT NULL,
  age INTEGER,
  lieu_naissance VARCHAR(200),
  nationalite VARCHAR(100),
  adresse TEXT,
  telephone VARCHAR(20),
  telephone_proche VARCHAR(20),
  personne_urgence VARCHAR(200),
  profession VARCHAR(100),
  situation_matrimoniale VARCHAR(50),
  couverture_sante VARCHAR(50),
  groupe_sanguin VARCHAR(10),
  rhesus VARCHAR(10),
  allergies TEXT,
  maladies_chroniques TEXT,
  statut_vaccinal VARCHAR(50),
  antecedents_medicaux TEXT,
  prise_medicaments_reguliers BOOLEAN DEFAULT false,
  medicaments_reguliers TEXT,
  date_enregistrement DATE DEFAULT CURRENT_DATE,
  service_initial VARCHAR(100),
  statut VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la table patients
CREATE INDEX IF NOT EXISTS idx_patients_identifiant ON patients(identifiant);
CREATE INDEX IF NOT EXISTS idx_patients_nom_prenom ON patients(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_patients_sexe ON patients(sexe);

-- ============================================
-- ÉTAPE 2: CRÉER LES TABLES DU MODULE MATERNITÉ
-- ============================================

-- Table dossier_obstetrical
CREATE TABLE IF NOT EXISTS dossier_obstetrical (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date_entree DATE NOT NULL DEFAULT CURRENT_DATE,
  date_sortie DATE,
  numero_dossier VARCHAR(50),
  conjoint_nom_prenoms VARCHAR(200),
  conjoint_profession VARCHAR(100),
  conjoint_groupe_sanguin VARCHAR(10) CHECK (conjoint_groupe_sanguin IN ('A', 'B', 'AB', 'O', 'Inconnu')),
  conjoint_rhesus VARCHAR(10) CHECK (conjoint_rhesus IN ('Positif', 'Négatif', 'Inconnu')),
  conjoint_electrophorese_hemoglobine VARCHAR(50),
  conjoint_serologie TEXT,
  personne_contacter_nom VARCHAR(100),
  personne_contacter_adresse TEXT,
  personne_contacter_telephone VARCHAR(20),
  referee BOOLEAN DEFAULT false,
  referee_par VARCHAR(200),
  transfusions_anterieures BOOLEAN DEFAULT false,
  nombre_transfusions INTEGER DEFAULT 0,
  gestite INTEGER DEFAULT 0,
  parite INTEGER DEFAULT 0,
  nombre_avortements INTEGER DEFAULT 0,
  nombre_enfants_vivants INTEGER DEFAULT 0,
  nombre_enfants_decedes INTEGER DEFAULT 0,
  ddr DATE,
  dpa DATE,
  age_inferieur_16 BOOLEAN DEFAULT false,
  age_superieur_35 BOOLEAN DEFAULT false,
  taille_inferieure_150 BOOLEAN DEFAULT false,
  parite_superieure_6 BOOLEAN DEFAULT false,
  cesarienne_dernier_accouchement BOOLEAN DEFAULT false,
  mort_ne_dernier_accouchement BOOLEAN DEFAULT false,
  drepanocytose_ss_sc BOOLEAN DEFAULT false,
  hta_connue BOOLEAN DEFAULT false,
  fausses_couches_repetees BOOLEAN DEFAULT false,
  diabete BOOLEAN DEFAULT false,
  autres_facteurs TEXT,
  examen_groupe_sanguin VARCHAR(10) CHECK (examen_groupe_sanguin IN ('A', 'B', 'AB', 'O', 'Inconnu')),
  examen_rhesus VARCHAR(10) CHECK (examen_rhesus IN ('Positif', 'Négatif', 'Inconnu')),
  test_coombs_indirect VARCHAR(50),
  tpha VARCHAR(50),
  vdrl VARCHAR(50),
  hiv1_hiv2 VARCHAR(50),
  ecbu VARCHAR(200),
  taux_hemoglobine DECIMAL(5,2),
  hematocrite DECIMAL(5,2),
  plaquettes INTEGER,
  electrophorese_hemoglobine VARCHAR(50),
  toxoplasmose_igg VARCHAR(50),
  toxoplasmose_igm VARCHAR(50),
  rubeole_igg VARCHAR(50),
  glycemic_jeun DECIMAL(5,2),
  gp75 DECIMAL(5,2),
  hepatite_b VARCHAR(50),
  autres_examens TEXT,
  vih BOOLEAN DEFAULT false,
  mise_sous_arv BOOLEAN DEFAULT false,
  syphilis BOOLEAN DEFAULT false,
  mise_sous_ctm BOOLEAN DEFAULT false,
  statut VARCHAR(50) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'accouche', 'post_partum', 'clos')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Table grossesses_anterieures
CREATE TABLE IF NOT EXISTS grossesses_anterieures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  annee INTEGER,
  evolution VARCHAR(200),
  poids DECIMAL(5,2),
  sexe VARCHAR(10) CHECK (sexe IN ('Masculin', 'Féminin', 'Inconnu')),
  etat_enfants VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_dossier_obstetrical_patient_id ON dossier_obstetrical(patient_id);
CREATE INDEX IF NOT EXISTS idx_dossier_obstetrical_date_entree ON dossier_obstetrical(date_entree);
CREATE INDEX IF NOT EXISTS idx_dossier_obstetrical_statut ON dossier_obstetrical(statut);
CREATE INDEX IF NOT EXISTS idx_grossesses_anterieures_dossier_id ON grossesses_anterieures(dossier_obstetrical_id);

-- Fonction pour calculer DPA
CREATE OR REPLACE FUNCTION calculate_dpa(ddr DATE)
RETURNS DATE AS $$
BEGIN
    IF ddr IS NULL THEN RETURN NULL; END IF;
    RETURN ddr + INTERVAL '280 days';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger pour calculer DPA automatiquement
CREATE OR REPLACE FUNCTION set_dpa_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ddr IS NOT NULL AND NEW.dpa IS NULL THEN
        NEW.dpa = calculate_dpa(NEW.ddr);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_dpa_on_insert ON dossier_obstetrical;
CREATE TRIGGER set_dpa_on_insert
    BEFORE INSERT ON dossier_obstetrical
    FOR EACH ROW
    EXECUTE FUNCTION set_dpa_on_insert();

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_dossier_obstetrical_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.ddr IS NOT NULL AND (OLD.ddr IS NULL OR NEW.ddr != OLD.ddr) THEN
        NEW.dpa = calculate_dpa(NEW.ddr);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dossier_obstetrical_updated_at ON dossier_obstetrical;
CREATE TRIGGER update_dossier_obstetrical_updated_at
    BEFORE UPDATE ON dossier_obstetrical
    FOR EACH ROW
    EXECUTE FUNCTION update_dossier_obstetrical_updated_at();

-- ============================================
-- ÉTAPE 3: CRÉER LES TABLES CPN
-- ============================================

-- Table vaccination_maternelle
CREATE TABLE IF NOT EXISTS vaccination_maternelle (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  vat1_date DATE,
  vat2_date DATE,
  vat3_date DATE,
  vat4_date DATE,
  vat5_date DATE,
  prochaine_dose VARCHAR(50),
  date_prochaine_dose DATE,
  notes TEXT,
  statut VARCHAR(50) DEFAULT 'en_cours',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dossier_obstetrical_id)
);

-- Table consultation_prenatale
CREATE TABLE IF NOT EXISTS consultation_prenatale (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  numero_cpn INTEGER NOT NULL,
  trimestre VARCHAR(10),
  date_consultation DATE NOT NULL,
  terme_semaines INTEGER,
  poids DECIMAL(5,2),
  hauteur_uterine DECIMAL(5,2),
  tension_arterielle VARCHAR(20),
  temperature DECIMAL(4,2),
  presentation VARCHAR(50),
  bruit_coeur_foetal BOOLEAN DEFAULT false,
  mouvements_foetaux BOOLEAN DEFAULT false,
  oedemes BOOLEAN DEFAULT false,
  etat_general VARCHAR(50),
  test_vih VARCHAR(50),
  test_syphilis VARCHAR(50),
  hemoglobine DECIMAL(5,2),
  diagnostic TEXT,
  decision TEXT,
  prochain_rdv DATE,
  reference_necessaire BOOLEAN DEFAULT false,
  centre_reference VARCHAR(200),
  motif_reference TEXT,
  signes_danger TEXT,
  effets_secondaires TEXT,
  statut VARCHAR(50) DEFAULT 'en_cours',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dossier_obstetrical_id, numero_cpn)
);

-- Table soins_promotionnels
CREATE TABLE IF NOT EXISTS soins_promotionnels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  info_vih_ptme BOOLEAN DEFAULT false,
  date_info_vih_ptme DATE,
  info_paludisme BOOLEAN DEFAULT false,
  date_info_paludisme DATE,
  info_nutrition BOOLEAN DEFAULT false,
  date_info_nutrition DATE,
  info_espacement_naissances BOOLEAN DEFAULT false,
  date_info_espacement_naissances DATE,
  moustiquaire BOOLEAN DEFAULT false,
  date_moustiquaire DATE,
  quantite_moustiquaire INTEGER DEFAULT 0,
  fer_acide_folique BOOLEAN DEFAULT false,
  date_fer_acide_folique DATE,
  quantite_fer_acide_folique INTEGER DEFAULT 0,
  deparasitage BOOLEAN DEFAULT false,
  date_deparasitage DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dossier_obstetrical_id)
);

-- Index CPN
CREATE INDEX IF NOT EXISTS idx_vaccination_maternelle_dossier ON vaccination_maternelle(dossier_obstetrical_id);
CREATE INDEX IF NOT EXISTS idx_consultation_prenatale_dossier ON consultation_prenatale(dossier_obstetrical_id);
CREATE INDEX IF NOT EXISTS idx_consultation_prenatale_date ON consultation_prenatale(date_consultation);
CREATE INDEX IF NOT EXISTS idx_soins_promotionnels_dossier ON soins_promotionnels(dossier_obstetrical_id);

-- ============================================
-- ÉTAPE 4: CRÉER LES TABLES ACCOUCHEMENT
-- ============================================

-- Table accouchement
CREATE TABLE IF NOT EXISTS accouchement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  date_accouchement TIMESTAMP WITH TIME ZONE NOT NULL,
  heure_debut_travail TIME,
  heure_accouchement TIME,
  duree_travail INTEGER,
  type_accouchement VARCHAR(50),
  presentation VARCHAR(50),
  issue_grossesse VARCHAR(50),
  nombre_enfants INTEGER DEFAULT 1,
  hemorragie BOOLEAN DEFAULT false,
  volume_hemorragie DECIMAL(6,2),
  ocytociques BOOLEAN DEFAULT false,
  heure_ocytociques TIME,
  complications TEXT,
  type_anesthesie VARCHAR(100),
  observations TEXT,
  statut VARCHAR(50) DEFAULT 'en_cours',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table delivrance
CREATE TABLE IF NOT EXISTS delivrance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accouchement_id UUID NOT NULL REFERENCES accouchement(id) ON DELETE CASCADE,
  heure_delivrance TIME,
  duree_delivrance INTEGER,
  perte_sang DECIMAL(6,2) DEFAULT 0,
  placenta_complet BOOLEAN DEFAULT true,
  anomalies_placenta TEXT,
  cordon_normal BOOLEAN DEFAULT true,
  anomalies_cordon TEXT,
  membranes_completes BOOLEAN DEFAULT true,
  membranes_dechirures BOOLEAN DEFAULT false,
  episiotomie BOOLEAN DEFAULT false,
  dechirures_perineales BOOLEAN DEFAULT false,
  degre_dechirure INTEGER,
  reparation_perineale BOOLEAN DEFAULT false,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(accouchement_id)
);

-- Table examen_placenta
CREATE TABLE IF NOT EXISTS examen_placenta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accouchement_id UUID NOT NULL REFERENCES accouchement(id) ON DELETE CASCADE,
  heure_delivrance TIME,
  longueur_cordon DECIMAL(5,2),
  lli_hln VARCHAR(50),
  presence_anomalies BOOLEAN DEFAULT false,
  culs_de_sac BOOLEAN DEFAULT false,
  caillots BOOLEAN DEFAULT false,
  description_anomalies TEXT,
  parite INTEGER,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(accouchement_id)
);

-- Table nouveau_ne
CREATE TABLE IF NOT EXISTS nouveau_ne (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accouchement_id UUID NOT NULL REFERENCES accouchement(id) ON DELETE CASCADE,
  numero_ordre INTEGER DEFAULT 1,
  sexe VARCHAR(20),
  rang_naissance INTEGER DEFAULT 1,
  poids DECIMAL(5,3),
  taille DECIMAL(5,2),
  perimetre_cranien DECIMAL(5,2),
  apgar_respiration_1min INTEGER CHECK (apgar_respiration_1min BETWEEN 0 AND 2),
  apgar_frequence_cardiaque_1min INTEGER CHECK (apgar_frequence_cardiaque_1min BETWEEN 0 AND 2),
  apgar_tonus_1min INTEGER CHECK (apgar_tonus_1min BETWEEN 0 AND 2),
  apgar_reflexe_1min INTEGER CHECK (apgar_reflexe_1min BETWEEN 0 AND 2),
  apgar_coloration_1min INTEGER CHECK (apgar_coloration_1min BETWEEN 0 AND 2),
  apgar_score_1min INTEGER GENERATED ALWAYS AS (
    COALESCE(apgar_respiration_1min, 0) + 
    COALESCE(apgar_frequence_cardiaque_1min, 0) + 
    COALESCE(apgar_tonus_1min, 0) + 
    COALESCE(apgar_reflexe_1min, 0) + 
    COALESCE(apgar_coloration_1min, 0)
  ) STORED,
  apgar_respiration_5min INTEGER CHECK (apgar_respiration_5min BETWEEN 0 AND 2),
  apgar_frequence_cardiaque_5min INTEGER CHECK (apgar_frequence_cardiaque_5min BETWEEN 0 AND 2),
  apgar_tonus_5min INTEGER CHECK (apgar_tonus_5min BETWEEN 0 AND 2),
  apgar_reflexe_5min INTEGER CHECK (apgar_reflexe_5min BETWEEN 0 AND 2),
  apgar_coloration_5min INTEGER CHECK (apgar_coloration_5min BETWEEN 0 AND 2),
  apgar_score_5min INTEGER GENERATED ALWAYS AS (
    COALESCE(apgar_respiration_5min, 0) + 
    COALESCE(apgar_frequence_cardiaque_5min, 0) + 
    COALESCE(apgar_tonus_5min, 0) + 
    COALESCE(apgar_reflexe_5min, 0) + 
    COALESCE(apgar_coloration_5min, 0)
  ) STORED,
  apgar_respiration_10min INTEGER CHECK (apgar_respiration_10min BETWEEN 0 AND 2),
  apgar_frequence_cardiaque_10min INTEGER CHECK (apgar_frequence_cardiaque_10min BETWEEN 0 AND 2),
  apgar_tonus_10min INTEGER CHECK (apgar_tonus_10min BETWEEN 0 AND 2),
  apgar_reflexe_10min INTEGER CHECK (apgar_reflexe_10min BETWEEN 0 AND 2),
  apgar_coloration_10min INTEGER CHECK (apgar_coloration_10min BETWEEN 0 AND 2),
  apgar_score_10min INTEGER GENERATED ALWAYS AS (
    COALESCE(apgar_respiration_10min, 0) + 
    COALESCE(apgar_frequence_cardiaque_10min, 0) + 
    COALESCE(apgar_tonus_10min, 0) + 
    COALESCE(apgar_reflexe_10min, 0) + 
    COALESCE(apgar_coloration_10min, 0)
  ) STORED,
  temperature DECIMAL(4,2),
  etat_clinique_normal BOOLEAN DEFAULT true,
  difficulte_respirer BOOLEAN DEFAULT false,
  coloration_anormale BOOLEAN DEFAULT false,
  convulsions BOOLEAN DEFAULT false,
  absence_cri BOOLEAN DEFAULT false,
  autres_signes_danger TEXT,
  reanimation_necessaire BOOLEAN DEFAULT false,
  ventilation_masque BOOLEAN DEFAULT false,
  oxygene BOOLEAN DEFAULT false,
  aspiration BOOLEAN DEFAULT false,
  massage_cardiaque BOOLEAN DEFAULT false,
  autres_procedures TEXT,
  etat_naissance VARCHAR(50) DEFAULT 'Vivant',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table soins_immediats
CREATE TABLE IF NOT EXISTS soins_immediats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nouveau_ne_id UUID NOT NULL REFERENCES nouveau_ne(id) ON DELETE CASCADE,
  sechage BOOLEAN DEFAULT false,
  heure_sechage TIME,
  rechauffement BOOLEAN DEFAULT false,
  heure_rechauffement TIME,
  contact_peau_a_peau BOOLEAN DEFAULT false,
  heure_contact_peau_a_peau TIME,
  duree_contact_peau_a_peau INTEGER,
  allaitement_precoce BOOLEAN DEFAULT false,
  heure_allaitement_precoce TIME,
  prophylaxie_oculaire BOOLEAN DEFAULT false,
  produit_prophylaxie_oculaire VARCHAR(100),
  heure_prophylaxie_oculaire TIME,
  antiretroviral_arv BOOLEAN DEFAULT false,
  type_arv VARCHAR(100),
  dose_arv VARCHAR(50),
  heure_arv TIME,
  vitamine_k1 BOOLEAN DEFAULT false,
  dose_vitamine_k1 VARCHAR(50),
  voie_vitamine_k1 VARCHAR(20),
  heure_vitamine_k1 TIME,
  pesee BOOLEAN DEFAULT false,
  chapelet_identification BOOLEAN DEFAULT false,
  numero_chapelet VARCHAR(50),
  soins_cordon BOOLEAN DEFAULT false,
  antiseptique_cordon VARCHAR(100),
  heure_soins_cordon TIME,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nouveau_ne_id)
);

-- Table carte_infantile
CREATE TABLE IF NOT EXISTS carte_infantile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nouveau_ne_id UUID NOT NULL REFERENCES nouveau_ne(id) ON DELETE CASCADE,
  carte_remplie BOOLEAN DEFAULT false,
  date_remplissage DATE,
  vitamine_a_administree BOOLEAN DEFAULT false,
  age_vitamine_a VARCHAR(20),
  date_vitamine_a DATE,
  pf_discute BOOLEAN DEFAULT false,
  date_discussion_pf DATE,
  bcg BOOLEAN DEFAULT false,
  date_bcg DATE,
  heure_bcg TIME,
  polio_0 BOOLEAN DEFAULT false,
  date_polio_0 DATE,
  heure_polio_0 TIME,
  acceptation_mere BOOLEAN DEFAULT false,
  acceptation_pere BOOLEAN DEFAULT false,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nouveau_ne_id)
);

-- Index accouchement
CREATE INDEX IF NOT EXISTS idx_accouchement_dossier ON accouchement(dossier_obstetrical_id);
CREATE INDEX IF NOT EXISTS idx_accouchement_date ON accouchement(date_accouchement);
CREATE INDEX IF NOT EXISTS idx_nouveau_ne_accouchement ON nouveau_ne(accouchement_id);

-- ============================================
-- ÉTAPE 5: CRÉER LES TABLES POST-PARTUM
-- ============================================

-- Table surveillance_post_partum
CREATE TABLE IF NOT EXISTS surveillance_post_partum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accouchement_id UUID NOT NULL REFERENCES accouchement(id) ON DELETE CASCADE,
  date_debut_surveillance TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  date_fin_surveillance TIMESTAMP WITH TIME ZONE,
  duree_surveillance INTEGER DEFAULT 120,
  statut VARCHAR(50) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'complication', 'transfere')),
  agent_responsable VARCHAR(200),
  agent_id UUID,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table observation_post_partum
CREATE TABLE IF NOT EXISTS observation_post_partum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surveillance_post_partum_id UUID NOT NULL REFERENCES surveillance_post_partum(id) ON DELETE CASCADE,
  heure_observation TIME NOT NULL,
  minute_observation INTEGER CHECK (minute_observation IN (0, 15, 30, 45)),
  timestamp_observation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  temperature DECIMAL(4,2),
  tension_arterielle_systolique INTEGER,
  tension_arterielle_diastolique INTEGER,
  pouls INTEGER,
  respiration INTEGER,
  contraction_uterine VARCHAR(50),
  saignement_qualite VARCHAR(50),
  saignement_quantite DECIMAL(6,2),
  douleurs VARCHAR(50),
  oedemes BOOLEAN DEFAULT false,
  etat_perinee VARCHAR(50),
  plaie_perinee VARCHAR(200),
  saignement_perineal BOOLEAN DEFAULT false,
  etat_general VARCHAR(50),
  mictions VARCHAR(50),
  diurese DECIMAL(6,2),
  conscience VARCHAR(50),
  risque_hpp BOOLEAN DEFAULT false,
  risque_retention_placentaire BOOLEAN DEFAULT false,
  risque_infection BOOLEAN DEFAULT false,
  risque_hypertension BOOLEAN DEFAULT false,
  risque_anemie_severe BOOLEAN DEFAULT false,
  alerte_hpp BOOLEAN DEFAULT false,
  alerte_tachycardie BOOLEAN DEFAULT false,
  alerte_hypotension BOOLEAN DEFAULT false,
  alerte_hypertension BOOLEAN DEFAULT false,
  alerte_hyperthermie BOOLEAN DEFAULT false,
  alerte_hypothermie BOOLEAN DEFAULT false,
  notes TEXT,
  agent_observation VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table traitement_post_partum
CREATE TABLE IF NOT EXISTS traitement_post_partum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surveillance_post_partum_id UUID NOT NULL REFERENCES surveillance_post_partum(id) ON DELETE CASCADE,
  type_traitement VARCHAR(100) NOT NULL,
  medicament VARCHAR(200),
  dose VARCHAR(100) NOT NULL,
  voie_administration VARCHAR(50),
  heure_administration TIME NOT NULL,
  date_administration DATE NOT NULL DEFAULT CURRENT_DATE,
  posologie TEXT,
  duree VARCHAR(50),
  indication TEXT,
  agent_administration VARCHAR(200) NOT NULL,
  agent_id UUID,
  reponse_traitement VARCHAR(200),
  effets_secondaires TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table conseils_post_partum
CREATE TABLE IF NOT EXISTS conseils_post_partum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surveillance_post_partum_id UUID NOT NULL REFERENCES surveillance_post_partum(id) ON DELETE CASCADE,
  signes_danger BOOLEAN DEFAULT false,
  date_signes_danger TIMESTAMP WITH TIME ZONE,
  agent_signes_danger VARCHAR(200),
  nutrition_hydratation BOOLEAN DEFAULT false,
  date_nutrition TIMESTAMP WITH TIME ZONE,
  agent_nutrition VARCHAR(200),
  hygiene_perineale BOOLEAN DEFAULT false,
  date_hygiene_perineale TIMESTAMP WITH TIME ZONE,
  agent_hygiene_perineale VARCHAR(200),
  allaitement BOOLEAN DEFAULT false,
  date_allaitement TIMESTAMP WITH TIME ZONE,
  agent_allaitement VARCHAR(200),
  planification_familiale BOOLEAN DEFAULT false,
  date_planification_familiale TIMESTAMP WITH TIME ZONE,
  agent_planification_familiale VARCHAR(200),
  retour_consultation BOOLEAN DEFAULT false,
  date_retour_consultation DATE,
  agent_retour_consultation VARCHAR(200),
  autres_conseils TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(surveillance_post_partum_id)
);

-- Table sortie_salle_naissance
CREATE TABLE IF NOT EXISTS sortie_salle_naissance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surveillance_post_partum_id UUID NOT NULL REFERENCES surveillance_post_partum(id) ON DELETE CASCADE,
  heure_sortie TIME NOT NULL,
  date_sortie DATE NOT NULL DEFAULT CURRENT_DATE,
  etat_mere VARCHAR(50),
  etat_detaille TEXT,
  destination VARCHAR(100),
  service_destination VARCHAR(200),
  chambre VARCHAR(50),
  accompagnant_present BOOLEAN DEFAULT false,
  nom_accompagnant VARCHAR(200),
  transport_utilise VARCHAR(100),
  dossier_transfere BOOLEAN DEFAULT false,
  service_receveur VARCHAR(200),
  agent_sortie VARCHAR(200) NOT NULL,
  agent_id UUID,
  signature_agent TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(surveillance_post_partum_id)
);

-- Index post-partum
CREATE INDEX IF NOT EXISTS idx_surveillance_post_partum_accouchement ON surveillance_post_partum(accouchement_id);
CREATE INDEX IF NOT EXISTS idx_observation_post_partum_surveillance ON observation_post_partum(surveillance_post_partum_id);
CREATE INDEX IF NOT EXISTS idx_observation_post_partum_timestamp ON observation_post_partum(timestamp_observation);

-- Trigger pour détecter automatiquement les risques post-partum
CREATE OR REPLACE FUNCTION detecter_risques_post_partum()
RETURNS TRIGGER AS $$
BEGIN
    NEW.alerte_hpp := false;
    NEW.alerte_tachycardie := false;
    NEW.alerte_hypotension := false;
    NEW.alerte_hypertension := false;
    NEW.alerte_hyperthermie := false;
    NEW.alerte_hypothermie := false;
    
    IF NEW.saignement_quantite > 500 OR NEW.saignement_qualite IN ('Abondant', 'Très abondant') THEN
        NEW.risque_hpp := true;
        NEW.alerte_hpp := true;
    END IF;
    
    IF NEW.pouls > 100 THEN
        NEW.alerte_tachycardie := true;
    END IF;
    
    IF NEW.tension_arterielle_systolique < 90 THEN
        NEW.alerte_hypotension := true;
        NEW.risque_hpp := true;
    END IF;
    
    IF NEW.tension_arterielle_systolique > 140 OR NEW.tension_arterielle_diastolique > 90 THEN
        NEW.alerte_hypertension := true;
        NEW.risque_hypertension := true;
    END IF;
    
    IF NEW.temperature > 38.0 THEN
        NEW.alerte_hyperthermie := true;
        NEW.risque_infection := true;
    END IF;
    
    IF NEW.temperature < 36.0 THEN
        NEW.alerte_hypothermie := true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS detecter_risques_post_partum_trigger ON observation_post_partum;
CREATE TRIGGER detecter_risques_post_partum_trigger
    BEFORE INSERT OR UPDATE ON observation_post_partum
    FOR EACH ROW
    EXECUTE FUNCTION detecter_risques_post_partum();

-- ============================================
-- ÉTAPE 6: GÉNÉRER LES DONNÉES DE DÉMONSTRATION
-- ============================================

-- Insérer 3 patientes
INSERT INTO patients (
  id, identifiant, nom, prenom, date_naissance, sexe, telephone, adresse, 
  groupe_sanguin, rhesus, nationalite, profession, situation_matrimoniale, date_enregistrement, statut
)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'PAT-2024-001', 'KOUASSI', 'Marie', '1995-03-15', 'Féminin', '+22997123456', 'Cotonou, Quartier Akpakpa', 'O', 'Positif', 'Béninoise', 'Enseignante', 'Marié(e)', CURRENT_DATE, 'Connu'),
  ('22222222-2222-2222-2222-222222222222', 'PAT-2024-002', 'GBEDJI', 'Fatima', '1988-08-20', 'Féminin', '+22997234567', 'Porto-Novo, Quartier Ouando', 'A', 'Positif', 'Béninoise', 'Commerçante', 'Marié(e)', CURRENT_DATE, 'Connu'),
  ('33333333-3333-3333-3333-333333333333', 'PAT-2024-003', 'SOSSOU', 'Aisha', '2008-11-10', 'Féminin', '+22997345678', 'Cotonou, Quartier Godomey', 'B', 'Négatif', 'Béninoise', 'Étudiante', 'Célibataire', CURRENT_DATE, 'Nouveau')
ON CONFLICT (id) DO UPDATE SET
  identifiant = EXCLUDED.identifiant,
  nom = EXCLUDED.nom,
  prenom = EXCLUDED.prenom,
  telephone = EXCLUDED.telephone;

-- Insérer 3 dossiers obstétricaux
INSERT INTO dossier_obstetrical (
  id, patient_id, date_entree, numero_dossier, conjoint_nom_prenoms, conjoint_profession,
  conjoint_groupe_sanguin, conjoint_rhesus, gestite, parite, nombre_enfants_vivants,
  ddr, dpa, examen_groupe_sanguin, examen_rhesus, test_coombs_indirect, vih, syphilis, statut
)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '2024-01-15', 'MAT-2024-001', 'KOUASSI Jean', 'Enseignant', 'O', 'Positif', 1, 0, 0, '2024-01-01', '2024-10-08', 'O', 'Positif', 'Négatif', false, false, 'en_cours'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '2024-02-01', 'MAT-2024-002', 'GBEDJI Paul', 'Commerçant', 'A', 'Positif', 7, 6, 5, '2024-02-15', '2024-11-22', 'A', 'Positif', 'Négatif', false, false, 'en_cours'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', '2024-03-01', 'MAT-2024-003', 'SOSSOU Marc', NULL, NULL, NULL, 1, 0, 0, '2024-03-10', '2024-12-16', 'B', 'Négatif', 'Négatif', false, false, 'en_cours')
ON CONFLICT (id) DO UPDATE SET
  patient_id = EXCLUDED.patient_id,
  numero_dossier = EXCLUDED.numero_dossier,
  ddr = EXCLUDED.ddr,
  dpa = EXCLUDED.dpa;

-- Insérer grossesses antérieures pour dossier 2
INSERT INTO grossesses_anterieures (dossier_obstetrical_id, annee, evolution, poids, sexe, etat_enfants)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2015, 'Terme', 3.2, 'M', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2017, 'Terme', 3.5, 'F', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2018, 'Avortement', NULL, NULL, 'Décédé'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2019, 'Terme', 3.8, 'M', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2021, 'Terme', 3.4, 'F', 'Vivant'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2023, 'Prématuré', 2.8, 'M', 'Décédé')
ON CONFLICT DO NOTHING;

-- Insérer vaccinations
INSERT INTO vaccination_maternelle (dossier_obstetrical_id, vat1_date, vat2_date, vat3_date, vat4_date, vat5_date, prochaine_dose, statut)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024-01-20', '2024-02-17', '2024-08-17', '2025-08-17', '2026-08-17', 'Complet', 'complete'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-02-05', '2024-03-04', '2024-09-04', NULL, NULL, 'VAT4', 'en_cours')
ON CONFLICT (dossier_obstetrical_id) DO UPDATE SET
  vat1_date = EXCLUDED.vat1_date,
  vat2_date = EXCLUDED.vat2_date,
  vat3_date = EXCLUDED.vat3_date,
  statut = EXCLUDED.statut;

-- Insérer CPN
INSERT INTO consultation_prenatale (
  dossier_obstetrical_id, numero_cpn, trimestre, date_consultation, terme_semaines, poids, hauteur_uterine,
  tension_arterielle, temperature, presentation, bruit_coeur_foetal, mouvements_foetaux, oedemes,
  etat_general, test_vih, test_syphilis, hemoglobine, diagnostic, decision, prochain_rdv, statut
)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'T1', '2024-02-15', 7, 58.5, 10, '110/70', 36.8, 'Non évalué', false, false, false, 'Bon', 'Négatif', 'Négatif', 12.5, 'Grossesse évolutive', 'CPN normale, continuer suivi', '2024-03-15', 'terminee'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'T2', '2024-04-20', 16, 62.0, 16, '115/75', 37.0, 'Céphalique', true, true, false, 'Bon', NULL, NULL, 11.8, 'Grossesse évolutive', 'CPN normale, continuer suivi', '2024-05-25', 'terminee'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'T3', '2024-06-30', 29, 68.0, 28, '120/80', 37.1, 'Céphalique', true, true, false, 'Bon', NULL, NULL, 11.2, 'Grossesse évolutive', 'Grossesse à terme proche', '2024-08-05', 'terminee'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'T3', '2024-08-10', 36, 72.0, 35, '125/80', 37.2, 'Céphalique', true, true, false, 'Bon', NULL, NULL, 10.9, 'Grossesse à terme', 'Surveillance accouchement', '2024-09-01', 'terminee'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'T1', '2024-03-01', 10, 75.0, 12, '145/95', 37.0, 'Non évalué', false, false, true, 'Moyen', 'Négatif', 'Négatif', 10.2, 'Grossesse à risque - HTA', 'Surveillance rapprochée', '2024-03-20', 'terminee'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 'T2', '2024-04-15', 18, 78.0, 18, '150/95', 37.2, 'Céphalique', true, true, true, 'Moyen', NULL, NULL, 9.8, 'Grossesse à risque', 'Surveillance continue HTA', '2024-05-15', 'terminee')
ON CONFLICT (dossier_obstetrical_id, numero_cpn) DO UPDATE SET
  date_consultation = EXCLUDED.date_consultation,
  terme_semaines = EXCLUDED.terme_semaines,
  poids = EXCLUDED.poids;

-- Insérer soins promotionnels
INSERT INTO soins_promotionnels (
  dossier_obstetrical_id, info_vih_ptme, date_info_vih_ptme, info_paludisme, date_info_paludisme,
  info_nutrition, date_info_nutrition, info_espacement_naissances, date_info_espacement_naissances,
  moustiquaire, date_moustiquaire, quantite_moustiquaire, fer_acide_folique, date_fer_acide_folique,
  quantite_fer_acide_folique, deparasitage, date_deparasitage
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  true, '2024-02-15', true, '2024-02-15', true, '2024-02-15', true, '2024-04-20',
  true, '2024-02-15', 2, true, '2024-02-15', 90, true, '2024-02-15'
)
ON CONFLICT (dossier_obstetrical_id) DO UPDATE SET
  moustiquaire = EXCLUDED.moustiquaire,
  fer_acide_folique = EXCLUDED.fer_acide_folique;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

SELECT 
  '✅ CONFIGURATION COMPLÈTE!' as message,
  (SELECT COUNT(*) FROM patients WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')) as patients_crees,
  (SELECT COUNT(*) FROM dossier_obstetrical WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc')) as dossiers_crees,
  (SELECT COUNT(*) FROM consultation_prenatale) as cpn_crees,
  (SELECT COUNT(*) FROM vaccination_maternelle) as vaccinations_crees;

