-- Migration: Ajout des champs de sécurité applicative à la table License
-- Date: 2024

-- Ajouter les champs appId et appSecret pour l'authentification applicative
ALTER TABLE "License"
ADD COLUMN IF NOT EXISTS "appId" TEXT,
ADD COLUMN IF NOT EXISTS "appSecret" TEXT,
ADD COLUMN IF NOT EXISTS "revoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "revokedReason" TEXT,
ADD COLUMN IF NOT EXISTS "clinicId" TEXT;

-- Créer un index unique sur appId
CREATE UNIQUE INDEX IF NOT EXISTS "License_appId_key" ON "License"("appId");

-- Créer des index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS "License_appId_idx" ON "License"("appId");
CREATE INDEX IF NOT EXISTS "License_clinicId_idx" ON "License"("clinicId");

-- Commentaire: Les champs appId et appSecret doivent être remplis lors de la création d'une licence
-- via le service licenseService.createLicense()

