/**
 * Composant Campagne SMS et Rappels
 */
import React, { useState, useMemo } from 'react';
import { VaccinationReminder, CampagneVaccination, ModeleSMS } from '../../types/vaccination';

const MODELES_SMS_DEFAUT: ModeleSMS[] = [
  { id: 'rappel_rdv', type: 'rappel_rdv', libelle: 'Rappel rendez-vous',
    contenu: 'Rappel: Votre enfant {nom} doit recevoir son vaccin {vaccin} demain au centre de santé.',
    variables: ['nom', 'vaccin', 'heure', 'centre'], actif: true },
  { id: 'rappel_retard', type: 'rappel_retard', libelle: 'Vaccin en retard',
    contenu: 'Important: Le vaccin {vaccin} de {nom} est en retard de {jours} jours.',
    variables: ['nom', 'vaccin', 'jours'], actif: true },
  { id: 'confirmation', type: 'confirmation', libelle: 'Confirmation vaccination',
    contenu: '{nom} a bien reçu le vaccin {vaccin} (Dose {dose}) le {date}.',
    variables: ['nom', 'vaccin', 'dose', 'date', 'prochain_rdv'], actif: true },
  { id: 'campagne', type: 'campagne', libelle: 'Campagne de vaccination',
    contenu: 'Campagne {campagne}: Amenez {nom} pour le vaccin {vaccin} du {date_debut} au {date_fin}. Gratuit!',
    variables: ['campagne', 'nom', 'vaccin', 'date_debut', 'date_fin'], actif: true }
];

interface CampagneSMSProps {
  reminders: VaccinationReminder[];
  campagnes?: CampagneVaccination[];
  modeles?: ModeleSMS[];
  onEnvoyerRappel: (reminderId: string) => Promise<void>;
  onEnvoyerLot: (reminderIds: string[]) => Promise<void>;
}

