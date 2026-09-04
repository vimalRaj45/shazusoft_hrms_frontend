import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, IconButton, Slide, Paper
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Close as CloseIcon,
  PhoneAndroid as PhoneIcon
} from '@mui/icons-material';

const DISMISSED_KEY = 'pwa_install_dismissed';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // Don't show if user already dismissed
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => setShow(false));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  };

  return (
    <Slide direction="up" in={show} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          borderRadius: '16px 16px 0 0',
          background: 'linear-gradient(135deg, #0f291e 0%, #1a3d2b 100%)',
          color: '#fff',
          p: { xs: 2.5, sm: 3 },
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 48, height: 48, flexShrink: 0,
            borderRadius: '12px',
            bgcolor: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <PhoneIcon sx={{ fontSize: 26, color: '#4ade80' }} />
        </Box>

        {/* Text */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} fontSize="0.95rem" noWrap>
            Install Shazusoft HRMS
          </Typography>
          <Typography fontSize="0.78rem" sx={{ color: 'rgba(255,255,255,0.65)' }} noWrap>
            Add to home screen for quick access
          </Typography>
        </Box>

        {/* Install button */}
        <Button
          size="small"
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleInstall}
          sx={{
            flexShrink: 0,
            bgcolor: '#4ade80',
            color: '#0f291e',
            fontWeight: 700,
            fontSize: '0.8rem',
            textTransform: 'none',
            borderRadius: '8px',
            px: 2,
            '&:hover': { bgcolor: '#22c55e' },
          }}
        >
          Install
        </Button>

        {/* Dismiss */}
        <IconButton
          size="small"
          onClick={handleDismiss}
          sx={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0, ml: -0.5 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Slide>
  );
}
