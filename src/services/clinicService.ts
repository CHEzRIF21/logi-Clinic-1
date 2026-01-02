/**
 * Service de gestion Multi-Tenancy pour Logi Clinic
 * 
 * Ce service fournit des fonctions pour:
 * - Récupérer automatiquement le clinic_id de l'utilisateur connecté
 * - Filtrer les requêtes par clinic_id
 * - Vérifier les permissions admin
 */

import { supabase } from './supabase';

export interface ClinicInfo {
  id: string;
  code: string;
  name: string;
  isDemo: boolean;
  isActive: boolean;
}

export interface UserClinicInfo {
  userId: string;
  clinicId: string | null;
  role: string;
  isClinicAdmin: boolean;
  isSuperAdmin: boolean;
}

/**
 * Cache pour éviter les requêtes répétées
 */
let cachedClinicId: string | null = null;
let cachedUserInfo: UserClinicInfo | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère l'ID de la clinique de l'utilisateur connecté
 */
export async function getMyClinicId(): Promise<string | null> {
  // Vérifier le cache
  if (cachedClinicId && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedClinicId;
  }

  try {
    // Méthode 1: Essayer la fonction RPC
    // IMPORTANT: on utilise la version sans paramètre (utilisée par RLS).
    try {
      const { data, error } = await supabase.rpc('get_my_clinic_id');
      
      if (!error && data) {
        cachedClinicId = data;
        cacheTimestamp = Date.now();
        return data;
      } else if (error) {
        console.warn('RPC get_my_clinic_id échoué, utilisation du fallback:', error);
      }
    } catch (rpcError) {
      console.warn('RPC get_my_clinic_id échoué, utilisation du fallback:', rpcError);
    }

    // Méthode 2: Fallback - Récupérer depuis getCurrentUserInfo
    const userInfo = await getCurrentUserInfo();
    if (userInfo?.clinicId) {
      cachedClinicId = userInfo.clinicId;
      cacheTimestamp = Date.now();
      return userInfo.clinicId;
    }

    // Méthode 3: Fallback - Récupérer depuis localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        
        // Vérifier si clinicId est directement dans l'objet user
        if (user.clinicId) {
          cachedClinicId = user.clinicId;
          cacheTimestamp = Date.now();
          return user.clinicId;
        }
        
        // Si on a auth_user_id, chercher par auth_user_id
        if (user.auth_user_id) {
          const { data: userFromAuth, error: authError } = await supabase
            .from('users')
            .select('id, clinic_id')
            .eq('auth_user_id', user.auth_user_id)
            .maybeSingle();
          
          if (!authError && userFromAuth?.clinic_id) {
            cachedClinicId = userFromAuth.clinic_id;
            cacheTimestamp = Date.now();
            return userFromAuth.clinic_id;
          }
        }
        
        // Chercher par ID utilisateur (vérifier que c'est un UUID valide)
        if (user.id) {
          // Vérifier que l'ID est un UUID valide (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(user.id)) {
            const { data: userFromId, error: idError } = await supabase
              .from('users')
              .select('clinic_id')
              .eq('id', user.id)
              .maybeSingle();
            
            if (!idError && userFromId?.clinic_id) {
              cachedClinicId = userFromId.clinic_id;
              cacheTimestamp = Date.now();
              return userFromId.clinic_id;
            } else if (idError) {
              console.error('Erreur récupération clinic_id par ID utilisateur:', idError);
            }
          } else {
            console.warn('ID utilisateur invalide (pas un UUID):', user.id);
          }
        }
      } catch (localError) {
        console.error('Erreur récupération depuis localStorage:', localError);
      }
    }

    console.error('Impossible de récupérer le clinic_id');
    return null;
  } catch (err) {
    console.error('Erreur récupération clinic_id:', err);
    return null;
  }
}

/**
 * Récupère les informations complètes de l'utilisateur connecté
 */
