import { Router, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { emailService } from '../services/emailService';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { requireClinicContext, ClinicContextRequest } from '../middleware/clinicContext';
// #region agent log
import * as fs from 'fs';
import * as path from 'path';
const logPath = path.join(__dirname, '../../../.cursor/debug.log');
// #endregion

const router = Router();

// Hash password simple (à remplacer par bcrypt en production)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'logi_clinic_salt').digest('hex');
}

// POST /api/auth/register-request - Créer une demande d'inscription
router.post('/register-request', async (req: Request, res: Response) => {
  // #region agent log
  try {
    fs.appendFileSync(logPath, JSON.stringify({ location: 'auth.ts:15', message: 'Route register-request appelée', data: { method: req.method, bodyKeys: Object.keys(req.body || {}), hasClinicCode: !!req.body?.clinicCode }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) + '\n');
  } catch (e) { }
  // #endregion
  try {
    const {
      nom,
      prenom,
      email,
      password,
      passwordConfirm,
      telephone,
      adresse,
      roleSouhaite,
      specialite,
      securityQuestions,
      clinicCode, // Nouveau: code clinique requis
    } = req.body;

    // Validations
    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prénom, email et mot de passe sont requis',
      });
    }

    // Validation du code clinique (obligatoire)
    if (!clinicCode || clinicCode.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le code clinique est requis pour l\'inscription',
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    }

    // Liste des questions de sécurité autorisées (doit correspondre à src/data/securityQuestions.ts)
    const AUTHORIZED_QUESTIONS = [
      'Quel est le nom de votre premier animal de compagnie ?',
      'Dans quelle ville êtes-vous né(e) ?',
      'Quel est le nom de jeune fille de votre mère ?',
      'Quel était le nom de votre école primaire ?',
      'Quel est le prénom de votre meilleur(e) ami(e) d\'enfance ?',
      'Quel est le nom de votre professeur préféré à l\'école ?',
      'Quel est le modèle de votre première voiture ?',
      'Quel est le nom de votre ville de naissance ?',
      'Quel est le prénom de votre grand-mère maternelle ?',
      'Quel était le nom de votre premier employeur ?',
      'Quel est le nom de votre film préféré ?',
      'Quel est le nom de votre équipe de sport préférée ?',
      'Quel est le prénom de votre parrain/marraine ?',
      'Quel est le nom de votre restaurant préféré ?',
      'Quel est le nom de votre premier patron ?',
    ];

    // Validation des questions de sécurité
    if (securityQuestions) {
      const questions = [
        securityQuestions.question1,
        securityQuestions.question2,
        securityQuestions.question3,
      ].filter(q => q && q.question && q.answer);

      if (questions.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Au moins 2 questions de sécurité sont requises',
        });
      }

      // Vérifier que toutes les questions sont dans la liste autorisée
      for (const q of questions) {
        if (!AUTHORIZED_QUESTIONS.includes(q.question)) {
          return res.status(400).json({
            success: false,
            message: `La question "${q.question}" n'est pas autorisée. Veuillez sélectionner une question dans la liste proposée.`,
          });
        }
      }

      // Vérifier qu'il n'y a pas de doublons
      const questionTexts = questions.map(q => q.question);
      const uniqueQuestions = new Set(questionTexts);
      if (uniqueQuestions.size !== questionTexts.length) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas utiliser la même question plusieurs fois',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Les questions de sécurité sont requises',
      });
    }

    if (!supabase) {
      console.error('Supabase non configuré');
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    // Vérifier que le code clinique existe et est actif
    const clinicCodeUpper = clinicCode.toUpperCase().trim();
    let clinicId: string | null = null;
    let clinicName: string | null = null;

    // D'abord chercher dans la table clinics
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('id, name, active, is_demo')
      .eq('code', clinicCodeUpper)
      .eq('active', true)
      .single();

    if (clinic) {
      clinicId = clinic.id;
      clinicName = clinic.name;
    } else {
      // Si non trouvé, chercher dans les codes temporaires
      const { data: tempCode, error: tempCodeError } = await supabase
        .from('clinic_temporary_codes')
        .select('clinic_id, clinics(id, name, active)')
        .eq('temporary_code', clinicCodeUpper)
        .eq('is_converted', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tempCode && tempCode.clinics) {
        const clinicData = tempCode.clinics as any;
        if (clinicData.active) {
          clinicId = clinicData.id;
          clinicName = clinicData.name;
        }
      }
    }

    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: `Code clinique "${clinicCodeUpper}" invalide ou inactif. Vérifiez le code auprès de votre administrateur.`,
      });
    }

    // Vérifier si l'email existe déjà
    const { data: existingUser, error: checkError } = await supabase
      .from('registration_requests')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Une demande avec cet email existe déjà',
      });
    }

    // Vérifier aussi dans la table users
    const { data: existingUserActive } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUserActive) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà',
      });
    }

    // IMPORTANT SÉCURITÉ:
    // On NE doit PAS stocker le mot de passe (même hashé) pour recréer un compte plus tard.
    // Pour permettre au membre d'utiliser le mot de passe saisi lors de l'inscription,
    // on crée le compte Supabase Auth dès la soumission, puis on bloque l'accès via public.users (actif=false)
    // jusqu'à validation par l'admin.

    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        message: 'Service admin non disponible. Vérifiez SUPABASE_SERVICE_ROLE_KEY',
      });
    }

    const emailLower = email.toLowerCase().trim();

    // 1) Créer l'utilisateur Supabase Auth avec le mot de passe saisi
    const { data: createdAuth, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: emailLower,
      password,
      email_confirm: true,
      user_metadata: {
        nom,
        prenom,
        clinic_id: clinicId,
        pending_approval: true,
      },
    });

    if (authCreateError || !createdAuth?.user) {
      const msg = authCreateError?.message || 'Erreur lors de la création du compte Auth';
      // Message utilisateur plus clair sur le cas courant
      const isAlreadyRegistered =
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('exists');

      return res.status(400).json({
        success: false,
        message: isAlreadyRegistered
          ? 'Un compte Supabase Auth existe déjà avec cet email. Essayez de vous connecter ou contactez votre administrateur.'
          : msg,
      });
    }

    const authUserId = createdAuth.user.id;

    // 2) Créer (ou verrouiller) le profil utilisateur en attente d'approbation
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        nom,
        prenom,
        email: emailLower,
        role: roleSouhaite || 'receptionniste',
        specialite,
        telephone,
        adresse,
        actif: false,
        status: 'PENDING_APPROVAL',
        clinic_id: clinicId,
        auth_user_id: authUserId,
      });

    if (profileError) {
      // Rollback: supprimer l'utilisateur Auth créé
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      console.error('Erreur création profil users:', profileError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du profil utilisateur',
        error: profileError.message,
      });
    }

    // 3) Créer la demande d'inscription avec clinic_id (+ auth_user_id si la colonne existe)
    const baseRequestPayload: any = {
      nom,
      prenom,
      email: emailLower,
      // password_hash volontairement NULL (ne pas stocker le mot de passe)
      password_hash: null,
      telephone,
      adresse,
      role_souhaite: roleSouhaite || 'receptionniste',
      specialite,
      security_questions: securityQuestions,
      statut: 'pending',
      clinic_id: clinicId,
      clinic_code: clinicCodeUpper,
    };

    let { data, error } = await supabaseAdmin
      .from('registration_requests')
      .insert({ ...baseRequestPayload, auth_user_id: authUserId })
      .select()
      .single();

    // Compat: si la migration ajoutant auth_user_id n'est pas encore appliquée, réessayer sans la colonne
    if (error && (error as any)?.code === '42703' && (error as any)?.message?.includes('auth_user_id')) {
      const retry = await supabaseAdmin
        .from('registration_requests')
        .insert(baseRequestPayload)
        .select()
        .single();
      data = retry.data as any;
      error = retry.error as any;
    }

    if (error) {
      // Rollback best-effort
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      await supabaseAdmin.from('users').delete().eq('auth_user_id', authUserId);

      console.error('Erreur Supabase:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la demande',
        error: (error as any).message,
      });
    }

    // Envoyer une notification par email à tech@logiclinic.org
    try {
      await emailService.sendRegistrationNotification({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        roleSouhaite: data.role_souhaite,
        adresse: data.adresse,
        specialite: data.specialite,
        clinicCode: clinicCodeUpper,
        clinicName: clinicName,
      } as any);
    } catch (emailError) {
      // Ne pas bloquer la réponse si l'email échoue
      console.error('Erreur lors de l\'envoi de l\'email de notification:', emailError);
    }

    res.status(201).json({
      success: true,
      message: `Demande d'inscription soumise pour la clinique "${clinicName}". L'administrateur de cette clinique va examiner votre demande.`,
      data: {
        id: data.id,
        email: data.email,
        statut: data.statut,
        clinicCode: clinicCodeUpper,
        clinicName: clinicName,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message,
    });
  }
});

