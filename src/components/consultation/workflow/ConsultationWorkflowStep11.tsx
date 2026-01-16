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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Receipt,
  CheckCircle,
  AccountBalance,
  Payment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Consultation } from '../../../services/consultationApiService';
import { ConsultationBillingService } from '../../../services/consultationBillingService';
import { ConsultationIntegrationService } from '../../../services/consultationIntegrationService';

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
  const navigate = useNavigate();
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [factureId, setFactureId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // État pour les remises et mutuelle (sans paiement)
  const [montantCouvertureMutuelle, setMontantCouvertureMutuelle] = useState<number>(0);
  const [avecMutuelle, setAvecMutuelle] = useState(false);
  const [nomMutuelle, setNomMutuelle] = useState('');
  const [remisePourcentage, setRemisePourcentage] = useState<number>(0);
  const [remiseMontant, setRemiseMontant] = useState<number>(0);
  const [referencePriseEnCharge, setReferencePriseEnCharge] = useState('');

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

      // 4. Générer la facture complémentaire pour les actes prescrits
      const billingSummary = await ConsultationBillingService.buildBillingSummary(consultation.id);
      
      if (billingSummary.lines.length > 0) {
        // Préparer les actes pour la facture complémentaire
        const acts = billingSummary.lines.map((line: any) => ({
          code: line.type === 'labo' ? 'LAB-' + line.label.substring(0, 10).toUpperCase().replace(/\s/g, '-') :
                line.type === 'imagerie' ? 'IMG-' + line.label.substring(0, 10).toUpperCase().replace(/\s/g, '-') :
                line.type === 'medicament' ? 'PHAR-MED' : 'ACTE',
          libelle: line.label,
          quantite: line.quantity || 1,
          prix_unitaire: line.unitPrice || 0,
        }));

        // Créer la facture complémentaire
        const factureComplementaireId = await ConsultationBillingService.createComplementaryInvoice(
          consultation.id,
          patientId,
          acts
        );

        if (factureComplementaireId) {
          setFactureId(factureComplementaireId);
          setMessages((prev) => [...prev, `Facture complémentaire générée: ${factureComplementaireId}`]);
          
          // Afficher une notification
          alert('Facture complémentaire générée avec succès. Le patient doit effectuer le paiement pour débloquer les modules (laboratoire, imagerie, pharmacie).');
        }
      }

      // Recharger le résumé
      await loadBillingSummary();
    } catch (error) {
      console.error('Erreur lors de la génération de la facturation:', error);
      alert('Erreur lors de la génération de la facturation');
    } finally {
      setProcessing(false);
    }
  };

  const handleGoToCaisse = () => {
    if (!factureId) {
      alert('Veuillez d\'abord générer la facture');
      return;
    }
    // Rediriger vers la Caisse avec la facture
    navigate('/caisse', { 
      state: { 
        factureId,
        consultationId: consultation.id,
        patientId 
      } 
    });
  };

  const total = billingSummary?.total || 0;
  const totalAvecRemise = total - remiseMontant - (total * remisePourcentage / 100);
  const totalFinal = totalAvecRemise - montantCouvertureMutuelle;

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
                    <Typography variant="subtitle2" gutterBottom>
                      Facture complémentaire générée : <strong>{factureId}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Le patient doit effectuer le paiement à la Caisse pour débloquer les modules (laboratoire, imagerie, pharmacie).
                    </Typography>
                    <Box mt={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Payment />}
                        onClick={handleGoToCaisse}
                      >
                        Aller à la Caisse pour le paiement
                      </Button>
                    </Box>
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

      </CardContent>
    </Card>
  );
};
