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
  Fade,
  Skeleton,
  alpha,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Collapse,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  History,
  Print,
  Receipt,
  Download,
  Search,
  Refresh,
  FilterList,
  ExpandMore,
  ExpandLess,
  Visibility,
  GetApp,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { FacturationService, Facture, Paiement } from '../../services/facturationService';
import { getMyClinicId } from '../../services/clinicService';
import { supabase } from '../../services/supabase';
import { ReceiptPrintService } from '../../services/receiptPrintService';
import { getPaymentMethodLabel } from '../../constants/paymentMethods';

interface HistoriqueFilters {
  dateDebut?: string;
  dateFin?: string;
  patientNom?: string;
  montantMin?: number;
  montantMax?: number;
  modePaiement?: string;
  caissierId?: string;
  numeroFacture?: string;
}

export const HistoriquePaiements: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [factures, setFactures] = useState<(Facture & { patient_nom?: string; patient_prenom?: string; patient_identifiant?: string; caissier_nom?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<HistoriqueFilters>({});
  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);

  useEffect(() => {
    loadFacturesPayees();
  }, [filters]);

  const loadFacturesPayees = async () => {
    try {
      setLoading(true);
      const clinicId = await getMyClinicId();
      if (!clinicId) {
        enqueueSnackbar('Clinic ID manquant', { variant: 'error' });
        return;
      }

      // Récupérer les IDs des patients de cette clinique
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id')
        .eq('clinic_id', clinicId);

      if (patientsError) {
        console.error('Erreur récupération patients:', patientsError);
        enqueueSnackbar('Erreur lors de la récupération des patients', { variant: 'error' });
        return;
      }

      const patientIds = (patientsData || []).map(p => p.id);
      
      if (patientIds.length === 0) {
        setFactures([]);
        return;
      }

      // Construire la requête avec filtres
      let query = supabase
        .from('factures')
        .select(`
          *,
          consultations(id, statut_paiement),
          patients(id, identifiant, nom, prenom)
        `)
        .in('patient_id', patientIds)
        .eq('statut', 'payee')
        .lte('montant_restant', 0)
        .order('date_facture', { ascending: false });

      // Appliquer les filtres
      if (filters.dateDebut) {
        query = query.gte('date_facture', filters.dateDebut);
      }
      if (filters.dateFin) {
        query = query.lte('date_facture', filters.dateFin);
      }
      if (filters.numeroFacture) {
        query = query.ilike('numero_facture', `%${filters.numeroFacture}%`);
      }
      if (filters.montantMin) {
        query = query.gte('montant_total', filters.montantMin);
      }
      if (filters.montantMax) {
        query = query.lte('montant_total', filters.montantMax);
      }

      const { data: facturesData, error } = await query;

      if (error) {
        console.error('Erreur récupération factures:', error);
        enqueueSnackbar('Erreur lors du chargement des factures', { variant: 'error' });
        return;
      }

      // Filtrer par nom de patient côté client si nécessaire
      let filteredFactures = (facturesData || []).map((f: any) => ({
        ...f,
        consultation_id: f.consultation_id || f.consultations?.[0]?.id,
        patient_identifiant: f.patients?.identifiant || 'N/A',
        patient_nom: f.patients?.nom || 'N/A',
        patient_prenom: f.patients?.prenom || 'N/A',
        paiements: [], // Sera rempli après
      }));

      // Récupérer tous les paiements en une seule requête
      const factureIds = filteredFactures.map(f => f.id);
      if (factureIds.length > 0) {
        const { data: allPaiements, error: paiementsError } = await supabase
          .from('paiements')
          .select('*')
          .in('facture_id', factureIds)
          .order('date_paiement', { ascending: false });

        if (!paiementsError && allPaiements) {
          // Grouper les paiements par facture_id
          const paiementsByFacture = new Map<string, Paiement[]>();
          allPaiements.forEach((p: Paiement) => {
            if (p.facture_id) {
              if (!paiementsByFacture.has(p.facture_id)) {
                paiementsByFacture.set(p.facture_id, []);
              }
              paiementsByFacture.get(p.facture_id)!.push(p);
            }
          });

          // Assigner les paiements aux factures
          filteredFactures.forEach((facture: any) => {
            facture.paiements = paiementsByFacture.get(facture.id) || [];
          });
        }
      }

      // Filtrer par nom de patient si spécifié
      if (filters.patientNom) {
        const searchLower = filters.patientNom.toLowerCase();
        filteredFactures = filteredFactures.filter((f: any) =>
          f.patient_nom?.toLowerCase().includes(searchLower) ||
          f.patient_prenom?.toLowerCase().includes(searchLower) ||
          f.patient_identifiant?.toLowerCase().includes(searchLower)
        );
      }

      // Filtrer par mode de paiement si spécifié
      if (filters.modePaiement) {
        filteredFactures = filteredFactures.filter((f: any) =>
          f.paiements?.some((p: Paiement) => p.mode_paiement === filters.modePaiement)
        );
      }

      // Filtrer par caissier si spécifié
      if (filters.caissierId) {
        filteredFactures = filteredFactures.filter((f: any) =>
          f.paiements?.some((p: Paiement) => p.caissier_id === filters.caissierId)
        );
      }

      setFactures(filteredFactures);
    } catch (error: any) {
      console.error('Erreur chargement factures:', error);
      enqueueSnackbar('Erreur lors du chargement des factures', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintFacture = async (factureId: string) => {
    try {
      await FacturationService.imprimerFacture(factureId);
      enqueueSnackbar('Impression de la facture lancée', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar('Erreur lors de l\'impression: ' + error.message, { variant: 'error' });
    }
  };

  const handlePrintReceipt = async (facture: Facture) => {
    try {
      // Récupérer les paiements de la facture
      const paiementsFacture = await FacturationService.getPaiementsByFacture(facture.id);
      if (paiementsFacture.length === 0) {
        enqueueSnackbar('Aucun paiement trouvé pour cette facture', { variant: 'warning' });
        return;
      }

      // Récupérer les informations du patient
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', facture.patient_id)
        .single();

      // Récupérer les informations de la clinique
      const clinicId = await getMyClinicId();
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      // Récupérer le nom du caissier
      const dernierPaiement = paiementsFacture[0];
      let caissierName = 'N/A';
      if (dernierPaiement.caissier_id) {
        const { data: caissierData } = await supabase
          .from('users')
          .select('nom, prenom')
          .eq('id', dernierPaiement.caissier_id)
          .single();
        if (caissierData) {
          caissierName = `${caissierData.prenom || ''} ${caissierData.nom || ''}`.trim();
        }
      }

      // Générer le HTML du reçu
      const receiptHTML = ReceiptPrintService.generateReceiptHTML({
        facture,
        paiement: dernierPaiement,
        patient: patientData || null,
        clinicName: clinicData?.name,
        clinicAddress: clinicData?.address,
        clinicPhone: clinicData?.phone,
        clinicEmail: clinicData?.email,
        caissierName,
      });

      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error: any) {
      console.error('Erreur impression reçu:', error);
      enqueueSnackbar('Erreur lors de l\'impression du reçu: ' + error.message, { variant: 'error' });
    }
  };

  const handlePrintList = () => {
    window.print();
  };

  const handleExportCSV = async () => {
    try {
      const csv = await FacturationService.exporterHistoriqueCSV(filters);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historique_paiements_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      enqueueSnackbar('Export CSV réussi', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar('Erreur lors de l\'export: ' + error.message, { variant: 'error' });
    }
  };

  const handleMenuOpen = (factureId: string, event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl({ ...anchorEl, [factureId]: event.currentTarget });
  };

  const handleMenuClose = (factureId: string) => {
    setAnchorEl({ ...anchorEl, [factureId]: null });
  };

  const handleViewDetails = async (facture: Facture) => {
    setSelectedFacture(facture);
    try {
      const paiementsFacture = await FacturationService.getPaiementsByFacture(facture.id);
      setPaiements(paiementsFacture);
    } catch (error: any) {
      enqueueSnackbar('Erreur lors du chargement des détails', { variant: 'error' });
    }
  };

  const resetFilters = () => {
    setFilters({});
    enqueueSnackbar('Filtres réinitialisés', { variant: 'info' });
  };

  const totalFactures = factures.length;
  const montantTotal = factures.reduce((sum, f) => sum + f.montant_total, 0);
  const moyenne = totalFactures > 0 ? montantTotal / totalFactures : 0;

  return (
    <Box>
      <Fade in={true} timeout={500}>
        <Card 
          sx={{ 
            mb: 1.5,
            background: (theme) => 
              theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: (theme) => 
              theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    background: (theme) => 
                      `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  <History sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', mb: 0 }}>
                    Historique de Paiement
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Factures complètement payées
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  startIcon={<FilterList />}
                  sx={{ borderRadius: 1.5, textTransform: 'none' }}
                >
                  Filtres
                  {filtersOpen ? <ExpandLess sx={{ ml: 0.5 }} /> : <ExpandMore sx={{ ml: 0.5 }} />}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={loadFacturesPayees}
                  disabled={loading}
                  startIcon={<Refresh />}
                  sx={{ borderRadius: 1.5, textTransform: 'none' }}
                >
                  Actualiser
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handlePrintList}
                  startIcon={<Print />}
                  sx={{ borderRadius: 1.5, textTransform: 'none' }}
                >
                  Imprimer
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleExportCSV}
                  startIcon={<Download />}
                  sx={{ borderRadius: 1.5, textTransform: 'none' }}
                >
                  Exporter CSV
                </Button>
              </Box>
            </Box>

            {/* Filtres */}
            <Collapse in={filtersOpen}>
              <Box sx={{ mb: 2, p: 2, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Date début"
                      type="date"
                      value={filters.dateDebut || ''}
                      onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Date fin"
                      type="date"
                      value={filters.dateFin || ''}
                      onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Patient (nom, identifiant)"
                      value={filters.patientNom || ''}
                      onChange={(e) => setFilters({ ...filters, patientNom: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Numéro facture"
                      value={filters.numeroFacture || ''}
                      onChange={(e) => setFilters({ ...filters, numeroFacture: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Montant min (XOF)"
                      type="number"
                      value={filters.montantMin || ''}
                      onChange={(e) => setFilters({ ...filters, montantMin: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Montant max (XOF)"
                      type="number"
                      value={filters.montantMax || ''}
                      onChange={(e) => setFilters({ ...filters, montantMax: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Mode de paiement</InputLabel>
                      <Select
                        value={filters.modePaiement || ''}
                        onChange={(e) => setFilters({ ...filters, modePaiement: e.target.value || undefined })}
                        label="Mode de paiement"
                      >
                        <MenuItem value="">Tous</MenuItem>
                        <MenuItem value="especes">Espèces</MenuItem>
                        <MenuItem value="mobile_money">Mobile Money</MenuItem>
                        <MenuItem value="carte_bancaire">Carte Bancaire</MenuItem>
                        <MenuItem value="virement">Virement</MenuItem>
                        <MenuItem value="cheque">Chèque</MenuItem>
                        <MenuItem value="prise_en_charge">Prise en charge</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={resetFilters}
                      sx={{ mt: 0.5, textTransform: 'none' }}
                    >
                      Réinitialiser
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>

            {/* Statistiques */}
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Total factures</Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {loading ? <Skeleton width={40} /> : totalFactures}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.05) }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Montant total</Typography>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {loading ? <Skeleton width={80} /> : `${montantTotal.toLocaleString()} XOF`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.05) }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Moyenne par facture</Typography>
                    <Typography variant="h5" color="info.main" fontWeight="bold">
                      {loading ? <Skeleton width={70} /> : `${Math.round(moyenne).toLocaleString()} XOF`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Fade>

      {/* Tableau */}
      {loading ? (
        <Box display="flex" flexDirection="column" gap={2} p={4}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : factures.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Aucune facture payée trouvée
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
                <TableCell sx={{ fontWeight: 700 }}>Numéro Facture</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Montant Total</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mode de Paiement</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {factures.map((facture) => {
                const dernierPaiement = (facture.paiements || [])[0];
                return (
                  <TableRow key={facture.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {facture.numero_facture}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(facture.date_facture).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {facture.patient_prenom || ''} {facture.patient_nom || ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {facture.patient_identifiant || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>
                        {facture.montant_total.toLocaleString()} XOF
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={dernierPaiement ? getPaymentMethodLabel(dernierPaiement.mode_paiement) : 'N/A'}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(facture.id, e)}
                        sx={{ color: 'primary.main' }}
                      >
                        <Visibility />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl[facture.id]}
                        open={Boolean(anchorEl[facture.id])}
                        onClose={() => handleMenuClose(facture.id)}
                      >
                        <MenuItem onClick={() => { handleViewDetails(facture); handleMenuClose(facture.id); }}>
                          <Visibility sx={{ mr: 1, fontSize: 18 }} /> Voir détails
                        </MenuItem>
                        <MenuItem onClick={() => { handlePrintFacture(facture.id); handleMenuClose(facture.id); }}>
                          <Receipt sx={{ mr: 1, fontSize: 18 }} /> Imprimer facture
                        </MenuItem>
                        <MenuItem onClick={() => { handlePrintReceipt(facture); handleMenuClose(facture.id); }}>
                          <Print sx={{ mr: 1, fontSize: 18 }} /> Imprimer reçu
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Détails */}
      {selectedFacture && (
        <Dialog open={Boolean(selectedFacture)} onClose={() => setSelectedFacture(null)} maxWidth="md" fullWidth>
          <DialogTitle>Détails de la Facture {selectedFacture.numero_facture}</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Patient</Typography>
              <Typography variant="body1">
                {(selectedFacture as any).patient_prenom} {(selectedFacture as any).patient_nom}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Paiements</Typography>
            {paiements.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Montant</TableCell>
                      <TableCell>Mode</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paiements.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{p.montant.toLocaleString()} XOF</TableCell>
                        <TableCell>{getPaymentMethodLabel(p.mode_paiement)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">Aucun paiement trouvé</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedFacture(null)}>Fermer</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};
