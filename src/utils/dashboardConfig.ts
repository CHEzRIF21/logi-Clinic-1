import React from 'react';
import { User } from '../types/auth';
import {
  People,
  Event,
  LocalPharmacy,
  Payment,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Assignment,
  Science,
  Inventory,
  Receipt,
  Schedule,
  MedicalServices,
  Vaccines,
} from '@mui/icons-material';
import { formatCurrency } from './currency';

export interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
}

export interface Alert {
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  icon: React.ReactNode;
}

export interface Activity {
  action: string;
  time: string;
  type: string;
  icon: React.ReactNode;
}

export interface DashboardConfig {
  title: string;
  subtitle: string;
  stats: StatCard[];
  alerts: Alert[];
  activities: Activity[];
  widgets?: React.ReactNode[];
}

export function getDashboardConfig(user: User | null, stats: any): DashboardConfig {
  if (!user) {
    return getDefaultConfig(stats);
  }

  switch (user.role) {
    case 'admin':
      return getAdminDashboard(stats);
    case 'medecin':
      return getMedecinDashboard(stats);
    case 'pharmacien':
      return getPharmacienDashboard(stats);
    case 'caissier':
      return getCaissierDashboard(stats);
    case 'infirmier':
      return getInfirmierDashboard(stats);
    case 'laborantin':
      return getLaborantinDashboard(stats);
    case 'secretaire':
      return getSecretaireDashboard(stats);
    case 'comptable':
      return getComptableDashboard(stats);
    default:
      return getDefaultConfig(stats);
  }
}

function getAdminDashboard(stats: any): DashboardConfig {
  return {
    title: 'Tableau de bord Administrateur',
    subtitle: 'Vue d\'ensemble complète de votre centre de santé',
    stats: [
      {
        title: 'Patients',
        value: stats.patients?.total?.toLocaleString() || '0',
        icon: <People />,
        color: 'primary',
        trend: { value: 12, isPositive: true },
        subtitle: 'Total enregistrés',
      },
      {
        title: 'Revenus',
        value: formatCurrency(stats.finances?.month || 0),
        icon: <Payment />,
        color: 'success',
        trend: { value: 15, isPositive: true },
        subtitle: 'Ce mois',
      },
      {
        title: 'Consultations',
        value: stats.consultations?.today || 0,
        icon: <MedicalServices />,
        color: 'info',
        trend: { value: 8, isPositive: true },
        subtitle: 'Aujourd\'hui',
      },
      {
        title: 'Médicaments',
        value: stats.stock?.total || 0,
        icon: <LocalPharmacy />,
        color: 'warning',
        trend: { value: stats.stock?.alerts || 0, isPositive: false },
        subtitle: 'En stock',
      },
    ],
    alerts: [
      { type: 'warning', message: `Stock faible: ${stats.stock?.alerts || 0} alertes`, icon: <Warning /> },
      { type: 'info', message: `${stats.consultations?.pending || 0} consultations en attente`, icon: <Event /> },
      { type: 'error', message: `${stats.stock?.expired || 0} médicament(s) expiré(s)`, icon: <LocalPharmacy /> },
    ],
    activities: [
      { action: 'Nouveau patient enregistré', time: 'Il y a 5 min', type: 'patient', icon: <People /> },
      { action: 'Rendez-vous confirmé', time: 'Il y a 15 min', type: 'rdv', icon: <Event /> },
      { action: 'Ordonnance délivrée', time: 'Il y a 30 min', type: 'pharmacie', icon: <LocalPharmacy /> },
      { action: 'Paiement reçu', time: 'Il y a 1h', type: 'caisse', icon: <Payment /> },
    ],
  };
}

