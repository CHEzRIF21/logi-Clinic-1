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
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
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
  Undo,
  ReportProblem,
  CheckCircle,
} from '@mui/icons-material';
import SystemeAlertes from '../components/stock/SystemeAlertes';
import GestionTransferts from '../components/stock/GestionTransferts';
import SynchronisationStocks from '../components/stock/SynchronisationStocks';
import NouvelleDispensationWizard from '../components/pharmacy/NouvelleDispensationWizard';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { StatBadge } from '../components/ui/StatBadge';

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

interface Retour {
  id: string;
  medicamentId: string;
  quantite: number;
  dateRetour: Date;
  motif: string;
  utilisateur: string;
  statut: 'en_attente' | 'validé' | 'refusé';
}

interface Perte {
  id: string;
  medicamentId: string;
  quantite: number;
  datePerte: Date;
  motif: string;
  justification: string;
  utilisateur: string;
  statut: 'déclaré' | 'validé' | 'refusé';
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

const retoursDemo: Retour[] = [
  {
    id: '1',
    medicamentId: '1',
    quantite: 5,
    dateRetour: new Date('2024-07-18'),
    motif: 'Produit proche de péremption',
    utilisateur: 'Pharmacien',
    statut: 'en_attente'
  }
];

const pertesDemo: Perte[] = [
  {
    id: '1',
    medicamentId: '3',
    quantite: 2,
    datePerte: new Date('2024-07-19'),
    motif: 'Casse',
    justification: 'Flacon cassé lors du transport',
    utilisateur: 'Infirmier Pharmacie',
    statut: 'déclaré'
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
  },
  {
    id: '2',
    type: 'perte_anormale',
    niveau: 'avertissement',
    message: 'Perte anormale détectée pour Ibuprofène 400mg',
    medicamentId: '3',
    dateCreation: new Date('2024-07-19'),
    statut: 'active'
  }
];

const Pharmacie: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [medicaments, setMedicaments] = useState<MedicamentDetail[]>(medicamentsDetailDemo);
  const [dispensations, setDispensations] = useState<Dispensation[]>(dispensationsDemo);
  const [retours, setRetours] = useState<Retour[]>(retoursDemo);
  const [pertes, setPertes] = useState<Perte[]>(pertesDemo);
  const [alertes, setAlertes] = useState<AlerteDetail[]>(alertesDetailDemo);
  
  // États pour les dialogs
  const [openDispensation, setOpenDispensation] = useState(false);
  const [openRetour, setOpenRetour] = useState(false);
  const [openPerte, setOpenPerte] = useState(false);
  const [openRapport, setOpenRapport] = useState(false);
  const [selectedMedicament, setSelectedMedicament] = useState<MedicamentDetail | null>(null);
  
