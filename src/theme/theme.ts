import { createTheme } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#E4570E', dark: '#B84309', light: '#FF8A3D', contrastText: '#ffffff' },
    secondary: { main: '#0F6E6B', dark: '#0B4F4D', light: '#1AA39C', contrastText: '#ffffff' },
    success: { main: '#0F9F6E', dark: '#047857', light: '#34D399' },
    warning: { main: '#D97706', dark: '#B45309', light: '#FBBF24' },
    error: { main: '#E11D48', dark: '#BE123C', light: '#FB7185' },
    info: { main: '#0284C7', dark: '#0369A1', light: '#38BDF8' },
    background: { default: '#FFFFFF', paper: '#FFFFFF' },
    text: { primary: '#1A2633', secondary: '#5E7082' },
    divider: '#E6EEF2',
  },
  typography: {
    fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
    h4: { fontWeight: 800, letterSpacing: -0.6 },
    h5: { fontWeight: 800, letterSpacing: -0.4 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FFFFFF',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: 'none' },
        contained: {
          boxShadow: 'none',
          '&.MuiButton-containedPrimary': {
            backgroundImage: 'linear-gradient(180deg, #F26A24 0%, #E4570E 100%)',
            '&:hover': {
              backgroundImage: 'linear-gradient(180deg, #E4570E 0%, #C2410C 100%)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorInherit: {
          backgroundColor: '#FFFFFF',
          backdropFilter: 'blur(14px)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: '#fff' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 650 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: '#E1F8FB', borderRadius: 99 },
        bar: { backgroundColor: '#5BC4EB', borderRadius: 99 },
      },
    },
  },
})

export const cardRadius = '16px'

export const panelSx: SxProps<Theme> = {
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 8px 24px rgba(26, 38, 51, 0.05)',
  borderRadius: cardRadius,
  bgcolor: 'background.paper',
}
