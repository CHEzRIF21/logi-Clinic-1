#!/usr/bin/env node

/**
 * Script pour générer une nouvelle licence
 * Usage: node scripts/generate-license.js --domain example.com --expires 2025-12-31 --max-deployments 5
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function generateLicenseKey(domain, expiresAt, metadata) {
  const secretKey = process.env.LICENSE_SECRET_KEY || 'change-this-secret-key-in-production';
  const payload = {
    domain,
    expiresAt: expiresAt?.toISOString(),
    metadata,
    timestamp: Date.now(),
  };

  const payloadString = JSON.stringify(payload);
  const hash = crypto.createHmac('sha256', secretKey).update(payloadString).digest('hex');
  
  const licenseKey = `${domain.substring(0, 8).toUpperCase()}-${hash.substring(0, 16).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  
  return licenseKey;
}

async function createLicense() {
  try {
    console.log('🔐 Générateur de Licence - Logi Clinic\n');

    // Récupérer les arguments de la ligne de commande
    const args = process.argv.slice(2);
    let domain = null;
    let expiresAt = null;
    let maxDeployments = null;
    let allowedDomains = null;

    // Parser les arguments
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--domain' && args[i + 1]) {
        domain = args[i + 1];
        i++;
      } else if (args[i] === '--expires' && args[i + 1]) {
        expiresAt = new Date(args[i + 1]);
        i++;
      } else if (args[i] === '--max-deployments' && args[i + 1]) {
        maxDeployments = parseInt(args[i + 1], 10);
        i++;
      } else if (args[i] === '--allowed-domains' && args[i + 1]) {
        allowedDomains = args[i + 1].split(',').map(d => d.trim());
        i++;
      }
    }

    // Demander les informations si non fournies
    if (!domain) {
      domain = await question('Domaine principal (ex: example.com): ');
    }

    if (!allowedDomains) {
      const allowedInput = await question('Domaines autorisés (séparés par des virgules, laissez vide pour utiliser le domaine principal): ');
      allowedDomains = allowedInput.trim() 
        ? allowedInput.split(',').map(d => d.trim())
        : [domain];
    }

    if (!expiresAt) {
      const expiresInput = await question('Date d\'expiration (YYYY-MM-DD, laissez vide pour aucune expiration): ');
      expiresAt = expiresInput.trim() ? new Date(expiresInput) : null;
    }

    if (maxDeployments === null) {
      const maxInput = await question('Nombre maximum de déploiements (laissez vide pour illimité): ');
      maxDeployments = maxInput.trim() ? parseInt(maxInput, 10) : null;
    }

    // Générer la clé de licence
    const licenseKey = generateLicenseKey(domain, expiresAt, {});

    // Créer la licence dans la base de données
    const license = await prisma.license.create({
      data: {
        licenseKey,
        domain,
        allowedDomains,
        expiresAt,
        maxDeployments,
        active: true,
        metadata: {},
      },
    });

    console.log('\n✅ Licence créée avec succès!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DÉTAILS DE LA LICENCE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID:              ${license.id}`);
    console.log(`Clé de licence:   ${license.licenseKey}`);
    console.log(`Domaine:          ${license.domain}`);
    console.log(`Domaines autorisés: ${license.allowedDomains.join(', ')}`);
    console.log(`Expire le:        ${license.expiresAt ? license.expiresAt.toLocaleDateString() : 'Jamais'}`);
    console.log(`Max déploiements: ${license.maxDeployments || 'Illimité'}`);
    console.log(`Statut:           ${license.active ? '✅ Actif' : '❌ Inactif'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 CONFIGURATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Ajoutez ces variables à votre fichier .env:\n');
    console.log(`LICENSE_KEY=${license.licenseKey}`);
    console.log(`ALLOWED_DOMAINS=${license.allowedDomains.join(',')}`);
    if (license.expiresAt) {
      console.log(`LICENSE_EXPIRES=${license.expiresAt.toISOString()}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erreur lors de la création de la licence:', error.message);
    if (error.code === 'P2002') {
      console.error('   Une licence avec cette clé existe déjà.');
    }
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Exécuter le script
createLicense();

