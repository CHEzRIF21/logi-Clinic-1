/**
 * Configuration centralisée Supabase pour le backend
 * Vérifie et valide la configuration avant de créer le client
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../../config.env') });

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://bnfgemmlokvetmohiqch.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Vérifier si les variables sont des placeholders ou manquantes
const isPlaceholder = (value: string): boolean => {
  return (
    value.includes('votre-projet') ||
    value.includes('votre-anon-key') ||
    value.includes('your-project') ||
    value === '' ||
    value.length < 10
  );
};

const hasValidConfig = supabaseUrl && supabaseAnonKey && !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

// Créer le client Supabase avec options optimisées
let supabase: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

if (hasValidConfig) {
  // Client standard (anon key) - pour les opérations utilisateur
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'logi-clinic-backend',
      },
    },
  });

  console.log('✅ Client Supabase initialisé pour le backend (anon key)');

  // Client admin (service role key) - pour les opérations administratives
  if (supabaseServiceRoleKey && !isPlaceholder(supabaseServiceRoleKey)) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'logi-clinic-backend-admin',
        },
      },
    });

    console.log('✅ Client Supabase Admin initialisé (service role key)');
  } else {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY non configuré - certaines opérations admin ne seront pas disponibles');
  }
} else {
  console.error('❌ Configuration Supabase manquante ou invalide dans le backend');
  console.error('Assurez-vous que SUPABASE_URL et SUPABASE_ANON_KEY sont définis dans .env ou config.env');
  console.error('URL:', supabaseUrl);
  console.error('Anon Key présent:', !!supabaseAnonKey);
}

// Fonction de test de connexion
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase || !hasValidConfig) {
    console.warn('⚠️ Test de connexion Supabase ignoré - configuration non valide');
    return false;
  }

  try {
    const { error } = await supabase
      .from('clinics')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.warn('⚠️ Table "clinics" n\'existe pas encore. Appliquez les migrations Supabase.');
      } else {
        console.error('❌ Erreur de connexion Supabase:', error);
      }
      return false;
    }

    console.log('✅ Connexion Supabase réussie!');
    return true;
  } catch (err: any) {
    console.warn('⚠️ Erreur lors du test de connexion Supabase:', err?.message || err);
    return false;
  }
};

// Exporter les clients
export { supabase, supabaseAdmin, hasValidConfig };
export default supabase;

