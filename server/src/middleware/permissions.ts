import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export type Permission = 
  | 'patients:read'
  | 'patients:write'
  | 'patients:delete'
  | 'invoices:read'
  | 'invoices:write'
  | 'invoices:delete'
  | 'invoices:print'
  | 'invoices:normalize'
  | 'payments:write'
  | 'caisse:read'
  | 'caisse:write'
  | 'caisse:close'
  | 'products:read'
  | 'products:write'
  | 'products:delete'
  | 'operations:read'
  | 'operations:write'
  | 'budget:read'
  | 'budget:write'
  | 'audit:read'
  | 'reports:read'
  | 'pricing:read'
  | 'pricing:write';

/**
 * Matrice de permissions par rôle
 */
const PERMISSIONS_BY_ROLE: Record<string, Permission[]> = {
  ADMIN: [
    'patients:read', 'patients:write', 'patients:delete',
    'invoices:read', 'invoices:write', 'invoices:delete', 'invoices:print', 'invoices:normalize',
    'payments:write',
    'caisse:read', 'caisse:write', 'caisse:close',
    'products:read', 'products:write', 'products:delete',
    'operations:read', 'operations:write',
    'budget:read', 'budget:write',
    'audit:read',
    'reports:read',
    'pricing:read', 'pricing:write',
  ],
  CAISSE_MANAGER: [
    'patients:read',
    'invoices:read', 'invoices:write', 'invoices:print', 'invoices:normalize',
    'payments:write',
    'caisse:read', 'caisse:write', 'caisse:close',
    'products:read',
    'operations:read',
    'budget:read',
    'reports:read',
    'pricing:read',
  ],
  CAISSIER: [
    'patients:read',
    'invoices:read', 'invoices:write', 'invoices:print',
    'payments:write',
    'caisse:read', 'caisse:write',
    'products:read',
    'operations:read',
    'pricing:read',
  ],
  SOIGNANT: [
    'patients:read', 'patients:write',
    'invoices:read',
    'operations:read', 'operations:write',
    'products:read',
    'pricing:read',
  ],
  PHARMACIEN: [
    'patients:read',
    'invoices:read',
    'products:read', 'products:write',
    'operations:read',
    'pricing:read',
  ],
  LABORANTIN: [
    'patients:read',
    'invoices:read',
    'operations:read',
    'products:read',
    'pricing:read',
  ],
};

/**
 * Vérifie si un utilisateur a une permission
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  const permissions = PERMISSIONS_BY_ROLE[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Middleware pour vérifier une permission
 */
export function checkPermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Permission insuffisante',
        required: permission,
        role: req.user.role,
      });
    }

    next();
  };
}

/**
 * Middleware pour vérifier plusieurs permissions (OR)
 */
export function checkAnyPermission(...permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    const hasAny = permissions.some((perm) => hasPermission(req.user!.role, perm));

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: 'Permission insuffisante',
        required: permissions,
        role: req.user.role,
      });
    }

    next();
  };
}

/**
 * Middleware pour vérifier toutes les permissions (AND)
 */
export function checkAllPermissions(...permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    const hasAll = permissions.every((perm) => hasPermission(req.user!.role, perm));

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        required: permissions,
        role: req.user.role,
      });
    }

    next();
  };
}

