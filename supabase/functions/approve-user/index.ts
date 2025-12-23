// Edge Function: Validation/Refus d'un utilisateur par l'Admin de clinique
// Usage: POST /functions/v1/approve-user
// Headers: Authorization: Bearer <JWT_TOKEN>
// Body: { userId, action: 'approve' | 'reject', role?: 'STAFF' | 'CLINIC_ADMIN' }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApproveUserRequest {
  userId: string;
  action: 'approve' | 'reject';
  role?: string; // Rôle à assigner (par défaut: STAFF)
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

    // Créer client Supabase avec service role key
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

    // Vérifier que l'utilisateur est CLINIC_ADMIN ou SUPER_ADMIN
    const { data: adminUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, status, clinic_id')
      .eq('auth_user_id', authUser.id)
      .single();

    if (
      userError ||
      !adminUser ||
      !['CLINIC_ADMIN', 'SUPER_ADMIN'].includes(adminUser.role) ||
      adminUser.status !== 'ACTIVE'
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Only CLINIC_ADMIN or SUPER_ADMIN can approve users',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parser le body
    const body: ApproveUserRequest = await req.json();
    const { userId, action, role = 'STAFF' } = body;

    if (!userId || !action) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'userId and action are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Récupérer l'utilisateur à approuver/rejeter
    const { data: pendingUser, error: pendingError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (pendingError || !pendingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Vérifier que l'admin peut gérer cet utilisateur
    // SUPER_ADMIN peut gérer tout le monde
    // CLINIC_ADMIN peut gérer uniquement les utilisateurs de sa clinique
    if (
      adminUser.role === 'CLINIC_ADMIN' &&
      pendingUser.clinic_id !== adminUser.clinic_id
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'You can only manage users from your own clinic',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'approve') {
      // Si l'utilisateur n'a pas encore de compte Auth, en créer un
      if (!pendingUser.auth_user_id) {
        // Générer un mot de passe temporaire
        const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

        // Créer l'utilisateur dans Supabase Auth
        const { data: newAuthUser, error: authCreateError } =
          await supabaseAdmin.auth.admin.createUser({
            email: pendingUser.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              nom: pendingUser.nom,
              prenom: pendingUser.prenom,
              role: role,
              clinic_id: pendingUser.clinic_id || adminUser.clinic_id,
            },
          });

        if (authCreateError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to create auth user',
              details: authCreateError.message,
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Mettre à jour l'utilisateur
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            auth_user_id: newAuthUser.user.id,
            clinic_id: pendingUser.clinic_id || adminUser.clinic_id,
            role: role,
            status: 'PENDING', // Doit changer son mot de passe
            reviewed_by: authUser.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          // Rollback: supprimer l'utilisateur Auth créé
          await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id);

          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to update user',
              details: updateError.message,
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Générer un lien de réinitialisation de mot de passe
        const { data: resetData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: pendingUser.email,
        });

        // TODO: Envoyer un email de bienvenue avec le lien de réinitialisation
        // await sendWelcomeEmail({
        //   to: pendingUser.email,
        //   resetLink: resetData?.properties?.action_link,
        //   tempPassword: tempPassword
        // });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'User approved successfully',
            user: {
              id: userId,
              email: pendingUser.email,
              role: role,
              status: 'PENDING',
              resetLink: resetData?.properties?.action_link || null,
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        // L'utilisateur a déjà un compte Auth, juste activer
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            status: 'ACTIVE',
            clinic_id: pendingUser.clinic_id || adminUser.clinic_id,
            role: role,
            reviewed_by: authUser.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to activate user',
              details: updateError.message,
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
            message: 'User activated successfully',
            user: {
              id: userId,
              email: pendingUser.email,
              role: role,
              status: 'ACTIVE',
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    } else if (action === 'reject') {
      // Rejeter l'utilisateur
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          status: 'REJECTED',
          reviewed_by: authUser.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to reject user',
            details: updateError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // TODO: Envoyer un email de refus
      // await sendRejectionEmail({
      //   to: pendingUser.email,
      //   reason: body.reason || 'Not specified'
      // });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'User rejected successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid action. Must be "approve" or "reject"',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('Error in approve-user function:', error);
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

