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
  Grid,
  Paper,
  Alert,
  Tooltip,
  Button,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Sync,
  CheckCircle,
  Warning,
  Error,
  Refresh,
  Visibility,
  LocalShipping,
  Inventory,
  Store,
  TrendingUp,
  TrendingDown,
  DragHandle,
} from '@mui/icons-material';

// Types pour la synchronisation
interface SynchronisationStock {
  id: string;
  medicamentId: string;
  medicamentNom: string;
  medicamentCode: string;
  stockGros: number;
  stockDetail: number;
  difference: number;
  statut: 'synchronise' | 'desynchronise' | 'en_cours';
  derniereSynchronisation: Date;
  mouvementsEnAttente: number;
}

interface MouvementSynchronisation {
  id: string;
  type: 'transfert' | 'dispensation' | 'retour' | 'perte' | 'reception';
  medicamentId: string;
  quantite: number;
  date: Date;
  origine: 'gros' | 'detail';
  destination?: 'gros' | 'detail';
  statut: 'en_attente' | 'synchronise' | 'erreur';
  description: string;
}

const SynchronisationStocks: React.FC = () => {
  const [synchronisations, setSynchronisations] = useState<SynchronisationStock[]>([]);
  const [mouvements, setMouvements] = useState<MouvementSynchronisation[]>([]);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedMedicament, setSelectedMedicament] = useState<SynchronisationStock | null>(null);
  const [isSynchronizing, setIsSynchronizing] = useState(false);

  // Données de démonstration
  const synchronisationsDemo: SynchronisationStock[] = [
    {
      id: '1',
      medicamentId: '1',
      medicamentNom: 'Paracétamol 500mg',
      medicamentCode: 'MED-001',
      stockGros: 750,
      stockDetail: 200,
      difference: 0,
      statut: 'synchronise',
      derniereSynchronisation: new Date('2024-07-21T10:30:00'),
      mouvementsEnAttente: 0
    },
    {
      id: '2',
      medicamentId: '2',
      medicamentNom: 'Amoxicilline 1g',
      medicamentCode: 'MED-002',
      stockGros: 130,
      stockDetail: 45,
      difference: 0,
      statut: 'synchronise',
      derniereSynchronisation: new Date('2024-07-21T10:30:00'),
      mouvementsEnAttente: 0
    },
    {
      id: '3',
      medicamentId: '3',
      medicamentNom: 'Ibuprofène 400mg',
      medicamentCode: 'MED-003',
      stockGros: 20,
      stockDetail: 15,
      difference: 5,
      statut: 'desynchronise',
      derniereSynchronisation: new Date('2024-07-20T14:15:00'),
      mouvementsEnAttente: 2
    }
  ];

  const mouvementsDemo: MouvementSynchronisation[] = [
    {
      id: '1',
      type: 'transfert',
      medicamentId: '3',
      quantite: 20,
      date: new Date('2024-07-21T09:00:00'),
      origine: 'gros',
      destination: 'detail',
      statut: 'en_attente',
      description: 'Transfert validé - en attente de réception'
    },
    {
      id: '2',
      type: 'dispensation',
      medicamentId: '3',
      quantite: 5,
      date: new Date('2024-07-21T11:30:00'),
      origine: 'detail',
      statut: 'en_attente',
      description: 'Dispensation patient - mise à jour en cours'
    },
    {
      id: '3',
      type: 'retour',
      medicamentId: '1',
      quantite: 10,
      date: new Date('2024-07-21T08:45:00'),
      origine: 'detail',
      destination: 'gros',
      statut: 'synchronise',
      description: 'Retour vers Magasin Gros - synchronisé'
    }
  ];

  useEffect(() => {
    setSynchronisations(synchronisationsDemo);
    setMouvements(mouvementsDemo);
  }, []);

  const handleSynchronize = async () => {
    setIsSynchronizing(true);
    
    // Simulation de la synchronisation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mise à jour des statuts
    setSynchronisations(prev => prev.map(sync => ({
      ...sync,
      statut: 'synchronise' as const,
      derniereSynchronisation: new Date(),
      mouvementsEnAttente: 0
    })));
    
    setMouvements(prev => prev.map(mouvement => ({
      ...mouvement,
      statut: 'synchronise' as const
    })));
    
    setIsSynchronizing(false);
  };

  const handleViewDetails = (synchronisation: SynchronisationStock) => {
    setSelectedMedicament(synchronisation);
    setOpenDetails(true);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'synchronise': return 'success';
      case 'desynchronise': return 'error';
      case 'en_cours': return 'warning';
      default: return 'default';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'synchronise': return <CheckCircle />;
      case 'desynchronise': return <Error />;
      case 'en_cours': return <Sync />;
      default: return <Warning />;
    }
  };

  const getMouvementIcon = (type: string) => {
    switch (type) {
      case 'transfert': return <LocalShipping />;
      case 'dispensation': return <Inventory />;
      case 'retour': return <TrendingUp />;
      case 'perte': return <Warning />;
      case 'reception': return <Store />;
      default: return <Sync />;
    }
  };

  const getDifferenceIcon = (difference: number) => {
    if (difference > 0) return <TrendingUp color="success" />;
    if (difference < 0) return <TrendingDown color="error" />;
    return <DragHandle color="info" />;
  };

  const stats = {
    total: synchronisations.length,
    synchronises: synchronisations.filter(s => s.statut === 'synchronise').length,
    desynchronises: synchronisations.filter(s => s.statut === 'desynchronise').length,
    mouvementsEnAttente: mouvements.filter(m => m.statut === 'en_attente').length
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Synchronisation des Stocks
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Synchronisation automatique entre Magasin Gros et Magasin Détail
        </Typography>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Médicaments Suivis
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {stats.synchronises}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Synchronisés
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {stats.desynchronises}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Désynchronisés
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {stats.mouvementsEnAttente}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mouvements en Attente
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Actions de synchronisation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Actions de Synchronisation
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Sync />}
                onClick={handleSynchronize}
                disabled={isSynchronizing}
              >
                {isSynchronizing ? 'Synchronisation...' : 'Synchroniser Tout'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => window.location.reload()}
              >
                Actualiser
              </Button>
            </Box>
          </Box>

          {isSynchronizing && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Synchronisation en cours...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Principe :</strong> La synchronisation maintient la cohérence entre les stocks 
              du Magasin Gros et du Magasin Détail. Chaque mouvement est automatiquement 
              répercuté sur les deux entités.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Tableau de synchronisation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            État de Synchronisation par Médicament
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Médicament</TableCell>
                  <TableCell>Stock Gros</TableCell>
                  <TableCell>Stock Détail</TableCell>
                  <TableCell>Différence</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Dernière Sync</TableCell>
                  <TableCell>Mouvements</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {synchronisations.map((sync) => (
                  <TableRow key={sync.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {sync.medicamentNom}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sync.medicamentCode}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {sync.stockGros} unités
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {sync.stockDetail} unités
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getDifferenceIcon(sync.difference)}
                        <Typography variant="body2">
                          {sync.difference > 0 ? `+${sync.difference}` : sync.difference}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatutIcon(sync.statut)}
                        <Chip
                          label={sync.statut}
                          color={getStatutColor(sync.statut)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {sync.derniereSynchronisation.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sync.mouvementsEnAttente}
                        color={sync.mouvementsEnAttente > 0 ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Voir détails">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(sync)}
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

      {/* Mouvements en attente */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Mouvements en Attente de Synchronisation
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Médicament</TableCell>
                  <TableCell>Quantité</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Origine</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mouvements.map((mouvement) => (
                  <TableRow key={mouvement.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getMouvementIcon(mouvement.type)}
                        <Typography variant="body2">
                          {mouvement.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Paracétamol 500mg
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {mouvement.quantite} unités
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {mouvement.date.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={mouvement.origine}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {mouvement.destination ? (
                        <Chip
                          label={mouvement.destination}
                          color="secondary"
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={mouvement.statut}
                        color={mouvement.statut === 'synchronise' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {mouvement.description}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog Détails de Synchronisation */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Détails de Synchronisation - {selectedMedicament?.medicamentNom}
        </DialogTitle>
        <DialogContent>
          {selectedMedicament && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      État Actuel des Stocks
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Stock Gros:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedMedicament.stockGros} unités
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Stock Détail:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedMedicament.stockDetail} unités
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Différence:</Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={selectedMedicament.difference > 0 ? 'success.main' : 'error.main'}
                        >
                          {selectedMedicament.difference > 0 ? `+${selectedMedicament.difference}` : selectedMedicament.difference}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Informations de Synchronisation
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Statut:</Typography>
                        <Chip
                          label={selectedMedicament.statut}
                          color={getStatutColor(selectedMedicament.statut)}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Dernière Sync:</Typography>
                        <Typography variant="body2">
                          {selectedMedicament.derniereSynchronisation.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Mouvements en Attente:</Typography>
                        <Chip
                          label={selectedMedicament.mouvementsEnAttente}
                          color={selectedMedicament.mouvementsEnAttente > 0 ? 'warning' : 'success'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Historique des Mouvements
              </Typography>
              <List>
                {mouvements
                  .filter(m => m.medicamentId === selectedMedicament.medicamentId)
                  .map((mouvement) => (
                    <ListItem key={mouvement.id}>
                      <ListItemIcon>
                        {getMouvementIcon(mouvement.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${mouvement.type} - ${mouvement.quantite} unités`}
                        secondary={`${mouvement.date.toLocaleString()} - ${mouvement.description}`}
                      />
                      <Chip
                        label={mouvement.statut}
                        color={mouvement.statut === 'synchronise' ? 'success' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                  ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SynchronisationStocks;
