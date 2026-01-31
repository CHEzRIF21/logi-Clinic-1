-- ============================================
-- MIGRATION COMPLÈTE : Toutes les migrations + RLS
-- ============================================
-- Date: 2024-12-20
-- Description: Applique toutes les migrations nécessaires et configure les politiques RLS
-- Prérequis : La table "patients" doit exister (créée par les migrations hiérarchiques ou Prisma).

BEGIN;

-- ============================================
-- 1. MIGRATION : Colonnes Accompagnant et Personne à prévenir
-- ============================================

-- Ajout des colonnes pour l'accompagnant (idempotent)
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS accompagnant_nom VARCHAR(100),
ADD COLUMN IF NOT EXISTS accompagnant_prenoms VARCHAR(100),
ADD COLUMN IF NOT EXISTS accompagnant_filiation VARCHAR(50),
ADD COLUMN IF NOT EXISTS accompagnant_telephone VARCHAR(20),
ADD COLUMN IF NOT EXISTS accompagnant_quartier VARCHAR(100),
ADD COLUMN IF NOT EXISTS accompagnant_profession VARCHAR(100);

-- Ajout des colonnes pour la personne à prévenir
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS personne_prevenir_option VARCHAR(20) CHECK (personne_prevenir_option IN ('identique_accompagnant', 'autre')),
ADD COLUMN IF NOT EXISTS personne_prevenir_nom VARCHAR(100),
ADD COLUMN IF NOT EXISTS personne_prevenir_prenoms VARCHAR(100),
ADD COLUMN IF NOT EXISTS personne_prevenir_filiation VARCHAR(50),
ADD COLUMN IF NOT EXISTS personne_prevenir_telephone VARCHAR(20),
ADD COLUMN IF NOT EXISTS personne_prevenir_quartier VARCHAR(100),
ADD COLUMN IF NOT EXISTS personne_prevenir_profession VARCHAR(100);

-- ============================================
-- 2. MIGRATION : Table patient_files
-- ============================================

CREATE TABLE IF NOT EXISTS patient_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,
  file_path TEXT NOT NULL,
  file_url TEXT,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('carnet_medical', 'document_identite', 'prescription', 'examen', 'autre')),
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_patient_files_patient_id ON patient_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_category ON patient_files(category);

-- ============================================
-- 3. MIGRATION : Table patient_care_timeline
-- ============================================

CREATE TABLE IF NOT EXISTS patient_care_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  etape VARCHAR(255) NOT NULL,
  description TEXT,
  statut VARCHAR(20) CHECK (statut IN ('en_attente', 'en_cours', 'termine', 'annule')) DEFAULT 'en_attente',
  date_debut TIMESTAMP WITH TIME ZONE,
  date_fin TIMESTAMP WITH TIME ZONE,
  date_prevue TIMESTAMP WITH TIME ZONE,
  service VARCHAR(100),
  medecin_responsable VARCHAR(255),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_patient_care_timeline_patient_id ON patient_care_timeline(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_care_timeline_statut ON patient_care_timeline(statut);

-- ============================================
-- 4. MIGRATION : Bucket Storage patient-files
-- ============================================

-- Créer le bucket si il n'existe pas déjà
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-files', 'patient-files', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. CONFIGURATION RLS (Row Level Security)
-- ============================================

-- Activer RLS sur la table patients si ce n'est pas déjà fait
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON patients;
DROP POLICY IF EXISTS "Allow public read access" ON patients;
DROP POLICY IF EXISTS "Allow public insert" ON patients;
DROP POLICY IF EXISTS "Allow public update" ON patients;
DROP POLICY IF EXISTS "Allow public delete" ON patients;

-- Politique pour permettre toutes les opérations aux utilisateurs authentifiés
CREATE POLICY "Allow all operations for authenticated users"
ON patients
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Politique pour permettre toutes les opérations aux utilisateurs anonymes (pour le développement)
-- ⚠️ ATTENTION : En production, vous devriez restreindre cette politique
CREATE POLICY "Allow all operations for anon users"
ON patients
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. RLS pour patient_files
-- ============================================

ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON patient_files;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON patient_files;

CREATE POLICY "Allow all operations for authenticated users"
ON patient_files
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
ON patient_files
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- ============================================
-- 7. RLS pour patient_care_timeline
-- ============================================

ALTER TABLE patient_care_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON patient_care_timeline;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON patient_care_timeline;

CREATE POLICY "Allow all operations for authenticated users"
ON patient_care_timeline
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
ON patient_care_timeline
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- ============================================
-- 8. POLITIQUES STORAGE pour patient-files
-- ============================================

-- Politique pour permettre l'upload de fichiers
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to delete files" ON storage.objects;

-- Upload pour utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-files');

-- Upload pour utilisateurs anonymes (développement)
CREATE POLICY "Allow anon users to upload files"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'patient-files');

-- Lecture pour utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to read files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'patient-files');

-- Lecture pour utilisateurs anonymes (développement)
CREATE POLICY "Allow anon users to read files"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'patient-files');

-- Suppression pour utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'patient-files');

-- Suppression pour utilisateurs anonymes (développement)
CREATE POLICY "Allow anon users to delete files"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'patient-files');

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- Vérification
SELECT 'Migration complète appliquée avec succès!' as status;

COMMIT;

