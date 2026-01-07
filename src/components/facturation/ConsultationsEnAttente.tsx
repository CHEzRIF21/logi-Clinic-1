import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Payment,
  Person,
  CalendarToday,
  Receipt,
  Refresh,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FacturationService } from '../../services/facturationService';
import { PAYMENT_METHODS } from '../../constants/paymentMethods';

interface ConsultationEnAttente {
  id: string;
  patient_id: string;
  patient_nom: string;
  patient_prenom: string;
  patient_telephone?: string;
  facture_id: string;
  numero_facture: string;
  montant_total: number;
  montant_restant: number;
  date_creation: string;
  type_consultation?: string;
}

const ConsultationsEnAttente: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<ConsultationEnAttente[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationEnAttente | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    montant: 0,
    mode_paiement: 'especes',
    numero_transaction: '',
    banque: '',
    numero_cheque: '',
    notes: '',
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les consultations avec factures initiales en attente
      const { data: consultations, error: consultError } = await supabase
        .from('consultations')
        .select(`
          id,
          patient_id,
          facture_initial_id,
          type_consultation,
          created_at,
          patients(id, nom, prenom, telephone)
        `)
        .eq('statut_paiement', 'en_attente')
        .not('facture_initial_id', 'is', null)
        .order('created_at', { ascending: false });

      if (consultError) {
        throw consultError;
      }

      // Récupérer les factures correspondantes
      const factureIds = (consultations || [])
        .map((c: any) => c.facture_initial_id)
        .filter((id: string) => id);

      if (factureIds.length === 0) {
        setConsultations([]);
        return;
      }

      const { data: factures, error: factureError } = await supabase
        .from('factures')
        .select('id, numero_facture, montant_total, montant_restant, statut, date_facture')
        .in('id', factureIds)
        .in('statut', ['en_attente', 'partiellement_payee']);

      if (factureError) {
        throw factureError;
      }

      // Combiner les données
      const facturesMap = new Map((factures || []).map((f: any) => [f.id, f]));

      const formattedConsultations: ConsultationEnAttente[] = (consultations || [])
        .filter((c: any) => facturesMap.has(c.facture_initial_id))
        .map((c: any) => {
          const facture = facturesMap.get(c.facture_initial_id);
          return {
            id: c.id,
            patient_id: c.patient_id,
            patient_nom: c.patients?.nom || '',
            patient_prenom: c.patients?.prenom || '',
            patient_telephone: c.patients?.telephone,
            facture_id: facture!.id,
            numero_facture: facture!.numero_facture,
            montant_total: parseFloat(facture!.montant_total),
            montant_restant: parseFloat(facture!.montant_restant),
            date_creation: c.created_at,
            type_consultation: c.type_consultation,
          };
        });

      setConsultations(formattedConsultations);
    } catch (err: any) {
      console.error('Erreur chargement consultations:', err);
      setError('Erreur lors du chargement des consultations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentDialog = (consultation: ConsultationEnAttente) => {
    setSelectedConsultation(consultation);
    setPaymentForm({
      montant: consultation.montant_restant,
      mode_paiement: 'especes',
      numero_transaction: '',
      banque: '',
      numero_cheque: '',
      notes: '',
    });
    setPaymentDialogOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedConsultation) return;

    if (paymentForm.montant <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    if (paymentForm.montant > selectedConsultation.montant_restant) {
      setError(`Le montant ne peut pas dépasser ${selectedConsultation.montant_restant.toLocaleString('fr-FR')} FCFA`);
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const userData = localStorage.getItem('user');
      const caissierId = userData ? JSON.parse(userData).id : undefined;

      await FacturationService.enregistrerPaiement({
        facture_id: selectedConsultation.facture_id,
        montant: paymentForm.montant,
        mode_paiement: paymentForm.mode_paiement as any,
        date_paiement: new Date().toISOString(),
        numero_transaction: paymentForm.numero_transaction || undefined,
        banque: paymentForm.banque || undefined,
        numero_cheque: paymentForm.numero_cheque || undefined,
        notes: paymentForm.notes || undefined,
      }, caissierId);

      // Recharger la liste
      await loadConsultations();
      setPaymentDialogOpen(false);
      setSelectedConsultation(null);
    } catch (err: any) {
      setError('Erreur lors de l\'enregistrement du paiement: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight="bold">
              Consultations en Attente de Paiement
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={loadConsultations}
              variant="outlined"
            >
              Actualiser
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {consultations.length === 0 ? (
            <Alert severity="info">
              Aucune consultation en attente de paiement.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Téléphone</TableCell>
                    <TableCell>Type Consultation</TableCell>
                    <TableCell>N° Facture</TableCell>
                    <TableCell align="right">Montant Total</TableCell>
                    <TableCell align="right">Montant Restant</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {consultations.map((consultation) => (
                    <TableRow key={consultation.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {consultation.patient_nom} {consultation.patient_prenom}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{consultation.patient_telephone || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={consultation.type_consultation || 'Générale'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Receipt fontSize="small" color="action" />
                          {consultation.numero_facture}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {consultation.montant_total.toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={consultation.montant_restant > 0 ? 'error' : 'success'}
                        >
                          {consultation.montant_restant.toLocaleString('fr-FR')} FCFA
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(consultation.date_creation)}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<Payment />}
                          onClick={() => handleOpenPaymentDialog(consultation)}
                          disabled={consultation.montant_restant <= 0}
                        >
                          Payer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog de paiement */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => !processing && setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Payment color="primary" />
            Enregistrer le Paiement
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedConsultation && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Patient: <strong>{selectedConsultation.patient_nom} {selectedConsultation.patient_prenom}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Facture: <strong>{selectedConsultation.numero_facture}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Montant restant: <strong>{selectedConsultation.montant_restant.toLocaleString('fr-FR')} FCFA</strong>
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="Montant"
            type="number"
            value={paymentForm.montant}
            onChange={(e) => setPaymentForm({ ...paymentForm, montant: parseFloat(e.target.value) || 0 })}
            margin="normal"
            InputProps={{
              endAdornment: <Typography variant="body2">FCFA</Typography>,
            }}
            disabled={processing}
          />

          <TextField
            fullWidth
            select
            label="Mode de Paiement"
            value={paymentForm.mode_paiement}
            onChange={(e) => setPaymentForm({ ...paymentForm, mode_paiement: e.target.value })}
            margin="normal"
            disabled={processing}
          >
            {PAYMENT_METHODS.map((method) => (
              <MenuItem key={method.value} value={method.value}>
                {method.label}
              </MenuItem>
            ))}
          </TextField>

          {(paymentForm.mode_paiement.includes('mobile') || paymentForm.mode_paiement === 'virement') && (
            <TextField
              fullWidth
              label="Numéro de Transaction"
              value={paymentForm.numero_transaction}
              onChange={(e) => setPaymentForm({ ...paymentForm, numero_transaction: e.target.value })}
              margin="normal"
              disabled={processing}
            />
          )}

          {(paymentForm.mode_paiement === 'virement' || paymentForm.mode_paiement === 'cheque') && (
            <TextField
              fullWidth
              label="Banque"
              value={paymentForm.banque}
              onChange={(e) => setPaymentForm({ ...paymentForm, banque: e.target.value })}
              margin="normal"
              disabled={processing}
            />
          )}

          {paymentForm.mode_paiement === 'cheque' && (
            <TextField
              fullWidth
              label="Numéro de Chèque"
              value={paymentForm.numero_cheque}
              onChange={(e) => setPaymentForm({ ...paymentForm, numero_cheque: e.target.value })}
              margin="normal"
              disabled={processing}
            />
          )}

          <TextField
            fullWidth
            label="Notes (optionnel)"
            multiline
            rows={2}
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            margin="normal"
            disabled={processing}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPaymentDialogOpen(false)}
            disabled={processing}
          >
            Annuler
          </Button>
          <Button
            onClick={handleProcessPayment}
            variant="contained"
            color="primary"
            disabled={processing || paymentForm.montant <= 0}
            startIcon={processing ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {processing ? 'Enregistrement...' : 'Enregistrer le Paiement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConsultationsEnAttente;

