import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
import { Send, Lock } from '@mui/icons-material';
import { CreateRecoveryRequestDto, RequestedDataType } from '../../types/accountRecovery';
import { SECURITY_QUESTIONS, getRandomQuestions, SecurityQuestionOption } from '../../data/securityQuestions';

interface AccountRecoveryFormProps {
  onSubmit: (data: CreateRecoveryRequestDto) => Promise<void>;
  onCancel?: () => void;
}

const AccountRecoveryForm: React.FC<AccountRecoveryFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateRecoveryRequestDto>({
    clinicCode: '',
    email: '',
    nom: '',
    prenom: '',
    telephone: '',
    securityQuestions: [],
    requestedData: [],
  });
  const [selectedQuestions, setSelectedQuestions] = useState<SecurityQuestionOption[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Générer 3 questions aléatoires au chargement
  React.useEffect(() => {
    setSelectedQuestions(getRandomQuestions(3));
  }, []);

  const handleQuestionChange = (index: number, questionId: string) => {
    const question = SECURITY_QUESTIONS.find(q => q.id === questionId);
    if (question) {
      const newQuestions = [...selectedQuestions];
      newQuestions[index] = question;
      setSelectedQuestions(newQuestions);
      // Réinitialiser la réponse si la question change
      const newAnswers = { ...answers };
      delete newAnswers[selectedQuestions[index].id];
      setAnswers(newAnswers);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleRequestedDataChange = (dataType: RequestedDataType, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        requestedData: [...formData.requestedData, dataType],
      });
    } else {
      setFormData({
        ...formData,
        requestedData: formData.requestedData.filter(d => d !== dataType),
      });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.nom || !formData.prenom || !formData.telephone) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    if (formData.requestedData.length === 0) {
      setError('Veuillez sélectionner au moins une donnée à récupérer');
      return false;
    }

    if (selectedQuestions.length !== 3) {
      setError('Veuillez sélectionner 3 questions de sécurité');
      return false;
    }

    for (const question of selectedQuestions) {
      if (!answers[question.id] || answers[question.id].trim().length < 3) {
        setError('Veuillez répondre à toutes les questions de sécurité');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const submissionData: CreateRecoveryRequestDto = {
        ...formData,
        securityQuestions: selectedQuestions.map(q => ({
          question: q.question,
          answer: answers[q.id],
        })),
      };

      await onSubmit(submissionData);
      setSuccess(true);
      // Réinitialiser le formulaire après succès
      setTimeout(() => {
        setFormData({
          clinicCode: '',
          email: '',
          nom: '',
          prenom: '',
          telephone: '',
          securityQuestions: [],
          requestedData: [],
        });
        setAnswers({});
        setSelectedQuestions(getRandomQuestions(3));
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission de la demande');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Demande envoyée avec succès !
          </Typography>
          <Typography variant="body2">
            Votre demande de récupération de compte a été envoyée. 
            Un administrateur va vérifier votre identité et vous contactera par email dans les plus brefs délais.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Lock /> Récupération de compte
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Remplissez ce formulaire pour demander la récupération de vos identifiants de connexion. 
        Un administrateur vérifiera votre identité avant de vous envoyer les informations.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Code clinique (si connu)"
            value={formData.clinicCode}
            onChange={(e) => setFormData({ ...formData, clinicCode: e.target.value.toUpperCase() })}
            placeholder="Ex: CLINIC001"
            helperText="Optionnel - Aide à accélérer le traitement"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            helperText="Email utilisé lors de la création du compte"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Prénom"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Téléphone"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            placeholder="+229 0169274680"
            helperText="Pour vérification supplémentaire"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Questions de sécurité (3 questions)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Sélectionnez et répondez à 3 questions pour vérifier votre identité.
      </Typography>

      {selectedQuestions.map((question, index) => (
        <Box key={question.id} sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel>Question {index + 1}</InputLabel>
            <Select
              value={question.id}
              label="Question"
              onChange={(e) => handleQuestionChange(index, e.target.value)}
            >
              {SECURITY_QUESTIONS.map((q) => (
                <MenuItem key={q.id} value={q.id}>
                  {q.question}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            required
            label={`Réponse à la question ${index + 1}`}
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            type="password"
            helperText="Votre réponse sera sécurisée"
          />
        </Box>
      ))}

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Données à récupérer
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.requestedData.includes('username')}
              onChange={(e) => handleRequestedDataChange('username', e.target.checked)}
            />
          }
          label="Nom d'utilisateur"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.requestedData.includes('clinicCode')}
              onChange={(e) => handleRequestedDataChange('clinicCode', e.target.checked)}
            />
          }
          label="Code clinique"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.requestedData.includes('password')}
              onChange={(e) => handleRequestedDataChange('password', e.target.checked)}
            />
          }
          label="Mot de passe (nouveau mot de passe généré)"
        />
      </FormGroup>

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={20} /> : <Send />}
          disabled={isLoading}
        >
          {isLoading ? 'Envoi en cours...' : 'Envoyer la demande'}
        </Button>
      </Box>
    </Box>
  );
};

export default AccountRecoveryForm;

