import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Charger les variables d'environnement
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

const CLINICS = [
    { name: 'Clinique du Campus', code: 'CAMPUS-00A' },
    { name: 'Clinique La plenitude', code: 'PLENITUDE-00B' },
    { name: 'Clinique Mamelle de Save', code: 'MAMELLE-00C' }
];

const ROLES = [
    { id: 'admin', role: 'CLINIC_ADMIN', nom: 'Administrateur', prenom: 'Chef' },
    { id: 'medecin', role: 'medecin', nom: 'Médecin', prenom: 'Traitant' },
    { id: 'pharmacien', role: 'pharmacien', nom: 'Pharmacien', prenom: 'Responsable' }
];

const DEFAULT_PASSWORD = 'Logiclinic@2026';

async function seed() {
    console.log('🚀 Démarrage de l\'initialisation des cliniques et agents...');

    for (const clinicData of CLINICS) {
        console.log(`\n🏥 Traitement de la clinique: ${clinicData.name} (${clinicData.code})...`);

        // 1. Créer ou récupérer la clinique
        const { data: clinic, error: clinicError } = await supabase
            .from('clinics')
            .upsert({
                name: clinicData.name,
                code: clinicData.code,
                active: true
            }, { onConflict: 'code' })
            .select()
            .single();

        if (clinicError) {
            console.error(`❌ Erreur clinique ${clinicData.code}:`, clinicError.message);
            continue;
        }

        console.log(`✅ Clinique prête: ${clinic.id}`);

        // 2. Créer les agents
        for (const roleData of ROLES) {
            const email = `${roleData.id}@${clinic.code.toLowerCase()}.logi`.replace(/-/g, '.');
            console.log(`   👤 Création de l'agent: ${email}...`);

            // Vérifier si l'utilisateur auth existe déjà
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers.users.find(u => u.email === email);

            let authUserId;

            if (!existingUser) {
                // Créer l'utilisateur Auth (Admin API bipasse la confirmation email)
                const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
                    email: email,
                    password: DEFAULT_PASSWORD,
                    email_confirm: true,
                    user_metadata: {
                        role: roleData.role,
                        clinic_id: clinic.id,
                        nom: roleData.nom,
                        prenom: roleData.prenom
                    }
                });

                if (authError) {
                    console.error(`      ❌ Erreur Auth pour ${email}:`, authError.message);
                    continue;
                }
                authUserId = newUser.user.id;
                console.log(`      ✅ Utilisateur Auth créé: ${authUserId}`);
            } else {
                authUserId = existingUser.id;
                console.log(`      ℹ️ Utilisateur Auth existe déjà: ${authUserId}`);
            }

            // 3. Créer ou mettre à jour le profil dans public.users
            const { error: profileError } = await supabase
                .from('users')
                .upsert({
                    auth_user_id: authUserId,
                    clinic_id: clinic.id,
                    email: email,
                    role: roleData.role,
                    nom: roleData.nom,
                    prenom: roleData.prenom,
                    actif: true,
                    status: 'ACTIVE'
                }, { onConflict: 'auth_user_id' });

            if (profileError) {
                console.error(`      ❌ Erreur Profil pour ${email}:`, profileError.message);
            } else {
                console.log(`      ✅ Profil public mis à jour.`);
            }
        }
    }

    console.log('\n✨ Initialisation terminée avec succès !');
}

seed().catch(err => {
    console.error('💥 Erreur critique:', err);
    process.exit(1);
});
