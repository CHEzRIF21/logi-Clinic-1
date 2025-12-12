-- Migration: Laboratoire Phase 3 - Améliorations selon spécifications détaillées
-- Date: 2025-01-XX
-- Description: Ajout des fonctionnalités avancées pour le module Laboratoire

-- 1. Ajout de champs pour la gestion du rejet d'échantillons
ALTER TABLE lab_prelevements 
ADD COLUMN IF NOT EXISTS statut_echantillon VARCHAR(20) CHECK (statut_echantillon IN ('conforme','non_conforme','rejete')) DEFAULT 'conforme',
ADD COLUMN IF NOT EXISTS motif_rejet TEXT,
ADD COLUMN IF NOT EXISTS date_rejet TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS agent_rejet VARCHAR(150);

-- 2. Amélioration de la table analyses pour valeurs de référence et historique
ALTER TABLE lab_analyses
ADD COLUMN IF NOT EXISTS valeur_min_reference DECIMAL(12,4),
ADD COLUMN IF NOT EXISTS valeur_max_reference DECIMAL(12,4),
ADD COLUMN IF NOT EXISTS est_pathologique BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resultat_precedent_id UUID REFERENCES lab_analyses(id),
ADD COLUMN IF NOT EXISTS valeur_precedente_numerique DECIMAL(12,4),
ADD COLUMN IF NOT EXISTS valeur_precedente_qualitative VARCHAR(50),
ADD COLUMN IF NOT EXISTS date_resultat_precedent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS evolution VARCHAR(20) CHECK (evolution IN ('amelioration','stabilite','aggravation','nouveau'));

-- 3. Table pour les modèles d'examens et leurs paramètres
CREATE TABLE IF NOT EXISTS lab_modeles_examens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_examen VARCHAR(50) UNIQUE NOT NULL, -- ex: NFS, GLYCEMIE, VIH
  libelle_examen VARCHAR(150) NOT NULL,
  type_examen VARCHAR(50) NOT NULL, -- 'hematologie', 'biochimie', 'serologie', 'parasitologie', etc.
  parametres JSONB NOT NULL, -- Structure: [{"nom": "Hémoglobine", "unite": "g/dL", "type": "quantitatif", "ref_min": 12, "ref_max": 16, "ref_selon_age_sexe": true}, ...]
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table pour les valeurs de référence selon âge et sexe
CREATE TABLE IF NOT EXISTS lab_valeurs_reference (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parametre VARCHAR(150) NOT NULL,
  sexe VARCHAR(20) CHECK (sexe IN ('Masculin', 'Féminin', 'Tous')),
  age_min INTEGER, -- en années, NULL = pas de limite min
  age_max INTEGER, -- en années, NULL = pas de limite max
  valeur_min DECIMAL(12,4),
  valeur_max DECIMAL(12,4),
  unite VARCHAR(50),
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table pour la gestion des stocks de réactifs (liée au module stock existant)
-- Note: Si la table medicaments n'existe pas, on crée la table sans la contrainte de clé étrangère
CREATE TABLE IF NOT EXISTS lab_stocks_reactifs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medicament_id UUID, -- Référence au médicament/réactif dans le stock (contrainte ajoutée conditionnellement)
  code_reactif VARCHAR(100) UNIQUE NOT NULL,
  libelle VARCHAR(200) NOT NULL,
  unite VARCHAR(50) NOT NULL,
  quantite_disponible DECIMAL(12,4) DEFAULT 0,
  seuil_alerte DECIMAL(12,4) DEFAULT 0,
  date_peremption TIMESTAMP WITH TIME ZONE,
  fournisseur VARCHAR(150),
  numero_lot VARCHAR(100),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter la contrainte de clé étrangère seulement si la table medicaments existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medicaments') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'lab_stocks_reactifs_medicament_id_fkey'
    ) THEN
      ALTER TABLE lab_stocks_reactifs 
      ADD CONSTRAINT lab_stocks_reactifs_medicament_id_fkey 
      FOREIGN KEY (medicament_id) REFERENCES medicaments(id);
    END IF;
  END IF;
