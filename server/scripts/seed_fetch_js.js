const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Error: Env vars missing');
    process.exit(1);
}

const CLINIC = {
    name: 'Clinique du Campus',
    code: 'CAMPUS-001'
};

const USERS = [
    {
        full_name: 'Bagara Yannick',
        email: 'bagarayannick1@gmail.com',
        role: 'CLINIC_ADMIN',
        fonction: 'Administrateur',
        password: 'BagaraYannick@LC'
    },
    {
        full_name: 'Akoutey Pelagie',
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
        full_name: 'Seidou Zoulehatou',
        email: 'seidouzoulehath@gmail.com',
        role: 'technicien_labo',
        fonction: 'Biologiste medicale',
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
        fonction: 'Medecin generaliste',
        password: 'DrJc@b!G58Q'
    },
    {
        full_name: 'Maninhou Murielle',
        email: 'muriellemaninhou@gmail.com',
        role: 'sage_femme',
        fonction: 'Sage-femme / Echographiste',
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
        full_name: 'Adjamonsi E. Ines-Aurore',
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
        full_name: 'Dotchamou Yeba Titilokpe Eleonore',
        email: 'dotchamouyebaeleonore@gmail.com',
        role: 'aide_soignant',
        fonction: 'Aide-soignante',
        password: 'El3oN0r@D!71'
    },
    {
        full_name: 'Moukaila Nouriatou',
        email: 'moukailanouriatou@gmail.com',
        role: 'caissier',
        fonction: 'Caissiere',
        password: 'N0ur!@T#66M'
    },
    {
        full_name: 'Kouassi Danielle',
        email: 'kdanielle985@gmail.com',
        role: 'imagerie',
        fonction: 'Tech. imagerie medicale',
        password: 'D@n!3ll#K94'
    },
    {
        full_name: 'Solete Ahoueffa Sehouegnon Elodie Marthe',
        email: 'elodiesolete@gmail.com',
        role: 'imagerie',
        fonction: 'Imagerie / Echo',
        password: 'El0d!e@S#83'
    },
    {
        full_name: 'Moussa Cherifath',
        email: 'cherifathmoussa14@gmail.com',
        role: 'caissier',
        fonction: 'Caissiere',
        password: 'Ch3r!F@th#59'
    }
];

async function apiCall(endpoint, method, body, extraHeaders = {}) {
    const url = `${SUPABASE_URL}${endpoint}`;
    const headers = {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        ...extraHeaders
    };

    // console.log(`Request: ${method} ${url}`);

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }

    if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${JSON.stringify(data).slice(0, 200)}...`);
    }
    return data;
}

async function main() {
    console.log('Starting seed via fetch...');

    // 1. Clinic
    let clinicId;
    try {
        const clinics = await apiCall(`/rest/v1/clinics?code=eq.${CLINIC.code}&select=id`, 'GET');
        if (clinics.length > 0) {
            clinicId = clinics[0].id;
            console.log(`Clinic exists: ${clinicId}`);
        } else {
            const res = await apiCall('/rest/v1/clinics', 'POST', {
                name: CLINIC.name,
                code: CLINIC.code,
                active: true
            }, { 'Prefer': 'return=representation' });
            clinicId = res[0].id;
            console.log(`Clinic created: ${clinicId}`);
        }
    } catch (e) {
        console.error('Failed to setup clinic:', e);
        process.exit(1);
    }

    // 2. Users
    for (const u of USERS) {
        let authId;

        // Try Create Auth User
        try {
            const created = await apiCall('/auth/v1/admin/users', 'POST', {
                email: u.email,
                password: u.password,
                email_confirm: true,
                user_metadata: {
                    full_name: u.full_name,
                    role: u.role,
                    fonction: u.fonction,
                    clinic_id: clinicId
                }
            });
            authId = created.id;
            console.log(`Created Auth: ${u.email}`);
        } catch (e) {
            // Check if error is "already registered"
            if (e.message.includes('already registered') || e.message.includes('unique_constraint')) {
                // Try to find existing auth user in public.users to get ID
                try {
                    const profile = await apiCall(`/rest/v1/users?email=eq.${u.email}&select=auth_user_id`, 'GET');
                    if (profile.length > 0) {
                        authId = profile[0].auth_user_id;
                        console.log(`Auth exists: ${u.email} (ID recovered)`);
                    } else {
                        console.error(`User ${u.email} exists in Auth but not in public.users. Cannot recover ID easily via REST.`);
                        continue;
                    }
                } catch (pe) {
                    console.error('Failed to lookup profile:', pe);
                }
            } else {
                console.error(`Auth Error for ${u.email}:`, e.message);
                continue;
            }
        }

        if (authId) {
            // Upsert Profile
            try {
                const nameParts = u.full_name.split(' ');
                const prenom = nameParts[0];
                const nom = nameParts.slice(1).join(' ') || prenom;

                await apiCall('/rest/v1/users?on_conflict=auth_user_id', 'POST', {
                    auth_user_id: authId,
                    clinic_id: clinicId,
                    email: u.email,
                    role: u.role,
                    nom: nom,
                    prenom: prenom,
                    full_name: u.full_name,
                    fonction: u.fonction,
                    actif: true,
                    status: 'ACTIVE'
                }, { 'Prefer': 'resolution=merge-duplicates' });

                console.log(`Profile updated: ${u.email}`);
            } catch (pe) {
                console.error(`Profile failed for ${u.email}:`, pe.message);
            }
        }
    }
    console.log('Seed completed.');
}

main().catch(console.error);
