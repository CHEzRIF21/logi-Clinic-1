import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// ============================================
// SCRIPT DE CRÉATION DES UTILISATEURS CAMPUS-001
// LogiClinic - Exécution par Super Admin uniquement
// Date: 2026-02-04
// ============================================

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.includes('your-service-role-key')) {
    console.error('❌ Erreur: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans server/.env');
    console.log('Récupérez votre "service_role" key dans Supabase Dashboard > Settings > API');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Configuration de la clinique CAMPUS-001
const CLINIC = {
    name: 'Clinique du Campus',
    code: 'CAMPUS-001'
};

// Liste des utilisateurs avec mots de passe uniques
const USERS = [
    {
        full_name: 'Bagara Yannick',
        email: 'bagarayannick1@gmail.com',
        role: 'CLINIC_ADMIN',
        fonction: 'Administrateur',
        password: 'BagaraYannick@LC'
    },
    {
        full_name: 'Akoutey Pélagie',
        email: 'pelagakoute@gmail.com',
        role: 'sage_femme',
        fonction: 'Sage-femme',
        password: 'Pel@9Aky!27mF'
    },
    {
        full_name: 'Todjiclounon Djijoho Godfreed Ariel',
        email: 'arieltodjiclounon@gmail.com',
        role: 'infirmier',
        fonction: 'IDE',
        password: 'Ar!elT0dj#94Q'
    },
    {
        full_name: 'Seidou Zouléhatou',
        email: 'seidouzoulehath@gmail.com',
        role: 'technicien_labo',
        fonction: 'Biologiste médicale',
        password: 'ZouL3h@t!82S'
    },
    {
        full_name: "N'Koue Charlotte",
        email: 'charlottenkoue8@gmail.com',
        role: 'aide_soignant',
        fonction: 'Aide-soignante',
        password: 'Ch@rL0t#Nk91'
    },
    {
        full_name: 'Agossoukpe Jesusgnon Jacob Credo',
        email: 'jacobcredo38@gmail.com',
        role: 'medecin',
        fonction: 'Médecin généraliste',
        password: 'DrJc@b!G58Q'
    },
    {
        full_name: 'Maninhou Murielle',
        email: 'muriellemaninhou@gmail.com',
        role: 'sage_femme',
        fonction: 'Sage-femme / Échographiste',
        password: 'MuR!3ll@92H'
    },
    {
        full_name: 'Zannou Amen Christelle',
        email: 'zannouchristelle21@gmail.com',
        role: 'technicien_labo',
        fonction: 'Tech. sup. laboratoire',
        password: 'Am3nZ@n#C47'
    },
    {
        full_name: 'Salifou Ninsiratou',
        email: 'ninsiratousalifou97@gmail.com',
        role: 'aide_soignant',
        fonction: 'Aide-soignante',
        password: 'N!ns@R4tu93'
    },
    {
        full_name: 'Adjamonsi E. Inès-Aurore',
        email: 'aurorea135@gmail.com',
        role: 'infirmier',
        fonction: 'IDE',
        password: 'In3s@ur0r#88'
    },
    {
        full_name: 'Codjo H. Ambroisine',
        email: 'ambroisine053@gmail.com',
        role: 'aide_soignant',
        fonction: 'Aide-soignante',
        password: 'AmbR0s!n#54'
    },
    {
        full_name: 'Dotchamou Yeba Titilokpe Eléonore',
        email: 'dotchamouyebaeleonore@gmail.com',
        role: 'aide_soignant',
        fonction: 'Aide-soignante',
        password: 'El3oN0r@D!71'
    },
    {
        full_name: 'Moukaila Nouriatou',
        email: 'moukailanouriatou@gmail.com',
        role: 'caissier',
        fonction: 'Caissière',
        password: 'N0ur!@T#66M'
    },
    {
        full_name: 'Kouassi Danielle',
        email: 'kdanielle985@gmail.com',
        role: 'imagerie',
        fonction: 'Tech. imagerie médicale',
        password: 'D@n!3ll#K94'
    },
    {
        full_name: 'Solete Ahoueffa Sèhouegnon Élodie Marthe',
        email: 'elodiesolete@gmail.com',
        role: 'imagerie',
        fonction: 'Imagerie / Écho',
        password: 'El0d!e@S#83'
    },
    {
        full_name: 'Moussa Cherifath',
        email: 'cherifathmoussa14@gmail.com',
        role: 'caissier',
        fonction: 'Caissière',
        password: 'Ch3r!F@th#59'
    }
];

interface SeedResult {
    email: string;
    status: 'created' | 'exists' | 'error';
    message: string;
}

async function seedCampus001Users() {
    console.log('🚀 Démarrage de la création des utilisateurs CAMPUS-001...\n');

    const results: SeedResult[] = [];

    // 1. Récupérer ou créer la clinique CAMPUS-001
    console.log(`🏥 Récupération de la clinique: ${CLINIC.name} (${CLINIC.code})...`);

    const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .upsert({
            name: CLINIC.name,
            code: CLINIC.code,
            active: true
        }, { onConflict: 'code' })
        .select()
        .single();

    if (clinicError) {
        console.error(`❌ Erreur clinique ${CLINIC.code}:`, clinicError.message);
        console.log('\n⚠️ Assurez-vous que la table "clinics" existe dans Supabase.');
        process.exit(1);
    }

    console.log(`✅ Clinique prête: ${clinic.id}\n`);
    console.log('─'.repeat(60));

    // 2. Créer chaque utilisateur
    for (const userData of USERS) {
        console.log(`\n👤 Traitement: ${userData.full_name} (${userData.email})...`);

        try {
            // Vérifier si l'utilisateur auth existe déjà (par email)
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            // Typage assoupli pour ce script de seed
            const existingUser = (existingUsers as any)?.users?.find((u: any) => u.email === userData.email);

            let authUserId: string;

            if (!existingUser) {
                // Créer l'utilisateur via Admin API
                const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
                    email: userData.email,
                    password: userData.password,
                    email_confirm: true, // Marquer l'email comme confirmé
                    user_metadata: {
                        full_name: userData.full_name,
                        role: userData.role,
                        fonction: userData.fonction,
                        clinic_id: clinic.id
                    }
                });

                if (authError) {
                    results.push({
                        email: userData.email,
                        status: 'error',
                        message: authError.message
                    });
                    console.error(`   ❌ Erreur Auth: ${authError.message}`);
                    continue;
                }

                authUserId = newUser.user.id;
                console.log(`   ✅ Utilisateur Auth créé: ${authUserId}`);
            } else {
                authUserId = existingUser.id;
                console.log(`   ℹ️ Utilisateur Auth existe déjà: ${authUserId}`);
            }

            // 3. Extraire nom et prénom du full_name
            const nameParts = userData.full_name.split(' ');
            const prenom = nameParts[0];
            const nom = nameParts.slice(1).join(' ') || prenom;

            // 4. Créer ou mettre à jour le profil dans public.users
            const { error: profileError } = await supabase
                .from('users')
                .upsert({
                    auth_user_id: authUserId,
                    clinic_id: clinic.id,
                    email: userData.email,
                    role: userData.role,
                    nom: nom,
                    prenom: prenom,
                    full_name: userData.full_name,
                    fonction: userData.fonction,
                    actif: true,
                    status: 'ACTIVE'
                }, { onConflict: 'auth_user_id' });

            if (profileError) {
                results.push({
                    email: userData.email,
                    status: 'error',
                    message: `Profil: ${profileError.message}`
                });
                console.error(`   ❌ Erreur Profil: ${profileError.message}`);
                continue;
            }

            results.push({
                email: userData.email,
                status: existingUser ? 'exists' : 'created',
                message: existingUser ? 'Profil mis à jour' : 'Compte créé avec succès'
            });
            console.log(`   ✅ Profil public mis à jour.`);

        } catch (error: any) {
            results.push({
                email: userData.email,
                status: 'error',
                message: error.message || 'Erreur inconnue'
            });
            console.error(`   ❌ Exception: ${error.message}`);
        }
    }

    // 5. Afficher le résumé
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RÉSUMÉ DE L\'OPÉRATION');
    console.log('═'.repeat(60) + '\n');

    const created = results.filter(r => r.status === 'created');
    const existing = results.filter(r => r.status === 'exists');
    const errors = results.filter(r => r.status === 'error');

    console.log(`✅ Créés:    ${created.length}`);
    console.log(`ℹ️ Existants: ${existing.length}`);
    console.log(`❌ Erreurs:   ${errors.length}`);

    if (created.length > 0) {
        console.log('\n📝 Comptes créés:');
        created.forEach(r => console.log(`   • ${r.email}`));
    }

    if (errors.length > 0) {
        console.log('\n⚠️ Erreurs:');
        errors.forEach(r => console.log(`   • ${r.email}: ${r.message}`));
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✨ Opération terminée !');
    console.log('═'.repeat(60));

    return results;
}

// Exécuter le script
seedCampus001Users().catch(err => {
    console.error('💥 Erreur critique:', err);
    process.exit(1);
});
