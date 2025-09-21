import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: '#1976d2', // Blue
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e', // Red accent
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      [createTheme().breakpoints.down('sm')]: {
        fontSize: '2rem',
      },
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      [createTheme().breakpoints.down('sm')]: {
        fontSize: '1.75rem',
      },
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      [createTheme().breakpoints.down('sm')]: {
        fontSize: '1.5rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      [createTheme().breakpoints.down('sm')]: {
        fontSize: '1.25rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      [createTheme().breakpoints.down('sm')]: {
        fontSize: '1.125rem',
      },
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      [createTheme().breakpoints.down('sm')]: {
        fontSize: '0.95rem',
      },
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      [createTheme().breakpoints.down('sm')]: {
        fontSize: '0.95rem',
        lineHeight: 1.6,
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
      [createTheme().breakpoints.down('sm')]: {
        fontSize: '0.85rem',
        lineHeight: 1.5,
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          minHeight: 44, // Touch-friendly minimum height
          [createTheme().breakpoints.down('sm')]: {
            padding: '12px 20px',
            minHeight: 48, // Larger touch targets on mobile
            fontSize: '0.95rem',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          [createTheme().breakpoints.down('sm')]: {
            borderRadius: 8,
            margin: '8px 0',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          [createTheme().breakpoints.down('sm')]: {
            borderRadius: 6,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
          [createTheme().breakpoints.down('sm')]: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 6,
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.9rem',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          [createTheme().breakpoints.down('sm')]: {
            width: '280px', // Optimized width for mobile screens
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          [createTheme().breakpoints.down('sm')]: {
            padding: '0 8px',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          [createTheme().breakpoints.down('sm')]: {
            minHeight: 48, // Touch-friendly list items
            paddingTop: 8,
            paddingBottom: 8,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          [createTheme().breakpoints.down('sm')]: {
            minHeight: 48,
            borderRadius: 6,
          },
        },
      },
    },
  },
});
