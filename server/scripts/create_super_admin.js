const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Error: Env vars missing');
    process.exit(1);
}

const SUPER_ADMIN = {
    email: 'babocher21@gmail.com',
    password: 'BABOchif21',
    full_name: 'Baboni Cherif',
    prenom: 'Baboni',
    nom: 'Cherif'
};

async function apiCall(endpoint, method, body, extraHeaders = {}) {
    const url = `${SUPABASE_URL}${endpoint}`;
    const headers = {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        ...extraHeaders
    };

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }

    if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${JSON.stringify(data).slice(0, 300)}`);
    }
    return data;
}

async function main() {
    console.log('Creating Super Admin...');

    let authUserId;

    // 1. Create Auth User
    try {
        const created = await apiCall('/auth/v1/admin/users', 'POST', {
            email: SUPER_ADMIN.email,
            password: SUPER_ADMIN.password,
            email_confirm: true,
            user_metadata: {
                full_name: SUPER_ADMIN.full_name,
                role: 'SUPER_ADMIN'
            }
        });
        authUserId = created.id;
        console.log('Auth User Created:', authUserId);
    } catch (e) {
        if (e.message.includes('email') || e.message.includes('422')) {
            console.log('User may already exist in Auth, trying to find...');
            // Try to find in public.users
            const profile = await apiCall(`/rest/v1/users?email=eq.${SUPER_ADMIN.email}&select=auth_user_id`, 'GET');
            if (profile.length > 0) {
                authUserId = profile[0].auth_user_id;
                console.log('Found existing auth_user_id:', authUserId);
            } else {
                console.error('Cannot find existing user. Manual intervention needed.');
                process.exit(1);
            }
        } else {
            console.error('Auth Error:', e.message);
            process.exit(1);
        }
    }

    // 2. Create/Update Profile in public.users (no clinic_id for Super Admin)
    try {
        await apiCall('/rest/v1/users?on_conflict=auth_user_id', 'POST', {
            auth_user_id: authUserId,
            clinic_id: null, // Super Admin has no clinic
            email: SUPER_ADMIN.email,
            role: 'SUPER_ADMIN',
            nom: SUPER_ADMIN.nom,
            prenom: SUPER_ADMIN.prenom,
            full_name: SUPER_ADMIN.full_name,
            fonction: 'Super Administrateur',
            actif: true,
            status: 'ACTIVE'
        }, { 'Prefer': 'resolution=merge-duplicates' });

        console.log('Profile created/updated successfully!');
    } catch (e) {
        console.error('Profile Error:', e.message);
        process.exit(1);
    }

    console.log('');
    console.log('=== SUPER ADMIN CREATED ===');
    console.log('Email:', SUPER_ADMIN.email);
    console.log('Password:', SUPER_ADMIN.password);
    console.log('Role: SUPER_ADMIN');
    console.log('===========================');
}

main().catch(console.error);
