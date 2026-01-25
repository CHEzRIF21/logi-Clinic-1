// Client Supabase partagé pour toutes les Edge Functions
// NOTE: on utilise la clé "service role" côté backend Edge Functions
// afin d'éviter les blocages RLS. L'autorisation applicative doit être gérée
// au niveau des handlers (token/role/clinic context).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://bnfgemmlokvetmohiqch.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