function getMedecinDashboard(stats: any): DashboardConfig {
  return {
    title: 'Tableau de bord Médecin',
    subtitle: 'Vos consultations et activités cliniques',
    stats: [
      {
        title: 'Consultations du jour',
        value: stats.consultations?.today || 0,
        icon: <MedicalServices />,
        color: 'primary',
        subtitle: 'Aujourd\'hui',
      },
      {
        title: 'Patients en attente',
        value: stats.consultations?.pending || 0,
        icon: <People />,
        color: 'warning',
        subtitle: 'Consultations en cours',
      },
      {
        title: 'Prescriptions',
        value: stats.prescriptions?.today || 0,
        icon: <Assignment />,
        color: 'info',
        subtitle: 'Aujourd\'hui',
      },
      {
        title: 'Rendez-vous',
        value: stats.rendezVous?.today || 0,
        icon: <Schedule />,
        color: 'success',
        subtitle: 'Aujourd\'hui',
      },
    ],
    alerts: [
      { type: 'info', message: `${stats.consultations?.pending || 0} consultation(s) nécessitant votre attention`, icon: <Event /> },
      { type: 'warning', message: `${stats.prescriptions?.pending || 0} prescription(s) en attente de dispensation`, icon: <Assignment /> },
    ],
    activities: [
      { action: 'Consultation terminée', time: 'Il y a 10 min', type: 'consultation', icon: <MedicalServices /> },
      { action: 'Prescription créée', time: 'Il y a 20 min', type: 'prescription', icon: <Assignment /> },
      { action: 'Patient en attente', time: 'Il y a 30 min', type: 'patient', icon: <People /> },
    ],
  };
}

function getPharmacienDashboard(stats: any): DashboardConfig {
  return {
    title: 'Tableau de bord Pharmacien',
    subtitle: 'Gestion du stock et des dispensations',
    stats: [
      {
        title: 'Médicaments',
        value: stats.stock?.total || 0,
        icon: <LocalPharmacy />,
        color: 'primary',
        subtitle: 'En stock',
      },
      {
        title: 'Alertes',
        value: stats.stock?.alerts || 0,
        icon: <Warning />,
        color: 'warning',
        subtitle: 'Ruptures et péremptions',
      },
      {
        title: 'Expirés',
        value: stats.stock?.expired || 0,
        icon: <TrendingDown />,
        color: 'error',
        subtitle: 'Médicaments expirés',
      },
      {
        title: 'Prescriptions',
        value: stats.prescriptions?.pending || 0,
        icon: <Assignment />,
        color: 'info',
        subtitle: 'En attente',
      },
    ],
    alerts: [
      { type: 'error', message: `${stats.stock?.expired || 0} médicament(s) expiré(s)`, icon: <Warning /> },
      { type: 'warning', message: `${stats.stock?.alerts || 0} alerte(s) de stock`, icon: <Inventory /> },
      { type: 'info', message: `${stats.prescriptions?.pending || 0} prescription(s) à dispenser`, icon: <Assignment /> },
    ],
    activities: [
      { action: 'Dispensation effectuée', time: 'Il y a 5 min', type: 'dispensation', icon: <LocalPharmacy /> },
      { action: 'Alerte de stock créée', time: 'Il y a 15 min', type: 'stock', icon: <Warning /> },
      { action: 'Réception de médicaments', time: 'Il y a 1h', type: 'reception', icon: <Inventory /> },
    ],
  };
}

