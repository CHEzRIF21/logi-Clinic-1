-- Migration: Création du bucket Supabase Storage pour les fichiers patients
-- Date: 2024-12-20
-- Description: Script SQL pour créer le bucket de stockage des fichiers patients
-- Note: Ce script doit être exécuté manuellement dans le dashboard Supabase ou via l'API

-- IMPORTANT: Ce script nécessite les privilèges superuser ou l'utilisation de l'API Supabase Storage
-- Pour créer le bucket via SQL, vous devez utiliser l'extension storage

-- Créer le bucket (nécessite les privilèges appropriés)
-- Note: Cette commande peut nécessiter d'être exécutée via l'API Supabase plutôt que directement en SQL

-- Alternative: Créer le bucket via le dashboard Supabase :
-- 1. Aller dans Storage > Buckets
-- 2. Cliquer sur "New bucket"
-- 3. Nom: patient-files
-- 4. Public: false (recommandé pour la sécurité)
-- 5. File size limit: selon vos besoins (ex: 10MB)
-- 6. Allowed MIME types: */* (ou spécifier selon vos besoins)

-- Politique RLS pour permettre l'accès aux fichiers (à adapter selon vos besoins)
-- Note: Ces politiques doivent être créées après la création du bucket

-- Exemple de politique pour permettre la lecture des fichiers aux utilisateurs authentifiés
-- CREATE POLICY "Allow authenticated users to read patient files"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'patient-files');

-- Exemple de politique pour permettre l'upload aux utilisateurs authentifiés
-- CREATE POLICY "Allow authenticated users to upload patient files"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'patient-files');

-- Exemple de politique pour permettre la suppression aux utilisateurs authentifiés
-- CREATE POLICY "Allow authenticated users to delete patient files"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'patient-files');

-- Note: Les politiques RLS doivent être adaptées selon votre modèle de sécurité
-- et vos besoins spécifiques d'accès aux fichiers.

