-- Migration: Ajout des sections Accompagnant et Personne à prévenir
-- Date: 2024-12-20
-- Description: Ajout des colonnes pour l'accompagnant et la personne à prévenir dans la table patients

-- Ajout des colonnes pour l'accompagnant
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

-- Commentaires sur les nouvelles colonnes
COMMENT ON COLUMN patients.accompagnant_nom IS 'Nom de famille de l''accompagnant';
COMMENT ON COLUMN patients.accompagnant_prenoms IS 'Prénoms de l''accompagnant';
COMMENT ON COLUMN patients.accompagnant_filiation IS 'Lien avec le patient (père, mère, conjoint, frère/sœur, ami, etc.)';
COMMENT ON COLUMN patients.accompagnant_telephone IS 'Numéro de téléphone de l''accompagnant';
COMMENT ON COLUMN patients.accompagnant_quartier IS 'Adresse ou zone d''habitation de l''accompagnant';
COMMENT ON COLUMN patients.accompagnant_profession IS 'Profession ou activité principale de l''accompagnant';

COMMENT ON COLUMN patients.personne_prevenir_option IS 'Option: identique à l''accompagnant ou autre';
COMMENT ON COLUMN patients.personne_prevenir_nom IS 'Nom de famille de la personne à prévenir';
COMMENT ON COLUMN patients.personne_prevenir_prenoms IS 'Prénoms de la personne à prévenir';
COMMENT ON COLUMN patients.personne_prevenir_filiation IS 'Lien avec le patient';
COMMENT ON COLUMN patients.personne_prevenir_telephone IS 'Numéro de téléphone de la personne à prévenir';
COMMENT ON COLUMN patients.personne_prevenir_quartier IS 'Adresse ou lieu d''habitation de la personne à prévenir';
COMMENT ON COLUMN patients.personne_prevenir_profession IS 'Profession ou activité principale de la personne à prévenir';

