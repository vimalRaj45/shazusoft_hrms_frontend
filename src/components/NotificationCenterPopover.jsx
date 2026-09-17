import React, { useState } from 'react';
import {
  Popover,
  Box,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  useTheme
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ForumIcon from '@mui/icons-material/Forum';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaymentsIcon from '@mui/icons-material/Payments';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import StarIcon from '@mui/icons-material/Star';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function resolveNotificationTargetTab(item, isAdmin) {
  if (!item) return isAdmin ? 'admin-live' : 'dashboard';

  let rawTab = (item.target_tab || '').toLowerCase().trim();

  // If item has a target_url, extract tab query param if available
  if (!rawTab && item.target_url) {
    try {
      const urlObj = new URL(item.target_url, window.location.origin);
      rawTab = (urlObj.searchParams.get('tab') || '').toLowerCase().trim();
    } catch (e) {}
  }

  const type = (item.type || '').toLowerCase().trim();
  const title = (item.title || '').toLowerCase();
  const msg = (item.message || '').toLowerCase();

  // 1. PAYROLL / SALARY / PAYSLIPS
  if (
    rawTab.includes('payroll') ||
    rawTab.includes('payslip') ||
    rawTab.includes('salary') ||
    type === 'payroll' ||
    type === 'salary' ||
    title.includes('salary') ||
    title.includes('payroll') ||
    title.includes('payslip') ||
    title.includes('disbursed') ||
    msg.includes('salary') ||
    msg.includes('disbursed') ||
    msg.includes('payslip')
  ) {
    return isAdmin ? 'admin-payroll' : 'my-payslips';
  }

  // 2. SUPPORT TICKETS / LIVE CHAT HUB / QUERIES
  if (
    rawTab.includes('ticket') ||
    rawTab.includes('support') ||
    rawTab.includes('chat') ||
    type === 'ticket' ||
    type === 'chat' ||
    type === 'support' ||
    title.includes('ticket') ||
    title.includes('chat') ||
    title.includes('support') ||
    title.includes('tkt-') ||
    title.includes('issue') ||
    msg.includes('ticket') ||
    msg.includes('support') ||
    msg.includes('tkt-')
  ) {
    return 'chat-hub';
  }

  // 3. LEAVES & SHORT PERMISSIONS
  if (
    rawTab.includes('leave') ||
    rawTab.includes('permission') ||
    type === 'leave' ||
    type === 'permission' ||
    title.includes('leave') ||
    title.includes('permission') ||
    msg.includes('leave') ||
    msg.includes('permission')
  ) {
    return isAdmin ? 'admin-leaves' : 'leaves';
  }

  // 4. TASK DELEGATION & TRACKING
  if (
    rawTab === 'task-tracker' ||
    rawTab === 'tasks' ||
    rawTab === 'task' ||
    rawTab === 'admin-tasks' ||
    type === 'task' ||
    title.includes('task assign') ||
    title.includes('task track') ||
    title.includes('delegat') ||
    title.includes('task') ||
    msg.includes('task assign') ||
    msg.includes('task')
  ) {
    return 'task-tracker';
  }

  // 5. ATTENDANCE REGULARIZATIONS
  if (
    rawTab.includes('regulariz') ||
    title.includes('regulariz') ||
    title.includes('missing punch') ||
    msg.includes('regulariz') ||
    msg.includes('missing punch')
  ) {
    return isAdmin ? 'admin-regularizations' : 'attendance';
  }

  // 6. ATTENDANCE / LIVE PRESENCE / GEOFENCE / PUNCH
  if (
    rawTab.includes('attend') ||
    type === 'attendance' ||
    title.includes('attendance') ||
    title.includes('punch') ||
    title.includes('geofence') ||
    title.includes('check-in') ||
    msg.includes('punch') ||
    msg.includes('geofence') ||
    msg.includes('attendance')
  ) {
    return isAdmin ? 'admin-live' : 'attendance';
  }

  // 7. DAILY WORK DONE / PLANS
  if (
    rawTab.includes('workdone') ||
    rawTab.includes('work') ||
    type === 'workdone' ||
    title.includes('work done') ||
    title.includes('work plan') ||
    title.includes('deliverable') ||
    msg.includes('work plan') ||
    msg.includes('work done')
  ) {
    return isAdmin ? 'admin-workdone' : 'workdone';
  }

  // 8. MEMOS & OFFICIAL NOTICES / ANNOUNCEMENTS
  if (
    rawTab.includes('memo') ||
    rawTab.includes('broadcast') ||
    type === 'memo' ||
    type === 'broadcast' ||
    title.includes('memo') ||
    title.includes('directive') ||
    title.includes('announcement') ||
    title.includes('notice') ||
    msg.includes('memo') ||
    msg.includes('directive') ||
    msg.includes('announcement')
  ) {
    return isAdmin ? 'admin-memos' : 'memos';
  }

  // 9. MONTHLY SELF-EVALUATION APPRAISALS
  if (
    rawTab.includes('eval') ||
    rawTab.includes('appraisal') ||
    type === 'eval' ||
    type === 'appraisal' ||
    title.includes('appraisal') ||
    title.includes('evaluation') ||
    title.includes('self-eval') ||
    msg.includes('appraisal') ||
    msg.includes('evaluation')
  ) {
    return isAdmin ? 'admin-evals' : 'self-eval';
  }

  // 10. WEEKLY REPORTS
  if (
    rawTab.includes('weekly') ||
    type === 'weekly' ||
    title.includes('weekly') ||
    msg.includes('weekly')
  ) {
    return isAdmin ? 'admin-weekly' : 'weekly-report';
  }

  // 11. PROFILE & DOCUMENTS
  if (
    rawTab.includes('profile') ||
    title.includes('profile') ||
    title.includes('document') ||
    msg.includes('document')
  ) {
    return 'profile';
  }

  // 12. Fallback for rawTab
  if (rawTab) {
    if (isAdmin) {
      if (rawTab === 'leaves') return 'admin-leaves';
      if (rawTab === 'payroll' || rawTab === 'my-payslips') return 'admin-payroll';
      if (rawTab === 'workdone') return 'admin-workdone';
      if (rawTab === 'memos') return 'admin-memos';
      if (rawTab === 'tickets') return 'chat-hub';
      if (rawTab === 'tasks') return 'task-tracker';
      if (rawTab === 'attendance') return 'admin-live';
      if (rawTab === 'evals' || rawTab === 'self-eval') return 'admin-evals';
      if (rawTab === 'weekly' || rawTab === 'weekly-report') return 'admin-weekly';
    } else {
      if (rawTab === 'admin-payroll') return 'my-payslips';
      if (rawTab === 'admin-leaves') return 'leaves';
      if (rawTab === 'admin-workdone') return 'workdone';
      if (rawTab === 'admin-memos') return 'memos';
      if (rawTab === 'admin-tasks') return 'task-tracker';
      if (rawTab === 'admin-live') return 'attendance';
      if (rawTab === 'admin-evals') return 'self-eval';
      if (rawTab === 'admin-weekly') return 'weekly-report';
    }
    return rawTab;
  }

  return isAdmin ? 'admin-live' : 'dashboard';
}

function getCategoryConfig(item) {
  const type = (item?.type || '').toLowerCase().trim();
  const title = (item?.title || '').toLowerCase();
  const msg = (item?.message || '').toLowerCase();
  const rawTab = (item?.target_tab || '').toLowerCase();

  // Payroll / Salary
  if (type === 'payroll' || type === 'salary' || rawTab.includes('payroll') || title.includes('salary') || title.includes('payroll') || title.includes('disbursed') || msg.includes('salary') || msg.includes('disbursed')) {
    return {
      icon: <PaymentsIcon sx={{ fontSize: 18 }} />,
      bg: '#F0FDF4',
      color: '#16A34A',
      label: 'Payroll'
    };
  }

  // Tickets / Chat-Hub
  if (type === 'ticket' || type === 'chat' || type === 'support' || rawTab.includes('ticket') || title.includes('ticket') || title.includes('chat') || title.includes('support') || title.includes('tkt-') || msg.includes('ticket') || msg.includes('tkt-')) {
    return {
      icon: <ForumIcon sx={{ fontSize: 18 }} />,
      bg: '#F5F3FF',
      color: '#7C3AED',
      label: 'Chat-Hub'
    };
  }

  // Leaves & Permissions
  if (type === 'leave' || type === 'permission' || rawTab.includes('leave') || title.includes('leave') || title.includes('permission') || msg.includes('leave') || msg.includes('permission')) {
    return {
      icon: <FlightTakeoffIcon sx={{ fontSize: 18 }} />,
      bg: '#FFF7ED',
      color: '#EA580C',
      label: 'Leaves'
    };
  }

  // Tasks
  if (type === 'task' || rawTab.includes('task') || title.includes('task') || msg.includes('task')) {
    return {
      icon: <AssignmentIcon sx={{ fontSize: 18 }} />,
      bg: '#EEF2FF',
      color: '#4F46E5',
      label: 'Tasks'
    };
  }

  // Attendance
  if (type === 'attendance' || type === 'regularization' || rawTab.includes('attend') || title.includes('attendance') || title.includes('punch') || title.includes('geofence') || msg.includes('attendance') || msg.includes('punch')) {
    return {
      icon: <AccessTimeIcon sx={{ fontSize: 18 }} />,
      bg: '#ECFDF5',
      color: '#059669',
      label: 'Attendance'
    };
  }

  // Memos & Notices
  if (type === 'memo' || type === 'broadcast' || rawTab.includes('memo') || title.includes('memo') || title.includes('directive') || title.includes('announcement') || msg.includes('memo') || msg.includes('announcement')) {
    return {
      icon: <CampaignIcon sx={{ fontSize: 18 }} />,
      bg: '#FFF1F2',
      color: '#E11D48',
      label: 'Memos'
    };
  }

  // Appraisal / Evaluation
  if (type === 'eval' || type === 'appraisal' || rawTab.includes('eval') || title.includes('appraisal') || title.includes('evaluation') || msg.includes('appraisal')) {
    return {
      icon: <StarIcon sx={{ fontSize: 18 }} />,
      bg: '#FDF4FF',
      color: '#C026D3',
      label: 'Appraisal'
    };
  }

  return {
    icon: <NotificationsActiveIcon sx={{ fontSize: 18 }} />,
    bg: '#F0F9FF',
    color: '#0284C7',
    label: 'Alert'
  };
}

export default function NotificationCenterPopover({ anchorEl, open, onClose, onNavigateTab }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { isAdmin } = useAuth();
  const {
    notifications,
    unreadCount,
    isConnected,
    isPushSubscribed,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    togglePushSubscription,
    sendTestNotification
  } = useNotifications();

  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Unread
  const [testingPush, setTestingPush] = useState(false);

  const filteredNotifications = activeTab === 1
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const handleNotificationClick = (item) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    const target = resolveNotificationTargetTab(item, isAdmin);
    if (target && onNavigateTab) {
      onNavigateTab(target);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onClose();
  };

  const handleSendTest = async () => {
    setTestingPush(true);
    await sendTestNotification();
    setTestingPush(false);
  };

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}
      PaperProps={{
        sx: {
          width: { xs: 'calc(100vw - 32px)', sm: 420 },
          maxHeight: 580,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          boxShadow: isDark
            ? '0 20px 40px -10px rgba(0,0,0,0.7), 0 0 1px 1px rgba(255,255,255,0.1)'
            : '0 20px 40px -10px rgba(15,23,42,0.22), 0 0 1px 1px rgba(15,23,42,0.06)',
          overflow: 'hidden',
          mt: 1.5,
          bgcolor: isDark ? '#1E293B' : '#FFFFFF',
          border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`
        }
      }}
    >
      {/* ─── Header ─── */}
      <Box
        sx={{
          p: 2,
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}`,
          background: isDark
            ? 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)'
            : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} new`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.72rem',
                fontWeight: 700,
                bgcolor: '#4F46E5',
                color: '#FFFFFF'
              }}
            />
          )}
          {/* Live SSE Status Badge */}
          <Tooltip title={isConnected ? 'Live real-time stream connected' : 'Connecting to real-time notification stream...'}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 0.9,
                py: 0.25,
                borderRadius: 1.5,
                bgcolor: isConnected
                  ? (isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5')
                  : (isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB'),
                color: isConnected ? '#059669' : '#D97706'
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: isConnected ? '#10B981' : '#F59E0B',
                  boxShadow: isConnected ? '0 0 6px #10B981' : 'none'
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                {isConnected ? 'LIVE' : 'SYNC'}
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        {unreadCount > 0 && (
          <Button
            size="small"
            startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
            onClick={markAllAsRead}
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              color: '#4F46E5',
              py: 0.5,
              px: 1,
              borderRadius: 2,
              '&:hover': { bgcolor: isDark ? 'rgba(79,70,229,0.15)' : '#EEF2FF' }
            }}
          >
            Mark all read
          </Button>
        )}
      </Box>

      {/* ─── Tabs Filter ─── */}
      <Box sx={{ px: 2, pt: 1, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0.8,
              px: 1.5,
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              mr: 1
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              bgcolor: '#4F46E5'
            }
          }}
        >
          <Tab label={`All (${notifications.length})`} />
          <Tab label={`Unread (${unreadCount})`} />
        </Tabs>
      </Box>

      {/* ─── Notification List ─── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
        {loading && notifications.length === 0 ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} sx={{ color: '#4F46E5' }} />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box
            sx={{
              p: 5,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: isDark ? 'rgba(79,70,229,0.15)' : '#EEF2FF',
                color: '#4F46E5',
                mb: 0.5
              }}
            >
              <NotificationsActiveIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {activeTab === 1 ? 'No unread notifications' : 'No notifications yet'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', maxWidth: 240 }}>
              {activeTab === 1
                ? "You're all caught up! Great job staying on top of your workflow."
                : "You'll see real-time updates for leaves, tasks, chats, and payroll here."}
            </Typography>
          </Box>
        ) : (
          <List sx={{ disablePadding: true, p: 0 }}>
            {filteredNotifications.map((item) => {
              const cfg = getCategoryConfig(item);
              const isUnread = !item.is_read;

              return (
                <ListItem
                  key={item.id}
                  disablePadding
                  secondaryAction={
                    <Tooltip title="Delete notification">
                      <IconButton
                        size="small"
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item.id);
                        }}
                        sx={{
                          opacity: 0.3,
                          transition: 'opacity 0.2s',
                          '&:hover': { opacity: 1, color: '#EF4444' }
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  }
                  sx={{
                    borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}`,
                    '&:hover .delete-btn': { opacity: 1 }
                  }}
                >
                  <ListItemButton
                    onClick={() => handleNotificationClick(item)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      pr: 6,
                      transition: 'all 0.15s ease',
                      bgcolor: isUnread
                        ? (isDark ? 'rgba(79,70,229,0.08)' : 'rgba(238,242,255,0.6)')
                        : 'transparent',
                      borderLeft: isUnread ? '3px solid #4F46E5' : '3px solid transparent',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC'
                      }
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: cfg.bg,
                          color: cfg.color,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                      >
                        {cfg.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, pr: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isUnread ? 700 : 500,
                              color: isDark ? '#F1F5F9' : '#0F172A',
                              fontSize: '0.84rem',
                              lineHeight: 1.3
                            }}
                          >
                            {item.title}
                          </Typography>
                          {isUnread && (
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: '#4F46E5',
                                flexShrink: 0
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.3 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              color: isDark ? '#94A3B8' : '#64748B',
                              fontSize: '0.78rem',
                              lineHeight: 1.35
                            }}
                          >
                            {item.message}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: isDark ? '#64748B' : '#94A3B8' }}>
                              {formatRelativeTime(item.created_at)}
                            </Typography>
                            <Chip
                              label={cfg.label || 'Notice'}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : cfg.bg,
                                color: isDark ? '#CBD5E1' : cfg.color,
                                textTransform: 'capitalize'
                              }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* ─── Footer: Push Settings & Test ─── */}
      <Divider sx={{ borderColor: isDark ? '#334155' : '#F1F5F9' }} />
      <Box
        sx={{
          p: 1.5,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: isDark ? '#0F172A' : '#F8FAFC'
        }}
      >
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={isPushSubscribed}
              onChange={togglePushSubscription}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#4F46E5',
                  '& + .MuiSwitch-track': {
                    backgroundColor: '#4F46E5'
                  }
                }
              }}
            />
          }
          label={
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
              {isPushSubscribed ? 'Web Push: Active' : 'Web Push: Disabled'}
            </Typography>
          }
          sx={{ m: 0 }}
        />

        <Button
          size="small"
          variant="outlined"
          disabled={testingPush}
          startIcon={testingPush ? <CircularProgress size={14} /> : <SendIcon sx={{ fontSize: 13 }} />}
          onClick={handleSendTest}
          sx={{
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 2,
            borderColor: isDark ? '#475569' : '#CBD5E1',
            color: isDark ? '#E2E8F0' : '#475569',
            py: 0.4,
            px: 1.2,
            '&:hover': {
              borderColor: '#4F46E5',
              color: '#4F46E5'
            }
          }}
        >
          {testingPush ? 'Testing...' : 'Send Test Alert'}
        </Button>
      </Box>
    </Popover>
  );
}
