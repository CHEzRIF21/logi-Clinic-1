-- Migration: Création des tables pour le module CPN (Consultation Prénatale)
-- Date: 2024-12-20
-- Description: Tables pour digitaliser la fiche de suivi maternel

-- Table pour les droits fondamentaux sensibilisés
CREATE TABLE IF NOT EXISTS droits_fondamentaux (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  droit_confidentialite BOOLEAN DEFAULT false,
  date_confidentialite DATE,
  droit_dignite BOOLEAN DEFAULT false,
  date_dignite DATE,
  droit_choix BOOLEAN DEFAULT false,
  date_choix DATE,
  droit_securite BOOLEAN DEFAULT false,
  date_securite DATE,
  droit_information BOOLEAN DEFAULT false,
  date_information DATE,
  droit_continuite_soins BOOLEAN DEFAULT false,
  date_continuite_soins DATE,
  autres_droits TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour la vaccination maternelle
CREATE TABLE IF NOT EXISTS vaccination_maternelle (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  vat1_date DATE,
  vat2_date DATE,
  vat3_date DATE,
  vat4_date DATE,
  vat5_date DATE,
  prochaine_dose VARCHAR(10),
  date_prochaine_dose DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour le plan d'accouchement
CREATE TABLE IF NOT EXISTS plan_accouchement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  acceptation_accompagnant BOOLEAN DEFAULT false,
  nom_accompagnant VARCHAR(200),
  prevision_transport TEXT,
  prevision_communication TEXT,
  lieu_accouchement_prevu VARCHAR(200),
  niveau_preparation_menage VARCHAR(50) CHECK (niveau_preparation_menage IN ('Faible', 'Moyen', 'Bon', 'Excellent')),
  evaluation_risques TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les soins promotionnels
CREATE TABLE IF NOT EXISTS soins_promotionnels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  
  -- Informations données
  info_vih_ptme BOOLEAN DEFAULT false,
  date_info_vih_ptme DATE,
  info_reference_cpn BOOLEAN DEFAULT false,
  date_info_reference_cpn DATE,
  info_paludisme BOOLEAN DEFAULT false,
  date_info_paludisme DATE,
  info_nutrition BOOLEAN DEFAULT false,
  date_info_nutrition DATE,
  info_espacement_naissances BOOLEAN DEFAULT false,
  date_info_espacement_naissances DATE,
  
  -- Fournitures distribuées
  moustiquaire BOOLEAN DEFAULT false,
  date_moustiquaire DATE,
  quantite_moustiquaire INTEGER DEFAULT 0,
  preservatifs BOOLEAN DEFAULT false,
  date_preservatifs DATE,
  quantite_preservatifs INTEGER DEFAULT 0,
  fer_acide_folique BOOLEAN DEFAULT false,
  date_fer_acide_folique DATE,
  quantite_fer_acide_folique INTEGER DEFAULT 0,
  deparasitage BOOLEAN DEFAULT false,
  date_deparasitage DATE,
  autres_fournitures TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table principale pour les consultations prénatales (CPN)
CREATE TABLE IF NOT EXISTS consultation_prenatale (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_obstetrical_id UUID NOT NULL REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  
  -- Identification de la consultation
  numero_cpn INTEGER NOT NULL, -- 1, 2, 3, 4...
  trimestre INTEGER CHECK (trimestre IN (1, 2, 3)),
  date_consultation DATE NOT NULL,
  terme_semaines INTEGER, -- Terme en semaines d'aménorrhée
  
  -- Paramètres vitaux
  poids DECIMAL(5,2),
  taille_uterine DECIMAL(5,2),
  position_foetale VARCHAR(50),
  mouvements_foetaux BOOLEAN,
  bruit_coeur_foetal BOOLEAN,
  oedemes BOOLEAN,
  etat_general VARCHAR(100),
  tension_arterielle VARCHAR(20), -- Format: 120/80
  temperature DECIMAL(4,2),
  
  -- Examen obstétrical
  palpation TEXT,
  presentation VARCHAR(50), -- Céphalique, Siège, Transverse
  hauteur_uterine DECIMAL(5,2), -- HU en cm
  
  -- Tests urinaires
  test_albumine VARCHAR(20),
  test_nitrite VARCHAR(20),
  
  -- Tests rapides
  test_vih VARCHAR(20),
  test_syphilis VARCHAR(20),
  test_glycemie DECIMAL(5,2),
  
  -- Examens de laboratoire
  hemoglobine DECIMAL(5,2),
  groupe_sanguin VARCHAR(10),
  autres_examens TEXT,
  
  -- Signes de danger et effets secondaires
  effets_secondaires TEXT,
  signes_danger TEXT,
  
  -- Référence
  reference_necessaire BOOLEAN DEFAULT false,
  centre_reference VARCHAR(200),
  motif_reference TEXT,
  suivi_retour TEXT,
  
  -- Diagnostic et décision
  diagnostic TEXT,
  decision TEXT,
  
  -- Rendez-vous
  prochain_rdv DATE,
  
  -- Statut
  statut VARCHAR(50) DEFAULT 'programmee' CHECK (statut IN ('programmee', 'en_cours', 'terminee', 'manquee', 'annulee')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Table pour les traitements prescrits lors des CPN
CREATE TABLE IF NOT EXISTS traitement_cpn (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_prenatale_id UUID NOT NULL REFERENCES consultation_prenatale(id) ON DELETE CASCADE,
  
  type_traitement VARCHAR(100) NOT NULL, -- 'TPI/SP', 'Fer+Acide folique', 'VAT', 'Autre'
  medicament VARCHAR(200),
  dose VARCHAR(100),
  dose_numero INTEGER, -- Pour TPI/SP: dose 1, 2, 3
  posologie TEXT,
  duree VARCHAR(50),
  date_administration DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les conseils donnés à la mère
CREATE TABLE IF NOT EXISTS conseils_mere (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_prenatale_id UUID NOT NULL REFERENCES consultation_prenatale(id) ON DELETE CASCADE,
  
  connaitre_dangers BOOLEAN DEFAULT false,
  conseils_nutritionnels BOOLEAN DEFAULT false,
  info_planification_familiale BOOLEAN DEFAULT false,
  hygiene_prevention BOOLEAN DEFAULT false,
  allaitement BOOLEAN DEFAULT false,
  preparation_accouchement BOOLEAN DEFAULT false,
  autres_conseils TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_droits_fondamentaux_dossier ON droits_fondamentaux(dossier_obstetrical_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_maternelle_dossier ON vaccination_maternelle(dossier_obstetrical_id);
CREATE INDEX IF NOT EXISTS idx_plan_accouchement_dossier ON plan_accouchement(dossier_obstetrical_id);
CREATE INDEX IF NOT EXISTS idx_soins_promotionnels_dossier ON soins_promotionnels(dossier_obstetrical_id);
CREATE INDEX IF NOT EXISTS idx_cpn_dossier ON consultation_prenatale(dossier_obstetrical_id);
CREATE INDEX IF NOT EXISTS idx_cpn_date ON consultation_prenatale(date_consultation);
CREATE INDEX IF NOT EXISTS idx_cpn_numero ON consultation_prenatale(numero_cpn);
CREATE INDEX IF NOT EXISTS idx_cpn_trimestre ON consultation_prenatale(trimestre);
CREATE INDEX IF NOT EXISTS idx_traitement_cpn ON traitement_cpn(consultation_prenatale_id);
CREATE INDEX IF NOT EXISTS idx_conseils_mere ON conseils_mere(consultation_prenatale_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_cpn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_droits_fondamentaux_updated_at
    BEFORE UPDATE ON droits_fondamentaux
    FOR EACH ROW
    EXECUTE FUNCTION update_cpn_updated_at();

CREATE TRIGGER update_vaccination_maternelle_updated_at
    BEFORE UPDATE ON vaccination_maternelle
    FOR EACH ROW
    EXECUTE FUNCTION update_cpn_updated_at();

CREATE TRIGGER update_plan_accouchement_updated_at
    BEFORE UPDATE ON plan_accouchement
    FOR EACH ROW
    EXECUTE FUNCTION update_cpn_updated_at();

CREATE TRIGGER update_soins_promotionnels_updated_at
    BEFORE UPDATE ON soins_promotionnels
    FOR EACH ROW
    EXECUTE FUNCTION update_cpn_updated_at();

CREATE TRIGGER update_consultation_prenatale_updated_at
    BEFORE UPDATE ON consultation_prenatale
    FOR EACH ROW
    EXECUTE FUNCTION update_cpn_updated_at();

-- Fonction pour calculer le prochain rendez-vous CPN
CREATE OR REPLACE FUNCTION calculer_prochain_rdv_cpn(numero_cpn_actuel INTEGER, date_consultation_actuelle DATE)
RETURNS DATE AS $$
DECLARE
    prochain_rdv DATE;
BEGIN
    -- CPN1: prochain RDV dans 4 semaines (CPN2)
    -- CPN2: prochain RDV dans 4 semaines (CPN3)
    -- CPN3: prochain RDV dans 2 semaines (CPN4)
    -- CPN4+: prochain RDV dans 1-2 semaines selon le terme
    
    CASE numero_cpn_actuel
        WHEN 1 THEN prochain_rdv := date_consultation_actuelle + INTERVAL '4 weeks';
        WHEN 2 THEN prochain_rdv := date_consultation_actuelle + INTERVAL '4 weeks';
        WHEN 3 THEN prochain_rdv := date_consultation_actuelle + INTERVAL '2 weeks';
        ELSE prochain_rdv := date_consultation_actuelle + INTERVAL '1 week';
    END CASE;
    
    RETURN prochain_rdv;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Vue pour obtenir un résumé des CPN par dossier
CREATE OR REPLACE VIEW vue_resume_cpn AS
SELECT 
    d.id as dossier_id,
    d.patient_id,
    COUNT(c.id) as nombre_cpn,
    MAX(c.date_consultation) as derniere_cpn,
    MAX(c.prochain_rdv) as prochain_rdv,
    COUNT(CASE WHEN c.trimestre = 1 THEN 1 END) as cpn_trimestre_1,
    COUNT(CASE WHEN c.trimestre = 2 THEN 1 END) as cpn_trimestre_2,
    COUNT(CASE WHEN c.trimestre = 3 THEN 1 END) as cpn_trimestre_3,
    COUNT(CASE WHEN c.statut = 'terminee' THEN 1 END) as cpn_terminees,
    COUNT(CASE WHEN c.statut = 'manquee' THEN 1 END) as cpn_manquees
FROM dossier_obstetrical d
LEFT JOIN consultation_prenatale c ON d.id = c.dossier_obstetrical_id
GROUP BY d.id, d.patient_id;

-- Commentaires sur les tables
COMMENT ON TABLE droits_fondamentaux IS 'Table pour enregistrer la sensibilisation aux droits fondamentaux de la mère';
COMMENT ON TABLE vaccination_maternelle IS 'Table pour le suivi des vaccinations VAT pendant la grossesse';
COMMENT ON TABLE plan_accouchement IS 'Table pour le plan d''accouchement et la préparation';
COMMENT ON TABLE soins_promotionnels IS 'Table pour les soins promotionnels et fournitures distribuées';
COMMENT ON TABLE consultation_prenatale IS 'Table principale pour les consultations prénatales (CPN)';
COMMENT ON TABLE traitement_cpn IS 'Table pour les traitements prescrits lors des CPN';
COMMENT ON TABLE conseils_mere IS 'Table pour les conseils et informations donnés à la mère';

COMMENT ON FUNCTION calculer_prochain_rdv_cpn IS 'Fonction pour calculer automatiquement le prochain rendez-vous CPN';
COMMENT ON VIEW vue_resume_cpn IS 'Vue récapitulative des CPN par dossier obstétrical';

