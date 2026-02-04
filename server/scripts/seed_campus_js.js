const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Env vars missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

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

async function seedCampus001Users() {
    console.log('Starting seed...');

    // 1. Clinic
    console.log(`Clinic: ${CLINIC.name} (${CLINIC.code})...`);

    try {
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
            console.error(`Clinic Error ${CLINIC.code}:`, clinicError.message);
            process.exit(1);
        }

        console.log(`Clinic OK: ${clinic.id}`);

        // 2. Users
        for (const userData of USERS) {
            console.log(`User: ${userData.full_name} (${userData.email})...`);

            try {
                const { data: existingUsers } = await supabase.auth.admin.listUsers();
                let existingUser = null;
                if (existingUsers && existingUsers.users) {
                    existingUser = existingUsers.users.find(u => u.email === userData.email);
                }

                let authUserId;

                if (!existingUser) {
                    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
                        email: userData.email,
                        password: userData.password,
                        email_confirm: true,
                        user_metadata: {
                            full_name: userData.full_name,
                            role: userData.role,
                            fonction: userData.fonction,
                            clinic_id: clinic.id
                        }
                    });

                    if (authError) {
                        console.error(`Auth Error: ${authError.message}`);
                        continue;
                    }
                    authUserId = newUser.user.id;
                    console.log(`Auth Created: ${authUserId}`);
                } else {
                    authUserId = existingUser.id;
                    console.log(`Auth Exists: ${authUserId}`);
                }

                const nameParts = userData.full_name.split(' ');
                const prenom = nameParts[0];
                const nom = nameParts.slice(1).join(' ') || prenom;

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
                    console.error(`Profile Error: ${profileError.message}`);
                    continue;
                }
                console.log(`Profile OK`);

            } catch (error) {
                console.error(`Exception: ${error.message}`);
            }
        }
        console.log('Done!');
    } catch (e) {
        console.error('Mega Error:', e);
    }
}

seedCampus001Users().catch(err => {
    console.error('Critical Error:', err);
    process.exit(1);
});
