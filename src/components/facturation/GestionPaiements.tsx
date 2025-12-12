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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Payment,
  Receipt,
  Print,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { FacturationService, Facture, Paiement } from '../../services/facturationService';
import { useFacturationPermissions } from '../../hooks/useFacturationPermissions';
import { PAYMENT_METHODS, getPaymentMethodLabel, getPaymentMethodConfig } from '../../constants/paymentMethods';

interface GestionPaiementsProps {
  factureId?: string;
  patientId?: string;
}

const GestionPaiements: React.FC<GestionPaiementsProps> = ({ factureId, patientId }) => {
  const permissions = useFacturationPermissions();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [factureSelectionnee, setFactureSelectionnee] = useState<Facture | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [openPaiementDialog, setOpenPaiementDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formPaiement, setFormPaiement] = useState<Partial<Paiement>>({
    montant: 0,
    mode_paiement: 'especes',
    date_paiement: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (permissions.canPaiement) {
      chargerFactures();
    }
  }, [factureId, patientId, permissions.canPaiement]);

  useEffect(() => {
    if (factureSelectionnee && permissions.canPaiement) {
      chargerPaiements(factureSelectionnee.id);
    }
  }, [factureSelectionnee, permissions.canPaiement]);

  if (!permissions.canPaiement) {
    return (
      <Alert severity="warning">
        Vous n'avez pas les permissions nécessaires pour enregistrer des paiements.
      </Alert>
    );
  }

  const chargerFactures = async () => {
    try {
      let data: Facture[];
      if (factureId) {
        const facture = await FacturationService.getFactureById(factureId);
        data = [facture];
        setFactureSelectionnee(facture);
      } else if (patientId) {
        data = await FacturationService.getFacturesByPatient(patientId);
      } else {
        data = await FacturationService.getFactures({ statut: 'en_attente' });
      }
      setFactures(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des factures: ' + err.message);
    }
  };

  const chargerPaiements = async (id: string) => {
    try {
      const data = await FacturationService.getPaiementsByFacture(id);
      setPaiements(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des paiements: ' + err.message);
    }
  };

  const enregistrerPaiement = async () => {
    if (!factureSelectionnee) {
      setError('Veuillez sélectionner une facture');
      return;
    }

    if (!formPaiement.montant || formPaiement.montant <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    if (formPaiement.montant > factureSelectionnee.montant_restant) {
      setError(`Le montant ne peut pas dépasser le reste à payer (${factureSelectionnee.montant_restant.toLocaleString()} FCFA)`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userData = localStorage.getItem('user');
      const caissierId = userData ? JSON.parse(userData).id : undefined;

      await FacturationService.enregistrerPaiement({
        facture_id: factureSelectionnee.id,
        montant: formPaiement.montant!,
        mode_paiement: formPaiement.mode_paiement!,
        date_paiement: formPaiement.date_paiement || new Date().toISOString(),
        numero_transaction: formPaiement.numero_transaction,
        banque: formPaiement.banque,
        numero_cheque: formPaiement.numero_cheque,
        reference_prise_en_charge: formPaiement.reference_prise_en_charge,
        notes: formPaiement.notes
      }, caissierId);

      // Recharger les données
      await chargerFactures();
      if (factureSelectionnee) {
        await chargerPaiements(factureSelectionnee.id);
      }

      // Réinitialiser le formulaire
      setFormPaiement({
        montant: 0,
        mode_paiement: 'especes',
        date_paiement: new Date().toISOString().split('T')[0]
      });
      setOpenPaiementDialog(false);
    } catch (err: any) {
      setError('Erreur lors de l\'enregistrement du paiement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'payee': return 'success';
      case 'partiellement_payee': return 'warning';
      case 'en_attente': return 'info';
      case 'en_credit': return 'warning';
      case 'annulee': return 'error';
      default: return 'default';
    }
  };

  const getModePaiementLabel = (mode: string) => {
    return getPaymentMethodLabel(mode);
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <Payment /> Gestion des Paiements
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenPaiementDialog(true)}
              disabled={!factureSelectionnee}
            >
              Enregistrer un Paiement
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Liste des factures */}
          {!factureId && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {factures.map((facture) => (
                <Grid item xs={12} md={6} key={facture.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      borderColor: factureSelectionnee?.id === facture.id ? 'primary.main' : 'divider',
                      bgcolor: factureSelectionnee?.id === facture.id ? 'action.selected' : 'background.paper'
                    }}
                    onClick={() => setFactureSelectionnee(facture)}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Typography variant="h6">{facture.numero_facture}</Typography>
                        <Chip
                          label={facture.statut}
                          color={getStatutColor(facture.statut) as any}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {new Date(facture.date_facture).toLocaleDateString()}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mt={2}>
                        <Typography variant="body2">Total:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {facture.montant_total.toLocaleString()} FCFA
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Payé:</Typography>
                        <Typography variant="body1" color="success.main">
                          {facture.montant_paye.toLocaleString()} FCFA
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Reste:</Typography>
                        <Typography variant="body1" color="warning.main" fontWeight="bold">
                          {facture.montant_restant.toLocaleString()} FCFA
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Détails de la facture sélectionnée */}
          {factureSelectionnee && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Facture:</strong> {factureSelectionnee.numero_facture} | 
                  <strong> Total:</strong> {factureSelectionnee.montant_total.toLocaleString()} FCFA | 
                  <strong> Reste à payer:</strong> {factureSelectionnee.montant_restant.toLocaleString()} FCFA
                </Typography>
              </Alert>

              {/* Historique des paiements */}
              <Typography variant="h6" gutterBottom>
                Historique des Paiements
              </Typography>
              {paiements.length === 0 ? (
                <Alert severity="info">Aucun paiement enregistré pour cette facture.</Alert>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>N° Paiement</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Mode</TableCell>
                        <TableCell align="right">Montant</TableCell>
                        <TableCell>Référence</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paiements.map((paiement) => (
                        <TableRow key={paiement.id}>
                          <TableCell>{paiement.numero_paiement}</TableCell>
                          <TableCell>
                            {new Date(paiement.date_paiement).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getModePaiementLabel(paiement.mode_paiement)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {paiement.montant.toLocaleString()} FCFA
                          </TableCell>
                          <TableCell>
                            {paiement.numero_transaction || paiement.reference_prise_en_charge || '-'}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Imprimer reçu">
                              <IconButton size="small">
                                <Print />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour enregistrer un paiement */}
      <Dialog open={openPaiementDialog} onClose={() => setOpenPaiementDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enregistrer un Paiement</DialogTitle>
        <DialogContent>
          {factureSelectionnee && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Reste à payer: <strong>{factureSelectionnee.montant_restant.toLocaleString()} FCFA</strong>
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Montant (FCFA)"
                type="number"
                value={formPaiement.montant}
                onChange={(e) => setFormPaiement({ ...formPaiement, montant: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, max: factureSelectionnee?.montant_restant }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Mode de Paiement</InputLabel>
                <Select
                  value={formPaiement.mode_paiement}
                  onChange={(e) => setFormPaiement({ ...formPaiement, mode_paiement: e.target.value as any })}
                  label="Mode de Paiement"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {(() => {
              const methodConfig = getPaymentMethodConfig(formPaiement.mode_paiement);
              return methodConfig?.requiresTransactionNumber && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Numéro de Transaction"
                    value={formPaiement.numero_transaction || ''}
                    onChange={(e) => setFormPaiement({ ...formPaiement, numero_transaction: e.target.value })}
                    required
                  />
                </Grid>
              );
            })()}
            {formPaiement.mode_paiement === 'virement' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Banque"
                    value={formPaiement.banque}
                    onChange={(e) => setFormPaiement({ ...formPaiement, banque: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Numéro de Transaction"
                    value={formPaiement.numero_transaction}
                    onChange={(e) => setFormPaiement({ ...formPaiement, numero_transaction: e.target.value })}
                  />
                </Grid>
              </>
            )}
            {formPaiement.mode_paiement === 'cheque' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Numéro de Chèque"
                  value={formPaiement.numero_cheque}
                  onChange={(e) => setFormPaiement({ ...formPaiement, numero_cheque: e.target.value })}
                />
              </Grid>
            )}
            {formPaiement.mode_paiement === 'prise_en_charge' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Référence Prise en Charge"
                  value={formPaiement.reference_prise_en_charge}
                  onChange={(e) => setFormPaiement({ ...formPaiement, reference_prise_en_charge: e.target.value })}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date de Paiement"
                type="date"
                value={formPaiement.date_paiement}
                onChange={(e) => setFormPaiement({ ...formPaiement, date_paiement: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formPaiement.notes}
                onChange={(e) => setFormPaiement({ ...formPaiement, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaiementDialog(false)}>Annuler</Button>
          <Button onClick={enregistrerPaiement} variant="contained" disabled={loading}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionPaiements;