  // États pour les formulaires
  const [dispensationForm, setDispensationForm] = useState({
    medicamentId: '',
    typeDestinataire: 'patient', // 'patient' ou 'service'
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

  const [retourForm, setRetourForm] = useState({
    medicamentId: '',
    quantite: 0,
    dateRetour: new Date().toISOString().split('T')[0],
    motif: ''
  });

  const [perteForm, setPerteForm] = useState({
    medicamentId: '',
    quantite: 0,
    datePerte: new Date().toISOString().split('T')[0],
    motif: '',
    justification: ''
  });

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
    retoursEnAttente: retours.filter(retour => retour.statut === 'en_attente').length,
    pertesDeclarees: pertes.filter(perte => perte.statut === 'déclaré').length,
    alertesActives: alertes.filter(alert => alert.statut === 'active').length
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDispensationSuccess = () => {
    // Rafraîchir les données après une dispensation réussie
    // Vous pouvez ajouter ici la logique pour recharger les dispensations
    console.log('Dispensation enregistrée avec succès');
    // Optionnel: recharger les données
    // loadDispensations();
  };

  const handleRetour = () => {
    // Logique de retour
    console.log('Retour enregistré:', retourForm);
    setOpenRetour(false);
    // Réinitialiser le formulaire
    setRetourForm({
      medicamentId: '',
      quantite: 0,
      dateRetour: new Date().toISOString().split('T')[0],
      motif: ''
    });
  };

  const handlePerte = () => {
    // Logique de déclaration de perte
    console.log('Perte déclarée:', perteForm);
    setOpenPerte(false);
    // Réinitialiser le formulaire
    setPerteForm({
      medicamentId: '',
      quantite: 0,
      datePerte: new Date().toISOString().split('T')[0],
      motif: '',
      justification: ''
    });
  };

  const getDispensationsByMedicament = (medicamentId: string) => {
    return dispensations.filter(disp => disp.medicamentId === medicamentId);
  };

  const getRetoursByMedicament = (medicamentId: string) => {
    return retours.filter(retour => retour.medicamentId === medicamentId);
  };

  const getPertesByMedicament = (medicamentId: string) => {
    return pertes.filter(perte => perte.medicamentId === medicamentId);
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
            <Tab icon={<LocalShipping />} label="Transferts" />
            <Tab icon={<Undo />} label="Retours" />
            <Tab icon={<ReportProblem />} label="Pertes" />
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
              <Grid item xs={12} sm={6} md={3}>
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
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Undo sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Retours en Attente
                        </Typography>
                        <Typography variant="h4">{stats.retoursEnAttente}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ReportProblem sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Pertes Déclarées
                        </Typography>
                        <Typography variant="h4">{stats.pertesDeclarees}</Typography>
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
        </Grid>

            {/* Alertes critiques */}
            {stats.stockFaible > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {stats.stockFaible} médicament(s) en stock faible (seuil minimum atteint)
              </Alert>
            )}

            {stats.pertesDeclarees > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {stats.pertesDeclarees} perte(s) déclarée(s) nécessitant validation
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
                    startIcon={<Undo />}
                    onClick={() => setOpenRetour(true)}
                    size="medium"
                  >
                    Déclarer Retour
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ReportProblem />}
                    onClick={() => setOpenPerte(true)}
                    size="medium"
                  >
                    Déclarer Perte
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
                    >
                      Actualiser
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
                        <TableCell>Retours (vers Gros)</TableCell>
                        <TableCell>Seuil Min</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                      {medicaments.map((medicament) => {
                        const medicamentDispensations = getDispensationsByMedicament(medicament.id);
                        const medicamentRetours = getRetoursByMedicament(medicament.id);
                        const sorties = medicamentDispensations.reduce((sum, disp) => sum + disp.quantite, 0);
                        const retours = medicamentRetours.reduce((sum, retour) => sum + retour.quantite, 0);
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
                                {retours} {medicament.unite}
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
                                <Tooltip title="Déclarer retour">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setRetourForm(prev => ({ ...prev, medicamentId: medicament.id }));
                                      setOpenRetour(true);
                                    }}
                                  >
                                    <Undo />
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

        {/* Onglet Transferts */}
        {activeTab === 3 && (
          <GestionTransferts />
        )}

        {/* Onglet Retours */}
        {activeTab === 4 && (
            <Box>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Gestion des Retours vers Magasin Gros
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenRetour(true)}
                  >
                    Nouveau Retour
                  </Button>
                </Box>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Médicament</TableCell>
                        <TableCell>Quantité</TableCell>
                        <TableCell>Motif</TableCell>
                        <TableCell>Utilisateur</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {retours.map((retour) => {
                        const medicament = medicaments.find(med => med.id === retour.medicamentId);
                        return (
                          <TableRow key={retour.id}>
                            <TableCell>
                              {new Date(retour.dateRetour).toLocaleDateString()}
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
                              <Typography variant="body2">
                                {retour.quantite} {medicament?.unite}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {retour.motif}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {retour.utilisateur}
                              </Typography>
                            </TableCell>
                            <TableCell>
                  <Chip
                                label={retour.statut}
                                color={
                                  retour.statut === 'validé' ? 'success' : 
                                  retour.statut === 'refusé' ? 'error' : 'warning'
                                }
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
                                {retour.statut === 'en_attente' && (
                                  <>
                                    <Tooltip title="Valider">
                                      <IconButton size="small" color="success">
                                        <CheckCircle />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Refuser">
                                      <IconButton size="small" color="error">
                                        <ReportProblem />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
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

        {/* Onglet Pertes */}
        {activeTab === 5 && (
          <Box>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Gestion des Pertes et Corrections
              </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenPerte(true)}
                  >
                    Déclarer Perte
                  </Button>
                </Box>
                
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                        <TableCell>Date</TableCell>
                      <TableCell>Médicament</TableCell>
                      <TableCell>Quantité</TableCell>
                        <TableCell>Motif</TableCell>
                        <TableCell>Justification</TableCell>
                        <TableCell>Utilisateur</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                      {pertes.map((perte) => {
                        const medicament = medicaments.find(med => med.id === perte.medicamentId);
                        return (
                          <TableRow key={perte.id}>
                            <TableCell>
                              {new Date(perte.datePerte).toLocaleDateString()}
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
                              <Typography variant="body2">
                                {perte.quantite} {medicament?.unite}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {perte.motif}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {perte.justification}
                              </Typography>
                            </TableCell>
                            <TableCell>
          <Typography variant="body2">
                                {perte.utilisateur}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={perte.statut}
                                color={
                                  perte.statut === 'validé' ? 'success' : 
                                  perte.statut === 'refusé' ? 'error' : 'warning'
                                }
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
                                {perte.statut === 'déclaré' && (
                                  <>
                                    <Tooltip title="Valider">
                                      <IconButton size="small" color="success">
                                        <CheckCircle />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Refuser">
                                      <IconButton size="small" color="error">
                                        <ReportProblem />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
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

        {/* Onglet Rapports */}
        {activeTab === 6 && (
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
                        startIcon={<ReportProblem />}
                        onClick={() => setOpenRapport(true)}
                      >
                        Pertes et Corrections
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Inventory />}
                        onClick={() => setOpenRapport(true)}
                      >
                        Stock Disponible
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Undo />}
                        onClick={() => setOpenRapport(true)}
                      >
                        Retours vers Gros
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
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {stats.totalMedicaments}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Médicaments en Stock
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {dispensations.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Dispensations Total
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {retours.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Retours Total
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="error.main">
                            {pertes.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Pertes Total
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
        {activeTab === 7 && (
          <SystemeAlertes />
        )}

        {/* Onglet Synchronisation */}
        {activeTab === 8 && (
          <SynchronisationStocks />
        )}

        {/* Dialogs */}
        {/* Nouvelle Dispensation Wizard */}
        <NouvelleDispensationWizard
          open={openDispensation}
          onClose={() => setOpenDispensation(false)}
          onSuccess={handleDispensationSuccess}
          utilisateurId="current-user-id" // TODO: Récupérer depuis le contexte d'authentification
          utilisateurNom="Pharmacien/Infirmier"
        />

        {/* Dialog Déclarer Retour */}
        <Dialog open={openRetour} onClose={() => setOpenRetour(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Déclarer Retour vers Magasin Gros</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Médicament</InputLabel>
                  <Select
                    value={retourForm.medicamentId}
                    onChange={(e) => setRetourForm(prev => ({ ...prev, medicamentId: e.target.value }))}
                    label="Médicament"
                  >
                    {medicaments.map(med => (
                      <MenuItem key={med.id} value={med.id}>
                        {med.nom} - Stock: {med.quantiteRestante} {med.unite}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantité à retourner"
                  type="number"
                  value={retourForm.quantite}
                  onChange={(e) => setRetourForm(prev => ({ ...prev, quantite: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date de retour"
                  type="date"
                  value={retourForm.dateRetour}
                  onChange={(e) => setRetourForm(prev => ({ ...prev, dateRetour: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motif du retour"
                  multiline
                  rows={3}
                  value={retourForm.motif}
                  onChange={(e) => setRetourForm(prev => ({ ...prev, motif: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRetour(false)}>Annuler</Button>
            <Button onClick={handleRetour} variant="contained">
              Déclarer Retour
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Déclarer Perte */}
        <Dialog open={openPerte} onClose={() => setOpenPerte(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Déclarer Perte - Magasin Détail</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Médicament</InputLabel>
                  <Select
                    value={perteForm.medicamentId}
                    onChange={(e) => setPerteForm(prev => ({ ...prev, medicamentId: e.target.value }))}
                    label="Médicament"
                  >
                    {medicaments.map(med => (
                      <MenuItem key={med.id} value={med.id}>
                        {med.nom} - Stock: {med.quantiteRestante} {med.unite}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantité perdue"
                  type="number"
                  value={perteForm.quantite}
                  onChange={(e) => setPerteForm(prev => ({ ...prev, quantite: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date de perte"
                  type="date"
                  value={perteForm.datePerte}
                  onChange={(e) => setPerteForm(prev => ({ ...prev, datePerte: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motif de la perte"
                  value={perteForm.motif}
                  onChange={(e) => setPerteForm(prev => ({ ...prev, motif: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Justification (obligatoire)"
                  multiline
                  rows={3}
                  value={perteForm.justification}
                  onChange={(e) => setPerteForm(prev => ({ ...prev, justification: e.target.value }))}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPerte(false)}>Annuler</Button>
            <Button onClick={handlePerte} variant="contained">
              Déclarer Perte
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Rapport */}
        <Dialog open={openRapport} onClose={() => setOpenRapport(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Générer Rapport - Magasin Détail</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Fonctionnalité de génération de rapport en cours de développement.
              Cette fonction permettra de créer des rapports détaillés sur :
              <ul>
                <li>Consommation des médicaments par patient ou service</li>
                <li>Pertes et corrections effectuées</li>
                <li>Suivi des stocks restants disponibles</li>
              </ul>
          </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRapport(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
    </Container>
  );
};

export default Pharmacie; 