// GET /api/auth/registration-requests - Récupérer les demandes d'inscription (admin)
router.get('/registration-requests', authenticateToken, requireClinicContext, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📥 Requête GET /registration-requests reçue');

    if (!supabase) {
      console.error('❌ Service Supabase non disponible');
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    const { statut } = req.query;
    const clinicReq = req as ClinicContextRequest;
    const clinicId = clinicReq.clinicId;
    const isSuperAdmin = clinicReq.isSuperAdmin;

    console.log('🔐 Utilisateur récupérant les demandes:', {
      userId: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
      clinicId,
      isSuperAdmin,
      statutFilter: statut || 'tous'
    });

    // Filtrage par clinic_id (sauf pour Super Admin si non spécifié)
    if (!clinicId && !isSuperAdmin) {
      console.error('❌ Contexte de clinique manquant pour l\'utilisateur:', req.user?.id);
      return res.status(400).json({
        success: false,
        message: 'Contexte de clinique manquant. Veuillez vous reconnecter.',
        code: 'CLINIC_CONTEXT_REQUIRED',
      });
    }

    let query = supabase
      .from('registration_requests')
      .select('*');

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
      console.log('🔒 Filtrage par clinic_id:', clinicId);
    } else if (isSuperAdmin) {
      console.log('🔓 Super Admin : affichage de toutes les demandes');
    }

    query = query.order('created_at', { ascending: false });

    if (statut && statut !== '') {
      query = query.eq('statut', statut);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erreur Supabase lors de la récupération des demandes:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des demandes',
        code: 'DATABASE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    // Ne pas renvoyer les mots de passe hashés et mapper snake_case vers camelCase
    console.log('📋 Demandes d\'inscription trouvées:', {
      count: data?.length || 0,
      clinicId,
      statutFilter: statut || 'tous'
    });

    const sanitizedData = (data || []).map((item: any) => {
      const {
        id,
        password_hash,
        role_souhaite,
        created_at,
        updated_at,
        reviewed_by,
        reviewed_at,
        raison_rejet,
        clinic_id,
        clinic_code,
        security_questions,
        ...rest
      } = item;

      // Préserver le rôle souhaité tel quel, utiliser un fallback seulement si vraiment absent
      const mappedRole = role_souhaite !== undefined && role_souhaite !== null
        ? role_souhaite
        : 'receptionniste';

      console.log(`📝 Demande ${id}: role_souhaite brut = "${role_souhaite}", mappé = "${mappedRole}"`);

      return {
        ...rest,
        _id: id, // Compatibilité avec l'interface frontend
        id: id, // Garder aussi l'id original
        roleSouhaite: mappedRole,
        createdAt: created_at || null,
        updatedAt: updated_at || null,
        reviewedBy: reviewed_by || null,
        reviewedAt: reviewed_at || null,
        raisonRejet: raison_rejet || null,
        clinicId: clinic_id || null,
        clinicCode: clinic_code || null,
        securityQuestions: security_questions || null,
      };
    });

    res.json({
      success: true,
      requests: sanitizedData,
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

// POST /api/auth/registration-requests/:id/approve - Approuver une demande
router.post('/registration-requests/:id/approve', authenticateToken, requireClinicContext, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, permissions, notes } = req.body;
    const clinicReq = req as ClinicContextRequest;

    console.log('✅ Approbation demande ID:', id, 'par utilisateur:', req.user?.id);

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    // Récupérer la demande
    const { data: request, error: fetchError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée',
      });
    }

    // Scope clinique : seul SUPER_ADMIN ou admin de la même clinique peut approuver
    if (!clinicReq.isSuperAdmin && request.clinic_id !== clinicReq.clinicId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez approuver que les demandes de votre clinique.',
      });
    }

    if (request.statut !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée',
      });
    }

    // VALIDATION CRITIQUE : Vérifier que clinic_id est présent
    if (!request.clinic_id) {
      console.error('❌ Demande sans clinic_id:', {
        requestId: id,
        email: request.email,
        clinicCode: request.clinic_code,
      });
      return res.status(400).json({
        success: false,
        message: 'La demande d\'inscription n\'a pas de clinique associée. Impossible de créer l\'utilisateur.',
      });
    }

    // Vérifier que la clinique existe toujours et est active
    const { data: clinic, error: clinicCheckError } = await supabase
      .from('clinics')
      .select('id, name, code, active')
      .eq('id', request.clinic_id)
      .single();

    if (clinicCheckError || !clinic) {
      console.error('❌ Clinique non trouvée:', {
        clinicId: request.clinic_id,
        error: clinicCheckError?.message,
      });
      return res.status(400).json({
        success: false,
        message: 'La clinique associée à cette demande n\'existe plus ou est inactive.',
      });
    }

    if (!clinic.active) {
      console.error('❌ Clinique inactive:', {
        clinicId: request.clinic_id,
        clinicCode: clinic.code,
      });
      return res.status(400).json({
        success: false,
        message: 'La clinique associée à cette demande est inactive.',
      });
    }

    console.log('✅ Validation clinique réussie:', {
      clinicId: request.clinic_id,
      clinicCode: clinic.code,
      clinicName: clinic.name,
    });

    // Vérifier que supabaseAdmin est disponible
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        message: 'Service admin non disponible. Vérifiez SUPABASE_SERVICE_ROLE_KEY',
      });
    }

    // Utiliser le rôle souhaité de la demande si aucun rôle n'est spécifié
    const finalRole = role || request.role_souhaite || 'receptionniste';
    // Nouveau workflow sécurisé:
    // - Le compte Supabase Auth est créé AU MOMENT de la soumission (avec le mot de passe saisi).
    // - Le profil public.users est créé en PENDING_APPROVAL + actif=false.
    // - L'approbation ACTIVE le profil (actif=true, status=ACTIVE) sans jamais manipuler le mot de passe.

    // Lier la demande au compte Supabase Auth:
    // - cas normal: registration_requests.auth_user_id est rempli
    // - cas compat (migration pas encore appliquée): retrouver via public.users (email+clinic_id)
    let requestAuthUserId: string | null = (request as any).auth_user_id || null;
    if (!requestAuthUserId) {
      const { data: pendingProfile } = await supabaseAdmin
        .from('users')
        .select('auth_user_id, status, clinic_id')
        .eq('email', request.email)
        .eq('clinic_id', request.clinic_id)
        .maybeSingle();
      if (pendingProfile?.auth_user_id) {
        requestAuthUserId = pendingProfile.auth_user_id;
      }
    }

    let activatedAuthUserId: string | null = null;

    if (requestAuthUserId) {
      activatedAuthUserId = requestAuthUserId;

      // Mettre à jour les metadata (utile pour audit / debug)
      const { error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(requestAuthUserId, {
        user_metadata: {
          nom: request.nom,
          prenom: request.prenom,
          role: finalRole,
          clinic_id: request.clinic_id,
          pending_approval: false,
        },
      });
      if (metaErr) {
        console.warn('⚠️ Impossible de mettre à jour user_metadata (non bloquant):', metaErr.message);
      }

      // Activer / mettre à jour le profil users
      const { data: existingProfile, error: profileFetchErr } = await supabaseAdmin
        .from('users')
        .select('id, clinic_id')
        .eq('auth_user_id', requestAuthUserId)
        .maybeSingle();

      if (profileFetchErr) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération du profil utilisateur',
          error: profileFetchErr.message,
        });
      }

      if (existingProfile) {
        const { error: profileUpdateErr } = await supabaseAdmin
          .from('users')
          .update({
            role: finalRole,
            actif: false, // Bloqué jusqu'à vérification email
            status: 'APPROVED', // Statut après approbation admin (avant vérification email)
            email_verified: false, // Doit vérifier son email avant de pouvoir se connecter
            clinic_id: request.clinic_id,
            updated_at: new Date().toISOString(),
          })
          .eq('auth_user_id', requestAuthUserId);

        if (profileUpdateErr) {
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de l’activation du profil utilisateur',
            error: profileUpdateErr.message,
          });
        }
      } else {
        const { error: profileInsertErr } = await supabaseAdmin
          .from('users')
          .insert({
            nom: request.nom,
            prenom: request.prenom,
            email: request.email,
            role: finalRole,
            specialite: request.specialite,
            telephone: request.telephone,
            adresse: request.adresse,
            actif: false, // Bloqué jusqu'à vérification email
            status: 'APPROVED', // Statut après approbation admin (avant vérification email)
            email_verified: false, // Doit vérifier son email avant de pouvoir se connecter
            clinic_id: request.clinic_id,
            auth_user_id: requestAuthUserId,
          });

        if (profileInsertErr) {
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du profil utilisateur',
            error: profileInsertErr.message,
          });
        }
      }
    } else {
      // Fallback legacy (anciennes demandes sans auth_user_id):
      // on crée un compte Auth avec un mot de passe temporaire et on ACTIVE le profil immédiatement.
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: request.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          nom: request.nom,
          prenom: request.prenom,
          role: finalRole,
          clinic_id: request.clinic_id,
          pending_approval: false,
        },
      });

      if (authError || !authUser?.user) {
        console.error('Erreur création utilisateur Auth:', authError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création du compte utilisateur',
          error: authError?.message,
        });
      }

      activatedAuthUserId = authUser.user.id;

      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          nom: request.nom,
          prenom: request.prenom,
          email: request.email,
          role: finalRole,
          specialite: request.specialite,
          telephone: request.telephone,
          adresse: request.adresse,
          actif: false, // Bloqué jusqu'à vérification email (legacy)
          status: 'APPROVED', // Statut après approbation admin (avant vérification email)
          email_verified: false, // Doit vérifier son email avant de pouvoir se connecter
          clinic_id: request.clinic_id,
          auth_user_id: activatedAuthUserId,
        });

      if (userError) {
        await supabaseAdmin.auth.admin.deleteUser(activatedAuthUserId);
        console.error('Erreur création utilisateur:', userError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de l\'utilisateur',
          error: userError.message,
        });
      }

      // Pour legacy, on peut proposer un reset (optionnel) mais on garde la réponse simple.
      try {
        await emailService.sendAccountValidationEmail({
          nom: request.nom,
          prenom: request.prenom,
          email: request.email,
          username: request.email,
          temporaryPassword: tempPassword,
          clinicCode: clinic.code,
        });
      } catch (emailError: any) {
        console.error('⚠️ Email legacy (non bloquant):', emailError?.message || emailError);
      }
    }

    // Mettre à jour le statut de la demande
    const { error: updateError } = await supabaseAdmin
      .from('registration_requests')
      .update({
        statut: 'approved',
        notes,
        reviewed_by: req.user?.id, // ID de l'admin qui approuve (depuis le middleware auth)
        reviewed_at: new Date().toISOString(),
        date_approbation: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(activatedAuthUserId ? { auth_user_id: activatedAuthUserId } : {}),
      })
      .eq('id', id);

    if (updateError) {
      console.error('⚠️ Erreur mise à jour demande (non bloquante):', updateError);
    } else {
      console.log('✅ Demande mise à jour avec statut approved');
    }

    // Récupérer les informations de la clinique pour l'email
    let clinicCode = clinic.code || 'N/A';
    let clinicName = clinic.name || null;

    // Si on n'a pas encore récupéré le nom de la clinique, le faire maintenant
    if (!clinicName && request.clinic_id) {
      const { data: clinicInfo } = await supabaseAdmin
        .from('clinics')
        .select('code, name')
        .eq('id', request.clinic_id)
        .maybeSingle();

      if (clinicInfo) {
        clinicCode = clinicInfo.code || clinicCode;
        clinicName = clinicInfo.name || null;
      }
    }

    // Générer un token de vérification email (valide 7 jours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7); // 7 jours

    // Stocker le token dans la table users (ou créer une table dédiée)
    // Pour simplifier, on utilise user_metadata dans Supabase Auth
    if (activatedAuthUserId) {
      await supabaseAdmin.auth.admin.updateUserById(activatedAuthUserId, {
        user_metadata: {
          email_verification_token: verificationToken,
          email_verification_expires: tokenExpiry.toISOString(),
        },
      });
    }

    // Construire le lien de vérification (pointe vers le backend qui redirige ensuite)
    const backendUrl = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    const verificationLink = `${backendUrl}/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(request.email)}`;

    // Envoyer l'email de notification d'approbation avec lien de vérification
    try {
      await emailService.sendAccountApprovalEmail({
        nom: request.nom,
        prenom: request.prenom,
        email: request.email,
        clinicCode: clinicCode,
        clinicName: clinicName || undefined,
        role: finalRole,
        verificationLink: verificationLink,
      });
      console.log('✅ Email d\'approbation avec vérification envoyé avec succès à', request.email);
    } catch (emailError: any) {
      // Ne pas bloquer l'approbation si l'email échoue
      console.error('⚠️ Erreur lors de l\'envoi de l\'email d\'approbation (non bloquant):', emailError?.message || emailError);
    }

    res.json({
      success: true,
      message: 'Demande approuvée avec succès',
      note: 'Le membre peut se connecter avec le mot de passe défini lors de l’inscription. Un email de confirmation a été envoyé.',
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

// POST /api/auth/registration-requests/:id/reject - Rejeter une demande
router.post('/registration-requests/:id/reject', authenticateToken, requireClinicContext, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { raisonRejet, notes } = req.body;
    const clinicReq = req as ClinicContextRequest;

    console.log('❌ Rejet demande ID:', id, 'par utilisateur:', req.user?.id);

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    // Récupérer la demande pour vérifier le scope clinique
    const { data: request, error: fetchError } = await supabase
      .from('registration_requests')
      .select('id, clinic_id, statut')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée',
      });
    }

    if (request.statut !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée',
      });
    }

    // Scope clinique : seul SUPER_ADMIN ou admin de la même clinique peut rejeter
    if (!clinicReq.isSuperAdmin && request.clinic_id !== clinicReq.clinicId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez rejeter que les demandes de votre clinique.',
      });
    }

    const { error } = await supabase
      .from('registration_requests')
      .update({
        statut: 'rejected',
        raison_rejet: raisonRejet,
        notes,
        reviewed_by: req.user?.id, // ID de l'admin qui rejette
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur Supabase lors du rejet:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du rejet de la demande',
        error: error.message,
      });
    }

    console.log('✅ Demande rejetée avec succès, ID:', id);

    res.json({
      success: true,
      message: 'Demande rejetée',
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

// POST /api/auth/users/:id/activate - Activer un utilisateur (workflow 2 étapes: après approbation)
router.post('/users/:id/activate', authenticateToken, requireClinicContext, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clinicReq = req as ClinicContextRequest;

    if (!supabase) {
      return res.status(500).json({ success: false, message: 'Service de base de données non disponible' });
    }

    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, clinic_id, status, actif')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    if (targetUser.clinic_id !== clinicReq.clinicId) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez activer que les utilisateurs de votre clinique.' });
    }
    if (targetUser.status !== 'PENDING' || targetUser.actif) {
      return res.status(400).json({ success: false, message: 'Cet utilisateur n\'est pas en attente d\'activation.' });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ actif: true, status: 'ACTIVE', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({ success: false, message: 'Erreur lors de l\'activation', error: updateError.message });
    }
    res.json({ success: true, message: 'Utilisateur activé. Il peut désormais se connecter.' });
  } catch (error: any) {
    console.error('Erreur activation:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur', error: error.message });
  }
});

