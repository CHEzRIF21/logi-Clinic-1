import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Divider
} from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { Consultation } from '../../../services/consultationService';
import { SpeechTextField } from '../../common/SpeechTextField';

interface WorkflowStep1MotifProps {
  consultation: Consultation;
  onMotifChange: (motif: string, categorie: string) => void;
  required?: boolean;
}

const CATEGORIES = [
  { value: 'Routine', label: 'Routine' },
  { value: 'Urgence', label: 'Urgence' },
  { value: 'Suivi', label: 'Suivi' },
  { value: 'Certificat', label: 'Certificat' }
];

export const WorkflowStep1Motif: React.FC<WorkflowStep1MotifProps> = ({
  consultation,
  onMotifChange,
  required = true
}) => {
  const [motif, setMotif] = useState<string>(
    consultation.motifs && consultation.motifs.length > 0 ? consultation.motifs[0] : ''
  );
  const [categorie, setCategorie] = useState<string>(
    (consultation as any).categorie_motif || ''
  );
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (motif && categorie) {
      onMotifChange(motif, categorie);
      setError('');
    }
  }, [motif, categorie, onMotifChange]);

  const handleMotifChange = (value: string) => {
    setMotif(value);
    if (required && !value.trim()) {
      setError('Le motif de consultation est obligatoire');
    } else {
      setError('');
    }
  };

  const handleCategorieChange = (value: string) => {
    setCategorie(value);
    if (required && !value) {
      setError('La catégorie est obligatoire');
    } else {
      setError('');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Assignment color="primary" />
          <Typography variant="h6">
            Étape 1 — Motif de Consultation
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth required={required}>
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={categorie}
              onChange={(e) => handleCategorieChange(e.target.value)}
              label="Catégorie"
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <SpeechTextField
            fullWidth
            label="Motif de consultation"
            placeholder="Ex: Fièvre et toux depuis 3 jours"
            value={motif}
            onChange={handleMotifChange}
            required={required}
            multiline
            rows={3}
            error={!!error && !motif.trim()}
            helperText={error && !motif.trim() ? error : 'Décrivez brièvement le motif de consultation'}
            enableSpeech={true}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

