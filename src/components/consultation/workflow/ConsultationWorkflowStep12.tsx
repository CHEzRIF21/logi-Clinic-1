import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import { CheckCircle, History, Description, Download, Print } from '@mui/icons-material';
import { Consultation } from '../../../services/consultationApiService';
import { ConsultationApiService } from '../../../services/consultationApiService';
import { ConsultationBillingService } from '../../../services/consultationBillingService';
import { AuditService } from '../../../services/auditService';
import { AuditTimeline } from './AuditTimeline';

interface ConsultationWorkflowStep12Props {
  consultation: Consultation;
  onClose: () => Promise<void>;
  userId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const ConsultationWorkflowStep12: React.FC<ConsultationWorkflowStep12Props> = ({
  consultation,
  onClose,
  userId,
}) => {
  const [diagnosticFinal, setDiagnosticFinal] = useState('');
  const [justificationTraitement, setJustificationTraitement] = useState('');
  const [signatureAcceptee, setSignatureAcceptee] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const canClose = () => {
    return (
      diagnosticFinal.trim() !== '' &&
      justificationTraitement.trim() !== '' &&
      signatureAcceptee &&
      consultation.motifs &&
      consultation.motifs.length > 0
    );
  };

  const handleCloseConsultation = async () => {
    if (!canClose()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setClosing(true);
    try {
      // Générer la facturation automatiquement si nécessaire
      try {
        await ConsultationBillingService.ensureInvoiceGenerated(consultation.id, consultation.patient_id);
      } catch (billingError: any) {
        console.error('Erreur facturation automatique:', billingError);
        alert(billingError?.message || 'Impossible de générer la facturation automatique. Veuillez réessayer.');
        setClosing(false);
        return;
      }

      // Mettre à jour le diagnostic final et la justification
      await ConsultationApiService.updateConsultation(consultation.id, {
        diagnostics: [...(consultation.diagnostics || []), diagnosticFinal],
        traitement_en_cours: justificationTraitement,
      }, userId);

      // Traçabilité : Mise à jour du diagnostic final
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: 'medecin',
        action: 'update_final_diagnosis',
        details: {
          diagnostic_final: diagnosticFinal,
          justification: justificationTraitement,
        },
      });

      // Clôturer la consultation
      await ConsultationApiService.closeConsultation(consultation.id, userId);

      // Traçabilité : Clôture de la consultation
      const auditSummary = await AuditService.getAuditSummary(consultation.id);
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: 'medecin',
        action: 'close_consultation',
        details: {
          diagnostic_final: diagnosticFinal,
          total_actions: auditSummary.total_actions,
          summary_hash: `sha256:${consultation.id}-${Date.now()}`,
        },
      });

      await onClose();
      alert('Consultation clôturée avec succès');
    } catch (error) {
      console.error('Erreur lors de la clôture:', error);
      alert('Erreur lors de la clôture de la consultation');
    } finally {
      setClosing(false);
    }
  };

  const handleExportPDF = async () => {
    // TODO: Implémenter l'export PDF avec le résumé et le journal d'audit
    alert('Fonctionnalité d\'export PDF en cours de développement');
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" gutterBottom>
              Étape 9 — Clôture de la Consultation
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExportPDF}
              >
                Exporter PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={() => window.print()}
              >
                Imprimer
              </Button>
            </Box>
          </Box>

          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Résumé" icon={<Description />} iconPosition="start" />
            <Tab label="Traçabilité" icon={<History />} iconPosition="start" />
            <Tab label="Clôture" icon={<CheckCircle />} iconPosition="start" />
          </Tabs>

          {/* Onglet Résumé */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Informations Consultation
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type:</strong> {consultation.type || 'Médecine générale'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date début:</strong> {new Date(consultation.started_at).toLocaleString('fr-FR')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Statut:</strong> {consultation.status}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Éléments de la Consultation
                    </Typography>
                    <Typography variant="body2">
                      <strong>Motifs:</strong> {consultation.motifs?.length || 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Diagnostics:</strong> {consultation.diagnostics?.length || 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Anamnèse:</strong> {consultation.anamnese ? 'Remplie' : 'Vide'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Onglet Traçabilité */}
          <TabPanel value={activeTab} index={1}>
            <AuditTimeline
              consultId={consultation.id}
              onExportPDF={handleExportPDF}
            />
          </TabPanel>

          {/* Onglet Clôture */}
          <TabPanel value={activeTab} index={2}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Données obligatoires avant clôture:
              </Typography>
              <Typography variant="body2">
                • Diagnostic final • Justification du traitement • Signature numérique
              </Typography>
            </Alert>

            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Diagnostic final *"
                value={diagnosticFinal}
                onChange={(e) => setDiagnosticFinal(e.target.value)}
                required
                helperText="Indiquez le diagnostic final de la consultation"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Justification du traitement *"
                value={justificationTraitement}
                onChange={(e) => setJustificationTraitement(e.target.value)}
                required
                helperText="Justifiez le traitement prescrit"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={signatureAcceptee}
                    onChange={(e) => setSignatureAcceptee(e.target.checked)}
                  />
                }
                label="J'accepte la signature numérique et confirme la clôture de cette consultation *"
              />
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Heure de fin: {new Date().toLocaleString('fr-FR')}
              </Typography>
              <Typography variant="body2">
                Le dossier sera archivé après clôture.
              </Typography>
            </Alert>

            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleCloseConsultation}
              disabled={!canClose() || closing}
              fullWidth
              size="large"
            >
              {closing ? 'Clôture en cours...' : 'Clôturer la consultation'}
            </Button>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};
