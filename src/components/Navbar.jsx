import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon,
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, isAdmin, logout, themeMode, toggleThemeMode } = useAuth();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
        color: 'text.primary',
        zIndex: 1100
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}
          >
            <BusinessIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Shazusoft HRMS
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.05em' }}>
              ATTENDANCE & WORKDONE
            </Typography>
          </Box>
        </Box>

        {/* Navigation Actions for Admin vs Employee */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isAdmin && (
            <>
              <Button
                variant={activeTab === 'dashboard' ? 'contained' : 'text'}
                color="primary"
                size="small"
                startIcon={<DashboardIcon />}
                onClick={() => setActiveTab('dashboard')}
              >
                Admin Board
              </Button>
              <Button
                variant={activeTab === 'ai-reports' ? 'contained' : 'text'}
                color="secondary"
                size="small"
                startIcon={<AnalyticsIcon />}
                onClick={() => setActiveTab('ai-reports')}
                sx={{ ml: 0.5 }}
              >
                Reports & Analytics
              </Button>
            </>
          )}

          {/* Role Chip */}
          <Chip
            size="small"
            label={isAdmin ? 'HR / Management' : 'Staff Member'}
            color={isAdmin ? 'primary' : 'secondary'}
            variant="outlined"
            sx={{ fontWeight: 700, borderRadius: 1.5, ml: 1, display: { xs: 'none', sm: 'inline-flex' } }}
          />

          {/* User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: isAdmin ? 'primary.main' : 'secondary.main',
                fontSize: 14,
                fontWeight: 700
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                {user?.department || 'Employee'}
              </Typography>
            </Box>
          </Box>

          {/* Theme Toggle */}
          <Tooltip title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton onClick={toggleThemeMode} size="small" color="inherit">
              {themeMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Logout */}
          <Tooltip title="Sign Out">
            <IconButton onClick={logout} size="small" color="error">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
