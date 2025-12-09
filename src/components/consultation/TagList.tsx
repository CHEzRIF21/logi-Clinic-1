import React, { useState } from 'react';
import {
  Box,
  Chip,
  TextField,
  Autocomplete,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Close,
  Edit,
} from '@mui/icons-material';

export interface Tag {
  id?: string;
  label: string;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

interface TagListProps {
  tags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  suggestions?: Tag[];
  label?: string;
  placeholder?: string;
  allowCreate?: boolean;
  maxTags?: number;
  editable?: boolean;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export const TagList: React.FC<TagListProps> = ({
  tags,
  onTagsChange,
  suggestions = [],
  label = 'Tags',
  placeholder = 'Ajouter un tag...',
  allowCreate = true,
  maxTags,
  editable = true,
  color = 'primary',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const handleAddTag = (newTag: Tag | string) => {
    if (maxTags && tags.length >= maxTags) {
      return;
    }

    const tagToAdd: Tag =
      typeof newTag === 'string'
        ? { label: newTag, color }
        : { ...newTag, color: newTag.color || color };

    // Vérifier les doublons
    if (tags.some((t) => t.label.toLowerCase() === tagToAdd.label.toLowerCase())) {
      return;
    }

    onTagsChange([...tags, tagToAdd]);
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: Tag) => {
    onTagsChange(tags.filter((t) => t.id !== tagToRemove.id || t.label !== tagToRemove.label));
  };

  const handleStartEdit = (tag: Tag) => {
    setEditingTagId(tag.id || tag.label);
    setEditingLabel(tag.label);
  };

  const handleSaveEdit = () => {
    if (!editingTagId) return;

    const updatedTags = tags.map((tag) =>
      (tag.id === editingTagId || tag.label === editingTagId)
        ? { ...tag, label: editingLabel }
        : tag
    );

    onTagsChange(updatedTags);
    setEditingTagId(null);
    setEditingLabel('');
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditingLabel('');
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>

      {/* Tags existants */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: editable ? 2 : 0 }}>
        {tags.map((tag) => (
          <Chip
            key={tag.id || tag.label}
            label={
              editingTagId === (tag.id || tag.label) ? (
                <TextField
                  size="small"
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  sx={{ width: 100 }}
                />
              ) : (
                tag.label
              )
            }
            onDelete={editable ? () => handleRemoveTag(tag) : undefined}
            deleteIcon={
              editable ? (
                <Close fontSize="small" />
              ) : undefined
            }
            color={tag.color || color}
            variant="filled"
            sx={{
              '& .MuiChip-deleteIcon': {
                color: 'inherit',
              },
            }}
            icon={
              editable && editingTagId !== (tag.id || tag.label) ? (
                <Tooltip title="Modifier">
                  <Edit fontSize="small" />
                </Tooltip>
              ) : undefined
            }
            onClick={
              editable && editingTagId !== (tag.id || tag.label)
                ? () => handleStartEdit(tag)
                : undefined
            }
          />
        ))}
      </Box>

      {/* Champ d'ajout */}
      {editable && (!maxTags || tags.length < maxTags) && (
        <Autocomplete
          freeSolo
          options={suggestions}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
          inputValue={inputValue}
          onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
          onChange={(_, newValue) => {
            if (newValue) {
              handleAddTag(typeof newValue === 'string' ? newValue : newValue);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue.trim()) {
              e.preventDefault();
              handleAddTag(inputValue.trim());
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={placeholder}
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {inputValue.trim() && (
                      <IconButton
                        size="small"
                        onClick={() => handleAddTag(inputValue.trim())}
                        color="primary"
                      >
                        <Add />
                      </IconButton>
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Chip
                label={typeof option === 'string' ? option : option.label}
                size="small"
                color={typeof option === 'string' ? color : option.color || color}
                sx={{ mr: 1 }}
              />
              {typeof option === 'object' && option.label}
            </Box>
          )}
          PaperComponent={({ children, ...other }) => (
            <Paper {...other} sx={{ mt: 1 }}>
              {children}
            </Paper>
          )}
        />
      )}

      {maxTags && tags.length >= maxTags && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Maximum {maxTags} tags atteint
        </Typography>
      )}
    </Box>
  );
};

