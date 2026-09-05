import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  PersonOutline as ProfileIcon,
  CampaignOutlined as AnnouncementIcon,
  MenuBookOutlined as GuideIcon,
  LocationOnOutlined as GpsIcon,
  AssignmentOutlined as TaskIcon,
  EventBusyOutlined as LeaveIcon,
  AssignmentTurnedInOutlined as EvalIcon,
  AssessmentOutlined as ReportIcon,
  PeopleOutline as TeamIcon,
  ShieldOutlined as ShieldIcon,
  AutoAwesome as SparklesIcon,
  PlaylistAddCheck as TrackerIcon,
  DateRange as WeekIcon,
  ChatOutlined as ChatIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MenuOpen as MenuOpenIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, onSelectTab, onCloseMobile, isCollapsed = false, onToggleCollapse }) {
  const { isAdmin } = useAuth();

  const handleItemClick = (tabKey) => {
    onSelectTab(tabKey);
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavItem = (key, label, IconComponent, badge = null) => {
    const isActive = activeTab === key;
    const tooltipTitle = badge ? `${label} • ${badge}` : label;

    const buttonContent = (
      <ListItemButton
        onClick={() => handleItemClick(key)}
        sx={{
          py: 0.9,
          px: isCollapsed ? 1 : 1.5,
          mb: 0.5,
          borderRadius: '4px',
          bgcolor: isActive ? '#e8f5e9' : 'transparent',
          color: isActive ? '#133829' : '#475569',
          fontWeight: isActive ? 700 : 500,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            bgcolor: isActive ? '#e8f5e9' : '#f8fafc',
            color: '#133829'
          }
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: isCollapsed ? 'unset' : 30,
            justifyContent: 'center',
            color: isActive ? '#133829' : '#64748b'
          }}
        >
          <IconComponent fontSize="small" />
        </ListItemIcon>

        {!isCollapsed && (
          <>
            <ListItemText
              primary={label}
              primaryTypographyProps={{
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            />
            {badge && (
              <Chip
                label={badge}
                size="small"
                sx={{
                  height: 18,
                  fontSize: 9,
                  fontWeight: 800,
                  bgcolor: isActive ? '#c8e6c9' : '#f1f5f9',
                  color: isActive ? '#1b5e20' : '#475569',
                  borderRadius: '4px',
                  ml: 0.5,
                  flexShrink: 0
                }}
              />
            )}
          </>
        )}
      </ListItemButton>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={key} title={tooltipTitle} placement="right" arrow>
          <Box>{buttonContent}</Box>
        </Tooltip>
      );
    }

    return <React.Fragment key={key}>{buttonContent}</React.Fragment>;
  };

  return (
    <Box
      sx={{
        width: isCollapsed ? 72 : 260,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <Box sx={{ pt: '64px' }}>
        {/* Top Brand Logo Banner + Collapse Toggle (Fixed on Mobile & Desktop Scroll) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            px: isCollapsed ? 1 : 2,
            py: 1.5,
            height: 64,
            borderBottom: '1px solid #e5e7eb',
            boxSizing: 'border-box',
            position: 'fixed',
            top: 0,
            left: 0,
            width: isCollapsed ? 72 : 260,
            zIndex: 1200,
            bgcolor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              overflow: 'hidden',
              p: 0.6,
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: 'rgba(19, 56, 41, 0.05)'
              },
              '&:active': {
                transform: 'scale(0.98)'
              }
            }}
            onClick={() => {
              if (isCollapsed && onToggleCollapse) {
                onToggleCollapse();
              }
              if (onSelectTab) {
                onSelectTab('dashboard');
              }
              if (onCloseMobile) {
                onCloseMobile();
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Shazu Soft Logo"
              sx={{
                width: 34,
                height: 34,
                objectFit: 'contain',
                borderRadius: '4px',
                flexShrink: 0
              }}
            />
            {!isCollapsed && (
              <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  SHAZU SOFT
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    fontSize: 10,
                    whiteSpace: 'nowrap',
                    display: 'block'
                  }}
                >
                  HRMS PORTAL 2026
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Navigation Links */}
        <Box sx={{ p: isCollapsed ? 1 : 2 }}>
          {/* Category 1: OVERVIEW (Clickable to Dashboard) */}
          {!isCollapsed ? (
            <Box
              onClick={() => {
                if (onSelectTab) onSelectTab('dashboard');
                if (onCloseMobile) onCloseMobile();
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 0.6,
                mb: 0.6,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: '#f1f5f9'
                }
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: activeTab === 'dashboard' ? '#133829' : '#64748b',
                  fontWeight: 800,
                  fontSize: 10,
                  letterSpacing: '0.06em'
                }}
              >
                OVERVIEW
              </Typography>
            </Box>
          ) : (
            <Divider sx={{ my: 1, borderColor: '#e2e8f0' }} />
          )}

          <List dense sx={{ p: 0, mb: isCollapsed ? 1 : 2 }}>
            {renderNavItem('dashboard', 'Dashboard', DashboardIcon)}
            {renderNavItem('profile', 'My Profile', ProfileIcon)}
            {renderNavItem('announcements', 'Announcements', AnnouncementIcon)}
            {renderNavItem('guide', 'User Guide', GuideIcon)}
          </List>

          {/* Category 2: STAFF PORTAL (Clickable to Task Tracker) */}
          {!isCollapsed ? (
            <Box
              onClick={() => {
                if (onSelectTab) onSelectTab('task-tracker');
                if (onCloseMobile) onCloseMobile();
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 0.6,
                mb: 0.6,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: '#f1f5f9'
                }
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#64748b',
                  fontWeight: 800,
                  fontSize: 10,
                  letterSpacing: '0.06em'
                }}
              >
                {isAdmin ? 'OPERATIONS & STAFF' : 'STAFF PORTAL'}
              </Typography>
            </Box>
          ) : (
            <Divider sx={{ my: 1, borderColor: '#e2e8f0' }} />
          )}

          <List dense sx={{ p: 0, mb: isCollapsed ? 1 : 2 }}>
            {renderNavItem('chat-hub', 'Issue Resolution & Chat', ChatIcon, 'Live')}
            {renderNavItem('task-tracker', 'Task Assign & Track', TrackerIcon, 'Workflow')}
            {renderNavItem('attendance', 'Office Attendance', GpsIcon)}
            {renderNavItem('workdone', 'Daily Work Log', TaskIcon)}
            {renderNavItem('leaves', 'Leaves & Permissions', LeaveIcon)}
            {!isAdmin && renderNavItem('weekly-report', 'Weekly Check-in', WeekIcon, 'Weekly')}
            {!isAdmin && renderNavItem('self-eval', 'Monthly Appraisal', EvalIcon, 'Last 5 Days')}
            {renderNavItem('my-report', 'Individual Full Report', ReportIcon)}
          </List>

          {/* Category 3: ADMIN MANAGEMENT (Only if Admin, Clickable to Live Board) */}
          {isAdmin && (
            <>
              {!isCollapsed ? (
                <Box
                  onClick={() => {
                    if (onSelectTab) onSelectTab('admin-live');
                    if (onCloseMobile) onCloseMobile();
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 0.6,
                    mb: 0.6,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                      bgcolor: '#f1f5f9'
                    }
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: '#64748b',
                      fontWeight: 800,
                      fontSize: 10,
                      letterSpacing: '0.06em'
                    }}
                  >
                    MANAGEMENT SUITE
                  </Typography>
                </Box>
              ) : (
                <Divider sx={{ my: 1, borderColor: '#e2e8f0' }} />
              )}

              <List dense sx={{ p: 0, mb: 1 }}>
                {renderNavItem('admin-live', 'Live Presence Board', TeamIcon)}
                {renderNavItem('admin-tasks', 'Team Task Assignment', TrackerIcon)}
                {renderNavItem('admin-weekly', 'Weekly Staff Reports', WeekIcon, 'All Staff')}
                {renderNavItem('admin-evals', 'Monthly Appraisals', EvalIcon, '13-Section')}
                {renderNavItem('admin-timesheets', 'Staff Timesheets', ReportIcon)}
                {renderNavItem('admin-holidays', 'Holidays & Calendar', LeaveIcon)}
                {renderNavItem('ai-reports', 'Reports & Analytics', SparklesIcon)}
              </List>
            </>
          )}
        </Box>
      </Box>

      {/* Bottom Protection Box / Compact Shield Icon */}
      <Box sx={{ p: isCollapsed ? 1 : 2, pt: 0 }}>
        {!isCollapsed ? (
          <Box
            sx={{
              p: 1.5,
              borderRadius: '4px',
              bgcolor: '#f8fafc',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.4 }}>
              <ShieldIcon sx={{ fontSize: 15, color: '#133829' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#133829' }}>
                Location Verified
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: 11, lineHeight: 1.3, display: 'block' }}>
              Office check-in verification and secure company records.
            </Typography>
          </Box>
        ) : (
          <Tooltip title="Location Verified & Secure Company Records" placement="right" arrow>
            <Box
              sx={{
                p: 1,
                borderRadius: '4px',
                bgcolor: '#f8fafc',
                border: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <ShieldIcon sx={{ fontSize: 18, color: '#133829' }} />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
