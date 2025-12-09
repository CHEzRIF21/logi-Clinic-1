import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration Supabase via variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL || 'https://bnfgemmlokvetmohiqch.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Créer le client Supabase
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });
  console.log('✅ Client Supabase initialisé pour le backend');
} else {
  console.warn('⚠️ Configuration Supabase manquante dans le backend');
  console.warn('Assurez-vous que SUPABASE_URL et SUPABASE_ANON_KEY sont définis dans .env');
}

export { supabase };
export default supabase;

