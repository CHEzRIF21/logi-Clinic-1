import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  Grid,
  Button,
} from '@mui/material';
import { Edit, Save } from '@mui/icons-material';
import { Patient } from '../../../services/supabase';
import { PatientService } from '../../../services/patientService';

interface ConsultationWorkflowStep4Props {
  patient: Patient;
  onAntecedentsUpdate: (antecedents: any) => void;
}

export const ConsultationWorkflowStep4: React.FC<ConsultationWorkflowStep4Props> = ({
  patient,
  onAntecedentsUpdate,
}) => {
  const [editing, setEditing] = useState(false);
  const [antecedents, setAntecedents] = useState({
    antecedents_medicaux: patient.antecedents_medicaux || '',
    antecedents_chirurgicaux: '',
    antecedents_gyneco: '',
    allergies: patient.allergies || '',
    traitements_habituels: patient.medicaments_reguliers || '',
  });

  const handleSave = async () => {
    try {
      // Mettre à jour le patient
      await PatientService.updatePatient(patient.id, {
        antecedents_medicaux: antecedents.antecedents_medicaux,
        allergies: antecedents.allergies,
        medicaments_reguliers: antecedents.traitements_habituels,
      });

      onAntecedentsUpdate(antecedents);
      setEditing(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Étape 4 — Antécédents Médicaux (Mise à jour rapide)
          </Typography>
          {!editing ? (
            <Button startIcon={<Edit />} onClick={() => setEditing(true)} size="small">
              Modifier
            </Button>
          ) : (
            <Button startIcon={<Save />} onClick={handleSave} size="small" variant="contained">
              Enregistrer
            </Button>
          )}
        </Box>

        {!editing && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Les informations affichées proviennent du dossier patient. Cliquez sur "Modifier" pour les mettre à jour.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Antécédents médicaux"
              value={antecedents.antecedents_medicaux}
              onChange={(e) =>
                setAntecedents({ ...antecedents, antecedents_medicaux: e.target.value })
              }
              disabled={!editing}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Antécédents chirurgicaux"
              value={antecedents.antecedents_chirurgicaux}
              onChange={(e) =>
                setAntecedents({ ...antecedents, antecedents_chirurgicaux: e.target.value })
              }
              disabled={!editing}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Antécédents gynéco-obstétricaux"
              value={antecedents.antecedents_gyneco}
              onChange={(e) =>
                setAntecedents({ ...antecedents, antecedents_gyneco: e.target.value })
              }
              disabled={!editing}
            />
          </Grid>

          <Grid item xs={12}>
            <Box bgcolor="error.light" p={1.5} borderRadius={1}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Allergies *"
                value={antecedents.allergies}
                onChange={(e) => setAntecedents({ ...antecedents, allergies: e.target.value })}
                disabled={!editing}
                required
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Traitements habituels"
              value={antecedents.traitements_habituels}
              onChange={(e) =>
                setAntecedents({ ...antecedents, traitements_habituels: e.target.value })
              }
              disabled={!editing}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

