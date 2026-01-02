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
  Alert,
  Button
} from '@mui/material';
import { LocalHospital, Healing, FamilyRestroom } from '@mui/icons-material';
import { Patient } from '../../../services/supabase';
import { SpeechTextField } from '../../common/SpeechTextField';

interface Antecedent {
  nom: string;
  annee?: string;
  _id?: string; // ID unique pour la stabilité des clés
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
  const [familiaux, setFamiliaux] = useState<Array<{ id: string; value: string }>>([]);
  const [initialized, setInitialized] = useState(false);

  const stableAntecedentsString = (a: any) => {
    try {
      const medicauxS = Array.isArray(a?.medicaux)
        ? a.medicaux.map((x: any) => ({ nom: x?.nom || '', annee: x?.annee || '' }))
        : [];
      const chirurgS = Array.isArray(a?.chirurgicaux)
        ? a.chirurgicaux.map((x: any) => ({ nom: x?.nom || '', annee: x?.annee || '' }))
        : [];
      const familS = Array.isArray(a?.familiaux)
        ? a.familiaux.map((x: any) => (typeof x === 'string' ? x : x?.value || ''))
        : [];
      return JSON.stringify({ medicaux: medicauxS, chirurgicaux: chirurgS, familiaux: familS });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    // Éviter les re-initialisations multiples
    if (initialized) return;

    // Pré-remplir depuis le patient
    if (patient.antecedents_medicaux && medicaux.length === 0) {
      const lines = patient.antecedents_medicaux.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        setMedicaux(lines.map((line, idx) => ({ 
          nom: line, 
          annee: '',
          _id: `med-${idx}-${Date.now()}` 
        } as Antecedent & { _id?: string })));
      }
    }

    // Charger depuis antecedents si disponible
    if (antecedents) {
      if (antecedents.medicaux && Array.isArray(antecedents.medicaux) && antecedents.medicaux.length > 0) {
        setMedicaux(antecedents.medicaux.map((a: Antecedent, idx: number) => ({
          ...a,
          _id: (a as any)._id || `med-${idx}-${Date.now()}`
        })));
      }
      if (antecedents.chirurgicaux && Array.isArray(antecedents.chirurgicaux) && antecedents.chirurgicaux.length > 0) {
        setChirurgicaux(antecedents.chirurgicaux.map((a: Antecedent, idx: number) => ({
          ...a,
          _id: (a as any)._id || `chir-${idx}-${Date.now()}`
        })));
      }
      if (antecedents.familiaux && Array.isArray(antecedents.familiaux) && antecedents.familiaux.length > 0) {
        // Convertir les strings en objets avec ID
        setFamiliaux(antecedents.familiaux.map((f: string, idx: number) => ({
          id: `familial-${idx}-${Date.now()}`,
          value: f
        })));
      }
    }

    setInitialized(true);
  }, [patient, antecedents, initialized, medicaux.length]);

  useEffect(() => {
    const payload = {
      medicaux,
      chirurgicaux,
      familiaux: familiaux.map((f) => f.value),
    };

    // Guard anti-boucle: ne pas renvoyer au parent si rien n'a changé sur le fond
    const nextStr = stableAntecedentsString(payload);
    const prevStr = stableAntecedentsString(antecedents);
    if (nextStr !== prevStr) {
      // #region agent log (debug-session)
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'post-fix',hypothesisId:'LOOP',location:'WorkflowStep4Antecedents.tsx:save',message:'onAntecedentsChange emit',data:{med:medicaux.length,chir:chirurgicaux.length,fam:familiaux.length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log (debug-session)
      onAntecedentsChange(payload);
    }
  }, [medicaux, chirurgicaux, familiaux, onAntecedentsChange, antecedents]);

  const addAntecedent = (type: 'medicaux' | 'chirurgicaux') => {
    const newId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (type === 'medicaux') {
      setMedicaux([...medicaux, { nom: '', annee: '', _id: newId }]);
    } else {
      setChirurgicaux([...chirurgicaux, { nom: '', annee: '', _id: newId }]);
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
    const newId = `familial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setFamiliaux([...familiaux, { id: newId, value: '' }]);
  };

  const updateFamilial = (index: number, value: string) => {
    const updated = [...familiaux];
    updated[index] = { ...updated[index], value };
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
            {medicaux.map((antecedent, index) => {
              const uniqueKey = antecedent._id || `medicaux-${index}`;
              return (
                <Grid item xs={12} key={uniqueKey}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <SpeechTextField
                      fullWidth
                      label="Maladie"
                      value={antecedent.nom || ''}
                      onChange={(value) => updateAntecedent('medicaux', index, 'nom', value)}
                      placeholder="Ex: Diabète"
                      enableSpeech={true}
                      key={`${uniqueKey}-nom`}
                    />
                    <SpeechTextField
                      sx={{ width: 150 }}
                      label="Année"
                      value={antecedent.annee || ''}
                      onChange={(value) => updateAntecedent('medicaux', index, 'annee', value)}
                      placeholder="2020"
                      enableSpeech={false}
                      key={`${uniqueKey}-annee`}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 40, justifyContent: 'center' }}>
                      <Button
                        onClick={() => removeAntecedent('medicaux', index)}
                        sx={{ 
                          minWidth: 'auto', 
                          width: 36, 
                          height: 36,
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.light', color: 'error.dark' }
                        }}
                        size="small"
                      >
                        ✕
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
            <Grid item xs={12}>
              <Button
                onClick={() => addAntecedent('medicaux')}
                sx={{ 
                  color: 'primary.main', 
                  textTransform: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
                variant="text"
              >
                + Ajouter un antécédent médical
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="subtitle2" gutterBottom>
            4b. Antécédents Chirurgicaux
          </Typography>
          <Grid container spacing={2}>
            {chirurgicaux.map((antecedent, index) => {
              const uniqueKey = antecedent._id || `chirurgicaux-${index}`;
              return (
                <Grid item xs={12} key={uniqueKey}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <SpeechTextField
                      fullWidth
                      label="Intervention"
                      value={antecedent.nom || ''}
                      onChange={(value) => updateAntecedent('chirurgicaux', index, 'nom', value)}
                      placeholder="Ex: Appendicectomie"
                      enableSpeech={true}
                      key={`${uniqueKey}-nom`}
                    />
                    <SpeechTextField
                      sx={{ width: 150 }}
                      label="Année"
                      value={antecedent.annee || ''}
                      onChange={(value) => updateAntecedent('chirurgicaux', index, 'annee', value)}
                      placeholder="2020"
                      enableSpeech={false}
                      key={`${uniqueKey}-annee`}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 40, justifyContent: 'center' }}>
                      <Button
                        onClick={() => removeAntecedent('chirurgicaux', index)}
                        sx={{ 
                          minWidth: 'auto', 
                          width: 36, 
                          height: 36,
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.light', color: 'error.dark' }
                        }}
                        size="small"
                      >
                        ✕
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
            <Grid item xs={12}>
              <Button
                onClick={() => addAntecedent('chirurgicaux')}
                sx={{ 
                  color: 'primary.main', 
                  textTransform: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
                variant="text"
              >
                + Ajouter un antécédent chirurgical
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="subtitle2" gutterBottom>
            4c. Antécédents Familiaux
          </Typography>
          <Grid container spacing={2}>
            {familiaux.map((familial, index) => {
              return (
                <Grid item xs={12} key={familial.id}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <SpeechTextField
                      fullWidth
                      label="Antécédent familial"
                      value={familial.value || ''}
                      onChange={(value) => updateFamilial(index, value)}
                      placeholder="Ex: Père diabétique, Mère hypertendue"
                      enableSpeech={true}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 40, justifyContent: 'center' }}>
                      <Button
                        onClick={() => removeFamilial(index)}
                        sx={{ 
                          minWidth: 'auto', 
                          width: 36, 
                          height: 36,
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.light', color: 'error.dark' }
                        }}
                        size="small"
                      >
                        ✕
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
            <Grid item xs={12}>
              <Button
                onClick={addFamilial}
                sx={{ 
                  color: 'primary.main', 
                  textTransform: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
                variant="text"
              >
                + Ajouter un antécédent familial
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </CardContent>
    </Card>
  );
};

