-- Migration: Connexions inter-modules du Laboratoire
-- Date: 2025-01
-- Description: Intégrations complètes avec Gestion Patient, Consultation, Maternité, Caisse, Stock, Tableau de Bord et Bilan

-- ============================================
-- 1. GESTION PATIENT → LABORATOIRE (Entrée)
-- Récupération de l'âge et du sexe pour valeurs normales automatiques
-- ============================================

-- Vue pour récupérer les informations patient nécessaires au laboratoire (SECURITY INVOKER pour respecter RLS / clinic_id)
CREATE OR REPLACE VIEW v_patient_labo_info WITH (security_invoker = on) AS
SELECT 
  p.id,
  p.identifiant,
  p.nom,
  p.prenom,
  p.sexe,
  p.date_naissance,
  EXTRACT(YEAR FROM AGE(p.date_naissance)) AS age,
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 1 THEN 'nouveau_ne'
    WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 2 THEN 'nourrisson'
    WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 12 THEN 'enfant'
    WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 18 THEN 'adolescent'
    ELSE 'adulte'
  END AS tranche_age,
  p.groupe_sanguin
FROM patients p;

-- Fonction pour récupérer les valeurs de référence automatiques selon patient
CREATE OR REPLACE FUNCTION get_valeurs_reference_patient(
  p_patient_id UUID,
  p_parametre VARCHAR
)
RETURNS TABLE (
  valeur_min DECIMAL(12,4),
  valeur_max DECIMAL(12,4),
  unite VARCHAR(50),
  commentaire TEXT
) AS $$
DECLARE
  v_age INTEGER;
  v_sexe VARCHAR(20);
BEGIN
  -- Récupérer âge et sexe du patient
  SELECT 
    EXTRACT(YEAR FROM AGE(date_naissance))::INTEGER,
    sexe
  INTO v_age, v_sexe
  FROM patients
  WHERE id = p_patient_id;
  
  -- Chercher les valeurs de référence correspondantes
  RETURN QUERY
  SELECT 
    vr.valeur_min,
    vr.valeur_max,
    vr.unite,
    vr.commentaire
  FROM lab_valeurs_reference vr
  WHERE vr.parametre = p_parametre
    AND (vr.sexe = v_sexe OR vr.sexe = 'Tous')
    AND (vr.age_min IS NULL OR v_age >= vr.age_min)
    AND (vr.age_max IS NULL OR v_age <= vr.age_max)
  ORDER BY 
    CASE WHEN vr.sexe = v_sexe THEN 0 ELSE 1 END,
    CASE WHEN vr.age_min IS NOT NULL THEN 0 ELSE 1 END
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. CONSULTATION ↔ LABORATOIRE (Bidirectionnel)
-- Prescription électronique et résultats dans le dossier
-- ============================================

-- Ajouter le champ consultation_id si pas déjà fait
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_prescriptions' AND column_name = 'consultation_id'
  ) THEN
    ALTER TABLE lab_prescriptions 
    ADD COLUMN consultation_id UUID;
  END IF;
END $$;

-- Table de liaison résultats laboratoire → consultation
CREATE TABLE IF NOT EXISTS lab_resultats_consultation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL,
  prescription_id UUID NOT NULL REFERENCES lab_prescriptions(id) ON DELETE CASCADE,
  rapport_id UUID REFERENCES lab_rapports(id),
  date_envoi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lu_par_medecin BOOLEAN DEFAULT false,
  date_lecture TIMESTAMP WITH TIME ZONE,
  commentaire_medecin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_resultats_consultation ON lab_resultats_consultation(consultation_id);
CREATE INDEX IF NOT EXISTS idx_lab_resultats_prescription ON lab_resultats_consultation(prescription_id);

-- ============================================
-- 3. MATERNITÉ ↔ LABORATOIRE (Bidirectionnel)
-- Bilans prénataux et résultats urgents sages-femmes
-- ============================================

