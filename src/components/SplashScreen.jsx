import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% {
    transform: scale(0.96);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.03);
    opacity: 1;
  }
  100% {
    transform: scale(0.96);
    opacity: 0.9;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export default function SplashScreen({ message = 'Loading workspace environment...' }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        bgcolor: '#0f291e', // Rich Forest Deep Green
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      {/* Background Soft Glow Orbs */}
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />

      {/* Center Logo Container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: `${fadeIn} 0.6s ease-out`,
          zIndex: 1
        }}
      >
        <Box
          sx={{
            p: 1.8,
            bgcolor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
            animation: `${pulse} 2.5s infinite ease-in-out`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Shazu Soft Official Logo"
            sx={{
              width: 72,
              height: 72,
              objectFit: 'contain'
            }}
          />
        </Box>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '0.04em',
            fontSize: '1.4rem',
            textAlign: 'center',
            lineHeight: 1.2
          }}
        >
          SHAZU SOFT
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.75)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            fontSize: 11,
            mt: 0.5,
            textAlign: 'center'
          }}
        >
          HRMS PORTAL 2026
        </Typography>

        {/* Elegant Progress Bar */}
        <Box sx={{ width: 180, mt: 3 }}>
          <LinearProgress
            sx={{
              height: 4,
              borderRadius: '2px',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#34d399',
                borderRadius: '2px'
              }
            }}
          />
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: 11.5,
            fontWeight: 500,
            mt: 1.5,
            letterSpacing: '0.02em'
          }}
        >
          {message}
        </Typography>
      </Box>
    </Box>
  );
}