END $$;

-- 6. Table pour le suivi de consommation des réactifs par analyse
CREATE TABLE IF NOT EXISTS lab_consommations_reactifs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analyse_id UUID NOT NULL REFERENCES lab_analyses(id) ON DELETE CASCADE,
  reactif_id UUID NOT NULL REFERENCES lab_stocks_reactifs(id),
  quantite_utilisee DECIMAL(12,4) NOT NULL,
  date_utilisation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  technicien VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table pour les alertes de laboratoire (résultats critiques, appareils en défaut)
CREATE TABLE IF NOT EXISTS lab_alertes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_alerte VARCHAR(50) NOT NULL CHECK (type_alerte IN ('resultat_critique','appareil_defaut','stock_critique','peremption','autre')),
  priorite VARCHAR(20) CHECK (priorite IN ('faible','moyenne','haute','critique')) DEFAULT 'moyenne',
  titre VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  analyse_id UUID REFERENCES lab_analyses(id),
  reactif_id UUID REFERENCES lab_stocks_reactifs(id),
  appareil VARCHAR(100), -- Nom de l'appareil en défaut
  statut VARCHAR(20) CHECK (statut IN ('nouvelle','en_cours','resolue','ignoree')) DEFAULT 'nouvelle',
  date_alerte TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_resolution TIMESTAMP WITH TIME ZONE,
  resolu_par VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_lab_prelevements_statut ON lab_prelevements(statut_echantillon);
CREATE INDEX IF NOT EXISTS idx_lab_analyses_pathologique ON lab_analyses(est_pathologique);
CREATE INDEX IF NOT EXISTS idx_lab_analyses_resultat_precedent ON lab_analyses(resultat_precedent_id);
CREATE INDEX IF NOT EXISTS idx_lab_modeles_examens_code ON lab_modeles_examens(code_examen);
CREATE INDEX IF NOT EXISTS idx_lab_valeurs_reference_parametre ON lab_valeurs_reference(parametre);
CREATE INDEX IF NOT EXISTS idx_lab_stocks_reactifs_code ON lab_stocks_reactifs(code_reactif);
CREATE INDEX IF NOT EXISTS idx_lab_consommations_analyse ON lab_consommations_reactifs(analyse_id);
CREATE INDEX IF NOT EXISTS idx_lab_alertes_statut ON lab_alertes(statut);
CREATE INDEX IF NOT EXISTS idx_lab_alertes_type ON lab_alertes(type_alerte);
CREATE INDEX IF NOT EXISTS idx_lab_alertes_priorite ON lab_alertes(priorite);

-- S'assurer que la fonction update_updated_at_column existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mise à jour automatique
CREATE TRIGGER update_lab_modeles_examens_updated_at 
  BEFORE UPDATE ON lab_modeles_examens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_valeurs_reference_updated_at 
  BEFORE UPDATE ON lab_valeurs_reference 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_stocks_reactifs_updated_at 
  BEFORE UPDATE ON lab_stocks_reactifs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_alertes_updated_at 
  BEFORE UPDATE ON lab_alertes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer automatiquement si un résultat est pathologique
CREATE OR REPLACE FUNCTION check_resultat_pathologique()
RETURNS TRIGGER AS $$
BEGIN
  -- Si résultat quantitatif
  IF NEW.type_resultat = 'quantitatif' AND NEW.valeur_numerique IS NOT NULL THEN
    IF (NEW.valeur_min_reference IS NOT NULL AND NEW.valeur_numerique < NEW.valeur_min_reference) OR
       (NEW.valeur_max_reference IS NOT NULL AND NEW.valeur_numerique > NEW.valeur_max_reference) THEN
      NEW.est_pathologique := true;
    ELSE
      NEW.est_pathologique := false;
    END IF;
  END IF;
  
  -- Si résultat qualitatif (ex: Positif pour VIH/Paludisme)
  IF NEW.type_resultat = 'qualitatif' AND NEW.valeur_qualitative IS NOT NULL THEN
    IF UPPER(NEW.valeur_qualitative) LIKE '%POSITIF%' OR UPPER(NEW.valeur_qualitative) LIKE '%POSITIVE%' THEN
      NEW.est_pathologique := true;
    ELSE
      NEW.est_pathologique := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_pathologique
  BEFORE INSERT OR UPDATE ON lab_analyses
  FOR EACH ROW
  EXECUTE FUNCTION check_resultat_pathologique();

