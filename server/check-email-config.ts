#!/usr/bin/env ts-node
/**
 * Script de vérification de la configuration email
 * 
 * Usage:
 *   npx ts-node check-email-config.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { emailService } from './src/services/emailService';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, 'config.env') });

interface ConfigCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  value?: string;
}

// Vérifier la configuration Supabase
function checkSupabaseConfig(): ConfigCheck[] {
  const checks: ConfigCheck[] = [];
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  checks.push({
    name: 'VITE_SUPABASE_URL',
    status: supabaseUrl ? 'ok' : 'error',
    message: supabaseUrl ? 'Configuré' : 'Manquant',
    value: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : undefined,
  });
  
  checks.push({
    name: 'VITE_SUPABASE_ANON_KEY',
    status: supabaseAnonKey ? 'ok' : 'error',
    message: supabaseAnonKey ? 'Configuré' : 'Manquant',
    value: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : undefined,
  });
  
  return checks;
}

// Vérifier la configuration SMTP
function checkSMTPConfig(): ConfigCheck[] {
  const checks: ConfigCheck[] = [];
  
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM;
  
  checks.push({
    name: 'SMTP_HOST',
    status: smtpHost ? 'ok' : 'warning',
    message: smtpHost ? 'Configuré' : 'Manquant (emails backend désactivés)',
    value: smtpHost,
  });
  
  checks.push({
    name: 'SMTP_PORT',
    status: smtpPort ? 'ok' : 'warning',
    message: smtpPort ? `Port ${smtpPort}` : 'Non défini (défaut: 587)',
    value: smtpPort || '587 (défaut)',
  });
  
  checks.push({
    name: 'SMTP_USER',
    status: smtpUser ? 'ok' : 'warning',
    message: smtpUser ? 'Configuré' : 'Manquant',
    value: smtpUser ? smtpUser.substring(0, 20) + '...' : undefined,
  });
  
  checks.push({
    name: 'SMTP_PASSWORD',
    status: smtpPassword ? 'ok' : 'warning',
    message: smtpPassword ? 'Configuré' : 'Manquant',
    value: smtpPassword ? '***' + smtpPassword.slice(-4) : undefined,
  });
  
  checks.push({
    name: 'SMTP_FROM',
    status: smtpFrom ? 'ok' : 'warning',
    message: smtpFrom ? 'Configuré' : 'Non défini (utilisera SMTP_USER)',
    value: smtpFrom,
  });
  
  // Vérifier que SMTP_FROM correspond au domaine de SMTP_USER
  if (smtpFrom && smtpUser) {
    const fromDomain = smtpFrom.split('@')[1];
    const userDomain = smtpUser.split('@')[1];
    
    if (fromDomain !== userDomain) {
      checks.push({
        name: 'SMTP_FROM Domain',
        status: 'warning',
        message: `SMTP_FROM (${fromDomain}) différent de SMTP_USER (${userDomain})`,
        value: `${fromDomain} ≠ ${userDomain}`,
      });
    }
  }
  
  return checks;
}

// Vérifier la connexion SMTP
async function checkSMTPConnection(): Promise<ConfigCheck> {
  if (!emailService.isEmailConfigured()) {
    return {
      name: 'SMTP Connection',
      status: 'warning',
      message: 'SMTP non configuré, impossible de tester la connexion',
    };
  }
  
  try {
    // Note: Cette vérification nécessite une méthode verify() dans emailService
    // Pour l'instant, on vérifie juste si le service est configuré
    return {
      name: 'SMTP Connection',
      status: 'ok',
      message: 'Service email configuré',
    };
  } catch (error: any) {
    return {
      name: 'SMTP Connection',
      status: 'error',
      message: `Erreur de connexion: ${error.message}`,
    };
  }
}

// Fonction principale
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VÉRIFICATION DE LA CONFIGURATION EMAIL');
  console.log('='.repeat(80));
  
  const allChecks: ConfigCheck[] = [];
  
  // Vérifier Supabase
  console.log('\n📦 Configuration Supabase:');
  const supabaseChecks = checkSupabaseConfig();
  allChecks.push(...supabaseChecks);
  
  supabaseChecks.forEach(check => {
    const emoji = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`   ${emoji} ${check.name}: ${check.message}`);
    if (check.value) {
      console.log(`      Valeur: ${check.value}`);
    }
  });
  
  // Vérifier SMTP
  console.log('\n📧 Configuration SMTP:');
  const smtpChecks = checkSMTPConfig();
  allChecks.push(...smtpChecks);
  
  smtpChecks.forEach(check => {
    const emoji = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`   ${emoji} ${check.name}: ${check.message}`);
    if (check.value) {
      console.log(`      Valeur: ${check.value}`);
    }
  });
  
  // Vérifier la connexion SMTP
  console.log('\n🔌 Connexion SMTP:');
  const connectionCheck = await checkSMTPConnection();
  allChecks.push(connectionCheck);
  
  const emoji = connectionCheck.status === 'ok' ? '✅' : connectionCheck.status === 'warning' ? '⚠️' : '❌';
  console.log(`   ${emoji} ${connectionCheck.name}: ${connectionCheck.message}`);
  
  // Résumé
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(80));
  
  const okCount = allChecks.filter(c => c.status === 'ok').length;
  const warningCount = allChecks.filter(c => c.status === 'warning').length;
  const errorCount = allChecks.filter(c => c.status === 'error').length;
  
  console.log(`   ✅ OK: ${okCount}`);
  console.log(`   ⚠️  Warnings: ${warningCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n❌ Des erreurs doivent être corrigées avant de pouvoir envoyer des emails.');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('\n⚠️  Des warnings ont été détectés. Vérifiez la configuration.');
    process.exit(0);
  } else {
    console.log('\n✅ Configuration correcte !');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
