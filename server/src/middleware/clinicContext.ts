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
 * RÈGLE DE SÉCURITÉ (isolation stricte):
 * - TOUS les utilisateurs (y compris SUPER_ADMIN) DOIVENT avoir un clinic_id pour accéder aux données tenant.
 * - Le clinic_id est extrait UNIQUEMENT depuis req.user (profil DB), jamais depuis les headers.
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

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // clinic_id OBLIGATOIRE pour tous (y compris SUPER_ADMIN) — isolation stricte
  if (!user.clinic_id) {
    return res.status(403).json({
      success: false,
      message: 'Contexte de clinique manquant. Votre compte doit être associé à une clinique.',
      code: 'CLINIC_CONTEXT_REQUIRED',
    });
  }

  const clinicReq = req as ClinicContextRequest;
  clinicReq.clinicId = user.clinic_id;
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
