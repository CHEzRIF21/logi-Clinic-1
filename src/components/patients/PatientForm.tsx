import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Button,
  Typography,
  Divider,
  Radio,
  RadioGroup,
  FormLabel,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { Patient, PatientFormData, PatientFile } from '../../services/supabase';
import { Upload, Delete, AttachFile } from '@mui/icons-material';
import { supabase } from '../../services/supabase';
import { countries, defaultCountry, getCountryByPhoneCode } from '../../data/countries';

interface PatientFormProps {
  patient?: Patient | null;
  onSubmit: (data: PatientFormData) => Promise<Patient>;
  onCancel: () => void;
  loading?: boolean;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<PatientFormData>({
    identifiant: '',
    nom: '',
    prenom: '',
    sexe: 'Masculin',
    date_naissance: new Date().toISOString().split('T')[0],
    lieu_naissance: '',
    nationalite: defaultCountry.name,
    adresse: '',
    telephone: '',
    telephone_proche: '',
    personne_urgence: '',
    profession: '',
    situation_matrimoniale: 'Célibataire',
    couverture_sante: 'Aucun',
    groupe_sanguin: 'Inconnu',
    allergies: '',
    maladies_chroniques: '',
    statut_vaccinal: 'Inconnu',
    antecedents_medicaux: '',
    prise_medicaments_reguliers: false,
    medicaments_reguliers: '',
    service_initial: 'Médecine générale',
    statut: 'Nouveau',
    notes: '',
    // Accompagnant
    accompagnant_nom: '',
    accompagnant_prenoms: '',
    accompagnant_filiation: '',
    accompagnant_telephone: '',
    accompagnant_quartier: '',
    accompagnant_profession: '',
    // Personne à prévenir
    personne_prevenir_option: 'autre',
    personne_prevenir_nom: '',
    personne_prevenir_prenoms: '',
    personne_prevenir_filiation: '',
    personne_prevenir_telephone: '',
    personne_prevenir_quartier: '',
    personne_prevenir_profession: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileList, setFileList] = useState<PatientFile[]>([]);
  
  // États pour les codes téléphone
  const [phoneCode, setPhoneCode] = useState<string>(defaultCountry.phoneCode);
  const [phoneProcheCode, setPhoneProcheCode] = useState<string>(defaultCountry.phoneCode);
  const [accompagnantPhoneCode, setAccompagnantPhoneCode] = useState<string>(defaultCountry.phoneCode);
  const [personnePrevenirPhoneCode, setPersonnePrevenirPhoneCode] = useState<string>(defaultCountry.phoneCode);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Signes vitaux (section déplacée depuis consultation)
  const [vitalSigns, setVitalSigns] = useState<{
    temperature?: string;
    systolique?: string;
    diastolique?: string;
    frequence_cardiaque?: string;
    frequence_respiratoire?: string;
    saturation?: string;
    poids?: string;
    taille?: string;
    imc?: string;
  }>({});
  const [bmiAppreciation, setBmiAppreciation] = useState<string>('');

  // Calcul automatique IMC + appréciation OMS
  useEffect(() => {
    const poidsKg = parseFloat(vitalSigns.poids || '');
    const tailleCm = parseFloat(vitalSigns.taille || '');
    if (!isNaN(poidsKg) && !isNaN(tailleCm) && tailleCm > 0) {
      const tailleM = tailleCm / 100;
      const imcVal = poidsKg / (tailleM * tailleM);
      const imcRounded = Math.round(imcVal * 100) / 100;
      const imcStr = imcRounded.toFixed(2);
      setVitalSigns(prev => ({ ...prev, imc: imcStr }));
      let appr = '';
      if (imcRounded < 18.5) appr = 'Insuffisance pondérale';
      else if (imcRounded < 25) appr = 'Poids normal';
      else if (imcRounded < 30) appr = 'Surpoids';
      else appr = 'Obésité';
      setBmiAppreciation(appr);
    } else {
      setVitalSigns(prev => ({ ...prev, imc: undefined } as any));
      setBmiAppreciation('');
    }
  }, [vitalSigns.poids, vitalSigns.taille]);

  // Charger les fichiers du patient
  const loadPatientFiles = React.useCallback(async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_files')
        .select('*')
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFileList(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
    }
  }, []);

