import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Slide,
  Box,
  Typography,
  IconButton,
  Avatar
} from '@mui/material';
import {
  WarningAmberRounded as WarningIcon,
  ErrorOutlineRounded as ErrorIcon,
  CheckCircleOutlineRounded as SuccessIcon,
  InfoOutlined as InfoIcon,
  HelpOutlineRounded as QuestionIcon,
  Close as CloseIcon,
  DeleteOutlineRounded as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from './AuthContext';

const AlertConfirmContext = createContext(null);

const BACKEND_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
  : (typeof window !== 'undefined' && window.location.origin === 'http://localhost:3000' ? 'http://localhost:5000' : '');

function resolveAvatarUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BACKEND_BASE}${url.startsWith('/') ? url : '/' + url}`;
}

// Global bridge emitter so functions outside React lifecycle can also trigger Material UI Alerts
let globalNotifyHandler = null;
let globalConfirmHandler = null;

export const muiToast = {
  success: (message, options) => {
    const title = typeof options === 'string' ? options : options?.title;
    const avatar = typeof options === 'object' ? options?.avatar : undefined;
    const autoHideDuration = typeof options === 'object' ? (options?.autoHideDuration || options?.duration) : undefined;
    return globalNotifyHandler?.({ message, title, avatar, autoHideDuration, severity: 'success' });
  },
  error: (message, options) => {
    const title = typeof options === 'string' ? options : options?.title;
    const avatar = typeof options === 'object' ? options?.avatar : undefined;
    const autoHideDuration = typeof options === 'object' ? (options?.autoHideDuration || options?.duration) : undefined;
    return globalNotifyHandler?.({ message, title, avatar, autoHideDuration, severity: 'error' });
  },
  warning: (message, options) => {
    const title = typeof options === 'string' ? options : options?.title;
    const avatar = typeof options === 'object' ? options?.avatar : undefined;
    const autoHideDuration = typeof options === 'object' ? (options?.autoHideDuration || options?.duration) : undefined;
    return globalNotifyHandler?.({ message, title, avatar, autoHideDuration, severity: 'warning' });
  },
  info: (message, options) => {
    const title = typeof options === 'string' ? options : options?.title;
    const avatar = typeof options === 'object' ? options?.avatar : undefined;
    const autoHideDuration = typeof options === 'object' ? (options?.autoHideDuration || options?.duration) : undefined;
    return globalNotifyHandler?.({ message, title, avatar, autoHideDuration, severity: 'info' });
  },
  confirm: (options) => globalConfirmHandler ? globalConfirmHandler(options) : Promise.resolve(false)
};

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

export function AlertConfirmProvider({ children }) {
  const auth = useAuth();
  const user = auth?.user || (() => {
    try {
      const saved = localStorage.getItem('shazusoft_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  // Snackbar Alert State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    title: '',
    avatar: '',
    severity: 'success', // 'success' | 'error' | 'warning' | 'info'
    autoHideDuration: 3500
  });

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    severity: 'warning', // 'warning' | 'error' | 'info' | 'success'
    isDestructive: false
  });

  const confirmPromiseResolveRef = useRef(null);

  // Notify Alert Trigger
  const notify = useCallback(({ message, title = '', avatar = '', severity = 'success', autoHideDuration = 3500 }) => {
    setSnackbar({
      open: true,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      title,
      avatar,
      severity,
      autoHideDuration
    });
  }, []);

  const closeSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Confirm Modal Trigger (returns a Promise<boolean>)
  const confirm = useCallback(({
    title = 'Confirmation Required',
    message = 'Are you sure you want to proceed with this action?',
    confirmText = 'Proceed',
    cancelText = 'Cancel',
    severity = 'warning',
    isDestructive = false
  }) => {
    return new Promise((resolve) => {
      confirmPromiseResolveRef.current = resolve;
      setConfirmDialog({
        open: true,
        title,
        message,
        confirmText,
        cancelText,
        severity,
        isDestructive: isDestructive || severity === 'error'
      });
    });
  }, []);

  const handleConfirmClose = (result) => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
    if (confirmPromiseResolveRef.current) {
      confirmPromiseResolveRef.current(result);
      confirmPromiseResolveRef.current = null;
    }
  };

  // Connect global dispatchers
  globalNotifyHandler = notify;
  globalConfirmHandler = confirm;

  // Render modal icon based on severity
  const renderConfirmIcon = () => {
    if (confirmDialog.isDestructive) {
      return (
        <Box sx={{
          width: 44,
          height: 44,
          borderRadius: '10px',
          bgcolor: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 1.5
        }}>
          <DeleteIcon sx={{ fontSize: 26 }} />
        </Box>
      );
    }
    switch (confirmDialog.severity) {
      case 'error':
        return (
          <Box sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            bgcolor: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1.5
          }}>
            <ErrorIcon sx={{ fontSize: 26 }} />
          </Box>
        );
      case 'info':
        return (
          <Box sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            bgcolor: 'rgba(59, 130, 246, 0.12)',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1.5
          }}>
            <InfoIcon sx={{ fontSize: 26 }} />
          </Box>
        );
      case 'success':
        return (
          <Box sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            bgcolor: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1.5
          }}>
            <SuccessIcon sx={{ fontSize: 26 }} />
          </Box>
        );
      case 'warning':
      default:
        return (
          <Box sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            bgcolor: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1.5
          }}>
            <WarningIcon sx={{ fontSize: 26 }} />
          </Box>
        );
    }
  };

  return (
    <AlertConfirmContext.Provider value={{ notify, confirm, muiToast }}>
      {children}

      {/* Sleek, Compact Toast Notification with Profile Photo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={SlideTransition}
        sx={{
          top: { xs: 12, sm: 18 },
          right: { xs: 12, sm: 18 },
          zIndex: 99999
        }}
      >
        <Box
          sx={{
            minWidth: { xs: 260, sm: 300 },
            maxWidth: { xs: 'calc(100vw - 28px)', sm: 400 },
            borderRadius: '10px',
            px: 1.3,
            py: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(16px)',
            border: '1px solid',
            transition: 'all 0.2s ease',
            ...(snackbar.severity === 'success' && {
              bgcolor: '#0c271b',
              borderColor: 'rgba(52, 211, 153, 0.35)',
              color: '#ffffff'
            }),
            ...(snackbar.severity === 'error' && {
              bgcolor: '#3b0d0c',
              borderColor: 'rgba(248, 113, 113, 0.35)',
              color: '#ffffff'
            }),
            ...(snackbar.severity === 'warning' && {
              bgcolor: '#331804',
              borderColor: 'rgba(251, 191, 36, 0.35)',
              color: '#ffffff'
            }),
            ...(snackbar.severity === 'info' && {
              bgcolor: '#08283d',
              borderColor: 'rgba(56, 189, 248, 0.35)',
              color: '#ffffff'
            })
          }}
        >
          {/* User Profile Avatar with Severity Indicator Pill */}
          <Box sx={{ position: 'relative', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
            <Avatar
              src={resolveAvatarUrl(snackbar.avatar || user?.avatar_url)}
              alt={user?.name || 'User'}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                fontSize: 12,
                fontWeight: 800,
                bgcolor: 'rgba(255, 255, 255, 0.18)',
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.35)'
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor:
                  snackbar.severity === 'success' ? '#10b981' :
                  snackbar.severity === 'error' ? '#ef4444' :
                  snackbar.severity === 'warning' ? '#f59e0b' : '#3b82f6',
                border: '1.5px solid #0f172a',
                boxShadow: '0 0 4px rgba(0,0,0,0.3)'
              }}
            />
          </Box>

          {/* Compact Message Typography */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {snackbar.title && (
              <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', lineHeight: 1.2, color: '#ffffff', mb: 0.2 }}>
                {snackbar.title}
              </Typography>
            )}
            <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3, color: 'rgba(255, 255, 255, 0.95)', wordBreak: 'break-word' }}>
              {snackbar.message}
            </Typography>
          </Box>

          {/* Minimalist Close Action */}
          <IconButton
            size="small"
            onClick={closeSnackbar}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              p: 0.3,
              borderRadius: '6px',
              ml: 0.2,
              '&:hover': { color: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.12)' }
            }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>
      </Snackbar>

      {/* Global Material UI Confirmation Modal */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => handleConfirmClose(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 16px 36px rgba(0,0,0,0.22)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', pb: 1, pt: 2, px: 2 }}>
          {renderConfirmIcon()}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: 'text.primary' }}>
              {confirmDialog.title}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => handleConfirmClose(false)}
            sx={{ color: 'text.secondary', borderRadius: '8px' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.6 }}>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => handleConfirmClose(false)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'text.secondary',
                bgcolor: 'action.hover'
              }
            }}
          >
            {confirmDialog.cancelText}
          </Button>
          <Button
            variant="contained"
            onClick={() => handleConfirmClose(true)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              ...(confirmDialog.isDestructive ? {
                bgcolor: '#ef4444',
                color: '#ffffff',
                '&:hover': { bgcolor: '#dc2626' }
              } : {
                bgcolor: '#133829',
                color: '#ffffff',
                '&:hover': { bgcolor: '#0f291e' }
              })
            }}
            autoFocus
          >
            {confirmDialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </AlertConfirmContext.Provider>
  );
}

export function useAlertConfirm() {
  const context = useContext(AlertConfirmContext);
  if (!context) {
    throw new Error('useAlertConfirm must be used within an AlertConfirmProvider');
  }
  return context;
}

export default AlertConfirmContext;
