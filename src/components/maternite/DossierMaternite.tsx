import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Checkbox,
  FormControlLabel,
  FormGroup,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Save,
  Cancel,
  Delete,
  Warning,
  CheckCircle,
  Schedule,
  Person,
  PregnantWoman,
  Assessment,
  LocalHospital,
  Print,
} from '@mui/icons-material';
import {
  DossierObstetrical,
  DossierObstetricalFormData,
  GrossesseAnterieure,
  MaterniteService,
} from '../../services/materniteService';
import { Patient } from '../../services/supabase';

interface DossierMaterniteProps {
  patient?: Patient;
  dossier?: DossierObstetrical;
  onSave: (dossier: DossierObstetricalFormData) => Promise<void>;
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dossier-tabpanel-${index}`}
      aria-labelledby={`dossier-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const DossierMaternite: React.FC<DossierMaterniteProps> = ({
  patient,
  dossier: existingDossier,
  onSave,
  onClose,
  mode = 'create',
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(mode === 'create');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState<DossierObstetricalFormData>({
    patient_id: patient?.id || '',
    date_entree: existingDossier?.date_entree || new Date().toISOString().split('T')[0],
    date_sortie: existingDossier?.date_sortie || '',
    numero_dossier: existingDossier?.numero_dossier || '',
    
    // Informations conjoint
    conjoint_nom_prenoms: existingDossier?.conjoint_nom_prenoms || '',
    conjoint_profession: existingDossier?.conjoint_profession || '',
    conjoint_groupe_sanguin: existingDossier?.conjoint_groupe_sanguin || 'Inconnu',
    conjoint_rhesus: existingDossier?.conjoint_rhesus || 'Inconnu',
    conjoint_electrophorese_hemoglobine: existingDossier?.conjoint_electrophorese_hemoglobine || '',
    conjoint_serologie: existingDossier?.conjoint_serologie || '',
    personne_contacter_nom: existingDossier?.personne_contacter_nom || '',
    personne_contacter_adresse: existingDossier?.personne_contacter_adresse || '',
    personne_contacter_telephone: existingDossier?.personne_contacter_telephone || '',
    referee: existingDossier?.referee || false,
    referee_par: existingDossier?.referee_par || '',
    
    // Antécédents obstétricaux
    transfusions_anterieures: existingDossier?.transfusions_anterieures || false,
    nombre_transfusions: existingDossier?.nombre_transfusions || 0,
    gestite: existingDossier?.gestite || 0,
    parite: existingDossier?.parite || 0,
    nombre_avortements: existingDossier?.nombre_avortements || 0,
    nombre_enfants_vivants: existingDossier?.nombre_enfants_vivants || 0,
    nombre_enfants_decedes: existingDossier?.nombre_enfants_decedes || 0,
    ddr: existingDossier?.ddr || '',
    dpa: existingDossier?.dpa || '',
    
    // Facteurs de surveillance
    age_inferieur_16: existingDossier?.age_inferieur_16 || false,
    age_superieur_35: existingDossier?.age_superieur_35 || false,
    taille_inferieure_150: existingDossier?.taille_inferieure_150 || false,
    parite_superieure_6: existingDossier?.parite_superieure_6 || false,
    cesarienne_dernier_accouchement: existingDossier?.cesarienne_dernier_accouchement || false,
    mort_ne_dernier_accouchement: existingDossier?.mort_ne_dernier_accouchement || false,
    drepanocytose_ss_sc: existingDossier?.drepanocytose_ss_sc || false,
    hta_connue: existingDossier?.hta_connue || false,
    fausses_couches_repetees: existingDossier?.fausses_couches_repetees || false,
    diabete: existingDossier?.diabete || false,
    autres_facteurs: existingDossier?.autres_facteurs || '',
    
    // Examens complémentaires
    examen_groupe_sanguin: existingDossier?.examen_groupe_sanguin || 'Inconnu',
    examen_rhesus: existingDossier?.examen_rhesus || 'Inconnu',
    test_coombs_indirect: existingDossier?.test_coombs_indirect || '',
    tpha: existingDossier?.tpha || '',
    vdrl: existingDossier?.vdrl || '',
    hiv1_hiv2: existingDossier?.hiv1_hiv2 || '',
    ecbu: existingDossier?.ecbu || '',
    taux_hemoglobine: existingDossier?.taux_hemoglobine || undefined,
    hematocrite: existingDossier?.hematocrite || undefined,
    plaquettes: existingDossier?.plaquettes || undefined,
    electrophorese_hemoglobine: existingDossier?.electrophorese_hemoglobine || '',
    toxoplasmose_igg: existingDossier?.toxoplasmose_igg || '',
    toxoplasmose_igm: existingDossier?.toxoplasmose_igm || '',
    rubeole_igg: existingDossier?.rubeole_igg || '',
    glycemic_jeun: existingDossier?.glycemic_jeun || undefined,
    gp75: existingDossier?.gp75 || undefined,
    hepatite_b: existingDossier?.hepatite_b || '',
    autres_examens: existingDossier?.autres_examens || '',
    
    // VIH / Syphilis
    vih: existingDossier?.vih || false,
    mise_sous_arv: existingDossier?.mise_sous_arv || false,
    syphilis: existingDossier?.syphilis || false,
    mise_sous_ctm: existingDossier?.mise_sous_ctm || false,
    
    // Statut
    statut: existingDossier?.statut || 'en_cours',
    notes: existingDossier?.notes || '',
    
    // Grossesses antérieures
    grossesses_anterieures: existingDossier?.grossesses_anterieures || [],
  });

  const [grossessesAnterieures, setGrossessesAnterieures] = useState<GrossesseAnterieure[]>(
    existingDossier?.grossesses_anterieures || []
  );

  // Calculer l'âge du patient
  const calculateAge = (dateNaissance: string): number => {
    if (!dateNaissance) return 0;
    const birth = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const patientAge = patient ? calculateAge(patient.date_naissance) : 0;

  // Mettre à jour automatiquement les facteurs de risque basés sur l'âge
  useEffect(() => {
    if (patientAge > 0) {
      setFormData(prev => ({
        ...prev,
        age_inferieur_16: patientAge < 16,
        age_superieur_35: patientAge > 35,
      }));
    }
  }, [patientAge]);

  // Calculer la DPA automatiquement quand la DDR change
  useEffect(() => {
    if (formData.ddr) {
      const dpa = MaterniteService.calculateDPA(formData.ddr);
      setFormData(prev => ({ ...prev, dpa }));
    }
  }, [formData.ddr]);

  // Calculer l'âge gestationnel
  const ageGestationnel = formData.ddr
    ? MaterniteService.calculateAgeGestationnel(formData.ddr)
    : 0;

  // Détecter les facteurs de risque
  const facteursRisque = MaterniteService.detecterFacteursRisque(formData, patientAge);

  const handleInputChange = (field: keyof DossierObstetricalFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof DossierObstetricalFormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleAddGrossesseAnterieure = () => {
    setGrossessesAnterieures(prev => [
      ...prev,
      {
        annee: new Date().getFullYear(),
        evolution: '',
        poids: undefined,
        sexe: 'Inconnu',
        etat_enfants: '',
      },
    ]);
  };

  const handleUpdateGrossesseAnterieure = (index: number, field: keyof GrossesseAnterieure, value: any) => {
    setGrossessesAnterieures(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteGrossesseAnterieure = (index: number) => {
    setGrossessesAnterieures(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formData.patient_id) {
      setError('Veuillez sélectionner un patient');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const dataToSave: DossierObstetricalFormData = {
        ...formData,
        grossesses_anterieures: grossessesAnterieures,
      };
      await onSave(dataToSave);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!patient && mode !== 'create') {
    return (
      <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Alert severity="error">Patient non trouvé</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fermer</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Dossier Obstétrical
            {patient && ` - ${patient.prenom} ${patient.nom} (${patient.identifiant})`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isEditing && mode !== 'view' && (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setIsEditing(true)}
              >
                Modifier
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrint}
            >
              Imprimer
            </Button>
            {isEditing && (
              <>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  Sauvegarder
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => setIsEditing(false)}
                >
                  Annuler
                </Button>
              </>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Informations patient (lecture seule) */}
        {patient && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations Patient (depuis le module Gestion des Patients)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={patient.nom}
                    disabled
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={patient.prenom}
                    disabled
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Date de naissance"
                    value={new Date(patient.date_naissance).toLocaleDateString()}
                    disabled
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Âge"
                    value={`${patientAge} ans`}
                    disabled
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={patient.telephone || ''}
                    disabled
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Profession"
                    value={patient.profession || ''}
                    disabled
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Groupe sanguin"
                    value={patient.groupe_sanguin || 'Inconnu'}
                    disabled
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adresse"
                    value={patient.adresse || ''}
                    disabled
                    multiline
                    rows={2}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Indicateurs de risque */}
        {facteursRisque.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Facteurs de risque détectés:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {facteursRisque.map((facteur, index) => (
                <Chip key={index} label={facteur} size="small" color="warning" />
              ))}
            </Box>
          </Alert>
        )}

        {/* Indicateurs généraux */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {formData.ddr && (
            <Chip
              label={`DDR: ${new Date(formData.ddr).toLocaleDateString()}`}
              color="primary"
              icon={<Schedule />}
            />
          )}
          {formData.dpa && (
            <Chip
              label={`DPA: ${new Date(formData.dpa).toLocaleDateString()}`}
              color="info"
              icon={<PregnantWoman />}
            />
          )}
          {ageGestationnel > 0 && (
            <Chip
              label={`Âge gestationnel: ${ageGestationnel} SA`}
              color="secondary"
              icon={<Assessment />}
            />
          )}
          {formData.statut && (
            <Chip
              label={`Statut: ${formData.statut}`}
              color={formData.statut === 'en_cours' ? 'primary' : 'success'}
            />
          )}
        </Box>

        {/* Onglets */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="scrollable">
            <Tab label="Conjoint" icon={<Person />} />
            <Tab label="Antécédents" icon={<Assessment />} />
            <Tab label="Facteurs de Surveillance" icon={<Warning />} />
            <Tab label="Examens" icon={<LocalHospital />} />
            <Tab label="VIH/Syphilis" icon={<CheckCircle />} />
          </Tabs>
        </Box>

        {/* Onglet Conjoint */}
        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations sur le Conjoint (Procureur)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nom & Prénoms"
                    value={formData.conjoint_nom_prenoms}
                    onChange={(e) => handleInputChange('conjoint_nom_prenoms', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Profession"
                    value={formData.conjoint_profession}
                    onChange={(e) => handleInputChange('conjoint_profession', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Groupe sanguin</InputLabel>
                    <Select
                      value={formData.conjoint_groupe_sanguin}
                      onChange={(e) => handleInputChange('conjoint_groupe_sanguin', e.target.value)}
                      disabled={!isEditing}
                      label="Groupe sanguin"
                    >
                      <MenuItem value="A">A</MenuItem>
                      <MenuItem value="B">B</MenuItem>
                      <MenuItem value="AB">AB</MenuItem>
                      <MenuItem value="O">O</MenuItem>
                      <MenuItem value="Inconnu">Inconnu</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Rhésus</InputLabel>
                    <Select
                      value={formData.conjoint_rhesus}
                      onChange={(e) => handleInputChange('conjoint_rhesus', e.target.value)}
                      disabled={!isEditing}
                      label="Rhésus"
                    >
                      <MenuItem value="Positif">Positif</MenuItem>
                      <MenuItem value="Négatif">Négatif</MenuItem>
                      <MenuItem value="Inconnu">Inconnu</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Électrophorèse hémoglobine"
                    value={formData.conjoint_electrophorese_hemoglobine}
                    onChange={(e) => handleInputChange('conjoint_electrophorese_hemoglobine', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Sérologie du conjoint"
                    value={formData.conjoint_serologie}
                    onChange={(e) => handleInputChange('conjoint_serologie', e.target.value)}
                    disabled={!isEditing}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Personne à contacter - Nom"
                    value={formData.personne_contacter_nom}
                    onChange={(e) => handleInputChange('personne_contacter_nom', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Personne à contacter - Téléphone"
                    value={formData.personne_contacter_telephone}
                    onChange={(e) => handleInputChange('personne_contacter_telephone', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Personne à contacter - Adresse"
                    value={formData.personne_contacter_adresse}
                    onChange={(e) => handleInputChange('personne_contacter_adresse', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.referee}
                        onChange={(e) => handleCheckboxChange('referee', e.target.checked)}
                        disabled={!isEditing}
                      />
                    }
                    label="Référée"
                  />
                </Grid>
                {formData.referee && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Référée par"
                      value={formData.referee_par}
                      onChange={(e) => handleInputChange('referee_par', e.target.value)}
                      disabled={!isEditing}
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Onglet Antécédents */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Antécédents Obstétricaux
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.transfusions_anterieures}
                            onChange={(e) => {
                              handleCheckboxChange('transfusions_anterieures', e.target.checked);
                              if (!e.target.checked) {
                                handleInputChange('nombre_transfusions', 0);
                              }
                            }}
                            disabled={!isEditing}
                          />
                        }
                        label="Transfusions antérieures"
                      />
                    </Grid>
                    {formData.transfusions_anterieures && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nombre de transfusions"
                          type="number"
                          value={formData.nombre_transfusions}
                          onChange={(e) => handleInputChange('nombre_transfusions', parseInt(e.target.value) || 0)}
                          disabled={!isEditing}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Gestité"
                        type="number"
                        value={formData.gestite}
                        onChange={(e) => handleInputChange('gestite', parseInt(e.target.value) || 0)}
                        disabled={!isEditing}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Parité"
                        type="number"
                        value={formData.parite}
                        onChange={(e) => handleInputChange('parite', parseInt(e.target.value) || 0)}
                        disabled={!isEditing}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nombre d'avortements"
                        type="number"
                        value={formData.nombre_avortements}
                        onChange={(e) => handleInputChange('nombre_avortements', parseInt(e.target.value) || 0)}
                        disabled={!isEditing}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nombre d'enfants vivants"
                        type="number"
                        value={formData.nombre_enfants_vivants}
                        onChange={(e) => handleInputChange('nombre_enfants_vivants', parseInt(e.target.value) || 0)}
                        disabled={!isEditing}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nombre d'enfants décédés"
                        type="number"
                        value={formData.nombre_enfants_decedes}
                        onChange={(e) => handleInputChange('nombre_enfants_decedes', parseInt(e.target.value) || 0)}
                        disabled={!isEditing}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="DDR (Date des dernières règles)"
                        type="date"
                        value={formData.ddr}
                        onChange={(e) => handleInputChange('ddr', e.target.value)}
                        disabled={!isEditing}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="DPA (Date probable d'accouchement)"
                        type="date"
                        value={formData.dpa}
                        onChange={(e) => handleInputChange('dpa', e.target.value)}
                        disabled={!isEditing}
                        InputLabelProps={{ shrink: true }}
                        helperText="Calculée automatiquement (DDR + 280 jours)"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Grossesses Antérieures
                    </Typography>
                    {isEditing && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Add />}
                        onClick={handleAddGrossesseAnterieure}
                      >
                        Ajouter
                      </Button>
                    )}
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Année</TableCell>
                          <TableCell>Évolution</TableCell>
                          <TableCell>Poids</TableCell>
                          <TableCell>Sexe</TableCell>
                          <TableCell>État</TableCell>
                          {isEditing && <TableCell>Actions</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {grossessesAnterieures.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography variant="body2" color="text.secondary">
                                Aucune grossesse antérieure enregistrée
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          grossessesAnterieures.map((grossesse, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {isEditing ? (
                                  <TextField
                                    type="number"
                                    value={grossesse.annee}
                                    onChange={(e) => handleUpdateGrossesseAnterieure(index, 'annee', parseInt(e.target.value) || new Date().getFullYear())}
                                    size="small"
                                    inputProps={{ min: 1900, max: new Date().getFullYear() }}
                                  />
                                ) : (
                                  grossesse.annee
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <TextField
                                    value={grossesse.evolution}
                                    onChange={(e) => handleUpdateGrossesseAnterieure(index, 'evolution', e.target.value)}
                                    size="small"
                                  />
                                ) : (
                                  grossesse.evolution
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <TextField
                                    type="number"
                                    value={grossesse.poids}
                                    onChange={(e) => handleUpdateGrossesseAnterieure(index, 'poids', parseFloat(e.target.value) || undefined)}
                                    size="small"
                                    inputProps={{ step: 0.1, min: 0 }}
                                  />
                                ) : (
                                  grossesse.poids
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <FormControl size="small" fullWidth>
                                    <Select
                                      value={grossesse.sexe}
                                      onChange={(e) => handleUpdateGrossesseAnterieure(index, 'sexe', e.target.value)}
                                    >
                                      <MenuItem value="Masculin">Masculin</MenuItem>
                                      <MenuItem value="Féminin">Féminin</MenuItem>
                                      <MenuItem value="Inconnu">Inconnu</MenuItem>
                                    </Select>
                                  </FormControl>
                                ) : (
                                  grossesse.sexe
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <TextField
                                    value={grossesse.etat_enfants}
                                    onChange={(e) => handleUpdateGrossesseAnterieure(index, 'etat_enfants', e.target.value)}
                                    size="small"
                                  />
                                ) : (
                                  grossesse.etat_enfants
                                )}
                              </TableCell>
                              {isEditing && (
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteGrossesseAnterieure(index)}
                                    color="error"
                                  >
                                    <Delete />
                                  </IconButton>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Facteurs de Surveillance */}
        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Facteurs de Surveillance
              </Typography>
              <FormGroup>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.age_inferieur_16}
                          onChange={(e) => handleCheckboxChange('age_inferieur_16', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Âge < 16 ans"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.age_superieur_35}
                          onChange={(e) => handleCheckboxChange('age_superieur_35', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Âge > 35 ans"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.taille_inferieure_150}
                          onChange={(e) => handleCheckboxChange('taille_inferieure_150', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Taille < 1,50 m"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.parite_superieure_6}
                          onChange={(e) => handleCheckboxChange('parite_superieure_6', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Parité ≥ 6"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.cesarienne_dernier_accouchement}
                          onChange={(e) => handleCheckboxChange('cesarienne_dernier_accouchement', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Césarienne au dernier accouchement"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.mort_ne_dernier_accouchement}
                          onChange={(e) => handleCheckboxChange('mort_ne_dernier_accouchement', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Mort-né au dernier accouchement"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.drepanocytose_ss_sc}
                          onChange={(e) => handleCheckboxChange('drepanocytose_ss_sc', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Drépanocytose SS ou SC"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.hta_connue}
                          onChange={(e) => handleCheckboxChange('hta_connue', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="HTA connue"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.fausses_couches_repetees}
                          onChange={(e) => handleCheckboxChange('fausses_couches_repetees', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Fausses couches répétées"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.diabete}
                          onChange={(e) => handleCheckboxChange('diabete', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Diabète"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Autres facteurs"
                      value={formData.autres_facteurs}
                      onChange={(e) => handleInputChange('autres_facteurs', e.target.value)}
                      disabled={!isEditing}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </FormGroup>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Onglet Examens Complémentaires */}
        <TabPanel value={activeTab} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Examens Complémentaires
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Groupe sanguin</InputLabel>
                    <Select
                      value={formData.examen_groupe_sanguin}
                      onChange={(e) => handleInputChange('examen_groupe_sanguin', e.target.value)}
                      disabled={!isEditing}
                      label="Groupe sanguin"
                    >
                      <MenuItem value="A">A</MenuItem>
                      <MenuItem value="B">B</MenuItem>
                      <MenuItem value="AB">AB</MenuItem>
                      <MenuItem value="O">O</MenuItem>
                      <MenuItem value="Inconnu">Inconnu</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Rhésus</InputLabel>
                    <Select
                      value={formData.examen_rhesus}
                      onChange={(e) => handleInputChange('examen_rhesus', e.target.value)}
                      disabled={!isEditing}
                      label="Rhésus"
                    >
                      <MenuItem value="Positif">Positif</MenuItem>
                      <MenuItem value="Négatif">Négatif</MenuItem>
                      <MenuItem value="Inconnu">Inconnu</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Test de Coombs indirect"
                    value={formData.test_coombs_indirect}
                    onChange={(e) => handleInputChange('test_coombs_indirect', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="TPHA"
                    value={formData.tpha}
                    onChange={(e) => handleInputChange('tpha', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="VDRL"
                    value={formData.vdrl}
                    onChange={(e) => handleInputChange('vdrl', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="HIV1 / HIV2"
                    value={formData.hiv1_hiv2}
                    onChange={(e) => handleInputChange('hiv1_hiv2', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="ECBU"
                    value={formData.ecbu}
                    onChange={(e) => handleInputChange('ecbu', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Taux d'hémoglobine (g/dL)"
                    type="number"
                    value={formData.taux_hemoglobine || ''}
                    onChange={(e) => handleInputChange('taux_hemoglobine', parseFloat(e.target.value) || undefined)}
                    disabled={!isEditing}
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Hématocrite (%)"
                    type="number"
                    value={formData.hematocrite || ''}
                    onChange={(e) => handleInputChange('hematocrite', parseFloat(e.target.value) || undefined)}
                    disabled={!isEditing}
                    inputProps={{ step: 0.1, min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Plaquettes"
                    type="number"
                    value={formData.plaquettes || ''}
                    onChange={(e) => handleInputChange('plaquettes', parseInt(e.target.value) || undefined)}
                    disabled={!isEditing}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Électrophorèse d'hémoglobine"
                    value={formData.electrophorese_hemoglobine}
                    onChange={(e) => handleInputChange('electrophorese_hemoglobine', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Toxoplasmose IgG"
                    value={formData.toxoplasmose_igg}
                    onChange={(e) => handleInputChange('toxoplasmose_igg', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Toxoplasmose IgM"
                    value={formData.toxoplasmose_igm}
                    onChange={(e) => handleInputChange('toxoplasmose_igm', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Rubéole IgG"
                    value={formData.rubeole_igg}
                    onChange={(e) => handleInputChange('rubeole_igg', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Glycémie à jeun (g/L)"
                    type="number"
                    value={formData.glycemic_jeun || ''}
                    onChange={(e) => handleInputChange('glycemic_jeun', parseFloat(e.target.value) || undefined)}
                    disabled={!isEditing}
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="GP75 (g/L)"
                    type="number"
                    value={formData.gp75 || ''}
                    onChange={(e) => handleInputChange('gp75', parseFloat(e.target.value) || undefined)}
                    disabled={!isEditing}
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Hépatite B (à partir de 6 mois)"
                    value={formData.hepatite_b}
                    onChange={(e) => handleInputChange('hepatite_b', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Autres examens"
                    value={formData.autres_examens}
                    onChange={(e) => handleInputChange('autres_examens', e.target.value)}
                    disabled={!isEditing}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Onglet VIH / Syphilis */}
        <TabPanel value={activeTab} index={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Section VIH / Syphilis
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        VIH
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.vih}
                            onChange={(e) => {
                              handleCheckboxChange('vih', e.target.checked);
                              if (!e.target.checked) {
                                handleCheckboxChange('mise_sous_arv', false);
                              }
                            }}
                            disabled={!isEditing}
                          />
                        }
                        label="VIH : Oui"
                      />
                      {formData.vih && (
                        <Box sx={{ mt: 2 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData.mise_sous_arv}
                                onChange={(e) => handleCheckboxChange('mise_sous_arv', e.target.checked)}
                                disabled={!isEditing}
                              />
                            }
                            label="Mise sous ARV : Oui"
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Syphilis
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.syphilis}
                            onChange={(e) => {
                              handleCheckboxChange('syphilis', e.target.checked);
                              if (!e.target.checked) {
                                handleCheckboxChange('mise_sous_ctm', false);
                              }
                            }}
                            disabled={!isEditing}
                          />
                        }
                        label="Syphilis : Oui"
                      />
                      {formData.syphilis && (
                        <Box sx={{ mt: 2 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData.mise_sous_ctm}
                                onChange={(e) => handleCheckboxChange('mise_sous_ctm', e.target.checked)}
                                disabled={!isEditing}
                              />
                            }
                            label="Mise sous CTM : Oui"
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    disabled={!isEditing}
                    multiline
                    rows={4}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DossierMaternite;
