import React from 'react';
import { Box, Grid, Typography, List, ListItem, ListItemIcon, ListItemText, Chip, Avatar } from '@mui/material';
import {
  People,
  Event,
  LocalPharmacy,
  Payment,
  Assignment,
  Science,
  Schedule,
  MedicalServices,
  Warning,
  CheckCircle,
  TrendingUp,
  Inventory,
} from '@mui/icons-material';
import ModernCard from '../ui/ModernCard';
import { User } from '../../types/auth';

interface RoleWidgetsProps {
  user: User | null;
  stats: any;
}

export const RoleWidgets: React.FC<RoleWidgetsProps> = ({ user, stats }) => {
  if (!user) return null;

  const renderAdminWidgets = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <ModernCard title="Consultations du jour" variant="elevated">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <MedicalServices />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {stats.consultations?.today || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consultations aujourd'hui
              </Typography>
            </Box>
          </Box>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="En attente"
                secondary={`${stats.consultations?.pending || 0} consultation(s)`}
              />
            </ListItem>
          </List>
        </ModernCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <ModernCard title="Alertes critiques" variant="elevated">
          <List dense>
            {stats.stock?.alerts > 0 && (
              <ListItem>
                <ListItemIcon>
                  <Warning color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="Alertes de stock"
                  secondary={`${stats.stock.alerts} alerte(s) active(s)`}
                />
                <Chip label="Urgent" color="warning" size="small" />
              </ListItem>
            )}
            {stats.stock?.expired > 0 && (
              <ListItem>
                <ListItemIcon>
                  <LocalPharmacy color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="Médicaments expirés"
                  secondary={`${stats.stock.expired} médicament(s)`}
                />
                <Chip label="Action requise" color="error" size="small" />
              </ListItem>
            )}
          </List>
        </ModernCard>
      </Grid>
    </Grid>
  );

  const renderMedecinWidgets = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <ModernCard title="Consultations en attente" variant="elevated">
          <List>
            {Array.from({ length: Math.min(stats.consultations?.pending || 0, 5) }).map((_, idx) => (
              <ListItem key={idx}>
                <ListItemIcon>
                  <Event color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`Consultation #${idx + 1}`}
                  secondary="En attente de votre attention"
                />
                <Chip label="Urgent" color="warning" size="small" />
              </ListItem>
            ))}
            {(!stats.consultations?.pending || stats.consultations.pending === 0) && (
              <ListItem>
                <ListItemText primary="Aucune consultation en attente" />
              </ListItem>
            )}
          </List>
        </ModernCard>
      </Grid>
    </Grid>
  );

  const renderPharmacienWidgets = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <ModernCard title="Médicaments à réapprovisionner" variant="elevated">
          <List dense>
            {stats.stock?.alerts > 0 ? (
              Array.from({ length: Math.min(stats.stock.alerts, 5) }).map((_, idx) => (
                <ListItem key={idx}>
                  <ListItemIcon>
                    <Inventory color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Médicament #${idx + 1}`}
                    secondary="Stock faible"
                  />
                  <Chip label="Urgent" color="warning" size="small" />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="Aucun médicament à réapprovisionner" />
              </ListItem>
            )}
          </List>
        </ModernCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <ModernCard title="Prescriptions en attente" variant="elevated">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'info.main' }}>
              <Assignment />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {stats.prescriptions?.pending || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                À dispenser
              </Typography>
            </Box>
          </Box>
        </ModernCard>
      </Grid>
    </Grid>
  );

  const renderCaissierWidgets = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <ModernCard title="Factures en attente d'encaissement" variant="elevated">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.main' }}>
              <Payment />
            </Avatar>
            <Box flex={1}>
              <Typography variant="h4" fontWeight={700}>
                {stats.finances?.pending || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Factures à encaisser
              </Typography>
            </Box>
            <Chip
              label={`${formatCurrency(stats.finances?.today || 0)}`}
              color="success"
              icon={<TrendingUp />}
            />
          </Box>
        </ModernCard>
      </Grid>
    </Grid>
  );

  const renderInfirmierWidgets = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <ModernCard title="Tâches de soins du jour" variant="elevated">
          <List>
            {Array.from({ length: Math.min(stats.consultations?.today || 0, 5) }).map((_, idx) => (
              <ListItem key={idx}>
                <ListItemIcon>
                  <MedicalServices color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`Soin #${idx + 1}`}
                  secondary="À effectuer aujourd'hui"
                />
                <Chip label="En attente" color="info" size="small" />
              </ListItem>
            ))}
            {(!stats.consultations?.today || stats.consultations.today === 0) && (
              <ListItem>
                <ListItemText primary="Aucune tâche de soin prévue" />
              </ListItem>
            )}
          </List>
        </ModernCard>
      </Grid>
    </Grid>
  );

  const renderLaborantinWidgets = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <ModernCard title="Demandes prioritaires" variant="elevated">
          <List dense>
            {stats.lab?.pending > 0 ? (
              Array.from({ length: Math.min(stats.lab.pending, 5) }).map((_, idx) => (
                <ListItem key={idx}>
                  <ListItemIcon>
                    <Science color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Analyse #${idx + 1}`}
                    secondary="En attente de traitement"
                  />
                  <Chip label="Urgent" color="warning" size="small" />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="Aucune demande en attente" />
              </ListItem>
            )}
          </List>
        </ModernCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <ModernCard title="Résultats à valider" variant="elevated">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'info.main' }}>
              <CheckCircle />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {stats.lab?.toValidate || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Résultats en attente
              </Typography>
            </Box>
          </Box>
        </ModernCard>
      </Grid>
    </Grid>
  );

  const renderSecretaireWidgets = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <ModernCard title="Planning du jour" variant="elevated">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Schedule />
            </Avatar>
            <Box flex={1}>
              <Typography variant="h4" fontWeight={700}>
                {stats.rendezVous?.today || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rendez-vous aujourd'hui
              </Typography>
            </Box>
            <Chip
              label={`${stats.rendezVous?.upcoming || 0} à venir`}
              color="info"
            />
          </Box>
        </ModernCard>
      </Grid>
    </Grid>
  );

  const renderComptableWidgets = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <ModernCard title="État financier" variant="elevated">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Revenus mensuels
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {formatCurrency(stats.finances?.month || 0)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Factures impayées
              </Typography>
              <Typography variant="h6" fontWeight={600} color="warning.main">
                {stats.finances?.pending || 0}
              </Typography>
            </Box>
          </Box>
        </ModernCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <ModernCard title="Rapports disponibles" variant="elevated">
          <List dense>
            <ListItem>
              <ListItemIcon>
                <TrendingUp color="success" />
              </ListItemIcon>
              <ListItemText primary="Rapport mensuel" secondary="Disponible" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Payment color="info" />
              </ListItemIcon>
              <ListItemText primary="Rapport financier" secondary="À générer" />
            </ListItem>
          </List>
        </ModernCard>
      </Grid>
    </Grid>
  );

  switch (user.role) {
    case 'admin':
      return renderAdminWidgets();
    case 'medecin':
      return renderMedecinWidgets();
    case 'pharmacien':
      return renderPharmacienWidgets();
    case 'caissier':
      return renderCaissierWidgets();
    case 'infirmier':
      return renderInfirmierWidgets();
    case 'laborantin':
      return renderLaborantinWidgets();
    case 'secretaire':
      return renderSecretaireWidgets();
    case 'comptable':
      return renderComptableWidgets();
    default:
      return null;
  }
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
}