-- Types d'examens prénataux obligatoires
CREATE TABLE IF NOT EXISTS lab_examens_maternite (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_examen VARCHAR(50) NOT NULL,
  libelle VARCHAR(200) NOT NULL,
  categorie VARCHAR(50) CHECK (categorie IN ('groupe_sanguin', 'serologie', 'biochimie', 'hematologie', 'urinaire')) NOT NULL,
  obligatoire_cpn INTEGER, -- Numéro de la CPN où cet examen est obligatoire (1, 2, 3, 4)
  trimestre INTEGER CHECK (trimestre IN (1, 2, 3)),
  priorite VARCHAR(20) CHECK (priorite IN ('normale', 'haute', 'urgente')) DEFAULT 'normale',
  delai_max_heures INTEGER DEFAULT 24,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Données initiales pour les examens maternité
INSERT INTO lab_examens_maternite (code_examen, libelle, categorie, obligatoire_cpn, trimestre, priorite, delai_max_heures) VALUES
('GS_RH', 'Groupe sanguin et Rhésus', 'groupe_sanguin', 1, 1, 'haute', 4),
('NFS_GROSSESSE', 'Numération Formule Sanguine (grossesse)', 'hematologie', 1, 1, 'normale', 24),
('VIH_GROSSESSE', 'Test VIH (grossesse)', 'serologie', 1, 1, 'haute', 2),
('SYPHILIS', 'Sérologie Syphilis (VDRL/TPHA)', 'serologie', 1, 1, 'haute', 4),
('TOXO', 'Sérologie Toxoplasmose', 'serologie', 1, 1, 'normale', 24),
('RUBEO', 'Sérologie Rubéole', 'serologie', 1, 1, 'normale', 24),
('GLYCEMIE_GROSS', 'Glycémie à jeun (grossesse)', 'biochimie', 2, 2, 'normale', 12),
('ECBU', 'Examen Cytobactériologique Urinaire', 'urinaire', 1, 1, 'normale', 24),
('PROT_URINAIRE', 'Protéinurie', 'urinaire', 3, 3, 'haute', 6),
('RAI', 'Recherche d''Agglutinines Irrégulières', 'groupe_sanguin', 3, 3, 'haute', 4)
ON CONFLICT DO NOTHING;

-- Notifications pour sages-femmes (résultats urgents maternité)
CREATE TABLE IF NOT EXISTS lab_notifications_maternite (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  grossesse_id UUID, -- Référence à la table de suivi de grossesse si elle existe
  cpn_id UUID, -- Référence à la CPN si elle existe
  analyse_id UUID REFERENCES lab_analyses(id),
  type_notification VARCHAR(50) CHECK (type_notification IN ('resultat_urgent', 'resultat_pathologique', 'bilan_complet', 'rappel')) NOT NULL,
  priorite VARCHAR(20) CHECK (priorite IN ('normale', 'haute', 'critique')) DEFAULT 'normale',
  titre VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  parametre VARCHAR(150),
  valeur TEXT,
  est_pathologique BOOLEAN DEFAULT false,
  destinataires TEXT, -- JSON array des IDs des sages-femmes
  statut VARCHAR(20) CHECK (statut IN ('nouvelle', 'lue', 'acquittee')) DEFAULT 'nouvelle',
  date_notification TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_lecture TIMESTAMP WITH TIME ZONE,
  lu_par VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_notif_maternite_patient ON lab_notifications_maternite(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_notif_maternite_statut ON lab_notifications_maternite(statut);
CREATE INDEX IF NOT EXISTS idx_lab_notif_maternite_priorite ON lab_notifications_maternite(priorite);

-- ============================================
-- 4. CAISSE → LABORATOIRE (Entrée)
-- Verrouillage si facture non payée
-- ============================================

-- Statut de paiement pour les prescriptions laboratoire
ALTER TABLE lab_prescriptions 
ADD COLUMN IF NOT EXISTS statut_paiement VARCHAR(20) CHECK (statut_paiement IN ('non_facture', 'en_attente', 'paye', 'exonere')) DEFAULT 'non_facture',
ADD COLUMN IF NOT EXISTS facture_id UUID,
ADD COLUMN IF NOT EXISTS montant_facture DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS date_paiement TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(50),
ADD COLUMN IF NOT EXISTS reference_paiement VARCHAR(100);

-- Table de verrouillage des résultats
CREATE TABLE IF NOT EXISTS lab_verrouillage_resultats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES lab_prescriptions(id) ON DELETE CASCADE,
  rapport_id UUID REFERENCES lab_rapports(id),
  est_verrouille BOOLEAN DEFAULT true,
  raison_verrouillage VARCHAR(100) DEFAULT 'paiement_requis',
  date_verrouillage TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deverrouille_par VARCHAR(150),
  date_deverrouillage TIMESTAMP WITH TIME ZONE,
  facture_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_verrouillage_prescription ON lab_verrouillage_resultats(prescription_id);
CREATE INDEX IF NOT EXISTS idx_lab_verrouillage_statut ON lab_verrouillage_resultats(est_verrouille);

-- Fonction pour vérifier le paiement avant actions sensibles
CREATE OR REPLACE FUNCTION check_paiement_labo(
  p_prescription_id UUID
)
RETURNS TABLE (
  est_paye BOOLEAN,
  peut_prelever BOOLEAN,
  peut_valider BOOLEAN,
  peut_imprimer BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_statut_paiement VARCHAR(20);
  v_config_obligatoire BOOLEAN;
BEGIN
  -- Récupérer le statut de paiement
  SELECT statut_paiement INTO v_statut_paiement
  FROM lab_prescriptions
  WHERE id = p_prescription_id;
  
  -- Récupérer la configuration
  SELECT valeur::BOOLEAN INTO v_config_obligatoire
  FROM configurations_laboratoire
  WHERE cle = 'labo_paiement_obligatoire';
  
  -- Si paiement non obligatoire, tout est autorisé
  IF v_config_obligatoire IS FALSE OR v_config_obligatoire IS NULL THEN
    RETURN QUERY SELECT true, true, true, true, 'Paiement non obligatoire'::TEXT;
    RETURN;
  END IF;
  
  -- Vérifier le statut
  IF v_statut_paiement IN ('paye', 'exonere') THEN
    RETURN QUERY SELECT true, true, true, true, 'Paiement effectué'::TEXT;
  ELSIF v_statut_paiement = 'en_attente' THEN
    RETURN QUERY SELECT false, true, true, false, 'Paiement en attente - Impression bloquée'::TEXT;
  ELSE
    RETURN QUERY SELECT false, true, false, false, 'Paiement requis avant validation'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. LABORATOIRE → STOCK (Sortie)
-- Déstockage automatique des réactifs
-- ============================================

-- Table de liaison analyse ↔ consommables utilisés
CREATE TABLE IF NOT EXISTS lab_consommation_analyse (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analyse_id UUID NOT NULL REFERENCES lab_analyses(id) ON DELETE CASCADE,
  medicament_id UUID, -- Référence au médicament/réactif
  lot_id UUID, -- Référence au lot utilisé
  code_reactif VARCHAR(100),
  libelle VARCHAR(200),
  quantite_utilisee DECIMAL(12,4) NOT NULL,
  unite VARCHAR(50),
  date_consommation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  operateur VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_conso_analyse ON lab_consommation_analyse(analyse_id);
CREATE INDEX IF NOT EXISTS idx_lab_conso_medicament ON lab_consommation_analyse(medicament_id);
CREATE INDEX IF NOT EXISTS idx_lab_conso_date ON lab_consommation_analyse(date_consommation);

-- Table de correspondance type d'examen → réactifs nécessaires
CREATE TABLE IF NOT EXISTS lab_examen_reactifs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_examen VARCHAR(50) NOT NULL,
  code_reactif VARCHAR(100) NOT NULL,
  quantite_par_test DECIMAL(12,4) NOT NULL DEFAULT 1,
  unite VARCHAR(50),
  obligatoire BOOLEAN DEFAULT true,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Données initiales pour la correspondance examens/réactifs
INSERT INTO lab_examen_reactifs (code_examen, code_reactif, quantite_par_test, unite, obligatoire) VALUES
('NFS', 'EDTA_TUBE', 1, 'tube', true),
('NFS', 'COLORANT_GIEMSA', 0.5, 'mL', true),
('GLYCEMIE', 'TUBE_SEC', 1, 'tube', true),
('GLYCEMIE', 'REACTIF_GLUCOSE', 1, 'dose', true),
('VIH', 'KIT_VIH_RDT', 1, 'test', true),
('PALUDISME', 'KIT_PALU_RDT', 1, 'test', true),
('GS_RH', 'ANTI_A', 0.1, 'mL', true),
('GS_RH', 'ANTI_B', 0.1, 'mL', true),
('GS_RH', 'ANTI_D', 0.1, 'mL', true)
ON CONFLICT DO NOTHING;

-- Trigger pour décrémenter automatiquement le stock après validation d'analyse
CREATE OR REPLACE FUNCTION trigger_destockage_reactifs()
RETURNS TRIGGER AS $$
DECLARE
  v_examen_code VARCHAR(50);
  v_reactif RECORD;
BEGIN
  -- Seulement quand l'analyse passe en statut 'termine'
  IF NEW.statut = 'termine' AND (OLD.statut IS NULL OR OLD.statut != 'termine') THEN
    -- Récupérer le type d'examen depuis la prescription
    SELECT lp.type_examen INTO v_examen_code
    FROM lab_prescriptions lp
    JOIN lab_prelevements lpre ON lpre.prescription_id = lp.id
    WHERE lpre.id = NEW.prelevement_id;
    
    -- Pour chaque réactif associé à cet examen
    FOR v_reactif IN 
      SELECT er.code_reactif, er.quantite_par_test, er.unite
      FROM lab_examen_reactifs er
      WHERE er.code_examen = v_examen_code
        AND er.actif = true
    LOOP
      -- Décrémenter le stock
      UPDATE lab_stocks_reactifs
      SET quantite_disponible = quantite_disponible - v_reactif.quantite_par_test,
          updated_at = NOW()
      WHERE code_reactif = v_reactif.code_reactif
        AND quantite_disponible >= v_reactif.quantite_par_test;
      
      -- Enregistrer la consommation
      INSERT INTO lab_consommation_analyse (
        analyse_id, code_reactif, quantite_utilisee, unite, operateur
      ) VALUES (
        NEW.id, v_reactif.code_reactif, v_reactif.quantite_par_test, v_reactif.unite, NEW.technicien
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe et le recréer
DROP TRIGGER IF EXISTS trigger_destockage_reactifs_analyse ON lab_analyses;
CREATE TRIGGER trigger_destockage_reactifs_analyse
  AFTER UPDATE ON lab_analyses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_destockage_reactifs();

-- ============================================
-- 6. LABORATOIRE → TABLEAU DE BORD (Sortie)
-- KPI: Temps d'attente, Examens/jour, Taux de positivité
-- ============================================

-- Vue pour les KPI du tableau de bord
CREATE OR REPLACE VIEW v_laboratoire_kpi AS
WITH 
periodes AS (
  SELECT 
    NOW() - INTERVAL '1 day' AS debut_jour,
    NOW() - INTERVAL '7 days' AS debut_semaine,
    NOW() - INTERVAL '30 days' AS debut_mois
),
examens_stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE lp.created_at >= p.debut_jour) AS examens_aujourd_hui,
    COUNT(*) FILTER (WHERE lp.created_at >= p.debut_semaine) AS examens_semaine,
    COUNT(*) FILTER (WHERE lp.created_at >= p.debut_mois) AS examens_mois,
    COUNT(*) AS examens_total
  FROM lab_prescriptions lp, periodes p
),
analyses_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE la.statut = 'termine') AS analyses_terminees,
    COUNT(*) FILTER (WHERE la.statut = 'en_cours') AS analyses_en_cours,
    COUNT(*) FILTER (WHERE la.statut = 'en_attente') AS analyses_en_attente,
    COUNT(*) FILTER (WHERE la.est_pathologique = true) AS resultats_pathologiques,
    COUNT(*) AS total_analyses
  FROM lab_analyses la
),
delais AS (
  SELECT 
    AVG(
      EXTRACT(EPOCH FROM (la.date_validation - lpre.date_prelevement)) / 3600
    ) AS delai_moyen_heures
  FROM lab_analyses la
  JOIN lab_prelevements lpre ON lpre.id = la.prelevement_id
  WHERE la.date_validation IS NOT NULL
    AND la.created_at >= NOW() - INTERVAL '30 days'
),
positivite AS (
  SELECT 
    la.parametre,
    COUNT(*) FILTER (WHERE la.est_pathologique = true) AS positifs,
    COUNT(*) AS total,
    CASE WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE la.est_pathologique = true)::DECIMAL / COUNT(*)) * 100 
      ELSE 0 
    END AS taux_positivite
  FROM lab_analyses la
  WHERE la.parametre IN ('Paludisme', 'VIH', 'Syphilis')
    AND la.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY la.parametre
)
SELECT 
  es.examens_aujourd_hui,
  es.examens_semaine,
  es.examens_mois,
  es.examens_total,
  ast.analyses_terminees,
  ast.analyses_en_cours,
  ast.analyses_en_attente,
  ast.resultats_pathologiques,
  COALESCE(d.delai_moyen_heures, 0) AS delai_moyen_heures,
  COALESCE(
    (SELECT SUM(taux_positivite) / NULLIF(COUNT(*), 0) FROM positivite),
    0
  ) AS taux_positivite_moyen,
  (SELECT json_agg(row_to_json(positivite.*)) FROM positivite) AS details_positivite
