import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Grid,
  Divider,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Person,
  Warning,
  LocalHospital,
  History,
  Phone,
  CalendarToday,
  Info,
} from '@mui/icons-material';
import { Patient } from '../../services/supabase';
import { ConsultationApiService } from '../../services/consultationApiService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PatientInfoPanelProps {
  patient: Patient;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const PatientInfoPanel: React.FC<PatientInfoPanelProps> = ({ patient }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);

  useEffect(() => {
    if (patient) {
      loadConsultations();
    }
  }, [patient]);

  const loadConsultations = async () => {
    setLoadingConsultations(true);
    try {
      const data = await ConsultationApiService.getConsultationsByPatient(patient.id);
      setConsultations(data.slice(0, 5)); // Dernières 5 consultations
    } catch (error) {
      console.error('Erreur lors du chargement des consultations:', error);
    } finally {
      setLoadingConsultations(false);
    }
  };

  const calculateAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Person color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" gutterBottom>
              Fiche Patient
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Informations administratives et médicales
            </Typography>
          </Box>
        </Box>

        {/* Alertes importantes */}
        {(patient.allergies && patient.allergies.trim().length > 0) && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              ⚠️ Allergies connues
            </Typography>
            <Typography variant="body2">{patient.allergies}</Typography>
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="Informations" icon={<Info />} iconPosition="start" />
          <Tab label="Antécédents" icon={<History />} iconPosition="start" />
          <Tab label="Consultations" icon={<LocalHospital />} iconPosition="start" />
        </Tabs>

        {/* Onglet Informations */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Identité
              </Typography>
              <Typography variant="body1">
                <strong>Nom:</strong> {patient.nom}
              </Typography>
              <Typography variant="body1">
                <strong>Prénom:</strong> {patient.prenom}
              </Typography>
              <Typography variant="body1">
                <strong>IPP:</strong> {patient.identifiant}
              </Typography>
              <Typography variant="body1">
                <strong>Date de naissance:</strong> {format(new Date(patient.date_naissance), 'dd/MM/yyyy', { locale: fr })} ({calculateAge(patient.date_naissance)} ans)
              </Typography>
              <Typography variant="body1">
                <strong>Sexe:</strong> {patient.sexe}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Contact
              </Typography>
              {patient.telephone && (
                <Typography variant="body1">
                  <Phone fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  <strong>Téléphone:</strong> {patient.telephone}
                </Typography>
              )}
              {patient.adresse && (
                <Typography variant="body1">
                  <strong>Adresse:</strong> {patient.adresse}
                </Typography>
              )}
              <Typography variant="body1">
                <strong>Service:</strong> {patient.service_initial || 'Non spécifié'}
              </Typography>
              <Typography variant="body1">
                <strong>Statut:</strong> <Chip label={patient.statut || 'Connu'} size="small" color={patient.statut === 'Nouveau' ? 'warning' : 'default'} />
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Antécédents */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Antécédents Médicaux
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default', minHeight: 50 }}>
                {patient.antecedents_medicaux ? (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {patient.antecedents_medicaux}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Aucun antécédent médical enregistré
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Allergies
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default', minHeight: 50 }}>
                {patient.allergies ? (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {patient.allergies}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Aucune allergie connue
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Traitements Habituels
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default', minHeight: 50 }}>
                {patient.medicaments_reguliers ? (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {patient.medicaments_reguliers}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Aucun traitement habituel enregistré
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Consultations */}
        <TabPanel value={activeTab} index={2}>
          {loadingConsultations ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : consultations.length === 0 ? (
            <Alert severity="info">
              Aucune consultation récente trouvée pour ce patient.
            </Alert>
          ) : (
            <List>
              {consultations.map((consult) => (
                <ListItem key={consult.id} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocalHospital fontSize="small" />
                        <Typography variant="subtitle2">
                          {consult.type || 'Consultation'}
                        </Typography>
                        <Chip
                          label={consult.status}
                          size="small"
                          color={consult.status === 'CLOTURE' ? 'success' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          <CalendarToday fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          {format(new Date(consult.started_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </Typography>
                        {consult.motifs && consult.motifs.length > 0 && (
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            Motifs: {consult.motifs.slice(0, 2).join(', ')}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
      </CardContent>
    </Card>
  );
};

