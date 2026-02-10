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
import { MedicamentService } from '../../services/medicamentService';
import { MedicamentSupabase } from '../../services/stockSupabase';
import { LaboratoireTarificationService } from '../../services/laboratoireTarificationService';
import { useSnackbar } from 'notistack';

interface SelectionActesFacturablesProps {
  typeConsultation: 'generale' | 'specialisee' | 'urgence';
  isUrgent?: boolean;
  onActesChange: (actes: Acte[]) => void;
  initialActes?: Acte[];
  serviceConsulte?: string; // Service consulté depuis l'orientation
}

export const SelectionActesFacturables: React.FC<SelectionActesFacturablesProps> = ({
  typeConsultation,
  isUrgent = false,
  onActesChange,
  initialActes = [],
  serviceConsulte = '',
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [actesDisponibles, setActesDisponibles] = useState<ServiceFacturable[]>([]);
  const [medicamentsDisponibles, setMedicamentsDisponibles] = useState<MedicamentSupabase[]>([]);
  const [actesSelectionnes, setActesSelectionnes] = useState<Acte[]>(initialActes);
  const [loading, setLoading] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [openCustomActeDialog, setOpenCustomActeDialog] = useState(false);
  const [typeServiceFiltre, setTypeServiceFiltre] = useState<string>('');
  const [analysesLaboChargees, setAnalysesLaboChargees] = useState(false);
  
  // Mapper le service consulté (module UI) vers le type de service facturable
  const getTypeServiceFromServiceConsulte = (service: string): string => {
    const mapping: { [key: string]: string } = {
      // Modules de consultations
      'Consultation': 'consultation',
      'Pédiatrie': 'consultation',
      'Urgences': 'consultation',
      'Chirurgie': 'consultation',

      // Modules spécialisés
      'Maternité': 'maternite',
      'Laboratoire': 'laboratoire',
      'Imagerie médicale': 'imagerie',
      'Vaccination': 'vaccination',
      'Pharmacie': 'pharmacie',

      // Modules regroupés dans \"autre\" côté facturation
      'Soins infirmiers': 'autre',
      'Hospitalisation': 'autre',
      'Bilan médical': 'autre',
      'Bilans': 'autre',
      'Documents': 'autre',
    };
    return mapping[service] || 'consultation';
  };
  
  const typeServiceFacture = getTypeServiceFromServiceConsulte(serviceConsulte);
  const [customActe, setCustomActe] = useState<{
    code: string;
    libelle: string;
    prix_unitaire: number;
    type_service: string;
    quantite: number;
  }>({
    code: '',
    libelle: '',
    prix_unitaire: 0,
    type_service: typeServiceFacture,
    quantite: 1,
  });
  
  // Mettre à jour le type de service par défaut quand le service consulté change
  React.useEffect(() => {
    if (serviceConsulte) {
      setCustomActe(prev => ({
        ...prev,
        type_service: getTypeServiceFromServiceConsulte(serviceConsulte)
      }));
    }
  }, [serviceConsulte]);

  useEffect(() => {
    // Si "Pharmacie" est sélectionné, charger uniquement les médicaments
    if (typeServiceFacture === 'pharmacie' || typeServiceFiltre === 'pharmacie') {
      loadMedicaments();
    } else {
      // Sinon, charger les actes normaux
      loadActesDisponibles();
    }
  }, [typeServiceFacture, typeServiceFiltre]);

  const loadMedicaments = React.useCallback(async () => {
    try {
      setLoading(true);
      const medicaments = await MedicamentService.getAllMedicaments();
      setMedicamentsDisponibles(medicaments);
    } catch (error: any) {
      console.error('Erreur chargement médicaments:', error);
      enqueueSnackbar('Erreur lors du chargement des médicaments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (actesDisponibles.length > 0 && actesSelectionnes.length === 0) {
      loadActesParDefaut();
    }
  }, [typeConsultation, isUrgent, actesDisponibles.length]);

  // Charger automatiquement toutes les analyses de laboratoire dans les actes disponibles quand le service est "Laboratoire"
  useEffect(() => {
    if (serviceConsulte === 'Laboratoire' && !analysesLaboChargees) {
      const toutesAnalyses = LaboratoireTarificationService.getAllTarifs();
      // Convertir les analyses en format ServiceFacturable pour les ajouter aux actes disponibles
      const analysesDisponibles: ServiceFacturable[] = toutesAnalyses.map((analyse) => ({
        id: `labo-${analyse.code || analyse.numero}`,
        code: analyse.code || `LAB-${analyse.numero}`,
        nom: `${analyse.numero}. ${analyse.nom}`,
        type_service: 'laboratoire' as const,
        tarif_base: analyse.prix,
        unite: 'analyse',
        description: analyse.tube ? `Tube: ${analyse.tube}` : undefined,
        actif: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      
      if (analysesDisponibles.length > 0) {
        // Ajouter les analyses aux actes disponibles (pas au panier)
        setActesDisponibles(prev => {
          // Filtrer les analyses de laboratoire existantes pour éviter les doublons
          const autresActes = prev.filter(
            acte => acte.type_service !== 'laboratoire' || !acte.code?.startsWith('LAB-')
          );
          return [...autresActes, ...analysesDisponibles];
        });
        setAnalysesLaboChargees(true);
        enqueueSnackbar(
          `${analysesDisponibles.length} analyses de laboratoire disponibles pour sélection`,
          { variant: 'info' }
        );
      }
    } else if (serviceConsulte !== 'Laboratoire') {
      // Réinitialiser le flag si le service change
      setAnalysesLaboChargees(false);
    }
  }, [serviceConsulte, analysesLaboChargees, enqueueSnackbar]);

  useEffect(() => {
    onActesChange(actesSelectionnes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actesSelectionnes]);


  const loadActesDisponibles = async () => {
    try {
      setLoading(true);
      const actes = await ActesService.getActesDisponibles();
      // Préserver les analyses de laboratoire déjà chargées
      setActesDisponibles(prev => {
        const analysesLabo = prev.filter(
          acte => acte.type_service === 'laboratoire' && (acte.code?.startsWith('LAB-') || acte.id?.startsWith('labo-'))
        );
        return [...actes, ...analysesLabo];
      });
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
      prix_unitaire: 0, // Prix unitaire vide par défaut (doit être rempli manuellement)
      type_service: service.type_service,
    };

    setActesSelectionnes([...actesSelectionnes, nouvelActe]);
    enqueueSnackbar('Acte ajouté au panier', { variant: 'success' });
  };

  const handleAddMedicament = (medicament: MedicamentSupabase) => {
    // Vérifier si le médicament n'est pas déjà dans le panier
    const existe = actesSelectionnes.find(a => a.code === medicament.code);
    if (existe) {
      enqueueSnackbar('Ce médicament est déjà dans le panier', { variant: 'info' });
      return;
    }

    const nouvelActe: Acte = {
      code: medicament.code,
      libelle: `${medicament.nom} ${medicament.forme ? `(${medicament.forme})` : ''} ${medicament.dosage ? `- ${medicament.dosage}` : ''}`.trim(),
      quantite: 1,
      prix_unitaire: 0, // Prix unitaire vide par défaut
      type_service: 'pharmacie',
    };

    setActesSelectionnes([...actesSelectionnes, nouvelActe]);
    enqueueSnackbar('Médicament ajouté au panier', { variant: 'success' });
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

    // Utiliser le type de service du service consulté si disponible, sinon celui du formulaire
    const typeServiceFinal = serviceConsulte 
      ? getTypeServiceFromServiceConsulte(serviceConsulte)
      : customActe.type_service;

    const nouvelActe: Acte = {
      code,
      libelle: customActe.libelle.trim(),
      quantite: customActe.quantite || 1,
      prix_unitaire: customActe.prix_unitaire,
      type_service: typeServiceFinal as any,
    };

    setActesSelectionnes([...actesSelectionnes, nouvelActe]);
    enqueueSnackbar('Acte personnalisé ajouté au panier', { variant: 'success' });
    
    // Réinitialiser le formulaire et fermer le dialog
    setCustomActe({
      code: '',
      libelle: '',
      prix_unitaire: 0,
      type_service: 'consultation',
      quantite: 1,
    });
    setOpenCustomActeDialog(false);
  };

  const handleQuantiteChange = (code: string, quantite: number) => {
    if (quantite < 1) {
      enqueueSnackbar('La quantité doit être au moins égale à 1', { variant: 'error' });
      return;
    }

    setActesSelectionnes(
      actesSelectionnes.map(acte =>
        acte.code === code ? { ...acte, quantite } : acte
      )
    );
  };

  const handlePrixUnitaireChange = (code: string, prix: number) => {
    setActesSelectionnes(
      actesSelectionnes.map(acte =>
        acte.code === code ? { ...acte, prix_unitaire: prix || 0 } : acte
      )
    );
  };

  const calculerTotal = () => {
    return actesSelectionnes.reduce(
      (sum, acte) => sum + (acte.prix_unitaire || 0) * (acte.quantite || 1),
      0
    );
  };

  // Filtrer les actes en fonction du service consulté / filtre de type et de la recherche
  const actesFiltres = actesDisponibles.filter(acte => {
    // Déterminer le type de service à utiliser pour le filtre :
    // priorité au filtre manuel, sinon type dérivé du service consulté
    const effectiveType =
      typeServiceFiltre || (serviceConsulte ? typeServiceFacture : '');

    const matchType =
      !effectiveType || acte.type_service === effectiveType;
    const matchRecherche = !recherche || 
      acte.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      acte.code.toLowerCase().includes(recherche.toLowerCase());
    return matchType && matchRecherche;
  });

  // Filtrer les médicaments en fonction de la recherche
  const medicamentsFiltres = medicamentsDisponibles.filter(medicament => {
    const matchRecherche = !recherche || 
      medicament.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      medicament.code.toLowerCase().includes(recherche.toLowerCase());
    return matchRecherche;
  });


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

          {/* Filtre de recherche */}
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
                <InputLabel>Filtrer par type de service</InputLabel>
                <Select
                  value={typeServiceFiltre}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTypeServiceFiltre(value);
                    if (value === 'pharmacie') {
                      loadMedicaments();
                    }
                  }}
                  label="Filtrer par type de service"
                >
                  <MenuItem value="">Tous les services</MenuItem>
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="maternite">Maternité</MenuItem>
                  <MenuItem value="laboratoire">Laboratoire</MenuItem>
                  <MenuItem value="imagerie">Imagerie médicale</MenuItem>
                  <MenuItem value="vaccination">Vaccination</MenuItem>
                  <MenuItem value="pharmacie">Pharmacie</MenuItem>
                  <MenuItem value="autre">Autres (Soins infirmiers, Hospitalisation, Documents, Bilans)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {serviceConsulte && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Les actes sont filtrés selon le service: <strong>{serviceConsulte}</strong>
                </Alert>
              </Grid>
            )}
          </Grid>

          {/* Liste des actes disponibles */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">
              {typeServiceFiltre === 'pharmacie' || typeServiceFacture === 'pharmacie' 
                ? 'Médicaments Disponibles' 
                : 'Actes Disponibles'}
            </Typography>
            {typeServiceFiltre !== 'pharmacie' && typeServiceFacture !== 'pharmacie' && (
              <Button
                variant="outlined"
                startIcon={<AddCircle />}
                onClick={() => setOpenCustomActeDialog(true)}
                size="small"
              >
                Ajouter un acte personnalisé
              </Button>
            )}
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
                  {/* Afficher UNIQUEMENT les médicaments si "Pharmacie" est sélectionné */}
                  {(typeServiceFiltre === 'pharmacie' || typeServiceFacture === 'pharmacie') ? (
                    medicamentsFiltres.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Aucun médicament trouvé dans le stock
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      medicamentsFiltres.map((medicament) => {
                        const estSelectionne = actesSelectionnes.some(a => a.code === medicament.code);
                        return (
                          <TableRow key={medicament.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {medicament.code}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {`${medicament.nom} ${medicament.forme ? `(${medicament.forme})` : ''} ${medicament.dosage ? `- ${medicament.dosage}` : ''}`.trim()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label="Pharmacie"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              {(medicament.prix_unitaire_detail || medicament.prix_unitaire || 0).toLocaleString()} XOF
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
                                  onClick={() => handleAddMedicament(medicament)}
                                >
                                  <Add />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  ) : (
                    /* Afficher les actes normaux (pas de médicaments) */
                    actesFiltres.length === 0 ? (
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
                    )
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
                            required
                            error={!acte.quantite || acte.quantite < 1}
                            helperText={(!acte.quantite || acte.quantite < 1) ? 'Quantité requise' : ''}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            value={acte.prix_unitaire || ''}
                            onChange={(e) =>
                              handlePrixUnitaireChange(acte.code, parseFloat(e.target.value) || 0)
                            }
                            inputProps={{ min: 0, step: 1, style: { textAlign: 'right', width: 100 } }}
                            size="small"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {((acte.prix_unitaire || 0) * (acte.quantite || 1)).toLocaleString()} XOF
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
                    onChange={(e) => setCustomActe({ ...customActe, type_service: e.target.value })}
                    label="Type de service"
                  >
                    <MenuItem value="consultation">Consultation</MenuItem>
                    <MenuItem value="maternite">Maternité</MenuItem>
                    <MenuItem value="pediatrie">Pédiatrie</MenuItem>
                    <MenuItem value="laboratoire">Laboratoire</MenuItem>
                    <MenuItem value="imagerie_medicale">Imagerie médicale</MenuItem>
                    <MenuItem value="urgences">Urgences</MenuItem>
                    <MenuItem value="chirurgie">Chirurgie</MenuItem>
                    <MenuItem value="vaccination">Vaccination</MenuItem>
                    <MenuItem value="soins_infirmiers">Soins infirmiers</MenuItem>
                    <MenuItem value="pharmacie">Pharmacie</MenuItem>
                  </Select>
                  {serviceConsulte && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Le type de service par défaut correspond au service consulté: <strong>{serviceConsulte}</strong>
                    </Alert>
                  )}
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
