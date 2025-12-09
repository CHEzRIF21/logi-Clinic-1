import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import {
  Search,
  Person,
  Phone,
  CalendarToday,
  FilterList,
  Clear,
  QrCode,
  Warning,
  LocalHospital,
  History,
  Add,
  Info,
} from '@mui/icons-material';
import { Patient } from '../../services/supabase';
import { PatientService } from '../../services/patientService';
import { ConsultationApiService } from '../../services/consultationApiService';
import { PatientInfoPanel } from './PatientInfoPanel';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PatientSearchAdvancedProps {
  onPatientSelect: (patient: Patient) => void;
  selectedPatient?: Patient | null;
}

export const PatientSearchAdvanced: React.FC<PatientSearchAdvancedProps> = ({
  onPatientSelect,
  selectedPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'nom' | 'dossier' | 'telephone'>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, filterType, filterService, filterStatut, patients]);

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PatientService.getAllPatients();
      setPatients(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des patients:', error);
      
      // Gérer les différents types d'erreurs
      let errorMessage = 'Erreur lors du chargement des patients';
      
      if (error?.message?.includes('Failed to fetch') || error?.code === '') {
        errorMessage = 'Impossible de se connecter à la base de données. Vérifiez votre connexion Internet et la configuration Supabase.';
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.hint) {
        errorMessage = `${error.message || 'Erreur de base de données'}: ${error.hint}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    // Filtre par type de recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((patient) => {
        switch (filterType) {
          case 'nom':
            return (
              patient.nom.toLowerCase().includes(query) ||
              patient.prenom.toLowerCase().includes(query)
            );
          case 'dossier':
            return patient.identifiant.toLowerCase().includes(query);
          case 'telephone':
            return patient.telephone?.toLowerCase().includes(query) || false;
          default:
            return (
              patient.nom.toLowerCase().includes(query) ||
              patient.prenom.toLowerCase().includes(query) ||
              patient.identifiant.toLowerCase().includes(query) ||
              patient.telephone?.toLowerCase().includes(query) ||
              false
            );
        }
      });
    }

    // Filtre par service
    if (filterService !== 'all') {
      filtered = filtered.filter((p) => p.service_initial === filterService);
    }

    // Filtre par statut
    if (filterStatut !== 'all') {
      filtered = filtered.filter((p) => p.statut === filterStatut);
    }

    setFilteredPatients(filtered.slice(0, 50)); // Limiter à 50 résultats
  };

  const calculateAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePatientClick = (patient: Patient) => {
    onPatientSelect(patient);
  };

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Search color="primary" />
            <Typography variant="h6">Recherche et Sélection du Patient</Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom, prénom, dossier ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  label="Type"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="nom">Nom/Prénom</MenuItem>
                  <MenuItem value="dossier">Dossier</MenuItem>
                  <MenuItem value="telephone">Téléphone</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Service</InputLabel>
                <Select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  label="Service"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="Médecine générale">Médecine générale</MenuItem>
                  <MenuItem value="Maternité">Maternité</MenuItem>
                  <MenuItem value="Pédiatrie">Pédiatrie</MenuItem>
                  <MenuItem value="Autres">Autres</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  label="Statut"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="Nouveau">Nouveau</MenuItem>
                  <MenuItem value="Connu">Connu</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {error && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="error" />
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            </Box>
          )}

          {selectedPatient && (
            <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', mb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedPatient.prenom} {selectedPatient.nom}
                    </Typography>
                    <Typography variant="body2">
                      Dossier: {selectedPatient.identifiant} | {calculateAge(selectedPatient.date_naissance)} ans |{' '}
                      {selectedPatient.sexe}
                    </Typography>
                  </Box>
                </Box>
                <Chip label="Patient sélectionné" color="success" />
              </Box>
            </Paper>
          )}
        </CardContent>
      </Card>

      {selectedPatient ? (
        <PatientInfoPanel patient={selectedPatient} />
      ) : (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Résultats de recherche ({filteredPatients.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Typography variant="body2" color="text.secondary">
                Chargement...
              </Typography>
            ) : filteredPatients.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucun patient trouvé. Essayez de modifier vos critères de recherche.
              </Typography>
            ) : (
              <List>
                {filteredPatients.map((patient) => (
                  <ListItem key={patient.id} disablePadding>
                    <ListItemButton 
                      onClick={() => handlePatientClick(patient)}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(22, 163, 74, 0.08)'
                            : 'rgba(22, 163, 74, 0.04)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: patient.sexe === 'Masculin' ? 'primary.main' : 'secondary.main' }}>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${patient.prenom} ${patient.nom}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              Dossier: {patient.identifiant} | {calculateAge(patient.date_naissance)} ans |{' '}
                              {patient.sexe}
                            </Typography>
                            <br />
                            {patient.telephone && (
                              <Box display="flex" alignItems="center" gap={0.5} component="span">
                                <Phone fontSize="small" />
                                <Typography variant="caption" component="span">
                                  {patient.telephone}
                                </Typography>
                              </Box>
                            )}
                            {patient.service_initial && (
                              <Chip
                                label={patient.service_initial}
                                size="small"
                                sx={{ ml: 1, mt: 0.5 }}
                                color={patient.statut === 'Nouveau' ? 'warning' : 'default'}
                              />
                            )}
                            {patient.allergies && patient.allergies.trim().length > 0 && (
                              <Chip
                                icon={<Warning />}
                                label="Allergies"
                                size="small"
                                color="error"
                                sx={{ ml: 1, mt: 0.5 }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

