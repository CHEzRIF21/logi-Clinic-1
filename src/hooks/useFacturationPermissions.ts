import { useMemo } from 'react';
import { hasFacturationPermission, PermissionFacturation } from '../types/facturation';

export const useFacturationPermissions = () => {
  const getUserRole = (): string => {
    const userData = localStorage.getItem('user');
    if (!userData) return 'medecin';
    
    try {
      const user = JSON.parse(userData);
      // Mapper les rôles existants vers les rôles de facturation
      const roleMapping: Record<string, string> = {
        'admin': 'administrateur',
        'medecin': 'medecin',
        'pharmacien': 'caissier',
        'infirmier': 'caissier',
        'responsable_centre': 'directeur',
        'comptable': 'comptable',
      };
      
      return roleMapping[user.role] || 'medecin';
    } catch {
      return 'medecin';
    }
  };

  const can = (permission: PermissionFacturation): boolean => {
    const role = getUserRole();
    return hasFacturationPermission(role, permission);
  };

  const permissions = useMemo(() => ({
    canRead: can('facturation:read'),
    canCreate: can('facturation:create'),
    canUpdate: can('facturation:update'),
    canDelete: can('facturation:delete'),
    canAnnuler: can('facturation:annuler'),
    canCorriger: can('facturation:corriger'),
    canRemise: can('facturation:remise'),
    canPaiement: can('facturation:paiement'),
    canRapports: can('facturation:rapports'),
    canExport: can('facturation:export'),
    role: getUserRole(),
  }), []);

  return permissions;
};

