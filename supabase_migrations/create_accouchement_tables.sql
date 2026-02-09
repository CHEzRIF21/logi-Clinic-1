-- Migration: Création des tables pour le module ACCOUCHEMENT et NOUVEAU-NÉ
-- Date: 2024-12-20
-- Description: Tables pour digitaliser la fiche d'accouchement

-- Table principale pour l'accouchement
CREATE TABLE IF NOT EXISTS accouchement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  
  -- Informations générales
  date_accouchement TIMESTAMP WITH TIME ZONE NOT NULL,
  heure_debut_travail TIME,
  heure_accouchement TIME NOT NULL,
  duree_travail INTEGER, -- en minutes
  
  -- Type d'accouchement
  type_accouchement VARCHAR(50) CHECK (type_accouchement IN ('Voie basse', 'Césarienne', 'Forceps', 'Ventouse', 'Autre')),
  presentation VARCHAR(50) CHECK (presentation IN ('Céphalique', 'Siège', 'Transverse', 'Autre')),
  
  -- Issue de la grossesse
  issue_grossesse VARCHAR(50) CHECK (issue_grossesse IN ('Vivant', 'Mort-né', 'Mort in utero')),
  nombre_enfants INTEGER DEFAULT 1 CHECK (nombre_enfants > 0),
  
  -- Complications
  complications TEXT,
  hemorragie BOOLEAN DEFAULT false,
  volume_hemorragie DECIMAL(6,2), -- en mL
  
  -- Anesthésie
  type_anesthesie VARCHAR(50),
  
  -- Médication
  ocytociques BOOLEAN DEFAULT false,
  heure_ocytociques TIME,
  
  -- Personnel
  sage_femme_id UUID,
  medecin_id UUID,
  
  -- Statut
  statut VARCHAR(50) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'complique')),
  
  -- Notes
  observations TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Table pour la délivrance
CREATE TABLE IF NOT EXISTS delivrance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accouchement_id UUID NOT NULL REFERENCES accouchement(id) ON DELETE CASCADE,
  
  -- Heure de délivrance
  heure_delivrance TIME NOT NULL,
  duree_delivrance INTEGER, -- en minutes
  
  -- Perte de sang
  perte_sang DECIMAL(6,2) NOT NULL, -- en mL
  
  -- État du placenta
  placenta_complet BOOLEAN DEFAULT true,
  anomalies_placenta TEXT,
  
  -- État du cordon
  cordon_normal BOOLEAN DEFAULT true,
  anomalies_cordon TEXT,
  
  -- Examen des membranes
  membranes_completes BOOLEAN DEFAULT true,
  membranes_dechirures BOOLEAN DEFAULT false,
  
  -- Examen du périnée
  episiotomie BOOLEAN DEFAULT false,
  dechirures_perineales BOOLEAN DEFAULT false,
  degre_dechirure INTEGER CHECK (degre_dechirure BETWEEN 1 AND 4),
  reparation_perineale BOOLEAN DEFAULT false,
  
  -- Observations
  observations TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour l'examen du placenta
CREATE TABLE IF NOT EXISTS examen_placenta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accouchement_id UUID NOT NULL REFERENCES accouchement(id) ON DELETE CASCADE,
  
  -- Mesures
  heure_delivrance TIME,
  longueur_cordon DECIMAL(5,2), -- en cm
  
  -- Paramètres LLI/HLN
  lli_hln VARCHAR(50), -- À définir selon le protocole
  
  -- Anomalies
  presence_anomalies BOOLEAN DEFAULT false,
  culs_de_sac BOOLEAN DEFAULT false,
  caillots BOOLEAN DEFAULT false,
  description_anomalies TEXT,
  
  -- Parité
  parite INTEGER,
  
  -- Photo/Scan (optionnel)
  photo_url TEXT,
  
  -- Observations
  observations TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour l'état du nouveau-né
