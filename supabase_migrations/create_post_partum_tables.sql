-- Migration: Création des tables pour la SURVEILLANCE POST-PARTUM IMMÉDIATE
-- Date: 2024-12-20
-- Description: Tables pour digitaliser la surveillance post-partum (2 heures après accouchement)

-- Table principale pour la surveillance post-partum
CREATE TABLE IF NOT EXISTS surveillance_post_partum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accouchement_id UUID NOT NULL REFERENCES accouchement(id) ON DELETE CASCADE,
  
  -- Informations générales
  date_debut_surveillance TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  date_fin_surveillance TIMESTAMP WITH TIME ZONE,
  duree_surveillance INTEGER DEFAULT 120, -- 2 heures en minutes
  
  -- Statut
  statut VARCHAR(50) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'complication', 'transfere')),
  
  -- Agent responsable
  agent_responsable VARCHAR(200),
  agent_id UUID,
  
  -- Observations générales
  observations TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les observations de surveillance (toutes les 15 minutes)
CREATE TABLE IF NOT EXISTS observation_post_partum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surveillance_post_partum_id UUID NOT NULL REFERENCES surveillance_post_partum(id) ON DELETE CASCADE,
  
  -- Horodatage
  heure_observation TIME NOT NULL,
  minute_observation INTEGER CHECK (minute_observation IN (0, 15, 30, 45)), -- 0, 15, 30, 45 minutes
  timestamp_observation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Paramètres vitaux
  temperature DECIMAL(4,2), -- en °C
  tension_arterielle_systolique INTEGER, -- mmHg
  tension_arterielle_diastolique INTEGER, -- mmHg
  pouls INTEGER, -- battements/min
  respiration INTEGER, -- cycles/min
  
  -- Paramètres obstétricaux
  contraction_uterine VARCHAR(50) CHECK (contraction_uterine IN ('Présente', 'Absente', 'Faible', 'Normale', 'Forte')),
  saignement_qualite VARCHAR(50) CHECK (saignement_qualite IN ('Normal', 'Abondant', 'Très abondant', 'Absent')),
  saignement_quantite DECIMAL(6,2), -- en mL
  douleurs VARCHAR(50) CHECK (douleurs IN ('Absentes', 'Légères', 'Modérées', 'Sévères')),
  oedemes BOOLEAN DEFAULT false,
  
  -- Examens physiques complémentaires
  etat_perinee VARCHAR(50) CHECK (etat_perinee IN ('Normal', 'Épisiotomie', 'Déchirure', 'Hématome', 'Infection')),
  plaie_perinee VARCHAR(200), -- Description de la plaie
  saignement_perineal BOOLEAN DEFAULT false,
  etat_general VARCHAR(50) CHECK (etat_general IN ('Bon', 'Moyen', 'Altéré', 'Critique')),
  mictions VARCHAR(50) CHECK (mictions IN ('Normales', 'Difficiles', 'Absentes', 'Incontinence')),
  diurese DECIMAL(6,2), -- en mL
  conscience VARCHAR(50) CHECK (conscience IN ('Normale', 'Confuse', 'Somnolente', 'Coma')),
  
  -- Évaluation du risque
  risque_hpp BOOLEAN DEFAULT false, -- Hémorragie post-partum
  risque_retention_placentaire BOOLEAN DEFAULT false,
  risque_infection BOOLEAN DEFAULT false,
  risque_hypertension BOOLEAN DEFAULT false,
  risque_anemie_severe BOOLEAN DEFAULT false,
  
  -- Alertes générées automatiquement
  alerte_hpp BOOLEAN DEFAULT false,
  alerte_tachycardie BOOLEAN DEFAULT false,
  alerte_hypotension BOOLEAN DEFAULT false,
  alerte_hypertension BOOLEAN DEFAULT false,
  alerte_hyperthermie BOOLEAN DEFAULT false,
  alerte_hypothermie BOOLEAN DEFAULT false,
  
  -- Notes
  notes TEXT,
  
  -- Agent
  agent_observation VARCHAR(200),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les traitements administrés post-partum
