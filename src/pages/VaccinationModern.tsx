/**
 * Page Vaccination Moderne - LogiClinic
 * Module complet de vaccination avec design UI/UX avancé
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { VaccinationService, Vaccine, VaccineSchedule, PatientVaccination } from '../services/vaccinationService';
import type { VaccinationReminder } from '../types/vaccination';
import PatientSelector from '../components/shared/PatientSelector';
import PatientCard from '../components/shared/PatientCard';

// Imports des nouveaux composants
import {
  VaccinationDashboard,
  CalendrierVaccinal,
  GestionStockVaccins,
  TemperatureChart,
  TemperatureInputForm,
  FormulaireMAPI,
  CampagneSMS,
  VaccineBadge
} from '../components/vaccination';

import type { LotVaccin, FlaconOuvert, RelevéTemperature, Refrigerateur, MAPI, CampagneVaccination, StatistiquesVaccination } from '../types/vaccination';

type TabType = 'dashboard' | 'vacciner' | 'calendrier' | 'stock' | 'temperature' | 'mapi' | 'campagnes' | 'rapports';

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  { key: 'vacciner', label: 'Vacciner', icon: '💉' },
  { key: 'calendrier', label: 'Calendrier PEV', icon: '📅' },
  { key: 'stock', label: 'Stock & Lots', icon: '📦' },
  { key: 'temperature', label: 'Chaîne de froid', icon: '🌡️' },
  { key: 'mapi', label: 'MAPI', icon: '⚠️' },
  { key: 'campagnes', label: 'Rappels & SMS', icon: '📲' },
  { key: 'rapports', label: 'Rapports', icon: '📈' }
];

const VaccinationModern: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [schedules, setSchedules] = useState<VaccineSchedule[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientVaccinations, setPatientVaccinations] = useState<PatientVaccination[]>([]);
  const [openPatientSelector, setOpenPatientSelector] = useState(false);
  
  const [selectedVaccineId, setSelectedVaccineId] = useState('');
  const [selectedDose, setSelectedDose] = useState<number | null>(null);
  const [vaccinationForm, setVaccinationForm] = useState({
    date_administration: new Date().toISOString().split('T')[0],
    lieu: '', numero_lot: '', date_peremption: '', vaccinateur: '',
    site_injection: 'Cuisse gauche', voie_administration: 'IM' as 'IM' | 'SC' | 'ID' | 'orale',
    effets_secondaires: '', observation: ''
  });
  
  const [lots, setLots] = useState<LotVaccin[]>([]);
  const [flaconOuverts, setFlaconOuverts] = useState<FlaconOuvert[]>([]);
  const [refrigerateurs, setRefrigerateurs] = useState<Refrigerateur[]>([]);
  const [relevesTemperature, setRelevesTemperature] = useState<RelevéTemperature[]>([]);
  const [mapiList, setMapiList] = useState<MAPI[]>([]);
  const [showMapiForm, setShowMapiForm] = useState(false);
  const [selectedVaccinationForMapi, setSelectedVaccinationForMapi] = useState<PatientVaccination | null>(null);
  const [reminders, setReminders] = useState<VaccinationReminder[]>([]);
  const [campagnes, setCampagnes] = useState<CampagneVaccination[]>([]);
  const [statistiques, setStatistiques] = useState<StatistiquesVaccination | null>(null);
  
  useEffect(() => { loadInitialData(); }, []);
  
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const vaccinesData = await VaccinationService.listVaccines();
      setVaccines(vaccinesData);
      
      const allSchedules: VaccineSchedule[] = [];
      for (const v of vaccinesData) {
        const s = await VaccinationService.getVaccineSchedules(v.id);
        allSchedules.push(...s);
      }
      setSchedules(allSchedules);
      
      const remindersData = await VaccinationService.listUpcomingReminders();
      setReminders(remindersData as any);
      
      const statsData = await VaccinationService.getStats({});
      setStatistiques({
        periode: { debut: '', fin: '' }, total_doses: statsData.totalDoses, total_patients: 0,
        par_vaccin: Object.entries(statsData.byVaccine).map(([id, count]) => ({
          vaccine_id: id, libelle: vaccinesData.find(v => v.id === id)?.libelle || id, doses: count as number, pourcentage: 0
        })),
        par_tranche_age: [], taux_couverture_global: 75,
        rendez_vous: { honores: statsData.honorés, manques: statsData.manqués, taux_presence: statsData.honorés / (statsData.honorés + statsData.manqués || 1) * 100 },
        perdus_de_vue: 0, mapi_declares: 0, taux_perte_vaccins: 0
      });
      
      // Données démo réfrigérateurs
      setRefrigerateurs([
        { id: '1', nom: 'Réfrigérateur Principal', emplacement: 'Salle de vaccination', temperature_min: 2, temperature_max: 8, actif: true, derniere_temperature: 4.5, derniere_lecture: new Date().toISOString(), statut_alerte: 'normal' },
        { id: '2', nom: 'Réfrigérateur Secondaire', emplacement: 'Réserve', temperature_min: 2, temperature_max: 8, actif: true, derniere_temperature: 5.2, derniere_lecture: new Date().toISOString(), statut_alerte: 'normal' }
      ]);
      
      // Relevés démo
      const demoReleves: RelevéTemperature[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(); date.setDate(date.getDate() - i);
        demoReleves.push({ id: `m${i}`, refrigerateur_id: '1', refrigerateur_nom: 'Réfrigérateur Principal', date: date.toISOString(), heure: 'matin', temperature_celsius: 3.5 + Math.random() * 2, est_conforme: true, enregistre_par: 'Infirmier', created_at: date.toISOString() });
        demoReleves.push({ id: `s${i}`, refrigerateur_id: '1', refrigerateur_nom: 'Réfrigérateur Principal', date: date.toISOString(), heure: 'soir', temperature_celsius: 4 + Math.random() * 2.5, est_conforme: true, enregistre_par: 'Infirmier', created_at: date.toISOString() });
      }
      setRelevesTemperature(demoReleves);
      
    } catch (err) { setError('Erreur lors du chargement des données'); console.error(err); }
    finally { setIsLoading(false); }
  };
  
  const loadPatientData = async (patientId: string) => {
    try {
      const card = await VaccinationService.getPatientCard(patientId);
      setPatientVaccinations(card.doses);
      const rem = await VaccinationService.listUpcomingReminders(patientId);
      setReminders(prev => [...prev.filter(r => r.patient_id !== patientId), ...(rem as any)]);
    } catch (err) { console.error('Erreur chargement données patient:', err); }
  };
  
  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    setOpenPatientSelector(false);
    await loadPatientData(patient.id);
    setActiveTab('vacciner');
  };
  
  const nextDoseOptions = useMemo(() => {
    if (!selectedVaccineId || !selectedPatient) return [];
    const vaccineSchedules = schedules.filter(s => s.vaccine_id === selectedVaccineId).sort((a, b) => a.dose_ordre - b.dose_ordre);
    const doneOrders = new Set(patientVaccinations.filter(v => v.vaccine_id === selectedVaccineId && v.statut === 'valide').map(v => v.dose_ordre));
    return vaccineSchedules.filter(s => !doneOrders.has(s.dose_ordre)).map(s => ({ dose: s.dose_ordre, label: s.libelle_dose || `Dose ${s.dose_ordre}`, schedule: s }));
  }, [selectedVaccineId, schedules, patientVaccinations, selectedPatient]);
  
  const handleRecordVaccination = async () => {
    setError(null);
    if (!selectedPatient) { setError('Veuillez sélectionner un patient'); return; }
    if (!selectedVaccineId) { setError('Veuillez sélectionner un vaccin'); return; }
    if (!selectedDose) { setError('Veuillez sélectionner la dose'); return; }
    if (!vaccinationForm.date_administration) { setError('Date d\'administration requise'); return; }
    
    try {
      const schedule = schedules.find(s => s.vaccine_id === selectedVaccineId && s.dose_ordre === selectedDose);
      await VaccinationService.recordDose({
        patient_id: selectedPatient.id, vaccine_id: selectedVaccineId, schedule_id: schedule?.id, dose_ordre: selectedDose,
        date_administration: vaccinationForm.date_administration, lieu: vaccinationForm.lieu, numero_lot: vaccinationForm.numero_lot,
        date_peremption: vaccinationForm.date_peremption || undefined, vaccinateur: vaccinationForm.vaccinateur,
        effets_secondaires: vaccinationForm.effets_secondaires || undefined, statut: 'valide'
      } as any);
      
      if (schedule?.delai_rappel_jours && schedule.delai_rappel_jours > 0) {
        const plannedDate = new Date(vaccinationForm.date_administration);
        plannedDate.setDate(plannedDate.getDate() + schedule.delai_rappel_jours);
        await VaccinationService.scheduleReminder({ patient_id: selectedPatient.id, vaccine_id: selectedVaccineId, schedule_id: schedule.id, dose_ordre: selectedDose + 1, planned_at: plannedDate.toISOString(), channel: 'sms', statut: 'planifie', details: 'Rappel vaccination automatique' } as any);
      }
      
      await loadPatientData(selectedPatient.id);
      setSelectedVaccineId(''); setSelectedDose(null);
      setVaccinationForm({ ...vaccinationForm, numero_lot: '', date_peremption: '', effets_secondaires: '', observation: '' });
      setSuccessMessage('Vaccination enregistrée avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) { setError('Erreur lors de l\'enregistrement'); console.error(err); }
  };
  
  const handleNavigateToSection = (section: string) => { setActiveTab(section as TabType); };
  
  const handleEnvoyerRappel = async (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      // Convertir le reminder au type attendu par le service
      const serviceReminder = {
        id: reminder.id,
        patient_id: reminder.patient_id,
        vaccine_id: reminder.vaccine_id,
        schedule_id: reminder.schedule_id,
        dose_ordre: reminder.dose_ordre,
        planned_at: reminder.planned_at,
        channel: reminder.channel === 'whatsapp' || reminder.channel === 'appel' ? 'sms' : reminder.channel as 'sms' | 'notification' | 'email',
        statut: reminder.statut === 'delivre' || reminder.statut === 'echoue' ? 'envoye' : reminder.statut as 'planifie' | 'envoye' | 'manque' | 'annule',
        details: reminder.details || reminder.message || undefined,
        created_at: reminder.created_at,
        updated_at: reminder.updated_at
      };
      await VaccinationService.notifyReminder(serviceReminder);
      await VaccinationService.markReminderSent(reminderId);
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, statut: 'envoye' as const } : r));
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-lg font-medium text-gray-800 dark:text-gray-200">Chargement du module vaccination...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <span>❌</span><span>{error}</span><button onClick={() => setError(null)} className="ml-auto">✕</button>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center gap-2 animate-pulse">
            <span>✅</span><span>{successMessage}</span>
          </div>
        )}
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <VaccinationDashboard vaccines={vaccines} recentVaccinations={patientVaccinations} upcomingReminders={reminders} lots={lots} refrigerateurs={refrigerateurs} relevesTemperature={relevesTemperature} mapiRecentes={mapiList} campagnesActives={campagnes.filter(c => c.statut === 'en_cours')} statistiques={statistiques || undefined} onNavigateToSection={handleNavigateToSection} onVacciner={() => setOpenPatientSelector(true)} onReleverTemperature={() => setActiveTab('temperature')} />
        )}
        
        {/* VACCINER */}
        {activeTab === 'vacciner' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4"><span>👤</span> Patient</h2>
              {selectedPatient ? (
                <div className="flex items-start gap-4">
                  <PatientCard patient={selectedPatient} compact />
                  <button onClick={() => setOpenPatientSelector(true)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Changer</button>
                </div>
              ) : (
                <button onClick={() => setOpenPatientSelector(true)} className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:border-teal-500 hover:text-teal-500 transition-colors flex flex-col items-center gap-2">
                  <span className="text-4xl">👆</span><span className="font-medium">Sélectionner un patient</span>
                </button>
              )}
            </div>
            
            {selectedPatient && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-6"><span>💉</span> Enregistrer une vaccination</h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vaccin *</label>
                      <select value={selectedVaccineId} onChange={(e) => { setSelectedVaccineId(e.target.value); setSelectedDose(null); }} className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                        <option value="">Sélectionner un vaccin...</option>
                        {vaccines.map(v => <option key={v.id} value={v.id}>{v.libelle}</option>)}
                      </select>
                    </div>
                    
                    {selectedVaccineId && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dose *</label>
                        <div className="flex flex-wrap gap-2">
                          {nextDoseOptions.map(opt => (
                            <button key={opt.dose} type="button" onClick={() => setSelectedDose(opt.dose)} className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedDose === opt.dose ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{opt.label}</button>
                          ))}
                          {nextDoseOptions.length === 0 && <p className="text-sm text-emerald-600 flex items-center gap-2"><span>✅</span> Toutes les doses ont été administrées</p>}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date d'administration *</label>
                        <input type="date" value={vaccinationForm.date_administration} onChange={(e) => setVaccinationForm({...vaccinationForm, date_administration: e.target.value})} max={new Date().toISOString().split('T')[0]} className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lieu</label>
                        <input type="text" value={vaccinationForm.lieu} onChange={(e) => setVaccinationForm({...vaccinationForm, lieu: e.target.value})} placeholder="Centre de santé" className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">N° Lot</label>
                        <input type="text" value={vaccinationForm.numero_lot} onChange={(e) => setVaccinationForm({...vaccinationForm, numero_lot: e.target.value})} placeholder="Ex: ABC123" className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date péremption</label>
                        <input type="date" value={vaccinationForm.date_peremption} onChange={(e) => setVaccinationForm({...vaccinationForm, date_peremption: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Site d'injection</label>
                        <select value={vaccinationForm.site_injection} onChange={(e) => setVaccinationForm({...vaccinationForm, site_injection: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                          <option value="Cuisse gauche">Cuisse gauche</option>
                          <option value="Cuisse droite">Cuisse droite</option>
                          <option value="Bras gauche">Bras gauche</option>
                          <option value="Bras droit">Bras droit</option>
                          <option value="Oral">Oral (voie orale)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Voie</label>
                        <select value={vaccinationForm.voie_administration} onChange={(e) => setVaccinationForm({...vaccinationForm, voie_administration: e.target.value as any})} className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                          <option value="IM">Intramusculaire (IM)</option>
                          <option value="SC">Sous-cutanée (SC)</option>
                          <option value="ID">Intradermique (ID)</option>
                          <option value="orale">Voie orale</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vaccinateur</label>
                      <input type="text" value={vaccinationForm.vaccinateur} onChange={(e) => setVaccinationForm({...vaccinationForm, vaccinateur: e.target.value})} placeholder="Nom du vaccinateur" className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                    </div>
                    
                    <button onClick={handleRecordVaccination} disabled={!selectedVaccineId || !selectedDose} className="w-full h-12 bg-emerald-500 text-white rounded-xl font-bold text-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                      <span>💉</span> Enregistrer la vaccination
                    </button>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-6"><span>📋</span> Carnet vaccinal</h2>
                  {patientVaccinations.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {patientVaccinations.sort((a, b) => new Date(b.date_administration).getTime() - new Date(a.date_administration).getTime()).map(vax => {
                        const vaccine = vaccines.find(v => v.id === vax.vaccine_id);
                        return (
                          <div key={vax.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{vaccine?.libelle || 'Vaccin'}</p>
                                <p className="text-sm text-teal-600 font-medium">Dose {vax.dose_ordre}</p>
                              </div>
                              <VaccineBadge statut="a_jour" size="sm" />
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              <div><span className="text-gray-500">Date: </span><span className="font-medium text-gray-800 dark:text-gray-200">{new Date(vax.date_administration).toLocaleDateString('fr-FR')}</span></div>
                              <div><span className="text-gray-500">Lot: </span><span className="font-mono text-gray-800 dark:text-gray-200">{vax.numero_lot || '-'}</span></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <div className="py-12 text-center text-gray-500"><span className="text-4xl">📋</span><p className="mt-2">Aucune vaccination enregistrée</p></div>}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* CALENDRIER */}
        {activeTab === 'calendrier' && selectedPatient && (
          <CalendrierVaccinal patient={{ id: selectedPatient.id, nom: selectedPatient.nom, prenom: selectedPatient.prenom, date_naissance: selectedPatient.date_naissance }} vaccinations={patientVaccinations} vaccines={vaccines} schedules={schedules} onVacciner={(vaccineId, dose) => { setSelectedVaccineId(vaccineId); setSelectedDose(dose); setActiveTab('vacciner'); }} />
        )}
        {activeTab === 'calendrier' && !selectedPatient && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <span className="text-6xl">👤</span>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-4">Sélectionnez un patient</h2>
            <p className="text-gray-500 mt-2">Pour voir le calendrier vaccinal, veuillez d'abord sélectionner un patient.</p>
            <button onClick={() => setOpenPatientSelector(true)} className="mt-6 px-6 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors">Sélectionner un patient</button>
          </div>
        )}
        
        {/* STOCK */}
        {activeTab === 'stock' && <GestionStockVaccins lots={lots} vaccines={vaccines} flaconOuverts={flaconOuverts} />}
        
        {/* TEMPERATURE */}
        {activeTab === 'temperature' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-6"><span>🌡️</span> Saisie du relevé de température</h2>
              <TemperatureInputForm refrigerateurs={refrigerateurs} onSubmit={(data) => {
                const newReleve: RelevéTemperature = { id: Date.now().toString(), refrigerateur_id: data.refrigerateur_id, refrigerateur_nom: refrigerateurs.find(r => r.id === data.refrigerateur_id)?.nom || '', date: new Date().toISOString(), heure: data.heure, temperature_celsius: data.temperature, est_conforme: data.temperature >= 2 && data.temperature <= 8, enregistre_par: 'Utilisateur', actions_correctives: data.actions_correctives, created_at: new Date().toISOString() };
                setRelevesTemperature(prev => [...prev, newReleve]);
                setSuccessMessage('Relevé de température enregistré');
                setTimeout(() => setSuccessMessage(null), 3000);
              }} />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <TemperatureChart releves={relevesTemperature} refrigerateur={refrigerateurs[0]} jours={7} showAlerts={true} />
            </div>
          </div>
        )}
        
        {/* MAPI */}
        {activeTab === 'mapi' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2"><span>⚠️</span> Manifestations Adverses Post-Immunisation</h2>
              <button onClick={() => { if (patientVaccinations.length > 0) { setSelectedVaccinationForMapi(patientVaccinations[0]); setShowMapiForm(true); } else { setError('Sélectionnez un patient avec des vaccinations pour déclarer une MAPI'); }}} className="px-4 py-2 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 flex items-center gap-2"><span>+</span> Déclarer une MAPI</button>
            </div>
            {mapiList.length > 0 ? (
              <div className="space-y-4">
                {mapiList.map(mapi => (
                  <div key={mapi.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-start justify-between">
                      <div><h3 className="font-bold text-gray-800 dark:text-gray-200">{mapi.patient_nom}</h3><p className="text-sm text-gray-500">{mapi.vaccin_libelle} • Lot: {mapi.numero_lot}</p></div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${mapi.gravite === 'legere' ? 'bg-yellow-100 text-yellow-700' : mapi.gravite === 'moderee' ? 'bg-orange-100 text-orange-700' : mapi.gravite === 'severe' ? 'bg-rose-100 text-rose-700' : 'bg-red-200 text-red-800'}`}>{mapi.gravite}</span>
                    </div>
                    <p className="mt-3 text-gray-800 dark:text-gray-200">{mapi.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {new Date(mapi.date_survenue).toLocaleDateString('fr-FR')}</span>
                      <span>⏱️ {mapi.delai_heures}h après vaccination</span>
                      {mapi.transmis_niveau_superieur && <span className="text-emerald-600">✓ Transmis</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <span className="text-6xl">✅</span><h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-4">Aucune MAPI déclarée</h3><p className="text-gray-500 mt-2">Les manifestations adverses post-immunisation seront listées ici.</p>
              </div>
            )}
          </div>
        )}
        
        {/* CAMPAGNES */}
        {activeTab === 'campagnes' && <CampagneSMS reminders={reminders} campagnes={campagnes} onEnvoyerRappel={handleEnvoyerRappel} onEnvoyerLot={async (ids) => { for (const id of ids) { await handleEnvoyerRappel(id); }}} />}
        
        {/* RAPPORTS */}
        {activeTab === 'rapports' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-6"><span>📈</span> Rapports et Statistiques</h2>
            {statistiques && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl"><p className="text-3xl font-bold text-emerald-600">{statistiques.total_doses}</p><p className="text-sm text-emerald-600/80">Total doses</p></div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl"><p className="text-3xl font-bold text-blue-600">{statistiques.taux_couverture_global.toFixed(0)}%</p><p className="text-sm text-blue-600/80">Couverture globale</p></div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl"><p className="text-3xl font-bold text-amber-600">{statistiques.rendez_vous.honores}</p><p className="text-sm text-amber-600/80">RDV honorés</p></div>
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl"><p className="text-3xl font-bold text-rose-600">{statistiques.rendez_vous.manques}</p><p className="text-sm text-rose-600/80">RDV manqués</p></div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Doses par vaccin</h3>
                  <div className="space-y-3">
                    {statistiques.par_vaccin.map(v => (
                      <div key={v.vaccine_id} className="flex items-center gap-4">
                        <span className="w-32 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{v.libelle}</span>
                        <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(v.doses / Math.max(...statistiques.par_vaccin.map(x => x.doses))) * 100}%` }} />
                        </div>
                        <span className="font-bold text-gray-800 dark:text-gray-200 w-12 text-right">{v.doses}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <PatientSelector open={openPatientSelector} onClose={() => setOpenPatientSelector(false)} onSelect={handleSelectPatient} title="Sélectionner un patient pour la vaccination" allowCreate={true} onCreateNew={() => { window.location.href = '/patients?action=create&service=Vaccination'; }} />
      
      {showMapiForm && selectedVaccinationForMapi && selectedPatient && (
        <Dialog open={showMapiForm} onClose={() => setShowMapiForm(false)} maxWidth="md" fullWidth>
          <DialogContent sx={{ p: 0 }}>
            <FormulaireMAPI vaccination={selectedVaccinationForMapi} vaccine={vaccines.find(v => v.id === selectedVaccinationForMapi.vaccine_id)!} patient={selectedPatient} onSubmit={(mapi) => { setMapiList(prev => [...prev, { ...mapi, id: Date.now().toString() } as MAPI]); setShowMapiForm(false); setSuccessMessage('MAPI déclarée avec succès'); setTimeout(() => setSuccessMessage(null), 3000); }} onCancel={() => setShowMapiForm(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VaccinationModern;
