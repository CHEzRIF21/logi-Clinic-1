import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Payment,
  Receipt,
  Search,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { FacturationService, Facture } from '../../services/facturationService';
import { PaymentProcessor } from './PaymentProcessor';
import { getMyClinicId } from '../../services/clinicService';

export const PaiementsEnAttente: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);

  useEffect(() => {
    loadFacturesEnAttente();
  }, []);

  const loadFacturesEnAttente = async () => {
    try {
      setLoading(true);
      const clinicId = await getMyClinicId();
      if (!clinicId) {
        enqueueSnackbar('Clinic ID manquant', { variant: 'error' });
        return;
      }

      // Charger les factures en attente et partiellement payées
      const facturesEnAttente = await FacturationService.getFactures({
        statut: 'en_attente',
      });
      const facturesPartielles = await FacturationService.getFactures({
        statut: 'partiellement_payee',
      });

      const allFactures = [...facturesEnAttente, ...facturesPartielles];
      // Trier par date (plus récentes en premier)
      allFactures.sort((a, b) => 
        new Date(b.date_facture).getTime() - new Date(a.date_facture).getTime()
      );
      setFactures(allFactures);
    } catch (error: any) {
      console.error('Erreur chargement factures:', error);
      enqueueSnackbar('Erreur lors du chargement des factures', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (facture: Facture) => {
    setSelectedFacture(facture);
    setOpenPaymentDialog(true);
  };

  const handlePaymentComplete = async (facture: Facture) => {
    enqueueSnackbar('Paiement enregistré avec succès', { variant: 'success' });
    await loadFacturesEnAttente();
    setOpenPaymentDialog(false);
    setSelectedFacture(null);
  };

  const filteredFactures = factures.filter(facture => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      facture.numero_facture.toLowerCase().includes(searchLower) ||
      facture.patient_id.toLowerCase().includes(searchLower)
    );
  });

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'payee': return 'success';
      case 'partiellement_payee': return 'warning';
      case 'en_attente': return 'info';
      default: return 'default';
    }
  };

  const totalEnAttente = factures.reduce((sum, f) => sum + f.montant_restant, 0);
  const nombreFactures = factures.length;

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <Payment color="primary" />
              Paiements en Attente
            </Typography>
            <Button
              variant="outlined"
              onClick={loadFacturesEnAttente}
              disabled={loading}
            >
              Actualiser
            </Button>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Nombre de factures
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {nombreFactures}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Montant total en attente
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {totalEnAttente.toLocaleString()} XOF
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Montant moyen
                  </Typography>
                  <Typography variant="h4" color="text.primary">
                    {nombreFactures > 0 
                      ? Math.round(totalEnAttente / nombreFactures).toLocaleString() 
                      : '0'} XOF
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            placeholder="Rechercher par numéro de facture ou ID patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : filteredFactures.length === 0 ? (
        <Alert severity="info">
          {searchTerm 
            ? 'Aucune facture ne correspond à votre recherche'
            : 'Aucune facture en attente de paiement'}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Numéro Facture</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Patient</strong></TableCell>
                <TableCell align="right"><strong>Total</strong></TableCell>
                <TableCell align="right"><strong>Payé</strong></TableCell>
                <TableCell align="right"><strong>Reste</strong></TableCell>
                <TableCell align="center"><strong>Statut</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFactures.map((facture) => (
                <TableRow key={facture.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {facture.numero_facture}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(facture.date_facture).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {facture.patient_id.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {facture.montant_total.toLocaleString()} XOF
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main">
                      {facture.montant_paye.toLocaleString()} XOF
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="warning.main" fontWeight="bold">
                      {facture.montant_restant.toLocaleString()} XOF
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={facture.statut}
                      color={getStatutColor(facture.statut) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<Payment />}
                      onClick={() => handlePayNow(facture)}
                    >
                      Payer maintenant
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedFacture && (
        <PaymentProcessor
          factureId={selectedFacture.id}
          open={openPaymentDialog}
          onClose={() => {
            setOpenPaymentDialog(false);
            setSelectedFacture(null);
          }}
          onPaymentComplete={handlePaymentComplete}
          consultationId={selectedFacture.consultation_id}
          patientId={selectedFacture.patient_id}
        />
      )}
    </Box>
  );
};