  // Initialiser le formulaire avec les données du patient si en mode édition
  useEffect(() => {
    if (patient) {
      setFormData({
        identifiant: patient.identifiant || '',
        nom: patient.nom || '',
        prenom: patient.prenom || '',
        sexe: patient.sexe || 'Masculin',
        date_naissance: patient.date_naissance ? new Date(patient.date_naissance).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        lieu_naissance: patient.lieu_naissance || '',
        nationalite: patient.nationalite || defaultCountry.name,
        adresse: patient.adresse || '',
        telephone: patient.telephone ? patient.telephone.replace(/^\+\d{1,4}\s*/, '') : '',
        telephone_proche: patient.telephone_proche ? patient.telephone_proche.replace(/^\+\d{1,4}\s*/, '') : '',
        personne_urgence: patient.personne_urgence || '',
        profession: patient.profession || '',
        situation_matrimoniale: patient.situation_matrimoniale || 'Célibataire',
        couverture_sante: patient.couverture_sante || 'Aucun',
        groupe_sanguin: patient.groupe_sanguin || 'Inconnu',
        allergies: patient.allergies || '',
        maladies_chroniques: patient.maladies_chroniques || '',
        statut_vaccinal: patient.statut_vaccinal || 'Inconnu',
        antecedents_medicaux: patient.antecedents_medicaux || '',
        prise_medicaments_reguliers: patient.prise_medicaments_reguliers || false,
        medicaments_reguliers: patient.medicaments_reguliers || '',
        service_initial: patient.service_initial || 'Médecine générale',
        statut: patient.statut || 'Nouveau',
        notes: patient.notes || '',
        // Accompagnant
        accompagnant_nom: patient.accompagnant_nom || '',
        accompagnant_prenoms: patient.accompagnant_prenoms || '',
        accompagnant_filiation: patient.accompagnant_filiation || '',
        accompagnant_telephone: patient.accompagnant_telephone ? patient.accompagnant_telephone.replace(/^\+\d{1,4}\s*/, '') : '',
        accompagnant_quartier: patient.accompagnant_quartier || '',
        accompagnant_profession: patient.accompagnant_profession || '',
        // Personne à prévenir
        personne_prevenir_option: patient.personne_prevenir_option || 'autre',
        personne_prevenir_nom: patient.personne_prevenir_nom || '',
        personne_prevenir_prenoms: patient.personne_prevenir_prenoms || '',
        personne_prevenir_filiation: patient.personne_prevenir_filiation || '',
        personne_prevenir_telephone: patient.personne_prevenir_telephone ? patient.personne_prevenir_telephone.replace(/^\+\d{1,4}\s*/, '') : '',
        personne_prevenir_quartier: patient.personne_prevenir_quartier || '',
        personne_prevenir_profession: patient.personne_prevenir_profession || '',
      });
      // Charger les fichiers existants
      loadPatientFiles(patient.id);
      
      // Initialiser les codes téléphone depuis les numéros existants
      if (patient.telephone) {
        const phoneCountry = getCountryByPhoneCode(patient.telephone.match(/^\+\d{1,4}/)?.[0] || '');
        if (phoneCountry) setPhoneCode(phoneCountry.phoneCode);
      }
      if (patient.telephone_proche) {
        const phoneProcheCountry = getCountryByPhoneCode(patient.telephone_proche.match(/^\+\d{1,4}/)?.[0] || '');
        if (phoneProcheCountry) setPhoneProcheCode(phoneProcheCountry.phoneCode);
      }
      if (patient.accompagnant_telephone) {
        const accompagnantCountry = getCountryByPhoneCode(patient.accompagnant_telephone.match(/^\+\d{1,4}/)?.[0] || '');
        if (accompagnantCountry) setAccompagnantPhoneCode(accompagnantCountry.phoneCode);
      }
      if (patient.personne_prevenir_telephone) {
        const personnePrevenirCountry = getCountryByPhoneCode(patient.personne_prevenir_telephone.match(/^\+\d{1,4}/)?.[0] || '');
        if (personnePrevenirCountry) setPersonnePrevenirPhoneCode(personnePrevenirCountry.phoneCode);
      }
      
      // Initialiser le code téléphone selon la nationalité
      const nationalityCountry = countries.find(c => c.name === patient.nationalite);
      if (nationalityCountry) {
        setPhoneCode(nationalityCountry.phoneCode);
        setPhoneProcheCode(nationalityCountry.phoneCode);
      }
    } else {
      // Réinitialiser le formulaire pour un nouveau patient
      setFormData({
        identifiant: '',
        nom: '',
        prenom: '',
        sexe: 'Masculin',
        date_naissance: new Date().toISOString().split('T')[0],
        lieu_naissance: '',
        nationalite: 'Ivoirien',
        adresse: '',
        telephone: '',
        telephone_proche: '',
        personne_urgence: '',
        profession: '',
        situation_matrimoniale: 'Célibataire',
        couverture_sante: 'Aucun',
        groupe_sanguin: 'Inconnu',
        allergies: '',
        maladies_chroniques: '',
        statut_vaccinal: 'Inconnu',
        antecedents_medicaux: '',
        prise_medicaments_reguliers: false,
        medicaments_reguliers: '',
        service_initial: 'Médecine générale',
        statut: 'Nouveau',
        notes: '',
        accompagnant_nom: '',
        accompagnant_prenoms: '',
        accompagnant_filiation: '',
        accompagnant_telephone: '',
        accompagnant_quartier: '',
        accompagnant_profession: '',
        personne_prevenir_option: 'autre',
        personne_prevenir_nom: '',
        personne_prevenir_prenoms: '',
        personne_prevenir_filiation: '',
        personne_prevenir_telephone: '',
        personne_prevenir_quartier: '',
        personne_prevenir_profession: '',
      });
      setFileList([]);
      setUploadedFiles([]);
    }
  }, [patient, loadPatientFiles]);


