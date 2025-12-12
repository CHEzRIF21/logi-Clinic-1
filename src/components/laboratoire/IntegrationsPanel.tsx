import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Notifications,
  ShoppingCart,
  Assessment,
  Payment,
  LocalHospital,
  BarChart
} from '@mui/icons-material';
import { GlassCard } from '../ui/GlassCard';
import { LaboratoireIntegrationService } from '../../services/laboratoireIntegrationService';
import { LaboratoireService, LabPrescription } from '../../services/laboratoireService';

interface IntegrationsPanelProps {
  prescriptionId?: string;
  patientId?: string;
}

const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ prescriptionId, patientId }) => {
  const [integrationsStatus, setIntegrationsStatus] = useState<{
    consultation: boolean;
    facturation: boolean;
    hospitalisation: boolean;
    pharmacie: boolean;
    statistiques: boolean;
  }>({
    consultation: false,
    facturation: false,
    hospitalisation: false,
    pharmacie: false,
    statistiques: false
  });

  const [paymentStatus, setPaymentStatus] = useState<{
    authorized: boolean;
    message: string;
    factureId?: string;
  } | null>(null);

  const [openCommandeDialog, setOpenCommandeDialog] = useState(false);
  const [commandeForm, setCommandeForm] = useState({
    reactifId: '',
    quantite: 0,
    raison: ''
  });

  useEffect(() => {
    if (prescriptionId && patientId) {
      checkIntegrations();
      checkPaymentStatus();
    }
  }, [prescriptionId, patientId]);

  const checkIntegrations = async () => {
    if (!prescriptionId) return;

    try {
      const prescription = await LaboratoireService.getPrescriptionById(prescriptionId);
      if (prescription) {
        setIntegrationsStatus({
          consultation: prescription.origine === 'consultation',
          facturation: false, // À vérifier via factures
          hospitalisation: false, // À vérifier via hospitalisations
          pharmacie: false, // Toujours disponible
          statistiques: true // Toujours disponible
        });
      }
    } catch (error) {
      console.error('Erreur vérification intégrations:', error);
    }
  };

  const checkPaymentStatus = async () => {
    if (!prescriptionId || !patientId) return;

    try {
      const paiementStatus = await LaboratoireIntegrationService.checkPaiementStatus(prescriptionId);
      const status = {
        authorized: paiementStatus.peut_prelever,
        message: paiementStatus.message,
        factureId: undefined
      };
      setPaymentStatus(status);
      setIntegrationsStatus(prev => ({ ...prev, facturation: status.authorized }));
    } catch (error) {
      console.error('Erreur vérification paiement:', error);
    }
  };

  const handleSendResultsToConsultation = async () => {
    if (!prescriptionId) return;

    try {
      const prelevements = await LaboratoireService.listPrelevements(prescriptionId);
      if (prelevements.length > 0) {
        const rapports = await LaboratoireService.listRapports(prelevements[0].id);
        if (rapports.length > 0) {
          const result = await LaboratoireIntegrationService.sendResultsToConsultation(
            rapports[0].id,
            prelevements[0].id
          );
          alert(result.message);
        }
      }
    } catch (error) {
      alert('Erreur lors de l\'envoi des résultats');
    }
  };

  const handleCreateBillingTicket = async () => {
    if (!prescriptionId || !patientId) return;

    try {
      const prescription = await LaboratoireService.getPrescriptionById(prescriptionId);
      if (prescription) {
        const montant = prompt('Montant de l\'examen (XOF):');
        if (montant) {
          const result = await LaboratoireIntegrationService.createTicketFacturation(
            prescriptionId,
            patientId,
            prescription.type_examen,
            parseFloat(montant)
          );
          alert(result.message);
          checkPaymentStatus();
        }
      }
    } catch (error) {
      alert('Erreur lors de la création du ticket');
    }
  };

  const handleSendReactifOrder = async () => {
    try {
      const result = await LaboratoireIntegrationService.commanderReactifs(
        commandeForm.reactifId,
        commandeForm.quantite,
        commandeForm.raison
      );
      alert(result.message);
      setOpenCommandeDialog(false);
      setCommandeForm({ reactifId: '', quantite: 0, raison: '' });
    } catch (error) {
      alert('Erreur lors de l\'envoi de la commande');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        Intégrations avec les Autres Modules
      </Typography>

      <Grid container spacing={2}>
        {/* Intégration Consultation */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Assessment color={integrationsStatus.consultation ? 'success' : 'disabled'} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Consultation / Dossier Patient
              </Typography>
              <Chip 
                label={integrationsStatus.consultation ? 'Connecté' : 'Non connecté'} 
                size="small" 
                color={integrationsStatus.consultation ? 'success' : 'default'}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {integrationsStatus.consultation 
                ? 'Prescription créée depuis une consultation. Les résultats seront automatiquement ajoutés au dossier patient.'
                : 'Cette prescription n\'est pas liée à une consultation.'}
            </Typography>
            {integrationsStatus.consultation && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleSendResultsToConsultation}
                sx={{ mt: 1 }}
              >
                Envoyer les résultats au dossier
              </Button>
            )}
          </GlassCard>
        </Grid>

        {/* Intégration Facturation */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Payment color={integrationsStatus.facturation ? 'success' : 'warning'} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Facturation / Caisse
              </Typography>
              <Chip 
                label={paymentStatus?.authorized ? 'Payé' : 'En attente'} 
                size="small" 
                color={paymentStatus?.authorized ? 'success' : 'warning'}
              />
            </Box>
            {paymentStatus && (
              <Alert severity={paymentStatus.authorized ? 'success' : 'warning'} sx={{ mb: 1 }}>
                {paymentStatus.message}
              </Alert>
            )}
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCreateBillingTicket}
              >
                Créer ticket facturation
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={checkPaymentStatus}
              >
                Vérifier paiement
              </Button>
            </Box>
          </GlassCard>
        </Grid>

        {/* Intégration Hospitalisation */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <LocalHospital color={integrationsStatus.hospitalisation ? 'info' : 'disabled'} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Hospitalisation
              </Typography>
              <Chip 
                label={integrationsStatus.hospitalisation ? 'Patient hospitalisé' : 'Non hospitalisé'} 
                size="small" 
                color={integrationsStatus.hospitalisation ? 'info' : 'default'}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {integrationsStatus.hospitalisation
                ? 'Les résultats urgents seront automatiquement notifiés au poste infirmier.'
                : 'Le patient n\'est pas actuellement hospitalisé.'}
            </Typography>
          </GlassCard>
        </Grid>

        {/* Intégration Pharmacie */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <ShoppingCart color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Pharmacie / Achats
              </Typography>
              <Chip label="Disponible" size="small" color="primary" />
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Commandez des réactifs et consommables directement depuis le module Pharmacie.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setOpenCommandeDialog(true)}
              sx={{ mt: 1 }}
            >
              Commander des réactifs
            </Button>
          </GlassCard>
        </Grid>

        {/* Intégration Statistiques */}
        <Grid item xs={12}>
          <GlassCard sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <BarChart color="success" />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Statistiques / Reporting
              </Typography>
              <Chip label="Actif" size="small" color="success" />
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Les données sont automatiquement envoyées au module Statistiques pour le reporting et la détection d'épidémies.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={async () => {
                const dateDebut = prompt('Date début (YYYY-MM-DD):');
                const dateFin = prompt('Date fin (YYYY-MM-DD):');
                if (dateDebut && dateFin) {
                  const bilanData = await LaboratoireIntegrationService.getBilanFinancier(dateDebut, dateFin);
                  const kpiData = await LaboratoireIntegrationService.getLabKPI();
                  alert(`Rapport généré:\n- Examens: ${bilanData.nombre_prescriptions}\n- CA: ${bilanData.chiffre_affaires} XOF\n- Délai moyen: ${kpiData.delai_moyen_heures.toFixed(1)}h`);
                }
              }}
              sx={{ mt: 1 }}
            >
              Générer rapport statistique
            </Button>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Dialog commande réactifs */}
      <Dialog open={openCommandeDialog} onClose={() => setOpenCommandeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Commander des Réactifs</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="ID Réactif"
            value={commandeForm.reactifId}
            onChange={(e) => setCommandeForm({ ...commandeForm, reactifId: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Quantité"
            value={commandeForm.quantite}
            onChange={(e) => setCommandeForm({ ...commandeForm, quantite: parseFloat(e.target.value) })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Raison de la commande"
            value={commandeForm.raison}
            onChange={(e) => setCommandeForm({ ...commandeForm, raison: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCommandeDialog(false)}>Annuler</Button>
          <Button onClick={handleSendReactifOrder} variant="contained">
            Envoyer la commande
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationsPanel;

