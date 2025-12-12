/**
 * Formulaire MAPI - Manifestations Adverses Post-Immunisation
 */
import React, { useState } from 'react';
import { MAPI, MAPIType, PatientVaccination, Vaccine } from '../../types/vaccination';

const MAPI_TYPES: { value: MAPIType; label: string; description: string }[] = [
  { value: 'fievre_elevee', label: 'Fièvre élevée', description: '>39°C pendant plus de 24h' },
  { value: 'reaction_locale_severe', label: 'Réaction locale sévère', description: 'Œdème, rougeur >5cm' },
  { value: 'abces', label: 'Abcès au site d\'injection', description: 'Collection purulente' },
  { value: 'lymphadenite_bcg', label: 'Lymphadénite BCG', description: 'Ganglion axillaire >1cm' },
  { value: 'choc_anaphylactique', label: 'Choc anaphylactique', description: 'Réaction allergique grave' },
  { value: 'convulsions', label: 'Convulsions', description: 'Crises convulsives' },
  { value: 'encephalopathie', label: 'Encéphalopathie', description: 'Troubles neurologiques' },
  { value: 'paralysie_flasque', label: 'Paralysie flasque', description: 'Paralysie musculaire' },
  { value: 'autre', label: 'Autre manifestation', description: 'Autre type de réaction' }
];

const SYMPTOMES_COMMUNS = [
  'Fièvre', 'Douleur au site d\'injection', 'Gonflement', 'Rougeur', 'Fatigue',
  'Maux de tête', 'Nausées', 'Vomissements', 'Diarrhée', 'Éruption cutanée',
  'Difficultés respiratoires', 'Perte de conscience', 'Convulsions', 'Paralysie', 'Irritabilité'
];