CREATE TABLE IF NOT EXISTS nouveau_ne (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accouchement_id UUID NOT NULL REFERENCES accouchement(id) ON DELETE CASCADE,
  
  -- Identification
  numero_ordre INTEGER, -- Si jumeaux, 1, 2, 3...
  sexe VARCHAR(10) CHECK (sexe IN ('Masculin', 'Féminin', 'Indéterminé')),
  rang_naissance INTEGER,
  
  -- Mesures anthropométriques
  poids DECIMAL(5,3) NOT NULL, -- en kg
  taille DECIMAL(5,2), -- en cm
  perimetre_cranien DECIMAL(5,2), -- en cm
  
  -- Scores Apgar (0-10 chacun)
  apgar_1min INTEGER CHECK (apgar_1min BETWEEN 0 AND 10),
  apgar_5min INTEGER CHECK (apgar_5min BETWEEN 0 AND 10),
  apgar_10min INTEGER CHECK (apgar_10min BETWEEN 0 AND 10),
  
  -- Détails Apgar (chaque critère noté sur 0-2)
  apgar_respiration_1min INTEGER CHECK (apgar_respiration_1min BETWEEN 0 AND 2),
  apgar_frequence_cardiaque_1min INTEGER CHECK (apgar_frequence_cardiaque_1min BETWEEN 0 AND 2),
  apgar_tonus_1min INTEGER CHECK (apgar_tonus_1min BETWEEN 0 AND 2),
  apgar_reflexe_1min INTEGER CHECK (apgar_reflexe_1min BETWEEN 0 AND 2),
  apgar_coloration_1min INTEGER CHECK (apgar_coloration_1min BETWEEN 0 AND 2),
  
  apgar_respiration_5min INTEGER CHECK (apgar_respiration_5min BETWEEN 0 AND 2),
  apgar_frequence_cardiaque_5min INTEGER CHECK (apgar_frequence_cardiaque_5min BETWEEN 0 AND 2),
  apgar_tonus_5min INTEGER CHECK (apgar_tonus_5min BETWEEN 0 AND 2),
  apgar_reflexe_5min INTEGER CHECK (apgar_reflexe_5min BETWEEN 0 AND 2),
  apgar_coloration_5min INTEGER CHECK (apgar_coloration_5min BETWEEN 0 AND 2),
  
  apgar_respiration_10min INTEGER CHECK (apgar_respiration_10min BETWEEN 0 AND 2),
  apgar_frequence_cardiaque_10min INTEGER CHECK (apgar_frequence_cardiaque_10min BETWEEN 0 AND 2),
  apgar_tonus_10min INTEGER CHECK (apgar_tonus_10min BETWEEN 0 AND 2),
  apgar_reflexe_10min INTEGER CHECK (apgar_reflexe_10min BETWEEN 0 AND 2),
  apgar_coloration_10min INTEGER CHECK (apgar_coloration_10min BETWEEN 0 AND 2),
  
  -- Paramètres cliniques
  temperature DECIMAL(4,2),
  etat_clinique_normal BOOLEAN DEFAULT true,
  
  -- Signes de danger
  difficulte_respirer BOOLEAN DEFAULT false,
  coloration_anormale BOOLEAN DEFAULT false,
  convulsions BOOLEAN DEFAULT false,
  absence_cri BOOLEAN DEFAULT false,
  autres_signes_danger TEXT,
  
  -- Réanimation néonatale
  reanimation_necessaire BOOLEAN DEFAULT false,
  ventilation_masque BOOLEAN DEFAULT false,
  oxygene BOOLEAN DEFAULT false,
  aspiration BOOLEAN DEFAULT false,
  massage_cardiaque BOOLEAN DEFAULT false,
  autres_procedures TEXT,
  
  -- Issue
  etat_naissance VARCHAR(50) CHECK (etat_naissance IN ('Vivant', 'Mort-né', 'Décédé post-natal')),
  
  -- Observations
  observations TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les soins immédiats au nouveau-né
CREATE TABLE IF NOT EXISTS soins_immediats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nouveau_ne_id UUID NOT NULL REFERENCES nouveau_ne(id) ON DELETE CASCADE,
  
  -- Soins de base
  sechage BOOLEAN DEFAULT false,
  heure_sechage TIME,
  
  rechauffement BOOLEAN DEFAULT false,
  heure_rechauffement TIME,
  
  contact_peau_a_peau BOOLEAN DEFAULT false,
  heure_contact_peau_a_peau TIME,
  duree_contact_peau_a_peau INTEGER, -- en minutes
  
  allaitement_precoce BOOLEAN DEFAULT false,
  heure_allaitement_precoce TIME,
  
  -- Prophylaxie
  prophylaxie_oculaire BOOLEAN DEFAULT false,
  produit_prophylaxie_oculaire VARCHAR(100),
  heure_prophylaxie_oculaire TIME,
  
  antiretroviral_arv BOOLEAN DEFAULT false,
  type_arv VARCHAR(100),
  dose_arv VARCHAR(50),
  heure_arv TIME,
  
  vitamine_k1 BOOLEAN DEFAULT false,
  dose_vitamine_k1 VARCHAR(50),
  voie_vitamine_k1 VARCHAR(50) CHECK (voie_vitamine_k1 IN ('IM', 'Orale', 'IV')),
  heure_vitamine_k1 TIME,
  
  -- Identification
  pesee BOOLEAN DEFAULT false,
  chapelet_identification BOOLEAN DEFAULT false,
  numero_chapelet VARCHAR(50),
  
  -- Soins du cordon
  soins_cordon BOOLEAN DEFAULT false,
  antiseptique_cordon VARCHAR(100),
  heure_soins_cordon TIME,
  
  -- Observations
  observations TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour la carte infantile (carnet de naissance)
CREATE TABLE IF NOT EXISTS carte_infantile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nouveau_ne_id UUID NOT NULL REFERENCES nouveau_ne(id) ON DELETE CASCADE,
  
  -- Carte remplie
  carte_remplie BOOLEAN DEFAULT false,
  date_remplissage DATE,
  
  -- Vitamine A
  vitamine_a_administree BOOLEAN DEFAULT false,
  age_vitamine_a VARCHAR(20) CHECK (age_vitamine_a IN ('6 mois', '1 an', '3 ans')),
  date_vitamine_a DATE,
  
  -- Planning Familial
  pf_discute BOOLEAN DEFAULT false,
  date_discussion_pf DATE,
  
  -- Vaccinations
  bcg BOOLEAN DEFAULT false,
  date_bcg DATE,
  heure_bcg TIME,
  
  polio_0 BOOLEAN DEFAULT false,
  date_polio_0 DATE,
  heure_polio_0 TIME,
  
  -- Acceptation parents
  acceptation_mere BOOLEAN DEFAULT false,
  acceptation_pere BOOLEAN DEFAULT false,
  
  -- Observations
  observations TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour la sensibilisation de la mère
CREATE TABLE IF NOT EXISTS sensibilisation_mere (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accouchement_id UUID NOT NULL REFERENCES accouchement(id) ON DELETE CASCADE,
  
  -- Thèmes de sensibilisation
  quantite_sang BOOLEAN DEFAULT false,
  date_quantite_sang TIMESTAMP WITH TIME ZONE,
  agent_quantite_sang VARCHAR(200),
  
  hemorragie BOOLEAN DEFAULT false,
  date_hemorragie TIMESTAMP WITH TIME ZONE,
  agent_hemorragie VARCHAR(200),
  
  massage_uterin BOOLEAN DEFAULT false,
  date_massage_uterin TIMESTAMP WITH TIME ZONE,
  agent_massage_uterin VARCHAR(200),
  
  traction_controlee BOOLEAN DEFAULT false,
  date_traction_controlee TIMESTAMP WITH TIME ZONE,
  agent_traction_controlee VARCHAR(200),
  
  ocytociques_10min BOOLEAN DEFAULT false,
  date_ocytociques_10min TIMESTAMP WITH TIME ZONE,
  agent_ocytociques_10min VARCHAR(200),
  
  assistance BOOLEAN DEFAULT false,
  type_assistance VARCHAR(50), -- CF/TP?
  date_assistance TIMESTAMP WITH TIME ZONE,
  agent_assistance VARCHAR(200),
  
  anthelminthique BOOLEAN DEFAULT false,
  date_anthelminthique TIMESTAMP WITH TIME ZONE,
  agent_anthelminthique VARCHAR(200),
  
  nutrition BOOLEAN DEFAULT false,
  date_nutrition TIMESTAMP WITH TIME ZONE,
  agent_nutrition VARCHAR(200),
  
  -- Observations
  observations TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour la référence/transfert
CREATE TABLE IF NOT EXISTS reference_transfert (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accouchement_id UUID REFERENCES accouchement(id) ON DELETE CASCADE,
  nouveau_ne_id UUID REFERENCES nouveau_ne(id) ON DELETE CASCADE,
  
  -- Au moins un des deux doit être renseigné
  CONSTRAINT check_reference_target CHECK (
    (accouchement_id IS NOT NULL) OR (nouveau_ne_id IS NOT NULL)
  ),
  
  -- Référence nécessaire
  reference_necessaire BOOLEAN DEFAULT false,
  
  -- Détails
  motif TEXT,
  heure_transfert TIME,
  structure_reference VARCHAR(200),
  moyen_transfert VARCHAR(100),
  
  -- Personnel
  agent_transfert VARCHAR(200),
  signature_agent TEXT, -- Peut stocker une signature numérique
  
  -- Suivi
  statut_transfert VARCHAR(50) CHECK (statut_transfert IN ('En attente', 'En cours', 'Arrivé', 'Refusé')),
  retour_information TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_accouchement_dossier ON accouchement(dossier_obstetrical_id);
CREATE INDEX IF NOT EXISTS idx_accouchement_date ON accouchement(date_accouchement);
CREATE INDEX IF NOT EXISTS idx_delivrance_accouchement ON delivrance(accouchement_id);
CREATE INDEX IF NOT EXISTS idx_examen_placenta_accouchement ON examen_placenta(accouchement_id);
CREATE INDEX IF NOT EXISTS idx_nouveau_ne_accouchement ON nouveau_ne(accouchement_id);
CREATE INDEX IF NOT EXISTS idx_soins_immediats_nouveau_ne ON soins_immediats(nouveau_ne_id);
CREATE INDEX IF NOT EXISTS idx_carte_infantile_nouveau_ne ON carte_infantile(nouveau_ne_id);
CREATE INDEX IF NOT EXISTS idx_sensibilisation_mere_accouchement ON sensibilisation_mere(accouchement_id);
CREATE INDEX IF NOT EXISTS idx_reference_transfert_accouchement ON reference_transfert(accouchement_id);
CREATE INDEX IF NOT EXISTS idx_reference_transfert_nouveau_ne ON reference_transfert(nouveau_ne_id);

-- Triggers pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_accouchement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accouchement_updated_at
    BEFORE UPDATE ON accouchement
    FOR EACH ROW
    EXECUTE FUNCTION update_accouchement_updated_at();

CREATE TRIGGER update_delivrance_updated_at
    BEFORE UPDATE ON delivrance
    FOR EACH ROW
    EXECUTE FUNCTION update_accouchement_updated_at();

CREATE TRIGGER update_examen_placenta_updated_at
    BEFORE UPDATE ON examen_placenta
    FOR EACH ROW
    EXECUTE FUNCTION update_accouchement_updated_at();

CREATE TRIGGER update_nouveau_ne_updated_at
    BEFORE UPDATE ON nouveau_ne
    FOR EACH ROW
    EXECUTE FUNCTION update_accouchement_updated_at();

CREATE TRIGGER update_soins_immediats_updated_at
    BEFORE UPDATE ON soins_immediats
    FOR EACH ROW
    EXECUTE FUNCTION update_accouchement_updated_at();

CREATE TRIGGER update_carte_infantile_updated_at
    BEFORE UPDATE ON carte_infantile
    FOR EACH ROW
    EXECUTE FUNCTION update_accouchement_updated_at();

CREATE TRIGGER update_sensibilisation_mere_updated_at
    BEFORE UPDATE ON sensibilisation_mere
    FOR EACH ROW
    EXECUTE FUNCTION update_accouchement_updated_at();

CREATE TRIGGER update_reference_transfert_updated_at
    BEFORE UPDATE ON reference_transfert
    FOR EACH ROW
    EXECUTE FUNCTION update_accouchement_updated_at();

-- Fonction pour calculer automatiquement le score Apgar
CREATE OR REPLACE FUNCTION calculer_apgar(
    respiration INTEGER,
    frequence_cardiaque INTEGER,
    tonus INTEGER,
    reflexe INTEGER,
    coloration INTEGER
)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(respiration, 0) + 
           COALESCE(frequence_cardiaque, 0) + 
           COALESCE(tonus, 0) + 
           COALESCE(reflexe, 0) + 
           COALESCE(coloration, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger pour calculer automatiquement les scores Apgar
CREATE OR REPLACE FUNCTION auto_calculer_apgar()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcul Apgar 1 min
    IF NEW.apgar_respiration_1min IS NOT NULL AND
       NEW.apgar_frequence_cardiaque_1min IS NOT NULL AND
       NEW.apgar_tonus_1min IS NOT NULL AND
       NEW.apgar_reflexe_1min IS NOT NULL AND
       NEW.apgar_coloration_1min IS NOT NULL THEN
        NEW.apgar_1min := calculer_apgar(
            NEW.apgar_respiration_1min,
            NEW.apgar_frequence_cardiaque_1min,
            NEW.apgar_tonus_1min,
            NEW.apgar_reflexe_1min,
            NEW.apgar_coloration_1min
        );
    END IF;
    
    -- Calcul Apgar 5 min
    IF NEW.apgar_respiration_5min IS NOT NULL AND
       NEW.apgar_frequence_cardiaque_5min IS NOT NULL AND
       NEW.apgar_tonus_5min IS NOT NULL AND
       NEW.apgar_reflexe_5min IS NOT NULL AND
       NEW.apgar_coloration_5min IS NOT NULL THEN
        NEW.apgar_5min := calculer_apgar(
            NEW.apgar_respiration_5min,
            NEW.apgar_frequence_cardiaque_5min,
            NEW.apgar_tonus_5min,
            NEW.apgar_reflexe_5min,
            NEW.apgar_coloration_5min
        );
    END IF;
    
    -- Calcul Apgar 10 min
    IF NEW.apgar_respiration_10min IS NOT NULL AND
       NEW.apgar_frequence_cardiaque_10min IS NOT NULL AND
       NEW.apgar_tonus_10min IS NOT NULL AND
       NEW.apgar_reflexe_10min IS NOT NULL AND
       NEW.apgar_coloration_10min IS NOT NULL THEN
        NEW.apgar_10min := calculer_apgar(
            NEW.apgar_respiration_10min,
            NEW.apgar_frequence_cardiaque_10min,
            NEW.apgar_tonus_10min,
            NEW.apgar_reflexe_10min,
            NEW.apgar_coloration_10min
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculer_apgar_trigger
    BEFORE INSERT OR UPDATE ON nouveau_ne
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculer_apgar();

-- Vue récapitulative des accouchements (SECURITY INVOKER pour respecter RLS / clinic_id)
CREATE OR REPLACE VIEW vue_resume_accouchements WITH (security_invoker = on) AS
SELECT 
    a.id as accouchement_id,
    a.dossier_obstetrical_id,
    a.date_accouchement,
    a.type_accouchement,
    a.issue_grossesse,
    a.nombre_enfants,
    d.perte_sang,
    d.episiotomie,
    d.dechirures_perineales,
    COUNT(n.id) as nombre_nouveau_nes,
    AVG(n.apgar_1min) as apgar_moyen_1min,
    AVG(n.apgar_5min) as apgar_moyen_5min,
    COUNT(CASE WHEN n.etat_naissance = 'Vivant' THEN 1 END) as naissances_vivantes,
    COUNT(CASE WHEN n.etat_naissance = 'Mort-né' THEN 1 END) as morts_nes,
    COUNT(CASE WHEN n.reanimation_necessaire = true THEN 1 END) as reanimations,
    a.statut
FROM accouchement a
LEFT JOIN delivrance d ON a.id = d.accouchement_id
LEFT JOIN nouveau_ne n ON a.id = n.accouchement_id
GROUP BY a.id, d.id;

-- Commentaires sur les tables
COMMENT ON TABLE accouchement IS 'Table principale pour enregistrer les accouchements';
COMMENT ON TABLE delivrance IS 'Table pour la délivrance (placenta, membranes, périnée)';
COMMENT ON TABLE examen_placenta IS 'Table pour l''examen détaillé du placenta';
COMMENT ON TABLE nouveau_ne IS 'Table pour l''état du nouveau-né à la naissance avec scores Apgar';
COMMENT ON TABLE soins_immediats IS 'Table pour les soins immédiats au nouveau-né';
COMMENT ON TABLE carte_infantile IS 'Table pour le carnet de naissance et vaccinations initiales';
COMMENT ON TABLE sensibilisation_mere IS 'Table pour la sensibilisation de la mère post-accouchement';
COMMENT ON TABLE reference_transfert IS 'Table pour les références et transferts';

COMMENT ON FUNCTION calculer_apgar IS 'Fonction pour calculer le score Apgar total (0-10)';
COMMENT ON FUNCTION auto_calculer_apgar IS 'Trigger pour calculer automatiquement les scores Apgar';
COMMENT ON VIEW vue_resume_accouchements IS 'Vue récapitulative des accouchements avec statistiques';

