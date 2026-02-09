/**
 * ============================================
 * CRÉATION CLINIQUE ITA-001 + UTILISATEURS (BABONI Chérif, Ricardo)
 * LogiClinic - Multi-tenant (isolation par clinic_id)
 * ============================================
 *
 * Ce script :
 * 1. Crée ou met à jour la clinique ITA (code ITA-001) dans la table clinics
 * 2. Crée chaque utilisateur dans Supabase Auth (email/password, email confirmé)
 * 3. Insère les enregistrements dans public.users (profil lié à auth.users) avec clinic_id = ITA-001
 * 4. Utilise les role_code LogiClinic : admin (administrateur clinique), medecin (médecin)
 *
 * Note : LogiClinic utilise la table public.users (liaison auth_user_id), pas "profiles".
 * Les politiques RLS assurent l'isolation : chaque utilisateur ne voit que les données de sa clinique.
 *
 * Prérequis : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans server/.env
 * Exécution : node server/scripts/create-clinic-ita-001-and-users.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.includes('your-service-role-key')) {
    console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans server/.env');
    console.log('Récupérez la clé "service_role" dans Supabase Dashboard > Settings > API');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const CLINIC = {
    code: 'ITA-001',
    name: 'ITA',
    active: true
};

// Rôle métier → role_code LogiClinic (admin = accès complet clinique, medecin = consultations/prescriptions)
const USERS = [
    {
        full_name: 'BABONI Chérif',
        email: 'cbabonimamadou@gmail.com',
        password: 'CHERIF1234',
        role: 'admin',
        fonction: 'Administrateur clinique'
    },
    {
        full_name: 'Ricardo',
        email: 'argh2014@gmail.com',
        password: 'RICA1234',
        role: 'medecin',
        fonction: 'Médecin'
    }
];

function parseFullName(fullName) {
    const parts = (fullName || '').trim().split(/\s+/);
    const prenom = parts[0] || fullName;
    const nom = parts.slice(1).join(' ') || prenom;
    return { nom, prenom };
}

async function run() {
    console.log('🚀 Création clinique ITA-001 et utilisateurs LogiClinic\n');
    console.log('─'.repeat(60));

    // ─── 1. Créer ou mettre à jour la clinique ITA-001 ───
    console.log('\n🏥 Étape 1 : Clinique ITA-001');
    const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .upsert(
            {
                name: CLINIC.name,
                code: CLINIC.code,
                active: CLINIC.active
            },
            { onConflict: 'code' }
        )
        .select('id, code, name')
        .single();

    if (clinicError || !clinic) {
        console.error('❌ Erreur clinique:', clinicError?.message || 'Échec upsert');
        process.exit(1);
    }
    console.log(`✅ Clinique prête : ${clinic.code} – ${clinic.name} (${clinic.id})\n`);

    // ─── 2. Créer les utilisateurs Auth + public.users ───
    console.log('👥 Étape 2 : Utilisateurs Auth + public.users\n');
    const results = [];

    for (const u of USERS) {
        const emailLower = u.email.toLowerCase().trim();
        process.stdout.write(`   ${u.full_name} (${u.email})... `);

        try {
            const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
            const existingAuth = listData?.users?.find(x => x.email === emailLower);
            let authUserId;
            let wasExisting = false;

            if (existingAuth) {
                authUserId = existingAuth.id;
                wasExisting = true;
                console.log('Auth existant');
            } else {
                const { data: newAuth, error: authError } = await supabase.auth.admin.createUser({
                    email: emailLower,
                    password: u.password,
                    email_confirm: true,
                    user_metadata: {
                        full_name: u.full_name,
                        role: u.role,
                        fonction: u.fonction,
                        clinic_id: clinic.id
                    }
                });
                if (authError || !newAuth?.user) {
                    console.log('❌ Auth:', authError?.message);
                    results.push({ email: u.email, status: 'error', message: authError?.message });
                    continue;
                }
                authUserId = newAuth.user.id;
                console.log('Auth créé');
            }

            const { nom, prenom } = parseFullName(u.full_name);
            const row = {
                auth_user_id: authUserId,
                clinic_id: clinic.id,
                email: emailLower,
                full_name: u.full_name,
                nom,
                prenom,
                role: u.role,
                fonction: u.fonction,
                actif: true,
                status: 'ACTIVE'
            };

            const { error: upsertError } = await supabase
                .from('users')
                .upsert(row, { onConflict: 'auth_user_id' });

            if (upsertError) {
                console.log('❌ users:', upsertError.message);
                results.push({ email: u.email, status: 'error', message: upsertError.message });
                continue;
            }

            results.push({ email: u.email, status: 'ok', message: wasExisting ? 'Profil mis à jour' : 'Créé' });
        } catch (err) {
            console.log('❌', err.message);
            results.push({ email: u.email, status: 'error', message: err.message });
        }
    }

    // ─── 3. Résumé ───
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('═'.repeat(60));
    const ok = results.filter(r => r.status === 'ok');
    const errors = results.filter(r => r.status === 'error');
    console.log(`✅ Créés / mis à jour : ${ok.length}`);
    console.log(`❌ Erreurs            : ${errors.length}`);
    if (errors.length) {
        console.log('\nDétail erreurs :');
        errors.forEach(r => console.log(`   ${r.email}: ${r.message}`));
    }
    console.log('\n🔒 Isolation multi-tenant : chaque utilisateur ne voit que les données de ITA-001 (RLS).');
    console.log('   Admin : gestion des membres + accès à tous les modules de la clinique.');
    console.log('   Médecin : dossiers patients, consultations, prescriptions (pas de gestion utilisateurs).');
    console.log('═'.repeat(60));
}

run().catch(err => {
    console.error('💥 Erreur:', err);
    process.exit(1);
});
