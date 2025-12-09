/**
 * Script de test pour vérifier que l'API de transcription vocale est configurée
 */

const path = require('path');
const dotenv = require('dotenv');

// Charger .env si disponible
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Charger config.env comme fallback
dotenv.config({ path: path.resolve(__dirname, '../config.env') });

console.log('🔍 Vérification de la configuration de transcription vocale...\n');

const apiKey = process.env.SPEECH_TO_TEXT_API_KEY;
const provider = process.env.SPEECH_TO_TEXT_PROVIDER || 'openai';

if (!apiKey) {
  console.error('❌ SPEECH_TO_TEXT_API_KEY n\'est pas configurée');
  console.log('\n💡 Pour configurer:');
  console.log('   1. Créez un fichier .env dans le répertoire server/');
  console.log('   2. Ajoutez: SPEECH_TO_TEXT_API_KEY=votre-clé-api');
  console.log('   3. Ajoutez: SPEECH_TO_TEXT_PROVIDER=openai');
  process.exit(1);
}

console.log('✅ Clé API trouvée:', apiKey.substring(0, 20) + '...');
console.log('✅ Provider:', provider);
console.log('\n✅ Configuration correcte!');
console.log('\n📝 Pour tester l\'API:');
console.log('   1. Démarrez le serveur: npm run dev');
console.log('   2. Vérifiez le statut: curl http://localhost:3000/api/speech-to-text/status');
console.log('   3. Testez la transcription avec un fichier audio');

