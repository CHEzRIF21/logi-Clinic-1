/**
 * Script de diagnostic et correction des utilisateurs et de l'authentification
 * 
 * Ce script :
 * 1. Vérifie l'existence de la clinique CAMPUS-001
 * 2. Vérifie l'existence des utilisateurs (super-admin et admin clinique)
 * 3. Crée/mise à jour les utilisateurs avec les bons password_hash
 * 4. Vérifie les liens entre utilisateurs et clinique
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://bnfgemmlokvetmohiqch.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.error('❌ SUPABASE_ANON_KEY n\'est pas défini dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction de hash de mot de passe (identique à celle du serveur)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'logi_clinic_salt').digest('hex');
}

interface UserInfo {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: string;
  clinicCode?: string;
}

const USERS_TO_FIX: UserInfo[] = [
  {
    email: 'babocher21@gmail.com',
    password: 'SuperAdmin2024!', // Mot de passe par défaut - à changer
    nom: 'BABONI M.',
    prenom: 'Cherif',
    role: 'SUPER_ADMIN',
  },
  {
    email: 'bagarayannick1@gmail.com',
    password: 'TempClinic2024!',
    nom: 'BAGARA',
    prenom: 'Sabi Yannick',
    role: 'CLINIC_ADMIN',
    clinicCode: 'CAMPUS-001',
  },
];

async function checkClinic(clinicCode: string) {
  console.log(`\n🔍 Vérification de la clinique ${clinicCode}...`);
  
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('code', clinicCode)
    .maybeSingle();

  if (error) {
    console.error(`❌ Erreur lors de la vérification de la clinique:`, error.message);
    return null;
  }

  if (!data) {
    console.log(`⚠️  Clinique ${clinicCode} non trouvée`);
    return null;
  }

  console.log(`✅ Clinique trouvée:`, {
    id: data.id,
    code: data.code,
    name: data.name,
    active: data.active,
  });

  return data;
}

async function createClinic(clinicCode: string) {
  console.log(`\n➕ Création de la clinique ${clinicCode}...`);
  
  // Récupérer le super-admin pour created_by_super_admin
  const { data: superAdmin } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'babocher21@gmail.com')
    .eq('role', 'SUPER_ADMIN')
    .maybeSingle();

  const clinicData: any = {
    code: clinicCode,
    name: 'Clinique du Campus',
    address: 'Quartier Arafat; rue opposée universite ESAE',
    phone: '+229 90904344',
    email: 'cliniquemedicalecampus@gmail.com',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (superAdmin) {
    clinicData.created_by_super_admin = superAdmin.id;
  }

  const { data, error } = await supabase
    .from('clinics')
    .insert(clinicData)
    .select()
    .single();

  if (error) {
    console.error(`❌ Erreur lors de la création:`, error.message);
    return null;
  }

  console.log(`✅ Clinique créée avec succès:`, {
    id: data.id,
    code: data.code,
    name: data.name,
  });

  return data;
}

async function checkUser(email: string) {
  console.log(`\n🔍 Vérification de l'utilisateur ${email}...`);
  
  const { data, error } = await supabase
    .from('users')
    .select('*, clinics(code, name)')
    .eq('email', email.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error(`❌ Erreur lors de la vérification:`, error.message);
    return null;
  }

  if (!data) {
    console.log(`⚠️  Utilisateur ${email} non trouvé`);
    return null;
  }

  console.log(`✅ Utilisateur trouvé:`, {
    id: data.id,
    email: data.email,
    nom: data.nom,
    prenom: data.prenom,
    role: data.role,
    status: data.status,
    actif: data.actif,
    clinic_id: data.clinic_id,
    clinic_code: (data.clinics as any)?.code || 'N/A',
    has_password_hash: !!data.password_hash,
  });

  return data;
}

async function fixUser(userInfo: UserInfo) {
  console.log(`\n🔧 Correction de l'utilisateur ${userInfo.email}...`);

  // Vérifier si la clinique existe si nécessaire
  let clinicId: string | null = null;
  if (userInfo.clinicCode) {
    const clinic = await checkClinic(userInfo.clinicCode);
    if (!clinic) {
      console.error(`❌ Impossible de corriger l'utilisateur: clinique ${userInfo.clinicCode} non trouvée`);
      return false;
    }
    clinicId = clinic.id;
  }

  // Générer le hash du mot de passe
  const passwordHash = hashPassword(userInfo.password);

  // Vérifier si l'utilisateur existe
  const existingUser = await checkUser(userInfo.email);

  if (existingUser) {
    // Mettre à jour l'utilisateur existant
    console.log(`📝 Mise à jour de l'utilisateur existant...`);
    
    const updateData: any = {
      nom: userInfo.nom,
      prenom: userInfo.prenom,
      role: userInfo.role,
      password_hash: passwordHash,
      actif: true,
      updated_at: new Date().toISOString(),
    };

    if (clinicId) {
      updateData.clinic_id = clinicId;
    }

    if (userInfo.role === 'SUPER_ADMIN') {
      updateData.status = 'ACTIVE';
    } else {
      updateData.status = existingUser.status || 'PENDING';
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', userInfo.email.toLowerCase())
      .select()
      .single();

    if (error) {
      console.error(`❌ Erreur lors de la mise à jour:`, error.message);
      return false;
    }

    console.log(`✅ Utilisateur mis à jour avec succès`);
    return true;
  } else {
    // Créer un nouvel utilisateur
    console.log(`➕ Création d'un nouvel utilisateur...`);
    
    const insertData: any = {
      email: userInfo.email.toLowerCase(),
      nom: userInfo.nom,
      prenom: userInfo.prenom,
      role: userInfo.role,
      password_hash: passwordHash,
      actif: true,
      status: userInfo.role === 'SUPER_ADMIN' ? 'ACTIVE' : 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (clinicId) {
      insertData.clinic_id = clinicId;
    }

    const { error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`❌ Erreur lors de la création:`, error.message);
      return false;
    }

    console.log(`✅ Utilisateur créé avec succès`);
    return true;
  }
}

async function testAuthentication(email: string, password: string) {
  console.log(`\n🧪 Test d'authentification pour ${email}...`);
  
  const passwordHash = hashPassword(password);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('password_hash', passwordHash)
    .single();

  if (error || !data) {
    console.log(`❌ Authentification échouée:`, error?.message || 'Utilisateur non trouvé');
    return false;
  }

  if (!data.actif) {
    console.log(`❌ Compte désactivé`);
    return false;
  }

  console.log(`✅ Authentification réussie!`, {
    email: data.email,
    role: data.role,
    status: data.status,
  });

  return true;
}

async function main() {
  console.log('🚀 Démarrage du script de diagnostic et correction...\n');
  console.log('=' .repeat(60));

  // 1. Vérifier la clinique CAMPUS-001
  let clinic = await checkClinic('CAMPUS-001');
  if (!clinic) {
    console.log('\n⚠️  La clinique CAMPUS-001 n\'existe pas. Création...');
    clinic = await createClinic('CAMPUS-001');
    if (!clinic) {
      console.log('\n❌ Impossible de créer la clinique. Veuillez vérifier les permissions.');
      return;
    }
  }

  // 2. Vérifier et corriger chaque utilisateur
  for (const userInfo of USERS_TO_FIX) {
    await checkUser(userInfo.email);
    await fixUser(userInfo);
  }

  // 3. Vérifier à nouveau après correction
  console.log('\n' + '='.repeat(60));
  console.log('📊 Vérification finale...\n');

  for (const userInfo of USERS_TO_FIX) {
    await checkUser(userInfo.email);
    await testAuthentication(userInfo.email, userInfo.password);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Script terminé!');
  console.log('\n📝 Notes importantes:');
  console.log('   - Le mot de passe du super-admin est: SuperAdmin2024!');
  console.log('   - Le mot de passe de l\'admin clinique est: TempClinic2024!');
  console.log('   - Changez ces mots de passe en production!');
}

main().catch(console.error);