CREATE TABLE IF NOT EXISTS traitement_post_partum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surveillance_post_partum_id UUID NOT NULL REFERENCES surveillance_post_partum(id) ON DELETE CASCADE,
  
  -- Type de traitement
  type_traitement VARCHAR(100) NOT NULL CHECK (type_traitement IN (
    'Ocytocine',
    'Antibiotique',
    'Anti-inflammatoire',
    'Antalgique',
    'Fer',
    'Acide folique',
    'Solution IV',
    'Misoprostol',
    'Autre'
  )),
  
  -- Détails du traitement
  medicament VARCHAR(200),
  dose VARCHAR(100) NOT NULL,
  voie_administration VARCHAR(50) CHECK (voie_administration IN ('IV', 'IM', 'Orale', 'Rectale', 'Autre')),
  heure_administration TIME NOT NULL,
  date_administration DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Posologie
  posologie TEXT,
  duree VARCHAR(50),
  
  -- Raison de l'administration
  indication TEXT,
  
  -- Agent
  agent_administration VARCHAR(200) NOT NULL,
  agent_id UUID,
  
  -- Réponse au traitement
  reponse_traitement VARCHAR(200),
  effets_secondaires TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les conseils et éducation donnés à la mère
CREATE TABLE IF NOT EXISTS conseils_post_partum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surveillance_post_partum_id UUID NOT NULL REFERENCES surveillance_post_partum(id) ON DELETE CASCADE,
  
  -- Thèmes de conseils
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
  
  -- Autres conseils
  autres_conseils TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour la sortie de la salle de naissance
CREATE TABLE IF NOT EXISTS sortie_salle_naissance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surveillance_post_partum_id UUID NOT NULL REFERENCES surveillance_post_partum(id) ON DELETE CASCADE,
  
  -- Heure de sortie
  heure_sortie TIME NOT NULL,
  date_sortie DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- État de la mère au moment du transfert
  etat_mere VARCHAR(50) CHECK (etat_mere IN ('Stable', 'Stable sous surveillance', 'Instable', 'Critique')),
  etat_detaille TEXT,
  
  -- Destination
  destination VARCHAR(100) CHECK (destination IN ('Maternité', 'Hospitalisation', 'Référence', 'Domicile', 'Autre')),
  service_destination VARCHAR(200),
  chambre VARCHAR(50),
  
  -- Accompagnant
  accompagnant_present BOOLEAN DEFAULT false,
  nom_accompagnant VARCHAR(200),
  
  -- Transport
  transport_utilise VARCHAR(100),
  
  -- Transfert du dossier
  dossier_transfere BOOLEAN DEFAULT false,
  service_receveur VARCHAR(200),
  
  -- Agent responsable
  agent_sortie VARCHAR(200) NOT NULL,
  agent_id UUID,
  
  -- Signature
  signature_agent TEXT, -- Signature numérique
  
  -- Observations
  observations TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les complications post-partum
