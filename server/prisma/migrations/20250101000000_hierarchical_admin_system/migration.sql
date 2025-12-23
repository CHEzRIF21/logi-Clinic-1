-- Migration: Système Hiérarchique Super-Admin / Admin Clinique
-- Date: 2025-01-XX
-- Description: Ajoute les champs pour le système de rôles hiérarchiques

-- ============================================
-- 1. MODIFICATION TABLE: User
-- ============================================

-- Ajouter les nouvelles colonnes à la table User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authUserId" TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nom" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "prenom" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialite" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telephone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adresse" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "actif" BOOLEAN DEFAULT true;

-- Rendre password nullable (authentification via Supabase Auth)
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Mettre à jour le rôle par défaut
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STAFF';

-- Créer les index
CREATE INDEX IF NOT EXISTS "User_authUserId_idx" ON "User"("authUserId");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
CREATE INDEX IF NOT EXISTS "User_clinicId_idx" ON "User"("clinicId");

-- ============================================
-- 2. MODIFICATION TABLE: Clinic
-- ============================================

ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "createdBySuperAdmin" TEXT;

-- ============================================
-- 3. CRÉATION TABLE: RegistrationRequest
-- ============================================

CREATE TABLE IF NOT EXISTS "RegistrationRequest" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "roleSouhaite" TEXT NOT NULL DEFAULT 'STAFF',
    "specialite" TEXT,
    "securityQuestions" JSONB,
    "clinicCode" TEXT,
    "clinicId" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- Contrainte d'unicité
ALTER TABLE "RegistrationRequest" 
ADD CONSTRAINT IF NOT EXISTS "RegistrationRequest_email_clinicCode_key" 
UNIQUE ("email", "clinicCode");

-- Clé étrangère
ALTER TABLE "RegistrationRequest" 
ADD CONSTRAINT IF NOT EXISTS "RegistrationRequest_clinicId_fkey" 
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index
CREATE INDEX IF NOT EXISTS "RegistrationRequest_clinicId_idx" ON "RegistrationRequest"("clinicId");
CREATE INDEX IF NOT EXISTS "RegistrationRequest_statut_idx" ON "RegistrationRequest"("statut");
CREATE INDEX IF NOT EXISTS "RegistrationRequest_email_idx" ON "RegistrationRequest"("email");

-- ============================================
-- 4. DONNÉES INITIALES
-- ============================================

-- Créer la Clinique du Campus
INSERT INTO "Clinic" ("id", "code", "name", "address", "phone", "email", "active", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'CAMPUS-001',
    'Clinique du Campus',
    'Quartier Arafat; rue opposée universite ESAE',
    '+229 90904344',
    'cliniquemedicalecampus@gmail.com',
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "address" = EXCLUDED."address",
    "phone" = EXCLUDED."phone",
    "email" = EXCLUDED."email",
    "updatedAt" = NOW();

