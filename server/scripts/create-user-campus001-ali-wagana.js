/**
 * ============================================
 * CRÉATION UTILISATEUR CAMPUS-001 : ALI WAGANA Islamiath
 * LogiClinic - Multi-tenant (isolation par clinic_id)
 * ============================================
 *
 * Ce script :
 * 1. Crée l'utilisateur dans Supabase Auth (email/password)
 * 2. Insère l'enregistrement dans public.users avec clinic_id = CAMPUS-001
 * 3. Garantit l'isolation : l'utilisateur n'accède qu'aux données de sa clinique
 *
 * Prérequis : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans server/.env
 * Exécution : node server/scripts/create-user-campus001-ali-wagana.js
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

// Données utilisateur (CAMPUS-001)
const USER = {
    full_name: 'ALI WAGANA Islamiath',
    email: 'islamiathaliwag@gmail.com',
    password: 'IslaWagana#26',
    role: 'staff_nurse',
    fonction: 'Infirmière',
    clinic_code: 'CAMPUS-001'
};

async function createUser() {
    console.log('🚀 Création utilisateur LogiClinic – CAMPUS-001\n');
    console.log('─'.repeat(60));

    // 1. Récupérer clinic_id pour CAMPUS-001
    const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('id, code, name')
        .eq('code', USER.clinic_code)
        .single();

    if (clinicError || !clinic) {
        console.error('❌ Clinique CAMPUS-001 introuvable:', clinicError?.message || 'Non trouvée');
        process.exit(1);
    }
    console.log(`✅ Clinique: ${clinic.code} – ${clinic.name} (${clinic.id})\n`);

    const emailLower = USER.email.toLowerCase().trim();

    // 2. Vérifier si l'utilisateur Auth existe déjà
    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existingAuth = listData?.users?.find(u => u.email === emailLower);

    let authUserId;

    if (existingAuth) {
        authUserId = existingAuth.id;
        console.log(`ℹ️ Utilisateur Auth déjà existant: ${authUserId}`);
    } else {
        const { data: newAuth, error: authError } = await supabase.auth.admin.createUser({
            email: emailLower,
            password: USER.password,
            email_confirm: true,
            user_metadata: {
                full_name: USER.full_name,
                role: USER.role,
                fonction: USER.fonction,
                clinic_id: clinic.id
            }
        });

        if (authError || !newAuth?.user) {
            console.error('❌ Erreur création Auth:', authError?.message || 'Inconnue');
            process.exit(1);
        }
        authUserId = newAuth.user.id;
        console.log(`✅ Utilisateur Auth créé: ${authUserId}`);
    }

    // 3. Nom / prénom (full_name = "ALI WAGANA Islamiath" → prenom = premier mot, nom = reste)
    const parts = USER.full_name.trim().split(/\s+/);
    const prenom = parts[0] || USER.full_name;
    const nom = parts.slice(1).join(' ') || prenom;

    // 4. Insertion ou mise à jour dans public.users (profil lié à auth.users)
    const row = {
        auth_user_id: authUserId,
        clinic_id: clinic.id,
        email: emailLower,
        full_name: USER.full_name,
        nom,
        prenom,
        role: USER.role,
        fonction: USER.fonction,
        actif: true,
        status: 'ACTIVE'
    };

    const { error: upsertError } = await supabase
        .from('users')
        .upsert(row, { onConflict: 'auth_user_id' });

    if (upsertError) {
        console.error('❌ Erreur insertion public.users:', upsertError.message);
        process.exit(1);
    }
    console.log('✅ Enregistrement public.users créé/mis à jour (clinic_id = CAMPUS-001)\n');

    console.log('─'.repeat(60));
    console.log('📋 RÉSUMÉ');
    console.log('─'.repeat(60));
    console.log('   Email:        ', USER.email);
    console.log('   Nom complet:  ', USER.full_name);
    console.log('   Rôle:         ', USER.role);
    console.log('   Fonction:     ', USER.fonction);
    console.log('   Code clinique:', USER.clinic_code);
    console.log('   Auth user ID: ', authUserId);
    console.log('');
    console.log('🔒 Isolation multi-tenant : l’utilisateur ne verra que les données de CAMPUS-001.');
    console.log('   Les politiques RLS (get_my_clinic_id, users_staff_read_colleagues) assurent l’isolation.');
    console.log('═'.repeat(60));
}

createUser().catch(err => {
    console.error('💥 Erreur:', err);
    process.exit(1);
});
