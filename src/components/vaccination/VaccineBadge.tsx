/**
 * Badge de statut vaccination avec code couleur
 * Vert = À jour, Orange = À faire bientôt, Rouge = En retard/Perdu de vue
 */
import React from 'react';
import { VaccinationStatut } from '../../types/vaccination';

interface VaccineBadgeProps {
  statut: VaccinationStatut;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<VaccinationStatut, {
  label: string;
  icon: string;
  bgClass: string;
  textClass: string;
}> = {
  a_jour: {
    label: 'À jour',
    icon: '✓',
    bgClass: 'bg-emerald-500/10 border-emerald-500/30',
    textClass: 'text-emerald-600 dark:text-emerald-400'
  },
  a_faire: {
    label: 'À faire',
    icon: '○',
    bgClass: 'bg-amber-500/10 border-amber-500/30',
    textClass: 'text-amber-600 dark:text-amber-400'
  },
  en_retard: {
    label: 'En retard',
    icon: '!',
    bgClass: 'bg-rose-500/10 border-rose-500/30',
    textClass: 'text-rose-600 dark:text-rose-400'
  },
  perdu_de_vue: {
    label: 'Perdu de vue',
    icon: '✗',
    bgClass: 'bg-red-600/10 border-red-600/30',
    textClass: 'text-red-700 dark:text-red-400'
  },
  contre_indique: {
    label: 'Contre-indiqué',
    icon: '⊘',
    bgClass: 'bg-slate-500/10 border-slate-500/30',
    textClass: 'text-slate-600 dark:text-slate-400'
  },
  rattrapage: {
    label: 'Rattrapage',
    icon: '↺',
    bgClass: 'bg-blue-500/10 border-blue-500/30',
    textClass: 'text-blue-600 dark:text-blue-400'
  }
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5'
};

export const VaccineBadge: React.FC<VaccineBadgeProps> = ({
  statut,
  label,
  showIcon = true,
  size = 'md',
  className = ''
}) => {
  const config = statusConfig[statut];
  const displayLabel = label || config.label;
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bgClass} ${config.textClass} ${sizeClasses[size]}
        border transition-all duration-200 hover:shadow-sm
        ${className}
      `}
    >
      {showIcon && (
        <span className="font-bold">{config.icon}</span>
      )}
      <span>{displayLabel}</span>
    </span>
  );
};

// Composant pour afficher le statut avec jours de retard
interface VaccineStatusDetailProps {
  statut: VaccinationStatut;
  joursRetard?: number;
  prochaineDose?: number;
  datePrevue?: string;
}

export const VaccineStatusDetail: React.FC<VaccineStatusDetailProps> = ({
  statut,
  joursRetard,
  prochaineDose,
  datePrevue
}) => {
  const config = statusConfig[statut];
  
  return (
    <div className={`
      flex flex-col gap-1 p-3 rounded-lg border
      ${config.bgClass}
    `}>
      <div className="flex items-center justify-between">
        <VaccineBadge statut={statut} />
        {joursRetard && joursRetard > 0 && (
          <span className={`text-sm font-semibold ${config.textClass}`}>
            {joursRetard} jour{joursRetard > 1 ? 's' : ''} de retard
          </span>
        )}
      </div>
      
      {prochaineDose && (
        <p className="text-sm text-gray-500 mt-1">
          Prochaine dose: <span className="font-medium">Dose {prochaineDose}</span>
          {datePrevue && (
            <span className="ml-2">
              le {new Date(datePrevue).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

// Badge pour le statut de température (chaîne de froid)
interface TemperatureBadgeProps {
  temperature: number;
  min?: number;
  max?: number;
  className?: string;
}

export const TemperatureBadge: React.FC<TemperatureBadgeProps> = ({
  temperature,
  min = 2,
  max = 8,
  className = ''
}) => {
  const isLow = temperature < min;
  const isHigh = temperature > max;
  
  let bgClass = 'bg-emerald-500/10 border-emerald-500/30';
  let textClass = 'text-emerald-600 dark:text-emerald-400';
  let icon = '✓';
  
  if (isLow) {
    bgClass = 'bg-blue-500/10 border-blue-500/30';
    textClass = 'text-blue-600 dark:text-blue-400';
    icon = '↓';
  } else if (isHigh) {
    bgClass = 'bg-rose-500/10 border-rose-500/30';
    textClass = 'text-rose-600 dark:text-rose-400';
    icon = '↑';
  }
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full font-medium
      text-sm px-2.5 py-1 border transition-all
      ${bgClass} ${textClass} ${className}
    `}>
      <span>{icon}</span>
      <span>{temperature.toFixed(1)}°C</span>
    </span>
  );
};

// Indicateur de progression de couverture vaccinale
interface CouvertureProgressProps {
  pourcentage: number;
  objectif?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CouvertureProgress: React.FC<CouvertureProgressProps> = ({
  pourcentage,
  objectif = 95,
  showLabel = true,
  size = 'md'
}) => {
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };
  
  const getColor = (pct: number) => {
    if (pct >= objectif) return 'bg-emerald-500';
    if (pct >= objectif * 0.8) return 'bg-amber-500';
    return 'bg-rose-500';
  };
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Couverture vaccinale
          </span>
          <span className={`text-sm font-bold ${
            pourcentage >= objectif 
              ? 'text-emerald-600' 
              : pourcentage >= objectif * 0.8 
                ? 'text-amber-600' 
                : 'text-rose-600'
          }`}>
            {pourcentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div className={`
        w-full ${heightClasses[size]} 
        bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden
      `}>
        <div
          className={`${heightClasses[size]} ${getColor(pourcentage)} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(pourcentage, 100)}%` }}
        />
      </div>
      {showLabel && objectif && (
        <p className="text-xs text-gray-500 mt-1">
          Objectif: {objectif}%
        </p>
      )}
    </div>
  );
};

export default VaccineBadge;

