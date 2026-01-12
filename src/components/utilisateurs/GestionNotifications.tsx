import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Notifications,
  Settings,
  Send,
  Visibility,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import {
  NotificationService,
  Notification,
  NotificationRule,
  NotificationType,
} from '../../services/notificationService';
import { UserPermissionsService, ExtendedUser } from '../../services/userPermissionsService';
import { getMyClinicId } from '../../services/clinicService';

interface GestionNotificationsProps {
  user: ExtendedUser | null;
}

const GestionNotifications: React.FC<GestionNotificationsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'regles'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [types, setTypes] = useState<NotificationType[]>([]);
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);

  // États pour le formulaire de création de notification
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    typeCode: '',
    titre: '',
    message: '',
    lien: '',
    priorite: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    destinataires: {
      roles: [] as string[],
      user_ids: [] as string[],
      all_users: false,
    },
  });

  // États pour le formulaire de création de règle
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    nom: '',
    description: '',
    typeId: '',
    conditions: {},
    destinataires: {
      roles: [] as string[],
      user_ids: [] as string[],
      all_users: false,
    },
    actif: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentClinicId = await getMyClinicId();
      if (!currentClinicId) {
        setError('Clinic ID manquant');
        return;
      }

      setClinicId(currentClinicId);

      const [notificationsData, rulesData, typesData, usersData] = await Promise.all([
        NotificationService.getClinicNotifications(currentClinicId),
        NotificationService.getNotificationRules(currentClinicId),
        NotificationService.getNotificationTypes(),
        UserPermissionsService.getAllUsers(currentClinicId),
      ]);

      setNotifications(notificationsData);
      setRules(rulesData);
      setTypes(typesData);
      setUsers(usersData);
    } catch (err: any) {
      console.error('Erreur lors du chargement:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async () => {
    try {
      setLoading(true);
      await NotificationService.createNotification({
        typeCode: createForm.typeCode,
        titre: createForm.titre,
        message: createForm.message,
        lien: createForm.lien || undefined,
        priorite: createForm.priorite,
        destinataires: createForm.destinataires.all_users || 
          createForm.destinataires.roles.length > 0 || 
          createForm.destinataires.user_ids.length > 0
          ? createForm.destinataires
          : undefined,
      });

      setCreateDialogOpen(false);
      setCreateForm({
        typeCode: '',
        titre: '',
        message: '',
        lien: '',
        priorite: 'normal',
        destinataires: {
          roles: [],
          user_ids: [],
          all_users: false,
        },
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la notification');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      setLoading(true);
      if (editingRule) {
        await NotificationService.updateNotificationRule(editingRule.id, {
          nom: ruleForm.nom,
          description: ruleForm.description,
          type_id: ruleForm.typeId || undefined,
          conditions: ruleForm.conditions,
          destinataires: ruleForm.destinataires,
          actif: ruleForm.actif,
        });
      } else {
        await NotificationService.createNotificationRule({
          clinic_id: clinicId!,
          type_id: ruleForm.typeId || undefined,
          nom: ruleForm.nom,
          description: ruleForm.description,
          conditions: ruleForm.conditions,
          destinataires: ruleForm.destinataires,
          actif: ruleForm.actif,
          created_by: user?.id,
        });
      }

      setRuleDialogOpen(false);
      setEditingRule(null);
      setRuleForm({
        nom: '',
        description: '',
        typeId: '',
        conditions: {},
        destinataires: {
          roles: [],
          user_ids: [],
          all_users: false,
        },
        actif: true,
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde de la règle');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette règle ?')) {
      return;
    }

    try {
      setLoading(true);
      await NotificationService.deleteNotificationRule(ruleId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRule = (rule: NotificationRule) => {
    setEditingRule(rule);
    setRuleForm({
      nom: rule.nom,
      description: rule.description || '',
      typeId: rule.type_id || '',
      conditions: rule.conditions || {},
      destinataires: {
        roles: rule.destinataires?.roles || [],
        user_ids: rule.destinataires?.user_ids || [],
        all_users: rule.destinataires?.all_users || false,
      },
      actif: rule.actif,
    });
    setRuleDialogOpen(true);
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading && notifications.length === 0 && rules.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Notifications" value="notifications" />
          <Tab label="Règles de Notification" value="regles" />
        </Tabs>
      </Box>

      {/* Onglet Notifications */}
      {activeTab === 'notifications' && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Notifications de la clinique ({notifications.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Créer une notification
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Titre</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Priorité</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 4 }}>
                          Aucune notification créée
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    notifications.map((notification) => (
                      <TableRow key={notification.id} hover>
                        <TableCell>
                          <Chip
                            label={notification.type?.nom || 'Non spécifié'}
                            size="small"
                            color={notification.type?.couleur as any || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {notification.titre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {notification.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={notification.priorite}
                            size="small"
                            color={getPriorityColor(notification.priorite) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={notification.lu ? 'Lue' : 'Non lue'}
                            size="small"
                            color={notification.lu ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          {notification.created_at.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary">
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Onglet Règles */}
      {activeTab === 'regles' && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Règles de notification ({rules.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setEditingRule(null);
                  setRuleForm({
                    nom: '',
                    description: '',
                    typeId: '',
                    conditions: {},
                    destinataires: {
                      roles: [],
                      user_ids: [],
                      all_users: false,
                    },
                    actif: true,
                  });
                  setRuleDialogOpen(true);
                }}
              >
                Nouvelle règle
              </Button>
            </Box>

            <Grid container spacing={2}>
              {rules.length === 0 ? (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Aucune règle de notification configurée. Créez une règle pour automatiser l'envoi de notifications.
                  </Alert>
                </Grid>
              ) : (
                rules.map((rule) => (
                  <Grid item xs={12} md={6} key={rule.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Box>
                            <Typography variant="h6">{rule.nom}</Typography>
                            {rule.description && (
                              <Typography variant="body2" color="text.secondary">
                                {rule.description}
                              </Typography>
                            )}
                          </Box>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditRule(rule)}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>

                        <Box mb={2}>
                          <Chip
                            label={rule.type?.nom || 'Tous types'}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={rule.actif ? 'Actif' : 'Inactif'}
                            size="small"
                            color={rule.actif ? 'success' : 'default'}
                          />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>
                          Destinataires:
                        </Typography>
                        {rule.destinataires.all_users ? (
                          <Typography variant="body2">Tous les utilisateurs</Typography>
                        ) : (
                          <Box>
                            {rule.destinataires.roles && rule.destinataires.roles.length > 0 && (
                              <Typography variant="body2">
                                Rôles: {rule.destinataires.roles.join(', ')}
                              </Typography>
                            )}
                            {rule.destinataires.user_ids && rule.destinataires.user_ids.length > 0 && (
                              <Typography variant="body2">
                                Utilisateurs spécifiques: {rule.destinataires.user_ids.length}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Dialog création notification */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Créer une notification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type de notification</InputLabel>
                <Select
                  value={createForm.typeCode}
                  label="Type de notification"
                  onChange={(e) => setCreateForm({ ...createForm, typeCode: e.target.value })}
                >
                  {types.map((type) => (
                    <MenuItem key={type.id} value={type.code}>
                      {type.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titre"
                value={createForm.titre}
                onChange={(e) => setCreateForm({ ...createForm, titre: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                value={createForm.message}
                onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lien (optionnel)"
                value={createForm.lien}
                onChange={(e) => setCreateForm({ ...createForm, lien: e.target.value })}
                placeholder="/consultations/123"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priorité</InputLabel>
                <Select
                  value={createForm.priorite}
                  label="Priorité"
                  onChange={(e) => setCreateForm({ ...createForm, priorite: e.target.value as any })}
                >
                  <MenuItem value="low">Basse</MenuItem>
                  <MenuItem value="normal">Normale</MenuItem>
                  <MenuItem value="high">Haute</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Destinataires
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={createForm.destinataires.all_users}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        destinataires: {
                          ...createForm.destinataires,
                          all_users: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label="Tous les utilisateurs de la clinique"
              />
            </Grid>
            {!createForm.destinataires.all_users && (
              <>
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Rôles:
                  </Typography>
                  <List dense>
                    {['medecin', 'infirmier', 'pharmacien', 'receptionniste', 'admin'].map((role) => (
                      <ListItem key={role}>
                        <ListItemText primary={role} />
                        <ListItemSecondaryAction>
                          <Checkbox
                            checked={createForm.destinataires.roles.includes(role)}
                            onChange={(e) => {
                              const roles = e.target.checked
                                ? [...createForm.destinataires.roles, role]
                                : createForm.destinataires.roles.filter((r) => r !== role);
                              setCreateForm({
                                ...createForm,
                                destinataires: { ...createForm.destinataires, roles },
                              });
                            }}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Utilisateurs spécifiques:
                  </Typography>
                  <List dense>
                    {users.slice(0, 10).map((u) => (
                      <ListItem key={u.id}>
                        <ListItemText primary={`${u.prenom} ${u.nom}`} secondary={u.email} />
                        <ListItemSecondaryAction>
                          <Checkbox
                            checked={createForm.destinataires.user_ids.includes(u.id)}
                            onChange={(e) => {
                              const user_ids = e.target.checked
                                ? [...createForm.destinataires.user_ids, u.id]
                                : createForm.destinataires.user_ids.filter((id) => id !== u.id);
                              setCreateForm({
                                ...createForm,
                                destinataires: { ...createForm.destinataires, user_ids },
                              });
                            }}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleCreateNotification}
            variant="contained"
            disabled={!createForm.typeCode || !createForm.titre || !createForm.message}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog création/modification règle */}
      <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRule ? 'Modifier la règle' : 'Nouvelle règle de notification'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom de la règle"
                value={ruleForm.nom}
                onChange={(e) => setRuleForm({ ...ruleForm, nom: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type de notification</InputLabel>
                <Select
                  value={ruleForm.typeId}
                  label="Type de notification"
                  onChange={(e) => setRuleForm({ ...ruleForm, typeId: e.target.value })}
                >
                  <MenuItem value="">Tous les types</MenuItem>
                  {types.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Destinataires
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={ruleForm.destinataires.all_users}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        destinataires: {
                          ...ruleForm.destinataires,
                          all_users: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label="Tous les utilisateurs de la clinique"
              />
            </Grid>
            {!ruleForm.destinataires.all_users && (
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Rôles:
                </Typography>
                <List dense>
                  {['medecin', 'infirmier', 'pharmacien', 'receptionniste', 'admin'].map((role) => (
                    <ListItem key={role}>
                      <ListItemText primary={role} />
                      <ListItemSecondaryAction>
                        <Checkbox
                          checked={ruleForm.destinataires.roles.includes(role)}
                          onChange={(e) => {
                            const roles = e.target.checked
                              ? [...ruleForm.destinataires.roles, role]
                              : ruleForm.destinataires.roles.filter((r) => r !== role);
                            setRuleForm({
                              ...ruleForm,
                              destinataires: { ...ruleForm.destinataires, roles },
                            });
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ruleForm.actif}
                    onChange={(e) => setRuleForm({ ...ruleForm, actif: e.target.checked })}
                  />
                }
                label="Règle active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleCreateRule}
            variant="contained"
            disabled={!ruleForm.nom}
          >
            {editingRule ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionNotifications;
