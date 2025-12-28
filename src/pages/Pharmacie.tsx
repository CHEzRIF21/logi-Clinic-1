import React, { useState, useMemo, useCallback, memo } from 'react';
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
  Skeleton,
  Pagination,
  Stack,
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
  Person,
  MedicalServices,
  Assignment,
  CheckCircle,
  ErrorOutline,
} from '@mui/icons-material';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import SystemeAlertes from '../components/stock/SystemeAlertes';
import GestionTransferts from '../components/stock/GestionTransferts';
import GestionInventaire from '../components/stock/GestionInventaire';
import NouvelleDispensationWizard from '../components/pharmacy/NouvelleDispensationWizard';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { useStockData } from '../hooks/useStockData';
import { useDispensations } from '../hooks/useDispensations';

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

// Composant Skeleton pour le chargement
const SkeletonTableRow = memo(() => (
  <TableRow>
    {[...Array(7)].map((_, i) => (
      <TableCell key={i}>
        <Skeleton variant="text" width="100%" />
      </TableCell>
    ))}
  </TableRow>
));
SkeletonTableRow.displayName = 'SkeletonTableRow';

const Pharmacie: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [notification, setNotification] = useState<{open: boolean; message: string; type: 'success' | 'error' | 'info'}>({
    open: false, message: '', type: 'info'
  });

  // Utilisation des hooks optimisés
  const { data: stockData, loading: stockLoading, stats: stockStats, refetch: refetchStock } = useStockData({
    magasin: 'detail',
    autoRefresh: true
  });

  const {
    dispensations,
    loading: dispensationsLoading,
    stats: dispensationsStats,
    pagination,
    searchTerm,
    setSearchTerm,
    refetch: refetchDispensations,
    goToPage,
    nextPage,
    previousPage
  } = useDispensations({
    pageSize: 20,
    autoRefresh: true
  });

  // Navigation mémorisée
  const goToStockMedicaments = useCallback(() => navigate('/stock-medicaments'), [navigate]);
  const goToConsultations = useCallback(() => navigate('/consultations'), [navigate]);
  const goToCaisse = useCallback(() => navigate('/caisse'), [navigate]);

  // Fonction utilitaire pour les notifications
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ open: true, message, type });
  }, []);
  
  // États pour les dialogs
  const [openDispensation, setOpenDispensation] = useState(false);
  const [openRapport, setOpenRapport] = useState(false);
  const [selectedMedicament, setSelectedMedicament] = useState<MedicamentDetail | null>(null);

  // Conversion des données du hook en format local
  const medicaments = useMemo(() => {
    if (!stockData?.medicaments) return [];
    return stockData.medicaments.map(med => ({
      id: med.id,
      code: med.code,
      nom: med.nom,
      dci: med.dci || '',
      forme: med.forme || '',
      dosage: med.dosage || '',
      unite: med.unite || 'Unité',
      quantiteRecue: med.quantiteStock || 0,
      quantiteDispensée: 0, // À calculer depuis les dispensations si nécessaire
      quantiteRestante: med.quantiteStock || 0,
      seuilMinimum: med.seuilMinimum || 20,
      prixUnitaire: med.prixUnitaire || 0,
      emplacement: med.emplacement || '',
      observations: med.observations || ''
    }));
  }, [stockData]);

  // Statistiques mémorisées
  const stats = useMemo(() => ({
    totalMedicaments: stockStats.totalMedicaments,
    totalStock: stockStats.totalStock,
    valeurStock: stockStats.valeurStock,
    stockFaible: stockStats.stockFaible,
    dispensationsAujourdhui: dispensationsStats.aujourdhui,
    alertesActives: stockStats.alertesActives
  }), [stockStats, dispensationsStats]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  const handleDispensationSuccess = useCallback(() => {
    showNotification('Dispensation enregistrée avec succès !', 'success');
    refetchStock();
    refetchDispensations();
  }, [showNotification, refetchStock, refetchDispensations]);

  const getDispensationsByMedicament = useCallback((medicamentId: string) => {
    return dispensations.filter(disp => disp.medicamentId === medicamentId);
  }, [dispensations]);

  const loading = stockLoading || dispensationsLoading;

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
        <GlassCard sx={{ mb: 3, width: '100%', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                width: '100%',
                '& .MuiTabs-scrollButtons': {
                  '&.Mui-disabled': { opacity: 0.3 }
                },
                '& .MuiTab-root': {
                  minHeight: 64,
                  py: 2,
                  px: 2,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&.Mui-selected': {
                    fontWeight: 600,
                    color: 'primary.main',
                  }
                }
              }}
            >
              <Tab icon={<Dashboard />} label="Tableau de Bord" iconPosition="start" />
              <Tab icon={<Store />} label="Stock Détail" iconPosition="start" />
              <Tab icon={<MedicalServices />} label="Dispensations" iconPosition="start" />
              <Tab icon={<LocalShipping />} label="Ravitaillement" iconPosition="start" />
              <Tab icon={<Assignment />} label="Inventaire" iconPosition="start" />
              <Tab icon={<Assessment />} label="Rapports" iconPosition="start" />
              <Tab icon={<Notifications />} label="Alertes" iconPosition="start" />
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
                        {loading ? (
                          <Skeleton variant="text" width={60} height={40} />
                        ) : (
                          <Typography variant="h4">{stats.dispensationsAujourdhui}</Typography>
                        )}
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
                        {loading ? (
                          <Skeleton variant="text" width={60} height={40} />
                        ) : (
                          <Typography variant="h4">{pagination.total}</Typography>
                        )}
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

            {/* Accès rapide aux modules liés */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Accès Rapide aux Modules Liés
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Inventory />}
                    onClick={goToStockMedicaments}
                    size="medium"
                  >
                    Module Stock (Magasin Gros)
                  </Button>
                  <Button
                    variant="outlined"
                    color="info"
                    startIcon={<MedicalServices />}
                    onClick={goToConsultations}
                    size="medium"
                  >
                    Consultations / Prescriptions
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<AttachMoney />}
                    onClick={goToCaisse}
                    size="medium"
                  >
                    Caisse / Facturation
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
                      onClick={() => {
                        refetchStock();
                        refetchDispensations();
                      }}
                      disabled={loading}
                    >
                      {loading ? 'Chargement...' : 'Actualiser'}
                    </Button>
                  </Box>
                </Box>
                
                {loading ? (
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
                        {[...Array(5)].map((_, i) => (
                          <SkeletonTableRow key={i} />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
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
                        {medicaments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                Aucun médicament en stock
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          medicaments.map((medicament) => {
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
                                        onClick={() => setOpenDispensation(true)}
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
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
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
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sx={{ width: 250 }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setOpenDispensation(true)}
                    >
                      Nouvelle Dispensation
                    </Button>
                  </Box>
                </Box>
                
                {dispensationsLoading ? (
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
                        {[...Array(5)].map((_, i) => (
                          <SkeletonTableRow key={i} />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <>
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
                          {dispensations.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} align="center">
                                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                  Aucune dispensation trouvée
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            dispensations.map((dispensation) => {
                              const medicament = medicaments.find(med => med.id === dispensation.medicamentId);
                              return (
                                <TableRow key={dispensation.id}>
                                  <TableCell>
                                    {new Date(dispensation.dateDispensation).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" fontWeight="bold">
                                        {medicament?.nom || 'Médicament inconnu'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {medicament?.code}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2">
                                        {dispensation.patientNom || dispensation.serviceNom || 'N/A'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {dispensation.patientId ? 'Patient' : 'Service'}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {dispensation.quantite} {medicament?.unite || ''}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {dispensation.motif}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {dispensation.prescripteur || 'N/A'}
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
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {pagination.totalPages > 1 && (
                      <Stack spacing={2} sx={{ mt: 2, alignItems: 'center' }}>
                        <Pagination
                          count={pagination.totalPages}
                          page={pagination.page}
                          onChange={(_, page) => goToPage(page)}
                          color="primary"
                          showFirstButton
                          showLastButton
                        />
                        <Typography variant="body2" color="text.secondary">
                          Page {pagination.page} sur {pagination.totalPages} ({pagination.total} dispensations)
                        </Typography>
                      </Stack>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Onglet Ajustement */}
        {activeTab === 3 && (
          <GestionTransferts context="pharmacie" />
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
                          {loading ? (
                            <Skeleton variant="text" width={60} height={40} sx={{ mx: 'auto' }} />
                          ) : (
                            <Typography variant="h4" color="success.main">
                              {pagination.total}
                            </Typography>
                          )}
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
