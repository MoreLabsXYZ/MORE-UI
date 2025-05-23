import { Box, Slider, styled, Typography } from '@mui/material';

const StyledSlider = styled(Slider)({
  color: '#F5871F',
  height: 6,
  pb: 2,
  '& .MuiSlider-track': {
    color: '#F5871F',
    border: 'none',
  },
  '& .MuiSlider-thumb': {
    height: 16,
    width: 16,
    backgroundColor: '#fff',
    border: '2px solid #F5871F',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit',
    },
    '&::before': {
      display: 'none',
    },
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 11,
    background: 'unset',
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: '50% 50% 50% 50%',
    backgroundColor: 'none',
    color: '#62677B',
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -50%) rotate(-45deg) scale(0.75)',
    '&::before': { display: 'none' },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translate(50%, -80%) rotate(-45deg) scale(1)',
      backgroundColor: '#F5871F',
      color: '#fff',
    },
    '& > *': {
      transform: 'rotate(45deg)',
    },
  },
});

export interface FilterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  ariaLabel: string;
  onChange: (event: Event, value: number | number[]) => void;
  valueLabelFormat?: (value: number) => string;
}

export const FilterSlider = ({
  label,
  value,
  min,
  max,
  step,
  ariaLabel,
  onChange,
  valueLabelFormat,
}: FilterSliderProps) => (
  <Box
    sx={{
      width: '130px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <Typography variant="description" color="text.secondary" gutterBottom flexWrap="wrap">
      {label}
    </Typography>
    <StyledSlider
      size="small"
      value={value}
      min={min}
      max={max}
      step={step}
      aria-label={ariaLabel}
      valueLabelDisplay="auto"
      onChange={onChange}
      valueLabelFormat={valueLabelFormat}
    />
  </Box>
);
