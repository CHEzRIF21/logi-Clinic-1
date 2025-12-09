import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  Person,
  Phone,
  CalendarToday,
  Badge,
  LocalHospital,
} from '@mui/icons-material';
import { Patient } from '../../services/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PatientHeaderProps {
  patient: Patient;
  consultationType?: string;
  consultationDate?: string;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  consultationType,
  consultationDate,
}) => {
  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = (nom: string, prenom: string): string => {
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  };

  const age = patient.date_naissance ? calculateAge(patient.date_naissance) : null;

  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          {/* Avatar */}
          <Grid item xs={12} sm="auto">
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 'bold',
              }}
            >
              {getInitials(patient.nom || '', patient.prenom || '')}
            </Avatar>
          </Grid>

          {/* Informations principales */}
          <Grid item xs={12} sm>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                {patient.prenom} {patient.nom}
              </Typography>
              {patient.sexe && (
                <Chip
                  label={patient.sexe === 'Masculin' ? 'Homme' : patient.sexe === 'Féminin' ? 'Femme' : 'Autre'}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    N° Dossier: <strong>{patient.identifiant || 'N/A'}</strong>
                  </Typography>
                </Box>
              </Grid>

              {age !== null && (
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {age} ans
                      {patient.date_naissance && (
                        <span> ({format(new Date(patient.date_naissance), 'dd/MM/yyyy', { locale: fr })})</span>
                      )}
                    </Typography>
                  </Box>
                </Grid>
              )}

              {patient.telephone && (
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {patient.telephone}
                    </Typography>
                  </Box>
                </Grid>
              )}

              {consultationType && (
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalHospital fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Type: <strong>{consultationType}</strong>
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>

            {consultationDate && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Consultation du {format(new Date(consultationDate), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

