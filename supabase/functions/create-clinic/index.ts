// Edge Function: Création automatique de clinique avec Admin
// Usage: POST /functions/v1/create-clinic
// Headers: Authorization: Bearer <SUPABASE_ANON_KEY>
// Body: { clinicName, adminEmail, adminName, adminPrenom }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateClinicRequest {
  clinicName: string;
  adminEmail: string;
  adminName: string;
  adminPrenom: string;
  address?: string;
  phone?: string;
  clinicEmail?: string;
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

    // Vérifier que l'utilisateur est SUPER_ADMIN
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !userData || userData.role !== 'SUPER_ADMIN' || userData.status !== 'ACTIVE') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Only SUPER_ADMIN can create clinics',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parser le body de la requête
    const body: CreateClinicRequest = await req.json();
    const { clinicName, adminEmail, adminName, adminPrenom, address, phone, clinicEmail } = body;

    // Validation
    if (!clinicName || !adminEmail || !adminName || !adminPrenom) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'clinicName, adminEmail, adminName, and adminPrenom are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 1. Générer un code clinique unique
    const { data: clinicCodeData, error: codeError } = await supabaseAdmin.rpc(
      'generate_clinic_code'
    );

    if (codeError) {
      // Fallback si la fonction n'existe pas
      const clinicCode = `CLINIC-${Date.now().toString().slice(-6)}`;
      
      // Vérifier l'unicité
      const { data: existingClinic } = await supabaseAdmin
        .from('clinics')
        .select('id')
        .eq('code', clinicCode)
        .single();

      if (existingClinic) {
        // Si le code existe, générer un nouveau
        const clinicCode2 = `CLINIC-${Date.now().toString().slice(-8)}`;
        var finalClinicCode = clinicCode2;
      } else {
        var finalClinicCode = clinicCode;
      }
    } else {
      var finalClinicCode = clinicCodeData;
    }

    // 2. Créer la clinique
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .insert({
        code: finalClinicCode,
        name: clinicName,
        address: address || null,
        phone: phone || null,
        email: clinicEmail || null,
        active: true,
        created_by_super_admin: authUser.id,
      })
      .select()
      .single();

    if (clinicError) {
      console.error('Error creating clinic:', clinicError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create clinic',
          details: clinicError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Générer un mot de passe temporaire
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

    // 4. Créer l'utilisateur Admin dans Supabase Auth
    const { data: newAuthUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser(
      {
        email: adminEmail.toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          nom: adminName,
          prenom: adminPrenom,
          role: 'CLINIC_ADMIN',
          clinic_code: finalClinicCode,
        },
      }
    );

    if (authCreateError) {
      // Rollback: supprimer la clinique créée
      await supabaseAdmin.from('clinics').delete().eq('id', clinic.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create admin user',
          details: authCreateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Créer l'utilisateur dans la table users
    const { data: newUser, error: userCreateError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: newAuthUser.user.id,
        nom: adminName,
        prenom: adminPrenom,
        email: adminEmail.toLowerCase(),
        role: 'CLINIC_ADMIN',
        clinic_id: clinic.id,
        status: 'PENDING', // Doit changer son mot de passe
        created_by: authUser.id,
      })
      .select()
      .single();

    if (userCreateError) {
      // Rollback: supprimer l'utilisateur Auth et la clinique
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id);
      await supabaseAdmin.from('clinics').delete().eq('id', clinic.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create user record',
          details: userCreateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 6. Générer un lien de réinitialisation de mot de passe
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: adminEmail.toLowerCase(),
    });

    // 7. Préparer la réponse (sans exposer le mot de passe en production)
    const response = {
      success: true,
      clinic: {
        id: clinic.id,
        code: finalClinicCode,
        name: clinic.name,
      },
      admin: {
        id: newUser.id,
        email: adminEmail.toLowerCase(),
        name: `${adminPrenom} ${adminName}`,
        resetLink: resetData?.properties?.action_link || null,
        // ⚠️ En production, ne pas retourner le mot de passe temporaire
        // Utiliser uniquement le lien de réinitialisation
        tempPassword: Deno.env.get('ENVIRONMENT') === 'development' ? tempPassword : undefined,
      },
      message: 'Clinic and admin created successfully',
    };

    // 8. TODO: Envoyer un email avec les identifiants
    // Intégrer votre service d'email ici (Resend, SendGrid, etc.)
    // await sendWelcomeEmail({
    //   to: adminEmail,
    //   clinicCode: finalClinicCode,
    //   resetLink: resetData?.properties?.action_link,
    //   tempPassword: tempPassword
    // });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error in create-clinic function:', error);
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

