/**
 * Script pour créer la clinique ITA et associer l'admin
 * 
 * Usage: npx ts-node server/scripts/create-clinic-ita.ts
 */

import prisma from '../src/prisma';

async function createClinicITA() {
  try {
    console.log('🏥 Création de la clinique ITA...\n');

    const adminEmail = 'argh2014@gmail.com';
    const adminUID = '40d479e0-d398-489d-a754-a815f5e7a6d2';
    const clinicCode = 'ITA';
    const clinicName = 'ITA';

    // 1. Vérifier si l'utilisateur existe
    console.log(`📋 Vérification de l'utilisateur ${adminEmail}...`);
    
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { authUserId: adminUID },
        ],
      },
    });

    if (!user) {
      console.log(`⚠️  Utilisateur non trouvé. Création de l'utilisateur...`);
      
      // Créer l'utilisateur
      user = await prisma.user.create({
        data: {
          email: adminEmail,
          authUserId: adminUID,
          name: 'Admin ITA',
          nom: 'Admin',
          prenom: 'ITA',
          role: 'CLINIC_ADMIN',
          status: 'ACTIVE',
          actif: true,
        },
      });
      console.log(`✅ Utilisateur créé: ${user.id}`);
    } else {
      console.log(`✅ Utilisateur trouvé: ${user.id} (${user.email})`);
      
      // Mettre à jour authUserId si nécessaire
      if (user.authUserId !== adminUID) {
        console.log(`🔄 Mise à jour de authUserId...`);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { authUserId: adminUID },
        });
        console.log(`✅ authUserId mis à jour`);
      }
    }

    // 2. Vérifier si la clinique existe déjà
    console.log(`\n📋 Vérification de la clinique ${clinicCode}...`);
    
    let clinic = await prisma.clinic.findUnique({
      where: { code: clinicCode },
    });

    if (clinic) {
      console.log(`⚠️  La clinique ${clinicCode} existe déjà: ${clinic.id}`);
      console.log(`🔄 Mise à jour de la clinique...`);
      
      clinic = await prisma.clinic.update({
        where: { code: clinicCode },
        data: {
          name: clinicName,
          active: true,
        },
      });
      console.log(`✅ Clinique mise à jour`);
    } else {
      console.log(`📝 Création de la clinique ${clinicCode}...`);
      
      clinic = await prisma.clinic.create({
        data: {
          code: clinicCode,
          name: clinicName,
          active: true,
        },
      });
      console.log(`✅ Clinique créée: ${clinic.id}`);
    }

    // 3. Associer l'utilisateur à la clinique
    console.log(`\n📋 Association de l'utilisateur à la clinique...`);
    
    const userClinicId = user.clinicId;
    if (userClinicId !== clinic.id) {
      if (userClinicId) {
        console.log(`⚠️  L'utilisateur est déjà associé à une autre clinique: ${userClinicId}`);
        console.log(`🔄 Réassignation à la clinique ${clinicCode}...`);
      }
      
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          clinicId: clinic.id,
          role: 'CLINIC_ADMIN', // S'assurer que le rôle est CLINIC_ADMIN
          status: 'ACTIVE',
        },
      });
      console.log(`✅ Utilisateur associé à la clinique ${clinicCode}`);
    } else {
      console.log(`✅ L'utilisateur est déjà associé à cette clinique`);
    }

    // 4. Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`Clinique:`);
    console.log(`  - Code: ${clinic.code}`);
    console.log(`  - Nom: ${clinic.name}`);
    console.log(`  - ID: ${clinic.id}`);
    console.log(`  - Active: ${clinic.active}`);
    console.log(`\nAdmin:`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - UID: ${user.authUserId}`);
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Rôle: ${user.role}`);
    console.log(`  - Clinique ID: ${user.clinicId}`);
    console.log('='.repeat(60));
    console.log('\n✅ Opération terminée avec succès!');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erreur lors de la création:', error);
    console.error('Message:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
createClinicITA();
