#!/usr/bin/env node

/**
 * Script d'aide pour configurer Prisma avec Supabase
 * 
 * Usage: node setup-prisma.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🔗 Configuration Prisma avec Supabase\n');
  console.log('Ce script va vous aider à configurer votre fichier .env\n');

  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');

  // Vérifier si .env existe déjà
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  Le fichier .env existe déjà. Voulez-vous le remplacer ? (o/N): ');
    if (overwrite.toLowerCase() !== 'o' && overwrite.toLowerCase() !== 'oui') {
      console.log('❌ Configuration annulée.');
      rl.close();
      return;
    }
  }

  console.log('\n📋 Informations nécessaires :\n');
  console.log('1. Allez sur https://app.supabase.com');
  console.log('2. Sélectionnez votre projet (bnfgemmlokvetmohiqch)');
  console.log('3. Allez dans Settings > Database');
  console.log('4. Copiez la "Connection string" (Connection pooling recommandé)\n');

  const databaseUrl = await question('🔑 Collez votre DATABASE_URL (ou appuyez sur Entrée pour utiliser l\'exemple): ');
  
  const finalDatabaseUrl = databaseUrl.trim() || 'postgresql://postgres:[PASSWORD]@db.bnfgemmlokvetmohiqch.supabase.co:5432/postgres?schema=public';

  // Lire .env.example si il existe
  let envContent = '';
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
    // Remplacer la DATABASE_URL
    envContent = envContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL="${finalDatabaseUrl}"`
    );
  } else {
    // Créer un .env basique
    envContent = `# Configuration Prisma - Base de données Supabase
DATABASE_URL="${finalDatabaseUrl}"

# Configuration du serveur
PORT=3000
NODE_ENV=development

# Configuration JWT
JWT_SECRET=your-secret-key-change-in-production

# Configuration CORS
CORS_ORIGIN=http://localhost:5173

# Configuration Transcription Vocale
SPEECH_TO_TEXT_API_KEY=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
SPEECH_TO_TEXT_PROVIDER=openai
SPEECH_TO_TEXT_API_URL=
AZURE_SPEECH_REGION=francecentral
`;
  }

  // Écrire le fichier .env
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Fichier .env créé avec succès !\n');

  // Proposer de générer le client Prisma
  const generate = await question('🚀 Voulez-vous générer le client Prisma maintenant ? (O/n): ');
  if (generate.toLowerCase() !== 'n' && generate.toLowerCase() !== 'non') {
    console.log('\n📦 Génération du client Prisma...\n');
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: __dirname 
      });
      console.log('\n✅ Client Prisma généré avec succès !\n');
    } catch (error) {
      console.error('\n❌ Erreur lors de la génération du client Prisma.');
      console.error('Vous pouvez l\'exécuter manuellement avec : npm run generate\n');
    }
  }

  // Proposer de tester la connexion
  const test = await question('🔍 Voulez-vous tester la connexion maintenant ? (O/n): ');
  if (test.toLowerCase() !== 'n' && test.toLowerCase() !== 'non') {
    console.log('\n🔍 Test de la connexion...\n');
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma db pull --print', { 
        stdio: 'inherit',
        cwd: __dirname 
      });
      console.log('\n✅ Connexion réussie !\n');
    } catch (error) {
      console.error('\n❌ Erreur de connexion.');
      console.error('Vérifiez votre DATABASE_URL dans le fichier .env\n');
    }
  }

  console.log('\n📚 Prochaines étapes :\n');
  console.log('1. Vérifiez que votre DATABASE_URL est correcte dans server/.env');
  console.log('2. Si nécessaire, appliquez les migrations : npm run migrate');
  console.log('3. Testez avec Prisma Studio : npm run studio');
  console.log('\n📖 Consultez server/INTEGRATION_PRISMA_SUPABASE.md pour plus de détails\n');

  rl.close();
}

main().catch(console.error);

