import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Close,
  Person,
  PregnantWoman,
  LocalHospital,
  Vaccines,
  Science,
  Image,
  Assignment,
} from '@mui/icons-material';
import { PatientIntegrationService } from '../../services/patientIntegrationService';
import { Patient } from '../../services/supabase';

interface PatientOverviewProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PatientOverview: React.FC<PatientOverviewProps> = ({
  open,
  onClose,
  patientId,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    if (open && patientId) {
      loadPatientData();
    }
  }, [open, patientId]);

  const loadPatientData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PatientIntegrationService.getPatientCompleteData(patientId);
      setPatientData(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!patientData) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  }

  const { patient, modules, resume } = patientData;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Person />
            <Box>
              <Typography variant="h6">
                {patient.prenom} {patient.nom}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patient.identifiant} • {patient.sexe} • {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Résumé rapide */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {resume.totalDossiersObstetricaux}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dossiers Maternité
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {resume.totalCPN}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Consultations CPN
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {resume.totalAccouchements}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Accouchements
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {resume.totalConsultations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Consultations
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {resume.totalVaccinations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vaccinations
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {resume.totalExamensLabo + resume.totalExamensImagerie}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Examens
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {/* Onglets par module */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<PregnantWoman />} label="Maternité" iconPosition="start" />
            <Tab icon={<LocalHospital />} label="Consultations" iconPosition="start" />
            <Tab icon={<Vaccines />} label="Vaccinations" iconPosition="start" />
            <Tab icon={<Science />} label="Laboratoire" iconPosition="start" />
            <Tab icon={<Image />} label="Imagerie" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Contenu Maternité */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Dossiers Obstétricaux ({modules.maternite.dossiersObstetricaux.length})
            </Typography>
            {modules.maternite.dossiersObstetricaux.length === 0 ? (
              <Alert severity="info">Aucun dossier obstétrical</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date d'entrée</TableCell>
                      <TableCell>DPA</TableCell>
                      <TableCell>Gestité</TableCell>
                      <TableCell>Parité</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modules.maternite.dossiersObstetricaux.map((dossier: any) => (
                      <TableRow key={dossier.id}>
                        <TableCell>{new Date(dossier.date_entree).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{dossier.dpa ? new Date(dossier.dpa).toLocaleDateString('fr-FR') : '-'}</TableCell>
                        <TableCell>{dossier.gestite}</TableCell>
                        <TableCell>{dossier.parite}</TableCell>
                        <TableCell>
                          <Chip label={dossier.statut} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Consultations Prénatales ({modules.maternite.consultationsCPN.length})
            </Typography>
            {modules.maternite.consultationsCPN.length === 0 ? (
              <Alert severity="info">Aucune consultation CPN</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>CPN N°</TableCell>
                      <TableCell>Trimestre</TableCell>
                      <TableCell>Terme (SA)</TableCell>
                      <TableCell>Poids</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modules.maternite.consultationsCPN.map((cpn: any) => (
                      <TableRow key={cpn.id}>
                        <TableCell>{new Date(cpn.date_consultation).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{cpn.numero_cpn}</TableCell>
                        <TableCell>{cpn.trimestre}</TableCell>
                        <TableCell>{cpn.terme_semaines}</TableCell>
                        <TableCell>{cpn.poids} kg</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Accouchements ({modules.maternite.accouchements.length})
            </Typography>
            {modules.maternite.accouchements.length === 0 ? (
              <Alert severity="info">Aucun accouchement enregistré</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Présentation</TableCell>
                      <TableCell>Issue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modules.maternite.accouchements.map((acc: any) => (
                      <TableRow key={acc.id}>
                        <TableCell>{new Date(acc.date_accouchement).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{acc.type_accouchement}</TableCell>
                        <TableCell>{acc.presentation}</TableCell>
                        <TableCell>{acc.issue_grossesse}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>

        {/* Contenu Consultations */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Consultations Générales ({modules.consultations.length})
          </Typography>
          {modules.consultations.length === 0 ? (
            <Alert severity="info">Aucune consultation enregistrée</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Motif</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.consultations.map((consult: any) => (
                    <TableRow key={consult.id}>
                      <TableCell>{new Date(consult.date_consultation).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{consult.type || '-'}</TableCell>
                      <TableCell>{consult.motif || '-'}</TableCell>
                      <TableCell>
                        <Chip label={consult.statut || '-'} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Contenu Vaccinations */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Vaccinations ({modules.vaccinations.length})
          </Typography>
          {modules.vaccinations.length === 0 ? (
            <Alert severity="info">Aucune vaccination enregistrée</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Vaccin</TableCell>
                    <TableCell>Dose</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.vaccinations.map((vacc: any) => (
                    <TableRow key={vacc.id}>
                      <TableCell>{new Date(vacc.date_vaccination).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{vacc.vaccin || '-'}</TableCell>
                      <TableCell>{vacc.dose || '-'}</TableCell>
                      <TableCell>
                        <Chip label={vacc.statut || '-'} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Contenu Laboratoire */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Examens de Laboratoire ({modules.laboratoire.examens.length})
          </Typography>
          {modules.laboratoire.examens.length === 0 ? (
            <Alert severity="info">Aucun examen de laboratoire enregistré</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type d'examen</TableCell>
                    <TableCell>Résultat</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.laboratoire.examens.map((examen: any) => (
                    <TableRow key={examen.id}>
                      <TableCell>{new Date(examen.date_examen).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{examen.type_examen || '-'}</TableCell>
                      <TableCell>{examen.resultat || '-'}</TableCell>
                      <TableCell>
                        <Chip label={examen.statut || '-'} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Contenu Imagerie */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>
            Examens d'Imagerie ({modules.imagerie.examens.length})
          </Typography>
          {modules.imagerie.examens.length === 0 ? (
            <Alert severity="info">Aucun examen d'imagerie enregistré</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type d'examen</TableCell>
                    <TableCell>Résultat</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.imagerie.examens.map((examen: any) => (
                    <TableRow key={examen.id}>
                      <TableCell>{new Date(examen.date_examen).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{examen.type_examen || '-'}</TableCell>
                      <TableCell>{examen.resultat || '-'}</TableCell>
                      <TableCell>
                        <Chip label={examen.statut || '-'} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PatientOverview;

