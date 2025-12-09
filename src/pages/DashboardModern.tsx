import React, { useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import StatCard from '../components/ui/StatCard';
import ModernCard from '../components/ui/ModernCard';
import { User } from '../types/auth';
import { useDashboardData } from '../hooks/useDashboardData';
import { getDashboardConfig } from '../utils/dashboardConfig';
import { TimeFilter, TimeRange } from '../components/dashboard/TimeFilter';
import { TrendChart } from '../components/dashboard/TrendChart';
import { RoleWidgets } from '../components/dashboard/RoleWidgets';
import { RecentActivities } from '../components/dashboard/RecentActivities';

interface DashboardModernProps {
  user: User | null;
}

const DashboardModern: React.FC<DashboardModernProps> = ({ user }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const { stats, trendData, activities, loading, error } = useDashboardData(user, timeRange);
  const config = getDashboardConfig(user, stats);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {config.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {config.subtitle}
          </Typography>
        </Box>
        <TimeFilter value={timeRange} onChange={setTimeRange} />
      </Box>

      <Grid container spacing={3}>
        {/* Statistiques principales avec design moderne */}
        {config.stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              subtitle={stat.subtitle}
            />
          </Grid>
        ))}

        {/* Alertes */}
        {config.alerts.length > 0 && (
          <Grid item xs={12} md={6}>
            <ModernCard
              title="Alertes"
              subtitle="Notifications importantes"
              variant="elevated"
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {config.alerts.map((alerte, index) => {
                  const colorMap: Record<string, { bg: string; border: string; iconBg: string; text: string }> = {
                    warning: {
                      bg: 'rgba(251, 146, 60, 0.35)',
                      border: 'rgba(251, 146, 60, 0.7)',
                      iconBg: '#fb923c',
                      text: '#fdba74',
                    },
                    error: {
                      bg: 'rgba(248, 113, 113, 0.35)',
                      border: 'rgba(248, 113, 113, 0.7)',
                      iconBg: '#f87171',
                      text: '#fca5a5',
                    },
                    info: {
                      bg: 'rgba(96, 165, 250, 0.35)',
                      border: 'rgba(96, 165, 250, 0.7)',
                      iconBg: '#60a5fa',
                      text: '#93c5fd',
                    },
                    success: {
                      bg: 'rgba(34, 197, 94, 0.35)',
                      border: 'rgba(34, 197, 94, 0.7)',
                      iconBg: '#22c55e',
                      text: '#86efac',
                    },
                  };
                  const colors = colorMap[alerte.type] || colorMap.info;
                  
                  return (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? colors.bg 
                          : alerte.type === 'warning' ? 'warning.light' + '20' :
                            alerte.type === 'error' ? 'error.light' + '20' :
                            alerte.type === 'success' ? 'success.light' + '20' :
                            'info.light' + '20',
                        border: (theme) => theme.palette.mode === 'dark'
                          ? `2px solid ${colors.border}`
                          : `1px solid ${
                              alerte.type === 'warning' ? 'warning.main' + '30' :
                              alerte.type === 'error' ? 'error.main' + '30' :
                              alerte.type === 'success' ? 'success.main' + '30' :
                              'info.main' + '30'
                            }`,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? colors.iconBg 
                            : alerte.type === 'warning' ? 'warning.main' :
                              alerte.type === 'error' ? 'error.main' :
                              alerte.type === 'success' ? 'success.main' :
                              'info.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {alerte.icon}
                      </Box>
                      <Box flex={1}>
                        <Typography 
                          variant="body2" 
                          fontWeight={500}
                          sx={{
                            color: (theme) => theme.palette.mode === 'dark' 
                              ? colors.text 
                              : 'inherit',
                          }}
                        >
                          {alerte.message}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </ModernCard>
          </Grid>
        )}

        {/* Activités récentes */}
        {config.activities.length > 0 && (
          <Grid item xs={12} md={6}>
            <ModernCard
              title="Activités récentes"
              subtitle="Dernières actions du système"
              variant="elevated"
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {config.activities.map((activite, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(59, 130, 246, 0.35)' 
                          : 'primary.light' + '20',
                        color: (theme) => theme.palette.mode === 'dark' 
                          ? '#60a5fa' 
                          : 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {activite.icon}
                    </Box>
                    <Box flex={1}>
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        sx={{
                          color: (theme) => theme.palette.mode === 'dark' 
                            ? '#93c5fd' 
                            : 'inherit',
                        }}
                      >
                        {activite.action}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{
                          color: (theme) => theme.palette.mode === 'dark' 
                            ? '#94a3b8' 
                            : 'text.secondary',
                        }}
                      >
                        {activite.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </ModernCard>
          </Grid>
        )}

        {/* Graphique de tendances */}
        {trendData.length > 0 && (
          <Grid item xs={12}>
            <ModernCard
              title={
                user?.role === 'admin' || user?.role === 'caissier' || user?.role === 'comptable'
                  ? 'Évolution des revenus'
                  : user?.role === 'medecin'
                  ? 'Évolution des consultations'
                  : user?.role === 'pharmacien'
                  ? 'Évolution des dispensations'
                  : 'Tendances'
              }
              variant="elevated"
            >
              <TrendChart
                data={trendData}
                color={
                  user?.role === 'admin' || user?.role === 'caissier' || user?.role === 'comptable'
                    ? undefined
                    : undefined
                }
                formatValue={
                  user?.role === 'admin' || user?.role === 'caissier' || user?.role === 'comptable'
                    ? (v) => new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                      }).format(v)
                    : undefined
                }
              />
            </ModernCard>
          </Grid>
        )}

        {/* Widgets spécifiques par rôle */}
        <Grid item xs={12}>
          <RoleWidgets user={user} stats={stats} />
        </Grid>

        {/* Activités récentes améliorées */}
        {activities.length > 0 && (
          <Grid item xs={12} md={6}>
            <RecentActivities activities={activities} maxItems={10} />
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default DashboardModern;

