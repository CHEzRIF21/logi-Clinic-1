// Edge Function pour synchroniser clinic_id dans user_metadata
// Cette fonction met à jour auth.users.raw_user_meta_data avec clinic_id
// pour que le JWT contienne clinic_id dans les claims

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  auth_user_id: string;
  clinic_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase avec service_role pour accès admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Vérifier l'authentification (optionnel, peut être appelé par un trigger)
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Non autorisé' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Parser le body
    const body: SyncRequest = await req.json();
    const { auth_user_id, clinic_id } = body;

    if (!auth_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'auth_user_id requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Récupérer clinic_id depuis public.users si non fourni
    let final_clinic_id = clinic_id;
    
    if (!final_clinic_id) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('clinic_id')
        .eq('auth_user_id', auth_user_id)
        .single();

      if (userError || !userData) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Utilisateur non trouvé dans public.users',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      final_clinic_id = userData.clinic_id;
    }

    // Récupérer les métadonnées actuelles de l'utilisateur
    const { data: { user: authUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
      auth_user_id
    );

    if (getUserError || !authUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Utilisateur non trouvé dans Supabase Auth',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Mettre à jour user_metadata avec clinic_id
    const currentMetadata = authUser.user_metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      clinic_id: final_clinic_id,
    };

    // Mettre à jour l'utilisateur dans Supabase Auth
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      auth_user_id,
      {
        user_metadata: updatedMetadata,
      }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erreur lors de la mise à jour: ${updateError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'clinic_id synchronisé dans user_metadata avec succès',
        auth_user_id,
        clinic_id: final_clinic_id,
        user_metadata: updatedUser.user.user_metadata,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erreur dans sync-clinic-id-metadata:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur interne du serveur',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

