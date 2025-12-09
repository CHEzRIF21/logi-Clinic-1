// Types pour les permissions de facturation
export type RoleFacturation = 
  | 'medecin'
  | 'caissier'
  | 'administrateur'
  | 'directeur'
  | 'comptable';

export type PermissionFacturation =
  | 'facturation:read'
  | 'facturation:create'
  | 'facturation:update'
  | 'facturation:delete'
  | 'facturation:annuler'
  | 'facturation:corriger'
  | 'facturation:remise'
  | 'facturation:paiement'
  | 'facturation:rapports'
  | 'facturation:export'
  | 'facturation:admin';

export interface PermissionsFacturation {
  role: RoleFacturation;
  permissions: PermissionFacturation[];
}

// Configuration des permissions par rôle
export const PERMISSIONS_FACTURATION: Record<RoleFacturation, PermissionFacturation[]> = {
  medecin: [
    'facturation:read', // Peut consulter le montant de ses actes
  ],
  caissier: [
    'facturation:read',
    'facturation:create',
    'facturation:paiement',
  ],
  administrateur: [
    'facturation:read',
    'facturation:create',
    'facturation:update',
    'facturation:delete',
    'facturation:annuler',
    'facturation:corriger',
    'facturation:remise',
    'facturation:paiement',
    'facturation:rapports',
    'facturation:export',
  ],
  directeur: [
    'facturation:read',
    'facturation:rapports',
    'facturation:export',
  ],
  comptable: [
    'facturation:read',
    'facturation:rapports',
    'facturation:export',
  ],
};

// Fonction pour vérifier les permissions
export const hasFacturationPermission = (
  userRole: string,
  permission: PermissionFacturation
): boolean => {
  const role = userRole as RoleFacturation;
  const permissions = PERMISSIONS_FACTURATION[role] || [];
  return permissions.includes(permission) || permissions.includes('facturation:admin');
};

// Devises supportées
export type Devise = 'FCFA' | 'USD' | 'EUR';

export interface TauxChange {
  devise: Devise;
  taux: number; // Taux par rapport à FCFA
  date_mise_a_jour: string;
}

// Configuration DGI pour facturation normalisée
export interface ConfigDGI {
  actif: boolean;
  numero_ifu?: string;
  numero_autorisation_dgi?: string;
  generer_qr_code: boolean;
}

// Alerte de caisse
export interface AlerteCaisse {
  id?: string;
  seuil: number;
  devise: Devise;
  active: boolean;
  notification_envoyee: boolean;
  date_derniere_notification?: string;
}

