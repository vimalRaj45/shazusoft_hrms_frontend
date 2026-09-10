import React, { useState, useEffect } from 'react';
import {
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
  Tooltip,
  InputAdornment
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
  LocationOn as LocationIcon,
  Assessment as ReportIcon,
  AssignmentTurnedIn as EvalIcon,
  EditCalendar as ManualAttendanceIcon,
  FactCheck as RegularizeTabIcon,
  HistoryEdu as AuditIcon,
  EventNote as HolidayIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Description as DocumentIcon,
  Visibility as ViewIcon,
  AccountBalance as BankIcon,
  ContactPhone as EmergencyIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Payments as PayrollIcon,
  Campaign as MemoIcon,
  Star as StarIcon,
  Upgrade as UpgradeIcon
} from '@mui/icons-material';
import BriefcaseIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import toast, { muiToast } from '../utils/muiToast';
import { adminAPI, workDoneAPI, leavesAPI, reportsAPI, evaluationsAPI, attendanceAPI, communicationsAPI, payrollAPI } from '../services/api';
import { formatINR } from '../utils/payslipGenerator';
import EmployeeReportViewer from '../components/EmployeeReportViewer';
import SelfEvaluationViewer from '../components/SelfEvaluationViewer';
import WeeklyReportsViewer from '../components/WeeklyReportsViewer';
import TaskTrackerBoard from '../components/TaskTrackerBoard';
import AdminStaffTimesheets from '../components/AdminStaffTimesheets';
import AdminPayrollManagement from '../components/AdminPayrollManagement';
import AdminMemoManagement from '../components/AdminMemoManagement';
import GeofencePunch from '../components/GeofencePunch';
import TimePicker12h from '../components/TimePicker12h';
import { MetricCardsSkeleton, TableRowsSkeleton, DocumentViewerSkeleton } from '../components/SkeletonLoaders';
import { format } from 'date-fns';
import { formatTime12h } from '../utils/timeUtils';

const REJECTION_TEMPLATES = [
  'Operational crunch / critical project sprint milestone in progress',
  'Insufficient leave quota balance available for requested duration',
  'Prior overlapping team coverage required on scheduled date',
  'Timestamp discrepancy — please resubmit with verified punch hours',
  'Prior manager pre-alignment required before formal submission'
];

const SECTION_META = [
  { id: 0, title: 'Live Presence Board', subtitle: 'Workforce live presence, geofence status, and punch timestamps', category: 'Daily Operations' },
  { id: 1, title: 'Team Task Assignment', subtitle: 'Assign tasks, monitor milestone deadlines, and progress oversight', category: 'Daily Operations' },
  { id: 2, title: 'Attendance Regularizations', subtitle: 'Review and approve missing punch regularization requests', category: 'Daily Operations' },
  { id: 3, title: 'Team Work Done Logs', subtitle: 'Daily work reports and task deliverable logs across company projects', category: 'Daily Operations' },
  { id: 4, title: 'Leaves & Short Permissions', subtitle: 'Approve or reject full-day leave applications and short permission passes', category: 'Approvals & Timesheets' },
  { id: 5, title: 'Monthly Performance Appraisals', subtitle: '13-section employee self-evaluations and performance reviews', category: 'Approvals & Timesheets' },
  { id: 6, title: 'Weekly Staff Check-ins', subtitle: 'Weekly accomplishment synopses, challenges, and blocker reviews', category: 'Approvals & Timesheets' },
  { id: 7, title: 'Staff Monthly Timesheets', subtitle: 'Detailed monthly attendance history, punctuality, and hours audit', category: 'Approvals & Timesheets' },
  { id: 8, title: 'Staff Directory & Status', subtitle: 'Manage employee profiles, work modes, and account deactivations', category: 'Directory & Settings' },
  { id: 9, title: 'Audit Trail & Security Logs', subtitle: 'System communication logs, resignation audits, and security trail', category: 'Directory & Settings' },
  { id: 10, title: 'Office Timings, Calendar & Geofence', subtitle: 'Office shift hours, late grace cutoff, holidays, and GPS perimeter', category: 'Directory & Settings' },
  { id: 11, title: 'Automated Payroll & Payslips', subtitle: 'Startup salary calculation, Working Sundays inclusion, LOP metrics, and 1-click PDF payslips', category: 'Finance & Remuneration' },
  { id: 12, title: 'Official Memos & Notices', subtitle: 'Issue executive memorandums to individual staff, departments, or entire organization with digital signature tracking', category: 'Corporate Directives & Memos' }
];

