import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Grid,
  Paper,
  Alert,
  Tooltip,
  Button,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  LocalShipping,
  CheckCircle,
  Cancel,
  Warning,
  Assignment,
  Inventory,
  Store,
  Person,
  DateRange,
  Description,
  Refresh,
  Print,
  Download,
} from '@mui/icons-material';
import { StockService } from '../../services/stockService';
import { TransfertSupabase, TransfertLigneSupabase, LotSupabase, MedicamentSupabase } from '../../services/stockSupabase';
import { supabase } from '../../services/supabase';

// Types pour les transferts
interface Transfert {
  id: string;
  numeroTransfert: string;
  medicamentId: string;
  medicamentNom: string;
  medicamentCode: string;
  quantite: number;
  dateDemande: Date;
  dateValidation?: Date;
  dateReception?: Date;
  statut: 'en_attente' | 'valide' | 'en_cours' | 'reçu' | 'annulé';
  origine: 'magasin_gros';
  destination: 'magasin_detail';
  demandeur: string;
  validateur?: string;
  recepteur?: string;
  motif: string;
  observations?: string;
  stockGrosAvant: number;
  stockGrosApres: number;
  stockDetailAvant: number;
  stockDetailApres: number;
}

interface DemandeTransfert {
  id: string;
  medicamentId: string;
  quantiteDemandee: number;
  motif: string;
  demandeur: string;
  dateDemande: Date;
  statut: 'en_attente' | 'approuvee' | 'rejetee';
  priorite: 'normale' | 'urgente' | 'critique';
}

