import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Card,
  CardContent,
  IconButton,
  Container,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Snackbar,
  Grid,
  Dialog,
  DialogContent,
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Dashboard,
  Assignment,
  LocalHospital,
  ChildCare,
  Notifications,
  Assessment,
  Schedule,
} from '@mui/icons-material';

// Import des composants du module Maternité
import MaterniteDashboard from '../components/maternite/MaterniteDashboard';
import SystemeAlertesMaternite from '../components/maternite/SystemeAlertesMaternite';
import DossierMaternite from '../components/maternite/DossierMaternite';
import PatientSelectionDialog from '../components/maternite/PatientSelectionDialog';
import TableauCPN from '../components/maternite/TableauCPN';
import GestionVaccination from '../components/maternite/GestionVaccination';
import GestionSoinsPromotionnels from '../components/maternite/GestionSoinsPromotionnels';
import FormulaireAccouchement from '../components/maternite/FormulaireAccouchement';
import FormulaireNouveauNe from '../components/maternite/FormulaireNouveauNe';
import FormulaireSurveillancePostPartum from '../components/maternite/FormulaireSurveillancePostPartum';
import { IntegrationService } from '../services/integrationService';
import { MaterniteService, DossierObstetrical, DossierObstetricalFormData } from '../services/materniteService';
import MaterniteApiService from '../services/materniteApiService';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { CPNService, VaccinationMaternelle, SoinsPromotionnels } from '../services/cpnService';
import { AccouchementService, Accouchement, NouveauNe } from '../services/accouchementService';
import { Patient } from '../services/supabase';

