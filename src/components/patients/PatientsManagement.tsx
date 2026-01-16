import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Fab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add, People, Person, MedicalServices, History, Receipt } from '@mui/icons-material';
import { PatientsTable } from './PatientsTable';
import { PatientForm } from './PatientForm';
import { PatientDetailsDialog } from './PatientDetailsDialog';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { PatientRegistrationWithBilling } from './PatientRegistrationWithBilling';
import { Patient, PatientFormData } from '../../services/supabase';
import { usePatients } from '../../hooks/usePatients';
import { usePermissions } from '../../hooks/usePermissions';
import { GradientText } from '../ui/GradientText';
import { ToolbarBits } from '../ui/ToolbarBits';
import { GlassCard } from '../ui/GlassCard';
import { StatBadge } from '../ui/StatBadge';

export const PatientsManagement: React.FC = () => {
  const {
    patients,
    loading,
    error,
    stats,
    createPatient,
    updatePatient,
    deletePatient,
    clearError,
  } = usePatients();
  
  const { canCreatePatient, canModifyPatient } = usePermissions();

  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openRegistrationWithBilling, setOpenRegistrationWithBilling] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Gérer l'ouverture du formulaire pour un nouveau patient
  const handleAddPatient = () => {
    setEditingPatient(null);
    setOpenFormDialog(true);
  };

  // Gérer l'édition d'un patient
  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setOpenFormDialog(true);
  };

  // Gérer l'affichage des détails d'un patient
  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setOpenDetailsDialog(true);
  };

  // Gérer la suppression d'un patient
  const handleDeletePatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setOpenDeleteDialog(true);
  };

  // Gérer la soumission du formulaire
  const handleSubmitForm = async (data: PatientFormData): Promise<Patient> => {
    try {
      // Vérifier les permissions
      if (editingPatient) {
        if (!canModifyPatient()) {
          showSnackbar('Vous n\'avez pas la permission de modifier un patient', 'error');
          throw new Error('Permission refusée');
        }
      } else {
        if (!canCreatePatient()) {
          showSnackbar('Seuls les réceptionnistes et secrétaires peuvent créer des patients', 'error');
          throw new Error('Permission refusée');
        }
      }
      
      let result: Patient;
      if (editingPatient) {
        result = await updatePatient(editingPatient.id, data);
        showSnackbar('Patient modifié avec succès', 'success');
      } else {
        result = await createPatient(data);
        showSnackbar('Patient créé avec succès', 'success');
      }
      setOpenFormDialog(false);
      setEditingPatient(null);
      return result;
    } catch (error) {
      console.error('Erreur dans handleSubmitForm:', error);
      let errorMessage = `Erreur lors de ${editingPatient ? 'la modification' : 'la création'} du patient`;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // Si le message contient des informations sur les colonnes manquantes
        if (error.message.includes('column') || error.message.includes('does not exist') || error.message.includes('n\'existe pas')) {
          errorMessage = 'Les migrations de base de données ne sont pas à jour. Veuillez exécuter les migrations SQL dans Supabase (fichier: add_patient_accompagnant_personne_prevenir.sql).';
        }
      }
      
      showSnackbar(errorMessage, 'error');
      throw error;
    }
  };

  // Gérer la confirmation de suppression
  const handleConfirmDelete = async () => {
    if (selectedPatient) {
      try {
        await deletePatient(selectedPatient.id);
        showSnackbar('Patient supprimé avec succès', 'success');
        setOpenDeleteDialog(false);
        setSelectedPatient(null);
      } catch (error) {
        showSnackbar('Erreur lors de la suppression du patient', 'error');
      }
    }
  };

  // Fermer le formulaire
  const handleCloseForm = () => {
    setOpenFormDialog(false);
    setEditingPatient(null);
  };

  // Afficher un message de notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Fermer la notification
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête amélioré */}
      <ToolbarBits sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <People color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <GradientText variant="h4">Gestion des Patients</GradientText>
            <Typography variant="body2" color="text.secondary">
              Gérez vos patients et leurs informations médicales
            </Typography>
          </Box>
        </Box>
        {canCreatePatient() && (
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddPatient}
              size="medium"
            >
              Nouveau Patient
            </Button>
            <Button
              variant="contained"
              startIcon={<Receipt />}
              onClick={() => setOpenRegistrationWithBilling(true)}
              size="medium"
              color="primary"
            >
              Enregistrer avec Facturation
            </Button>
          </Box>
        )}
      </ToolbarBits>

      {/* Statistiques synthétiques */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={2} mb={3}>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Patients enregistrés" value={stats?.total ?? 0} icon={<People />} color="primary" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Nouveaux" value={stats?.parStatut?.nouveau ?? 0} icon={<Person />} color="success" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Consultations générales" value={stats?.parService?.medecine ?? 0} icon={<MedicalServices />} color="warning" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Connus" value={stats?.parStatut?.connu ?? 0} icon={<History />} color="info" />
        </GlassCard>
      </Box>

      {/* Tableau des patients */}
      <PatientsTable
        onEditPatient={handleEditPatient}
        onViewPatient={handleViewPatient}
        onDeletePatient={handleDeletePatient}
      />

      {/* Enregistrement avec facturation (plein écran) */}
      {openRegistrationWithBilling && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'background.paper',
            zIndex: 1300,
            overflow: 'auto',
          }}
        >
          <PatientRegistrationWithBilling
            onComplete={(patientId, consultationId) => {
              setOpenRegistrationWithBilling(false);
              showSnackbar('Patient enregistré et consultation créée avec succès. Redirection vers la Caisse pour le paiement.', 'success');
            }}
            onCancel={() => setOpenRegistrationWithBilling(false)}
          />
        </Box>
      )}

      {/* Formulaire d'ajout/modification */}
      <Dialog
        open={openFormDialog}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          {editingPatient ? 'Modifier le patient' : 'Nouveau patient'}
        </DialogTitle>
        <DialogContent>
          <PatientForm
            patient={editingPatient}
            onSubmit={handleSubmitForm}
            onCancel={handleCloseForm}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue des détails */}
      <PatientDetailsDialog
        patient={selectedPatient}
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
      />

      {/* Dialogue de confirmation de suppression */}
      <DeleteConfirmationDialog
        patient={selectedPatient}
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />

      {/* Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Bouton flottant pour ajouter un patient */}
      <Tooltip title="Nouveau patient" placement="left">
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleAddPatient}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <Add />
        </Fab>
      </Tooltip>
    </Box>
  );
};
