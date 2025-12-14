-- =====================================================
-- MODULE IMAGERIE MÉDICALE - Tables et relations
-- Migration créée le 2025-12-14
-- =====================================================

-- Table principale des examens d'imagerie
CREATE TABLE IF NOT EXISTS imagerie_examens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  identifiant_patient TEXT,
  type_examen TEXT NOT NULL CHECK (type_examen IN ('Radiographie', 'Scanner', 'IRM', 'Échographie', 'Autre')),
  prescripteur TEXT,
  medecin_referent TEXT,
  date_examen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'termine', 'annule')),
  notes TEXT,
  consultation_id UUID, -- Référence optionnelle vers une consultation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des images d'imagerie
CREATE TABLE IF NOT EXISTS imagerie_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examen_id UUID NOT NULL REFERENCES imagerie_examens(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  dicom BOOLEAN DEFAULT FALSE,
  web_asset_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des annotations sur les images
CREATE TABLE IF NOT EXISTS imagerie_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES imagerie_images(id) ON DELETE CASCADE,
  auteur TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('point', 'ligne', 'mesure', 'texte', 'libre')),
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des rapports d'imagerie
CREATE TABLE IF NOT EXISTS imagerie_rapports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examen_id UUID NOT NULL REFERENCES imagerie_examens(id) ON DELETE CASCADE,
  modele TEXT NOT NULL,
  contenu TEXT,
  signe_par TEXT,
  signature_electronique TEXT,
  date_signature TIMESTAMPTZ,
  transmis_a TEXT,
  date_transmission TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_imagerie_examens_patient ON imagerie_examens(patient_id);
CREATE INDEX IF NOT EXISTS idx_imagerie_examens_date ON imagerie_examens(date_examen DESC);
CREATE INDEX IF NOT EXISTS idx_imagerie_examens_type ON imagerie_examens(type_examen);
CREATE INDEX IF NOT EXISTS idx_imagerie_examens_statut ON imagerie_examens(statut);
CREATE INDEX IF NOT EXISTS idx_imagerie_images_examen ON imagerie_images(examen_id);
CREATE INDEX IF NOT EXISTS idx_imagerie_annotations_image ON imagerie_annotations(image_id);
CREATE INDEX IF NOT EXISTS idx_imagerie_rapports_examen ON imagerie_rapports(examen_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_imagerie_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_imagerie_examens ON imagerie_examens;
CREATE TRIGGER trigger_update_imagerie_examens
  BEFORE UPDATE ON imagerie_examens
  FOR EACH ROW
  EXECUTE FUNCTION update_imagerie_updated_at();

DROP TRIGGER IF EXISTS trigger_update_imagerie_rapports ON imagerie_rapports;
CREATE TRIGGER trigger_update_imagerie_rapports
  BEFORE UPDATE ON imagerie_rapports
  FOR EACH ROW
  EXECUTE FUNCTION update_imagerie_updated_at();

-- Activer RLS sur toutes les tables d'imagerie
ALTER TABLE imagerie_examens ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagerie_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagerie_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagerie_rapports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES RLS POUR LE MODULE IMAGERIE MÉDICALE
-- =====================================================

-- Politique pour imagerie_examens
DROP POLICY IF EXISTS "imagerie_examens_select_policy" ON imagerie_examens;
CREATE POLICY "imagerie_examens_select_policy" ON imagerie_examens FOR SELECT USING (true);

DROP POLICY IF EXISTS "imagerie_examens_insert_policy" ON imagerie_examens;
CREATE POLICY "imagerie_examens_insert_policy" ON imagerie_examens FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "imagerie_examens_update_policy" ON imagerie_examens;
CREATE POLICY "imagerie_examens_update_policy" ON imagerie_examens FOR UPDATE USING (true);

DROP POLICY IF EXISTS "imagerie_examens_delete_policy" ON imagerie_examens;
CREATE POLICY "imagerie_examens_delete_policy" ON imagerie_examens FOR DELETE USING (true);

-- Politique pour imagerie_images
DROP POLICY IF EXISTS "imagerie_images_select_policy" ON imagerie_images;
CREATE POLICY "imagerie_images_select_policy" ON imagerie_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "imagerie_images_insert_policy" ON imagerie_images;
CREATE POLICY "imagerie_images_insert_policy" ON imagerie_images FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "imagerie_images_update_policy" ON imagerie_images;
CREATE POLICY "imagerie_images_update_policy" ON imagerie_images FOR UPDATE USING (true);

DROP POLICY IF EXISTS "imagerie_images_delete_policy" ON imagerie_images;
CREATE POLICY "imagerie_images_delete_policy" ON imagerie_images FOR DELETE USING (true);

-- Politique pour imagerie_annotations
DROP POLICY IF EXISTS "imagerie_annotations_select_policy" ON imagerie_annotations;
CREATE POLICY "imagerie_annotations_select_policy" ON imagerie_annotations FOR SELECT USING (true);

DROP POLICY IF EXISTS "imagerie_annotations_insert_policy" ON imagerie_annotations;
CREATE POLICY "imagerie_annotations_insert_policy" ON imagerie_annotations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "imagerie_annotations_update_policy" ON imagerie_annotations;
CREATE POLICY "imagerie_annotations_update_policy" ON imagerie_annotations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "imagerie_annotations_delete_policy" ON imagerie_annotations;
CREATE POLICY "imagerie_annotations_delete_policy" ON imagerie_annotations FOR DELETE USING (true);

-- Politique pour imagerie_rapports
DROP POLICY IF EXISTS "imagerie_rapports_select_policy" ON imagerie_rapports;
CREATE POLICY "imagerie_rapports_select_policy" ON imagerie_rapports FOR SELECT USING (true);

DROP POLICY IF EXISTS "imagerie_rapports_insert_policy" ON imagerie_rapports;
CREATE POLICY "imagerie_rapports_insert_policy" ON imagerie_rapports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "imagerie_rapports_update_policy" ON imagerie_rapports;
CREATE POLICY "imagerie_rapports_update_policy" ON imagerie_rapports FOR UPDATE USING (true);

DROP POLICY IF EXISTS "imagerie_rapports_delete_policy" ON imagerie_rapports;
CREATE POLICY "imagerie_rapports_delete_policy" ON imagerie_rapports FOR DELETE USING (true);

-- =====================================================
-- BUCKET DE STOCKAGE POUR LES IMAGES
-- =====================================================

-- Créer le bucket de stockage pour l'imagerie
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imagerie', 
  'imagerie', 
  true, 
  52428800,  -- 50MB max pour les fichiers DICOM
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/dicom', 'application/octet-stream']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Politiques de stockage pour le bucket imagerie
DROP POLICY IF EXISTS "imagerie_bucket_read_policy" ON storage.objects;
CREATE POLICY "imagerie_bucket_read_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'imagerie');

DROP POLICY IF EXISTS "imagerie_bucket_insert_policy" ON storage.objects;
CREATE POLICY "imagerie_bucket_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'imagerie');

DROP POLICY IF EXISTS "imagerie_bucket_update_policy" ON storage.objects;
CREATE POLICY "imagerie_bucket_update_policy" ON storage.objects
  FOR UPDATE USING (bucket_id = 'imagerie');

DROP POLICY IF EXISTS "imagerie_bucket_delete_policy" ON storage.objects;
CREATE POLICY "imagerie_bucket_delete_policy" ON storage.objects
  FOR DELETE USING (bucket_id = 'imagerie');
