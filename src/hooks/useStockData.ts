import { useState, useEffect, useCallback, useMemo } from 'react';
import { StockService } from '../services/stockService';
import { MedicamentService } from '../services/medicamentService';
import { supabase } from '../services/supabase';

interface UseStockDataOptions {
  magasin: 'gros' | 'detail';
  autoRefresh?: boolean;
  cacheTimeout?: number; // en millisecondes
}

interface StockData {
  medicaments: any[];
  lots: any[];
  alertes: any[];
  stats: {
    totalMedicaments: number;
    totalStock: number;
    valeurStock: number;
    stockFaible: number;
    alertesActives: number;
  };
}

// Cache simple en mémoire
const cache = new Map<string, { data: StockData; timestamp: number }>();

export const useStockData = (options: UseStockDataOptions) => {
  const { magasin, autoRefresh = false, cacheTimeout = 5 * 60 * 1000 } = options;
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `stock-${magasin}`;

  // Fonction de chargement avec retry
  const loadDataWithRetry = useCallback(async (retries = 3): Promise<StockData> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Vérifier le cache d'abord
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cacheTimeout) {
          return cached.data;
        }

        // Chargement parallèle de toutes les données avec retry
        const loadWithRetry = async <T,>(fn: () => Promise<T>, retries = 3): Promise<T> => {
          for (let attempt = 0; attempt < retries; attempt++) {
            try {
              return await fn();
            } catch (err) {
              if (attempt === retries - 1) throw err;
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
          }
          throw new Error('Échec après plusieurs tentatives');
        };

        const [lotsData, alertesData] = await Promise.all([
          loadWithRetry(() => StockService.getLotsByMagasin(magasin)),
          loadWithRetry(() => StockService.getAlertesActives())
        ]);

        // Extraire les médicaments uniques depuis les lots
        const medicamentsMap = new Map<string, any>();
        
        if (lotsData && lotsData.length > 0) {
          lotsData.forEach((lot: any) => {
            const med = lot.medicaments;
            if (med && !medicamentsMap.has(lot.medicament_id)) {
              medicamentsMap.set(lot.medicament_id, {
                id: lot.medicament_id,
                code: med.code || `MED-${lot.medicament_id.substring(0, 6)}`,
                nom: med.nom || 'Inconnu',
                dci: med.dci || '',
                forme: med.forme || '',
                dosage: med.dosage || '',
                unite: med.unite || 'Unité',
                fournisseur: lot.fournisseur || '',
                quantiteStock: lot.quantite_disponible,
                seuilMinimum: med.seuil_alerte || 50,
                seuilMaximum: med.seuil_maximum || 500,
                prixUnitaire: med.prix_unitaire || 0,
                prixUnitaireEntree: med.prix_unitaire_entree || 0,
                prixUnitaireDetail: med.prix_unitaire_detail || med.prix_unitaire || 0,
                emplacement: med.emplacement || '',
                observations: med.observations || ''
              });
            }
          });
        }

        // Calculer les statistiques
        const medicaments = Array.from(medicamentsMap.values());
        const stats = {
          totalMedicaments: medicaments.length,
          totalStock: medicaments.reduce((sum, med) => sum + (med.quantiteStock || 0), 0),
          valeurStock: medicaments.reduce((sum, med) => sum + ((med.quantiteStock || 0) * (med.prixUnitaire || 0)), 0),
          stockFaible: medicaments.filter(med => (med.quantiteStock || 0) <= (med.seuilMinimum || 0)).length,
          alertesActives: alertesData?.length || 0
        };

        const result: StockData = {
          medicaments,
          lots: lotsData || [],
          alertes: alertesData || [],
          stats
        };

        // Mettre en cache
        cache.set(cacheKey, { data: result, timestamp: Date.now() });

        return result;
      } catch (err: any) {
        if (attempt === retries - 1) {
          throw err;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    throw new Error('Échec du chargement après plusieurs tentatives');
  }, [magasin, cacheKey, cacheTimeout]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loadDataWithRetry();
      setData(result);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      console.error('Erreur useStockData:', err);
    } finally {
      setLoading(false);
    }
  }, [loadDataWithRetry]);

  // Chargement initial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh si activé
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Invalider le cache et recharger
      cache.delete(cacheKey);
      loadData();
    }, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, [autoRefresh, loadData, cacheKey]);

  // Fonction pour invalider le cache
  const invalidateCache = useCallback(() => {
    cache.delete(cacheKey);
  }, [cacheKey]);

  // Fonction pour forcer le rechargement
  const refetch = useCallback(() => {
    invalidateCache();
    loadData();
  }, [invalidateCache, loadData]);

  // Statistiques mémorisées
  const stats = useMemo(() => data?.stats || {
    totalMedicaments: 0,
    totalStock: 0,
    valeurStock: 0,
    stockFaible: 0,
    alertesActives: 0
  }, [data]);

  return {
    data,
    loading,
    error,
    stats,
    refetch,
    invalidateCache
  };
};









