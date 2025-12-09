/*
  Warnings:

  - You are about to drop the column `assurance` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Patient` table. All the data in the column will be lost.
  - Made the column `appId` on table `License` required. This step will fail if there are existing NULL values in that column.
  - Made the column `appSecret` on table `License` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "License" ALTER COLUMN "appId" SET NOT NULL,
ALTER COLUMN "appSecret" SET NOT NULL;

-- AlterTable
ALTER TABLE "Operation" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "assurance",
DROP COLUMN "phone",
ALTER COLUMN "phones" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clinicId" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicPricing" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "tarifBase" DECIMAL(12,2) NOT NULL,
    "unite" TEXT NOT NULL DEFAULT 'unité',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicPricingHistory" (
    "id" TEXT NOT NULL,
    "clinicPricingId" TEXT NOT NULL,
    "tarifAncien" DECIMAL(12,2) NOT NULL,
    "tarifNouveau" DECIMAL(12,2) NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),
    "modifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicPricingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_code_key" ON "Clinic"("code");

-- CreateIndex
CREATE INDEX "Clinic_code_idx" ON "Clinic"("code");

-- CreateIndex
CREATE INDEX "Clinic_active_idx" ON "Clinic"("active");

-- CreateIndex
CREATE INDEX "ClinicPricing_clinicId_idx" ON "ClinicPricing"("clinicId");

-- CreateIndex
CREATE INDEX "ClinicPricing_serviceId_idx" ON "ClinicPricing"("serviceId");

-- CreateIndex
CREATE INDEX "ClinicPricing_clinicId_serviceId_idx" ON "ClinicPricing"("clinicId", "serviceId");

-- CreateIndex
CREATE INDEX "ClinicPricing_active_idx" ON "ClinicPricing"("active");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicPricing_clinicId_serviceId_key" ON "ClinicPricing"("clinicId", "serviceId");

-- CreateIndex
CREATE INDEX "ClinicPricingHistory_clinicPricingId_idx" ON "ClinicPricingHistory"("clinicPricingId");

-- CreateIndex
CREATE INDEX "ClinicPricingHistory_dateDebut_idx" ON "ClinicPricingHistory"("dateDebut");

-- CreateIndex
CREATE INDEX "ClinicPricingHistory_modifiedById_idx" ON "ClinicPricingHistory"("modifiedById");

-- CreateIndex
CREATE INDEX "OperationLine_operationId_idx" ON "OperationLine"("operationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicPricing" ADD CONSTRAINT "ClinicPricing_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicPricingHistory" ADD CONSTRAINT "ClinicPricingHistory_clinicPricingId_fkey" FOREIGN KEY ("clinicPricingId") REFERENCES "ClinicPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicPricingHistory" ADD CONSTRAINT "ClinicPricingHistory_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
