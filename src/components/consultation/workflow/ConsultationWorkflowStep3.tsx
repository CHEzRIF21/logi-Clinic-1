import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Autocomplete,
  Chip,
  Alert,
  FormHelperText,
} from '@mui/material';
import { TagList, Tag } from '../TagList';

interface ConsultationWorkflowStep3Props {
  motifs: string[];
  onMotifsChange: (motifs: string[]) => void;
  required?: boolean;
}

export const ConsultationWorkflowStep3: React.FC<ConsultationWorkflowStep3Props> = ({
  motifs,
  onMotifsChange,
  required = true,
}) => {
  const [motifPrincipal, setMotifPrincipal] = useState('');
  const [symptomesAssocies, setSymptomesAssocies] = useState('');
  const [dureeSymptomes, setDureeSymptomes] = useState('');

  const motifsTags: Tag[] = motifs.map((motif, idx) => ({
    id: `motif-${idx}`,
    label: motif,
    color: 'primary',
  }));

  const handleMotifsChange = (tags: Tag[]) => {
    onMotifsChange(tags.map((t) => t.label));
  };

  const isValid = () => {
    if (!required) return true;
    return motifs.length > 0 && motifPrincipal.trim() !== '';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Étape 3 — Motif de Consultation {required && <span style={{ color: 'red' }}>*</span>}
        </Typography>

        {required && motifs.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Le motif de consultation est obligatoire avant de continuer
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Motif principal *"
            value={motifPrincipal}
            onChange={(e) => setMotifPrincipal(e.target.value)}
            required
            helperText="Décrivez le motif principal de la consultation"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Symptômes associés"
            value={symptomesAssocies}
            onChange={(e) => setSymptomesAssocies(e.target.value)}
            helperText="Listez les symptômes associés"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Durée / Début des symptômes"
            value={dureeSymptomes}
            onChange={(e) => setDureeSymptomes(e.target.value)}
            placeholder="Ex: Depuis 3 jours, Depuis 1 semaine..."
            helperText="Indiquez depuis quand les symptômes sont apparus"
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Motifs de consultation (tags)
          </Typography>
          <TagList
            tags={motifsTags}
            onTagsChange={handleMotifsChange}
            label=""
            placeholder="Ajouter un motif..."
            allowCreate={true}
            editable={true}
            color="primary"
          />
          <FormHelperText>
            Ajoutez les motifs en tags. Le motif principal doit être renseigné ci-dessus.
          </FormHelperText>
        </Box>
      </CardContent>
    </Card>
  );
};

