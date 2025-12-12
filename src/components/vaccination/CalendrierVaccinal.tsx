/**
 * Calendrier Vaccinal Intelligent - PEV Afrique de l'Ouest
 */
import React, { useMemo, useState } from 'react';
import { Vaccine, VaccineSchedule, PatientVaccination, VaccinationStatut } from '../../types/vaccination';
import { VaccineBadge, CouvertureProgress } from './VaccineBadge';

// Calendrier PEV standard Afrique de l'Ouest
const CALENDRIER_PEV = [
  { age_label: 'Naissance', age_jours: 0, vaccins: [
    { code: 'BCG', nom: 'BCG', dose: 1 },
    { code: 'VPO0', nom: 'Polio oral 0', dose: 0 },
    { code: 'HEPB0', nom: 'Hépatite B (naissance)', dose: 0 }
  ]},
  { age_label: '6 semaines', age_jours: 42, vaccins: [
    { code: 'PENTA1', nom: 'Pentavalent', dose: 1 },
    { code: 'VPO1', nom: 'Polio oral', dose: 1 },
    { code: 'PCV1', nom: 'Pneumocoque', dose: 1 },
    { code: 'ROTA1', nom: 'Rotavirus', dose: 1 }
  ]},
  { age_label: '10 semaines', age_jours: 70, vaccins: [
    { code: 'PENTA2', nom: 'Pentavalent', dose: 2 },
    { code: 'VPO2', nom: 'Polio oral', dose: 2 },
    { code: 'PCV2', nom: 'Pneumocoque', dose: 2 },
    { code: 'ROTA2', nom: 'Rotavirus', dose: 2 }
  ]},
  { age_label: '14 semaines', age_jours: 98, vaccins: [
    { code: 'PENTA3', nom: 'Pentavalent', dose: 3 },
    { code: 'VPO3', nom: 'Polio oral', dose: 3 },
    { code: 'PCV3', nom: 'Pneumocoque', dose: 3 },
    { code: 'IPV', nom: 'Polio injectable', dose: 1 }
  ]},
  { age_label: '9 mois', age_jours: 270, vaccins: [
    { code: 'VAR1', nom: 'Rougeole-Rubéole', dose: 1 },
    { code: 'VAA', nom: 'Fièvre jaune', dose: 1 },
    { code: 'MENA', nom: 'Méningite A', dose: 1 }
  ]},
  { age_label: '15 mois', age_jours: 450, vaccins: [
    { code: 'VAR2', nom: 'Rougeole-Rubéole', dose: 2 }
  ]}
];

interface CalendrierVaccinalProps {
  patient: { id: string; nom: string; prenom: string; date_naissance: string };
  vaccinations: PatientVaccination[];
  vaccines: Vaccine[];
  schedules: VaccineSchedule[];
  onVacciner?: (vaccineId: string, dose: number) => void;
  readOnly?: boolean;
}

