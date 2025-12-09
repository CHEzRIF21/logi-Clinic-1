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
  Autocomplete,
  Alert,
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Receipt,
  Person,
} from '@mui/icons-material';
import { FacturationService, ServiceFacturable, LigneFacture } from '../../services/facturationService';
import { supabase, Patient } from '../../services/supabase';
import { useFacturationPermissions } from '../../hooks/useFacturationPermissions';
import ExamCatalogService, { ExamCatalogEntry } from '../../services/examCatalogService';

interface CreationFactureProps {
  patientId?: string;
  onFactureCree?: () => void;
}

const CreationFacture: React.FC<CreationFactureProps> = ({ patientId, onFactureCree }) => {
  const permissions = useFacturationPermissions();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<ServiceFacturable[]>([]);
  const [examCatalog, setExamCatalog] = useState<ExamCatalogEntry[]>([]);
  const [examCatalogLoading, setExamCatalogLoading] = useState(false);
  const [lignes, setLignes] = useState<LigneFacture[]>([]);
  const [ligneEnCours, setLigneEnCours] = useState<Partial<LigneFacture>>({
    libelle: '',
    quantite: 1,
    prix_unitaire: 0,
    remise_ligne: 0,
    montant_ligne: 0
  });
  const [openLigneDialog, setOpenLigneDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permissions.canCreate) {
      chargerServices();
      chargerExamCatalog();
      chargerPatients();
      if (patientId) {
        chargerPatient(patientId);
      }
    }
  }, [patientId, permissions.canCreate]);

  // Vérifier les permissions après les hooks
  if (!permissions.canCreate) {
    return (
      <Alert severity="warning">
        Vous n'avez pas les permissions nécessaires pour créer des factures.
      </Alert>
    );
  }

  const chargerServices = async () => {
    try {
      const data = await FacturationService.getServicesFacturables();
      setServices(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des services: ' + err.message);
    }
  };

  const chargerExamCatalog = async () => {
    try {
      setExamCatalogLoading(true);
      const data = await ExamCatalogService.list({ actif: true });
      setExamCatalog(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement du catalogue examens:', err);
    } finally {
      setExamCatalogLoading(false);
    }
  };

  const chargerPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('nom');
      if (error) throw error;
      setPatients(data || []);
    } catch (err: any) {
      setError('Erreur lors du chargement des patients: ' + err.message);
    }
  };

  const chargerPatient = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setPatient(data);
    } catch (err: any) {
      setError('Erreur lors du chargement du patient: ' + err.message);
    }
  };

  const calculerMontantLigne = (ligne: Partial<LigneFacture>) => {
    const quantite = ligne.quantite || 0;
    const prixUnitaire = ligne.prix_unitaire || 0;
    const remise = ligne.remise_ligne || 0;
    return (quantite * prixUnitaire) - remise;
  };

  const ajouterLigne = () => {
    if (!ligneEnCours.libelle || ligneEnCours.prix_unitaire === 0) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const nouvelleLigne: LigneFacture = {
      ...ligneEnCours,
      libelle: ligneEnCours.libelle!,
      quantite: ligneEnCours.quantite || 1,
      prix_unitaire: ligneEnCours.prix_unitaire || 0,
      remise_ligne: ligneEnCours.remise_ligne || 0,
      montant_ligne: calculerMontantLigne(ligneEnCours)
    } as LigneFacture;

    setLignes([...lignes, nouvelleLigne]);
    setLigneEnCours({
      libelle: '',
      quantite: 1,
      prix_unitaire: 0,
      remise_ligne: 0,
      montant_ligne: 0
    });
    setOpenLigneDialog(false);
  };

  const supprimerLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const selectionnerService = (service: ServiceFacturable | null) => {
    if (service) {
      setLigneEnCours({
        ...ligneEnCours,
        libelle: service.nom,
        prix_unitaire: service.tarif_base,
        code_service: service.code,
        service_facturable_id: service.id
      });
    }
  };

  const selectionnerExamenCatalogue = (exam: ExamCatalogEntry | null) => {
    if (!exam) return;
    setLigneEnCours((prev) => ({
      ...prev,
      libelle: exam.nom,
      prix_unitaire: exam.tarif_base || 0,
      code_service: exam.code,
    }));
  };

  const calculerTotal = () => {
    return lignes.reduce((sum, ligne) => sum + ligne.montant_ligne, 0);
  };

  const creerFacture = async () => {
    if (!patient) {
      setError('Veuillez sélectionner un patient');
      return;
    }

    if (lignes.length === 0) {
      setError('Veuillez ajouter au moins une ligne à la facture');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Récupérer l'ID de l'utilisateur actuel depuis le localStorage ou le contexte
      const userData = localStorage.getItem('user');
      const caissierId = userData ? JSON.parse(userData).id : undefined;

      await FacturationService.createFacture({
        patient_id: patient.id,
        lignes: lignes,
        type_facture: 'normale'
      }, caissierId);

      // Réinitialiser le formulaire
      setLignes([]);
      setPatient(null);
      
      if (onFactureCree) {
        onFactureCree();
      }
    } catch (err: any) {
      setError('Erreur lors de la création de la facture: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <Receipt /> Création de Facture
            </Typography>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={creerFacture}
              disabled={loading || lignes.length === 0 || !patient}
            >
              Enregistrer la Facture
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Sélection du patient */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Patient</InputLabel>
                <Select
                  value={patient?.id || ''}
                  onChange={(e) => chargerPatient(e.target.value)}
                  label="Patient"
                  disabled={!!patientId}
                >
                  {patients.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nom} {p.prenom} - {p.telephone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {patient && (
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={2} p={2} bgcolor="grey.50" borderRadius={1}>
                  <Person color="primary" />
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {patient.nom} {patient.prenom}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tél: {patient.telephone} | ID: {patient.identifiant}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Lignes de facture */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Lignes de Facture</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setOpenLigneDialog(true)}
                  disabled={!patient}
                >
                  Ajouter une Ligne
                </Button>
              </Box>

              {lignes.length === 0 ? (
                <Alert severity="info">
                  Aucune ligne ajoutée. Cliquez sur "Ajouter une Ligne" pour commencer.
                </Alert>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Libellé</TableCell>
                        <TableCell align="right">Quantité</TableCell>
                        <TableCell align="right">Prix Unitaire</TableCell>
                        <TableCell align="right">Remise</TableCell>
                        <TableCell align="right">Montant</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lignes.map((ligne, index) => (
                        <TableRow key={index}>
                          <TableCell>{ligne.libelle}</TableCell>
                          <TableCell align="right">{ligne.quantite}</TableCell>
                          <TableCell align="right">{ligne.prix_unitaire.toLocaleString()} FCFA</TableCell>
                          <TableCell align="right">{ligne.remise_ligne.toLocaleString()} FCFA</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {ligne.montant_ligne.toLocaleString()} FCFA
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => supprimerLigne(index)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                          TOTAL
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {calculerTotal().toLocaleString()} FCFA
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Dialog pour ajouter une ligne */}
      <Dialog open={openLigneDialog} onClose={() => setOpenLigneDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Ajouter une Ligne de Facture</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={examCatalog}
                loading={examCatalogLoading}
                groupBy={(option) => option.module_cible || 'Catalogue'}
                getOptionLabel={(option) =>
                  `${option.nom} (${option.code})${
                    option.tarif_base ? ` - ${option.tarif_base.toLocaleString()} FCFA` : ''
                  }`
                }
                onChange={(_, value) => selectionnerExamenCatalogue(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Catalogue des examens / actes"
                    placeholder="Rechercher un examen (laboratoire, imagerie, etc.)"
                    helperText="Choisissez un examen pour pré-remplir le libellé et le tarif"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={services}
                getOptionLabel={(option) => `${option.nom} - ${option.tarif_base.toLocaleString()} FCFA`}
                onChange={(_, value) => selectionnerService(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Service Facturable" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Libellé"
                value={ligneEnCours.libelle}
                onChange={(e) => setLigneEnCours({ ...ligneEnCours, libelle: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Quantité"
                type="number"
                value={ligneEnCours.quantite}
                onChange={(e) => {
                  const qty = parseFloat(e.target.value) || 0;
                  setLigneEnCours({
                    ...ligneEnCours,
                    quantite: qty,
                    montant_ligne: calculerMontantLigne({ ...ligneEnCours, quantite: qty })
                  });
                }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Prix Unitaire (FCFA)"
                type="number"
                value={ligneEnCours.prix_unitaire}
                onChange={(e) => {
                  const prix = parseFloat(e.target.value) || 0;
                  setLigneEnCours({
                    ...ligneEnCours,
                    prix_unitaire: prix,
                    montant_ligne: calculerMontantLigne({ ...ligneEnCours, prix_unitaire: prix })
                  });
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remise (FCFA)"
                type="number"
                value={ligneEnCours.remise_ligne}
                onChange={(e) => {
                  const remise = parseFloat(e.target.value) || 0;
                  setLigneEnCours({
                    ...ligneEnCours,
                    remise_ligne: remise,
                    montant_ligne: calculerMontantLigne({ ...ligneEnCours, remise_ligne: remise })
                  });
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                Montant de la ligne: <strong>{calculerMontantLigne(ligneEnCours).toLocaleString()} FCFA</strong>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLigneDialog(false)}>Annuler</Button>
          <Button onClick={ajouterLigne} variant="contained" disabled={!ligneEnCours.libelle || ligneEnCours.prix_unitaire === 0}>
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreationFacture;

