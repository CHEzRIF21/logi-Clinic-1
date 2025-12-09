
import React, { useState } from 'react';
import {
  Box, Typography, Grid, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, Stepper, Step, StepLabel, StepContent, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, InputAdornment, Avatar, Divider, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Checkbox, FormControlLabel,
} from '@mui/material';
import {
  Search, MedicalServices, Add, Save, Close, Thermostat, MonitorWeight, Height,
  Bloodtype, Check, Edit, Visibility, Print, Refresh,
} from '@mui/icons-material';
import { mockPatients, mockConsultations, mockUsers } from '../data/mockData';

const Consultation: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openNewConsultation, setOpenNewConsultation] = useState(false);
  const [consultations, setConsultations] = useState(mockConsultations);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

  const [consultationData, setConsultationData] = useState({
    patientId: '',
    patientName: '',
    medecinId: '',
    medecinName: '',
    date: new Date().toISOString().split('T')[0],
    heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    type: '',
    motif: '',
    parametresVitaux: {
      temperature: '',
      tension: '',
      frequenceCardiaque: '',
      frequenceRespiratoire: '',
      poids: '',
      taille: '',
      imc: '',
      glycemie: '',
      saturation: ''
    },
    examenClinique: {
      typePrincipal: '',
      examensAssocies: '',
      commentaires: '',
      diagnostic: ''
    },
    prescriptions: [],
    examensComplementaires: [],
    recommandations: {
      repos: false,
      suiviJours: '',
      referer: false,
      specialite: '',
      commentaires: ''
    },
    statut: 'en_cours',
    montant: 0,
    paiement: 'non_payé'
  });

  // Filtrage des patients
  const filteredPatients = mockPatients.filter(patient =>
    patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.identifiant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Médecins disponibles
  const medecins = mockUsers.filter(user => user.role === 'medecin');

  const steps = [
    { label: 'Sélection du patient', description: 'Rechercher et sélectionner le patient' },
    { label: 'Informations consultation', description: 'Définir le type, motif et le médecin' },
    { label: 'Paramètres vitaux (déplacé)', description: 'Les constantes se saisissent désormais lors de l’enregistrement du patient' },
    { label: 'Examen clinique', description: 'Saisie du diagnostic et examens' },
    { label: 'Prescription et examens complémentaires', description: 'Ajouter médicaments et examens' },
    { label: 'Recommandations et finalisation', description: 'Définir les suivis et références' },
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setConsultationData({
      patientId: '',
      patientName: '',
      medecinId: '',
      medecinName: '',
      date: new Date().toISOString().split('T')[0],
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: '',
      motif: '',
      parametresVitaux: {
        temperature: '',
        tension: '',
        frequenceCardiaque: '',
        frequenceRespiratoire: '',
        poids: '',
        taille: '',
        imc: '',
        glycemie: '',
        saturation: ''
      },
      examenClinique: {
        typePrincipal: '',
        examensAssocies: '',
        commentaires: '',
        diagnostic: ''
      },
      prescriptions: [],
      examensComplementaires: [],
      recommandations: {
        repos: false,
        suiviJours: '',
        referer: false,
        specialite: '',
        commentaires: ''
      },
      statut: 'en_cours',
      montant: 0,
      paiement: 'non_payé'
    });
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setConsultationData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: `${patient.prenom} ${patient.nom}`
    }));
    setOpenNewConsultation(false);
  };

  const handleSaveConsultation = () => {
    const newConsultation = {
      id: `CONS-${Date.now()}`,
      patient: consultationData.patientName,
      patientId: consultationData.patientId,
      medecin: consultationData.medecinName,
      medecinId: consultationData.medecinId,
      date: consultationData.date,
      heure: consultationData.heure,
      type: consultationData.type,
      statut: 'terminée',
      motif: consultationData.motif,
      diagnostic: consultationData.examenClinique.diagnostic,
      prescription: consultationData.prescriptions.length > 0 ? consultationData.prescriptions.map(p => `${p.medicament} - ${p.posologie}`).join(', ') : 'Aucune prescription',
      montant: 15000,
      paiement: 'non_payé'
    };

    setConsultations(prev => [newConsultation, ...prev]);
    setSnackbar({ open: true, message: 'Consultation enregistrée avec succès', severity: 'success' });
    setOpenNewConsultation(false);
    setActiveStep(0);
    setSelectedPatient(null);
    handleReset();
  };

  const calculateIMC = (poids: string, taille: string) => {
    if (poids && taille) {
      const poidsNum = parseFloat(poids);
      const tailleNum = parseFloat(taille) / 100;
      const imc = poidsNum / (tailleNum * tailleNum);
      return imc.toFixed(1);
    }
    return '';
  };

  const handleParametresVitauxChange = (field: string, value: string) => {
    const newParametres = { ...consultationData.parametresVitaux, [field]: value };
    
    if (field === 'poids' || field === 'taille') {
      const poids = field === 'poids' ? value : consultationData.parametresVitaux.poids;
      const taille = field === 'taille' ? value : consultationData.parametresVitaux.taille;
      newParametres.imc = calculateIMC(poids, taille);
    }
    
    setConsultationData({
      ...consultationData,
      parametresVitaux: newParametres
    });
  };

  const renderStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Recherche de patient</Typography>
            <TextField
              fullWidth
              placeholder="Rechercher un patient..."
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
            {filteredPatients.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Résultats de recherche :</Typography>
                {filteredPatients.map((patient) => (
                  <Card key={patient.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => handlePatientSelect(patient)}>
                    <CardContent sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {patient.prenom.charAt(0)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1">
                            {patient.prenom} {patient.nom}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {patient.identifiant} | Âge: {patient.age} ans | Tél: {patient.telephone}
                          </Typography>
                        </Box>
                        <Chip label={patient.statut} color={patient.statut === 'actif' ? 'success' : 'default'} size="small" />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Informations de la consultation</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date de consultation"
                  type="date"
                  value={consultationData.date}
                  onChange={(e) => setConsultationData({...consultationData, date: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Heure"
                  type="time"
                  value={consultationData.heure}
                  onChange={(e) => setConsultationData({...consultationData, heure: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type de consultation</InputLabel>
                  <Select
                    value={consultationData.type}
                    onChange={(e) => setConsultationData({...consultationData, type: e.target.value})}
                  >
                    <MenuItem value="premiere">Première fois</MenuItem>
                    <MenuItem value="controle">Contrôle</MenuItem>
                    <MenuItem value="specialisee">Consultation spécialisée</MenuItem>
                    <MenuItem value="urgence">Urgence</MenuItem>
                    <MenuItem value="reference">Référence</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Médecin traitant</InputLabel>
                  <Select
                    value={consultationData.medecinId}
                    onChange={(e) => {
                      const medecin = medecins.find(m => m.id === e.target.value);
                      setConsultationData({
                        ...consultationData, 
                        medecinId: e.target.value,
                        medecinName: medecin ? `${medecin.prenom} ${medecin.nom}` : ''
                      });
                    }}
                  >
                    {medecins.map((medecin) => (
                      <MenuItem key={medecin.id} value={medecin.id}>
                        {medecin.prenom} {medecin.nom} - {medecin.specialite}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motif de consultation"
                  multiline
                  rows={3}
                  value={consultationData.motif}
                  onChange={(e) => setConsultationData({...consultationData, motif: e.target.value})}
                  placeholder="Décrivez le motif de la consultation..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Paramètres vitaux</Typography>
            <Alert severity="info" sx={{ mt: 1 }}>
              La saisie des signes vitaux a été déplacée vers l’enregistrement du patient. Ouvrez la fiche patient et renseignez la section "Signes Vitaux" lors de la création/modification.
            </Alert>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Examen clinique</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Type principal"
                  value={consultationData.examenClinique.typePrincipal}
                  onChange={(e) => setConsultationData({
                    ...consultationData,
                    examenClinique: {...consultationData.examenClinique, typePrincipal: e.target.value}
                  })}
                  placeholder="Ex: Paludisme simple, Hypertension, Diabète..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Diagnostic"
                  value={consultationData.examenClinique.diagnostic}
                  onChange={(e) => setConsultationData({
                    ...consultationData,
                    examenClinique: {...consultationData.examenClinique, diagnostic: e.target.value}
                  })}
                  placeholder="Diagnostic principal..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Examens associés"
                  value={consultationData.examenClinique.examensAssocies}
                  onChange={(e) => setConsultationData({
                    ...consultationData,
                    examenClinique: {...consultationData.examenClinique, examensAssocies: e.target.value}
                  })}
                  placeholder="Ex: Anémie modérée, Déshydratation..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Commentaires cliniques"
                  value={consultationData.examenClinique.commentaires}
                  onChange={(e) => setConsultationData({
                    ...consultationData,
                    examenClinique: {...consultationData.examenClinique, commentaires: e.target.value}
                  })}
                  placeholder="Observations cliniques détaillées..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Prescription et examens complémentaires</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Médicaments prescrits"
                  multiline
                  rows={3}
                  placeholder="Ex: Paracétamol 500mg - 6 comprimés pendant 3 jours"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Examens complémentaires"
                  multiline
                  rows={2}
                  placeholder="Ex: Analyse sanguine, Radiographie..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Recommandations et finalisation</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={consultationData.recommandations.repos}
                      onChange={(e) => setConsultationData({
                        ...consultationData,
                        recommandations: {...consultationData.recommandations, repos: e.target.checked}
                      })}
                    />
                  }
                  label="Repos recommandé"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Suivi dans X jours"
                  value={consultationData.recommandations.suiviJours}
                  onChange={(e) => setConsultationData({
                    ...consultationData,
                    recommandations: {...consultationData.recommandations, suiviJours: e.target.value}
                  })}
                  placeholder="Ex: 7 jours"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={consultationData.recommandations.referer}
                      onChange={(e) => setConsultationData({
                        ...consultationData,
                        recommandations: {...consultationData.recommandations, referer: e.target.checked}
                      })}
                    />
                  }
                  label="Référence vers spécialiste"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Spécialité de référence"
                  value={consultationData.recommandations.specialite}
                  onChange={(e) => setConsultationData({
                    ...consultationData,
                    recommandations: {...consultationData.recommandations, specialite: e.target.value}
                  })}
                  placeholder="Ex: Cardiologie, Dermatologie..."
                  disabled={!consultationData.recommandations.referer}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Commentaires et recommandations"
                  value={consultationData.recommandations.commentaires}
                  onChange={(e) => setConsultationData({
                    ...consultationData,
                    recommandations: {...consultationData.recommandations, commentaires: e.target.value}
                  })}
                  placeholder="Recommandations détaillées pour le patient..."
                />
              </Grid>
            </Grid>

            {/* Résumé de la consultation */}
            <Card sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>Résumé de la consultation</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Patient:</strong> {consultationData.patientName}</Typography>
                  <Typography variant="body2"><strong>Médecin:</strong> {consultationData.medecinName}</Typography>
                  <Typography variant="body2"><strong>Type:</strong> {consultationData.type}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Montant estimé:</strong> 15 000 FCFA</Typography>
                </Grid>
              </Grid>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <MedicalServices sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Consultation médicale
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestion des consultations et suivi des patients
          </Typography>
        </Box>
      </Box>

      {/* Barre de recherche et sélection patient */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Rechercher un patient par nom, prénom ou identifiant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenNewConsultation(true)}
          >
            Nouvelle consultation
          </Button>
        </Box>

        {selectedPatient && (
          <Card sx={{ mt: 2, bgcolor: 'primary.50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {selectedPatient.prenom.charAt(0)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">
                    {selectedPatient.prenom} {selectedPatient.nom}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {selectedPatient.identifiant} | Âge: {selectedPatient.age} ans | Tél: {selectedPatient.telephone}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => setSelectedPatient(null)}
                  startIcon={<Close />}
                >
                  Changer
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Paper>

      {/* Liste des consultations */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Consultations récentes</Typography>
          <Button startIcon={<Refresh />} onClick={() => setSnackbar({ open: true, message: 'Liste actualisée', severity: 'info' })}>
            Actualiser
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Médecin</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Montant</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {consultations.slice(0, 10).map((consultation) => (
                <TableRow key={consultation.id}>
                  <TableCell>{consultation.patient}</TableCell>
                  <TableCell>{consultation.medecin}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{consultation.date}</Typography>
                      <Typography variant="caption" color="text.secondary">{consultation.heure}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={consultation.type} 
                      color={consultation.type === 'Urgence' ? 'error' : consultation.type === 'Consultation spécialisée' ? 'warning' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={consultation.statut} 
                      color={consultation.statut === 'terminée' ? 'success' : consultation.statut === 'en cours' ? 'warning' : 'info'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{consultation.montant?.toLocaleString()} FCFA</TableCell>
                  <TableCell>
                    <Tooltip title="Voir">
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Imprimer">
                      <IconButton size="small">
                        <Print />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Stepper pour nouvelle consultation */}
      {selectedPatient && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Nouvelle consultation - {selectedPatient.prenom} {selectedPatient.nom}
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  optional={
                    index === steps.length - 1 ? (
                      <Typography variant="caption">Dernière étape</Typography>
                    ) : null
                  }
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  {renderStepContent(index)}
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <div>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                        startIcon={index === steps.length - 1 ? <Check /> : undefined}
                      >
                        {index === steps.length - 1 ? 'Terminer' : 'Continuer'}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Retour
                      </Button>
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          {activeStep === steps.length && (
            <Paper square elevation={0} sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>Toutes les étapes sont terminées</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Vous pouvez maintenant finaliser et enregistrer la consultation.
              </Typography>
              <Button onClick={handleReset} sx={{ mt: 1 }}>
                Recommencer
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveConsultation}
                sx={{ mt: 1, ml: 1 }}
                startIcon={<Save />}
              >
                Enregistrer la consultation
              </Button>
            </Paper>
          )}
        </Paper>
      )}

      {/* Dialogue pour nouvelle consultation */}
      <Dialog 
        open={openNewConsultation} 
        onClose={() => setOpenNewConsultation(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Add sx={{ color: 'primary.main' }} />
            <Typography variant="h6">Nouvelle consultation</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Veuillez d'abord sélectionner un patient pour commencer une nouvelle consultation.
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Rechercher un patient..."
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
          
          {filteredPatients.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Résultats de recherche :</Typography>
              {filteredPatients.map((patient) => (
                <Card key={patient.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => handlePatientSelect(patient)}>
                  <CardContent sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {patient.prenom.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">
                          {patient.prenom} {patient.nom}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {patient.identifiant} | Âge: {patient.age} ans | Tél: {patient.telephone}
                        </Typography>
                      </Box>
                      <Chip label={patient.statut} color={patient.statut === 'actif' ? 'success' : 'default'} size="small" />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
          
          {filteredPatients.length === 0 && searchTerm && (
            <Alert severity="info">
              Aucun patient trouvé avec ce critère de recherche.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewConsultation(false)}>
            Annuler
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Consultation;
