import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import {
  HelpOutline as GuideIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as GpsIcon,
  AccessTime as TimeIcon,
  PlaylistAddCheck as TasksIcon,
  EditNote as WorkDoneIcon,
  EventBusy as LeavesIcon,
  StarOutline as AppraisalIcon,
  Chat as ChatIcon,
  Campaign as BroadcastIcon,
  Security as SecurityIcon,
  CheckCircleOutline as CheckIcon,
  LightbulbOutlined as TipIcon,
  OpenInNew as OpenInNewIcon,
  Keyboard as KeyboardIcon,
  AdminPanelSettings as AdminIcon,
  Smartphone as PhoneIcon,
  Group as GroupIcon
} from '@mui/icons-material';

const MODULES = [
  {
    id: 'attendance',
    category: 'attendance',
    title: 'GPS Geofence Attendance',
    subtitle: 'Tamper-Proof Punch In & Out within 150m Office Radius',
    badge: '150m Perimeter',
    badgeColor: 'success',
    icon: GpsIcon,
    employeeGuide: [
      'Arrive at designated office location (within 150 meters).',
      'Ensure browser location permissions are granted when prompted.',
      'Click "Punch In" to log your exact coordinates and arrival time.',
      'Log Lunch and Tea breaks using dedicated break buttons to calculate net hours.',
      'Click "Punch Out" when departing at end of day.'
    ],
    adminGuide: [
      'Live map and coordinates recorded for every punch.',
      'Office coordinates fixed to Lat: 11.6569101, Lng: 78.1635979 (Radius: 150m).',
      'Automatic late flagging for punches past 10:00 AM grace period.',
      'Inspect punch-in/out timestamps and break minutes in real-time.'
    ],
    proTip: 'If your GPS coordinates drift on mobile, briefly toggle Wi-Fi on to calibrate your device location.'
  },
  {
    id: 'timesheet',
    category: 'attendance',
    title: 'Past-Days Timesheet & Regularization',
    subtitle: 'Review Historical Working Hours & Request Corrections',
    badge: 'Audit & Approval',
    badgeColor: 'primary',
    icon: TimeIcon,
    employeeGuide: [
      'Navigate to Timesheet to inspect past logins, logouts, break hours, and net working duration.',
      'Future dates are automatically omitted to prevent timesheet confusion.',
      'If you forgot to punch or encountered a technical issue, click "Request Regularization".',
      'Provide your requested login/logout time and detailed reason for manager review.'
    ],
    adminGuide: [
      'Review pending regularization requests in Admin Timesheets tab.',
      'Approve or reject with one click; timesheet hours update instantly upon approval.',
      'Export company-wide monthly timesheets directly to CSV/Excel.'
    ],
    proTip: 'Submit regularization requests within 48 hours of missed punch for swift manager clearance.'
  },
  {
    id: 'tasks',
    category: 'tasks',
    title: 'Multi-Staff Collaborative Task Board',
    subtitle: 'Team Task Assignment with Real-Time Multi-Assignee Tracking',
    badge: 'Team Collaboration',
    badgeColor: 'secondary',
    icon: GroupIcon,
    employeeGuide: [
      'Check the Task Tracker board for tasks assigned to you or your project team.',
      'Shared tasks display all assigned team members and a distinct "Team Task" badge.',
      'Click "Update Progress" to update completion percentage (0-100%) and work notes.',
      'Completing a task automatically logs verified completion entries in Work Done.'
    ],
    adminGuide: [
      'Click "+ Assign New Task" to launch the multi-staff assignment dialog.',
      'Select multiple team members using checkboxes or the "Select All Staff" quick action.',
      'Assign priority levels from Urgent (P0) to Low (P3) with strict deadlines and est. hours.',
      'Instant PWA Web Push notifications are dispatched to every assigned employee.'
    ],
    proTip: 'Any assigned team member can update progress or log notes on collaborative tasks.'
  },
  {
    id: 'workdone',
    category: 'tasks',
    title: 'Daily Work Done Logger',
    subtitle: 'Transparent Daily Task & Project Hours Accountability',
    badge: 'Daily Log',
    badgeColor: 'primary',
    icon: WorkDoneIcon,
    employeeGuide: [
      'Log all completed tasks, client deliverables, and projects at the end of every day.',
      'Specify estimated vs actual hours spent alongside remarks.',
      'Search and filter your past logs by date or keyword.'
    ],
    adminGuide: [
      'Inspect team daily activity and project allocation in real-time.',
      'Verify completed tasks against timesheet working hours.'
    ],
    proTip: 'Submit your daily work log before 6:30 PM to maintain high productivity scoring in monthly evaluations.'
  },
  {
    id: 'leaves',
    category: 'leaves',
    title: 'Leaves Quota & Short Permissions',
    subtitle: 'Transparent Leave Balances with 2-Hour Monthly Permission Passes',
    badge: 'Live Quotas',
    badgeColor: 'success',
    icon: LeavesIcon,
    employeeGuide: [
      'Review live balance cards for Casual (1/mo), Sick (1/mo), and Paid leave allowances.',
      'Apply for emergency short permissions (up to 2 hours per pass, max 2 passes/month).',
      'Select single or multi-day leave dates with automated day calculations.',
      'Receive instant notifications when management approves or reviews your request.'
    ],
    adminGuide: [
      'Configure company-wide monthly quotas under Admin Leave Policies.',
      'Approve or reject employee leave and permission applications with management remarks.',
      'Live employee leave history audit available at a glance.'
    ],
    proTip: 'Apply for planned leaves at least 48 hours in advance for smooth project handovers.'
  },
  {
    id: 'evaluations',
    category: 'leaves',
    title: 'Performance Self-Evaluations & Appraisal',
    subtitle: 'Structured Monthly KPI Reviews & Constructive Manager Appraisals',
    badge: 'Monthly Review',
    badgeColor: 'warning',
    icon: AppraisalIcon,
    employeeGuide: [
      'Fill out your monthly self-evaluation at the end of each review cycle.',
      'Rate yourself on core competencies: Code Quality, Ownership, Delivery, and Teamwork.',
      'Summarize key accomplishments, challenges faced, and goals for next month.',
      'Review manager counter-ratings, feedback notes, and sign off digitally.'
    ],
    adminGuide: [
      'Review submitted evaluations with full breakdown of employee self-ratings.',
      'Provide constructive manager ratings, remarks, and performance recommendations.'
    ],
    proTip: 'Highlight quantifiable project achievements and client feedback in your summary.'
  },
  {
    id: 'chat-hub',
    category: 'communication',
    title: 'Issue Resolution & Live @Mention Hub',
    subtitle: 'Support Ticket System with Team @Mention Autocomplete & Web Push',
    badge: '@Mention Enabled',
    badgeColor: 'secondary',
    icon: ChatIcon,
    employeeGuide: [
      'Raise support tickets for IT issues, payroll questions, policy help, or task roadblocks.',
      'Chat directly with management in real-time threaded conversations.',
      'Type "@Name" to tag any active team member; they receive an immediate push alert and full ticket access!',
      'Filter tickets by "All Issues", "Raised by Me", or "Mentioned In".'
    ],
    adminGuide: [
      'Manage team tickets across categories with priority badges (Urgent to Low).',
      'Update status from Open → In-Progress → Resolved → Closed with resolution notes.',
      'All mentioned staff are automatically granted participation and messaging permissions.'
    ],
    proTip: 'Mentioning a coworker brings them into the ticket discussion immediately with PWA alerts.'
  },
  {
    id: 'security',
    category: 'admin',
    title: 'Security, Authentic OTP & Mobile PWA',
    subtitle: 'Genuine Email OTP Verification & Native Zero-Zoom Mobile Experience',
    badge: 'Enterprise Security',
    badgeColor: 'primary',
    icon: SecurityIcon,
    employeeGuide: [
      'Login securely with authentic 6-digit one-time password dispatched to your email.',
      'Enjoy a solid native mobile app feel: accidental double-tap and pinch zoom are strictly locked.',
      'Add Shazusoft HRMS to your phone Home Screen for fullscreen native app execution.'
    ],
    adminGuide: [
      'Real OTP enforcement: Development mock codes are strictly disabled in production.',
      'Instant session termination: Deactivating or marking an employee as resigned immediately terminates active sessions.'
    ],
    proTip: 'On iPhone Safari or Android Chrome, tap "Add to Home Screen" to install the app with native launch icon.'
  }
];

