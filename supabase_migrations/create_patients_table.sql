-- Migration: Création de la table des patients
-- Date: 2024-12-20
-- Description: Création de la table patients avec toutes les colonnes nécessaires

-- Création de la table des patients
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifiant VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  sexe VARCHAR(20) CHECK (sexe IN ('Masculin', 'Féminin')) NOT NULL,
  date_naissance DATE NOT NULL,
  lieu_naissance VARCHAR(100),
  nationalite VARCHAR(50) DEFAULT 'Ivoirien',
  adresse TEXT,
  telephone VARCHAR(20),
  telephone_proche VARCHAR(20),
  personne_urgence VARCHAR(100),
  profession VARCHAR(100),
  situation_matrimoniale VARCHAR(20) CHECK (situation_matrimoniale IN ('Célibataire', 'Marié(e)', 'Veuf(ve)', 'Divorcé(e)')),
  couverture_sante VARCHAR(20) CHECK (couverture_sante IN ('RAMU', 'CNSS', 'Gratuité', 'Aucun')) DEFAULT 'Aucun',
  groupe_sanguin VARCHAR(10) CHECK (groupe_sanguin IN ('A', 'B', 'AB', 'O', 'Inconnu')) DEFAULT 'Inconnu',
  allergies TEXT,
  maladies_chroniques TEXT,
  statut_vaccinal VARCHAR(20) CHECK (statut_vaccinal IN ('À jour', 'Incomplet', 'Inconnu')) DEFAULT 'Inconnu',
  antecedents_medicaux TEXT,
  prise_medicaments_reguliers BOOLEAN DEFAULT false,
  medicaments_reguliers TEXT,
  date_enregistrement TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  service_initial VARCHAR(50) CHECK (service_initial IN ('Médecine générale', 'Maternité', 'Pédiatrie', 'Autres')) DEFAULT 'Médecine générale',
  statut VARCHAR(20) CHECK (statut IN ('Nouveau', 'Connu')) DEFAULT 'Nouveau',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_patients_nom_prenom ON patients(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_patients_identifiant ON patients(identifiant);
CREATE INDEX IF NOT EXISTS idx_patients_telephone ON patients(telephone);
CREATE INDEX IF NOT EXISTS idx_patients_date_naissance ON patients(date_naissance);
CREATE INDEX IF NOT EXISTS idx_patients_service_initial ON patients(service_initial);
CREATE INDEX IF NOT EXISTS idx_patients_statut ON patients(statut);
CREATE INDEX IF NOT EXISTS idx_patients_sexe ON patients(sexe);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer l'âge d'un patient
CREATE OR REPLACE FUNCTION calculate_patient_age(date_naissance DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(date_naissance));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Vue pour inclure l'âge calculé dynamiquement
CREATE OR REPLACE VIEW patients_with_age AS
SELECT 
    *,
    calculate_patient_age(date_naissance) as age
FROM patients;

-- Insertion de données de démonstration
INSERT INTO patients (identifiant, nom, prenom, sexe, date_naissance, lieu_naissance, adresse, telephone, personne_urgence, couverture_sante, groupe_sanguin, statut_vaccinal, service_initial, statut) VALUES
('PAT001', 'Dupont', 'Jean', 'Masculin', '1985-03-15', 'Abidjan', '123 Rue de la Paix, Abidjan', '+2250701234567', 'Marie Dupont', 'CNSS', 'A', 'À jour', 'Médecine générale', 'Connu'),
('PAT002', 'Martin', 'Marie', 'Féminin', '1990-07-22', 'Bouaké', '456 Avenue des Fleurs, Bouaké', '+2250702345678', 'Pierre Martin', 'RAMU', 'O', 'Incomplet', 'Maternité', 'Nouveau'),
('PAT003', 'Bernard', 'Pierre', 'Masculin', '1978-11-08', 'Yamoussoukro', '789 Boulevard Central, Yamoussoukro', '+2250703456789', 'Sophie Bernard', 'Gratuité', 'B', 'À jour', 'Médecine générale', 'Connu'),
('PAT004', 'Petit', 'Sophie', 'Féminin', '1995-04-12', 'Abidjan', '321 Rue du Commerce, Abidjan', '+2250704567890', 'Jean Petit', 'CNSS', 'AB', 'Inconnu', 'Pédiatrie', 'Nouveau'),
('PAT005', 'Robert', 'Michel', 'Masculin', '1982-09-25', 'San-Pédro', '654 Avenue de la Mer, San-Pédro', '+2250705678901', 'Anne Robert', 'Aucun', 'O', 'Incomplet', 'Médecine générale', 'Connu'),
('PAT006', 'Leroy', 'Isabelle', 'Féminin', '1988-12-03', 'Abidjan', '987 Rue des Écoles, Abidjan', '+2250706789012', 'Marc Leroy', 'CNSS', 'A', 'À jour', 'Maternité', 'Connu'),
('PAT007', 'Moreau', 'Thomas', 'Masculin', '1992-06-18', 'Bouaké', '147 Avenue du Marché, Bouaké', '+2250707890123', 'Julie Moreau', 'RAMU', 'B', 'Incomplet', 'Médecine générale', 'Nouveau'),
('PAT008', 'Simon', 'Camille', 'Féminin', '1987-01-30', 'Yamoussoukro', '258 Boulevard de la Paix, Yamoussoukro', '+2250708901234', 'Paul Simon', 'Gratuité', 'O', 'À jour', 'Pédiatrie', 'Connu'),
('PAT009', 'Michel', 'Antoine', 'Masculin', '1993-08-14', 'Abidjan', '369 Rue des Jardins, Abidjan', '+2250709012345', 'Claire Michel', 'CNSS', 'AB', 'Incomplet', 'Médecine générale', 'Nouveau'),
('PAT010', 'Garcia', 'Emma', 'Féminin', '1986-05-07', 'San-Pédro', '741 Avenue du Port, San-Pédro', '+2250700123456', 'Lucas Garcia', 'Aucun', 'A', 'Inconnu', 'Maternité', 'Connu');

-- Politique RLS (Row Level Security) - Activer si nécessaire
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre l'accès public (à modifier selon vos besoins de sécurité)
-- CREATE POLICY "Allow public access to patients" ON patients FOR ALL USING (true);

-- Commentaires sur la table
COMMENT ON TABLE patients IS 'Table des patients de la clinique';
COMMENT ON COLUMN patients.identifiant IS 'Identifiant unique du patient (ex: PAT001)';
COMMENT ON COLUMN patients.nom IS 'Nom de famille du patient';
COMMENT ON COLUMN patients.prenom IS 'Prénom du patient';
COMMENT ON COLUMN patients.sexe IS 'Sexe du patient (Masculin ou Féminin)';
COMMENT ON COLUMN patients.date_naissance IS 'Date de naissance du patient';
COMMENT ON FUNCTION calculate_patient_age IS 'Fonction pour calculer l''âge d''un patient à partir de sa date de naissance';
COMMENT ON VIEW patients_with_age IS 'Vue des patients incluant l''âge calculé dynamiquement';
COMMENT ON COLUMN patients.lieu_naissance IS 'Lieu de naissance du patient';
COMMENT ON COLUMN patients.nationalite IS 'Nationalité du patient';
COMMENT ON COLUMN patients.adresse IS 'Adresse complète du patient';
COMMENT ON COLUMN patients.telephone IS 'Numéro de téléphone principal du patient';
COMMENT ON COLUMN patients.telephone_proche IS 'Numéro de téléphone d''un proche';
COMMENT ON COLUMN patients.personne_urgence IS 'Nom de la personne à contacter en cas d''urgence';
COMMENT ON COLUMN patients.profession IS 'Profession du patient';
COMMENT ON COLUMN patients.situation_matrimoniale IS 'Situation matrimoniale du patient';
COMMENT ON COLUMN patients.couverture_sante IS 'Type de couverture santé du patient';
COMMENT ON COLUMN patients.groupe_sanguin IS 'Groupe sanguin du patient';
COMMENT ON COLUMN patients.allergies IS 'Allergies connues du patient';
COMMENT ON COLUMN patients.maladies_chroniques IS 'Maladies chroniques du patient';
COMMENT ON COLUMN patients.statut_vaccinal IS 'Statut vaccinal du patient';
COMMENT ON COLUMN patients.antecedents_medicaux IS 'Antécédents médicaux du patient';
COMMENT ON COLUMN patients.prise_medicaments_reguliers IS 'Indique si le patient prend des médicaments régulièrement';
COMMENT ON COLUMN patients.medicaments_reguliers IS 'Liste des médicaments pris régulièrement';
COMMENT ON COLUMN patients.date_enregistrement IS 'Date d''enregistrement du patient dans le système';
COMMENT ON COLUMN patients.service_initial IS 'Service où le patient a été initialement enregistré';
COMMENT ON COLUMN patients.statut IS 'Statut du patient (Nouveau ou Connu)';
COMMENT ON COLUMN patients.notes IS 'Notes additionnelles sur le patient';
COMMENT ON COLUMN patients.created_at IS 'Date de création de l''enregistrement';
COMMENT ON COLUMN patients.updated_at IS 'Date de dernière modification de l''enregistrement';
