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
  Payment,
} from '@mui/icons-material';
import {
  DispensationService,
  DispensationFormData,
  DispensationLigne,
  PrescriptionActive,
  LotDisponible,
} from '../../services/dispensationService';
import { MedicamentService } from '../../services/medicamentService';
import { AssuranceService, Assurance } from '../../services/assuranceService';
import { supabase } from '../../services/supabase';
import { useMedicaments } from '../../hooks/useMedicaments';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [selectedAssurance, setSelectedAssurance] = useState<Assurance | null>(null);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const roundXof = (value: number) => Math.round(value);

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

  // Liste complète des médicaments (source pour la recherche)
  const [medicamentsComplet, setMedicamentsComplet] = useState<any[]>([]);
  // Résultats de recherche affichés dans l'Autocomplete (filtrés depuis medicamentsComplet)
  const [medicamentsRecherches, setMedicamentsRecherches] = useState<any[]>([]);
  const [rechercheMedicament, setRechercheMedicament] = useState<string>('');

  // Utiliser le hook centralisé pour les médicaments
  const { medicaments: allMedicaments } = useMedicaments({ autoRefresh: true });

  // Charger tous les médicaments disponibles au démarrage
  useEffect(() => {
    if (open) {
      chargerTousMedicaments();
      chargerAssurances();
    }
  }, [open, allMedicaments]);

  // Re-filtrer quand medicamentsComplet change (ex: après chargement) et qu'une recherche est en cours
  useEffect(() => {
    if (rechercheMedicament && rechercheMedicament.length > 0 && medicamentsComplet.length > 0) {
      const termeLower = rechercheMedicament.toLowerCase();
      const resultats = medicamentsComplet.filter((med: any) =>
        med.nom?.toLowerCase().includes(termeLower) ||
        med.code?.toLowerCase().includes(termeLower) ||
        med.dci?.toLowerCase().includes(termeLower)
      );
      setMedicamentsRecherches(resultats);
    }
  }, [medicamentsComplet, rechercheMedicament]);

  const chargerAssurances = async () => {
    try {
      const list = await AssuranceService.getAssurancesActives();
      setAssurances(list);
    } catch (e) {
      console.warn('Erreur chargement assurances (non bloquant):', e);
      setAssurances([]);
    }
  };

  const chargerTousMedicaments = async () => {
    try {
      // Utiliser les médicaments du hook (déjà chargés et à jour)
      if (!allMedicaments || allMedicaments.length === 0) {
        console.log('Aucun médicament disponible');
        setMedicamentsComplet([]);
        setMedicamentsRecherches([]);
        return;
      }

      // Charger les lots disponibles dans le magasin détail pour enrichir avec les quantités
      const { data: lotsDetail, error: lotsError } = await supabase
        .from('lots')
        .select(`
          medicament_id,
          quantite_disponible
        `)
        .eq('magasin', 'detail')
        .eq('statut', 'actif')
        .gt('quantite_disponible', 0);

      // Créer un map des quantités par médicament
      const quantitesMap = new Map<string, number>();
      if (!lotsError && lotsDetail) {
        lotsDetail.forEach((lot: any) => {
          const existing = quantitesMap.get(lot.medicament_id) || 0;
          quantitesMap.set(lot.medicament_id, existing + lot.quantite_disponible);
        });
      }

      // Enrichir les médicaments avec les quantités disponibles
      const medsEnrichis = allMedicaments.map((med: any) => ({
        ...med,
        prix_unitaire_detail: med.prix_unitaire_detail || med.prix_unitaire || 0,
        quantite_stock: quantitesMap.get(med.id) || 0,
      }));

      setMedicamentsComplet(medsEnrichis);
      setMedicamentsRecherches(medsEnrichis);
      console.log('Médicaments chargés:', medsEnrichis.length, 'avec stock:', Array.from(quantitesMap.keys()).length);
    } catch (err: any) {
      console.error('Erreur lors du chargement des médicaments:', err);
      const medsFallback = allMedicaments.map((med: any) => ({
        ...med,
        prix_unitaire_detail: med.prix_unitaire_detail || med.prix_unitaire || 0,
        quantite_stock: 0,
      }));
      setMedicamentsComplet(medsFallback);
      setMedicamentsRecherches(medsFallback);
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

  // Rafraîchir automatiquement si paiement/ordonnance change (temps réel)
  useEffect(() => {
    if (!open || !selectedPatient?.id) return;

    const channel = supabase
      .channel('dispensation-prescriptions-payment-gate')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'factures' },
        () => chargerPrescriptionsActives(selectedPatient.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions' },
        () => chargerPrescriptionsActives(selectedPatient.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, selectedPatient?.id]);

  // Si les assurances se chargent après le patient, tenter l'auto-mapping couverture_sante
  useEffect(() => {
    if (!open) return;
    if (!selectedPatient) return;
    if (formData.assurance_id) return; // l'utilisateur a déjà choisi
    const couverture = (selectedPatient.couverture_sante || 'Aucun') as string;
    const couvertureNorm = couverture.toLowerCase();
    if (couvertureNorm === 'aucun') return;
    const match = assurances.find(a => a.nom.toLowerCase() === couvertureNorm) || null;
    if (match) {
      setSelectedAssurance(match);
      setFormData(prev => ({
        ...prev,
        assurance_id: match.id,
        assurance_nom: match.nom,
        taux_couverture: Number(match.taux_couverture_defaut || 0),
        plafond_assurance: match.plafond ?? undefined,
      }));
    }
  }, [assurances, open, selectedPatient, formData.assurance_id]);

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

        // Pré-sélection assurance (compatibilité avec patients.couverture_sante)
        const couverture = (data.couverture_sante || 'Aucun') as string;
        const couvertureNorm = couverture.toLowerCase();
        if (couvertureNorm !== 'aucun') {
          const match = assurances.find(a => a.nom.toLowerCase() === couvertureNorm) || null;
          setSelectedAssurance(match);
          if (match) {
            setFormData(prev => ({
              ...prev,
              assurance_id: match.id,
              assurance_nom: match.nom,
              taux_couverture: Number(match.taux_couverture_defaut || 0),
              plafond_assurance: match.plafond ?? undefined,
            }));
          }
        } else {
          setSelectedAssurance(null);
          setFormData(prev => ({
            ...prev,
            assurance_id: undefined,
            assurance_nom: undefined,
            taux_couverture: undefined,
            plafond_assurance: undefined,
            reference_prise_en_charge: undefined,
          }));
        }
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
      // Afficher la liste complète
      setMedicamentsRecherches(medicamentsComplet);
      return;
    }

    // Filtrer depuis la liste complète (pas depuis medicamentsRecherches)
    const termeLower = searchTerm.toLowerCase();
    const resultats = medicamentsComplet.filter((med: any) =>
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

      // Si le médicament change, charger les lots et le prix unitaire détail
      if (updates.medicament_id && updates.medicament_id !== ligneExistante.medicament_id) {
        chargerLotsDisponibles(updates.medicament_id);
        // Mettre à jour les infos du médicament incluant le prix unitaire détail
        const medicamentTrouve = allMedicaments.find(m => m.id === updates.medicament_id) 
          || medicamentsRecherches.find(m => m.id === updates.medicament_id);
        if (medicamentTrouve) {
          ligneMiseAJour.medicament_nom = medicamentTrouve.nom;
          ligneMiseAJour.dosage = medicamentTrouve.dosage;
          ligneMiseAJour.forme = medicamentTrouve.forme;
          // Charger le prix unitaire détail du médicament
          ligneMiseAJour.prix_unitaire = medicamentTrouve.prix_unitaire_detail || medicamentTrouve.prix_unitaire || 0;
        }
      }

      // Si le lot change, mettre à jour les informations du lot (sauf le prix qui vient du médicament)
      if (updates.lot_id && updates.lot_id !== ligneExistante.lot_id) {
        const lots = lotsDisponibles[ligneMiseAJour.medicament_id] || [];
        const lotSelectionne = lots.find(l => l.id === updates.lot_id);
        if (lotSelectionne) {
          ligneMiseAJour.numero_lot = lotSelectionne.numero_lot;
          ligneMiseAJour.date_expiration = lotSelectionne.date_expiration;
          // Utiliser le prix du lot (qui devrait être le prix_unitaire_detail du médicament)
          if (lotSelectionne.prix_unitaire > 0) {
            ligneMiseAJour.prix_unitaire = lotSelectionne.prix_unitaire;
          }
        }
      }

      // S'assurer que les quantités ne sont jamais négatives
      if (ligneMiseAJour.quantite_prescite < 0) {
        ligneMiseAJour.quantite_prescite = 0;
      }
      if (ligneMiseAJour.quantite_delivree < 0) {
        ligneMiseAJour.quantite_delivree = 0;
      }
      if (ligneMiseAJour.prix_unitaire < 0) {
        ligneMiseAJour.prix_unitaire = 0;
      }

      // Calculer le prix total (toujours >= 0)
      const prixTotal = (ligneMiseAJour.quantite_delivree || 0) * (ligneMiseAJour.prix_unitaire || 0);
      ligneMiseAJour.prix_total = Math.max(0, prixTotal);

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
        assurance_id: formData.assurance_id,
        assurance_nom: formData.assurance_nom || selectedAssurance?.nom,
        taux_couverture: formData.taux_couverture,
        plafond_assurance: formData.plafond_assurance,
        reference_prise_en_charge: formData.reference_prise_en_charge,
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
    setSelectedAssurance(null);
    onClose();
  };

  const steps = ['Informations Patient', 'Lignes Médicaments', 'Validation'];

  const montantTotal = roundXof(
    (formData.lignes || []).reduce((sum, l) => sum + (l.prix_total || 0), 0)
  );
  const tauxCouverture = selectedAssurance ? clamp(Number(formData.taux_couverture || 0), 0, 100) : 0;
  const plafondAssurance = selectedAssurance ? Number(formData.plafond_assurance || 0) : 0;
  let montantAssurance = 0;
  if (selectedAssurance && tauxCouverture > 0) {
    montantAssurance = montantTotal * (tauxCouverture / 100);
    if (plafondAssurance && plafondAssurance > 0) montantAssurance = Math.min(montantAssurance, plafondAssurance);
    montantAssurance = roundXof(Math.max(0, montantAssurance));
  }
  const montantPatient = roundXof(Math.max(0, montantTotal - montantAssurance));

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

                          // Auto-mapping assurance (si possible)
                          const couverture = (newValue.couverture_sante || 'Aucun') as string;
                          const couvertureNorm = couverture.toLowerCase();
                          if (couvertureNorm !== 'aucun') {
                            const match = assurances.find(a => a.nom.toLowerCase() === couvertureNorm) || null;
                            setSelectedAssurance(match);
                            if (match) {
                              setFormData(prev => ({
                                ...prev,
                                assurance_id: match.id,
                                assurance_nom: match.nom,
                                taux_couverture: Number(match.taux_couverture_defaut || 0),
                                plafond_assurance: match.plafond ?? undefined,
                              }));
                            }
                          } else {
                            setSelectedAssurance(null);
                            setFormData(prev => ({
                              ...prev,
                              assurance_id: undefined,
                              assurance_nom: undefined,
                              taux_couverture: undefined,
                              plafond_assurance: undefined,
                              reference_prise_en_charge: undefined,
                            }));
                          }
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

                  {/* Bloc Tiers-Payant / Assurance */}
                  {selectedPatient && (
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Tiers-Payant (Assurance)
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Autocomplete
                                options={assurances}
                                getOptionLabel={(option) => option.nom}
                                value={selectedAssurance}
                                onChange={(_, newValue) => {
                                  setSelectedAssurance(newValue);
                                  if (!newValue) {
                                    setFormData(prev => ({
                                      ...prev,
                                      assurance_id: undefined,
                                      assurance_nom: undefined,
                                      taux_couverture: undefined,
                                      plafond_assurance: undefined,
                                      reference_prise_en_charge: undefined,
                                    }));
                                    return;
                                  }
                                  setFormData(prev => ({
                                    ...prev,
                                    assurance_id: newValue.id,
                                    assurance_nom: newValue.nom,
                                    taux_couverture: Number(newValue.taux_couverture_defaut || 0),
                                    plafond_assurance: newValue.plafond ?? undefined,
                                  }));
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Assurance"
                                    placeholder="Aucune / CNSS / RAMU / Mutuelle..."
                                  />
                                )}
                                noOptionsText="Aucune assurance"
                                clearOnBlur={false}
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField
                                fullWidth
                                label="Taux couverture (%)"
                                type="number"
                                value={formData.taux_couverture ?? ''}
                                onChange={(e) => {
                                  const v = clamp(Number(e.target.value || 0), 0, 100);
                                  setFormData(prev => ({ ...prev, taux_couverture: v }));
                                }}
                                inputProps={{ min: 0, max: 100, step: 1 }}
                                disabled={!selectedAssurance}
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField
                                fullWidth
                                label="Plafond (XOF)"
                                type="number"
                                value={formData.plafond_assurance ?? ''}
                                onChange={(e) => {
                                  const v = Math.max(0, Number(e.target.value || 0));
                                  setFormData(prev => ({ ...prev, plafond_assurance: v || undefined }));
                                }}
                                inputProps={{ min: 0, step: 1 }}
                                disabled={!selectedAssurance}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Référence prise en charge (optionnel)"
                                value={formData.reference_prise_en_charge ?? ''}
                                onChange={(e) =>
                                  setFormData(prev => ({ ...prev, reference_prise_en_charge: e.target.value }))
                                }
                                disabled={!selectedAssurance}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Alert severity="info">
                                Le calcul (part assurance / part patient) sera affiché à l'étape Validation.
                              </Alert>
                            </Grid>
                          </Grid>
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
                          {presc.paiement_requis && (
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                size="small"
                                color={presc.peut_delivrer ? 'success' : 'warning'}
                                label={
                                  presc.peut_delivrer
                                    ? 'Paiement OK'
                                    : `Paiement requis${presc.montant_restant != null ? ` (reste ${Number(presc.montant_restant).toLocaleString('fr-FR')} XOF)` : ''}`
                                }
                              />
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {presc.paiement_requis && !presc.peut_delivrer ? (
                            <Button
                              variant="outlined"
                              color="warning"
                              startIcon={<Payment />}
                              onClick={() =>
                                navigate('/caisse', {
                                  state: { factureId: presc.facture_id, patientId: selectedPatient?.id },
                                })
                              }
                            >
                              Aller à la Caisse
                            </Button>
                          ) : null}
                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => ajouterLigneDepuisPrescription(presc)}
                            disabled={presc.paiement_requis && !presc.peut_delivrer}
                          >
                            Ajouter
                          </Button>
                        </Box>
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
                          options={medicamentsRecherches}
                          getOptionLabel={(option: any) => `${option.nom} ${option.dosage || ''} (${option.code || ''})`}
                          value={medicamentsRecherches.find((m: any) => m.id === ligne.medicament_id) || null}
                          onChange={(_, newValue: any) => {
                            if (newValue) {
                              mettreAJourLigne(index, {
                                medicament_id: newValue.id,
                                medicament_nom: newValue.nom,
                                medicament_code: newValue.code,
                                dosage: newValue.dosage,
                                forme: newValue.forme,
                                prix_unitaire: newValue.prix_unitaire_detail || newValue.prix_unitaire || 0,
                              });
                            }
                          }}
                          onInputChange={(_, value, reason) => {
                            if (reason === 'input') {
                              setRechercheMedicament(value);
                              rechercherMedicaments(value);
                            }
                          }}
                          filterOptions={(options, { inputValue }) => {
                            if (!inputValue) return options;
                            const termeLower = inputValue.toLowerCase();
                            return options.filter((option: any) =>
                              option.nom?.toLowerCase().includes(termeLower) ||
                              option.code?.toLowerCase().includes(termeLower) ||
                              option.dci?.toLowerCase().includes(termeLower)
                            );
                          }}
                          renderOption={(props, option: any) => (
                            <Box component="li" {...props} key={option.id}>
                              <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {option.nom} {option.dosage || ''}
                                  </Typography>
                                  <Chip 
                                    size="small" 
                                    label={`${(option.prix_unitaire_detail || option.prix_unitaire || 0).toLocaleString('fr-FR')} XOF`}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ ml: 1 }}
                                  />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {option.code} • {option.forme || ''} • Stock: {option.quantite_stock || 0} {option.unite || ''}
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
                            style: { maxHeight: 350 }
                          }}
                          noOptionsText={medicamentsRecherches.length === 0 ? "Chargement des médicaments..." : "Aucun médicament trouvé"}
                          loading={medicamentsRecherches.length === 0}
                          openOnFocus
                          clearOnBlur={false}
                          selectOnFocus
                          handleHomeEndKeys
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={ligne.quantite_prescite}
                          onChange={(e) => {
                            const value = Math.max(0, parseInt(e.target.value) || 0);
                            mettreAJourLigne(index, {
                              quantite_prescite: value,
                            });
                          }}
                          inputProps={{ min: 0, step: 1 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={ligne.quantite_delivree}
                          onChange={(e) => {
                            const qty = Math.max(0, parseInt(e.target.value) || 0);
                            mettreAJourLigne(index, { quantite_delivree: qty });
                          }}
                          inputProps={{ min: 0, step: 1 }}
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
                      <strong>Assurance:</strong> {selectedAssurance ? selectedAssurance.nom : 'Aucune'}
                    </Typography>
                    {selectedAssurance && (
                      <>
                        <Typography variant="body2">
                          <strong>Taux:</strong> {tauxCouverture}%
                        </Typography>
                        <Typography variant="body2">
                          <strong>Plafond:</strong>{' '}
                          {plafondAssurance && plafondAssurance > 0 ? `${plafondAssurance.toLocaleString('fr-FR')} XOF` : 'Aucun'}
                        </Typography>
                        {formData.reference_prise_en_charge && (
                          <Typography variant="body2">
                            <strong>Référence:</strong> {formData.reference_prise_en_charge}
                          </Typography>
                        )}
                      </>
                    )}
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
                      {montantTotal.toLocaleString('fr-FR')} XOF
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="body2">
                      <strong>Part Assurance:</strong> {montantAssurance.toLocaleString('fr-FR')} XOF
                    </Typography>
                    <Typography variant="body2">
                      <strong>À payer (Patient):</strong> {montantPatient.toLocaleString('fr-FR')} XOF
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
                            {ligne.prix_total.toLocaleString('fr-FR')} XOF
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

