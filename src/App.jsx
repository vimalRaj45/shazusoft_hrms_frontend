import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Drawer,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  AssignmentTurnedIn as EvalIcon,
  Assessment as ReportIcon,
  History as HistoryIcon,
  Campaign as AnnouncementIcon,
  MenuBook as GuideIcon,
  Person as PersonIcon,
  WorkOutline as WorkIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  CorporateFare as OfficeIcon,
  VpnKey as KeyIcon,
  CheckCircle as CheckIcon,
  PlaylistAddCheck as TrackerIcon
} from '@mui/icons-material';
import toast from './utils/muiToast';
import { AlertConfirmProvider } from './context/AlertConfirmContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getTheme } from './theme/theme';
import TopNavbar from './components/TopNavbar';
import Sidebar from './components/Sidebar';
import WelcomeHero from './components/WelcomeHero';
import MetricCards from './components/MetricCards';
import GeofencePunch from './components/GeofencePunch';
import MonthlyAttendanceTimesheet from './components/MonthlyAttendanceTimesheet';
import WorkDoneSection from './components/WorkDoneSection';
import LeavesSection from './components/LeavesSection';
import TaskTrackerBoard from './components/TaskTrackerBoard';
import EmployeeReportViewer from './components/EmployeeReportViewer';
import MonthlySelfEvaluationModal from './components/MonthlySelfEvaluationModal';
import SelfEvaluationViewer from './components/SelfEvaluationViewer';
import WeeklyCheckInModal from './components/WeeklyCheckInModal';
import WeeklyReportsViewer from './components/WeeklyReportsViewer';
import GlobalSearchModal from './components/GlobalSearchModal';
import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AIReports from './pages/AIReports';
import { attendanceAPI, reportsAPI, evaluationsAPI, leavesAPI, workDoneAPI, tasksAPI } from './services/api';
import { format } from 'date-fns';

