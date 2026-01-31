#!/usr/bin/env ts-node
/**
 * Script de test instrumenté pour la délivrabilité des emails
 * 
 * Usage:
 *   npx ts-node test-email-delivery.ts --type=reset-password --email=test@example.com
 *   npx ts-node test-email-delivery.ts --type=account-validation --email=test@example.com
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { emailService } from './src/services/emailService';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, 'config.env') });

interface TestResult {
  timestamp: string;
  type: string;
  email: string;
  source: 'supabase-auth' | 'smtp-backend';
  status: 'success' | 'error' | 'timeout';
  error?: any;
  supabase_response?: any;
  smtp_response?: any;
  delivery_time_ms?: number;
}

// Parser les arguments de ligne de commande
const args = process.argv.slice(2);
const getArg = (key: string): string | null => {
  const arg = args.find(a => a.startsWith(`--${key}=`));
  return arg ? arg.split('=')[1] : null;
};

const emailType = getArg('type') || 'reset-password';
const testEmail = getArg('email') || 'test@example.com';
const timeout = parseInt(getArg('timeout') || '30000');
const noSmtp = args.includes('--no-smtp');

// Initialiser Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables Supabase manquantes');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour logger les résultats
function logResult(result: TestResult) {
  console.log('\n' + '='.repeat(80));
  console.log('📧 RÉSULTAT DU TEST D\'ENVOI EMAIL');
  console.log('='.repeat(80));
  console.log(JSON.stringify(result, null, 2));
  console.log('='.repeat(80) + '\n');
  
  // Sauvegarder dans un fichier de log
  const fs = require('fs');
  const logFile = path.join(__dirname, 'email-delivery-tests.log');
  fs.appendFileSync(logFile, JSON.stringify(result) + '\n');
}

// Test 1: Reset Password via Supabase Auth
async function testResetPassword(email: string): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    timestamp: new Date().toISOString(),
    type: 'reset-password',
    email: email,
    source: 'supabase-auth',
    status: 'pending',
  };

  try {
    console.log(`\n🔄 Test: Reset Password pour ${email}`);
    console.log(`   Type: ${emailType}`);
    console.log(`   Timeout: ${timeout}ms`);
    
    // Déterminer l'URL de redirection
    const redirectTo = process.env.RESET_PASSWORD_URL || 
                       'https://logi-clinic-1-git-lint-fix-chezrifs-projects.vercel.app/reset-password';
    
    console.log(`   Redirect URL: ${redirectTo}`);
    
    // Créer une promesse de timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, timeout);
    });

    // Envoyer la requête
    const resetPromise = supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });

    const response = await Promise.race([resetPromise, timeoutPromise]);
    const deliveryTime = Date.now() - startTime;

    result.status = 'success';
    result.delivery_time_ms = deliveryTime;
    result.supabase_response = response;

    console.log('✅ Email envoyé avec succès');
    console.log(`   Temps de réponse: ${deliveryTime}ms`);
    console.log(`   Réponse Supabase:`, JSON.stringify(response, null, 2));

  } catch (error: any) {
    const deliveryTime = Date.now() - startTime;
    
    result.status = error.message === 'TIMEOUT' ? 'timeout' : 'error';
    result.error = {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
    };
    result.delivery_time_ms = deliveryTime;

    console.error('❌ Erreur lors de l\'envoi:', error.message);
    if (error.status) console.error(`   Status: ${error.status}`);
    if (error.code) console.error(`   Code: ${error.code}`);
  }

  return result;
}

// Test 2: Account Validation via SMTP Backend
async function testAccountValidation(email: string): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    timestamp: new Date().toISOString(),
    type: 'account-validation',
    email: email,
    source: 'smtp-backend',
    status: 'pending',
  };

  try {
    console.log(`\n🔄 Test: Account Validation pour ${email}`);
    
    if (noSmtp) {
      console.log('   ⚠️ Mode --no-smtp: SMTP désactivé');
      result.status = 'error';
      result.error = { message: 'SMTP désactivé pour ce test' };
      return result;
    }

    if (!emailService.isEmailConfigured()) {
      console.log('   ⚠️ SMTP non configuré');
      result.status = 'error';
      result.error = { message: 'SMTP non configuré' };
      return result;
    }

    const success = await emailService.sendAccountValidationEmail({
      nom: 'Test',
      prenom: 'User',
      email: email,
      username: email,
      temporaryPassword: 'TempPass123!',
      clinicCode: 'TEST-001',
    });

    const deliveryTime = Date.now() - startTime;

    result.status = success ? 'success' : 'error';
    result.delivery_time_ms = deliveryTime;
    result.smtp_response = { success };

    if (success) {
      console.log('✅ Email envoyé avec succès');
      console.log(`   Temps de réponse: ${deliveryTime}ms`);
    } else {
      console.error('❌ Échec de l\'envoi');
    }

  } catch (error: any) {
    const deliveryTime = Date.now() - startTime;
    
    result.status = 'error';
    result.error = {
      message: error.message,
      stack: error.stack,
    };
    result.delivery_time_ms = deliveryTime;

    console.error('❌ Erreur lors de l\'envoi:', error.message);
  }

  return result;
}

// Fonction principale
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📧 TEST DE DÉLIVRABILITÉ EMAIL - Logiclinic');
  console.log('='.repeat(80));
  console.log(`Type: ${emailType}`);
  console.log(`Email: ${testEmail}`);
  console.log(`Timeout: ${timeout}ms`);
  console.log(`SMTP Backend: ${noSmtp ? 'Désactivé' : 'Activé'}`);
  console.log('='.repeat(80));

  let result: TestResult;

  switch (emailType) {
    case 'reset-password':
      result = await testResetPassword(testEmail);
      break;
    case 'account-validation':
      result = await testAccountValidation(testEmail);
      break;
    default:
      console.error(`❌ Type d'email inconnu: ${emailType}`);
      console.error('   Types supportés: reset-password, account-validation');
      process.exit(1);
  }

  logResult(result);

  // Résumé
  console.log('\n📊 RÉSUMÉ:');
  console.log(`   Statut: ${result.status === 'success' ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
  console.log(`   Temps: ${result.delivery_time_ms}ms`);
  if (result.error) {
    console.log(`   Erreur: ${result.error.message}`);
  }

  process.exit(result.status === 'success' ? 0 : 1);
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
