import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Alert, Divider, Button, Grid } from '@mui/material';
import { LocalHospital, Edit } from '@mui/icons-material';
import { ConstantesSection } from '../ConstantesSection';
import { ModalExamensCliniques } from '../ModalExamensCliniques';
import { ConsultationService, ConsultationConstantes } from '../../../services/consultationService';
import { SpeechTextField } from '../../common/SpeechTextField';

interface WorkflowStep8ExamenPhysiqueProps {
  consultationId: string;
  patientId: string;
  examensCliniques: any;
  onExamensChange: (examens: any) => void;
  userId: string;
}

export const WorkflowStep8ExamenPhysique: React.FC<WorkflowStep8ExamenPhysiqueProps> = ({
  consultationId,
  patientId,
  examensCliniques,
  onExamensChange,
  userId
}) => {
  const [constantes, setConstantes] = useState<ConsultationConstantes | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // États pour l'examen physique détaillé
  const [examenPhysique, setExamenPhysique] = useState<any>(() => {
    if (typeof examensCliniques === 'object' && examensCliniques !== null) {
      return examensCliniques;
    }
    return {
      etat_general: '',
      facies: '',
      peau: '',
      muqueuses: '',
      ganglions: '',
      cou: '',
      thorax: '',
      coeur: '',
      poumons: '',
      abdomen: '',
      membres: '',
      neurologique: '',
      autres: '',
    };
  });

  useEffect(() => {
    loadConstantes();
  }, [consultationId]);

  const loadConstantes = async () => {
    try {
      const data = await ConsultationService.getConstantes(consultationId);
      setConstantes(data);
    } catch (error) {
      console.error('Erreur chargement constantes:', error);
    }
  };

  const handleSaveConstantes = async (data: Partial<ConsultationConstantes>, syncToPatient: boolean) => {
    try {
      await ConsultationService.saveConstantes(consultationId, patientId, data, userId, syncToPatient);
      await loadConstantes();
    } catch (error) {
      console.error('Erreur sauvegarde constantes:', error);
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <LocalHospital color="primary" />
            <Typography variant="h6">
              Étape 8 — Examen Physique
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            Constantes Vitales : Poids (kg), Taille (cm), Température (°C), Tension Artérielle (mmHg), Pouls, SpO2.
            L'IMC est calculé automatiquement.
          </Alert>

          <ConstantesSection
            consultationId={consultationId}
            patientId={patientId}
            initialConstantes={constantes}
            onSave={handleSaveConstantes}
            userId={userId}
          />

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Examen Physique
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Décrivez l'examen physique du patient par système. Utilisez la transcription vocale pour faciliter la saisie.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="État Général"
                    value={examenPhysique.etat_general || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, etat_general: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Aspect général, conscience, état nutritionnel..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Facies"
                    value={examenPhysique.facies || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, facies: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Expression faciale, coloration..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Peau et Téguments"
                    value={examenPhysique.peau || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, peau: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Coloration, éruptions, lésions..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Muqueuses"
                    value={examenPhysique.muqueuses || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, muqueuses: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Conjonctives, bouche, langue..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Ganglions"
                    value={examenPhysique.ganglions || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, ganglions: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Adénopathies, localisation, taille..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Cou et Thyroïde"
                    value={examenPhysique.cou || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, cou: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Raideur, goitre, masses..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Thorax"
                    value={examenPhysique.thorax || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, thorax: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Forme, symétrie, déformations..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Cœur"
                    value={examenPhysique.coeur || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, coeur: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Auscultation, rythme, bruits..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Poumons"
                    value={examenPhysique.poumons || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, poumons: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Auscultation, percussion, râles..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Abdomen"
                    value={examenPhysique.abdomen || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, abdomen: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Inspection, palpation, percussion, auscultation..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Membres"
                    value={examenPhysique.membres || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, membres: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Œdèmes, déformations, mobilité..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Examen Neurologique"
                    value={examenPhysique.neurologique || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, neurologique: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Conscience, réflexes, motricité, sensibilité..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>

                <Grid item xs={12}>
                  <SpeechTextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Autres Observations"
                    value={examenPhysique.autres || ''}
                    onChange={(value) => {
                      const updated = { ...examenPhysique, autres: value };
                      setExamenPhysique(updated);
                      onExamensChange(updated);
                    }}
                    placeholder="Autres éléments pertinents de l'examen physique..."
                    enableSpeech={true}
                    language="fr-FR"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Examen Systémique (Mode Avancé)
                </Typography>
                <Button 
                  startIcon={<Edit />} 
                  variant="outlined" 
                  size="small"
                  onClick={() => setModalOpen(true)}
                >
                  Saisir l'examen détaillé
                </Button>
              </Box>

              <ModalExamensCliniques
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={(data) => {
                  const updated = { ...examenPhysique, examen_detaille: data };
                  setExamenPhysique(updated);
                  onExamensChange(updated);
                  setModalOpen(false);
                }}
                initialExamens={typeof examensCliniques === 'string' ? examensCliniques : JSON.stringify(examensCliniques || {})}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </Box>
  );
};

