import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  LocalShipping,
  Inventory,
  Warning,
  Print,
  Refresh,
  TrendingUp,
  AttachMoney,
  Dashboard,
  Store,
  Assessment,
  Notifications,
  Sync,
  Person,
  MedicalServices,
  Assignment,
  CheckCircle,
  ErrorOutline,
} from '@mui/icons-material';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import SystemeAlertes from '../components/stock/SystemeAlertes';
import GestionTransferts from '../components/stock/GestionTransferts';
import SynchronisationStocks from '../components/stock/SynchronisationStocks';
import GestionInventaire from '../components/stock/GestionInventaire';
import NouvelleDispensationWizard from '../components/pharmacy/NouvelleDispensationWizard';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { supabase } from '../services/supabase';

// Types pour les données
interface MedicamentDetail {
  id: string;
  code: string;
  nom: string;
  dci: string;
  forme: string;
  dosage: string;
  unite: string;
  quantiteRecue: number;
  quantiteDispensée: number;
  quantiteRestante: number;
  seuilMinimum: number;
  prixUnitaire: number;
  emplacement: string;
  observations?: string;
}

interface Dispensation {
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

interface AlerteDetail {
  id: string;
  type: 'stock_bas' | 'perte_anormale' | 'retour_requis';
  niveau: 'critique' | 'avertissement' | 'information';
  message: string;
  medicamentId: string;
  dateCreation: Date;
  statut: 'active' | 'resolue' | 'ignoree';
}

// Données de démonstration
const medicamentsDetailDemo: MedicamentDetail[] = [
  {
    id: '1',
    code: 'MED-001',
    nom: 'Paracétamol 500mg',
    dci: 'Paracétamol',
    forme: 'Comprimé',
    dosage: '500 mg',
    unite: 'Boîte',
    quantiteRecue: 200,
    quantiteDispensée: 50,
    quantiteRestante: 150,
    seuilMinimum: 20,
    prixUnitaire: 2500,
    emplacement: 'Rayon A-1',
    observations: 'Médicament essentiel'
  },
  {
    id: '2',
    code: 'MED-002',
    nom: 'Amoxicilline 1g',
    dci: 'Amoxicilline',
    forme: 'Poudre injectable',
    dosage: '1g',
    unite: 'Flacon',
    quantiteRecue: 50,
    quantiteDispensée: 25,
    quantiteRestante: 25,
    seuilMinimum: 10,
    prixUnitaire: 15000,
    emplacement: 'Frigo B-2',
    observations: 'Conservation réfrigérée'
  },
  {
    id: '3',
    code: 'MED-003',
    nom: 'Ibuprofène 400mg',
    dci: 'Ibuprofène',
    forme: 'Comprimé',
    dosage: '400 mg',
    unite: 'Boîte',
    quantiteRecue: 100,
    quantiteDispensée: 80,
    quantiteRestante: 20,
    seuilMinimum: 15,
    prixUnitaire: 3200,
    emplacement: 'Rayon A-2',
    observations: 'Stock faible'
  }
];

const dispensationsDemo: Dispensation[] = [
  {
    id: '1',
    medicamentId: '1',
    patientId: 'PAT-001',
    patientNom: 'Moussa Traoré',
    quantite: 10,
    dateDispensation: new Date('2024-07-15'),
    motif: 'Prescription médicale - Fièvre',
    prescripteur: 'Dr. Diallo',
    consultationId: 'CONS-001',
    utilisateur: 'Infirmier Pharmacie',
    statut: 'dispensé'
  },
  {
    id: '2',
    medicamentId: '1',
    serviceId: 'SERV-001',
    serviceNom: 'Maternité',
    quantite: 20,
    dateDispensation: new Date('2024-07-16'),
    motif: 'Service interne - Post-partum',
    prescripteur: 'Dr. Keita',
    utilisateur: 'Infirmier Pharmacie',
    statut: 'dispensé'
  },
  {
    id: '3',
    medicamentId: '2',
    patientId: 'PAT-002',
    patientNom: 'Fatoumata Diarra',
    quantite: 5,
    dateDispensation: new Date('2024-07-17'),
    motif: 'Prescription médicale - Infection',
    prescripteur: 'Dr. Coulibaly',
    consultationId: 'CONS-002',
    utilisateur: 'Pharmacien',
    statut: 'dispensé'
  }
];

const alertesDetailDemo: AlerteDetail[] = [
  {
    id: '1',
    type: 'stock_bas',
    niveau: 'critique',
    message: 'Stock Ibuprofène 400mg en dessous du seuil minimum',
    medicamentId: '3',
    dateCreation: new Date('2024-07-15'),
    statut: 'active'
  }
];

const Pharmacie: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [medicaments, setMedicaments] = useState<MedicamentDetail[]>(medicamentsDetailDemo);
  const [dispensations, setDispensations] = useState<Dispensation[]>(dispensationsDemo);
  const [alertes, setAlertes] = useState<AlerteDetail[]>(alertesDetailDemo);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [notification, setNotification] = useState<{open: boolean; message: string; type: 'success' | 'error' | 'info'}>({
    open: false, message: '', type: 'info'
  });

