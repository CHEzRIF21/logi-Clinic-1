import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Typography,
  Avatar,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Refresh,
  Person,
  MedicalServices,
  Phone,
  LocationOn,
  Bloodtype,
  Info,
  Receipt,
} from '@mui/icons-material';
import { usePatients } from '../../hooks/usePatients';
import { Patient } from '../../services/supabase';
import { QuickActesFacturablesDialog } from './QuickActesFacturablesDialog';

interface PatientsTableProps {
  onEditPatient: (patient: Patient) => void;
  onViewPatient: (patient: Patient) => void;
  onDeletePatient: (patient: Patient) => void;
}

export const PatientsTable: React.FC<PatientsTableProps> = ({
  onEditPatient,
  onViewPatient,
  onDeletePatient,
}) => {
  const {
    patients,
    loading,
    error,
    stats,
    searchPatients,
    filterByService,
    filterByStatus,
    loadPatients,
    clearError,
  } = usePatients();

  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [openActesDialog, setOpenActesDialog] = useState(false);
  const [selectedPatientForActes, setSelectedPatientForActes] = useState<Patient | null>(null);

  // Gérer la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchPatients(query);
  };

  // Gérer le filtrage par service
  const handleServiceFilter = (service: string) => {
    setServiceFilter(service);
    filterByService(service);
  };

  // Gérer le filtrage par statut
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterByStatus(status);
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Calculer l'âge
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

  // Obtenir la couleur du groupe sanguin
  const getBloodTypeColor = (bloodType: string) => {
    switch (bloodType) {
      case 'A': return 'error';
      case 'B': return 'warning';
      case 'AB': return 'info';
      case 'O': return 'success';
      default: return 'default';
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    return status === 'Nouveau' ? 'warning' : 'success';
  };

  // Gérer l'ouverture du dialog d'actes facturables
  const handleOpenActesDialog = (patient: Patient) => {
    setSelectedPatientForActes(patient);
    setOpenActesDialog(true);
  };

  // Gérer la fermeture du dialog
  const handleCloseActesDialog = () => {
    setOpenActesDialog(false);
    setSelectedPatientForActes(null);
  };

  // Gérer le succès de la création d'actes
  const handleActesSuccess = () => {
    // Recharger les patients si nécessaire
    loadPatients();
  };

  if (loading && patients.length === 0) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="h6" align="center" sx={{ mt: 2 }}>
          Chargement des patients...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Affichage des erreurs */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistiques */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Patients
                </Typography>
                <Typography variant="h4">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Nouveaux
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.parStatut.nouveau}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Masculin
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.parSexe.masculin}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Féminin
                </Typography>
                <Typography variant="h4" color="secondary.main">
                  {stats.parSexe.feminin}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtres et recherche */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Rechercher un patient..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Service</InputLabel>
              <Select
                value={serviceFilter}
                onChange={(e) => handleServiceFilter(e.target.value)}
                label="Service"
              >
                <MenuItem value="Tous">Tous les services</MenuItem>
                <MenuItem value="Médecine générale">Médecine générale</MenuItem>
                <MenuItem value="Maternité">Maternité</MenuItem>
                <MenuItem value="Pédiatrie">Pédiatrie</MenuItem>
                <MenuItem value="Autres">Autres</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                label="Statut"
              >
                <MenuItem value="Tous">Tous les statuts</MenuItem>
                <MenuItem value="Nouveau">Nouveau</MenuItem>
                <MenuItem value="Connu">Connu</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Tooltip title="Actualiser">
              <IconButton onClick={loadPatients} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau des patients */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Identifiant</TableCell>
              <TableCell>Âge/Sexe</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2, bgcolor: patient.sexe === 'Masculin' ? 'primary.main' : 'secondary.main' }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {patient.prenom} {patient.nom}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {patient.lieu_naissance && `${patient.lieu_naissance}`}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={patient.identifiant}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {calculateAge(patient.date_naissance)} ans
                    </Typography>
                    <Chip
                      label={patient.sexe}
                      size="small"
                      color={patient.sexe === 'Masculin' ? 'primary' : 'secondary'}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    {patient.telephone && (
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <Phone fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">{patient.telephone}</Typography>
                      </Box>
                    )}
                    {patient.adresse && (
                      <Box display="flex" alignItems="center">
                        <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption" noWrap sx={{ maxWidth: 150 }}>
                          {patient.adresse}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<MedicalServices />}
                    label={patient.service_initial || 'Non spécifié'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={patient.statut || 'Nouveau'}
                    color={getStatusColor(patient.statut || 'Nouveau')}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="Voir les détails">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => onViewPatient(patient)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onEditPatient(patient)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Actes à Facturer">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleOpenActesDialog(patient)}
                      >
                        <Receipt />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeletePatient(patient)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Message si aucun patient */}
      {patients.length === 0 && !loading && (
        <Box textAlign="center" sx={{ mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Aucun patient trouvé
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {searchQuery || serviceFilter !== 'Tous' || statusFilter !== 'Tous'
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par ajouter votre premier patient'}
          </Typography>
        </Box>
      )}

      {/* Dialog pour créer rapidement des actes facturables */}
      <QuickActesFacturablesDialog
        open={openActesDialog}
        onClose={handleCloseActesDialog}
        patient={selectedPatientForActes}
        onSuccess={handleActesSuccess}
      />
    </Box>
  );
};
