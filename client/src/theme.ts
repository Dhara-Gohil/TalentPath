import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#07080A',
      paper: '#101318',
    },
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#06b6d4',
      light: '#22d3ee',
      dark: '#0891b2',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
    },
    error: {
      main: '#f43f5e',
      light: '#fb7185',
    },
    text: {
      primary: '#F5F7FA',
      secondary: '#969DAA',
      disabled: '#626975',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontWeight: 600, letterSpacing: '-0.02em' },
    h4: { fontWeight: 600, letterSpacing: '-0.015em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { color: '#969DAA' },
    subtitle2: { color: '#626975', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxShadow: 'none !important',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#101318',
          boxShadow: 'none !important',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#101318',
          boxShadow: 'none !important',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          boxShadow: 'none !important',
          transition: 'all 180ms ease-in-out',
          '&:hover': {
            boxShadow: 'none !important',
          },
        },
        containedPrimary: {
          backgroundColor: '#6366f1',
          '&:hover': {
            backgroundColor: '#4f46e5',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.12)',
          color: '#F5F7FA',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.24)',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#0B0D10',
          borderRadius: 8,
          color: '#F5F7FA',
          boxShadow: 'none !important',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.24)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6366f1',
            borderWidth: 1.5,
          },
          '& .MuiOutlinedInput-input, & textarea': {
            outline: 'none !important',
            boxShadow: 'none !important',
            border: 'none !important',
            '&:-webkit-autofill': {
              WebkitBoxShadow: '0 0 0 1000px #0F1219 inset !important',
              WebkitTextFillColor: '#FFFFFF !important',
              caretColor: '#FFFFFF',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.06)',
          padding: '14px 16px',
          color: '#F5F7FA',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#0B0D10',
          '& .MuiTableCell-root': {
            color: '#626975',
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 150ms ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.02) !important',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0B0D10',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none !important',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#101318',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none !important',
          borderRadius: 12,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#151920',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none !important',
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
          boxShadow: 'none !important',
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.12)',
        },
      },
    },
  },
});

export default theme;
