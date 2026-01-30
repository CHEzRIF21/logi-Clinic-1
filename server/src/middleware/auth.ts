import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

/**
 * Interface étendue pour les requêtes authentifiées
 * Inclut les informations utilisateur et clinic_id pour le multi-tenant
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    clinic_id?: string;
    user_metadata?: {
      clinic_id?: string;
      role?: string;
      [key: string]: any;
    };
  };
}

/**
 * Middleware d'authentification Supabase
 * Vérifie le token JWT via Supabase Auth et extrait les informations utilisateur incluant clinic_id
 * 
 * IMPORTANT: Utilise Supabase Auth pour vérifier les tokens - PAS de vérification manuelle JWT
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Mode développement : si pas de token, utiliser un utilisateur par défaut
  if (!token) {
    if (process.env.NODE_ENV === 'development' && !process.env.ENFORCE_AUTH) {
      // En développement, permettre l'accès avec un utilisateur par défaut
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@clinic.local',
        role: 'ADMIN',
        clinic_id: req.headers['x-clinic-id'] as string || undefined,
      };
      return next();
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token d\'authentification manquant',
      code: 'MISSING_TOKEN',
    });
  }

  try {
    // Vérifier le token via Supabase Auth (recommandé - pas de vérification manuelle JWT)
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Configuration Supabase manquante',
        code: 'SUPABASE_CONFIG_ERROR',
      });
    }

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        message: authError?.message || 'Token invalide ou expiré',
        code: 'INVALID_TOKEN',
      });
    }

    // Récupérer le profil utilisateur depuis la table users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, clinic_id, status, actif, user_metadata')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (profileError || !userProfile) {
      return res.status(403).json({
        success: false,
        message: 'Profil utilisateur introuvable',
        code: 'USER_PROFILE_NOT_FOUND',
      });
    }

    if (!userProfile.actif || userProfile.status === 'SUSPENDED' || userProfile.status === 'REJECTED' || userProfile.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        message: 'Compte inactif, en attente d\'activation ou suspendu',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // clinic_id UNIQUEMENT depuis le profil (jamais depuis les headers)
    const clinicId = userProfile.clinic_id || authUser.user_metadata?.clinic_id;

    // Construire l'objet user avec toutes les informations nécessaires
    req.user = {
      id: userProfile.id,
      email: userProfile.email || authUser.email || '',
      role: userProfile.role || 'USER',
      clinic_id: clinicId,
      user_metadata: {
        ...userProfile.user_metadata,
        clinic_id: clinicId,
        role: userProfile.role,
      },
    };

    next();
  } catch (error: any) {
    console.error('Erreur d\'authentification:', error);
    return res.status(403).json({
      success: false,
      message: 'Erreur d\'authentification.',
      code: 'AUTH_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Alias pour authenticateToken
 */
export const requireAuth = authenticateToken;

/**
 * Réexport du middleware de contexte clinique unique (refuse si clinic_id absent sauf SUPER_ADMIN, expose clinicId et isSuperAdmin)
 */
export { requireClinicContext } from './clinicContext';

/**
 * Middleware pour vérifier une permission spécifique
 */
export const checkPermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    // Définir les permissions par rôle
    const rolePermissions: Record<string, string[]> = {
      SUPER_ADMIN: ['*'], // Toutes les permissions
      CLINIC_ADMIN: ['manage_clinic', 'manage_users', 'view_all', 'edit_all', 'delete_all'],
      ADMIN: ['manage_users', 'view_all', 'edit_all'],
      MEDECIN: ['view_patients', 'edit_patients', 'create_consultations', 'view_consultations'],
      INFIRMIER: ['view_patients', 'edit_vitals', 'view_consultations'],
      PHARMACIEN: ['view_prescriptions', 'dispense', 'manage_stock'],
      LABORANTIN: ['view_lab_requests', 'create_results', 'validate_results'],
      CAISSIER: ['view_invoices', 'process_payments'],
      RECEPTIONNISTE: ['view_patients', 'create_appointments'],
      USER: ['view_own'],
    };

    const userRole = req.user.role || 'USER';
    const userPermissions = rolePermissions[userRole] || [];

    // Vérifier si l'utilisateur a la permission
    const hasPermission = userPermissions.includes('*') || 
                          userPermissions.includes(permission);

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'Permission insuffisante pour cette action',
        code: 'INSUFFICIENT_PERMISSION',
        required: permission,
        role: userRole,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware optionnel pour l'authentification
 * Permet aux routes d'être accessibles sans token, mais ajoute les infos user si présent
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || !supabase) {
    next();
    return;
  }

  try {
    // Vérifier le token via Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      next();
      return;
    }

    // Récupérer le profil utilisateur depuis la table users
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, email, role, clinic_id, status, actif, user_metadata')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (userProfile && userProfile.actif && userProfile.status !== 'SUSPENDED' && userProfile.status !== 'REJECTED') {
      const clinicId = userProfile.clinic_id || 
                       authUser.user_metadata?.clinic_id;
      
      req.user = {
        id: userProfile.id,
        email: userProfile.email || authUser.email || '',
        role: userProfile.role || 'USER',
        clinic_id: clinicId,
        user_metadata: {
          ...userProfile.user_metadata,
          clinic_id: clinicId,
          role: userProfile.role,
        },
      };
    }
  } catch {
    // Ignorer les erreurs - l'utilisateur peut continuer sans authentification
  }

  next();
};
