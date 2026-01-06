/**
 * Graphique de suivi des températures de la chaîne de froid
 */
import React, { useMemo } from 'react';
import { RelevéTemperature, Refrigerateur } from '../../types/vaccination';
import { TemperatureBadge } from './VaccineBadge';

// #region agent log (debug-session) - Hypothesis A: Recharts import timing
const logRechartsImport = () => {
  try {
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'src/components/vaccination/TemperatureChart.tsx:before_recharts_import',
        message: 'about_to_import_recharts',
        data: { timestamp: Date.now() },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  } catch {}
};
logRechartsImport();
// #endregion agent log (debug-session)

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Legend,
  Area,
  ComposedChart
} from 'recharts';

// #region agent log (debug-session) - Hypothesis A: Recharts import success
(() => {
  try {
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'src/components/vaccination/TemperatureChart.tsx:after_recharts_import',
        message: 'recharts_imported_successfully',
        data: { 
          timestamp: Date.now(),
          hasXAxis: typeof XAxis !== 'undefined',
          hasComposedChart: typeof ComposedChart !== 'undefined',
        },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  } catch {}
})();
// #endregion agent log (debug-session)

interface TemperatureChartProps {
  releves: RelevéTemperature[];
  refrigerateur?: Refrigerateur;
  minTemp?: number;
  maxTemp?: number;
  jours?: number;
  showAlerts?: boolean;
}

export const TemperatureChart: React.FC<TemperatureChartProps> = ({
  releves,
  refrigerateur,
  minTemp = 2,
  maxTemp = 8,
  jours = 7,
  showAlerts = true
}) => {
  const chartData = useMemo(() => {
    const grouped: Record<string, { date: string; matin?: number; soir?: number }> = {};
    
    releves.forEach(r => {
      const dateKey = r.date.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey };
      }
      if (r.heure === 'matin') {
        grouped[dateKey].matin = r.temperature_celsius;
      } else {
        grouped[dateKey].soir = r.temperature_celsius;
      }
    });
    
    return Object.values(grouped)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-jours);
  }, [releves, jours]);
  
  const anomalies = useMemo(() => {
    return releves.filter(r => !r.est_conforme);
  }, [releves]);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{formatDate(label)}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500">{entry.name}:</span>
            <span className="font-medium">{entry.value?.toFixed(1)}°C</span>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="w-full space-y-4">
      {/* En-tête avec statut actuel */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {refrigerateur?.nom || 'Relevés de température'}
          </h3>
          <p className="text-sm text-gray-500">
            Plage normale: {minTemp}°C - {maxTemp}°C
          </p>
        </div>
        
        {refrigerateur?.derniere_temperature !== undefined && (
          <div className="flex flex-col items-end gap-1">
            <TemperatureBadge 
              temperature={refrigerateur.derniere_temperature}
              min={minTemp}
              max={maxTemp}
            />
            {refrigerateur.derniere_lecture && (
              <span className="text-xs text-gray-500">
                {new Date(refrigerateur.derniere_lecture).toLocaleString('fr-FR')}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Graphique */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradientMatin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="tempGradientSoir" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            
            <ReferenceArea y1={minTemp} y2={maxTemp} fill="#22c55e" fillOpacity={0.1} stroke="none" />
            <ReferenceLine y={minTemp} stroke="#22c55e" strokeDasharray="5 5" strokeWidth={1.5} />
            <ReferenceLine y={maxTemp} stroke="#22c55e" strokeDasharray="5 5" strokeWidth={1.5} />
            
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis domain={[-2, 12]} tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v) => `${v}°`} />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" iconSize={8} />
            
            <Area
              type="monotone"
              dataKey="matin"
              stroke="#3b82f6"
              fill="url(#tempGradientMatin)"
              strokeWidth={2}
              name="Matin"
              dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
            />
            
            <Area
              type="monotone"
              dataKey="soir"
              stroke="#f97316"
              fill="url(#tempGradientSoir)"
              strokeWidth={2}
              name="Soir"
              dot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Alertes */}
      {showAlerts && anomalies.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
          <h4 className="font-semibold text-rose-700 dark:text-rose-400 text-sm mb-2 flex items-center gap-2">
            <span>⚠️</span>
            Alertes de température ({anomalies.length})
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {anomalies.slice(-5).map((a, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-rose-600 dark:text-rose-400">
                  {new Date(a.date).toLocaleDateString('fr-FR')} {a.heure}
                </span>
                <span className="font-mono font-semibold text-rose-700 dark:text-rose-300">
                  {a.temperature_celsius.toFixed(1)}°C
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Formulaire de saisie de température
interface TemperatureInputProps {
  refrigerateurs: Refrigerateur[];
  onSubmit: (data: {
    refrigerateur_id: string;
    temperature: number;
    heure: 'matin' | 'soir';
    actions_correctives?: string;
  }) => void;
  isLoading?: boolean;
}

export const TemperatureInputForm: React.FC<TemperatureInputProps> = ({
  refrigerateurs,
  onSubmit,
  isLoading = false
}) => {
  const [selectedRefrigerateur, setSelectedRefrigerateur] = React.useState('');
  const [temperature, setTemperature] = React.useState('');
  const [heure, setHeure] = React.useState<'matin' | 'soir'>('matin');
  const [actions, setActions] = React.useState('');
  
  const selectedRef = refrigerateurs.find(r => r.id === selectedRefrigerateur);
  const tempValue = parseFloat(temperature);
  const isAnomaly = selectedRef && !isNaN(tempValue) && 
    (tempValue < selectedRef.temperature_min || tempValue > selectedRef.temperature_max);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefrigerateur || isNaN(tempValue)) return;
    
    onSubmit({
      refrigerateur_id: selectedRefrigerateur,
      temperature: tempValue,
      heure,
      actions_correctives: isAnomaly ? actions : undefined
    });
    
    setTemperature('');
    setActions('');
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Réfrigérateur</label>
          <select
            value={selectedRefrigerateur}
            onChange={(e) => setSelectedRefrigerateur(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm"
            required
          >
            <option value="">Sélectionner...</option>
            {refrigerateurs.map(r => (
              <option key={r.id} value={r.id}>{r.nom} ({r.emplacement})</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Température (°C)</label>
          <input
            type="number"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="Ex: 4.5"
            className={`w-full h-10 px-3 rounded-lg border bg-white dark:bg-slate-800 text-sm ${
              isAnomaly ? 'border-rose-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            required
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Moment du relevé</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setHeure('matin')}
              className={`flex-1 h-10 rounded-lg font-medium text-sm transition-all ${
                heure === 'matin' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              ☀️ Matin
            </button>
            <button
              type="button"
              onClick={() => setHeure('soir')}
              className={`flex-1 h-10 rounded-lg font-medium text-sm transition-all ${
                heure === 'soir' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              🌙 Soir
            </button>
          </div>
        </div>
      </div>
      
      {isAnomaly && (
        <div className="space-y-1.5 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-800">
          <label className="text-sm font-medium text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <span>⚠️</span>
            Température hors norme - Actions correctives requises
          </label>
          <textarea
            value={actions}
            onChange={(e) => setActions(e.target.value)}
            placeholder="Décrivez les actions prises..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-sm"
            required
          />
        </div>
      )}
      
      <button
        type="submit"
        disabled={isLoading || !selectedRefrigerateur || isNaN(tempValue)}
        className="w-full h-11 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? '⏳ Enregistrement...' : '📝 Enregistrer le relevé'}
      </button>
    </form>
  );
};

export default TemperatureChart;

