-- Migration: Création de la table pour le suivi des étapes de prise en charge
-- Date: 2024-12-20
-- Description: Table pour suivre les étapes de prise en charge du patient de manière structurée

CREATE TABLE IF NOT EXISTS patient_care_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  etape VARCHAR(100) NOT NULL,
  description TEXT,
  statut VARCHAR(50) NOT NULL CHECK (statut IN ('en_attente', 'en_cours', 'termine', 'annule')) DEFAULT 'en_attente',
  date_debut TIMESTAMP WITH TIME ZONE,
  date_fin TIMESTAMP WITH TIME ZONE,
  date_prevue TIMESTAMP WITH TIME ZONE,
  service VARCHAR(100),
  medecin_responsable VARCHAR(100),
  notes TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_patient_care_timeline_patient_id ON patient_care_timeline(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_care_timeline_statut ON patient_care_timeline(statut);
CREATE INDEX IF NOT EXISTS idx_patient_care_timeline_date_debut ON patient_care_timeline(date_debut);
CREATE INDEX IF NOT EXISTS idx_patient_care_timeline_service ON patient_care_timeline(service);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_patient_care_timeline_updated_at 
    BEFORE UPDATE ON patient_care_timeline 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires sur la table
COMMENT ON TABLE patient_care_timeline IS 'Table pour suivre les étapes de prise en charge du patient';
COMMENT ON COLUMN patient_care_timeline.patient_id IS 'Référence au patient';
COMMENT ON COLUMN patient_care_timeline.etape IS 'Nom de l''étape (ex: Enregistrement, Consultation initiale, Examens, Traitement, Suivi)';
COMMENT ON COLUMN patient_care_timeline.description IS 'Description détaillée de l''étape';
COMMENT ON COLUMN patient_care_timeline.statut IS 'Statut de l''étape (en_attente, en_cours, termine, annule)';
COMMENT ON COLUMN patient_care_timeline.date_debut IS 'Date de début de l''étape';
COMMENT ON COLUMN patient_care_timeline.date_fin IS 'Date de fin de l''étape';
COMMENT ON COLUMN patient_care_timeline.date_prevue IS 'Date prévue pour l''étape';
COMMENT ON COLUMN patient_care_timeline.service IS 'Service responsable de l''étape';
COMMENT ON COLUMN patient_care_timeline.medecin_responsable IS 'Médecin responsable de l''étape';
COMMENT ON COLUMN patient_care_timeline.notes IS 'Notes additionnelles sur l''étape';
COMMENT ON COLUMN patient_care_timeline.created_by IS 'Utilisateur qui a créé l''étape';

-- Insertion d'une étape initiale lors de l'enregistrement du patient (via trigger)
CREATE OR REPLACE FUNCTION create_initial_care_timeline()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO patient_care_timeline (
        patient_id,
        etape,
        description,
        statut,
        date_debut,
        service,
        notes
    ) VALUES (
        NEW.id,
        'Enregistrement',
        'Enregistrement initial du patient dans le système',
        'termine',
        NEW.date_enregistrement,
        NEW.service_initial,
        'Patient enregistré avec le statut: ' || NEW.statut
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement l'étape d'enregistrement
CREATE TRIGGER trigger_create_initial_care_timeline
    AFTER INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_care_timeline();

