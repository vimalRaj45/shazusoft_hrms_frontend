import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip
} from '@mui/material';
import {
  ArrowForward as ArrowRightIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function WelcomeHero({ user, onActionClick, actionLabel = 'Open Workspace →' }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card
      sx={{
        mb: 3.5,
        bgcolor: '#133829', // Deep Forest Green
        color: '#ffffff',
        borderRadius: '12px',
        border: 'none',
        boxShadow: '0 2px 12px rgba(19, 56, 41, 0.16)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ maxWidth: 650 }}>
          {/* Badge Pills */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2, flexWrap: 'wrap' }}>
            <Chip
              label={user?.role === 'admin' ? 'MANAGEMENT' : 'STAFF / AUTHOR'}
              size="small"
              sx={{
                bgcolor: '#244e3d',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 10,
                height: 22,
                borderRadius: '6px'
              }}
            />
            <Chip
              label="SS-HRMS 2026"
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 10,
                height: 22,
                borderRadius: '6px'
              }}
            />
          </Box>

          {/* Heading */}
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', mb: 0.8, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Welcome back, {user?.name || 'Alex Rivera'}
          </Typography>

          {/* Subtitle */}
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: '0.875rem', lineHeight: 1.5, mb: 1.8 }}>
            Managing operations and daily task delivery for Shazu Soft Technologies & Operations 2026.
          </Typography>

          {/* Live Date & Time Display Badge (Identical to TopNavbar styling) */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.2,
              px: 1.5,
              py: 0.6,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <CalendarIcon sx={{ fontSize: 15, color: (t) => t.palette.mode === 'dark' ? '#34d399' : '#133829' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: 11.5, sm: 12.5 }, color: (t) => t.palette.mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                {format(currentTime, 'EEE, dd MMM yyyy')}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'divider', fontWeight: 800 }}>|</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimeIcon sx={{ fontSize: 14, color: '#059669' }} />
              <Typography variant="body2" sx={{ fontWeight: 800, fontSize: { xs: 11.5, sm: 12.5 }, color: '#059669', fontFamily: 'monospace' }}>
                {format(currentTime, 'hh:mm:ss a')}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right-aligned Action Button */}
        <Button
          variant="contained"
          onClick={onActionClick}
          endIcon={<ArrowRightIcon />}
          sx={{
            bgcolor: (t) => t.palette.mode === 'dark' ? '#34d399' : '#ffffff',
            color: (t) => t.palette.mode === 'dark' ? '#0f291e' : '#133829',
            fontWeight: 800,
            fontSize: '0.875rem',
            px: 2.5,
            py: 1,
            borderRadius: '8px',
            textTransform: 'none',
            alignSelf: { xs: 'flex-start', sm: 'center' },
            '&:hover': {
              bgcolor: (t) => t.palette.mode === 'dark' ? '#10b981' : '#f1f5f9',
              color: (t) => t.palette.mode === 'dark' ? '#0f291e' : '#0b2319'
            }
          }}
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
