import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip
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
  Spa as LeafLogoIcon,
  DateRange as WeekIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, onSelectTab, onCloseMobile }) {
  const { isAdmin } = useAuth();

  const handleItemClick = (tabKey) => {
    onSelectTab(tabKey);
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavItem = (key, label, IconComponent, badge = null) => {
    const isActive = activeTab === key;
    return (
      <ListItemButton
        key={key}
        onClick={() => handleItemClick(key)}
        sx={{
          py: 0.9,
          px: 1.5,
          mb: 0.5,
          borderRadius: '4px', // Crisp 4px corners
          bgcolor: isActive ? '#e8f5e9' : 'transparent',
          color: isActive ? '#133829' : '#475569',
          fontWeight: isActive ? 700 : 500,
          '&:hover': {
            bgcolor: isActive ? '#e8f5e9' : '#f8fafc',
            color: '#133829'
          }
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 30,
            color: isActive ? '#133829' : '#64748b'
          }}
        >
          <IconComponent fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: '0.85rem',
            fontWeight: isActive ? 700 : 500
          }}
        />
        {badge && (
          <Chip label={badge} size="small" sx={{ height: 18, fontSize: 9, fontWeight: 800, bgcolor: '#f1f5f9', borderRadius: '4px' }} />
        )}
      </ListItemButton>
    );
  };

  return (
    <Box
      sx={{
        width: 260,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' }
      }}
    >
      <Box>
        {/* Top Brand Logo Banner */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            px: 2.5,
            py: 2,
            height: 64,
            borderBottom: '1px solid #e5e7eb',
            boxSizing: 'border-box'
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Shazu Soft Logo"
            sx={{
              width: 36,
              height: 36,
              objectFit: 'contain',
              borderRadius: '4px'
            }}
          />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0f172a', fontSize: '0.95rem' }}>
              SHAZU SOFT
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.08em', fontSize: 10 }}>
              HRMS PORTAL 2026
            </Typography>
          </Box>
        </Box>

        {/* Navigation Links */}
        <Box sx={{ p: 2 }}>
          {/* Category 1: OVERVIEW */}
          <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 800, fontSize: 10, px: 1.5, mb: 0.8, letterSpacing: '0.06em' }}>
            OVERVIEW
          </Typography>
          <List dense sx={{ p: 0, mb: 2 }}>
            {renderNavItem('dashboard', 'Dashboard', DashboardIcon)}
            {renderNavItem('profile', 'My Profile', ProfileIcon)}
            {renderNavItem('announcements', 'Announcements', AnnouncementIcon)}
            {renderNavItem('guide', 'User Guide', GuideIcon)}
          </List>

          {/* Category 2: STAFF PORTAL */}
          <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 800, fontSize: 10, px: 1.5, mb: 0.8, letterSpacing: '0.06em' }}>
            {isAdmin ? 'OPERATIONS & STAFF' : 'STAFF PORTAL'}
          </Typography>
          <List dense sx={{ p: 0, mb: 2 }}>
            {renderNavItem('task-tracker', 'Task Assign & Track', TrackerIcon, 'Workflow')}
            {renderNavItem('attendance', 'Office Attendance', GpsIcon)}
            {renderNavItem('workdone', 'Daily Work Log', TaskIcon)}
            {renderNavItem('leaves', 'Leaves & Permissions', LeaveIcon)}
            {/* Weekly & Monthly reports — staff only */}
            {!isAdmin && renderNavItem('weekly-report', 'Weekly Check-in', WeekIcon, 'Weekly')}
            {!isAdmin && renderNavItem('self-eval', 'Monthly Appraisal', EvalIcon, 'Last 5 Days')}
            {renderNavItem('my-report', 'Individual Full Report', ReportIcon)}
          </List>

          {/* Category 3: ADMIN MANAGEMENT (Only if Admin) */}
          {isAdmin && (
            <>
              <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 800, fontSize: 10, px: 1.5, mb: 0.8, letterSpacing: '0.06em' }}>
                MANAGEMENT SUITE
              </Typography>
              <List dense sx={{ p: 0, mb: 2 }}>
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

      {/* Bottom Protection Box */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Box
          sx={{
            p: 1.8,
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
      </Box>
    </Box>
  );
}
