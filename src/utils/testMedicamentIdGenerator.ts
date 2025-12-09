/**
 * Script de test pour le générateur d'identifiants de médicaments
 */

import { MedicamentIdGenerator } from './medicamentIdGenerator';

// Test de la génération d'ID
console.log('=== Test du générateur d\'ID de médicaments ===\n');

// Test 1: Génération avec liste vide
console.log('Test 1: Génération avec liste vide');
const id1 = MedicamentIdGenerator.generateId([]);
console.log(`ID généré: ${id1}`);
console.log(`Format valide: ${MedicamentIdGenerator.isValidFormat(id1)}`);
console.log(`Numéro extrait: ${MedicamentIdGenerator.extractNumber(id1)}\n`);

// Test 2: Génération avec IDs existants
console.log('Test 2: Génération avec IDs existants');
const existingIds = ['MED000', 'MED001', 'MED003', 'MED005'];
const id2 = MedicamentIdGenerator.generateId(existingIds);
console.log(`IDs existants: ${existingIds.join(', ')}`);
console.log(`ID généré: ${id2}`);
console.log(`Format valide: ${MedicamentIdGenerator.isValidFormat(id2)}\n`);

// Test 3: Génération séquentielle
console.log('Test 3: Génération séquentielle');
const sequentialIds = [];
for (let i = 0; i < 5; i++) {
  const id = MedicamentIdGenerator.generateId(sequentialIds);
  sequentialIds.push(id);
  console.log(`ID ${i + 1}: ${id}`);
}
console.log(`Liste finale: ${sequentialIds.join(', ')}\n`);

// Test 4: Validation de formats
console.log('Test 4: Validation de formats');
const testIds = ['MED000', 'MED123', 'MED999', 'MED1000', 'INVALID', 'MED00', 'MED0000'];
testIds.forEach(id => {
  console.log(`${id}: ${MedicamentIdGenerator.isValidFormat(id) ? 'Valide' : 'Invalide'}`);
});
console.log();

// Test 5: Extraction de numéros
console.log('Test 5: Extraction de numéros');
const testNumbers = ['MED000', 'MED123', 'MED999'];
testNumbers.forEach(id => {
  const number = MedicamentIdGenerator.extractNumber(id);
  console.log(`${id} -> ${number}`);
});
console.log();

// Test 6: Génération à partir d'un numéro
console.log('Test 6: Génération à partir d\'un numéro');
const testNumbers2 = [0, 123, 999, 1000];
testNumbers2.forEach(num => {
  try {
    const id = MedicamentIdGenerator.generateFromNumber(num);
    console.log(`Numéro ${num} -> ${id}`);
  } catch (error) {
    console.log(`Numéro ${num} -> Erreur: ${error}`);
  }
});

console.log('\n=== Tests terminés ===');
