import { supabase } from './supabase';
import { getMyClinicId } from './clinicService';

export interface NotificationType {
  id: string;
  code: string;
  nom: string;
  description?: string;
  icon?: string;
  couleur?: string;
  actif: boolean;
}

export interface Notification {
  id: string;
  clinic_id: string;
  type_id?: string;
  type?: NotificationType;
  titre: string;
  message: string;
  lien?: string;
  priorite: 'low' | 'normal' | 'high' | 'urgent';
  lu: boolean;
  lu_le?: Date;
  expire_le?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationRecipient {
  id: string;
  notification_id: string;
  user_id?: string;
  role?: string;
  lu: boolean;
  lu_le?: Date;
}

export interface NotificationRule {
  id: string;
  clinic_id: string;
  type_id?: string;
  type?: NotificationType;
  nom: string;
  description?: string;
  conditions?: any;
  destinataires: {
    roles?: string[];
    user_ids?: string[];
    all_users?: boolean;
  };
  actif: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Service pour gérer les notifications
 */
export class NotificationService {
  // Indicateur global pour savoir si le système de notifications SQL est disponible.
  // S'il manque la table notification_recipients (cas de ton projet actuel),
  // on désactive proprement tous les appels REST associés pour éviter les 404 en boucle.
  private static notificationsSqlAvailable = true;
  /**
   * Récupère tous les types de notifications
   */
  static async getNotificationTypes(): Promise<NotificationType[]> {
    const { data, error } = await supabase
      .from('notification_types')
      .select('*')
      .eq('actif', true)
      .order('nom');

    if (error) {
      console.error('Erreur lors de la récupération des types:', error);
      throw error;
    }

    return (data || []).map(t => ({
      id: t.id,
      code: t.code,
      nom: t.nom,
      description: t.description,
      icon: t.icon,
      couleur: t.couleur,
      actif: t.actif,
    }));
  }