FROM examens_stats es
CROSS JOIN analyses_stats ast
CROSS JOIN delais d;

-- ============================================
-- 7. LABORATOIRE → BILAN FINANCIER (Sortie)
-- CA généré vs Coût des réactifs
-- ============================================

-- Vue pour le bilan financier du laboratoire
CREATE OR REPLACE VIEW v_laboratoire_bilan_financier AS
WITH 
periode AS (
  SELECT 
    DATE_TRUNC('month', NOW()) AS debut_mois,
    NOW() AS fin_mois
),
chiffre_affaires AS (
  SELECT 
    COALESCE(SUM(montant_facture), 0) AS ca_mois
  FROM lab_prescriptions lp, periode p
  WHERE lp.statut_paiement = 'paye'
    AND lp.date_paiement >= p.debut_mois
),
cout_reactifs AS (
  SELECT 
    COALESCE(SUM(
      lca.quantite_utilisee * COALESCE(lsr.seuil_alerte, 0) -- Estimation du coût
    ), 0) AS cout_mois
  FROM lab_consommation_analyse lca
  LEFT JOIN lab_stocks_reactifs lsr ON lsr.code_reactif = lca.code_reactif
  JOIN periode p ON lca.date_consommation >= p.debut_mois
),
volume AS (
  SELECT 
    COUNT(DISTINCT lp.id) AS nb_prescriptions,
    COUNT(DISTINCT la.id) AS nb_analyses
  FROM lab_prescriptions lp
  LEFT JOIN lab_prelevements lpre ON lpre.prescription_id = lp.id
  LEFT JOIN lab_analyses la ON la.prelevement_id = lpre.id
  JOIN periode p ON lp.created_at >= p.debut_mois
)
SELECT 
  ca.ca_mois AS chiffre_affaires_mois,
  cr.cout_mois AS cout_reactifs_mois,
  ca.ca_mois - cr.cout_mois AS marge_brute_mois,
  CASE WHEN ca.ca_mois > 0 
    THEN ((ca.ca_mois - cr.cout_mois) / ca.ca_mois) * 100 
    ELSE 0 
  END AS taux_marge_pourcent,
  v.nb_prescriptions AS nombre_prescriptions_mois,
  v.nb_analyses AS nombre_analyses_mois,
  CASE WHEN v.nb_analyses > 0 
    THEN ca.ca_mois / v.nb_analyses 
    ELSE 0 
  END AS ca_moyen_par_analyse