export default function AdminDashboard({ initialTab = 0, onTabChange, onStatsUpdate }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof initialTab === 'number') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSelect = (idx) => {
    setActiveTab(idx);
    if (onTabChange) {
      const tabKeys = [
        'admin-live',
        'admin-tasks',
        'admin-regularizations',
        'admin-workdone',
        'admin-leaves',
        'admin-evals',
        'admin-weekly',
        'admin-timesheets',
        'admin-directory',
        'admin-audit',
        'admin-holidays',
        'admin-payroll',
        'admin-memos'
      ];
      onTabChange(tabKeys[idx] || 'admin-live');
    }
  };

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

  // Universal Search & Filter Controls State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterWorkMode, setFilterWorkMode] = useState('ALL');
  const [filterEmployeeStatus, setFilterEmployeeStatus] = useState('ALL');
  const [filterEmploymentType, setFilterEmploymentType] = useState('ALL');

  // Staff Resignation / Soft Delete Modal State
  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateForm, setDeactivateForm] = useState({
    status: 'resigned',
    reason: '',
    effective_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Staff Directory Salary Package Modal State
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [openSalaryModal, setOpenSalaryModal] = useState(false);
  const [selectedSalaryEmp, setSelectedSalaryEmp] = useState(null);
  const [salaryForm, setSalaryForm] = useState({
    monthly_salary: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    pan_number: ''
  });
  const [salarySaving, setSalarySaving] = useState(false);

  // Manager Log Work & Activity Plan State
  const [openLogWorkModal, setOpenLogWorkModal] = useState(false);
  const [logWorkLoading, setLogWorkLoading] = useState(false);
  const [logWorkForm, setLogWorkForm] = useState({
    employee_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    project_name: 'General Operations',
    task_title: '',
    description: '',
    plan: '',
    estimated_hours: '2',
    actual_hours: '2',
    status: 'Completed',
    remarks: ''
  });

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

  // Push pending stats update to parent App component
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate({
        pendingLeaves: allLeaves.filter(l => l.status === 'Pending').length,
        pendingRegs: regularizations.filter(r => r.status === 'Pending').length,
        totalEmployees: employees.length
      });
    }
  }, [allLeaves, regularizations, employees, onStatsUpdate]);
  const [resolveRemarks, setResolveRemarks] = useState('');

  // Add Employee Modal
  const [openEmpModal, setOpenEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: 'Software Engineering',
    designation: 'Software Developer',
    work_mode: 'office',
    employment_type: 'full_time'
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

  // Office Shift Timings & Working Hours state (Staff vs Intern criteria)
  const [timingTab, setTimingTab] = useState('staff');
  const [officeTimings, setOfficeTimings] = useState({
    opening_time: '09:30',
    closing_time: '18:30',
    late_grace_time: '09:45',
    half_day_hours: 4.5,
    full_day_hours: 8.5,
    avg_daily_hours: 8.5,
    intern_opening_time: '10:00',
    intern_closing_time: '16:30',
    intern_late_grace_time: '10:15',
    intern_half_day_hours: 3.0,
    intern_full_day_hours: 6.0,
    intern_avg_daily_hours: 6.0
  });
  const [savingTimings, setSavingTimings] = useState(false);

  const getShiftDuration = (start, end) => {
    if (!start || !end) return '9.0';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? (diff / 60).toFixed(1) : '9.0';
  };

  const getGraceMinutes = (start, grace) => {
    if (!start || !grace) return 15;
    const [sh, sm] = start.split(':').map(Number);
    const [gh, gm] = grace.split(':').map(Number);
    const diff = (gh * 60 + gm) - (sh * 60 + sm);
    return diff >= 0 ? diff : 0;
  };

  const handleSaveOfficeTimings = async (e) => {
    if (e) e.preventDefault();
    setSavingTimings(true);
    try {
      const res = await adminAPI.updateOfficeTimings(officeTimings);
      toast.success(res.data?.message || 'Office shift timings updated successfully!');
      if (res.data?.timings) setOfficeTimings(res.data.timings);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update office shift timings.');
    } finally {
      setSavingTimings(false);
    }
  };

  // Unified Monthly Leave Quotas & Permission Policy state (Same for Staff & Interns)
  const [leavePolicy, setLeavePolicy] = useState({
    casual_leave: 1,
    sick_leave: 1,
    paid_leave: 1,
    monthly_permission_limit: 2,
    max_permission_hours: 2,
    updated_at: null,
    updated_by: ''
  });
  const [savingPolicy, setSavingPolicy] = useState(false);

  const handleSaveLeavePolicy = async (e) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      const res = await adminAPI.updateLeavePolicy(leavePolicy);
      toast.success(res.data?.message || 'Monthly leave policy updated successfully for all staff & interns!');
      if (res.data?.policy) setLeavePolicy(res.data.policy);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update leave policy.');
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleConvertEmploymentType = async (emp) => {
    const isCurrentlyIntern = emp.employment_type === 'internship';
    const newType = isCurrentlyIntern ? 'full_time' : 'internship';

    const confirmed = await muiToast.confirm({
      title: isCurrentlyIntern ? 'Promote Intern to Full-Time Staff' : 'Switch to Internship Track',
      message: isCurrentlyIntern
        ? `Promote "${emp.name}" (${emp.id}) to Full-Time Staff in 1 click? Their classification will be upgraded to Full-Time Staff with standard CTC compensation.`
        : `Switch "${emp.name}" (${emp.id}) to Internship classification?`,
      confirmText: isCurrentlyIntern ? 'Promote to Full-Time Staff' : 'Switch Classification',
      severity: isCurrentlyIntern ? 'success' : 'info'
    });

    if (!confirmed) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.updateEmploymentType(emp.id, { employment_type: newType });
      toast.success(res.data?.message || `Successfully updated classification for ${emp.name}!`);
      if (res.data?.employee) {
        setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, ...res.data.employee } : e));
      } else {
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update employment classification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleWorkMode = async (empId, currentMode) => {
    const newMode = currentMode === 'wfh' ? 'office' : 'wfh';
    setActionLoading(true);
    try {
      const res = await adminAPI.updateWorkMode(empId, newMode);
      toast.success(res.data.message || `Work mode changed to ${newMode.toUpperCase()}`);
      setEmployees(prev => prev.map(e => e.id === empId ? { ...e, work_mode: newMode } : e));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update work mode.');
    } finally {
      setActionLoading(false);
    }
  };

  // Individual Employee Full Report Modal (Without AI)
  const [openEmpReportModal, setOpenEmpReportModal] = useState(false);
  const [selectedReportEmpId, setSelectedReportEmpId] = useState('');
  const [reportMonth, setReportMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [empReportData, setEmpReportData] = useState(null);
  const [loadingEmpReport, setLoadingEmpReport] = useState(false);

  // Self-Evaluation Viewer Modal
  const [selectedEval, setSelectedEval] = useState(null);
  const [openEvalModal, setOpenEvalModal] = useState(false);

  // Staff Compliance Documents & Statutory Audit Modal
  const [selectedComplianceEmp, setSelectedComplianceEmp] = useState(null);
  const [openComplianceModal, setOpenComplianceModal] = useState(false);
  const [freezeActionLoading, setFreezeActionLoading] = useState(false);

  const handleToggleFreezeFromAdmin = async (emp) => {
    if (!emp) return;
    const isCurrentlyFrozen = Boolean(emp.documents_frozen === true || emp.documents_frozen === 'true' || emp.documents_frozen === 't');
    const willFreeze = !isCurrentlyFrozen;
    setFreezeActionLoading(true);
    try {
      const res = await adminAPI.freezeDocuments(emp.id, { frozen: willFreeze, freeze: willFreeze });
      toast.success(res.data.message || (willFreeze ? 'Documents frozen and verified.' : 'Documents unfrozen.'));
      
      const updatedEmp = {
        ...emp,
        documents_frozen: willFreeze,
        frozen_at: willFreeze ? new Date().toISOString() : null,
        frozen_by_name: willFreeze ? 'Admin' : null
      };
      setSelectedComplianceEmp(updatedEmp);
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, ...updatedEmp } : e));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update document freeze status.');
    } finally {
      setFreezeActionLoading(false);
    }
  };

  const handleOpenLogWorkModal = (empId = '') => {
    setLogWorkForm({
      employee_id: empId || (employees.length > 0 ? employees[0].id : ''),
      date: format(new Date(), 'yyyy-MM-dd'),
      project_name: 'Core System',
      task_title: '',
      description: '',
      plan: '',
      estimated_hours: '2',
      actual_hours: '2',
      status: 'Completed',
      remarks: ''
    });
    setOpenLogWorkModal(true);
  };

  const handleSaveWorkLog = async (e) => {
    e.preventDefault();
    if (!logWorkForm.task_title.trim()) {
      toast.error('Task title or milestone summary is required.');
      return;
    }
    setLogWorkLoading(true);
    try {
      const fullDesc = logWorkForm.plan?.trim()
        ? (logWorkForm.description?.trim()
            ? `${logWorkForm.description.trim()}\n[Plan / Next Action]: ${logWorkForm.plan.trim()}`
            : `[Plan / Next Action]: ${logWorkForm.plan.trim()}`)
        : (logWorkForm.description?.trim() || '');

      const fullRemarks = logWorkForm.plan?.trim()
        ? (logWorkForm.remarks?.trim() ? `${logWorkForm.remarks.trim()} | Plan: ${logWorkForm.plan.trim()}` : `Plan: ${logWorkForm.plan.trim()}`)
        : (logWorkForm.remarks?.trim() || '');

      const payload = {
        employee_id: logWorkForm.employee_id || undefined,
        date: logWorkForm.date,
        project_name: logWorkForm.project_name || 'General Operations',
        task_title: logWorkForm.task_title.trim(),
        description: fullDesc,
        estimated_hours: String(logWorkForm.estimated_hours || '2'),
        actual_hours: String(logWorkForm.actual_hours || '2'),
        status: logWorkForm.status || 'Completed',
        remarks: fullRemarks
      };

      await workDoneAPI.create(payload);
      toast.success('Work log and activity plan recorded successfully!');
      setOpenLogWorkModal(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record work and plan item.');
    } finally {
      setLogWorkLoading(false);
    }
  };

  const [adminTodayData, setAdminTodayData] = useState(null);

  const fetchAdminTodayData = async () => {
    try {
      const res = await attendanceAPI.getToday();
      setAdminTodayData(res.data);
    } catch (err) {
      console.error('Error fetching admin today attendance:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    fetchAdminTodayData();
    try {
      const [liveRes, tasksRes, leavesRes, permsRes, empRes, evalRes, settingsRes, regRes, logsRes, weeklyRes, holidaysRes, policyRes, timingsRes, salaryRes] = await Promise.all([
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
        adminAPI.getHolidays().catch(() => ({ data: { holidays: [] } })),
        adminAPI.getLeavePolicy().catch(() => ({ data: { policy: null } })),
        adminAPI.getOfficeTimings().catch(() => ({ data: { timings: null } })),
        payrollAPI.getSalaryStructures().catch(() => ({ data: { salary_structures: [] } }))
      ]);

      if (liveRes?.data) setLiveData(liveRes.data);
      if (tasksRes?.data?.tasks) setAllTasks(tasksRes.data.tasks);
      if (leavesRes?.data?.leaves) setAllLeaves(leavesRes.data.leaves);
      if (permsRes?.data?.permissions) setAllPermissions(permsRes.data.permissions);
      if (policyRes?.data?.policy) setLeavePolicy(policyRes.data.policy);
      if (timingsRes?.data?.timings) setOfficeTimings(timingsRes.data.timings);
      if (salaryRes?.data?.salary_structures) setSalaryStructures(salaryRes.data.salary_structures);
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

  // Real-Time Dynamic Synchronization listener for all admin actions
  useEffect(() => {
    const handleDataUpdate = (e) => {
      const detail = e?.detail;
      if (!detail) return;

      if (detail.type === 'salary_structure_updated') {
        setSalaryStructures(prev => {
          const idx = prev.findIndex(s => s.employee_id === detail.employee_id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...detail.salary_structure };
            return next;
          }
          return [...prev, detail.salary_structure];
        });
      } else if (detail.type === 'attendance_updated') {
        fetchAdminTodayData();
        adminAPI.getLiveStatus().then(res => {
          if (res?.data) setLiveData(res.data);
        }).catch(() => {});
      } else if (detail.type === 'leave_updated') {
        if (detail.leave) {
          setAllLeaves(prev => prev.map(l => l.id === detail.leave_id ? { ...l, status: detail.status, ...detail.leave } : l));
        } else {
          leavesAPI.getAllLeaves().then(res => {
            if (res?.data?.leaves) setAllLeaves(res.data.leaves);
          }).catch(() => {});
        }
      } else if (detail.type === 'permission_updated') {
        if (detail.permission) {
          setAllPermissions(prev => prev.map(p => p.id === detail.permission_id ? { ...p, status: detail.status, ...detail.permission } : p));
        } else {
          leavesAPI.getAllPermissions().then(res => {
            if (res?.data?.permissions) setAllPermissions(res.data.permissions);
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('hrms:data_update', handleDataUpdate);
    return () => window.removeEventListener('hrms:data_update', handleDataUpdate);
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
      toast.success(`Employee "${empForm.name}" registered successfully & onboarding invitation email dispatched!`);
      setOpenEmpModal(false);
      setEmpForm({
        name: '',
        email: '',
        role: 'employee',
        department: 'Software Engineering',
        designation: 'Software Developer',
        work_mode: 'office',
        employment_type: 'full_time'
      });
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create employee.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDeactivate = (emp) => {
    setDeactivateTarget(emp);
    setDeactivateForm({
      status: 'resigned',
      reason: '',
      effective_date: format(new Date(), 'yyyy-MM-dd')
    });
    setOpenDeactivateModal(true);
  };

  const handleConfirmDeactivate = async (e) => {
    e.preventDefault();
    if (!deactivateTarget) return;
    if (!deactivateForm.reason.trim()) {
      toast.error('Please enter the resignation or deactivation reason.');
      return;
    }
    setDeactivateLoading(true);
    try {
      const res = await adminAPI.deactivateEmployee(deactivateTarget.id, deactivateForm);
      toast.success(res.data.message || `Employee ${deactivateTarget.name} marked as ${deactivateForm.status}.`);
      setOpenDeactivateModal(false);
      setDeactivateTarget(null);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update employee status.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleReactivateEmployee = async (emp) => {
    const confirmed = await muiToast.confirm({
      title: 'Restore Employee to Active Status',
      message: `Are you sure you want to restore "${emp.name}" (${emp.id}) to ACTIVE status? This will restore their system login privileges.`,
      confirmText: 'Restore to Active',
      severity: 'success'
    });
    if (!confirmed) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminAPI.reactivateEmployee(emp.id);
      toast.success(res.data.message || `Employee ${emp.name} restored to active status.`);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reactivate employee.');
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
    // Instant optimistic UI update
    setAllLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    try {
      await leavesAPI.updateStatus(id, status);
      toast.success(`Leave application ${status.toLowerCase()} successfully.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update leave.');
      fetchDashboardData();
    }
  };

  const handlePermissionAction = async (id, status) => {
    // Instant optimistic UI update
    setAllPermissions(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    try {
      await leavesAPI.updatePermissionStatus(id, status);
      toast.success(`Permission pass ${status.toLowerCase()} successfully.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update permission.');
      fetchDashboardData();
    }
  };

  const handleOpenSalaryModal = (employee) => {
    const struct = salaryStructures.find(s => s.employee_id === employee.id);
    setSelectedSalaryEmp(employee);
    setSalaryForm({
      monthly_salary: struct?.monthly_salary ? String(struct.monthly_salary) : '',
      bank_name: struct?.bank_name || employee.personal_info?.bank_details?.bank_name || '',
      account_number: struct?.account_number || employee.personal_info?.bank_details?.account_number || '',
      ifsc_code: struct?.ifsc_code || employee.personal_info?.bank_details?.ifsc_code || '',
      upi_id: struct?.upi_id || employee.personal_info?.bank_details?.upi_id || '',
      pan_number: struct?.pan_number || employee.personal_info?.bank_details?.pan_number || ''
    });
    setOpenSalaryModal(true);
  };

  const handleSaveSalaryStructure = async (e) => {
    e.preventDefault();
    if (!selectedSalaryEmp) return;
    setSalarySaving(true);

    const parsedSalary = parseFloat(salaryForm.monthly_salary) || 0;
    const targetEmpId = selectedSalaryEmp.id;
    const optimisticPayload = {
      ...salaryForm,
      employee_id: targetEmpId,
      employee_name: selectedSalaryEmp.name,
      department: selectedSalaryEmp.department || '',
      designation: selectedSalaryEmp.designation || '',
      monthly_salary: parsedSalary
    };

    // Instant optimistic UI update in Staff Directory (0ms latency)
    setSalaryStructures(prev => {
      const idx = prev.findIndex(s => s.employee_id === targetEmpId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...optimisticPayload };
        return next;
      }
      return [...prev, { id: `SAL-${targetEmpId}`, ...optimisticPayload }];
    });

    try {
      const res = await payrollAPI.updateSalaryStructure(targetEmpId, salaryForm);
      toast.success(`Salary package saved for ${selectedSalaryEmp.name}!`);
      setOpenSalaryModal(false);
      if (res?.data?.salary_structure) {
        setSalaryStructures(prev => {
          const idx = prev.findIndex(s => s.employee_id === targetEmpId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...res.data.salary_structure };
            return next;
          }
          return [...prev, res.data.salary_structure];
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update salary package');
      const revertRes = await payrollAPI.getSalaryStructures().catch(() => ({ data: { salary_structures: [] } }));
      if (revertRes?.data?.salary_structures) setSalaryStructures(revertRes.data.salary_structures);
    } finally {
      setSalarySaving(false);
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

  const pendingRegsCount = regularizations.filter(r => r.status === 'Pending').length;
  const pendingLeavesCount = allLeaves.filter(l => l.status === 'Pending').length;

  // Real-time Search & Multi-criteria Filter Engine
  const allDepartments = Array.from(
    new Set(employees.map(e => e.department).filter(Boolean))
  ).sort();

  const searchLower = searchTerm.trim().toLowerCase();

  const filteredBoard = board.filter(emp => {
    const matchesSearch = !searchLower ||
      (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
      (emp.email && emp.email.toLowerCase().includes(searchLower)) ||
      (emp.designation && emp.designation.toLowerCase().includes(searchLower)) ||
      (emp.department && emp.department.toLowerCase().includes(searchLower));
    const matchesDept = filterDepartment === 'ALL' || emp.department === filterDepartment;
    const matchesStatus = filterStatus === 'ALL' || emp.statusToday === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const filteredRegularizations = regularizations.filter(r => {
    const matchesSearch = !searchLower ||
      (r.employee_name && r.employee_name.toLowerCase().includes(searchLower)) ||
      (r.employee_id && String(r.employee_id).toLowerCase().includes(searchLower)) ||
      (r.reason && r.reason.toLowerCase().includes(searchLower)) ||
      (r.date && r.date.includes(searchLower));
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredTasks = allTasks.filter(t => {
    const matchesSearch = !searchLower ||
      (t.employee_name && t.employee_name.toLowerCase().includes(searchLower)) ||
      (t.task_title && t.task_title.toLowerCase().includes(searchLower)) ||
      (t.project_name && t.project_name.toLowerCase().includes(searchLower)) ||
      (t.task_category && t.task_category.toLowerCase().includes(searchLower));
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredLeaves = allLeaves.filter(l => {
    const matchesSearch = !searchLower ||
      (l.employee_name && l.employee_name.toLowerCase().includes(searchLower)) ||
      (l.leave_type && l.leave_type.toLowerCase().includes(searchLower)) ||
      (l.reason && l.reason.toLowerCase().includes(searchLower)) ||
      (l.start_date && l.start_date.includes(searchLower)) ||
      (l.end_date && l.end_date.includes(searchLower));
    const matchesStatus = filterStatus === 'ALL' || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredPermissions = allPermissions.filter(p => {
    const matchesSearch = !searchLower ||
      (p.employee_name && p.employee_name.toLowerCase().includes(searchLower)) ||
      (p.reason && p.reason.toLowerCase().includes(searchLower)) ||
      (p.date && p.date.includes(searchLower));
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredEvaluations = evaluations.filter(ev => {
    const matchesSearch = !searchLower ||
      (ev.employee_name && ev.employee_name.toLowerCase().includes(searchLower)) ||
      (ev.month_year && ev.month_year.includes(searchLower)) ||
      (ev.designation && ev.designation.toLowerCase().includes(searchLower));
    return matchesSearch;
  });

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchLower ||
      (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
      (emp.email && emp.email.toLowerCase().includes(searchLower)) ||
      (emp.designation && emp.designation.toLowerCase().includes(searchLower)) ||
      (emp.department && emp.department.toLowerCase().includes(searchLower)) ||
      (emp.id && String(emp.id).toLowerCase().includes(searchLower));
    const matchesDept = filterDepartment === 'ALL' || emp.department === filterDepartment;
    const matchesWorkMode = filterWorkMode === 'ALL' || emp.work_mode === filterWorkMode;
    const matchesStatus = filterEmployeeStatus === 'ALL' || emp.status === filterEmployeeStatus;
    const matchesCategory = filterEmploymentType === 'ALL' || (emp.employment_type || 'full_time') === filterEmploymentType;
    return matchesSearch && matchesDept && matchesWorkMode && matchesStatus && matchesCategory;
  });

  const filteredAuditLogs = auditLogs.filter(l => {
    const matchesSearch = !searchLower ||
      (l.sender_name && l.sender_name.toLowerCase().includes(searchLower)) ||
      (l.recipient_name && l.recipient_name.toLowerCase().includes(searchLower)) ||
      (l.subject && l.subject.toLowerCase().includes(searchLower)) ||
      (l.message && l.message.toLowerCase().includes(searchLower)) ||
      (l.type && l.type.toLowerCase().includes(searchLower));
    return matchesSearch;
  });

  const filteredHolidays = holidays.filter(h => {
    const matchesSearch = !searchLower ||
      (h.name && h.name.toLowerCase().includes(searchLower)) ||
      (h.date && h.date.includes(searchLower)) ||
      (h.type && h.type.toLowerCase().includes(searchLower));
    return matchesSearch;
  });

  const getSearchPlaceholder = (tab) => {
    switch (tab) {
      case 0: return 'staff name, email, department, or designation';
      case 2: return 'staff name, employee ID, reason, or date';
      case 3: return 'task title, project name, category, or employee';
      case 4: return 'employee name, leave type, reason, or date';
      case 5: return 'employee name, month, or designation';
      case 8: return 'employee name, email, department, designation, or ID';
      case 9: return 'sender, recipient, subject, or message';
      case 10: return 'holiday title, date, or type';
      default: return 'keyword...';
    }
  };

  const getStatusOptions = (tab) => {
    switch (tab) {
      case 0:
        return [
          { value: 'Present & Working', label: 'Present & Working' },
          { value: 'Punched Out', label: 'Punched Out' },
          { value: 'Absent Today', label: 'Absent Today' }
        ];
      case 2:
      case 4:
        return [
          { value: 'Pending', label: 'Pending' },
          { value: 'Approved', label: 'Approved' },
          { value: 'Rejected', label: 'Rejected' }
        ];
      case 3:
        return [
          { value: 'Completed', label: 'Completed' },
          { value: 'In-Progress', label: 'In-Progress' },
          { value: 'Assigned', label: 'Assigned' }
        ];
      default:
        return [];
    }
  };

  const getActiveItemCount = (tab) => {
    switch (tab) {
      case 0: return filteredBoard.length;
      case 2: return filteredRegularizations.length;
      case 3: return filteredTasks.length;
      case 4: return leaveSubTab === 0 ? filteredLeaves.length : filteredPermissions.length;
      case 5: return filteredEvaluations.length;
      case 8: return filteredEmployees.length;
      case 9: return filteredAuditLogs.length;
      case 10: return filteredHolidays.length;
      default: return 0;
    }
  };

  const hasDeptFilter = [0, 8].includes(activeTab);
  const hasStatusFilter = [0, 2, 3, 4].includes(activeTab);
  const hasWorkModeFilter = activeTab === 8;

  const scrollToSection = () => {
    setTimeout(() => {
      const el = document.getElementById('admin-workspace-content');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <Box sx={{ width: '100%', py: { xs: 1, sm: 1.5 } }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Executive Management Portal
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
            Real-time Office Presence, Work Submissions, Leaves & Performance Appraisals
          </Typography>

          {/* Live Date & Time Display Badge (Identical to TopNavbar format) */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.2,
              px: 1.5,
              py: 0.6,
              mt: 1.2,
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              bgcolor: '#f8fafc'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <CalendarIcon sx={{ fontSize: 15, color: '#133829' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: 11.5, sm: 12.5 }, color: '#0f172a' }}>
                {format(currentTime, 'EEE, dd MMM yyyy')}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 800 }}>|</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimeIcon sx={{ fontSize: 14, color: '#059669' }} />
              <Typography variant="body2" sx={{ fontWeight: 800, fontSize: { xs: 11.5, sm: 12.5 }, color: '#059669', fontFamily: 'monospace' }}>
                {format(currentTime, 'hh:mm:ss a')}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ManualAttendanceIcon />}
            onClick={() => setOpenManualAttendanceModal(true)}
            sx={{ fontWeight: 700, borderRadius: '8px' }}
          >
            Manual Attendance
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
            disabled={loading}
            sx={{ borderRadius: '8px' }}
          >
            Refresh Data
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SettingsIcon />}
            onClick={() => handleTabSelect(10)}
            sx={{ fontWeight: 600, borderRadius: '8px' }}
          >
            Geofence Setup
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddPersonIcon />}
            onClick={() => setOpenEmpModal(true)}
            sx={{ fontWeight: 700, borderRadius: '8px' }}
          >
            Add Staff
          </Button>
        </Box>
      </Box>

      {/* Live Presence Metric KPI Cards (4 Clean 3-col Grid) */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card sx={{ width: '100%', height: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #133829', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 1.8, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, minHeight: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>TOTAL STAFF</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>
                {counts.totalStaff}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card sx={{ width: '100%', height: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #059669', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 1.8, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, minHeight: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PRESENT IN OFFICE</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#059669' }}>
                {counts.present}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card sx={{ width: '100%', height: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #0891b2', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 1.8, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: '#0891b2', fontWeight: 700, minHeight: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PUNCHED OUT</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#0891b2' }}>
                {counts.punchedOut}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card sx={{ width: '100%', height: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #64748b', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 1.8, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, minHeight: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ABSENT TODAY</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'text.secondary' }}>
                {counts.absent}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Admin Executive Attendance & GPS Punch Hub */}
      <Box sx={{ mb: 2.5 }}>
        <GeofencePunch
          todayData={adminTodayData}
          onRefresh={() => {
            fetchAdminTodayData();
            fetchDashboardData();
          }}
        />
      </Box>

      {/* Sleek Workspace Context Header */}
      <Card sx={{ mb: 2.5, borderRadius: '10px', border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '8px',
                  bgcolor: 'rgba(19, 56, 41, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#133829',
                  flexShrink: 0
                }}
              >
                {activeTab === 0 && <PeopleIcon sx={{ fontSize: 24 }} />}
                {activeTab === 1 && <TaskIcon sx={{ fontSize: 24 }} />}
                {activeTab === 2 && <RegularizeTabIcon sx={{ fontSize: 24 }} />}
                {activeTab === 3 && <TaskIcon sx={{ fontSize: 24 }} />}
                {activeTab === 4 && <LeaveIcon sx={{ fontSize: 24 }} />}
                {activeTab === 5 && <EvalIcon sx={{ fontSize: 24 }} />}
                {activeTab === 6 && <ReportIcon sx={{ fontSize: 24 }} />}
                {activeTab === 7 && <ReportIcon sx={{ fontSize: 24 }} />}
                {activeTab === 8 && <PeopleIcon sx={{ fontSize: 24 }} />}
                {activeTab === 9 && <AuditIcon sx={{ fontSize: 24 }} />}
                {activeTab === 10 && <HolidayIcon sx={{ fontSize: 24 }} />}
                {activeTab === 11 && <PayrollIcon sx={{ fontSize: 24 }} />}
                {activeTab === 12 && <MemoIcon sx={{ fontSize: 24 }} />}
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    Management Suite
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#cbd5e1' }}>•</Typography>
                  <Typography variant="caption" sx={{ color: '#133829', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    {SECTION_META[activeTab]?.category || 'Operations'}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {SECTION_META[activeTab]?.title || 'Admin Workspace'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                  {SECTION_META[activeTab]?.subtitle}
                </Typography>
              </Box>
            </Box>

            {/* Quick Context Metric & Mobile Switcher */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' }, flexWrap: 'wrap' }}>
              {/* Contextual Metric Badges */}
              {activeTab === 0 && (
                <Chip label={`${counts.present} Present / ${counts.totalStaff} Staff`} size="small" sx={{ fontWeight: 800, bgcolor: '#dcfce7', color: '#15803d', borderRadius: '6px' }} />
              )}
              {activeTab === 2 && pendingRegsCount > 0 && (
                <Chip label={`${pendingRegsCount} Pending Action`} size="small" color="warning" sx={{ fontWeight: 800, borderRadius: '6px' }} />
              )}
              {activeTab === 3 && (
                <Chip label={`${allTasks.length} Logged Tasks`} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569', borderRadius: '6px' }} />
              )}
              {activeTab === 4 && (
                <Chip label={`${pendingLeavesCount} Pending / ${allLeaves.length} Total`} size="small" sx={{ fontWeight: 800, bgcolor: pendingLeavesCount > 0 ? '#fef3c7' : '#f1f5f9', color: pendingLeavesCount > 0 ? '#b45309' : '#475569', borderRadius: '6px' }} />
              )}
              {activeTab === 5 && (
                <Chip label={`${evaluations.length} Evaluations Recorded`} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569', borderRadius: '6px' }} />
              )}
              {activeTab === 6 && (
                <Chip label={`${weeklyReports.length} Weekly Check-ins`} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569', borderRadius: '6px' }} />
              )}
              {activeTab === 8 && (
                <Chip label={`${employees.length} Registered Staff`} size="small" sx={{ fontWeight: 800, bgcolor: '#e0f2fe', color: '#0369a1', borderRadius: '6px' }} />
              )}
              {activeTab === 9 && (
                <Chip label={`${auditLogs.length} Security Audits`} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569', borderRadius: '6px' }} />
              )}
              {activeTab === 10 && (
                <Chip label={`${holidays.length} Company Holidays`} size="small" sx={{ fontWeight: 800, bgcolor: '#f0fdf4', color: '#166534', borderRadius: '6px' }} />
              )}

              {/* Mobile-Only Section Switcher (hidden on desktop where left sidebar is active) */}
              <Box sx={{ display: { xs: 'block', md: 'none' }, minWidth: 170 }}>
                <TextField
                  select
                  size="small"
                  value={activeTab}
                  onChange={(e) => handleTabSelect(Number(e.target.value))}
                  sx={{ bgcolor: '#f8fafc', borderRadius: '8px', '& .MuiSelect-select': { py: 0.8, fontSize: '0.8rem', fontWeight: 700 } }}
                >
                  {SECTION_META.map((sec, idx) => (
                    <MenuItem key={idx} value={idx} sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {sec.title}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Box>
        </Box>

        <CardContent id="admin-workspace-content" sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: 2 } }}>
          {/* Universal Section Search & Filter Toolbar */}
          {[0, 2, 3, 4, 5, 8, 9, 10].includes(activeTab) && (
            <Box sx={{ mb: 2, p: 1.2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} sm={hasDeptFilter ? (hasStatusFilter || hasWorkModeFilter ? 5 : 7) : (hasStatusFilter ? 7 : 12)} md={hasDeptFilter ? (hasStatusFilter || hasWorkModeFilter ? 6 : 8) : (hasStatusFilter ? 8 : 12)}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={`Search ${getSearchPlaceholder(activeTab)}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')}>
                            <ClearIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
                  />
                </Grid>

                {hasDeptFilter && (
                  <Grid item xs={6} sm={3.5} md={3}>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      label="Department"
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
                    >
                      <MenuItem value="ALL">All Departments</MenuItem>
                      {allDepartments.map(d => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}

                {hasStatusFilter && (
                  <Grid item xs={6} sm={3.5} md={hasDeptFilter ? 3 : 4}>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      label="Status"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
                    >
                      <MenuItem value="ALL">All Statuses</MenuItem>
                      {getStatusOptions(activeTab).map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}

                {hasWorkModeFilter && (
                  <Grid item xs={6} sm={3.5} md={2.5}>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      label="Work Mode"
                      value={filterWorkMode}
                      onChange={(e) => setFilterWorkMode(e.target.value)}
                      sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
                    >
                      <MenuItem value="ALL">All Work Modes</MenuItem>
                      <MenuItem value="office">In-Office</MenuItem>
                      <MenuItem value="wfh">WFH (Remote)</MenuItem>
                    </TextField>
                  </Grid>
                )}

                {activeTab === 8 && (
                  <Grid item xs={6} sm={3.5} md={2.5}>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      label="Staff Status"
                      value={filterEmployeeStatus}
                      onChange={(e) => setFilterEmployeeStatus(e.target.value)}
                      sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
                    >
                      <MenuItem value="ALL">All Statuses</MenuItem>
                      <MenuItem value="active">Active Staff</MenuItem>
                      <MenuItem value="resigned">Resigned Staff</MenuItem>
                      <MenuItem value="inactive">Inactive Staff</MenuItem>
                    </TextField>
                  </Grid>
                )}

                {activeTab === 8 && (
                  <Grid item xs={6} sm={3.5} md={2.5}>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      label="Employment Category"
                      value={filterEmploymentType}
                      onChange={(e) => setFilterEmploymentType(e.target.value)}
                      sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
                    >
                      <MenuItem value="ALL">All Categories</MenuItem>
                      <MenuItem value="full_time">Full-Time Staff</MenuItem>
                      <MenuItem value="internship">Interns / Trainees</MenuItem>
                    </TextField>
                  </Grid>
                )}
              </Grid>

              {/* Active Filter Indicator & Reset */}
              {(searchTerm || filterDepartment !== 'ALL' || filterStatus !== 'ALL' || filterWorkMode !== 'ALL' || filterEmployeeStatus !== 'ALL' || filterEmploymentType !== 'ALL') && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5, pt: 1, borderTop: '1px dashed #e2e8f0', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                    Active search & filters applied • <strong>{getActiveItemCount(activeTab)}</strong> records matched
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
                    onClick={() => {
                      setSearchTerm('');
                      setFilterDepartment('ALL');
                      setFilterStatus('ALL');
                      setFilterWorkMode('ALL');
                      setFilterEmployeeStatus('ALL');
                    }}
                    sx={{ fontSize: 11, fontWeight: 700, py: 0, textTransform: 'none' }}
                  >
                    Clear Search & Filters
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* TAB 0: Live Presence Board */}
          {activeTab === 0 && (
            <Box sx={{ overflowX: 'auto' }}>
              {filteredBoard.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                    No staff records match the current search or filters.
                  </Typography>
                  {(searchTerm || filterDepartment !== 'ALL' || filterStatus !== 'ALL') && (
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1.5, fontWeight: 700, borderRadius: '8px' }}
                      onClick={() => { setSearchTerm(''); setFilterDepartment('ALL'); setFilterStatus('ALL'); }}
                    >
                      Reset Filters
                    </Button>
                  )}
                </Box>
              ) : (
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
                    {filteredBoard.map((emp) => (
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
                        <TableCell sx={{ fontWeight: 600 }}>{formatTime12h(emp.loginTime)}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatTime12h(emp.logoutTime)}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {emp.netHours ? `${emp.netHours} hrs` : '--'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
                  sx={{ fontWeight: 700, borderRadius: '8px', bgcolor: '#133829' }}
                >
                  New Manual Override Entry
                </Button>
              </Box>

              {filteredRegularizations.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No regularization or edge case requests found matching current filters.
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
                    {filteredRegularizations.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{r.employee_name || r.employee_id}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{r.date}</TableCell>
                        <TableCell>
                          <strong>{formatTime12h(r.requested_login_time)}</strong> to <strong>{r.requested_logout_time ? formatTime12h(r.requested_logout_time) : 'End of Day'}</strong>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 280, color: '#475569', fontSize: 13 }}>
                          {r.reason}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.status}
                            color={r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'error' : 'warning'}
                            size="small"
                            sx={{ fontWeight: 800, borderRadius: '6px' }}
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
                                sx={{ fontWeight: 700, borderRadius: '10px' }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<RejectIcon />}
                                onClick={() => handleOpenRejection('regularization', r)}
                                sx={{ fontWeight: 700, borderRadius: '8px' }}
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

          {/* TAB 3: Team Work Done & Deliverable Plans */}
          {activeTab === 3 && (
            <Box>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2.5,
                p: 2,
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Team Work Done & Future Deliverable Plans
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Managers and Admins can log completed work milestones and upcoming sprint plans directly for themselves or any team member.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenLogWorkModal()}
                  sx={{
                    fontWeight: 700,
                    borderRadius: '8px',
                    px: 2.5,
                    py: 1,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
                  }}
                >
                  Log Work & Plan Item
                </Button>
              </Box>

              <Box sx={{ overflowX: 'auto' }}>
                {filteredTasks.length === 0 ? (
                  <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No tasks or work logs found matching current filters.
                  </Typography>
                ) : (
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>What Was Done (Task & Details)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Future Plan / Next Deliverables</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Est / Act Hours</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTasks.map((t) => {
                        let displayDesc = t.description || '';
                        let planText = '';
                        if (displayDesc.includes('[Plan / Next Action]:')) {
                          const parts = displayDesc.split('[Plan / Next Action]:');
                          displayDesc = parts[0].trim();
                          planText = parts[1].trim();
                        } else if (t.remarks && t.remarks.toLowerCase().includes('plan:')) {
                          const idx = t.remarks.toLowerCase().indexOf('plan:');
                          planText = t.remarks.substring(idx + 5).trim();
                        }

                        return (
                          <TableRow key={t.id} hover>
                            <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>{t.date}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t.employee_name || t.employee_id}</TableCell>
                            <TableCell>
                              <Chip label={t.project_name} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px' }} />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 280 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.task_title}</Typography>
                              {displayDesc && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                  {displayDesc}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 260 }}>
                              {planText ? (
                                <Box sx={{ p: 1, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
                                  <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700, display: 'block' }}>
                                    Planned Next:
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#1e3a8a', display: 'block', whiteSpace: 'pre-wrap' }}>
                                    {planText}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                  --
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <strong>{t.estimated_hours}h</strong> est / <strong>{t.actual_hours}h</strong> act
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={t.status}
                                color={t.status === 'Completed' ? 'success' : t.status === 'In-Progress' ? 'primary' : t.status === 'Planned' ? 'info' : 'warning'}
                                size="small"
                                sx={{ fontWeight: 700, borderRadius: '6px' }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </Box>
          )}

          {/* TAB 4: Leave & Permission Approvals */}
          {activeTab === 4 && (
            <Box>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                  value={leaveSubTab}
                  onChange={(e, val) => setLeaveSubTab(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                >
                  <Tab
                    label={`Full Day Leaves (${allLeaves.filter(l => l.status === 'Pending').length} Pending)`}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  />
                  <Tab
                    label={`Short 2-Hour Passes (${allPermissions.filter(p => p.status === 'Pending').length} Pending)`}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  />
                  <Tab
                    icon={<SettingsIcon sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label="Monthly Quotas & Policy Settings"
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  />
                </Tabs>
              </Box>

              {leaveSubTab === 0 && (
                <Box sx={{ overflowX: 'auto' }}>
                  {filteredLeaves.length === 0 ? (
                    <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No full-day leave applications found matching current filters.
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
                        {filteredLeaves.map((l) => (
                          <TableRow key={l.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{l.employee_name || l.employee_id}</TableCell>
                            <TableCell><Chip label={l.leave_type} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px' }} /></TableCell>
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
                              <Chip label={l.status} color={l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'error' : 'warning'} size="small" sx={{ fontWeight: 700, borderRadius: '6px' }} />
                            </TableCell>
                            <TableCell align="right">
                              {l.status === 'Pending' ? (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => handleLeaveAction(l.id, 'Approved')} sx={{ borderRadius: '8px', fontWeight: 700 }}>
                                    Approve
                                  </Button>
                                  <Button size="small" variant="outlined" color="error" startIcon={<RejectIcon />} onClick={() => handleOpenRejection('leave', l)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
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
              )}

              {leaveSubTab === 1 && (
                <Box sx={{ overflowX: 'auto' }}>
                  {filteredPermissions.length === 0 ? (
                    <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No short permission pass requests found matching current filters.
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
                        {filteredPermissions.map((p) => (
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
                              <Chip label={p.status} color={p.status === 'Approved' ? 'success' : p.status === 'Rejected' ? 'error' : 'warning'} size="small" sx={{ fontWeight: 700, borderRadius: '6px' }} />
                            </TableCell>
                            <TableCell align="right">
                              {p.status === 'Pending' ? (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => handlePermissionAction(p.id, 'Approved')} sx={{ borderRadius: '8px', fontWeight: 700 }}>
                                    Approve
                                  </Button>
                                  <Button size="small" variant="outlined" color="error" startIcon={<RejectIcon />} onClick={() => handleOpenRejection('permission', p)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
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

              {/* Subtab 2: Monthly Quotas & Policy Settings */}
              {leaveSubTab === 2 && (
                <Box sx={{ maxWidth: 880, mx: 'auto', py: 1 }}>
                  <Alert severity="info" sx={{ mb: 3, borderRadius: '10px' }}>
                    <strong>Monthly Leave Quota Policy:</strong> All leave quotas are configured on a <strong>monthly-wise</strong> basis. Unused allowances refresh each month. Changes apply immediately to active staff portals and timesheet calculations.
                  </Alert>

                  {/* Company Unified Leave Policy Information */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label="Unified Policy: Full-Time Staff & Interns"
                        size="small"
                        sx={{
                          fontWeight: 800,
                          borderRadius: '6px',
                          bgcolor: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #86efac'
                        }}
                      />
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Equal leave quotas & permission limits across all roles
                      </Typography>
                    </Box>
                  </Box>

                  {/* Live Preview of Employee KPI Cards */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, letterSpacing: '0.04em' }}>
                    PORTAL DISPLAY PREVIEW (ALL EMPLOYEES & INTERNS):
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ p: 2, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>CASUAL LEAVE (CL)</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#3b82f6', mt: 0.5 }}>
                          {leavePolicy.casual_leave} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {leavePolicy.casual_leave}d</span>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>0 days used this month</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ p: 2, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>SICK LEAVE (SL)</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981', mt: 0.5 }}>
                          {leavePolicy.sick_leave} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {leavePolicy.sick_leave}d</span>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>0 days used this month</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ p: 2, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>PAID ANNUAL LEAVE (PL)</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0284c7', mt: 0.5 }}>
                          {leavePolicy.paid_leave} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {leavePolicy.paid_leave}d</span>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>0 days used this month</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ p: 2, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>MONTHLY PERMISSION PASS</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#f59e0b', mt: 0.5 }}>
                          {leavePolicy.monthly_permission_limit} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {leavePolicy.monthly_permission_limit} left</span>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>0 used this month</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Settings Form Card */}
                  <Card sx={{ p: 3, borderRadius: '10px', border: '1.5px solid #e2e8f0', bgcolor: '#ffffff' }}>
                    <form onSubmit={handleSaveLeavePolicy}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                        Edit Company Monthly Quotas & Permissions
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            type="number"
                            inputProps={{ min: 0, max: 15, step: 0.5 }}
                            label="Casual Leave (CL) Monthly Quota"
                            required
                            value={leavePolicy.casual_leave}
                            onChange={(e) => setLeavePolicy({ ...leavePolicy, casual_leave: parseFloat(e.target.value) || 0 })}
                            helperText="Days per employee per month (e.g. 1.0)"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            type="number"
                            inputProps={{ min: 0, max: 15, step: 0.5 }}
                            label="Sick Leave (SL) Monthly Quota"
                            required
                            value={leavePolicy.sick_leave}
                            onChange={(e) => setLeavePolicy({ ...leavePolicy, sick_leave: parseFloat(e.target.value) || 0 })}
                            helperText="Days per employee per month (e.g. 1.0)"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            type="number"
                            inputProps={{ min: 0, max: 15, step: 0.5 }}
                            label="Paid Leave (PL) Monthly Quota"
                            required
                            value={leavePolicy.paid_leave}
                            onChange={(e) => setLeavePolicy({ ...leavePolicy, paid_leave: parseFloat(e.target.value) || 0 })}
                            helperText="Days per employee per month (e.g. 1.0)"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            inputProps={{ min: 0, max: 10, step: 1 }}
                            label="Monthly Permission Pass Limit"
                            required
                            value={leavePolicy.monthly_permission_limit}
                            onChange={(e) => setLeavePolicy({ ...leavePolicy, monthly_permission_limit: parseInt(e.target.value, 10) || 0 })}
                            helperText="Max short permission requests allowed per month"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            inputProps={{ min: 0.5, max: 4, step: 0.5 }}
                            label="Max Hours Per Permission Pass"
                            required
                            value={leavePolicy.max_permission_hours}
                            onChange={(e) => setLeavePolicy({ ...leavePolicy, max_permission_hours: parseFloat(e.target.value) || 2 })}
                            helperText="Allowed duration per permission (e.g. 2.0 hours)"
                          />
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {leavePolicy.updated_at ? `Last updated by ${leavePolicy.updated_by || 'Admin'} at ${leavePolicy.updated_at.slice(0, 19).replace('T', ' ')}` : 'Active Default Policy'}
                        </Typography>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={savingPolicy}
                          sx={{ fontWeight: 700, borderRadius: '8px', px: 3 }}
                        >
                          {savingPolicy ? 'Saving Policy...' : 'Save Monthly Leave Policy'}
                        </Button>
                      </Box>
                    </form>
                  </Card>
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
              ) : filteredEvaluations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                    No staff monthly self-evaluations found matching current search.
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ mt: 1, fontWeight: 700 }} onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                </Box>
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
                    {filteredEvaluations.map((ev) => (
                      <TableRow key={ev.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{ev.employee_name}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{ev.designation} • {ev.department}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{ev.review_month}</TableCell>
                        <TableCell>
                          <Chip label={`${ev.overall_rating || '4.5'} / 5.0 Rating`} size="small" color="primary" sx={{ fontWeight: 800, borderRadius: '6px' }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{ev.targets_tasks?.length || 0} Targets</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{ev.submission_date}</TableCell>
                        <TableCell>
                          <Chip label={ev.status || 'Submitted'} size="small" color="success" sx={{ fontWeight: 700, borderRadius: '6px' }} />
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
                            sx={{ fontWeight: 700, borderRadius: '8px' }}
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
            <Box sx={{ overflowX: 'auto', width: '100%' }}>
              {filteredEmployees.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                    No staff records match the current search or filters.
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Emp ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Work Mode</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Compensation</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEmployees.map((e) => (
                    <TableRow key={e.id} hover sx={{ opacity: (e.status === 'resigned' || e.status === 'inactive') ? 0.75 : 1 }}>
                      <TableCell sx={{ fontWeight: 700 }}>{e.id}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {e.name}
                        {(e.status === 'resigned' || e.status === 'inactive') && (
                          <Chip label={e.status?.toUpperCase()} size="small" sx={{ ml: 1, height: 18, fontSize: 9.5, fontWeight: 800, bgcolor: '#fee2e2', color: '#991b1b', borderRadius: '6px' }} />
                        )}
                      </TableCell>
                      <TableCell>{e.email}</TableCell>
                      <TableCell>
                        {e.employment_type === 'internship' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Chip
                              label="INTERN"
                              size="small"
                              sx={{
                                fontWeight: 800,
                                borderRadius: '6px',
                                fontSize: '0.68rem',
                                bgcolor: '#f3e8ff',
                                color: '#7e22ce',
                                border: '1px solid #d8b4fe'
                              }}
                            />
                            <Tooltip title="1-Click: Promote this Intern to Full-Time Staff">
                              <Chip
                                icon={<StarIcon sx={{ fontSize: '13px !important', color: '#15803d !important' }} />}
                                label="Promote"
                                size="small"
                                clickable
                                onClick={() => handleConvertEmploymentType(e)}
                                sx={{
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  fontSize: '0.68rem',
                                  height: 22,
                                  bgcolor: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #6ee7b7',
                                  boxShadow: '0 1px 3px rgba(16,185,129,0.2)',
                                  '&:hover': { bgcolor: '#d1fae5', transform: 'scale(1.05)' },
                                  transition: 'all 0.15s ease'
                                }}
                              />
                            </Tooltip>
                          </Box>
                        ) : (
                          <Tooltip title="Click to switch between Full-Time Staff and Internship">
                            <Chip
                              label="FULL-TIME"
                              size="small"
                              clickable
                              onClick={() => handleConvertEmploymentType(e)}
                              sx={{
                                fontWeight: 800,
                                cursor: 'pointer',
                                borderRadius: '6px',
                                fontSize: '0.68rem',
                                bgcolor: '#dcfce7',
                                color: '#15803d',
                                border: '1px solid #86efac',
                                '&:hover': { bgcolor: '#bbf7d0' }
                              }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={e.role?.toUpperCase()}
                          size="small"
                          color={e.role === 'admin' ? 'primary' : 'secondary'}
                          variant="outlined"
                          sx={{ fontWeight: 700, borderRadius: '6px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={e.personal_info?.exit_details?.reason ? `Reason: ${e.personal_info.exit_details.reason} (Effective: ${e.personal_info.exit_details.effective_date || '--'})` : (e.status === 'resigned' ? 'Resigned staff member' : 'Active working status')}>
                          <Chip
                            label={e.status === 'resigned' ? 'Resigned' : e.status === 'inactive' ? 'Inactive' : 'Active'}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              borderRadius: '6px',
                              bgcolor: e.status === 'resigned' ? '#fef3c7' : e.status === 'inactive' ? '#fee2e2' : '#dcfce7',
                              color: e.status === 'resigned' ? '#b45309' : e.status === 'inactive' ? '#991b1b' : '#15803d'
                            }}
                          />
                        </Tooltip>
                        {e.personal_info?.exit_details?.reason && (
                          <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontSize: 10, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.personal_info.exit_details.reason}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={e.work_mode === 'wfh' ? 'WFH (Remote)' : 'In-Office'}
                          size="small"
                          color={e.work_mode === 'wfh' ? 'secondary' : 'default'}
                          sx={{
                            fontWeight: 700,
                            borderRadius: '6px',
                            bgcolor: e.work_mode === 'wfh' ? '#e0f2fe' : '#f1f5f9',
                            color: e.work_mode === 'wfh' ? '#0369a1' : '#475569'
                          }}
                        />
                      </TableCell>
                      <TableCell>{e.department}</TableCell>
                      <TableCell>{e.designation}</TableCell>
                      <TableCell>
                        {(() => {
                          const struct = salaryStructures.find(s => s.employee_id === e.id);
                          const salary = parseFloat(struct?.monthly_salary) || 0;
                          const isIntern = e.employment_type === 'internship';
                          if (salary > 0) {
                            return (
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: isIntern ? '#7e22ce' : '#0f766e', fontFamily: 'monospace' }}>
                                  {formatINR(salary)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: 10, display: 'block' }}>
                                  {isIntern ? 'Monthly Stipend' : 'Monthly CTC'}
                                </Typography>
                              </Box>
                            );
                          }
                          return (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              {isIntern ? 'No Stipend Set' : 'No Salary Set'}
                            </Typography>
                          );
                        })()}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {e.employment_type === 'internship' && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<StarIcon />}
                              onClick={() => handleConvertEmploymentType(e)}
                              sx={{
                                fontWeight: 700,
                                borderRadius: '8px',
                                fontSize: 11,
                                bgcolor: '#16a34a',
                                color: '#fff',
                                boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
                                '&:hover': { bgcolor: '#15803d' }
                              }}
                            >
                              Promote to Staff
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<TaskIcon />}
                            onClick={() => handleOpenLogWorkModal(e.id)}
                            sx={{
                              fontWeight: 700,
                              borderRadius: '8px',
                              fontSize: 11,
                              borderColor: '#3b82f6',
                              color: '#1d4ed8',
                              '&:hover': { bgcolor: '#eff6ff', borderColor: '#2563eb' }
                            }}
                          >
                            Log Work / Plan
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PayrollIcon />}
                            onClick={() => handleOpenSalaryModal(e)}
                            sx={{
                              fontWeight: 700,
                              borderRadius: '8px',
                              fontSize: 11,
                              bgcolor: '#0f766e',
                              color: '#fff',
                              '&:hover': { bgcolor: '#115e59' }
                            }}
                          >
                            {(() => {
                              const struct = salaryStructures.find(s => s.employee_id === e.id);
                              return (parseFloat(struct?.monthly_salary) || 0) > 0 ? 'Edit Salary' : 'Set Salary';
                            })()}
                          </Button>
                          {(e.status === 'resigned' || e.status === 'inactive') ? (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleReactivateEmployee(e)}
                              disabled={actionLoading}
                              sx={{ fontWeight: 700, borderRadius: '8px', fontSize: 11 }}
                            >
                              Reactivate
                            </Button>
                          ) : e.role !== 'admin' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleOpenDeactivate(e)}
                              disabled={actionLoading}
                              sx={{ fontWeight: 700, borderRadius: '8px', fontSize: 11 }}
                            >
                              Mark Resigned
                            </Button>
                          ) : null}

                          <Button
                            size="small"
                            variant="outlined"
                            color={e.work_mode === 'wfh' ? 'primary' : 'secondary'}
                            onClick={() => handleToggleWorkMode(e.id, e.work_mode)}
                            disabled={actionLoading}
                            sx={{ fontWeight: 700, borderRadius: '8px', fontSize: 11 }}
                          >
                            {e.work_mode === 'wfh' ? 'Switch to Office' : 'Switch to WFH'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={Boolean(e.documents_frozen === true || e.documents_frozen === 'true' || e.documents_frozen === 't') ? <LockIcon sx={{ color: '#dc2626' }} /> : <DocumentIcon />}
                            onClick={() => {
                              setSelectedComplianceEmp(e);
                              setOpenComplianceModal(true);
                            }}
                            sx={{
                              fontWeight: 700,
                              borderRadius: '8px',
                              fontSize: 11,
                              color: Boolean(e.documents_frozen === true || e.documents_frozen === 'true' || e.documents_frozen === 't') ? '#dc2626' : '#133829',
                              borderColor: Boolean(e.documents_frozen === true || e.documents_frozen === 'true' || e.documents_frozen === 't') ? '#fca5a5' : '#cbd5e1',
                              bgcolor: Boolean(e.documents_frozen === true || e.documents_frozen === 'true' || e.documents_frozen === 't') ? '#fef2f2' : 'transparent',
                              '&:hover': {
                                bgcolor: Boolean(e.documents_frozen === true || e.documents_frozen === 'true' || e.documents_frozen === 't') ? '#fee2e2' : '#f1f5f9',
                                borderColor: Boolean(e.documents_frozen === true || e.documents_frozen === 'true' || e.documents_frozen === 't') ? '#ef4444' : '#133829'
                              }
                            }}
                          >
                            Compliance Docs {e.documents?.length ? `(${e.documents.length})` : ''}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setSelectedTimesheetEmpId(e.id);
                              setActiveTab(7);
                            }}
                            sx={{
                              fontWeight: 700,
                              borderRadius: '8px',
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
                            sx={{ fontWeight: 700, borderRadius: '8px' }}
                          >
                            Full Report
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

          {/* TAB 9: Audit & Communications Trail */}
          {activeTab === 9 && (
            <Box sx={{ overflowX: 'auto', width: '100%' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Management & Staff Communications Audit Trail
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  All administrative overrides, regularizations, and notifications are permanently logged for compliance.
                </Typography>
              </Box>

              {filteredAuditLogs.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No communication or audit logs found matching current search.
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
                    {filteredAuditLogs.map((l) => (
                      <TableRow key={l.id} hover>
                        <TableCell sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {l.created_at ? format(new Date(l.created_at), 'dd MMM yyyy, hh:mm a') : '--'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={l.type || 'LOG'}
                            size="small"
                            color={l.type?.includes('OVERRIDE') ? 'error' : l.type?.includes('APPROVED') ? 'success' : 'primary'}
                            sx={{ fontWeight: 800, fontSize: 10, borderRadius: '6px' }}
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

          {/* TAB 10: System Settings & Holidays */}
          {activeTab === 10 && (
            <Box>
              {/* Office Shift Timings & Grace Period Settings (Configurable) */}
              <Box sx={{ mb: 4, p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                {/* Header with Title and Segmented Switcher */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2.5 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon sx={{ color: timingTab === 'intern' ? '#7e22ce' : 'primary.main' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        Office Shift Hours & Required Working Hours
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                      Configure customized shift spans, punch-in late grace cutoffs, and average daily needed working hours separately for Staff and Interns.
                    </Typography>
                  </Box>

                  {/* Responsive Segmented Role Pill Switcher */}
                  <Box sx={{ display: 'flex', p: 0.5, bgcolor: '#f1f5f9', borderRadius: '10px', gap: 0.5, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
                    <Button
                      size="small"
                      startIcon={<BriefcaseIcon sx={{ fontSize: 16 }} />}
                      onClick={() => setTimingTab('staff')}
                      sx={{
                        flex: { xs: 1, sm: 'initial' },
                        fontWeight: 700,
                        fontSize: 13,
                        borderRadius: '8px',
                        textTransform: 'none',
                        px: 2,
                        py: 0.75,
                        bgcolor: timingTab === 'staff' ? '#133829' : 'transparent',
                        color: timingTab === 'staff' ? '#ffffff' : '#64748b',
                        boxShadow: timingTab === 'staff' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                        '&:hover': { bgcolor: timingTab === 'staff' ? '#0b2319' : '#e2e8f0' }
                      }}
                    >
                      Full-Time Staff
                    </Button>
                    <Button
                      size="small"
                      startIcon={<SchoolIcon sx={{ fontSize: 16 }} />}
                      onClick={() => setTimingTab('intern')}
                      sx={{
                        flex: { xs: 1, sm: 'initial' },
                        fontWeight: 700,
                        fontSize: 13,
                        borderRadius: '8px',
                        textTransform: 'none',
                        px: 2,
                        py: 0.75,
                        bgcolor: timingTab === 'intern' ? '#7e22ce' : 'transparent',
                        color: timingTab === 'intern' ? '#ffffff' : '#64748b',
                        boxShadow: timingTab === 'intern' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                        '&:hover': { bgcolor: timingTab === 'intern' ? '#6b21a8' : '#e2e8f0' }
                      }}
                    >
                      Internship Trainees
                    </Button>
                  </Box>
                </Box>

                {/* Status KPI preview for current selected role */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                  {timingTab === 'staff' ? (
                    <>
                      <Chip
                        size="small"
                        icon={<BriefcaseIcon sx={{ fontSize: '14px !important', color: '#166534 !important' }} />}
                        label={`Staff Shift: ${getShiftDuration(officeTimings.opening_time, officeTimings.closing_time)} hrs (${formatTime12h(officeTimings.opening_time)} – ${formatTime12h(officeTimings.closing_time)})`}
                        sx={{ fontWeight: 700, bgcolor: '#f0fdf4', color: '#166534', borderRadius: '6px', border: '1px solid #bbf7d0' }}
                      />
                      <Chip
                        size="small"
                        label={`Late Grace: +${getGraceMinutes(officeTimings.opening_time, officeTimings.late_grace_time)}m (until ${formatTime12h(officeTimings.late_grace_time)})`}
                        sx={{ fontWeight: 700, bgcolor: '#fffbeb', color: '#b45309', borderRadius: '6px', border: '1px solid #fde68a' }}
                      />
                      <Chip
                        size="small"
                        label={`Daily Target: ${officeTimings.avg_daily_hours || officeTimings.full_day_hours || 8.5} hrs/day`}
                        sx={{ fontWeight: 700, bgcolor: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', border: '1px solid #bfdbfe' }}
                      />
                    </>
                  ) : (
                    <>
                      <Chip
                        size="small"
                        icon={<SchoolIcon sx={{ fontSize: '14px !important', color: '#7e22ce !important' }} />}
                        label={`Intern Shift: ${getShiftDuration(officeTimings.intern_opening_time || '10:00', officeTimings.intern_closing_time || '16:30')} hrs (${formatTime12h(officeTimings.intern_opening_time || '10:00')} – ${formatTime12h(officeTimings.intern_closing_time || '16:30')})`}
                        sx={{ fontWeight: 700, bgcolor: '#faf5ff', color: '#7e22ce', borderRadius: '6px', border: '1px solid #d8b4fe' }}
                      />
                      <Chip
                        size="small"
                        label={`Intern Grace: +${getGraceMinutes(officeTimings.intern_opening_time || '10:00', officeTimings.intern_late_grace_time || '10:15')}m (until ${formatTime12h(officeTimings.intern_late_grace_time || '10:15')})`}
                        sx={{ fontWeight: 700, bgcolor: '#fffbeb', color: '#b45309', borderRadius: '6px', border: '1px solid #fde68a' }}
                      />
                      <Chip
                        size="small"
                        label={`Intern Daily Target: ${officeTimings.intern_avg_daily_hours || officeTimings.intern_full_day_hours || 6.0} hrs/day`}
                        sx={{ fontWeight: 800, bgcolor: '#f3e8ff', color: '#6b21a8', borderRadius: '6px', border: '1px solid #d8b4fe' }}
                      />
                    </>
                  )}
                </Box>

                {timingTab === 'intern' && (
                  <Alert severity="info" sx={{ mb: 2.5, borderRadius: '8px', fontSize: 13 }}>
                    <strong>Intern Lighter Hours Policy:</strong> Interns do not have the same heavy shift requirements as regular full-time staff. Punch-in late grace, timesheet average performance, and minimum working hours are calibrated against these intern criteria.
                  </Alert>
                )}

                <form onSubmit={handleSaveOfficeTimings}>
                  {timingTab === 'staff' ? (
                    <Grid container spacing={2.5}>
                      {/* Section 1: Staff Shift Timings */}
                      <Grid item xs={12} sm={6} md={4}>
                        <TimePicker12h
                          label="Office Opening Time"
                          value={officeTimings.opening_time}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, opening_time: e.target.value }))}
                          helperText="Official shift start (e.g. 09:30 AM)"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TimePicker12h
                          label="Late Entry Grace Cutoff"
                          value={officeTimings.late_grace_time}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, late_grace_time: e.target.value }))}
                          helperText="Punches after this are marked Late"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TimePicker12h
                          label="Office Closing Time"
                          value={officeTimings.closing_time}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, closing_time: e.target.value }))}
                          helperText="Official shift end (e.g. 06:30 PM)"
                        />
                      </Grid>

                      {/* Section 2: Staff Required Working Hours */}
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Full-Day Min Hours"
                          value={officeTimings.full_day_hours}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, full_day_hours: parseFloat(e.target.value) || 0 }))}
                          inputProps={{ min: 1, max: 24, step: 0.5 }}
                          helperText="Minimum hours for full 'Present'"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Half-Day Min Hours"
                          value={officeTimings.half_day_hours}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, half_day_hours: parseFloat(e.target.value) || 0 }))}
                          inputProps={{ min: 1, max: 24, step: 0.5 }}
                          helperText="Minimum hours for 'Half Day'"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Needed Daily Average Hours"
                          value={officeTimings.avg_daily_hours || officeTimings.full_day_hours || 8.5}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, avg_daily_hours: parseFloat(e.target.value) || 0 }))}
                          inputProps={{ min: 1, max: 24, step: 0.5 }}
                          helperText="Standard timesheet target (e.g. 8.5h/day)"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <Grid container spacing={2.5}>
                      {/* Section 1: Intern Shift Timings */}
                      <Grid item xs={12} sm={6} md={4}>
                        <TimePicker12h
                          label="Intern Opening Time"
                          value={officeTimings.intern_opening_time || '10:00'}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, intern_opening_time: e.target.value }))}
                          helperText="Intern arrival (e.g. 10:00 AM)"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TimePicker12h
                          label="Intern Late Grace Cutoff"
                          value={officeTimings.intern_late_grace_time || '10:15'}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, intern_late_grace_time: e.target.value }))}
                          helperText="Intern grace until (e.g. 10:15 AM)"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TimePicker12h
                          label="Intern Closing Time"
                          value={(officeTimings.intern_closing_time && officeTimings.intern_closing_time !== '18:30') ? officeTimings.intern_closing_time : '16:30'}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, intern_closing_time: e.target.value }))}
                          helperText="Intern shift ends (e.g. 04:30 PM)"
                        />
                      </Grid>

                      {/* Section 2: Intern Lighter Required Working Hours */}
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Intern Full-Day Min Hours"
                          value={officeTimings.intern_full_day_hours !== undefined ? officeTimings.intern_full_day_hours : 6.0}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, intern_full_day_hours: parseFloat(e.target.value) || 0 }))}
                          inputProps={{ min: 1, max: 24, step: 0.5 }}
                          helperText="Min hrs for 'Present' (e.g. 6.0h)"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Intern Half-Day Min Hours"
                          value={officeTimings.intern_half_day_hours !== undefined ? officeTimings.intern_half_day_hours : 3.0}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, intern_half_day_hours: parseFloat(e.target.value) || 0 }))}
                          inputProps={{ min: 1, max: 24, step: 0.5 }}
                          helperText="Min hrs for 'Half Day' (e.g. 3.0h)"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Intern Needed Daily Average"
                          value={officeTimings.intern_avg_daily_hours !== undefined ? officeTimings.intern_avg_daily_hours : 6.0}
                          onChange={(e) => setOfficeTimings(p => ({ ...p, intern_avg_daily_hours: parseFloat(e.target.value) || 0 }))}
                          inputProps={{ min: 1, max: 24, step: 0.5 }}
                          helperText="Target daily average (e.g. 6.0h/day)"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {/* Responsive Footer */}
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {timingTab === 'staff'
                        ? `Staff punches submitted after ${formatTime12h(officeTimings.late_grace_time)} will automatically flag attendance as Late.`
                        : `Intern punches submitted after ${formatTime12h(officeTimings.intern_late_grace_time || '10:15')} will automatically flag attendance as Late.`}
                    </Typography>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={savingTimings}
                      startIcon={savingTimings ? <CircularProgress size={16} color="inherit" /> : <TimeIcon fontSize="small" />}
                      sx={{
                        fontWeight: 700,
                        borderRadius: '8px',
                        bgcolor: timingTab === 'intern' ? '#7e22ce' : '#133829',
                        '&:hover': { bgcolor: timingTab === 'intern' ? '#6b21a8' : '#0b2319' },
                        whiteSpace: 'nowrap',
                        px: 3,
                        py: 1,
                        width: { xs: '100%', sm: 'auto' }
                      }}
                    >
                      {savingTimings ? 'Saving Timings...' : 'Save Office & Intern Working Hours'}
                    </Button>
                  </Box>
                </form>
              </Box>

              {/* Geofence Info (Read-Only) */}
              <Box sx={{ mb: 4, p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocationIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>Office Geofencing Perimeter (Configured in .env)</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                  Geofence boundary is permanently configured via environment variables (.env) on the production server.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>OFFICE LATITUDE</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#133829', fontFamily: 'monospace' }}>{settingsForm.officeLatitude || '--'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>OFFICE LONGITUDE</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#133829', fontFamily: 'monospace' }}>{settingsForm.officeLongitude || '--'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>ALLOWED RADIUS</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#133829', fontFamily: 'monospace' }}>{settingsForm.officeRadiusMeters || 150}m</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Holiday & Calendar Manager */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>Company Holidays & Sunday Overrides</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Configure official holidays or mark specific Sundays as active working days.</Typography>
                </Box>
              </Box>

              {/* Add Holiday Form */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
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
                  label="Name / Reason"
                  placeholder="e.g. Diwali, Compensatory Shift, Working Sunday"
                  value={holidayForm.name}
                  onChange={e => setHolidayForm(p => ({ ...p, name: e.target.value }))}
                  sx={{ minWidth: 220, flex: 1 }}
                />
                <TextField
                  size="small"
                  select
                  label="Day Type"
                  value={holidayForm.type}
                  onChange={e => setHolidayForm(p => ({ ...p, type: e.target.value }))}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="Public Holiday">Public Holiday (Off)</MenuItem>
                  <MenuItem value="Company Off-Day">Company Off-Day (Off)</MenuItem>
                  <MenuItem value="Working Sunday">Working Sunday (Shift Open)</MenuItem>
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
                      toast.error(err.response?.data?.error || 'Failed to add calendar entry.');
                    } finally { setAddingHoliday(false); }
                  }}
                  sx={{ fontWeight: 700, borderRadius: '10px', bgcolor: '#133829', whiteSpace: 'nowrap' }}
                >
                  Save Calendar Entry
                </Button>
              </Box>

              {/* Sunday info chip */}
              <Alert severity="info" sx={{ mb: 2, borderRadius: '10px', fontWeight: 600 }}>
                <strong>Sundays</strong> are non-working by default. To make a specific Sunday an official working day, select <strong>"Working Sunday (Shift Open)"</strong> above.
              </Alert>

              {/* Holidays Table */}
              {filteredHolidays.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No custom holidays or Sunday overrides found matching current search.</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto', width: '100%' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Title / Description</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Configured By</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredHolidays.map(h => {
                        const isWorking = h.type === 'Working Sunday' || h.name?.toLowerCase().includes('working');
                        return (
                          <TableRow key={h.id || h.date} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{h.date}</TableCell>
                            <TableCell>
                              <Chip
                                label={h.name}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: isWorking ? '#dcfce7' : '#ede9fe',
                                  color: isWorking ? '#15803d' : '#6d28d9',
                                  borderRadius: '6px'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: '#64748b', fontSize: 13, fontWeight: isWorking ? 700 : 400 }}>
                              {h.type}
                            </TableCell>
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
                                        toast.success(`Entry "${h.name}" removed.`);
                                        setHolidays(prev => prev.filter(x => x.date !== h.date));
                                      } catch (err) {
                                        toast.error(err.response?.data?.error || 'Failed to remove entry.');
                                      }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}

          {activeTab === 11 && (
            <Box>
              <AdminPayrollManagement
                salaryStructures={salaryStructures}
                onSalaryUpdate={(updated) => {
                  setSalaryStructures(prev => {
                    const idx = prev.findIndex(s => s.employee_id === updated.employee_id);
                    if (idx >= 0) {
                      const next = [...prev];
                      next[idx] = { ...next[idx], ...updated };
                      return next;
                    }
                    return [...prev, updated];
                  });
                }}
              />
            </Box>
          )}

          {activeTab === 12 && (
            <Box>
              <AdminMemoManagement employees={employees} />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      <Dialog open={openEmpModal} onClose={() => setOpenEmpModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateEmployee}>
          <DialogTitle sx={{ fontWeight: 700 }}>Register New Staff Member</DialogTitle>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2, borderRadius: '10px', fontWeight: 600 }}>
              <strong>Automated Onboarding & OTP Login</strong>: An official onboarding invitation email with Employee ID and login instructions will be sent automatically to the employee.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Full Name" required value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="email" label="Email Address" required value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="System Role" value={empForm.role} onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}>
                  <MenuItem value="employee">Employee / Staff</MenuItem>
                  <MenuItem value="admin">Admin / HR Manager</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Employment Category"
                  value={empForm.employment_type || 'full_time'}
                  onChange={(e) => {
                    const newType = e.target.value;
                    const autoDesignation = newType === 'internship' && empForm.designation === 'Software Developer'
                      ? 'Software Intern'
                      : (newType === 'full_time' && empForm.designation === 'Software Intern' ? 'Software Developer' : empForm.designation);
                    setEmpForm({
                      ...empForm,
                      employment_type: newType,
                      designation: autoDesignation
                    });
                  }}
                >
                  <MenuItem value="full_time">Full-Time Staff (Regular Permanent)</MenuItem>
                  <MenuItem value="internship">Internship / Trainee (Learning Track)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Attendance & Work Mode" value={empForm.work_mode || 'office'} onChange={(e) => setEmpForm({ ...empForm, work_mode: e.target.value })}>
                  <MenuItem value="office">In-Office (GPS Perimeter Required)</MenuItem>
                  <MenuItem value="wfh">Work From Home (WFH - GPS Bypassed)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Department" value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
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
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <form onSubmit={handleManualAttendanceSubmit}>
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ManualAttendanceIcon sx={{ color: '#133829' }} />
            Manual Attendance Entry / Override
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px' }}>
              <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600, display: 'block' }}>
                This administrative action directly records or updates employee attendance in company records. A mandatory audit reason is required.
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id} sx={{ fontSize: 13, borderRadius: '8px' }}>
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                >
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Late">Late</MenuItem>
                  <MenuItem value="Half Day">Half Day</MenuItem>
                  <MenuItem value="Field Duty / On-Duty">Field Duty / On-Duty</MenuItem>
                  <MenuItem value="Regularized">Regularized</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TimePicker12h
                  required
                  label="Login Time"
                  value={manualForm.login_time}
                  onChange={(e) => setManualForm({ ...manualForm, login_time: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TimePicker12h
                  label="Logout Time"
                  value={manualForm.logout_time}
                  onChange={(e) => setManualForm({ ...manualForm, logout_time: e.target.value })}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenManualAttendanceModal(false)} color="inherit" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading}
              sx={{
                fontWeight: 700,
                borderRadius: '8px',
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
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <form onSubmit={handleResolveRequest}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            Resolve Employee Regularization Request
          </DialogTitle>
          <DialogContent dividers>
            {selectedReq && (
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {selectedReq.employee_name} ({selectedReq.employee_id})
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                  Date: <strong>{selectedReq.date}</strong> • Requested: <strong>{formatTime12h(selectedReq.requested_login_time)}</strong> to <strong>{selectedReq.requested_logout_time ? formatTime12h(selectedReq.requested_logout_time) : '--'}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', bgcolor: '#ffffff', p: 1, border: '1px solid #e2e8f0', borderRadius: '10px' }}>
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenResolveModal(false)} color="inherit" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color={resolveAction === 'Approved' ? 'success' : 'error'}
              disabled={actionLoading}
              sx={{ fontWeight: 700, borderRadius: '8px' }}
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
            borderRadius: '12px',
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
              borderRadius: '12px',
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
              <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {rejectionTarget.item.employee_name || rejectionTarget.item.employee_id}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                  {rejectionTarget.type === 'leave' && `Leave Request: ${rejectionTarget.item.leave_type} (${rejectionTarget.item.start_date} to ${rejectionTarget.item.end_date} • ${rejectionTarget.item.total_days} days)`}
                  {rejectionTarget.type === 'permission' && `Permission Pass: ${rejectionTarget.item.date} (${formatTime12h(rejectionTarget.item.start_time)} - ${formatTime12h(rejectionTarget.item.end_time)} • ${rejectionTarget.item.duration_hours} hrs)`}
                  {rejectionTarget.type === 'regularization' && `Attendance Regularization: ${rejectionTarget.item.date} (${formatTime12h(rejectionTarget.item.requested_login_time)} to ${rejectionTarget.item.requested_logout_time ? formatTime12h(rejectionTarget.item.requested_logout_time) : 'EOD'})`}
                </Typography>
                {rejectionTarget.item.reason && (
                  <Typography variant="body2" sx={{ mt: 1, color: '#475569', fontSize: 13, fontStyle: 'italic', bgcolor: '#ffffff', p: 1, border: '1px solid #e2e8f0', borderRadius: '10px' }}>
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
                    borderRadius: '6px',
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setOpenRejectionModal(false)} color="inherit" sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading || !rejectionReasonText.trim()}
              sx={{
                borderRadius: '8px',
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

      {/* Staff Compliance Documents & Statutory Audit Modal */}
      <Dialog
        open={openComplianceModal}
        onClose={() => setOpenComplianceModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              bgcolor: 'rgba(19, 56, 41, 0.1)',
              color: '#133829',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SecurityIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                Staff Compliance & Document Audit
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                {selectedComplianceEmp ? `${selectedComplianceEmp.name} (${selectedComplianceEmp.id}) • ${selectedComplianceEmp.designation} • ${selectedComplianceEmp.department}` : ''}
              </Typography>
            </Box>
          </Box>
          {selectedComplianceEmp?.documents_frozen && (
            <Chip
              icon={<LockIcon sx={{ fontSize: '14px !important' }} />}
              label="Records Frozen"
              color="error"
              size="small"
              sx={{ fontWeight: 800, borderRadius: '6px', height: 24, fontSize: 11 }}
            />
          )}
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {selectedComplianceEmp && (
            <Box>
              {/* Top Summary & Admin Lock Action Banner */}
              <Box sx={{
                p: 2,
                mb: 3,
                bgcolor: selectedComplianceEmp.documents_frozen ? '#fef2f2' : '#f0fdf4',
                border: '1px solid',
                borderColor: selectedComplianceEmp.documents_frozen ? '#fecaca' : '#bbf7d0',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2
              }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: selectedComplianceEmp.documents_frozen ? '#991b1b' : '#166534' }}>
                    {selectedComplianceEmp.documents_frozen ? 'Document Modification Locked by Admin' : 'Document Records Open for Staff Update'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: selectedComplianceEmp.documents_frozen ? '#b91c1c' : '#15803d', display: 'block', mt: 0.3 }}>
                    {selectedComplianceEmp.documents_frozen
                      ? `Locked & verified on ${selectedComplianceEmp.frozen_at ? format(new Date(selectedComplianceEmp.frozen_at), 'dd MMM yyyy, hh:mm a') : 'Company Records'}. Staff cannot edit or delete documents while locked.`
                      : 'Staff can upload, replace, or update compliance documents and statutory records.'}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  color={Boolean(selectedComplianceEmp.documents_frozen === true || selectedComplianceEmp.documents_frozen === 'true' || selectedComplianceEmp.documents_frozen === 't') ? 'warning' : 'error'}
                  startIcon={freezeActionLoading ? <CircularProgress size={14} color="inherit" /> : Boolean(selectedComplianceEmp.documents_frozen === true || selectedComplianceEmp.documents_frozen === 'true' || selectedComplianceEmp.documents_frozen === 't') ? <LockOpenIcon /> : <LockIcon />}
                  onClick={() => handleToggleFreezeFromAdmin(selectedComplianceEmp)}
                  disabled={freezeActionLoading}
                  sx={{
                    fontWeight: 700,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: 12,
                    flexShrink: 0
                  }}
                >
                  {freezeActionLoading ? 'Updating...' : Boolean(selectedComplianceEmp.documents_frozen === true || selectedComplianceEmp.documents_frozen === 'true' || selectedComplianceEmp.documents_frozen === 't') ? 'Unfreeze Documents' : 'Freeze & Verify Documents'}
                </Button>
              </Box>

              {/* SECTION 1: Statutory & Banking Details (With UPI ID) */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.04em', mb: 1.5 }}>
                1. Statutory Tax & Payroll Banking Records
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>BANK NAME</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {selectedComplianceEmp.statutory_info?.bank_name || 'Not Submitted'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>ACCOUNT NUMBER</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {selectedComplianceEmp.statutory_info?.bank_account_number || 'Not Submitted'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>IFSC CODE</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {selectedComplianceEmp.statutory_info?.ifsc_code || 'Not Submitted'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>ACCOUNT HOLDER NAME</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {selectedComplianceEmp.statutory_info?.account_holder_name || selectedComplianceEmp.name}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800, display: 'block' }}>UPI ID / VPA (INSTANT PAYOUT)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>
                      {selectedComplianceEmp.statutory_info?.upi_id || 'Not Configured'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>PAN NUMBER</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {selectedComplianceEmp.statutory_info?.pan_number || 'Not Submitted'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>AADHAAR NUMBER</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {selectedComplianceEmp.statutory_info?.aadhaar_number || 'Not Submitted'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>UAN / PF NUMBER</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {selectedComplianceEmp.statutory_info?.uan_pf_number || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* SECTION 2: Compliance Documents Uploaded to Cloudflare R2 */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.04em', mb: 1.5 }}>
                2. Uploaded Compliance Files & Verification Documents ({selectedComplianceEmp.documents?.length || 0} Files)
              </Typography>

              {(!selectedComplianceEmp.documents || selectedComplianceEmp.documents.length === 0) ? (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', mb: 3 }}>
                  <DocumentIcon sx={{ fontSize: 36, color: '#94a3b8', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
                    No compliance documents uploaded yet by this employee.
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Employee can upload government IDs, PAN copy, bank passbook, and certificates from their Profile page.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {selectedComplianceEmp.documents.map((doc, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Card sx={{ border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', borderRadius: '10px' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DocumentIcon sx={{ color: '#15803d', fontSize: 20 }} />
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                {doc.key === 'govt_id' ? 'Government ID Proof' :
                                 doc.key === 'pan_card' ? 'PAN Card Copy' :
                                 doc.key === 'bank_proof' ? 'Bank Passbook / Cheque' :
                                 doc.key === 'education_cert' ? 'Educational Certificate' :
                                 doc.key === 'relieving_exp' ? 'Experience / Relieving Letter' : (doc.name || 'Compliance Document')}
                              </Typography>
                            </Box>
                            <Chip label="Verified File" size="small" sx={{ height: 18, fontSize: 9, fontWeight: 800, bgcolor: '#dcfce7', color: '#15803d', borderRadius: '6px' }} />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#ffffff', p: 1.2, borderRadius: '6px', border: '1px solid #e2e8f0', mt: 1 }}>
                            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {doc.name || 'file'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
                                {doc.size || 'Standard Size'} • Uploaded: {doc.uploaded_at ? format(new Date(doc.uploaded_at), 'dd MMM yyyy') : 'Recent'}
                              </Typography>
                            </Box>

                            {doc.url && (
                              <Button
                                size="small"
                                variant="contained"
                                component="a"
                                href={doc.url.startsWith('http') ? doc.url : `${(import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '')}${doc.url.startsWith('/') ? doc.url : '/' + doc.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<ViewIcon sx={{ fontSize: 14 }} />}
                                sx={{
                                  borderRadius: '10px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  bgcolor: '#133829',
                                  color: '#ffffff',
                                  textTransform: 'none',
                                  flexShrink: 0,
                                  ml: 1,
                                  '&:hover': { bgcolor: '#0f291e' }
                                }}
                              >
                                View File
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* SECTION 3: Emergency Contacts */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.04em', mb: 1.5 }}>
                3. Emergency Contact Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>CONTACT PERSON</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {selectedComplianceEmp.emergency_contacts?.contact_name || 'Not Provided'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>RELATIONSHIP</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {selectedComplianceEmp.emergency_contacts?.relationship || 'Not Specified'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>EMERGENCY PHONE</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {selectedComplianceEmp.emergency_contacts?.contact_phone || 'Not Provided'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenComplianceModal(false)} variant="contained" sx={{ bgcolor: '#133829', color: '#fff', borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
            Close Audit Viewer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Staff Resignation & Soft Delete Modal */}
      <Dialog open={openDeactivateModal} onClose={() => !deactivateLoading && setOpenDeactivateModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleConfirmDeactivate}>
          <DialogTitle sx={{ fontWeight: 800, color: '#991b1b', borderBottom: '1px solid #fee2e2', bgcolor: '#fff5f5' }}>
            Staff Resignation & Account Deactivation
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '10px' }}>
              <strong>Notice:</strong> Marking this employee as <strong>Resigned</strong> or <strong>Inactive</strong> softly deactivates their portal access, archives their pending requests, and removes them from the active daily attendance headcount. All past timesheet records and audit logs are permanently retained.
            </Alert>

            {deactivateTarget && (
              <Box sx={{ p: 2, mb: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>Target Employee</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {deactivateTarget.name} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>({deactivateTarget.id})</span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: 13 }}>
                  {deactivateTarget.designation} • {deactivateTarget.department} • {deactivateTarget.email}
                </Typography>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Status Action"
                  value={deactivateForm.status}
                  onChange={(e) => setDeactivateForm({ ...deactivateForm, status: e.target.value })}
                >
                  <MenuItem value="resigned">Resigned (Official Exit)</MenuItem>
                  <MenuItem value="inactive">Inactive (Deactivated)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Effective Exit Date"
                  InputLabelProps={{ shrink: true }}
                  required
                  value={deactivateForm.effective_date}
                  onChange={(e) => setDeactivateForm({ ...deactivateForm, effective_date: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Resignation Reason / Exit Remarks"
                  placeholder="e.g. Relieved on mutual agreement, career relocation, personal reasons..."
                  required
                  value={deactivateForm.reason}
                  onChange={(e) => setDeactivateForm({ ...deactivateForm, reason: e.target.value })}
                  helperText="Required for company compliance and permanent audit records."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button
              onClick={() => setOpenDeactivateModal(false)}
              disabled={deactivateLoading}
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="error"
              disabled={deactivateLoading}
              sx={{ fontWeight: 800, borderRadius: '8px', px: 2.5 }}
            >
              {deactivateLoading ? 'Processing...' : 'Confirm Resignation & Deactivate'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Staff Directory: Configure Salary & Bank Package Modal */}
      <Dialog
        open={openSalaryModal}
        onClose={() => !salarySaving && setOpenSalaryModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSaveSalaryStructure}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0f766e', borderBottom: '1px solid #ccfbf1', bgcolor: '#f0fdfa', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PayrollIcon sx={{ color: '#0f766e' }} />
            Configure Employee Salary & Bank Details
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedSalaryEmp && (
              <Box sx={{ p: 2, mb: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>
                  Target Staff Member
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {selectedSalaryEmp.name} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>({selectedSalaryEmp.id})</span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: 13 }}>
                  {selectedSalaryEmp.designation} • {selectedSalaryEmp.department} • {selectedSalaryEmp.email}
                </Typography>
              </Box>
            )}

            <Alert severity="info" sx={{ mb: 2.5, borderRadius: '10px' }}>
              <strong>Startup Compensation Engine:</strong> Base monthly salary is divided by monthly working days (excluding Sundays, but including registered Working Sundays). LOP days are deducted automatically when generating payroll.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Monthly Base Salary (INR ₹)"
                  type="number"
                  required
                  placeholder="e.g. 45000"
                  value={salaryForm.monthly_salary}
                  onChange={(e) => setSalaryForm({ ...salaryForm, monthly_salary: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                  helperText={salaryForm.monthly_salary ? `Calculated Gross: ${formatINR(salaryForm.monthly_salary)} / month` : 'Enter monthly base salary'}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Bank Name"
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={salaryForm.bank_name}
                  onChange={(e) => setSalaryForm({ ...salaryForm, bank_name: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Account Number"
                  placeholder="e.g. 501004928172"
                  value={salaryForm.account_number}
                  onChange={(e) => setSalaryForm({ ...salaryForm, account_number: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="IFSC Code"
                  placeholder="e.g. HDFC0001234"
                  value={salaryForm.ifsc_code}
                  onChange={(e) => setSalaryForm({ ...salaryForm, ifsc_code: e.target.value.toUpperCase() })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="UPI ID"
                  placeholder="e.g. staff@okhdfcbank"
                  value={salaryForm.upi_id}
                  onChange={(e) => setSalaryForm({ ...salaryForm, upi_id: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="PAN Number"
                  placeholder="e.g. ABCDE1234F"
                  value={salaryForm.pan_number}
                  onChange={(e) => setSalaryForm({ ...salaryForm, pan_number: e.target.value.toUpperCase() })}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button
              onClick={() => setOpenSalaryModal(false)}
              disabled={salarySaving}
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={salarySaving}
              sx={{
                fontWeight: 800,
                borderRadius: '8px',
                px: 3,
                bgcolor: '#0f766e',
                color: '#fff',
                '&:hover': { bgcolor: '#115e59' }
              }}
            >
              {salarySaving ? <CircularProgress size={18} sx={{ color: '#fff', mr: 1 }} /> : null}
              {salarySaving ? 'Saving Package...' : 'Save Salary Package'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Manager Log Work & Deliverable Plan Modal */}
      <Dialog
        open={openLogWorkModal}
        onClose={() => !logWorkLoading && setOpenLogWorkModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSaveWorkLog}>
          <DialogTitle sx={{ fontWeight: 800, pb: 1, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
            <TaskIcon sx={{ color: '#2563eb' }} />
            Log Work & Activity Plan
          </DialogTitle>
          <DialogContent sx={{ pt: 2.5 }}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Record completed work items and define upcoming plans/deliverables for yourself or any team member.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Assign To / Staff Member"
                  value={logWorkForm.employee_id}
                  onChange={(e) => setLogWorkForm({ ...logWorkForm, employee_id: e.target.value })}
                  helperText="Select staff member, or leave as Manager/Self"
                >
                  <MenuItem value="">
                    <em>Myself (Logged as Manager / Admin)</em>
                  </MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id}) — {emp.designation || emp.department}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="Log Date"
                  value={logWorkForm.date}
                  onChange={(e) => setLogWorkForm({ ...logWorkForm, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={7}>
                <TextField
                  fullWidth
                  size="small"
                  label="Project / Module"
                  required
                  placeholder="e.g. Core System, Mobile App, Payroll"
                  value={logWorkForm.project_name}
                  onChange={(e) => setLogWorkForm({ ...logWorkForm, project_name: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Current Status"
                  value={logWorkForm.status}
                  onChange={(e) => setLogWorkForm({ ...logWorkForm, status: e.target.value })}
                >
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="In-Progress">In-Progress</MenuItem>
                  <MenuItem value="Planned">Planned</MenuItem>
                  <MenuItem value="Pending/Blocked">Pending / Blocked</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Task Title / What Was Done"
                  required
                  placeholder="e.g. Completed module architecture & integration testing"
                  value={logWorkForm.task_title}
                  onChange={(e) => setLogWorkForm({ ...logWorkForm, task_title: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Detailed Work Description (What Was Done)"
                  placeholder="Provide technical specifics, commits, or milestone progress..."
                  value={logWorkForm.description}
                  onChange={(e) => setLogWorkForm({ ...logWorkForm, description: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Upcoming Plan / Next Deliverables (What They Plan To Do)"
                  placeholder="e.g. Deploy to staging, write documentation, review PR by tomorrow 2 PM..."
                  value={logWorkForm.plan}
                  onChange={(e) => setLogWorkForm({ ...logWorkForm, plan: e.target.value })}
                  sx={{
                    bgcolor: '#eff6ff',
                    borderRadius: '6px',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#93c5fd' }
                  }}
                  helperText="Forward-looking deliverable plan for this staff or yourself"
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ step: '0.5', min: '0' }}
                  label="Est. Hours"
                  value={logWorkForm.estimated_hours}
                  onChange={(e) => setLogWorkForm({ ...logWorkForm, estimated_hours: e.target.value })}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ step: '0.5', min: '0' }}
                  label="Actual Hours"
                  value={logWorkForm.actual_hours}
                  onChange={(e) => setLogWorkForm({ ...logWorkForm, actual_hours: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Internal Remarks / Notes (Optional)"
                  placeholder="Any blockers, dependencies, or manager observations..."
                  value={logWorkForm.remarks}
                  onChange={(e) => setLogWorkForm({ ...logWorkForm, remarks: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button
              onClick={() => setOpenLogWorkModal(false)}
              disabled={logWorkLoading}
              sx={{ fontWeight: 700 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={logWorkLoading}
              sx={{
                fontWeight: 800,
                borderRadius: '8px',
                px: 3,
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
            >
              {logWorkLoading ? <CircularProgress size={18} sx={{ color: '#fff', mr: 1 }} /> : null}
              {logWorkLoading ? 'Saving Record...' : 'Save Work & Plan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
