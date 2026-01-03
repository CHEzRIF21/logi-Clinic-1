/**
 * Service de cache pour les données fréquemment accédées
 * Améliore les performances en évitant les requêtes répétitives à la base de données
 */

import { supabase } from './supabase';
import { logger } from '../utils/logger';

/**
 * Interface pour une entrée de cache
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Gestionnaire de cache simple en mémoire
 */
class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes par défaut

  /**
   * Récupère une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Supprime les entrées correspondant à un pattern
   */
  deleteByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retourne les statistiques du cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Instance globale du cache
const cache = new MemoryCache();

/**
 * Service de cache pour les données métier
 */
export const CacheService = {
  /**
   * Cache pour le catalogue des analyses de laboratoire
   */
  async getCatalogueAnalyses(clinicId: string): Promise<any[]> {
    const cacheKey = `catalogue_analyses_${clinicId}`;
    
    // Vérifier le cache
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug('Cache hit: catalogue analyses', { clinicId });
      return cached;
    }

    // Récupérer depuis la base de données
    logger.debug('Cache miss: catalogue analyses', { clinicId });
    
    const { data, error } = await supabase
      .from('lab_catalogue_examens')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('actif', true)
      .order('categorie', { ascending: true })
      .order('nom', { ascending: true });

    if (error) {
      logger.error('Erreur récupération catalogue analyses', error);
      throw error;
    }

    // Stocker dans le cache (10 minutes pour le catalogue)
    cache.set(cacheKey, data || [], 10 * 60 * 1000);
    
    return data || [];
  },

  /**
   * Cache pour les services facturables
   */
  async getServicesFacturables(clinicId: string): Promise<any[]> {
    const cacheKey = `services_facturables_${clinicId}`;
    
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug('Cache hit: services facturables', { clinicId });
      return cached;
    }

    logger.debug('Cache miss: services facturables', { clinicId });

    const { data, error } = await supabase
      .from('services_facturables')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('actif', true)
      .order('type_service', { ascending: true })
      .order('libelle', { ascending: true });

    if (error) {
      logger.error('Erreur récupération services facturables', error);
      throw error;
    }

    // Stocker dans le cache (15 minutes pour les tarifs)
    cache.set(cacheKey, data || [], 15 * 60 * 1000);
    
    return data || [];
  },

  /**
   * Cache pour les médicaments
   */
  async getMedicaments(clinicId: string): Promise<any[]> {
    const cacheKey = `medicaments_${clinicId}`;
    
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug('Cache hit: medicaments', { clinicId });
      return cached;
    }

    logger.debug('Cache miss: medicaments', { clinicId });

    const { data, error } = await supabase
      .from('medicaments')
      .select('id, code, nom, forme, dosage, prix_unitaire, prix_unitaire_detail, categorie')
      .eq('clinic_id', clinicId)
      .eq('actif', true)
      .order('nom', { ascending: true });

    if (error) {
      logger.error('Erreur récupération medicaments', error);
      throw error;
    }

    // Stocker dans le cache (5 minutes pour les médicaments)
    cache.set(cacheKey, data || [], 5 * 60 * 1000);
    
    return data || [];
  },

  /**
   * Cache pour les motifs de consultation
   */
  async getMotifsConsultation(clinicId: string): Promise<any[]> {
    const cacheKey = `motifs_consultation_${clinicId}`;
    
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug('Cache hit: motifs consultation', { clinicId });
      return cached;
    }

    logger.debug('Cache miss: motifs consultation', { clinicId });

    const { data, error } = await supabase
      .from('motifs')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('actif', true)
      .order('libelle', { ascending: true });

    if (error) {
      logger.error('Erreur récupération motifs', error);
      throw error;
    }

    // Stocker dans le cache (30 minutes pour les motifs)
    cache.set(cacheKey, data || [], 30 * 60 * 1000);
    
    return data || [];
  },

  /**
   * Cache pour les diagnostics
   */
  async getDiagnostics(clinicId: string): Promise<any[]> {
    const cacheKey = `diagnostics_${clinicId}`;
    
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug('Cache hit: diagnostics', { clinicId });
      return cached;
    }

    logger.debug('Cache miss: diagnostics', { clinicId });

    const { data, error } = await supabase
      .from('diagnostics')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('actif', true)
      .order('code', { ascending: true });

    if (error) {
      logger.error('Erreur récupération diagnostics', error);
      throw error;
    }

    // Stocker dans le cache (30 minutes pour les diagnostics)
    cache.set(cacheKey, data || [], 30 * 60 * 1000);
    
    return data || [];
  },

  /**
   * Cache pour les utilisateurs de la clinique
   */
  async getClinicUsers(clinicId: string): Promise<any[]> {
    const cacheKey = `clinic_users_${clinicId}`;
    
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug('Cache hit: clinic users', { clinicId });
      return cached;
    }

    logger.debug('Cache miss: clinic users', { clinicId });

    const { data, error } = await supabase
      .from('users')
      .select('id, email, nom, prenom, role, actif')
      .eq('clinic_id', clinicId)
      .eq('actif', true)
      .order('nom', { ascending: true });

    if (error) {
      logger.error('Erreur récupération utilisateurs clinique', error);
      throw error;
    }

    // Stocker dans le cache (2 minutes pour les utilisateurs)
    cache.set(cacheKey, data || [], 2 * 60 * 1000);
    
    return data || [];
  },

  /**
   * Invalide le cache pour une clinique
   */
  invalidateClinicCache(clinicId: string): void {
    cache.deleteByPattern(`.*_${clinicId}$`);
    logger.info('Cache clinique invalidé', { clinicId });
  },

  /**
   * Invalide un type de cache spécifique
   */
  invalidateCache(type: string, clinicId?: string): void {
    if (clinicId) {
      cache.delete(`${type}_${clinicId}`);
    } else {
      cache.deleteByPattern(`^${type}_`);
    }
    logger.debug('Cache invalidé', { type, clinicId });
  },

  /**
   * Vide tout le cache
   */
  clearAll(): void {
    cache.clear();
    logger.info('Cache global vidé');
  },

  /**
   * Retourne les statistiques du cache
   */
  getStats(): { size: number; keys: string[] } {
    return cache.getStats();
  },

  /**
   * Wrapper générique pour mettre en cache n'importe quelle requête
   */
  async withCache<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = cache.get<T>(cacheKey);
    if (cached !== null) {
      logger.debug('Cache hit', { cacheKey });
      return cached;
    }

    logger.debug('Cache miss', { cacheKey });
    const data = await fetcher();
    cache.set(cacheKey, data, ttlMs);
    return data;
  },
};

export default CacheService;

