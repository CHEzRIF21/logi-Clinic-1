import { supabase } from './supabase';

export interface AuditLogEntry {
  audit_id?: string;
  consult_id: string;
  actor_id: string;
  actor_name?: string;
  actor_role: string;
  action: string;
  details?: any;
  timestamp?: string;
  ip?: string;
  device?: string;
}

export interface AuditLogQuery {
  consult_id?: string;
  actor_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

/**
 * Service de traçabilité et audit
 * Enregistre toutes les actions importantes avec Qui/Quoi/Quand
 */
export class AuditService {
  /**
   * Enregistre une action dans le journal d'audit
   */
  static async logAction(entry: AuditLogEntry): Promise<AuditLogEntry> {
    try {
      // Récupérer les informations de l'utilisateur
      const userData = localStorage.getItem('user');
      let actorName = entry.actor_name;
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          actorName = actorName || `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email;
        } catch (e) {
          // Ignore
        }
      }

      // Récupérer l'IP et le device (si disponible)
      const ip = await this.getClientIP();
      const device = this.getDeviceInfo();

      const auditEntry = {
        consult_id: entry.consult_id,
        actor_id: entry.actor_id,
        actor_name: actorName,
        actor_role: entry.actor_role,
        action: entry.action,
        details: entry.details || {},
        ip: ip,
        device: device,
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('audit_log')
        .insert(auditEntry)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'enregistrement de l\'audit:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans AuditService.logAction:', error);
      // Ne pas bloquer l'application si l'audit échoue
      return entry;
    }
  }

  /**
   * Récupère le journal d'audit pour une consultation
   */
  static async getAuditLog(consultId: string): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('consult_id', consultId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération de l\'audit:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans AuditService.getAuditLog:', error);
      return [];
    }
  }

  /**
   * Recherche dans le journal d'audit avec filtres
   */
  static async searchAuditLog(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    try {
      let queryBuilder = supabase
        .from('audit_log')
        .select('*');

      if (query.consult_id) {
        queryBuilder = queryBuilder.eq('consult_id', query.consult_id);
      }

      if (query.actor_id) {
        queryBuilder = queryBuilder.eq('actor_id', query.actor_id);
      }

      if (query.action) {
        queryBuilder = queryBuilder.eq('action', query.action);
      }

      if (query.start_date) {
        queryBuilder = queryBuilder.gte('timestamp', query.start_date);
      }

      if (query.end_date) {
        queryBuilder = queryBuilder.lte('timestamp', query.end_date);
      }

      queryBuilder = queryBuilder.order('timestamp', { ascending: false });

      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Erreur lors de la recherche d\'audit:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans AuditService.searchAuditLog:', error);
      return [];
    }
  }

  /**
   * Récupère l'IP du client (approximation)
   */
  private static async getClientIP(): Promise<string | undefined> {
    try {
      // En production, cela devrait être récupéré depuis le backend
      // Pour l'instant, on retourne undefined
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Récupère les informations sur le device
   */
  private static getDeviceInfo(): string {
    try {
      if (typeof window === 'undefined') return 'server';
      
      const ua = navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
      const isTablet = /iPad|Tablet/.test(ua);
      
      let deviceType = 'desktop';
      if (isTablet) deviceType = 'tablet';
      else if (isMobile) deviceType = 'mobile';

      return `${deviceType} - ${ua.substring(0, 100)}`;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Crée un résumé d'audit pour une consultation
   */
  static async getAuditSummary(consultId: string): Promise<{
    total_actions: number;
    actors: { actor_id: string; actor_name: string; actor_role: string; action_count: number }[];
    actions_by_type: { action: string; count: number }[];
    first_action: string | null;
    last_action: string | null;
  }> {
    try {
      const logs = await this.getAuditLog(consultId);
      
      const actorsMap = new Map<string, { actor_name: string; actor_role: string; count: number }>();
      const actionsMap = new Map<string, number>();

      logs.forEach(log => {
        // Compter par acteur
        const actorKey = log.actor_id;
        if (!actorsMap.has(actorKey)) {
          actorsMap.set(actorKey, {
            actor_name: log.actor_name || 'Inconnu',
            actor_role: log.actor_role,
            count: 0,
          });
        }
        actorsMap.get(actorKey)!.count++;

        // Compter par type d'action
        const actionCount = actionsMap.get(log.action) || 0;
        actionsMap.set(log.action, actionCount + 1);
      });

      const actors = Array.from(actorsMap.entries()).map(([actor_id, data]) => ({
        actor_id,
        ...data,
        action_count: data.count,
      }));

      const actions_by_type = Array.from(actionsMap.entries()).map(([action, count]) => ({
        action,
        count,
      }));

      return {
        total_actions: logs.length,
        actors,
        actions_by_type,
        first_action: logs.length > 0 ? logs[logs.length - 1].timestamp || null : null,
        last_action: logs.length > 0 ? logs[0].timestamp || null : null,
      };
    } catch (error) {
      console.error('Erreur dans AuditService.getAuditSummary:', error);
      return {
        total_actions: 0,
        actors: [],
        actions_by_type: [],
        first_action: null,
        last_action: null,
      };
    }
  }
}

