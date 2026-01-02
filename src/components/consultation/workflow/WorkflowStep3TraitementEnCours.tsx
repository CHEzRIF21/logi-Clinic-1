import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add, Delete, Edit, Download } from '@mui/icons-material';
import { Patient } from '../../../services/supabase';

interface Medicament {
  id?: string;
  nom: string;
  dosage: string;
  frequence: string;
}

interface WorkflowStep3TraitementEnCoursProps {
  patient: Patient;
  traitementEnCours: string;
  onTraitementChange: (traitement: string) => void;
}

export const WorkflowStep3TraitementEnCours: React.FC<WorkflowStep3TraitementEnCoursProps> = ({
  patient,
  traitementEnCours,
  onTraitementChange
}) => {
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Medicament>({ nom: '', dosage: '', frequence: '' });

  const safeParseArray = (raw: string): Medicament[] | null => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Medicament[]) : null;
    } catch {
      return null;
    }
  };

  const stableMedicamentsString = (list: Medicament[]) =>
    JSON.stringify(
      (list || []).map((m) => ({
        id: m?.id,
        nom: m?.nom || '',
        dosage: m?.dosage || '',
        frequence: m?.frequence || '',
      }))
    );

  useEffect(() => {
    // Source de vérité: si `traitementEnCours` est un JSON, il prime.
    // Sinon on tente un import depuis `patient.medicaments_reguliers`.
    const fromTraitement = traitementEnCours ? safeParseArray(traitementEnCours) : null;
    let next: Medicament[] | null = fromTraitement;

    if (!next && patient.medicaments_reguliers) {
      const fromPatientJson = safeParseArray(patient.medicaments_reguliers);
      if (fromPatientJson) {
        next = fromPatientJson;
      } else {
        // Si ce n'est pas du JSON, traiter comme texte
        const lines = patient.medicaments_reguliers.split('\n').filter((l) => l.trim());
        next = lines.map((line) => {
          const parts = line.split(' - ');
          return {
            nom: parts[0] || '',
            dosage: parts[1] || '',
            frequence: parts[2] || '',
          };
        });
      }
    }

    if (next) {
      const currentStr = stableMedicamentsString(medicaments);
      const nextStr = stableMedicamentsString(next);
      if (currentStr !== nextStr) {
        setMedicaments(next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id, patient?.medicaments_reguliers, traitementEnCours]);

  useEffect(() => {
    // Sauvegarder les médicaments
    const traitementText = stableMedicamentsString(medicaments);
    // Guard anti-boucle: ne pas renvoyer la même valeur au parent
    if (traitementText !== (traitementEnCours || '')) {
      // #region agent log (debug-session)
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'post-fix',hypothesisId:'LOOP',location:'WorkflowStep3TraitementEnCours.tsx:save',message:'onTraitementChange emit',data:{len:medicaments.length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log (debug-session)
      onTraitementChange(traitementText);
    }
  }, [medicaments, onTraitementChange, traitementEnCours]);

  const handleAdd = () => {
    setFormData({ nom: '', dosage: '', frequence: '' });
    setEditingIndex(null);
    setDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setFormData(medicaments[index]);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    const newMedicaments = medicaments.filter((_, i) => i !== index);
    setMedicaments(newMedicaments);
  };

  const handleSave = () => {
    if (!formData.nom.trim()) return;

    if (editingIndex !== null) {
      const newMedicaments = [...medicaments];
      newMedicaments[editingIndex] = formData;
      setMedicaments(newMedicaments);
    } else {
      setMedicaments([...medicaments, { ...formData, id: Date.now().toString() }]);
    }

    setDialogOpen(false);
    setFormData({ nom: '', dosage: '', frequence: '' });
    setEditingIndex(null);
  };

  const handleImportFromPatient = () => {
    if (patient.medicaments_reguliers) {
      const lines = patient.medicaments_reguliers.split('\n').filter(l => l.trim());
      const imported = lines.map(line => {
        const parts = line.split(' - ');
        return {
          nom: parts[0] || '',
          dosage: parts[1] || '',
          frequence: parts[2] || ''
        };
      });
      setMedicaments([...medicaments, ...imported]);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Typography variant="h6">
            Étape 3 — Traitement en Cours
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          Liste des médicaments que le patient prend actuellement. Les médicaments du dossier patient peuvent être importés automatiquement.
        </Alert>

        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
          >
            Ajouter un médicament
          </Button>
          {patient.medicaments_reguliers && (
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleImportFromPatient}
            >
              Importer depuis le dossier patient
            </Button>
          )}
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Médicament</TableCell>
                <TableCell>Dosage</TableCell>
                <TableCell>Fréquence</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medicaments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary">
                      Aucun médicament enregistré
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                medicaments.map((med, index) => (
                  <TableRow key={med.id || index}>
                    <TableCell>{med.nom}</TableCell>
                    <TableCell>{med.dosage}</TableCell>
                    <TableCell>{med.frequence}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEdit(index)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(index)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingIndex !== null ? 'Modifier le médicament' : 'Ajouter un médicament'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                fullWidth
                label="Nom du médicament"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="Ex: 500mg"
              />
              <TextField
                fullWidth
                label="Fréquence"
                value={formData.frequence}
                onChange={(e) => setFormData({ ...formData, frequence: e.target.value })}
                placeholder="Ex: Matin, Midi, Soir"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} variant="contained" disabled={!formData.nom.trim()}>
              {editingIndex !== null ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

