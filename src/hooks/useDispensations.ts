import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';

interface UseDispensationsOptions {
  page?: number;
  pageSize?: number;
  autoRefresh?: boolean;
  debounceMs?: number;
}

interface DispensationItem {
  id: string;
  medicamentId: string;
  patientId?: string;
  patientNom?: string;
  serviceId?: string;
  serviceNom?: string;
  quantite: number;
  dateDispensation: Date;
  motif: string;
  prescripteur?: string;
  consultationId?: string;
  utilisateur: string;
  statut: 'dispensé' | 'annulé' | 'retourné';
}

interface DispensationsData {
  items: DispensationItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const useDispensations = (options: UseDispensationsOptions = {}) => {
  const {
    page: initialPage = 1,
    pageSize = 20,
    autoRefresh = false,
    debounceMs = 300
  } = options;

  const [data, setData] = useState<DispensationsData>({
    items: [],
    total: 0,
    page: initialPage,
    pageSize,
    hasMore: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce pour la recherche
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Fonction de chargement avec retry
  const loadDispensations = useCallback(async (
    pageNum: number,
    search: string = ''
  ): Promise<DispensationsData> => {
    try {
      let query = supabase
        .from('dispensations')
        .select(`
          id,
          date_dispensation,
          patient_id,
          patient_nom,
          service_id,
          service_nom,
          prescripteur,
          prescription_id,
          utilisateur_id,
          statut,
          observations,
          dispensations_lignes (
            id,
            medicament_id,
            quantite,
            medicaments (
              id,
              nom,
              code
            )
          )
        `, { count: 'exact' })
        .order('date_dispensation', { ascending: false });

      // Filtrage par recherche si nécessaire
      if (search.trim()) {
        query = query.or(`patient_nom.ilike.%${search}%,service_nom.ilike.%${search}%`);
      }

      // Pagination
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: dispensationsData, error: dispensationsError, count } = await query;

      if (dispensationsError) throw dispensationsError;

      // Convertir les données
      const items: DispensationItem[] = [];
      
      if (dispensationsData) {
        dispensationsData.forEach(disp => {
          const lignes = disp.dispensations_lignes || [];
          lignes.forEach((ligne: any) => {
            items.push({
              id: `${disp.id}-${ligne.id}`,
              medicamentId: ligne.medicament_id,
              patientId: disp.patient_id,
              patientNom: disp.patient_nom || undefined,
              serviceId: disp.service_id,
              serviceNom: disp.service_nom || undefined,
              quantite: ligne.quantite,
              dateDispensation: new Date(disp.date_dispensation),
              motif: disp.observations || 'Dispensation',
              prescripteur: disp.prescripteur || undefined,
              consultationId: disp.prescription_id,
              utilisateur: disp.utilisateur_id,
              statut: disp.statut === 'terminee' ? 'dispensé' : 
                      disp.statut === 'annulee' ? 'annulé' : 'retourné'
            });
          });
        });
      }

      return {
        items,
        total: count || 0,
        page: pageNum,
        pageSize,
        hasMore: (count || 0) > pageNum * pageSize
      };
    } catch (err: any) {
      console.error('Erreur lors du chargement des dispensations:', err);
      throw err;
    }
  }, [pageSize]);

  // Charger les données
  const fetchData = useCallback(async (pageNum: number = data.page, search: string = debouncedSearchTerm) => {
    try {
      setLoading(true);
      setError(null);
      const result = await loadDispensations(pageNum, search);
      setData(result);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des dispensations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadDispensations, data.page, debouncedSearchTerm]);

  // Chargement initial
  useEffect(() => {
    fetchData(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]); // Recharger quand la recherche change

  // Auto-refresh si activé
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData(data.page, debouncedSearchTerm);
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData, data.page, debouncedSearchTerm]);

  // Statistiques mémorisées
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayDispensations = data.items.filter(disp => {
      const dispDate = new Date(disp.dateDispensation);
      dispDate.setHours(0, 0, 0, 0);
      return dispDate.getTime() === today.getTime();
    });

    return {
      total: data.total,
      aujourdhui: todayDispensations.length,
      cetteSemaine: data.items.filter(disp => {
        const dispDate = new Date(disp.dateDispensation);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return dispDate >= weekAgo;
      }).length
    };
  }, [data]);

  // Navigation de pages
  const goToPage = useCallback((pageNum: number) => {
    if (pageNum >= 1 && pageNum <= Math.ceil(data.total / pageSize)) {
      fetchData(pageNum, debouncedSearchTerm);
    }
  }, [fetchData, data.total, pageSize, debouncedSearchTerm]);

  const nextPage = useCallback(() => {
    if (data.hasMore) {
      goToPage(data.page + 1);
    }
  }, [data.hasMore, data.page, goToPage]);

  const previousPage = useCallback(() => {
    if (data.page > 1) {
      goToPage(data.page - 1);
    }
  }, [data.page, goToPage]);

  return {
    dispensations: data.items,
    loading,
    error,
    stats,
    pagination: {
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      totalPages: Math.ceil(data.total / pageSize),
      hasMore: data.hasMore,
      hasPrevious: data.page > 1
    },
    searchTerm,
    setSearchTerm,
    refetch: () => fetchData(data.page, debouncedSearchTerm),
    goToPage,
    nextPage,
    previousPage
  };
};






