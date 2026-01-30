import { useState, useEffect } from 'react';
import { User } from '../types/auth';
import { PatientService } from '../services/patientService';
import { supabase } from '../services/supabase';
import { apiGet } from '../services/apiClient';
import { getMyClinicId } from '../services/clinicService';

interface DashboardStats {
  patients?: {
    total: number;
    today: number;
    new: number;
  };
  consultations?: {
    today: number;
    pending: number;
    completed: number;
  };
  rendezVous?: {
    today: number;
    upcoming: number;
    pending: number;
  };
  stock?: {
    total: number;
    alerts: number;
    expired: number;
  };
  finances?: {
    today: number;
    month: number;
    pending: number;
  };
  prescriptions?: {
    pending: number;
    today: number;
  };
  lab?: {
    pending: number;
    today: number;
    toValidate: number;
  };
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface Activity {
  id: string;
  type: string;
  action: string;
  user?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const useDashboardData = (user: User | null, timeRange: 'day' | 'week' | 'month' = 'month') => {
  const [stats, setStats] = useState<DashboardStats>({});
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // IMPORTANT: Tous les utilisateurs (y compris Super Admin) voient uniquement les données de leur clinique
        const clinicId = await getMyClinicId();
        if (!clinicId) {
          setError('Contexte de clinique manquant. Veuillez vous reconnecter.');
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const newStats: DashboardStats = {};

        // Données communes pour tous les rôles
        if (user.role === 'admin' || user.role === 'medecin' || user.role === 'infirmier' || user.role === 'secretaire') {
          try {
            const patients = await PatientService.getAllPatients();
            const patientsToday = patients.filter(p => {
              const created = new Date(p.created_at);
              return created >= today && created <= todayEnd;
            });

            newStats.patients = {
              total: patients.length,
              today: patientsToday.length,
              new: patients.filter(p => p.statut === 'Nouveau').length,
            };
          } catch (err) {
            console.error('Erreur chargement patients:', err);
          }
        }

        // Données pour consultations - Module supprimé
        // Les statistiques de consultation ne sont plus disponibles

        // Données pour rendez-vous
        if (user.role === 'admin' || user.role === 'medecin' || user.role === 'secretaire') {
          try {
            let rvTodayQuery = supabase
              .from('rendez_vous')
              .select('*')
              .gte('date_debut', today.toISOString())
              .lte('date_debut', todayEnd.toISOString())
              .eq('clinic_id', clinicId); // Toujours filtrer par clinic_id
            const { data: rendezVousToday } = await rvTodayQuery;

            let rvUpcomingQuery = supabase
              .from('rendez_vous')
              .select('*')
              .gte('date_debut', todayEnd.toISOString())
              .eq('statut', 'programmé')
              .eq('clinic_id', clinicId) // Toujours filtrer par clinic_id
              .limit(10);
            const { data: rendezVousUpcoming } = await rvUpcomingQuery;

            newStats.rendezVous = {
              today: rendezVousToday?.length || 0,
              upcoming: rendezVousUpcoming?.length || 0,
              pending: rendezVousToday?.filter(rv => rv.statut === 'programmé').length || 0,
            };
          } catch (err) {
            console.error('Erreur chargement rendez-vous:', err);
          }
        }

        // Données pour stock/pharmacie
        if (user.role === 'admin' || user.role === 'pharmacien') {
          try {
            let medicamentsQuery = supabase
              .from('medicaments')
              .select('id')
              .eq('clinic_id', clinicId); // Toujours filtrer par clinic_id
            const { data: medicaments, error: errMed } = await medicamentsQuery;
            if (errMed && errMed.code !== 'PGRST116') throw errMed;

            let alertesQuery = supabase
              .from('alertes_stock')
              .select('id')
              .eq('statut', 'active')
              .eq('clinic_id', clinicId); // Toujours filtrer par clinic_id
            const { data: alertes, error: errAlertes } = await alertesQuery;
            if (errAlertes && errAlertes.code !== 'PGRST116') throw errAlertes;

            let lotsQuery = supabase
              .from('lots')
              .select('date_expiration')
              .lt('date_expiration', new Date().toISOString())
              .eq('clinic_id', clinicId); // Toujours filtrer par clinic_id
            const { data: lots, error: errLots } = await lotsQuery;
            if (errLots && errLots.code !== 'PGRST116') throw errLots;

            newStats.stock = {
              total: medicaments?.length || 0,
              alerts: alertes?.length || 0,
              expired: lots?.length || 0,
            };
          } catch (err: any) {
            if (err?.code === 'PGRST116') {
              // Table n'existe pas encore
              newStats.stock = { total: 0, alerts: 0, expired: 0 };
            } else {
              console.error('Erreur chargement stock:', err);
            }
          }
        }

        // Données pour finances/caisse
        if (user.role === 'admin' || user.role === 'caissier' || user.role === 'comptable') {
          try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || '';
            if (!API_BASE_URL) {
              console.warn('VITE_API_URL n\'est pas configuré, impossible de charger les données financières');
            } else {
              const token = localStorage.getItem('token');
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (token) headers.Authorization = `Bearer ${token}`;
              if (clinicId) headers['x-clinic-id'] = clinicId;

              const response = await fetch(`${API_BASE_URL}/statistics/dashboard`, { headers });
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                  newStats.finances = {
                    today: data.data.todayRevenue || 0,
                    month: data.data.monthRevenue || 0,
                    pending: data.data.pendingInvoices || 0,
                  };
                }
              }
            }
          } catch (err) {
            console.error('Erreur chargement finances:', err);
          }
        }

