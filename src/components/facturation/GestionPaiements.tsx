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
import { PaymentProcessor } from '../caisse/PaymentProcessor';
import { supabase, Patient } from '../../services/supabase';

interface GestionPaiementsProps {
  factureId?: string;
  patientId?: string;
}

interface FactureAvecPatient extends Facture {
  patient_nom?: string;
  patient_prenom?: string;
  patient_identifiant?: string;
}

const GestionPaiements: React.FC<GestionPaiementsProps> = ({ factureId, patientId }) => {
  const permissions = useFacturationPermissions();
  const [factures, setFactures] = useState<FactureAvecPatient[]>([]);
  const [factureSelectionnee, setFactureSelectionnee] = useState<FactureAvecPatient | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [openPaiementDialog, setOpenPaiementDialog] = useState(false);
  const [openPaymentProcessor, setOpenPaymentProcessor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setFactureSelectionnee(facture as FactureAvecPatient);
      } else if (patientId) {
        data = await FacturationService.getFacturesByPatient(patientId);
      } else {
        data = await FacturationService.getFactures({ statut: 'en_attente' });
      }
      
      // Enrichir les factures avec les informations des patients
      const patientIds = [...new Set(data.map(f => f.patient_id))];
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, nom, prenom, identifiant')
        .in('id', patientIds);
      
      const patientsMap = new Map((patientsData || []).map(p => [p.id, {
        nom: p.nom,
        prenom: p.prenom,
        identifiant: p.identifiant,
      }]));
      
      const facturesAvecPatients: FactureAvecPatient[] = data.map(f => {
        const patientInfo = patientsMap.get(f.patient_id);
        return {
          ...f,
          patient_nom: patientInfo?.nom || 'N/A',
          patient_prenom: patientInfo?.prenom || 'N/A',
          patient_identifiant: patientInfo?.identifiant || 'N/A',
        };
      });
      
      setFactures(facturesAvecPatients);
      if (factureId && facturesAvecPatients.length > 0) {
        setFactureSelectionnee(facturesAvecPatients[0]);
      }
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

  const handleOpenPaymentProcessor = () => {
    if (!factureSelectionnee) {
      setError('Veuillez sélectionner une facture');
      return;
    }
    setOpenPaymentProcessor(true);
  };

  const handlePaymentComplete = async (facture: Facture) => {
    // Recharger les données
    await chargerFactures();
    if (factureSelectionnee) {
      await chargerPaiements(factureSelectionnee.id);
    }
    setOpenPaymentProcessor(false);
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
              onClick={handleOpenPaymentProcessor}
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
                      <Box mb={1}>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {facture.patient_prenom} {facture.patient_nom}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {facture.patient_identifiant}
                        </Typography>
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
                <Typography variant="body2" gutterBottom>
                  <strong>Patient:</strong> {factureSelectionnee.patient_prenom} {factureSelectionnee.patient_nom} 
                  {factureSelectionnee.patient_identifiant && ` (ID: ${factureSelectionnee.patient_identifiant})`}
                </Typography>
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

      {/* PaymentProcessor pour enregistrer un paiement */}
      {factureSelectionnee && (
        <PaymentProcessor
          factureId={factureSelectionnee.id}
          open={openPaymentProcessor}
          onClose={() => setOpenPaymentProcessor(false)}
          onPaymentComplete={handlePaymentComplete}
          consultationId={factureSelectionnee.consultation_id}
          patientId={factureSelectionnee.patient_id}
        />
      )}
    </Box>
  );
};

export default GestionPaiements;

