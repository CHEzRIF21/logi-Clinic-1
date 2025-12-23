import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import {
  Lock,
  LockOpen,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning,
  Business,
  VpnKey,
} from '@mui/icons-material';
import { supabase } from '../../services/supabase';

interface ConvertClinicCodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newCode: string) => void;
  currentCode: string;
  clinicName: string;
  userEmail: string;
}

const ConvertClinicCodeDialog: React.FC<ConvertClinicCodeDialogProps> = ({
  open,
  onClose,
  onSuccess,
  currentCode,
  clinicName,
  userEmail,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const steps = [
    'Définir le code permanent',
    'Nouveau mot de passe (optionnel)',
    'Confirmation',
  ];

  const validateCode = (code: string): { valid: boolean; message: string } => {
    if (code.length < 4) {
      return { valid: false, message: 'Le code doit contenir au moins 4 caractères' };
    }
    if (code.length > 50) {
      return { valid: false, message: 'Le code ne peut pas dépasser 50 caractères' };
    }
    if (!/^[A-Z0-9-]+$/.test(code.toUpperCase())) {
      return { valid: false, message: 'Le code ne peut contenir que des lettres, chiffres et tirets' };
    }
    if (code.toUpperCase() === currentCode.toUpperCase()) {
      return { valid: false, message: 'Le nouveau code doit être différent du code temporaire' };
    }
    return { valid: true, message: '' };
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password && password.length < 8) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
    }
    if (password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre' };
    }
    return { valid: true, message: '' };
  };

  const handleNext = () => {
    setError('');

    if (activeStep === 0) {
      const codeValidation = validateCode(newCode);
      if (!codeValidation.valid) {
        setError(codeValidation.message);
        return;
      }
      if (newCode.toUpperCase() !== confirmCode.toUpperCase()) {
        setError('Les codes ne correspondent pas');
        return;
      }
    }

    if (activeStep === 1) {
      if (newPassword) {
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
          setError(passwordValidation.message);
          return;
        }
        if (newPassword !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          return;
        }
      }
    }

    if (activeStep === steps.length - 1) {
      handleSubmit();
      return;
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Appeler l'API de conversion
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/convert-clinic-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            currentCode: currentCode,
            newPermanentCode: newCode.toUpperCase(),
            newPassword: newPassword || undefined,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la conversion');
      }

      setSuccess(true);
      
      // Attendre un peu avant de fermer
      setTimeout(() => {
        onSuccess(newCode.toUpperCase());
      }, 2000);
    } catch (err: any) {
      console.error('Erreur de conversion:', err);
      setError(err.message || 'Erreur lors de la conversion du code');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Vous utilisez actuellement un <strong>code temporaire</strong>. 
                Veuillez définir un code clinique permanent qui sera utilisé pour toutes les futures connexions.
              </Typography>
            </Alert>

            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                mb: 3, 
                bgcolor: 'grey.100',
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Business fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Clinique: <strong>{clinicName}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VpnKey fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Code temporaire actuel:
                </Typography>
                <Chip 
                  label={currentCode} 
                  size="small" 
                  color="warning"
                  icon={<Warning fontSize="small" />}
                />
              </Box>
            </Paper>

            <TextField
              fullWidth
              label="Nouveau code clinique permanent"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="Ex: CLINIQUE-CAMPUS"
              helperText="Lettres majuscules, chiffres et tirets uniquement (4-50 caractères)"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirmer le nouveau code"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
              placeholder="Répétez le nouveau code"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOpen color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Optionnel:</strong> Vous pouvez définir un nouveau mot de passe plus sécurisé. 
                Si vous laissez ces champs vides, votre mot de passe actuel sera conservé.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Nouveau mot de passe (optionnel)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Minimum 8 caractères, avec majuscule, minuscule et chiffre"
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Confirmer le nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!newPassword}
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            {success ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Code clinique mis à jour avec succès !
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Votre nouveau code clinique est: <strong>{newCode.toUpperCase()}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Utilisez ce code pour vos prochaines connexions.
                </Typography>
              </Box>
            ) : (
              <>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Veuillez vérifier les informations avant de confirmer la conversion.
                  </Typography>
                </Alert>

                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Récapitulatif des modifications:
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Clinique:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {clinicName}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Code temporaire (ancien):
                      </Typography>
                      <Chip 
                        label={currentCode} 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Nouveau code permanent:
                      </Typography>
                      <Chip 
                        label={newCode.toUpperCase()} 
                        size="small" 
                        color="success"
                        icon={<CheckCircle fontSize="small" />}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Mot de passe:
                      </Typography>
                      <Typography variant="body2">
                        {newPassword ? 'Sera mis à jour' : 'Inchangé'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Alert severity="warning" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Attention:</strong> Après confirmation, le code temporaire <strong>{currentCode}</strong> sera 
                    définitivement invalidé. Notez bien votre nouveau code: <strong>{newCode.toUpperCase()}</strong>
                  </Typography>
                </Alert>
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={success ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!success}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VpnKey color="primary" />
          <Typography variant="h6">
            Définir le code clinique permanent
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Bienvenue {userEmail} ! C'est votre première connexion.
        </Typography>
      </DialogTitle>

      <DialogContent>
        {!success && (
          <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={onClose}
            disabled={isLoading}
          >
            Plus tard
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button
              onClick={handleBack}
              disabled={isLoading}
            >
              Retour
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
          >
            {activeStep === steps.length - 1 ? 'Confirmer' : 'Suivant'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ConvertClinicCodeDialog;

