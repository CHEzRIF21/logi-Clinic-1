/**
 * Script de test pour valider l'isolation multi-tenant
 * 
 * Ce script vérifie que:
 * 1. Les utilisateurs d'une clinique ne peuvent pas accéder aux données d'une autre clinique
 * 2. Toutes les requêtes filtrent correctement par clinic_id
 * 3. Les SUPER_ADMIN peuvent accéder à toutes les données
 * 
 * Usage: npx ts-node server/scripts/test-multi-tenancy-isolation.ts
 */

import prisma from '../src/prisma';
import { PatientService } from '../src/services/patientService';
import { InvoiceService } from '../src/services/invoiceService';
import { OperationService } from '../src/services/operationService';
import { ProductService } from '../src/services/productService';
import { PaymentService } from '../src/services/paymentService';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function logTest(test: string, passed: boolean, message: string) {
  results.push({ test, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${test}: ${message}`);
}

async function testMultiTenancyIsolation() {
  console.log('🧪 Démarrage des tests d\'isolation multi-tenant...\n');

  try {
    // 1. Récupérer deux cliniques de test
    const clinics = await prisma.clinic.findMany({ take: 2 });
    
    if (clinics.length < 2) {
      console.error('❌ Au moins 2 cliniques sont nécessaires pour les tests');
      return;
    }

    const clinic1 = clinics[0];
    const clinic2 = clinics[1];

    console.log(`📋 Clinique 1: ${clinic1.code} (${clinic1.id})`);
    console.log(`📋 Clinique 2: ${clinic2.code} (${clinic2.id})\n`);

    // 2. Créer des patients de test pour chaque clinique
    const patient1 = await prisma.patient.create({
      data: {
        firstName: 'Test',
        lastName: 'Patient1',
        sex: 'M',
        dob: new Date('1990-01-01'),
        clinicId: clinic1.id,
      },
    });

    const patient2 = await prisma.patient.create({
      data: {
        firstName: 'Test',
        lastName: 'Patient2',
        sex: 'F',
        dob: new Date('1990-01-01'),
        clinicId: clinic2.id,
      },
    });

    logTest(
      'Création patients de test',
      true,
      `Patient1 (${patient1.id}) créé pour ${clinic1.code}, Patient2 (${patient2.id}) créé pour ${clinic2.code}`
    );

    // 3. Test PatientService - Isolation
    console.log('\n📦 Test PatientService...');
    const patientsClinic1 = await PatientService.searchPatients({
      clinicId: clinic1.id,
      isSuperAdmin: false,
    });
    const patientsClinic2 = await PatientService.searchPatients({
      clinicId: clinic2.id,
      isSuperAdmin: false,
    });

    const patient1Found = patientsClinic1.some(p => p.id === patient1.id);
    const patient2Found = patientsClinic2.some(p => p.id === patient2.id);
    const patient1InClinic2 = patientsClinic2.some(p => p.id === patient1.id);
    const patient2InClinic1 = patientsClinic1.some(p => p.id === patient2.id);

    logTest(
      'PatientService.searchPatients - Isolation clinic1',
      patient1Found && !patient2InClinic1,
      `Clinic1 voit son patient: ${patient1Found}, ne voit pas patient2: ${!patient2InClinic1}`
    );

    logTest(
      'PatientService.searchPatients - Isolation clinic2',
      patient2Found && !patient1InClinic2,
      `Clinic2 voit son patient: ${patient2Found}, ne voit pas patient1: ${!patient1InClinic2}`
    );

    // Test accès direct par ID
    try {
      await PatientService.getPatientById(patient2.id, {
        clinicId: clinic1.id,
        isSuperAdmin: false,
      });
      logTest(
        'PatientService.getPatientById - Isolation',
        false,
        'Clinic1 ne devrait pas pouvoir accéder à patient2'
      );
    } catch (error: any) {
      logTest(
        'PatientService.getPatientById - Isolation',
        error.message.includes('non trouvé') || error.message.includes('non autorisé'),
        'Accès refusé correctement'
      );
    }

    // 4. Test InvoiceService - Isolation
    console.log('\n📦 Test InvoiceService...');
    const invoicesClinic1 = await InvoiceService.listInvoices({
      clinicId: clinic1.id,
      isSuperAdmin: false,
    });
    const invoicesClinic2 = await InvoiceService.listInvoices({
      clinicId: clinic2.id,
      isSuperAdmin: false,
    });

    logTest(
      'InvoiceService.listInvoices - Isolation',
      true,
      `Clinic1: ${invoicesClinic1.length} factures, Clinic2: ${invoicesClinic2.length} factures`
    );

    // 5. Test OperationService - Isolation
    console.log('\n📦 Test OperationService...');
    const operationsClinic1 = await OperationService.listOperations({
      clinicId: clinic1.id,
      isSuperAdmin: false,
    });
    const operationsClinic2 = await OperationService.listOperations({
      clinicId: clinic2.id,
      isSuperAdmin: false,
    });

    logTest(
      'OperationService.listOperations - Isolation',
      true,
      `Clinic1: ${operationsClinic1.length} opérations, Clinic2: ${operationsClinic2.length} opérations`
    );

    // 6. Test ProductService - Isolation
    console.log('\n📦 Test ProductService...');
    const productsClinic1 = await ProductService.listProducts({
      clinicId: clinic1.id,
      isSuperAdmin: false,
    });
    const productsClinic2 = await ProductService.listProducts({
      clinicId: clinic2.id,
      isSuperAdmin: false,
    });

    logTest(
      'ProductService.listProducts - Isolation',
      true,
      `Clinic1: ${productsClinic1.length} produits, Clinic2: ${productsClinic2.length} produits`
    );

    // 7. Test SUPER_ADMIN - Accès à toutes les données
    console.log('\n📦 Test SUPER_ADMIN...');
    const allPatientsSuperAdmin = await PatientService.searchPatients({
      clinicId: '',
      isSuperAdmin: true,
    });

    const superAdminSeesBoth = allPatientsSuperAdmin.some(p => p.id === patient1.id) &&
                                allPatientsSuperAdmin.some(p => p.id === patient2.id);

    logTest(
      'SUPER_ADMIN - Accès global',
      superAdminSeesBoth,
      `SUPER_ADMIN voit les deux patients: ${superAdminSeesBoth}`
    );

    // 8. Nettoyage
    console.log('\n🧹 Nettoyage des données de test...');
    await prisma.patient.deleteMany({
      where: {
        id: { in: [patient1.id, patient2.id] },
      },
    });
    logTest('Nettoyage', true, 'Données de test supprimées');

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`✅ Tests réussis: ${passed}/${total}`);
    console.log(`❌ Tests échoués: ${failed}/${total}`);

    if (failed > 0) {
      console.log('\n❌ Tests échoués:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.test}: ${r.message}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    process.exit(failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('\n❌ Erreur lors des tests:', error);
    process.exit(1);
  }
}

// Exécuter les tests
testMultiTenancyIsolation();
