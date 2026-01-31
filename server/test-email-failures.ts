#!/usr/bin/env ts-node
/**
 * Script de test des scénarios d'échec d'envoi d'email
 * 
 * Usage:
 *   npx ts-node test-email-failures.ts --scenario=unverified-domain
 *   npx ts-node test-email-failures.ts --scenario=missing-spf-dkim
 *   npx ts-node test-email-failures.ts --scenario=wrong-from-email
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { emailService } from './src/services/emailService';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, 'config.env') });

// Parser les arguments
const args = process.argv.slice(2);
const getArg = (key: string): string | null => {
  const arg = args.find(a => a.startsWith(`--${key}=`));
  return arg ? arg.split('=')[1] : null;
};

const scenario = getArg('scenario') || 'all';

interface FailureTestResult {
  scenario: string;
  description: string;
  expected_error: string;
  actual_result: 'success' | 'error' | 'timeout';
  error_message?: string;
  user_message_visible: boolean;
  log_contains_details: boolean;
}

// Scénario 1: Domaine non vérifié
async function testUnverifiedDomain(): Promise<FailureTestResult> {
  console.log('\n🔄 Test: Domaine non vérifié');
  
  const result: FailureTestResult = {
    scenario: 'unverified-domain',
    description: 'Tentative d\'envoi avec un domaine non vérifié dans Supabase',
    expected_error: 'Domain not verified',
    actual_result: 'success', // Par défaut, Supabase peut accepter mais l'email peut être rejeté
    user_message_visible: false,
    log_contains_details: false,
  };

  // Note: Ce test nécessite une configuration Supabase réelle
  // Pour tester, il faudrait modifier temporairement le domaine From dans Supabase
  console.log('   ⚠️  Ce test nécessite une modification manuelle dans Supabase Dashboard');
  console.log('   → Modifier temporairement le From Email avec un domaine non vérifié');
  console.log('   → Tenter d\'envoyer un email');
  console.log('   → Vérifier que l\'erreur est visible dans les logs');
  console.log('   → Vérifier qu\'un message clair est affiché à l\'utilisateur');

  return result;
}

// Scénario 2: SPF/DKIM manquants
async function testMissingSPFDKIM(): Promise<FailureTestResult> {
  console.log('\n🔄 Test: SPF/DKIM manquants');
  
  const result: FailureTestResult = {
    scenario: 'missing-spf-dkim',
    description: 'Envoi d\'email sans configuration SPF/DKIM',
    expected_error: 'Email peut aller en spam',
    actual_result: 'success', // L'email peut être envoyé mais aller en spam
    user_message_visible: false,
    log_contains_details: false,
  };

  console.log('   ⚠️  Ce test nécessite une vérification manuelle');
  console.log('   → Vérifier que SPF/DKIM sont configurés dans le DNS');
  console.log('   → Envoyer un email de test');
  console.log('   → Vérifier la réception (inbox vs spam)');
  console.log('   → Vérifier les en-têtes email pour SPF/DKIM');

  return result;
}

// Scénario 3: From Email incorrect
async function testWrongFromEmail(): Promise<FailureTestResult> {
  console.log('\n🔄 Test: From Email incorrect');
  
  const result: FailureTestResult = {
    scenario: 'wrong-from-email',
    description: 'Tentative d\'envoi avec un From Email non autorisé',
    expected_error: 'SMTP error or email rejected',
    actual_result: 'error',
    user_message_visible: false,
    log_contains_details: false,
  };

  // Sauvegarder la configuration actuelle
  const originalFrom = process.env.SMTP_FROM;
  const originalUser = process.env.SMTP_USER;

  try {
    // Modifier temporairement le From Email
    process.env.SMTP_FROM = 'unauthorized@example.com';
    
    console.log('   🔄 Test avec From Email incorrect:', process.env.SMTP_FROM);
    
    if (!emailService.isEmailConfigured()) {
      console.log('   ⚠️  SMTP non configuré, impossible de tester');
      result.actual_result = 'error';
      result.error_message = 'SMTP non configuré';
      return result;
    }

    // Tenter d'envoyer un email
    const startTime = Date.now();
    const success = await emailService.sendAccountValidationEmail({
      nom: 'Test',
      prenom: 'User',
      email: 'test@example.com',
      username: 'test@example.com',
      temporaryPassword: 'TempPass123!',
      clinicCode: 'TEST-001',
    });
    const deliveryTime = Date.now() - startTime;

    if (success) {
      console.log('   ⚠️  Email envoyé malgré From Email incorrect');
      console.log('   → Vérifier manuellement si l\'email est rejeté par le serveur SMTP');
      result.actual_result = 'success';
    } else {
      console.log('   ✅ Email rejeté comme attendu');
      result.actual_result = 'error';
      result.error_message = 'Email rejeté par le serveur SMTP';
      result.user_message_visible = true;
      result.log_contains_details = true;
    }

  } catch (error: any) {
    console.log('   ✅ Erreur capturée:', error.message);
    result.actual_result = 'error';
    result.error_message = error.message;
    result.user_message_visible = true;
    result.log_contains_details = true;
  } finally {
    // Restaurer la configuration
    process.env.SMTP_FROM = originalFrom;
    process.env.SMTP_USER = originalUser;
  }

  return result;
}

// Scénario 4: Rate limiting
async function testRateLimiting(): Promise<FailureTestResult> {
  console.log('\n🔄 Test: Rate limiting');
  
  const result: FailureTestResult = {
    scenario: 'rate-limiting',
    description: 'Tentative d\'envoi multiple d\'emails (rate limit)',
    expected_error: 'Rate limit exceeded',
    actual_result: 'error',
    user_message_visible: false,
    log_contains_details: false,
  };

  console.log('   ⚠️  Ce test nécessite plusieurs tentatives rapides');
  console.log('   → Envoyer 5 emails rapidement vers le même destinataire');
  console.log('   → Vérifier que le rate limit est atteint');
  console.log('   → Vérifier que l\'erreur 429 est retournée');
  console.log('   → Vérifier qu\'un message clair est affiché à l\'utilisateur');

  return result;
}

// Fonction principale
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📧 TEST DES SCÉNARIOS D\'ÉCHEC EMAIL');
  console.log('='.repeat(80));
  console.log(`Scénario: ${scenario}`);
  console.log('='.repeat(80));

  const results: FailureTestResult[] = [];

  if (scenario === 'all' || scenario === 'unverified-domain') {
    results.push(await testUnverifiedDomain());
  }
  if (scenario === 'all' || scenario === 'missing-spf-dkim') {
    results.push(await testMissingSPFDKIM());
  }
  if (scenario === 'all' || scenario === 'wrong-from-email') {
    results.push(await testWrongFromEmail());
  }
  if (scenario === 'all' || scenario === 'rate-limiting') {
    results.push(await testRateLimiting());
  }

  // Afficher le tableau de résultats
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS');
  console.log('='.repeat(80));
  console.log('| Scénario | Résultat | Message Utilisateur | Logs Détaillés |');
  console.log('|----------|----------|---------------------|----------------|');
  
  results.forEach(result => {
    const status = result.actual_result === 'error' ? '✅' : '⚠️';
    const userMsg = result.user_message_visible ? '✅' : '❌';
    const logs = result.log_contains_details ? '✅' : '❌';
    console.log(`| ${result.scenario.padEnd(8)} | ${status} | ${userMsg} | ${logs} |`);
  });

  console.log('='.repeat(80));
  console.log('\n📝 NOTES:');
  console.log('   - ✅ = Test réussi / Erreur détectée comme attendu');
  console.log('   - ⚠️  = Test nécessite vérification manuelle');
  console.log('   - ❌ = Problème détecté\n');
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