export const CampagneSMS: React.FC<CampagneSMSProps> = ({
  reminders, campagnes = [], modeles = MODELES_SMS_DEFAUT, onEnvoyerRappel, onEnvoyerLot
}) => {
  const [activeTab, setActiveTab] = useState<'rappels' | 'campagnes' | 'modeles'>('rappels');
  const [selectedReminders, setSelectedReminders] = useState<Set<string>>(new Set());
  const [filterStatut, setFilterStatut] = useState<'all' | 'planifie' | 'envoye' | 'echoue'>('all');
  const [isEnvoi, setIsEnvoi] = useState(false);
  
  const stats = useMemo(() => {
    const planifies = reminders.filter(r => r.statut === 'planifie').length;
    const envoyes = reminders.filter(r => r.statut === 'envoye' || r.statut === 'delivre').length;
    const echoues = reminders.filter(r => r.statut === 'echoue').length;
    const aujourdhui = new Date().toISOString().split('T')[0];
    const aEnvoyerAujourdhui = reminders.filter(r => r.statut === 'planifie' && r.planned_at.startsWith(aujourdhui)).length;
    return { planifies, envoyes, echoues, aEnvoyerAujourdhui };
  }, [reminders]);
  
  const rappelsFiltres = useMemo(() => {
    let filtered = [...reminders];
    if (filterStatut !== 'all') filtered = filtered.filter(r => r.statut === filterStatut);
    return filtered.sort((a, b) => new Date(a.planned_at).getTime() - new Date(b.planned_at).getTime());
  }, [reminders, filterStatut]);
  
  const toggleReminderSelection = (id: string) => {
    const newSelection = new Set(selectedReminders);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedReminders(newSelection);
  };
  
  const selectAll = () => {
    const planifies = rappelsFiltres.filter(r => r.statut === 'planifie');
    if (selectedReminders.size === planifies.length) setSelectedReminders(new Set());
    else setSelectedReminders(new Set(planifies.map(r => r.id)));
  };
  
  const handleEnvoyerSelection = async () => {
    if (selectedReminders.size === 0) return;
    setIsEnvoi(true);
    try {
      await onEnvoyerLot(Array.from(selectedReminders));
      setSelectedReminders(new Set());
    } finally {
      setIsEnvoi(false);
    }
  };
  
  const getStatutBadge = (statut: VaccinationReminder['statut']) => {
    switch (statut) {
      case 'planifie': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">📅 Planifié</span>;
      case 'envoye': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">📤 Envoyé</span>;
      case 'delivre': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">✓ Délivré</span>;
      case 'echoue': return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-medium">✗ Échec</span>;
      case 'annule': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">⊘ Annulé</span>;
    }
  };
  
  const getCanalIcon = (channel: VaccinationReminder['channel']) => {
    switch (channel) {
      case 'sms': return '📱';
      case 'whatsapp': return '💬';
      case 'email': return '📧';
      case 'notification': return '🔔';
      case 'appel': return '📞';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-blue-600">{stats.planifies}</p>
          <p className="text-sm text-blue-600/80">Rappels planifiés</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-amber-600">{stats.aEnvoyerAujourdhui}</p>
          <p className="text-sm text-amber-600/80">À envoyer aujourd'hui</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-emerald-600">{stats.envoyes}</p>
          <p className="text-sm text-emerald-600/80">Envoyés</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-rose-600">{stats.echoues}</p>
          <p className="text-sm text-rose-600/80">Échecs</p>
        </div>
      </div>
      
      {/* Onglets */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'rappels', label: '📲 Rappels', count: reminders.length },
          { key: 'campagnes', label: '📢 Campagnes', count: campagnes.length },
          { key: 'modeles', label: '📝 Modèles SMS', count: modeles.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-3 font-medium text-sm transition-all border-b-2 -mb-px ${
              activeTab === tab.key ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">{tab.count}</span>
          </button>
        ))}
      </div>
      
      {/* Contenu Rappels */}
      {activeTab === 'rappels' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              {(['all', 'planifie', 'envoye', 'echoue'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setFilterStatut(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterStatut === filter ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {filter === 'all' && 'Tous'}
                  {filter === 'planifie' && '📅 Planifiés'}
                  {filter === 'envoye' && '📤 Envoyés'}
                  {filter === 'echoue' && '✗ Échecs'}
                </button>
              ))}
            </div>
            
            {selectedReminders.size > 0 && (
              <button
                onClick={handleEnvoyerSelection}
                disabled={isEnvoi}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isEnvoi ? '⏳ Envoi en cours...' : `📤 Envoyer ${selectedReminders.size} sélectionné(s)`}
              </button>
            )}
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input type="checkbox" onChange={selectAll} checked={selectedReminders.size > 0 && selectedReminders.size === rappelsFiltres.filter(r => r.statut === 'planifie').length} className="w-4 h-4 rounded" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vaccin</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Canal</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Date prévue</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rappelsFiltres.map(rappel => (
                    <tr key={rappel.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-4">
                        {rappel.statut === 'planifie' && (
                          <input type="checkbox" checked={selectedReminders.has(rappel.id)} onChange={() => toggleReminderSelection(rappel.id)} className="w-4 h-4 rounded" />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{rappel.patient_nom}</p>
                        {rappel.patient_telephone && <p className="text-sm text-gray-500">{rappel.patient_telephone}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{rappel.vaccin_libelle}</p>
                        <p className="text-sm text-gray-500">Dose {rappel.dose_ordre}</p>
                      </td>
                      <td className="px-4 py-4 text-center text-xl">{getCanalIcon(rappel.channel)}</td>
                      <td className="px-4 py-4 text-center">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{new Date(rappel.planned_at).toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs text-gray-500">{new Date(rappel.planned_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-4 py-4 text-center">{getStatutBadge(rappel.statut)}</td>
                      <td className="px-4 py-4 text-right">
                        {rappel.statut === 'planifie' && (
                          <button onClick={() => onEnvoyerRappel(rappel.id)} className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600">Envoyer</button>
                        )}
                        {rappel.statut === 'echoue' && (
                          <button onClick={() => onEnvoyerRappel(rappel.id)} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">Réessayer</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rappelsFiltres.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">📭 Aucun rappel</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Contenu Campagnes */}
      {activeTab === 'campagnes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campagnes.map(campagne => (
            <div key={campagne.id} className={`bg-white dark:bg-gray-900 rounded-xl border-2 p-5 transition-all ${campagne.statut === 'en_cours' ? 'border-emerald-400' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">{campagne.nom}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  campagne.statut === 'planifiee' ? 'bg-blue-100 text-blue-700' :
                  campagne.statut === 'en_cours' ? 'bg-emerald-100 text-emerald-700' :
                  campagne.statut === 'terminee' ? 'bg-gray-100 text-gray-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {campagne.statut === 'planifiee' && '📅 Planifiée'}
                  {campagne.statut === 'en_cours' && '🟢 En cours'}
                  {campagne.statut === 'terminee' && '✓ Terminée'}
                  {campagne.statut === 'annulee' && '✗ Annulée'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{campagne.description}</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Couverture</span>
                  <span className={`font-bold ${campagne.taux_couverture >= campagne.objectif_couverture ? 'text-emerald-600' : 'text-gray-800'}`}>
                    {campagne.taux_couverture.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${campagne.taux_couverture >= campagne.objectif_couverture ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(campagne.taux_couverture, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
          {campagnes.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">📢 Aucune campagne</div>
          )}
        </div>
      )}
      
      {/* Contenu Modèles */}
      {activeTab === 'modeles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modeles.map(modele => (
            <div key={modele.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {modele.type === 'rappel_rdv' && '📅'}
                    {modele.type === 'rappel_retard' && '⚠️'}
                    {modele.type === 'confirmation' && '✓'}
                    {modele.type === 'campagne' && '📢'}
                  </span>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">{modele.libelle}</h4>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${modele.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {modele.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">{modele.contenu}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {modele.variables.map(v => (
                  <span key={v} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono">{'{' + v + '}'}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampagneSMS;

