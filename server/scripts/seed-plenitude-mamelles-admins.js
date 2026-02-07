// ============================================
// SCRIPT DE CRÉATION DES ADMINS PLENITUDE-001 ET MAMELLES-001
// LogiClinic SaaS - Même logique que CAMPUS-001
// ============================================
// - Utilise supabase.auth.admin.createUser
// - Ne force PAS le changement de mot de passe (email_confirm: true, status ACTIVE)
// - Crée la clinique si elle n'existe pas (non : les cliniques sont créées par la migration 84)
// - Récupère clinic_id, insère chaque admin dans users (auth_user_id, clinic_id, role CLINIC_ADMIN)
// - Idempotent : ne duplique pas si l'email existe déjà dans Auth
// - Isolation multi-tenant garantie par clinic_id
// ============================================

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.includes('your-service-role-key')) {
    console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans server/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Format pro pour Cursor / Backend (identifiants FIXES)
const CLINICS_CONFIG = {
    clinics: [
        {
            name: 'Clinique Plénitude',
            clinic_code: 'PLENITUDE-001',
            admins: [
                { email: 'laplenitude.hc@yahoo.com', password: 'TempPlenitude2026!', role: 'admin' },
                { email: 'hakpovi95@yahoo.fr', password: 'TempHakpovi2026!', role: 'admin' }
            ]
        },
        {
            name: 'Clinique Mamelles',
            clinic_code: 'MAMELLES-001',
            admins: [
                { email: 'dieudange@gmail.com', password: 'DDMamelles2026!', role: 'admin' }
            ]
        }
    ]
};

const ROLE_MAP = { admin: 'CLINIC_ADMIN' };

async function findAuthUserByEmail(email) {
    const normalized = email.toLowerCase().trim();
    let page = 1;
    const perPage = 1000;
    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) return { user: null, error };
        const user = data.users.find(u => (u.email || '').toLowerCase() === normalized);
        if (user) return { user, error: null };
        if (data.users.length < perPage) return { user: null, error: null };
        page++;
    }
}

async function ensureClinic(clinicCode) {
    const { data, error } = await supabase
        .from('clinics')
        .select('id, code, name')
        .eq('code', clinicCode)
        .maybeSingle();
    if (error) return { clinic: null, error };
    if (!data) return { clinic: null, error: new Error(`Clinique ${clinicCode} introuvable. Exécutez d'abord la migration 84_CREATE_PLENITUDE_AND_MAMELLES_CLINICS.sql`) };
    return { clinic: data, error: null };
}

async function run() {
    console.log('🚀 Création des cliniques PLENITUDE-001 et MAMELLES-001 (admins FIXES, idempotent)\n');
    const summary = { clinics: [], created: 0, existing: 0, errors: 0 };

    for (const clinicConfig of CLINICS_CONFIG.clinics) {
        const { name, clinic_code, admins } = clinicConfig;
        const { clinic, error: clinicError } = await ensureClinic(clinic_code);
        if (clinicError || !clinic) {
            console.error(`❌ ${clinic_code}: ${clinicError?.message || 'Clinique introuvable'}`);
            summary.errors++;
            continue;
        }
        console.log(`🏥 ${clinic_code} — ${name} (${clinic.id})\n`);

        const adminEmails = [];
        for (const admin of admins) {
            const email = (admin.email || '').toLowerCase().trim();
            const password = admin.password;
            const role = ROLE_MAP[admin.role] || 'CLINIC_ADMIN';

            let authUserId;
            const { user: existingUser, error: findError } = await findAuthUserByEmail(email);
            if (findError) {
                console.error(`   ❌ ${email}: ${findError.message}`);
                summary.errors++;
                continue;
            }
            if (existingUser) {
                authUserId = existingUser.id;
                console.log(`   ℹ️ ${email} — Auth existant`);
                summary.existing++;
            } else {
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { clinic_id: clinic.id, role, full_name: 'Admin' }
                });
                if (createError) {
                    console.error(`   ❌ ${email}: ${createError.message}`);
                    summary.errors++;
                    continue;
                }
                authUserId = newUser.user.id;
                console.log(`   ✅ ${email} — Auth créé`);
                summary.created++;
            }

            const fullName = 'Admin';
            const nom = 'Admin';
            const prenom = '';

            const { error: upsertError } = await supabase
                .from('users')
                .upsert({
                    auth_user_id: authUserId,
                    clinic_id: clinic.id,
                    email,
                    role: 'CLINIC_ADMIN',
                    status: 'ACTIVE',
                    nom,
                    prenom,
                    full_name: fullName,
                    fonction: 'Administrateur',
                    actif: true
                }, { onConflict: 'auth_user_id' });

            if (upsertError) {
                console.error(`   ❌ ${email} (users): ${upsertError.message}`);
                summary.errors++;
                continue;
            }
            console.log(`   ✅ ${email} — Profil users synchronisé`);
            adminEmails.push(email);
        }

        summary.clinics.push({
            clinic_code,
            name,
            clinic_id: clinic.id,
            admins: adminEmails
        });
        console.log('');
    }

    console.log('═'.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('═'.repeat(60));
    console.log(`   Créés (Auth):   ${summary.created}`);
    console.log(`   Existants:      ${summary.existing}`);
    console.log(`   Erreurs:        ${summary.errors}`);
    console.log('');
    summary.clinics.forEach(c => {
        console.log(`   ${c.clinic_code} (${c.clinic_id})`);
        c.admins.forEach(a => console.log(`      • ${a}`));
    });
    console.log('═'.repeat(60));
    console.log('✨ Terminé.');
    return summary;
}

run().catch(err => {
    console.error('💥 Erreur critique:', err);
    process.exit(1);
});
