import { useState, useEffect, useCallback } from 'react';
import { MedicamentSupabase, MedicamentFormData } from '../services/stockSupabase';
import { MedicamentService } from '../services/medicamentService';
import { LotService } from '../services/lotService';
import { MouvementService } from '../services/mouvementService';

export const useStock = () => {
  const [medicaments, setMedicaments] = useState<MedicamentSupabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Charger tous les médicaments
  const loadMedicaments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MedicamentService.getAllMedicaments();
      setMedicaments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des médicaments');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    try {
      const data = await MedicamentService.getMedicamentStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  }, []);

  // Créer un médicament
  const createMedicament = useCallback(async (medicamentData: MedicamentFormData) => {
    try {
      setError(null);
      const newMedicament = await MedicamentService.createMedicament(medicamentData);
      setMedicaments(prev => [...prev, newMedicament]);
      await loadStats(); // Recharger les stats
      return newMedicament;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du médicament';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadStats]);

  // Mettre à jour un médicament
  const updateMedicament = useCallback(async (id: string, medicamentData: Partial<MedicamentFormData>) => {
    try {
      setError(null);
      const updatedMedicament = await MedicamentService.updateMedicament(id, medicamentData);
      setMedicaments(prev => prev.map(m => m.id === id ? updatedMedicament : m));
      await loadStats(); // Recharger les stats
      return updatedMedicament;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du médicament';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadStats]);

  // Supprimer un médicament
  const deleteMedicament = useCallback(async (id: string) => {
    try {
      setError(null);
      await MedicamentService.deleteMedicament(id);
      setMedicaments(prev => prev.filter(m => m.id !== id));
      await loadStats(); // Recharger les stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du médicament';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadStats]);

  // Rechercher des médicaments
  const searchMedicaments = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      if (!query.trim()) {
        await loadMedicaments();
        return;
      }
      const results = await MedicamentService.searchMedicaments(query);
      setMedicaments(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  }, [loadMedicaments]);

  // Filtrer par catégorie
  const filterByCategorie = useCallback(async (categorie: string) => {
    try {
      setLoading(true);
      setError(null);
      if (categorie === 'Toutes') {
        await loadMedicaments();
        return;
      }
      const results = await MedicamentService.getMedicamentsByCategorie(categorie);
      setMedicaments(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du filtrage par catégorie');
    } finally {
      setLoading(false);
    }
  }, [loadMedicaments]);

  // Charger les données au montage du composant
  useEffect(() => {
    loadMedicaments();
    loadStats();
  }, [loadMedicaments, loadStats]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    medicaments,
    loading,
    error,
    stats,
    createMedicament,
    updateMedicament,
    deleteMedicament,
    searchMedicaments,
    filterByCategorie,
    loadMedicaments,
    clearError,
  };
};