function getCaissierDashboard(stats: any): DashboardConfig {
  return {
    title: 'Tableau de bord Caissier',
    subtitle: 'Gestion financière et encaissements',
    stats: [
      {
        title: 'Recettes du jour',
        value: formatCurrency(stats.finances?.today || 0),
        icon: <Payment />,
        color: 'success',
        trend: { value: 10, isPositive: true },
        subtitle: 'Aujourd\'hui',
      },
      {
        title: 'Factures en attente',
        value: stats.finances?.pending || 0,
        icon: <Receipt />,
        color: 'warning',
        subtitle: 'À encaisser',
      },
      {
        title: 'Paiements reçus',
        value: stats.finances?.today || 0,
        icon: <CheckCircle />,
        color: 'info',
        subtitle: 'Aujourd\'hui',
      },
      {
        title: 'Reliquats',
        value: formatCurrency(0),
        icon: <TrendingUp />,
        color: 'primary',
        subtitle: 'En attente',
      },
    ],
    alerts: [
      { type: 'warning', message: `${stats.finances?.pending || 0} facture(s) en attente d'encaissement`, icon: <Receipt /> },
      { type: 'info', message: 'Journal de caisse à vérifier', icon: <Payment /> },
    ],
    activities: [
      { action: 'Paiement reçu', time: 'Il y a 5 min', type: 'paiement', icon: <Payment /> },
      { action: 'Facture créée', time: 'Il y a 15 min', type: 'facture', icon: <Receipt /> },
      { action: 'Encaissement effectué', time: 'Il y a 30 min', type: 'encaissement', icon: <CheckCircle /> },
    ],
  };
}

function getInfirmierDashboard(stats: any): DashboardConfig {
  return {
    title: 'Tableau de bord Infirmier',
    subtitle: 'Soins infirmiers et suivi des patients',
    stats: [
      {
        title: 'Consultations assignées',
        value: stats.consultations?.pending || 0,
        icon: <MedicalServices />,
        color: 'primary',
        subtitle: 'En attente',
      },
      {
        title: 'Soins à effectuer',
        value: stats.consultations?.today || 0,
        icon: <Assignment />,
        color: 'warning',
        subtitle: 'Aujourd\'hui',
      },
      {
        title: 'Patients en surveillance',
        value: stats.patients?.new || 0,
        icon: <People />,
        color: 'info',
        subtitle: 'Nouveaux patients',
      },
      {
        title: 'Vaccinations',
        value: 0,
        icon: <Vaccines />,
        color: 'success',
        subtitle: 'À faire',
      },
    ],
    alerts: [
      { type: 'info', message: `${stats.consultations?.pending || 0} consultation(s) nécessitant des soins`, icon: <MedicalServices /> },
      { type: 'warning', message: 'Patients nécessitant un suivi', icon: <People /> },
    ],
    activities: [
      { action: 'Soin effectué', time: 'Il y a 10 min', type: 'soin', icon: <MedicalServices /> },
      { action: 'Patient en surveillance', time: 'Il y a 20 min', type: 'patient', icon: <People /> },
      { action: 'Vaccination administrée', time: 'Il y a 1h', type: 'vaccination', icon: <Vaccines /> },
    ],
  };
}

function getLaborantinDashboard(stats: any): DashboardConfig {
  return {
    title: 'Tableau de bord Laborantin',
    subtitle: 'Analyses de laboratoire',
    stats: [
      {
        title: 'Demandes en attente',
        value: stats.lab?.pending || 0,
        icon: <Science />,
        color: 'warning',
        subtitle: 'À traiter',
      },
      {
        title: 'Prélèvements du jour',
        value: stats.lab?.today || 0,
        icon: <Assignment />,
        color: 'primary',
        subtitle: 'Aujourd\'hui',
      },
      {
        title: 'Résultats à valider',
        value: stats.lab?.toValidate || 0,
        icon: <CheckCircle />,
        color: 'info',
        subtitle: 'En attente',
      },
      {
        title: 'Analyses en cours',
        value: 0,
        icon: <TrendingUp />,
        color: 'success',
        subtitle: 'En traitement',
      },
    ],
    alerts: [
      { type: 'warning', message: `${stats.lab?.pending || 0} demande(s) d'analyse en attente`, icon: <Science /> },
      { type: 'info', message: `${stats.lab?.toValidate || 0} résultat(s) à valider`, icon: <CheckCircle /> },
    ],
    activities: [
      { action: 'Prélèvement effectué', time: 'Il y a 5 min', type: 'prelevement', icon: <Science /> },
      { action: 'Analyse terminée', time: 'Il y a 15 min', type: 'analyse', icon: <CheckCircle /> },
      { action: 'Résultat validé', time: 'Il y a 30 min', type: 'validation', icon: <Assignment /> },
    ],
  };
}

