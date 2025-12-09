export type RoleUtilisateur = 
  | 'responsable_centre'
  | 'pharmacien'
  | 'infirmier'
  | 'administrateur'
  | 'auditeur';

export type ActionStock = 
  | 'lecture_stock'
  | 'ecriture_stock'
  | 'gestion_medicaments'
  | 'gestion_lots'
  | 'gestion_transferts'
  | 'gestion_dispensations'
  | 'gestion_pertes'
  | 'gestion_retours'
  | 'gestion_alertes'
  | 'gestion_inventaires'
  | 'generation_rapports'
  | 'export_donnees'
  | 'gestion_utilisateurs'
  | 'configuration_systeme';

export type MagasinAcces = 'gros' | 'detail' | 'tous' | 'aucun';

export interface Permission {
  action: ActionStock;
  magasin: MagasinAcces;
  description: string;
}

export interface ProfilUtilisateur {
  id: string;
  nom: string;
  role: RoleUtilisateur;
  permissions: Permission[];
  magasinsAcces: MagasinAcces[];
  dateCreation: Date;
  dateModification: Date;
  actif: boolean;
  // Nouvelles permissions par module (si défini, remplace les permissions par rôle)
  modulePermissions?: import('./modulePermissions').ModulePermission[];
  // Indique si ce profil est administrateur (a toutes les permissions automatiquement)
  isAdmin?: boolean;
}

export interface UtilisateurStock {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: RoleUtilisateur;
  profilId: string;
  magasinPrincipal: MagasinAcces;
  dateConnexion?: Date;
  permissions: Permission[];
  // Nouvelles permissions par module (si défini, remplace les permissions par rôle)
  modulePermissions?: import('./modulePermissions').ModulePermission[];
  // Indique si cet utilisateur est administrateur (a toutes les permissions automatiquement)
  isAdmin?: boolean;
}

// NOTE: Les permissions par rôle ne sont plus utilisées automatiquement.
// Seul l'administrateur a automatiquement toutes les permissions.
// Les autres profils doivent être configurés manuellement par l'administrateur.

