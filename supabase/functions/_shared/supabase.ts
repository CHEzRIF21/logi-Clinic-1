// Client Supabase partagé pour toutes les Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://bnfgemmlokvetmohiqch.supabase.co';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
