import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  Box,
  Typography,
  IconButton
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

const AlertConfirmContext = createContext(null);

// Global bridge emitter so functions outside React lifecycle can also trigger Material UI Alerts
let globalNotifyHandler = null;
let globalConfirmHandler = null;

export const muiToast = {
  success: (message, title) => globalNotifyHandler?.({ message, title, severity: 'success' }),
  error: (message, title) => globalNotifyHandler?.({ message, title, severity: 'error' }),
  warning: (message, title) => globalNotifyHandler?.({ message, title, severity: 'warning' }),
  info: (message, title) => globalNotifyHandler?.({ message, title, severity: 'info' }),
  confirm: (options) => globalConfirmHandler ? globalConfirmHandler(options) : Promise.resolve(window.confirm(options.message || options.title || 'Are you sure?'))
};

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

export function AlertConfirmProvider({ children }) {
  // Snackbar Alert State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    title: '',
    severity: 'success', // 'success' | 'error' | 'warning' | 'info'
    autoHideDuration: 4000
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
  const notify = useCallback(({ message, title = '', severity = 'success', autoHideDuration = 4000 }) => {
    setSnackbar({
      open: true,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      title,
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
          borderRadius: '4px',
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
            borderRadius: '4px',
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
            borderRadius: '4px',
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
            borderRadius: '4px',
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
            borderRadius: '4px',
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

      {/* Global Material UI Snackbar Alert */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={SlideTransition}
        sx={{
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 99999
        }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          sx={{
            minWidth: '320px',
            maxWidth: '460px',
            borderRadius: '4px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontSize: '0.9rem',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            border: '1px solid rgba(255,255,255,0.15)',
            alignItems: 'center',
            ...(snackbar.severity === 'success' && {
              bgcolor: '#133829',
              color: '#ffffff',
              '& .MuiAlert-icon': { color: '#10b981' }
            }),
            ...(snackbar.severity === 'error' && {
              bgcolor: '#7f1d1d',
              color: '#ffffff',
              '& .MuiAlert-icon': { color: '#fca5a5' }
            }),
            ...(snackbar.severity === 'warning' && {
              bgcolor: '#78350f',
              color: '#ffffff',
              '& .MuiAlert-icon': { color: '#fcd34d' }
            }),
            ...(snackbar.severity === 'info' && {
              bgcolor: '#1e3a5f',
              color: '#ffffff',
              '& .MuiAlert-icon': { color: '#93c5fd' }
            })
          }}
        >
          {snackbar.title && (
            <AlertTitle sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.95rem' }}>
              {snackbar.title}
            </AlertTitle>
          )}
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Global Material UI Confirmation Modal */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => handleConfirmClose(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '4px',
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
            sx={{ color: 'text.secondary', borderRadius: '4px' }}
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
              borderRadius: '4px',
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
              borderRadius: '4px',
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
