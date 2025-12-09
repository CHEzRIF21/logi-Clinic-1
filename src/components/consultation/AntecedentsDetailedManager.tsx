import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Add,
  Edit,
  CheckCircle,
  Warning,
  LocalHospital,
  History,
  PregnantWoman,
  Medication,
} from '@mui/icons-material';
import { Patient } from '../../services/supabase';

interface AntecedentsDetailedManagerProps {
  patient: Patient;
  onUpdate: (antecedents: Partial<Patient>) => Promise<void>;
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
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const AntecedentsDetailedManager: React.FC<AntecedentsDetailedManagerProps> = ({
  patient,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editField, setEditField] = useState<string>('');
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);

  const antecedentsFields = [
    {
      key: 'antecedents_medicaux',
      label: 'Antécédents Médicaux',
      icon: <LocalHospital />,
      placeholder: 'Maladies chroniques, pathologies antérieures...',
      value: patient.antecedents_medicaux || '',
    },
    {
      key: 'antecedents_chirurgicaux',
      label: 'Antécédents Chirurgicaux',
      icon: <LocalHospital />,
      placeholder: 'Interventions chirurgicales, dates...',
      value: (patient as any).antecedents_chirurgicaux || '',
    },
    {
      key: 'antecedents_gyneco',
      label: 'Antécédents Gynéco-Obstétricaux',
      icon: <PregnantWoman />,
      placeholder: 'Grossesses, accouchements, fausses couches...',
      value: (patient as any).antecedents_gyneco || '',
      showOnlyIf: patient.sexe === 'Féminin',
    },
    {
      key: 'allergies',
      label: 'Allergies',
      icon: <Warning />,
      placeholder: 'Médicaments, aliments, autres...',
      value: patient.allergies || '',
    },
    {
      key: 'medicaments_reguliers',
      label: 'Traitements Habituels',
      icon: <Medication />,
      placeholder: 'Médicaments pris régulièrement...',
      value: patient.medicaments_reguliers || '',
    },
  ].filter((field) => !field.showOnlyIf || field.showOnlyIf === true);

  const handleEdit = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate({ [editField]: editValue });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const hasData = antecedentsFields.some((field) => field.value.trim());

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Antécédents du Patient</Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => {
                const emptyField = antecedentsFields.find((f) => !f.value.trim());
                if (emptyField) {
                  handleEdit(emptyField.key, '');
                } else {
                  handleEdit('antecedents_medicaux', patient.antecedents_medicaux || '');
                }
              }}
            >
              Ajouter
            </Button>
          </Box>

          {!hasData && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Aucune donnée disponible. Veuillez ajouter les antécédents du patient.
            </Alert>
          )}

          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            {antecedentsFields.map((field, index) => (
              <Tab key={field.key} label={field.label} icon={field.icon} iconPosition="start" />
            ))}
          </Tabs>

          {antecedentsFields.map((field, index) => (
            <TabPanel key={field.key} value={activeTab} index={index}>
              <AntecedentsSection
                field={field}
                onEdit={handleEdit}
                patient={patient}
              />
            </TabPanel>
          ))}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editField && antecedentsFields.find((f) => f.key === editField)?.label}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={
              editField && antecedentsFields.find((f) => f.key === editField)?.placeholder
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

interface AntecedentsSectionProps {
  field: {
    key: string;
    label: string;
    icon: React.ReactNode;
    placeholder: string;
    value: string;
  };
  onEdit: (field: string, value: string) => void;
  patient: Patient;
}

const AntecedentsSection: React.FC<AntecedentsSectionProps> = ({ field, onEdit, patient }) => {
  const hasValue = field.value.trim().length > 0;

  return (
    <Box>
      {hasValue ? (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            {field.icon}
            <Typography variant="subtitle1">{field.label}</Typography>
            <Chip icon={<CheckCircle />} label="Rempli" size="small" color="success" />
          </Box>
          <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {field.value}
            </Typography>
          </Paper>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => onEdit(field.key, field.value)}
          >
            Modifier
          </Button>
        </Box>
      ) : (
        <Alert severity="info">
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography>Aucune donnée disponible pour {field.label.toLowerCase()}</Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<Add />}
              onClick={() => onEdit(field.key, '')}
            >
              Ajouter
            </Button>
          </Box>
        </Alert>
      )}
    </Box>
  );
};

