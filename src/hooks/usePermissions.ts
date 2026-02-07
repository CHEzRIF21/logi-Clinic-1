import { useMemo } from 'react';
import { UserRole } from '../types/auth';
import { roleHasPermission } from '../config/defaultRolePermissions';
import { ModuleName, PermissionAction } from '../types/modulePermissions';

/**
 * Hook pour vérifier les permissions de l'utilisateur actuel
 */
export const usePermissions = () => {
  // Récupérer l'utilisateur depuis localStorage
  const user = useMemo(() => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }, []);

  const userRole: UserRole | null = user?.role || null;

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  const hasPermission = (
    module: ModuleName,
    action: PermissionAction,
    submodule?: string
  ): boolean => {
    if (!userRole) return false;
    
    // Admin a toutes les permissions
    if (userRole === 'admin') return true;
    
    return roleHasPermission(userRole, module, action, submodule);
  };

  /**
   * Vérifie si l'utilisateur peut créer des patients
   * Seuls Réceptionniste et Secrétaire peuvent créer
   */
  const canCreatePatient = (): boolean => {
    if (!userRole) return false;
    return userRole === 'receptionniste' || userRole === 'aide_soignant' || userRole === 'secretaire' || userRole === 'admin';
  };

  /**
   * Vérifie si l'utilisateur peut modifier des patients
   */
  const canModifyPatient = (): boolean => {
    if (!userRole) return false;
    return hasPermission('gestion_patients', 'write', 'modification') || 
           userRole === 'receptionniste' || 
           userRole === 'aide_soignant' || 
           userRole === 'secretaire' || 
           userRole === 'admin';
  };

  /**
   * Vérifie si l'utilisateur peut accéder aux rapports financiers
   */
  const canAccessFinancialReports = (): boolean => {
    if (!userRole) return false;
    return userRole === 'admin' || 
           userRole === 'comptable' || 
           userRole === 'auditeur';
  };

  /**
   * Vérifie si l'utilisateur peut autoriser une urgence sans paiement
   */
  const canAuthorizeEmergency = (): boolean => {
    if (!userRole) return false;
    return userRole === 'admin' || userRole === 'medecin';
  };

  /**
   * Vérifie si l'utilisateur peut encaisser des paiements
   */
  const canProcessPayments = (): boolean => {
    if (!userRole) return false;
    return userRole === 'caissier' || userRole === 'admin';
  };

  return {
    userRole,
    hasPermission,
    canCreatePatient,
    canModifyPatient,
    canAccessFinancialReports,
    canAuthorizeEmergency,
    canProcessPayments,
  };
};