// POST /api/auth/users/:id/reset-password - Réinitialiser le mot de passe d'un utilisateur
router.post('/users/:id/reset-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        message: 'Service admin non disponible. Vérifiez SUPABASE_SERVICE_ROLE_KEY',
      });
    }

    // Récupérer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, auth_user_id, clinic_id')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier que l'utilisateur qui fait la demande a les droits (admin de la même clinique ou super admin)
    const requesterClinicId = req.user?.clinic_id;
    if (requesterClinicId && user.clinic_id !== requesterClinicId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour réinitialiser le mot de passe de cet utilisateur',
      });
    }

    // Générer un mot de passe temporaire
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

    // Si l'utilisateur a un auth_user_id, mettre à jour le mot de passe dans Supabase Auth
    if (user.auth_user_id) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.auth_user_id,
        {
          password: tempPassword,
        }
      );

      if (updateError) {
        console.error('Erreur lors de la mise à jour du mot de passe Auth:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la réinitialisation du mot de passe',
          error: updateError.message,
        });
      }
    }

    // Mettre à jour le statut de l'utilisateur pour forcer le changement de mot de passe
    const { error: updateStatusError } = await supabase
      .from('users')
      .update({
        status: 'PENDING',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateStatusError) {
      console.error('Erreur lors de la mise à jour du statut:', updateStatusError);
    }

    // Récupérer les informations complètes de l'utilisateur pour l'email
    const { data: fullUser } = await supabase
      .from('users')
      .select('nom, prenom, email, clinic_id')
      .eq('id', id)
      .single();

    // Récupérer le code clinique
    let clinicCode = 'N/A';
    if (fullUser?.clinic_id) {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('code')
        .eq('id', fullUser.clinic_id)
        .single();

      if (clinic?.code) {
        clinicCode = clinic.code;
      }
    }

    // Envoyer l'email avec le nouveau mot de passe temporaire
    if (fullUser) {
      try {
        await emailService.sendAccountValidationEmail({
          nom: fullUser.nom || '',
          prenom: fullUser.prenom || '',
          email: fullUser.email,
          username: fullUser.email,
          temporaryPassword: tempPassword,
          clinicCode: clinicCode,
        });
        console.log('✅ Email de réinitialisation envoyé avec succès à', fullUser.email);
      } catch (emailError: any) {
        // Ne pas bloquer si l'email échoue
        console.error('⚠️ Erreur lors de l\'envoi de l\'email (non bloquant):', emailError?.message || emailError);
      }
    }

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Un email avec le nouveau mot de passe temporaire a été envoyé.',
      note: 'L\'utilisateur devra changer son mot de passe lors de sa prochaine connexion.',
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message,
    });
  }
});

