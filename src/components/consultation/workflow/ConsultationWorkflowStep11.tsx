import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Grid,
  TextField,
  Tabs,
  Tab,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
} from '@mui/material';
import {
  Receipt,
  CheckCircle,
  Payment,
  AccountBalance,
} from '@mui/icons-material';
import { Consultation } from '../../../services/consultationApiService';
import { ConsultationBillingService } from '../../../services/consultationBillingService';
import { ConsultationIntegrationService } from '../../../services/consultationIntegrationService';
import { FacturationService, Paiement } from '../../../services/facturationService';

interface ConsultationWorkflowStep11Props {
  consultation: Consultation;
  patientId: string;
  userId: string;
  onComplete: () => Promise<void>;
  onFacturationComplete?: () => void;
}

export const ConsultationWorkflowStep11: React.FC<ConsultationWorkflowStep11Props> = ({
  consultation,
  patientId,
  userId,
  onComplete,
  onFacturationComplete,
}) => {
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [factureId, setFactureId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // État pour le paiement
  const [modePaiement, setModePaiement] = useState<Paiement['mode_paiement']>('especes');
  const [montantPaye, setMontantPaye] = useState<number>(0);
  const [numeroTransaction, setNumeroTransaction] = useState('');
  const [banque, setBanque] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [referencePriseEnCharge, setReferencePriseEnCharge] = useState('');
  const [montantCouvertureMutuelle, setMontantCouvertureMutuelle] = useState<number>(0);
  const [avecMutuelle, setAvecMutuelle] = useState(false);
  const [nomMutuelle, setNomMutuelle] = useState('');
  const [remisePourcentage, setRemisePourcentage] = useState<number>(0);
  const [remiseMontant, setRemiseMontant] = useState<number>(0);
  const [notesPaiement, setNotesPaiement] = useState('');

  const loadBillingSummary = useCallback(async () => {
    setLoading(true);
    try {
      const summary = await ConsultationBillingService.buildBillingSummary(consultation.id);
      setBillingSummary(summary);
    } catch (error) {
      console.error('Erreur lors du chargement du résumé de facturation:', error);
    } finally {
      setLoading(false);
    }
  }, [consultation.id]);

  useEffect(() => {
    loadBillingSummary();
  }, [loadBillingSummary]);

  useEffect(() => {
    // Initialiser le montant à payer avec le total
    if (billingSummary) {
      const totalAvecRemise = billingSummary.total - remiseMontant - (billingSummary.total * remisePourcentage / 100);
      const totalFinal = totalAvecRemise - montantCouvertureMutuelle;
      setMontantPaye(Math.max(0, totalFinal));
    }
  }, [billingSummary, remisePourcentage, remiseMontant, montantCouvertureMutuelle]);

  const handleGenerateBilling = async () => {
    setProcessing(true);
    setMessages([]);

    try {
      // 1. Envoyer les prescriptions au module Pharmacie
      const pharmacyResult = await ConsultationIntegrationService.sendPrescriptionsToPharmacy(
        consultation.id,
        patientId,
        []
      );
      if (pharmacyResult.success) {
        setMessages((prev) => [...prev, pharmacyResult.message || 'Prescriptions envoyées à la Pharmacie']);
      }

      // 2. Envoyer les demandes labo au module Laboratoire
      const labResult = await ConsultationIntegrationService.sendLabRequestsToLaboratory(
        consultation.id,
        patientId
      );
      if (labResult.success) {
        setMessages((prev) => [...prev, labResult.message || 'Demandes labo envoyées au Laboratoire']);
      }

      // 3. Envoyer les demandes imagerie au module Imagerie
      const imagingResult = await ConsultationIntegrationService.sendImagingRequestsToImagerie(
        consultation.id,
        patientId
      );
      if (imagingResult.success) {
        setMessages((prev) => [...prev, imagingResult.message || 'Demandes imagerie envoyées au module Imagerie']);
      }

      // 4. Générer la facturation et l'envoyer au module Caisse
      const billingResult = await ConsultationIntegrationService.generateBillingAndSendToCaisse(
        consultation.id,
        patientId
      );
      if (billingResult.success) {
        setFactureId(billingResult.factureId || null);
        setMessages((prev) => [...prev, billingResult.message || `Facture générée: ${billingResult.factureId}`]);
      }

      // Recharger le résumé
      await loadBillingSummary();

      alert('Facturation générée et envoyée au module Caisse avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération de la facturation:', error);
      alert('Erreur lors de la génération de la facturation');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!factureId || !billingSummary) {
      alert('Veuillez d\'abord générer la facture');
      return;
    }

    const totalAvecRemise = billingSummary.total - remiseMontant - (billingSummary.total * remisePourcentage / 100);
    const montantRestant = totalAvecRemise - montantCouvertureMutuelle - montantPaye;

    if (montantPaye <= 0) {
      alert('Le montant payé doit être supérieur à 0');
      return;
    }

    setProcessing(true);
    try {
      const paiement: Paiement = {
        facture_id: factureId,
        date_paiement: new Date().toISOString(),
        montant: montantPaye,
        mode_paiement: modePaiement,
        numero_transaction: numeroTransaction || undefined,
        banque: banque || undefined,
        numero_cheque: numeroCheque || undefined,
        reference_prise_en_charge: referencePriseEnCharge || undefined,
        caissier_id: userId,
        notes: notesPaiement || undefined,
      };

      await FacturationService.enregistrerPaiement(paiement);

      // Si prise en charge mutuelle, enregistrer la couverture
      if (avecMutuelle && montantCouvertureMutuelle > 0) {
        // TODO: Enregistrer la prise en charge mutuelle dans la table appropriée
      }

      // Recharger le résumé
      await loadBillingSummary();

      alert(`Paiement de ${montantPaye.toFixed(2)} € enregistré avec succès${montantRestant > 0 ? `. Montant restant: ${montantRestant.toFixed(2)} €` : ''}`);
      
      if (onFacturationComplete) {
        onFacturationComplete();
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du paiement:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
    } finally {
      setProcessing(false);
    }
  };

  const total = billingSummary?.total || 0;
  const totalAvecRemise = total - remiseMontant - (total * remisePourcentage / 100);
  const totalFinal = totalAvecRemise - montantCouvertureMutuelle;
  const montantRestant = totalFinal - montantPaye;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Receipt color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" gutterBottom>
              Facturation et Paiement
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Génération des actes à facturer, gestion des remises, mutuelle et paiement
            </Typography>
          </Box>
        </Box>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
          <Tab label="Résumé Facturation" icon={<Receipt />} iconPosition="start" />
          <Tab label="Remises & Mutuelle" icon={<AccountBalance />} iconPosition="start" />
          <Tab label="Paiement" icon={<Payment />} iconPosition="start" />
        </Tabs>

        {/* Onglet 1: Résumé Facturation */}
        {activeTab === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Actes à facturer :
              </Typography>
              <Typography variant="body2">
                • Consultation<br />
                • Examens prescrits<br />
                • Médicaments<br />
              </Typography>
            </Alert>

            {loading ? (
              <LinearProgress sx={{ mb: 2 }} />
            ) : billingSummary ? (
              <>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell align="right"><strong>Quantité</strong></TableCell>
                        <TableCell align="right"><strong>Prix unitaire</strong></TableCell>
                        <TableCell align="right"><strong>Montant</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                    {billingSummary.lines.map((ligne: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{ligne.label}</TableCell>
                        <TableCell align="right">{ligne.quantity || 1}</TableCell>
                        <TableCell align="right">{ligne.unitPrice?.toFixed(2) || '0.00'} €</TableCell>
                        <TableCell align="right"><strong>{ligne.total?.toFixed(2) || '0.00'} €</strong></TableCell>
                      </TableRow>
                    ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right"><strong>Total HT</strong></TableCell>
                        <TableCell align="right"><strong>{total.toFixed(2)} €</strong></TableCell>
                      </TableRow>
                      {remisePourcentage > 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="right">Remise ({remisePourcentage}%)</TableCell>
                          <TableCell align="right">-{(total * remisePourcentage / 100).toFixed(2)} €</TableCell>
                        </TableRow>
                      )}
                      {remiseMontant > 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="right">Remise (montant)</TableCell>
                          <TableCell align="right">-{remiseMontant.toFixed(2)} €</TableCell>
                        </TableRow>
                      )}
                      {montantCouvertureMutuelle > 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="right">Couverture Mutuelle</TableCell>
                          <TableCell align="right">-{montantCouvertureMutuelle.toFixed(2)} €</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell colSpan={3} align="right"><strong>Total à Payer</strong></TableCell>
                        <TableCell align="right"><strong>{totalFinal.toFixed(2)} €</strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {billingSummary.warnings && billingSummary.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Avertissements :
                    </Typography>
                    {billingSummary.warnings.map((warning: string, index: number) => (
                      <Typography key={index} variant="body2">• {warning}</Typography>
                    ))}
                  </Alert>
                )}

                {messages.length > 0 && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Actions effectuées :
                    </Typography>
                    {messages.map((msg, index) => (
                      <Typography key={index} variant="body2">✓ {msg}</Typography>
                    ))}
                  </Alert>
                )}

                {factureId && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      Facture générée : <strong>{factureId}</strong>
                    </Typography>
                  </Alert>
                )}

                <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <Button
                    variant="outlined"
                    onClick={loadBillingSummary}
                    disabled={loading || processing}
                  >
                    Actualiser
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={handleGenerateBilling}
                    disabled={loading || processing || !billingSummary}
                  >
                    {processing ? 'Traitement en cours...' : 'Générer la facturation'}
                  </Button>
                </Box>
              </>
            ) : (
              <Alert severity="warning">
                Aucun élément à facturer trouvé.
              </Alert>
            )}
          </Box>
        )}

        {/* Onglet 2: Remises & Mutuelle */}
        {activeTab === 1 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Remises
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Remise en pourcentage (%)"
                          type="number"
                          value={remisePourcentage}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setRemisePourcentage(Math.min(100, Math.max(0, val)));
                            setRemiseMontant(0);
                          }}
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" align="center">
                          OU
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Remise en montant (€)"
                          type="number"
                          value={remiseMontant}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setRemiseMontant(Math.max(0, val));
                            setRemisePourcentage(0);
                          }}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Couverture Mutuelle/Assurance
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={avecMutuelle}
                          onChange={(e) => setAvecMutuelle(e.target.checked)}
                        />
                      }
                      label="Le patient bénéficie d'une mutuelle/assurance"
                    />
                    {avecMutuelle && (
                      <Grid container spacing={2} mt={1}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Nom de la mutuelle/assurance"
                            value={nomMutuelle}
                            onChange={(e) => setNomMutuelle(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Montant couvert (€)"
                            type="number"
                            value={montantCouvertureMutuelle}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setMontantCouvertureMutuelle(Math.max(0, val));
                            }}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Référence prise en charge"
                            value={referencePriseEnCharge}
                            onChange={(e) => setReferencePriseEnCharge(e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                Total initial: <strong>{total.toFixed(2)} €</strong><br />
                {remisePourcentage > 0 && `Remise: -${(total * remisePourcentage / 100).toFixed(2)} €`}
                {remiseMontant > 0 && `Remise: -${remiseMontant.toFixed(2)} €`}
                {montantCouvertureMutuelle > 0 && ` | Couverture mutuelle: -${montantCouvertureMutuelle.toFixed(2)} €`}<br />
                <strong>Total à payer: {totalFinal.toFixed(2)} €</strong>
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Onglet 3: Paiement */}
        {activeTab === 2 && (
          <Box>
            {!factureId ? (
              <Alert severity="warning">
                Veuillez d'abord générer la facture dans l'onglet "Résumé Facturation".
              </Alert>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2">
                    Montant total à payer: <strong>{totalFinal.toFixed(2)} €</strong>
                  </Typography>
                  {montantRestant > 0 && (
                    <Typography variant="body2" color="error">
                      Montant restant après paiement: {montantRestant.toFixed(2)} €
                    </Typography>
                  )}
                </Alert>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Mode de Paiement
                        </Typography>
                        <RadioGroup
                          value={modePaiement}
                          onChange={(e) => setModePaiement(e.target.value as Paiement['mode_paiement'])}
                        >
                          <FormControlLabel value="especes" control={<Radio />} label="Espèces" />
                          <FormControlLabel value="mobile_money" control={<Radio />} label="Mobile Money" />
                          <FormControlLabel value="carte_bancaire" control={<Radio />} label="Carte Bancaire" />
                          <FormControlLabel value="virement" control={<Radio />} label="Virement" />
                          <FormControlLabel value="cheque" control={<Radio />} label="Chèque" />
                          <FormControlLabel value="prise_en_charge" control={<Radio />} label="Prise en Charge" />
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Détails du Paiement
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Montant payé (€) *"
                              type="number"
                              value={montantPaye}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setMontantPaye(Math.max(0, val));
                              }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </Grid>

                          {(modePaiement === 'mobile_money' || modePaiement === 'virement' || modePaiement === 'carte_bancaire') && (
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Numéro de transaction"
                                value={numeroTransaction}
                                onChange={(e) => setNumeroTransaction(e.target.value)}
                              />
                            </Grid>
                          )}

                          {(modePaiement === 'virement' || modePaiement === 'cheque') && (
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Banque"
                                value={banque}
                                onChange={(e) => setBanque(e.target.value)}
                              />
                            </Grid>
                          )}

                          {modePaiement === 'cheque' && (
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Numéro de chèque"
                                value={numeroCheque}
                                onChange={(e) => setNumeroCheque(e.target.value)}
                              />
                            </Grid>
                          )}

                          {modePaiement === 'prise_en_charge' && (
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Référence prise en charge"
                                value={referencePriseEnCharge}
                                onChange={(e) => setReferencePriseEnCharge(e.target.value)}
                              />
                            </Grid>
                          )}

                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label="Notes (optionnel)"
                              value={notesPaiement}
                              onChange={(e) => setNotesPaiement(e.target.value)}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Box display="flex" justifyContent="flex-end" mt={3}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Payment />}
                    onClick={handleProcessPayment}
                    disabled={processing || montantPaye <= 0}
                  >
                    {processing ? 'Enregistrement...' : `Enregistrer le paiement de ${montantPaye.toFixed(2)} €`}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
