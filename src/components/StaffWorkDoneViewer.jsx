import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Chip,
  Avatar,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Autorenew as InProgressIcon,
  Pending as PendingIcon,
  Print as PrintIcon,
  FileDownload as ExportIcon,
  Schedule as TimeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { workDoneAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast, { muiToast } from '../utils/muiToast';
import { TableRowsSkeleton } from './SkeletonLoaders';

export default function StaffWorkDoneViewer() {
  const { user, isAdmin } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Filters State
  const [selectedStaffId, setSelectedStaffId] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Logging Work (Self or on behalf of staff)
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [savingTask, setSavingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    employee_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    project_name: '',
    task_title: '',
    description: '',
    plan: '',
    estimated_hours: '2',
    actual_hours: '2',
    status: 'Completed',
    remarks: ''
  });

  // Fetch all employees
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await adminAPI.getEmployees();
      const activeStaff = (res.data?.employees || []).filter(
        e => e.status !== 'inactive' && e.status !== 'resigned'
      );
      setEmployees(activeStaff);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fetch all tasks from workdone
  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const params = {};
      if (selectedStaffId && selectedStaffId !== 'ALL') {
        params.employee_id = selectedStaffId;
      }
      if (selectedMonth) {
        params.month = selectedMonth;
      }
      const res = await workDoneAPI.getAllTasks(params);
      setTasks(res.data?.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      toast.error('Failed to load staff work logs.');
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedStaffId, selectedMonth]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set();
    employees.forEach(e => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [employees]);

  // Filtered employees list based on department
  const filteredEmployees = useMemo(() => {
    if (selectedDept === 'ALL') return employees;
    return employees.filter(e => e.department === selectedDept);
  }, [employees, selectedDept]);

  // Selected employee metadata
  const selectedEmployee = useMemo(() => {
    if (selectedStaffId === 'ALL') return null;
    return employees.find(e => e.id === selectedStaffId || e.email === selectedStaffId) || null;
  }, [employees, selectedStaffId]);

  // Filtered tasks based on search and status
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (t.task_title && t.task_title.toLowerCase().includes(q)) ||
        (t.employee_name && t.employee_name.toLowerCase().includes(q)) ||
        (t.project_name && t.project_name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.remarks && t.remarks.toLowerCase().includes(q)) ||
        (t.date && t.date.includes(q));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesDept =
        selectedDept === 'ALL' ||
        employees.some(
          e =>
            (e.id === t.employee_id || e.name === t.employee_name) &&
            e.department === selectedDept
        );

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [tasks, searchTerm, statusFilter, selectedDept, employees]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'Completed').length;
    const inProgress = filteredTasks.filter(t => t.status === 'In-Progress').length;
    const pending = filteredTasks.filter(
      t => t.status === 'Pending' || t.status === 'Pending/Blocked'
    ).length;
    const estHours = filteredTasks.reduce(
      (acc, t) => acc + (parseFloat(t.estimated_hours) || 0),
      0
    );
    const actHours = filteredTasks.reduce(
      (acc, t) => acc + (parseFloat(t.actual_hours) || 0),
      0
    );

    const projectSet = new Set();
    const dateSet = new Set();
    filteredTasks.forEach(t => {
      if (t.project_name) projectSet.add(t.project_name);
      if (t.date) dateSet.add(t.date);
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      estHours: estHours.toFixed(1),
      actHours: actHours.toFixed(1),
      projectsCount: projectSet.size,
      projectsList: Array.from(projectSet),
      daysActive: dateSet.size,
      completionRate
    };
  }, [filteredTasks]);

  // Modal Handlers
  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      let desc = task.description || '';
      let planText = '';
      if (desc.includes('[Plan / Next Action]:')) {
        const parts = desc.split('[Plan / Next Action]:');
        desc = parts[0].trim();
        planText = parts[1].trim();
      } else if (task.remarks && task.remarks.toLowerCase().includes('plan:')) {
        const idx = task.remarks.toLowerCase().indexOf('plan:');
        planText = task.remarks.substring(idx + 5).trim();
      }

      setTaskForm({
        employee_id: task.employee_id || user?.id,
        date: task.date || format(new Date(), 'yyyy-MM-dd'),
        project_name: task.project_name || '',
        task_title: task.task_title || '',
        description: desc,
        plan: planText,
        estimated_hours: task.estimated_hours || '2',
        actual_hours: task.actual_hours || '2',
        status: task.status || 'Completed',
        remarks: task.remarks || ''
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        employee_id: selectedStaffId !== 'ALL' ? selectedStaffId : user?.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        project_name: '',
        task_title: '',
        description: '',
        plan: '',
        estimated_hours: '2',
        actual_hours: '2',
        status: 'Completed',
        remarks: ''
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingTask(null);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!taskForm.project_name.trim() || !taskForm.task_title.trim()) {
      toast.error('Project Name and Task Title are required.');
      return;
    }

    setSavingTask(true);
    try {
      const fullDesc = taskForm.plan?.trim()
        ? taskForm.description?.trim()
          ? `${taskForm.description.trim()}\n[Plan / Next Action]: ${taskForm.plan.trim()}`
          : `[Plan / Next Action]: ${taskForm.plan.trim()}`
        : taskForm.description?.trim() || '';

      const fullRemarks = taskForm.plan?.trim()
        ? taskForm.remarks?.trim()
          ? `${taskForm.remarks.trim()} | Plan: ${taskForm.plan.trim()}`
          : `Plan: ${taskForm.plan.trim()}`
        : taskForm.remarks?.trim() || '';

      const payload = {
        ...taskForm,
        description: fullDesc,
        remarks: fullRemarks
      };

      if (editingTask) {
        await workDoneAPI.update(editingTask.id, payload);
        toast.success('Task updated successfully.');
      } else {
        await workDoneAPI.create(payload);
        toast.success('Work log & plan created successfully!');
      }

      handleCloseModal();
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (id) => {
    const confirmed = await muiToast.confirm({
      title: 'Delete Work Task',
      message: 'Are you sure you want to delete this staff work record from the system?',
      confirmText: 'Delete Task',
      cancelText: 'Cancel',
      isDestructive: true
    });

    if (confirmed) {
      try {
        await workDoneAPI.delete(id);
        toast.success('Work task record deleted.');
        fetchTasks();
      } catch (err) {
        toast.error('Failed to delete task.');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <Chip
            icon={<i className="bi bi-check-circle-fill" style={{ fontSize: 12, marginLeft: 4, color: '#16a34a' }}></i>}
            label="Completed"
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: '#dcfce7',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              borderRadius: '6px'
            }}
          />
        );
      case 'In-Progress':
        return (
          <Chip
            icon={<i className="bi bi-arrow-repeat" style={{ fontSize: 12, marginLeft: 4, color: '#2563eb' }}></i>}
            label="In-Progress"
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              borderRadius: '6px'
            }}
          />
        );
      default:
        return (
          <Chip
            icon={<i className="bi bi-hourglass-split" style={{ fontSize: 12, marginLeft: 4, color: '#d97706' }}></i>}
            label={status || 'Pending'}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
              borderRadius: '6px'
            }}
          />
        );
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Top Header Card */}
      <Card
        sx={{
          mb: 2.5,
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            bgcolor: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                bgcolor: '#ecfdf5',
                color: '#133829',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="bi bi-person-workspace" style={{ fontSize: 22 }}></i>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Staff Work Done & Deliverable Hub
                </Typography>
                <Chip
                  label="Manager & Lead Suite"
                  size="small"
                  sx={{
                    bgcolor: '#133829',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 10,
                    height: 20,
                    borderRadius: '5px'
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: 12.5 }}>
                Choose any staff member to view their daily accomplishments, time spent, and forward sprint plans.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<i className="bi bi-printer" style={{ fontSize: 13 }}></i>}
              onClick={handlePrint}
              sx={{ fontWeight: 700, borderRadius: '8px', textTransform: 'none', borderColor: '#cbd5e1' }}
            >
              Print Report
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<i className="bi bi-plus-circle-fill" style={{ fontSize: 13 }}></i>}
              onClick={() => handleOpenModal()}
              sx={{
                fontWeight: 800,
                borderRadius: '8px',
                bgcolor: '#133829',
                textTransform: 'none',
                '&:hover': { bgcolor: '#0b2319' }
              }}
            >
              Log Work for Staff
            </Button>
          </Box>
        </Box>

        {/* Staff Selection & Multi-Filter Control Bar */}
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Grid container spacing={1.5} alignItems="center">
            {/* Primary Staff Selector */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                select
                size="small"
                label="Choose Staff Member"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                sx={{
                  bgcolor: '#ffffff',
                  borderRadius: '8px',
                  '& .MuiSelect-select': { fontWeight: 700, color: '#133829' }
                }}
              >
                <MenuItem value="ALL" sx={{ fontWeight: 800 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className="bi bi-people-fill" style={{ color: '#133829' }}></i>
                    <span>All Staff Members ({employees.length})</span>
                  </Box>
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                {filteredEmployees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: 11,
                          bgcolor: '#133829',
                          fontWeight: 700
                        }}
                      >
                        {emp.name?.charAt(0) || 'E'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                          {emp.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: 10.5 }}>
                          {emp.designation || emp.role} • {emp.department || 'General'}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Department Filter */}
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                select
                size="small"
                label="Department"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
              >
                <MenuItem value="ALL">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Month Filter */}
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                size="small"
                type="month"
                label="Month / Period"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
              />
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Status Filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="In-Progress">In-Progress</MenuItem>
                <MenuItem value="Pending/Blocked">Pending / Blocked</MenuItem>
              </TextField>
            </Grid>

            {/* Search Keyword Filter */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by task title, project name, work details, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="bi bi-search" style={{ color: '#64748b' }}></i>
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <i className="bi bi-x-circle-fill" style={{ fontSize: 14 }}></i>
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
              />
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Selected Staff Profile Card (When Single Staff Member is Selected) */}
      {selectedEmployee && (
        <Card
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: '12px',
            bgcolor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: '#133829',
                  color: '#ffffff',
                  fontSize: 20,
                  fontWeight: 800,
                  boxShadow: '0 3px 10px rgba(19, 56, 41, 0.25)'
                }}
              >
                {selectedEmployee.name?.charAt(0) || 'S'}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                    {selectedEmployee.name}
                  </Typography>
                  <Chip
                    label={selectedEmployee.designation || 'Staff Member'}
                    size="small"
                    sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 800, height: 20, fontSize: 10.5 }}
                  />
                  <Chip
                    label={selectedEmployee.department || 'General'}
                    size="small"
                    sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, height: 20, fontSize: 10.5 }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: 12 }}>
                  {selectedEmployee.email} • ID: <strong>{selectedEmployee.id}</strong> • Role: <strong>{selectedEmployee.role?.toUpperCase()}</strong>
                </Typography>
              </Box>
            </Box>

            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedStaffId('ALL')}
              startIcon={<i className="bi bi-arrow-left" style={{ fontSize: 12 }}></i>}
              sx={{ fontWeight: 700, borderRadius: '8px', textTransform: 'none' }}
            >
              View All Staff Overview
            </Button>
          </Box>
        </Card>
      )}

      {/* Staff KPI Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2.5 }} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #133829' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>
                COMPLETED WORK DONE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#15803d', mt: 0.5 }}>
                {metrics.completed} / {metrics.total}
              </Typography>
              <Box sx={{ mt: 1, width: '100%' }}>
                <LinearProgress
                  variant="determinate"
                  value={metrics.completionRate}
                  sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a' } }}
                />
                <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700, fontSize: 11, mt: 0.5, display: 'block' }}>
                  {metrics.completionRate}% Completion Rate
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #0284c7' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>
                TOTAL ACTUAL HOURS LOGGED
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0369a1', mt: 0.5 }}>
                {metrics.actHours} <span style={{ fontSize: '1rem', fontWeight: 600 }}>hrs</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: 11.5, display: 'block', mt: 1 }}>
                Estimated: <strong>{metrics.estHours} hrs</strong> total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #7c3aed' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>
                ACTIVE PROJECTS INVOLVED
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#6d28d9', mt: 0.5 }}>
                {metrics.projectsCount}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap', mt: 1 }}>
                {metrics.projectsList.slice(0, 2).map(p => (
                  <Chip key={p} label={p} size="small" sx={{ fontSize: 9.5, height: 18, fontWeight: 700 }} />
                ))}
                {metrics.projectsList.length > 2 && (
                  <Chip label={`+${metrics.projectsList.length - 2} more`} size="small" sx={{ fontSize: 9.5, height: 18 }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #d97706' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>
                ACTIVE WORK DAYS RECORDED
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#b45309', mt: 0.5 }}>
                {metrics.daysActive} <span style={{ fontSize: '1rem', fontWeight: 600 }}>days</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#92400e', fontSize: 11.5, display: 'block', mt: 1 }}>
                In-Progress: <strong>{metrics.inProgress}</strong> • Pending: <strong>{metrics.pending}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Work Done Table & Deliverables List */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
            {selectedEmployee ? `${selectedEmployee.name}'s Work Done Logs` : 'All Staff Daily Work Logs & Forward Plans'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            Showing <strong>{filteredTasks.length}</strong> logged deliverable entries
          </Typography>
        </Box>

        {loadingTasks ? (
          <Box sx={{ p: 3 }}>
            <TableRowsSkeleton rows={5} cols={6} />
          </Box>
        ) : filteredTasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#ffffff' }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                bgcolor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
                color: '#64748b'
              }}
            >
              <i className="bi bi-journal-x" style={{ fontSize: 26 }}></i>
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5 }}>
              No Work Done Records Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 440, mx: 'auto', mb: 2 }}>
              {selectedEmployee
                ? `No work logs or forward sprint plans recorded for ${selectedEmployee.name} matching current filters.`
                : 'No work done records found matching your selected staff, month, or search query.'}
            </Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<i className="bi bi-plus-circle-fill" style={{ fontSize: 13 }}></i>}
              onClick={() => handleOpenModal()}
              sx={{ bgcolor: '#133829', fontWeight: 800, borderRadius: '8px', textTransform: 'none' }}
            >
              Log Work & Forward Plan
            </Button>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Date</TableCell>
                  {selectedStaffId === 'ALL' && (
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Staff Member</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', minWidth: 260 }}>
                    What Was Done (Task Details)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', minWidth: 240 }}>
                    Upcoming Plan / Next Deliverables
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Est / Act Hrs</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>
                    Actions
                  </TableCell>
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
                      {/* Date */}
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12.5, fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <i className="bi bi-calendar3" style={{ color: '#64748b', fontSize: 12 }}></i>
                          <span>{t.date}</span>
                        </Box>
                      </TableCell>

                      {/* Staff Member (if ALL selected) */}
                      {selectedStaffId === 'ALL' && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              sx={{
                                width: 26,
                                height: 26,
                                bgcolor: '#133829',
                                fontSize: 11,
                                fontWeight: 700
                              }}
                            >
                              {t.employee_name?.charAt(0) || 'S'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                                {t.employee_name || t.employee_id}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: 10 }}>
                                ID: {t.employee_id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      )}

                      {/* Project Name */}
                      <TableCell>
                        <Chip
                          label={t.project_name}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: '#f1f5f9',
                            color: '#0f172a',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px'
                          }}
                        />
                      </TableCell>

                      {/* Task Title & Details */}
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {t.task_title}
                        </Typography>
                        {displayDesc && (
                          <Typography
                            variant="caption"
                            sx={{ color: '#475569', display: 'block', mt: 0.4, lineHeight: 1.4 }}
                          >
                            {displayDesc}
                          </Typography>
                        )}
                        {t.remarks && !t.remarks.toLowerCase().includes('plan:') && (
                          <Typography
                            variant="caption"
                            sx={{ color: '#d97706', display: 'block', mt: 0.4, fontStyle: 'italic' }}
                          >
                            Note: {t.remarks}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Forward Deliverable Plan */}
                      <TableCell sx={{ maxWidth: 280 }}>
                        {planText ? (
                          <Box
                            sx={{
                              p: 1,
                              bgcolor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '8px'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                              <i className="bi bi-arrow-right-circle-fill" style={{ color: '#2563eb', fontSize: 11 }}></i>
                              <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 800 }}>
                                Planned Next Action:
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#1e3a8a', display: 'block', lineHeight: 1.3 }}>
                              {planText}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            --
                          </Typography>
                        )}
                      </TableCell>

                      {/* Hours */}
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>
                        <strong>{t.actual_hours || t.estimated_hours}h</strong> act /{' '}
                        <span style={{ color: '#64748b' }}>{t.estimated_hours}h est</span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusChip(t.status)}</TableCell>

                      {/* Action Buttons */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="Edit task entry">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenModal(t)}
                              sx={{ color: '#0369a1', '&:hover': { bgcolor: '#e0f2fe' } }}
                            >
                              <i className="bi bi-pencil-square" style={{ fontSize: 14 }}></i>
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete task entry">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteTask(t.id)}
                              sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}
                            >
                              <i className="bi bi-trash3-fill" style={{ fontSize: 14 }}></i>
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {/* Modal: Log Work & Forward Plan (Manager / Admin / Self) */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <form
          onSubmit={handleSubmitTask}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          <DialogTitle
            sx={{
              bgcolor: '#133829',
              color: '#ffffff',
              fontWeight: 800,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <i className="bi bi-journal-plus" style={{ color: '#86efac', fontSize: 20 }}></i>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.1rem' }}>
                {editingTask ? 'Edit WorkDone Entry' : 'Log Daily Work & Forward Plan'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseModal} sx={{ color: '#ffffff' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: '#f8fafc', flex: 1, overflowY: 'auto' }}>
            <Grid container spacing={2}>
              {/* Target Staff Selection */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Log for Staff Member"
                  value={taskForm.employee_id}
                  onChange={(e) => setTaskForm({ ...taskForm, employee_id: e.target.value })}
                >
                  <MenuItem value={user?.id}>
                    <em>Myself ({user?.name})</em>
                  </MenuItem>
                  {employees
                    .filter(e => e.id !== user?.id)
                    .map(emp => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.designation || emp.role})
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              {/* Task Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  required
                  label="Date of Work"
                  value={taskForm.date}
                  onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Project Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Project Name"
                  placeholder="e.g. HRMS Portal, Cloud Migration"
                  value={taskForm.project_name}
                  onChange={(e) => setTaskForm({ ...taskForm, project_name: e.target.value })}
                />
              </Grid>

              {/* Task Status */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Task Status"
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                >
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="In-Progress">In-Progress</MenuItem>
                  <MenuItem value="Pending/Blocked">Pending / Blocked</MenuItem>
                </TextField>
              </Grid>

              {/* Task Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Task Title / Headline"
                  placeholder="e.g. Built automated payslip pipeline with working Sunday calculations"
                  value={taskForm.task_title}
                  onChange={(e) => setTaskForm({ ...taskForm, task_title: e.target.value })}
                />
              </Grid>

              {/* Detailed Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label="Detailed Work Description (What Was Accomplished)"
                  placeholder="Key accomplishments, commits, module deliverables, test coverage..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </Grid>

              {/* Forward Plan Box */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <i className="bi bi-arrow-right-circle-fill" style={{ color: '#2563eb' }}></i>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1d4ed8' }}>
                      UPCOMING SPRINT PLAN / NEXT DELIVERABLES (WHAT YOU PLAN TO DO NEXT)
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    placeholder="e.g. Finish end-to-end integration testing, deploy staging build, update client documentation..."
                    value={taskForm.plan}
                    onChange={(e) => setTaskForm({ ...taskForm, plan: e.target.value })}
                    sx={{ bgcolor: '#ffffff', borderRadius: '6px' }}
                  />
                </Box>
              </Grid>

              {/* Hours */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ step: '0.5', min: '0' }}
                  label="Estimated Time (Hours)"
                  value={taskForm.estimated_hours}
                  onChange={(e) => setTaskForm({ ...taskForm, estimated_hours: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ step: '0.5', min: '0' }}
                  label="Actual Time Taken (Hours)"
                  value={taskForm.actual_hours}
                  onChange={(e) => setTaskForm({ ...taskForm, actual_hours: e.target.value })}
                />
              </Grid>

              {/* Remarks & Blockers */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Remarks / Blockers (Optional)"
                  placeholder="Any dependencies, blockers, or manager observations..."
                  value={taskForm.remarks}
                  onChange={(e) => setTaskForm({ ...taskForm, remarks: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, px: 2.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
            <Button onClick={handleCloseModal} disabled={savingTask} sx={{ fontWeight: 700, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingTask}
              startIcon={savingTask ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <i className="bi bi-check-lg" style={{ fontSize: 14 }}></i>}
              sx={{
                fontWeight: 800,
                borderRadius: '8px',
                bgcolor: '#133829',
                px: 3,
                textTransform: 'none',
                '&:hover': { bgcolor: '#0b2319' }
              }}
            >
              {savingTask ? 'Saving Task...' : editingTask ? 'Update Task' : 'Save Work Log'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
