import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CloudUpload, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { importerMedicaments, verifierMedicamentsExistants } from '../../scripts/importMedicaments';

interface ImportMedicamentsDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

const ImportMedicamentsDialog: React.FC<ImportMedicamentsDialogProps> = ({
  open,
  onClose,
  onImportComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    total: number;
    importes: number;
    erreurs: number;
  } | null>(null);
  const [medicamentsExistants, setMedicamentsExistants] = useState<number>(0);

  // Vérifier le nombre de médicaments existants au chargement
  React.useEffect(() => {
    if (open) {
      verifierMedicamentsExistants()
        .then(count => setMedicamentsExistants(count))
        .catch(err => console.error('Erreur lors de la vérification:', err));
    }
  }, [open]);

  const handleImport = async () => {
    try {
      setLoading(true);
      setProgress(0);
      setResult(null);

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const importResult = await importerMedicaments();

      clearInterval(progressInterval);
      setProgress(100);
      setResult(importResult);

      if (importResult.success && onImportComplete) {
        setTimeout(() => {
          onImportComplete();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'importation:', error);
      setResult({
        success: false,
        total: 0,
        importes: 0,
        erreurs: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setResult(null);
      setProgress(0);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CloudUpload color="primary" />
          <Typography variant="h6">Importer les Médicaments</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {!result && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Cette opération va importer tous les médicaments de la liste complète dans la base de données.
                  Les médicaments seront automatiquement :
                </Typography>
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                  <li>Triés par ordre alphabétique</li>
                  <li>Dédupliqués (aucun doublon)</li>
                  <li>Attribués d'un code unique (MED000, MED001, etc.)</li>
                  <li>Catégorisés automatiquement</li>
                </ul>
              </Alert>

              {medicamentsExistants > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>{medicamentsExistants}</strong> médicament(s) existant(s) dans la base de données.
                    Les nouveaux médicaments seront ajoutés sans affecter les existants.
                  </Typography>
                </Alert>
              )}

              {loading && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Importation en cours...
                  </Typography>
                  <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {progress}%
                  </Typography>
                </Box>
              )}
            </>
          )}

          {result && (
            <Box>
              {result.success ? (
                <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Importation réussie !
                  </Typography>
                  <Typography variant="body2">
                    <strong>{result.importes}</strong> médicament(s) importé(s) sur {result.total}
                  </Typography>
                  {result.erreurs > 0 && (
                    <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                      {result.erreurs} erreur(s) rencontrée(s)
                    </Typography>
                  )}
                </Alert>
              ) : (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Erreur lors de l'importation
                  </Typography>
                  <Typography variant="body2">
                    {result.erreurs} erreur(s) rencontrée(s) sur {result.total} médicament(s)
                  </Typography>
                </Alert>
              )}

              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Résumé de l'importation :
                </Typography>
                <Typography variant="body2">
                  • Total à importer : {result.total}
                </Typography>
                <Typography variant="body2" color="success.main">
                  • Importés avec succès : {result.importes}
                </Typography>
                {result.erreurs > 0 && (
                  <Typography variant="body2" color="error.main">
                    • Erreurs : {result.erreurs}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {result ? 'Fermer' : 'Annuler'}
        </Button>
        {!result && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
          >
            {loading ? 'Importation...' : 'Importer les Médicaments'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportMedicamentsDialog;
