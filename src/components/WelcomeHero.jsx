import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip
} from '@mui/material';
import {
  ArrowForward as ArrowRightIcon
} from '@mui/icons-material';

export default function WelcomeHero({ user, onActionClick, actionLabel = 'Open Workspace →' }) {
  return (
    <Card
      sx={{
        mb: 3.5,
        bgcolor: '#133829', // Deep Forest Green
        color: '#ffffff',
        borderRadius: '4px', // Crisp 4px corners
        border: 'none',
        boxShadow: '0 2px 10px rgba(19, 56, 41, 0.12)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ maxWidth: 650 }}>
          {/* Badge Pills */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
            <Chip
              label={user?.role === 'admin' ? 'MANAGEMENT' : 'STAFF / AUTHOR'}
              size="small"
              sx={{
                bgcolor: '#244e3d',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 10,
                height: 22,
                borderRadius: '4px'
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
                borderRadius: '4px'
              }}
            />
          </Box>

          {/* Heading */}
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', mb: 0.8 }}>
            Welcome back, {user?.name || 'Alex Rivera'}
          </Typography>

          {/* Subtitle */}
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Managing operations and daily task delivery for Shazu Soft Technologies & Operations 2026.
          </Typography>
        </Box>

        {/* Right-aligned Action Button with 4px border radius */}
        <Button
          variant="contained"
          onClick={onActionClick}
          endIcon={<ArrowRightIcon />}
          sx={{
            bgcolor: '#ffffff',
            color: '#133829',
            fontWeight: 800,
            fontSize: '0.875rem',
            px: 2.5,
            py: 1,
            borderRadius: '4px',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#f1f5f9',
              color: '#0b2319'
            }
          }}
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