// GET /api/auth/verify-email - Vérifier l'email après approbation
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Token et email requis pour la vérification',
      });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        message: 'Service admin non disponible',
      });
    }

    const emailLower = String(email).toLowerCase().trim();

    // Trouver l'utilisateur par email
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, auth_user_id, status, email_verified')
      .eq('email', emailLower)
      .maybeSingle();

    if (userError || !userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier que le compte est en statut APPROVED (après approbation admin)
    if (userProfile.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: `Ce compte n'est pas en attente de vérification email. Statut actuel: ${userProfile.status}`,
      });
    }

    // Vérifier que l'email n'est pas déjà vérifié
    if (userProfile.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Cet email a déjà été vérifié',
      });
    }

    // Vérifier le token dans user_metadata de Supabase Auth
    if (!userProfile.auth_user_id) {
      return res.status(400).json({
        success: false,
        message: 'Compte non lié à Supabase Auth',
      });
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      userProfile.auth_user_id
    );

    if (authError || !authUser?.user) {
      return res.status(404).json({
        success: false,
        message: 'Compte Supabase Auth non trouvé',
      });
    }

    const storedToken = authUser.user.user_metadata?.email_verification_token;
    const tokenExpires = authUser.user.user_metadata?.email_verification_expires;

    if (!storedToken || storedToken !== token) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification invalide',
      });
    }

    // Vérifier l'expiration
    if (tokenExpires && new Date(tokenExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Le lien de vérification a expiré. Contactez votre administrateur pour en recevoir un nouveau.',
      });
    }

    // Marquer l'email comme vérifié et activer le compte
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_verified: true,
        actif: true,
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userProfile.id);

    if (updateError) {
      console.error('Erreur lors de la mise à jour:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de l\'email',
        error: updateError.message,
      });
    }

    // Nettoyer le token dans user_metadata
    await supabaseAdmin.auth.admin.updateUserById(userProfile.auth_user_id, {
      user_metadata: {
        ...authUser.user.user_metadata,
        email_verification_token: null,
        email_verification_expires: null,
        email_verified: true,
      },
    });

    console.log('✅ Email vérifié avec succès pour:', emailLower);

    // Rediriger vers une page de confirmation (ou login avec message)
    const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173';
    // Option 1: Rediriger vers login avec message de succès
    res.redirect(`${frontendUrl}/login?emailVerified=true&email=${encodeURIComponent(emailLower)}`);
    // Option 2: Rediriger vers une page dédiée (à créer)
    // res.redirect(`${frontendUrl}/email-verified?email=${encodeURIComponent(emailLower)}`);
  } catch (error: any) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message,
    });
  }
});

