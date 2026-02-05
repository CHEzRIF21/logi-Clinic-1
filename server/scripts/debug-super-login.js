
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function hashPassword(password) {
    return crypto.createHash('sha256').update(password + 'logi_clinic_salt').digest('hex');
}

async function debugLogin() {
    const emailLower = 'babocher21@gmail.com';
    const v_password_hash = hashPassword('SuperAdmin2024!');

    console.log('Querying for:', { emailLower, v_password_hash });

    const { data: user, error: userErr } = await supabase
        .from('users')
        .select('*')
        .ilike('email', emailLower)
        .eq('password_hash', v_password_hash)
        .is('clinic_id', null)
        .eq('role', 'SUPER_ADMIN')
        .eq('actif', true)
        .maybeSingle();

    if (userErr) {
        console.error('Error:', userErr);
    } else if (!user) {
        console.log('No user found');

        // Debug individual fields
        const { data: byEmail } = await supabase.from('users').select('email, password_hash, clinic_id, role, actif').ilike('email', emailLower);
        console.log('By Email:', byEmail);
    } else {
        console.log('User found:', user.email);
    }
}

debugLogin();
