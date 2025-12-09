import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Warning,
  Inventory,
  TrendingUp,
  TrendingDown,
  Schedule,
  LocalShipping,
  Assignment,
  Assessment,
  Refresh,
  FilterList,
  Download,
  Print,
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Error,
  Info,
} from '@mui/icons-material';

interface StockDashboardProps {
  medicaments: any[];
  lots: any[];
  mouvements: any[];
  alertes: any[];
  transferts: any[];
  dispensations: any[];
  onRefresh: () => void;
  onViewDetails: (type: string, id: string) => void;
  onExportData: (format: string) => void;
  onNouvelleReception?: () => void;
  onCreerTransfert?: () => void;
  onNouvelleDispensation?: () => void;
  onGenererRapport?: () => void;
}

const StockDashboard: React.FC<StockDashboardProps> = ({
  medicaments,
  lots,
  mouvements,
  alertes,
  transferts,
  dispensations,
  onRefresh,
  onViewDetails,
  onExportData,
  onNouvelleReception,
  onCreerTransfert,
  onNouvelleDispensation,
  onGenererRapport,
}) => {
  const [selectedMagasin, setSelectedMagasin] = useState<'gros' | 'detail' | 'tous'>('tous');
  const [selectedPeriode, setSelectedPeriode] = useState('7j');
  const [openFilters, setOpenFilters] = useState(false);

  // Calcul des statistiques en temps réel
  const stats = useMemo(() => {
    const now = new Date();
    const periodeStart = new Date(now.getTime() - (selectedPeriode === '7j' ? 7 : selectedPeriode === '30j' ? 30 : 90) * 24 * 60 * 60 * 1000);
    
    // Filtrage par magasin
    const lotsFiltered = selectedMagasin === 'tous' ? lots : lots.filter(l => l.magasin === selectedMagasin);
    const mouvementsFiltered = mouvements.filter(m => new Date(m.date) >= periodeStart);
    const alertesFiltered = alertes.filter(a => a.statut === 'active');
    
    // Calculs des métriques
    const totalMedicaments = medicaments.length;
    const totalLots = lotsFiltered.length;
    const totalStock = lotsFiltered.reduce((sum, lot) => sum + (lot.quantiteDisponible || 0), 0);
    const valeurStock = lotsFiltered.reduce((sum, lot) => sum + (lot.quantiteDisponible * lot.prixAchat || 0), 0);
    
    // Alertes critiques
    const alertesCritiques = alertesFiltered.filter(a => a.niveau === 'critique').length;
    const alertesWarnings = alertesFiltered.filter(a => a.niveau === 'warning').length;
    
    // Péremptions
    const peremptions7j = lotsFiltered.filter(l => {
      const expiration = new Date(l.dateExpiration);
      const diffDays = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7 && diffDays > 0;
    }).length;
    
    const peremptions30j = lotsFiltered.filter(l => {
      const expiration = new Date(l.dateExpiration);
      const diffDays = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30 && diffDays > 0;
    }).length;
    
    // Mouvements
    const entrees = mouvementsFiltered.filter(m => m.type === 'entree').length;
    const sorties = mouvementsFiltered.filter(m => m.type === 'sortie').length;
    const transfertsCount = transferts.filter(t => new Date(t.date) >= periodeStart).length;
    const dispensationsCount = dispensations.filter(d => new Date(d.date) >= periodeStart).length;
    
    // Taux de rotation
    const tauxRotation = totalStock > 0 ? (sorties / totalStock) * 100 : 0;
    
    // Médicaments en rupture
    const ruptures = medicaments.filter(m => {
      const stockMed = lotsFiltered.filter(l => l.medicamentId === m.id);
      const totalStockMed = stockMed.reduce((sum, lot) => sum + lot.quantiteDisponible, 0);
      return totalStockMed <= m.seuilRupture;
    }).length;
    
    return {
      totalMedicaments,
      totalLots,
      totalStock,
      valeurStock,
      alertesCritiques,
      alertesWarnings,
      peremptions7j,
      peremptions30j,
      entrees,
      sorties,
      transfertsCount,
      dispensationsCount,
      tauxRotation,
      ruptures,
    };
  }, [medicaments, lots, mouvements, alertes, transferts, dispensations, selectedMagasin, selectedPeriode]);

  // Données pour les graphiques (simulation)
  const chartData = useMemo(() => {
    const jours = selectedPeriode === '7j' ? 7 : selectedPeriode === '30j' ? 30 : 90;
    const data = [];
    
    for (let i = jours - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const entrees = Math.floor(Math.random() * 10);
      const sorties = Math.floor(Math.random() * 8);
      
      data.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        entrees,
        sorties,
        stock: Math.max(0, entrees - sorties + (data[data.length - 1]?.stock || 0)),
      });
    }
    
    return data;
  }, [selectedPeriode]);

  return (
    <Box>
      {/* En-tête avec contrôles */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Tableau de Bord - Stock Temps Réel
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setOpenFilters(true)}
          >
            Filtres
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
          >
            Actualiser
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => onExportData('excel')}
          >
            Exporter
          </Button>
        </Box>
      </Box>

      {/* Alertes critiques */}
      {stats.alertesCritiques > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">
            {stats.alertesCritiques} alerte(s) critique(s) nécessitent une attention immédiate
          </Typography>
        </Alert>
      )}

      {/* Métriques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Inventory sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Stock Total
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalStock.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stats.totalLots} lots • {stats.totalMedicaments} médicaments
              </Typography>
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
                    Valeur Stock
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.valeurStock.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Taux rotation: {stats.tauxRotation.toFixed(1)}%
              </Typography>
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
                  <Typography variant="h4" component="div" color="warning.main">
                    {stats.alertesCritiques + stats.alertesWarnings}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stats.alertesCritiques} critiques • {stats.alertesWarnings} warnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Péremptions
                  </Typography>
                  <Typography variant="h4" component="div" color="error.main">
                    {stats.peremptions7j}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stats.peremptions7j} dans 7j • {stats.peremptions30j} dans 30j
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphiques et tendances */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mouvements de Stock - {selectedPeriode}
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'end', gap: 1, p: 2 }}>
                {chartData.map((item, index) => (
                  <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                      <Box
                        sx={{
                          height: `${(item.entrees / 10) * 100}px`,
                          width: '20px',
                          backgroundColor: 'success.main',
                          borderRadius: '2px 2px 0 0',
                        }}
                      />
                      <Box
                        sx={{
                          height: `${(item.sorties / 10) * 100}px`,
                          width: '20px',
                          backgroundColor: 'error.main',
                          borderRadius: '0 0 2px 2px',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {item.date}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Chip label="Entrées" color="success" size="small" />
                <Chip label="Sorties" color="error" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activité Récente
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.entrees} entrées`}
                    secondary="Cette période"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingDown color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.sorties} sorties`}
                    secondary="Cette période"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocalShipping color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.transfertsCount} transferts`}
                    secondary="Cette période"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Assignment color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.dispensationsCount} dispensations`}
                    secondary="Cette période"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertes et actions rapides */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alertes Prioritaires
              </Typography>
              <List>
                {alertes.slice(0, 5).map((alerte) => (
                  <ListItem key={alerte.id} divider>
                    <ListItemIcon>
                      {alerte.niveau === 'critique' ? (
                        <Error color="error" />
                      ) : (
                        <Warning color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={alerte.message}
                      secondary={`${alerte.type} • ${new Date(alerte.dateCreation).toLocaleDateString()}`}
                    />
                    <IconButton
                      size="small"
                      onClick={() => onViewDetails('alerte', alerte.id)}
                    >
                      <Visibility />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions Rapides
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Inventory />}
                  onClick={onNouvelleReception || (() => onViewDetails('reception', ''))}
                >
                  Nouvelle Réception
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LocalShipping />}
                  onClick={onCreerTransfert || (() => onViewDetails('transfert', ''))}
                >
                  Créer Transfert
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assignment />}
                  onClick={onNouvelleDispensation || (() => onViewDetails('dispensation', ''))}
                >
                  Nouvelle Dispensation
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  onClick={onGenererRapport || (() => onViewDetails('rapport', ''))}
                >
                  Générer Rapport
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de filtres */}
      <Dialog open={openFilters} onClose={() => setOpenFilters(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filtres du Tableau de Bord</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Magasin"
              value={selectedMagasin}
              onChange={(e) => setSelectedMagasin(e.target.value as any)}
              fullWidth
            >
              <MenuItem value="tous">Tous les magasins</MenuItem>
              <MenuItem value="gros">Magasin Gros</MenuItem>
              <MenuItem value="detail">Magasin Détail</MenuItem>
            </TextField>
            <TextField
              select
              label="Période"
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              fullWidth
            >
              <MenuItem value="7j">7 derniers jours</MenuItem>
              <MenuItem value="30j">30 derniers jours</MenuItem>
              <MenuItem value="90j">90 derniers jours</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFilters(false)}>Annuler</Button>
          <Button onClick={() => setOpenFilters(false)} variant="contained">
            Appliquer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockDashboard;
