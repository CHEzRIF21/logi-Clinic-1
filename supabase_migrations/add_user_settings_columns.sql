-- Migration: Ajout des colonnes pour les paramètres utilisateur
-- Date: 2025-01-XX
-- Description: Ajout de la colonne language et avatar_url à la table users

-- Ajouter la colonne language si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'language'
  ) THEN
    ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'fr';
    COMMENT ON COLUMN users.language IS 'Langue préférée de l''utilisateur (fr, en, etc.)';
  END IF;
END $$;

-- Ajouter la colonne avatar_url si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
    COMMENT ON COLUMN users.avatar_url IS 'URL de la photo de profil de l''utilisateur (stockée dans Supabase Storage)';
  END IF;
END $$;

-- Créer le bucket avatars dans Supabase Storage si nécessaire
-- Note: Cette opération doit être effectuée manuellement dans le dashboard Supabase
-- ou via l'API Supabase Storage

-- Créer une politique RLS pour le bucket avatars (si le bucket existe)
-- Note: Les politiques de storage doivent être créées via le dashboard Supabase
-- ou via l'API Supabase Storage
