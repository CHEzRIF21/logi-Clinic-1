-- ============================================
-- MIGRATION: Ajout de la colonne categorie_motif si elle n'existe pas
-- VERSION: 29
-- DATE: 2024-01-15
-- ============================================
-- Cette migration ajoute la colonne categorie_motif à la table consultations
-- si elle n'existe pas déjà
-- ============================================

-- Vérifier et ajouter la colonne categorie_motif si elle n'existe pas
DO $$
BEGIN
  -- Vérifier si la colonne existe déjà
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'consultations' 
      AND column_name = 'categorie_motif'
  ) THEN
    -- Ajouter la colonne
    ALTER TABLE consultations 
    ADD COLUMN categorie_motif VARCHAR(100);
    
    RAISE NOTICE '✅ Colonne categorie_motif ajoutée à la table consultations';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne categorie_motif existe déjà dans la table consultations';
  END IF;
END $$;

-- Vérifier et ajouter la colonne created_at si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'consultations' 
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE '✅ Colonne created_at ajoutée à la table consultations';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne created_at existe déjà dans la table consultations';
  END IF;
END $$;

-- Vérifier et ajouter la colonne created_by si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'consultations' 
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN created_by UUID REFERENCES users(id);
    
    RAISE NOTICE '✅ Colonne created_by ajoutée à la table consultations';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne created_by existe déjà dans la table consultations';
  END IF;
END $$;

-- Vérifier et ajouter la colonne opened_at si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'consultations' 
      AND column_name = 'opened_at'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE '✅ Colonne opened_at ajoutée à la table consultations';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne opened_at existe déjà dans la table consultations';
  END IF;
END $$;

-- Rafraîchir le cache du schéma Supabase (via commentaire pour documentation)
-- Note: Supabase rafraîchit automatiquement le cache après les migrations
-- Si le problème persiste, redémarrer le projet Supabase ou attendre quelques minutes

