import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const baseTheme = (mode = 'light') =>
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
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.025em',
        color: '#0f172a',
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        lineHeight: 1.2
      },
      h2: {
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: '#0f172a',
        fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
        lineHeight: 1.25
      },
      h3: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: '#0f172a',
        fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
        lineHeight: 1.3
      },
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.015em',
        color: '#0f172a',
        fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)',
        lineHeight: 1.35
      },
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: '#0f172a',
        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
        lineHeight: 1.4
      },
      h6: {
        fontWeight: 700,
        color: '#0f172a',
        fontSize: 'clamp(0.875rem, 1.8vw, 1.05rem)',
        lineHeight: 1.45
      },
      subtitle1: {
        fontWeight: 600,
        fontSize: 'clamp(0.85rem, 1.6vw, 0.95rem)',
        lineHeight: 1.5
      },
      subtitle2: {
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)'
      },
      body1: {
        fontSize: 'clamp(0.825rem, 1.5vw, 0.9375rem)',
        lineHeight: 1.6
      },
      body2: {
        fontSize: 'clamp(0.75rem, 1.4vw, 0.85rem)',
        lineHeight: 1.5
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.01em',
        fontSize: 'clamp(0.75rem, 1.4vw, 0.875rem)'
      },
      caption: {
        fontSize: 'clamp(0.68rem, 1.2vw, 0.75rem)',
        lineHeight: 1.4
      }
    },
    shape: {
      borderRadius: 10 // Modern, professional rounded corners
    },
    components: {
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingLeft: '12px',
            paddingRight: '12px',
            '@media (min-width: 600px)': {
              paddingLeft: '20px',
              paddingRight: '20px'
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.85rem',
            boxShadow: 'none',
            whiteSpace: 'normal',
            '@media (max-width: 600px)': {
              padding: '6px 10px',
              fontSize: '0.78rem'
            },
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
            borderRadius: '8px',
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
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            backgroundImage: 'none',
            overflow: 'hidden'
          }
        }
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: '16px',
            '@media (max-width: 600px)': {
              padding: '12px'
            },
            '&:last-child': {
              paddingBottom: '16px',
              '@media (max-width: 600px)': {
                paddingBottom: '12px'
              }
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '10px'
          },
          rounded: {
            borderRadius: '10px'
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          root: {
            '& .MuiBackdrop-root': {
              backdropFilter: 'blur(2px)'
            }
          },
          paper: {
            borderRadius: '12px',
            margin: '16px',
            '@media (max-width: 600px)': {
              margin: '8px auto !important',
              width: 'calc(100vw - 16px) !important',
              maxWidth: 'calc(100vw - 16px) !important',
              maxHeight: 'calc(100dvh - 16px) !important',
              height: 'auto !important'
            }
          },
          paperScrollPaper: {
            '@media (max-width: 600px)': {
              maxHeight: 'calc(100dvh - 16px) !important',
              display: 'flex',
              flexDirection: 'column'
            }
          },
          paperFullWidth: {
            '@media (max-width: 600px)': {
              width: 'calc(100vw - 16px) !important',
              maxWidth: 'calc(100vw - 16px) !important'
            }
          }
        }
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              padding: '12px 14px'
            }
          }
        }
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              padding: '12px 14px',
              maxHeight: 'calc(100dvh - 115px)'
            }
          },
          dividers: {
            '@media (max-width: 600px)': {
              padding: '12px 14px'
            }
          }
        }
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              padding: '10px 14px'
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.72rem',
            height: '24px'
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontSize: '0.875rem'
          }
        }
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: '10px'
          }
        }
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: '10px'
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
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: '1px solid #e5e7eb',
              padding: '8px 10px',
              '@media (min-width: 600px)': {
                padding: '10px 14px',
                fontSize: '0.75rem'
              }
            }
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: '#f1f5f9',
            padding: '8px 10px',
            fontSize: '0.82rem',
            '@media (min-width: 600px)': {
              padding: '10px 14px',
              fontSize: '0.875rem'
            }
          }
        }
      },
      MuiTabs: {
        defaultProps: {
          variant: 'scrollable',
          scrollButtons: 'auto',
          allowScrollButtonsMobile: true
        },
        styleOverrides: {
          root: {
            minHeight: '44px',
            '& .MuiTabs-scrollButtons': {
              width: 32,
              '&.Mui-disabled': {
                opacity: 0.15
              }
            }
          },
          scroller: {
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none'
            }
          },
          flexContainer: {
            gap: '2px'
          }
        }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: '44px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.84rem',
            whiteSpace: 'nowrap',
            padding: '8px 14px',
            '&.Mui-selected': {
              fontWeight: 700
            }
          }
        }
      },
      MuiCssBaseline: {
        styleOverrides: {
          'html, body, #root': {
            touchAction: 'pan-x pan-y',
            WebkitTextSizeAdjust: '100%',
            overscrollBehaviorY: 'auto',
            WebkitTapHighlightColor: 'transparent'
          },
          'button, a, input, select, textarea, [role="button"]': {
            touchAction: 'manipulation'
          }
        }
      }
    }
  });

export const getTheme = (mode = 'light') => responsiveFontSizes(baseTheme(mode));