interface FormulaireMAPIProps {
  vaccination: PatientVaccination;
  vaccine: Vaccine;
  patient: { id: string; nom: string; prenom: string };
  onSubmit: (mapi: Omit<MAPI, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const FormulaireMAPI: React.FC<FormulaireMAPIProps> = ({
  vaccination, vaccine, patient, onSubmit, onCancel, isLoading = false
}) => {
  const [formData, setFormData] = useState({
    date_survenue: new Date().toISOString().split('T')[0],
    type: '' as MAPIType | '',
    gravite: '' as 'legere' | 'moderee' | 'severe' | 'deces' | '',
    description: '',
    symptomes: [] as string[],
    traitement_administre: '',
    evolution: '' as 'guerison' | 'sequelles' | 'deces' | 'en_cours' | '',
    hospitalisation: false,
    duree_hospitalisation_jours: 0,
    actions_prises: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const delaiHeures = React.useMemo(() => {
    if (!formData.date_survenue) return 0;
    const dateVax = new Date(vaccination.date_administration);
    const dateSurvenue = new Date(formData.date_survenue);
    return Math.floor((dateSurvenue.getTime() - dateVax.getTime()) / (1000 * 60 * 60));
  }, [formData.date_survenue, vaccination.date_administration]);
  
  const handleSymptomeToggle = (symptome: string) => {
    setFormData(prev => ({
      ...prev,
      symptomes: prev.symptomes.includes(symptome)
        ? prev.symptomes.filter(s => s !== symptome)
        : [...prev.symptomes, symptome]
    }));
  };
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.date_survenue) newErrors.date_survenue = 'Date requise';
    if (!formData.type) newErrors.type = 'Type de MAPI requis';
    if (!formData.gravite) newErrors.gravite = 'Gravité requise';
    if (!formData.description) newErrors.description = 'Description requise';
    if (formData.symptomes.length === 0) newErrors.symptomes = 'Sélectionnez au moins un symptôme';
    if (!formData.evolution) newErrors.evolution = 'Évolution requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const mapi: Omit<MAPI, 'id' | 'created_at' | 'updated_at'> = {
      patient_vaccination_id: vaccination.id,
      patient_id: patient.id,
      patient_nom: `${patient.prenom} ${patient.nom}`,
      vaccine_id: vaccine.id,
      vaccin_libelle: vaccine.libelle,
      numero_lot: vaccination.numero_lot,
      date_vaccination: vaccination.date_administration,
      date_survenue: formData.date_survenue,
      delai_heures: delaiHeures,
      type: formData.type as MAPIType,
      gravite: formData.gravite as 'legere' | 'moderee' | 'severe' | 'deces',
      description: formData.description,
      symptomes: formData.symptomes,
      traitement_administre: formData.traitement_administre || undefined,
      evolution: formData.evolution as 'guerison' | 'sequelles' | 'deces' | 'en_cours',
      hospitalisation: formData.hospitalisation,
      duree_hospitalisation_jours: formData.hospitalisation ? formData.duree_hospitalisation_jours : undefined,
      declarant: 'Utilisateur actuel',
      date_declaration: new Date().toISOString(),
      transmis_niveau_superieur: false,
      actions_prises: formData.actions_prises || undefined
    };
    
    onSubmit(mapi);
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">📋</span>
          <div>
            <h2 className="text-xl font-bold">Déclaration MAPI</h2>
            <p className="text-rose-100">Manifestation Adverse Post-Immunisation</p>
          </div>
        </div>
        
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-rose-200">Patient</p>
              <p className="font-semibold">{patient.prenom} {patient.nom}</p>
            </div>
            <div>
              <p className="text-rose-200">Vaccin</p>
              <p className="font-semibold">{vaccine.libelle}</p>
            </div>
            <div>
              <p className="text-rose-200">N° Lot</p>
              <p className="font-mono font-semibold">{vaccination.numero_lot}</p>
            </div>
            <div>
              <p className="text-rose-200">Date vaccination</p>
              <p className="font-semibold">{new Date(vaccination.date_administration).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Date et délai */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date de survenue *</label>
            <input
              type="date"
              value={formData.date_survenue}
              onChange={(e) => setFormData({ ...formData, date_survenue: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full h-11 px-4 rounded-lg border bg-white dark:bg-gray-800 text-sm ${errors.date_survenue ? 'border-rose-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Délai après vaccination</label>
            <div className="h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {delaiHeures < 24 ? `${delaiHeures} heure${delaiHeures > 1 ? 's' : ''}` : `${Math.floor(delaiHeures / 24)} jour${Math.floor(delaiHeures / 24) > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>
        
        {/* Type de MAPI */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type de manifestation *</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {MAPI_TYPES.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.value })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  formData.type === type.value
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-800 dark:text-gray-200">{type.label}</p>
                <p className="text-xs text-gray-500">{type.description}</p>
              </button>
            ))}
          </div>
          {errors.type && <p className="text-xs text-rose-500">{errors.type}</p>}
        </div>
        
        {/* Gravité */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gravité *</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'legere', label: 'Légère', color: 'bg-yellow-500' },
              { value: 'moderee', label: 'Modérée', color: 'bg-orange-500' },
              { value: 'severe', label: 'Sévère', color: 'bg-rose-500' },
              { value: 'deces', label: 'Décès', color: 'bg-red-700' }
            ].map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setFormData({ ...formData, gravite: g.value as any })}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  formData.gravite === g.value ? `${g.color} text-white` : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          {errors.gravite && <p className="text-xs text-rose-500">{errors.gravite}</p>}
        </div>
        
        {/* Symptômes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Symptômes observés *</label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMES_COMMUNS.map(symptome => (
              <button
                key={symptome}
                type="button"
                onClick={() => handleSymptomeToggle(symptome)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  formData.symptomes.includes(symptome)
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {formData.symptomes.includes(symptome) && '✓ '}{symptome}
              </button>
            ))}
          </div>
          {errors.symptomes && <p className="text-xs text-rose-500">{errors.symptomes}</p>}
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description détaillée *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Décrivez les circonstances et l'évolution..."
            className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-sm resize-none ${errors.description ? 'border-rose-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.description && <p className="text-xs text-rose-500">{errors.description}</p>}
        </div>
        
        {/* Évolution */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Évolution *</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'guerison', label: '✓ Guérison complète', color: 'bg-emerald-500' },
              { value: 'en_cours', label: '⏳ En cours', color: 'bg-blue-500' },
              { value: 'sequelles', label: '⚠️ Séquelles', color: 'bg-orange-500' },
              { value: 'deces', label: '✗ Décès', color: 'bg-red-700' }
            ].map(e => (
              <button
                key={e.value}
                type="button"
                onClick={() => setFormData({ ...formData, evolution: e.value as any })}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  formData.evolution === e.value ? `${e.color} text-white` : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
          {errors.evolution && <p className="text-xs text-rose-500">{errors.evolution}</p>}
        </div>
        
        {/* Boutons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-12 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? '⏳ Enregistrement...' : '📤 Déclarer la MAPI'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormulaireMAPI;

