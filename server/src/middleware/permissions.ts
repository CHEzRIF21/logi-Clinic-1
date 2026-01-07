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
  | 'pricing:write'
  | 'consultations:read'
  | 'consultations:write'
  | 'consultations:delete'
  | 'laboratoire:read'
  | 'laboratoire:write'
  | 'laboratoire:delete'
  | 'imagerie:read'
  | 'imagerie:write'
  | 'imagerie:delete'
  | 'pharmacy:read'
  | 'pharmacy:write'
  | 'pharmacy:delete'
  | 'maternite:read'
  | 'maternite:write'
  | 'users:read'
  | 'users:write'
  | 'users:delete';

/**
 * Matrice de permissions par rôle (9 rôles métier LogiClinic)
 */
const PERMISSIONS_BY_ROLE: Record<string, Permission[]> = {
  // Administrateur Clinique - Accès complet
  admin: [
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
    'consultations:read', 'consultations:write', 'consultations:delete',
    'laboratoire:read', 'laboratoire:write', 'laboratoire:delete',
    'imagerie:read', 'imagerie:write', 'imagerie:delete',
    'pharmacy:read', 'pharmacy:write', 'pharmacy:delete',
    'maternite:read', 'maternite:write',
    'users:read', 'users:write', 'users:delete',
  ],
  // Médecin - Patients (lecture/écriture), Consultations, Laboratoire (demande)
  medecin: [
    'patients:read', 'patients:write',
    'consultations:read', 'consultations:write',
    'laboratoire:read', 'laboratoire:write',
    'invoices:read',
    'operations:read', 'operations:write',
    'products:read',
    'pricing:read',
  ],
  // Infirmier - Patients (lecture), Consultations (constantes, soins)
  infirmier: [
    'patients:read',
    'consultations:read', 'consultations:write',
    'operations:read', 'operations:write',
    'products:read',
    'pricing:read',
  ],
  // Sage-femme - Même que infirmier + maternité
  sage_femme: [
    'patients:read',
    'consultations:read', 'consultations:write',
    'maternite:read', 'maternite:write',
    'operations:read', 'operations:write',
    'products:read',
    'pricing:read',
  ],
  // Pharmacien - Pharmacie (stocks, délivrance), Rapports pharmacie
  pharmacien: [
    'pharmacy:read', 'pharmacy:write',
    'products:read', 'products:write',
    'invoices:read',
    'operations:read',
    'reports:read',
    'pricing:read',
  ],
  // Technicien de Laboratoire - Laboratoire (résultats)
  technicien_labo: [
    'laboratoire:read', 'laboratoire:write',
    'patients:read',
    'invoices:read',
    'operations:read',
    'pricing:read',
  ],
  // Imagerie / Échographie - Imagerie uniquement
  imagerie: [
    'imagerie:read', 'imagerie:write',
    'patients:read',
    'invoices:read',
    'operations:read',
    'pricing:read',
  ],
  // Caissier - Caisse (paiements, reçus), Rapports (journal caisse)
  caissier: [
    'caisse:read', 'caisse:write',
    'invoices:read', 'invoices:write', 'invoices:print',
    'payments:write',
    'patients:read',
    'products:read',
    'operations:read',
    'reports:read',
    'pricing:read',
  ],
  // Réceptionniste - Patients (création uniquement)
  receptionniste: [
    'patients:read', 'patients:write',
    'operations:read',
    'pricing:read',
  ],
  // Auditeur - Rapports (lecture seule)
  auditeur: [
    'reports:read',
    'audit:read',
    'operations:read',
  ],
  // Compatibilité avec anciens noms de rôles
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
    'consultations:read', 'consultations:write', 'consultations:delete',
    'laboratoire:read', 'laboratoire:write', 'laboratoire:delete',
    'imagerie:read', 'imagerie:write', 'imagerie:delete',
    'pharmacy:read', 'pharmacy:write', 'pharmacy:delete',
    'maternite:read', 'maternite:write',
    'users:read', 'users:write', 'users:delete',
  ],
  CAISSIER: [
    'caisse:read', 'caisse:write',
    'invoices:read', 'invoices:write', 'invoices:print',
    'payments:write',
    'patients:read',
    'products:read',
    'operations:read',
    'reports:read',
    'pricing:read',
  ],
  SOIGNANT: [
    'patients:read', 'patients:write',
    'consultations:read', 'consultations:write',
    'operations:read', 'operations:write',
    'products:read',
    'pricing:read',
  ],
  PHARMACIEN: [
    'pharmacy:read', 'pharmacy:write',
    'products:read', 'products:write',
    'invoices:read',
    'operations:read',
    'reports:read',
    'pricing:read',
  ],
  LABORANTIN: [
    'laboratoire:read', 'laboratoire:write',
    'patients:read',
    'invoices:read',
    'operations:read',
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

