import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, Divider } from '@mui/material';
import { Person, Phone, Email, CalendarToday, LocalHospital } from '@mui/icons-material';
import { Patient } from '../../../services/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConsultationWorkflowStep1Props {
  patient: Patient;
}

export const ConsultationWorkflowStep1: React.FC<ConsultationWorkflowStep1Props> = ({ patient }) => {
  if (!patient) {
    return (
      <Box>
        <Typography color="error">Aucun patient sélectionné</Typography>
      </Box>
    );
  }

  const calculateAge = (dateNaissance: string) => {
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Étape 1 — Accueil / Identification du Patient
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Person color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                {patient.nom} {patient.prenom}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              <strong>Identifiant:</strong> {patient.identifiant}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Sexe:</strong> {patient.sexe}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Âge:</strong> {patient.date_naissance ? calculateAge(patient.date_naissance) : 'N/A'} ans
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Date de naissance:</strong>{' '}
              {patient.date_naissance
                ? format(new Date(patient.date_naissance), 'dd/MM/yyyy', { locale: fr })
                : 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Phone color="primary" />
              <Typography variant="subtitle2">Contact</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              <strong>Téléphone:</strong> {patient.telephone || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Adresse:</strong> {patient.adresse || 'N/A'}
            </Typography>
          </Grid>

          {patient.allergies && (
            <Grid item xs={12}>
              <Box bgcolor="error.light" p={1.5} borderRadius={1}>
                <Typography variant="subtitle2" color="error.dark" fontWeight="bold">
                  ⚠️ Allergies connues
                </Typography>
                <Typography variant="body2">{patient.allergies}</Typography>
              </Box>
            </Grid>
          )}

          {patient.maladies_chroniques && (
            <Grid item xs={12}>
              <Box bgcolor="warning.light" p={1.5} borderRadius={1}>
                <Typography variant="subtitle2" color="warning.dark" fontWeight="bold">
                  Maladies chroniques
                </Typography>
                <Typography variant="body2">{patient.maladies_chroniques}</Typography>
              </Box>
            </Grid>
          )}

          {patient.antecedents_medicaux && (
            <Grid item xs={12}>
              <Box bgcolor="info.light" p={1.5} borderRadius={1}>
                <Typography variant="subtitle2" color="info.dark" fontWeight="bold">
                  Antécédents médicaux
                </Typography>
                <Typography variant="body2">{patient.antecedents_medicaux}</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

