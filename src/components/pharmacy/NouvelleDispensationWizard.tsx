import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Autocomplete,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  Delete,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Person,
  Medication,
  CheckCircleOutline,
  Close,
  Search,
} from '@mui/icons-material';
import {
  DispensationService,
  DispensationFormData,
  DispensationLigne,
  PrescriptionActive,
  LotDisponible,
} from '../../services/dispensationService';
import { MedicamentService } from '../../services/medicamentService';
import { supabase } from '../../services/supabase';

interface NouvelleDispensationWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  utilisateurId: string;
  utilisateurNom?: string;
  patientIdPreRempli?: string;
  consultationIdPreRempli?: string;
}

const NouvelleDispensationWizard: React.FC<NouvelleDispensationWizardProps> = ({
  open,
  onClose,
  onSuccess,
  utilisateurId,
  utilisateurNom,
  patientIdPreRempli,
  consultationIdPreRempli,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // État du formulaire
  const [formData, setFormData] = useState<Partial<DispensationFormData>>({
    type_dispensation: 'patient',
    lignes: [],
  });

  // États pour la recherche de patient
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientsFound, setPatientsFound] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  // États pour les prescriptions
  const [prescriptionsActives, setPrescriptionsActives] = useState<PrescriptionActive[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionActive | null>(null);

  // États pour les lots
  const [lotsDisponibles, setLotsDisponibles] = useState<Record<string, LotDisponible[]>>({});

  // États pour la recherche de médicaments
  const [medicamentsRecherches, setMedicamentsRecherches] = useState<any[]>([]);
  const [allMedicaments, setAllMedicaments] = useState<any[]>([]);
  const [rechercheMedicament, setRechercheMedicament] = useState<string>('');

  // Charger tous les médicaments disponibles au démarrage
  useEffect(() => {
    if (open) {
      chargerTousMedicaments();
    }
  }, [open]);

  const chargerTousMedicaments = async () => {
    try {
      const medicaments = await MedicamentService.getAllMedicaments();
      setAllMedicaments(medicaments);
      setMedicamentsRecherches(medicaments);
    } catch (err: any) {
      console.error('Erreur lors du chargement des médicaments:', err);
    }
  };

  // Charger le patient pré-rempli si fourni
  useEffect(() => {
    if (patientIdPreRempli && open) {
      chargerPatient(patientIdPreRempli);
    }
  }, [patientIdPreRempli, open]);

  // Charger les prescriptions actives quand un patient est sélectionné
  useEffect(() => {
    if (selectedPatient?.id && open) {
      chargerPrescriptionsActives(selectedPatient.id);
    }
  }, [selectedPatient?.id, open]);

  const chargerPatient = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedPatient(data);
        setFormData(prev => ({
          ...prev,
          patient_id: data.id,
          patient_nom: data.nom,
          patient_prenoms: data.prenom,
          statut_prise_charge: data.couverture_sante || 'Aucun',
        }));
      }
    } catch (err: any) {
      setError(`Erreur lors du chargement du patient: ${err.message}`);
    }
  };

  const rechercherPatients = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setPatientsFound([]);
      return;
    }

    try {
      const patients = await DispensationService.rechercherPatient(searchTerm);
      setPatientsFound(patients);
    } catch (err: any) {
      setError(`Erreur lors de la recherche: ${err.message}`);
    }
  };

  const chargerPrescriptionsActives = async (patientId: string) => {
    try {
      setLoading(true);
      const prescriptions = await DispensationService.getPrescriptionsActives(patientId);
      setPrescriptionsActives(prescriptions);
    } catch (err: any) {
      setError(`Erreur lors du chargement des prescriptions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const chargerLotsDisponibles = async (medicamentId: string) => {
    try {
      const lots = await DispensationService.getLotsDisponibles(medicamentId);
      setLotsDisponibles(prev => ({
        ...prev,
        [medicamentId]: lots,
      }));
    } catch (err: any) {
      console.error(`Erreur lors du chargement des lots pour ${medicamentId}:`, err);
    }
  };

  const ajouterLigneDepuisPrescription = (prescription: PrescriptionActive) => {
    setSelectedPrescription(prescription);
    const nouvellesLignes: DispensationLigne[] = prescription.lignes.map(line => ({
      medicament_id: line.medicament_id || '',
      medicament_nom: line.nom_medicament,
      quantite_prescite: line.quantite_restante,
      quantite_delivree: 0,
      lot_id: '',
      numero_lot: '',
      date_expiration: '',
      statut: 'delivre',
      prix_unitaire: 0,
      prix_total: 0,
      prescription_line_id: line.id,
    }));

    setFormData(prev => ({
      ...prev,
      lignes: [...(prev.lignes || []), ...nouvellesLignes],
      prescription_id: prescription.id,
      consultation_id: prescription.consultation_id,
      prescripteur_nom: prescription.prescripteur_nom,
      service_prescripteur: prescription.service_prescripteur,
    }));

    // Charger les lots pour chaque médicament
    nouvellesLignes.forEach(ligne => {
      if (ligne.medicament_id) {
        chargerLotsDisponibles(ligne.medicament_id);
      }
    });
  };

  const ajouterLigneManuelle = () => {
    const nouvelleLigne: DispensationLigne = {
      medicament_id: '',
      medicament_nom: '',
      quantite_prescite: 0,
      quantite_delivree: 0,
      lot_id: '',
      numero_lot: '',
      date_expiration: '',
      statut: 'delivre',
      prix_unitaire: 0,
      prix_total: 0,
    };

    setFormData(prev => ({
      ...prev,
      lignes: [...(prev.lignes || []), nouvelleLigne],
    }));
  };

  const supprimerLigne = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lignes: prev.lignes?.filter((_, i) => i !== index) || [],
    }));
  };

  const rechercherMedicaments = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 1) {
      // Afficher tous les médicaments si pas de recherche
      setMedicamentsRecherches(allMedicaments);
      return;
    }

    // Filtrer localement pour une réponse plus rapide
    const termeLower = searchTerm.toLowerCase();
    const resultats = allMedicaments.filter(med => 
      med.nom?.toLowerCase().includes(termeLower) ||
      med.code?.toLowerCase().includes(termeLower) ||
      med.dci?.toLowerCase().includes(termeLower)
    );
    setMedicamentsRecherches(resultats);
  };

  const mettreAJourLigne = (index: number, updates: Partial<DispensationLigne>) => {
    setFormData(prev => {
      const nouvellesLignes = [...(prev.lignes || [])];
      const ligneExistante = nouvellesLignes[index];
      const ligneMiseAJour = { ...ligneExistante, ...updates };

      // Si le médicament change, charger les lots
      if (updates.medicament_id && updates.medicament_id !== ligneExistante.medicament_id) {
        chargerLotsDisponibles(updates.medicament_id);
        // Mettre à jour le nom du médicament
        const medicamentTrouve = medicamentsRecherches.find(m => m.id === updates.medicament_id);
        if (medicamentTrouve) {
          ligneMiseAJour.medicament_nom = medicamentTrouve.nom;
          ligneMiseAJour.dosage = medicamentTrouve.dosage;
          ligneMiseAJour.forme = medicamentTrouve.forme;
        }
      }

      // Si le lot change, mettre à jour les informations du lot
      if (updates.lot_id && updates.lot_id !== ligneExistante.lot_id) {
        const lots = lotsDisponibles[ligneMiseAJour.medicament_id] || [];
        const lotSelectionne = lots.find(l => l.id === updates.lot_id);
        if (lotSelectionne) {
          ligneMiseAJour.numero_lot = lotSelectionne.numero_lot;
          ligneMiseAJour.date_expiration = lotSelectionne.date_expiration;
          ligneMiseAJour.prix_unitaire = lotSelectionne.prix_unitaire;
        }
      }

      // Calculer le prix total
      if (ligneMiseAJour.quantite_delivree && ligneMiseAJour.prix_unitaire) {
        ligneMiseAJour.prix_total = ligneMiseAJour.quantite_delivree * ligneMiseAJour.prix_unitaire;
      }

      // Déterminer le statut automatiquement
      if (ligneMiseAJour.quantite_delivree > 0) {
        if (ligneMiseAJour.quantite_delivree < ligneMiseAJour.quantite_prescite) {
          ligneMiseAJour.statut = 'partiellement_delivre';
        } else {
          ligneMiseAJour.statut = 'delivre';
        }
      }

      nouvellesLignes[index] = ligneMiseAJour;
      return { ...prev, lignes: nouvellesLignes };
    });
  };

  const validerEtape = async (): Promise<boolean> => {
    setError(null);
    setWarnings([]);

    if (activeStep === 0) {
      // Validation étape 1: Informations patient
      if (formData.type_dispensation === 'patient' && !formData.patient_id) {
        setError('Veuillez sélectionner un patient');
        return false;
      }
      if (formData.type_dispensation === 'service' && !formData.service_id) {
        setError('Veuillez sélectionner un service');
        return false;
      }
      if (!formData.prescripteur_nom) {
        setError('Le nom du prescripteur est obligatoire');
        return false;
      }
    } else if (activeStep === 1) {
      // Validation étape 2: Médicaments
      if (!formData.lignes || formData.lignes.length === 0) {
        setError('Veuillez ajouter au moins un médicament');
        return false;
      }

      const warningsTemp: string[] = [];

      for (const ligne of formData.lignes) {
        if (!ligne.medicament_id) {
          setError(`Médicament manquant pour la ligne ${formData.lignes.indexOf(ligne) + 1}`);
          return false;
        }
        if (!ligne.lot_id) {
          setError(`Lot manquant pour ${ligne.medicament_nom}`);
          return false;
        }
        if (!ligne.numero_lot) {
          setError(`Numéro de lot manquant pour ${ligne.medicament_nom}`);
          return false;
        }
        if (!ligne.date_expiration) {
          setError(`Date d'expiration manquante pour ${ligne.medicament_nom}`);
          return false;
        }
        if (ligne.quantite_delivree <= 0) {
          setError(`Quantité délivrée invalide pour ${ligne.medicament_nom}`);
          return false;
        }
        if (ligne.quantite_delivree > ligne.quantite_prescite) {
          setError(`La quantité délivrée ne peut pas dépasser la quantité prescrite pour ${ligne.medicament_nom}`);
          return false;
        }

        // Vérifier le stock
        const verification = await DispensationService.verifierStock(
          ligne.lot_id,
          ligne.quantite_delivree
        );
        if (!verification.disponible) {
          setError(`Stock insuffisant pour ${ligne.medicament_nom}: ${verification.message}`);
          return false;
        }

        // Vérifier la date d'expiration
        const dateExpiration = new Date(ligne.date_expiration);
        const aujourdhui = new Date();
        if (dateExpiration < aujourdhui) {
          warningsTemp.push(`⚠️ Le lot ${ligne.numero_lot} de ${ligne.medicament_nom} est expiré`);
        } else {
          const joursAvantExpiration = Math.floor(
            (dateExpiration.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (joursAvantExpiration < 30) {
            warningsTemp.push(`⚠️ Le lot ${ligne.numero_lot} de ${ligne.medicament_nom} expire dans ${joursAvantExpiration} jours`);
          }
        }
      }

      setWarnings(warningsTemp);
    }

    return true;
  };

  const handleNext = async () => {
    const isValid = await validerEtape();
    if (isValid) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const dataComplet: DispensationFormData = {
        patient_id: formData.patient_id || '',
        patient_nom: formData.patient_nom || '',
        patient_prenoms: formData.patient_prenoms,
        statut_prise_charge: formData.statut_prise_charge,
        prescripteur_id: formData.prescripteur_id,
        prescripteur_nom: formData.prescripteur_nom || '',
        service_prescripteur: formData.service_prescripteur,
        consultation_id: formData.consultation_id,
        prescription_id: formData.prescription_id,
        type_dispensation: formData.type_dispensation || 'patient',
        service_id: formData.service_id,
        service_nom: formData.service_nom,
        lignes: formData.lignes || [],
        observations: formData.observations,
      };

      const dispensationCreee = await DispensationService.creerDispensation(dataComplet, utilisateurId);
      await DispensationService.validerDispensation(dispensationCreee.id, utilisateurId);

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement de la dispensation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      type_dispensation: 'patient',
      lignes: [],
    });
    setSelectedPatient(null);
    setSelectedPrescription(null);
    setPrescriptionsActives([]);
    setLotsDisponibles({});
    setError(null);
    setWarnings([]);
    setPatientSearchTerm('');
    setPatientsFound([]);
    onClose();
  };

  const steps = ['Informations Patient', 'Lignes Médicaments', 'Validation'];

  return (
    <Dialog 
      open={open} 
      onClose={(event, reason) => {
        // Empêcher la fermeture par clic extérieur ou touche Escape
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          handleClose();
        }
      }}
      disableEscapeKeyDown
      maxWidth="lg" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Medication color="primary" />
            <Typography variant="h6">Nouvelle Dispensation</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Alertes:
            </Typography>
            {warnings.map((warning, idx) => (
              <Typography key={idx} variant="body2">
                {warning}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Étape 1: Informations Patient */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informations Patient (QUI)
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Type de dispensation</InputLabel>
                  <Select
                    value={formData.type_dispensation}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        type_dispensation: e.target.value as 'patient' | 'service',
                      }))
                    }
                    label="Type de dispensation"
                  >
                    <MenuItem value="patient">Patient</MenuItem>
                    <MenuItem value="service">Service interne</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.type_dispensation === 'patient' && (
                <>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={patientsFound}
                      getOptionLabel={(option) =>
                        `${option.identifiant} - ${option.nom} ${option.prenom || ''}`
                      }
                      value={selectedPatient}
                      onChange={(_, newValue) => {
                        setSelectedPatient(newValue);
                        if (newValue) {
                          setFormData(prev => ({
                            ...prev,
                            patient_id: newValue.id,
                            patient_nom: newValue.nom,
                            patient_prenoms: newValue.prenom,
                            statut_prise_charge: newValue.couverture_sante || 'Aucun',
                          }));
                        }
                      }}
                      onInputChange={(_, value) => {
                        setPatientSearchTerm(value);
                        rechercherPatients(value);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Rechercher un patient"
                          placeholder="ID, nom ou prénom"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <Search sx={{ mr: 1 }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  {selectedPatient && (
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Patient sélectionné:
                          </Typography>
                          <Typography variant="body2">
                            <strong>ID:</strong> {selectedPatient.identifiant}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Nom:</strong> {selectedPatient.nom} {selectedPatient.prenom}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Statut:</strong> {formData.statut_prise_charge}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </>
              )}

              {formData.type_dispensation === 'service' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="ID Service"
                      value={formData.service_id || ''}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, service_id: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nom du Service"
                      value={formData.service_nom || ''}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, service_nom: e.target.value }))
                      }
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Prescripteur"
                  value={formData.prescripteur_nom || ''}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, prescripteur_nom: e.target.value }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Service Prescripteur"
                  value={formData.service_prescripteur || ''}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, service_prescripteur: e.target.value }))
                  }
                />
              </Grid>
            </Grid>

            {/* Afficher les prescriptions actives si un patient est sélectionné */}
            {selectedPatient && prescriptionsActives.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Prescriptions Actives
                </Typography>
                {prescriptionsActives.map((presc) => (
                  <Card key={presc.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1">
                            {presc.numero_prescription}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(presc.date_prescription).toLocaleDateString()} -{' '}
                            {presc.prescripteur_nom}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {presc.lignes.length} médicament(s)
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={() => ajouterLigneDepuisPrescription(presc)}
                        >
                          Ajouter
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Étape 2: Lignes Médicaments */}
        {activeStep === 1 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                <Medication sx={{ mr: 1, verticalAlign: 'middle' }} />
                Lignes Médicaments (QUOI)
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={ajouterLigneManuelle}
              >
                Ajouter un médicament
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Médicament</TableCell>
                    <TableCell align="right">Qté Prescrite</TableCell>
                    <TableCell align="right">Qté Délivrée</TableCell>
                    <TableCell>Lot</TableCell>
                    <TableCell>Date Expiration</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Prix Unitaire</TableCell>
                    <TableCell align="right">Prix Total</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.lignes?.map((ligne, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          options={medicamentsRecherches.length > 0 ? medicamentsRecherches : allMedicaments}
                          getOptionLabel={(option) => `${option.nom} ${option.dosage || ''} (${option.code || ''})`}
                          value={allMedicaments.find(m => m.id === ligne.medicament_id) || null}
                          onChange={(_, newValue) => {
                            if (newValue) {
                              mettreAJourLigne(index, {
                                medicament_id: newValue.id,
                                medicament_nom: newValue.nom,
                                medicament_code: newValue.code,
                                dosage: newValue.dosage,
                                forme: newValue.forme,
                              });
                            }
                          }}
                          onInputChange={(_, value) => {
                            setRechercheMedicament(value);
                            rechercherMedicaments(value);
                          }}
                          onOpen={() => {
                            // Afficher tous les médicaments quand on ouvre le menu
                            if (medicamentsRecherches.length === 0) {
                              setMedicamentsRecherches(allMedicaments);
                            }
                          }}
                          renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id}>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {option.nom} {option.dosage || ''}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.code} • {option.forme || ''} • Stock: {option.quantite_stock || 0}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Sélectionner un médicament"
                              sx={{ minWidth: 280 }}
                            />
                          )}
                          ListboxProps={{
                            style: { maxHeight: 300 }
                          }}
                          noOptionsText="Aucun médicament trouvé"
                          openOnFocus
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={ligne.quantite_prescite}
                          onChange={(e) =>
                            mettreAJourLigne(index, {
                              quantite_prescite: parseInt(e.target.value) || 0,
                            })
                          }
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={ligne.quantite_delivree}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 0;
                            mettreAJourLigne(index, { quantite_delivree: qty });
                          }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={ligne.lot_id}
                            onChange={(e) =>
                              mettreAJourLigne(index, { lot_id: e.target.value })
                            }
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Sélectionner</em>
                            </MenuItem>
                            {(lotsDisponibles[ligne.medicament_id] || []).map((lot) => (
                              <MenuItem key={lot.id} value={lot.id}>
                                {lot.numero_lot} ({lot.quantite_disponible} dispo.)
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="date"
                          value={ligne.date_expiration}
                          InputLabelProps={{ shrink: true }}
                          disabled
                          sx={{ width: 150 }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={ligne.statut}
                            onChange={(e) =>
                              mettreAJourLigne(index, {
                                statut: e.target.value as DispensationLigne['statut'],
                              })
                            }
                          >
                            <MenuItem value="delivre">Délivré</MenuItem>
                            <MenuItem value="partiellement_delivre">
                              Partiellement délivré
                            </MenuItem>
                            <MenuItem value="substitution">Substitution</MenuItem>
                            <MenuItem value="rupture">Rupture</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="right">
                        {ligne.prix_unitaire.toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell align="right">
                        {ligne.prix_total.toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell>
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
                </TableBody>
              </Table>
            </TableContainer>

            {formData.lignes?.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Aucun médicament ajouté. Cliquez sur "Ajouter un médicament" ou sélectionnez une
                prescription active.
              </Alert>
            )}
          </Box>
        )}

        {/* Étape 3: Validation */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              <CheckCircleOutline sx={{ mr: 1, verticalAlign: 'middle' }} />
              Validation / Traçabilité (QUAND)
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Informations Patient
                    </Typography>
                    <Typography variant="body2">
                      <strong>Patient:</strong> {formData.patient_nom} {formData.patient_prenoms}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Statut:</strong> {formData.statut_prise_charge}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Prescripteur:</strong> {formData.prescripteur_nom}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Service:</strong> {formData.service_prescripteur || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Traçabilité
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {new Date().toLocaleString('fr-FR')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Agent:</strong> {utilisateurNom || utilisateurId}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Nombre de lignes:</strong> {formData.lignes?.length || 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total:</strong>{' '}
                      {formData.lignes
                        ?.reduce((sum, l) => sum + l.prix_total, 0)
                        .toLocaleString('fr-FR')}{' '}
                      FCFA
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observations (optionnel)"
                  multiline
                  rows={3}
                  value={formData.observations || ''}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, observations: e.target.value }))
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Médicament</TableCell>
                        <TableCell align="right">Qté Délivrée</TableCell>
                        <TableCell>Lot</TableCell>
                        <TableCell>Date Expiration</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell align="right">Prix Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.lignes?.map((ligne, index) => (
                        <TableRow key={index}>
                          <TableCell>{ligne.medicament_nom}</TableCell>
                          <TableCell align="right">{ligne.quantite_delivree}</TableCell>
                          <TableCell>{ligne.numero_lot}</TableCell>
                          <TableCell>
                            {new Date(ligne.date_expiration).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ligne.statut}
                              size="small"
                              color={
                                ligne.statut === 'delivre'
                                  ? 'success'
                                  : ligne.statut === 'rupture'
                                  ? 'error'
                                  : 'warning'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            {ligne.prix_total.toLocaleString('fr-FR')} FCFA
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Retour
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained" disabled={loading}>
            Suivant
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={<CheckCircle />}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer la Dispensation'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NouvelleDispensationWizard;

