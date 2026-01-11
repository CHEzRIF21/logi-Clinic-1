import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
} from '@mui/material';
import { supabase } from '../../services/supabase';

interface LanguageSelectorProps {
  userId: string;
}

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ userId }) => {
  const [language, setLanguage] = useState<string>('fr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('language')
          .eq('id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Erreur lors du chargement de la langue:', fetchError);
          return;
        }

        if (data?.language) {
          setLanguage(data.language);
        } else {
          // Définir la langue par défaut
          setLanguage('fr');
        }
      } catch (err) {
        console.error('Erreur:', err);
      }
    };

    if (userId) {
      loadLanguage();
    }
  }, [userId]);

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier si la colonne language existe, sinon on l'ajoute via une migration
      const { error: updateError } = await supabase
        .from('users')
        .update({ language: newLanguage })
        .eq('id', userId);

      if (updateError) {
        // Si la colonne n'existe pas, on stocke dans localStorage en attendant la migration
        if (updateError.code === '42703') {
          localStorage.setItem('user_language', newLanguage);
          setLanguage(newLanguage);
          // Appliquer la langue immédiatement
          document.documentElement.lang = newLanguage;
          return;
        }
        throw updateError;
      }

      setLanguage(newLanguage);
      localStorage.setItem('user_language', newLanguage);
      // Appliquer la langue immédiatement
      document.documentElement.lang = newLanguage;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de la langue:', err);
      setError(err.message || 'Erreur lors de la mise à jour de la langue');
      // Stocker quand même dans localStorage
      localStorage.setItem('user_language', newLanguage);
      setLanguage(newLanguage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Langue de l'interface
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Langue</InputLabel>
        <Select
          value={language}
          label="Langue"
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={loading}
        >
          {LANGUAGES.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              <Box display="flex" alignItems="center" gap={1}>
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            La langue a été sauvegardée localement. Une migration sera nécessaire pour la persistance en base.
          </Typography>
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        La langue sera appliquée après rechargement de la page
      </Typography>
    </Box>
  );
};

export default LanguageSelector;
