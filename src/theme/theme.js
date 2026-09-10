import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const baseTheme = (mode = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#10b981' : '#133829', // Emerald accent in dark; Deep Forest Green in light
        light: isDark ? '#34d399' : '#1c4b37',
        dark: isDark ? '#059669' : '#0b2319',
        contrastText: '#ffffff'
      },
      secondary: {
        main: isDark ? '#38bdf8' : '#0284c7', // Sky Blue
        light: '#38bdf8',
        dark: '#0369a1',
        contrastText: '#ffffff'
      },
      success: {
        main: isDark ? '#10b981' : '#059669', // Emerald Green
        light: '#34d399',
        dark: '#047857'
      },
      warning: {
        main: isDark ? '#fbbf24' : '#d97706', // Warm Amber
        light: '#fbbf24',
        dark: '#b45309'
      },
      error: {
        main: isDark ? '#f87171' : '#dc2626',
        light: '#fca5a5',
        dark: '#b91c1c'
      },
      background: {
        default: isDark ? '#0b1320' : '#f7f9fa', // Deep navy canvas or crisp off-white
        paper: isDark ? '#152238' : '#ffffff'
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b'
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.09)' : '#e5e7eb'
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.025em',
        color: isDark ? '#f8fafc' : '#0f172a',
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        lineHeight: 1.2
      },
      h2: {
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: isDark ? '#f8fafc' : '#0f172a',
        fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
        lineHeight: 1.25
      },
      h3: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: isDark ? '#f8fafc' : '#0f172a',
        fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
        lineHeight: 1.3
      },
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.015em',
        color: isDark ? '#f8fafc' : '#0f172a',
        fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)',
        lineHeight: 1.35
      },
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: isDark ? '#f8fafc' : '#0f172a',
        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
        lineHeight: 1.4
      },
      h6: {
        fontWeight: 700,
        color: isDark ? '#f8fafc' : '#0f172a',
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
            backgroundColor: isDark ? '#10b981' : '#133829',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: isDark ? '#059669' : '#0b2319'
            }
          },
          outlined: {
            borderRadius: '8px',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e5e7eb',
            color: isDark ? '#f8fafc' : 'inherit',
            '&:hover': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#cbd5e1',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc'
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e5e7eb',
            boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.03)',
            backgroundColor: isDark ? '#152238' : '#ffffff',
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
            borderRadius: '10px',
            backgroundColor: isDark ? '#152238' : '#ffffff',
            backgroundImage: 'none'
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
            backgroundColor: isDark ? '#152238' : '#ffffff',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
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
            fontSize: '0.875rem',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e2e8f0'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#34d399' : '#133829'
            }
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
            borderRadius: '10px',
            backgroundColor: isDark ? '#152238' : '#ffffff',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #f1f5f9'
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#0b1320' : '#f8fafc',
            '& .MuiTableCell-head': {
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
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
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
            color: isDark ? '#f1f5f9' : 'inherit',
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
            backgroundColor: isDark ? '#0b1320' : '#f7f9fa',
            color: isDark ? '#f8fafc' : '#0f172a',
            touchAction: 'pan-x pan-y',
            WebkitTextSizeAdjust: '100%',
            overscrollBehaviorY: 'auto',
            WebkitTapHighlightColor: 'transparent'
          },
          'button, a, input, select, textarea, [role="button"]': {
            touchAction: 'manipulation'
          },
          ...(isDark ? {
            // Global dark mode enforcement for papers, cards, forms, and tables across all pages
            '.MuiPaper-root': {
              backgroundColor: '#152238 !important',
              color: '#f8fafc !important',
              borderColor: 'rgba(255, 255, 255, 0.09) !important'
            },
            '.MuiCard-root': {
              backgroundColor: '#152238 !important',
              color: '#f8fafc !important',
              borderColor: 'rgba(255, 255, 255, 0.09) !important'
            },
            // Form inputs & controls
            '.MuiInputBase-root': {
              color: '#f8fafc !important',
              backgroundColor: 'rgba(0, 0, 0, 0.25) !important'
            },
            '.MuiInputBase-input': {
              color: '#f8fafc !important'
            },
            '.MuiInputBase-input::placeholder': {
              color: 'rgba(255, 255, 255, 0.45) !important',
              opacity: 1
            },
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.18) !important'
            },
            '.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#34d399 !important'
            },
            '.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#34d399 !important'
            },
            '.MuiInputLabel-root': {
              color: '#94a3b8 !important'
            },
            '.MuiInputLabel-root.Mui-focused': {
              color: '#34d399 !important'
            },
            '.MuiSelect-select': {
              color: '#f8fafc !important'
            },
            '.MuiSelect-icon': {
              color: '#94a3b8 !important'
            },
            // Webkit date & month native calendar icons
            'input[type="date"]::-webkit-calendar-picker-indicator, input[type="month"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator': {
              filter: 'invert(0.85)',
              cursor: 'pointer'
            },
            // Tabs
            '.MuiTabs-root': {
              borderColor: 'rgba(255, 255, 255, 0.09) !important'
            },
            '.MuiTab-root': {
              color: '#94a3b8 !important'
            },
            '.MuiTab-root.Mui-selected': {
              color: '#34d399 !important',
              backgroundColor: 'rgba(16, 185, 129, 0.12) !important'
            },
            '.MuiTabs-indicator': {
              backgroundColor: '#34d399 !important'
            },
            // Tables
            '.MuiTableHead-root': {
              backgroundColor: '#0b1320 !important'
            },
            '.MuiTableCell-head': {
              color: '#94a3b8 !important',
              borderColor: 'rgba(255, 255, 255, 0.09) !important',
              backgroundColor: '#0b1320 !important'
            },
            '.MuiTableCell-body': {
              color: '#f1f5f9 !important',
              borderColor: 'rgba(255, 255, 255, 0.08) !important'
            },
            '.MuiTableRow-root:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.03) !important'
            },
            // Dividers
            '.MuiDivider-root': {
              borderColor: 'rgba(255, 255, 255, 0.09) !important'
            },
            // Dialogs & Modals
            '.MuiDialog-paper': {
              backgroundColor: '#152238 !important',
              color: '#f8fafc !important',
              borderColor: 'rgba(255, 255, 255, 0.1) !important'
            },
            '.MuiDialogTitle-root': {
              color: '#f8fafc !important'
            },
            '.MuiDialogContent-root': {
              backgroundColor: '#152238 !important',
              color: '#f1f5f9 !important',
              borderColor: 'rgba(255, 255, 255, 0.09) !important'
            },
            '.MuiDialogActions-root': {
              backgroundColor: '#152238 !important',
              borderColor: 'rgba(255, 255, 255, 0.09) !important'
            },
            // Menus & Popovers
            '.MuiMenu-paper, .MuiPopover-paper': {
              backgroundColor: '#152238 !important',
              color: '#f8fafc !important',
              borderColor: 'rgba(255, 255, 255, 0.1) !important'
            },
            '.MuiMenuItem-root': {
              color: '#f1f5f9 !important'
            },
            '.MuiMenuItem-root:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.06) !important'
            },
            // Accordions
            '.MuiAccordion-root': {
              backgroundColor: '#152238 !important',
              color: '#f8fafc !important',
              borderColor: 'rgba(255, 255, 255, 0.09) !important'
            },
            '.MuiAccordionSummary-root': {
              color: '#f8fafc !important'
            },
            // Lists
            '.MuiListItemText-primary': {
              color: '#f8fafc !important'
            },
            '.MuiListItemText-secondary': {
              color: '#94a3b8 !important'
            }
          } : {})
        }
      }
    }
  });
};

export const getTheme = (mode = 'light') => responsiveFontSizes(baseTheme(mode));