  // Fonction utilitaire pour les notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ open: true, message, type });
  };
  
  // États pour les dialogs
  const [openDispensation, setOpenDispensation] = useState(false);
  const [openRapport, setOpenRapport] = useState(false);
  const [selectedMedicament, setSelectedMedicament] = useState<MedicamentDetail | null>(null);
  
  // États pour les formulaires
  const [dispensationForm, setDispensationForm] = useState({
    medicamentId: '',
    typeDestinataire: 'patient',
    patientId: '',
    patientNom: '',
    serviceId: '',
    serviceNom: '',
    quantite: 0,
    dateDispensation: new Date().toISOString().split('T')[0],
    motif: '',
    prescripteur: '',
    consultationId: ''
  });

  // Chargement des données réelles depuis Supabase
  const loadRealData = async () => {
    try {
      setLoading(true);
      
      // Charger les lots du magasin détail depuis Supabase
      const { data: lotsDetail, error: lotsError } = await supabase
        .from('lots')
        .select(`
          *,
          medicaments (*)
        `)
        .eq('magasin', 'detail')
        .eq('statut', 'actif');
      
      if (lotsError) throw lotsError;
      
      if (lotsDetail && lotsDetail.length > 0) {
        // Agréger par médicament
        const medicamentsMap = new Map<string, MedicamentDetail>();
        
        lotsDetail.forEach(lot => {
          const med = lot.medicaments as any;
          if (!med) return;
          
          const existingMed = medicamentsMap.get(lot.medicament_id);
          if (existingMed) {
            existingMed.quantiteRestante += lot.quantite_disponible;
          } else {
            medicamentsMap.set(lot.medicament_id, {
              id: lot.medicament_id,
              code: med.code || `MED-${lot.medicament_id.substring(0, 6)}`,
              nom: med.nom || 'Inconnu',
              dci: med.dci || '',
              forme: med.forme || '',
              dosage: med.dosage || '',
              unite: med.unite || 'Unité',
              quantiteRecue: lot.quantite_initiale,
              quantiteDispensée: lot.quantite_initiale - lot.quantite_disponible,
              quantiteRestante: lot.quantite_disponible,
              seuilMinimum: med.seuil_alerte || 20,
              prixUnitaire: med.prix_unitaire || 0,
              emplacement: med.emplacement || '',
              observations: med.observations || ''
            });
          }
        });
        
        // Fusionner avec les données de démonstration
        const medsFromSupabase = Array.from(medicamentsMap.values());
        if (medsFromSupabase.length > 0) {
          setMedicaments(prev => {
            const combined = [...medsFromSupabase];
            prev.forEach(demo => {
              if (!combined.some(m => m.code === demo.code)) {
                combined.push(demo);
              }
            });
            return combined;
          });
        }
        setDataLoaded(true);
      }
      
      // Charger les dispensations récentes
      const { data: dispensationsData, error: dispensationsError } = await supabase
        .from('dispensations')
        .select(`
          *,
          dispensations_lignes (
            *,
            medicaments (*)
          )
        `)
        .order('date_dispensation', { ascending: false })
        .limit(50);
      
      if (!dispensationsError && dispensationsData && dispensationsData.length > 0) {
        const dispensationsConverties: Dispensation[] = dispensationsData.flatMap(disp => {
          const lignes = disp.dispensations_lignes || [];
          return lignes.map((ligne: any) => ({
            id: `${disp.id}-${ligne.id}`,
            medicamentId: ligne.medicament_id,
            patientId: disp.patient_id,
            patientNom: disp.patient_nom || 'Patient',
            serviceId: disp.service_id,
            serviceNom: disp.service_nom,
            quantite: ligne.quantite,
            dateDispensation: new Date(disp.date_dispensation),
            motif: disp.observations || 'Dispensation',
            prescripteur: disp.prescripteur || 'Médecin',
            consultationId: disp.prescription_id,
            utilisateur: disp.utilisateur_id,
            statut: disp.statut === 'terminee' ? 'dispensé' : disp.statut as 'dispensé' | 'annulé' | 'retourné'
          }));
        });
        
        if (dispensationsConverties.length > 0) {
          setDispensations(prev => {
            const combined = [...dispensationsConverties];
            prev.forEach(demo => {
              if (!combined.some(d => d.id === demo.id)) {
                combined.push(demo);
              }
            });
            return combined;
          });
        }
      }
      
      // Charger les alertes actives
      const { data: alertesData, error: alertesError } = await supabase
        .from('alertes_stock')
        .select(`
          *,
          medicaments (*)
        `)
        .eq('statut', 'active');
      
      if (!alertesError && alertesData && alertesData.length > 0) {
        const alertesConverties: AlerteDetail[] = alertesData.map(alerte => ({
          id: alerte.id,
          type: alerte.type as 'stock_bas' | 'perte_anormale' | 'retour_requis',
          niveau: alerte.niveau as 'critique' | 'avertissement' | 'information',
          message: alerte.message,
          medicamentId: alerte.medicament_id,
          dateCreation: new Date(alerte.date_creation),
          statut: alerte.statut as 'active' | 'resolue' | 'ignoree'
        }));
        
        setAlertes(prev => {
          const combined = [...alertesConverties];
          prev.forEach(demo => {
            if (!combined.some(a => a.id === demo.id)) {
              combined.push(demo);
            }
          });
          return combined;
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  React.useEffect(() => {
    if (!dataLoaded) {
      loadRealData();
    }
  }, [dataLoaded]);

  // Calcul des statistiques
  const stats = {
    totalMedicaments: medicaments.length,
    totalStock: medicaments.reduce((sum, med) => sum + med.quantiteRestante, 0),
    valeurStock: medicaments.reduce((sum, med) => sum + (med.quantiteRestante * med.prixUnitaire), 0),
    stockFaible: medicaments.filter(med => med.quantiteRestante <= med.seuilMinimum).length,
    dispensationsAujourdhui: dispensations.filter(disp => {
      const today = new Date();
      const dispDate = new Date(disp.dateDispensation);
      return dispDate.toDateString() === today.toDateString();
    }).length,
    alertesActives: alertes.filter(alert => alert.statut === 'active').length
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDispensationSuccess = () => {
    showNotification('Dispensation enregistrée avec succès !', 'success');
    // Recharger les données après la dispensation
    loadRealData();
  };

  const getDispensationsByMedicament = (medicamentId: string) => {
    return dispensations.filter(disp => disp.medicamentId === medicamentId);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* En-tête amélioré */}
        <ToolbarBits sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Store color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <GradientText variant="h4">Module Pharmacie</GradientText>
              <Typography variant="body2" color="text.secondary">
                Magasin Détail - Dispensation et Gestion des Médicaments
              </Typography>
            </Box>
          </Box>
          <Chip
            label="Connecté en tant que: Pharmacien/Infirmier (Magasin Détail)"
            color="primary"
            variant="outlined"
          />
        </ToolbarBits>

        {/* Navigation par onglets */}
        <GlassCard sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab icon={<Dashboard />} label="Tableau de Bord" />
              <Tab icon={<Store />} label="Stock Détail" />
              <Tab icon={<MedicalServices />} label="Dispensations" />
              <Tab icon={<LocalShipping />} label="Ajustement" />
              <Tab icon={<Assignment />} label="Inventaire" />
              <Tab icon={<Assessment />} label="Rapports" />
              <Tab icon={<Notifications />} label="Alertes" />
              <Tab icon={<Sync />} label="Synchronisation" />
            </Tabs>
          </Box>
        </GlassCard>

        {/* Contenu des onglets */}
        {activeTab === 0 && (
          <Box>
            {/* Statistiques principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Inventory sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Médicaments
                        </Typography>
                        <Typography variant="h4">{stats.totalMedicaments}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Stock Détail
                        </Typography>
                        <Typography variant="h4">{stats.totalStock.toLocaleString()}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AttachMoney sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Valeur Stock
                        </Typography>
                        <Typography variant="h4">
                          {stats.valeurStock.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Warning sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Alertes Actives
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          {stats.alertesActives}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Statistiques secondaires */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <MedicalServices sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Dispensations Aujourd'hui
                        </Typography>
                        <Typography variant="h4">{stats.dispensationsAujourdhui}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Warning sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Stock Faible
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          {stats.stockFaible}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Assignment sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Dispensations Total
                        </Typography>
                        <Typography variant="h4">{dispensations.length}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Alertes critiques */}
            {stats.stockFaible > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {stats.stockFaible} médicament(s) en stock faible (seuil minimum atteint)
              </Alert>
            )}

            {/* Actions rapides */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions Rapides - Magasin Détail
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenDispensation(true)}
                    size="medium"
                  >
                    Nouvelle Dispensation
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Assignment />}
                    onClick={() => setActiveTab(4)}
                    size="medium"
                  >
                    Inventaire
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => setOpenRapport(true)}
                    size="medium"
                  >
                    Générer Rapport
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Tableau de suivi Magasin Détail */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Tableau de Suivi - Magasin Détail
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => setOpenDispensation(true)}
                    >
                      Nouvelle Dispensation
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={loadRealData}
                      disabled={loading}
                    >
                      {loading ? 'Chargement...' : 'Actualiser'}
                    </Button>
                  </Box>
                </Box>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Médicament</TableCell>
                        <TableCell>Stock Actuel</TableCell>
                        <TableCell>Entrées (depuis Gros)</TableCell>
                        <TableCell>Sorties (Patients)</TableCell>
                        <TableCell>Seuil Min</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {medicaments.map((medicament) => {
                        const medicamentDispensations = getDispensationsByMedicament(medicament.id);
                        const sorties = medicamentDispensations.reduce((sum, disp) => sum + disp.quantite, 0);
                        const isStockFaible = medicament.quantiteRestante <= medicament.seuilMinimum;

                        return (
                          <TableRow key={medicament.id} sx={{ 
                            backgroundColor: isStockFaible ? '#ffebee' : 'inherit' 
                          }}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {medicament.nom}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {medicament.code} • {medicament.dci}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {medicament.forme} {medicament.dosage}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {medicament.quantiteRestante} {medicament.unite}
                              </Typography>
                              {isStockFaible && (
                                <Chip label="Stock faible" color="warning" size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {medicament.quantiteRecue} {medicament.unite}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {sorties} {medicament.unite}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {medicament.seuilMinimum} {medicament.unite}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={isStockFaible ? 'Stock faible' : 'Normal'}
                                color={isStockFaible ? 'warning' : 'success'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Voir détails">
                                  <IconButton
                                    size="small"
                                    onClick={() => setSelectedMedicament(medicament)}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Dispenser">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setDispensationForm(prev => ({ ...prev, medicamentId: medicament.id }));
                                      setOpenDispensation(true);
                                    }}
                                  >
                                    <MedicalServices />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Modifier">
                                  <IconButton size="small">
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            {/* Gestion des dispensations */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Gestion des Dispensations
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenDispensation(true)}
                  >
                    Nouvelle Dispensation
                  </Button>
                </Box>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Médicament</TableCell>
                        <TableCell>Destinataire</TableCell>
                        <TableCell>Quantité</TableCell>
                        <TableCell>Motif</TableCell>
                        <TableCell>Prescripteur</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dispensations.map((dispensation) => {
                        const medicament = medicaments.find(med => med.id === dispensation.medicamentId);
                        return (
                          <TableRow key={dispensation.id}>
                            <TableCell>
                              {new Date(dispensation.dateDispensation).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {medicament?.nom}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {medicament?.code}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">
                                  {dispensation.patientNom || dispensation.serviceNom}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {dispensation.patientId ? 'Patient' : 'Service'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {dispensation.quantite} {medicament?.unite}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {dispensation.motif}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {dispensation.prescripteur}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={dispensation.statut}
                                color={dispensation.statut === 'dispensé' ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Voir détails">
                                  <IconButton size="small">
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Modifier">
                                  <IconButton size="small">
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Onglet Ajustement */}
        {activeTab === 3 && (
          <GestionTransferts />
        )}

        {/* Onglet Inventaire */}
        {activeTab === 4 && (
          <GestionInventaire
            magasinType="pharmacie"
            magasinId="pharmacie-detail"
            magasinNom="Pharmacie - Magasin Détail"
            utilisateurId="current-user-id"
            utilisateurNom="Pharmacien/Infirmier"
          />
        )}

        {/* Onglet Rapports */}
        {activeTab === 5 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Rapports de Consommation
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Person />}
                        onClick={() => setOpenRapport(true)}
                      >
                        Consommation par Patient
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<MedicalServices />}
                        onClick={() => setOpenRapport(true)}
                      >
                        Consommation par Service
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<TrendingUp />}
                        onClick={() => setOpenRapport(true)}
                      >
                        Tendances de Consommation
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Rapports de Gestion
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Inventory />}
                        onClick={() => setOpenRapport(true)}
                      >
                        Stock Disponible
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Assessment />}
                        onClick={() => setOpenRapport(true)}
                      >
                        Rapport d'Inventaire
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={() => setOpenRapport(true)}
                      >
                        Export Complet
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Rapport de Synthèse - Magasin Détail
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {stats.totalMedicaments}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Médicaments en Stock
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {dispensations.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Dispensations Total
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {stats.valeurStock.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Valeur du Stock
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Onglet Alertes */}
        {activeTab === 6 && (
          <SystemeAlertes />
        )}

        {/* Onglet Synchronisation */}
        {activeTab === 7 && (
          <SynchronisationStocks />
        )}

        {/* Dialogs */}
        {/* Nouvelle Dispensation Wizard */}
        <NouvelleDispensationWizard
          open={openDispensation}
          onClose={() => setOpenDispensation(false)}
          onSuccess={handleDispensationSuccess}
          utilisateurId="current-user-id"
          utilisateurNom="Pharmacien/Infirmier"
        />

        {/* Dialog Rapport */}
        <Dialog open={openRapport} onClose={() => setOpenRapport(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Générer Rapport - Magasin Détail</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Fonctionnalité de génération de rapport en cours de développement.
              Cette fonction permettra de créer des rapports détaillés sur :
              <ul>
                <li>Consommation des médicaments par patient ou service</li>
                <li>État du stock disponible</li>
                <li>Résultats des inventaires</li>
              </ul>
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRapport(false)}>Fermer</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar pour les notifications */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setNotification(prev => ({ ...prev, open: false }))}
            severity={notification.type}
            sx={{ width: '100%' }}
            icon={notification.type === 'success' ? <CheckCircle /> : notification.type === 'error' ? <ErrorOutline /> : undefined}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Pharmacie;