function getSecretaireDashboard(stats: any): DashboardConfig {
  return {
    title: 'Tableau de bord Secrétaire',
    subtitle: 'Gestion administrative et accueil',
    stats: [
      {
        title: 'Rendez-vous du jour',
        value: stats.rendezVous?.today || 0,
        icon: <Schedule />,
        color: 'primary',
        subtitle: 'Aujourd\'hui',
      },
      {
        title: 'Patients à enregistrer',
        value: stats.patients?.new || 0,
        icon: <People />,
        color: 'warning',
        subtitle: 'Nouveaux',
      },
      {
        title: 'Consultations programmées',
        value: stats.rendezVous?.upcoming || 0,
        icon: <Event />,
        color: 'info',
        subtitle: 'À venir',
      },
      {
        title: 'Appels en attente',
        value: 0,
        icon: <Warning />,
        color: 'error',
        subtitle: 'À traiter',
      },
    ],
    alerts: [
      { type: 'info', message: `${stats.rendezVous?.today || 0} rendez-vous prévu(s) aujourd'hui`, icon: <Schedule /> },
      { type: 'warning', message: `${stats.patients?.new || 0} nouveau(x) patient(s) à enregistrer`, icon: <People /> },
    ],
    activities: [
      { action: 'Rendez-vous créé', time: 'Il y a 5 min', type: 'rdv', icon: <Schedule /> },
      { action: 'Patient enregistré', time: 'Il y a 15 min', type: 'patient', icon: <People /> },
      { action: 'Consultation programmée', time: 'Il y a 30 min', type: 'consultation', icon: <Event /> },
    ],
  };
}

function getComptableDashboard(stats: any): DashboardConfig {
  return {
    title: 'Tableau de bord Comptable',
    subtitle: 'Comptabilité et finances',
    stats: [
      {
        title: 'Revenus mensuels',
        value: formatCurrency(stats.finances?.month || 0),
        icon: <TrendingUp />,
        color: 'success',
        trend: { value: 15, isPositive: true },
        subtitle: 'Ce mois',
      },
      {
        title: 'Factures impayées',
        value: stats.finances?.pending || 0,
        icon: <Receipt />,
        color: 'warning',
        subtitle: 'En attente',
      },
      {
        title: 'Créances',
        value: formatCurrency(0),
        icon: <Payment />,
        color: 'error',
        subtitle: 'Total',
      },
      {
        title: 'Dépenses',
        value: formatCurrency(0),
        icon: <TrendingDown />,
        color: 'info',
        subtitle: 'Ce mois',
      },
    ],
    alerts: [
      { type: 'warning', message: `${stats.finances?.pending || 0} facture(s) impayée(s)`, icon: <Receipt /> },
      { type: 'info', message: 'Rapports comptables à générer', icon: <Payment /> },
    ],
    activities: [
      { action: 'Rapport généré', time: 'Il y a 1h', type: 'rapport', icon: <Receipt /> },
      { action: 'Facture validée', time: 'Il y a 2h', type: 'facture', icon: <CheckCircle /> },
      { action: 'Écriture comptable créée', time: 'Il y a 3h', type: 'comptabilite', icon: <Payment /> },
    ],
  };
}

function getDefaultConfig(stats: any): DashboardConfig {
  return {
    title: 'Tableau de bord',
    subtitle: 'Vue d\'ensemble de votre centre de santé',
    stats: [
      {
        title: 'Patients',
        value: stats.patients?.total?.toLocaleString() || '0',
        icon: <People />,
        color: 'primary',
        subtitle: 'Total',
      },
      {
        title: 'Consultations',
        value: stats.consultations?.today || 0,
        icon: <Event />,
        color: 'info',
        subtitle: 'Aujourd\'hui',
      },
    ],
    alerts: [],
    activities: [],
  };
}


