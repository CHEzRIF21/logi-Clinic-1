#!/usr/bin/env node

/**
 * Script pour obfusquer le code JavaScript après le build
 * Nécessite: npm install -g javascript-obfuscator
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildDir = path.join(__dirname, '../client/dist');
const jsDir = path.join(buildDir, 'assets');

console.log('🔐 Démarrage de l\'obfuscation du code...');

// Vérifier si javascript-obfuscator est installé
try {
  execSync('javascript-obfuscator --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ javascript-obfuscator n\'est pas installé.');
  console.log('📦 Installation: npm install -g javascript-obfuscator');
  process.exit(1);
}

// Trouver tous les fichiers JS dans le dossier assets
function findJSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findJSFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

const jsFiles = findJSFiles(jsDir);

if (jsFiles.length === 0) {
  console.log('⚠️  Aucun fichier JavaScript trouvé dans le build.');
  process.exit(0);
}

console.log(`📦 ${jsFiles.length} fichier(s) JavaScript trouvé(s).`);

// Configuration de l'obfuscation
const obfuscationConfig = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false, // Désactivé pour éviter les problèmes de debug
  debugProtectionInterval: 0,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

// Créer un fichier de configuration temporaire
const configPath = path.join(__dirname, 'obfuscator-config.json');
fs.writeFileSync(configPath, JSON.stringify(obfuscationConfig, null, 2));

// Obfusquer chaque fichier
let successCount = 0;
let errorCount = 0;

for (const filePath of jsFiles) {
  try {
    const relativePath = path.relative(buildDir, filePath);
    console.log(`  🔒 Obfuscation de ${relativePath}...`);
    
    // Créer une sauvegarde
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    
    // Obfusquer
    execSync(
      `javascript-obfuscator "${filePath}" --output "${filePath}" --config "${configPath}"`,
      { stdio: 'ignore' }
    );
    
    // Supprimer la sauvegarde si succès
    fs.unlinkSync(backupPath);
    successCount++;
  } catch (error) {
    console.error(`  ❌ Erreur lors de l'obfuscation de ${filePath}:`, error.message);
    errorCount++;
    
    // Restaurer la sauvegarde en cas d'erreur
    const backupPath = filePath + '.backup';
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, filePath);
      fs.unlinkSync(backupPath);
    }
  }
}

// Nettoyer le fichier de configuration temporaire
fs.unlinkSync(configPath);

console.log('\n✅ Obfuscation terminée!');
console.log(`   ✓ ${successCount} fichier(s) obfusqué(s)`);
if (errorCount > 0) {
  console.log(`   ✗ ${errorCount} erreur(s)`);
}