  /**
   * Récupère les notifications pour l'utilisateur actuel
   */
  static async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notification_recipients')
        .select(`
          *,
          notification:notifications(
            *,
            type:notification_types(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('notification_recipients non disponible:', error.message);
        return [];
      }

      return (data || []).map((r: any) => ({
      id: r.notification.id,
      clinic_id: r.notification.clinic_id,
      type_id: r.notification.type_id,
      type: r.notification.type ? {
        id: r.notification.type.id,
        code: r.notification.type.code,
        nom: r.notification.type.nom,
        description: r.notification.type.description,
        icon: r.notification.type.icon,
        couleur: r.notification.type.couleur,
        actif: r.notification.type.actif,
      } : undefined,
      titre: r.notification.titre,
      message: r.notification.message,
      lien: r.notification.lien,
      priorite: r.notification.priorite,
      lu: r.lu,
      lu_le: r.lu_le ? new Date(r.lu_le) : undefined,
      expire_le: r.notification.expire_le ? new Date(r.notification.expire_le) : undefined,
      created_at: new Date(r.notification.created_at),
      updated_at: new Date(r.notification.updated_at),
    }));
    } catch (e) {
      console.warn('notification_recipients erreur:', e);
      return [];
    }
  }

  /**
   * Récupère toutes les notifications d'une clinique (admin)
   */
  static async getClinicNotifications(clinicId: string, limit: number = 100): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        type:notification_types(*)
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }

    return (data || []).map((n: any) => ({
      id: n.id,
      clinic_id: n.clinic_id,
      type_id: n.type_id,
      type: n.type ? {
        id: n.type.id,
        code: n.type.code,
        nom: n.type.nom,
        description: n.type.description,
        icon: n.type.icon,
        couleur: n.type.couleur,
        actif: n.type.actif,
      } : undefined,
      titre: n.titre,
      message: n.message,
      lien: n.lien,
      priorite: n.priorite,
      lu: n.lu,
      lu_le: n.lu_le ? new Date(n.lu_le) : undefined,
      expire_le: n.expire_le ? new Date(n.expire_le) : undefined,
      created_at: new Date(n.created_at),
      updated_at: new Date(n.updated_at),
    }));
  }

  /**
   * Crée une notification
   */
  static async createNotification(params: {
    typeCode: string;
    titre: string;
    message: string;
    lien?: string;
    priorite?: 'low' | 'normal' | 'high' | 'urgent';
    destinataires?: {
      roles?: string[];
      user_ids?: string[];
      all_users?: boolean;
    };
  }): Promise<string> {
    const clinicId = await getMyClinicId();
    if (!clinicId) {
      throw new Error('Clinic ID manquant');
    }

    const { data, error } = await supabase.rpc('create_notification', {
      p_clinic_id: clinicId,
      p_type_code: params.typeCode,
      p_titre: params.titre,
      p_message: params.message,
      p_lien: params.lien || null,
      p_priorite: params.priorite || 'normal',
      p_destinataires: params.destinataires ? JSON.stringify(params.destinataires) : null,
    });

    if (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }

    return data;
  }

  /**
   * Marque une notification comme lue
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  /**
   * Récupère les règles de notification d'une clinique
   */
  static async getNotificationRules(clinicId: string): Promise<NotificationRule[]> {
    const { data, error } = await supabase
      .from('notification_rules')
      .select(`
        *,
        type:notification_types(*)
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des règles:', error);
      throw error;
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      clinic_id: r.clinic_id,
      type_id: r.type_id,
      type: r.type ? {
        id: r.type.id,
        code: r.type.code,
        nom: r.type.nom,
        description: r.type.description,
        icon: r.type.icon,
        couleur: r.type.couleur,
        actif: r.type.actif,
      } : undefined,
      nom: r.nom,
      description: r.description,
      conditions: r.conditions,
      destinataires: typeof r.destinataires === 'string' 
        ? JSON.parse(r.destinataires) 
        : r.destinataires,
      actif: r.actif,
      created_by: r.created_by,
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at),
    }));
  }

  /**
   * Crée une règle de notification
   */
  static async createNotificationRule(rule: Omit<NotificationRule, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationRule> {
    const clinicId = await getMyClinicId();
    if (!clinicId) {
      throw new Error('Clinic ID manquant');
    }

    const { data, error } = await supabase
      .from('notification_rules')
      .insert({
        clinic_id: clinicId,
        type_id: rule.type_id || null,
        nom: rule.nom,
        description: rule.description || null,
        conditions: rule.conditions || null,
        destinataires: rule.destinataires,
        actif: rule.actif !== false,
        created_by: rule.created_by || null,
      })
      .select(`
        *,
        type:notification_types(*)
      `)
      .single();

    if (error) {
      console.error('Erreur lors de la création de la règle:', error);
      throw error;
    }

    return {
      id: data.id,
      clinic_id: data.clinic_id,
      type_id: data.type_id,
      type: data.type ? {
        id: data.type.id,
        code: data.type.code,
        nom: data.type.nom,
        description: data.type.description,
        icon: data.type.icon,
        couleur: data.type.couleur,
        actif: data.type.actif,
      } : undefined,
      nom: data.nom,
      description: data.description,
      conditions: data.conditions,
      destinataires: typeof data.destinataires === 'string' 
        ? JSON.parse(data.destinataires) 
        : data.destinataires,
      actif: data.actif,
      created_by: data.created_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  /**
   * Met à jour une règle de notification
   */
  static async updateNotificationRule(ruleId: string, updates: Partial<NotificationRule>): Promise<NotificationRule> {
    const updateData: any = {};
    
    if (updates.nom !== undefined) updateData.nom = updates.nom;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.type_id !== undefined) updateData.type_id = updates.type_id;
    if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
    if (updates.destinataires !== undefined) updateData.destinataires = updates.destinataires;
    if (updates.actif !== undefined) updateData.actif = updates.actif;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('notification_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select(`
        *,
        type:notification_types(*)
      `)
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de la règle:', error);
      throw error;
    }

    return {
      id: data.id,
      clinic_id: data.clinic_id,
      type_id: data.type_id,
      type: data.type ? {
        id: data.type.id,
        code: data.type.code,
        nom: data.type.nom,
        description: data.type.description,
        icon: data.type.icon,
        couleur: data.type.couleur,
        actif: data.type.actif,
      } : undefined,
      nom: data.nom,
      description: data.description,
      conditions: data.conditions,
      destinataires: typeof data.destinataires === 'string' 
        ? JSON.parse(data.destinataires) 
        : data.destinataires,
      actif: data.actif,
      created_by: data.created_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  /**
   * Supprime une règle de notification
   */
  static async deleteNotificationRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('notification_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('Erreur lors de la suppression de la règle:', error);
      throw error;
    }
  }

  /**
   * Récupère le nombre de notifications non lues pour un utilisateur
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notification_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('lu', false);

      if (error) {
        console.warn('notification_recipients non disponible:', error.message);
        return 0;
      }

      return count || 0;
    } catch (e) {
      console.warn('notification_recipients erreur:', e);
      return 0;
    }
  }

  /**
   * Récupère le nombre de notifications non lues par module/path pour un utilisateur
   */
  static async getUnreadCountByPath(userId: string, path: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notification_recipients')
        .select(`
          *,
          notification:notifications!inner(lien)
        `, { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('lu', false)
        .eq('notifications.lien', path);

      if (error) {
        // Si la jointure ne fonctionne pas, essayer une autre approche
        const { data: recipients, error: recipientsError } = await supabase
          .from('notification_recipients')
          .select('notification_id')
          .eq('user_id', userId)
          .eq('lu', false);

        if (recipientsError) {
          console.error('Erreur lors du comptage par path:', recipientsError);
          return 0;
        }

        if (!recipients || recipients.length === 0) return 0;

        const notificationIds = recipients.map(r => r.notification_id);
        const { count: countByPath, error: notifError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .in('id', notificationIds)
          .eq('lien', path);

        if (notifError) {
          console.error('Erreur lors du comptage par path (fallback):', notifError);
          return 0;
        }

        return countByPath || 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Erreur lors du comptage par path:', error);
      return 0;
    }
  }

  /**
   * Récupère les comptes de notifications non lues par module pour un utilisateur
   * Inclut les notifications système + alertes + transferts + rendez-vous
   */
  static async getUnreadCountsByModule(userId: string): Promise<Record<string, number>> {
    try {
      const counts: Record<string, number> = {};
      const clinicId = await getMyClinicId();

      // 1. Notifications système (via notification_recipients)
      // Dans certains environnements, le système SQL de notifications (notifications + notification_recipients)
      // n'est pas encore déployé. Dans ce cas, Supabase renvoie une 404 / erreur de schéma.
      // On détecte ce cas une fois puis on désactive ces appels pour le reste de la session.
      if (NotificationService.notificationsSqlAvailable) {
        const { data: recipients, error: recipientsError } = await supabase
          .from('notification_recipients')
          .select('notification_id')
          .eq('user_id', userId)
          .eq('lu', false);

        if (recipientsError) {
          const msg = recipientsError.message || '';
          console.warn('notification_recipients non disponible (table/RLS):', msg);

          // Cas typique : "Could not find the table 'public.notification_recipients' in the schema cache"
          if (msg.includes("Could not find the table 'public.notification_recipients' in the schema cache")) {
            NotificationService.notificationsSqlAvailable = false;
          }
        } else if (recipients && recipients.length > 0) {
          const notificationIds = recipients.map(r => r.notification_id);
          const { data: notifications } = await supabase
            .from('notifications')
            .select('id, lien')
            .in('id', notificationIds);

          if (notifications) {
            notifications.forEach(notif => {
              if (notif.lien) {
                const normalizedPath = notif.lien.split('?')[0].split('#')[0];
                counts[normalizedPath] = (counts[normalizedPath] || 0) + 1;
              }
            });
          }
        }
      }

      // 2. Transferts en attente et validés pour Pharmacie (/pharmacie)
      try {
        // Transferts en attente de validation
        const { count: transfertsEnAttente } = await supabase
          .from('transferts')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'en_attente')
          .eq('magasin_source', 'gros')
          .eq('magasin_destination', 'detail');

        // Transferts validés en attente de réception
        const { count: transfertsValides } = await supabase
          .from('transferts')
          .select('*', { count: 'exact', head: true })
          .in('statut', ['valide', 'partiel'])
          .eq('magasin_source', 'gros')
          .eq('magasin_destination', 'detail');

        const totalTransferts = (transfertsEnAttente || 0) + (transfertsValides || 0);
        if (totalTransferts > 0) {
          counts['/pharmacie'] = (counts['/pharmacie'] || 0) + totalTransferts;
        }
      } catch (e) {
        console.warn('Erreur comptage transferts pharmacie:', e);
      }

      // 3. Alertes actives pour Pharmacie et Stock
      try {
        // SÉCURITÉ: clinic_id est OBLIGATOIRE - ne jamais bypasser le filtre
        if (!clinicId) {
          console.warn('Contexte de clinique manquant pour compter les alertes');
        } else {
          const { count: alertesActives, error: alertesError } = await supabase
            .from('alertes_stock')
            .select('*', { count: 'exact', head: true })
            .eq('statut', 'active')
            .eq('clinic_id', clinicId); // TOUJOURS filtrer par clinic_id

          if (alertesError) {
            console.warn('Erreur comptage alertes:', alertesError);
          } else if (alertesActives && alertesActives > 0) {
            // Les alertes concernent à la fois pharmacie et stock
            counts['/pharmacie'] = (counts['/pharmacie'] || 0) + alertesActives;
            counts['/stock-medicaments'] = (counts['/stock-medicaments'] || 0) + alertesActives;
          }
        }
      } catch (e) {
        console.warn('Erreur comptage alertes:', e);
      }

      // 4. Rendez-vous en attente pour Rendez-vous (/rendez-vous)
      try {
        // SÉCURITÉ: clinic_id est OBLIGATOIRE - ne jamais bypasser le filtre
        if (!clinicId) {
          console.warn('Contexte de clinique manquant pour compter les rendez-vous');
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const { count: rendezVousAttente, error: rdvError } = await supabase
            .from('rendez_vous')
            .select('*', { count: 'exact', head: true })
            .eq('statut', 'programmé')
            .gte('date_debut', today.toISOString())
            .eq('clinic_id', clinicId); // TOUJOURS filtrer par clinic_id

          if (rdvError) {
            console.warn('Erreur comptage rendez-vous:', rdvError);
          } else if (rendezVousAttente && rendezVousAttente > 0) {
            counts['/rendez-vous'] = (counts['/rendez-vous'] || 0) + rendezVousAttente;
          }
        }
      } catch (e) {
        console.warn('Erreur comptage rendez-vous:', e);
      }


      return counts;
    } catch (error) {
      console.error('Erreur lors du comptage par module:', error);
      return {};
    }
  }
}
