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
  Tooltip,
  Autocomplete
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
  Refresh as RefreshIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { StockService } from '../../services/stockService';
import { LotSupabase, MedicamentSupabase } from '../../services/stockSupabase';
import { supabase } from '../../services/supabase';
import { useMedicaments } from '../../hooks/useMedicaments';

interface MagasinGrosProps {
  onRefresh?: () => void;
}

const MagasinGros: React.FC<MagasinGrosProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [lots, setLots] = useState<LotSupabase[]>([]);
  
  // Utiliser le hook centralisé pour les médicaments
  const { medicaments, loading: loadingMedicaments } = useMedicaments({ autoRefresh: true });
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMagasin, setFilterMagasin] = useState<'gros' | 'detail' | 'tous'>('gros');
  const [filterStatut, setFilterStatut] = useState<'actif' | 'expire' | 'epuise' | 'tous'>('tous');
  
  // Dialogs
  const [receptionDialog, setReceptionDialog] = useState(false);
  const [retourDialog, setRetourDialog] = useState(false);
  const [inventaireDialog, setInventaireDialog] = useState(false);
  const [rapportDialog, setRapportDialog] = useState(false);
  const [alertesDialog, setAlertesDialog] = useState(false);

  // Utilisateur courant (si auth Supabase activée)
  const [currentUserId, setCurrentUserId] = useState<string>('system');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) setCurrentUserId(data.user.id);
      } catch {
        // garder "system" si pas d'auth
      }
    })();
  }, []);

  // Form data - Réception fournisseur multi-lignes (Magasin Gros)
  interface ReceptionLigne {
    id: string; // id temporaire
    medicament_id: string;
    numero_lot: string;
    quantite_initiale: number;
    date_expiration: string;
    prix_achat: number;
    observations?: string;
  }

  const [receptionMeta, setReceptionMeta] = useState({
    date_reception: new Date().toISOString().split('T')[0],
    fournisseur: '',
    reference_document: '',
    observations: ''
  });
  const [receptionLignes, setReceptionLignes] = useState<ReceptionLigne[]>([
    {
      id: `rec-${Date.now()}`,
      medicament_id: '',
      numero_lot: '',
      quantite_initiale: 0,
      date_expiration: '',
      prix_achat: 0
    }
  ]);

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
      const [lotsData, statsData] = await Promise.all([
        StockService.getLotsByMagasin('gros'),
        StockService.getStockStats()
      ]);
      
      setLots(lotsData || []);
      // Les médicaments sont chargés automatiquement par le hook useMedicaments
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
      await StockService.receptionMedicamentMultiple({
        fournisseur: receptionMeta.fournisseur,
        date_reception: receptionMeta.date_reception,
        utilisateur_id: currentUserId,
        reference_document: receptionMeta.reference_document || undefined,
        observations: receptionMeta.observations || undefined,
        lignes: receptionLignes.map(l => ({
          medicament_id: l.medicament_id,
          numero_lot: l.numero_lot,
          quantite_initiale: l.quantite_initiale,
          date_expiration: l.date_expiration,
          prix_achat: l.prix_achat,
          observations: l.observations
        }))
      });
      
      setReceptionDialog(false);
      setReceptionMeta({
        date_reception: new Date().toISOString().split('T')[0],
        fournisseur: '',
        reference_document: '',
        observations: ''
      });
      setReceptionLignes([
        {
          id: `rec-${Date.now()}`,
          medicament_id: '',
          numero_lot: '',
          quantite_initiale: 0,
          date_expiration: '',
          prix_achat: 0
        }
      ]);
      
      await loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Erreur lors de la réception:', error);
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
        utilisateur_id: currentUserId
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
                  {stats.valeur_stock.toLocaleString()} XOF
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
                onClick={() => {
                  if (receptionLignes.length === 0) {
                    setReceptionLignes([{
                      id: `rec-${Date.now()}`,
                      medicament_id: '',
                      numero_lot: '',
                      quantite_initiale: 0,
                      date_expiration: '',
                      prix_achat: 0
                    }]);
                  }
                  setReceptionDialog(true);
                }}
              >
                Nouvelle Réception Fournisseur (multi-produits)
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
                    <Typography variant="caption" color="text.secondary">
                      Le ravitaillement interne est initié par la Pharmacie / Magasin Détail (voir module Ajustement).
                    </Typography>
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
      <DialogTitle>Nouvelle Réception Fournisseur (Magasin Gros)</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date de Réception"
              type="date"
              value={receptionMeta.date_reception}
              onChange={(e) => setReceptionMeta(prev => ({ ...prev, date_reception: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Fournisseur"
              value={receptionMeta.fournisseur}
              onChange={(e) => setReceptionMeta(prev => ({ ...prev, fournisseur: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Référence Document"
              value={receptionMeta.reference_document}
              onChange={(e) => setReceptionMeta(prev => ({ ...prev, reference_document: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observations"
              multiline
              rows={3}
              value={receptionMeta.observations}
              onChange={(e) => setReceptionMeta(prev => ({ ...prev, observations: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <Alert severity="info">
              Ce ravitaillement peut contenir plusieurs types de produits (comprimé, flacon, réactif, gélule, etc.).
            </Alert>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                Lignes de réception
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setReceptionLignes(prev => ([...prev, {
                  id: `rec-${Date.now()}-${Math.random()}`,
                  medicament_id: '',
                  numero_lot: '',
                  quantite_initiale: 0,
                  date_expiration: '',
                  prix_achat: 0
                }]))}
              >
                Ajouter une ligne
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Médicament</TableCell>
                    <TableCell>Type / Forme</TableCell>
                    <TableCell>Lot</TableCell>
                    <TableCell>Qté</TableCell>
                    <TableCell>Expiration</TableCell>
                    <TableCell>Prix achat (XOF)</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receptionLignes.map((ligne, idx) => {
                    const med = medicaments.find(m => m.id === ligne.medicament_id);
                    return (
                      <TableRow key={ligne.id}>
                        <TableCell sx={{ minWidth: 300 }}>
                          <Autocomplete
                            size="small"
                            openOnFocus
                            options={[...medicaments].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))}
                            getOptionLabel={(option) => `${option.nom} ${option.dosage ? `(${option.dosage})` : ''} - ${option.code}`}
                            value={medicaments.find(m => m.id === ligne.medicament_id) || null}
                            onChange={(_, newValue) => {
                              if (newValue) {
                                setReceptionLignes(prev => prev.map(l => l.id === ligne.id ? { ...l, medicament_id: newValue.id } : l));
                              }
                            }}
                            loading={loadingMedicaments}
                            filterOptions={(options, { inputValue }) => {
                              if (!inputValue) return [...options].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
                              const searchLower = inputValue.toLowerCase();
                              return options.filter(option =>
                                option.nom.toLowerCase().includes(searchLower) ||
                                option.code.toLowerCase().includes(searchLower) ||
                                (option.dci && option.dci.toLowerCase().includes(searchLower)) ||
                                (option.dosage && option.dosage.toLowerCase().includes(searchLower))
                              ).sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Médicament"
                                placeholder="Cliquez ou tapez pour rechercher un médicament..."
                              />
                            )}
                            renderOption={(props, option) => (
                              <Box component="li" {...props} key={option.id}>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {option.nom}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {option.code} • {option.forme} {option.dosage} • {option.categorie || ''}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            noOptionsText={loadingMedicaments ? "Chargement des médicaments..." : medicaments.length === 0 ? "Aucun médicament. Créez-en dans Paramètres > Médicaments." : "Aucun médicament trouvé"}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {med?.forme || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 140 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={ligne.numero_lot}
                            onChange={(e) => {
                              const v = e.target.value;
                              setReceptionLignes(prev => prev.map(l => l.id === ligne.id ? { ...l, numero_lot: v } : l));
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: 110 }}>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            value={ligne.quantite_initiale}
                            onChange={(e) => {
                              const v = Math.max(0, Number(e.target.value) || 0);
                              setReceptionLignes(prev => prev.map(l => l.id === ligne.id ? { ...l, quantite_initiale: v } : l));
                            }}
                            inputProps={{ min: 0, step: 1 }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: 160 }}>
                          <TextField
                            size="small"
                            fullWidth
                            type="date"
                            value={ligne.date_expiration}
                            onChange={(e) => {
                              const v = e.target.value;
                              setReceptionLignes(prev => prev.map(l => l.id === ligne.id ? { ...l, date_expiration: v } : l));
                            }}
                            InputLabelProps={{ shrink: true }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: 150 }}>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            value={ligne.prix_achat}
                            onChange={(e) => {
                              const v = Math.max(0, Number(e.target.value) || 0);
                              setReceptionLignes(prev => prev.map(l => l.id === ligne.id ? { ...l, prix_achat: v } : l));
                            }}
                            inputProps={{ min: 0, step: 1 }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: 90 }}>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={receptionLignes.length <= 1}
                            onClick={() => setReceptionLignes(prev => prev.filter(l => l.id !== ligne.id))}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setReceptionDialog(false)}>Annuler</Button>
        <Button
          onClick={handleReception}
          variant="contained"
          disabled={
            loading ||
            !receptionMeta.fournisseur.trim() ||
            receptionLignes.length === 0 ||
            receptionLignes.some(l =>
              !l.medicament_id ||
              !l.numero_lot.trim() ||
              !l.date_expiration ||
              (l.quantite_initiale || 0) <= 0
            )
          }
        >
          Enregistrer
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
      {renderRetourDialog()}
    </Box>
  );
};

export default MagasinGros;
