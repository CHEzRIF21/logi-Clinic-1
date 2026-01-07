import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, useTheme, CircularProgress } from '@mui/material';
// #region agent log (debug-session) - Hypothesis A: Import dynamique pour éviter dépendance circulaire
// Import dynamique de recharts pour éviter l'erreur "Cannot access 'S' before initialization"
// #endregion agent log

interface TrendChartProps {
  data: Array<{
    date: string;
    value: number;
    label?: string;
  }>;
  title?: string;
  color?: string;
  formatValue?: (value: number) => string;
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title,
  color,
  formatValue = (v) => v.toLocaleString(),
  height = 250,
}) => {
  const theme = useTheme();
  const chartColor = color || theme.palette.primary.main;
  
  // #region agent log (debug-session) - Hypothesis A: État pour le chargement dynamique
  const [Recharts, setRecharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Chargement dynamique de recharts pour éviter les dépendances circulaires
  useEffect(() => {
    // Log de début de chargement
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TrendChart.tsx:useEffect',message:'recharts_dynamic_import_start',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    
    import('recharts')
      .then((recharts) => {
        setRecharts(recharts);
        setLoading(false);
        // Log de succès
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TrendChart.tsx:useEffect',message:'recharts_dynamic_import_success',data:{loaded:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      })
      .catch((error) => {
        console.error('Erreur lors du chargement de recharts:', error);
        setLoadError(error?.message || 'Erreur inconnue');
        setLoading(false);
        // Log d'erreur
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TrendChart.tsx:useEffect',message:'recharts_dynamic_import_error',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      });
  }, []);
  // #endregion agent log

  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      }),
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 1.5,
            boxShadow: theme.shadows[8],
          }}
        >
          <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5 }}>
            {payload[0].payload.formattedDate}
          </Typography>
          <Typography variant="body2" color="primary">
            {formatValue(payload[0].value)}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // #region agent log (debug-session) - Hypothesis A: Affichage loading pendant chargement dynamique
  // Afficher un loader pendant le chargement de recharts
  if (loading || !Recharts) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Afficher une erreur si le chargement a échoué
  if (loadError) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: 'error.main' }}>
        <Typography variant="body2">Erreur de chargement du graphique</Typography>
      </Box>
    );
  }

  // Extraire les composants de recharts
  const { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } = Recharts;
  // #endregion agent log

  return (
    <Box>
      {title && (
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${chartColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
            vertical={false}
          />
          <XAxis
            dataKey="formattedDate"
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={2}
            fill={`url(#gradient-${chartColor})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};