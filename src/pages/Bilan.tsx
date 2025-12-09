import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  Payment,
  People,
} from '@mui/icons-material';
import { formatCurrency } from '../utils/currency';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { StatBadge } from '../components/ui/StatBadge';

const Bilan: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête amélioré */}
      <ToolbarBits sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Assessment color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <GradientText variant="h4">Module Bilan - Rapports et Statistiques</GradientText>
            <Typography variant="body2" color="text.secondary">
              Interface complète de rapports financiers et statistiques de la clinique
            </Typography>
          </Box>
        </Box>
      </ToolbarBits>

      {/* Statistiques principales */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={2} mb={3}>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Revenus du mois" value={formatCurrency(4500000)} icon={<Payment />} color="primary" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Patients total" value="1,247" icon={<People />} color="success" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Consultations ce mois" value="156" icon={<Assessment />} color="warning" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Croissance vs mois dernier" value="+15%" icon={<TrendingUp />} color="info" />
        </GlassCard>
      </Box>

      {/* Section rapports détaillés */}
      <GlassCard sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Rapports financiers détaillés
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Interface complète de rapports financiers et statistiques de la clinique
        </Typography>
      </GlassCard>
    </Box>
  );
};

export default Bilan; 