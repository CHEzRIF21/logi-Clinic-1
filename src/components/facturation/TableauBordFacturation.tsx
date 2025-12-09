import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  Receipt,
  Payment,
  Warning,
  Assessment,
} from '@mui/icons-material';
import { FacturationService } from '../../services/facturationService';

const TableauBordFacturation: React.FC = () => {
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois' | 'annee'>('mois');
  const [dateDebut, setDateDebut] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [dateFin, setDateFin] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statistiques, setStatistiques] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculerDatesPeriode();
  }, [periode]);

  useEffect(() => {
    chargerStatistiques();
  }, [dateDebut, dateFin]);

  const calculerDatesPeriode = () => {
    const aujourdhui = new Date();
    let debut: Date;
    let fin: Date = aujourdhui;

    switch (periode) {
      case 'jour':
        debut = new Date(aujourdhui);
        break;
      case 'semaine':
        debut = new Date(aujourdhui);
        debut.setDate(aujourdhui.getDate() - 7);
        break;
      case 'mois':
        debut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
        break;
      case 'annee':
        debut = new Date(aujourdhui.getFullYear(), 0, 1);
        break;
      default:
        debut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
    }

    setDateDebut(debut.toISOString().split('T')[0]);
    setDateFin(fin.toISOString().split('T')[0]);
  };

  const chargerStatistiques = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await FacturationService.getStatistiquesFacturation({
        dateDebut,
        dateFin
      });
      setStatistiques(stats);
    } catch (err: any) {
      setError('Erreur lors du chargement des statistiques: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLabelPeriode = () => {
    switch (periode) {
      case 'jour': return 'Aujourd\'hui';
      case 'semaine': return '7 derniers jours';
      case 'mois': return 'Ce mois';
      case 'annee': return 'Cette année';
      default: return 'Période';
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <Assessment /> Tableau de Bord Financier
            </Typography>
            <Box display="flex" gap={2}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Période</InputLabel>
                <Select
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value as any)}
                  label="Période"
                >
                  <MenuItem value="jour">Aujourd'hui</MenuItem>
                  <MenuItem value="semaine">7 derniers jours</MenuItem>
                  <MenuItem value="mois">Ce mois</MenuItem>
                  <MenuItem value="annee">Cette année</MenuItem>
                </Select>
              </FormControl>
              <TextField
                type="date"
                label="Date début"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ width: 150 }}
              />
              <TextField
                type="date"
                label="Date fin"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ width: 150 }}
              />
            </Box>
          </Box>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {statistiques && (
            <Grid container spacing={3}>
              {/* Indicateurs principaux */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Total Facturé
                        </Typography>
                        <Typography variant="h4" color="primary">
                          {statistiques.totalFacture.toLocaleString()} FCFA
                        </Typography>
                      </Box>
                      <Receipt color="primary" sx={{ fontSize: 40 }} />
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
                          Total Payé
                        </Typography>
                        <Typography variant="h4" color="success.main">
                          {statistiques.totalPaye.toLocaleString()} FCFA
                        </Typography>
                      </Box>
                      <Payment color="success" sx={{ fontSize: 40 }} />
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
                          Crédits en Attente
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          {statistiques.totalCredit.toLocaleString()} FCFA
                        </Typography>
                      </Box>
                      <Warning color="warning" sx={{ fontSize: 40 }} />
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
                          Nombre de Factures
                        </Typography>
                        <Typography variant="h4">
                          {statistiques.nombreFactures}
                        </Typography>
                      </Box>
                      <AttachMoney color="info" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Répartition par service */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Répartition par Service
                    </Typography>
                    {Object.keys(statistiques.repartitionService || {}).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Aucune donnée disponible
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Object.entries(statistiques.repartitionService || {}).map(([service, montant]: [string, any]) => (
                          <Box key={service} display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" textTransform="capitalize">
                              {service}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {montant.toLocaleString()} FCFA
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Répartition par mode de paiement */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Répartition par Mode de Paiement
                    </Typography>
                    {Object.keys(statistiques.repartitionPaiement || {}).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Aucune donnée disponible
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Object.entries(statistiques.repartitionPaiement || {}).map(([mode, montant]: [string, any]) => (
                          <Box key={mode} display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" textTransform="capitalize">
                              {mode.replace('_', ' ')}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {montant.toLocaleString()} FCFA
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Factures par statut */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Factures par Statut
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                          <Typography variant="h4" color="success.dark">
                            {statistiques.facturesParStatut?.payees || 0}
                          </Typography>
                          <Typography variant="body2">Payées</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                          <Typography variant="h4" color="info.dark">
                            {statistiques.facturesParStatut?.en_attente || 0}
                          </Typography>
                          <Typography variant="body2">En Attente</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                          <Typography variant="h4" color="warning.dark">
                            {statistiques.facturesParStatut?.en_credit || 0}
                          </Typography>
                          <Typography variant="body2">En Crédit</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                          <Typography variant="h4" color="error.dark">
                            {statistiques.facturesParStatut?.annulees || 0}
                          </Typography>
                          <Typography variant="body2">Annulées</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {loading && (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography>Chargement...</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TableauBordFacturation;

