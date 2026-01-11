import React, { useState, useRef } from 'react';
import {
  Box,
  Avatar,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PhotoCamera,
  Delete,
  CloudUpload,
} from '@mui/icons-material';
import { supabase } from '../../services/supabase';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string;
  onAvatarChange?: (url: string | null) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  currentAvatarUrl,
  onAvatarChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB');
      return;
    }

    // Afficher la prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload vers Supabase Storage
    await uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Supprimer l'ancien avatar s'il existe
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload le nouveau fichier
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Mettre à jour l'URL dans la table users
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      if (onAvatarChange) {
        onAvatarChange(publicUrl);
      }

      setPreview(publicUrl);
    } catch (err: any) {
      console.error('Erreur lors de l\'upload:', err);
      setError(err.message || 'Erreur lors de l\'upload de l\'image');
      setPreview(currentAvatarUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setUploading(true);
      setError(null);

      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setPreview(null);
      if (onAvatarChange) {
        onAvatarChange(null);
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.message || 'Erreur lors de la suppression de l\'image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Photo de profil
      </Typography>
      <Box display="flex" alignItems="center" gap={3} mb={2}>
        <Avatar
          src={preview || undefined}
          sx={{
            width: 120,
            height: 120,
            bgcolor: 'primary.main',
            fontSize: '3rem',
          }}
        >
          {!preview && 'U'}
        </Avatar>
        <Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <Button
            variant="outlined"
            startIcon={<PhotoCamera />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            sx={{ mb: 1, display: 'block' }}
          >
            {uploading ? <CircularProgress size={20} /> : 'Choisir une photo'}
          </Button>
          {preview && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleDelete}
              disabled={uploading}
              size="small"
            >
              Supprimer
            </Button>
          )}
        </Box>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        Formats acceptés: JPG, PNG, GIF. Taille maximale: 5MB
      </Typography>
    </Box>
  );
};

export default AvatarUpload;
