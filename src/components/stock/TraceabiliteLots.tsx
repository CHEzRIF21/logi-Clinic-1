import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Search,
  Visibility,
  Warning,
  CheckCircle,
  LocalShipping,
  Inventory,
  Assignment,
  Timeline,
  FilterList,
  Download,
  Refresh,
} from '@mui/icons-material';

// Types pour la traçabilité
interface LotTraceabilite {
  id: string;
  numeroLot: string;
  medicamentId: string;
  medicamentNom: string;
  medicamentCode: string;
  quantiteInitiale: number;
  quantiteDisponible: number;
  dateReception: Date;
  dateExpiration: Date;
  fournisseur: string;
  emplacement: string;
  statut: 'actif' | 'expire' | 'epuise' | 'retire';
  provenance: 'externe' | 'transfert_gros';
}

interface MouvementTraceabilite {
  id: string;
  lotId: string;
  type: 'reception' | 'transfert_entree' | 'transfert_sortie' | 'dispensation' | 'retour' | 'perte' | 'inventaire';
  quantite: number;
  date: Date;
  reference: string;
  utilisateur: string;
  destinataire?: string;
  motif: string;
  statut: 'valide' | 'en_attente' | 'annule';
}

interface HistoriqueLot {
  lot: LotTraceabilite;
  mouvements: MouvementTraceabilite[];
  quantiteTotaleEntree: number;
  quantiteTotaleSortie: number;
  dureeVieRestante: number; // en jours
  statutExpiration: 'normal' | 'proche' | 'expire';
}

