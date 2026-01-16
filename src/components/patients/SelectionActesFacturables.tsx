import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TextField,
  IconButton,
  Chip,
  Alert,
  Divider,
  CircularProgress,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Delete,
  Receipt,
  ShoppingCart,
  CheckCircle,
} from '@mui/icons-material';
import { ActesService, Acte } from '../../services/actesService';
import { FacturationService, ServiceFacturable } from '../../services/facturationService';
import { useSnackbar } from 'notistack';

interface SelectionActesFacturablesProps {
  typeConsultation: 'generale' | 'specialisee' | 'urgence';
  isUrgent?: boolean;
  onActesChange: (actes: Acte[]) => void;
  initialActes?: Acte[];
}

export const SelectionActesFacturables: React.FC<SelectionActesFacturablesProps> = ({
  typeConsultation,
  isUrgent = false,
  onActesChange,
  initialActes = [],
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [actesDisponibles, setActesDisponibles] = useState<ServiceFacturable[]>([]);
  const [actesSelectionnes, setActesSelectionnes] = useState<Acte[]>(initialActes);
  const [loading, setLoading] = useState(false);
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    loadActesDisponibles();
  }, []);

  useEffect(() => {
    if (actesDisponibles.length > 0 && actesSelectionnes.length === 0) {
      loadActesParDefaut();
    }
  }, [typeConsultation, isUrgent, actesDisponibles.length]);

  useEffect(() => {
    onActesChange(actesSelectionnes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actesSelectionnes]);

  const loadActesDisponibles = async () => {
    try {
      setLoading(true);
      const actes = await ActesService.getActesDisponibles();
      setActesDisponibles(actes);
    } catch (error: any) {
      console.error('Erreur chargement actes:', error);
      enqueueSnackbar('Erreur lors du chargement des actes', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadActesParDefaut = async () => {
    try {
      const actesDefaut = await ActesService.getActesParDefaut(typeConsultation, isUrgent);
      if (actesDefaut.length > 0) {
        setActesSelectionnes(actesDefaut);
      }
    } catch (error) {
      console.error('Erreur chargement actes par défaut:', error);
    }
  };

  const handleAddActe = (service: ServiceFacturable) => {
    // Vérifier si l'acte n'est pas déjà dans le panier
    const existe = actesSelectionnes.find(a => a.code === service.code);
    if (existe) {
      enqueueSnackbar('Cet acte est déjà dans le panier', { variant: 'info' });
      return;
    }

    const nouvelActe: Acte = {
      code: service.code,
      libelle: service.nom,
      quantite: 1,
      prix_unitaire: service.tarif_base,
      type_service: service.type_service,
    };

    setActesSelectionnes([...actesSelectionnes, nouvelActe]);
    enqueueSnackbar('Acte ajouté au panier', { variant: 'success' });
  };

  const handleRemoveActe = (code: string) => {
    setActesSelectionnes(actesSelectionnes.filter(a => a.code !== code));
  };

  const handleQuantiteChange = (code: string, quantite: number) => {
    if (quantite < 1) {
      handleRemoveActe(code);
      return;
    }

    setActesSelectionnes(
      actesSelectionnes.map(acte =>
        acte.code === code ? { ...acte, quantite } : acte
      )
    );
  };

  const calculerTotal = () => {
    return actesSelectionnes.reduce(
      (sum, acte) => sum + acte.prix_unitaire * acte.quantite,
      0
    );
  };

  const actesFiltres = actesDisponibles.filter(acte => {
    const matchType = filtreType === 'tous' || acte.type_service === filtreType;
    const matchRecherche = !recherche || 
      acte.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      acte.code.toLowerCase().includes(recherche.toLowerCase());
    return matchType && matchRecherche;
  });

  const typesServices = [
    'tous',
    'consultation',
    'laboratoire',
    'imagerie',
    'pharmacie',
    'maternite',
    'vaccination',
    'autre',
  ];

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <ShoppingCart color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6">
                Sélection des Actes à Facturer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choisissez les actes médicaux à inclure dans la facture initiale
              </Typography>
            </Box>
          </Box>

          {/* Filtres */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rechercher un acte"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Nom ou code de l'acte..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type de service</InputLabel>
                <Select
                  value={filtreType}
                  onChange={(e) => setFiltreType(e.target.value)}
                  label="Type de service"
                >
                  {typesServices.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type === 'tous' ? 'Tous les types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Liste des actes disponibles */}
          <Typography variant="subtitle1" gutterBottom>
            Actes Disponibles
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 300, mb: 3 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Libellé</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Prix unitaire</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {actesFiltres.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Aucun acte trouvé
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    actesFiltres.map((acte) => {
                      const estSelectionne = actesSelectionnes.some(a => a.code === acte.code);
                      return (
                        <TableRow key={acte.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {acte.code}
                            </Typography>
                          </TableCell>
                          <TableCell>{acte.nom}</TableCell>
                          <TableCell>
                            <Chip
                              label={acte.type_service}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {acte.tarif_base.toLocaleString()} XOF
                          </TableCell>
                          <TableCell align="center">
                            {estSelectionne ? (
                              <Chip
                                label="Déjà ajouté"
                                size="small"
                                color="success"
                              />
                            ) : (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleAddActe(acte)}
                              >
                                <Add />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Panier d'actes sélectionnés */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Receipt color="primary" />
            <Typography variant="h6">
              Panier d'Actes ({actesSelectionnes.length})
            </Typography>
          </Box>

          {actesSelectionnes.length === 0 ? (
            <Alert severity="info">
              Aucun acte sélectionné. Les actes par défaut seront ajoutés automatiquement selon le type de consultation.
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Libellé</TableCell>
                      <TableCell align="center">Quantité</TableCell>
                      <TableCell align="right">Prix unitaire</TableCell>
                      <TableCell align="right">Montant</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {actesSelectionnes.map((acte) => (
                      <TableRow key={acte.code}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {acte.code}
                          </Typography>
                        </TableCell>
                        <TableCell>{acte.libelle}</TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            value={acte.quantite}
                            onChange={(e) =>
                              handleQuantiteChange(acte.code, parseInt(e.target.value) || 1)
                            }
                            inputProps={{ min: 1, style: { textAlign: 'center', width: 60 } }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {acte.prix_unitaire.toLocaleString()} XOF
                        </TableCell>
                        <TableCell align="right" fontWeight="bold">
                          {(acte.prix_unitaire * acte.quantite).toLocaleString()} XOF
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveActe(acte.code)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Total à facturer:
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {calculerTotal().toLocaleString()} XOF
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Cette facture sera créée avec le statut <strong>"En attente de paiement"</strong>.
                  Le patient devra effectuer le paiement à la Caisse avant d'accéder à la consultation.
                </Typography>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
