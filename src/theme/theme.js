import { createTheme } from '@mui/material/styles';

export const getTheme = (mode = 'light') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#133829', // Deep Forest Green
        light: '#1c4b37',
        dark: '#0b2319',
        contrastText: '#ffffff'
      },
      secondary: {
        main: '#0284c7', // Sky Blue
        light: '#38bdf8',
        dark: '#0369a1',
        contrastText: '#ffffff'
      },
      success: {
        main: '#059669', // Emerald Green
        light: '#34d399',
        dark: '#047857'
      },
      warning: {
        main: '#d97706', // Warm Amber
        light: '#fbbf24',
        dark: '#b45309'
      },
      error: {
        main: '#dc2626',
        light: '#f87171',
        dark: '#b91c1c'
      },
      background: {
        default: '#f7f9fa', // Crisp off-white canvas
        paper: '#ffffff'
      },
      text: {
        primary: '#0f172a',
        secondary: '#64748b'
      },
      divider: '#e5e7eb'
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.025em', color: '#0f172a' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' },
      h4: { fontWeight: 700, letterSpacing: '-0.015em', color: '#0f172a' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em', color: '#0f172a' },
      h6: { fontWeight: 700, color: '#0f172a' },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' }
    },
    shape: {
      borderRadius: 4 // Strict 4px border radius for professional crisp look
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '4px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 1px 3px rgba(19, 56, 41, 0.15)'
            }
          },
          containedPrimary: {
            backgroundColor: '#133829',
            '&:hover': {
              backgroundColor: '#0b2319'
            }
          },
          outlined: {
            borderRadius: '4px',
            borderColor: '#e5e7eb',
            '&:hover': {
              borderColor: '#cbd5e1',
              backgroundColor: '#f8fafc'
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            backgroundImage: 'none',
            overflow: 'hidden'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '4px'
          },
          rounded: {
            borderRadius: '4px'
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '4px'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '4px',
            fontWeight: 700
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '4px'
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: '#f8fafc',
            '& .MuiTableCell-head': {
              color: '#64748b',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: '1px solid #e5e7eb'
            }
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: '#f1f5f9',
            padding: '12px 16px'
          }
        }
      }
    }
  });
