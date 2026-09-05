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
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import toast, { muiToast } from '../utils/muiToast';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isSubscribed
} from '../utils/pushManager';


export default function TopNavbar({
  onMobileDrawerToggle,
  activeView,
  onSelectView,
  onOpenSearch,
  isSidebarCollapsed = false,
  onToggleSidebar
}) {
  const { user, isAdmin, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = React.useState(null);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [pushSubscribed, setPushSubscribed] = React.useState(false);
  const [pushLoading, setPushLoading] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check current push subscription status on mount
  React.useEffect(() => {
    isSubscribed().then(setPushSubscribed).catch(() => setPushSubscribed(false));
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

  const handleTogglePushNotifications = async () => {
    handleCloseNotifMenu();
    setPushLoading(true);
    try {
      if (pushSubscribed) {
        const result = await unsubscribeFromPushNotifications();
        if (result.success) {
          setPushSubscribed(false);
          toast.success('Push notifications disabled.');
        } else {
          toast.error(result.error || 'Failed to disable push notifications.');
        }
      } else {
        const result = await subscribeToPushNotifications();
        if (result.success) {
          setPushSubscribed(true);
          toast.success('Push notifications enabled! You will now receive alerts.');
        } else {
          toast.error(result.error || 'Failed to enable push notifications.');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred with push notifications.');
    } finally {
      setPushLoading(false);
    }
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Mobile Drawer Button */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMobileDrawerToggle}
            sx={{ display: { md: 'none' }, mr: 0.5 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Mobile Brand Logo & Active Section Tag (Clickable to Dashboard) */}
          <Box
            onClick={() => {
              if (onSelectView) onSelectView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 0.8,
              cursor: 'pointer',
              p: 0.5,
              borderRadius: '4px',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: '#f1f5f9' },
              '&:active': { transform: 'scale(0.97)' }
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Shazu Soft Logo"
              sx={{
                width: 28,
                height: 28,
                objectFit: 'contain',
                borderRadius: '4px',
                flexShrink: 0
              }}
            />
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  color: '#0f172a',
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap'
                }}
              >
                SHAZU SOFT
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#133829',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  fontSize: 9,
                  whiteSpace: 'nowrap',
                  display: 'block'
                }}
              >
                {activeView === 'dashboard' ? 'OVERVIEW' : activeView.toUpperCase().replace('-', ' ')}
              </Typography>
            </Box>
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
                borderRadius: '4px',
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
              borderRadius: '4px',
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
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              bgcolor: '#f8fafc'
            }}
          >
            <CalendarIcon sx={{ fontSize: 15, color: '#133829' }} />
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>
              {format(currentTime, 'dd MMM')} • {format(currentTime, 'hh:mm a')}
            </Typography>
          </Box>
        </Box>

        {/* Center: Global Search Bar Button (Ctrl+K) */}
        <Box
          onClick={onOpenSearch}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            px: { xs: 1.2, sm: 2 },
            py: 0.7,
            width: { xs: 120, sm: 220, md: 360, lg: 420 },
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

        {/* Right Side: Push Notification Bell + User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

          {/* Push Notification Bell Button */}
          <Tooltip title={pushSubscribed ? 'Notification Settings' : 'Enable Push Notifications'} placement="bottom" arrow>
            <IconButton
              id="push-notif-btn"
              onClick={handleOpenNotifMenu}
              disabled={pushLoading}
              sx={{
                color: pushSubscribed ? '#133829' : '#94a3b8',
                borderRadius: '8px',
                p: 0.9,
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#f1f5f9', color: '#133829' }
              }}
            >
              <Badge
                variant="dot"
                invisible={!pushSubscribed}
                sx={{
                  '& .MuiBadge-dot': {
                    backgroundColor: '#10b981',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    border: '1.5px solid #fff'
                  }
                }}
              >
                {pushSubscribed ? (
                  <NotificationsActiveIcon sx={{ fontSize: 22 }} />
                ) : (
                  <NotificationsIcon sx={{ fontSize: 22 }} />
                )}
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Push Notification Menu */}
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleCloseNotifMenu}
            PaperProps={{
              sx: { mt: 1.5, minWidth: 260, borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>
                Push Notifications
              </Typography>
              <Typography variant="caption" sx={{ color: pushSubscribed ? '#059669' : '#64748b', fontWeight: 600, fontSize: 11 }}>
                {pushSubscribed ? 'Active on this device' : 'Disabled on this device'}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              id="toggle-push-notifications"
              onClick={handleTogglePushNotifications}
              disabled={pushLoading}
              sx={{ py: 1.2, fontSize: 13, fontWeight: 700 }}
            >
              <ListItemIcon>
                {pushSubscribed ? (
                  <NotificationsOffIcon fontSize="small" sx={{ color: '#ef4444' }} />
                ) : (
                  <NotificationsActiveIcon fontSize="small" sx={{ color: '#133829' }} />
                )}
              </ListItemIcon>
              {pushLoading ? 'Processing...' : pushSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
            </MenuItem>
          </Menu>
          <Box
            onClick={handleOpenMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              p: 0.6,
              borderRadius: '50px',
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
                width: 38,
                height: 38,
                borderRadius: '50%',
                bgcolor: '#0f172a',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                border: '2px solid #e2e8f0',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
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
                sx={{ height: 20, fontSize: 10, fontWeight: 800, borderRadius: '4px' }}
              />
            </Box>

            <MenuItem onClick={handleNavigateProfile} sx={{ fontWeight: 700, fontSize: 13, py: 1.2, color: '#0f172a' }}>
              <PersonIcon fontSize="small" sx={{ mr: 1.2, color: 'primary.main' }} />
              My Profile & Documents
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
