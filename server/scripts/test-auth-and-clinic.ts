/**
 * Script de test pour vérifier l'authentification et l'accès à la clinique CAMPUS-001
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  token?: string;
}

async function testAuthentication() {
  console.log('🧪 Test d\'authentification...\n');

  // Test 1: Super-Admin
  console.log('1. Test authentification Super-Admin...');
  try {
    const response = await axios.post<AuthResponse>(
      `${BASE_URL}/api/auth/login`,
      {
        email: 'babocher21@gmail.com',
        password: 'SuperAdmin2024!',
      }
    );

    if (response.data.success && response.data.token) {
      console.log('✅ Super-Admin authentifié avec succès');
      console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
      console.log(`   User: ${response.data.user?.email} (${response.data.user?.role})`);
      return response.data.token;
    } else {
      console.log('❌ Échec de l\'authentification Super-Admin');
      return null;
    }
  } catch (error: any) {
    console.log('❌ Erreur lors de l\'authentification Super-Admin:');
    console.log(`   ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testClinicAccess(token: string) {
  console.log('\n2. Test accès à la clinique CAMPUS-001...');
  
  try {
    // Récupérer toutes les cliniques
    const response = await axios.get(
      `${BASE_URL}/api/clinics`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success && Array.isArray(response.data.data)) {
      const clinic = response.data.data.find((c: any) => c.code === 'CAMPUS-001');
      
      if (clinic) {
        console.log('✅ Clinique CAMPUS-001 trouvée:');
        console.log(`   ID: ${clinic.id}`);
        console.log(`   Nom: ${clinic.name}`);
        console.log(`   Active: ${clinic.active}`);
        return clinic;
      } else {
        console.log('❌ Clinique CAMPUS-001 non trouvée dans la liste');
        return null;
      }
    } else {
      console.log('❌ Format de réponse inattendu');
      return null;
    }
  } catch (error: any) {
    console.log('❌ Erreur lors de l\'accès aux cliniques:');
    console.log(`   ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testClinicStats(token: string, clinicId: string) {
  console.log('\n3. Test statistiques de la clinique...');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/clinics/${clinicId}/stats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      console.log('✅ Statistiques récupérées avec succès');
      console.log(`   Données: ${JSON.stringify(response.data.data, null, 2)}`);
      return true;
    } else {
      console.log('❌ Échec de la récupération des statistiques');
      return false;
    }
  } catch (error: any) {
    console.log('❌ Erreur lors de la récupération des statistiques:');
    console.log(`   ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Démarrage des tests d\'authentification et d\'accès...\n');
  console.log('='.repeat(60));

  // Test 1: Authentification
  const token = await testAuthentication();
  
  if (!token) {
    console.log('\n❌ Les tests ne peuvent pas continuer sans authentification');
    console.log('\n💡 Vérifiez que:');
    console.log('   1. Le script SQL a été exécuté dans Supabase');
    console.log('   2. Les utilisateurs existent avec les bons password_hash');
    console.log('   3. Le serveur backend est démarré');
    return;
  }

  // Test 2: Accès à la clinique
  const clinic = await testClinicAccess(token);
  
  if (!clinic) {
    console.log('\n❌ Impossible d\'accéder à la clinique CAMPUS-001');
    return;
  }

  // Test 3: Statistiques
  await testClinicStats(token, clinic.id);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests terminés!');
}

main().catch(console.error);

