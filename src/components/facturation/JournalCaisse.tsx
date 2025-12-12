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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Print,
  Download,
  Refresh,
  Lock,
  LockOpen,
} from '@mui/icons-material';
import { FacturationService, JournalCaisse as JournalCaisseType } from '../../services/facturationService';

const JournalCaisse: React.FC = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [journal, setJournal] = useState<JournalCaisseType | null>(null);
  const [rapport, setRapport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFermetureDialog, setOpenFermetureDialog] = useState(false);
  const [soldeOuverture, setSoldeOuverture] = useState<number>(0);

  useEffect(() => {
    chargerJournal();
  }, [date]);

  const chargerJournal = async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = localStorage.getItem('user');
      const caissierId = userData ? JSON.parse(userData).id : undefined;

      const journalData = await FacturationService.getJournalCaisse(date, caissierId);
      setJournal(journalData);

      const rapportData = await FacturationService.getRapportJournalier(date);
      setRapport(rapportData);
    } catch (err: any) {
      setError('Erreur lors du chargement du journal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const ouvrirJournal = async () => {
    if (!soldeOuverture && soldeOuverture !== 0) {
      setError('Veuillez saisir le solde d\'ouverture');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userData = localStorage.getItem('user');
      const caissierId: string | undefined = userData ? JSON.parse(userData).id : undefined;
      if (!caissierId) throw new Error('Utilisateur non identifié');

      await FacturationService.ouvrirJournalCaisse(date, caissierId, soldeOuverture);
      await chargerJournal();
      setSoldeOuverture(0);
    } catch (err: any) {
      setError('Erreur lors de l\'ouverture du journal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fermerJournal = async () => {
    setLoading(true);
    setError(null);

    try {
      const userData = localStorage.getItem('user');
      const caissierId: string | undefined = userData ? JSON.parse(userData).id : undefined;
      if (!caissierId) throw new Error('Utilisateur non identifié');

      await FacturationService.fermerJournalCaisse(date, caissierId);
      await chargerJournal();
      setOpenFermetureDialog(false);
    } catch (err: any) {
      setError('Erreur lors de la fermeture du journal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const exporterRapport = () => {
    if (!rapport) return;

    const contenu = `
RAPPORT JOURNALIER DE CAISSE
Date: ${new Date(date).toLocaleDateString()}
========================================

RECETTES
--------
Espèces: ${rapport.journal?.recettes_especes?.toLocaleString() || 0} FCFA
Orange Money: ${rapport.journal?.recettes_orange_money?.toLocaleString() || 0} FCFA
MTN Mobile Money: ${rapport.journal?.recettes_mtn_mobile_money?.toLocaleString() || 0} FCFA
Moov Money: ${rapport.journal?.recettes_moov_money?.toLocaleString() || 0} FCFA
Wave: ${rapport.journal?.recettes_wave?.toLocaleString() || 0} FCFA
Flooz: ${rapport.journal?.recettes_flooz?.toLocaleString() || 0} FCFA
T-Money: ${rapport.journal?.recettes_t_money?.toLocaleString() || 0} FCFA
Carte Bancaire: ${rapport.journal?.recettes_carte?.toLocaleString() || 0} FCFA
Virement: ${rapport.journal?.recettes_virement?.toLocaleString() || 0} FCFA
Chèque: ${rapport.journal?.recettes_cheque?.toLocaleString() || 0} FCFA
Prise en Charge: ${rapport.journal?.recettes_prise_en_charge?.toLocaleString() || 0} FCFA
Total Recettes: ${rapport.journal?.total_recettes?.toLocaleString() || 0} FCFA

DÉPENSES
--------
Total Dépenses: ${rapport.journal?.total_depenses?.toLocaleString() || 0} FCFA

SOLDES
------
Solde d'ouverture: ${rapport.journal?.solde_ouverture?.toLocaleString() || 0} FCFA
Solde de fermeture: ${rapport.journal?.solde_fermeture?.toLocaleString() || 0} FCFA

STATISTIQUES
------------
Nombre de factures: ${rapport.statistiques?.nombreFactures || 0}
Nombre de paiements: ${rapport.statistiques?.nombrePaiements || 0}
Total facturé: ${rapport.statistiques?.totalFacture?.toLocaleString() || 0} FCFA
Total payé: ${rapport.statistiques?.totalPaye?.toLocaleString() || 0} FCFA
    `;

    const blob = new Blob([contenu], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_caisse_${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <AccountBalanceWallet /> Journal de Caisse
            </Typography>
            <Box display="flex" gap={2}>
              <TextField
                type="date"
                label="Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={chargerJournal}
                disabled={loading}
              >
                Actualiser
              </Button>
              {rapport && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={exporterRapport}
                  >
                    Exporter
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => window.print()}
                  >
                    Imprimer
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!journal && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Aucun journal de caisse pour cette date. 
              <Button
                size="small"
                onClick={() => setOpenFermetureDialog(true)}
                sx={{ ml: 2 }}
              >
                Ouvrir le journal
              </Button>
            </Alert>
          )}

          {journal && (
            <Grid container spacing={3}>
              {/* En-tête du journal */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Journal du {new Date(date).toLocaleDateString()}
                      </Typography>
                      <Chip
                        label={journal.statut}
                        color={
                          journal.statut === 'ouvert' ? 'success' :
                          journal.statut === 'ferme' ? 'warning' : 'default'
                        }
                        icon={journal.statut === 'ouvert' ? <LockOpen /> : <Lock />}
                      />
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          Solde d'ouverture
                        </Typography>
                        <Typography variant="h5" color="primary">
                          {journal.solde_ouverture.toLocaleString()} FCFA
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          Solde de fermeture
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          {journal.solde_fermeture.toLocaleString()} FCFA
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recettes */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recettes
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Espèces</TableCell>
                          <TableCell align="right">
                            {journal.recettes_especes.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                        {journal.recettes_orange_money !== undefined && journal.recettes_orange_money > 0 && (
                          <TableRow>
                            <TableCell>Orange Money</TableCell>
                            <TableCell align="right">
                              {journal.recettes_orange_money.toLocaleString()} FCFA
                            </TableCell>
                          </TableRow>
                        )}
                        {journal.recettes_mtn_mobile_money !== undefined && journal.recettes_mtn_mobile_money > 0 && (
                          <TableRow>
                            <TableCell>MTN Mobile Money</TableCell>
                            <TableCell align="right">
                              {journal.recettes_mtn_mobile_money.toLocaleString()} FCFA
                            </TableCell>
                          </TableRow>
                        )}
                        {journal.recettes_moov_money !== undefined && journal.recettes_moov_money > 0 && (
                          <TableRow>
                            <TableCell>Moov Money</TableCell>
                            <TableCell align="right">
                              {journal.recettes_moov_money.toLocaleString()} FCFA
                            </TableCell>
                          </TableRow>
                        )}
                        {journal.recettes_wave !== undefined && journal.recettes_wave > 0 && (
                          <TableRow>
                            <TableCell>Wave</TableCell>
                            <TableCell align="right">
                              {journal.recettes_wave.toLocaleString()} FCFA
                            </TableCell>
                          </TableRow>
                        )}
                        {journal.recettes_flooz !== undefined && journal.recettes_flooz > 0 && (
                          <TableRow>
                            <TableCell>Flooz</TableCell>
                            <TableCell align="right">
                              {journal.recettes_flooz.toLocaleString()} FCFA
                            </TableCell>
                          </TableRow>
                        )}
                        {journal.recettes_t_money !== undefined && journal.recettes_t_money > 0 && (
                          <TableRow>
                            <TableCell>T-Money</TableCell>
                            <TableCell align="right">
                              {journal.recettes_t_money.toLocaleString()} FCFA
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell>Carte Bancaire</TableCell>
                          <TableCell align="right">
                            {journal.recettes_carte.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Virement</TableCell>
                          <TableCell align="right">
                            {journal.recettes_virement.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                        {journal.recettes_cheque !== undefined && journal.recettes_cheque > 0 && (
                          <TableRow>
                            <TableCell>Chèque</TableCell>
                            <TableCell align="right">
                              {journal.recettes_cheque.toLocaleString()} FCFA
                            </TableCell>
                          </TableRow>
                        )}
                        {journal.recettes_prise_en_charge !== undefined && journal.recettes_prise_en_charge > 0 && (
                          <TableRow>
                            <TableCell>Prise en Charge</TableCell>
                            <TableCell align="right">
                              {journal.recettes_prise_en_charge.toLocaleString()} FCFA
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell>Autres</TableCell>
                          <TableCell align="right">
                            {journal.recettes_autres.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {journal.total_recettes.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>

              {/* Dépenses */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Dépenses
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Espèces</TableCell>
                          <TableCell align="right">
                            {journal.depenses_especes.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Autres</TableCell>
                          <TableCell align="right">
                            {journal.depenses_autres.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {journal.total_depenses.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>

              {/* Statistiques */}
              {rapport && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Statistiques du Jour
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Nombre de factures
                          </Typography>
                          <Typography variant="h4">
                            {rapport.statistiques?.nombreFactures || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Nombre de paiements
                          </Typography>
                          <Typography variant="h4">
                            {rapport.statistiques?.nombrePaiements || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Total facturé
                          </Typography>
                          <Typography variant="h4" color="primary">
                            {rapport.statistiques?.totalFacture?.toLocaleString() || 0} FCFA
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Total payé
                          </Typography>
                          <Typography variant="h4" color="success.main">
                            {rapport.statistiques?.totalPaye?.toLocaleString() || 0} FCFA
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Actions */}
              {journal.statut === 'ouvert' && (
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end">
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<Lock />}
                      onClick={() => setOpenFermetureDialog(true)}
                    >
                      Fermer le Journal
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour ouvrir/fermer le journal */}
      <Dialog open={openFermetureDialog} onClose={() => setOpenFermetureDialog(false)}>
        <DialogTitle>
          {journal ? 'Fermer le Journal de Caisse' : 'Ouvrir le Journal de Caisse'}
        </DialogTitle>
        <DialogContent>
          {journal ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Êtes-vous sûr de vouloir fermer le journal de caisse pour le {new Date(date).toLocaleDateString()} ?
              Cette action ne peut pas être annulée.
            </Alert>
          ) : (
            <TextField
              fullWidth
              label="Solde d'Ouverture (FCFA)"
              type="number"
              value={soldeOuverture}
              onChange={(e) => setSoldeOuverture(parseFloat(e.target.value) || 0)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenFermetureDialog(false);
            setSoldeOuverture(0);
          }}>
            Annuler
          </Button>
          <Button
            onClick={journal ? fermerJournal : ouvrirJournal}
            variant="contained"
            disabled={loading}
          >
            {journal ? 'Fermer' : 'Ouvrir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JournalCaisse;

