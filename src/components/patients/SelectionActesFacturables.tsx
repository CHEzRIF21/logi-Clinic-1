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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Delete,
  Receipt,
  ShoppingCart,
  CheckCircle,
  AddCircle,
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
  const [openCustomActeDialog, setOpenCustomActeDialog] = useState(false);
  const [customActe, setCustomActe] = useState<{
    code: string;
    libelle: string;
    prix_unitaire: number;
    type_service: 'consultation' | 'pharmacie' | 'laboratoire' | 'maternite' | 'vaccination' | 'imagerie' | 'autre';
    quantite: number;
  }>({
    code: '',
    libelle: '',
    prix_unitaire: 0,
    type_service: 'autre',
    quantite: 1,
  });

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

  const handleAddCustomActe = () => {
    // Validation
    if (!customActe.libelle || customActe.libelle.trim() === '') {
      enqueueSnackbar('Le libellé est requis', { variant: 'error' });
      return;
    }
    if (!customActe.prix_unitaire || customActe.prix_unitaire <= 0) {
      enqueueSnackbar('Le prix unitaire doit être supérieur à 0', { variant: 'error' });
      return;
    }

    // Générer un code si non fourni
    let code = customActe.code.trim();
    if (!code) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const libelleCode = customActe.libelle.substring(0, 3).toUpperCase().replace(/\s/g, '');
      code = `CUSTOM-${libelleCode}-${timestamp}`;
    }

    // Vérifier si l'acte n'est pas déjà dans le panier
    const existe = actesSelectionnes.find(a => a.code === code);
    if (existe) {
      enqueueSnackbar('Un acte avec ce code existe déjà dans le panier', { variant: 'info' });
      return;
    }

    const nouvelActe: Acte = {
      code,
      libelle: customActe.libelle.trim(),
      quantite: customActe.quantite || 1,
      prix_unitaire: customActe.prix_unitaire,
      type_service: customActe.type_service,
    };

    setActesSelectionnes([...actesSelectionnes, nouvelActe]);
    enqueueSnackbar('Acte personnalisé ajouté au panier', { variant: 'success' });
    
    // Réinitialiser le formulaire et fermer le dialog
    setCustomActe({
      code: '',
      libelle: '',
      prix_unitaire: 0,
      type_service: 'autre',
      quantite: 1,
    });
    setOpenCustomActeDialog(false);
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">
              Actes Disponibles
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddCircle />}
              onClick={() => setOpenCustomActeDialog(true)}
              size="small"
            >
              Ajouter un acte personnalisé
            </Button>
          </Box>
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
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
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

      {/* Dialog pour ajouter un acte personnalisé */}
      <Dialog
        open={openCustomActeDialog}
        onClose={() => setOpenCustomActeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Ajouter un Acte Personnalisé
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Code de l'acte (optionnel)"
                  value={customActe.code}
                  onChange={(e) => setCustomActe({ ...customActe, code: e.target.value })}
                  placeholder="Laissé vide pour génération automatique"
                  helperText="Si vide, un code sera généré automatiquement"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Libellé de l'acte *"
                  value={customActe.libelle}
                  onChange={(e) => setCustomActe({ ...customActe, libelle: e.target.value })}
                  required
                  placeholder="Ex: Consultation spécialisée, Examen complémentaire..."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Prix unitaire (XOF) *"
                  type="number"
                  value={customActe.prix_unitaire || ''}
                  onChange={(e) => setCustomActe({ ...customActe, prix_unitaire: parseFloat(e.target.value) || 0 })}
                  required
                  inputProps={{ min: 0, step: 1 }}
                  helperText="Montant en francs CFA"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantité"
                  type="number"
                  value={customActe.quantite || 1}
                  onChange={(e) => setCustomActe({ ...customActe, quantite: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Type de service</InputLabel>
                  <Select
                    value={customActe.type_service}
                    onChange={(e) => setCustomActe({ ...customActe, type_service: e.target.value as any })}
                    label="Type de service"
                  >
                    <MenuItem value="consultation">Consultation</MenuItem>
                    <MenuItem value="laboratoire">Laboratoire</MenuItem>
                    <MenuItem value="imagerie">Imagerie</MenuItem>
                    <MenuItem value="pharmacie">Pharmacie</MenuItem>
                    <MenuItem value="maternite">Maternité</MenuItem>
                    <MenuItem value="vaccination">Vaccination</MenuItem>
                    <MenuItem value="autre">Autre</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCustomActeDialog(false)}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleAddCustomActe}
            startIcon={<Add />}
            disabled={!customActe.libelle || customActe.prix_unitaire <= 0}
          >
            Ajouter au panier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