CREATE TABLE IF NOT EXISTS complication_post_partum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  surveillance_post_partum_id UUID NOT NULL REFERENCES surveillance_post_partum(id) ON DELETE CASCADE,
  
  -- Type de complication
  type_complication VARCHAR(100) NOT NULL CHECK (type_complication IN (
    'Hémorragie post-partum',
    'Rétention placentaire',
    'Infection',
    'Hypertension',
    'Hypotension',
    'Anémie sévère',
    'Choc',
    'Pré-éclampsie post-partum',
    'Autre'
  )),
  
  -- Détails
  description TEXT NOT NULL,
  heure_debut TIME,
  date_debut DATE,
  severite VARCHAR(50) CHECK (severite IN ('Légère', 'Modérée', 'Sévère', 'Critique')),
  
  -- Prise en charge
  prise_en_charge TEXT,
  traitement_applique TEXT,
  
  -- Évolution
  evolution VARCHAR(50) CHECK (evolution IN ('Résolue', 'En cours', 'Aggravée', 'Référence')),
  heure_resolution TIME,
  
  -- Agent
  agent_detection VARCHAR(200),
  agent_prise_en_charge VARCHAR(200),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_surveillance_post_partum_accouchement ON surveillance_post_partum(accouchement_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_post_partum_statut ON surveillance_post_partum(statut);
CREATE INDEX IF NOT EXISTS idx_observation_post_partum_surveillance ON observation_post_partum(surveillance_post_partum_id);
CREATE INDEX IF NOT EXISTS idx_observation_post_partum_timestamp ON observation_post_partum(timestamp_observation);
CREATE INDEX IF NOT EXISTS idx_observation_post_partum_alertes ON observation_post_partum(alerte_hpp, alerte_tachycardie, alerte_hypertension);
CREATE INDEX IF NOT EXISTS idx_traitement_post_partum_surveillance ON traitement_post_partum(surveillance_post_partum_id);
CREATE INDEX IF NOT EXISTS idx_traitement_post_partum_date ON traitement_post_partum(date_administration, heure_administration);
CREATE INDEX IF NOT EXISTS idx_conseils_post_partum_surveillance ON conseils_post_partum(surveillance_post_partum_id);
CREATE INDEX IF NOT EXISTS idx_sortie_salle_naissance_surveillance ON sortie_salle_naissance(surveillance_post_partum_id);
CREATE INDEX IF NOT EXISTS idx_complication_post_partum_surveillance ON complication_post_partum(surveillance_post_partum_id);

-- Triggers pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_post_partum_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_surveillance_post_partum_updated_at
    BEFORE UPDATE ON surveillance_post_partum
    FOR EACH ROW
    EXECUTE FUNCTION update_post_partum_updated_at();

CREATE TRIGGER update_conseils_post_partum_updated_at
    BEFORE UPDATE ON conseils_post_partum
    FOR EACH ROW
    EXECUTE FUNCTION update_post_partum_updated_at();

CREATE TRIGGER update_sortie_salle_naissance_updated_at
    BEFORE UPDATE ON sortie_salle_naissance
    FOR EACH ROW
    EXECUTE FUNCTION update_post_partum_updated_at();

CREATE TRIGGER update_complication_post_partum_updated_at
    BEFORE UPDATE ON complication_post_partum
    FOR EACH ROW
    EXECUTE FUNCTION update_post_partum_updated_at();

-- Fonction pour détecter automatiquement les risques post-partum
CREATE OR REPLACE FUNCTION detecter_risques_post_partum()
RETURNS TRIGGER AS $$
BEGIN
    -- Réinitialiser les alertes
    NEW.alerte_hpp := false;
    NEW.alerte_tachycardie := false;
    NEW.alerte_hypotension := false;
    NEW.alerte_hypertension := false;
    NEW.alerte_hyperthermie := false;
    NEW.alerte_hypothermie := false;
    
    -- Détection HPP (Hémorragie post-partum)
    IF NEW.saignement_quantite > 500 OR NEW.saignement_qualite IN ('Abondant', 'Très abondant') THEN
        NEW.risque_hpp := true;
        NEW.alerte_hpp := true;
    END IF;
    
    -- Détection tachycardie (pouls > 100)
    IF NEW.pouls > 100 THEN
        NEW.alerte_tachycardie := true;
    END IF;
    
    -- Détection hypotension (TA systolique < 90)
    IF NEW.tension_arterielle_systolique < 90 THEN
        NEW.alerte_hypotension := true;
        NEW.risque_hpp := true;
    END IF;
    
    -- Détection hypertension (TA systolique > 140 ou diastolique > 90)
    IF NEW.tension_arterielle_systolique > 140 OR NEW.tension_arterielle_diastolique > 90 THEN
        NEW.alerte_hypertension := true;
        NEW.risque_hypertension := true;
    END IF;
    
    -- Détection hyperthermie (température > 38°C)
    IF NEW.temperature > 38.0 THEN
        NEW.alerte_hyperthermie := true;
        NEW.risque_infection := true;
    END IF;
    
    -- Détection hypothermie (température < 36°C)
    IF NEW.temperature < 36.0 THEN
        NEW.alerte_hypothermie := true;
    END IF;
    
    -- Détection rétention placentaire (si saignement abondant sans contraction)
    IF NEW.saignement_qualite IN ('Abondant', 'Très abondant') AND 
       (NEW.contraction_uterine = 'Absente' OR NEW.contraction_uterine = 'Faible') THEN
        NEW.risque_retention_placentaire := true;
    END IF;
    
    -- Détection anémie sévère (si saignement > 1000 mL)
    IF NEW.saignement_quantite > 1000 THEN
        NEW.risque_anemie_severe := true;
    END IF;
    
    -- Détection altération de conscience (suspicion pré-éclampsie/choc)
    IF NEW.conscience IN ('Confuse', 'Somnolente', 'Coma') THEN
        NEW.risque_hypertension := true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour détecter automatiquement les risques
CREATE TRIGGER detecter_risques_post_partum_trigger
    BEFORE INSERT OR UPDATE ON observation_post_partum
    FOR EACH ROW
    EXECUTE FUNCTION detecter_risques_post_partum();

-- Fonction pour générer automatiquement les observations toutes les 15 minutes
CREATE OR REPLACE FUNCTION generer_prochaines_observations(surveillance_id UUID, duree_minutes INTEGER DEFAULT 120)
RETURNS VOID AS $$
DECLARE
    debut TIMESTAMP WITH TIME ZONE;
    i INTEGER;
    minute_obs INTEGER;
    heure_obs TIME;
BEGIN
    -- Récupérer l'heure de début de surveillance
    SELECT date_debut_surveillance INTO debut
    FROM surveillance_post_partum
    WHERE id = surveillance_id;
    
    -- Générer les observations toutes les 15 minutes pendant la durée spécifiée
    FOR i IN 0..(duree_minutes / 15 - 1) LOOP
        minute_obs := (i * 15) % 60;
        heure_obs := (debut + (i * 15 || ' minutes')::INTERVAL)::TIME;
        
        -- Insérer l'observation si elle n'existe pas déjà
        INSERT INTO observation_post_partum (
            surveillance_post_partum_id,
            heure_observation,
            minute_observation,
            timestamp_observation
        )
        SELECT 
            surveillance_id,
            heure_obs,
            minute_obs,
            debut + (i * 15 || ' minutes')::INTERVAL
        WHERE NOT EXISTS (
            SELECT 1 FROM observation_post_partum
            WHERE surveillance_post_partum_id = surveillance_id
            AND heure_observation = heure_obs
            AND minute_observation = minute_obs
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Vue récapitulative de la surveillance post-partum
CREATE OR REPLACE VIEW vue_resume_post_partum AS
SELECT 
    s.id as surveillance_id,
    s.accouchement_id,
    s.date_debut_surveillance,
    s.date_fin_surveillance,
    s.statut,
    COUNT(DISTINCT o.id) as nombre_observations,
    COUNT(DISTINCT CASE WHEN o.alerte_hpp = true THEN o.id END) as alertes_hpp,
    COUNT(DISTINCT CASE WHEN o.alerte_tachycardie = true THEN o.id END) as alertes_tachycardie,
    COUNT(DISTINCT CASE WHEN o.alerte_hypertension = true THEN o.id END) as alertes_hypertension,
    COUNT(DISTINCT CASE WHEN o.alerte_hyperthermie = true THEN o.id END) as alertes_hyperthermie,
    COUNT(DISTINCT t.id) as nombre_traitements,
    COUNT(DISTINCT c.id) as nombre_complications,
    MAX(o.timestamp_observation) as derniere_observation
FROM surveillance_post_partum s
LEFT JOIN observation_post_partum o ON s.id = o.surveillance_post_partum_id
LEFT JOIN traitement_post_partum t ON s.id = t.surveillance_post_partum_id
LEFT JOIN complication_post_partum c ON s.id = c.surveillance_post_partum_id
GROUP BY s.id, s.accouchement_id, s.date_debut_surveillance, s.date_fin_surveillance, s.statut;

-- Commentaires sur les tables
COMMENT ON TABLE surveillance_post_partum IS 'Table principale pour la surveillance post-partum immédiate (2 heures)';
COMMENT ON TABLE observation_post_partum IS 'Table pour les observations de surveillance toutes les 15 minutes avec détection automatique des risques';
COMMENT ON TABLE traitement_post_partum IS 'Table pour les traitements administrés pendant la surveillance post-partum';
COMMENT ON TABLE conseils_post_partum IS 'Table pour les conseils et éducation donnés à la mère';
COMMENT ON TABLE sortie_salle_naissance IS 'Table pour la sortie de la salle de naissance et transfert';
COMMENT ON TABLE complication_post_partum IS 'Table pour les complications détectées pendant la surveillance';

COMMENT ON FUNCTION detecter_risques_post_partum IS 'Fonction pour détecter automatiquement les risques post-partum (HPP, tachycardie, hypertension, etc.)';
COMMENT ON FUNCTION generer_prochaines_observations IS 'Fonction pour générer automatiquement les créneaux d''observation toutes les 15 minutes';
COMMENT ON VIEW vue_resume_post_partum IS 'Vue récapitulative de la surveillance post-partum avec statistiques';

