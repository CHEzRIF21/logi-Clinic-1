import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Interface étendue pour les requêtes avec contexte de clinique
 */
export interface ClinicContextRequest extends AuthRequest {
  clinicId: string;
  isSuperAdmin: boolean;
}

/**
 * Middleware qui valide et ajoute le contexte de clinique à la requête
 * 
 * RÈGLE DE SÉCURITÉ:
 * - Les utilisateurs non-super-admin DOIVENT avoir un clinic_id
 * - Le clinic_id est extrait depuis req.user (ajouté par authenticateToken)
 * - Aucun fallback via headers pour éviter les manipulations
 */
export function requireClinicContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authReq = req as AuthRequest;
  const user = authReq.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
      code: 'AUTHENTICATION_REQUIRED',
    });
  }

  // Super admin peut accéder à toutes les cliniques
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  
  // Pour les non-super-admin, clinic_id est OBLIGATOIRE
  if (!isSuperAdmin && !user.clinic_id) {
    return res.status(403).json({
      success: false,
      message: 'Contexte de clinique manquant. Votre compte doit être associé à une clinique.',
      code: 'CLINIC_CONTEXT_REQUIRED',
    });
  }

  // Ajouter le contexte au request
  const clinicReq = req as ClinicContextRequest;
  clinicReq.clinicId = user.clinic_id || '';
  clinicReq.isSuperAdmin = isSuperAdmin;

  next();
}

/**
 * Middleware optionnel qui ajoute le contexte de clinique si disponible
 * Utilisé pour les routes qui peuvent fonctionner avec ou sans contexte
 */
export function optionalClinicContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authReq = req as AuthRequest;
  const user = authReq.user;

  if (user) {
    const clinicReq = req as ClinicContextRequest;
    clinicReq.clinicId = user.clinic_id || '';
    clinicReq.isSuperAdmin = user.role === 'SUPER_ADMIN';
  }

  next();
}