export const CalendrierVaccinal: React.FC<CalendrierVaccinalProps> = ({
  patient, vaccinations, vaccines, schedules, onVacciner, readOnly = false
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  
  // Calcul de l'âge du patient
  const ageInfo = useMemo(() => {
    const dob = new Date(patient.date_naissance);
    const now = new Date();
    const diffMs = now.getTime() - dob.getTime();
    const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMois = Math.floor(diffJours / 30.44);
    const diffAnnees = Math.floor(diffMois / 12);
    
    let ageText = '';
    if (diffAnnees >= 1) {
      ageText = `${diffAnnees} an${diffAnnees > 1 ? 's' : ''}`;
      const moisRestants = diffMois % 12;
      if (moisRestants > 0) ageText += ` ${moisRestants} mois`;
    } else if (diffMois >= 1) {
      ageText = `${diffMois} mois`;
    } else {
      ageText = `${diffJours} jour${diffJours > 1 ? 's' : ''}`;
    }
    
    return { jours: diffJours, mois: diffMois, annees: diffAnnees, texte: ageText };
  }, [patient.date_naissance]);
  
  // Calcul du statut de chaque vaccin
  const statutsVaccins = useMemo(() => {
    const result: Record<string, { statut: VaccinationStatut; dosesRecues: number[]; prochaineDose?: number; joursRetard?: number }> = {};
    
    const vaccinationsByVaccine = new Map<string, PatientVaccination[]>();
    vaccinations.forEach(v => {
      const existing = vaccinationsByVaccine.get(v.vaccine_id) || [];
      existing.push(v);
      vaccinationsByVaccine.set(v.vaccine_id, existing);
    });
    
    vaccines.forEach(vaccine => {
      const doneVax = vaccinationsByVaccine.get(vaccine.id) || [];
      const doneOrders = doneVax.map(v => v.dose_ordre);
      const vaccSchedules = schedules.filter(s => s.vaccine_id === vaccine.id).sort((a, b) => a.dose_ordre - b.dose_ordre);
      
      let prochaineDose: number | undefined;
      let joursRetard = 0;
      
      for (const sched of vaccSchedules) {
        if (!doneOrders.includes(sched.dose_ordre)) {
          prochaineDose = sched.dose_ordre;
          const dob = new Date(patient.date_naissance);
          const dateRecommandee = new Date(dob.getTime() + sched.age_recommande_jours * 24 * 60 * 60 * 1000);
          const now = new Date();
          if (now > dateRecommandee) {
            joursRetard = Math.floor((now.getTime() - dateRecommandee.getTime()) / (1000 * 60 * 60 * 24));
          }
          break;
        }
      }
      
      let statut: VaccinationStatut = 'a_jour';
      if (prochaineDose !== undefined) {
        if (joursRetard > 90) statut = 'perdu_de_vue';
        else if (joursRetard > 0) statut = 'en_retard';
        else if (joursRetard >= -14) statut = 'a_faire';
      }
      
      if (vaccine.age_min_jours && ageInfo.jours < vaccine.age_min_jours) {
        statut = 'a_jour';
      }
      
      result[vaccine.id] = { statut, dosesRecues: doneOrders, prochaineDose, joursRetard };
    });
    
    return result;
  }, [vaccinations, vaccines, schedules, patient.date_naissance, ageInfo.jours]);
  
  // Couverture globale
  const couvertureGlobale = useMemo(() => {
    let totalDosesRequises = 0;
    let totalDosesFaites = 0;
    
    vaccines.forEach(vaccine => {
      if (vaccine.age_min_jours && ageInfo.jours < vaccine.age_min_jours) return;
      const relevantSchedules = schedules.filter(s => s.vaccine_id === vaccine.id).filter(s => !s.age_min_jours || ageInfo.jours >= s.age_min_jours);
      totalDosesRequises += relevantSchedules.length;
      const statut = statutsVaccins[vaccine.id];
      if (statut) totalDosesFaites += statut.dosesRecues.length;
    });
    
    return totalDosesRequises > 0 ? (totalDosesFaites / totalDosesRequises) * 100 : 100;
  }, [vaccines, schedules, statutsVaccins, ageInfo.jours]);
  
  // Vaccins à faire aujourd'hui
  const vaccinsAFaireAujourdhui = useMemo(() => {
    return Object.entries(statutsVaccins)
      .filter(([_, s]) => s.statut === 'a_faire' || s.statut === 'en_retard')
      .map(([vaccineId, s]) => ({
        vaccine: vaccines.find(v => v.id === vaccineId),
        dose: s.prochaineDose,
        statut: s.statut,
        joursRetard: s.joursRetard
      }))
      .filter(v => v.vaccine);
  }, [statutsVaccins, vaccines]);
  
  return (
    <div className="space-y-6">
      {/* En-tête patient */}
      <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">📋 Carnet Vaccinal</h2>
            <p className="text-teal-100 mt-1">{patient.prenom} {patient.nom} • {ageInfo.texte}</p>
            <p className="text-sm text-teal-200">
              Né(e) le {new Date(patient.date_naissance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 min-w-[200px]">
            <CouvertureProgress pourcentage={couvertureGlobale} showLabel={true} size="lg" />
          </div>
        </div>
        
        {vaccinsAFaireAujourdhui.length > 0 && (
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <h3 className="font-semibold flex items-center gap-2">
              <span>⚠️</span>
              Vaccins à administrer ({vaccinsAFaireAujourdhui.length})
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {vaccinsAFaireAujourdhui.map((v, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                    v.statut === 'en_retard' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                  onClick={() => onVacciner?.(v.vaccine!.id, v.dose!)}
                >
                  {v.vaccine?.libelle} D{v.dose}
                  {v.joursRetard && v.joursRetard > 0 && <span className="ml-1 opacity-75">(+{v.joursRetard}j)</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Calendrier */}
      <div className="space-y-4">
        {CALENDRIER_PEV.map((periode, index) => {
          const isCurrentPeriod = ageInfo.jours >= periode.age_jours && 
            (index === CALENDRIER_PEV.length - 1 || ageInfo.jours < CALENDRIER_PEV[index + 1].age_jours);
          const isPastPeriod = ageInfo.jours > periode.age_jours + 30;
          
          return (
            <div
              key={periode.age_label}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                isCurrentPeriod 
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 shadow-lg ring-2 ring-teal-500/20' 
                  : isPastPeriod 
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCurrentPeriod ? 'bg-teal-500 text-white' : isPastPeriod ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <h4 className={`font-semibold ${isCurrentPeriod ? 'text-teal-600' : 'text-gray-800 dark:text-gray-200'}`}>
                      {periode.age_label}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {periode.age_jours === 0 ? 'À la naissance' : `≈ ${Math.round(periode.age_jours / 7)} semaines`}
                    </p>
                  </div>
                </div>
                
                {isCurrentPeriod && (
                  <span className="px-3 py-1 bg-teal-500 text-white text-xs font-bold rounded-full animate-pulse">
                    MAINTENANT
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {periode.vaccins.map(vaccinPev => {
                  const vaccine = vaccines.find(v => v.code === vaccinPev.code);
                  const statut = vaccine ? statutsVaccins[vaccine.id] : null;
                  const isDone = statut?.dosesRecues?.includes(vaccinPev.dose);
                  
                  return (
                    <div
                      key={`${vaccinPev.code}-${vaccinPev.dose}`}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                        isDone 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
                          : isCurrentPeriod && !isDone
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 cursor-pointer hover:shadow-md'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => {
                        if (!readOnly && !isDone && vaccine && onVacciner) {
                          onVacciner(vaccine.id, vaccinPev.dose);
                        }
                      }}
                    >
                      <span className={`text-lg ${isDone ? 'opacity-100' : 'opacity-40'}`}>
                        {isDone ? '✅' : '💉'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-emerald-700 dark:text-emerald-400' : ''}`}>
                          {vaccinPev.nom}
                        </p>
                        <p className="text-xs text-gray-500">Dose {vaccinPev.dose}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Légende */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Légende</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-emerald-500 rounded"></span>
            <span className="text-sm text-gray-500">Fait</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-amber-500 rounded"></span>
            <span className="text-sm text-gray-500">À faire</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-rose-500 rounded"></span>
            <span className="text-sm text-gray-500">En retard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-700 rounded"></span>
            <span className="text-sm text-gray-500">Perdu de vue</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendrierVaccinal;

