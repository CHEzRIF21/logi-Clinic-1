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
      // Exclure les factures complètement payées (statut = 'payee' ou montant_restant <= 0)
      // Cela inclut toutes les factures : avec consultation_id, service_origine='enregistrement', etc.
      const { data: facturesData, error } = await supabase
        .from('factures')
        .select(`
          *,
          consultations(id, statut_paiement, type),
          patients(id, identifiant, nom, prenom)
        `)
        .in('patient_id', patientIds)
        .in('statut', ['en_attente', 'partiellement_payee'])
        .gt('montant_restant', 0)
        .neq('statut', 'payee') // Exclure explicitement les factures payées intégralement
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
          // Filtrer par patientIds ET exclure les factures complètement payées
          const filteredFactures = allFactures.filter(f => 
            patientIds.includes(f.patient_id) &&
            f.statut !== 'payee' &&
            f.montant_restant > 0
          );
          
          // Récupérer les informations des patients (identifiant, nom, prénom)
          const { data: patientsData } = await supabase
            .from('patients')
            .select('id, identifiant, nom, prenom')
            .in('id', [...new Set(filteredFactures.map(f => f.patient_id))]);
          
          const patientsMap = new Map((patientsData || []).map(p => [p.id, {
            identifiant: p.identifiant,
            nom: p.nom,
            prenom: p.prenom,
          }]));
          
          // Récupérer les types de consultation pour les factures liées à des consultations
          const facturesAvecConsultation = filteredFactures.filter(f => f.consultation_id);
          const consultationIds = [...new Set(facturesAvecConsultation.map(f => f.consultation_id).filter(Boolean))];
          
          let consultationsMap = new Map();
          if (consultationIds.length > 0) {
            const { data: consultationsData } = await supabase
              .from('consultations')
              .select('id, type')
              .in('id', consultationIds);
            
            consultationsMap = new Map((consultationsData || []).map(c => [c.id, c.type]));
          }
          
          // Ajouter les informations du patient et le type de consultation à chaque facture
          const facturesWithIdentifiant = filteredFactures.map(f => {
            const patientInfo = patientsMap.get(f.patient_id);
            const consultationType = f.consultation_id ? consultationsMap.get(f.consultation_id) : null;
            return {
              ...f,
              patient_identifiant: patientInfo?.identifiant || 'N/A',
              patient_nom: patientInfo?.nom || 'N/A',
              patient_prenom: patientInfo?.prenom || 'N/A',
              consultation_type: consultationType || null,
            };
          });
          
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
        // Filtrer et formater les factures avec les informations du patient
        // Exclure explicitement les factures complètement payées
        const allFactures = (facturesData || [])
          .filter((f: any) => f.statut !== 'payee' && f.montant_restant > 0)
          .map((f: any) => ({
            ...f,
            consultation_id: f.consultation_id || f.consultations?.[0]?.id,
            consultation_type: f.consultations?.[0]?.type || f.consultations?.type || null,
            patient_identifiant: f.patients?.identifiant || 'N/A',
            patient_nom: f.patients?.nom || 'N/A',
            patient_prenom: f.patients?.prenom || 'N/A',
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
    try {
      // Attendre un peu pour que les triggers SQL s'exécutent complètement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Récupérer la facture complète mise à jour (les triggers SQL ont dû la mettre à jour)
      const { data: factureUpdated, error: factureError } = await supabase
        .from('factures')
        .select(`
          *,
          consultations(id, statut_paiement, type),
          patients(id, identifiant, nom, prenom)
        `)
        .eq('id', facture.id)
        .single();

      if (factureError) {
        console.error('Erreur récupération facture:', factureError);
      }

      // Mettre à jour la facture dans l'état local immédiatement (pour paiement partiel ou complet)
      if (factureUpdated) {
        const factureFormatee: any = {
          ...factureUpdated,
          consultation_id: factureUpdated.consultation_id || factureUpdated.consultations?.[0]?.id,
          consultation_type: factureUpdated.consultations?.[0]?.type || factureUpdated.consultations?.type || (facture as any).consultation_type || null,
          patient_identifiant: factureUpdated.patients?.identifiant || (facture as any).patient_identifiant || 'N/A',
          patient_nom: factureUpdated.patients?.nom || (facture as any).patient_nom || 'N/A',
          patient_prenom: factureUpdated.patients?.prenom || (facture as any).patient_prenom || 'N/A',
        };
        
        // Mettre à jour la facture dans la liste
        setFactures(prevFactures => 
          prevFactures.map(f => 
            f.id === facture.id ? factureFormatee : f
          )
        );
        
        console.log('✅ Facture mise à jour dans l\'état local:', {
          id: factureUpdated.id,
          statut: factureUpdated.statut,
          montant_paye: factureUpdated.montant_paye,
          montant_restant: factureUpdated.montant_restant
        });
      }

      // Si la facture est complètement payée, vérifier la synchronisation complète
      if (factureUpdated && factureUpdated.statut === 'payee' && factureUpdated.montant_restant <= 0) {
        // Vérifier la synchronisation complète via la fonction RPC (si disponible)
        try {
          const { data: syncResult, error: syncError } = await supabase.rpc('attendre_synchronisation_paiement', {
            p_facture_id: facture.id,
            p_timeout_seconds: 3
          });

          if (!syncError && syncResult && syncResult.length > 0) {
            const sync = syncResult[0];
            if (sync.synchronise) {
              console.log(`✅ Synchronisation complète: ${sync.tickets_mis_a_jour} tickets, stock décrémenté: ${sync.stock_decremente}`);
            } else {
              console.warn('⚠️ Synchronisation incomplète:', sync.message);
              // Appeler manuellement la fonction de mise à jour des actes en fallback
              const { data: updateResult } = await supabase.rpc('update_actes_on_payment', {
                p_facture_id: facture.id
              });
              if (updateResult) {
                console.log(`✅ Actes mis à jour manuellement: ${updateResult[0]?.tickets_updated || 0} tickets`);
              }
            }
          }
        } catch (rpcError: any) {
          // Si la fonction RPC n'existe pas encore (migration 51 pas appliquée), 
          // appeler directement update_actes_on_payment en fallback
          console.log('Fonction de synchronisation non disponible, utilisation du fallback');
          const { data: updateResult, error: rpcError2 } = await supabase.rpc('update_actes_on_payment', {
            p_facture_id: facture.id
          });

          if (rpcError2) {
            console.error('Erreur mise à jour actes via RPC:', rpcError2);
            // Fallback final : mettre à jour manuellement les tickets
            const { error: ticketsError } = await supabase
              .from('tickets_facturation')
              .update({
                statut: 'payee',
                date_paiement: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('facture_id', facture.id)
              .in('statut', ['facture', 'en_attente']);

            if (ticketsError) {
              console.error('Erreur mise à jour tickets_facturation (fallback):', ticketsError);
            }
          } else if (updateResult && updateResult.length > 0) {
            console.log(`✅ Actes mis à jour: ${updateResult[0].tickets_updated} tickets, ${updateResult[0].operations_updated} opérations`);
          }
        }

        // Toutes les autres actions sont automatiques via les triggers SQL :
        // - Journal de caisse mis à jour (trigger_mettre_a_jour_journal_caisse)
        // - Consultation débloquée (trigger_update_consultation_from_invoice)
        // - Stock décrémenté (trigger_decrement_stock_on_payment)
      } else if (factureUpdated && factureUpdated.statut === 'partiellement_payee') {
        // Pour un paiement partiel, afficher un message spécifique
        console.log('✅ Paiement partiel enregistré:', {
          montant_paye: factureUpdated.montant_paye,
          montant_restant: factureUpdated.montant_restant,
          statut: factureUpdated.statut
        });
      }

      // Message de succès adapté selon le statut
      if (factureUpdated && factureUpdated.statut === 'payee' && factureUpdated.montant_restant <= 0) {
        enqueueSnackbar('Paiement enregistré avec succès. Toutes les actions ont été synchronisées automatiquement.', { 
          variant: 'success',
          autoHideDuration: 4000
        });
      } else if (factureUpdated && factureUpdated.statut === 'partiellement_payee') {
        enqueueSnackbar(
          `Paiement partiel enregistré : ${factureUpdated.montant_paye?.toLocaleString()} XOF payés, reste ${factureUpdated.montant_restant?.toLocaleString()} XOF.`, 
          { 
            variant: 'success',
            autoHideDuration: 4000
          }
        );
      } else {
        enqueueSnackbar('Paiement enregistré avec succès.', { 
          variant: 'success',
          autoHideDuration: 4000
        });
      }
      
      // Recharger les factures pour s'assurer que tout est à jour
      await loadFacturesEnAttente();
      setOpenPaymentDialog(false);
      setSelectedFacture(null);
    } catch (error: any) {
      console.error('Erreur lors de la finalisation du paiement:', error);
      enqueueSnackbar('Paiement enregistré, mais erreur lors de la vérification de synchronisation', { variant: 'warning' });
      // Recharger quand même les factures
      await loadFacturesEnAttente();
      setOpenPaymentDialog(false);
      setSelectedFacture(null);
    }
  };

  const filteredFactures = factures.filter(facture => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const factureAny = facture as any;
    return (
      facture.numero_facture.toLowerCase().includes(searchLower) ||
      (factureAny.patient_identifiant && factureAny.patient_identifiant.toLowerCase().includes(searchLower)) ||
      (factureAny.patient_nom && factureAny.patient_nom.toLowerCase().includes(searchLower)) ||
      (factureAny.patient_prenom && factureAny.patient_prenom.toLowerCase().includes(searchLower)) ||
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
            transition: 'all 0.3s ease-in-out',
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
                  <Payment sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', mb: 0 }}>
                    Paiements en Attente
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Gérez les factures en attente de paiement
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={loadFacturesEnAttente}
                disabled={loading}
                startIcon={<Refresh />}
                sx={{
                  borderRadius: 1.5,
                  textTransform: 'none',
                  px: 2,
                  py: 0.75,
                  fontSize: '0.8125rem',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 2,
                  },
                }}
              >
                Actualiser
              </Button>
            </Box>

            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={12} sm={4}>
                <Card 
                  variant="outlined"
                  sx={{
                    background: (theme) => 
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.primary.main, 0.05),
                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <ReceiptLong sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="medium" sx={{ fontSize: '0.7rem' }}>
                        Nombre de factures
                      </Typography>
                    </Box>
                    <Typography variant="h5" color="primary" fontWeight="bold" sx={{ fontSize: '1.25rem' }}>
                      {loading ? <Skeleton width={40} height={28} /> : nombreFactures}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card 
                  variant="outlined"
                  sx={{
                    background: (theme) => 
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.warning.main, 0.1)
                        : alpha(theme.palette.warning.main, 0.05),
                    border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <AttachMoney sx={{ fontSize: 18, color: 'warning.main' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="medium" sx={{ fontSize: '0.7rem' }}>
                        Montant total
                      </Typography>
                    </Box>
                    <Typography variant="h5" color="warning.main" fontWeight="bold" sx={{ fontSize: '1.25rem' }}>
                      {loading ? <Skeleton width={80} height={28} /> : `${totalEnAttente.toLocaleString()} XOF`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card 
                  variant="outlined"
                  sx={{
                    background: (theme) => 
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.success.main, 0.1)
                        : alpha(theme.palette.success.main, 0.05),
                    border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <TrendingUp sx={{ fontSize: 18, color: 'success.main' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="medium" sx={{ fontSize: '0.7rem' }}>
                        Montant moyen
                      </Typography>
                    </Box>
                    <Typography variant="h5" color="success.main" fontWeight="bold" sx={{ fontSize: '1.25rem' }}>
                      {loading ? (
                        <Skeleton width={70} height={28} />
                      ) : (
                        `${nombreFactures > 0 
                          ? Math.round(totalEnAttente / nombreFactures).toLocaleString() 
                          : '0'} XOF`
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher par numéro facture, identifiant patient, type service, montant, date, statut..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 0,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  fontSize: '0.8125rem',
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
              borderRadius: 3,
              boxShadow: (theme) => 
                theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                  : '0 4px 20px rgba(0, 0, 0, 0.08)',
              overflowX: 'auto',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 200px)',
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              '&::-webkit-scrollbar': {
                height: 10,
                width: 10,
              },
              '&::-webkit-scrollbar-track': {
                background: (theme) => 
                  theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.1)
                    : alpha(theme.palette.grey[300], 0.1),
                borderRadius: 1,
              },
              '&::-webkit-scrollbar-thumb': {
                background: (theme) => alpha(theme.palette.primary.main, 0.4),
                borderRadius: 1,
                '&:hover': {
                  background: (theme) => alpha(theme.palette.primary.main, 0.6),
                },
              },
            }}
          >
            <Table sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow
                  sx={{
                    background: (theme) => 
                      theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.dark, 0.15)} 100%)`
                        : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                    borderBottom: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    '& th': {
                      borderRight: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      '&:last-child': {
                        borderRight: 'none',
                      },
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, py: 2.5, fontSize: '0.875rem', color: 'primary.main' }}>
                    Numéro Facture
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2.5, fontSize: '0.875rem', color: 'primary.main' }}>
                    Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2.5, fontSize: '0.875rem', color: 'primary.main' }}>
                    Patient
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2.5, fontSize: '0.875rem', color: 'primary.main' }}>
                    Type de service
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, py: 2.5, fontSize: '0.875rem', color: 'primary.main' }}>
                    Total
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, py: 2.5, fontSize: '0.875rem', color: 'primary.main' }}>
                    Payé
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, py: 2.5, fontSize: '0.875rem', color: 'primary.main' }}>
                    Reste
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, py: 2.5, fontSize: '0.875rem', color: 'primary.main' }}>
                    Statut
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, py: 2.5, fontSize: '0.875rem', color: 'primary.main' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFactures.map((facture, index) => (
                  <Fade key={facture.id} in={true} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
                    <TableRow 
                      hover
                      sx={{
                        transition: 'all 0.2s ease-in-out',
                        backgroundColor: (theme) => 
                          index % 2 === 0
                            ? theme.palette.mode === 'dark'
                              ? alpha(theme.palette.background.paper, 0.3)
                              : alpha(theme.palette.grey[50], 0.5)
                            : 'transparent',
                        borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        '& td': {
                          borderRight: (theme) => `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                          py: 2,
                          '&:last-child': {
                            borderRight: 'none',
                          },
                        },
                        '&:hover': {
                          background: (theme) => 
                            theme.palette.mode === 'dark'
                              ? alpha(theme.palette.primary.main, 0.15)
                              : alpha(theme.palette.primary.main, 0.08),
                          transform: 'translateX(4px)',
                          boxShadow: (theme) => 
                            theme.palette.mode === 'dark'
                              ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                              : `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                        '&:last-child td': {
                          borderBottom: 'none',
                        },
                      }}
                    >
                      <TableCell sx={{ minWidth: 150 }}>
                        <Typography variant="body2" fontWeight={600} color="primary" sx={{ fontSize: '0.875rem' }}>
                          {facture.numero_facture}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {new Date(facture.date_facture).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                            {(facture as any).patient_prenom || 'N/A'} {(facture as any).patient_nom || ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            ID: {(facture as any).patient_identifiant || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Chip
                          label={(facture as any).consultation_type 
                            ? (facture as any).consultation_type
                            : facture.service_origine 
                              ? facture.service_origine
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, (l) => l.toUpperCase())
                              : 'Autre'}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            borderWidth: 1.5,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 100 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.875rem' }}>
                          {facture.montant_total.toLocaleString()} XOF
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 100 }}>
                        <Typography variant="body2" color="success.main" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                          {facture.montant_paye.toLocaleString()} XOF
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 100 }}>
                        <Typography variant="body2" color="warning.main" fontWeight={700} sx={{ fontSize: '0.875rem' }}>
                          {facture.montant_restant.toLocaleString()} XOF
                        </Typography>
                      </TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>
                    {facture.statut === 'partiellement_payee' ? (
                      <Box>
                        <Chip
                          label="Partiellement payée"
                          color="warning"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            mb: 0.5,
                            display: 'block',
                          }}
                        />
                        <Typography variant="caption" color="warning.main" fontWeight={700}>
                          Reste: {facture.montant_restant.toLocaleString()} XOF
                        </Typography>
                      </Box>
                    ) : (
                      <Chip
                        label={facture.statut.replace('_', ' ')}
                        color={getStatutColor(facture.statut) as any}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'capitalize',
                          minWidth: 90,
                        }}
                      />
                    )}
                  </TableCell>
                      <TableCell align="center" sx={{ minWidth: 160 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<Payment />}
                          onClick={() => handlePayNow(facture)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            px: 2.5,
                            py: 1,
                            transition: 'all 0.2s ease-in-out',
                            boxShadow: 2,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 6,
                            },
                          }}
                        >
                          Payer
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