        // Données pour prescriptions
        if (user.role === 'admin' || user.role === 'medecin' || user.role === 'pharmacien') {
          try {
            let prescriptionsTodayQuery = supabase
              .from('prescriptions')
              .select('id')
              .gte('date_prescription', today.toISOString())
              .lte('date_prescription', todayEnd.toISOString())
              .eq('clinic_id', clinicId); // Toujours filtrer par clinic_id
            const { data: prescriptionsToday, error: errToday } = await prescriptionsTodayQuery;
            if (errToday && errToday.code !== 'PGRST116') throw errToday;

            let prescriptionsPendingQuery = supabase
              .from('prescriptions')
              .select('id')
              .eq('statut', 'PRESCRIT')
              .eq('clinic_id', clinicId); // Toujours filtrer par clinic_id
            const { data: prescriptionsPending, error: errPending } = await prescriptionsPendingQuery;
            if (errPending && errPending.code !== 'PGRST116') throw errPending;

            newStats.prescriptions = {
              today: prescriptionsToday?.length || 0,
              pending: prescriptionsPending?.length || 0,
            };
          } catch (err: any) {
            if (err?.code === 'PGRST116') {
              // Table n'existe pas encore
              newStats.prescriptions = { today: 0, pending: 0 };
            } else {
              console.error('Erreur chargement prescriptions:', err);
            }
          }
        }

        // Données pour laboratoire
        if (user.role === 'admin' || user.role === 'laborantin') {
          try {
            let labPendingQuery = supabase
              .from('lab_requests')
              .select('id')
              .eq('status', 'EN_ATTENTE')
              .eq('clinic_id', clinicId); // Toujours filtrer par clinic_id
            const { data: labRequestsPending, error: errPending } = await labPendingQuery;
            if (errPending && errPending.code !== 'PGRST116') throw errPending;

            let labTodayQuery = supabase
              .from('lab_requests')
              .select('id')
              .gte('created_at', today.toISOString())
              .lte('created_at', todayEnd.toISOString())
              .eq('clinic_id', clinicId); // Toujours filtrer par clinic_id
            const { data: labRequestsToday, error: errToday } = await labTodayQuery;
            if (errToday && errToday.code !== 'PGRST116') throw errToday;

            newStats.lab = {
              pending: labRequestsPending?.length || 0,
              today: labRequestsToday?.length || 0,
              toValidate: 0, // À implémenter selon votre logique
            };
          } catch (err: any) {
            if (err?.code === 'PGRST116') {
              // Table n'existe pas encore
              newStats.lab = { pending: 0, today: 0, toValidate: 0 };
            } else {
              console.error('Erreur chargement lab:', err);
            }
          }
        }

        // Générer les données de tendances
        const daysToShow = timeRange === 'day' ? 7 : timeRange === 'week' ? 30 : 90;
        const trendDataArray: TrendData[] = [];
        const now = new Date();
        
        for (let i = daysToShow - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          // Simuler des données de tendances (à remplacer par de vraies données)
          let value = 0;
          if (user.role === 'admin' || user.role === 'caissier' || user.role === 'comptable') {
            value = Math.floor(Math.random() * 100000) + 50000; // Revenus simulés
          } else if (user.role === 'medecin' || user.role === 'infirmier' || user.role === 'secretaire') {
            value = Math.floor(Math.random() * 20) + 5; // Consultations simulées
          } else if (user.role === 'pharmacien') {
            value = Math.floor(Math.random() * 15) + 3; // Dispensations simulées
          } else if (user.role === 'laborantin') {
            value = Math.floor(Math.random() * 10) + 2; // Analyses simulées
          }
          
          trendDataArray.push({
            date: date.toISOString(),
            value,
          });
        }
        setTrendData(trendDataArray);

        // Générer les activités récentes
        const activitiesArray: Activity[] = [];
        
        // Récupérer les activités récentes depuis Supabase
        try {
          let recentPatientsQuery = supabase
            .from('patients')
            .select('id, nom, prenom, created_at')
            .eq('clinic_id', clinicId) // Toujours filtrer par clinic_id
            .order('created_at', { ascending: false })
            .limit(5);
          const { data: recentPatients } = await recentPatientsQuery;
          
          if (recentPatients) {
            recentPatients.forEach((p: any) => {
              activitiesArray.push({
                id: `patient-${p.id}`,
                type: 'patient',
                action: `Nouveau patient enregistré: ${p.prenom} ${p.nom}`,
                timestamp: p.created_at,
              });
            });
          }

          let recentConsultationsQuery = supabase
            .from('consultations')
            .select('id, started_at, created_by')
            .eq('clinic_id', clinicId) // Toujours filtrer par clinic_id
            .order('started_at', { ascending: false })
            .limit(5);
          const { data: recentConsultations } = await recentConsultationsQuery;
          
          if (recentConsultations) {
            recentConsultations.forEach((c: any) => {
              activitiesArray.push({
                id: `consultation-${c.id}`,
                type: 'consultation',
                action: 'Consultation créée',
                timestamp: c.started_at,
              });
            });
          }
        } catch (err) {
          console.error('Erreur chargement activités:', err);
        }

        // Trier par timestamp et limiter
        activitiesArray.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setActivities(activitiesArray.slice(0, 10));

        setStats(newStats);
      } catch (err: any) {
        console.error('Erreur chargement dashboard:', err);
        setError(err.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, timeRange]);

  return { stats, trendData, activities, loading, error };
};

