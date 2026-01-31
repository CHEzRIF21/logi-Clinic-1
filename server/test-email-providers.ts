#!/usr/bin/env ts-node
/**
 * Script de test multi-fournisseurs d'email
 * 
 * Usage:
 *   npx ts-node test-email-providers.ts --emails=test@gmail.com,test@outlook.com,test@yahoo.com
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, 'config.env') });

interface ProviderTestResult {
  provider: string;
  email: string;
  sent: boolean;
  delivery_time_ms?: number;
  received: boolean;
  inbox_or_spam?: 'inbox' | 'spam' | 'unknown';
  error?: any;
}

// Parser les arguments
const args = process.argv.slice(2);
const getArg = (key: string): string | null => {
  const arg = args.find(a => a.startsWith(`--${key}=`));
  return arg ? arg.split('=')[1] : null;
};

const emailsArg = getArg('emails');
const testEmails = emailsArg ? emailsArg.split(',') : [
  'test@gmail.com',
  'test@outlook.com',
  'test@yahoo.com',
];

// Initialiser Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Détecter le fournisseur d'email
function detectProvider(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain?.includes('gmail')) return 'Gmail';
  if (domain?.includes('outlook') || domain?.includes('hotmail') || domain?.includes('live')) return 'Outlook';
  if (domain?.includes('yahoo')) return 'Yahoo';
  if (domain?.includes('icloud')) return 'iCloud';
  return 'Autre';
}

// Tester l'envoi vers un email
async function testEmailProvider(email: string): Promise<ProviderTestResult> {
  const provider = detectProvider(email);
  const result: ProviderTestResult = {
    provider,
    email,
    sent: false,
    received: false,
  };

  try {
    console.log(`\n🔄 Test: ${provider} (${email})`);
    
    const startTime = Date.now();
    const redirectTo = process.env.RESET_PASSWORD_URL || 
                       'https://logi-clinic-1-git-lint-fix-chezrifs-projects.vercel.app/reset-password';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });

    const deliveryTime = Date.now() - startTime;

    if (error) {
      result.error = {
        message: error.message,
        status: error.status,
      };
      console.error(`   ❌ Erreur: ${error.message}`);
    } else {
      result.sent = true;
      result.delivery_time_ms = deliveryTime;
      console.log(`   ✅ Email envoyé (${deliveryTime}ms)`);
      console.log(`   ⚠️  Vérifiez manuellement la réception dans ${provider}`);
    }

  } catch (error: any) {
    result.error = {
      message: error.message,
    };
    console.error(`   ❌ Erreur: ${error.message}`);
  }

  return result;
}

// Fonction principale
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📧 TEST MULTI-FOURNISSEURS EMAIL');
  console.log('='.repeat(80));
  console.log(`Emails à tester: ${testEmails.length}`);
  testEmails.forEach(email => console.log(`   - ${email}`));
  console.log('='.repeat(80));

  const results: ProviderTestResult[] = [];

  for (const email of testEmails) {
    const result = await testEmailProvider(email);
    results.push(result);
    
    // Attendre 2 secondes entre les envois pour éviter le rate limiting
    if (testEmails.indexOf(email) < testEmails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Afficher le tableau de résultats
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS');
  console.log('='.repeat(80));
  console.log('| Fournisseur | Email | Envoyé | Temps (ms) | Statut |');
  console.log('|-------------|-------|--------|------------|--------|');
  
  results.forEach(result => {
    const status = result.sent ? '✅' : '❌';
    const time = result.delivery_time_ms || '-';
    console.log(`| ${result.provider.padEnd(11)} | ${result.email.padEnd(20)} | ${result.sent ? 'Oui' : 'Non'} | ${time.toString().padEnd(10)} | ${status} |`);
  });

  console.log('='.repeat(80));
  console.log('\n⚠️  IMPORTANT: Vérifiez manuellement la réception dans chaque boîte email');
  console.log('   - Vérifiez la boîte de réception');
  console.log('   - Vérifiez les spams/courriers indésirables');
  console.log('   - Notez le délai de réception');
  console.log('   - Notez si l\'email est en inbox ou spam\n');
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
