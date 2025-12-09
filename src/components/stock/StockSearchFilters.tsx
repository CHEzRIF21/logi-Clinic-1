import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  Collapse,
  Typography,
  Divider,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  DateRange,
  Inventory,
  LocalShipping,
} from '@mui/icons-material';

interface SearchFiltersProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  medicaments: any[];
  lots: any[];
  fournisseurs: string[];
}

interface SearchFilters {
  searchTerm: string;
  medicament: string;
  lot: string;
  fournisseur: string;
  magasin: string;
  typeMouvement: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  seuilMin: number;
  seuilMax: number;
  peremptionProche: boolean;
  stockBas: boolean;
}

const StockSearchFilters: React.FC<SearchFiltersProps> = ({
  onSearch,
  onClear,
  medicaments,
  lots,
  fournisseurs,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    medicament: '',
    lot: '',
    fournisseur: '',
    magasin: '',
    typeMouvement: '',
    dateDebut: '',
    dateFin: '',
    statut: '',
    seuilMin: 0,
    seuilMax: 1000,
    peremptionProche: false,
    stockBas: false,
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleFilterChange = (field: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    const newActiveFilters = Object.entries(filters)
      .filter(([key, value]) => {
        if (key === 'seuilMin' || key === 'seuilMax') return value > 0;
        if (key === 'peremptionProche' || key === 'stockBas') return value === true;
        return value !== '' && value !== null && value !== undefined;
      })
      .map(([key]) => key);
    
    setActiveFilters(newActiveFilters);
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      searchTerm: '',
      medicament: '',
      lot: '',
      fournisseur: '',
      magasin: '',
      typeMouvement: '',
      dateDebut: '',
      dateFin: '',
      statut: '',
      seuilMin: 0,
      seuilMax: 1000,
      peremptionProche: false,
      stockBas: false,
    });
    setActiveFilters([]);
    onClear();
  };

  const removeFilter = (filterKey: string) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
    setActiveFilters(prev => prev.filter(f => f !== filterKey));
  };

  const getFilterLabel = (key: string): string => {
    const labels: Record<string, string> = {
      searchTerm: 'Recherche',
      medicament: 'Médicament',
      lot: 'Lot',
      fournisseur: 'Fournisseur',
      magasin: 'Magasin',
      typeMouvement: 'Type mouvement',
      dateDebut: 'Date début',
      dateFin: 'Date fin',
      statut: 'Statut',
      seuilMin: 'Seuil min',
      seuilMax: 'Seuil max',
      peremptionProche: 'Péremption proche',
      stockBas: 'Stock bas',
    };
    return labels[key] || key;
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Recherche principale */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par nom, code, lot, fournisseur..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          startIcon={<Search />}
        >
          Rechercher
        </Button>
        <Button
          variant="outlined"
          onClick={handleClear}
          startIcon={<Clear />}
        >
          Effacer
        </Button>
        <IconButton
          onClick={() => setExpanded(!expanded)}
          color="primary"
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Filtres actifs */}
      {activeFilters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Filtres actifs:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {activeFilters.map(filterKey => (
              <Chip
                key={filterKey}
                label={`${getFilterLabel(filterKey)}: ${filters[filterKey as keyof SearchFilters]}`}
                onDelete={() => removeFilter(filterKey)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Filtres avancés */}
      <Collapse in={expanded}>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={medicaments}
              getOptionLabel={(option) => `${option.nom} (${option.code})`}
              value={medicaments.find(m => m.id === filters.medicament) || null}
              onChange={(_, value) => handleFilterChange('medicament', value?.id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Médicament"
                  placeholder="Sélectionner un médicament"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={lots}
              getOptionLabel={(option) => option.numeroLot}
              value={lots.find(l => l.id === filters.lot) || null}
              onChange={(_, value) => handleFilterChange('lot', value?.id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Numéro de lot"
                  placeholder="Sélectionner un lot"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={fournisseurs}
              value={filters.fournisseur}
              onChange={(_, value) => handleFilterChange('fournisseur', value || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Fournisseur"
                  placeholder="Sélectionner un fournisseur"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Magasin</InputLabel>
              <Select
                value={filters.magasin}
                onChange={(e) => handleFilterChange('magasin', e.target.value)}
                label="Magasin"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="gros">Magasin Gros</MenuItem>
                <MenuItem value="detail">Magasin Détail</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type de mouvement</InputLabel>
              <Select
                value={filters.typeMouvement}
                onChange={(e) => handleFilterChange('typeMouvement', e.target.value)}
                label="Type de mouvement"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="entree">Entrée</MenuItem>
                <MenuItem value="sortie">Sortie</MenuItem>
                <MenuItem value="transfert">Transfert</MenuItem>
                <MenuItem value="dispensation">Dispensation</MenuItem>
                <MenuItem value="inventaire">Inventaire</MenuItem>
                <MenuItem value="perte">Perte</MenuItem>
                <MenuItem value="retour">Retour</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.statut}
                onChange={(e) => handleFilterChange('statut', e.target.value)}
                label="Statut"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="actif">Actif</MenuItem>
                <MenuItem value="inactif">Inactif</MenuItem>
                <MenuItem value="en_attente">En attente</MenuItem>
                <MenuItem value="valide">Validé</MenuItem>
                <MenuItem value="annule">Annulé</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Date de début"
              type="date"
              value={filters.dateDebut}
              onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Date de fin"
              type="date"
              value={filters.dateFin}
              onChange={(e) => handleFilterChange('dateFin', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Seuil minimum"
              type="number"
              value={filters.seuilMin}
              onChange={(e) => handleFilterChange('seuilMin', parseInt(e.target.value) || 0)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Seuil maximum"
              type="number"
              value={filters.seuilMax}
              onChange={(e) => handleFilterChange('seuilMax', parseInt(e.target.value) || 1000)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant={filters.peremptionProche ? 'contained' : 'outlined'}
                onClick={() => handleFilterChange('peremptionProche', !filters.peremptionProche)}
                startIcon={<DateRange />}
                size="small"
              >
                Péremption proche
              </Button>
              <Button
                variant={filters.stockBas ? 'contained' : 'outlined'}
                onClick={() => handleFilterChange('stockBas', !filters.stockBas)}
                startIcon={<Inventory />}
                size="small"
              >
                Stock bas
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

export default StockSearchFilters;
