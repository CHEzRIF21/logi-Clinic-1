-- =========================================================
-- MIGRATION: MODULE CONSULTATION COMPLET
-- Description: Crée les tables nécessaires pour le module de consultation
-- =========================================================

-- 1. Table principale des consultations
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    medecin_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'EN_COURS' CHECK (status IN ('BROUILLON', 'EN_COURS', 'CLOTURE', 'ANNULE')),
    
    -- Contenu médical
    motifs JSONB DEFAULT '[]',
    categorie_motif VARCHAR(100),
    anamnese TEXT,
    traitement_en_cours TEXT,
    examens_cliniques JSONB DEFAULT '{}',
    diagnostics JSONB DEFAULT '[]',
    diagnostics_detail JSONB DEFAULT '[]',
    
    -- Suivi
    prochaine_consultation TIMESTAMP WITH TIME ZONE,
    notes_internes TEXT,
    
    -- Métadonnées
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_by UUID REFERENCES users(id),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_clinic_id ON consultations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at DESC);

-- 2. Table des constantes de consultation
CREATE TABLE IF NOT EXISTS consultation_constantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consult_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Signes vitaux
    taille_cm DECIMAL(5,2),
    poids_kg DECIMAL(5,2),
    imc DECIMAL(4,2),
    temperature_c DECIMAL(4,2),
    pouls_bpm INTEGER,
    frequence_respiratoire INTEGER,
    saturation_o2 INTEGER,
    glycemie_mg_dl DECIMAL(6,2),
    
    -- Tension Artérielle
    ta_bras_gauche_systolique INTEGER,
    ta_bras_gauche_diastolique INTEGER,
    ta_bras_droit_systolique INTEGER,
    ta_bras_droit_diastolique INTEGER,
    
    -- Maternité spécifique
    hauteur_uterine DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_constantes_consult_id ON consultation_constantes(consult_id);
CREATE INDEX IF NOT EXISTS idx_constantes_patient_id ON consultation_constantes(patient_id);

-- 3. Table des étapes de consultation (pour le workflow persistant)
CREATE TABLE IF NOT EXISTS consultation_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consult_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    data JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(consult_id, step_number)
);

-- 4. Table des antécédents du patient
CREATE TABLE IF NOT EXISTS patient_antecedents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('medicaux', 'chirurgicaux', 'familiaux', 'autres')),
    nom TEXT NOT NULL,
    annee VARCHAR(10),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_antecedents_patient_id ON patient_antecedents(patient_id);
CREATE INDEX IF NOT EXISTS idx_antecedents_type ON patient_antecedents(type);

-- Contrainte unique pour éviter les doublons (patient + type + nom)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'patient_antecedents_unique_patient_type_nom'
  ) THEN
    ALTER TABLE patient_antecedents 
    ADD CONSTRAINT patient_antecedents_unique_patient_type_nom 
    UNIQUE (patient_id, type, nom);
  END IF;
END $$;

-- 5. Table du déparasitage
CREATE TABLE IF NOT EXISTS patient_deparasitage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    molecule VARCHAR(200) NOT NULL,
    date_administration DATE NOT NULL,
    dose VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_deparasitage_patient_id ON patient_deparasitage(patient_id);

-- 6. Table de l'historique et versioning (Consultation Entries)
CREATE TABLE IF NOT EXISTS consultation_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consult_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL, -- anamnese, constantes, diagnostics, etc.
    action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
    data_before JSONB,
    data_after JSONB,
    annotation TEXT,
    utilisateur_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_consult_id ON consultation_entries(consult_id);
CREATE INDEX IF NOT EXISTS idx_entries_clinic_id ON consultation_entries(clinic_id);

-- 7. Tables des prescriptions et lignes de prescription
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    medecin_id UUID REFERENCES users(id),
    date_prescription TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    statut VARCHAR(50) DEFAULT 'valide' CHECK (statut IN ('valide', 'annule', 'dispense')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS prescription_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicament_id UUID REFERENCES medicaments(id),
    nom_medicament VARCHAR(255) NOT NULL,
    posologie TEXT NOT NULL,
    quantite_totale INTEGER NOT NULL DEFAULT 1,
    duree_jours INTEGER,
    mode_administration VARCHAR(100),
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_consult_id ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescription_lines_presc_id ON prescription_lines(prescription_id);

-- 8. Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_timestamp_consultation()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_consultations BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_timestamp_consultation();
CREATE TRIGGER tr_update_constantes BEFORE UPDATE ON consultation_constantes FOR EACH ROW EXECUTE FUNCTION update_timestamp_consultation();
CREATE TRIGGER tr_update_steps BEFORE UPDATE ON consultation_steps FOR EACH ROW EXECUTE FUNCTION update_timestamp_consultation();
CREATE TRIGGER tr_update_antecedents BEFORE UPDATE ON patient_antecedents FOR EACH ROW EXECUTE FUNCTION update_timestamp_consultation();
CREATE TRIGGER tr_update_deparasitage BEFORE UPDATE ON patient_deparasitage FOR EACH ROW EXECUTE FUNCTION update_timestamp_consultation();

-- 8. Politiques de Sécurité (RLS)
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_constantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_antecedents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_deparasitage ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_lines ENABLE ROW LEVEL SECURITY;

-- Politiques Multi-tenant génériques
CREATE POLICY "Users can access consultations of their clinic" ON consultations
    FOR ALL TO authenticated USING (clinic_id = (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can access constantes of their clinic" ON consultation_constantes
    FOR ALL TO authenticated USING (clinic_id = (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can access steps of their clinic" ON consultation_steps
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM consultations 
            WHERE consultations.id = consultation_steps.consult_id 
            AND consultations.clinic_id = (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "Users can access antecedents of their clinic" ON patient_antecedents
    FOR ALL TO authenticated USING (clinic_id = (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can access deparasitage of their clinic" ON patient_deparasitage
    FOR ALL TO authenticated USING (clinic_id = (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can access entries of their clinic" ON consultation_entries
    FOR ALL TO authenticated USING (clinic_id = (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can access prescriptions of their clinic" ON prescriptions
    FOR ALL TO authenticated USING (clinic_id = (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can access prescription_lines of their clinic" ON prescription_lines
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM prescriptions 
            WHERE prescriptions.id = prescription_lines.prescription_id 
            AND prescriptions.clinic_id = (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
        )
    );

-- 9. Templates de consultation (Optionnel mais recommandé)
CREATE TABLE IF NOT EXISTS consultation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    nom VARCHAR(200) NOT NULL,
    specialite VARCHAR(100),
    structure JSONB DEFAULT '{}',
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE consultation_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access templates of their clinic" ON consultation_templates
    FOR ALL TO authenticated USING (clinic_id IS NULL OR clinic_id = (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

