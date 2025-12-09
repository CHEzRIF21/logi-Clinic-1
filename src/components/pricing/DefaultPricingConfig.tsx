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
  Settings,
  AttachMoney,
} from '@mui/icons-material';

interface DefaultPricing {
  id: string;
  code: string;
  nom: string;
  type_service: string;
  tarif_defaut: number;
  tarif_base: number;
  unite: string;
  description?: string;
  actif: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  'http://localhost:3000';

const DefaultPricingConfig: React.FC = () => {
  const [pricing, setPricing] = useState<DefaultPricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPricing, setEditingPricing] = useState<DefaultPricing | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    tarifDefaut: 0,
  });
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadDefaultPricing();
  }, []);

  const loadDefaultPricing = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/pricing/default`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des tarifs par défaut');

      const data = await response.json();
      setPricing(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (pricingItem: DefaultPricing) => {
    setEditingPricing(pricingItem);
    setEditForm({
      tarifDefaut: pricingItem.tarif_defaut,
    });
    setEditDialogOpen(true);
  };

  const handleSavePricing = async () => {
    if (!editingPricing) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/pricing/default/${editingPricing.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tarifDefaut: editForm.tarifDefaut,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }

      setEditDialogOpen(false);
      setEditingPricing(null);
      loadDefaultPricing();
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

  const filteredPricing = pricing.filter((p) => {
    if (activeTab === 0) return true; // Tous
    if (activeTab === 1) return p.actif; // Actifs
    if (activeTab === 2) return !p.actif; // Inactifs
    return true;
  });

  const groupedByType = filteredPricing.reduce((acc, pricingItem) => {
    if (!acc[pricingItem.type_service]) {
      acc[pricingItem.type_service] = [];
    }
    acc[pricingItem.type_service].push(pricingItem);
    return acc;
  }, {} as Record<string, DefaultPricing[]>);

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Settings />
            <Typography variant="h5" component="h2">
              Configuration des Tarifs par Défaut
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Les tarifs par défaut sont utilisés lorsqu'une clinique n'a pas défini de tarif
            personnalisé pour un service.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="Tous les services" />
            <Tab label="Services actifs" />
            <Tab label="Services inactifs" />
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
                    <TableCell>Unite</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(groupedByType).map(([type, items]) => (
                    <React.Fragment key={type}>
                      <TableRow sx={{ backgroundColor: 'grey.100' }}>
                        <TableCell colSpan={7}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {type.toUpperCase()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {items.map((pricingItem) => (
                        <TableRow key={pricingItem.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {pricingItem.nom}
                              </Typography>
                              <Chip label={pricingItem.code} size="small" variant="outlined" />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={pricingItem.type_service} size="small" />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatPrice(pricingItem.tarif_defaut)}
                          </TableCell>
                          <TableCell>{pricingItem.unite}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {pricingItem.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={pricingItem.actif ? 'Actif' : 'Inactif'}
                              color={pricingItem.actif ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Modifier le tarif par défaut">
                              <IconButton
                                size="small"
                                onClick={() => handleEditClick(pricingItem)}
                                color="primary"
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPricing
            ? `Modifier le tarif par défaut - ${editingPricing.nom}`
            : 'Nouveau tarif par défaut'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="warning">
                La modification du tarif par défaut affectera toutes les cliniques qui n'ont pas
                défini de tarif personnalisé pour ce service.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tarif par défaut (XOF)"
                type="number"
                value={editForm.tarifDefaut}
                onChange={(e) =>
                  setEditForm({ ...editForm, tarifDefaut: parseFloat(e.target.value) || 0 })
                }
                inputProps={{ min: 0, step: 100 }}
              />
            </Grid>
            {editingPricing && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Code service: {editingPricing.code} | Type: {editingPricing.type_service}
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

export default DefaultPricingConfig;

