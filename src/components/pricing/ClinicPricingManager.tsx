import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Add,
  Delete,
  LocalHospital,
  AttachMoney,
  History,
} from '@mui/icons-material';

interface PricingSummary {
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  serviceType: string;
  tarifDefaut: number;
  tarifClinique: number | null;
  tarifApplique: number;
  source: 'clinic' | 'default';
  unite: string;
  hasCustomPricing: boolean;
}

interface Clinic {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

interface ClinicPricingManagerProps {
  clinicId?: string;
  onClose?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  'http://localhost:3000';

const ClinicPricingManager: React.FC<ClinicPricingManagerProps> = ({
  clinicId: initialClinicId,
  onClose,
}) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(
    initialClinicId || null
  );
  const [pricingSummary, setPricingSummary] = useState<PricingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPricing, setEditingPricing] = useState<PricingSummary | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    tarifBase: 0,
    unite: 'unité',
  });
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadClinics();
  }, []);

  useEffect(() => {
    if (selectedClinicId) {
      loadPricingSummary();
    }
  }, [selectedClinicId]);

  const loadClinics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/clinics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des cliniques');

      const data = await response.json();
      setClinics(data.data || []);

      if (data.data && data.data.length > 0 && !selectedClinicId) {
        setSelectedClinicId(data.data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadPricingSummary = async () => {
    if (!selectedClinicId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/clinics/${selectedClinicId}/pricing/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Erreur lors du chargement des tarifs');

      const data = await response.json();
      setPricingSummary(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (pricing: PricingSummary) => {
    setEditingPricing(pricing);
    setEditForm({
      tarifBase: pricing.tarifClinique || pricing.tarifDefaut,
      unite: pricing.unite,
    });
    setEditDialogOpen(true);
  };

  const handleSavePricing = async () => {
    if (!selectedClinicId || !editingPricing) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/clinics/${selectedClinicId}/pricing`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            serviceId: editingPricing.serviceId,
            tarifBase: editForm.tarifBase,
            unite: editForm.unite,
            active: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }

      setEditDialogOpen(false);
      setEditingPricing(null);
      loadPricingSummary();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePricing = async (pricing: PricingSummary) => {
    if (!selectedClinicId || !pricing.hasCustomPricing) return;

    if (!window.confirm(`Supprimer le tarif personnalisé pour ${pricing.serviceName} ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/clinics/${selectedClinicId}/pricing/${pricing.serviceId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      loadPricingSummary();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredPricing = pricingSummary.filter((p) => {
    if (activeTab === 0) return true; // Tous
    if (activeTab === 1) return p.hasCustomPricing; // Personnalisés
    if (activeTab === 2) return !p.hasCustomPricing; // Par défaut
    return true;
  });

  const groupedByType = filteredPricing.reduce((acc, pricing) => {
    if (!acc[pricing.serviceType]) {
      acc[pricing.serviceType] = [];
    }
    acc[pricing.serviceType].push(pricing);
    return acc;
  }, {} as Record<string, PricingSummary[]>);

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney /> Gestion des Tarifs par Clinique
            </Typography>
            {onClose && (
              <Button onClick={onClose} variant="outlined">
                Fermer
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Clinique</InputLabel>
                <Select
                  value={selectedClinicId || ''}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  label="Clinique"
                >
                  {clinics.map((clinic) => (
                    <MenuItem key={clinic.id} value={clinic.id}>
                      {clinic.name} ({clinic.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {selectedClinicId && (
            <>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab label="Tous les tarifs" />
                <Tab label="Tarifs personnalisés" />
                <Tab label="Tarifs par défaut" />
              </Tabs>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Tarif par défaut</TableCell>
                        <TableCell align="right">Tarif clinique</TableCell>
                        <TableCell align="right">Tarif appliqué</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(groupedByType).map(([type, pricings]) => (
                        <React.Fragment key={type}>
                          <TableRow sx={{ backgroundColor: 'grey.100' }}>
                            <TableCell colSpan={7}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {type.toUpperCase()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          {pricings.map((pricing) => (
                            <TableRow key={pricing.serviceId}>
                              <TableCell>{pricing.serviceName}</TableCell>
                              <TableCell>
                                <Chip label={pricing.serviceCode} size="small" />
                              </TableCell>
                              <TableCell align="right">{formatPrice(pricing.tarifDefaut)}</TableCell>
                              <TableCell align="right">
                                {pricing.tarifClinique !== null
                                  ? formatPrice(pricing.tarifClinique)
                                  : '-'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {formatPrice(pricing.tarifApplique)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={pricing.source === 'clinic' ? 'Clinique' : 'Défaut'}
                                  color={pricing.source === 'clinic' ? 'primary' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="Modifier le tarif">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditClick(pricing)}
                                    color="primary"
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                                {pricing.hasCustomPricing && (
                                  <Tooltip title="Supprimer le tarif personnalisé">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeletePricing(pricing)}
                                      color="error"
                                    >
                                      <Delete />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPricing
            ? `Modifier le tarif - ${editingPricing.serviceName}`
            : 'Nouveau tarif'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tarif (XOF)"
                type="number"
                value={editForm.tarifBase}
                onChange={(e) =>
                  setEditForm({ ...editForm, tarifBase: parseFloat(e.target.value) || 0 })
                }
                inputProps={{ min: 0, step: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Unité"
                value={editForm.unite}
                onChange={(e) => setEditForm({ ...editForm, unite: e.target.value })}
              />
            </Grid>
            {editingPricing && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Tarif par défaut: {formatPrice(editingPricing.tarifDefaut)}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleSavePricing} variant="contained" startIcon={<Save />}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClinicPricingManager;

