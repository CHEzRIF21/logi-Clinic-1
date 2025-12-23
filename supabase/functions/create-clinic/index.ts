// Edge Function: Création automatique de clinique avec Admin et Code Temporaire
// Usage: POST /functions/v1/create-clinic
// Headers: Authorization: Bearer <SUPABASE_ANON_KEY>
// Body: { clinicName, adminEmail, adminName, adminPrenom, address?, phone?, clinicEmail?, validityHours? }

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
  validityHours?: number; // Durée de validité du code temporaire (défaut: 72h)
  customTempCode?: string; // Code temporaire personnalisé (optionnel)
}

// Générer un code temporaire sécurisé
function generateSecureTemporaryCode(clinicName: string): string {
  // Créer un préfixe basé sur le nom de la clinique
  const cleanName = clinicName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = cleanName.substring(0, 3).padEnd(3, 'X');
  
  // Partie aléatoire
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const randomPart = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
    .substring(0, 8);
  
  // Timestamp
  const timestamp = Date.now().toString().slice(-4);
  
  return `${prefix}-TEMP-${randomPart}-${timestamp}`;
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
      .select('id, role, status')
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
    const { 
      clinicName, 
      adminEmail, 
      adminName, 
      adminPrenom, 
      address, 
      phone, 
      clinicEmail,
      validityHours = 72,
      customTempCode
    } = body;

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

    // 1. Générer un code clinique temporaire unique
    const temporaryCode = customTempCode || generateSecureTemporaryCode(clinicName);
    const expiresAt = new Date(Date.now() + validityHours * 60 * 60 * 1000);

    // Vérifier l'unicité du code temporaire
    const { data: existingClinic } = await supabaseAdmin
      .from('clinics')
      .select('id')
      .eq('code', temporaryCode)
      .single();

    if (existingClinic) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Le code temporaire généré existe déjà. Veuillez réessayer.',
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Créer la clinique avec le code temporaire
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .insert({
        code: temporaryCode,
        name: clinicName,
        address: address || null,
        phone: phone || null,
        email: clinicEmail || null,
        active: true,
        is_temporary_code: true,
        requires_code_change: true,
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

    // 3. Générer un mot de passe temporaire sécurisé
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}${Math.random().toString(36).slice(-4)}!`;

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
          clinic_code: temporaryCode,
          requires_password_change: true,
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

    // 5. Hasher le mot de passe pour la table users (compatibilité)
    const encoder = new TextEncoder();
    const data = encoder.encode(tempPassword + 'logi_clinic_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 6. Créer l'utilisateur dans la table users
    const { data: newUser, error: userCreateError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: newAuthUser.user.id,
        nom: adminName,
        prenom: adminPrenom,
        email: adminEmail.toLowerCase(),
        password_hash: passwordHash,
        role: 'CLINIC_ADMIN',
        clinic_id: clinic.id,
        status: 'PENDING', // Doit changer son mot de passe et le code clinique
        actif: true,
        temp_code_used: false,
        created_by: userData.id,
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

    // 7. Créer l'entrée du code temporaire
    const { error: tempCodeError } = await supabaseAdmin
      .from('clinic_temporary_codes')
      .insert({
        clinic_id: clinic.id,
        temporary_code: temporaryCode,
        expires_at: expiresAt.toISOString(),
        created_by_super_admin: userData.id,
        is_used: false,
        is_converted: false,
      });

    if (tempCodeError) {
      console.error('Error creating temporary code record:', tempCodeError);
      // Non bloquant, la clinique est créée
    }

    // 8. Générer un lien de réinitialisation de mot de passe
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: adminEmail.toLowerCase(),
    });

    // 9. Préparer les informations pour l'envoi sécurisé
    const secureInfo = {
      clinicCode: temporaryCode,
      adminEmail: adminEmail.toLowerCase(),
      tempPassword: tempPassword,
      expiresAt: expiresAt.toISOString(),
      resetLink: resetData?.properties?.action_link || null,
    };

    // 10. Préparer la réponse
    const response = {
      success: true,
      clinic: {
        id: clinic.id,
        code: temporaryCode,
        name: clinic.name,
        isTemporaryCode: true,
        requiresCodeChange: true,
      },
      admin: {
        id: newUser.id,
        email: adminEmail.toLowerCase(),
        name: `${adminPrenom} ${adminName}`,
        status: 'PENDING',
      },
      temporaryCode: {
        code: temporaryCode,
        expiresAt: expiresAt.toISOString(),
        validityHours: validityHours,
      },
      credentials: {
        // ⚠️ En production, ces informations doivent être envoyées par email sécurisé uniquement
        clinicCode: temporaryCode,
        email: adminEmail.toLowerCase(),
        tempPassword: Deno.env.get('ENVIRONMENT') === 'development' ? tempPassword : '(Envoyé par email)',
        resetLink: resetData?.properties?.action_link || null,
      },
      message: `Clinique "${clinicName}" créée avec succès. Le code temporaire ${temporaryCode} est valide jusqu'au ${expiresAt.toLocaleString()}. L'administrateur doit définir un code clinique permanent après sa première connexion.`,
      instructions: [
        '1. Transmettez les identifiants à l\'administrateur via un canal sécurisé',
        '2. L\'administrateur se connecte avec le code temporaire, son email et le mot de passe',
        '3. Après connexion, l\'administrateur doit définir un code clinique permanent',
        '4. Le code temporaire sera alors invalidé',
      ],
    };

    // 11. TODO: Envoyer un email sécurisé avec les identifiants
    // await sendSecureCredentialsEmail({
    //   to: adminEmail,
    //   clinicName: clinicName,
    //   clinicCode: temporaryCode,
    //   tempPassword: tempPassword,
    //   expiresAt: expiresAt,
    //   resetLink: resetData?.properties?.action_link,
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
