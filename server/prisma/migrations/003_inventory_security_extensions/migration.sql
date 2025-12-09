-- Compléter la table Product avec les champs nécessaires au suivi avancé
ALTER TABLE "Product"
ADD COLUMN "form" TEXT,
ADD COLUMN "dosage" TEXT,
ADD COLUMN "packaging" TEXT,
ADD COLUMN "manufacturer" TEXT,
ADD COLUMN "pricePublic" DECIMAL(12,2),
ADD COLUMN "priceCession" DECIMAL(12,2),
ADD COLUMN "minStock" INTEGER NOT NULL DEFAULT 0;

-- Index supplémentaires pour les performances produit
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_code_idx" ON "Product"("code");

-- Gestion des lots de médicaments
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantityUsed" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "dateEntry" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datePeremption" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- Suivi des mouvements de stock
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotId" TEXT,
    "type" TEXT NOT NULL,
    "reference" TEXT,
    "qty" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- Gestion des fournisseurs et commandes
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "items" JSONB NOT NULL,
    "totalAmount" DECIMAL(12,2),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3),
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- Catégories produits configurables
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- Paramètres généraux de la pharmacie
CREATE TABLE "PharmacySettings" (
    "id" TEXT NOT NULL,
    "alertExpirationDays" INTEGER NOT NULL DEFAULT 30,
    "minStockAlertRatio" DECIMAL(5,2) NOT NULL DEFAULT 1.2,
    "stockMethod" TEXT NOT NULL DEFAULT 'FIFO',
    "enableNotifications" BOOLEAN NOT NULL DEFAULT true,
    "notificationEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "PharmacySettings_pkey" PRIMARY KEY ("id")
);

-- File d’attente pour les prescriptions
CREATE TABLE "PrescriptionQueue" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT,
    "prescriptionId" TEXT,
    "patientId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reservedBy" TEXT,
    "dispensedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dispensedAt" TIMESTAMP(3),
    CONSTRAINT "PrescriptionQueue_pkey" PRIMARY KEY ("id")
);

-- Gestion des licences et tentatives de déploiement
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "allowedDomains" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "maxDeployments" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeploymentAttempt" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "licenseKey" TEXT,
    "licenseId" TEXT,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeploymentAttempt_pkey" PRIMARY KEY ("id")
);

-- Index pour optimiser les recherches
CREATE UNIQUE INDEX "Lot_lotNumber_productId_key" ON "Lot"("lotNumber", "productId");
CREATE INDEX "Lot_productId_idx" ON "Lot"("productId");
CREATE INDEX "Lot_datePeremption_idx" ON "Lot"("datePeremption");
CREATE INDEX "Lot_status_idx" ON "Lot"("status");

CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX "StockMovement_lotId_idx" ON "StockMovement"("lotId");
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");
CREATE INDEX "StockMovement_reference_idx" ON "StockMovement"("reference");
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");
CREATE INDEX "Order_supplierId_idx" ON "Order"("supplierId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");
CREATE INDEX "ProductCategory_name_idx" ON "ProductCategory"("name");

CREATE UNIQUE INDEX "PharmacySettings_id_key" ON "PharmacySettings"("id");

CREATE INDEX "PrescriptionQueue_status_idx" ON "PrescriptionQueue"("status");
CREATE INDEX "PrescriptionQueue_patientId_idx" ON "PrescriptionQueue"("patientId");
CREATE INDEX "PrescriptionQueue_createdAt_idx" ON "PrescriptionQueue"("createdAt");

CREATE UNIQUE INDEX "License_licenseKey_key" ON "License"("licenseKey");
CREATE INDEX "License_licenseKey_idx" ON "License"("licenseKey");
CREATE INDEX "License_domain_idx" ON "License"("domain");
CREATE INDEX "License_active_idx" ON "License"("active");

CREATE INDEX "DeploymentAttempt_domain_idx" ON "DeploymentAttempt"("domain");
CREATE INDEX "DeploymentAttempt_licenseKey_idx" ON "DeploymentAttempt"("licenseKey");
CREATE INDEX "DeploymentAttempt_licenseId_idx" ON "DeploymentAttempt"("licenseId");
CREATE INDEX "DeploymentAttempt_success_idx" ON "DeploymentAttempt"("success");
CREATE INDEX "DeploymentAttempt_createdAt_idx" ON "DeploymentAttempt"("createdAt");

-- Contraintes de clé étrangère
ALTER TABLE "Lot"
ADD CONSTRAINT "Lot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockMovement"
ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "StockMovement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DeploymentAttempt"
ADD CONSTRAINT "DeploymentAttempt_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE SET NULL ON UPDATE CASCADE;

