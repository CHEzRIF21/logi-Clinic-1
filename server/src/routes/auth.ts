import { Router, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { emailService } from '../services/emailService';
import { AuthRequest, authenticateToken } from '../middleware/auth';
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
    fs.appendFileSync(logPath, JSON.stringify({location:'auth.ts:15',message:'Route register-request appelée',data:{method:req.method,bodyKeys:Object.keys(req.body || {}),hasClinicCode:!!req.body?.clinicCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
  } catch(e) {}
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

    // Hash du mot de passe
    const passwordHash = hashPassword(password);

    // Créer la demande d'inscription avec le clinic_id
    const { data, error } = await supabase
      .from('registration_requests')
      .insert({
        nom,
        prenom,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        telephone,
        adresse,
        role_souhaite: roleSouhaite || 'receptionniste',
        specialite,
        security_questions: securityQuestions,
        statut: 'pending',
        clinic_id: clinicId,
        clinic_code: clinicCodeUpper,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la demande',
        error: error.message,
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
      });
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
router.get('/registration-requests', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    const { statut } = req.query;
    
    // Récupérer le clinic_id depuis le token JWT ou les headers
    const clinicId = req.user?.clinic_id || req.headers['x-clinic-id'] as string;
    const userRole = req.user?.role;
    
    console.log('🔐 Utilisateur récupérant les demandes:', {
      userId: req.user?.id,
      role: userRole,
      clinicId: clinicId,
    });

    let query = supabase
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtrer par clinic_id si l'utilisateur n'est pas SUPER_ADMIN
    if (clinicId && userRole !== 'SUPER_ADMIN') {
      query = query.eq('clinic_id', clinicId);
      console.log('🔒 Filtrage par clinic_id:', clinicId);
    }

    if (statut && statut !== '') {
      query = query.eq('statut', statut);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur Supabase:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des demandes',
      });
    }

    // Ne pas renvoyer les mots de passe hashés et mapper snake_case vers camelCase
    console.log('📋 Données brutes des demandes d\'inscription:', JSON.stringify(data, null, 2));
    
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
router.post('/registration-requests/:id/approve', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, permissions, notes } = req.body;
    
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

    if (request.statut !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée',
      });
    }

    // Vérifier que supabaseAdmin est disponible
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        message: 'Service admin non disponible. Vérifiez SUPABASE_SERVICE_ROLE_KEY',
      });
    }

    // Générer un mot de passe temporaire
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

    // Utiliser le rôle souhaité de la demande si aucun rôle n'est spécifié
    const finalRole = role || request.role_souhaite || 'receptionniste';
    
    // Créer l'utilisateur dans Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: request.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        nom: request.nom,
        prenom: request.prenom,
        role: finalRole,
        clinic_id: request.clinic_id,
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

    // Créer l'utilisateur dans la table users avec auth_user_id
    const { error: userError } = await supabase
      .from('users')
      .insert({
        nom: request.nom,
        prenom: request.prenom,
        email: request.email,
        password_hash: request.password_hash,
        role: finalRole,
        specialite: request.specialite,
        telephone: request.telephone,
        adresse: request.adresse,
        actif: true,
        status: 'PENDING', // L'utilisateur devra changer son mot de passe à la première connexion
        clinic_id: request.clinic_id, // Association à la clinique
        auth_user_id: authUser.user.id, // Lier au compte Auth
      });

    if (userError) {
      // Rollback: supprimer l'utilisateur Auth créé
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      console.error('Erreur création utilisateur:', userError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'utilisateur',
        error: userError.message,
      });
    }

    console.log('✅ Utilisateur créé avec succès:', {
      authUserId: authUser.user.id,
      email: request.email,
      role: finalRole,
      clinicId: request.clinic_id,
    });

    // Générer un lien de réinitialisation de mot de passe
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: request.email,
    });
    
    if (resetError) {
      console.warn('⚠️ Impossible de générer le lien de réinitialisation:', resetError);
    }

    // Mettre à jour le statut de la demande
    const { error: updateError } = await supabase
      .from('registration_requests')
      .update({
        statut: 'approved',
        notes,
        reviewed_by: req.user?.id, // ID de l'admin qui approuve (depuis le middleware auth)
        reviewed_at: new Date().toISOString(),
        date_approbation: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('⚠️ Erreur mise à jour demande (non bloquante):', updateError);
    } else {
      console.log('✅ Demande mise à jour avec statut approved');
    }

    // TODO: Envoyer un email avec le lien de réinitialisation
    // await emailService.sendWelcomeEmail({
    //   to: request.email,
    //   resetLink: resetData?.properties?.action_link,
    //   tempPassword: tempPassword
    // });

    res.json({
      success: true,
      message: 'Demande approuvée avec succès',
      recoveryLink: resetData?.properties?.action_link || null,
      note: 'Un email avec le lien de réinitialisation sera envoyé au membre',
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
router.post('/registration-requests/:id/reject', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { raisonRejet, notes } = req.body;
    
    console.log('❌ Rejet demande ID:', id, 'par utilisateur:', req.user?.id);

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
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

