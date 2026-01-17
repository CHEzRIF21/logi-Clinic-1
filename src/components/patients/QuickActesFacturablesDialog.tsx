import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Receipt,
  CheckCircle,
} from '@mui/icons-material';
import { Patient } from '../../services/supabase';
import { SelectionActesFacturables } from './SelectionActesFacturables';
import { Acte, ActesService } from '../../services/actesService';
import { FacturationService } from '../../services/facturationService';

interface QuickActesFacturablesDialogProps {
  open: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

export const QuickActesFacturablesDialog: React.FC<QuickActesFacturablesDialogProps> = ({
  open,
  onClose,
  patient,
  onSuccess,
}) => {
  const [actesSelectionnes, setActesSelectionnes] = useState<Acte[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [factureId, setFactureId] = useState<string | null>(null);

  const handleActesChange = (actes: Acte[]) => {
    setActesSelectionnes(actes);
    setError(null);
  };

  const handleEnregistrer = async () => {
    if (!patient) {
      setError('Patient non sélectionné');
      return;
    }

    if (actesSelectionnes.length === 0) {
      setError('Veuillez sélectionner au moins un acte à facturer');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer l'utilisateur actuel pour le caissier_id
      const userData = localStorage.getItem('user');
      let caissierId: string | undefined;
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.id) {
            caissierId = user.id;
          }
        } catch (e) {
          console.warn('Erreur lors de la récupération de l\'ID utilisateur:', e);
        }
      }

      // Convertir les actes en lignes de facture
      const lignes = actesSelectionnes.map((acte) => ({
        code_service: acte.code,
        libelle: acte.libelle,
        quantite: acte.quantite,
        prix_unitaire: acte.prix_unitaire,
        remise_ligne: 0,
        montant_ligne: acte.prix_unitaire * acte.quantite,
      }));

      // Créer la facture directement
      const facture = await FacturationService.createFacture(
        {
          patient_id: patient.id,
          lignes,
          type_facture: 'normale',
          service_origine: 'actes_rapides',
        },
        caissierId
      );

      setFactureId(facture.id);
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      console.error('Erreur lors de la création de la facture:', err);
      setError('Erreur lors de la création de la facture: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setActesSelectionnes([]);
      setError(null);
      setSuccess(false);
      setFactureId(null);
      onClose();
    }
  };

  const calculerTotal = () => {
    return actesSelectionnes.reduce(
      (sum, acte) => sum + acte.prix_unitaire * acte.quantite,
      0
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Receipt color="primary" />
          <Box>
            <Typography variant="h6">
              Actes à Facturer - {patient ? `${patient.prenom} ${patient.nom}` : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Créer rapidement une facture avec des actes facturables
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success ? (
          <Box textAlign="center" py={4}>
            <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Facture créée avec succès !
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Les actes ont été enregistrés et une facture a été générée.
              {factureId && (
                <Box component="span" display="block" sx={{ mt: 1 }}>
                  ID Facture: <strong>{factureId}</strong>
                </Box>
              )}
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Le patient peut maintenant effectuer le paiement à la Caisse.
            </Alert>
          </Box>
        ) : (
          <>
            {patient && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Patient sélectionné
                </Typography>
                <Typography variant="body2">
                  <strong>{patient.prenom} {patient.nom}</strong> - {patient.identifiant}
                </Typography>
              </Alert>
            )}

            <SelectionActesFacturables
              typeConsultation="generale"
              isUrgent={false}
              onActesChange={handleActesChange}
              initialActes={actesSelectionnes}
            />

            {actesSelectionnes.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    Total à facturer:
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {calculerTotal().toLocaleString()} XOF
                  </Typography>
                </Box>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        {success ? (
          <Button onClick={handleClose} variant="contained" color="primary">
            Fermer
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              onClick={handleEnregistrer}
              variant="contained"
              color="primary"
              disabled={loading || actesSelectionnes.length === 0 || !patient}
              startIcon={loading ? <CircularProgress size={20} /> : <Receipt />}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer et Facturer'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
