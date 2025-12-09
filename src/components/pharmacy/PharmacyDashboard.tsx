import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Warning,
  Error,
  Inventory,
  Schedule,
  Refresh,
  Download,
  Print,
  Add,
  Upload,
} from '@mui/icons-material';
import pharmacyApi from '../../services/pharmacyApi';

interface DashboardKPIs {
  expired: number;
  nearExpiry: number;
  outOfStock: number;
  nearOutOfStock: number;
}

const PharmacyDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs>({
    expired: 0,
    nearExpiry: 0,
    outOfStock: 0,
    nearOutOfStock: 0,
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pharmacyApi.getDashboard();
      if (response.success && response.data) {
        setKpis(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleExport = async () => {
    try {
      await pharmacyApi.exportProducts('csv');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Tableau de Bord - Pharmacie
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboard}
            disabled={loading}
          >
            Actualiser
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Exporter
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            href="/pharmacy/products/new"
          >
            Ajouter Médicament
          </Button>
        </Box>
      </Box>

      {/* Messages d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Périmés */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Error sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="inherit" variant="subtitle2">
                    Périmés
                  </Typography>
                  <Typography variant="h3" component="div">
                    {kpis.expired}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Lots expirés nécessitant une action
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Proches de péremption */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="inherit" variant="subtitle2">
                    Proches de péremption
                  </Typography>
                  <Typography variant="h3" component="div">
                    {kpis.nearExpiry}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Lots à surveiller dans les 30 prochains jours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* En rupture */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'grey.100' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Error sx={{ fontSize: 40, mr: 2, color: 'error.main' }} />
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">
                    En rupture
                  </Typography>
                  <Typography variant="h3" component="div" color="error">
                    {kpis.outOfStock}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Produits sans stock disponible
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Proches de rupture */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ fontSize: 40, mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">
                    Proches de rupture
                  </Typography>
                  <Typography variant="h3" component="div" color="warning.main">
                    {kpis.nearOutOfStock}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Produits sous le seuil d'alerte
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertes critiques */}
      {(kpis.expired > 0 || kpis.outOfStock > 0) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">
            {kpis.expired > 0 && `${kpis.expired} lot(s) périmé(s)`}
            {kpis.expired > 0 && kpis.outOfStock > 0 && ' • '}
            {kpis.outOfStock > 0 && `${kpis.outOfStock} produit(s) en rupture`}
            {' nécessitent une attention immédiate'}
          </Typography>
        </Alert>
      )}

      {/* Actions rapides */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions Rapides
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  href="/pharmacy/lots/new"
                  fullWidth
                >
                  Nouvelle Réception (Lot)
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Inventory />}
                  href="/pharmacy/orders/new"
                  fullWidth
                >
                  Créer Commande Fournisseur
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  href="/pharmacy/products/import"
                  fullWidth
                >
                  Importer Produits (CSV)
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  href="/pharmacy/reports"
                  fullWidth
                >
                  Générer Rapports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vue d'ensemble
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total alertes actives
                  </Typography>
                  <Chip
                    label={kpis.expired + kpis.nearExpiry + kpis.outOfStock + kpis.nearOutOfStock}
                    color="error"
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Alertes critiques
                  </Typography>
                  <Chip
                    label={kpis.expired + kpis.outOfStock}
                    color="error"
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Alertes préventives
                  </Typography>
                  <Chip
                    label={kpis.nearExpiry + kpis.nearOutOfStock}
                    color="warning"
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PharmacyDashboard;


