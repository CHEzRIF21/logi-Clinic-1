-- Migration: Création de la table pour les fichiers joints aux patients
-- Date: 2024-12-20
-- Description: Table pour stocker les fichiers (carnet médical, documents, etc.) associés aux patients

CREATE TABLE IF NOT EXISTS patient_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,
  file_path TEXT NOT NULL,
  file_url TEXT,
  description TEXT,
  category VARCHAR(50) DEFAULT 'autre' CHECK (category IN ('carnet_medical', 'document_identite', 'prescription', 'examen', 'autre')),
  uploaded_by VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_patient_files_patient_id ON patient_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_category ON patient_files(category);
CREATE INDEX IF NOT EXISTS idx_patient_files_uploaded_at ON patient_files(uploaded_at);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_patient_files_updated_at 
    BEFORE UPDATE ON patient_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires sur la table
COMMENT ON TABLE patient_files IS 'Table pour stocker les fichiers joints aux patients';
COMMENT ON COLUMN patient_files.patient_id IS 'Référence au patient';
COMMENT ON COLUMN patient_files.file_name IS 'Nom du fichier original';
COMMENT ON COLUMN patient_files.file_type IS 'Type MIME du fichier';
COMMENT ON COLUMN patient_files.file_size IS 'Taille du fichier en octets';
COMMENT ON COLUMN patient_files.file_path IS 'Chemin de stockage du fichier';
COMMENT ON COLUMN patient_files.file_url IS 'URL publique du fichier (si disponible)';
COMMENT ON COLUMN patient_files.description IS 'Description du fichier';
COMMENT ON COLUMN patient_files.category IS 'Catégorie du fichier (carnet_medical, document_identite, prescription, examen, autre)';
COMMENT ON COLUMN patient_files.uploaded_by IS 'Utilisateur qui a téléchargé le fichier';

