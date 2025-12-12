import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Refresh,
  Add,
  Edit,
  Delete
} from '@mui/icons-material';
import { GlassCard } from '../ui/GlassCard';
import { StatBadge } from '../ui/StatBadge';
import { LaboratoireService, LabStockReactif } from '../../services/laboratoireService';

const GestionStocksReactifs: React.FC = () => {
  const [stocks, setStocks] = useState<LabStockReactif[]>([]);
  const [stocksAlerte, setStocksAlerte] = useState<LabStockReactif[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<LabStockReactif | null>(null);
  const [formData, setFormData] = useState<Partial<LabStockReactif>>({});

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    setLoading(true);
    try {
      const [allStocks, alertStocks] = await Promise.all([
        LaboratoireService.getStocksReactifs(),
        LaboratoireService.getStocksReactifsAlerte()
      ]);
      setStocks(allStocks);
      setStocksAlerte(alertStocks);
    } catch (error) {
      console.error('Erreur chargement stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (stock?: LabStockReactif) => {
    if (stock) {
      setSelectedStock(stock);
      setFormData(stock);
    } else {
      setSelectedStock(null);
      setFormData({
        code_reactif: '',
        libelle: '',
        unite: '',
        quantite_disponible: 0,
        seuil_alerte: 0,
        actif: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStock(null);
    setFormData({});
  };

  const handleSave = async () => {
    try {
      // Ici, il faudrait créer une méthode dans le service pour créer/mettre à jour un stock
      // Pour l'instant, on simule
      await loadStocks();
      handleCloseDialog();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const isStockCritique = (stock: LabStockReactif): boolean => {
    return stock.quantite_disponible <= stock.seuil_alerte;
  };

  const isPeremptionProche = (stock: LabStockReactif): boolean => {
    if (!stock.date_peremption) return false;
    const datePeremption = new Date(stock.date_peremption);
    const dans30Jours = new Date();
    dans30Jours.setDate(dans30Jours.getDate() + 30);
    return datePeremption <= dans30Jours;
  };

  return (
    <Box>
      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge
              label="Total réactifs"
              value={stocks.length.toString()}
              icon={<CheckCircle />}
              color="primary"
            />
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge
              label="Stocks critiques"
              value={stocks.filter(isStockCritique).length.toString()}
              icon={<Warning />}
              color="error"
            />
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge
              label="Péremption proche"
              value={stocks.filter(isPeremptionProche).length.toString()}
              icon={<Warning />}
              color="warning"
            />
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge
              label="Alertes actives"
              value={stocksAlerte.length.toString()}
              icon={<Warning />}
              color="warning"
            />
          </GlassCard>
        </Grid>
      </Grid>

      {/* Alertes */}
      {stocksAlerte.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="warning" icon={<Warning />}>
            <Typography variant="subtitle2" gutterBottom>
              {stocksAlerte.length} réactif(s) nécessitent une attention
            </Typography>
            {stocksAlerte.slice(0, 5).map((stock) => (
              <Typography key={stock.id} variant="body2">
                • {stock.libelle}: {isStockCritique(stock) && 'Stock critique'}
                {isStockCritique(stock) && isPeremptionProche(stock) && ' • '}
                {isPeremptionProche(stock) && `Péremption le ${new Date(stock.date_peremption!).toLocaleDateString('fr-FR')}`}
              </Typography>
            ))}
          </Alert>
        </Box>
      )}

      {/* Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Liste des Réactifs
        </Typography>
        <Box>
          <IconButton onClick={loadStocks}>
            <Refresh />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ ml: 1 }}
          >
            Ajouter un réactif
          </Button>
        </Box>
      </Box>

      {/* Tableau des stocks */}
      <GlassCard sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Libellé</TableCell>
                <TableCell>Quantité disponible</TableCell>
                <TableCell>Seuil d'alerte</TableCell>
                <TableCell>Date péremption</TableCell>
                <TableCell>Numéro de lot</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell>{stock.code_reactif}</TableCell>
                  <TableCell>{stock.libelle}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontWeight: isStockCritique(stock) ? 'bold' : 'normal',
                        color: isStockCritique(stock) ? 'error.main' : 'text.primary'
                      }}
                    >
                      {stock.quantite_disponible} {stock.unite}
                    </Typography>
                  </TableCell>
                  <TableCell>{stock.seuil_alerte} {stock.unite}</TableCell>
                  <TableCell>
                    {stock.date_peremption ? (
                      <Typography
                        sx={{
                          color: isPeremptionProche(stock) ? 'warning.main' : 'text.primary'
                        }}
                      >
                        {new Date(stock.date_peremption).toLocaleDateString('fr-FR')}
                      </Typography>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{stock.numero_lot || '-'}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {isStockCritique(stock) && (
                        <Chip label="Stock critique" size="small" color="error" />
                      )}
                      {isPeremptionProche(stock) && (
                        <Chip label="Péremption proche" size="small" color="warning" />
                      )}
                      {stock.actif && !isStockCritique(stock) && !isPeremptionProche(stock) && (
                        <Chip label="OK" size="small" color="success" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(stock)}>
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      {/* Dialog d'édition */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedStock ? 'Modifier le réactif' : 'Ajouter un réactif'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Code réactif"
                value={formData.code_reactif || ''}
                onChange={(e) => setFormData({ ...formData, code_reactif: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Libellé"
                value={formData.libelle || ''}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Unité"
                value={formData.unite || ''}
                onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantité disponible"
                value={formData.quantite_disponible || 0}
                onChange={(e) => setFormData({ ...formData, quantite_disponible: parseFloat(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Seuil d'alerte"
                value={formData.seuil_alerte || 0}
                onChange={(e) => setFormData({ ...formData, seuil_alerte: parseFloat(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Date de péremption"
                value={formData.date_peremption ? formData.date_peremption.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, date_peremption: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Numéro de lot"
                value={formData.numero_lot || ''}
                onChange={(e) => setFormData({ ...formData, numero_lot: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Fournisseur"
                value={formData.fournisseur || ''}
                onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionStocksReactifs;