  // Gérer le changement de l'option "identique à l'accompagnant"
  useEffect(() => {
    if (formData.personne_prevenir_option === 'identique_accompagnant') {
      setFormData(prev => ({
        ...prev,
        personne_prevenir_nom: prev.accompagnant_nom || '',
        personne_prevenir_prenoms: prev.accompagnant_prenoms || '',
        personne_prevenir_filiation: prev.accompagnant_filiation || '',
        personne_prevenir_telephone: prev.accompagnant_telephone || '',
        personne_prevenir_quartier: prev.accompagnant_quartier || '',
        personne_prevenir_profession: prev.accompagnant_profession || '',
      }));
    }
  }, [formData.personne_prevenir_option, formData.accompagnant_nom, formData.accompagnant_prenoms, formData.accompagnant_filiation, formData.accompagnant_telephone, formData.accompagnant_quartier, formData.accompagnant_profession]);

  // Gérer le téléchargement de fichiers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    event.target.value = ''; // Réinitialiser l'input
  };

  // Supprimer un fichier de la liste
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Supprimer un fichier existant
  const handleDeleteExistingFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('patient_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      setFileList(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom || !formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    if (!formData.prenom || !formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    if (!formData.date_naissance) {
      newErrors.date_naissance = 'La date de naissance est requise';
    }
    if (!formData.personne_urgence || !formData.personne_urgence.trim()) {
      newErrors.personne_urgence = 'La personne d\'urgence est requise';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    if (!isValid) {
      console.warn('❌ Erreurs de validation:', newErrors);
    }
    
    return isValid;
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔄 Soumission du formulaire déclenchée');
    
    // Valider le formulaire
    const isValid = validateForm();
    console.log('✅ Validation:', isValid, 'Erreurs:', errors);
    
    if (!isValid) {
      console.warn('❌ Validation échouée, affichage des erreurs');
      // Faire défiler vers la première erreur
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`) || 
                       document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLElement).focus();
        }
      }
      return;
    }
    
    try {
      console.log('📝 Préparation des données...');
      
      // Injecter les signes vitaux dans les notes pour conserver l'information
      const vitalsSummaryParts: string[] = [];
      if (vitalSigns.temperature) vitalsSummaryParts.push(`Temp: ${vitalSigns.temperature}°C`);
      if (vitalSigns.systolique || vitalSigns.diastolique) vitalsSummaryParts.push(`TA: ${vitalSigns.systolique || '?'} / ${vitalSigns.diastolique || '?'} mmHg`);
      if (vitalSigns.frequence_cardiaque) vitalsSummaryParts.push(`FC: ${vitalSigns.frequence_cardiaque} bpm`);
      if (vitalSigns.frequence_respiratoire) vitalsSummaryParts.push(`FR: ${vitalSigns.frequence_respiratoire} /min`);
      if (vitalSigns.saturation) vitalsSummaryParts.push(`SpO2: ${vitalSigns.saturation}%`);
      if (vitalSigns.poids) vitalsSummaryParts.push(`Poids: ${vitalSigns.poids} kg`);
      if (vitalSigns.taille) vitalsSummaryParts.push(`Taille: ${vitalSigns.taille} cm`);
      if (vitalSigns.imc) vitalsSummaryParts.push(`IMC: ${vitalSigns.imc}`);

      const vitalsSummary = vitalsSummaryParts.length > 0 ? `\n[Signes Vitaux] ${vitalsSummaryParts.join(' | ')}` : '';
      
      // Nettoyer les données avant l'envoi (enlever les champs vides pour éviter les erreurs)
      // Ajouter les codes téléphone aux numéros
      const cleanedData: PatientFormData = {
        ...formData,
        notes: (formData.notes || '') + vitalsSummary,
        // Ajouter les codes téléphone aux numéros (seulement si le numéro existe)
        telephone: formData.telephone?.trim() ? `${phoneCode}${formData.telephone.trim()}` : undefined,
        telephone_proche: formData.telephone_proche?.trim() ? `${phoneProcheCode}${formData.telephone_proche.trim()}` : undefined,
        // Nettoyer les champs vides pour les sections facultatives - utiliser null au lieu de undefined pour Supabase
        accompagnant_nom: formData.accompagnant_nom?.trim() || null,
        accompagnant_prenoms: formData.accompagnant_prenoms?.trim() || null,
        accompagnant_filiation: formData.accompagnant_filiation?.trim() || null,
        accompagnant_telephone: formData.accompagnant_telephone?.trim() ? `${accompagnantPhoneCode}${formData.accompagnant_telephone.trim()}` : null,
        accompagnant_quartier: formData.accompagnant_quartier?.trim() || null,
        accompagnant_profession: formData.accompagnant_profession?.trim() || null,
        personne_prevenir_option: formData.personne_prevenir_option || null,
        personne_prevenir_nom: formData.personne_prevenir_nom?.trim() || null,
        personne_prevenir_prenoms: formData.personne_prevenir_prenoms?.trim() || null,
        personne_prevenir_filiation: formData.personne_prevenir_filiation?.trim() || null,
        personne_prevenir_telephone: formData.personne_prevenir_telephone?.trim() ? `${personnePrevenirPhoneCode}${formData.personne_prevenir_telephone.trim()}` : null,
        personne_prevenir_quartier: formData.personne_prevenir_quartier?.trim() || null,
        personne_prevenir_profession: formData.personne_prevenir_profession?.trim() || null,
      };
      
      console.log('✅ Données nettoyées, soumission...');
      
      // Soumettre le formulaire et obtenir le patient créé/modifié
      const createdOrUpdatedPatient = await onSubmit(cleanedData);
      
      console.log('✅ Patient créé/modifié:', createdOrUpdatedPatient?.id);
      
      // Télécharger les fichiers après la création/modification
      const patientId = createdOrUpdatedPatient?.id || patient?.id;
      if (patientId && uploadedFiles.length > 0) {
        try {
          console.log('📎 Téléchargement des fichiers...');
          await uploadFiles(patientId);
          console.log('✅ Fichiers téléchargés');
        } catch (fileError) {
          console.error('❌ Erreur lors du téléchargement des fichiers:', fileError);
          // Ne pas bloquer la création du patient si le téléchargement de fichiers échoue
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      throw error; // Propager l'erreur pour que le parent puisse l'afficher
    }
  };

  // Télécharger les fichiers vers Supabase Storage
  const uploadFiles = async (patientId: string) => {
    for (const file of uploadedFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${patientId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `patient-files/${fileName}`;

        // Upload vers Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('patient-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage
          .from('patient-files')
          .getPublicUrl(filePath);

        // Enregistrer dans la base de données
        const { error: dbError } = await supabase
          .from('patient_files')
          .insert({
            patient_id: patientId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_path: filePath,
            file_url: urlData.publicUrl,
            category: 'autre',
          });

        if (dbError) throw dbError;
      } catch (error) {
        console.error('Erreur lors du téléchargement du fichier:', error);
      }
    }
    setUploadedFiles([]);
    if (patient?.id) {
      loadPatientFiles(patient.id);
    }
  };

  // Gérer les changements dans les champs
  const handleChange = (field: keyof PatientFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ maxWidth: 800, mx: 'auto' }}
      noValidate
    >
      <Typography variant="h6" gutterBottom>
        {patient ? 'Modifier le patient' : 'Nouveau patient'}
      </Typography>

      <Grid container spacing={3}>
        {/* Informations de base */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
            Informations de base
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nom *"
            value={formData.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            error={!!errors.nom}
            helperText={errors.nom}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Prénom *"
            value={formData.prenom}
            onChange={(e) => handleChange('prenom', e.target.value)}
            error={!!errors.prenom}
            helperText={errors.prenom}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Sexe *</InputLabel>
            <Select
              value={formData.sexe}
              onChange={(e) => handleChange('sexe', e.target.value)}
              label="Sexe *"
            >
              <MenuItem value="Masculin">Masculin</MenuItem>
              <MenuItem value="Féminin">Féminin</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <DatePicker
              label="Date de naissance *"
              value={formData.date_naissance ? new Date(formData.date_naissance) : null}
              onChange={(date) => handleChange('date_naissance', date ? date.toISOString().split('T')[0] : '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.date_naissance,
                  helperText: errors.date_naissance,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Lieu de naissance"
            value={formData.lieu_naissance}
            onChange={(e) => handleChange('lieu_naissance', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Nationalité</InputLabel>
            <Select
              value={formData.nationalite || defaultCountry.name}
              onChange={(e) => {
                handleChange('nationalite', e.target.value);
                // Mettre à jour le code téléphone selon la nationalité
                const selectedCountry = countries.find(c => c.name === e.target.value);
                if (selectedCountry) {
                  setPhoneCode(selectedCountry.phoneCode);
                  setPhoneProcheCode(selectedCountry.phoneCode);
                }
              }}
              label="Nationalité"
            >
              {countries.map((country) => (
                <MenuItem key={country.code} value={country.name}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Contact et adresse */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Contact et adresse
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Adresse"
            value={formData.adresse}
            onChange={(e) => handleChange('adresse', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Téléphone"
            value={formData.telephone}
            onChange={(e) => {
              // Enlever le préfixe si présent
              let value = e.target.value.replace(/^\+\d{1,4}\s*/, '');
              handleChange('telephone', value);
            }}
            placeholder="0701234567"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      sx={{ 
                        '& .MuiSelect-select': { 
                          py: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }
                      }}
                    >
                      {countries.map((country) => (
                        <MenuItem key={country.code} value={country.phoneCode}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <span>{country.flag}</span>
                            <span>{country.phoneCode}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Téléphone proche"
            value={formData.telephone_proche}
            onChange={(e) => {
              let value = e.target.value.replace(/^\+\d{1,4}\s*/, '');
              handleChange('telephone_proche', value);
            }}
            placeholder="0701234567"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={phoneProcheCode}
                      onChange={(e) => setPhoneProcheCode(e.target.value)}
                      sx={{ 
                        '& .MuiSelect-select': { 
                          py: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }
                      }}
                    >
                      {countries.map((country) => (
                        <MenuItem key={country.code} value={country.phoneCode}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <span>{country.flag}</span>
                            <span>{country.phoneCode}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Personne d'urgence *"
            value={formData.personne_urgence}
            onChange={(e) => handleChange('personne_urgence', e.target.value)}
            error={!!errors.personne_urgence}
            helperText={errors.personne_urgence}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Profession"
            value={formData.profession}
            onChange={(e) => handleChange('profession', e.target.value)}
          />
        </Grid>

        {/* Informations médicales */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Informations médicales
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Situation matrimoniale</InputLabel>
            <Select
              value={formData.situation_matrimoniale}
              onChange={(e) => handleChange('situation_matrimoniale', e.target.value)}
              label="Situation matrimoniale"
            >
              <MenuItem value="Célibataire">Célibataire</MenuItem>
              <MenuItem value="Marié(e)">Marié(e)</MenuItem>
              <MenuItem value="Veuf(ve)">Veuf(ve)</MenuItem>
              <MenuItem value="Divorcé(e)">Divorcé(e)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Couverture santé</InputLabel>
            <Select
              value={formData.couverture_sante}
              onChange={(e) => handleChange('couverture_sante', e.target.value)}
              label="Couverture santé"
            >
              <MenuItem value="RAMU">RAMU</MenuItem>
              <MenuItem value="CNSS">CNSS</MenuItem>
              <MenuItem value="Gratuité">Gratuité</MenuItem>
              <MenuItem value="Aucun">Aucun</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Groupe sanguin</InputLabel>
            <Select
              value={formData.groupe_sanguin}
              onChange={(e) => handleChange('groupe_sanguin', e.target.value)}
              label="Groupe sanguin"
            >
              <MenuItem value="A+">A+</MenuItem>
              <MenuItem value="A-">A-</MenuItem>
              <MenuItem value="B+">B+</MenuItem>
              <MenuItem value="B-">B-</MenuItem>
              <MenuItem value="AB+">AB+</MenuItem>
              <MenuItem value="AB-">AB-</MenuItem>
              <MenuItem value="O+">O+</MenuItem>
              <MenuItem value="O-">O-</MenuItem>
              <MenuItem value="Inconnu">Inconnu</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Statut vaccinal</InputLabel>
            <Select
              value={formData.statut_vaccinal}
              onChange={(e) => handleChange('statut_vaccinal', e.target.value)}
              label="Statut vaccinal"
            >
              <MenuItem value="À jour">À jour</MenuItem>
              <MenuItem value="Incomplet">Incomplet</MenuItem>
              <MenuItem value="Inconnu">Inconnu</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Signes Vitaux */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Signes Vitaux
          </Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="Température (°C)"
            value={vitalSigns.temperature || ''}
            onChange={(e) => setVitalSigns(prev => ({ ...prev, temperature: e.target.value }))}
            placeholder="36.5"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="TA Systolique (mmHg)"
            value={vitalSigns.systolique || ''}
            onChange={(e) => setVitalSigns(prev => ({ ...prev, systolique: e.target.value }))}
            placeholder="120"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="TA Diastolique (mmHg)"
            value={vitalSigns.diastolique || ''}
            onChange={(e) => setVitalSigns(prev => ({ ...prev, diastolique: e.target.value }))}
            placeholder="80"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="FC (bpm)"
            value={vitalSigns.frequence_cardiaque || ''}
            onChange={(e) => setVitalSigns(prev => ({ ...prev, frequence_cardiaque: e.target.value }))}
            placeholder="72"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="FR (/min)"
            value={vitalSigns.frequence_respiratoire || ''}
            onChange={(e) => setVitalSigns(prev => ({ ...prev, frequence_respiratoire: e.target.value }))}
            placeholder="16"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="SpO₂ (%)"
            value={vitalSigns.saturation || ''}
            onChange={(e) => setVitalSigns(prev => ({ ...prev, saturation: e.target.value }))}
            placeholder="98"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="Poids (kg)"
            value={vitalSigns.poids || ''}
            onChange={(e) => {
              const poids = e.target.value;
              setVitalSigns(prev => ({ ...prev, poids }));
            }}
            placeholder="70"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="Taille (cm)"
            value={vitalSigns.taille || ''}
            onChange={(e) => {
              const taille = e.target.value;
              setVitalSigns(prev => ({ ...prev, taille }));
            }}
            placeholder="170"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="IMC"
            value={vitalSigns.imc || ''}
            InputProps={{ readOnly: true }}
            placeholder="24.2"
          />
        </Grid>
        {vitalSigns.imc && (
          <Grid item xs={12}>
            <Typography variant="body2" color={
              bmiAppreciation === 'Insuffisance pondérale' ? 'warning.main' :
              bmiAppreciation === 'Poids normal' ? 'success.main' :
              bmiAppreciation === 'Surpoids' ? 'warning.main' : 'error.main'
            }>
              Appréciation (OMS): {bmiAppreciation}
            </Typography>
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Allergies"
            value={formData.allergies}
            onChange={(e) => handleChange('allergies', e.target.value)}
            multiline
            rows={2}
            placeholder="Listez les allergies connues..."
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Maladies chroniques"
            value={formData.maladies_chroniques}
            onChange={(e) => handleChange('maladies_chroniques', e.target.value)}
            multiline
            rows={2}
            placeholder="Listez les maladies chroniques..."
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Antécédents médicaux"
            value={formData.antecedents_medicaux}
            onChange={(e) => handleChange('antecedents_medicaux', e.target.value)}
            multiline
            rows={3}
            placeholder="Décrivez les antécédents médicaux..."
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.prise_medicaments_reguliers}
                onChange={(e) => handleChange('prise_medicaments_reguliers', e.target.checked)}
              />
            }
            label="Prise de médicaments réguliers"
          />
        </Grid>

        {formData.prise_medicaments_reguliers && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Médicaments réguliers"
              value={formData.medicaments_reguliers}
              onChange={(e) => handleChange('medicaments_reguliers', e.target.value)}
              multiline
              rows={2}
              placeholder="Listez les médicaments pris régulièrement..."
            />
          </Grid>
        )}

        {/* Service et statut */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Service et statut
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Service initial</InputLabel>
            <Select
              value={formData.service_initial}
              onChange={(e) => handleChange('service_initial', e.target.value)}
              label="Service initial"
            >
              <MenuItem value="Médecine générale">Médecine générale</MenuItem>
              <MenuItem value="Maternité">Maternité</MenuItem>
              <MenuItem value="Pédiatrie">Pédiatrie</MenuItem>
              <MenuItem value="Autres">Autres</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Statut</InputLabel>
            <Select
              value={formData.statut}
              onChange={(e) => handleChange('statut', e.target.value)}
              label="Statut"
            >
              <MenuItem value="Nouveau">Nouveau</MenuItem>
              <MenuItem value="Connu">Connu</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            multiline
            rows={3}
            placeholder="Notes additionnelles..."
          />
        </Grid>

        {/* Section Accompagnant */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Accompagnant (Facultatif)
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nom"
            value={formData.accompagnant_nom}
            onChange={(e) => handleChange('accompagnant_nom', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Prénoms"
            value={formData.accompagnant_prenoms}
            onChange={(e) => handleChange('accompagnant_prenoms', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Filiation</InputLabel>
            <Select
              value={formData.accompagnant_filiation}
              onChange={(e) => handleChange('accompagnant_filiation', e.target.value)}
              label="Filiation"
            >
              <MenuItem value="">Sélectionner...</MenuItem>
              <MenuItem value="Père">Père</MenuItem>
              <MenuItem value="Mère">Mère</MenuItem>
              <MenuItem value="Conjoint">Conjoint</MenuItem>
              <MenuItem value="Frère/Sœur">Frère/Sœur</MenuItem>
              <MenuItem value="Ami">Ami</MenuItem>
              <MenuItem value="Autre">Autre</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Téléphone"
            value={formData.accompagnant_telephone}
            onChange={(e) => {
              let value = e.target.value.replace(/^\+\d{1,4}\s*/, '');
              handleChange('accompagnant_telephone', value);
            }}
            placeholder="0701234567"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={accompagnantPhoneCode}
                      onChange={(e) => setAccompagnantPhoneCode(e.target.value)}
                      sx={{ 
                        '& .MuiSelect-select': { 
                          py: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }
                      }}
                    >
                      {countries.map((country) => (
                        <MenuItem key={country.code} value={country.phoneCode}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <span>{country.flag}</span>
                            <span>{country.phoneCode}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Quartier"
            value={formData.accompagnant_quartier}
            onChange={(e) => handleChange('accompagnant_quartier', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Profession"
            value={formData.accompagnant_profession}
            onChange={(e) => handleChange('accompagnant_profession', e.target.value)}
          />
        </Grid>

        {/* Section Personne à prévenir */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Personne à prévenir (Facultatif)
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Option</FormLabel>
            <RadioGroup
              row
              value={formData.personne_prevenir_option}
              onChange={(e) => handleChange('personne_prevenir_option', e.target.value)}
            >
              <FormControlLabel value="identique_accompagnant" control={<Radio />} label="Identique à l'accompagnant" />
              <FormControlLabel value="autre" control={<Radio />} label="Autre" />
            </RadioGroup>
          </FormControl>
        </Grid>

        {formData.personne_prevenir_option === 'autre' && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom"
                value={formData.personne_prevenir_nom}
                onChange={(e) => handleChange('personne_prevenir_nom', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prénoms"
                value={formData.personne_prevenir_prenoms}
                onChange={(e) => handleChange('personne_prevenir_prenoms', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filiation</InputLabel>
                <Select
                  value={formData.personne_prevenir_filiation}
                  onChange={(e) => handleChange('personne_prevenir_filiation', e.target.value)}
                  label="Filiation"
                >
                  <MenuItem value="">Sélectionner...</MenuItem>
                  <MenuItem value="Père">Père</MenuItem>
                  <MenuItem value="Mère">Mère</MenuItem>
                  <MenuItem value="Conjoint">Conjoint</MenuItem>
                  <MenuItem value="Frère/Sœur">Frère/Sœur</MenuItem>
                  <MenuItem value="Ami">Ami</MenuItem>
                  <MenuItem value="Autre">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone"
                value={formData.personne_prevenir_telephone}
                onChange={(e) => {
                  let value = e.target.value.replace(/^\+\d{1,4}\s*/, '');
                  handleChange('personne_prevenir_telephone', value);
                }}
                placeholder="0701234567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={personnePrevenirPhoneCode}
                          onChange={(e) => setPersonnePrevenirPhoneCode(e.target.value)}
                          sx={{ 
                            '& .MuiSelect-select': { 
                              py: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }
                          }}
                        >
                          {countries.map((country) => (
                            <MenuItem key={country.code} value={country.phoneCode}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <span>{country.flag}</span>
                                <span>{country.phoneCode}</span>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quartier"
                value={formData.personne_prevenir_quartier}
                onChange={(e) => handleChange('personne_prevenir_quartier', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Profession"
                value={formData.personne_prevenir_profession}
                onChange={(e) => handleChange('personne_prevenir_profession', e.target.value)}
              />
            </Grid>
          </>
        )}

        {/* Section Téléchargement de fichiers */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Fichiers joints (Facultatif)
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="file-upload"
            multiple
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<Upload />}
              sx={{ mb: 2 }}
            >
              Télécharger des fichiers
            </Button>
          </label>
        </Grid>

        {/* Liste des fichiers téléchargés */}
        {uploadedFiles.length > 0 && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Fichiers à télécharger:
              </Typography>
              <List dense>
                {uploadedFiles.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(2)} KB`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Liste des fichiers existants */}
        {fileList.length > 0 && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Fichiers existants:
              </Typography>
              <List dense>
                {fileList.map((file) => (
                  <ListItem key={file.id}>
                    <AttachFile fontSize="small" sx={{ mr: 1 }} />
                    <ListItemText
                      primary={file.file_name}
                      secondary={`${file.category} - ${file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString('fr-FR') : ''}`}
                    />
                    <ListItemSecondaryAction>
                      {file.file_url && (
                        <Button
                          size="small"
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ mr: 1 }}
                        >
                          Voir
                        </Button>
                      )}
                      <IconButton edge="end" onClick={() => handleDeleteExistingFile(file.id)}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Boutons d'action */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          onClick={(e) => {
            // Ne pas empêcher la soumission normale du formulaire
            // Le formulaire se soumettra normalement via onSubmit={handleSubmit}
            // On ajoute juste un log pour le débogage
            console.log('🔘 Bouton Créer cliqué');
            
            // Vérifier que le formulaire est valide avant de permettre la soumission
            const form = e.currentTarget.closest('form');
            if (form) {
              // La validation sera faite dans handleSubmit
              // On ne fait que vérifier visuellement
              const requiredFields = form.querySelectorAll('[required]');
              let hasEmptyRequired = false;
              requiredFields.forEach((field: any) => {
                if (!field.value || field.value.trim() === '') {
                  hasEmptyRequired = true;
                }
              });
              
              if (hasEmptyRequired) {
                console.warn('⚠️ Certains champs requis sont vides');
              }
            }
          }}
        >
          {loading ? 'Enregistrement...' : (patient ? 'Modifier' : 'Créer')}
        </Button>
      </Box>
    </Box>
  );
};