interface Patiente {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  dateDerniereRegles: string;
  dateAccouchementPrevu: string;
  statut: 'suivi' | 'accouchement' | 'post_partum';
  grossesse: number;
  notes: string;
  risque?: 'normal' | 'eleve' | 'critique';
  consultations?: any[];
  accouchements?: any[];
  cpnCompletes?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`maternite-tabpanel-${index}`}
      aria-labelledby={`maternite-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Maternite: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dossiers, setDossiers] = useState<DossierObstetrical[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // États pour les dialogs
  const [openPatientSelection, setOpenPatientSelection] = useState(false);
  const [openDossierDialog, setOpenDossierDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<DossierObstetrical | null>(null);
  const [dossierMode, setDossierMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // États pour les nouveaux modules
  const [openAccouchementDialog, setOpenAccouchementDialog] = useState(false);
  const [selectedAccouchement, setSelectedAccouchement] = useState<Accouchement | null>(null);
  const [openNouveauNeDialog, setOpenNouveauNeDialog] = useState(false);
  const [openPostPartumDialog, setOpenPostPartumDialog] = useState(false);

  // États pour les données réelles du dashboard
  const [patientes, setPatientes] = useState<Patiente[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [accouchements, setAccouchements] = useState<any[]>([]);
  const [alertes, setAlertes] = useState<any[]>([]);

  // Charger les dossiers et les données du dashboard
  useEffect(() => {
    // Délai pour s'assurer que Supabase est initialisé
    const timer = setTimeout(() => {
      loadDossiers();
      loadDashboardData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const loadDossiers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Tentative de chargement des dossiers...');
      
      // Test de connexion d'abord
      const { testSupabaseConnection } = await import('../services/supabase');
      const isConnected = await testSupabaseConnection();
      
      if (!isConnected) {
        throw new Error('Impossible de se connecter à Supabase. Vérifiez votre connexion Internet.');
      }
      
      const data = await MaterniteService.getAllDossiers();
      setDossiers(data);
      
      if (data.length === 0) {
        showSnackbar('Aucun dossier trouvé. Veuillez créer un nouveau dossier.', 'info');
      } else {
        console.log(`✅ ${data.length} dossier(s) chargé(s) avec succès`);
        showSnackbar(`${data.length} dossier(s) chargé(s) avec succès`, 'success');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des dossiers';
      console.error('❌ Erreur lors du chargement des dossiers:', err);
      
      // Message d'erreur plus détaillé
      let displayMessage = errorMessage;
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        displayMessage = 'Erreur de connexion réseau. Vérifiez votre connexion Internet et réessayez.';
      } else if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
        displayMessage = 'Les tables de la base de données n\'existent pas encore. Veuillez exécuter le script SQL de configuration.';
      }
      
      setError(displayMessage);
      showSnackbar(displayMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Charger les données réelles pour le dashboard
  const loadDashboardData = async () => {
    try {
      const { getMyClinicId } = await import('../services/clinicService');
      const { supabase } = await import('../services/supabase');
      const clinicId = await getMyClinicId();
      
      if (!clinicId) {
        console.warn('Contexte de clinique manquant pour charger les données du dashboard');
        return;
      }

      // Charger les dossiers obstétricaux avec les patients
      const dossiersData = await MaterniteService.getAllDossiers();
      
      // Transformer les dossiers en format Patiente pour le dashboard
      const patientesData: Patiente[] = dossiersData.map((dossier: any) => {
        const patient = dossier.patients || {};
        return {
          id: dossier.patient_id || dossier.id,
          nom: patient.nom || '',
          prenom: patient.prenoms || '',
          dateNaissance: patient.date_naissance || '',
          dateDerniereRegles: dossier.date_dernieres_regles || '',
          dateAccouchementPrevu: dossier.date_accouchement_prevu || '',
          statut: dossier.status === 'en_suivi' ? 'suivi' : 
                  dossier.status === 'accouchement' ? 'accouchement' :
                  dossier.status === 'post_partum' ? 'post_partum' : 'suivi',
          grossesse: dossier.numero_grossesse || 1,
          notes: dossier.observations || '',
          risque: dossier.niveau_risque === 'eleve' ? 'eleve' : 'normal',
          cpnCompletes: 0, // Sera mis à jour après chargement des CPN
          consultations: [],
          accouchements: []
        };
      });

      // Charger les CPN pour tous les dossiers
      const allCPN: any[] = [];
      for (const dossier of dossiersData) {
        try {
          const cpns = await CPNService.getAllCPN(dossier.id);
          allCPN.push(...cpns.map(cpn => ({
            ...cpn,
            patienteId: dossier.patient_id || dossier.id,
            numeroCPN: cpn.numero_cpn,
            date: cpn.date_consultation,
            ageGestationnel: cpn.terme_semaines,
            tension: cpn.tension_arterielle,
            poids: cpn.poids,
            observations: cpn.diagnostic || cpn.decision || cpn.signes_danger || '',
            statut: cpn.statut || 'terminee'
          })));
          
          // Mettre à jour le nombre de CPN complètes pour cette patiente
          const patienteIndex = patientesData.findIndex(p => p.id === (dossier.patient_id || dossier.id));
          if (patienteIndex >= 0) {
            patientesData[patienteIndex].cpnCompletes = cpns.filter(c => c.statut === 'terminee').length;
            patientesData[patienteIndex].consultations = cpns.map(cpn => ({
              id: cpn.id || '',
              numeroCPN: cpn.numero_cpn,
              date: cpn.date_consultation,
              ageGestationnel: cpn.terme_semaines,
              tension: cpn.tension_arterielle,
              poids: cpn.poids,
              observations: cpn.diagnostic || cpn.decision || cpn.signes_danger || '',
              statut: cpn.statut || 'terminee'
            }));
          }
        } catch (err) {
          console.warn(`Erreur lors du chargement des CPN pour le dossier ${dossier.id}:`, err);
        }
      }

      // Charger les accouchements
      const accouchementsData = await AccouchementService.getAllAccouchements();
      const accouchementsFormatted = accouchementsData.map(acc => ({
        id: acc.id || '',
        date: acc.date_accouchement,
        mode: acc.type_accouchement || 'voie_basse',
        dureeTravail: acc.duree_travail,
        nouveauNe: acc.nouveau_nes && acc.nouveau_nes.length > 0 ? {
          sexe: acc.nouveau_nes[0].sexe === 'Masculin' ? 'M' : 'F',
          poids: acc.nouveau_nes[0].poids,
          taille: acc.nouveau_nes[0].taille,
          scoreApgar1: acc.nouveau_nes[0].apgar_1min,
          scoreApgar5: acc.nouveau_nes[0].apgar_5min,
          scoreApgar10: acc.nouveau_nes[0].apgar_10min,
          statut: acc.issue_grossesse === 'Vivant' ? 'vivant' : 'mort'
        } : undefined,
        statut: acc.statut === 'termine' ? 'termine' : 'en_cours'
      }));

      // Mettre à jour les accouchements dans les patientes
      for (const acc of accouchementsData) {
        const dossier = dossiersData.find(d => d.id === acc.dossier_obstetrical_id);
        if (dossier) {
          const patienteIndex = patientesData.findIndex(p => p.id === (dossier.patient_id || dossier.id));
          if (patienteIndex >= 0) {
            patientesData[patienteIndex].accouchements = accouchementsFormatted.filter(a => 
              accouchementsData.find(accData => accData.id === a.id)?.dossier_obstetrical_id === dossier.id
            );
          }
        }
      }

      // Charger les alertes maternité depuis Supabase (si la table existe)
      let alertesFormatted: any[] = [];
      try {
        const { data: alertesData, error: alertesError } = await supabase
          .from('alertes_maternite')
          .select('*')
          .eq('clinic_id', clinicId)
          .eq('statut', 'active')
          .order('date_creation', { ascending: false });

        if (!alertesError && alertesData) {
          alertesFormatted = alertesData.map(alerte => ({
            id: alerte.id,
            type: alerte.type,
            niveau: alerte.niveau,
            message: alerte.message,
            patienteId: alerte.patient_id || alerte.dossier_obstetrical_id,
            dateCreation: alerte.date_creation,
            statut: alerte.statut,
            priorite: alerte.priorite || 'normale',
            description: alerte.description || ''
          }));
        }
      } catch (alertesErr: any) {
        // Si la table n'existe pas, générer des alertes à partir des données disponibles
        console.warn('Table alertes_maternite non disponible, génération d\'alertes depuis les données:', alertesErr);
        
        // Générer des alertes pour les CPN manquées
        const maintenant = new Date();
        for (const patiente of patientesData) {
          const derniereCPN = patiente.consultations && patiente.consultations.length > 0
            ? patiente.consultations[patiente.consultations.length - 1]
            : null;
          
          if (derniereCPN) {
            const dateDerniereCPN = new Date(derniereCPN.date);
            const joursDepuisDerniereCPN = (maintenant.getTime() - dateDerniereCPN.getTime()) / (1000 * 60 * 60 * 24);
            
            // Alerte si plus de 30 jours depuis la dernière CPN
            if (joursDepuisDerniereCPN > 30 && patiente.statut === 'suivi') {
              alertesFormatted.push({
                id: `cpn-manquee-${patiente.id}`,
                type: 'cpn_manquee',
                niveau: 'warning',
                message: `CPN manquée pour ${patiente.prenom} ${patiente.nom}`,
                patienteId: patiente.id,
                dateCreation: maintenant.toISOString(),
                statut: 'active',
                priorite: 'normale',
                description: `Dernière CPN: ${dateDerniereCPN.toLocaleDateString()}`
              });
            }
          }
          
          // Alerte pour grossesses à risque
          if (patiente.risque === 'eleve') {
            alertesFormatted.push({
              id: `risque-${patiente.id}`,
              type: 'grossesse_risque',
              niveau: 'error',
              message: `Grossesse à risque pour ${patiente.prenom} ${patiente.nom}`,
              patienteId: patiente.id,
              dateCreation: maintenant.toISOString(),
              statut: 'active',
              priorite: 'elevee',
              description: 'Surveillance accrue requise'
            });
          }
        }
      }

      setPatientes(patientesData);
      setConsultations(allCPN);
      setAccouchements(accouchementsFormatted);
      setAlertes(alertesFormatted);
    } catch (err: any) {
      console.error('Erreur lors du chargement des données du dashboard:', err);
      // En cas d'erreur, utiliser des données vides plutôt que de démonstration
      setPatientes([]);
      setConsultations([]);
      setAccouchements([]);
      setAlertes([]);
    }
  };

  // Données de démonstration enrichies (pour le dashboard et autres fonctionnalités existantes) - REMPLACÉ PAR LES DONNÉES RÉELLES
  const patientesDemo: Patiente[] = [
    {
      id: 'PAT001',
      nom: 'Dupont',
      prenom: 'Marie',
      dateNaissance: '1990-05-15',
      dateDerniereRegles: '2023-06-01',
      dateAccouchementPrevu: '2024-03-08',
      statut: 'suivi',
      grossesse: 1,
      notes: 'Grossesse normale, échographies OK',
      risque: 'normal',
      cpnCompletes: 3,
      consultations: [
        {
          id: '1',
          numeroCPN: 1,
          date: '2023-07-15',
          ageGestationnel: 12,
          tension: '12/8',
          poids: 65,
          observations: 'Première consultation, grossesse normale',
          statut: 'terminee'
        },
        {
          id: '2',
          numeroCPN: 2,
          date: '2023-09-15',
          ageGestationnel: 20,
          tension: '13/8',
          poids: 68,
          observations: 'Échographie morphologique normale',
          statut: 'terminee'
        },
        {
          id: '3',
          numeroCPN: 3,
          date: '2023-11-15',
          ageGestationnel: 28,
          tension: '12/7',
          poids: 72,
          observations: 'Consultation normale',
          statut: 'terminee'
        }
      ],
      accouchements: []
    },
    {
      id: 'PAT002',
      nom: 'Martin',
      prenom: 'Sophie',
      dateNaissance: '1988-12-03',
      dateDerniereRegles: '2023-05-20',
      dateAccouchementPrevu: '2024-02-25',
      statut: 'accouchement',
      grossesse: 2,
      notes: 'Accouchement en cours',
      risque: 'eleve',
      cpnCompletes: 4,
      consultations: [
        {
          id: '4',
          numeroCPN: 1,
          date: '2023-06-20',
          ageGestationnel: 12,
          tension: '14/9',
          poids: 70,
          observations: 'Tension légèrement élevée',
          statut: 'terminee'
        },
        {
          id: '5',
          numeroCPN: 2,
          date: '2023-08-20',
          ageGestationnel: 20,
          tension: '15/9',
          poids: 75,
          observations: 'Surveillance tension',
          statut: 'terminee'
        },
        {
          id: '6',
          numeroCPN: 3,
          date: '2023-10-20',
          ageGestationnel: 28,
          tension: '14/8',
          poids: 78,
          observations: 'Tension stable',
          statut: 'terminee'
        },
        {
          id: '7',
          numeroCPN: 4,
          date: '2023-12-20',
          ageGestationnel: 36,
          tension: '15/9',
          poids: 80,
          observations: 'Pré-éclampsie légère',
          statut: 'terminee'
        }
      ],
      accouchements: []
    },
    {
      id: 'PAT003',
      nom: 'Bernard',
      prenom: 'Claire',
      dateNaissance: '1992-08-10',
      dateDerniereRegles: '2023-04-15',
      dateAccouchementPrevu: '2024-01-22',
      statut: 'post_partum',
      grossesse: 1,
      notes: 'Accouchement réussi',
      risque: 'normal',
      cpnCompletes: 4,
      consultations: [],
      accouchements: [
        {
          id: 'ACC001',
          date: '2024-01-20T14:30:00',
          mode: 'voie_basse',
          dureeTravail: 8,
          nouveauNe: {
            sexe: 'F',
            poids: 3200,
            taille: 50,
            scoreApgar1: 8,
            scoreApgar5: 9,
            scoreApgar10: 9,
            statut: 'vivant'
          },
          statut: 'termine'
        }
      ]
    }
  ];

  // Données de démonstration pour les consultations et accouchements
  // Les données consultations, accouchements et alertes sont maintenant chargées depuis Supabase
  // et stockées dans les états : consultations, accouchements, alertes

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewDetails = (type: string, id: string) => {
    if (type === 'dossier') {
      const dossier = dossiers.find(d => d.id === id);
      if (dossier) {
        // Récupérer le patient depuis le dossier
        const patient = dossier.patients as any;
        if (patient) {
          setSelectedPatient(patient);
          setSelectedDossier(dossier);
          setDossierMode('view');
          setOpenDossierDialog(true);
        }
      }
    }
  };

  const handleNouvellePatiente = () => {
    setOpenPatientSelection(true);
  };

  const handlePatientSelected = (patient: Patient) => {
    setSelectedPatient(patient);
    setSelectedDossier(null);
    setDossierMode('create');
    setOpenPatientSelection(false);
    setOpenDossierDialog(true);
  };

  const handleSaveDossier = async (dossierData: DossierObstetricalFormData) => {
    try {
      if (dossierMode === 'create') {
        await MaterniteService.createDossier(dossierData);
        showSnackbar('Dossier obstétrical créé avec succès', 'success');
      } else if (selectedDossier?.id) {
        await MaterniteService.updateDossier(selectedDossier.id, dossierData);
        showSnackbar('Dossier obstétrical modifié avec succès', 'success');
      }
      await loadDossiers();
      setOpenDossierDialog(false);
      setSelectedPatient(null);
      setSelectedDossier(null);
    } catch (err: any) {
      showSnackbar(err.message || 'Erreur lors de la sauvegarde', 'error');
      throw err;
    }
  };

  const handleCloseDossierDialog = () => {
    setOpenDossierDialog(false);
    setSelectedPatient(null);
    setSelectedDossier(null);
  };

  const handleSaveAccouchement = async (accouchementData: Accouchement) => {
    try {
      if (selectedAccouchement?.id) {
        await AccouchementService.updateAccouchement(selectedAccouchement.id, accouchementData);
        showSnackbar('Accouchement modifié avec succès', 'success');
      } else {
        await AccouchementService.createAccouchement(accouchementData);
        showSnackbar('Accouchement enregistré avec succès', 'success');
      }
      setOpenAccouchementDialog(false);
      setSelectedAccouchement(null);
    } catch (err: any) {
      showSnackbar(err.message || 'Erreur lors de la sauvegarde', 'error');
      throw err;
    }
  };

  const handleSaveNouveauNe = async (nouveauNeData: NouveauNe) => {
    try {
      if (selectedAccouchement?.id) {
        await AccouchementService.createNouveauNe(nouveauNeData);
        showSnackbar('État du nouveau-né enregistré avec succès', 'success');
      }
      setOpenNouveauNeDialog(false);
    } catch (err: any) {
      showSnackbar(err.message || 'Erreur lors de la sauvegarde', 'error');
      throw err;
    }
  };

  const handleSaveVaccination = async (vaccinationData: VaccinationMaternelle) => {
    try {
      await CPNService.saveVaccinationMaternelle(vaccinationData);
      showSnackbar('Vaccination enregistrée avec succès', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Erreur lors de la sauvegarde', 'error');
      throw err;
    }
  };

  const handleSaveSoinsPromotionnels = async (soinsData: SoinsPromotionnels) => {
    try {
      await CPNService.saveSoinsPromotionnels(soinsData);
      showSnackbar('Soins promotionnels enregistrés avec succès', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Erreur lors de la sauvegarde', 'error');
      throw err;
    }
  };

  const handleCreerAlerte = (alerte: any) => {
    console.log('Créer alerte:', alerte);
  };

  const handleResoudreAlerte = (id: string) => {
    console.log('Résoudre alerte:', id);
  };

  const handleIgnorerAlerte = (id: string) => {
    console.log('Ignorer alerte:', id);
  };

  const handleConfigurerAlertes = (config: any) => {
    console.log('Configurer alertes:', config);
  };

  const handleRefresh = async () => {
    console.log('Actualiser les données');
    await loadDossiers();
    await loadDashboardData();
  };

  const handleExportData = (format: string) => {
    console.log('Exporter données:', format);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* En-tête amélioré */}
        <ToolbarBits sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <LocalHospital color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <GradientText variant="h4">Module Maternité</GradientText>
              <Typography variant="body2" color="text.secondary">
                Suivi Complet des Grossesses et Accouchements
              </Typography>
            </Box>
          </Box>
        </ToolbarBits>

        {/* Onglets */}
        <GlassCard sx={{ mb: 3, width: '100%', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="Module Maternité" 
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': { opacity: 0.3 }
              },
              '& .MuiTab-root': {
                minHeight: 56,
                py: 1.5,
                px: 2,
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&.Mui-selected': { fontWeight: 600 }
              }
            }}
          >
            <Tab icon={<Dashboard />} label="Tableau de Bord" iconPosition="start" />
            <Tab icon={<Assignment />} label="Dossiers Maternité" iconPosition="start" />
            <Tab icon={<Schedule />} label="Consultations CPN" iconPosition="start" />
            <Tab icon={<LocalHospital />} label="Accouchements" iconPosition="start" />
            <Tab icon={<ChildCare />} label="Suivi Post-natal" iconPosition="start" />
            <Tab icon={<Notifications />} label="Système Alertes" iconPosition="start" />
            <Tab icon={<Assessment />} label="Statistiques" iconPosition="start" />
          </Tabs>
          </Box>
        </GlassCard>

        {/* Contenu des onglets */}
        <TabPanel value={activeTab} index={0}>
          <MaterniteDashboard
            patientes={patientes}
            accouchements={accouchements}
            consultations={consultations}
            alertes={alertes}
            onRefresh={handleRefresh}
            onViewDetails={handleViewDetails}
            onExportData={handleExportData}
            onNouvellePatiente={handleNouvellePatiente}
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={async () => {
                const p = patientes[0];
                const resp = await IntegrationService.scheduleFollowUpRendezVous({
                  patientId: p.id,
                  service: 'Maternité',
                  motif: 'CPN - Suivi 7 jours',
                  daysOffset: 7,
                });
                if (!resp.ok) console.error(resp.message);
              }}
            >
              Planifier Suivi (Demo)
            </Button>
            <Button
              variant="outlined"
              onClick={async () => {
                const p = patientes[0];
                const resp = await IntegrationService.registerMaternityConsumption({
                  patientId: p.id,
                  items: [{ medicament_id: 'FER001', quantite: 1 }],
                });
                if (!resp.ok) console.error(resp.message);
              }}
            >
              Consommation Fer (Demo)
            </Button>
                </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Dossiers Obstétricaux</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={handleNouvellePatiente}>
                  Nouveau Dossier
              </Button>
            </Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                        <TableCell>N° Dossier</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Date Entrée</TableCell>
                        <TableCell>DDR</TableCell>
                        <TableCell>DPA</TableCell>
                        <TableCell>Gestité</TableCell>
                        <TableCell>Parité</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                      {dossiers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Aucun dossier obstétrical enregistré
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        dossiers.map((dossier) => {
                          const patient = dossier.patients as any;
                          const facteursRisque = MaterniteService.detecterFacteursRisque(dossier);
                          return (
                            <TableRow key={dossier.id}>
                              <TableCell>{dossier.numero_dossier || dossier.id?.substring(0, 8)}</TableCell>
                              <TableCell>
                                {patient ? `${patient.prenom} ${patient.nom}` : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {dossier.date_entree ? new Date(dossier.date_entree).toLocaleDateString() : '-'}
                              </TableCell>
                              <TableCell>
                                {dossier.ddr ? new Date(dossier.ddr).toLocaleDateString() : '-'}
                              </TableCell>
                              <TableCell>
                                {dossier.dpa ? new Date(dossier.dpa).toLocaleDateString() : '-'}
                              </TableCell>
                              <TableCell>{dossier.gestite || 0}</TableCell>
                              <TableCell>{dossier.parite || 0}</TableCell>
                      <TableCell>
                        <Chip
                                  label={dossier.statut || 'en_cours'}
                                  color={
                                    dossier.statut === 'en_cours'
                                      ? 'primary'
                                      : dossier.statut === 'accouche'
                                      ? 'success'
                                      : 'default'
                                  }
                            size="small"
                          />
                                {facteursRisque.length > 0 && (
                          <Chip
                                    label={`${facteursRisque.length} risque(s)`}
                                    color="warning"
                            size="small"
                                    sx={{ ml: 1 }}
                          />
                                )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                                  onClick={() => handleViewDetails('dossier', dossier.id!)}
                                  title="Voir le dossier"
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                                  onClick={() => {
                                    setSelectedDossier(dossier);
                                    setSelectedPatient(patient);
                                    setDossierMode('edit');
                                    setOpenDossierDialog(true);
                                  }}
                                  title="Modifier le dossier"
                                >
                                  <Edit />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                          );
                        })
                      )}
                  </TableBody>
                </Table>
              </TableContainer>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {selectedDossier?.id ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Recommandations OMS :</strong> Au minimum 4 consultations prénatales (CPN1, CPN2, CPN3, CPN4) 
                  aux semaines 12, 20, 28 et 36 de grossesse.
                </Typography>
              </Alert>
              
              <TableauCPN dossierId={selectedDossier.id} />
              
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <GestionVaccination
                      dossierId={selectedDossier.id}
                      onSave={handleSaveVaccination}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <GestionSoinsPromotionnels
                      dossierId={selectedDossier.id}
                      onSave={handleSaveSoinsPromotionnels}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ) : (
            <Card>
              <CardContent>
                <Alert severity="warning">
                  Veuillez sélectionner un dossier obstétrical pour accéder aux consultations prénatales.
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {selectedDossier?.id ? (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Gestion des Accouchements
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setOpenAccouchementDialog(true)}
                    >
                      Enregistrer Accouchement
                    </Button>
                  </Box>
                  <Alert severity="info">
                    Module d'enregistrement des accouchements avec calcul automatique du score Apgar pour le nouveau-né.
                  </Alert>
                </CardContent>
              </Card>

              {openAccouchementDialog && (
                <Dialog open={true} onClose={() => setOpenAccouchementDialog(false)} maxWidth="lg" fullWidth>
                  <DialogContent>
                    <FormulaireAccouchement
                      dossierId={selectedDossier.id}
                      onSave={handleSaveAccouchement}
                      onCancel={() => setOpenAccouchementDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </Box>
          ) : (
            <Card>
              <CardContent>
                <Alert severity="warning">
                  Veuillez sélectionner un dossier obstétrical pour enregistrer un accouchement.
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          {selectedAccouchement?.id ? (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Surveillance Post-Partum Immédiate (2 heures)
                  </Typography>
                  <FormulaireSurveillancePostPartum
                    accouchementId={selectedAccouchement.id}
                    onClose={() => setSelectedAccouchement(null)}
                  />
                </CardContent>
              </Card>
            </Box>
          ) : (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                  Suivi Post-Partum
                </Typography>
                <Alert severity="warning">
                  Veuillez enregistrer un accouchement pour accéder à la surveillance post-partum.
              </Alert>
            </CardContent>
          </Card>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <SystemeAlertesMaternite
            patientes={patientes}
            consultations={consultations}
            accouchements={accouchements}
            onCreerAlerte={handleCreerAlerte}
            onResoudreAlerte={handleResoudreAlerte}
            onIgnorerAlerte={handleIgnorerAlerte}
            onConfigurerAlertes={handleConfigurerAlertes}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiques et Rapports
              </Typography>
              <Alert severity="info">
                <Typography variant="body2">
                  Module de statistiques en cours de développement. 
                  Inclura les indicateurs OMS, rapports de mortalité maternelle et néonatale.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </TabPanel>
    </Box>

      {/* Dialog de sélection de patient */}
      <PatientSelectionDialog
        open={openPatientSelection}
        onClose={() => setOpenPatientSelection(false)}
        onSelect={handlePatientSelected}
      />

      {/* Dialog de dossier obstétrical */}
      {openDossierDialog && selectedPatient && (
        <DossierMaternite
          patient={selectedPatient}
          dossier={selectedDossier || undefined}
          onSave={handleSaveDossier}
          onClose={handleCloseDossierDialog}
          mode={dossierMode}
        />
      )}

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Container>
  );
};

export default Maternite; 