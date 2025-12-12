/**
 * Dashboard Principal du Module Vaccination
 */
import React, { useMemo } from 'react';
import { Vaccine, PatientVaccination, VaccinationReminder, LotVaccin, RelevéTemperature, Refrigerateur, MAPI, CampagneVaccination, StatistiquesVaccination } from '../../types/vaccination';
import { CouvertureProgress, TemperatureBadge } from './VaccineBadge';
import { TemperatureChart } from './TemperatureChart';

interface VaccinationDashboardProps {
  vaccines: Vaccine[];
  recentVaccinations: PatientVaccination[];
  upcomingReminders: VaccinationReminder[];
  lots: LotVaccin[];
  refrigerateurs: Refrigerateur[];
  relevesTemperature: RelevéTemperature[];
  mapiRecentes: MAPI[];
  campagnesActives: CampagneVaccination[];
  statistiques?: StatistiquesVaccination;
  onNavigateToSection?: (section: string) => void;
  onVacciner?: () => void;
  onReleverTemperature?: () => void;
}

export const VaccinationDashboard: React.FC<VaccinationDashboardProps> = ({
  vaccines, recentVaccinations, upcomingReminders, lots, refrigerateurs, relevesTemperature,
  mapiRecentes, campagnesActives, statistiques, onNavigateToSection, onVacciner, onReleverTemperature
}) => {
  const kpis = useMemo(() => {
    const aujourdhui = new Date();
    const debutSemaine = new Date(aujourdhui);
    debutSemaine.setDate(debutSemaine.getDate() - 7);
    
    const vaccinationsSemaine = recentVaccinations.filter(v => new Date(v.date_administration) >= debutSemaine).length;
    const rappelsAujourdhui = upcomingReminders.filter(r => {
      const date = new Date(r.planned_at);
      return date.toDateString() === aujourdhui.toDateString() && r.statut === 'planifie';
    }).length;
    
    const in30Days = new Date(aujourdhui.getTime() + 30 * 24 * 60 * 60 * 1000);
    const lotsEnAlerte = lots.filter(l => {
      const exp = new Date(l.date_expiration);
      return (exp <= in30Days && l.statut === 'actif') || l.quantite_disponible < 10;
    }).length;
    
    const refrigEnAlerte = refrigerateurs.filter(r => r.statut_alerte !== 'normal').length;
    const mapiNonTransmises = mapiRecentes.filter(m => !m.transmis_niveau_superieur).length;
    
    return { vaccinationsSemaine, rappelsAujourdhui, lotsEnAlerte, refrigEnAlerte, mapiNonTransmises, couvertureGlobale: statistiques?.taux_couverture_global || 0 };
  }, [recentVaccinations, upcomingReminders, lots, refrigerateurs, mapiRecentes, statistiques]);
  
  const vaccinationsParType = useMemo(() => {
    const grouped: Record<string, number> = {};
    recentVaccinations.slice(0, 50).forEach(v => {
      const vaccine = vaccines.find(vac => vac.id === v.vaccine_id);
      const key = vaccine?.libelle || 'Autre';
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [recentVaccinations, vaccines]);
  
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-br from-teal-500 via-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">💉</span>
              Module Vaccination
            </h1>
            <p className="text-teal-100 mt-2 max-w-xl">Programme Élargi de Vaccination (PEV) • Suivi des carnets vaccinaux, chaîne de froid et campagnes</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={onVacciner} className="px-5 py-3 bg-white text-teal-600 rounded-xl font-bold hover:bg-white/90 transition-all shadow-lg flex items-center gap-2">
              <span>💉</span> Vacciner un patient
            </button>
            <button onClick={onReleverTemperature} className="px-5 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all flex items-center gap-2">
              <span>🌡️</span> Relever température
            </button>
          </div>
        </div>
        
        {(kpis.refrigEnAlerte > 0 || kpis.mapiNonTransmises > 0) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {kpis.refrigEnAlerte > 0 && (
              <div onClick={() => onNavigateToSection?.('temperature')} className="px-4 py-2 bg-rose-500/90 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-rose-500 animate-pulse">
                <span>🚨</span><span className="font-semibold">{kpis.refrigEnAlerte} alerte(s) température</span>
              </div>
            )}
            {kpis.mapiNonTransmises > 0 && (
              <div onClick={() => onNavigateToSection?.('mapi')} className="px-4 py-2 bg-purple-500/90 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-purple-500">
                <span>📋</span><span className="font-semibold">{kpis.mapiNonTransmises} MAPI à transmettre</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: 'Vaccinations', subtitle: 'Cette semaine', value: kpis.vaccinationsSemaine, icon: '💉', color: 'bg-emerald-500', onClick: () => onNavigateToSection?.('calendrier') },
          { title: 'Rappels', subtitle: 'Aujourd\'hui', value: kpis.rappelsAujourdhui, icon: '📲', color: 'bg-blue-500', alert: kpis.rappelsAujourdhui > 0, onClick: () => onNavigateToSection?.('campagnes') },
          { title: 'Couverture', subtitle: 'Globale', value: `${kpis.couvertureGlobale.toFixed(0)}%`, icon: '📊', color: kpis.couvertureGlobale >= 80 ? 'bg-emerald-500' : 'bg-amber-500' },
          { title: 'Alertes Stock', subtitle: 'Lots concernés', value: kpis.lotsEnAlerte, icon: '📦', color: kpis.lotsEnAlerte > 0 ? 'bg-rose-500' : 'bg-gray-400', alert: kpis.lotsEnAlerte > 0, onClick: () => onNavigateToSection?.('stock') },
          { title: 'Chaîne Froid', subtitle: 'Réfrigérateurs', value: refrigerateurs.length, icon: '🌡️', color: kpis.refrigEnAlerte > 0 ? 'bg-rose-500' : 'bg-teal-500', alert: kpis.refrigEnAlerte > 0, onClick: () => onNavigateToSection?.('temperature') },
          { title: 'Campagnes', subtitle: 'En cours', value: campagnesActives.length, icon: '📢', color: 'bg-purple-500', onClick: () => onNavigateToSection?.('campagnes') }
        ].map((kpi, idx) => (
          <div key={idx} onClick={kpi.onClick} className={`relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] ${kpi.alert ? 'ring-2 ring-rose-400' : ''}`}>
            <div className="flex items-center gap-3">
              <span className={`w-11 h-11 ${kpi.color} text-white rounded-xl flex items-center justify-center text-xl`}>{kpi.icon}</span>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.title}</p>
                <p className="text-xs text-gray-400">{kpi.subtitle}</p>
              </div>
            </div>
            {kpi.alert && <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />}
          </div>
        ))}
      </div>
      
      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Températures */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2"><span>🌡️</span> Chaîne de froid</h2>
              <button onClick={() => onNavigateToSection?.('temperature')} className="text-sm text-teal-600 hover:underline">Voir tout →</button>
            </div>
            
            {refrigerateurs.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {refrigerateurs.slice(0, 4).map(refrig => (
                    <div key={refrig.id} className={`p-3 rounded-xl border-2 transition-all ${
                      refrig.statut_alerte === 'normal' ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30' :
                      refrig.statut_alerte === 'attention' ? 'border-amber-200 bg-amber-50' : 'border-rose-300 bg-rose-50 animate-pulse'
                    }`}>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{refrig.nom}</p>
                      <div className="flex items-center justify-between mt-1">
                        {refrig.derniere_temperature !== undefined ? (
                          <TemperatureBadge temperature={refrig.derniere_temperature} min={refrig.temperature_min} max={refrig.temperature_max} />
                        ) : <span className="text-xs text-gray-500">Pas de données</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {relevesTemperature.length > 0 && <TemperatureChart releves={relevesTemperature} refrigerateur={refrigerateurs[0]} jours={7} showAlerts={false} />}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">🌡️ Aucun réfrigérateur configuré</div>
            )}
          </div>
          
          {/* Vaccinations récentes */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4"><span>💉</span> Vaccinations récentes</h2>
            {recentVaccinations.length > 0 ? (
              <div className="space-y-3">
                {recentVaccinations.slice(0, 5).map(vax => {
                  const vaccine = vaccines.find(v => v.id === vax.vaccine_id);
                  return (
                    <div key={vax.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-lg">✓</span>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{vaccine?.libelle || 'Vaccin'} - Dose {vax.dose_ordre}</p>
                          <p className="text-sm text-gray-500">Lot: {vax.numero_lot} • {vax.vaccinateur}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{new Date(vax.date_administration).toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs text-gray-500">{vax.site_injection}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="py-8 text-center text-gray-500">📋 Aucune vaccination récente</div>}
          </div>
        </div>
        
        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Rappels */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4"><span>📲</span> Rappels à envoyer</h3>
            {upcomingReminders.filter(r => r.statut === 'planifie').slice(0, 5).length > 0 ? (
              <div className="space-y-2">
                {upcomingReminders.filter(r => r.statut === 'planifie').slice(0, 5).map(reminder => (
                  <div key={reminder.id} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{reminder.patient_nom}</p>
                    <p className="text-xs text-gray-500">{reminder.vaccin_libelle} D{reminder.dose_ordre}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-blue-600">{new Date(reminder.planned_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-sm">{reminder.channel === 'sms' && '📱'}{reminder.channel === 'whatsapp' && '💬'}{reminder.channel === 'appel' && '📞'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="py-6 text-center text-gray-500">✓ Aucun rappel en attente</div>}
            <button onClick={() => onNavigateToSection?.('campagnes')} className="w-full mt-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Gérer les rappels →</button>
          </div>
          
          {/* Top vaccins */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4"><span>📊</span> Top vaccins (7j)</h3>
            {vaccinationsParType.length > 0 ? (
              <div className="space-y-3">
                {vaccinationsParType.map(([nom, count], idx) => (
                  <div key={nom} className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-teal-500' : idx === 2 ? 'bg-blue-500' : 'bg-gray-400'}`}>{idx + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{nom}</p>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                        <div className={`h-full rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-teal-500' : idx === 2 ? 'bg-blue-500' : 'bg-gray-400'}`} style={{ width: `${(count / vaccinationsParType[0][1]) * 100}%` }} />
                      </div>
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{count}</span>
                  </div>
                ))}
              </div>
            ) : <div className="py-6 text-center text-gray-500">📊 Pas de données</div>}
          </div>
          
          {/* Campagnes */}
          {campagnesActives.length > 0 && (
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white">
              <h3 className="font-bold flex items-center gap-2 mb-4"><span>📢</span> Campagne en cours</h3>
              {campagnesActives.slice(0, 1).map(campagne => (
                <div key={campagne.id}>
                  <p className="font-semibold text-lg">{campagne.nom}</p>
                  <p className="text-purple-200 text-sm mb-3">{new Date(campagne.date_debut).toLocaleDateString('fr-FR')} - {new Date(campagne.date_fin).toLocaleDateString('fr-FR')}</p>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progression</span><span className="font-bold">{campagne.taux_couverture.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-white/30 rounded-full"><div className="h-full bg-white rounded-full" style={{ width: `${campagne.taux_couverture}%` }} /></div>
                    <p className="text-xs text-purple-200 mt-2">{campagne.vaccinations_realisees} / {campagne.population_cible} vaccinés</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* MAPI */}
          {mapiRecentes.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-5">
              <h3 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-3"><span>⚠️</span> MAPI récentes</h3>
              <div className="space-y-2">
                {mapiRecentes.slice(0, 3).map(mapi => (
                  <div key={mapi.id} className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-rose-200 dark:border-rose-700">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{mapi.patient_nom}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        mapi.gravite === 'legere' ? 'bg-yellow-100 text-yellow-700' :
                        mapi.gravite === 'moderee' ? 'bg-orange-100 text-orange-700' :
                        mapi.gravite === 'severe' ? 'bg-rose-100 text-rose-700' : 'bg-red-200 text-red-800'
                      }`}>{mapi.gravite}</span>
                    </div>
                    <p className="text-xs text-gray-500">{mapi.vaccin_libelle} • {new Date(mapi.date_survenue).toLocaleDateString('fr-FR')}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => onNavigateToSection?.('mapi')} className="w-full mt-3 py-2 border border-rose-300 dark:border-rose-700 rounded-lg text-sm font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors">Voir toutes les MAPI →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VaccinationDashboard;

