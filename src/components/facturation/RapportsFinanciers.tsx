import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Assessment,
  Download,
  Print,
  TrendingUp,
  Payment,
  Warning,
} from '@mui/icons-material';
import { FacturationService, RapportFinancier } from '../../services/facturationService';
import { useFacturationPermissions } from '../../hooks/useFacturationPermissions';

const RapportsFinanciers: React.FC = () => {
  const permissions = useFacturationPermissions();
  const [dateDebut, setDateDebut] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [dateFin, setDateFin] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [rapport, setRapport] = useState<RapportFinancier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permissions.canRapports) {
      chargerRapport();
    }
  }, [dateDebut, dateFin]);

  const chargerRapport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await FacturationService.getRapportFinancierComplet({
        dateDebut,
        dateFin
      });
      setRapport(data);
    } catch (err: any) {
      setError('Erreur lors du chargement du rapport: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const exporterRapport = () => {
    if (!rapport) return;

    const contenu = `
RAPPORT FINANCIER COMPLET
Période: ${new Date(dateDebut).toLocaleDateString()} - ${new Date(dateFin).toLocaleDateString()}
========================================

1. RECETTES PAR SERVICE
${Object.entries(rapport.recettesParService).map(([service, montant]) => 
  `  ${service}: ${montant.toLocaleString()} FCFA`
).join('\n')}

2. RECETTES PAR UTILISATEUR
${Object.entries(rapport.recettesParUtilisateur).map(([userId, montant]) => 
  `  Utilisateur ${userId}: ${montant.toLocaleString()} FCFA`
).join('\n')}

3. STATISTIQUES MENSUELLES
${rapport.statistiquesMensuelles.map(stat => 
  `  ${stat.mois}: ${stat.nombreFactures} factures, ${stat.totalFacture.toLocaleString()} FCFA facturé, ${stat.totalPaye.toLocaleString()} FCFA payé`
).join('\n')}

4. ÉTAT DES PAIEMENTS
  Espèces: ${rapport.etatPaiements.especes.toLocaleString()} FCFA
  Mobile Money: ${rapport.etatPaiements.mobile_money.toLocaleString()} FCFA
  Carte Bancaire: ${rapport.etatPaiements.carte_bancaire.toLocaleString()} FCFA
  Virement: ${rapport.etatPaiements.virement.toLocaleString()} FCFA
  Chèque: ${rapport.etatPaiements.cheque.toLocaleString()} FCFA
  Prise en Charge: ${rapport.etatPaiements.prise_en_charge.toLocaleString()} FCFA

5. FACTURES IMPAYÉES
  Nombre: ${rapport.facturesImpayees.length}
  Total: ${rapport.facturesImpayees.reduce((sum, f) => sum + f.montant_restant, 0).toLocaleString()} FCFA

6. BILAN DE TRÉSORERIE
  Entrées: ${rapport.bilanTresorerie.entree.toLocaleString()} FCFA
  Sorties: ${rapport.bilanTresorerie.sortie.toLocaleString()} FCFA
  Solde: ${rapport.bilanTresorerie.solde.toLocaleString()} FCFA
    `;

    const blob = new Blob([contenu], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_financier_${dateDebut}_${dateFin}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!permissions.canRapports) {
    return (
      <Alert severity="warning">
        Vous n'avez pas les permissions nécessaires pour consulter les rapports financiers.
      </Alert>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <Assessment /> Rapports Financiers Complets
            </Typography>
            <Box display="flex" gap={2}>
              <TextField
                type="date"
                label="Date début"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <TextField
                type="date"
                label="Date fin"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exporterRapport}
                disabled={!rapport}
              >
                Exporter
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading && (
            <Alert severity="info">Chargement du rapport...</Alert>
          )}

          {rapport && (
            <Grid container spacing={3}>
              {/* Recettes par service */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      1. Recettes par Service
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Service</TableCell>
                            <TableCell align="right">Montant</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(rapport.recettesParService).map(([service, montant]) => (
                            <TableRow key={service}>
                              <TableCell>{service}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {montant.toLocaleString()} FCFA
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* État des paiements */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      4. État des Paiements
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Mode</TableCell>
                            <TableCell align="right">Montant</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(rapport.etatPaiements).map(([mode, montant]) => (
                            <TableRow key={mode}>
                              <TableCell>{mode.replace('_', ' ')}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {montant.toLocaleString()} FCFA
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Factures impayées */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      5. Factures Impayées ({rapport.facturesImpayees.length})
                    </Typography>
                    {rapport.facturesImpayees.length === 0 ? (
                      <Alert severity="success">Aucune facture impayée</Alert>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>N° Facture</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell>Patient</TableCell>
                              <TableCell align="right">Montant Total</TableCell>
                              <TableCell align="right">Montant Payé</TableCell>
                              <TableCell align="right">Reste à Payer</TableCell>
                              <TableCell>Statut</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rapport.facturesImpayees.slice(0, 10).map((facture) => (
                              <TableRow key={facture.id}>
                                <TableCell>{facture.numero_facture}</TableCell>
                                <TableCell>
                                  {new Date(facture.date_facture).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{facture.patient_id}</TableCell>
                                <TableCell align="right">
                                  {facture.montant_total.toLocaleString()} FCFA
                                </TableCell>
                                <TableCell align="right">
                                  {facture.montant_paye.toLocaleString()} FCFA
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                  {facture.montant_restant.toLocaleString()} FCFA
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={facture.statut}
                                    color={facture.statut === 'en_credit' ? 'warning' : 'info'}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Bilan de trésorerie */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      6. Bilan de Trésorerie
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
                          <Typography variant="body2" color="text.secondary">
                            Entrées
                          </Typography>
                          <Typography variant="h4" color="success.dark">
                            {rapport.bilanTresorerie.entree.toLocaleString()} FCFA
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
                          <Typography variant="body2" color="text.secondary">
                            Sorties
                          </Typography>
                          <Typography variant="h4" color="error.dark">
                            {rapport.bilanTresorerie.sortie.toLocaleString()} FCFA
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
                          <Typography variant="body2" color="text.secondary">
                            Solde
                          </Typography>
                          <Typography variant="h4" color="primary.dark">
                            {rapport.bilanTresorerie.solde.toLocaleString()} FCFA
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RapportsFinanciers;