export async function getCurrentUserInfo(): Promise<UserClinicInfo | null> {
  // Vérifier le cache
  if (cachedUserInfo && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedUserInfo;
  }

  try {
    // Méthode 1: Essayer avec Supabase Auth
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!authError && user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, clinic_id, role')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!error && userData) {
          cachedUserInfo = {
            userId: userData.id,
            clinicId: userData.clinic_id,
            role: userData.role,
            isClinicAdmin: ['CLINIC_ADMIN', 'ADMIN'].includes(userData.role),
            isSuperAdmin: userData.role === 'SUPER_ADMIN',
          };
          
          cachedClinicId = userData.clinic_id;
          cacheTimestamp = Date.now();
          
          return cachedUserInfo;
        }
      }
    } catch (authErr) {
      console.warn('Auth non disponible, utilisation du fallback:', authErr);
    }

    // Méthode 2: Fallback - Récupérer depuis localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        let userIdToQuery: string | null = null;
        
        // Essayer avec auth_user_id d'abord
        if (user.auth_user_id && uuidRegex.test(user.auth_user_id)) {
          const { data: userFromAuth, error: authError } = await supabase
            .from('users')
            .select('id, clinic_id, role')
            .eq('auth_user_id', user.auth_user_id)
            .maybeSingle();
          
          if (!authError && userFromAuth) {
            cachedUserInfo = {
              userId: userFromAuth.id,
              clinicId: userFromAuth.clinic_id,
              role: userFromAuth.role,
              isClinicAdmin: ['CLINIC_ADMIN', 'ADMIN'].includes(userFromAuth.role),
              isSuperAdmin: userFromAuth.role === 'SUPER_ADMIN',
            };
            
            cachedClinicId = userFromAuth.clinic_id;
            cacheTimestamp = Date.now();
            
            return cachedUserInfo;
          }
        }
        
        // Essayer avec id directement
        if (user.id && uuidRegex.test(user.id)) {
          userIdToQuery = user.id;
        }
        
        if (userIdToQuery) {
          const { data: userFromId, error: idError } = await supabase
            .from('users')
            .select('id, clinic_id, role')
            .eq('id', userIdToQuery)
            .maybeSingle();
          
          if (!idError && userFromId) {
            cachedUserInfo = {
              userId: userFromId.id,
              clinicId: userFromId.clinic_id,
              role: userFromId.role,
              isClinicAdmin: ['CLINIC_ADMIN', 'ADMIN'].includes(userFromId.role),
              isSuperAdmin: userFromId.role === 'SUPER_ADMIN',
            };
            
            cachedClinicId = userFromId.clinic_id;
            cacheTimestamp = Date.now();
            
            return cachedUserInfo;
          }
        }
      } catch (localError) {
        console.error('Erreur récupération depuis localStorage:', localError);
      }
    }

    return null;
  } catch (err) {
    console.error('Erreur récupération user info:', err);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est admin de clinique
 */
export async function isClinicAdmin(): Promise<boolean> {
  const userInfo = await getCurrentUserInfo();
  return userInfo?.isClinicAdmin || userInfo?.isSuperAdmin || false;
}

/**
 * Vérifie si l'utilisateur est Super Admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const userInfo = await getCurrentUserInfo();
  return userInfo?.isSuperAdmin || false;
}

/**
 * Valide un code clinique
 */
export async function validateClinicCode(code: string): Promise<ClinicInfo | null> {
  try {
    const { data, error } = await supabase.rpc('validate_clinic_code', {
      p_clinic_code: code.toUpperCase().trim(),
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    return {
      id: data[0].clinic_id,
      code: code.toUpperCase().trim(),
      name: data[0].clinic_name,
      isDemo: data[0].is_demo,
      isActive: data[0].is_active,
    };
  } catch (err) {
    console.error('Erreur validation code clinique:', err);
    return null;
  }
}

/**
 * Réinitialise le cache (à appeler lors de la déconnexion)
 */
export function clearClinicCache(): void {
  cachedClinicId = null;
  cachedUserInfo = null;
  cacheTimestamp = 0;
}

/**
 * Wrapper pour les requêtes avec filtrage automatique par clinic_id
 */
export async function queryWithClinicFilter<T>(
  tableName: string,
  selectColumns: string = '*',
  additionalFilters?: (query: any) => any
): Promise<{ data: T[] | null; error: any }> {
  const clinicId = await getMyClinicId();
  const superAdmin = await isSuperAdmin();

  let query = supabase.from(tableName).select(selectColumns);

  // Si pas super admin, filtrer par clinic_id
  if (!superAdmin && clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  // Appliquer les filtres additionnels si fournis
  if (additionalFilters) {
    query = additionalFilters(query);
  }

  const result = await query;
  return { data: result.data as T[] | null, error: result.error };
}

/**
 * Wrapper pour les insertions avec ajout automatique du clinic_id
 */
export async function insertWithClinicId<T>(
  tableName: string,
  data: Omit<T, 'clinic_id'>
): Promise<{ data: T | null; error: any }> {
  const clinicId = await getMyClinicId();

  if (!clinicId) {
    return {
      data: null,
      error: { message: 'Impossible de déterminer la clinique de l\'utilisateur' },
    };
  }

  const dataWithClinic = {
    ...data,
    clinic_id: clinicId,
  };

  return await supabase.from(tableName).insert(dataWithClinic).select().single();
}

/**
 * Récupère les statistiques de la clinique de l'utilisateur
 */
export async function getClinicStats(): Promise<{
  patientsCount: number;
  staffCount: number;
  consultationsToday: number;
  pendingRequests: number;
} | null> {
  const clinicId = await getMyClinicId();

  if (!clinicId) return null;

  try {
    // Compter les patients
    const { count: patientsCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);

    // Compter le staff
    const { count: staffCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('actif', true);

    // Consultations du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: consultationsToday } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('created_at', today.toISOString());

    // Demandes en attente
    const { count: pendingRequests } = await supabase
      .from('registration_requests')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('statut', 'pending');

    return {
      patientsCount: patientsCount || 0,
      staffCount: staffCount || 0,
      consultationsToday: consultationsToday || 0,
      pendingRequests: pendingRequests || 0,
    };
  } catch (err) {
    console.error('Erreur stats clinique:', err);
    return null;
  }
}

/**
 * Récupère la liste des utilisateurs de la clinique (pour admin)
 */
export async function getClinicUsers(): Promise<any[]> {
  const clinicId = await getMyClinicId();
  const superAdmin = await isSuperAdmin();

  let query = supabase
    .from('users')
    .select('id, nom, prenom, email, role, status, actif, specialite, created_at, last_login')
    .order('created_at', { ascending: false });

  if (!superAdmin && clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erreur récupération utilisateurs:', error);
    return [];
  }

  return data || [];
}

/**
 * Met à jour le statut d'un utilisateur
 */
export async function updateUserStatus(
  userId: string,
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'REJECTED'
): Promise<boolean> {
  const isAdmin = await isClinicAdmin();
  
  if (!isAdmin) {
    console.error('Permission refusée: seul un admin peut modifier le statut');
    return false;
  }

  try {
    // Utiliser la fonction SQL pour validation sécurisée
    const { data, error } = await supabase.rpc('admin_validate_user', {
      p_user_id: userId,
      p_new_status: status,
    });

    if (error) {
      console.error('Erreur mise à jour statut:', error);
      return false;
    }

    return data?.success || false;
  } catch (err) {
    console.error('Erreur mise à jour statut utilisateur:', err);
    return false;
  }
}

export default {
  getMyClinicId,
  getCurrentUserInfo,
  isClinicAdmin,
  isSuperAdmin,
  validateClinicCode,
  clearClinicCache,
  queryWithClinicFilter,
  insertWithClinicId,
  getClinicStats,
  getClinicUsers,
  updateUserStatus,
};

