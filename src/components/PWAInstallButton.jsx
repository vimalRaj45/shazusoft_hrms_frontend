import React, { useState, useEffect } from 'react';
import { Button, Tooltip, IconButton } from '@mui/material';
import { GetApp as DownloadIcon, CheckCircle as InstalledIcon } from '@mui/icons-material';
import toast from '../utils/muiToast';

export default function PWAInstallButton({ compact = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser's default banner
      e.preventDefault();
      // Stash event so it can be triggered later
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('Shazusoft HRMS installed successfully as a desktop/mobile app!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.info('Shazusoft HRMS is already installed and ready on your device.');
      return;
    }

    if (!deferredPrompt) {
      // If browser doesn't support or prompt is not yet ready, check iOS or show helpful instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        toast.info('To install on iOS: Tap the Share button (square with arrow) and select "Add to Home Screen".');
      } else {
        toast.info('To install: Click the install icon in your browser address bar (top right) or menu -> "Install Shazusoft HRMS".');
      }
      return;
    }

    // Show native prompt
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('Installing Shazusoft HRMS...');
    }
    setDeferredPrompt(null);
  };

  if (compact) {
    return (
      <Tooltip title={isInstalled ? 'App Installed (Standalone)' : 'Download / Install PWA App'}>
        <IconButton
          size="small"
          onClick={handleInstallClick}
          sx={{
            bgcolor: isInstalled ? '#f0fdf4' : '#133829',
            color: isInstalled ? '#166534' : '#ffffff',
            borderRadius: '4px',
            p: 0.8,
            '&:hover': { bgcolor: isInstalled ? '#dcfce7' : '#0f291e' }
          }}
        >
          {isInstalled ? <InstalledIcon sx={{ fontSize: 18 }} /> : <DownloadIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      size="small"
      variant="contained"
      startIcon={isInstalled ? <InstalledIcon /> : <DownloadIcon />}
      onClick={handleInstallClick}
      sx={{
        fontWeight: 700,
        fontSize: '0.8rem',
        borderRadius: '4px',
        bgcolor: isInstalled ? '#f0fdf4' : '#133829',
        color: isInstalled ? '#166534' : '#ffffff',
        border: isInstalled ? '1px solid #bbf7d0' : 'none',
        textTransform: 'none',
        py: 0.6,
        px: 1.5,
        '&:hover': {
          bgcolor: isInstalled ? '#dcfce7' : '#0f291e'
        }
      }}
    >
      {isInstalled ? 'App Installed' : 'Download / Install App'}
    </Button>
  );
}
