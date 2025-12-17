/**
 * Script de test pour vérifier la configuration SMTP
 * Usage: npx ts-node test-email.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement depuis config.env
dotenv.config({ path: path.join(__dirname, 'config.env') });

// Import du service email après le chargement des variables
import { emailService } from './src/services/emailService';

async function testEmailConfiguration() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   Test de Configuration Email - Logi Clinic          ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Vérifier que les variables d'environnement sont chargées
  console.log('📋 Vérification des variables d\'environnement...\n');
  
  const smtpConfig = {
    'SMTP_HOST': process.env.SMTP_HOST,
    'SMTP_PORT': process.env.SMTP_PORT,
    'SMTP_USER': process.env.SMTP_USER,
    'SMTP_PASSWORD': process.env.SMTP_PASSWORD ? '***' + process.env.SMTP_PASSWORD.slice(-4) : 'non défini',
    'SMTP_FROM': process.env.SMTP_FROM,
    'TECH_EMAIL': process.env.TECH_EMAIL,
  };

  console.table(smtpConfig);

  // Vérifier si le service est configuré
  if (!emailService.isEmailConfigured()) {
    console.error('\n❌ Service email NON CONFIGURÉ');
    console.log('\n💡 Vérifiez que toutes les variables SMTP sont définies dans server/config.env');
    process.exit(1);
  }

  console.log('\n✅ Service email configuré avec succès\n');
  console.log('─────────────────────────────────────────────────────────\n');

  // Test 1 : Email de notification d'inscription
  console.log('📧 Test 1 : Envoi d\'une notification d\'inscription...\n');
  
  try {
    const success = await emailService.sendRegistrationNotification({
      nom: 'Test',
      prenom: 'Utilisateur',
      email: 'test.utilisateur@example.com',
      telephone: '+229 01 23 45 67',
      roleSouhaite: 'medecin',
      adresse: 'Parakou, Bénin',
      specialite: 'Cardiologie',
    });

    if (success) {
      console.log('✅ Email de notification envoyé avec succès !');
      console.log(`   → Destinataire : ${process.env.TECH_EMAIL || 'tech@logiclinic.org'}`);
    } else {
      console.error('❌ Échec de l\'envoi de l\'email de notification');
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi :', error.message);
    console.error('\n💡 Causes possibles :');
    console.error('   - Identifiants SMTP incorrects');
    console.error('   - Serveur SMTP inaccessible');
    console.error('   - Port SMTP bloqué par le firewall');
    console.error('   - Paramètres SMTP incorrects (host, port, secure)');
  }

  console.log('\n─────────────────────────────────────────────────────────\n');

  // Test 2 : Email d'alerte technique
  console.log('📧 Test 2 : Envoi d\'une alerte technique...\n');
  
  try {
    const success = await emailService.sendTechnicalAlert({
      type: 'TEST_ALERT',
      timestamp: new Date().toISOString(),
      details: {
        message: 'Ceci est un test d\'alerte technique',
        status: 'test',
        source: 'test-email.ts',
      },
    });

    if (success) {
      console.log('✅ Email d\'alerte envoyé avec succès !');
      console.log(`   → Destinataire : ${process.env.ALERT_EMAIL || 'tech@logiclinic.org'}`);
    } else {
      console.error('❌ Échec de l\'envoi de l\'email d\'alerte');
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi :', error.message);
  }

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   Tests terminés                                      ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log('📝 Prochaines étapes :');
  console.log('   1. Vérifiez la réception des emails sur tech@logiclinic.org');
  console.log('   2. Vérifiez le dossier spam si nécessaire');
  console.log('   3. Si les tests échouent, consultez CONFIGURATION_SMTP_ALTERNATIVES.md\n');
}

// Exécuter le test
testEmailConfiguration()
  .then(() => {
    console.log('✅ Script de test terminé avec succès\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale :', error);
    process.exit(1);
  });

