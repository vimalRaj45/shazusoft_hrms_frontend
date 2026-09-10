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
  Chip,
  Tooltip,
  Badge,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Notifications as NotificationsIcon,
  HelpOutline as HelpOutlineIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationCenterPopover from './NotificationCenterPopover';
import toast, { muiToast } from '../utils/muiToast';


export default function TopNavbar({
  onMobileDrawerToggle,
  activeView,
  onSelectView,
  onOpenSearch,
  isSidebarCollapsed = false,
  onToggleSidebar
}) {
  const { user, isAdmin, logout } = useAuth();
  const { unreadCount, isPushSubscribed } = useNotifications();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = React.useState(null);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenNotifMenu = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleCloseNotifMenu = () => {
    setNotifAnchorEl(null);
  };


  const handleNavigateProfile = () => {
    handleCloseMenu();
    if (onSelectView) {
      onSelectView('profile');
    }
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
      elevation={0}
      sx={{
        top: 0,
        position: 'fixed',
        left: { xs: 0, md: isSidebarCollapsed ? '72px' : '260px' },
        width: { xs: '100%', md: isSidebarCollapsed ? 'calc(100% - 72px)' : 'calc(100% - 260px)' },
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        color: '#0f172a',
        zIndex: 1100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, sm: 2.5, md: 3 }, minHeight: 64, height: 64 }}>
        {/* Left: Sidebar Toggle Button (Desktop + Mobile) & Period Tag */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, md: 1 } }}>
          {/* Mobile Drawer Button */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMobileDrawerToggle}
            sx={{ display: { md: 'none' }, p: 1, mr: 0 }}
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </IconButton>

          {/* Mobile Brand Logo Only (Clickable to Dashboard) */}
          <Box
            onClick={() => {
              if (onSelectView) onSelectView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              cursor: 'pointer',
              p: 0.5,
              borderRadius: '10px',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: '#f1f5f9' },
              '&:active': { transform: 'scale(0.95)' }
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Logo"
              sx={{
                width: 26,
                height: 26,
                objectFit: 'contain',
                borderRadius: '50%',
                flexShrink: 0
              }}
            />
          </Box>

          {/* Desktop Sidebar Collapse / Expand Toggle Button */}
          <Tooltip
            title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            placement="bottom"
            arrow
          >
            <IconButton
              onClick={onToggleSidebar}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                color: '#475569',
                borderRadius: '8px',
                p: 0.8,
                '&:hover': { bgcolor: '#f1f5f9', color: '#133829' }
              }}
            >
              {isSidebarCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
            </IconButton>
          </Tooltip>

          {/* Live Date & Time Display Badge */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              gap: 1.2,
              px: 1.5,
              py: 0.6,
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              bgcolor: '#f8fafc'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <CalendarIcon sx={{ fontSize: 15, color: '#133829' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12.5, color: '#0f172a' }}>
                {format(currentTime, 'EEE, dd MMM yyyy')}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 800 }}>|</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimeIcon sx={{ fontSize: 14, color: '#059669' }} />
              <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 12.5, color: '#059669', fontFamily: 'monospace' }}>
                {format(currentTime, 'hh:mm:ss a')}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex', lg: 'none' },
              alignItems: 'center',
              gap: 0.8,
              px: 1.2,
              py: 0.6,
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              bgcolor: '#f8fafc'
            }}
          >
            <CalendarIcon sx={{ fontSize: 15, color: '#133829' }} />
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>
              {format(currentTime, 'dd MMM')} • {format(currentTime, 'hh:mm a')}
            </Typography>
          </Box>
          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              alignItems: 'center',
              gap: 0.4,
              px: 0.6,
              py: 0.25,
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              bgcolor: '#f8fafc',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <TimeIcon sx={{ fontSize: 11, color: '#059669', flexShrink: 0 }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                fontSize: 10,
                color: '#059669',
                fontFamily: 'monospace',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                whiteSpace: 'nowrap'
              }}
            >
              {format(currentTime, 'hh:mm a')}
            </Typography>
          </Box>
        </Box>

        {/* Center: Global Search Bar Button (Ctrl+K) */}
        <Box
          onClick={onOpenSearch}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1.2 },
            px: { xs: 0.8, sm: 2 },
            py: { xs: 0.4, sm: 0.6 },
            flex: { xs: '1 1 auto', sm: '0 0 auto' },
            minWidth: 0,
            maxWidth: { xs: 110, sm: 220, md: 360, lg: 420 },
            bgcolor: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: '#ffffff',
              borderColor: '#133829'
            }
          }}
        >
          <SearchIcon sx={{ fontSize: 16, color: '#133829', flexShrink: 0 }} />
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: 11, sm: 13 }, fontWeight: 500, flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Search...
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
              borderRadius: '6px',
              color: '#475569'
            }}
          />
        </Box>

        {/* Right Side: Push Notification Bell + User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>

          {/* Quick Refresh Page Button (Hidden on tiny mobile to preserve profile icon space) */}
          <Tooltip title="Refresh Application Data (F5 / Reload)" placement="bottom" arrow>
            <IconButton
              onClick={() => window.location.reload()}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                color: '#64748b',
                borderRadius: '8px',
                p: 0.9,
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#f1f5f9', color: '#133829' }
              }}
            >
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          {/* Notification Center Bell Button */}
          <Tooltip title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`} placement="bottom" arrow>
            <IconButton
              id="notifications-bell-btn"
              onClick={handleOpenNotifMenu}
              sx={{
                color: unreadCount > 0 ? '#4F46E5' : '#64748b',
                borderRadius: '8px',
                p: { xs: 0.6, sm: 0.9 },
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#f1f5f9', color: '#4F46E5' }
              }}
            >
              <Badge
                badgeContent={unreadCount}
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    minWidth: 18,
                    height: 18,
                    borderRadius: '9px',
                    px: 0.5,
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    boxShadow: '0 0 0 2px #FFFFFF'
                  }
                }}
              >
                {unreadCount > 0 ? (
                  <NotificationsActiveIcon sx={{ fontSize: 22, color: '#4F46E5' }} />
                ) : (
                  <NotificationsIcon sx={{ fontSize: 22 }} />
                )}
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Real-time In-App Notification Center Popover */}
          <NotificationCenterPopover
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleCloseNotifMenu}
            onNavigateTab={(tab) => {
              if (onSelectView) onSelectView(tab);
            }}
          />

          {/* User Profile Avatar & Menu Toggle */}
          <Box
            onClick={handleOpenMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, sm: 1.2 },
              cursor: 'pointer',
              p: { xs: 0.3, sm: 0.6 },
              borderRadius: '50px',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            <Avatar
              src={user?.avatar_url
                ? user.avatar_url.startsWith('http')
                  ? user.avatar_url
                  : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.avatar_url}`
                : ''}
              alt={user?.name || 'User Profile'}
              sx={{
                width: { xs: 34, sm: 38 },
                height: { xs: 34, sm: 38 },
                borderRadius: '50%',
                bgcolor: '#0f172a',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                border: '2px solid #e2e8f0',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                flexShrink: 0
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
            <ArrowDownIcon sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 16, color: '#64748b' }} />
          </Box>

          {/* User Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{
              sx: { mt: 1.5, minWidth: 240, borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Avatar
                  src={user?.avatar_url
                    ? user.avatar_url.startsWith('http')
                      ? user.avatar_url
                      : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.avatar_url}`
                    : ''}
                  sx={{ width: 42, height: 42, borderRadius: '50%', bgcolor: '#0f172a', color: '#fff', fontWeight: 800 }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: 11 }}>
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={user?.role?.toUpperCase()}
                size="small"
                color={isAdmin ? 'primary' : 'default'}
                sx={{ height: 20, fontSize: 10, fontWeight: 800, borderRadius: '6px' }}
              />
            </Box>

            <MenuItem onClick={handleNavigateProfile} sx={{ fontWeight: 700, fontSize: 13, py: 1.2, color: '#0f172a' }}>
              <PersonIcon fontSize="small" sx={{ mr: 1.2, color: 'primary.main' }} />
              My Profile & Documents
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleCloseMenu();
                if (onSelectView) onSelectView('system-guide');
              }}
              sx={{ fontWeight: 700, fontSize: 13, py: 1.2, color: '#0f172a' }}
            >
              <HelpOutlineIcon fontSize="small" sx={{ mr: 1.2, color: 'primary.main' }} />
              System Guide & Features
            </MenuItem>

            <MenuItem onClick={handleLogout} sx={{ color: '#dc2626', fontWeight: 700, fontSize: 13, py: 1.2 }}>
              <LogoutIcon fontSize="small" sx={{ mr: 1.2 }} />
              Sign Out of Workspace
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
