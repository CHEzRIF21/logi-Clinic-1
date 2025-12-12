import React, { useEffect, useState } from 'react';
import {
  Save,
  CheckCircle,
  Warning,
  TrendingUp,
  TrendingDown,
  Remove,
  ErrorOutline
} from '@mui/icons-material';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/shadcn/card';
import { Badge } from '../ui/shadcn/badge';
import { Alert, AlertTitle, AlertDescription } from '../ui/shadcn/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { LaboratoireService, LabPrelevement, LabAnalyse, LabModeleExamen, LabAnalyseForm } from '../../services/laboratoireService';
import { Patient } from '../../services/supabase';

interface PaillasseNumeriqueModernProps {
  prelevement: LabPrelevement;
  patient: Patient;
  onAnalyseCreated?: () => void;
}

const PaillasseNumeriqueModern: React.FC<PaillasseNumeriqueModernProps> = ({ 
  prelevement, 
  patient, 
  onAnalyseCreated 
}) => {
  const [modelesExamens, setModelesExamens] = useState<LabModeleExamen[]>([]);
  const [modeleSelectionne, setModeleSelectionne] = useState<LabModeleExamen | null>(null);
  const [analysesExistantes, setAnalysesExistantes] = useState<LabAnalyse[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [valeursReference, setValeursReference] = useState<Record<string, { min?: number; max?: number; unite?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      const initialData: Record<string, any> = {};
      const refs: Record<string, { min?: number; max?: number; unite?: string }> = {};
      
      for (const param of modele.parametres) {
        initialData[param.nom] = {
          type: param.type,
          unite: param.unite,
          valeur: param.type === 'quantitatif' ? null : '',
        };
        
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
        technicien: 'Technicien actuel',
      };

      await LaboratoireService.createAnalyseAvecReference(
        analyseForm,
        patientAge,
        patient.sexe
      );

      setSuccess(`Analyse ${parametre} enregistrée avec succès`);
      await loadAnalysesExistantes();
      onAnalyseCreated?.();
      
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
      case 'amelioration': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'aggravation': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'stabilite': return <Remove className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle>Paillasse Numérique - Prélèvement {prelevement.code_unique}</CardTitle>
          <CardDescription>
            Patient: {patient.nom} {patient.prenom} • {patientAge} ans • {patient.sexe} • 
            Type d'échantillon: {prelevement.type_echantillon}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sélection modèle */}
      <Card>
        <CardHeader>
          <CardTitle>Modèle d'examen</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={modeleSelectionne?.code_examen || ''}
            onChange={(e) => handleSelectModele(e.target.value)}
          >
            <option value="">Sélectionner un modèle...</option>
            {modelesExamens.map((modele) => (
              <option key={modele.id} value={modele.code_examen}>
                {modele.libelle_examen} ({modele.code_examen})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <ErrorOutline className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Succès</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Formulaire dynamique */}
      {modeleSelectionne && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modeleSelectionne.parametres.map((param) => {
            const analyseExistante = analysesExistantes.find(a => a.parametre === param.nom);
            const ref = valeursReference[param.nom];
            const data = formData[param.nom] || {};
            const valeur = analyseExistante 
              ? (analyseExistante.type_resultat === 'quantitatif' 
                  ? analyseExistante.valeur_numerique 
                  : analyseExistante.valeur_qualitative)
              : data.valeur;
            const pathologique = analyseExistante?.est_pathologique || 
              (valeur !== null && valeur !== undefined && isPathologique(param.nom, valeur as any));

            return (
              <Card 
                key={param.nom}
                className={cn(
                  pathologique && "border-red-500 border-2 bg-red-50 dark:bg-red-950/20"
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{param.nom}</CardTitle>
                    <div className="flex items-center gap-2">
                      {analyseExistante?.est_pathologique && (
                        <Badge variant="destructive">
                          <Warning className="h-3 w-3 mr-1" />
                          Pathologique
                        </Badge>
                      )}
                      {analyseExistante?.evolution && getEvolutionIcon(analyseExistante.evolution)}
                    </div>
                  </div>
                  {ref && (
                    <CardDescription className="text-xs">
                      Référence: {ref.min !== undefined && ref.max !== undefined 
                        ? `${ref.min} - ${ref.max} ${ref.unite || ''}`.trim()
                        : 'Non définie'}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Delta Check */}
                  {analyseExistante?.valeur_precedente_numerique !== undefined && (
                    <Alert variant="info">
                      <AlertDescription className="text-xs">
                        <strong>Résultat précédent:</strong> {analyseExistante.valeur_precedente_numerique} {analyseExistante.unite || ''}
                        {' • '}
                        {new Date(analyseExistante.date_resultat_precedent || '').toLocaleDateString('fr-FR')}
                        {' • '}
                        Évolution: {analyseExistante.evolution === 'amelioration' && 'Amélioration'}
                        {analyseExistante.evolution === 'aggravation' && 'Aggravation'}
                        {analyseExistante.evolution === 'stabilite' && 'Stabilité'}
                        {analyseExistante.evolution === 'nouveau' && 'Nouveau'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Champ de saisie */}
                  {param.type === 'quantitatif' ? (
                    <div className="space-y-2">
                      <Label htmlFor={`${param.nom}-input`}>
                        Valeur ({param.unite || ''})
                      </Label>
                      <Input
                        id={`${param.nom}-input`}
                        type="number"
                        value={analyseExistante ? valeur || '' : data.valeur || ''}
                        onChange={(e) => {
                          const newData = { ...formData };
                          newData[param.nom] = { ...data, valeur: e.target.value };
                          setFormData(newData);
                        }}
                        disabled={!!analyseExistante}
                        className={cn(
                          pathologique && !analyseExistante && "border-red-500",
                          analyseExistante?.est_pathologique && "font-bold text-red-600 dark:text-red-400"
                        )}
                      />
                      {!analyseExistante && valeur !== null && valeur !== undefined && isPathologique(param.nom, parseFloat(valeur as any) || 0) && (
                        <p className="text-xs text-red-600 dark:text-red-400">Valeur hors normes</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor={`${param.nom}-select`}>Résultat</Label>
                      <select
                        id={`${param.nom}-select`}
                        className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={analyseExistante ? valeur || '' : data.valeur || ''}
                        onChange={(e) => {
                          const newData = { ...formData };
                          newData[param.nom] = { ...data, valeur: e.target.value };
                          setFormData(newData);
                        }}
                        disabled={!!analyseExistante}
                      >
                        <option value="">Sélectionner...</option>
                        {param.valeurs_possibles?.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Bouton sauvegarder */}
                  {!analyseExistante && (
                    <Button
                      className="w-full"
                      onClick={() => handleSaveAnalyse(param.nom)}
                      disabled={loading || !data.valeur}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </Button>
                  )}

                  {/* Résultat existant */}
                  {analyseExistante && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">
                        <strong>Résultat:</strong> {analyseExistante.type_resultat === 'quantitatif'
                          ? `${analyseExistante.valeur_numerique} ${analyseExistante.unite || ''}`.trim()
                          : analyseExistante.valeur_qualitative}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Statut: {analyseExistante.statut}
                        {analyseExistante.technicien && ` • Technicien: ${analyseExistante.technicien}`}
                        {analyseExistante.valide_par && ` • Validé par: ${analyseExistante.valide_par}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaillasseNumeriqueModern;

