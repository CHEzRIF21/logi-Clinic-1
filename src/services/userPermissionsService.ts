import { supabase } from './supabase';
import { ModulePermission } from '../types/modulePermissions';
import { User } from '../types/auth';

// Type étendu pour les utilisateurs avec tous les champs de la base
export interface ExtendedUser extends Omit<User, 'status'> {
  status: string; // PENDING, ACTIVE, SUSPENDED, etc.
  actif: boolean;
  specialite?: string;
  telephone?: string;
  adresse?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  avatar_url?: string; // URL de la photo de profil
  language?: string; // Langue préférée
  // Les propriétés username, clinicCode, permissions sont héritées de User (requises)
}

/**
 * Service pour gérer les utilisateurs et leurs permissions depuis Supabase
 */
export class UserPermissionsService {
  /**
   * Récupère tous les utilisateurs d'une clinique
   */
  static async getAllUsers(clinicId: string): Promise<ExtendedUser[]> {
    // Essayer d'abord avec la fonction RPC qui bypass RLS
    let data: any[] | null = null;
    let error: any = null;
    
    // Récupérer l'ID utilisateur depuis localStorage
    const userDataStr = localStorage.getItem('user');
    let userId: string | null = null;
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        userId = userData.id || null;
      } catch (e) {
        // Ignorer l'erreur de parsing
      }
    }
    
    try {
      const rpcParams: any = { p_clinic_id: clinicId };
      if (userId) {
        rpcParams.p_user_id = userId;
      }
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_clinic_users', rpcParams);
      
      if (!rpcError && rpcData) {
        data = rpcData;
      } else {
        error = rpcError;
      }
    } catch (rpcErr: any) {
      // Fallback vers la requête directe si RPC échoue
      const { data: directData, error: directError } = await supabase
        .from('users')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      data = directData;
      error = directError;
    }

    if (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }

    return (data || []).map(user => ({
      id: user.id,
      email: user.email,
      nom: user.nom || '',
      prenom: user.prenom || '',
      role: user.role || 'STAFF',
      status: user.status || 'PENDING',
      clinicId: user.clinic_id,
      actif: user.actif ?? true,
      specialite: user.specialite,
      telephone: user.telephone,
      adresse: user.adresse,
      lastLogin: user.last_login ? new Date(user.last_login) : undefined,
      createdAt: user.created_at ? new Date(user.created_at) : new Date(),
      updatedAt: user.updated_at ? new Date(user.updated_at) : new Date(),
      avatar_url: user.avatar_url,
      language: user.language || 'fr',
      // Propriétés requises par User avec valeurs par défaut
      username: user.email, // Utiliser email comme username par défaut
      clinicCode: '', // Sera rempli si nécessaire
      permissions: [], // Sera rempli si nécessaire
    } as ExtendedUser));
  }

  /**
   * Récupère les permissions d'un utilisateur (défaut + personnalisées)
   */
  static async getUserPermissions(userId: string): Promise<ModulePermission[]> {
    // Appeler la fonction SQL get_user_permissions
    const { data, error } = await supabase.rpc('get_user_permissions', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Erreur lors de la récupération des permissions:', error);
      throw error;
    }

    // Transformer les résultats en ModulePermission[]
    const permissionsMap = new Map<string, ModulePermission>();

    (data || []).forEach((perm: any) => {
      const key = perm.module_name;
      
      if (!permissionsMap.has(key)) {
        permissionsMap.set(key, {
          module: perm.module_name as any,
          actions: [],
          submodules: [],
        });
      }

      const modulePerm = permissionsMap.get(key)!;
      
      // Ajouter l'action si elle n'existe pas déjà
      if (!modulePerm.actions.includes(perm.permission_action as any)) {
        modulePerm.actions.push(perm.permission_action as any);
      }

      // Ajouter le sous-module si présent
      if (perm.submodule_name) {
        if (!modulePerm.submodules) {
          modulePerm.submodules = [];
        }
        
        const submodule = modulePerm.submodules.find(
          s => s.submodule === perm.submodule_name
        );

        if (!submodule) {
          modulePerm.submodules.push({
            submodule: perm.submodule_name,
            actions: [perm.permission_action as any],
          });
        } else if (!submodule.actions.includes(perm.permission_action as any)) {
          submodule.actions.push(perm.permission_action as any);
        }
      }
    });

    return Array.from(permissionsMap.values());
  }

  /**
   * Met à jour les permissions personnalisées d'un utilisateur
   */
  static async updateUserPermissions(
    userId: string,
    permissions: ModulePermission[]
  ): Promise<void> {
    // D'abord, supprimer toutes les permissions personnalisées existantes
    const { error: deleteError } = await supabase
      .from('user_custom_permissions')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Erreur lors de la suppression des permissions:', deleteError);
      throw deleteError;
    }

    // Ensuite, insérer les nouvelles permissions personnalisées
    const customPermissions: any[] = [];

    permissions.forEach(perm => {
      // Permissions au niveau module
      perm.actions.forEach(action => {
        customPermissions.push({
          user_id: userId,
          module_name: perm.module,
          permission_action: action,
          submodule_name: null,
          granted: true,
        });
      });

      // Permissions au niveau sous-module
      if (perm.submodules) {
        perm.submodules.forEach(submodule => {
          submodule.actions.forEach(action => {
            customPermissions.push({
              user_id: userId,
              module_name: perm.module,
              permission_action: action,
              submodule_name: submodule.submodule,
              granted: true,
            });
          });
        });
      }
    });

    if (customPermissions.length > 0) {
      const { error: insertError } = await supabase
        .from('user_custom_permissions')
        .insert(customPermissions);

      if (insertError) {
        console.error('Erreur lors de l\'insertion des permissions:', insertError);
        throw insertError;
      }
    }
  }

  /**
   * Réinitialise les permissions d'un utilisateur aux valeurs par défaut de son rôle
   */
  static async resetToDefaultPermissions(userId: string): Promise<void> {
    const { error } = await supabase.rpc('reset_user_to_default_permissions', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Erreur lors de la réinitialisation des permissions:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  static async userHasPermission(
    userId: string,
    moduleName: string,
    permissionAction: string,
    submoduleName?: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('user_has_permission', {
      p_user_id: userId,
      p_module_name: moduleName,
      p_permission_action: permissionAction,
      p_submodule_name: submoduleName || null,
    });

    if (error) {
      console.error('Erreur lors de la vérification de permission:', error);
      throw error;
    }

    return data === true;
  }

  /**
   * Récupère un utilisateur par son ID
   */
  static async getUserById(userId: string): Promise<ExtendedUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Utilisateur non trouvé
      }
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }

    return {
      id: data.id,
      email: data.email,
      nom: data.nom || '',
      prenom: data.prenom || '',
      role: data.role || 'STAFF',
      status: data.status || 'PENDING',
      clinicId: data.clinic_id,
      actif: data.actif ?? true,
      specialite: data.specialite,
      telephone: data.telephone,
      adresse: data.adresse,
      lastLogin: data.last_login ? new Date(data.last_login) : undefined,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
      avatar_url: data.avatar_url,
      language: data.language || 'fr',
      // Propriétés requises par User avec valeurs par défaut
      username: data.email,
      clinicCode: '',
      permissions: [],
    } as ExtendedUser;
  }

  /**
   * Récupère les statistiques des utilisateurs d'une clinique
   */

  /**
   * Met à jour un utilisateur
   */
  static async updateUser(userId: string, updates: Partial<ExtendedUser>): Promise<ExtendedUser> {
    const updateData: any = {};

    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.status !== undefined) updateData.status = updates.status;
    if ((updates as any).actif !== undefined) updateData.actif = (updates as any).actif;
    if ((updates as any).specialite !== undefined) updateData.specialite = (updates as any).specialite;
    if ((updates as any).telephone !== undefined) updateData.telephone = (updates as any).telephone;
    if ((updates as any).adresse !== undefined) updateData.adresse = (updates as any).adresse;
    if ((updates as any).avatar_url !== undefined) updateData.avatar_url = (updates as any).avatar_url;
    if ((updates as any).language !== undefined) updateData.language = (updates as any).language;
    // Note: Les champs username, clinicCode, permissions ne sont pas modifiables via cette méthode

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }

    return {
      id: data.id,
      email: data.email,
      nom: data.nom || '',
      prenom: data.prenom || '',
      role: data.role || 'STAFF',
      status: data.status || 'PENDING',
      clinicId: data.clinic_id,
      actif: data.actif ?? true,
      specialite: data.specialite,
      telephone: data.telephone,
      adresse: data.adresse,
      lastLogin: data.last_login ? new Date(data.last_login) : undefined,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
      avatar_url: data.avatar_url,
      language: data.language || 'fr',
      // Propriétés requises par User avec valeurs par défaut
      username: data.email,
      clinicCode: '',
      permissions: [],
    } as ExtendedUser;
  }

  /**
   * Récupère les statistiques des utilisateurs d'une clinique
   */
  static async getUsersStatistics(clinicId: string): Promise<{
    total: number;
    actifs: number;
    inactifs: number;
    parRole: Record<string, number>;
    parStatut: Record<string, number>;
    derniereConnexion: {
      aujourdhui: number;
      cetteSemaine: number;
      ceMois: number;
      jamais: number;
    };
  }> {
    const users = await this.getAllUsers(clinicId);
    
    const stats = {
      total: users.length,
      actifs: users.filter(u => u.actif).length,
      inactifs: users.filter(u => !u.actif).length,
      parRole: {} as Record<string, number>,
      parStatut: {} as Record<string, number>,
      derniereConnexion: {
        aujourdhui: 0,
        cetteSemaine: 0,
        ceMois: 0,
        jamais: 0,
      },
    };

    const maintenant = new Date();
    const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    const cetteSemaine = new Date(aujourdhui);
    cetteSemaine.setDate(cetteSemaine.getDate() - 7);
    const ceMois = new Date(aujourdhui);
    ceMois.setMonth(ceMois.getMonth() - 1);

    users.forEach(user => {
      // Par rôle
      const role = user.role || 'STAFF';
      stats.parRole[role] = (stats.parRole[role] || 0) + 1;

      // Par statut
      const statut = user.status || 'PENDING';
      stats.parStatut[statut] = (stats.parStatut[statut] || 0) + 1;

      // Dernière connexion
      if (!user.lastLogin) {
        stats.derniereConnexion.jamais++;
      } else {
        const lastLogin = new Date(user.lastLogin);
        if (lastLogin >= aujourdhui) {
          stats.derniereConnexion.aujourdhui++;
        } else if (lastLogin >= cetteSemaine) {
          stats.derniereConnexion.cetteSemaine++;
        } else if (lastLogin >= ceMois) {
          stats.derniereConnexion.ceMois++;
        }
      }
    });

    return stats;
  }

  /**
   * Récupère les permissions par défaut d'un rôle
   */
  static async getDefaultRolePermissions(roleCode: string): Promise<ModulePermission[]> {
    const { data, error } = await supabase.rpc('get_default_role_permissions', {
      p_role_code: roleCode,
    });

    if (error) {
      console.error('Erreur lors de la récupération des permissions par défaut:', error);
      throw error;
    }

    // Transformer les résultats en ModulePermission[]
    const permissionsMap = new Map<string, ModulePermission>();

    (data || []).forEach((perm: any) => {
      const key = perm.module_name;
      
      if (!permissionsMap.has(key)) {
        permissionsMap.set(key, {
          module: perm.module_name as any,
          actions: [],
          submodules: [],
        });
      }

      const modulePerm = permissionsMap.get(key)!;
      
      // Ajouter l'action si elle n'existe pas déjà
      if (!modulePerm.actions.includes(perm.permission_action as any)) {
        modulePerm.actions.push(perm.permission_action as any);
      }

      // Ajouter le sous-module si présent
      if (perm.submodule_name) {
        if (!modulePerm.submodules) {
          modulePerm.submodules = [];
        }
        
        const submodule = modulePerm.submodules.find(
          s => s.submodule === perm.submodule_name
        );

        if (!submodule) {
          modulePerm.submodules.push({
            submodule: perm.submodule_name,
            actions: [perm.permission_action as any],
          });
        } else if (!submodule.actions.includes(perm.permission_action as any)) {
          submodule.actions.push(perm.permission_action as any);
        }
      }
    });

    return Array.from(permissionsMap.values());
  }

  /**
   * Réinitialise le mot de passe d'un utilisateur
   */
  static async resetUserPassword(userId: string): Promise<void> {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';
    const token = localStorage.getItem('token');
    const clinicId = localStorage.getItem('clinic_id');

    const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-clinic-id': clinicId || '',
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Erreur lors de la réinitialisation du mot de passe');
    }
  }

  /**
   * Récupère le nombre de demandes d'inscription en attente
   */
  static async getPendingRegistrationRequestsCount(clinicId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('registration_requests')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('statut', 'pending');

      if (error) {
        console.error('Erreur lors du comptage des demandes:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('Erreur lors du comptage des demandes:', err);
      return 0;
    }
  }

  /**
   * Récupère les statistiques des demandes d'inscription
   */
  static async getRegistrationRequestsStats(clinicId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('registration_requests')
        .select('statut')
        .eq('clinic_id', clinicId);

      if (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        return { total: 0, pending: 0, approved: 0, rejected: 0 };
      }

      const requests = data || [];
      return {
        total: requests.length,
        pending: requests.filter(r => r.statut === 'pending').length,
        approved: requests.filter(r => r.statut === 'approved').length,
        rejected: requests.filter(r => r.statut === 'rejected').length,
      };
    } catch (err) {
      console.error('Erreur lors de la récupération des stats:', err);
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
  }

  /**
   * Récupère les demandes de récupération de compte
   */
  static async getRecoveryRequests(clinicId: string, status?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('account_recovery_requests')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Erreur lors de la récupération des demandes:', err);
      return [];
    }
  }

  /**
   * Approuve une demande de récupération de compte
   */
  static async approveRecoveryRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('account_recovery_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      console.error('Erreur lors de l\'approbation:', error);
      throw error;
    }
  }

  /**
   * Rejette une demande de récupération de compte
   */
  static async rejectRecoveryRequest(requestId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('account_recovery_requests')
      .update({ 
        status: 'rejected', 
        rejection_reason: reason,
        updated_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (error) {
      console.error('Erreur lors du rejet:', error);
      throw error;
    }
  }

  /**
   * Récupère le nombre de demandes de récupération en attente
   */
  static async getPendingRecoveryRequestsCount(clinicId: string): Promise<number> {
    try {
      const requests = await this.getRecoveryRequests(clinicId, 'pending');
      return requests.length;
    } catch (err) {
      console.error('Erreur lors du comptage des récupérations:', err);
      return 0;
    }
  }

  /**
   * Récupère tous les profils personnalisés d'une clinique
   */
  static async getCustomProfiles(clinicId: string): Promise<any[]> {
    try {
      // Utiliser la fonction RPC qui bypass RLS pour éviter les problèmes de JWT
      const { data, error } = await supabase.rpc('get_custom_profiles', {
        p_clinic_id: clinicId,
      });

      if (error) {
        console.error('Erreur lors de la récupération des profils:', error);
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Erreur lors de la récupération des profils:', err);
      return [];
    }
  }

  /**
   * Crée un profil personnalisé
   */
  static async createCustomProfile(
    clinicId: string,
    nom: string,
    description: string,
    roleCode: string,
    isAdmin: boolean,
    permissions: ModulePermission[],
    createdBy?: string
  ): Promise<string> {
    try {
      // Convertir les permissions en format JSONB
      const permissionsJson = permissions.map(perm => ({
        module: perm.module,
        actions: perm.actions,
        submodules: perm.submodules || [],
      }));

      const { data, error } = await supabase.rpc('create_custom_profile', {
        p_clinic_id: clinicId,
        p_nom: nom,
        p_description: description,
        p_role_code: roleCode,
        p_is_admin: isAdmin,
        p_permissions: permissionsJson as any,
        p_created_by: createdBy || null,
      });

      if (error) {
        console.error('Erreur lors de la création du profil:', error);
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error('Erreur lors de la création du profil:', err);
      throw err;
    }
  }

  /**
   * Récupère les permissions d'un profil personnalisé
   */
  static async getCustomProfilePermissions(profileId: string): Promise<ModulePermission[]> {
    try {
      const { data, error } = await supabase.rpc('get_custom_profile_permissions', {
        p_profile_id: profileId,
      });

      if (error) {
        console.error('Erreur lors de la récupération des permissions:', error);
        throw error;
      }

      // Transformer les résultats en ModulePermission[]
      const permissionsMap = new Map<string, ModulePermission>();

      (data || []).forEach((perm: any) => {
        const key = perm.module_name;
        
        if (!permissionsMap.has(key)) {
          permissionsMap.set(key, {
            module: perm.module_name as any,
            actions: [],
            submodules: [],
          });
        }

        const modulePerm = permissionsMap.get(key)!;
        
        if (!modulePerm.actions.includes(perm.permission_action as any)) {
          modulePerm.actions.push(perm.permission_action as any);
        }

        if (perm.submodule_name) {
          if (!modulePerm.submodules) {
            modulePerm.submodules = [];
          }
          
          const submodule = modulePerm.submodules.find(
            s => s.submodule === perm.submodule_name
          );

          if (!submodule) {
            modulePerm.submodules.push({
              submodule: perm.submodule_name,
              actions: [perm.permission_action as any],
            });
          } else if (!submodule.actions.includes(perm.permission_action as any)) {
            submodule.actions.push(perm.permission_action as any);
          }
        }
      });

      return Array.from(permissionsMap.values());
    } catch (err: any) {
      console.error('Erreur lors de la récupération des permissions:', err);
      throw err;
    }
  }

  /**
   * Met à jour un profil personnalisé
   */
  static async updateCustomProfile(
    profileId: string,
    updates: {
      nom?: string;
      description?: string;
      actif?: boolean;
      permissions?: ModulePermission[];
    }
  ): Promise<void> {
    try {
      // Mettre à jour les informations de base du profil
      const updateData: any = {};
      if (updates.nom !== undefined) updateData.nom = updates.nom;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.actif !== undefined) updateData.actif = updates.actif;
      updateData.updated_at = new Date().toISOString();

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('custom_profiles')
          .update(updateData)
          .eq('id', profileId);

        if (updateError) {
          throw updateError;
        }
      }

      // Mettre à jour les permissions si fournies
      if (updates.permissions) {
        // Supprimer les anciennes permissions
        const { error: deleteError } = await supabase
          .from('custom_profile_permissions')
          .delete()
          .eq('profile_id', profileId);

        if (deleteError) {
          throw deleteError;
        }

        // Insérer les nouvelles permissions
        const customPermissions: any[] = [];
        updates.permissions.forEach(perm => {
          perm.actions.forEach(action => {
            customPermissions.push({
              profile_id: profileId,
              module_name: perm.module,
              permission_action: action,
              submodule_name: null,
              granted: true,
            });
          });

          if (perm.submodules) {
            perm.submodules.forEach(submodule => {
              submodule.actions.forEach(action => {
                customPermissions.push({
                  profile_id: profileId,
                  module_name: perm.module,
                  permission_action: action,
                  submodule_name: submodule.submodule,
                  granted: true,
                });
              });
            });
          }
        });

        if (customPermissions.length > 0) {
          const { error: insertError } = await supabase
            .from('custom_profile_permissions')
            .insert(customPermissions);

          if (insertError) {
            throw insertError;
          }
        }
      }
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      throw err;
    }
  }

  /**
   * Supprime un profil personnalisé
   */
  static async deleteCustomProfile(profileId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('custom_profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        console.error('Erreur lors de la suppression du profil:', error);
        throw error;
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression du profil:', err);
      throw err;
    }
  }
}