-- Fonction pour créer une alerte automatique en cas de résultat critique
CREATE OR REPLACE FUNCTION create_alerte_resultat_critique()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.est_pathologique = true AND NEW.statut = 'termine' THEN
    INSERT INTO lab_alertes (type_alerte, priorite, titre, message, analyse_id, statut)
    VALUES (
      'resultat_critique',
      'critique',
      'Résultat critique détecté',
      'Le paramètre ' || NEW.parametre || ' présente une valeur pathologique: ' || 
      COALESCE(NEW.valeur_numerique::text, NEW.valeur_qualitative) || 
      COALESCE(' ' || NEW.unite, ''),
      NEW.id,
      'nouvelle'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_alerte_resultat_critique
  AFTER INSERT OR UPDATE ON lab_analyses
  FOR EACH ROW
  WHEN (NEW.est_pathologique = true AND NEW.statut = 'termine')
  EXECUTE FUNCTION create_alerte_resultat_critique();

-- Données de référence initiales pour les valeurs normales (exemples)
-- Utilisation de INSERT ... ON CONFLICT uniquement si une contrainte unique existe
-- Sinon, vérification avant insertion
DO $$
BEGIN
  -- Hémoglobine
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE parametre = 'Hémoglobine' AND sexe = 'Masculin' AND age_min = 18) THEN
    INSERT INTO lab_valeurs_reference (parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire)
    VALUES ('Hémoglobine', 'Masculin', 18, NULL, 13.0, 17.0, 'g/dL', 'Adulte');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE parametre = 'Hémoglobine' AND sexe = 'Féminin' AND age_min = 18) THEN
    INSERT INTO lab_valeurs_reference (parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire)
    VALUES ('Hémoglobine', 'Féminin', 18, NULL, 12.0, 15.0, 'g/dL', 'Adulte');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE parametre = 'Hémoglobine' AND sexe = 'Tous' AND age_min = 0) THEN
    INSERT INTO lab_valeurs_reference (parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire)
    VALUES ('Hémoglobine', 'Tous', 0, 2, 10.0, 13.0, 'g/dL', 'Nourrisson');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE parametre = 'Hémoglobine' AND sexe = 'Tous' AND age_min = 2) THEN
    INSERT INTO lab_valeurs_reference (parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire)
    VALUES ('Hémoglobine', 'Tous', 2, 12, 11.0, 13.5, 'g/dL', 'Enfant');
  END IF;
  
  -- Glycémie
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE parametre = 'Glycémie' AND sexe = 'Tous' AND commentaire = 'À jeun') THEN
    INSERT INTO lab_valeurs_reference (parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire)
    VALUES ('Glycémie', 'Tous', NULL, NULL, 0.70, 1.10, 'g/L', 'À jeun');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE parametre = 'Glycémie' AND sexe = 'Tous' AND commentaire = 'Post-prandiale') THEN
    INSERT INTO lab_valeurs_reference (parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire)
    VALUES ('Glycémie', 'Tous', NULL, NULL, 1.40, 2.00, 'g/L', 'Post-prandiale');
  END IF;
  
  -- Leucocytes
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE parametre = 'Leucocytes' AND sexe = 'Tous' AND age_min IS NULL AND commentaire = 'Adulte') THEN
    INSERT INTO lab_valeurs_reference (parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire)
    VALUES ('Leucocytes', 'Tous', NULL, NULL, 4000, 10000, '/mm³', 'Adulte');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE parametre = 'Leucocytes' AND sexe = 'Tous' AND age_min = 0) THEN
    INSERT INTO lab_valeurs_reference (parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire)
    VALUES ('Leucocytes', 'Tous', 0, 2, 6000, 17500, '/mm³', 'Nourrisson');
  END IF;
  
  -- Plaquettes
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE parametre = 'Plaquettes' AND sexe = 'Tous' AND age_min IS NULL) THEN
    INSERT INTO lab_valeurs_reference (parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire)
    VALUES ('Plaquettes', 'Tous', NULL, NULL, 150000, 400000, '/mm³', 'Adulte');
  END IF;
  
  -- Créatinine
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE parametre = 'Créatinine' AND sexe = 'Masculin' AND age_min IS NULL) THEN
    INSERT INTO lab_valeurs_reference (parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire)
    VALUES ('Créatinine', 'Masculin', NULL, NULL, 0.7, 1.2, 'mg/dL', 'Adulte');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE parametre = 'Créatinine' AND sexe = 'Féminin' AND age_min IS NULL) THEN
    INSERT INTO lab_valeurs_reference (parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire)
    VALUES ('Créatinine', 'Féminin', NULL, NULL, 0.5, 1.0, 'mg/dL', 'Adulte');
  END IF;
