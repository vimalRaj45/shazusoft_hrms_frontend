import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Assignment as TaskIcon,
  EventBusy as LeaveIcon,
  Settings as SettingsIcon,
  PersonAdd as AddPersonIcon,
  Refresh as RefreshIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  LocationSearching as GpsIcon,
  Assessment as ReportIcon,
  AssignmentTurnedIn as EvalIcon,
  EditCalendar as ManualAttendanceIcon,
  FactCheck as RegularizeTabIcon,
  HistoryEdu as AuditIcon,
  EventNote as HolidayIcon,
  Lock as LockIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import toast, { muiToast } from '../utils/muiToast';
import { adminAPI, workDoneAPI, leavesAPI, reportsAPI, evaluationsAPI, attendanceAPI, communicationsAPI } from '../services/api';
import EmployeeReportViewer from '../components/EmployeeReportViewer';
import SelfEvaluationViewer from '../components/SelfEvaluationViewer';
import WeeklyReportsViewer from '../components/WeeklyReportsViewer';
import TaskTrackerBoard from '../components/TaskTrackerBoard';
import AdminStaffTimesheets from '../components/AdminStaffTimesheets';
import { MetricCardsSkeleton, TableRowsSkeleton, DocumentViewerSkeleton } from '../components/SkeletonLoaders';
import { format } from 'date-fns';

const REJECTION_TEMPLATES = [
  'Operational crunch / critical project sprint milestone in progress',
  'Insufficient leave quota balance available for requested duration',
  'Prior overlapping team coverage required on scheduled date',
  'Timestamp discrepancy — please resubmit with verified punch hours',
  'Prior manager pre-alignment required before formal submission'
];

