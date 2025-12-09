-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "ifu" TEXT,
    "assurance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "taxPercent" DECIMAL(5,2),
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "createdBy" TEXT,
    "invoiceId" TEXT,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationLine" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OperationLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "totalHT" DECIMAL(12,2) NOT NULL,
    "totalTax" DECIMAL(12,2) NOT NULL,
    "totalDiscount" DECIMAL(12,2) NOT NULL,
    "totalTTC" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "modePayment" TEXT,
    "comment" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Operation_reference_key" ON "Operation"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Operation_patientId_idx" ON "Operation"("patientId");

-- CreateIndex
CREATE INDEX "Invoice_patientId_idx" ON "Invoice"("patientId");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationLine" ADD CONSTRAINT "OperationLine_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationLine" ADD CONSTRAINT "OperationLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed data
-- Admin user (password: admin123 - hash bcrypt: $2b$10$rOzJqJqJqJqJqJqJqJqJqO)
INSERT INTO "User" (id, name, email, password, role, "createdAt") VALUES
('00000000-0000-0000-0000-000000000001', 'Administrateur', 'admin@clinic.local', '$2b$10$rOzJqJqJqJqJqJqJqJqJqO', 'ADMIN', NOW());

-- Products
INSERT INTO "Product" (id, code, label, category, "subCategory", unit, price, "taxPercent", "stockQty", active, "createdAt") VALUES
('10000000-0000-0000-0000-000000000001', 'CONS-GEN', 'Consultation Générale', 'Acte', NULL, 'unité', 2000.00, 0.00, 0, true, NOW()),
('10000000-0000-0000-0000-000000000002', 'CONS-SPEC', 'Consultation Spécialisée', 'Acte', NULL, 'unité', 5000.00, 0.00, 0, true, NOW()),
('10000000-0000-0000-0000-000000000003', 'PARA-500', 'Paracétamol 500mg', 'Medicament', 'Antalgique', 'boîte', 500.00, 0.00, 150, true, NOW()),
('10000000-0000-0000-0000-000000000004', 'AMOX-500', 'Amoxicilline 500mg', 'Medicament', 'Antibiotique', 'boîte', 1200.00, 0.00, 80, true, NOW()),
('10000000-0000-0000-0000-000000000005', 'LAB-NFS', 'Numération Formule Sanguine', 'Examen', 'Hématologie', 'unité', 3000.00, 0.00, 0, true, NOW()),
('10000000-0000-0000-0000-000000000006', 'LAB-GLY', 'Glycémie', 'Examen', 'Biochimie', 'unité', 1500.00, 0.00, 0, true, NOW()),
('10000000-0000-0000-0000-000000000007', 'CHAM-SIMP', 'Chambre Simple', 'Chambre', NULL, 'jour', 5000.00, 0.00, 10, true, NOW()),
('10000000-0000-0000-0000-000000000008', 'CONS-1', 'Consommable Médical', 'Consommable', NULL, 'unité', 500.00, 0.00, 200, true, NOW());

-- Patients
INSERT INTO "Patient" (id, "firstName", "lastName", sex, dob, phone, address, "createdAt") VALUES
('20000000-0000-0000-0000-000000000001', 'Fatou', 'TRAORE', 'F', '1990-05-15', '70123456', 'Abidjan, Cocody', NOW()),
('20000000-0000-0000-0000-000000000002', 'Moussa', 'DIABATE', 'M', '1985-12-03', '70234567', 'Abidjan, Yopougon', NOW());

