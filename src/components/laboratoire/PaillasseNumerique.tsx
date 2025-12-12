import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  Paper,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save,
  CheckCircle,
  Warning,
  TrendingUp,
  TrendingDown,
  Remove,
  Add
} from '@mui/icons-material';
import { GlassCard } from '../ui/GlassCard';
import { LaboratoireService, LabPrelevement, LabAnalyse, LabModeleExamen, LabAnalyseForm } from '../../services/laboratoireService';
import { Patient } from '../../services/supabase';

interface PaillasseNumeriqueProps {
  prelevement: LabPrelevement;
  patient: Patient;
  onAnalyseCreated?: () => void;
}

const PaillasseNumerique: React.FC<PaillasseNumeriqueProps> = ({ prelevement, patient, onAnalyseCreated }) => {
  const [modelesExamens, setModelesExamens] = useState<LabModeleExamen[]>([]);
  const [modeleSelectionne, setModeleSelectionne] = useState<LabModeleExamen | null>(null);
  const [analysesExistantes, setAnalysesExistantes] = useState<LabAnalyse[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [valeursReference, setValeursReference] = useState<Record<string, { min?: number; max?: number; unite?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculer l'âge du patient
  const calculateAge = (dateNaissance: string): number => {
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const patientAge = calculateAge(patient.date_naissance);

  useEffect(() => {
    loadModelesExamens();
    loadAnalysesExistantes();
  }, [prelevement.id]);

  const loadModelesExamens = async () => {
    try {
      const modeles = await LaboratoireService.getModelesExamens();
      setModelesExamens(modeles);
    } catch (err) {
      console.error('Erreur chargement modèles:', err);
    }
  };

  const loadAnalysesExistantes = async () => {
    try {
      const analyses = await LaboratoireService.listAnalyses(prelevement.id);
      setAnalysesExistantes(analyses);
    } catch (err) {
      console.error('Erreur chargement analyses:', err);
    }
  };

  const handleSelectModele = async (codeExamen: string) => {
    const modele = await LaboratoireService.getModeleExamenByCode(codeExamen);
    if (modele) {
      setModeleSelectionne(modele);
      // Initialiser le formulaire avec les paramètres du modèle
      const initialData: Record<string, any> = {};
      const refs: Record<string, { min?: number; max?: number; unite?: string }> = {};
      
      for (const param of modele.parametres) {
        initialData[param.nom] = {
          type: param.type,
          unite: param.unite,
          valeur: param.type === 'quantitatif' ? null : '',
        };
        
        // Charger les valeurs de référence si quantitatif
        if (param.type === 'quantitatif' && param.ref_selon_age_sexe) {
          const ref = await LaboratoireService.getValeursReference(
            param.nom,
            patientAge,
            patient.sexe
          );
          if (ref) {
            refs[param.nom] = {
              min: ref.valeur_min || undefined,
              max: ref.valeur_max || undefined,
              unite: ref.unite
            };
          }
        } else if (param.type === 'quantitatif' && param.ref_min !== undefined && param.ref_max !== undefined) {
          refs[param.nom] = {
            min: param.ref_min,
            max: param.ref_max,
            unite: param.unite
          };
        }
      }
      
      setFormData(initialData);
      setValeursReference(refs);
    }
  };

  const handleSaveAnalyse = async (parametre: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = formData[parametre];
      if (!data) return;

      const analyseForm: LabAnalyseForm = {
        prelevement_id: prelevement.id,
        parametre,
        type_resultat: data.type,
        unite: data.unite,
        valeur_numerique: data.type === 'quantitatif' ? parseFloat(data.valeur) : undefined,
        valeur_qualitative: data.type === 'qualitatif' ? data.valeur : undefined,
        technicien: 'Technicien actuel', // À remplacer par l'utilisateur connecté
      };

      await LaboratoireService.createAnalyseAvecReference(
        analyseForm,
        patientAge,
        patient.sexe
      );

      setSuccess(`Analyse ${parametre} enregistrée avec succès`);
      await loadAnalysesExistantes();
      onAnalyseCreated?.();
      
      // Réinitialiser le champ
      setFormData({ ...formData, [parametre]: { ...data, valeur: data.type === 'quantitatif' ? null : '' } });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const isPathologique = (parametre: string, valeur: number | string): boolean => {
    const ref = valeursReference[parametre];
    if (!ref) return false;
    
    const analyse = analysesExistantes.find(a => a.parametre === parametre);
    if (analyse?.est_pathologique) return true;
    
    if (typeof valeur === 'number' && ref.min !== undefined && ref.max !== undefined) {
      return valeur < ref.min || valeur > ref.max;
    }
    
    if (typeof valeur === 'string') {
      return valeur.toLowerCase().includes('positif');
    }
    
    return false;
  };

  const getEvolutionIcon = (evolution?: string) => {
    switch (evolution) {
      case 'amelioration': return <TrendingDown color="success" />;
      case 'aggravation': return <TrendingUp color="error" />;
      case 'stabilite': return <Remove color="info" />;
      default: return null;
    }
  };

  return (
    <Box>
      <GlassCard sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Paillasse Numérique - Prélèvement {prelevement.code_unique}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Patient: {patient.nom} {patient.prenom} • {patientAge} ans • {patient.sexe}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Type d'échantillon: {prelevement.type_echantillon}
        </Typography>
      </GlassCard>

      {/* Sélection du modèle d'examen */}
      <GlassCard sx={{ p: 2, mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Modèle d'examen</InputLabel>
          <Select
            value={modeleSelectionne?.code_examen || ''}
            onChange={(e) => handleSelectModele(e.target.value)}
            label="Modèle d'examen"
          >
            {modelesExamens.map((modele) => (
              <MenuItem key={modele.id} value={modele.code_examen}>
                {modele.libelle_examen} ({modele.code_examen})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </GlassCard>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Formulaire dynamique selon le modèle sélectionné */}
      {modeleSelectionne && (
        <Grid container spacing={2}>
          {modeleSelectionne.parametres.map((param) => {
            const analyseExistante = analysesExistantes.find(a => a.parametre === param.nom);
            const ref = valeursReference[param.nom];
            const data = formData[param.nom] || {};
            const valeur = analyseExistante 
              ? (analyseExistante.type_resultat === 'quantitatif' 
                  ? analyseExistante.valeur_numerique 
                  : analyseExistante.valeur_qualitative)
              : data.valeur;

            return (
              <Grid item xs={12} md={6} key={param.nom}>
                <GlassCard sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {param.nom}
                    </Typography>
                    {analyseExistante?.est_pathologique && (
                      <Chip label="Pathologique" size="small" color="error" icon={<Warning />} />
                    )}
                    {analyseExistante?.evolution && getEvolutionIcon(analyseExistante.evolution)}
                  </Box>

                  {/* Valeurs de référence */}
                  {ref && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Référence: {ref.min !== undefined && ref.max !== undefined 
                        ? `${ref.min} - ${ref.max} ${ref.unite || ''}`.trim()
                        : 'Non définie'}
                    </Typography>
                  )}

                  {/* Delta Check - Résultat précédent */}
                  {analyseExistante?.valeur_precedente_numerique !== undefined && (
                    <Alert severity="info" sx={{ mb: 1 }} icon={false}>
                      <Typography variant="caption">
                        Résultat précédent: {analyseExistante.valeur_precedente_numerique} {analyseExistante.unite || ''}
                        {' • '}
                        {new Date(analyseExistante.date_resultat_precedent || '').toLocaleDateString('fr-FR')}
                        {' • '}
                        Évolution: {analyseExistante.evolution === 'amelioration' && 'Amélioration'}
                        {analyseExistante.evolution === 'aggravation' && 'Aggravation'}
                        {analyseExistante.evolution === 'stabilite' && 'Stabilité'}
                        {analyseExistante.evolution === 'nouveau' && 'Nouveau'}
                      </Typography>
                    </Alert>
                  )}

                  {analyseExistante?.valeur_precedente_qualitative && (
                    <Alert severity="info" sx={{ mb: 1 }} icon={false}>
                      <Typography variant="caption">
                        Résultat précédent: {analyseExistante.valeur_precedente_qualitative}
                        {' • '}
                        {new Date(analyseExistante.date_resultat_precedent || '').toLocaleDateString('fr-FR')}
                      </Typography>
                    </Alert>
                  )}

                  {/* Champ de saisie */}
                  {param.type === 'quantitatif' ? (
                    <TextField
                      fullWidth
                      type="number"
                      label={`Valeur (${param.unite || ''})`}
                      value={analyseExistante ? valeur || '' : data.valeur || ''}
                      onChange={(e) => {
                        const newData = { ...formData };
                        newData[param.nom] = { ...data, valeur: e.target.value };
                        setFormData(newData);
                      }}
                      disabled={!!analyseExistante}
                      error={!analyseExistante && valeur !== null && valeur !== undefined && isPathologique(param.nom, parseFloat(valeur as any) || 0)}
                      helperText={
                        !analyseExistante && valeur !== null && valeur !== undefined && isPathologique(param.nom, parseFloat(valeur as any) || 0)
                          ? 'Valeur hors normes'
                          : ''
                      }
                      sx={{
                        '& .MuiInputBase-input': {
                          color: analyseExistante?.est_pathologique ? 'error.main' : undefined,
                          fontWeight: analyseExistante?.est_pathologique ? 'bold' : undefined,
                        }
                      }}
                    />
                  ) : (
                    <FormControl fullWidth>
                      <InputLabel>Résultat</InputLabel>
                      <Select
                        value={analyseExistante ? valeur || '' : data.valeur || ''}
                        onChange={(e) => {
                          const newData = { ...formData };
                          newData[param.nom] = { ...data, valeur: e.target.value };
                          setFormData(newData);
                        }}
                        disabled={!!analyseExistante}
                        label="Résultat"
                      >
                        {param.valeurs_possibles?.map((val) => (
                          <MenuItem key={val} value={val}>
                            {val}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Bouton sauvegarder */}
                  {!analyseExistante && (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Save />}
                      onClick={() => handleSaveAnalyse(param.nom)}
                      disabled={loading || !data.valeur}
                      sx={{ mt: 1 }}
                    >
                      Enregistrer
                    </Button>
                  )}

                  {/* Affichage du résultat existant */}
                  {analyseExistante && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>Résultat:</strong> {analyseExistante.type_resultat === 'quantitatif'
                          ? `${analyseExistante.valeur_numerique} ${analyseExistante.unite || ''}`.trim()
                          : analyseExistante.valeur_qualitative}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Statut: {analyseExistante.statut}
                        {analyseExistante.technicien && ` • Technicien: ${analyseExistante.technicien}`}
                        {analyseExistante.valide_par && ` • Validé par: ${analyseExistante.valide_par}`}
                      </Typography>
                    </Box>
                  )}
                </GlassCard>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default PaillasseNumerique;

