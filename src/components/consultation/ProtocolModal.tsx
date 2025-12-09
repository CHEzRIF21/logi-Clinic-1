import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Delete,
  Schedule,
  Medication,
  LocalHospital,
  MedicalServices,
} from '@mui/icons-material';
import { Protocol, ProtocolItem, ProtocolSchedule } from '../../services/consultationApiService';

interface ProtocolModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (protocol: Partial<Protocol>) => Promise<void>;
  consultationId: string;
  patientId: string;
}

const ADMISSION_TYPES = [
  { value: 'SOINS_DOMICILE', label: 'Soins à domicile' },
  { value: 'AMBULATOIRE', label: 'Ambulatoire' },
  { value: 'OBSERVATION', label: 'Observation' },
  { value: 'HOSPITALISATION', label: 'Hospitalisation' },
];

const ITEM_TYPES = [
  { value: 'medicament', label: 'Médicament', icon: <Medication /> },
  { value: 'consommable', label: 'Consommable', icon: <MedicalServices /> },
  { value: 'acte', label: 'Acte', icon: <LocalHospital /> },
];

export const ProtocolModal: React.FC<ProtocolModalProps> = ({
  open,
  onClose,
  onSave,
  consultationId,
  patientId,
}) => {
  const [admissionType, setAdmissionType] = useState<Protocol['admission_type']>('AMBULATOIRE');
  const [items, setItems] = useState<ProtocolItem[]>([]);
  const [instructions, setInstructions] = useState('');
  const [horaires, setHoraires] = useState<ProtocolSchedule[]>([]);
  const [facturable, setFacturable] = useState(false);

  const [newItem, setNewItem] = useState<Partial<ProtocolItem>>({
    type: 'medicament',
    nom: '',
    quantite: 1,
  });

  const [newHoraire, setNewHoraire] = useState<Partial<ProtocolSchedule>>({
    heure: '',
    dosage: '',
    repetition: '',
  });

  const handleAddItem = () => {
    if (newItem.nom && newItem.quantite) {
      setItems([...items, newItem as ProtocolItem]);
      setNewItem({ type: 'medicament', nom: '', quantite: 1 });
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddHoraire = () => {
    if (newHoraire.heure) {
      setHoraires([...horaires, newHoraire as ProtocolSchedule]);
      setNewHoraire({ heure: '', dosage: '', repetition: '' });
    }
  };

  const handleRemoveHoraire = (index: number) => {
    setHoraires(horaires.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const protocol = {
      consultation_id: consultationId,
      patient_id: patientId,
      admission_type: admissionType,
      items,
      instructions,
      horaires,
      facturable,
    };
    
    await onSave(protocol);
    
    // Si facturable, créer les opérations facturables
    if (facturable && items.length > 0) {
      try {
        const { ConsultationService } = await import('../../services/consultationService');
        // Note: L'ID du protocole sera disponible après la sauvegarde
        // Cette partie sera gérée dans la page principale après la création du protocole
      } catch (error) {
        console.error('Erreur lors de la création des opérations facturables:', error);
      }
    }
    
    handleClose();
  };

  const handleClose = () => {
    setItems([]);
    setHoraires([]);
    setInstructions('');
    setFacturable(false);
    setAdmissionType('AMBULATOIRE');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <MedicalServices />
          <Typography variant="h6">Protocole de Soins</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Type d'admission */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Type d'admission</InputLabel>
              <Select
                value={admissionType}
                onChange={(e) => setAdmissionType(e.target.value as Protocol['admission_type'])}
                label="Type d'admission"
              >
                {ADMISSION_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Items (médicaments, consommables, actes) */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Médicaments / Consommables / Actes
            </Typography>
            <Box display="flex" gap={1} mb={2}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                  label="Type"
                >
                  {ITEM_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Nom"
                value={newItem.nom}
                onChange={(e) => setNewItem({ ...newItem, nom: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Quantité"
                type="number"
                value={newItem.quantite}
                onChange={(e) => setNewItem({ ...newItem, quantite: parseInt(e.target.value) || 1 })}
                sx={{ width: 100 }}
              />
              {newItem.type === 'medicament' && (
                <TextField
                  size="small"
                  label="Mode admin."
                  value={newItem.mode_administration || ''}
                  onChange={(e) => setNewItem({ ...newItem, mode_administration: e.target.value })}
                  sx={{ width: 150 }}
                />
              )}
              {newItem.type === 'acte' && (
                <TextField
                  size="small"
                  label="Nb fois"
                  type="number"
                  value={newItem.nombre_fois || ''}
                  onChange={(e) =>
                    setNewItem({ ...newItem, nombre_fois: parseInt(e.target.value) || 1 })
                  }
                  sx={{ width: 100 }}
                />
              )}
              <Button variant="outlined" startIcon={<Add />} onClick={handleAddItem}>
                Ajouter
              </Button>
            </Box>

            <List>
              {items.map((item, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        {ITEM_TYPES.find((t) => t.value === item.type)?.icon}
                        <Typography variant="body1">{item.nom}</Typography>
                        <Chip label={`Qté: ${item.quantite}`} size="small" />
                        {item.mode_administration && (
                          <Chip label={item.mode_administration} size="small" variant="outlined" />
                        )}
                        {item.nombre_fois && (
                          <Chip label={`${item.nombre_fois}x`} size="small" variant="outlined" />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleRemoveItem(index)} color="error">
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Horaires */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Protocole à suivre (Horaires)
            </Typography>
            <Box display="flex" gap={1} mb={2}>
              <TextField
                size="small"
                label="Heure (HH:mm)"
                value={newHoraire.heure}
                onChange={(e) => setNewHoraire({ ...newHoraire, heure: e.target.value })}
                placeholder="08:00"
                sx={{ width: 120 }}
              />
              <TextField
                size="small"
                label="Dosage"
                value={newHoraire.dosage}
                onChange={(e) => setNewHoraire({ ...newHoraire, dosage: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Répétition"
                value={newHoraire.repetition}
                onChange={(e) => setNewHoraire({ ...newHoraire, repetition: e.target.value })}
                placeholder="Toutes les 8h"
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" startIcon={<Schedule />} onClick={handleAddHoraire}>
                Ajouter
              </Button>
            </Box>

            <List>
              {horaires.map((horaire, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={2}>
                        <Chip label={horaire.heure} color="primary" />
                        {horaire.dosage && <Typography>{horaire.dosage}</Typography>}
                        {horaire.repetition && (
                          <Typography variant="body2" color="text.secondary">
                            {horaire.repetition}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleRemoveHoraire(index)} color="error">
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Instructions */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instructions de suivi du protocole..."
            />
          </Grid>

          {/* Facturable */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={facturable}
                  onChange={(e) => setFacturable(e.target.checked)}
                />
              }
              label="Créer une opération facturable depuis ce protocole"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        <Button variant="contained" onClick={handleSave}>
          Sauvegarder
        </Button>
      </DialogActions>
    </Dialog>
  );
};

