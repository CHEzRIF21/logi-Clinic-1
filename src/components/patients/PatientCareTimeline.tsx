import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Cancel,
  AccessTime,
} from '@mui/icons-material';
import { PatientCareTimeline as PatientCareTimelineType } from '../../services/supabase';
import { supabase } from '../../services/supabase';

interface PatientCareTimelineProps {
  patientId: string;
}

export const PatientCareTimeline: React.FC<PatientCareTimelineProps> = ({ patientId }) => {
  const [timeline, setTimeline] = useState<PatientCareTimelineType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [patientId]);

  const loadTimeline = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_care_timeline')
        .select('*')
        .eq('patient_id', patientId)
        .order('date_debut', { ascending: false });

      if (error) throw error;
      setTimeline(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement du suivi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'termine':
        return <CheckCircle color="success" />;
      case 'en_cours':
        return <AccessTime color="primary" />;
      case 'annule':
        return <Cancel color="error" />;
      default:
        return <RadioButtonUnchecked color="disabled" />;
    }
  };

  const getStatusColor = (statut: string): 'success' | 'primary' | 'error' | 'default' => {
    switch (statut) {
      case 'termine':
        return 'success';
      case 'en_cours':
        return 'primary';
      case 'annule':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non spécifié';
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
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="textSecondary">
          Chargement du suivi...
        </Typography>
      </Box>
    );
  }

  if (timeline.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="textSecondary">
          Aucune étape de prise en charge enregistrée pour ce patient.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Suivi des étapes de prise en charge
      </Typography>

      <Stepper orientation="vertical">
        {timeline.map((item, index) => (
          <Step key={item.id} active={item.statut === 'en_cours'} completed={item.statut === 'termine'}>
            <StepLabel
              StepIconComponent={() => (
                <Avatar
                  sx={{
                    bgcolor: getStatusColor(item.statut) === 'success' ? 'success.main' :
                             getStatusColor(item.statut) === 'primary' ? 'primary.main' :
                             getStatusColor(item.statut) === 'error' ? 'error.main' : 'grey.400',
                    width: 40,
                    height: 40,
                  }}
                >
                  {getStatusIcon(item.statut)}
                </Avatar>
              )}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{item.etape}</Typography>
                <Chip
                  label={item.statut.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(item.statut)}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>
              <Typography variant="caption" color="textSecondary">
                {item.date_debut ? formatDate(item.date_debut) : 'Date non spécifiée'}
                {item.date_fin && ` - Fin: ${formatDate(item.date_fin)}`}
              </Typography>
            </StepLabel>
            <StepContent>
              <Paper elevation={2} sx={{ p: 2, mt: 1 }}>
                {item.description && (
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {item.description}
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={1}>
                  {item.service && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">
                        Service: <strong>{item.service}</strong>
                      </Typography>
                    </Grid>
                  )}
                  {item.medecin_responsable && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">
                        Médecin: <strong>{item.medecin_responsable}</strong>
                      </Typography>
                    </Grid>
                  )}
                  {item.date_prevue && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">
                        Date prévue: {formatDate(item.date_prevue)}
                      </Typography>
                    </Grid>
                  )}
                  {item.notes && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">
                        Notes: {item.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

