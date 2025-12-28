import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Alert, Divider, Button } from '@mui/material';
import { LocalHospital, Edit } from '@mui/icons-material';
import { ConstantesSection } from '../ConstantesSection';
import { ModalExamensCliniques } from '../ModalExamensCliniques';
import { ConsultationService, ConsultationConstantes } from '../../../services/consultationService';

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
      await ConsultationService.saveConstantes(consultationId, patientId, data, userId);
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Examen Systémique
                </Typography>
                <Button 
                  startIcon={<Edit />} 
                  variant="outlined" 
                  size="small"
                  onClick={() => setModalOpen(true)}
                >
                  Saisir l'examen
                </Button>
              </Box>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Cœur, Poumons, Abdomen, ORL, etc.
              </Alert>

              {examensCliniques && (
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {typeof examensCliniques === 'string' ? examensCliniques : JSON.stringify(examensCliniques, null, 2)}
                  </Typography>
                </Box>
              )}

              <ModalExamensCliniques
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={(data) => {
                  onExamensChange(data);
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

