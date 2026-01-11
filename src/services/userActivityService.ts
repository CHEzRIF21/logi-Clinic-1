import { supabase } from './supabase';

export interface LoginHistory {
  id: string;
  user_id: string;
  clinic_id: string;
  login_at: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: any;
  logout_at?: string;
  session_duration_minutes?: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  clinic_id: string;
  action: string;
  module?: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}

export interface ActivityStats {
  totalActions: number;
  actionsByDay: Array<{ date: string; count: number }>;
  actionsByModule: Record<string, number>;
  actionsByAction: Record<string, number>;
  lastActivity?: string;
  averageActionsPerDay: number;
}

export interface NotificationHistory {
  id: string;
  title: string;
  description: string;
  type: string;
  read: boolean;
  created_at: string;
}

/**
 * Service pour gérer les données d'activité utilisateur
 */
export class UserActivityService {
  /**
   * Récupère les statistiques d'activité d'un utilisateur
   */
  static async getUserActivityStats(
    userId: string,
    days: number = 30
  ): Promise<ActivityStats> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        throw error;
      }

      const logs = data || [];

      // Calculer les statistiques par jour
      const actionsByDayMap = new Map<string, number>();
      logs.forEach((log) => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        actionsByDayMap.set(date, (actionsByDayMap.get(date) || 0) + 1);
      });

      const actionsByDay = Array.from(actionsByDayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculer les statistiques par module
      const actionsByModule: Record<string, number> = {};
      logs.forEach((log) => {
        const module = log.module || 'Autre';
        actionsByModule[module] = (actionsByModule[module] || 0) + 1;
      });

      // Calculer les statistiques par action
      const actionsByAction: Record<string, number> = {};
      logs.forEach((log) => {
        const action = log.action || 'Autre';
        actionsByAction[action] = (actionsByAction[action] || 0) + 1;
      });

      const totalActions = logs.length;
      const averageActionsPerDay = days > 0 ? totalActions / days : 0;
      const lastActivity = logs.length > 0 ? logs[0].created_at : undefined;

      return {
        totalActions,
        actionsByDay,
        actionsByModule,
        actionsByAction,
        lastActivity,
        averageActionsPerDay: Math.round(averageActionsPerDay * 100) / 100,
      };
    } catch (error: any) {
      console.error('Erreur getUserActivityStats:', error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des connexions d'un utilisateur
   */
  static async getUserLoginHistory(
    userId: string,
    limit: number = 50
  ): Promise<LoginHistory[]> {
    try {
      const { data, error } = await supabase
        .from('user_login_history')
        .select('*')
        .eq('user_id', userId)
        .order('login_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        throw error;
      }

      return (data || []) as LoginHistory[];
    } catch (error: any) {
      console.error('Erreur getUserLoginHistory:', error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des notifications d'un utilisateur
   */
  static async getUserNotificationsHistory(
    userId: string,
    limit: number = 50
  ): Promise<NotificationHistory[]> {
    try {
      // Note: Cette fonction suppose qu'il existe une table notifications
      // Si elle n'existe pas, on peut utiliser une autre source ou retourner un tableau vide
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, description, type, read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Si la table n'existe pas, retourner un tableau vide plutôt que d'échouer
        if (error.code === '42P01') {
          console.warn('Table notifications n\'existe pas encore');
          return [];
        }
        console.error('Erreur lors de la récupération des notifications:', error);
        throw error;
      }

      return (data || []) as NotificationHistory[];
    } catch (error: any) {
      console.error('Erreur getUserNotificationsHistory:', error);
      // Retourner un tableau vide en cas d'erreur pour ne pas bloquer l'interface
      return [];
    }
  }

  /**
   * Log une activité utilisateur
   */
  static async logActivity(params: {
    userId: string;
    clinicId: string;
    action: string;
    module?: string;
    entityType?: string;
    entityId?: string;
    details?: any;
  }): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_user_activity', {
        p_user_id: params.userId,
        p_clinic_id: params.clinicId,
        p_action: params.action,
        p_module: params.module || null,
        p_entity_type: params.entityType || null,
        p_entity_id: params.entityId || null,
        p_details: params.details || null,
      });

      if (error) {
        console.error('Erreur lors du log d\'activité:', error);
        // Ne pas throw pour ne pas bloquer l'application si le log échoue
      }
    } catch (error) {
      console.error('Erreur logActivity:', error);
      // Ne pas throw pour ne pas bloquer l'application
    }
  }

  /**
   * Log une connexion utilisateur
   */
  static async logLogin(params: {
    userId: string;
    clinicId: string;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: any;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_user_login', {
        p_user_id: params.userId,
        p_clinic_id: params.clinicId,
        p_ip_address: params.ipAddress || null,
        p_user_agent: params.userAgent || null,
        p_device_info: params.deviceInfo || null,
      });

      if (error) {
        console.error('Erreur lors du log de connexion:', error);
        return null;
      }

      return data as string;
    } catch (error) {
      console.error('Erreur logLogin:', error);
      return null;
    }
  }
}
