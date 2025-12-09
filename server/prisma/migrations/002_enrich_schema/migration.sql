-- Migration pour enrichir le schéma avec les nouvelles spécifications

-- Ajouter champ age et phones à Patient
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "age" INTEGER;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "phones" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Créer table Assurance
CREATE TABLE IF NOT EXISTS "Assurance" (
    "id" TEXT NOT NULL,
    "organisme" TEXT NOT NULL,
    "numeroPolice" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assurance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Assurance_numeroPolice_key" ON "Assurance"("numeroPolice");

-- Ajouter relation Patient -> Assurance
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "assuranceId" TEXT;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_assuranceId_fkey" FOREIGN KEY ("assuranceId") REFERENCES "Assurance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ajouter champs à Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "compteComptable" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stockMin" INTEGER DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stockMax" INTEGER DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "consommable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Créer table ProductPriceVersion
CREATE TABLE IF NOT EXISTS "ProductPriceVersion" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPriceVersion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProductPriceVersion" ADD CONSTRAINT "ProductPriceVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "ProductPriceVersion_productId_idx" ON "ProductPriceVersion"("productId");

-- Ajouter champs à Operation
ALTER TABLE "Operation" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Operation" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Operation_date_idx" ON "Operation"("date");
CREATE INDEX IF NOT EXISTS "Operation_status_idx" ON "Operation"("status");

-- Ajouter champs à Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "aib" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "typeFacture" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "normalized" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Invoice_dateEmission_idx" ON "Invoice"("dateEmission");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");

-- Ajouter taxSpecifique à InvoiceLine
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "taxSpecifique" DECIMAL(12,2) NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- Ajouter CHEQUE aux modes de paiement (déjà géré au niveau application)

-- Créer table LigneBudgetaire (DOIT être créée AVANT CaisseEntry)
CREATE TABLE IF NOT EXISTS "LigneBudgetaire" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LigneBudgetaire_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LigneBudgetaire_code_key" ON "LigneBudgetaire"("code");

-- Créer table CaisseEntry (après LigneBudgetaire pour la contrainte FK)
CREATE TABLE IF NOT EXISTS "CaisseEntry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "ligneBudgetId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaisseEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CaisseEntry" ADD CONSTRAINT "CaisseEntry_ligneBudgetId_fkey" FOREIGN KEY ("ligneBudgetId") REFERENCES "LigneBudgetaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "CaisseEntry_date_idx" ON "CaisseEntry"("date");
CREATE INDEX IF NOT EXISTS "CaisseEntry_type_idx" ON "CaisseEntry"("type");

-- Créer table Coupon
CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "patientId" TEXT,
    "montant" DECIMAL(12,2) NOT NULL,
    "utilise" BOOLEAN NOT NULL DEFAULT false,
    "dateUtilisation" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_numero_key" ON "Coupon"("numero");
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Coupon_patientId_idx" ON "Coupon"("patientId");

-- Ajouter champs à User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Créer table AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- Mettre à jour les âges existants (approximatif)
UPDATE "Patient" SET "age" = EXTRACT(YEAR FROM AGE("dob")) WHERE "age" IS NULL;

