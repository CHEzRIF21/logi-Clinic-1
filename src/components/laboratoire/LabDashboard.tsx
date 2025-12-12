import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, List, ListItem, ListItemText, Chip, IconButton, Alert, AlertTitle, Button } from '@mui/material';
import { 
  AccessTime, 
  Science, 
  Warning, 
  CheckCircle, 
  Error as ErrorIcon,
  Refresh,
  Print
} from '@mui/icons-material';
import { GlassCard } from '../ui/GlassCard';
import { StatBadge } from '../ui/StatBadge';
import { LaboratoireService, LabPrelevement, LabAnalyse, LabAlerte } from '../../services/laboratoireService';
import { PatientService } from '../../services/patientService';
import { Patient } from '../../services/supabase';

interface LabDashboardProps {
  onSelectPrelevement?: (prelevement: LabPrelevement) => void;
  onSelectAnalyse?: (analyse: LabAnalyse) => void;
}

const LabDashboard: React.FC<LabDashboardProps> = ({ onSelectPrelevement, onSelectAnalyse }) => {
  const [fileAttente, setFileAttente] = useState<LabPrelevement[]>([]);
  const [examensEnCours, setExamensEnCours] = useState<LabAnalyse[]>([]);
  const [alertes, setAlertes] = useState<LabAlerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientsMap, setPatientsMap] = useState<Record<string, Patient>>({});

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Charger la file d'attente
      const attente = await LaboratoireService.getFileAttentePrelevements();
      setFileAttente(attente);

      // Charger les examens en cours
      const enCours = await LaboratoireService.getExamensEnCours();
      setExamensEnCours(enCours);

      // Charger les alertes non résolues
      const alertesData = await LaboratoireService.getAlertes('nouvelle');
      setAlertes(alertesData);

      // Charger les informations des patients pour la file d'attente
      const patientIds = new Set<string>();
      attente.forEach(p => {
        // Récupérer le patient_id depuis la prescription
        // Note: Il faudrait charger les prescriptions pour obtenir les patient_id
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPrioriteColor = (priorite: LabAlerte['priorite']) => {
    switch (priorite) {
      case 'critique': return 'error';
      case 'haute': return 'warning';
      case 'moyenne': return 'info';
      default: return 'default';
    }
  };

  const getTypeAlerteIcon = (type: LabAlerte['type_alerte']) => {
    switch (type) {
      case 'resultat_critique': return <ErrorIcon />;
      case 'appareil_defaut': return <Warning />;
      case 'stock_critique': return <Warning />;
      case 'peremption': return <Warning />;
      default: return <Warning />;
    }
  };

  return (
    <Box>
      {/* Statistiques rapides */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge
              label="File d'attente"
              value={fileAttente.length.toString()}
              icon={<AccessTime />}
              color="warning"
            />
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge
              label="Examens en cours"
              value={examensEnCours.length.toString()}
              icon={<Science />}
              color="info"
            />
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge
              label="Alertes critiques"
              value={alertes.filter(a => a.priorite === 'critique').length.toString()}
              icon={<ErrorIcon />}
              color="error"
            />
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge
              label="Total alertes"
              value={alertes.length.toString()}
              icon={<Warning />}
              color="warning"
            />
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* File d'attente */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                File d'attente - Prélèvements
              </Typography>
              <IconButton size="small" onClick={loadDashboard}>
                <Refresh />
              </IconButton>
            </Box>
            {fileAttente.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Aucun prélèvement en attente
              </Typography>
            ) : (
              <List dense>
                {fileAttente.slice(0, 10).map((prelevement) => (
                  <ListItem
                    key={prelevement.id}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => onSelectPrelevement?.(prelevement)}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {prelevement.code_unique}
                          </Typography>
                          <Chip 
                            label={prelevement.type_echantillon} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {new Date(prelevement.date_prelevement).toLocaleString('fr-FR')}
                          {prelevement.agent_preleveur && ` • ${prelevement.agent_preleveur}`}
                        </Typography>
                      }
                    />
                    {prelevement.statut_echantillon === 'rejete' && (
                      <Chip label="Rejeté" size="small" color="error" />
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </GlassCard>
        </Grid>

        {/* Examens en cours */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Examens en cours
              </Typography>
              <IconButton size="small" onClick={loadDashboard}>
                <Refresh />
              </IconButton>
            </Box>
            {examensEnCours.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Aucun examen en cours
              </Typography>
            ) : (
              <List dense>
                {examensEnCours.slice(0, 10).map((analyse) => (
                  <ListItem
                    key={analyse.id}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => onSelectAnalyse?.(analyse)}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {analyse.parametre}
                          </Typography>
                          <Chip 
                            label={analyse.statut} 
                            size="small" 
                            color={analyse.statut === 'termine' ? 'success' : 'warning'}
                            variant="outlined"
                          />
                          {analyse.est_pathologique && (
                            <Chip label="Pathologique" size="small" color="error" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {analyse.type_resultat === 'quantitatif' 
                            ? `${analyse.valeur_numerique} ${analyse.unite || ''}`.trim()
                            : analyse.valeur_qualitative || 'En attente'}
                          {analyse.technicien && ` • ${analyse.technicien}`}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </GlassCard>
        </Grid>

        {/* Alertes */}
        <Grid item xs={12}>
          <GlassCard sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Alertes
              </Typography>
              <IconButton size="small" onClick={loadDashboard}>
                <Refresh />
              </IconButton>
            </Box>
            {alertes.length === 0 ? (
              <Alert severity="success" icon={<CheckCircle />}>
                Aucune alerte en cours
              </Alert>
            ) : (
              <Box display="flex" flexDirection="column" gap={1}>
                {alertes.map((alerte) => (
                  <Alert
                    key={alerte.id}
                    severity={getPrioriteColor(alerte.priorite) as any}
                    icon={getTypeAlerteIcon(alerte.type_alerte)}
                    action={
                      <Button
                        size="small"
                        onClick={async () => {
                          await LaboratoireService.resoudreAlerte(alerte.id, 'Utilisateur actuel');
                          loadDashboard();
                        }}
                      >
                        Résoudre
                      </Button>
                    }
                  >
                    <AlertTitle>{alerte.titre}</AlertTitle>
                    {alerte.message}
                    {alerte.appareil && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        Appareil: {alerte.appareil}
                      </Typography>
                    )}
                  </Alert>
                ))}
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LabDashboard;

