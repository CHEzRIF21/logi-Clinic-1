// Edge Function: Conversion du code clinique temporaire en code permanent
// Usage: POST /functions/v1/convert-clinic-code
// Headers: Authorization: Bearer <ACCESS_TOKEN>
// Body: { currentCode, newPermanentCode, newPassword? }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConvertCodeRequest {
  currentCode: string;
  newPermanentCode: string;
  newPassword?: string;
}

interface ValidateCodeRequest {
  clinicCode: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier que la requête est authentifiée
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Créer client Supabase avec service role key pour les opérations admin
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

    // Créer client Supabase pour vérifier l'utilisateur authentifié
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Vérifier l'utilisateur authentifié
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Récupérer l'utilisateur de la table users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, status, clinic_id, email')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Vérifier que l'utilisateur est CLINIC_ADMIN ou SUPER_ADMIN
    if (!['CLINIC_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(userData.role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Only clinic administrators can convert clinic codes',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // Route: POST /convert-clinic-code/validate - Valider un code
    if (req.method === 'POST' && action === 'validate') {
      const body: ValidateCodeRequest = await req.json();
      const { clinicCode } = body;

      if (!clinicCode) {
        return new Response(
          JSON.stringify({ success: false, error: 'clinicCode is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Vérifier si c'est un code temporaire
      const { data: tempCode, error: tempError } = await supabaseAdmin
        .from('clinic_temporary_codes')
        .select(`
          id,
          clinic_id,
          temporary_code,
          expires_at,
          is_used,
          is_converted,
          clinics!inner(id, name, code, active)
        `)
        .eq('temporary_code', clinicCode.toUpperCase())
        .single();

      if (tempError || !tempCode) {
        // Vérifier si c'est un code permanent normal
        const { data: clinic, error: clinicError } = await supabaseAdmin
          .from('clinics')
          .select('id, code, name, is_temporary_code, requires_code_change, active')
          .eq('code', clinicCode.toUpperCase())
          .single();

        if (clinicError || !clinic) {
          return new Response(
            JSON.stringify({
              success: false,
              isTemporary: false,
              message: 'Code clinique non trouvé',
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            isTemporary: clinic.is_temporary_code || false,
            requiresCodeChange: clinic.requires_code_change || false,
            clinic: {
              id: clinic.id,
              code: clinic.code,
              name: clinic.name,
              active: clinic.active,
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // C'est un code temporaire
      const isExpired = new Date(tempCode.expires_at) < new Date();
      
      return new Response(
        JSON.stringify({
          success: !isExpired && !tempCode.is_converted,
          isTemporary: true,
          isUsed: tempCode.is_used,
          isConverted: tempCode.is_converted,
          isExpired: isExpired,
          requiresCodeChange: !tempCode.is_converted,
          expiresAt: tempCode.expires_at,
          clinic: {
            id: tempCode.clinic_id,
            code: tempCode.temporary_code,
            name: (tempCode.clinics as any)?.name,
            active: (tempCode.clinics as any)?.active,
          },
          message: isExpired 
            ? 'Le code temporaire a expiré. Contactez le Super-Admin.'
            : tempCode.is_converted 
              ? 'Ce code a déjà été converti en code permanent.'
              : 'Code temporaire valide. Définissez un code permanent après connexion.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Route: POST /convert-clinic-code - Convertir le code
    if (req.method === 'POST' && (action === 'convert-clinic-code' || action === 'convert')) {
      const body: ConvertCodeRequest = await req.json();
      const { currentCode, newPermanentCode, newPassword } = body;

      if (!currentCode || !newPermanentCode) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'currentCode and newPermanentCode are required',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Valider le format du nouveau code
      const codeRegex = /^[A-Z0-9-]{4,50}$/;
      if (!codeRegex.test(newPermanentCode.toUpperCase())) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Le nouveau code doit contenir uniquement des lettres majuscules, chiffres et tirets (4-50 caractères)',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Vérifier si le nouveau code existe déjà
      const { data: existingClinic } = await supabaseAdmin
        .from('clinics')
        .select('id')
        .eq('code', newPermanentCode.toUpperCase())
        .neq('code', currentCode.toUpperCase())
        .single();

      if (existingClinic) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Ce code clinique est déjà utilisé par une autre clinique',
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Récupérer le code temporaire et la clinique
      const { data: tempCode, error: tempError } = await supabaseAdmin
        .from('clinic_temporary_codes')
        .select('id, clinic_id, temporary_code, is_converted, expires_at')
        .eq('temporary_code', currentCode.toUpperCase())
        .single();

      if (tempError || !tempCode) {
        // Peut-être que le currentCode est déjà le code de la clinique
        const { data: clinic } = await supabaseAdmin
          .from('clinics')
          .select('id, code, requires_code_change')
          .eq('code', currentCode.toUpperCase())
          .single();

        if (!clinic) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Code clinique actuel non trouvé',
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Vérifier que l'utilisateur appartient à cette clinique
        if (userData.clinic_id !== clinic.id && userData.role !== 'SUPER_ADMIN') {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Vous n\'êtes pas autorisé à modifier ce code clinique',
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Mettre à jour le code de la clinique
        const { error: updateError } = await supabaseAdmin
          .from('clinics')
          .update({
            code: newPermanentCode.toUpperCase(),
            is_temporary_code: false,
            requires_code_change: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', clinic.id);

        if (updateError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Erreur lors de la mise à jour du code clinique',
              details: updateError.message,
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Mettre à jour le status de l'utilisateur
        await supabaseAdmin
          .from('users')
          .update({
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userData.id);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Code clinique permanent défini avec succès',
            newCode: newPermanentCode.toUpperCase(),
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Vérifier que le code temporaire n'a pas été converti
      if (tempCode.is_converted) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Ce code temporaire a déjà été converti',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Vérifier que le code n'a pas expiré
      if (new Date(tempCode.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Le code temporaire a expiré. Contactez le Super-Admin pour un nouveau code.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Vérifier que l'utilisateur appartient à cette clinique
      if (userData.clinic_id !== tempCode.clinic_id && userData.role !== 'SUPER_ADMIN') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Vous n\'êtes pas autorisé à modifier ce code clinique',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Mettre à jour la clinique avec le nouveau code permanent
      const { error: clinicUpdateError } = await supabaseAdmin
        .from('clinics')
        .update({
          code: newPermanentCode.toUpperCase(),
          is_temporary_code: false,
          requires_code_change: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tempCode.clinic_id);

      if (clinicUpdateError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Erreur lors de la mise à jour de la clinique',
            details: clinicUpdateError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Marquer le code temporaire comme converti
      await supabaseAdmin
        .from('clinic_temporary_codes')
        .update({
          is_converted: true,
          converted_at: new Date().toISOString(),
          permanent_code: newPermanentCode.toUpperCase(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', tempCode.id);

      // Mettre à jour le status de l'utilisateur à ACTIVE
      await supabaseAdmin
        .from('users')
        .update({
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.id);

      // Si un nouveau mot de passe est fourni, le mettre à jour
      if (newPassword) {
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          authUser.id,
          { password: newPassword }
        );

        if (passwordError) {
          console.error('Error updating password:', passwordError);
          // Non bloquant, le code a été converti
        }

        // Mettre à jour le hash dans la table users aussi
        const encoder = new TextEncoder();
        const data = encoder.encode(newPassword + 'logi_clinic_salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        await supabaseAdmin
          .from('users')
          .update({ password_hash: passwordHash })
          .eq('id', userData.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Code clinique permanent défini avec succès',
          clinic: {
            newCode: newPermanentCode.toUpperCase(),
            oldTemporaryCode: currentCode.toUpperCase(),
          },
          user: {
            status: 'ACTIVE',
            passwordUpdated: !!newPassword,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Route par défaut - traiter comme une conversion
    const body: ConvertCodeRequest = await req.json();
    const { currentCode, newPermanentCode, newPassword } = body;

    if (!currentCode || !newPermanentCode) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'currentCode and newPermanentCode are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Appeler la fonction SQL de conversion
    const { data: result, error: convertError } = await supabaseAdmin.rpc(
      'convert_temporary_to_permanent_code',
      {
        p_temp_code: currentCode,
        p_new_permanent_code: newPermanentCode,
        p_admin_user_id: userData.id,
      }
    );

    if (convertError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erreur lors de la conversion',
          details: convertError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: result?.[0]?.success || false,
        message: result?.[0]?.message || 'Conversion effectuée',
        newCode: result?.[0]?.new_clinic_code,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in convert-clinic-code function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

