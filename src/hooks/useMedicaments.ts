import { useState, useEffect, useCallback } from 'react';
import { MedicamentService } from '../services/medicamentService';
import { MedicamentSupabase } from '../services/stockSupabase';

/**
 * Hook personnalisé pour gérer les médicaments de manière centralisée
 * Permet de rafraîchir automatiquement les listes dans tous les composants
 */
export const useMedicaments = (options?: {
  autoRefresh?: boolean;
  filterByStock?: 'gros' | 'detail' | 'all';
  includeEmptyStock?: boolean;
}) => {
  const [medicaments, setMedicaments] = useState<MedicamentSupabase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMedicaments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await MedicamentService.getAllMedicaments();
      setMedicaments(data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des médicaments');
      console.error('Erreur useMedicaments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadMedicaments();
  }, [loadMedicaments]);

  // Écouter les événements de rafraîchissement
  useEffect(() => {
    if (options?.autoRefresh !== false) {
      const handleRefresh = () => {
        loadMedicaments();
      };

      // Écouter l'événement personnalisé de rafraîchissement
      window.addEventListener('medicaments:refresh', handleRefresh);
      
      return () => {
        window.removeEventListener('medicaments:refresh', handleRefresh);
      };
    }
  }, [loadMedicaments, options?.autoRefresh]);

  // Fonction pour déclencher un rafraîchissement global
  const refresh = useCallback(() => {
    loadMedicaments();
    // Notifier tous les autres composants qui utilisent ce hook
    window.dispatchEvent(new CustomEvent('medicaments:refresh'));
  }, [loadMedicaments]);

  return {
    medicaments,
    loading,
    error,
    refresh,
    reload: loadMedicaments
  };
};

/**
 * Fonction utilitaire pour déclencher un rafraîchissement global des médicaments
 * À appeler après la création/modification d'un médicament
 */
export const refreshMedicamentsGlobal = () => {
  window.dispatchEvent(new CustomEvent('medicaments:refresh'));
};
