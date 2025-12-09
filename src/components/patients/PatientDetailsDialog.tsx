import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Box,
  Divider,
  Avatar,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person,
  Phone,
  LocationOn,
  Bloodtype,
  MedicalServices,
  Info,
  CalendarToday,
  Work,
  FamilyRestroom,
  HealthAndSafety,
  Vaccines,
  Medication,
  Timeline,
  History,
} from '@mui/icons-material';
import { Patient } from '../../services/supabase';
import { PatientCareTimeline } from './PatientCareTimeline';
import { PatientHistoryTimeline } from './PatientHistoryTimeline';

interface PatientDetailsDialogProps {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
}

export const PatientDetailsDialog: React.FC<PatientDetailsDialogProps> = ({
  patient,
  open,
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState(0);

  if (!patient) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
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

  const getBloodTypeColor = (bloodType: string) => {
    switch (bloodType) {
      case 'A': return 'error';
      case 'B': return 'warning';
      case 'AB': return 'info';
      case 'O': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Nouveau' ? 'warning' : 'success';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: patient.sexe === 'Masculin' ? 'primary.main' : 'secondary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h6">
              {patient.prenom} {patient.nom}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {patient.identifiant}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab icon={<Person />} label="Informations" />
          <Tab icon={<Timeline />} label="Suivi" />
          <Tab icon={<History />} label="Historique" />
        </Tabs>

        {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Informations de base */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              Informations de base
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Nom complet
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {patient.prenom} {patient.nom}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Sexe
                </Typography>
                <Chip
                  label={patient.sexe}
                  color={patient.sexe === 'Masculin' ? 'primary' : 'secondary'}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Date de naissance
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarToday fontSize="small" color="action" />
                  <Typography variant="body1">
                    {formatDate(patient.date_naissance)} ({calculateAge(patient.date_naissance)} ans)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Lieu de naissance
                </Typography>
                <Typography variant="body1">
                  {patient.lieu_naissance || 'Non spécifié'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact et adresse */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone color="primary" />
              Contact et adresse
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Téléphone
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body1">
                    {patient.telephone || 'Non spécifié'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Téléphone proche
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body1">
                    {patient.telephone_proche || 'Non spécifié'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Adresse
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body1">
                    {patient.adresse || 'Non spécifiée'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Personne d'urgence
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {patient.personne_urgence}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Profession
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Work fontSize="small" color="action" />
                  <Typography variant="body1">
                    {patient.profession || 'Non spécifiée'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Informations médicales */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HealthAndSafety color="primary" />
              Informations médicales
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Situation matrimoniale
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <FamilyRestroom fontSize="small" color="action" />
                  <Typography variant="body1">
                    {patient.situation_matrimoniale || 'Non spécifiée'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Couverture santé
                </Typography>
                <Chip
                  label={patient.couverture_sante || 'Aucun'}
                  color={patient.couverture_sante === 'Aucun' ? 'default' : 'primary'}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Groupe sanguin
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Bloodtype fontSize="small" color="action" />
                  <Chip
                    label={patient.groupe_sanguin || 'Inconnu'}
                    color={getBloodTypeColor(patient.groupe_sanguin || 'Inconnu')}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Statut vaccinal
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Vaccines fontSize="small" color="action" />
                  <Chip
                    label={patient.statut_vaccinal || 'Inconnu'}
                    color={patient.statut_vaccinal === 'À jour' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {patient.allergies && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Allergies
                  </Typography>
                  <Typography variant="body1">
                    {patient.allergies}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {patient.maladies_chroniques && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Maladies chroniques
                  </Typography>
                  <Typography variant="body1">
                    {patient.maladies_chroniques}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {patient.antecedents_medicaux && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Antécédents médicaux
                  </Typography>
                  <Typography variant="body1">
                    {patient.antecedents_medicaux}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {patient.prise_medicaments_reguliers && patient.medicaments_reguliers && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Médicaments réguliers
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Medication fontSize="small" color="action" />
                    <Typography variant="body1">
                      {patient.medicaments_reguliers}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Service et statut */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicalServices color="primary" />
              Service et statut
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Service initial
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <MedicalServices fontSize="small" color="action" />
                  <Typography variant="body1">
                    {patient.service_initial || 'Non spécifié'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Statut
                </Typography>
                <Chip
                  label={patient.statut || 'Nouveau'}
                  color={getStatusColor(patient.statut || 'Nouveau')}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>

          {patient.notes && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Notes
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Info fontSize="small" color="action" />
                    <Typography variant="body1">
                      {patient.notes}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Section Accompagnant */}
          {(patient.accompagnant_nom || patient.accompagnant_prenoms || patient.accompagnant_telephone) && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FamilyRestroom color="primary" />
                  Accompagnant
                </Typography>
              </Grid>

              {patient.accompagnant_nom && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Nom complet
                      </Typography>
                      <Typography variant="body1">
                        {patient.accompagnant_prenoms} {patient.accompagnant_nom}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {patient.accompagnant_filiation && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Filiation
                      </Typography>
                      <Typography variant="body1">
                        {patient.accompagnant_filiation}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {patient.accompagnant_telephone && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Téléphone
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="body1">
                          {patient.accompagnant_telephone}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {patient.accompagnant_quartier && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Quartier
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body1">
                          {patient.accompagnant_quartier}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {patient.accompagnant_profession && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Profession
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Work fontSize="small" color="action" />
                        <Typography variant="body1">
                          {patient.accompagnant_profession}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </>
          )}

          {/* Section Personne à prévenir */}
          {(patient.personne_prevenir_nom || patient.personne_prevenir_prenoms || patient.personne_prevenir_telephone || patient.personne_prevenir_option === 'identique_accompagnant') && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone color="primary" />
                  Personne à prévenir
                </Typography>
              </Grid>

              {patient.personne_prevenir_option === 'identique_accompagnant' ? (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body1" color="textSecondary">
                        Identique à l'accompagnant
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ) : (
                <>
                  {patient.personne_prevenir_nom && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Nom complet
                          </Typography>
                          <Typography variant="body1">
                            {patient.personne_prevenir_prenoms} {patient.personne_prevenir_nom}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {patient.personne_prevenir_filiation && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Filiation
                          </Typography>
                          <Typography variant="body1">
                            {patient.personne_prevenir_filiation}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {patient.personne_prevenir_telephone && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Téléphone
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Phone fontSize="small" color="action" />
                            <Typography variant="body1">
                              {patient.personne_prevenir_telephone}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {patient.personne_prevenir_quartier && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Quartier
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body1">
                              {patient.personne_prevenir_quartier}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {patient.personne_prevenir_profession && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Profession
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Work fontSize="small" color="action" />
                            <Typography variant="body1">
                              {patient.personne_prevenir_profession}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </>
              )}
            </>
          )}

          {/* Informations système */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info color="primary" />
              Informations système
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Date d'enregistrement
                </Typography>
                <Typography variant="body1">
                  {formatDate(patient.date_enregistrement)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Dernière modification
                </Typography>
                <Typography variant="body1">
                  {formatDate(patient.updated_at)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        )}

        {activeTab === 1 && (
          <PatientCareTimeline patientId={patient.id} />
        )}

        {activeTab === 2 && (
          <PatientHistoryTimeline patient={patient} />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};