function AppContent() {
  const { user, loading, isAdmin, themeMode } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Core employee state
  const [todayData, setTodayData] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [myEvaluations, setMyEvaluations] = useState([]);
  const [myWeeklyReports, setMyWeeklyReports] = useState([]);
  const [monthlyStatus, setMonthlyStatus] = useState(null);

  // Modals & Viewers
  const [openEvalModal, setOpenEvalModal] = useState(false);
  const [openEvalViewerModal, setOpenEvalViewerModal] = useState(false);
  const [openWeeklyModal, setOpenWeeklyModal] = useState(false);
  const [openSearchModal, setOpenSearchModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpenSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [reportMonth, setReportMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [fullReportData, setFullReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const theme = getTheme(themeMode || 'light');

  const fetchDashboardMetrics = async () => {
    if (!user) return;
    try {
      const [todayRes, histRes, evalRes, tasksRes, balRes, weeklyRes, monthStatusRes] = await Promise.all([
        attendanceAPI.getToday().catch(() => ({ data: null })),
        attendanceAPI.getMyHistory().catch(() => ({ data: { records: [] } })),
        evaluationsAPI.getMyEvaluations().catch(() => ({ data: { evaluations: [] } })),
        workDoneAPI.getMyTasks().catch(() => ({ data: { tasks: [] } })),
        leavesAPI.getBalances().catch(() => ({ data: null })),
        evaluationsAPI.getMyWeekly().catch(() => ({ data: { reports: [] } })),
        evaluationsAPI.getMonthlyStatus().catch(() => ({ data: null }))
      ]);

      if (todayRes?.data) setTodayData(todayRes.data);
      if (histRes?.data?.records) setHistoryRecords(histRes.data.records);
      if (evalRes?.data?.evaluations) setMyEvaluations(evalRes.data.evaluations);
      if (tasksRes?.data?.tasks) setMyTasks(tasksRes.data.tasks);
      if (balRes?.data) setLeaveBalances(balRes.data);
      if (weeklyRes?.data?.reports) setMyWeeklyReports(weeklyRes.data.reports);
      if (monthStatusRes?.data) setMonthlyStatus(monthStatusRes.data);
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardMetrics();
    }
  }, [user]);

  const handleGenerateReport = async () => {
    if (!user) return;
    setLoadingReport(true);
    try {
      const res = await reportsAPI.getEmployeeFullReport({
        employee_id: user.id,
        month_year: reportMonth
      });
      setFullReportData(res.data);
    } catch (err) {
      toast.error('Failed to generate report from Google Sheets.');
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-report' && !fullReportData) {
      handleGenerateReport();
    }
  }, [activeTab]);

  if (loading) {
    return <SplashScreen message="Initializing secure company workspace..." />;
  }

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AlertConfirmProvider>
          <Login />
        </AlertConfirmProvider>
      </ThemeProvider>
    );
  }

  const completedTasksCount = myTasks.filter((t) => t.status === 'Completed').length;
  const netWorkedHours = todayData?.attendance?.net_hours || '0';
  const remainingCL = leaveBalances?.balances?.['Casual Leave']?.remainingDays ?? 12;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AlertConfirmProvider>

      {/* Main Layout: Left Full-Height Sidebar + Right Header/Content */}
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f7f9fa', width: '100%', overflowX: 'hidden' }}>
        {/* Desktop Sidebar (Starts from the very top 0px) */}
        <Box
          component="aside"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: 260,
            flexShrink: 0,
            bgcolor: '#ffffff',
            borderRight: '1px solid #e5e7eb',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            zIndex: 1200
          }}
        >
          <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        </Box>

        {/* Mobile Drawer Sidebar */}
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: 260, bgcolor: '#ffffff', borderRadius: 0 }
          }}
        >
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setMobileDrawerOpen(false);
            }}
            onCloseMobile={() => setMobileDrawerOpen(false)}
          />
        </Drawer>

        {/* Right Area: Top Navbar + Main Content */}
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            width: { xs: '100%', md: 'calc(100% - 260px)' },
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            overflowX: 'hidden'
          }}
        >
          {/* Top Navbar with User Avatar at Right Top */}
          <TopNavbar
            onMobileDrawerToggle={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            activeView={activeTab}
            onSelectView={setActiveTab}
            onOpenSearch={() => setOpenSearchModal(true)}
          />

          {/* Main Content Area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 2.5, md: 3 },
              maxWidth: '100%',
              overflowX: 'hidden',
              boxSizing: 'border-box'
            }}
          >
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Forest Green Welcome Hero Card with 4px corners */}
              <WelcomeHero
                user={user}
                onActionClick={() => {
                  if (isAdmin) {
                    setActiveTab('admin-tasks');
                  } else {
                    setActiveTab('task-tracker');
                  }
                }}
                actionLabel={isAdmin ? 'Team Task Board →' : 'My Assigned Tasks →'}
              />

              {/* 4 KPI Top-Border Highlight Cards */}
              <MetricCards
                daysCount={historyRecords.length > 0 ? historyRecords.length : 1}
                netHours={netWorkedHours}
                tasksCompleted={completedTasksCount}
                leaveRemaining={remainingCL}
                onViewAttendance={() => setActiveTab('attendance')}
                onViewTasks={() => setActiveTab('task-tracker')}
              />

              {/* Monthly Review Cycle Open Alert (Within Final 5 Days of Month) */}
              {monthlyStatus?.isWindowOpen && !monthlyStatus?.hasSubmittedThisMonth && (
                <Card sx={{ mb: 2.5, bgcolor: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: '4px' }}>
                  <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <AnnouncementIcon sx={{ color: '#d97706', fontSize: 24 }} />
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#92400e' }}>
                            {monthlyStatus.currentMonthLabel} Self-Evaluation Review is Now Open!
                          </Typography>
                          <Chip label={`Final ${monthlyStatus.daysUntilMonthEnd} Day(s) of Month`} size="small" color="warning" sx={{ fontWeight: 800, height: 20, fontSize: 10, borderRadius: '4px' }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#78350f', fontWeight: 600 }}>
                          The 13-section appraisal unlocks in the last 5 days of each month. Please submit before month-end.
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setOpenEvalModal(true)}
                      sx={{
                        fontWeight: 700,
                        borderRadius: '4px',
                        bgcolor: '#133829',
                        color: '#ffffff',
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#0f291e' }
                      }}
                    >
                      Complete Monthly Appraisal →
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Submitted Monthly Appraisal Status */}
              {myEvaluations.length > 0 && (
                <Card sx={{ mb: 2.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
                  <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckIcon sx={{ color: '#15803d', fontSize: 22 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#15803d' }}>
                          {myEvaluations[0].review_month} Self-Evaluation Recorded
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                          Submitted on {myEvaluations[0].submission_date} • Rating: <strong>{myEvaluations[0].overall_rating} / 5.0 ⭐</strong> • Status: <strong>{myEvaluations[0].status || 'Submitted'}</strong>
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => {
                        setSelectedEvaluation(myEvaluations[0]);
                        setOpenEvalViewerModal(true);
                      }}
                      sx={{ fontWeight: 700, borderRadius: '4px', textTransform: 'none' }}
                    >
                      View Submitted Appraisal Form
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Weekly Check-in Quick Bar (Always Open) */}
              <Card sx={{ mb: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', borderRadius: '4px' }}>
                <CardContent sx={{ p: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <TrackerIcon sx={{ color: '#133829', fontSize: 22 }} />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          Weekly Check-in & Challenges Sync
                        </Typography>
                        <Chip label="Open All Time" size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 800, bgcolor: '#e2e8f0', borderRadius: '4px' }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                        {myWeeklyReports.length > 0 ? `${myWeeklyReports.length} weekly report(s) on file` : 'No check-in submitted for this week yet'} • Auto-imports your week’s tasks
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {myWeeklyReports.length > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => setActiveTab('weekly-report')}
                        sx={{ fontWeight: 600, borderRadius: '4px', textTransform: 'none' }}
                      >
                        View Timeline
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setOpenWeeklyModal(true)}
                      sx={{
                        fontWeight: 700,
                        borderRadius: '4px',
                        bgcolor: '#133829',
                        color: '#ffffff',
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#0f291e' }
                      }}
                    >
                      + Submit Weekly Check-in
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Geofence Punch Hero */}
              <Box sx={{ mb: 3 }}>
                <GeofencePunch todayData={todayData} onRefresh={fetchDashboardMetrics} />
              </Box>

              {/* Task Assign & Track Hub */}
              <Box sx={{ mt: 3 }}>
                <TaskTrackerBoard />
              </Box>

              {/* Work Done Activity Section */}
              <WorkDoneSection />

              {/* Leaves & Permissions Section */}
              <LeavesSection />
            </>
          )}

          {/* TAB: TASK ASSIGN & TRACK */}
          {(activeTab === 'task-tracker' || activeTab === 'admin-tasks') && (
            <TaskTrackerBoard />
          )}

          {/* TAB: GPS ATTENDANCE & FULL MONTH TIMESHEET */}
          {activeTab === 'attendance' && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                Office GPS Attendance & Full Monthly Timesheet
              </Typography>
              <Box sx={{ mb: 3 }}>
                <GeofencePunch todayData={todayData} onRefresh={fetchDashboardMetrics} />
              </Box>

              {/* Monthly Attendance Timesheet (Past-Days Only) */}
              <MonthlyAttendanceTimesheet onRefreshParent={fetchDashboardMetrics} />
            </Box>
          )}

          {/* TAB: DAILY WORKDONE */}
          {activeTab === 'workdone' && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                Daily Work & Activity Logger
              </Typography>
              <WorkDoneSection />
            </Box>
          )}

          {/* TAB: LEAVES & PERMISSIONS */}
          {activeTab === 'leaves' && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                Company Leaves Quota & Short Permissions
              </Typography>
              <LeavesSection />
            </Box>
          )}

          {/* TAB: WEEKLY REPORT (OPEN ALL TIME) */}
          {activeTab === 'weekly-report' && (
            <Box>
              <WeeklyReportsViewer
                reports={myWeeklyReports}
                onNewReport={() => setOpenWeeklyModal(true)}
              />
            </Box>
          )}

          {/* TAB: MONTHLY SELF-EVALUATION (5-DAY WINDOW) */}
          {activeTab === 'self-eval' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {monthlyStatus?.currentMonthLabel || 'Monthly'} Employee Self-Evaluation Appraisal
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Comprehensive 13-section appraisal unlocked exclusively during the final 5 days of each month
                  </Typography>
                </Box>

                {monthlyStatus?.isWindowOpen && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EvalIcon />}
                    onClick={() => setOpenEvalModal(true)}
                    sx={{ fontWeight: 800, px: 3, py: 1, borderRadius: '4px' }}
                  >
                    Fill / Update Appraisal Form
                  </Button>
                )}
              </Box>

              {/* Outside Window Notice */}
              {!monthlyStatus?.isWindowOpen && myEvaluations.length === 0 && (
                <Card sx={{ p: 4, textAlign: 'center', border: '1.5px dashed #cbd5e1', borderRadius: '4px', bgcolor: '#ffffff', mb: 3 }}>
                  <AnnouncementIcon sx={{ fontSize: 48, color: '#f59e0b', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                    Monthly Appraisal Window Currently Closed
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 560, mx: 'auto', mb: 2.5, lineHeight: 1.6 }}>
                    The 13-section monthly self-evaluation opens automatically in the <strong>final 5 days of each month</strong> ({monthlyStatus?.windowOpensOn ? `on ${monthlyStatus.windowOpensOn}` : 'approx. day 26 to month-end'}). In the meantime, please use the <strong>Weekly Check-in</strong> to keep your goals and challenge logs up to date!
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      sx={{ bgcolor: '#133829', color: '#fff', fontWeight: 700, borderRadius: '4px', '&:hover': { bgcolor: '#0f291e' } }}
                      onClick={() => setOpenWeeklyModal(true)}
                    >
                      Submit Weekly Check-in →
                    </Button>
                  </Box>
                </Card>
              )}

              {/* Inside Window with No Submission */}
              {monthlyStatus?.isWindowOpen && myEvaluations.length === 0 && (
                <Card sx={{ p: 4, textAlign: 'center', border: '2px solid #133829', borderRadius: '4px', bgcolor: '#f0fdf4', mb: 3 }}>
                  <EvalIcon sx={{ fontSize: 48, color: '#133829', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                    {monthlyStatus.currentMonthLabel} Appraisal is Now Active!
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#166534', maxWidth: 520, mx: 'auto', mb: 2.5, fontWeight: 500 }}>
                    Please complete your 13-section performance appraisal before the month ends. All responses are securely archived in company records.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#133829', color: '#ffffff', fontWeight: 800, px: 3, py: 1, borderRadius: '4px', '&:hover': { bgcolor: '#0f291e' } }}
                    onClick={() => setOpenEvalModal(true)}
                  >
                    Start 13-Section Appraisal Form
                  </Button>
                </Card>
              )}

              {/* Submitted Evaluation Viewer Card */}
              {myEvaluations.length > 0 && (
                <Card sx={{ border: '1px solid #e5e7eb', borderRadius: '4px', mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          Submitted Evaluation: {myEvaluations[0].review_month}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Submission Date: {myEvaluations[0].submission_date} • Status: <strong>{myEvaluations[0].status || 'Submitted'}</strong> • Rating: <strong>{myEvaluations[0].overall_rating} / 5.0 ⭐</strong>
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {monthlyStatus?.isWindowOpen && (
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => setOpenEvalModal(true)}
                            sx={{ fontWeight: 700, borderRadius: '4px' }}
                          >
                            Update Appraisal
                          </Button>
                        )}
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setSelectedEvaluation(myEvaluations[0]);
                            setOpenEvalViewerModal(true);
                          }}
                          sx={{ fontWeight: 700, borderRadius: '4px' }}
                        >
                          View Full Document & Print
                        </Button>
                      </Box>
                    </Box>
                    <SelfEvaluationViewer evaluation={myEvaluations[0]} />
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* TAB: MY INDIVIDUAL REPORT */}
          {activeTab === 'my-report' && (
            <Box>
              <Card sx={{ border: '1px solid #e5e7eb', borderRadius: '4px', mb: 3 }}>
                <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      Individual Timesheet & Performance Report
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Detailed task logs, project distribution, estimation accuracy, and attendance breakdown
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TextField
                      size="small"
                      type="month"
                      value={reportMonth}
                      onChange={(e) => setReportMonth(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleGenerateReport}
                      disabled={loadingReport}
                      sx={{ fontWeight: 700, borderRadius: '4px' }}
                    >
                      {loadingReport ? 'Generating...' : 'Generate Report'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {loadingReport ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress size={36} sx={{ color: '#133829' }} />
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 1.5 }}>
                    Extracting detailed timesheet metrics...
                  </Typography>
                </Box>
              ) : fullReportData ? (
                <EmployeeReportViewer reportData={fullReportData} />
              ) : (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                  No report records found for the selected period.
                </Typography>
              )}
            </Box>
          )}

          {/* TAB: ADMIN MANAGEMENT SUITE */}
          {activeTab === 'admin-live' && isAdmin && <AdminDashboard initialTab={0} />}
          {activeTab === 'admin-evals' && isAdmin && <AdminDashboard initialTab={5} />}
          {activeTab === 'admin-weekly' && isAdmin && <AdminDashboard initialTab={6} />}
          {activeTab === 'admin-timesheets' && isAdmin && <AdminDashboard initialTab={7} />}
          {activeTab === 'admin-holidays' && isAdmin && <AdminDashboard initialTab={10} />}
          {activeTab === 'ai-reports' && isAdmin && <AIReports />}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <Box sx={{ maxWidth: 800 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                Employee Profile & Credentials
              </Typography>
              <Card sx={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '4px',
                        bgcolor: '#133829',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 22
                      }}
                    >
                      {user?.name?.charAt(0) || 'U'}
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {user?.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {user?.designation || 'Staff'} • {user?.department || 'Engineering'}
                      </Typography>
                      <Chip
                        label={user?.role?.toUpperCase()}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 800, mt: 0.5, height: 20, fontSize: 10, borderRadius: '4px' }}
                      />
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>EMPLOYEE ID</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>{user?.id}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>EMAIL ADDRESS</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>{user?.email}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>DEPARTMENT</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>{user?.department}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>REPORTING MANAGER</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>Operations & HR Lead</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* TAB: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <Box sx={{ maxWidth: 900 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                Company Notices & Announcements
              </Typography>
              <Card sx={{ border: '1px solid #e5e7eb', borderRadius: '4px', mb: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <AnnouncementIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      August 2026 Self-Evaluation Appraisal Window Open
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
                    All staff members are kindly requested to complete their August Monthly Self-Evaluation Appraisal sheet. The evaluation contains 13 detailed sections including tasks, self-ratings, and professional development milestones.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* TAB: USER GUIDE */}
          {activeTab === 'guide' && (
            <Box sx={{ maxWidth: 900 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                Shazu Soft HRMS Quick User Guide
              </Typography>
              <Card sx={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.8 }}>
                    1. Task Assignment & Real-Time Tracking
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 2.5 }}>
                    Managers can assign tasks with priority and due dates. Employees can start tasks, adjust the progress slider (0-100%), log actual time spent, and submit notes.
                  </Typography>

                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.8 }}>
                    2. GPS Geofence Attendance & Break Logs
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 2.5 }}>
                    Ensure GPS location permissions are granted. The system validates your real-time coordinates against the Shazu Soft office radius. Track your tea, lunch, and short breaks effortlessly.
                  </Typography>

                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.8 }}>
                    3. August 13-Section Appraisal
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    Access the August Self-Evaluation tab to enter your targets, performance ratings, and achievements. Submitted forms are safely stored in Google Sheets.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
          </Box>
        </Box>
      </Box>

      {/* 13-Section Monthly Self-Evaluation Form Modal — Staff only */}
      {!isAdmin && (
        <MonthlySelfEvaluationModal
          open={openEvalModal}
          onClose={() => setOpenEvalModal(false)}
          user={user}
          onSuccess={() => {
            fetchDashboardMetrics();
            setActiveTab('self-eval');
          }}
        />
      )}

      {/* Lightweight 4-Pillar Weekly Check-in Modal — Staff only */}
      {!isAdmin && (
        <WeeklyCheckInModal
          open={openWeeklyModal}
          onClose={() => setOpenWeeklyModal(false)}
          user={user}
          onSuccess={() => {
            fetchDashboardMetrics();
            setActiveTab('weekly-report');
          }}
        />
      )}

      {/* Universal Global Search & Command Palette Modal */}
      <GlobalSearchModal
        open={openSearchModal}
        onClose={() => setOpenSearchModal(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
        }}
        onTriggerAction={(act) => {
          if (act === 'open-weekly-modal') {
            setOpenWeeklyModal(true);
          }
        }}
        isAdmin={isAdmin}
      />

      {/* Submitted Self-Evaluation Document Viewer Modal */}
      <Dialog open={openEvalViewerModal} onClose={() => setOpenEvalViewerModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Submitted Performance Appraisal Document
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          <SelfEvaluationViewer evaluation={selectedEvaluation} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEvalViewerModal(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      </AlertConfirmProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
