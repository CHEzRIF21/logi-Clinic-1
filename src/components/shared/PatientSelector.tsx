import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Person,
  Add,
  Close,
} from '@mui/icons-material';
import { PatientService } from '../../services/patientService';
import { Patient } from '../../services/supabase';

interface PatientSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (patient: Patient) => void;
  title?: string;
  filterBySexe?: 'Masculin' | 'Féminin' | null; // null = tous les patients
  filterByService?: string; // Service initial pour filtrer
  allowCreate?: boolean; // Permet de créer un nouveau patient
  onCreateNew?: () => void; // Callback pour créer un nouveau patient
}

const PatientSelector: React.FC<PatientSelectorProps> = ({
  open,
  onClose,
  onSelect,
  title = 'Sélectionner un patient',
  filterBySexe = null,
  filterByService,
  allowCreate = false,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (open) {
      loadPatients();
      setSearchQuery('');
      setSelectedPatient(null);
    }
  }, [open, filterByService]);

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Patient[];
      
      if (filterByService) {
        data = await PatientService.getPatientsByService(filterByService);
      } else {
        data = await PatientService.getAllPatients();
      }

      // Filtrer par sexe si nécessaire
      if (filterBySexe) {
        data = data.filter(p => p.sexe === filterBySexe);
      }

      setPatients(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPatients();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await PatientService.searchPatients(searchQuery);
      
      // Appliquer les filtres
      let filtered = results;
      if (filterBySexe) {
        filtered = filtered.filter(p => p.sexe === filterBySexe);
      }
      if (filterByService) {
        filtered = filtered.filter(p => p.service_initial === filterByService);
      }

      setPatients(filtered);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleConfirm = () => {
    if (selectedPatient) {
      onSelect(selectedPatient);
      setSelectedPatient(null);
      setSearchQuery('');
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person />
            <Typography variant="h6">{title}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Rechercher par nom, prénom ou identifiant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
          >
            Rechercher
          </Button>
          {allowCreate && onCreateNew && (
            <Button
              variant="outlined"
              onClick={handleCreateNew}
              startIcon={<Add />}
            >
              Nouveau Patient
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Identifiant</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Prénom</TableCell>
                <TableCell>Date de naissance</TableCell>
                <TableCell>Sexe</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Aucun patient trouvé
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    hover
                    selected={selectedPatient?.id === patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Chip label={patient.identifiant} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>{patient.nom}</TableCell>
                    <TableCell>{patient.prenom}</TableCell>
                    <TableCell>
                      {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={patient.sexe}
                        size="small"
                        color={patient.sexe === 'Masculin' ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{patient.telephone || '-'}</TableCell>
                    <TableCell>
                      <Chip label={patient.service_initial || 'N/A'} size="small" />
                    </TableCell>
                    <TableCell>
                      {selectedPatient?.id === patient.id && (
                        <CheckCircle color="primary" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {selectedPatient && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Patient sélectionné:</strong> {selectedPatient.prenom} {selectedPatient.nom} ({selectedPatient.identifiant})
              {selectedPatient.telephone && ` - Tél: ${selectedPatient.telephone}`}
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!selectedPatient}
          startIcon={<CheckCircle />}
        >
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PatientSelector;