// POST /api/auth/super-admin-login - Connexion Super Admin (sans code clinique)
router.post('/super-admin-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    const emailLower = email.toLowerCase().trim();
    const v_password_hash = hashPassword(password);

    console.log('👤 Tentative login Super Admin:', emailLower);

    // Rechercher l'utilisateur dans la table users avec le client admin (pour contourner RLS)
    const { data: user, error: userErr } = await supabaseAdmin!
      .from('users')
      .select('*')
      .ilike('email', emailLower)
      .eq('password_hash', v_password_hash)
      .is('clinic_id', null)
      .eq('role', 'SUPER_ADMIN')
      .eq('actif', true)
      .maybeSingle();

    if (userErr || !user) {
      console.warn('❌ Login Super Admin échoué pour:', emailLower, userErr?.message || 'Utilisateur non trouvé ou non autorisé');
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects ou accès non autorisé',
      });
    }

    // Vérifier le statut
    const statusUpper = (user.status || '').toString().toUpperCase();
    if (['SUSPENDED', 'REJECTED', 'PENDING', 'PENDING_APPROVAL'].includes(statusUpper)) {
      console.warn('❌ Compte Super Admin non actif:', emailLower, 'Staut:', statusUpper);
      return res.status(401).json({
        success: false,
        message: 'Compte en attente ou désactivé',
      });
    }

    // Mettre à jour la date de dernière connexion avec le client admin
    await supabaseAdmin!.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    // Générer un token interne compatible avec authenticateToken
    // Format: internal-<user_id>-<timestamp>
    const token = `internal-${user.id}-${Date.now()}`;

    console.log('✅ Login Super Admin réussi:', emailLower);

    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        clinic_id: user.clinic_id,
        status: user.status,
      },
      token,
    });
  } catch (error: any) {
    console.error('[SUPER-ADMIN-LOGIN] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      details: error.message,
    });
  }
});

