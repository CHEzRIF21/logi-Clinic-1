#!/usr/bin/env node

/**
 * Script de vérification du serveur de développement
 * Vérifie que le serveur Vite est en cours d'exécution sur le port 3001
 */

const http = require('http');
const net = require('net');

const PORT = process.env.PORT || 3001;
const URL = `http://localhost:${PORT}`;
const TIMEOUT = 5000;

/**
 * Vérifie si le port est en écoute
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

/**
 * Vérifie si le serveur répond aux requêtes HTTP
 */
function checkHttpResponse(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout: TIMEOUT }, (response) => {
      if (response.statusCode === 200) {
        resolve(true);
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Vérification du serveur de développement...\n');

  // Vérifier le port
  console.log(`  → Vérification du port ${PORT}...`);
  const portAvailable = await checkPort(PORT);
  
  if (portAvailable) {
    console.log(`  ❌ Le port ${PORT} n'est pas utilisé (serveur non démarré)`);
    console.log(`  💡 Démarrez le serveur avec: npm run dev`);
    process.exit(1);
  }

  console.log(`  ✅ Le port ${PORT} est en écoute`);

  // Vérifier la réponse HTTP
  console.log(`  → Vérification de la réponse HTTP...`);
  try {
    await checkHttpResponse(URL);
    console.log(`  ✅ Le serveur répond correctement`);
    console.log(`  📍 URL: ${URL}`);
    process.exit(0);
  } catch (error) {
    console.log(`  ❌ Le serveur ne répond pas aux requêtes HTTP`);
    console.log(`  💡 Erreur: ${error.message}`);
    console.log(`  💡 Démarrez le serveur avec: npm run dev`);
    process.exit(1);
  }
}

main();