const GestionTransferts: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [openDemande, setOpenDemande] = useState(false);
  const [openValidation, setOpenValidation] = useState(false);
  const [openReception, setOpenReception] = useState(false);
  const [selectedTransfert, setSelectedTransfert] = useState<any>(null);
  const [selectedDemande, setSelectedDemande] = useState<DemandeTransfert | null>(null);
  const [loading, setLoading] = useState(false);

  // Données réelles
  const [transferts, setTransferts] = useState<TransfertSupabase[]>([]);
  const [lots, setLots] = useState<LotSupabase[]>([]);
  const [medicaments, setMedicaments] = useState<MedicamentSupabase[]>([]);

  // États pour les formulaires
  const [demandeForm, setDemandeForm] = useState({
    medicament_id: '',
    lot_id: '',
    quantite_demandee: 0,
    motif: '',
    observations: '',
    priorite: 'normale'
  });

  const [validationForm, setValidationForm] = useState({
    observations: '',
    quantite_validee: 0
  });

  const [receptionForm, setReceptionForm] = useState({
    observations: '',
    quantite_recue: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transfertsData, lotsData, medicamentsData] = await Promise.all([
        StockService.getTransfertsEnCours(),
        StockService.getLotsByMagasin('gros'),
        supabase.from('medicaments').select('*')
      ]);
      
      setTransferts(transfertsData || []);
      setLots(lotsData || []);
      setMedicaments(medicamentsData.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Données de démonstration
  const demandesDemo: DemandeTransfert[] = [
    {
      id: '1',
      medicamentId: '1',
      quantiteDemandee: 50,
      motif: 'Stock faible - besoin urgent pour consultations',
      demandeur: 'Pharmacien Principal',
      dateDemande: new Date('2024-07-20'),
      statut: 'en_attente',
      priorite: 'urgente'
    },
    {
      id: '2',
      medicamentId: '2',
      quantiteDemandee: 20,
      motif: 'Approvisionnement régulier',
      demandeur: 'Infirmier Pharmacie',
      dateDemande: new Date('2024-07-21'),
      statut: 'approuvee',
      priorite: 'normale'
    }
  ];

  const transfertsDemo: Transfert[] = [
    {
      id: '1',
      numeroTransfert: 'TR-2024-001',
      medicamentId: '1',
      medicamentNom: 'Paracétamol 500mg',
      medicamentCode: 'MED-001',
      quantite: 50,
      dateDemande: new Date('2024-07-20'),
      dateValidation: new Date('2024-07-20'),
      dateReception: new Date('2024-07-21'),
      statut: 'reçu',
      origine: 'magasin_gros',
      destination: 'magasin_detail',
      demandeur: 'Pharmacien Principal',
      validateur: 'Responsable Centre',
      recepteur: 'Pharmacien Principal',
      motif: 'Stock faible - besoin urgent pour consultations',
      observations: 'Transfert validé et réceptionné',
      stockGrosAvant: 800,
      stockGrosApres: 750,
      stockDetailAvant: 150,
      stockDetailApres: 200
    },
    {
      id: '2',
      numeroTransfert: 'TR-2024-002',
      medicamentId: '2',
      medicamentNom: 'Amoxicilline 1g',
      medicamentCode: 'MED-002',
      quantite: 20,
      dateDemande: new Date('2024-07-21'),
      dateValidation: new Date('2024-07-21'),
      statut: 'en_cours',
      origine: 'magasin_gros',
      destination: 'magasin_detail',
      demandeur: 'Infirmier Pharmacie',
      validateur: 'Responsable Centre',
      motif: 'Approvisionnement régulier',
      stockGrosAvant: 150,
      stockGrosApres: 130,
      stockDetailAvant: 25,
      stockDetailApres: 45
    }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateDemande = async () => {
    try {
      setLoading(true);
      await StockService.creerDemandeTransfert({
        ...demandeForm,
        utilisateur_demandeur_id: 'current-user-id' // À remplacer par l'ID utilisateur réel
      });
      
      setOpenDemande(false);
      setDemandeForm({
        medicament_id: '',
        lot_id: '',
        quantite_demandee: 0,
        motif: '',
        observations: '',
        priorite: 'normale'
      });
      
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateTransfert = async () => {
    if (!selectedTransfert) return;
    
    try {
      setLoading(true);
      await StockService.validerTransfert(selectedTransfert.id, 'current-user-id');
      
      setOpenValidation(false);
      setValidationForm({
        observations: '',
        quantite_validee: 0
      });
      setSelectedTransfert(null);
      
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la validation du transfert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveTransfert = async () => {
    if (!selectedTransfert) return;
    
    try {
      setLoading(true);
      // Ici on pourrait ajouter une méthode pour marquer le transfert comme reçu
      // Pour l'instant, on simule la réception
      console.log('Transfert reçu:', receptionForm);
      
      setOpenReception(false);
      setReceptionForm({
        observations: '',
        quantite_recue: 0
      });
      setSelectedTransfert(null);
      
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la réception du transfert:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'warning';
      case 'valide': return 'info';
      case 'en_cours': return 'primary';
      case 'reçu': return 'success';
      case 'annulé': return 'error';
      default: return 'default';
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'critique': return 'error';
      case 'urgente': return 'warning';
      case 'normale': return 'success';
      default: return 'default';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en_attente': return <Warning />;
      case 'valide': return <CheckCircle />;
      case 'en_cours': return <LocalShipping />;
      case 'reçu': return <Inventory />;
      case 'annulé': return <Cancel />;
      default: return <Assignment />;
    }
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestion des Ajustements
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ajustements de stock et bons de commande
        </Typography>
      </Box>

      {/* Navigation par onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, width: '100%' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              minHeight: 56,
              py: 1.5,
              px: 2,
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              '&.Mui-selected': { fontWeight: 600 }
            }
          }}
        >
          <Tab icon={<Assignment />} label="Demandes" iconPosition="start" />
          <Tab icon={<LocalShipping />} label="Ajustements" iconPosition="start" />
          <Tab icon={<Inventory />} label="Réception" iconPosition="start" />
          <Tab icon={<Description />} label="Historique" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      {activeTab === 0 && (
        <Box>
          {/* Demande de transfert */}
          <Card sx={{ mb: 3 }}>
        <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
                  Commande - Bon de Ravitaillement
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
                  onClick={() => setOpenDemande(true)}
            >
                  Nouvelle Commande
            </Button>
          </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Processus :</strong> Le pharmacien/infirmier identifie un besoin et crée un bon de commande 
                  pour se ravitailler. Le responsable valide et génère le bon de commande.
                </Typography>
              </Alert>

              <TableContainer>
                <Table>
              <TableHead>
                <TableRow>
                      <TableCell>Médicament</TableCell>
                      <TableCell>Quantité Demandée</TableCell>
                      <TableCell>Motif</TableCell>
                      <TableCell>Demandeur</TableCell>
                  <TableCell>Date</TableCell>
                      <TableCell>Priorité</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                    {demandesDemo.map((demande) => (
                      <TableRow key={demande.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            Paracétamol 500mg
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            MED-001
                          </Typography>
                        </TableCell>
                      <TableCell>
                          <Typography variant="body2">
                            {demande.quantiteDemandee} unités
                          </Typography>
                      </TableCell>
                      <TableCell>
                          <Typography variant="body2">
                            {demande.motif}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                            {demande.demandeur}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                            {demande.dateDemande.toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                            label={demande.priorite}
                            color={getPrioriteColor(demande.priorite)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={demande.statut}
                            color={getStatutColor(demande.statut)}
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
                            {demande.statut === 'en_attente' && (
                              <>
                                <Tooltip title="Approuver">
                                  <IconButton size="small" color="success">
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Rejeter">
                                  <IconButton size="small" color="error">
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {/* Transferts en cours */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ajustements en Cours
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Transfert</TableCell>
                      <TableCell>Médicament</TableCell>
                      <TableCell>Quantité</TableCell>
                      <TableCell>Date Demande</TableCell>
                      <TableCell>Validateur</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transfertsDemo
                      .filter(t => t.statut === 'en_cours' || t.statut === 'valide')
                      .map((transfert) => (
                        <TableRow key={transfert.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {transfert.numeroTransfert}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {transfert.medicamentNom}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {transfert.medicamentCode}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transfert.quantite} unités
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transfert.dateDemande.toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transfert.validateur}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getStatutIcon(transfert.statut)}
                              <Chip
                                label={transfert.statut}
                                color={getStatutColor(transfert.statut)}
                                size="small"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Voir détails">
                            <IconButton
                              size="small"
                                  onClick={() => setSelectedTransfert(transfert)}
                            >
                                  <Visibility />
                            </IconButton>
                              </Tooltip>
                              {transfert.statut === 'valide' && (
                                <Tooltip title="Réceptionner">
                            <IconButton
                              size="small"
                                    color="success"
                                    onClick={() => {
                                      setSelectedTransfert(transfert);
                                      setOpenReception(true);
                                    }}
                                  >
                                    <Inventory />
                            </IconButton>
                                </Tooltip>
                              )}
                          </Box>
                      </TableCell>
                    </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          {/* Réception des transferts */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Réception des Ajustements - Magasin Détail
                </Typography>
                <Chip 
                  icon={<LocalShipping />} 
                  label="Sens unique : Magasin Gros → Magasin Détail" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Processus :</strong> Le pharmacien/infirmier réceptionne les transferts 
                  validés depuis le Magasin Gros et confirme l'entrée en stock du Magasin Détail.
                  <br />
                  <strong>⚠️ Important :</strong> Les transferts sont à sens unique (Gros → Détail). Cliquez sur "Confirmer Réception" pour valider chaque ajustement.
                </Typography>
              </Alert>

              <TableContainer component={Paper} elevation={2}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.light' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>N° Transfert</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Médicament</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Quantité</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Date Validation</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Statut</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Action de Réception</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transfertsDemo
                      .filter(t => t.statut === 'valide' || t.statut === 'reçu')
                      .map((transfert) => (
                        <TableRow 
                          key={transfert.id}
                          sx={{ 
                            '&:hover': { backgroundColor: 'action.hover' },
                            backgroundColor: transfert.statut === 'valide' ? 'warning.light' : 'inherit'
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {transfert.numeroTransfert}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {transfert.medicamentNom}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {transfert.medicamentCode}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                              {transfert.quantite} unités
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transfert.dateValidation?.toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transfert.statut === 'valide' ? 'En attente de réception' : 'Réceptionné'}
                              color={transfert.statut === 'valide' ? 'warning' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {transfert.statut === 'valide' ? (
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  startIcon={<CheckCircle />}
                                  onClick={() => {
                                    setSelectedTransfert(transfert);
                                    setOpenReception(true);
                                  }}
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  Confirmer Réception
                                </Button>
                              ) : (
                                <Chip
                                  icon={<CheckCircle />}
                                  label="Réception confirmée"
                                  color="success"
                                  variant="outlined"
                                  size="small"
                                />
                              )}
                              <Tooltip title="Voir détails">
                                <IconButton
                                  size="small"
                                  onClick={() => setSelectedTransfert(transfert)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {transfertsDemo.filter(t => t.statut === 'valide').length === 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    ✅ Tous les ajustements ont été réceptionnés. Aucun transfert en attente.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          {/* Historique des transferts */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Historique des Ajustements
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" startIcon={<Print />}>
                    Imprimer
                  </Button>
                  <Button variant="outlined" startIcon={<Download />}>
                    Exporter
                  </Button>
                </Box>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Transfert</TableCell>
                      <TableCell>Médicament</TableCell>
                      <TableCell>Quantité</TableCell>
                      <TableCell>Date Demande</TableCell>
                      <TableCell>Date Réception</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transfertsDemo.map((transfert) => (
                      <TableRow key={transfert.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {transfert.numeroTransfert}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {transfert.medicamentNom}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {transfert.medicamentCode}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transfert.quantite} unités
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transfert.dateDemande.toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transfert.dateReception?.toLocaleDateString() || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transfert.statut}
                            color={getStatutColor(transfert.statut)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Voir détails">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedTransfert(transfert)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
        </Box>
      )}

      {/* Dialogs */}
      {/* Dialog Nouvelle Demande - Ne se ferme qu'avec les boutons Annuler/Valider */}
      <Dialog 
        open={openDemande} 
        onClose={(event, reason) => {
          // Empêcher la fermeture par clic extérieur ou touche Escape
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setOpenDemande(false);
          }
        }} 
        disableEscapeKeyDown
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Nouvelle Commande de Ravitaillement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={medicaments}
                getOptionLabel={(option) => `${option.nom} ${option.dosage || ''} (${option.code || ''})`}
                value={medicaments.find(m => m.id === demandeForm.medicament_id) || null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    setDemandeForm(prev => ({ ...prev, medicament_id: newValue.id }));
                  } else {
                    setDemandeForm(prev => ({ ...prev, medicament_id: '' }));
                  }
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.nom} {option.dosage || ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.code} • {option.forme || ''}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Médicament"
                    placeholder="Sélectionner un médicament"
                    required
                  />
                )}
                ListboxProps={{
                  style: { maxHeight: 300 }
                }}
                noOptionsText="Aucun médicament trouvé"
                openOnFocus
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantité demandée"
                type="number"
                value={demandeForm.quantite_demandee}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setDemandeForm(prev => ({ ...prev, quantite_demandee: value }));
                }}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priorité</InputLabel>
                <Select
                  value={demandeForm.priorite}
                  onChange={(e) => setDemandeForm(prev => ({ ...prev, priorite: e.target.value }))}
                  label="Priorité"
                >
                  <MenuItem value="normale">Normale</MenuItem>
                  <MenuItem value="urgente">Urgente</MenuItem>
                  <MenuItem value="critique">Critique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motif de la demande"
                multiline
                rows={3}
                value={demandeForm.motif}
                onChange={(e) => setDemandeForm(prev => ({ ...prev, motif: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDemande(false)}>Annuler</Button>
          <Button onClick={handleCreateDemande} variant="contained">
            Créer Demande
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Validation - Ne se ferme qu'avec les boutons */}
      <Dialog 
        open={openValidation} 
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setOpenValidation(false);
          }
        }}
        disableEscapeKeyDown
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Valider le Transfert</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="warning">
                Vérifiez la disponibilité du stock avant de valider ce transfert.
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantité validée"
                type="number"
                value={validationForm.quantite_validee}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setValidationForm(prev => ({ ...prev, quantite_validee: value }));
                }}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations"
                multiline
                rows={3}
                value={validationForm.observations}
                onChange={(e) => setValidationForm(prev => ({ ...prev, observations: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenValidation(false)}>Annuler</Button>
          <Button onClick={handleValidateTransfert} variant="contained" color="success">
            Valider Transfert
              </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Réception - Ne se ferme qu'avec les boutons */}
      <Dialog 
        open={openReception} 
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setOpenReception(false);
          }
        }}
        disableEscapeKeyDown
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Réceptionner le Transfert</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                Vérifiez la quantité reçue et mettez à jour le stock du Magasin Détail.
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantité reçue"
                type="number"
                value={receptionForm.quantite_recue}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setReceptionForm(prev => ({ ...prev, quantite_recue: value }));
                }}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations"
                multiline
                rows={3}
                value={receptionForm.observations}
                onChange={(e) => setReceptionForm(prev => ({ ...prev, observations: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReception(false)}>Annuler</Button>
          <Button onClick={handleReceiveTransfert} variant="contained" color="success">
            Réceptionner
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Détails du Transfert */}
      <Dialog 
        open={selectedTransfert !== null} 
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setSelectedTransfert(null);
          }
        }}
        disableEscapeKeyDown
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Détails du Transfert - {selectedTransfert?.numeroTransfert}
        </DialogTitle>
        <DialogContent>
          {selectedTransfert && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Informations Générales
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Médicament:</strong> {selectedTransfert.medicamentNom}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Code:</strong> {selectedTransfert.medicamentCode}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Quantité:</strong> {selectedTransfert.quantite} unités
                      </Typography>
                      <Typography variant="body2">
                        <strong>Motif:</strong> {selectedTransfert.motif}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Impact sur les Stocks
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Stock Gros avant:</strong> {selectedTransfert.stockGrosAvant}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Stock Gros après:</strong> {selectedTransfert.stockGrosApres}
              </Typography>
                        <Typography variant="body2">
                        <strong>Stock Détail avant:</strong> {selectedTransfert.stockDetailAvant}
                        </Typography>
                      <Typography variant="body2">
                        <strong>Stock Détail après:</strong> {selectedTransfert.stockDetailApres}
                        </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTransfert(null)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionTransferts;