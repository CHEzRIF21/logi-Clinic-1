// Types pour les permissions par module et sous-module

export type ModuleName = 
  | 'dashboard'
  | 'consultations'
  | 'vaccination'
  | 'laboratoire'
  | 'imagerie'
  | 'pharmacie'
  | 'maternite'
  | 'stock_medicaments'
  | 'bilan'
  | 'caisse'
  | 'rendez_vous'
  | 'gestion_patients'
  | 'utilisateurs_permissions';

export type PermissionAction = 'read' | 'write' | 'delete' | 'export' | 'admin';

export interface ModulePermission {
  module: ModuleName;
  actions: PermissionAction[];
  submodules?: SubModulePermission[];
}

export interface SubModulePermission {
  submodule: string;
  actions: PermissionAction[];
}

export interface UserModulePermissions {
  userId: string;
  permissions: ModulePermission[];
  isAdmin: boolean; // Si true, a toutes les permissions automatiquement
}

export interface ProfileModulePermissions {
  profileId: string;
  profileName: string;
  permissions: ModulePermission[];
  isAdmin: boolean;
}

// Définition de tous les modules et leurs sous-modules
export const ALL_MODULES: Record<ModuleName, { label: string; submodules?: string[] }> = {
  dashboard: {
    label: 'Tableau de bord',
    submodules: ['statistiques', 'graphiques', 'rapports']
  },
  consultations: {
    label: 'Consultations',
    submodules: ['liste', 'historique', 'details', 'prescriptions']
  },
  vaccination: {
    label: 'Vaccination',
    submodules: ['calendrier', 'administration', 'suivi', 'rappels']
  },
  laboratoire: {
    label: 'Laboratoire',
    submodules: ['demandes', 'resultats', 'validation', 'rapports']
  },
  imagerie: {
    label: 'Imagerie Médicale',
    submodules: ['demandes', 'examens', 'annotations', 'rapports']
  },
  pharmacie: {
    label: 'Pharmacie',
    submodules: ['dispensation', 'prescriptions', 'inventaire', 'alertes']
  },
  maternite: {
    label: 'Maternité',
    submodules: ['dossiers', 'cpn', 'accouchements', 'post_partum', 'statistiques']
  },
  stock_medicaments: {
    label: 'Stock Médicaments',
    submodules: ['inventaire', 'entrees', 'sorties', 'transferts', 'pertes', 'alertes']
  },
  bilan: {
    label: 'Bilan',
    submodules: ['creation', 'consultation', 'export']
  },
  caisse: {
    label: 'Caisse',
    submodules: ['tableau_bord', 'tickets', 'creation_facture', 'paiements', 'journal', 'rapports', 'cloture']
  },
  rendez_vous: {
    label: 'Rendez-vous',
    submodules: ['planification', 'gestion', 'annulation', 'rappels']
  },
  gestion_patients: {
    label: 'Gestion Patients',
    submodules: ['creation', 'modification', 'dossier', 'historique', 'export']
  },
  utilisateurs_permissions: {
    label: 'Utilisateurs et Permissions',
    submodules: ['gestion_utilisateurs', 'gestion_profils', 'configuration_permissions']
  }
};

// Actions disponibles pour chaque type de permission
export const PERMISSION_ACTIONS: PermissionAction[] = ['read', 'write', 'delete', 'export', 'admin'];

// Labels pour les actions
export const ACTION_LABELS: Record<PermissionAction, string> = {
  read: 'Lecture',
  write: 'Écriture',
  delete: 'Suppression',
  export: 'Export',
  admin: 'Administration'
};

// Fonction pour obtenir toutes les permissions (pour admin)
export const getAllPermissions = (): ModulePermission[] => {
  return Object.keys(ALL_MODULES).map(module => ({
    module: module as ModuleName,
    actions: ['read', 'write', 'delete', 'export', 'admin'] as PermissionAction[],
    submodules: ALL_MODULES[module as ModuleName].submodules?.map(submodule => ({
      submodule,
      actions: ['read', 'write', 'delete', 'export', 'admin'] as PermissionAction[]
    }))
  }));
};

// Fonction pour vérifier si un utilisateur a une permission
export const hasModulePermission = (
  userPermissions: ModulePermission[],
  module: ModuleName,
  action: PermissionAction,
  submodule?: string
): boolean => {
  // Si l'utilisateur est admin, il a toutes les permissions
  if (userPermissions.some(p => p.module === 'utilisateurs_permissions' && p.actions.includes('admin'))) {
    return true;
  }

  const modulePermission = userPermissions.find(p => p.module === module);
  if (!modulePermission) return false;

  // Vérifier l'action au niveau du module
  if (!modulePermission.actions.includes(action)) {
    return false;
  }

  // Si un sous-module est spécifié, vérifier aussi les permissions du sous-module
  if (submodule && modulePermission.submodules) {
    const subModulePermission = modulePermission.submodules.find(s => s.submodule === submodule);
    if (subModulePermission) {
      return subModulePermission.actions.includes(action);
    }
  }

  return true;
};