// POST /api/auth/login - Connexion avec code clinique
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { clinicCode, email, password } = req.body;

    // Validation des champs requis
    if (!clinicCode || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Code clinique, email et mot de passe requis',
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    // Normaliser le code clinique
    const clinicCodeUpper = clinicCode.toUpperCase().trim();
    const emailLower = email.toLowerCase().trim();

    logger.loginAttempt({ clinicCode: clinicCodeUpper, email: emailLower });

    // Utiliser la fonction RPC validate_clinic_login qui vérifie clinic_code + email + password
    const { data: loginResult, error: rpcError } = await supabase.rpc('validate_clinic_login', {
      p_clinic_code: clinicCodeUpper,
      p_email: emailLower,
      p_password: password,
    });

    if (rpcError) {
      logger.loginError(rpcError.message, { clinicCode: clinicCodeUpper, email: emailLower });
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des identifiants',
        details: rpcError.message,
      });
    }

    // Vérifier le résultat de la fonction RPC
    if (!loginResult || !loginResult.success) {
      logger.loginError(loginResult?.error || 'Raison inconnue', { clinicCode: clinicCodeUpper, email: emailLower });
      return res.status(401).json({
        success: false,
        message: loginResult?.error || 'Code clinique, email ou mot de passe incorrect',
      });
    }

    const userData = loginResult.user;

    if (!userData) {
      logger.loginError('Utilisateur non trouvé dans le résultat', { clinicCode: clinicCodeUpper, email: emailLower });
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier que l'email est vérifié pour les comptes APPROVED
    if (userData.status === 'APPROVED' && userData.email_verified === false) {
      logger.loginError('Email non vérifié', { clinicCode: clinicCodeUpper, email: emailLower, status: userData.status });
      return res.status(403).json({
        success: false,
        message: 'Votre email n\'a pas encore été vérifié. Veuillez vérifier votre boîte de réception et cliquer sur le lien de vérification envoyé après l\'approbation de votre compte.',
        code: 'EMAIL_NOT_VERIFIED',
        status: userData.status,
      });
    }

    logger.loginSuccess({
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      clinicCode: userData.clinic_code || clinicCodeUpper,
    });

    // Générer un token simple (à remplacer par JWT en production)
    const token = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: userData.id,
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        role: userData.role,
        clinic_id: userData.clinic_id,
        clinic_code: userData.clinic_code,
        status: userData.status,
        requires_password_change: userData.requires_password_change || false,
      },
      token,
    });
  } catch (error: any) {
    console.error('[LOGIN] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      details: error.message,
    });
  }
});

export default router;