export default function AdminDashboard({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (typeof initialTab === 'number') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [liveData, setLiveData] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [leaveSubTab, setLeaveSubTab] = useState(0); // 0 = Full Leaves, 1 = Short Permissions
  const [selectedTimesheetEmpId, setSelectedTimesheetEmpId] = useState('');

  // Professional Rejection Modal State
  const [openRejectionModal, setOpenRejectionModal] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState(null); // { type: 'leave' | 'permission' | 'regularization', item: object }
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Manual Attendance Override Modal
  const [openManualAttendanceModal, setOpenManualAttendanceModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    employee_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    login_time: '09:30',
    logout_time: '18:30',
    status: 'Present',
    reason: ''
  });

  // Regularization Review Modal
  const [openResolveModal, setOpenResolveModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [resolveAction, setResolveAction] = useState('Approved');
  const [resolveRemarks, setResolveRemarks] = useState('');

  // Add Employee Modal
  const [openEmpModal, setOpenEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: 'Software Engineering',
    designation: 'Software Developer'
  });

  // Settings (read-only geofence from ENV)
  const [settingsForm, setSettingsForm] = useState({
    officeLatitude: '',
    officeLongitude: '',
    officeRadiusMeters: 150
  });

  // Holidays state
  const [holidays, setHolidays] = useState([]);
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '', type: 'Public Holiday' });
  const [addingHoliday, setAddingHoliday] = useState(false);

  // Individual Employee Full Report Modal (Without AI)
  const [openEmpReportModal, setOpenEmpReportModal] = useState(false);
  const [selectedReportEmpId, setSelectedReportEmpId] = useState('');
  const [reportMonth, setReportMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [empReportData, setEmpReportData] = useState(null);
  const [loadingEmpReport, setLoadingEmpReport] = useState(false);

  // Self-Evaluation Viewer Modal
  const [selectedEval, setSelectedEval] = useState(null);
  const [openEvalModal, setOpenEvalModal] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [liveRes, tasksRes, leavesRes, permsRes, empRes, evalRes, settingsRes, regRes, logsRes, weeklyRes, holidaysRes] = await Promise.all([
        adminAPI.getLiveStatus().catch(() => ({ data: null })),
        workDoneAPI.getAllTasks().catch(() => ({ data: { tasks: [] } })),
        leavesAPI.getAllLeaves().catch(() => ({ data: { leaves: [] } })),
        leavesAPI.getAllPermissions().catch(() => ({ data: { permissions: [] } })),
        adminAPI.getEmployees().catch(() => ({ data: { employees: [] } })),
        evaluationsAPI.getAllEvaluations().catch(() => ({ data: { evaluations: [] } })),
        adminAPI.getSettings().catch(() => ({ data: {} })),
        communicationsAPI.getRequests().catch(() => ({ data: { requests: [] } })),
        communicationsAPI.getLogs().catch(() => ({ data: { logs: [] } })),
        evaluationsAPI.getAllWeekly().catch(() => ({ data: { reports: [] } })),
        adminAPI.getHolidays().catch(() => ({ data: { holidays: [] } }))
      ]);

      if (liveRes?.data) setLiveData(liveRes.data);
      if (tasksRes?.data?.tasks) setAllTasks(tasksRes.data.tasks);
      if (leavesRes?.data?.leaves) setAllLeaves(leavesRes.data.leaves);
      if (permsRes?.data?.permissions) setAllPermissions(permsRes.data.permissions);
      if (empRes?.data?.employees) {
        setEmployees(empRes.data.employees);
        if (!manualForm.employee_id && empRes.data.employees.length > 0) {
          setManualForm(prev => ({ ...prev, employee_id: empRes.data.employees[0].id }));
        }
      }
      if (evalRes?.data?.evaluations) setEvaluations(evalRes.data.evaluations);
      if (weeklyRes?.data?.reports) setWeeklyReports(weeklyRes.data.reports);
      if (regRes?.data?.requests) setRegularizations(regRes.data.requests);
      if (logsRes?.data?.logs) setAuditLogs(logsRes.data.logs);
      if (settingsRes?.data?.geofence) setSettingsForm(settingsRes.data.geofence);
      if (holidaysRes?.data?.holidays) setHolidays(holidaysRes.data.holidays);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleManualAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.employee_id || !manualForm.date || !manualForm.login_time || !manualForm.reason.trim()) {
      toast.error('Please fill all required fields and provide management reason.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await attendanceAPI.adminOverride(manualForm);
      toast.success(res.data.message || 'Manual attendance recorded successfully!');
      setOpenManualAttendanceModal(false);
      setManualForm({
        employee_id: employees[0]?.id || '',
        date: format(new Date(), 'yyyy-MM-dd'),
        login_time: '09:30',
        logout_time: '18:30',
        status: 'Present',
        reason: ''
      });
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record manual attendance.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveRequest = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    setActionLoading(true);
    try {
      const res = await communicationsAPI.resolveRequest({
        request_id: selectedReq.id,
        action: resolveAction,
        review_remarks: resolveRemarks
      });
      toast.success(res.data.message || `Request ${resolveAction.toLowerCase()} successfully!`);
      setOpenResolveModal(false);
      setSelectedReq(null);
      setResolveRemarks('');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEmployeeReport = async (empId) => {
    setSelectedReportEmpId(empId);
    setOpenEmpReportModal(true);
    setLoadingEmpReport(true);
    try {
      const res = await reportsAPI.getEmployeeFullReport({
        employee_id: empId,
        month_year: reportMonth
      });
      setEmpReportData(res.data);
    } catch (err) {
      toast.error('Error fetching employee report.');
    } finally {
      setLoadingEmpReport(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await adminAPI.createEmployee(empForm);
      toast.success(`Employee "${empForm.name}" registered successfully!`);
      setOpenEmpModal(false);
      setEmpForm({
        name: '',
        email: '',
        password: 'password123',
        role: 'employee',
        department: 'Software Engineering',
        designation: 'Software Developer'
      });
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create employee.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejection = (type, item) => {
    setRejectionTarget({ type, item });
    setRejectionReasonText('');
    setOpenRejectionModal(true);
  };

  const handleConfirmRejection = async (e) => {
    e.preventDefault();
    if (!rejectionReasonText.trim()) {
      toast.error('Please provide a specific justification reason or select a template.');
      return;
    }
    if (!rejectionTarget) return;
    setActionLoading(true);
    try {
      if (rejectionTarget.type === 'leave') {
        await leavesAPI.updateStatus(rejectionTarget.item.id, 'Rejected', rejectionReasonText);
        toast.success('Leave request declined and professional email dispatched to employee.');
      } else if (rejectionTarget.type === 'permission') {
        await leavesAPI.updatePermissionStatus(rejectionTarget.item.id, 'Rejected', rejectionReasonText);
        toast.success('Permission pass declined and professional email dispatched to employee.');
      } else if (rejectionTarget.type === 'regularization') {
        await communicationsAPI.resolveRequest({
          request_id: rejectionTarget.item.id,
          action: 'Rejected',
          review_remarks: rejectionReasonText
        });
        toast.success('Regularization declined and professional email dispatched to employee.');
      }
      setOpenRejectionModal(false);
      setRejectionTarget(null);
      setRejectionReasonText('');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process rejection.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveAction = async (id, status) => {
    try {
      await leavesAPI.updateStatus(id, status);
      toast.success(`Leave application approved successfully.`);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update leave.');
    }
  };

  const handlePermissionAction = async (id, status) => {
    try {
      await leavesAPI.updatePermissionStatus(id, status);
      toast.success(`Permission pass approved successfully.`);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update permission.');
    }
  };

  const counts = liveData?.counts || { totalStaff: 0, present: 0, punchedOut: 0, absent: 0 };
  const board = liveData?.board || [];

  const getStatusChip = (status) => {
    if (status === 'Present & Working') {
      return <Chip icon={<PresentIcon fontSize="small" />} label="Present & Working" color="success" size="small" sx={{ fontWeight: 700 }} />;
    }
    if (status === 'Punched Out') {
      return <Chip label="Punched Out" color="secondary" size="small" sx={{ fontWeight: 700 }} />;
    }
    return <Chip icon={<AbsentIcon fontSize="small" />} label="Absent Today" color="default" size="small" sx={{ fontWeight: 700 }} />;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Executive Management Portal
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
            Real-time Office Presence, Work Submissions, Leaves & Performance Appraisals
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ManualAttendanceIcon />}
            onClick={() => setOpenManualAttendanceModal(true)}
            sx={{ fontWeight: 700, borderRadius: '4px' }}
          >
            Manual Attendance
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
            disabled={loading}
            sx={{ borderRadius: '4px' }}
          >
            Refresh Data
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SettingsIcon />}
            onClick={() => setActiveTab(10)}
            sx={{ fontWeight: 600, borderRadius: '4px' }}
          >
            Geofence Setup
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddPersonIcon />}
            onClick={() => setOpenEmpModal(true)}
            sx={{ fontWeight: 700, borderRadius: '4px' }}
          >
            Add Staff
          </Button>
        </Box>
      </Box>

      {/* Live Presence Metric KPI Cards (4 Clean 3-col Grid) */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '4px' }}>
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>TOTAL STAFF</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>
                {counts.totalStaff}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #059669', borderRadius: '4px' }}>
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>PRESENT IN OFFICE</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#059669' }}>
                {counts.present}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #0891b2', borderRadius: '4px' }}>
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#0891b2', fontWeight: 700 }}>PUNCHED OUT</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#0891b2' }}>
                {counts.punchedOut}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #64748b', borderRadius: '4px' }}>
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>ABSENT TODAY</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'text.secondary' }}>
                {counts.absent}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Dashboard Sub-Views */}
      <Card sx={{ mb: 4, borderRadius: '4px' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Live Presence Board" icon={<PeopleIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label="Task Assign & Tracking" icon={<TaskIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab
              label={`Regularizations & Edge Cases (${regularizations.filter(r => r.status === 'Pending').length})`}
              icon={<RegularizeTabIcon />}
              iconPosition="start"
              sx={{ fontWeight: 700, color: regularizations.filter(r => r.status === 'Pending').length > 0 ? '#b45309' : 'inherit' }}
            />
            <Tab label={`Team Work Done (${allTasks.length})`} icon={<TaskIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label={`Leave Requests (${allLeaves.filter(l => l.status === 'Pending').length})`} icon={<LeaveIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label={`Monthly Self-Evaluations (${evaluations.length})`} icon={<EvalIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label={`Weekly Check-ins (${weeklyReports.length})`} icon={<ReportIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label="Staff Day-Wise Timesheets" icon={<ReportIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label={`Staff Directory (${employees.length})`} icon={<PeopleIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label={`Audit & Communications (${auditLogs.length})`} icon={<AuditIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label={`Holidays & Calendar (${holidays.length})`} icon={<HolidayIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* TAB 0: Live Presence Board */}
          {activeTab === 0 && (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee Name</TableCell>
                    <TableCell>Department / Designation</TableCell>
                    <TableCell>Current Live Status</TableCell>
                    <TableCell>Punch In</TableCell>
                    <TableCell>Punch Out</TableCell>
                    <TableCell>Net Working Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {board.map((emp) => (
                    <TableRow key={emp.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{emp.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{emp.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{emp.designation}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{emp.department}</Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(emp.statusToday)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{emp.loginTime || '--:--'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{emp.logoutTime || '--:--'}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {emp.netHours ? `${emp.netHours} hrs` : '--'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* TAB 1: Team Task Assign & Tracking */}
          {activeTab === 1 && (
            <TaskTrackerBoard />
          )}

          {/* TAB 2: Regularizations & Edge Case Requests */}
          {activeTab === 2 && (
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Employee Punch Correction & Edge Case Requests
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ManualAttendanceIcon />}
                  onClick={() => setOpenManualAttendanceModal(true)}
                  sx={{ fontWeight: 700, borderRadius: '4px', bgcolor: '#133829' }}
                >
                  New Manual Override Entry
                </Button>
              </Box>

              {regularizations.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No regularization or edge case requests pending.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Staff Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Requested Times</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reason / Explanation</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Management Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {regularizations.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{r.employee_name || r.employee_id}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{r.date}</TableCell>
                        <TableCell>
                          <strong>{r.requested_login_time}</strong> to <strong>{r.requested_logout_time || 'End of Day'}</strong>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 280, color: '#475569', fontSize: 13 }}>
                          {r.reason}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.status}
                            color={r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'error' : 'warning'}
                            size="small"
                            sx={{ fontWeight: 800, borderRadius: '4px' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {r.status === 'Pending' ? (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={() => {
                                  setSelectedReq(r);
                                  setResolveAction('Approved');
                                  setResolveRemarks('Verified and regularized.');
                                  setOpenResolveModal(true);
                                }}
                                sx={{ fontWeight: 700, borderRadius: '4px' }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<RejectIcon />}
                                onClick={() => handleOpenRejection('regularization', r)}
                                sx={{ fontWeight: 700, borderRadius: '4px' }}
                              >
                                Reject
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                              {r.status} by {r.reviewed_by_name || 'Admin'}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}

          {/* TAB 3: Team Work Done */}
          {activeTab === 3 && (
            <Box sx={{ overflowX: 'auto' }}>
              {allTasks.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No tasks recorded by employees yet.
                </Typography>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Employee</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell>Task Title & Description</TableCell>
                      <TableCell>Est / Act Hours</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allTasks.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>{t.date}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t.employee_name || t.employee_id}</TableCell>
                        <TableCell>
                          <Chip label={t.project_name} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: '4px' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.task_title}</Typography>
                          {t.description && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {t.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <strong>{t.estimated_hours}h</strong> est / <strong>{t.actual_hours}h</strong> act
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t.status}
                            color={t.status === 'Completed' ? 'success' : t.status === 'In-Progress' ? 'primary' : 'warning'}
                            size="small"
                            sx={{ fontWeight: 700, borderRadius: '4px' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}

          {/* TAB 4: Leave & Permission Approvals */}
          {activeTab === 4 && (
            <Box>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={leaveSubTab} onChange={(e, val) => setLeaveSubTab(val)}>
                  <Tab
                    label={`Full Day Leaves (${allLeaves.filter(l => l.status === 'Pending').length} Pending)`}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  />
                  <Tab
                    label={`Short 2-Hour Passes (${allPermissions.filter(p => p.status === 'Pending').length} Pending)`}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  />
                </Tabs>
              </Box>

              {leaveSubTab === 0 ? (
                <Box sx={{ overflowX: 'auto' }}>
                  {allLeaves.length === 0 ? (
                    <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No full-day leave applications submitted.
                    </Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Total Days</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reason / Feedback</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Management Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allLeaves.map((l) => (
                          <TableRow key={l.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{l.employee_name || l.employee_id}</TableCell>
                            <TableCell><Chip label={l.leave_type} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: '4px' }} /></TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{l.start_date} to {l.end_date}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{l.total_days} day(s)</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: 13, maxWidth: 240 }}>
                              <div>{l.reason}</div>
                              {l.review_remarks && (
                                <Typography variant="caption" sx={{ color: l.status === 'Rejected' ? '#dc2626' : '#059669', fontWeight: 600, display: 'block', mt: 0.5 }}>
                                  Remarks: {l.review_remarks}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip label={l.status} color={l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'error' : 'warning'} size="small" sx={{ fontWeight: 700, borderRadius: '4px' }} />
                            </TableCell>
                            <TableCell align="right">
                              {l.status === 'Pending' ? (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => handleLeaveAction(l.id, 'Approved')} sx={{ borderRadius: '4px', fontWeight: 700 }}>
                                    Approve
                                  </Button>
                                  <Button size="small" variant="outlined" color="error" startIcon={<RejectIcon />} onClick={() => handleOpenRejection('leave', l)} sx={{ borderRadius: '4px', fontWeight: 700 }}>
                                    Reject
                                  </Button>
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Reviewed by {l.reviewed_by || 'Admin'}</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  {allPermissions.length === 0 ? (
                    <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No short permission pass requests submitted.
                    </Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Time Window</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reason / Feedback</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Management Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allPermissions.map((p) => (
                          <TableRow key={p.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{p.employee_name || p.employee_id}</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{p.date}</TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{p.start_time} - {p.end_time}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{p.duration_hours} hrs</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: 13, maxWidth: 240 }}>
                              <div>{p.reason}</div>
                              {p.review_remarks && (
                                <Typography variant="caption" sx={{ color: p.status === 'Rejected' ? '#dc2626' : '#059669', fontWeight: 600, display: 'block', mt: 0.5 }}>
                                  Remarks: {p.review_remarks}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip label={p.status} color={p.status === 'Approved' ? 'success' : p.status === 'Rejected' ? 'error' : 'warning'} size="small" sx={{ fontWeight: 700, borderRadius: '4px' }} />
                            </TableCell>
                            <TableCell align="right">
                              {p.status === 'Pending' ? (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => handlePermissionAction(p.id, 'Approved')} sx={{ borderRadius: '4px', fontWeight: 700 }}>
                                    Approve
                                  </Button>
                                  <Button size="small" variant="outlined" color="error" startIcon={<RejectIcon />} onClick={() => handleOpenRejection('permission', p)} sx={{ borderRadius: '4px', fontWeight: 700 }}>
                                    Reject
                                  </Button>
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Reviewed by {p.reviewed_by || 'Admin'}</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* TAB 5: Staff Monthly Self-Evaluations */}
          {activeTab === 5 && (
            <Box sx={{ overflowX: 'auto' }}>
              {evaluations.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No staff monthly self-evaluations submitted yet.
                </Typography>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Month / Period</TableCell>
                      <TableCell>Self-Rating</TableCell>
                      <TableCell>Targets Count</TableCell>
                      <TableCell>Submission Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Full 13-Section Appraisal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evaluations.map((ev) => (
                      <TableRow key={ev.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{ev.employee_name}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{ev.designation} • {ev.department}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{ev.review_month}</TableCell>
                        <TableCell>
                          <Chip label={`${ev.overall_rating || '4.5'} / 5.0 ⭐`} size="small" color="primary" sx={{ fontWeight: 800, borderRadius: '4px' }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{ev.targets_tasks?.length || 0} Targets</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{ev.submission_date}</TableCell>
                        <TableCell>
                          <Chip label={ev.status || 'Submitted'} size="small" color="success" sx={{ fontWeight: 700, borderRadius: '4px' }} />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<EvalIcon />}
                            onClick={() => {
                              setSelectedEval(ev);
                              setOpenEvalModal(true);
                            }}
                            sx={{ fontWeight: 700, borderRadius: '4px' }}
                          >
                            Review Appraisal
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}

          {/* TAB 6: Weekly Check-ins */}
          {activeTab === 6 && (
            <WeeklyReportsViewer reports={weeklyReports} isAdmin={true} />
          )}

          {/* TAB 7: Staff Day-Wise Attendance Timesheets */}
          {activeTab === 7 && (
            <AdminStaffTimesheets
              initialEmployeeId={selectedTimesheetEmpId}
              employees={employees}
              onRefreshParent={fetchDashboardData}
            />
          )}

          {/* TAB 8: Staff Directory */}
          {activeTab === 8 && (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Emp ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{e.id}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{e.name}</TableCell>
                      <TableCell>{e.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={e.role?.toUpperCase()}
                          size="small"
                          color={e.role === 'admin' ? 'primary' : 'secondary'}
                          variant="outlined"
                          sx={{ fontWeight: 700, borderRadius: '4px' }}
                        />
                      </TableCell>
                      <TableCell>{e.department}</TableCell>
                      <TableCell>{e.designation}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setSelectedTimesheetEmpId(e.id);
                              setActiveTab(7);
                            }}
                            sx={{
                              fontWeight: 700,
                              borderRadius: '4px',
                              bgcolor: '#133829',
                              color: '#fff',
                              '&:hover': { bgcolor: '#0f291e' }
                            }}
                          >
                            Timesheet
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<ReportIcon />}
                            onClick={() => handleOpenEmployeeReport(e.id)}
                            sx={{ fontWeight: 700, borderRadius: '4px' }}
                          >
                            Full Report
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* TAB 9: Audit & Communications Trail */}
          {activeTab === 9 && (
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Management & Staff Communications Audit Trail
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  All administrative overrides, regularizations, and notifications are permanently logged for compliance.
                </Typography>
              </Box>

              {auditLogs.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No communication logs recorded yet.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Action / Event Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Author / Sender</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Recipient</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Official Message & Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLogs.map((l) => (
                      <TableRow key={l.id} hover>
                        <TableCell sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {l.created_at ? format(new Date(l.created_at), 'dd MMM yyyy, HH:mm') : '--'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={l.type || 'LOG'}
                            size="small"
                            color={l.type?.includes('OVERRIDE') ? 'error' : l.type?.includes('APPROVED') ? 'success' : 'primary'}
                            sx={{ fontWeight: 800, fontSize: 10, borderRadius: '4px' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{l.sender_name || l.sender_id}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{l.recipient_name || l.recipient_id}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: '#334155' }}>
                          <strong>{l.subject}</strong> — {l.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* TAB 10: Holiday & Calendar Manager */}
      {activeTab === 10 && (
        <Card sx={{ mb: 4, borderRadius: '4px' }}>
          <CardContent sx={{ p: 3 }}>

            {/* Read-Only Geofence Info */}
            <Box sx={{ mb: 4, p: 2.5, borderRadius: '4px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <LockIcon sx={{ fontSize: 18, color: '#6d28d9' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>Office Geofence (Read-Only)</Typography>
                <Chip label="Configured via .env only" size="small" sx={{ fontWeight: 700, bgcolor: '#ede9fe', color: '#6d28d9', borderRadius: '4px', fontSize: 11 }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                Geofence coordinates can only be changed by editing <strong>OFFICE_LATITUDE</strong>, <strong>OFFICE_LONGITUDE</strong>, and <strong>OFFICE_RADIUS_METERS</strong> in the backend <code>.env</code> file and restarting the server.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>LATITUDE</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#133829', fontFamily: 'monospace' }}>{settingsForm.officeLatitude || '--'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>LONGITUDE</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#133829', fontFamily: 'monospace' }}>{settingsForm.officeLongitude || '--'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>ALLOWED RADIUS</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#133829', fontFamily: 'monospace' }}>{settingsForm.officeRadiusMeters || 150}m</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Holiday Manager */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>Holidays & Non-Working Days</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>All Sundays are automatically non-working. Add public holidays or company off-days below.</Typography>
              </Box>
            </Box>

            {/* Add Holiday Form */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <TextField
                size="small"
                type="date"
                label="Date"
                InputLabelProps={{ shrink: true }}
                value={holidayForm.date}
                onChange={e => setHolidayForm(p => ({ ...p, date: e.target.value }))}
                sx={{ minWidth: 160 }}
              />
              <TextField
                size="small"
                label="Holiday Name"
                placeholder="e.g. Diwali, Independence Day"
                value={holidayForm.name}
                onChange={e => setHolidayForm(p => ({ ...p, name: e.target.value }))}
                sx={{ minWidth: 220, flex: 1 }}
              />
              <TextField
                size="small"
                select
                label="Type"
                value={holidayForm.type}
                onChange={e => setHolidayForm(p => ({ ...p, type: e.target.value }))}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="Public Holiday">Public Holiday</MenuItem>
                <MenuItem value="Company Off-Day">Company Off-Day</MenuItem>
                <MenuItem value="Restricted Holiday">Restricted Holiday</MenuItem>
              </TextField>
              <Button
                variant="contained"
                startIcon={addingHoliday ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                disabled={addingHoliday || !holidayForm.date || !holidayForm.name.trim()}
                onClick={async () => {
                  setAddingHoliday(true);
                  try {
                    const res = await adminAPI.addHoliday(holidayForm);
                    toast.success(res.data.message);
                    setHolidays(prev => [...prev, res.data.holiday].sort((a, b) => a.date > b.date ? 1 : -1));
                    setHolidayForm({ date: '', name: '', type: 'Public Holiday' });
                  } catch (err) {
                    toast.error(err.response?.data?.error || 'Failed to add holiday.');
                  } finally { setAddingHoliday(false); }
                }}
                sx={{ fontWeight: 700, borderRadius: '4px', bgcolor: '#133829', whiteSpace: 'nowrap' }}
              >
                Add Holiday
              </Button>
            </Box>

            {/* Sunday info chip */}
            <Alert severity="info" sx={{ mb: 2, borderRadius: '4px', fontWeight: 600 }}>
              📅 <strong>All Sundays</strong> are automatically treated as non-working days — they appear as "Sunday" in timesheets and block check-in.
            </Alert>

            {/* Holidays Table */}
            {holidays.length === 0 ? (
              <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No custom holidays defined yet. Add one above.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Holiday Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Added By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holidays.map(h => (
                    <TableRow key={h.id || h.date} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{h.date}</TableCell>
                      <TableCell>
                        <Chip label={h.name} size="small" sx={{ fontWeight: 700, bgcolor: '#ede9fe', color: '#6d28d9', borderRadius: '4px' }} />
                      </TableCell>
                      <TableCell sx={{ color: '#64748b', fontSize: 13 }}>{h.type}</TableCell>
                      <TableCell sx={{ color: '#64748b', fontSize: 13 }}>{h.created_by || '--'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title={`Remove ${h.name}`}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={async () => {
                                try {
                                  await adminAPI.deleteHoliday(h.date);
                                  toast.success(`Holiday "${h.name}" removed.`);
                                  setHolidays(prev => prev.filter(x => x.date !== h.date));
                                } catch (err) {
                                  toast.error(err.response?.data?.error || 'Failed to remove holiday.');
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

          </CardContent>
        </Card>
      )}

      {/* Add Employee Modal */}
      <Dialog open={openEmpModal} onClose={() => setOpenEmpModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateEmployee}>
          <DialogTitle sx={{ fontWeight: 700 }}>Register New Staff Member</DialogTitle>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2, borderRadius: '4px', fontWeight: 600 }}>
              🔐 <strong>OTP Login Secured</strong>: New employees will authenticate directly using Email OTP. No initial passwords required.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Full Name" required value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="email" label="Email Address" required value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth select label="System Role" value={empForm.role} onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}>
                  <MenuItem value="employee">Employee / Staff</MenuItem>
                  <MenuItem value="admin">Admin / HR Manager</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Department" value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Designation" value={empForm.designation} onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenEmpModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={actionLoading} sx={{ fontWeight: 700 }}>
              {actionLoading ? 'Creating...' : 'Register Employee'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>


      {/* Individual Employee Full Report Modal (Without AI) */}
      <Dialog open={openEmpReportModal} onClose={() => setOpenEmpReportModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportIcon color="primary" /> Individual Staff Timesheet & Performance Report
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField size="small" type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Button size="small" variant="contained" onClick={() => handleOpenEmployeeReport(selectedReportEmpId)} disabled={loadingEmpReport}>
              {loadingEmpReport ? 'Loading...' : 'Refresh'}
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          {loadingEmpReport ? (
            <DocumentViewerSkeleton />
          ) : empReportData ? (
            <EmployeeReportViewer reportData={empReportData} />
          ) : (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No report data available for the selected period.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEmpReportModal(false)} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Self-Evaluation Document Viewer Modal for Admin */}
      <Dialog open={openEvalModal} onClose={() => setOpenEvalModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Staff Monthly Self-Evaluation Appraisal
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          <SelfEvaluationViewer evaluation={selectedEval} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEvalModal(false)} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Manual Attendance Override Modal */}
      <Dialog
        open={openManualAttendanceModal}
        onClose={() => setOpenManualAttendanceModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '4px' } }}
      >
        <form onSubmit={handleManualAttendanceSubmit}>
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ManualAttendanceIcon sx={{ color: '#133829' }} />
            Manual Attendance Entry / Override
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px' }}>
              <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600, display: 'block' }}>
                ⚠️ This administrative action directly records or updates employee attendance in company records. A mandatory audit reason is required.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  required
                  size="small"
                  label="Select Staff Member"
                  value={manualForm.employee_id}
                  onChange={(e) => setManualForm({ ...manualForm, employee_id: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id} sx={{ fontSize: 13, borderRadius: '4px' }}>
                      {emp.name} ({emp.id} • {emp.department})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  type="date"
                  label="Attendance Date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  size="small"
                  label="Attendance Status"
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                >
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Late">Late</MenuItem>
                  <MenuItem value="Half Day">Half Day</MenuItem>
                  <MenuItem value="Field Duty / On-Duty">Field Duty / On-Duty</MenuItem>
                  <MenuItem value="Regularized">Regularized</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  type="time"
                  label="Login Time"
                  value={manualForm.login_time}
                  onChange={(e) => setManualForm({ ...manualForm, login_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  label="Logout Time"
                  value={manualForm.logout_time}
                  onChange={(e) => setManualForm({ ...manualForm, logout_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={3}
                  size="small"
                  label="Management Justification & Reason"
                  placeholder="e.g. Approved field duty at client site / Device GPS malfunction verified..."
                  value={manualForm.reason}
                  onChange={(e) => setManualForm({ ...manualForm, reason: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenManualAttendanceModal(false)} color="inherit" sx={{ borderRadius: '4px' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading}
              sx={{
                fontWeight: 700,
                borderRadius: '4px',
                bgcolor: '#133829',
                '&:hover': { bgcolor: '#0b2319' }
              }}
            >
              {actionLoading ? 'Saving...' : 'Record Attendance Override'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Resolve Regularization Modal */}
      <Dialog
        open={openResolveModal}
        onClose={() => setOpenResolveModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '4px' } }}
      >
        <form onSubmit={handleResolveRequest}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            Resolve Employee Regularization Request
          </DialogTitle>
          <DialogContent dividers>
            {selectedReq && (
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {selectedReq.employee_name} ({selectedReq.employee_id})
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                  Date: <strong>{selectedReq.date}</strong> • Requested: <strong>{selectedReq.requested_login_time}</strong> to <strong>{selectedReq.requested_logout_time || '--'}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', bgcolor: '#ffffff', p: 1, border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  "{selectedReq.reason}"
                </Typography>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Decision Action"
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                >
                  <MenuItem value="Approved">Approve & Regularize Attendance</MenuItem>
                  <MenuItem value="Rejected">Reject Request</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Review Remarks & Feedback"
                  value={resolveRemarks}
                  onChange={(e) => setResolveRemarks(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenResolveModal(false)} color="inherit" sx={{ borderRadius: '4px' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color={resolveAction === 'Approved' ? 'success' : 'error'}
              disabled={actionLoading}
              sx={{ fontWeight: 700, borderRadius: '4px' }}
            >
              {actionLoading ? 'Updating...' : `Confirm ${resolveAction}`}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Professional Management Rejection Dialog */}
      <Dialog
        open={openRejectionModal}
        onClose={() => setOpenRejectionModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }
        }}
      >
        <form onSubmit={handleConfirmRejection}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, bgcolor: '#fef2f2', borderBottom: '1px solid #fee2e2' }}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: '4px',
              bgcolor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RejectIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#991b1b' }}>
                Decline & Send Professional Response
              </Typography>
              <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                Dispatches an official notification email to the employee via Hostinger Mail
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3 }}>
            {rejectionTarget && (
              <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {rejectionTarget.item.employee_name || rejectionTarget.item.employee_id}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                  {rejectionTarget.type === 'leave' && `Leave Request: ${rejectionTarget.item.leave_type} (${rejectionTarget.item.start_date} to ${rejectionTarget.item.end_date} • ${rejectionTarget.item.total_days} days)`}
                  {rejectionTarget.type === 'permission' && `Permission Pass: ${rejectionTarget.item.date} (${rejectionTarget.item.start_time} - ${rejectionTarget.item.end_time} • ${rejectionTarget.item.duration_hours} hrs)`}
                  {rejectionTarget.type === 'regularization' && `Attendance Regularization: ${rejectionTarget.item.date} (${rejectionTarget.item.requested_login_time} to ${rejectionTarget.item.requested_logout_time || 'EOD'})`}
                </Typography>
                {rejectionTarget.item.reason && (
                  <Typography variant="body2" sx={{ mt: 1, color: '#475569', fontSize: 13, fontStyle: 'italic', bgcolor: '#ffffff', p: 1, border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    Employee Reason: "{rejectionTarget.item.reason}"
                  </Typography>
                )}
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              Quick Professional Response Templates:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2.5 }}>
              {REJECTION_TEMPLATES.map((tmpl, idx) => (
                <Chip
                  key={idx}
                  label={tmpl}
                  size="small"
                  onClick={() => setRejectionReasonText(tmpl)}
                  sx={{
                    borderRadius: '4px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    bgcolor: rejectionReasonText === tmpl ? '#fee2e2' : '#f1f5f9',
                    color: rejectionReasonText === tmpl ? '#991b1b' : '#334155',
                    border: '1px solid',
                    borderColor: rejectionReasonText === tmpl ? '#fca5a5' : '#e2e8f0',
                    '&:hover': { bgcolor: '#fee2e2', borderColor: '#fca5a5' }
                  }}
                />
              ))}
            </Box>

            <TextField
              fullWidth
              required
              multiline
              rows={3}
              size="small"
              label="Management Feedback / Justification (Mandatory)"
              placeholder="Provide a clear, professional explanation to be delivered to the employee's work email..."
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setOpenRejectionModal(false)} color="inherit" sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading || !rejectionReasonText.trim()}
              sx={{
                borderRadius: '4px',
                bgcolor: '#ef4444',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                '&:hover': { bgcolor: '#dc2626' }
              }}
            >
              {actionLoading ? 'Dispatching...' : 'Decline & Dispatch Official Notice'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}
