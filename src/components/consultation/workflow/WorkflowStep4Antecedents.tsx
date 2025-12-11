import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import { LocalHospital, Healing, FamilyRestroom } from '@mui/icons-material';
import { Patient } from '../../../services/supabase';
import { SpeechTextField } from '../../common/SpeechTextField';

interface Antecedent {
  nom: string;
  annee?: string;
}

interface WorkflowStep4AntecedentsProps {
  patient: Patient;
  antecedents: any;
  onAntecedentsChange: (antecedents: any) => void;
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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const WorkflowStep4Antecedents: React.FC<WorkflowStep4AntecedentsProps> = ({
  patient,
  antecedents,
  onAntecedentsChange
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [medicaux, setMedicaux] = useState<Antecedent[]>([]);
  const [chirurgicaux, setChirurgicaux] = useState<Antecedent[]>([]);
  const [familiaux, setFamiliaux] = useState<string[]>([]);

  useEffect(() => {
    // Pré-remplir depuis le patient
    if (patient.antecedents_medicaux) {
      const lines = patient.antecedents_medicaux.split('\n').filter(l => l.trim());
      setMedicaux(lines.map(line => ({ nom: line, annee: '' })));
    }

    // Charger depuis antecedents si disponible
    if (antecedents) {
      if (antecedents.medicaux) setMedicaux(antecedents.medicaux);
      if (antecedents.chirurgicaux) setChirurgicaux(antecedents.chirurgicaux);
      if (antecedents.familiaux) setFamiliaux(antecedents.familiaux);
    }
  }, [patient, antecedents]);

  useEffect(() => {
    onAntecedentsChange({
      medicaux,
      chirurgicaux,
      familiaux
    });
  }, [medicaux, chirurgicaux, familiaux, onAntecedentsChange]);

  const addAntecedent = (type: 'medicaux' | 'chirurgicaux') => {
    if (type === 'medicaux') {
      setMedicaux([...medicaux, { nom: '', annee: '' }]);
    } else {
      setChirurgicaux([...chirurgicaux, { nom: '', annee: '' }]);
    }
  };

  const updateAntecedent = (type: 'medicaux' | 'chirurgicaux', index: number, field: string, value: string) => {
    if (type === 'medicaux') {
      const updated = [...medicaux];
      updated[index] = { ...updated[index], [field]: value };
      setMedicaux(updated);
    } else {
      const updated = [...chirurgicaux];
      updated[index] = { ...updated[index], [field]: value };
      setChirurgicaux(updated);
    }
  };

  const removeAntecedent = (type: 'medicaux' | 'chirurgicaux', index: number) => {
    if (type === 'medicaux') {
      setMedicaux(medicaux.filter((_, i) => i !== index));
    } else {
      setChirurgicaux(chirurgicaux.filter((_, i) => i !== index));
    }
  };

  const addFamilial = () => {
    setFamiliaux([...familiaux, '']);
  };

  const updateFamilial = (index: number, value: string) => {
    const updated = [...familiaux];
    updated[index] = value;
    setFamiliaux(updated);
  };

  const removeFamilial = (index: number) => {
    setFamiliaux(familiaux.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <LocalHospital color="primary" />
          <Typography variant="h6">
            Étape 4 — Antécédents (Background du patient)
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          Les antécédents sont pré-remplis depuis le dossier patient mais peuvent être modifiés pendant la consultation.
        </Alert>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab icon={<LocalHospital />} iconPosition="start" label="Médicaux" />
            <Tab icon={<Healing />} iconPosition="start" label="Chirurgicaux" />
            <Tab icon={<FamilyRestroom />} iconPosition="start" label="Familiaux" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="subtitle2" gutterBottom>
            4a. Antécédents Personnels Médicaux
          </Typography>
          <Grid container spacing={2}>
            {medicaux.map((antecedent, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <SpeechTextField
                    fullWidth
                    label="Maladie"
                    value={antecedent.nom}
                    onChange={(value) => updateAntecedent('medicaux', index, 'nom', value)}
                    placeholder="Ex: Diabète"
                    enableSpeech={true}
                  />
                  <SpeechTextField
                    sx={{ width: 150 }}
                    label="Année"
                    value={antecedent.annee}
                    onChange={(value) => updateAntecedent('medicaux', index, 'annee', value)}
                    placeholder="2020"
                    enableSpeech={false}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                      onClick={() => removeAntecedent('medicaux', index)}
                      sx={{ cursor: 'pointer', color: 'error.main' }}
                    >
                      ✕
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Typography
                onClick={() => addAntecedent('medicaux')}
                sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
              >
                + Ajouter un antécédent médical
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="subtitle2" gutterBottom>
            4b. Antécédents Chirurgicaux
          </Typography>
          <Grid container spacing={2}>
            {chirurgicaux.map((antecedent, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <SpeechTextField
                    fullWidth
                    label="Intervention"
                    value={antecedent.nom}
                    onChange={(value) => updateAntecedent('chirurgicaux', index, 'nom', value)}
                    placeholder="Ex: Appendicectomie"
                    enableSpeech={true}
                  />
                  <SpeechTextField
                    sx={{ width: 150 }}
                    label="Année"
                    value={antecedent.annee}
                    onChange={(value) => updateAntecedent('chirurgicaux', index, 'annee', value)}
                    placeholder="2020"
                    enableSpeech={false}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                      onClick={() => removeAntecedent('chirurgicaux', index)}
                      sx={{ cursor: 'pointer', color: 'error.main' }}
                    >
                      ✕
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Typography
                onClick={() => addAntecedent('chirurgicaux')}
                sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
              >
                + Ajouter un antécédent chirurgical
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="subtitle2" gutterBottom>
            4c. Antécédents Familiaux
          </Typography>
          <Grid container spacing={2}>
            {familiaux.map((familial, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <SpeechTextField
                    fullWidth
                    label="Antécédent familial"
                    value={familial}
                    onChange={(value) => updateFamilial(index, value)}
                    placeholder="Ex: Père diabétique, Mère hypertendue"
                    enableSpeech={true}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                      onClick={() => removeFamilial(index)}
                      sx={{ cursor: 'pointer', color: 'error.main' }}
                    >
                      ✕
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Typography
                onClick={addFamilial}
                sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
              >
                + Ajouter un antécédent familial
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
      </CardContent>
    </Card>
  );
};

