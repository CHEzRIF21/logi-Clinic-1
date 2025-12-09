import React from 'react';
import { ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import { CalendarToday, DateRange, Today } from '@mui/icons-material';

export type TimeRange = 'day' | 'week' | 'month';

interface TimeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  variant?: 'standard' | 'outlined';
}

export const TimeFilter: React.FC<TimeFilterProps> = ({
  value,
  onChange,
  variant = 'standard',
}) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: TimeRange | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <Box>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label="filtre temporel"
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            px: 2,
            py: 0.75,
            border: variant === 'outlined' ? `1px solid` : 'none',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
          },
        }}
      >
        <ToggleButton value="day" aria-label="jour">
          <Today sx={{ mr: 1, fontSize: 18 }} />
          Aujourd'hui
        </ToggleButton>
        <ToggleButton value="week" aria-label="semaine">
          <DateRange sx={{ mr: 1, fontSize: 18 }} />
          Semaine
        </ToggleButton>
        <ToggleButton value="month" aria-label="mois">
          <CalendarToday sx={{ mr: 1, fontSize: 18 }} />
          Mois
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

