import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  CalendarMonth as CalendarIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Logout as LogoutIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import toast, { muiToast } from '../utils/muiToast';
import PWAInstallButton from './PWAInstallButton';

export default function TopNavbar({ onMobileDrawerToggle, activeView, onSelectView, onOpenSearch }) {
  const { user, isAdmin, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleCloseMenu();
    const confirmed = await muiToast.confirm({
      title: 'Sign Out Confirmation',
      message: 'Are you sure you want to end your active workspace session?',
      confirmText: 'Sign Out',
      cancelText: 'Stay Logged In',
      severity: 'warning'
    });
    if (confirmed) {
      toast.success('Signed out successfully.');
      logout();
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        color: '#0f172a',
        zIndex: 1100
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 }, minHeight: 64, height: 64 }}>
        {/* Left: Mobile Menu Toggle & Period Tag */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMobileDrawerToggle}
            sx={{ display: { md: 'none' }, mr: 1 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Period Selector Dropdown Pill */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.6,
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              bgcolor: '#f8fafc',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            <CalendarIcon sx={{ fontSize: 16, color: '#133829' }} />
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
              SS-HRMS 2026
            </Typography>
            <ArrowDownIcon sx={{ fontSize: 15, color: '#64748b' }} />
          </Box>
        </Box>

        {/* Center: Global Search Bar Button (Ctrl+K) */}
        <Box
          onClick={onOpenSearch}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            px: 2,
            py: 0.7,
            width: { xs: 170, sm: 260, md: 380 },
            bgcolor: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: '#ffffff',
              borderColor: '#133829'
            }
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: '#133829' }} />
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: 13, fontWeight: 500, flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Search staff, tasks, reports...
          </Typography>
          <Chip
            label="Ctrl K"
            size="small"
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              height: 20,
              fontSize: 10,
              fontWeight: 800,
              bgcolor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              color: '#475569'
            }}
          />
        </Box>

        {/* Right Side: PWA Download, Role Badge & Logged In User Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Role Indicator Badge */}
          <Box
            onClick={handleOpenMenu}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 0.8,
              px: 1.4,
              py: 0.6,
              borderRadius: '4px',
              bgcolor: isAdmin ? '#f0fdf4' : '#f0f9ff',
              border: isAdmin ? '1px solid #bbf7d0' : '1px solid #bae6fd',
              cursor: 'pointer',
              '&:hover': { opacity: 0.9 }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 12, color: isAdmin ? '#15803d' : '#0369a1' }}>
              {isAdmin ? 'Executive Management' : 'Staff Workspace'}
            </Typography>
            <ArrowDownIcon sx={{ fontSize: 14, color: isAdmin ? '#15803d' : '#0369a1' }} />
          </Box>

          {/* Logged-In User Avatar with Name and Dropdown */}
          <Box
            onClick={handleOpenMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              p: 0.5,
              borderRadius: '4px',
              '&:hover': { bgcolor: '#f8fafc' }
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                borderRadius: '4px',
                bgcolor: '#133829',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                boxShadow: '0 2px 6px rgba(19, 56, 41, 0.25)'
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#0f172a', fontSize: '0.875rem' }}>
                {user?.name || 'Vimal Raj'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: 11, display: 'block' }}>
                {user?.designation || user?.department || 'System Admin'}
              </Typography>
            </Box>
            <ArrowDownIcon sx={{ fontSize: 16, color: '#64748b' }} />
          </Box>

          {/* User Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{
              sx: { mt: 1.5, minWidth: 220, borderRadius: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                {user?.email}
              </Typography>
              <Chip
                label={user?.role?.toUpperCase()}
                size="small"
                color={isAdmin ? 'primary' : 'default'}
                sx={{ height: 18, fontSize: 9, fontWeight: 800, mt: 0.8, borderRadius: '4px' }}
              />
            </Box>
            <MenuItem onClick={handleLogout} sx={{ color: '#dc2626', fontWeight: 700, fontSize: 13, py: 1.2 }}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Sign Out of Workspace
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
