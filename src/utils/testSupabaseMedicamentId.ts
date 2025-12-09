/**
 * Script de test pour la génération d'ID de médicaments dans Supabase
 */

import { MedicamentService } from '../services/medicamentService';
import { MedicamentIdGenerator } from './medicamentIdGenerator';

async function testSupabaseMedicamentIdGeneration() {
  try {
    console.log('=== Test de génération d\'ID de médicaments Supabase ===\n');

    // Test 1: Récupérer les codes existants
    console.log('Test 1: Récupération des codes existants');
    const existingCodes = await MedicamentService.getAllMedicamentCodes();
    console.log(`Codes existants: ${existingCodes.join(', ') || 'Aucun'}\n`);

    // Test 2: Génération d'un nouvel ID
    console.log('Test 2: Génération d\'un nouvel ID');
    const newId = MedicamentIdGenerator.generateId(existingCodes);
    console.log(`Nouvel ID généré: ${newId}\n`);

    // Test 3: Création d'un médicament de test
    console.log('Test 3: Création d\'un médicament de test');
    const testMedicament = {
      code: newId,
      nom: 'Test Médicament',
      forme: 'Comprimé',
      dosage: '500mg',
      unite: 'Boîte',
      fournisseur: 'Test Pharma',
      prix_unitaire: 1000,
      seuil_alerte: 10,
      seuil_rupture: 5,
      emplacement: 'Test Rayon',
      categorie: 'Test',
      prescription_requise: false,
    };

    try {
      const createdMedicament = await MedicamentService.createMedicament(testMedicament);
      console.log(`Médicament créé avec succès: ${createdMedicament.code} - ${createdMedicament.nom}\n`);

      // Test 4: Vérification de la création
      console.log('Test 4: Vérification de la création');
      const retrievedMedicament = await MedicamentService.getMedicamentById(createdMedicament.id);
      if (retrievedMedicament) {
        console.log(`Médicament récupéré: ${retrievedMedicament.code} - ${retrievedMedicament.nom}\n`);
      }

      // Test 5: Test de génération automatique (sans code)
      console.log('Test 5: Test de génération automatique (sans code)');
      const autoMedicament = {
        code: '', // Code vide pour tester la génération automatique
        nom: 'Médicament Auto',
        forme: 'Sirop',
        dosage: '100ml',
        unite: 'Flacon',
        fournisseur: 'Auto Pharma',
        prix_unitaire: 2000,
        seuil_alerte: 5,
        seuil_rupture: 2,
        emplacement: 'Auto Rayon',
        categorie: 'Auto',
        prescription_requise: true,
      };

      const autoCreatedMedicament = await MedicamentService.createMedicament(autoMedicament);
      console.log(`Médicament auto-créé: ${autoCreatedMedicament.code} - ${autoCreatedMedicament.nom}\n`);

      // Test 6: Vérification de la séquence
      console.log('Test 6: Vérification de la séquence');
      const allCodes = await MedicamentService.getAllMedicamentCodes();
      console.log(`Tous les codes: ${allCodes.join(', ')}\n`);

      // Test 7: Nettoyage (suppression des médicaments de test)
      console.log('Test 7: Nettoyage des médicaments de test');
      await MedicamentService.deleteMedicament(createdMedicament.id);
      console.log('Premier médicament de test supprimé');
      
      await MedicamentService.deleteMedicament(autoCreatedMedicament.id);
      console.log('Deuxième médicament de test supprimé\n');

      console.log('=== Tests terminés avec succès ===');

    } catch (createError) {
      console.error('Erreur lors de la création du médicament:', createError);
    }

  } catch (error) {
    console.error('Erreur lors des tests:', error);
  }
}

// Exécuter les tests si le fichier est exécuté directement
if (typeof window === 'undefined') {
  testSupabaseMedicamentIdGeneration();
}

export { testSupabaseMedicamentIdGeneration };
