// Handler products pour Supabase Edge Functions
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';

export default async function handler(req: Request, path: string): Promise<Response> {
  return new Response(
    JSON.stringify({ success: false, message: 'Route products - À implémenter' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
