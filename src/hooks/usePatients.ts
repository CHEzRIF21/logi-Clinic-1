import { useState, useEffect, useCallback } from 'react';
import { Patient, PatientFormData } from '../services/supabase';
import { PatientService } from '../services/patientService';

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Charger tous les patients
  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PatientService.getAllPatients();
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    try {
      const data = await PatientService.getPatientStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  }, []);

  // Créer un patient
  const createPatient = useCallback(async (patientData: PatientFormData) => {
    try {
      setError(null);
      const newPatient = await PatientService.createPatient(patientData);
      setPatients(prev => [...prev, newPatient]);
      await loadStats(); // Recharger les stats
      return newPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadStats]);

  // Mettre à jour un patient
  const updatePatient = useCallback(async (id: string, patientData: Partial<PatientFormData>) => {
    try {
      setError(null);
      const updatedPatient = await PatientService.updatePatient(id, patientData);
      setPatients(prev => prev.map(p => p.id === id ? updatedPatient : p));
      await loadStats(); // Recharger les stats
      return updatedPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadStats]);

  // Supprimer un patient
  const deletePatient = useCallback(async (id: string) => {
    try {
      setError(null);
      await PatientService.deletePatient(id);
      setPatients(prev => prev.filter(p => p.id !== id));
      await loadStats(); // Recharger les stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadStats]);

  // Rechercher des patients
  const searchPatients = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      if (!query.trim()) {
        await loadPatients();
        return;
      }
      const results = await PatientService.searchPatients(query);
      setPatients(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  }, [loadPatients]);

  // Filtrer par service
  const filterByService = useCallback(async (service: string) => {
    try {
      setLoading(true);
      setError(null);
      if (service === 'Tous') {
        await loadPatients();
        return;
      }
      const results = await PatientService.getPatientsByService(service);
      setPatients(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du filtrage par service');
    } finally {
      setLoading(false);
    }
  }, [loadPatients]);

  // Filtrer par statut
  const filterByStatus = useCallback(async (status: string) => {
    try {
      setLoading(true);
      setError(null);
      if (status === 'Tous') {
        await loadPatients();
        return;
      }
      const results = await PatientService.getPatientsByStatus(status);
      setPatients(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du filtrage par statut');
    } finally {
      setLoading(false);
    }
  }, [loadPatients]);

  // Charger les données au montage du composant
  useEffect(() => {
    loadPatients();
    loadStats();
  }, [loadPatients, loadStats]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    patients,
    loading,
    error,
    stats,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    filterByService,
    filterByStatus,
    loadPatients,
    clearError,
  };
};
