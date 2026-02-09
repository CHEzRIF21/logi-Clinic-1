/**
 * ============================================
 * CRÉATION UTILISATEURS MAMELLES-001 (Les Mamelles de Savè)
 * LogiClinic - Multi-tenant (isolation par clinic_id)
 * ============================================
 *
 * Ce script :
 * 1. Crée chaque utilisateur dans Supabase Auth (email/password, email confirmé)
 * 2. Insère l'enregistrement dans public.users (profil lié à auth.users) avec clinic_id = MAMELLES-001
 * 3. Garantit l'isolation RLS : chaque utilisateur ne voit que les données de MAMELLES-001
 *
 * Note : LogiClinic utilise la table public.users (liaison auth_user_id), pas "profiles".
 *
 * Prérequis : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans server/.env
 * Exécution : node server/scripts/create-users-mamelles-001.js
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

const CLINIC_CODE = 'MAMELLES-001';

// Liste des utilisateurs à créer (un seul compte Auth par email)
// MITOBABA Expera (n°7) a le même email que MITOBABA Chabelle (n°6) → un seul compte créé pour Chabelle, Expera nécessite un email distinct
const USERS = [
    { full_name: 'Richy MITOKPE', email: 'richylheureux@gmail.com', password: 'Imagi26@R', role: 'imaging_tech', fonction: 'Technicien imagerie' },
    { full_name: 'TOSSOU Francine', email: 'tossoufrancine1@gmail.com', password: 'Echo-F26', role: 'imaging_tech', fonction: 'Technicienne imagerie' },
    { full_name: 'SAKA Cristelle', email: 'christellesaka59@gmail.com', password: 'Labo26#C', role: 'lab_tech', fonction: 'Technicienne laboratoire' },
    { full_name: 'GUIDIGAN Gloria', email: 'gloriaguidigan@gmail.com', password: 'GloLab26!', role: 'lab_tech', fonction: 'Technicienne laboratoire' },
    { full_name: 'CHABI Isabelle', email: 'isabchabi@gmail.com', password: 'Sage26!I', role: 'midwife', fonction: 'Sage-femme' },
    { full_name: 'MITOBABA Chabelle', email: 'chabellemitobaba@gmail.com', password: 'Chab@26S', role: 'midwife', fonction: 'Sage-femme' },
    // MITOBABA Expera : même email que Chabelle → pas de second compte Auth possible ; créer un compte séparé si besoin avec un email dédié
    { full_name: 'BALLOGOUN Tawakalitou', email: 'ballogoun.tawakalitou@mamelles.local', password: 'Nurse26@T', role: 'nurse', fonction: 'Infirmier(ère)' },
    { full_name: 'BOKO Josué', email: 'bokojosue0@gmail.com', password: 'Boko26!N', role: 'nurse', fonction: 'Infirmier(ère)' },
    { full_name: 'Azongbo Bernadette', email: 'azongbob@gmail.com', password: 'Azon26@N', role: 'nurse', fonction: 'Infirmier(ère)' },
    { full_name: 'Adda Gislaine', email: 'addagislaine@gmail.com', password: 'Adda-N26', role: 'nurse', fonction: 'Infirmier(ère)' },
    { full_name: 'BACHABI Ganiratou', email: 'bachabi.ganiratou@mamelles.local', password: 'Pharma26!B', role: 'pharmacist', fonction: 'Pharmacien(ne)' },
    { full_name: 'ADETOUNDE Gildas', email: 'adeyemi.gildas@mamelles.local', password: 'Fin26@GA', role: 'finance', fonction: 'Finances' }
];

function parseFullName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    const prenom = parts[0] || fullName;
    const nom = parts.slice(1).join(' ') || prenom;
    return { nom, prenom };
}

async function run() {
    console.log('🚀 Création des utilisateurs LogiClinic – MAMELLES-001 (Les Mamelles de Savè)\n');
    console.log('─'.repeat(60));

    const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('id, code, name')
        .eq('code', CLINIC_CODE)
        .single();

    if (clinicError || !clinic) {
        console.error('❌ Clinique MAMELLES-001 introuvable:', clinicError?.message || 'Non trouvée');
        process.exit(1);
    }
    console.log(`✅ Clinique: ${clinic.code} – ${clinic.name} (${clinic.id})\n`);

    const results = [];
    const seenEmails = new Set();

    for (const u of USERS) {
        const emailLower = u.email.toLowerCase().trim();
        if (seenEmails.has(emailLower)) {
            console.log(`⏭️  Ignoré (email en doublon): ${u.full_name} (${u.email})`);
            results.push({ email: u.email, status: 'skipped', message: 'Email en doublon dans la liste' });
            continue;
        }
        seenEmails.add(emailLower);

        process.stdout.write(`👤 ${u.full_name} (${u.email})... `);

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
                    console.log('❌ Erreur Auth:', authError?.message);
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
                console.log('❌ Erreur users:', upsertError.message);
                results.push({ email: u.email, status: 'error', message: upsertError.message });
                continue;
            }

            results.push({ email: u.email, status: 'ok', message: wasExisting ? 'Profil mis à jour' : 'Créé' });
        } catch (err) {
            console.log('❌', err.message);
            results.push({ email: u.email, status: 'error', message: err.message });
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('═'.repeat(60));
    const ok = results.filter(r => r.status === 'ok');
    const errors = results.filter(r => r.status === 'error');
    const skipped = results.filter(r => r.status === 'skipped');
    console.log(`✅ Créés / mis à jour : ${ok.length}`);
    console.log(`⏭️  Ignorés (doublon) : ${skipped.length}`);
    console.log(`❌ Erreurs            : ${errors.length}`);
    if (errors.length) {
        console.log('\nDétail erreurs:');
        errors.forEach(r => console.log(`   ${r.email}: ${r.message}`));
    }
    console.log('\n🔒 Isolation multi-tenant : chaque utilisateur ne voit que les données de MAMELLES-001 (RLS).');
    console.log('\n⚠️  MITOBABA Expera (n°7) : même email que MITOBABA Chabelle. Un seul compte Auth par email.');
    console.log('   Pour un compte séparé pour Expera, utilisez un email dédié puis relancez le script.');
    console.log('═'.repeat(60));
}

run().catch(err => {
    console.error('💥 Erreur:', err);
    process.exit(1);
});