// Configuration des permissions par rôle (déprécié - utilisé uniquement comme template)
export const PERMISSIONS_PAR_ROLE: Record<RoleUtilisateur, Permission[]> = {
  responsable_centre: [
    { action: 'lecture_stock', magasin: 'tous', description: 'Lecture complète des stocks' },
    { action: 'ecriture_stock', magasin: 'gros', description: 'Gestion du stock central' },
    { action: 'gestion_medicaments', magasin: 'tous', description: 'Gestion du catalogue' },
    { action: 'gestion_lots', magasin: 'tous', description: 'Gestion des lots' },
    { action: 'gestion_transferts', magasin: 'tous', description: 'Gestion des transferts' },
    { action: 'gestion_dispensations', magasin: 'aucun', description: 'Pas d\'accès aux dispensations' },
    { action: 'gestion_pertes', magasin: 'gros', description: 'Gestion des pertes centrales' },
    { action: 'gestion_retours', magasin: 'tous', description: 'Gestion des retours' },
    { action: 'gestion_alertes', magasin: 'tous', description: 'Gestion des alertes' },
    { action: 'gestion_inventaires', magasin: 'tous', description: 'Gestion des inventaires' },
    { action: 'generation_rapports', magasin: 'tous', description: 'Génération de rapports' },
    { action: 'export_donnees', magasin: 'tous', description: 'Export des données' },
    { action: 'gestion_utilisateurs', magasin: 'aucun', description: 'Pas de gestion des utilisateurs' },
    { action: 'configuration_systeme', magasin: 'aucun', description: 'Pas de configuration' },
  ],

  pharmacien: [
    { action: 'lecture_stock', magasin: 'tous', description: 'Lecture des stocks' },
    { action: 'ecriture_stock', magasin: 'detail', description: 'Gestion du stock détail' },
    { action: 'gestion_medicaments', magasin: 'aucun', description: 'Lecture seule du catalogue' },
    { action: 'gestion_lots', magasin: 'detail', description: 'Gestion des lots détail' },
    { action: 'gestion_transferts', magasin: 'aucun', description: 'Pas de gestion des transferts' },
    { action: 'gestion_dispensations', magasin: 'detail', description: 'Gestion des dispensations' },
    { action: 'gestion_pertes', magasin: 'detail', description: 'Gestion des pertes détail' },
    { action: 'gestion_retours', magasin: 'detail', description: 'Gestion des retours détail' },
    { action: 'gestion_alertes', magasin: 'detail', description: 'Gestion des alertes détail' },
    { action: 'gestion_inventaires', magasin: 'detail', description: 'Inventaires détail' },
    { action: 'generation_rapports', magasin: 'detail', description: 'Rapports détail' },
    { action: 'export_donnees', magasin: 'detail', description: 'Export données détail' },
    { action: 'gestion_utilisateurs', magasin: 'aucun', description: 'Pas de gestion des utilisateurs' },
    { action: 'configuration_systeme', magasin: 'aucun', description: 'Pas de configuration' },
  ],

  infirmier: [
    { action: 'lecture_stock', magasin: 'detail', description: 'Lecture stock détail' },
    { action: 'ecriture_stock', magasin: 'detail', description: 'Gestion stock détail' },
    { action: 'gestion_medicaments', magasin: 'aucun', description: 'Lecture seule du catalogue' },
    { action: 'gestion_lots', magasin: 'detail', description: 'Gestion lots détail' },
    { action: 'gestion_transferts', magasin: 'aucun', description: 'Pas de gestion des transferts' },
    { action: 'gestion_dispensations', magasin: 'detail', description: 'Gestion des dispensations' },
    { action: 'gestion_pertes', magasin: 'detail', description: 'Gestion des pertes détail' },
    { action: 'gestion_retours', magasin: 'detail', description: 'Gestion des retours détail' },
    { action: 'gestion_alertes', magasin: 'detail', description: 'Gestion des alertes détail' },
    { action: 'gestion_inventaires', magasin: 'detail', description: 'Inventaires détail' },
    { action: 'generation_rapports', magasin: 'detail', description: 'Rapports détail' },
    { action: 'export_donnees', magasin: 'detail', description: 'Export données détail' },
    { action: 'gestion_utilisateurs', magasin: 'aucun', description: 'Pas de gestion des utilisateurs' },
    { action: 'configuration_systeme', magasin: 'aucun', description: 'Pas de configuration' },
  ],

  administrateur: [
    // L'administrateur a automatiquement TOUTES les permissions
    // Cette liste est maintenue pour compatibilité mais n'est plus utilisée
    // car l'admin a toutes les permissions par défaut
    { action: 'lecture_stock', magasin: 'tous', description: 'Lecture complète des stocks' },
    { action: 'ecriture_stock', magasin: 'tous', description: 'Gestion complète des stocks' },
    { action: 'gestion_medicaments', magasin: 'tous', description: 'Gestion complète du catalogue' },
    { action: 'gestion_lots', magasin: 'tous', description: 'Gestion complète des lots' },
    { action: 'gestion_transferts', magasin: 'tous', description: 'Gestion complète des transferts' },
    { action: 'gestion_dispensations', magasin: 'tous', description: 'Gestion complète des dispensations' },
    { action: 'gestion_pertes', magasin: 'tous', description: 'Gestion complète des pertes' },
    { action: 'gestion_retours', magasin: 'tous', description: 'Gestion complète des retours' },
    { action: 'gestion_alertes', magasin: 'tous', description: 'Gestion complète des alertes' },
    { action: 'gestion_inventaires', magasin: 'tous', description: 'Gestion complète des inventaires' },
    { action: 'generation_rapports', magasin: 'tous', description: 'Génération de tous les rapports' },
    { action: 'export_donnees', magasin: 'tous', description: 'Export de toutes les données' },
    { action: 'gestion_utilisateurs', magasin: 'tous', description: 'Gestion complète des utilisateurs' },
    { action: 'configuration_systeme', magasin: 'tous', description: 'Configuration complète du système' },
  ],

  auditeur: [
    { action: 'lecture_stock', magasin: 'tous', description: 'Lecture seule des stocks' },
    { action: 'ecriture_stock', magasin: 'aucun', description: 'Pas d\'écriture' },
    { action: 'gestion_medicaments', magasin: 'aucun', description: 'Lecture seule du catalogue' },
    { action: 'gestion_lots', magasin: 'aucun', description: 'Lecture seule des lots' },
    { action: 'gestion_transferts', magasin: 'aucun', description: 'Lecture seule des transferts' },
    { action: 'gestion_dispensations', magasin: 'aucun', description: 'Lecture seule des dispensations' },
    { action: 'gestion_pertes', magasin: 'aucun', description: 'Lecture seule des pertes' },
    { action: 'gestion_retours', magasin: 'aucun', description: 'Lecture seule des retours' },
    { action: 'gestion_alertes', magasin: 'aucun', description: 'Lecture seule des alertes' },
    { action: 'gestion_inventaires', magasin: 'aucun', description: 'Lecture seule des inventaires' },
    { action: 'generation_rapports', magasin: 'tous', description: 'Génération de rapports' },
    { action: 'export_donnees', magasin: 'tous', description: 'Export des données' },
    { action: 'gestion_utilisateurs', magasin: 'aucun', description: 'Pas de gestion des utilisateurs' },
    { action: 'configuration_systeme', magasin: 'aucun', description: 'Pas de configuration' },
  ],
};

// Fonctions utilitaires pour la gestion des permissions
export const hasPermission = (
  utilisateur: UtilisateurStock,
  action: ActionStock,
  magasin?: MagasinAcces
): boolean => {
  const permission = utilisateur.permissions.find(p => p.action === action);
  if (!permission) return false;

  if (magasin) {
    return permission.magasin === 'tous' || permission.magasin === magasin;
  }

  return permission.magasin !== 'aucun';
};

export const canAccessMagasin = (
  utilisateur: UtilisateurStock,
  magasin: MagasinAcces
): boolean => {
  return utilisateur.magasinPrincipal === 'tous' || 
         utilisateur.magasinPrincipal === magasin;
};

export const getRoleLabel = (role: RoleUtilisateur): string => {
  const labels: Record<RoleUtilisateur, string> = {
    responsable_centre: 'Responsable du Centre',
    pharmacien: 'Pharmacien',
    infirmier: 'Infirmier',
    administrateur: 'Administrateur',
    auditeur: 'Auditeur',
  };
  return labels[role];
};

export const getMagasinLabel = (magasin: MagasinAcces): string => {
  const labels: Record<MagasinAcces, string> = {
    gros: 'Magasin Gros',
    detail: 'Magasin Détail',
    tous: 'Tous les Magasins',
    aucun: 'Aucun Accès',
  };
  return labels[magasin];
};
