import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Print as PrintIcon,
  ChevronLeft as PrevMonthIcon,
  ChevronRight as NextMonthIcon,
  Refresh as RefreshIcon,
  CheckCircle as PresentIcon,
  AccessTime as LateIcon,
  EventBusy as LeaveIcon,
  Celebration as HolidayIcon,
  Weekend as SundayIcon,
  Person as PersonIcon,
  EditCalendar as OverrideIcon,
  Download as ExportIcon,
  FilterAlt as FilterIcon,
  Cancel as AbsentIcon,
  Assignment as TaskIcon,
  WorkOutline as WorkIcon
} from '@mui/icons-material';
import { format, addMonths, subMonths } from 'date-fns';
import { attendanceAPI, adminAPI } from '../services/api';
import toast from '../utils/muiToast';
import { generateExecutivePDFReport } from '../utils/pdfReportGenerator';

export default function AdminStaffTimesheets({ initialEmployeeId, employees = [], onRefreshParent }) {
  const [selectedEmpId, setSelectedEmpId] = useState(initialEmployeeId || '');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [timesheetData, setTimesheetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [localEmployees, setLocalEmployees] = useState(employees);

  // Quick Override Modal
  const [openOverrideModal, setOpenOverrideModal] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    employee_id: '',
    date: '',
    login_time: '09:30',
    logout_time: '18:30',
    status: 'Present',
    reason: ''
  });
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Load employees list if not passed from parent
  useEffect(() => {
    if (localEmployees.length === 0) {
      adminAPI.getEmployees().then(res => {
        const emps = res.data.employees || [];
        setLocalEmployees(emps);
        if (!selectedEmpId && emps.length > 0) {
          const firstStaff = emps.find(e => e.role !== 'admin') || emps[0];
          setSelectedEmpId(firstStaff.id);
        }
      }).catch(err => {
        console.error('Failed to load employees:', err);
      });
    } else if (!selectedEmpId && localEmployees.length > 0) {
      const firstStaff = localEmployees.find(e => e.role !== 'admin') || localEmployees[0];
      setSelectedEmpId(firstStaff.id);
    }
  }, [localEmployees, selectedEmpId]);

  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmpId(initialEmployeeId);
    }
  }, [initialEmployeeId]);

  const fetchTimesheet = async () => {
    if (!selectedEmpId) return;
    setLoading(true);
    try {
      const res = await attendanceAPI.getStaffMonthlyHistory({
        employee_id: selectedEmpId,
        month: selectedMonth
      });
      setTimesheetData(res.data);
    } catch (err) {
      console.error('Error fetching staff timesheet:', err);
      toast.error(err.response?.data?.error || 'Failed to load staff timesheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmpId && selectedMonth) {
      fetchTimesheet();
    }
  }, [selectedEmpId, selectedMonth]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prev = subMonths(new Date(y, m - 1, 1), 1);
    setSelectedMonth(format(prev, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const next = addMonths(new Date(y, m - 1, 1), 1);
    setSelectedMonth(format(next, 'yyyy-MM'));
  };

  const handleDownloadPDF = async () => {
    if (!timesheetData) return;
    try {
      const selectedEmp = localEmployees.find(e => e.id === selectedEmpId);
      const emp = timesheetData.employee || selectedEmp || {};
      const summary = timesheetData.summary || {};
      const days = timesheetData.days || [];

      const presentDays = timesheetData.present_days ?? summary.presentDaysCount ?? days.filter(d => ['Present', 'Late', 'Half-Day', 'Working Sunday'].includes(d.status)).length;
      const lateDays = timesheetData.late_days ?? summary.lateCount ?? days.filter(d => d.status === 'Late').length;
      const totalDays = timesheetData.past_days_count ?? summary.pastDaysCount ?? presentDays;
      const totalHours = timesheetData.total_hours ?? summary.totalWorkingHours ?? days.reduce((acc, d) => acc + (parseFloat(d.net_hours || d.total_hours || 0) || 0), 0).toFixed(1);
      const avgHours = timesheetData.avg_hours_per_day ?? summary.avgHoursPerDay ?? (presentDays > 0 ? (parseFloat(totalHours) / presentDays).toFixed(1) : '0.0');
      const totalTasks = timesheetData.total_tasks_completed ?? summary.totalTasksLogged ?? days.reduce((acc, d) => acc + (d.task_count || 0), 0);

      // Aggregate project breakdown from day tasks
      const projectMap = {};
      days.forEach(d => {
        (d.tasks || []).forEach(t => {
          const proj = t.project_name || t.project || 'General Operations';
          if (!projectMap[proj]) {
            projectMap[proj] = { projectName: proj, totalTasks: 0, completedTasks: 0, estimatedHours: 0, actualHours: 0 };
          }
          projectMap[proj].totalTasks += 1;
          if (t.status === 'Completed') projectMap[proj].completedTasks += 1;
          projectMap[proj].estimatedHours += parseFloat(t.estimated_hours || t.est || 0) || 0;
          projectMap[proj].actualHours += parseFloat(t.actual_hours || t.act || 0) || 0;
        });
      });

      const totalTaskActual = Object.values(projectMap).reduce((s, p) => s + p.actualHours, 0);
      const projectBreakdown = Object.values(projectMap).map(p => ({
        projectName: p.projectName,
        totalTasks: p.totalTasks,
        completedTasks: p.completedTasks,
        estimatedHours: p.estimatedHours.toFixed(1),
        actualHours: p.actualHours.toFixed(1),
        completionRate: p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 100,
        percentageShare: totalTaskActual > 0 ? Math.round((p.actualHours / totalTaskActual) * 100) : 0
      }));

      await generateExecutivePDFReport({
        employee: {
          name: emp.name || 'Staff Member',
          id: emp.id || selectedEmpId,
          email: emp.email || selectedEmp?.email || '',
          department: emp.department || selectedEmp?.department || 'Operations',
          designation: emp.designation || selectedEmp?.designation || 'Specialist',
          work_mode: emp.work_mode || selectedEmp?.work_mode || 'office',
          role: emp.role || selectedEmp?.role || 'employee'
        },
        monthYear: selectedMonth,
        summaryMetrics: {
          totalDaysLogged: totalDays,
          presentDays: presentDays,
          lateDays: lateDays,
          totalHoursGross: totalHours,
          totalNetHours: totalHours,
          avgDailyNetHours: avgHours,
          totalTasks: totalTasks,
          taskCompletionRate: 100
        },
        dailyActivityTimeline: days.map(d => ({
          date: d.date,
          attendanceStatus: d.status,
          loginTime: d.login_time && d.login_time !== '--' ? d.login_time : null,
          logoutTime: d.logout_time && d.logout_time !== '--' && d.logout_time !== 'In Progress' ? d.logout_time : null,
          grossHours: d.net_hours || d.total_hours || '0',
          netHours: d.net_hours || d.total_hours || '0',
          workMode: d.is_working_sunday ? 'Office (Sun)' : (d.status === 'Holiday' ? 'Holiday' : (d.in_geofence === 'WFH' ? 'WFH' : 'Office')),
          tasks: (d.tasks || []).map(t => ({
            title: t.task_title || t.title,
            project: t.project_name || t.project || 'General',
            est: t.estimated_hours || t.est || '0',
            act: t.actual_hours || t.act || '0',
            status: t.status || 'Completed',
            remarks: t.remarks || ''
          }))
        })),
        projectBreakdown
      });
      toast.success('Executive Monochrome PDF report downloaded successfully!');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      toast.error('Failed to generate PDF report.');
    }
  };

  const [selectedDayTasks, setSelectedDayTasks] = useState(null); // { date, day_name, tasks: [], task_count, task_hours }

  const handleExportCSV = () => {
    if (!timesheetData || !timesheetData.days) return;
    const headers = ['Date', 'Day', 'Status', 'Punch In', 'Punch Out', 'Net Hours', 'Tasks Logged', 'Task Hours', 'Remarks'];
    const rows = timesheetData.days.map(d => [
      d.date,
      d.day_name,
      d.status,
      d.login_time || '',
      d.logout_time || '',
      d.net_hours || '0',
      d.task_count || 0,
      d.task_hours || '0',
      d.holiday_name || d.leave_reason || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `timesheet_${timesheetData.employee?.name || 'staff'}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenQuickOverride = (dayItem) => {
    setOverrideForm({
      employee_id: selectedEmpId,
      date: dayItem.date,
      login_time: dayItem.login_time && dayItem.login_time !== '--' ? dayItem.login_time.slice(0, 5) : '09:30',
      logout_time: dayItem.logout_time && dayItem.logout_time !== '--' && dayItem.logout_time !== 'In Progress' ? dayItem.logout_time.slice(0, 5) : '18:30',
      status: 'Present',
      reason: `Manual correction for ${dayItem.date}`
    });
    setOpenOverrideModal(true);
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideForm.login_time || !overrideForm.reason.trim()) {
      toast.error('Login time and reason are required.');
      return;
    }
    setOverrideLoading(true);
    try {
      const res = await attendanceAPI.adminOverride(overrideForm);
      toast.success(res.data.message || 'Attendance updated successfully.');
      setOpenOverrideModal(false);
      fetchTimesheet();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update attendance.');
    } finally {
      setOverrideLoading(false);
    }
  };

  const getStatusChip = (status, holidayName) => {
    switch (status) {
      case 'Present':
        return (
          <Chip
            size="small"
            icon={<PresentIcon sx={{ fontSize: '13px !important' }} />}
            label="Present"
            sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.75rem', borderRadius: '4px' }}
          />
        );
      case 'Late':
        return (
          <Chip
            size="small"
            icon={<LateIcon sx={{ fontSize: '13px !important' }} />}
            label="Late"
            sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 800, fontSize: '0.75rem', borderRadius: '4px' }}
          />
        );
      case 'Half-Day':
        return (
          <Chip
            size="small"
            label="Half-Day"
            sx={{ bgcolor: '#ffedd5', color: '#c2410c', fontWeight: 800, fontSize: '0.75rem', borderRadius: '4px' }}
          />
        );
      case 'Working Sunday':
        return (
          <Chip
            size="small"
            icon={<WorkIcon sx={{ fontSize: '13px !important' }} />}
            label="Working Sunday"
            sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.75rem', borderRadius: '4px' }}
          />
        );
      case 'Sunday':
        return (
          <Chip
            size="small"
            icon={<SundayIcon sx={{ fontSize: '13px !important' }} />}
            label="Sunday"
            sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', borderRadius: '4px' }}
          />
        );
      case 'Holiday':
        return (
          <Chip
            size="small"
            icon={<HolidayIcon sx={{ fontSize: '13px !important' }} />}
            label={holidayName ? `Holiday: ${holidayName}` : 'Holiday'}
            sx={{ bgcolor: '#f3e8ff', color: '#7e22ce', fontWeight: 800, fontSize: '0.75rem', borderRadius: '4px' }}
          />
        );
      case 'Approved Leave':
        return (
          <Chip
            size="small"
            icon={<LeaveIcon sx={{ fontSize: '13px !important' }} />}
            label="Approved Leave"
            sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 800, fontSize: '0.75rem', borderRadius: '4px' }}
          />
        );
      case 'Absent':
        return (
          <Chip
            size="small"
            icon={<AbsentIcon sx={{ fontSize: '13px !important' }} />}
            label="Absent"
            sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 800, fontSize: '0.75rem', borderRadius: '4px' }}
          />
        );
      case 'Not Punched Yet':
        return (
          <Chip
            size="small"
            label="Not Punched Yet"
            sx={{ bgcolor: '#fef9c3', color: '#a16207', fontWeight: 800, fontSize: '0.75rem', borderRadius: '4px' }}
          />
        );
      case 'Weekend':
        return (
          <Chip
            size="small"
            label="Weekend"
            sx={{ bgcolor: '#f8fafc', color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', borderRadius: '4px' }}
          />
        );
      case 'Upcoming':
        return (
          <Chip
            size="small"
            label="Upcoming"
            sx={{ bgcolor: '#f8fafc', color: '#cbd5e1', fontWeight: 600, fontSize: '0.75rem', borderRadius: '4px' }}
          />
        );
      default:
        return <Chip size="small" label={status} sx={{ borderRadius: '4px' }} />;
    }
  };

  const filteredDays = timesheetData?.days?.filter(d => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PRESENT') return d.status === 'Present' || d.status === 'Late' || d.status === 'Half-Day';
    if (statusFilter === 'LATE') return d.status === 'Late';
    if (statusFilter === 'ABSENT') return d.status === 'Absent' || d.status === 'Not Punched Yet';
    if (statusFilter === 'LEAVE') return d.status === 'Approved Leave';
    if (statusFilter === 'HOLIDAY_SUNDAY') return d.status === 'Sunday' || d.status === 'Holiday';
    return true;
  }) || [];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Top Filter & Action Bar */}
      <Card sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: '4px' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            {/* Employee Selector */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel id="select-staff-label">Select Staff Member</InputLabel>
                <Select
                  labelId="select-staff-label"
                  label="Select Staff Member"
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                >
                  {localEmployees.map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{emp.name}</Typography>
                        <Chip label={emp.id} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                        <Typography variant="caption" sx={{ color: '#64748b' }}>({emp.department})</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Month Navigation */}
              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', p: 0.5 }}>
                <Tooltip title="Previous Month">
                  <IconButton size="small" onClick={handlePrevMonth}>
                    <PrevMonthIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <TextField
                  size="small"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& input': { fontWeight: 700, fontSize: '0.875rem', py: 0.5 }
                  }}
                />
                <Tooltip title="Next Month">
                  <IconButton size="small" onClick={handleNextMonth}>
                    <NextMonthIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Tooltip title="Refresh Timesheet">
                <IconButton size="small" onClick={fetchTimesheet} sx={{ border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExportIcon />}
                onClick={handleExportCSV}
                disabled={!timesheetData}
                sx={{ fontWeight: 700, borderRadius: '4px' }}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ExportIcon />}
                onClick={handleDownloadPDF}
                disabled={!timesheetData}
                sx={{ fontWeight: 700, borderRadius: '4px', bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
              >
                Download Executive PDF
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={36} sx={{ color: '#133829' }} />
          <Typography variant="body2" sx={{ color: '#64748b', mt: 1.5, fontWeight: 600 }}>
            Fetching verified day-wise timesheet records...
          </Typography>
        </Box>
      ) : timesheetData ? (
        <>
          {/* Employee Header & KPI Summary Banner */}
          <Card sx={{ mb: 3, borderLeft: '6px solid #133829', borderRadius: '4px' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {timesheetData.employee?.name}
                    </Typography>
                    <Chip label={timesheetData.employee?.id} size="small" color="primary" sx={{ fontWeight: 800 }} />
                    <Chip label={timesheetData.employee?.role?.toUpperCase()} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {timesheetData.employee?.designation} • <strong>{timesheetData.employee?.department}</strong> • {timesheetData.employee?.email}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.4 }}>
                    Period: <strong>{timesheetData.month_label}</strong> • Verified Company Timesheet
                  </Typography>
                </Box>
              </Box>

              {/* 6 KPI Metric Cards */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.8, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, display: 'block' }}>WORKING DAYS</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.3 }}>
                      {timesheetData.past_days_count}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>Past working days</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.8, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800, display: 'block' }}>PRESENT DAYS</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#15803d', mt: 0.3 }}>
                      {timesheetData.present_days}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#166534', fontSize: 10, fontWeight: 700 }}>
                      {timesheetData.on_time_percent}% On-Time
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.8, bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 800, display: 'block' }}>LATE MARKS</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#b45309', mt: 0.3 }}>
                      {timesheetData.late_days}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#92400e', fontSize: 10 }}>After 09:30 AM</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.8, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '4px', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#075985', fontWeight: 800, display: 'block' }}>APPROVED LEAVES</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0369a1', mt: 0.3 }}>
                      {timesheetData.leave_days}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#075985', fontSize: 10 }}>Official Quota</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.8, bgcolor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '4px', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#6b21a8', fontWeight: 800, display: 'block' }}>TOTAL HOURS</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#7e22ce', mt: 0.3 }}>
                      {timesheetData.total_hours}h
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b21a8', fontSize: 10, fontWeight: 700 }}>
                      ~{timesheetData.avg_hours_per_day}h / day
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.8, bgcolor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 800, display: 'block' }}>TASKS COMPLETED</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#047857', mt: 0.3 }}>
                      {timesheetData.total_tasks_completed || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#065f46', fontSize: 10, fontWeight: 700 }}>
                      ~{timesheetData.total_task_logged_hours || 0}h work done
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Timesheet Table Section with Filters */}
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, borderBottom: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Daily Attendance & Work Done Log ({filteredDays.length} Days)
                </Typography>
              </Box>

              {/* Status Filters */}
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                {[
                  { key: 'ALL', label: 'All Days' },
                  { key: 'PRESENT', label: 'Present' },
                  { key: 'LATE', label: 'Late' },
                  { key: 'ABSENT', label: 'Absent' },
                  { key: 'LEAVE', label: 'Leaves' },
                  { key: 'HOLIDAY_SUNDAY', label: 'Sunday / Holidays' }
                ].map(tab => (
                  <Chip
                    key={tab.key}
                    label={tab.label}
                    size="small"
                    clickable
                    color={statusFilter === tab.key ? 'primary' : 'default'}
                    variant={statusFilter === tab.key ? 'filled' : 'outlined'}
                    onClick={() => setStatusFilter(tab.key)}
                    sx={{ fontWeight: 700, borderRadius: '4px', fontSize: 11 }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.2 }}>Date & Day</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Punch In</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Punch Out</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Net Hours</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Work Done / Tasks</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Notes / Remarks</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDays.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                        No records match the selected filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDays.map((day) => {
                      const isPastNonWorking = day.is_sunday || day.is_holiday;
                      return (
                        <TableRow
                          key={day.date}
                          hover
                          sx={{
                            bgcolor: day.is_today
                              ? '#f0fdf4'
                              : isPastNonWorking
                              ? '#fcfcfd'
                              : day.status === 'Absent'
                              ? '#fff5f5'
                              : 'inherit'
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                {day.date}
                              </Typography>
                              <Chip
                                label={day.day_name}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  bgcolor: day.is_sunday ? '#fee2e2' : '#f1f5f9',
                                  color: day.is_sunday ? '#b91c1c' : '#475569',
                                  borderRadius: '3px'
                                }}
                              />
                              {day.is_today && (
                                <Chip label="Today" size="small" color="success" sx={{ height: 20, fontSize: 10, fontWeight: 800 }} />
                              )}
                            </Box>
                          </TableCell>

                          <TableCell>
                            {getStatusChip(day.status, day.holiday_name)}
                          </TableCell>

                          <TableCell sx={{ fontWeight: 700, color: day.login_time && day.login_time !== '--' ? '#0f172a' : '#94a3b8' }}>
                            {day.login_time || '--:--'}
                          </TableCell>

                          <TableCell sx={{ fontWeight: 700, color: day.logout_time && day.logout_time !== '--' ? '#0f172a' : '#94a3b8' }}>
                            {day.logout_time || '--:--'}
                          </TableCell>

                          <TableCell sx={{ fontWeight: 800, color: day.net_hours && day.net_hours !== '0' ? '#133829' : '#94a3b8' }}>
                            {day.net_hours && day.net_hours !== '0' ? `${day.net_hours} hrs` : '--'}
                          </TableCell>

                          <TableCell>
                            {day.task_count > 0 ? (
                              <Chip
                                size="small"
                                icon={<TaskIcon sx={{ fontSize: '13px !important' }} />}
                                label={`${day.task_count} Task${day.task_count > 1 ? 's' : ''} (${day.task_hours}h)`}
                                clickable
                                color="primary"
                                variant="outlined"
                                onClick={() => setSelectedDayTasks(day)}
                                sx={{
                                  bgcolor: '#e0f2fe',
                                  color: '#0369a1',
                                  fontWeight: 800,
                                  fontSize: '0.72rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: '#bae6fd' }
                                }}
                              />
                            ) : (
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                --
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            {day.holiday_name ? (
                              <Typography variant="caption" sx={{ color: '#7e22ce', fontWeight: 700 }}>
                                🎉 {day.holiday_name} ({day.holiday_type || 'Public Holiday'})
                              </Typography>
                            ) : day.leave_reason ? (
                              <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 600 }}>
                                {day.leave_type}: {day.leave_reason}
                              </Typography>
                            ) : day.status === 'Late' ? (
                              <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600 }}>
                                Late Arrival
                              </Typography>
                            ) : day.is_sunday ? (
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                Weekly Off
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                --
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell sx={{ textAlign: 'right' }}>
                            <Box sx={{ display: 'flex', gap: 0.8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {day.task_count > 0 && (
                                <Tooltip title={`View ${day.task_count} work done task(s) for this day`}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<TaskIcon sx={{ fontSize: '13px !important' }} />}
                                    onClick={() => setSelectedDayTasks(day)}
                                    sx={{
                                      fontSize: '0.7rem', py: 0.2, px: 1, borderRadius: '4px', fontWeight: 700,
                                      bgcolor: '#133829', color: '#fff',
                                      '&:hover': { bgcolor: '#0f291e' }
                                    }}
                                  >
                                    Work Done
                                  </Button>
                                </Tooltip>
                              )}
                              {!day.is_future && (
                                <Tooltip title="Manual Attendance Override">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<OverrideIcon sx={{ fontSize: '13px !important' }} />}
                                    onClick={() => handleOpenQuickOverride(day)}
                                    sx={{ fontSize: '0.7rem', py: 0.2, px: 1, borderRadius: '4px', fontWeight: 700 }}
                                  >
                                    Override
                                  </Button>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </>
      ) : (
        <Typography variant="body2" sx={{ textAlign: 'center', py: 6, color: '#64748b' }}>
          Please select a staff member to view their day-wise attendance report.
        </Typography>
      )}

      {/* Quick Override Modal */}
      <Dialog open={openOverrideModal} onClose={() => setOpenOverrideModal(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleOverrideSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Manual Attendance Override</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Date"
                type="date"
                size="small"
                fullWidth
                value={overrideForm.date}
                InputLabelProps={{ shrink: true }}
                disabled
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Punch In Time"
                    type="time"
                    size="small"
                    fullWidth
                    value={overrideForm.login_time}
                    onChange={(e) => setOverrideForm({ ...overrideForm, login_time: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Punch Out Time"
                    type="time"
                    size="small"
                    fullWidth
                    value={overrideForm.logout_time}
                    onChange={(e) => setOverrideForm({ ...overrideForm, logout_time: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <TextField
                label="Status"
                select
                size="small"
                fullWidth
                value={overrideForm.status}
                onChange={(e) => setOverrideForm({ ...overrideForm, status: e.target.value })}
              >
                <MenuItem value="Present">Present</MenuItem>
                <MenuItem value="Late">Late</MenuItem>
                <MenuItem value="Half-Day">Half-Day</MenuItem>
              </TextField>
              <TextField
                label="Management Reason / Remarks"
                multiline
                rows={3}
                size="small"
                fullWidth
                value={overrideForm.reason}
                onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                placeholder="e.g. Biometric missed / verified on duty by manager"
                required
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenOverrideModal(false)} sx={{ fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={overrideLoading}
              sx={{ bgcolor: '#133829', color: '#fff', fontWeight: 800, '&:hover': { bgcolor: '#0f291e' } }}
            >
              {overrideLoading ? 'Saving...' : 'Save Override'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Day Work Done Detail Modal */}
      <Dialog open={Boolean(selectedDayTasks)} onClose={() => setSelectedDayTasks(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TaskIcon sx={{ color: '#133829' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Tasks & Work Done on {selectedDayTasks?.date} ({selectedDayTasks?.day_name})
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Staff: <strong>{timesheetData?.employee?.name}</strong> ({timesheetData?.employee?.id}) • {selectedDayTasks?.task_count || 0} Task(s) Logged (~{selectedDayTasks?.task_hours || 0} hrs)
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          {(!selectedDayTasks?.tasks || selectedDayTasks.tasks.length === 0) ? (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
              No specific task items logged for this date.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Task Title & Description</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Hours (Est / Act)</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedDayTasks.tasks.map((t, idx) => (
                  <TableRow key={t.id || idx} hover>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Chip label={t.project_name} size="small" color="primary" sx={{ fontWeight: 700, borderRadius: '4px', fontSize: 11 }} />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{t.task_title}</Typography>
                      {t.description && (
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5 }}>
                          {t.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {t.actual_hours || t.estimated_hours || 1} hrs
                      <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                        Est: {t.estimated_hours || 1}h
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Chip
                        label={t.status || 'Completed'}
                        size="small"
                        color={t.status === 'Completed' ? 'success' : 'warning'}
                        sx={{ fontWeight: 700, borderRadius: '4px', fontSize: 10 }}
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', color: '#64748b', fontSize: 12 }}>
                      {t.remarks || '--'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedDayTasks(null)} variant="outlined" sx={{ fontWeight: 700, borderRadius: '4px' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
