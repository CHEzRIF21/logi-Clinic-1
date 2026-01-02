import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

// Secret JWT - utiliser une variable d'environnement en production
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Middleware d'authentification JWT
 * Vérifie le token JWT et extrait les informations utilisateur incluant clinic_id
 */
export const authenticateToken = (
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
    // Vérifier et décoder le token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Extraire clinic_id depuis user_metadata ou directement depuis le token
    const clinicId = decoded.user_metadata?.clinic_id || 
                     decoded.clinic_id || 
                     decoded.app_metadata?.clinic_id ||
                     req.headers['x-clinic-id'] as string;
    
    // Construire l'objet user avec toutes les informations nécessaires
    req.user = {
      id: decoded.sub || decoded.id || decoded.user_id,
      email: decoded.email,
      role: decoded.user_metadata?.role || decoded.role || 'USER',
      clinic_id: clinicId,
      user_metadata: decoded.user_metadata,
    };

    next();
  } catch (error) {
    // Gérer les différents types d'erreurs JWT
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expiré. Veuillez vous reconnecter.',
        code: 'TOKEN_EXPIRED',
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({
        success: false,
        message: 'Token invalide.',
        code: 'INVALID_TOKEN',
      });
    }

    // Erreur générique
    return res.status(403).json({
      success: false,
      message: 'Erreur d\'authentification.',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Alias pour authenticateToken
 */
export const requireAuth = authenticateToken;

/**
 * Middleware pour vérifier que clinic_id est présent
 * À utiliser après authenticateToken pour les routes nécessitant un contexte de clinique
 */
export const requireClinicContext = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.clinic_id) {
    res.status(400).json({
      success: false,
      message: 'Contexte de clinique manquant. Veuillez vous reconnecter.',
      code: 'MISSING_CLINIC_CONTEXT',
    });
    return;
  }
  next();
};

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
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const clinicId = decoded.user_metadata?.clinic_id || 
                     decoded.clinic_id || 
                     decoded.app_metadata?.clinic_id;
    
    req.user = {
      id: decoded.sub || decoded.id || decoded.user_id,
      email: decoded.email,
      role: decoded.user_metadata?.role || decoded.role || 'USER',
      clinic_id: clinicId,
      user_metadata: decoded.user_metadata,
    };
  } catch {
    // Ignorer les erreurs - l'utilisateur peut continuer sans authentification
  }

  next();
};