const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl + K', desc: 'Open Global Search (Find staff or navigate to any module)' },
  { key: 'Ctrl + B', desc: 'Toggle Sidebar (Expand / Collapse for widescreen view)' },
  { key: '@ + Name', desc: 'Tag teammate in Issue Resolution Chat Hub' },
  { key: 'Enter', desc: 'Send message in conversation thread' },
  { key: 'Esc', desc: 'Close open dialogs or search modal' }
];

export default function SystemGuide() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleView, setRoleView] = useState('employee'); // 'employee' | 'admin'

  const filteredModules = useMemo(() => {
    return MODULES.filter((m) => {
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.employeeGuide.some((g) => g.toLowerCase().includes(q)) ||
        m.adminGuide.some((g) => g.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', pb: 8 }}>
      {/* Hero Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 4,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #133829 0%, #1e563f 60%, #0d281e 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #133829'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 2 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Shazusoft Logo"
              sx={{
                width: { xs: 50, sm: 62 },
                height: { xs: 50, sm: 62 },
                objectFit: 'contain',
                borderRadius: '12px',
                bgcolor: '#ffffff',
                p: '6px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                flexShrink: 0,
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
                <Chip
                  label="Welcome to Our New Software • 2026 Edition"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    color: '#86efac',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    border: '1px solid rgba(255, 255, 255, 0.25)'
                  }}
                />
                <Chip
                  label="Shazu Soft HRMS"
                  size="small"
                  sx={{
                    bgcolor: '#22c55e',
                    color: '#092317',
                    fontWeight: 800,
                    fontSize: '0.72rem'
                  }}
                />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.4rem', sm: '2.1rem' },
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                Enterprise User Guide & Feature Showcase
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="body1"
            sx={{
              color: '#e2e8f0',
              maxWidth: 820,
              fontSize: { xs: '0.88rem', sm: '0.98rem' },
              lineHeight: 1.6,
              mb: 3
            }}
          >
            Explore our next-generation workplace management platform. Built for performance, accuracy, and effortless team collaboration with 150m GPS Geofence attendance, multi-staff task tracking, @mention instant notifications, and native mobile zero-zoom responsiveness.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              color="success"
              href="/system-guide.html"
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon fontSize="small" />}
              sx={{
                bgcolor: '#22c55e',
                color: '#0b2319',
                fontWeight: 800,
                textTransform: 'none',
                px: 2.5,
                py: 1,
                fontSize: '0.85rem',
                '&:hover': { bgcolor: '#4ade80' }
              }}
            >
              Open Full Standalone HTML Guide
            </Button>

            <Chip
              icon={<PhoneIcon sx={{ fontSize: '15px !important', color: '#86efac !important' }} />}
              label="PWA Zero-Zoom Mobile Experience Active"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Quick Start 4-Step Checklist */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 4,
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckIcon sx={{ color: '#15803d' }} /> Daily 4-Step Employee Workflow
        </Typography>

        <Grid container spacing={2}>
          {[
            { step: '1', title: 'GPS Punch In', desc: 'Punch In within 150m of office perimeter to record arrival time.' },
            { step: '2', title: 'Check Task Board', desc: 'Inspect your individual and collaborative team tasks on the Task Tracker.' },
            { step: '3', title: 'Log Daily Work', desc: 'Enter projects, deliverables, and actual hours in the Work Done logger.' },
            { step: '4', title: 'Punch Out at EOD', desc: 'Punch out to record departure. Break minutes are deducted automatically.' }
          ].map((s) => (
            <Grid item xs={12} sm={6} md={3} key={s.step}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: '#133829',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    mb: 1
                  }}
                >
                  {s.step}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                  {s.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.4 }}>
                  {s.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Search & Category Filter Controls */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
        <TextField
          size="small"
          placeholder="Search features, instructions, or policies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
              </InputAdornment>
            )
          }}
          sx={{ width: { xs: '100%', md: 360 }, bgcolor: '#ffffff' }}
        />

        {/* Perspective toggle: Employee vs Admin */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            View Perspective:
          </Typography>
          <Button
            size="small"
            variant={roleView === 'employee' ? 'contained' : 'outlined'}
            onClick={() => setRoleView('employee')}
            sx={{
              textTransform: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              bgcolor: roleView === 'employee' ? '#133829' : 'transparent',
              color: roleView === 'employee' ? '#ffffff' : '#334155',
              borderColor: '#cbd5e1'
            }}
          >
            Employee Instructions
          </Button>
          <Button
            size="small"
            variant={roleView === 'admin' ? 'contained' : 'outlined'}
            onClick={() => setRoleView('admin')}
            sx={{
              textTransform: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              bgcolor: roleView === 'admin' ? '#133829' : 'transparent',
              color: roleView === 'admin' ? '#ffffff' : '#334155',
              borderColor: '#cbd5e1'
            }}
          >
            Manager / Admin View
          </Button>
        </Box>
      </Box>

      {/* Category Tabs */}
      <Paper elevation={0} sx={{ mb: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', borderRadius: '6px' }}>
        <Tabs
          value={selectedCategory}
          onChange={(e, val) => setSelectedCategory(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              minHeight: 44
            }
          }}
        >
          <Tab value="all" label={`All Modules (${MODULES.length})`} />
          <Tab value="attendance" label="GPS Attendance & Timesheets" />
          <Tab value="tasks" label="Multi-Staff Tasks & Work Done" />
          <Tab value="leaves" label="Leaves & Appraisals" />
          <Tab value="communication" label="Issues & @Mention Chat" />
          <Tab value="admin" label="Security & PWA Mobile" />
        </Tabs>
      </Paper>

      {/* Feature Accordions Grid */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        {filteredModules.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', color: '#64748b' }}>
            <Typography variant="body1">No features found matching "{searchQuery}".</Typography>
          </Paper>
        ) : (
          filteredModules.map((m) => {
            const Icon = m.icon;
            const guideSteps = roleView === 'employee' ? m.employeeGuide : m.adminGuide;

            return (
              <Accordion
                key={m.id}
                defaultExpanded={filteredModules.length <= 3}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px !important',
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  overflow: 'hidden'
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: '#ffffff',
                    px: { xs: 2, sm: 3 },
                    py: 1,
                    '&:hover': { bgcolor: '#f8fafc' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        bgcolor: '#e8f5e9',
                        color: '#133829',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {m.title}
                        </Typography>
                        <Chip
                          label={m.badge}
                          size="small"
                          color={m.badgeColor}
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                        {m.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 2.5, bgcolor: '#fbfcfd', borderTop: '1px solid #f1f5f9' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
                    {roleView === 'employee' ? 'Step-by-Step Instructions for Staff:' : 'Management Workflows & Capabilities:'}
                  </Typography>

                  <List dense sx={{ py: 0, mb: 2 }}>
                    {guideSteps.map((step, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.4, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 24, mt: 0.2, color: '#15803d' }}>
                          <CheckIcon sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={step}
                          primaryTypographyProps={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Alert
                    icon={<TipIcon fontSize="inherit" sx={{ color: '#133829' }} />}
                    sx={{
                      bgcolor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#14532d',
                      fontSize: '0.8rem',
                      py: 0.5
                    }}
                  >
                    <strong>Pro Tip:</strong> {m.proTip}
                  </Alert>
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
      </Box>

      {/* Keyboard Shortcuts Table */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyboardIcon sx={{ color: '#133829' }} /> Keyboard Shortcuts Cheat Sheet
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
          Speed up your daily workflow with these instant keyboard shortcuts:
        </Typography>

        <Grid container spacing={1.5}>
          {KEYBOARD_SHORTCUTS.map((sc, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.25,
                  bgcolor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '6px'
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#334155' }}>
                  {sc.desc}
                </Typography>
                <Chip
                  label={sc.key}
                  size="small"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    bgcolor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.72rem'
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