END $$;

-- Données de référence pour les modèles d'examens
INSERT INTO lab_modeles_examens (code_examen, libelle_examen, type_examen, parametres) VALUES
('NFS', 'Numération Formule Sanguine', 'hematologie', '[
  {"nom": "Hémoglobine", "unite": "g/dL", "type": "quantitatif", "ref_min": 12, "ref_max": 16, "ref_selon_age_sexe": true},
  {"nom": "Leucocytes", "unite": "/mm³", "type": "quantitatif", "ref_min": 4000, "ref_max": 10000, "ref_selon_age_sexe": false},
  {"nom": "Plaquettes", "unite": "/mm³", "type": "quantitatif", "ref_min": 150000, "ref_max": 400000, "ref_selon_age_sexe": false},
  {"nom": "Hématocrite", "unite": "%", "type": "quantitatif", "ref_min": 36, "ref_max": 48, "ref_selon_age_sexe": true}
]'::jsonb),
('GLYCEMIE', 'Glycémie', 'biochimie', '[
  {"nom": "Glycémie", "unite": "g/L", "type": "quantitatif", "ref_min": 0.70, "ref_max": 1.10, "ref_selon_age_sexe": false, "condition": "À jeun"}
]'::jsonb),
('VIH', 'Test VIH', 'serologie', '[
  {"nom": "VIH", "unite": "", "type": "qualitatif", "valeurs_possibles": ["Positif", "Négatif"], "ref_selon_age_sexe": false}
]'::jsonb),
('PALUDISME', 'Test Paludisme (RDT)', 'parasitologie', '[
  {"nom": "Paludisme", "unite": "", "type": "qualitatif", "valeurs_possibles": ["Positif", "Négatif"], "ref_selon_age_sexe": false}
]'::jsonb)
ON CONFLICT (code_examen) DO NOTHING;

COMMENT ON TABLE lab_prelevements IS 'Prélèvements avec gestion du rejet d''échantillons';
COMMENT ON TABLE lab_analyses IS 'Analyses avec valeurs de référence et historique (Delta Check)';
COMMENT ON TABLE lab_modeles_examens IS 'Modèles d''examens avec leurs paramètres prédéfinis';
COMMENT ON TABLE lab_valeurs_reference IS 'Valeurs de référence selon âge et sexe';
COMMENT ON TABLE lab_stocks_reactifs IS 'Gestion des stocks de réactifs de laboratoire';
COMMENT ON TABLE lab_consommations_reactifs IS 'Suivi de consommation des réactifs par analyse';
COMMENT ON TABLE lab_alertes IS 'Alertes du laboratoire (résultats critiques, appareils, stocks)';

