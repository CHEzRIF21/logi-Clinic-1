import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import {
  Person,
  Visibility,
  Edit,
  PregnantWoman,
  LocalHospital,
  Vaccines,
  Science,
  Image,
} from '@mui/icons-material';
import { Patient } from '../../services/supabase';
import { PatientIntegrationService } from '../../services/patientIntegrationService';
import PatientOverview from './PatientOverview';

interface PatientCardProps {
  patient: Patient;
  showActions?: boolean;
  onEdit?: () => void;
  compact?: boolean;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  showActions = true,
  onEdit,
  compact = false,
}) => {
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [patient.id]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await PatientIntegrationService.getPatientSummary(patient.id);
      setSummary(data);
    } catch (error) {
      console.error('Erreur lors du chargement du résumé:', error);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <Card sx={{ mb: 1 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {patient.prenom} {patient.nom}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {patient.identifiant} • {patient.sexe} • {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
            </Box>
            {showActions && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setOverviewOpen(true)}
                startIcon={<Visibility />}
              >
                Voir
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Person color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">
                  {patient.prenom} {patient.nom}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {patient.identifiant} • {patient.sexe} • {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
                </Typography>
                {patient.telephone && (
                  <Typography variant="body2" color="text.secondary">
                    Tél: {patient.telephone}
                  </Typography>
                )}
              </Box>
            </Box>
            {showActions && (
              <Box>
                <IconButton onClick={() => setOverviewOpen(true)} color="primary">
                  <Visibility />
                </IconButton>
                {onEdit && (
                  <IconButton onClick={onEdit} color="primary">
                    <Edit />
                  </IconButton>
                )}
              </Box>
            )}
          </Box>

          {summary && (
            <>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      icon={<PregnantWoman />}
                      label={summary.summary.dossiersObstetricaux}
                      color="secondary"
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Dossiers Maternité
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      icon={<LocalHospital />}
                      label={summary.summary.consultations}
                      color="primary"
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Consultations
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      icon={<Vaccines />}
                      label={summary.summary.vaccinations}
                      color="success"
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Vaccinations
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      icon={<Science />}
                      label={summary.summary.cpn + summary.summary.accouchements}
                      color="info"
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      CPN + Accouchements
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}

          {showActions && (
            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setOverviewOpen(true)}
                startIcon={<Visibility />}
              >
                Voir toutes les données du patient
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <PatientOverview
        open={overviewOpen}
        onClose={() => setOverviewOpen(false)}
        patientId={patient.id}
      />
    </>
  );
};

export default PatientCard;