FROM chiffre_affaires ca
CROSS JOIN cout_reactifs cr
CROSS JOIN volume v;

-- ============================================
-- Triggers de mise à jour
-- ============================================

-- S'assurer que la fonction update_updated_at_column existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour les nouvelles tables
CREATE TRIGGER update_lab_resultats_consultation_updated_at 
  BEFORE UPDATE ON lab_resultats_consultation 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Index additionnels pour performances
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lab_prescriptions_statut_paiement ON lab_prescriptions(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_lab_prescriptions_consultation ON lab_prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_lab_analyses_est_pathologique ON lab_analyses(est_pathologique);
CREATE INDEX IF NOT EXISTS idx_lab_analyses_parametre ON lab_analyses(parametre);

-- ============================================
-- Commentaires
-- ============================================

COMMENT ON VIEW v_patient_labo_info IS 'Informations patient pour le laboratoire (âge, sexe, tranche d''âge)';
COMMENT ON FUNCTION get_valeurs_reference_patient IS 'Récupère les valeurs de référence selon âge et sexe du patient';
COMMENT ON TABLE lab_resultats_consultation IS 'Liaison entre résultats laboratoire et consultations';
COMMENT ON TABLE lab_examens_maternite IS 'Catalogue des examens obligatoires pour la maternité';
COMMENT ON TABLE lab_notifications_maternite IS 'Notifications urgentes pour les sages-femmes';
COMMENT ON TABLE lab_verrouillage_resultats IS 'Verrouillage des résultats selon statut de paiement';
COMMENT ON FUNCTION check_paiement_labo IS 'Vérifie le statut de paiement avant actions laboratoire';
COMMENT ON TABLE lab_consommation_analyse IS 'Consommation de réactifs par analyse';
COMMENT ON TABLE lab_examen_reactifs IS 'Correspondance examens ↔ réactifs nécessaires';
COMMENT ON FUNCTION trigger_destockage_reactifs IS 'Décrémente automatiquement le stock de réactifs après validation';
COMMENT ON VIEW v_laboratoire_kpi IS 'Indicateurs clés de performance du laboratoire';
COMMENT ON VIEW v_laboratoire_bilan_financier IS 'Bilan financier mensuel du laboratoire (CA vs coûts)';

