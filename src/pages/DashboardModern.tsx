import React from 'react';
import {
  Grid,
  Box,
  Typography,
  Container,
} from '@mui/material';
import {
  People,
  Event,
  LocalPharmacy,
  Payment,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import StatCard from '../components/ui/StatCard';
import ModernCard from '../components/ui/ModernCard';
import { formatCurrency } from '../utils/currency';

const DashboardModern: React.FC = () => {
  // Données de démonstration
  const stats = {
    patients: 1247,
    rendezVous: 23,
    medicaments: 156,
    revenus: 4500000,
  };

  const alertes = [
    { type: 'warning', message: 'Stock faible: Paracétamol 500mg', icon: <Warning /> },
    { type: 'info', message: 'Rendez-vous urgent: Patient #1234', icon: <Event /> },
    { type: 'error', message: 'Médicament expiré: Aspirine', icon: <LocalPharmacy /> },
  ];

  const activites = [
    { action: 'Nouveau patient enregistré', time: 'Il y a 5 min', type: 'patient', icon: <People /> },
    { action: 'Rendez-vous confirmé', time: 'Il y a 15 min', type: 'rdv', icon: <Event /> },
    { action: 'Ordonnance délivrée', time: 'Il y a 30 min', type: 'pharmacie', icon: <LocalPharmacy /> },
    { action: 'Paiement reçu', time: 'Il y a 1h', type: 'caisse', icon: <Payment /> },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Tableau de bord
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vue d'ensemble de votre centre de santé
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Statistiques principales avec design moderne */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Patients"
            value={stats.patients.toLocaleString()}
            icon={<People />}
            color="primary"
            trend={{ value: 12, isPositive: true }}
            subtitle="Total enregistrés"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Rendez-vous"
            value={stats.rendezVous}
            icon={<Event />}
            color="info"
            trend={{ value: 8, isPositive: true }}
            subtitle="Aujourd'hui"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Médicaments"
            value={stats.medicaments}
            icon={<LocalPharmacy />}
            color="success"
            trend={{ value: 5, isPositive: false }}
            subtitle="En stock"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenus"
            value={formatCurrency(stats.revenus)}
            icon={<Payment />}
            color="warning"
            trend={{ value: 15, isPositive: true }}
            subtitle="Ce mois"
          />
        </Grid>

        {/* Alertes */}
        <Grid item xs={12} md={6}>
          <ModernCard
            title="Alertes"
            subtitle="Notifications importantes"
            variant="elevated"
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {alertes.map((alerte, index) => {
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
                          'info.light' + '20',
                      border: (theme) => theme.palette.mode === 'dark'
                        ? `2px solid ${colors.border}`
                        : `1px solid ${
                            alerte.type === 'warning' ? 'warning.main' + '30' :
                            alerte.type === 'error' ? 'error.main' + '30' :
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

        {/* Activités récentes */}
        <Grid item xs={12} md={6}>
          <ModernCard
            title="Activités récentes"
            subtitle="Dernières actions du système"
            variant="elevated"
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {activites.map((activite, index) => (
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

        {/* Vue d'ensemble */}
        <Grid item xs={12}>
          <ModernCard
            title="Vue d'ensemble"
            subtitle="Statistiques et tendances"
            variant="elevated"
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(34, 197, 94, 0.35)' 
                          : 'success.light' + '20',
                        color: (theme) => theme.palette.mode === 'dark' 
                          ? '#4ade80' 
                          : 'success.main',
                      }}
                    >
                      <TrendingUp />
                    </Box>
                    <Box>
                      <Typography 
                        variant="body1" 
                        fontWeight={600}
                        sx={{
                          color: (theme) => theme.palette.mode === 'dark' 
                            ? '#e2e8f0' 
                            : 'inherit',
                        }}
                      >
                        Consultations ce mois
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{
                          color: (theme) => theme.palette.mode === 'dark' 
                            ? '#4ade80' 
                            : 'success.main',
                        }}
                      >
                        +15% vs mois dernier
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(248, 113, 113, 0.35)' 
                          : 'error.light' + '20',
                        color: (theme) => theme.palette.mode === 'dark' 
                          ? '#f87171' 
                          : 'error.main',
                      }}
                    >
                      <TrendingDown />
                    </Box>
                    <Box>
                      <Typography 
                        variant="body1" 
                        fontWeight={600}
                        sx={{
                          color: (theme) => theme.palette.mode === 'dark' 
                            ? '#e2e8f0' 
                            : 'inherit',
                        }}
                      >
                        Stock médicaments
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{
                          color: (theme) => theme.palette.mode === 'dark' 
                            ? '#f87171' 
                            : 'error.main',
                        }}
                      >
                        -8% vs mois dernier
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography 
                    variant="body2" 
                    fontWeight={600} 
                    gutterBottom
                    sx={{
                      color: (theme) => theme.palette.mode === 'dark' 
                        ? '#e2e8f0' 
                        : 'text.secondary',
                    }}
                  >
                    Prochaines actions recommandées:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
                    {[
                      'Réapprovisionner le stock de paracétamol',
                      'Planifier les rendez-vous de la semaine prochaine',
                      'Vérifier les médicaments expirés',
                    ].map((action, index) => (
                      <Box key={index} display="flex" alignItems="center" gap={1.5}>
                        <CheckCircle 
                          sx={{ 
                            fontSize: 18, 
                            color: (theme) => theme.palette.mode === 'dark' 
                              ? '#4ade80' 
                              : 'success.main',
                          }} 
                        />
                        <Typography 
                          variant="body2"
                          sx={{
                            color: (theme) => theme.palette.mode === 'dark' 
                              ? '#86efac' 
                              : 'text.secondary',
                          }}
                        >
                          {action}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </ModernCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardModern;

