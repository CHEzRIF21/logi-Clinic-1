-- Migration: Création de la table dossier_obstetrical
-- Date: 2024-12-20
-- Description: Création de la table pour les dossiers obstétricaux avec tous les champs requis

-- Création de la table principale des dossiers obstétricaux
CREATE TABLE IF NOT EXISTS dossier_obstetrical (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Informations administratives (références au patient)
  -- Ces informations sont stockées dans la table patients mais peuvent être dupliquées ici pour référence rapide
  date_entree DATE NOT NULL DEFAULT CURRENT_DATE,
  date_sortie DATE,
  numero_dossier VARCHAR(50),
  
  -- Section C: Informations sur le conjoint (Procureur)
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
  
  -- Antécédents Obstétricaux
  transfusions_anterieures BOOLEAN DEFAULT false,
  nombre_transfusions INTEGER DEFAULT 0,
  gestite INTEGER DEFAULT 0,
  parite INTEGER DEFAULT 0,
  nombre_avortements INTEGER DEFAULT 0,
  nombre_enfants_vivants INTEGER DEFAULT 0,
  nombre_enfants_decedes INTEGER DEFAULT 0,
  ddr DATE, -- Date des dernières règles
  dpa DATE, -- Date probable d'accouchement (calculée automatiquement)
  
  -- Facteurs de surveillance (cases à cocher)
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
  
  -- Examens complémentaires
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
  hepatite_b VARCHAR(50), -- À partir de 6 mois
  autres_examens TEXT,
  
  -- Section VIH / Syphilis
  vih BOOLEAN DEFAULT false,
  mise_sous_arv BOOLEAN DEFAULT false,
  syphilis BOOLEAN DEFAULT false,
  mise_sous_ctm BOOLEAN DEFAULT false,
  
  -- Statut et métadonnées
  statut VARCHAR(50) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'accouche', 'post_partum', 'clos')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Table pour les grossesses antérieures
CREATE TABLE IF NOT EXISTS grossesses_anterieures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  annee INTEGER,
  evolution VARCHAR(200), -- Évolution de la grossesse
  poids DECIMAL(5,2), -- Poids de l'enfant
  sexe VARCHAR(10) CHECK (sexe IN ('Masculin', 'Féminin', 'Inconnu')),
  etat_enfants VARCHAR(200), -- État des enfants (vivant, décédé, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_dossier_obstetrical_patient_id ON dossier_obstetrical(patient_id);
CREATE INDEX IF NOT EXISTS idx_dossier_obstetrical_date_entree ON dossier_obstetrical(date_entree);
CREATE INDEX IF NOT EXISTS idx_dossier_obstetrical_statut ON dossier_obstetrical(statut);
CREATE INDEX IF NOT EXISTS idx_dossier_obstetrical_ddr ON dossier_obstetrical(ddr);
CREATE INDEX IF NOT EXISTS idx_dossier_obstetrical_dpa ON dossier_obstetrical(dpa);
CREATE INDEX IF NOT EXISTS idx_grossesses_anterieures_dossier_id ON grossesses_anterieures(dossier_obstetrical_id);

-- Fonction pour calculer automatiquement la DPA (Date Probable d'Accouchement)
CREATE OR REPLACE FUNCTION calculate_dpa(ddr DATE)
RETURNS DATE AS $$
BEGIN
    IF ddr IS NULL THEN
        RETURN NULL;
    END IF;
    -- DPA = DDR + 280 jours (40 semaines)
    RETURN ddr + INTERVAL '280 days';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_dossier_obstetrical_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Calcul automatique de la DPA si DDR est modifiée
    IF NEW.ddr IS NOT NULL AND (OLD.ddr IS NULL OR NEW.ddr != OLD.ddr) THEN
        NEW.dpa = calculate_dpa(NEW.ddr);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at et calculer DPA
CREATE TRIGGER update_dossier_obstetrical_updated_at
    BEFORE UPDATE ON dossier_obstetrical
    FOR EACH ROW
    EXECUTE FUNCTION update_dossier_obstetrical_updated_at();

-- Trigger pour calculer DPA à l'insertion
CREATE OR REPLACE FUNCTION set_dpa_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ddr IS NOT NULL AND NEW.dpa IS NULL THEN
        NEW.dpa = calculate_dpa(NEW.ddr);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_dpa_on_insert
    BEFORE INSERT ON dossier_obstetrical
    FOR EACH ROW
    EXECUTE FUNCTION set_dpa_on_insert();

-- Fonction pour détecter les facteurs de risque
CREATE OR REPLACE FUNCTION detecter_facteurs_risque(dossier dossier_obstetrical)
RETURNS TEXT[] AS $$
DECLARE
    facteurs TEXT[] := ARRAY[]::TEXT[];
    age_patient INTEGER;
BEGIN
    -- Calculer l'âge du patient
    SELECT EXTRACT(YEAR FROM AGE(p.date_naissance)) INTO age_patient
    FROM patients p WHERE p.id = dossier.patient_id;
    
    -- Vérifier les facteurs de risque
    IF age_patient < 16 THEN
        facteurs := array_append(facteurs, 'Âge < 16 ans');
    END IF;
    
    IF age_patient > 35 THEN
        facteurs := array_append(facteurs, 'Âge > 35 ans');
    END IF;
    
    IF dossier.taille_inferieure_150 THEN
        facteurs := array_append(facteurs, 'Taille < 1,50 m');
    END IF;
    
    IF dossier.parite_superieure_6 THEN
        facteurs := array_append(facteurs, 'Parité ≥ 6');
    END IF;
    
    IF dossier.cesarienne_dernier_accouchement THEN
        facteurs := array_append(facteurs, 'Césarienne au dernier accouchement');
    END IF;
    
    IF dossier.mort_ne_dernier_accouchement THEN
        facteurs := array_append(facteurs, 'Mort-né au dernier accouchement');
    END IF;
    
    IF dossier.drepanocytose_ss_sc THEN
        facteurs := array_append(facteurs, 'Drépanocytose SS ou SC');
    END IF;
    
    IF dossier.hta_connue THEN
        facteurs := array_append(facteurs, 'HTA connue');
    END IF;
    
    IF dossier.fausses_couches_repetees THEN
        facteurs := array_append(facteurs, 'Fausses couches répétées');
    END IF;
    
    IF dossier.diabete THEN
        facteurs := array_append(facteurs, 'Diabète');
    END IF;
    
    RETURN facteurs;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur la table
COMMENT ON TABLE dossier_obstetrical IS 'Table des dossiers obstétricaux pour le suivi des patientes en maternité';
COMMENT ON TABLE grossesses_anterieures IS 'Table des grossesses antérieures pour chaque dossier obstétrical';
COMMENT ON COLUMN dossier_obstetrical.ddr IS 'Date des dernières règles';
COMMENT ON COLUMN dossier_obstetrical.dpa IS 'Date probable d''accouchement (calculée automatiquement: DDR + 280 jours)';
COMMENT ON FUNCTION calculate_dpa IS 'Fonction pour calculer la date probable d''accouchement à partir de la DDR';
COMMENT ON FUNCTION detecter_facteurs_risque IS 'Fonction pour détecter automatiquement les facteurs de risque d''une grossesse';

-- Politique RLS (Row Level Security) - À activer selon les besoins
-- ALTER TABLE dossier_obstetrical ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE grossesses_anterieures ENABLE ROW LEVEL SECURITY;

