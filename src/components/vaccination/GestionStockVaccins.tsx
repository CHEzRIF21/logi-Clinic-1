/**
 * Gestion des Stocks de Vaccins - Traçabilité par lot, FEFO
 */
import React, { useMemo, useState } from 'react';
import { LotVaccin, FlaconOuvert, RappelLot, Vaccine } from '../../types/vaccination';

interface GestionStockVaccinsProps {
  lots: LotVaccin[];
  vaccines: Vaccine[];
  flaconOuverts?: FlaconOuvert[];
  rappels?: RappelLot[];
  onOuvrirFlacon?: (lotId: string) => void;
  onRechercherPatients?: (numeroLot: string) => void;
}

export const GestionStockVaccins: React.FC<GestionStockVaccinsProps> = ({
  lots, vaccines, flaconOuverts = [], rappels = [], onOuvrirFlacon, onRechercherPatients
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<'all' | 'actif' | 'alerte'>('all');
  
  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const actifs = lots.filter(l => l.statut === 'actif');
    const expirantBientot = actifs.filter(l => {
      const expDate = new Date(l.date_expiration);
      return expDate <= in30Days && expDate > now;
    });
    
    const stockTotal = actifs.reduce((sum, l) => sum + l.quantite_disponible, 0);
    const tauxPerte = lots.length > 0 
      ? lots.reduce((sum, l) => sum + l.quantite_perdue, 0) / 
        lots.reduce((sum, l) => sum + l.quantite_initiale, 0) * 100
      : 0;
    
    return {
      lotsActifs: actifs.length,
      expirantBientot: expirantBientot.length,
      stockTotal,
      tauxPerte,
      flaconOuverts: flaconOuverts.filter(f => f.est_utilisable).length
    };
  }, [lots, flaconOuverts]);
  
  // Filtrage
  const lotsFiltres = useMemo(() => {
    let filtered = [...lots];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.numero_lot.toLowerCase().includes(term) ||
        l.vaccin_libelle.toLowerCase().includes(term)
      );
    }
    
    if (filterStatut === 'actif') {
      filtered = filtered.filter(l => l.statut === 'actif' && l.quantite_disponible > 0);
    } else if (filterStatut === 'alerte') {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(l => {
        const expDate = new Date(l.date_expiration);
        return expDate <= in30Days || l.quantite_disponible < 10;
      });
    }
    
    return filtered.sort((a, b) => new Date(a.date_expiration).getTime() - new Date(b.date_expiration).getTime());
  }, [lots, searchTerm, filterStatut]);
  
  const getLotStatus = (lot: LotVaccin) => {
    const now = new Date();
    const expDate = new Date(lot.date_expiration);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    if (expDate <= now || lot.statut === 'expire') return { color: 'bg-red-500', text: 'Expiré', icon: '🚫' };
    if (lot.statut === 'rappele') return { color: 'bg-purple-500', text: 'Rappelé', icon: '⚠️' };
    if (expDate <= in7Days) return { color: 'bg-rose-500', text: 'Expire sous 7j', icon: '⏰' };
    if (expDate <= in30Days) return { color: 'bg-amber-500', text: 'Expire sous 30j', icon: '⚡' };
    if (lot.quantite_disponible === 0) return { color: 'bg-gray-500', text: 'Épuisé', icon: '📦' };
    if (lot.quantite_disponible < 10) return { color: 'bg-orange-500', text: 'Stock bas', icon: '📉' };
    return { color: 'bg-emerald-500', text: 'OK', icon: '✓' };
  };
  
  const getJoursAvantExpiration = (dateExp: string) => {
    const now = new Date();
    const exp = new Date(dateExp);
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-blue-600">{stats.stockTotal}</p>
          <p className="text-xs text-gray-500">Stock total</p>
        </div>
        <div className="p-4 rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-emerald-600">{stats.lotsActifs}</p>
          <p className="text-xs text-gray-500">Lots actifs</p>
        </div>
        <div className={`p-4 rounded-xl border ${stats.expirantBientot > 0 ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 animate-pulse' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
          <p className={`text-2xl font-bold ${stats.expirantBientot > 0 ? 'text-rose-600' : 'text-amber-600'}`}>{stats.expirantBientot}</p>
          <p className="text-xs text-gray-500">Expire bientôt</p>
        </div>
        <div className="p-4 rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-purple-600">{stats.flaconOuverts}</p>
          <p className="text-xs text-gray-500">Flacons ouverts</p>
        </div>
        <div className={`p-4 rounded-xl border ${stats.tauxPerte > 10 ? 'bg-rose-50 border-rose-300' : 'bg-white border-gray-200'} dark:bg-gray-900 dark:border-gray-700`}>
          <p className={`text-2xl font-bold ${stats.tauxPerte > 10 ? 'text-rose-600' : 'text-teal-600'}`}>{stats.tauxPerte.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Taux de perte</p>
        </div>
      </div>
      
      {/* Flacons ouverts */}
      {flaconOuverts.filter(f => f.est_utilisable).length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
          <h3 className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2 mb-3">
            <span>💉</span>
            Flacons ouverts (à utiliser en priorité)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {flaconOuverts.filter(f => f.est_utilisable).map(flacon => {
              const minutesRestantes = Math.max(0, 
                (new Date(`${flacon.date_ouverture}T${flacon.heure_limite}`).getTime() - Date.now()) / 60000
              );
              const heuresRestantes = Math.floor(minutesRestantes / 60);
              
              return (
                <div key={flacon.id} className={`p-3 rounded-lg border-2 transition-all ${
                  minutesRestantes < 60 ? 'bg-rose-50 border-rose-400 animate-pulse' : 'bg-white border-indigo-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800">{flacon.vaccin_libelle}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      minutesRestantes < 60 ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'
                    }`}>
                      {heuresRestantes}h {Math.floor(minutesRestantes % 60)}m
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Lot: {flacon.numero_lot}</span>
                    <span className="font-medium">{flacon.doses_restantes}/{flacon.doses_initiales} doses</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Rechercher par n° lot ou vaccin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        
        <div className="flex gap-2">
          {(['all', 'actif', 'alerte'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setFilterStatut(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatut === filter
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {filter === 'all' && 'Tous'}
              {filter === 'actif' && '✓ Actifs'}
              {filter === 'alerte' && '⚠️ Alertes'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tableau */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Vaccin / Lot</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Statut</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Expiration</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Magasin</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {lotsFiltres.map(lot => {
                const status = getLotStatus(lot);
                const joursRestants = getJoursAvantExpiration(lot.date_expiration);
                
                return (
                  <tr key={lot.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{lot.vaccin_libelle}</p>
                      <p className="text-sm text-gray-500 font-mono">{lot.numero_lot}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white ${status.color}`}>
                        <span>{status.icon}</span>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{lot.quantite_disponible}</span>
                      <span className="text-gray-500 text-sm ml-1">/{lot.quantite_initiale}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {new Date(lot.date_expiration).toLocaleDateString('fr-FR')}
                      </p>
                      <p className={`text-xs ${joursRestants <= 0 ? 'text-red-500' : joursRestants <= 7 ? 'text-rose-500' : joursRestants <= 30 ? 'text-amber-500' : 'text-gray-500'}`}>
                        {joursRestants <= 0 ? 'Expiré' : `${joursRestants} jour${joursRestants > 1 ? 's' : ''}`}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        lot.magasin === 'central' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {lot.magasin === 'central' ? '🏢 Central' : '💊 Détail'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {lot.statut === 'actif' && lot.quantite_disponible > 0 && onOuvrirFlacon && (
                          <button
                            onClick={() => onOuvrirFlacon(lot.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                          >
                            💉 Ouvrir
                          </button>
                        )}
                        {onRechercherPatients && (
                          <button
                            onClick={() => onRechercherPatients(lot.numero_lot)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            🔍 Tracer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {lotsFiltres.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <span className="text-4xl">📦</span>
                    <p className="mt-2">Aucun lot trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GestionStockVaccins;

