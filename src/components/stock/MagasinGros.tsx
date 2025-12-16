import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Inventory as InventoryIcon,
  TransferWithinAStation as TransferIcon,
  Assessment as ReportIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { StockService } from '../../services/stockService';
import { LotSupabase, MedicamentSupabase } from '../../services/stockSupabase';
import { supabase } from '../../services/supabase';

interface MagasinGrosProps {
  onRefresh?: () => void;
}

const MagasinGros: React.FC<MagasinGrosProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [lots, setLots] = useState<LotSupabase[]>([]);
  const [medicaments, setMedicaments] = useState<MedicamentSupabase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMagasin, setFilterMagasin] = useState<'gros' | 'detail' | 'tous'>('gros');
  const [filterStatut, setFilterStatut] = useState<'actif' | 'expire' | 'epuise' | 'tous'>('tous');
  
  // Dialogs
  const [receptionDialog, setReceptionDialog] = useState(false);
  const [transfertDialog, setTransfertDialog] = useState(false);
  const [retourDialog, setRetourDialog] = useState(false);
  const [inventaireDialog, setInventaireDialog] = useState(false);
  const [rapportDialog, setRapportDialog] = useState(false);
  const [alertesDialog, setAlertesDialog] = useState(false);

  // Form data
  const [receptionData, setReceptionData] = useState({
    medicament_id: '',
    numero_lot: '',
    quantite_initiale: 0,
    date_reception: new Date().toISOString().split('T')[0],
    date_expiration: '',
    prix_achat: 0,
    fournisseur: '',
    reference_document: '',
    observations: ''
  });

  const [transfertData, setTransfertData] = useState({
    medicament_id: '',
    lot_id: '',
    quantite_demandee: 0,
    motif: '',
    observations: ''
  });

  const [retourData, setRetourData] = useState({
    medicament_id: '',
    lot_id: '',
    quantite: 0,
    motif: '',
    observations: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    total_medicaments: 0,
    total_lots: 0,
    total_stock: 0,
    valeur_stock: 0,
    total_alertes: 0,
    transferts_en_cours: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotsData, medicamentsData, statsData] = await Promise.all([
        StockService.getLotsByMagasin('gros'),
        supabase.from('medicaments').select('*'),
        StockService.getStockStats()
      ]);
      
      setLots(lotsData || []);
      setMedicaments(medicamentsData.data || []);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReception = async () => {
    try {
      setLoading(true);
      await StockService.receptionMedicament({
        ...receptionData,
        utilisateur_id: 'current-user-id' // À remplacer par l'ID utilisateur réel
      });
      
      setReceptionDialog(false);
      setReceptionData({
        medicament_id: '',
        numero_lot: '',
        quantite_initiale: 0,
        date_reception: new Date().toISOString().split('T')[0],
        date_expiration: '',
        prix_achat: 0,
        fournisseur: '',
        reference_document: '',
        observations: ''
      });
      
      await loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Erreur lors de la réception:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfert = async () => {
    try {
      setLoading(true);
      await StockService.creerDemandeTransfert({
        ...transfertData,
        utilisateur_demandeur_id: 'current-user-id' // À remplacer par l'ID utilisateur réel
      });
      
      setTransfertDialog(false);
      setTransfertData({
        medicament_id: '',
        lot_id: '',
        quantite_demandee: 0,
        motif: '',
        observations: ''
      });
      
      await loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Erreur lors de la création du transfert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetour = async () => {
    try {
      setLoading(true);
      await StockService.enregistrerPerteRetour({
        type: 'retour',
        ...retourData,
        utilisateur_id: 'current-user-id' // À remplacer par l'ID utilisateur réel
      });
      
      setRetourDialog(false);
      setRetourData({
        medicament_id: '',
        lot_id: '',
        quantite: 0,
        motif: '',
        observations: ''
      });
      
      await loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du retour:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLots = lots.filter(lot => {
    const med = medicaments.find(m => m.id === lot.medicament_id);
    const medName = (med?.nom || '').toLowerCase();
    const matchesSearch = lot.numero_lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medName.includes(searchTerm.toLowerCase());
    const matchesMagasin = filterMagasin === 'tous' || lot.magasin === filterMagasin;
    const matchesStatut = filterStatut === 'tous' || lot.statut === filterStatut;
    
    return matchesSearch && matchesMagasin && matchesStatut;
  });

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'success';
      case 'expire': return 'error';
      case 'epuise': return 'warning';
      default: return 'default';
    }
  };

  const getExpirationStatus = (dateExpiration: string) => {
    const expiration = new Date(dateExpiration);
    const now = new Date();
    const diffDays = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expiré', color: 'error' };
    if (diffDays <= 30) return { status: 'expire bientôt', color: 'warning' };
    return { status: 'valide', color: 'success' };
  };

  const renderDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Médicaments
                </Typography>
                <Typography variant="h4">
                  {stats.total_medicaments}
                </Typography>
              </Box>
              <InventoryIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Stock Total
                </Typography>
                <Typography variant="h4">
                  {stats.total_stock}
                </Typography>
              </Box>
              <InventoryIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Valeur Stock
                </Typography>
                <Typography variant="h4">
                  {stats.valeur_stock.toLocaleString()} FCFA
                </Typography>
              </Box>
              <ReportIcon color="info" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Alertes Actives
                </Typography>
                <Typography variant="h4" color={stats.total_alertes > 0 ? 'error' : 'success'}>
                  {stats.total_alertes}
                </Typography>
              </Box>
              <WarningIcon color={stats.total_alertes > 0 ? 'error' : 'success'} sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Actions Rapides
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setReceptionDialog(true)}
              >
                Nouvelle Réception
              </Button>
              <Button
                variant="outlined"
                startIcon={<TransferIcon />}
                onClick={() => setTransfertDialog(true)}
              >
                Créer Transfert
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading}
              >
                Actualiser
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderInventaire = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Inventaire Magasin Gros</Typography>
        <Box display="flex" gap={2}>
          <TextField
            size="small"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={filterStatut}
              label="Statut"
              onChange={(e) => setFilterStatut(e.target.value as any)}
            >
              <MenuItem value="tous">Tous</MenuItem>
              <MenuItem value="actif">Actif</MenuItem>
              <MenuItem value="expire">Expiré</MenuItem>
              <MenuItem value="epuise">Épuisé</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Médicament</TableCell>
              <TableCell>Numéro Lot</TableCell>
              <TableCell>Quantité</TableCell>
              <TableCell>Date Réception</TableCell>
              <TableCell>Date Expiration</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Fournisseur</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLots.map((lot) => {
              const expirationStatus = getExpirationStatus(lot.date_expiration);
              return (
                <TableRow key={lot.id}>
                  <TableCell>
                    <Box>
                      {(() => { const med = medicaments.find(m => m.id === lot.medicament_id); return (
                        <>
                          <Typography variant="body2" fontWeight="bold">
                            {med?.nom || '—'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {med?.code || ''}
                          </Typography>
                        </>
                      ); })()}
                    </Box>
                  </TableCell>
                  <TableCell>{lot.numero_lot}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>{lot.quantite_disponible}</Typography>
                      <Chip
                        size="small"
                        label={lot.quantite_disponible <= 10 ? 'Stock bas' : 'OK'}
                        color={lot.quantite_disponible <= 10 ? 'warning' : 'success'}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(lot.date_reception).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>
                        {new Date(lot.date_expiration).toLocaleDateString()}
                      </Typography>
                      <Chip
                        size="small"
                        label={expirationStatus.status}
                        color={expirationStatus.color as any}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lot.statut}
                      color={getStatutColor(lot.statut) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{lot.fournisseur}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Créer transfert">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setTransfertData(prev => ({
                              ...prev,
                              medicament_id: lot.medicament_id,
                              lot_id: lot.id
                            }));
                            setTransfertDialog(true);
                          }}
                        >
                          <TransferIcon fontSize="small" />
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
    </Box>
  );

  const renderReceptionDialog = () => (
    <Dialog open={receptionDialog} onClose={() => setReceptionDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>Nouvelle Réception</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Médicament</InputLabel>
              <Select
                value={receptionData.medicament_id}
                label="Médicament"
                onChange={(e) => setReceptionData(prev => ({ ...prev, medicament_id: e.target.value }))}
              >
                {medicaments.map((med) => (
                  <MenuItem key={med.id} value={med.id}>
                    {med.nom} ({med.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Numéro de Lot"
              value={receptionData.numero_lot}
              onChange={(e) => setReceptionData(prev => ({ ...prev, numero_lot: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantité"
              type="number"
              value={receptionData.quantite_initiale}
              onChange={(e) => {
                const value = Math.max(0, Number(e.target.value) || 0);
                setReceptionData(prev => ({ ...prev, quantite_initiale: value }));
              }}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date de Réception"
              type="date"
              value={receptionData.date_reception}
              onChange={(e) => setReceptionData(prev => ({ ...prev, date_reception: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date d'Expiration"
              type="date"
              value={receptionData.date_expiration}
              onChange={(e) => setReceptionData(prev => ({ ...prev, date_expiration: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Prix d'Achat (FCFA)"
              type="number"
              value={receptionData.prix_achat}
              onChange={(e) => {
                const value = Math.max(0, Number(e.target.value) || 0);
                setReceptionData(prev => ({ ...prev, prix_achat: value }));
              }}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Fournisseur"
              value={receptionData.fournisseur}
              onChange={(e) => setReceptionData(prev => ({ ...prev, fournisseur: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Référence Document"
              value={receptionData.reference_document}
              onChange={(e) => setReceptionData(prev => ({ ...prev, reference_document: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observations"
              multiline
              rows={3}
              value={receptionData.observations}
              onChange={(e) => setReceptionData(prev => ({ ...prev, observations: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setReceptionDialog(false)}>Annuler</Button>
        <Button onClick={handleReception} variant="contained" disabled={loading}>
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderTransfertDialog = () => (
    <Dialog open={transfertDialog} onClose={() => setTransfertDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>Créer Transfert vers Magasin Détail</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Médicament</InputLabel>
              <Select
                value={transfertData.medicament_id}
                label="Médicament"
                onChange={(e) => setTransfertData(prev => ({ ...prev, medicament_id: e.target.value }))}
              >
                {medicaments.map((med) => (
                  <MenuItem key={med.id} value={med.id}>
                    {med.nom} ({med.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Lot</InputLabel>
              <Select
                value={transfertData.lot_id}
                label="Lot"
                onChange={(e) => setTransfertData(prev => ({ ...prev, lot_id: e.target.value }))}
              >
                {lots
                  .filter(lot => lot.medicament_id === transfertData.medicament_id && lot.magasin === 'gros')
                  .map((lot) => (
                    <MenuItem key={lot.id} value={lot.id}>
                      {lot.numero_lot} (Stock: {lot.quantite_disponible})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantité à Transférer"
              type="number"
              value={transfertData.quantite_demandee}
              onChange={(e) => {
                const value = Math.max(0, Number(e.target.value) || 0);
                setTransfertData(prev => ({ ...prev, quantite_demandee: value }));
              }}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Motif"
              value={transfertData.motif}
              onChange={(e) => setTransfertData(prev => ({ ...prev, motif: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observations"
              multiline
              rows={3}
              value={transfertData.observations}
              onChange={(e) => setTransfertData(prev => ({ ...prev, observations: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTransfertDialog(false)}>Annuler</Button>
        <Button onClick={handleTransfert} variant="contained" disabled={loading}>
          Créer Demande
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderRetourDialog = () => (
    <Dialog open={retourDialog} onClose={() => setRetourDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>Enregistrer Retour vers Magasin Gros</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Médicament</InputLabel>
              <Select
                value={retourData.medicament_id}
                label="Médicament"
                onChange={(e) => setRetourData(prev => ({ ...prev, medicament_id: e.target.value }))}
              >
                {medicaments.map((med) => (
                  <MenuItem key={med.id} value={med.id}>
                    {med.nom} ({med.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Lot</InputLabel>
              <Select
                value={retourData.lot_id}
                label="Lot"
                onChange={(e) => setRetourData(prev => ({ ...prev, lot_id: e.target.value }))}
              >
                {lots
                  .filter(lot => lot.medicament_id === retourData.medicament_id && lot.magasin === 'detail')
                  .map((lot) => (
                    <MenuItem key={lot.id} value={lot.id}>
                      {lot.numero_lot} (Stock: {lot.quantite_disponible})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantité à Retourner"
              type="number"
              value={retourData.quantite}
              onChange={(e) => {
                const value = Math.max(0, Number(e.target.value) || 0);
                setRetourData(prev => ({ ...prev, quantite: value }));
              }}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Motif du Retour"
              value={retourData.motif}
              onChange={(e) => setRetourData(prev => ({ ...prev, motif: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observations"
              multiline
              rows={3}
              value={retourData.observations}
              onChange={(e) => setRetourData(prev => ({ ...prev, observations: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setRetourDialog(false)}>Annuler</Button>
        <Button onClick={handleRetour} variant="contained" disabled={loading}>
          Enregistrer Retour
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<DashboardIcon />} label="Tableau de Bord" />
          <Tab icon={<InventoryIcon />} label="Inventaire" />
          <Tab icon={<TransferIcon />} label="Transferts" />
          <Tab icon={<ReportIcon />} label="Rapports" />
          <Tab icon={<SettingsIcon />} label="Configuration" />
        </Tabs>
      </Box>

      <Box sx={{ p: 3 }}>
        {activeTab === 0 && renderDashboard()}
        {activeTab === 1 && renderInventaire()}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Transferts en Cours
            </Typography>
            <Alert severity="info">
              Les transferts sont gérés par le composant GestionTransferts
            </Alert>
          </Box>
        )}
        {activeTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Rapports
            </Typography>
            <Alert severity="info">
              Les rapports sont gérés par le composant de rapports
            </Alert>
          </Box>
        )}
        {activeTab === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configuration
            </Typography>
            <Alert severity="info">
              La configuration est gérée par le composant de configuration
            </Alert>
          </Box>
        )}
      </Box>

      {renderReceptionDialog()}
      {renderTransfertDialog()}
      {renderRetourDialog()}
    </Box>
  );
};

export default MagasinGros;
