import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Payment,
  Receipt,
  CheckCircle,
  Print,
  Close,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { FacturationService, Facture, Paiement } from '../../services/facturationService';
import { PAYMENT_METHODS, getPaymentMethodLabel, getPaymentMethodConfig } from '../../constants/paymentMethods';
import { getMyClinicId } from '../../services/clinicService';
import { supabase, Patient } from '../../services/supabase';

interface PaymentProcessorProps {
  factureId: string;
  open: boolean;
  onClose: () => void;
  onPaymentComplete?: (facture: Facture) => void;
  consultationId?: string;
  patientId?: string;
}

export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  factureId,
  open,
  onClose,
  onPaymentComplete,
  consultationId,
  patientId,
}) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [paymentConfirmed, setPaymentConfirmed] = React.useState(false);
  const [facture, setFacture] = useState<Facture | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formPaiement, setFormPaiement] = useState<Partial<Paiement>>({
    montant: 0,
    mode_paiement: 'especes',
    date_paiement: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (open && factureId) {
      loadFacture();
    }
  }, [open, factureId]);

  useEffect(() => {
    if (facture) {
      // Initialiser le montant avec le reste à payer
      setFormPaiement(prev => ({
        ...prev,
        montant: facture.montant_restant,
      }));
    }
  }, [facture]);

  const loadFacture = async () => {
    try {
      setLoading(true);
      const factureData = await FacturationService.getFactureById(factureId);
      setFacture(factureData);
      
      // Récupérer les informations du patient
      if (factureData.patient_id) {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('id, nom, prenom, identifiant, telephone, sexe, date_naissance, age, date_enregistrement, adresse, email')
          .eq('id', factureData.patient_id)
          .single();
        
        if (!patientError && patientData) {
          setPatient(patientData as Patient);
        }
      }
    } catch (error: any) {
      console.error('Erreur chargement facture:', error);
      enqueueSnackbar('Erreur lors du chargement de la facture', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!facture) {
      enqueueSnackbar('Facture non chargée', { variant: 'error' });
      return;
    }

    if (!formPaiement.montant || formPaiement.montant <= 0) {
      enqueueSnackbar('Veuillez saisir un montant valide', { variant: 'error' });
      return;
    }

    if (formPaiement.montant > facture.montant_restant) {
      enqueueSnackbar(
        `Le montant ne peut pas dépasser le reste à payer (${facture.montant_restant.toLocaleString()} XOF)`,
        { variant: 'error' }
      );
      return;
    }

    setProcessing(true);
    try {
      const userData = localStorage.getItem('user');
      const caissierId = userData ? JSON.parse(userData).id : undefined;

      await FacturationService.enregistrerPaiement({
        facture_id: facture.id,
        montant: formPaiement.montant!,
        mode_paiement: formPaiement.mode_paiement!,
        date_paiement: formPaiement.date_paiement || new Date().toISOString(),
        numero_transaction: formPaiement.numero_transaction,
        banque: formPaiement.banque,
        numero_cheque: formPaiement.numero_cheque,
        reference_prise_en_charge: formPaiement.reference_prise_en_charge,
        notes: formPaiement.notes,
      }, caissierId);

      // Recharger la facture
      await loadFacture();

      enqueueSnackbar(
        `Paiement de ${formPaiement.montant!.toLocaleString()} XOF enregistré avec succès`,
        { variant: 'success' }
      );

      // Réinitialiser le formulaire
      setFormPaiement({
        montant: facture.montant_restant - formPaiement.montant!,
        mode_paiement: 'especes',
        date_paiement: new Date().toISOString().split('T')[0],
      });

      // Si la facture est complètement payée, appeler le callback
      const nouveauMontantRestant = facture.montant_restant - formPaiement.montant!;
      if (nouveauMontantRestant <= 0) {
        const updatedFacture = await FacturationService.getFactureById(factureId);
        setPaymentConfirmed(true);
        onPaymentComplete?.(updatedFacture);
        
        // Afficher un message de confirmation
        enqueueSnackbar(
          '✅ Paiement effectué avec succès ! Le patient peut maintenant accéder aux services.',
          { variant: 'success', autoHideDuration: 5000 }
        );
      }
    } catch (error: any) {
      console.error('Erreur enregistrement paiement:', error);
      enqueueSnackbar('Erreur lors de l\'enregistrement du paiement: ' + error.message, { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    // TODO: Implémenter l'impression du reçu
    enqueueSnackbar('Fonction d\'impression à implémenter', { variant: 'info' });
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'payee': return 'success';
      case 'partiellement_payee': return 'warning';
      case 'en_attente': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!facture) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Alert severity="error">Facture non trouvée</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fermer</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const montantRestant = facture.montant_restant - (formPaiement.montant || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Payment color="primary" />
            <Typography variant="h6">Enregistrement de Paiement</Typography>
          </Box>
          <Chip
            label={facture.statut}
            color={getStatutColor(facture.statut) as any}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Informations de la facture */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informations de la Facture
                </Typography>
                {patient && (
                  <Box mb={2} p={1.5} sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Patient
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">
                      {patient.prenom} {patient.nom}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {patient.identifiant} {patient.telephone && `| Tél: ${patient.telephone}`}
                    </Typography>
                  </Box>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Numéro de facture
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {facture.numero_facture}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(facture.date_facture).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {facture.montant_total.toLocaleString()} XOF
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Payé
                    </Typography>
                    <Typography variant="body1" color="success.main">
                      {facture.montant_paye.toLocaleString()} XOF
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Reste à payer
                    </Typography>
                    <Typography variant="h6" color="warning.main" fontWeight="bold">
                      {facture.montant_restant.toLocaleString()} XOF
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Lignes de facture */}
          {facture.lignes && facture.lignes.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Détails de la Facture
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Quantité</TableCell>
                          <TableCell align="right">Prix unitaire</TableCell>
                          <TableCell align="right">Montant</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {facture.lignes.map((ligne, index) => (
                          <TableRow key={index}>
                            <TableCell>{ligne.libelle}</TableCell>
                            <TableCell align="right">{ligne.quantite}</TableCell>
                            <TableCell align="right">
                              {ligne.prix_unitaire.toLocaleString()} XOF
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {ligne.montant_ligne.toLocaleString()} XOF
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Formulaire de paiement */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Nouveau Paiement
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Montant à payer (XOF)"
                      type="number"
                      value={formPaiement.montant || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormPaiement({ ...formPaiement, montant: Math.max(0, Math.min(val, facture.montant_restant)) });
                      }}
                      inputProps={{ min: 0, max: facture.montant_restant, step: 1 }}
                      required
                      helperText={`Maximum: ${facture.montant_restant.toLocaleString()} XOF`}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date de Paiement"
                      type="date"
                      value={formPaiement.date_paiement}
                      onChange={(e) => setFormPaiement({ ...formPaiement, date_paiement: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  {(() => {
                    const methodConfig = getPaymentMethodConfig(formPaiement.mode_paiement);
                    return methodConfig?.requiresTransactionNumber && (
                      <Grid item xs={12} md={6}>
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
                  {(formPaiement.mode_paiement === 'virement' || formPaiement.mode_paiement === 'cheque') && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Banque"
                        value={formPaiement.banque || ''}
                        onChange={(e) => setFormPaiement({ ...formPaiement, banque: e.target.value })}
                      />
                    </Grid>
                  )}
                  {formPaiement.mode_paiement === 'cheque' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Numéro de Chèque"
                        value={formPaiement.numero_cheque || ''}
                        onChange={(e) => setFormPaiement({ ...formPaiement, numero_cheque: e.target.value })}
                      />
                    </Grid>
                  )}
                  {formPaiement.mode_paiement === 'prise_en_charge' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Référence Prise en Charge"
                        value={formPaiement.reference_prise_en_charge || ''}
                        onChange={(e) => setFormPaiement({ ...formPaiement, reference_prise_en_charge: e.target.value })}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes (optionnel)"
                      multiline
                      rows={2}
                      value={formPaiement.notes || ''}
                      onChange={(e) => setFormPaiement({ ...formPaiement, notes: e.target.value })}
                    />
                  </Grid>
                </Grid>

                {formPaiement.montant && formPaiement.montant > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Montant à payer: <strong>{formPaiement.montant.toLocaleString()} XOF</strong>
                      {montantRestant > 0 && (
                        <> | Reste après paiement: <strong>{montantRestant.toLocaleString()} XOF</strong></>
                      )}
                      {montantRestant <= 0 && (
                        <> | <strong>Facture sera complètement payée</strong></>
                      )}
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Historique des paiements */}
          {facture.paiements && facture.paiements.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Historique des Paiements
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Mode</TableCell>
                          <TableCell align="right">Montant</TableCell>
                          <TableCell>Référence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {facture.paiements.map((paiement, index) => (
                          <TableRow key={paiement.id || index}>
                            <TableCell>
                              {new Date(paiement.date_paiement).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getPaymentMethodLabel(paiement.mode_paiement)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {paiement.montant.toLocaleString()} XOF
                            </TableCell>
                            <TableCell>
                              {paiement.numero_transaction || paiement.reference_prise_en_charge || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        {paymentConfirmed ? (
          <>
            <Alert severity="success" sx={{ flex: 1, mr: 2 }}>
              <Typography variant="body1" fontWeight="bold">
                ✅ Paiement confirmé avec succès !
              </Typography>
              <Typography variant="body2">
                Le patient peut maintenant accéder à la consultation et aux services médicaux.
              </Typography>
            </Alert>
            {consultationId && (
              <Button
                variant="contained"
                color="success"
                startIcon={<ArrowForward />}
                onClick={() => {
                  onClose();
                  navigate(`/consultations`, { 
                    state: { 
                      consultationId,
                      paymentConfirmed: true,
                      message: 'Paiement effectué - Accès autorisé'
                    } 
                  });
                }}
              >
                Accéder à la Consultation
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrintReceipt}
            >
              Imprimer le Reçu
            </Button>
            <Button onClick={onClose} startIcon={<Close />}>
              Fermer
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} startIcon={<Close />}>
              Fermer
            </Button>
            {facture.montant_restant > 0 && (
              <Button
                variant="contained"
                color="primary"
                startIcon={processing ? <CircularProgress size={20} /> : <Payment />}
                onClick={handlePayment}
                disabled={processing || !formPaiement.montant || formPaiement.montant <= 0}
              >
                {processing ? 'Enregistrement...' : 'Enregistrer le Paiement'}
              </Button>
            )}
            {facture.montant_restant === 0 && (
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={handlePrintReceipt}
              >
                Imprimer le Reçu
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
