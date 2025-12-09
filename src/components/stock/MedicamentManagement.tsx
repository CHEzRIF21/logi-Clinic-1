import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Visibility,
  Refresh,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { MedicamentService } from '../../services/medicamentService';
import { MedicamentSupabase, MedicamentFormData } from '../../services/stockSupabase';
import MedicamentForm from './MedicamentForm';

const MedicamentManagement: React.FC = () => {
  const [medicaments, setMedicaments] = useState<MedicamentSupabase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editingMedicament, setEditingMedicament] = useState<MedicamentSupabase | null>(null);
  const [selectedMedicament, setSelectedMedicament] = useState<MedicamentSupabase | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [existingCodes, setExistingCodes] = useState<string[]>([]);

  // Charger les médicaments au montage du composant
  useEffect(() => {
    loadMedicaments();
  }, []);

  const loadMedicaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const [medicamentsData, codesData] = await Promise.all([
        MedicamentService.getAllMedicaments(),
        MedicamentService.getAllMedicamentCodes(),
      ]);
      setMedicaments(medicamentsData);
      setExistingCodes(codesData);
    } catch (err) {
      setError('Erreur lors du chargement des médicaments');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMedicament = async (medicamentData: MedicamentFormData) => {
    try {
      setLoading(true);
      const newMedicament = await MedicamentService.createMedicament(medicamentData);
      setMedicaments(prev => [...prev, newMedicament]);
      setOpenForm(false);
      await loadMedicaments(); // Recharger pour avoir les codes à jour
    } catch (err) {
      setError('Erreur lors de la création du médicament');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMedicament = async (medicamentData: MedicamentFormData) => {
    if (!editingMedicament) return;

    try {
      setLoading(true);
      const updatedMedicament = await MedicamentService.updateMedicament(
        editingMedicament.id,
        medicamentData
      );
      setMedicaments(prev =>
        prev.map(med => (med.id === editingMedicament.id ? updatedMedicament : med))
      );
      setEditingMedicament(null);
      setOpenForm(false);
    } catch (err) {
      setError('Erreur lors de la modification du médicament');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedicament = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce médicament ?')) {
      return;
    }

    try {
      setLoading(true);
      await MedicamentService.deleteMedicament(id);
      setMedicaments(prev => prev.filter(med => med.id !== id));
      setExistingCodes(prev => prev.filter(code => code !== medicaments.find(m => m.id === id)?.code));
    } catch (err) {
      setError('Erreur lors de la suppression du médicament');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMedicament = (medicament: MedicamentSupabase) => {
    setEditingMedicament(medicament);
    setOpenForm(true);
  };

  const handleViewMedicament = (medicament: MedicamentSupabase) => {
    setSelectedMedicament(medicament);
    setOpenDetails(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingMedicament(null);
  };

  const filteredMedicaments = medicaments.filter(medicament =>
    medicament.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicament.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicament.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (medicament: MedicamentSupabase): 'error' | 'default' | 'success' | 'info' | 'warning' | 'primary' | 'secondary' => {
    // Logique pour déterminer la couleur du statut basée sur le stock
    // Cette logique devrait être adaptée selon vos besoins
    return 'success';
  };

  const getStatusLabel = (medicament: MedicamentSupabase) => {
    // Logique pour déterminer le label du statut
    return 'Disponible';
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            Gestion des Médicaments
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenForm(true)}
            disabled={loading}
          >
            Nouveau Médicament
          </Button>
        </Box>

        {/* Barre de recherche */}
        <TextField
          fullWidth
          placeholder="Rechercher un médicament..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Actions rapides */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadMedicaments}
            disabled={loading}
          >
            Actualiser
          </Button>
        </Box>
      </Box>

      {/* Messages d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tableau des médicaments */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Forme</TableCell>
                  <TableCell>Dosage</TableCell>
                  <TableCell>Fournisseur</TableCell>
                  <TableCell>Prix</TableCell>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredMedicaments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Aucun médicament trouvé' : 'Aucun médicament enregistré'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMedicaments.map((medicament) => (
                    <TableRow key={medicament.id}>
                      <TableCell>
                        <Chip
                          label={medicament.code}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {medicament.nom}
                        </Typography>
                      </TableCell>
                      <TableCell>{medicament.forme}</TableCell>
                      <TableCell>{medicament.dosage}</TableCell>
                      <TableCell>{medicament.fournisseur}</TableCell>
                      <TableCell>
                        {medicament.prix_unitaire.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                        })}
                      </TableCell>
                      <TableCell>{medicament.categorie}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(medicament)}
                          color={getStatusColor(medicament)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Voir détails">
                            <IconButton
                              size="small"
                              onClick={() => handleViewMedicament(medicament)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              onClick={() => handleEditMedicament(medicament)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteMedicament(medicament.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Formulaire de création/modification */}
      <MedicamentForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={editingMedicament ? handleUpdateMedicament : handleCreateMedicament}
        loading={loading}
        medicament={editingMedicament}
        existingCodes={existingCodes}
      />

      {/* Dialog de détails */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détails du médicament</DialogTitle>
        <DialogContent>
          {selectedMedicament && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Identifiant
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMedicament.code}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Nom
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMedicament.nom}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Forme
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMedicament.forme}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Dosage
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMedicament.dosage}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Fournisseur
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMedicament.fournisseur}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Prix unitaire
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMedicament.prix_unitaire.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                  })}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Catégorie
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMedicament.categorie}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Prescription requise
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMedicament.prescription_requise ? 'Oui' : 'Non'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicamentManagement;
