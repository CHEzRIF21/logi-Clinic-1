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
  Zoom,
  Skeleton,
  alpha,
} from '@mui/material';
import {
  Payment,
  Receipt,
  Search,
  CheckCircle,
  Warning,
  Refresh,
  TrendingUp,
  AttachMoney,
  ReceiptLong,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { FacturationService, Facture } from '../../services/facturationService';
import { PaymentProcessor } from './PaymentProcessor';
import { getMyClinicId } from '../../services/clinicService';
import { supabase } from '../../services/supabase';

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

      // Étape 1: Récupérer les IDs des patients de cette clinique
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
        console.log('Aucun patient trouvé pour cette clinique');
        setFactures([]);
        return;
      }

      // Étape 2: Récupérer toutes les factures en attente pour ces patients
      // Cela inclut toutes les factures : avec consultation_id, service_origine='enregistrement', etc.
      const { data: facturesData, error } = await supabase
        .from('factures')
        .select(`
          *,
          consultations(id, statut_paiement),
          patients(id, identifiant)
        `)
        .in('patient_id', patientIds)
        .in('statut', ['en_attente', 'partiellement_payee'])
        .gt('montant_restant', 0)
        .order('date_facture', { ascending: false });

      if (error) {
        console.error('Erreur récupération factures:', error);
        console.error('Détails erreur:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        // Fallback : utiliser le service et récupérer les identifiants des patients
        try {
          const facturesEnAttente = await FacturationService.getFactures({
            statut: 'en_attente',
          });
          const facturesPartielles = await FacturationService.getFactures({
            statut: 'partiellement_payee',
          });
          const allFactures = [...facturesEnAttente, ...facturesPartielles];
          // Filtrer par patientIds
          const filteredFactures = allFactures.filter(f => patientIds.includes(f.patient_id));
          
          // Récupérer les identifiants des patients
          const { data: patientsData } = await supabase
            .from('patients')
            .select('id, identifiant')
            .in('id', [...new Set(filteredFactures.map(f => f.patient_id))]);
          
          const patientsMap = new Map((patientsData || []).map(p => [p.id, p.identifiant]));
          
          // Ajouter l'identifiant à chaque facture
          const facturesWithIdentifiant = filteredFactures.map(f => ({
            ...f,
            patient_identifiant: patientsMap.get(f.patient_id) || 'N/A',
          }));
          
          facturesWithIdentifiant.sort((a, b) => 
            new Date(b.date_facture).getTime() - new Date(a.date_facture).getTime()
          );
          console.log(`✅ Récupération via service: ${facturesWithIdentifiant.length} factures trouvées`);
          setFactures(facturesWithIdentifiant);
        } catch (fallbackError: any) {
          console.error('Erreur fallback:', fallbackError);
          enqueueSnackbar('Erreur lors du chargement des factures', { variant: 'error' });
        }
      } else {
        // Filtrer et formater les factures avec l'identifiant du patient
        const allFactures = (facturesData || []).map((f: any) => ({
          ...f,
          consultation_id: f.consultation_id || f.consultations?.[0]?.id,
          patient_identifiant: f.patients?.identifiant || 'N/A',
        }));
        
        console.log(`✅ ${allFactures.length} factures récupérées pour clinic_id: ${clinicId}`);
        console.log('Répartition par service_origine:', 
          allFactures.reduce((acc: any, f: any) => {
            const origin = f.service_origine || 'non défini';
            acc[origin] = (acc[origin] || 0) + 1;
            return acc;
          }, {})
        );
        
        setFactures(allFactures);
      }
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
    const factureAny = facture as any;
    return (
      facture.numero_facture.toLowerCase().includes(searchLower) ||
      (factureAny.patient_identifiant && factureAny.patient_identifiant.toLowerCase().includes(searchLower)) ||
      facture.patient_id.toLowerCase().includes(searchLower) ||
      (facture.service_origine && facture.service_origine.toLowerCase().includes(searchLower)) ||
      facture.montant_total.toString().includes(searchLower) ||
      facture.montant_paye.toString().includes(searchLower) ||
      facture.montant_restant.toString().includes(searchLower) ||
      facture.statut.toLowerCase().includes(searchLower) ||
      (facture.date_facture && new Date(facture.date_facture).toLocaleDateString('fr-FR').toLowerCase().includes(searchLower))
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
      <Fade in={true} timeout={500}>
        <Card 
          sx={{ 
            mb: 3,
            background: (theme) => 
              theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: (theme) => 
              theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: (theme) => 
                theme.palette.mode === 'dark'
                  ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                  : '0 8px 30px rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: (theme) => 
                      `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  <Payment sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Paiements en Attente
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gérez les factures en attente de paiement
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                onClick={loadFacturesEnAttente}
                disabled={loading}
                startIcon={<Refresh />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
              >
                Actualiser
              </Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Zoom in={true} timeout={600}>
                  <Card 
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: (theme) => 
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.primary.main, 0.05),
                      border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        borderColor: (theme) => theme.palette.primary.main,
                      },
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <ReceiptLong color="primary" />
                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                          Nombre de factures
                        </Typography>
                      </Box>
                      <Typography variant="h3" color="primary" fontWeight="bold">
                        {loading ? <Skeleton width={60} /> : nombreFactures}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Zoom in={true} timeout={800}>
                  <Card 
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: (theme) => 
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.warning.main, 0.1)
                          : alpha(theme.palette.warning.main, 0.05),
                      border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        borderColor: (theme) => theme.palette.warning.main,
                      },
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <AttachMoney color="warning" />
                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                          Montant total en attente
                        </Typography>
                      </Box>
                      <Typography variant="h3" color="warning.main" fontWeight="bold">
                        {loading ? <Skeleton width={120} /> : `${totalEnAttente.toLocaleString()} XOF`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Zoom in={true} timeout={1000}>
                  <Card 
                    variant="outlined"
                    sx={{
                      height: '100%',
                      background: (theme) => 
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.success.main, 0.1)
                          : alpha(theme.palette.success.main, 0.05),
                      border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        borderColor: (theme) => theme.palette.success.main,
                      },
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <TrendingUp color="success" />
                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                          Montant moyen
                        </Typography>
                      </Box>
                      <Typography variant="h3" color="success.main" fontWeight="bold">
                        {loading ? (
                          <Skeleton width={100} />
                        ) : (
                          `${nombreFactures > 0 
                            ? Math.round(totalEnAttente / nombreFactures).toLocaleString() 
                            : '0'} XOF`
                        )}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              placeholder="Rechercher par numéro facture, identifiant patient, type service, montant, date, statut..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 1,
                  },
                  '&.Mui-focused': {
                    boxShadow: 2,
                  },
                },
              }}
            />
          </CardContent>
        </Card>
      </Fade>

      {loading ? (
        <Fade in={loading} timeout={300}>
          <Box display="flex" flexDirection="column" gap={2} p={4}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        </Fade>
      ) : filteredFactures.length === 0 ? (
        <Fade in={true} timeout={500}>
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: 28,
              },
            }}
          >
            {searchTerm 
              ? 'Aucune facture ne correspond à votre recherche'
              : 'Aucune facture en attente de paiement'}
          </Alert>
        </Fade>
      ) : (
        <Fade in={true} timeout={500}>
          <TableContainer 
            component={Paper}
            sx={{
              borderRadius: 2,
              boxShadow: (theme) => 
                theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                  : '0 4px 20px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden',
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background: (theme) => 
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Numéro Facture</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Identifiant</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Type de service</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Payé</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Reste</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Statut</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFactures.map((facture, index) => (
                  <Fade key={facture.id} in={true} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
                    <TableRow 
                      hover
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: (theme) => 
                            theme.palette.mode === 'dark'
                              ? alpha(theme.palette.primary.main, 0.1)
                              : alpha(theme.palette.primary.main, 0.05),
                          transform: 'scale(1.01)',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {facture.numero_facture}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(facture.date_facture).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" color="primary">
                          {(facture as any).patient_identifiant || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={facture.service_origine 
                            ? facture.service_origine
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, (l) => l.toUpperCase())
                            : 'Autre'}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{
                            fontWeight: 'medium',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {facture.montant_total.toLocaleString()} XOF
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main" fontWeight="medium">
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
                          label={facture.statut.replace('_', ' ')}
                          color={getStatutColor(facture.statut) as any}
                          size="small"
                          sx={{
                            fontWeight: 'medium',
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<Payment />}
                          onClick={() => handlePayNow(facture)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'medium',
                            px: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 4,
                            },
                          }}
                        >
                          Payer maintenant
                        </Button>
                      </TableCell>
                    </TableRow>
                  </Fade>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Fade>
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
