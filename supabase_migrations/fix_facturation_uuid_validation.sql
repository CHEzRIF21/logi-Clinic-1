-- Migration: Correction de la validation UUID pour les factures
-- Date: 2024-12-21
-- Description: S'assurer que tous les champs UUID sont correctement configurés

-- Vérifier et corriger la table factures si nécessaire
DO $$
BEGIN
  -- Vérifier si la colonne patient_id existe et est de type UUID
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'factures' 
    AND column_name = 'patient_id'
    AND data_type != 'uuid'
  ) THEN
    -- Convertir les valeurs invalides en NULL avant de changer le type
    UPDATE factures 
    SET patient_id = NULL 
    WHERE patient_id IS NOT NULL 
    AND patient_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    -- Changer le type de la colonne
    ALTER TABLE factures 
    ALTER COLUMN patient_id TYPE UUID USING patient_id::uuid;
  END IF;
END $$;

-- Vérifier et corriger la table paiements si nécessaire
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'paiements' 
    AND column_name = 'facture_id'
    AND data_type != 'uuid'
  ) THEN
    UPDATE paiements 
    SET facture_id = NULL 
    WHERE facture_id IS NOT NULL 
    AND facture_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    ALTER TABLE paiements 
    ALTER COLUMN facture_id TYPE UUID USING facture_id::uuid;
  END IF;
END $$;

-- Ajouter une contrainte CHECK pour valider le format UUID si elle n'existe pas déjà
DO $$
BEGIN
  -- Pour factures.patient_id
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'check_factures_patient_id_uuid'
  ) THEN
    ALTER TABLE factures 
    ADD CONSTRAINT check_factures_patient_id_uuid 
    CHECK (
      patient_id IS NULL OR 
      patient_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    );
  END IF;
END $$;

-- Créer une fonction pour valider les UUID avant insertion
CREATE OR REPLACE FUNCTION validate_uuid(uuid_text TEXT)
RETURNS UUID AS $$
BEGIN
  IF uuid_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF uuid_text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid UUID format: %', uuid_text;
  END IF;
  
  RETURN uuid_text::UUID;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