const TraceabiliteLots: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLot, setSelectedLot] = useState<LotTraceabilite | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [filterExpiration, setFilterExpiration] = useState('tous');

  // Données de démonstration
  const lotsDemo: LotTraceabilite[] = [
    {
      id: '1',
      numeroLot: 'PAR-2024-001',
      medicamentId: '1',
      medicamentNom: 'Paracétamol 500mg',
      medicamentCode: 'MED-001',
      quantiteInitiale: 1000,
      quantiteDisponible: 800,
      dateReception: new Date('2024-01-15'),
      dateExpiration: new Date('2025-10-10'),
      fournisseur: 'PNLP',
      emplacement: 'Rayon A-1',
      statut: 'actif',
      provenance: 'externe'
    },
    {
      id: '2',
      numeroLot: 'AMX-2024-002',
      medicamentId: '2',
      medicamentNom: 'Amoxicilline 1g',
      medicamentCode: 'MED-002',
      quantiteInitiale: 200,
      quantiteDisponible: 150,
      dateReception: new Date('2024-02-20'),
      dateExpiration: new Date('2025-08-15'),
      fournisseur: 'CAME',
      emplacement: 'Frigo B-2',
      statut: 'actif',
      provenance: 'externe'
    },
    {
      id: '3',
      numeroLot: 'IBU-2024-003',
      medicamentId: '3',
      medicamentNom: 'Ibuprofène 400mg',
      medicamentCode: 'MED-003',
      quantiteInitiale: 100,
      quantiteDisponible: 0,
      dateReception: new Date('2024-03-05'),
      dateExpiration: new Date('2025-12-20'),
      fournisseur: 'Achat direct',
      emplacement: 'Rayon A-2',
      statut: 'epuise',
      provenance: 'transfert_gros'
    }
  ];

  const mouvementsDemo: MouvementTraceabilite[] = [
    {
      id: '1',
      lotId: '1',
      type: 'reception',
      quantite: 1000,
      date: new Date('2024-01-15'),
      reference: 'BL-2024-001',
      utilisateur: 'Magasinier Principal',
      motif: 'Livraison PNLP',
      statut: 'valide'
    },
    {
      id: '2',
      lotId: '1',
      type: 'transfert_sortie',
      quantite: 200,
      date: new Date('2024-03-10'),
      reference: 'TR-2024-001',
      utilisateur: 'Responsable Centre',
      destinataire: 'Magasin Détail',
      motif: 'Dotation Magasin Détail',
      statut: 'valide'
    },
    {
      id: '3',
      lotId: '2',
      type: 'reception',
      quantite: 200,
      date: new Date('2024-02-20'),
      reference: 'BL-2024-002',
      utilisateur: 'Magasinier Principal',
      motif: 'Livraison CAME',
      statut: 'valide'
    },
    {
      id: '4',
      lotId: '2',
      type: 'transfert_sortie',
      quantite: 50,
      date: new Date('2024-04-15'),
      reference: 'TR-2024-002',
      utilisateur: 'Responsable Centre',
      destinataire: 'Magasin Détail',
      motif: 'Dotation Magasin Détail',
      statut: 'valide'
    }
  ];

  // Calcul de l'historique des lots
  const getHistoriqueLot = (lotId: string): HistoriqueLot => {
    const lot = lotsDemo.find(l => l.id === lotId);
    const mouvements = mouvementsDemo.filter(m => m.lotId === lotId);
    
    if (!lot) {
      throw new Error('Lot non trouvé');
    }

    const quantiteTotaleEntree = mouvements
      .filter(m => ['reception', 'transfert_entree'].includes(m.type))
      .reduce((sum, m) => sum + m.quantite, 0);

    const quantiteTotaleSortie = mouvements
      .filter(m => ['transfert_sortie', 'dispensation', 'perte'].includes(m.type))
      .reduce((sum, m) => sum + m.quantite, 0);

    const now = new Date();
    const dureeVieRestante = Math.ceil((lot.dateExpiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let statutExpiration: 'normal' | 'proche' | 'expire' = 'normal';
    if (dureeVieRestante < 0) {
      statutExpiration = 'expire';
    } else if (dureeVieRestante <= 90) {
      statutExpiration = 'proche';
    }

    return {
      lot,
      mouvements: mouvements.sort((a, b) => b.date.getTime() - a.date.getTime()),
      quantiteTotaleEntree,
      quantiteTotaleSortie,
      dureeVieRestante,
      statutExpiration
    };
  };

  // Filtrage des lots
  const lotsFiltres = lotsDemo.filter(lot => {
    const matchesSearch = lot.numeroLot.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lot.medicamentNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lot.medicamentCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatut = filterStatut === 'tous' || lot.statut === filterStatut;
    
    let matchesExpiration = true;
    if (filterExpiration !== 'tous') {
      const historique = getHistoriqueLot(lot.id);
      matchesExpiration = historique.statutExpiration === filterExpiration;
    }

    return matchesSearch && matchesStatut && matchesExpiration;
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewDetails = (lot: LotTraceabilite) => {
    setSelectedLot(lot);
    setOpenDetails(true);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'success';
      case 'expire': return 'error';
      case 'epuise': return 'warning';
      case 'retire': return 'default';
      default: return 'default';
    }
  };

  const getExpirationColor = (statut: string) => {
    switch (statut) {
      case 'normal': return 'success';
      case 'proche': return 'warning';
      case 'expire': return 'error';
      default: return 'default';
    }
  };

  const getTypeMouvementIcon = (type: string) => {
    switch (type) {
      case 'reception': return <Inventory />;
      case 'transfert_entree': return <LocalShipping />;
      case 'transfert_sortie': return <LocalShipping />;
      case 'dispensation': return <Assignment />;
      case 'retour': return <Timeline />;
      case 'perte': return <Warning />;
      case 'inventaire': return <Inventory />;
      default: return <Timeline />;
    }
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Traçabilité des Lots
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Suivi complet des lots de médicaments et de leur historique
        </Typography>
      </Box>

      {/* Navigation par onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Liste des Lots" />
          <Tab label="Lots Proches d'Expiration" />
          <Tab label="Historique des Mouvements" />
          <Tab label="Rapports de Traçabilité" />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      {activeTab === 0 && (
        <Box>
          {/* Filtres et recherche */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Rechercher un lot"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={filterStatut}
                      onChange={(e) => setFilterStatut(e.target.value)}
                      label="Statut"
                    >
                      <MenuItem value="tous">Tous</MenuItem>
                      <MenuItem value="actif">Actif</MenuItem>
                      <MenuItem value="expire">Expiré</MenuItem>
                      <MenuItem value="epuise">Épuisé</MenuItem>
                      <MenuItem value="retire">Retiré</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Expiration</InputLabel>
                    <Select
                      value={filterExpiration}
                      onChange={(e) => setFilterExpiration(e.target.value)}
                      label="Expiration"
                    >
                      <MenuItem value="tous">Tous</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="proche">Proche (≤90 jours)</MenuItem>
                      <MenuItem value="expire">Expiré</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatut('tous');
                        setFilterExpiration('tous');
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tableau des lots */}
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Numéro de Lot</TableCell>
                      <TableCell>Médicament</TableCell>
                      <TableCell>Quantité Disponible</TableCell>
                      <TableCell>Date Réception</TableCell>
                      <TableCell>Date Expiration</TableCell>
                      <TableCell>Fournisseur</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Expiration</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lotsFiltres.map((lot) => {
                      const historique = getHistoriqueLot(lot.id);
                      return (
                        <TableRow key={lot.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {lot.numeroLot}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {lot.medicamentNom}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {lot.medicamentCode}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {lot.quantiteDisponible} / {lot.quantiteInitiale}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {lot.dateReception.toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {lot.dateExpiration.toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {lot.fournisseur}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={lot.statut}
                              color={getStatutColor(lot.statut)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                historique.statutExpiration === 'expire' ? 'Expiré' :
                                historique.statutExpiration === 'proche' ? `${historique.dureeVieRestante} jours` :
                                'Normal'
                              }
                              color={getExpirationColor(historique.statutExpiration)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Voir l'historique">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(lot)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
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

      {activeTab === 1 && (
        <Box>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="h6">
              Lots Proches d'Expiration (≤ 90 jours)
            </Typography>
            <Typography variant="body2">
              Les lots suivants nécessitent une attention particulière
            </Typography>
          </Alert>

          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Numéro de Lot</TableCell>
                      <TableCell>Médicament</TableCell>
                      <TableCell>Quantité Disponible</TableCell>
                      <TableCell>Jours Restants</TableCell>
                      <TableCell>Actions Recommandées</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lotsDemo
                      .map(lot => ({ lot, historique: getHistoriqueLot(lot.id) }))
                      .filter(({ historique }) => historique.statutExpiration === 'proche')
                      .map(({ lot, historique }) => (
                        <TableRow key={lot.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {lot.numeroLot}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {lot.medicamentNom}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {lot.medicamentCode}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {lot.quantiteDisponible} / {lot.quantiteInitiale}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${historique.dureeVieRestante} jours`}
                              color="warning"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button size="small" variant="outlined">
                                Prioriser Dispensation
                              </Button>
                              <Button size="small" variant="outlined">
                                Retourner au Gros
                              </Button>
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
          <Typography variant="h6" gutterBottom>
            Historique des Mouvements
          </Typography>
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Lot</TableCell>
                      <TableCell>Quantité</TableCell>
                      <TableCell>Référence</TableCell>
                      <TableCell>Utilisateur</TableCell>
                      <TableCell>Motif</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mouvementsDemo
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .map((mouvement) => {
                        const lot = lotsDemo.find(l => l.id === mouvement.lotId);
                        return (
                          <TableRow key={mouvement.id}>
                            <TableCell>
                              {mouvement.date.toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getTypeMouvementIcon(mouvement.type)}
                                <Typography variant="body2">
                                  {mouvement.type.replace('_', ' ')}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {lot?.numeroLot}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {mouvement.quantite}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {mouvement.reference}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {mouvement.utilisateur}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {mouvement.motif}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={mouvement.statut}
                                color={mouvement.statut === 'valide' ? 'success' : 'warning'}
                                size="small"
                              />
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

      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Rapports de Traçabilité
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Statistiques des Lots
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="outlined" startIcon={<Download />}>
                      Export Historique Complet
                    </Button>
                    <Button variant="outlined" startIcon={<Download />}>
                      Rapport Expiration
                    </Button>
                    <Button variant="outlined" startIcon={<Download />}>
                      Traçabilité par Fournisseur
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Alertes et Notifications
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="outlined" startIcon={<Warning />}>
                      Lots Expirés
                    </Button>
                    <Button variant="outlined" startIcon={<Warning />}>
                      Lots Proches d'Expiration
                    </Button>
                    <Button variant="outlined" startIcon={<CheckCircle />}>
                      Rapport de Conformité
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Dialog Détails du Lot */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Historique Détaillé - {selectedLot?.numeroLot}
        </DialogTitle>
        <DialogContent>
          {selectedLot && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Informations du Lot
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Médicament:</strong> {selectedLot.medicamentNom}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Code:</strong> {selectedLot.medicamentCode}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Quantité Initiale:</strong> {selectedLot.quantiteInitiale}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Quantité Disponible:</strong> {selectedLot.quantiteDisponible}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Fournisseur:</strong> {selectedLot.fournisseur}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Dates et Statut
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Date Réception:</strong> {selectedLot.dateReception.toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date Expiration:</strong> {selectedLot.dateExpiration.toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Emplacement:</strong> {selectedLot.emplacement}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Provenance:</strong> {selectedLot.provenance}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Historique des Mouvements
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Quantité</TableCell>
                      <TableCell>Référence</TableCell>
                      <TableCell>Utilisateur</TableCell>
                      <TableCell>Motif</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getHistoriqueLot(selectedLot.id).mouvements.map((mouvement) => (
                      <TableRow key={mouvement.id}>
                        <TableCell>
                          {mouvement.date.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getTypeMouvementIcon(mouvement.type)}
                            <Typography variant="body2">
                              {mouvement.type.replace('_', ' ')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {mouvement.quantite}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {mouvement.reference}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {mouvement.utilisateur}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {mouvement.motif}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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

export default TraceabiliteLots;
