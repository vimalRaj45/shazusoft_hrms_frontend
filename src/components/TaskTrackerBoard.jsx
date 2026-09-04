import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  IconButton,
  Tooltip,
  Slider,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  PlaylistAddCheck as TrackerIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Flag as PriorityIcon,
  AssignmentTurnedIn as DoneIcon
} from '@mui/icons-material';
import toast, { muiToast } from '../utils/muiToast';
import confetti from 'canvas-confetti';
import { tasksAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TaskTrackerSkeleton } from './SkeletonLoaders';

export default function TaskTrackerBoard() {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Manager: Assign Task Modal
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    task_title: '',
    project_name: '',
    description: '',
    assigned_to_id: '',
    priority: 'High',
    due_date: '',
    estimated_hours: '4'
  });

  // Employee: Update Progress Modal
  const [openProgressModal, setOpenProgressModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [progressForm, setProgressForm] = useState({
    progress: 50,
    status: 'In-Progress',
    actual_hours: '2',
    work_notes: ''
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [tasksRes, empsRes] = await Promise.all([
          tasksAPI.getAllAssigned(),
          adminAPI.getEmployees().catch(() => ({ data: { employees: [] } }))
        ]);
        setTasks(tasksRes.data.tasks || []);
        setEmployees(empsRes.data.employees || []);
      } else {
        const res = await tasksAPI.getMyAssigned();
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [isAdmin]);

  // Handle Manager Task Assignment
  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!assignForm.assigned_to_id) {
      toast.error('Please select an employee to assign this task.');
      return;
    }

    try {
      const res = await tasksAPI.assign(assignForm);
      toast.success(res.data.message || 'Task assigned successfully!');
      confetti({ particleCount: 60, spread: 60 });
      setOpenAssignModal(false);
      setAssignForm({
        task_title: '',
        project_name: '',
        description: '',
        assigned_to_id: '',
        priority: 'High',
        due_date: '',
        estimated_hours: '4'
      });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign task.');
    }
  };

  // Open Progress Update Modal for Employee
  const handleOpenProgressModal = (task) => {
    setActiveTask(task);
    setProgressForm({
      progress: Number(task.progress) || 0,
      status: task.status || 'In-Progress',
      actual_hours: task.actual_hours || '1',
      work_notes: task.work_notes || ''
    });
    setOpenProgressModal(true);
  };

  // Handle Employee Progress Submission
  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!activeTask) return;

    try {
      const res = await tasksAPI.updateProgress(activeTask.id, progressForm);
      toast.success(res.data.message || 'Progress updated successfully!');
      if (progressForm.status === 'Completed' || Number(progressForm.progress) >= 100) {
        confetti({ particleCount: 80, spread: 70 });
      }
      setOpenProgressModal(false);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update progress.');
    }
  };

  // Quick One-Click Actions
  const handleQuickStart = async (task) => {
    try {
      await tasksAPI.updateProgress(task.id, { status: 'In-Progress', progress: '10' });
      toast.success('Task marked In-Progress! Keep up the momentum.');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to start task.');
    }
  };

  const handleQuickComplete = async (task) => {
    try {
      await tasksAPI.updateProgress(task.id, { status: 'Completed', progress: '100' });
      toast.success('Task marked as 100% Completed!');
      confetti({ particleCount: 70, spread: 60 });
      fetchTasks();
    } catch (err) {
      toast.error('Failed to complete task.');
    }
  };

  const handleDeleteTask = async (id) => {
    const confirmed = await muiToast.confirm({
      title: 'Delete Assigned Task',
      message: 'Are you sure you want to permanently delete this delegated task? This will remove the task assignment for the employee.',
      confirmText: 'Delete Task',
      cancelText: 'Cancel',
      isDestructive: true
    });
    if (confirmed) {
      try {
        await tasksAPI.delete(id);
        toast.success('Task assignment deleted.');
        fetchTasks();
      } catch (err) {
        toast.error('Failed to delete task.');
      }
    }
  };

  // Filter calculations
  let filteredTasks = [...tasks];
  if (filterEmployee) filteredTasks = filteredTasks.filter(t => t.assigned_to_id === filterEmployee);
  if (filterStatus) filteredTasks = filteredTasks.filter(t => t.status === filterStatus);
  if (filterPriority) filteredTasks = filteredTasks.filter(t => t.priority === filterPriority);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredTasks = filteredTasks.filter(t =>
      t.task_title?.toLowerCase().includes(q) ||
      t.project_name?.toLowerCase().includes(q) ||
      t.assigned_to_name?.toLowerCase().includes(q)
    );
  }

  const totalAssigned = tasks.length;
  const inProgressCount = tasks.filter(t => t.status === 'In-Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const overdueCount = tasks.filter(t => {
    if (t.status === 'Completed' || !t.due_date) return false;
    return new Date(t.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
  }).length;

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <Chip label="Urgent" size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 800, borderRadius: '4px', height: 22, fontSize: 11 }} />;
      case 'High':
        return <Chip label="High" size="small" sx={{ bgcolor: '#ffedd5', color: '#c2410c', fontWeight: 800, borderRadius: '4px', height: 22, fontSize: 11 }} />;
      case 'Medium':
        return <Chip label="Medium" size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 800, borderRadius: '4px', height: 22, fontSize: 11 }} />;
      default:
        return <Chip label="Low" size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 800, borderRadius: '4px', height: 22, fontSize: 11 }} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <Chip label="Completed" color="success" size="small" sx={{ fontWeight: 800, borderRadius: '4px' }} />;
      case 'In-Progress':
        return <Chip label="In-Progress" color="primary" size="small" sx={{ fontWeight: 800, borderRadius: '4px' }} />;
      case 'Under Review':
        return <Chip label="Under Review" color="secondary" size="small" sx={{ fontWeight: 800, borderRadius: '4px' }} />;
      default:
        return <Chip label={status || 'Assigned'} color="warning" size="small" sx={{ fontWeight: 800, borderRadius: '4px' }} />;
    }
  };

  return (
    <Box>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrackerIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {isAdmin ? 'Team Task Assignment & Progress Tracking' : 'My Assigned Tasks & Work Tracker'}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
            {isAdmin
              ? 'Assign deliverables to team members, set priorities, and monitor progress in real time'
              : 'Track deadlines, update deliverable progress %, log hours, and mark tasks completed'}
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenAssignModal(true)}
            sx={{ fontWeight: 800, borderRadius: '4px' }}
          >
            Assign New Task
          </Button>
        )}
      </Box>

      {/* KPI Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>TOTAL ASSIGNED</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>{totalAssigned}</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700 }}>IN PROGRESS</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0284c7', mt: 0.5 }}>{inProgressCount}</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>COMPLETED</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981', mt: 0.5 }}>{completedCount}</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: overdueCount > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>OVERDUE</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: overdueCount > 0 ? '#dc2626' : '#64748b', mt: 0.5 }}>{overdueCount}</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Filters Toolbar */}
      <Card sx={{ mb: 3, border: '1px solid #e5e7eb', borderRadius: '4px' }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search task or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>

            {isAdmin && (
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Filter Assignee"
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {employees.map(e => (
                    <MenuItem key={e.id} value={e.id}>{e.name} ({e.id})</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            <Grid item xs={6} sm={isAdmin ? 3 : 4.5}>
              <TextField
                fullWidth
                select
                size="small"
                label="Filter Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Assigned">Assigned</MenuItem>
                <MenuItem value="In-Progress">In-Progress</MenuItem>
                <MenuItem value="Under Review">Under Review</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6} sm={isAdmin ? 3 : 4.5}>
              <TextField
                fullWidth
                select
                size="small"
                label="Filter Priority"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Task List Table / Grid */}
      {loading ? (
        <TaskTrackerSkeleton />
      ) : (
        <Card sx={{ border: '1px solid #e5e7eb', borderRadius: '4px', bgcolor: '#ffffff' }}>
          <CardContent sx={{ p: 0 }}>
            {filteredTasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <TrackerIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  No tasks match the selected filters.
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {isAdmin ? 'Click "Assign New Task" to delegate deliverables to team members.' : 'You have no assigned tasks in this view.'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Task & Project</TableCell>
                    {isAdmin && <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Assignee</TableCell>}
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Progress</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Est / Act</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTasks.map((t) => {
                    const isOverdue = t.status !== 'Completed' && t.due_date && new Date(t.due_date).getTime() < new Date().setHours(0,0,0,0);
                    const progressNum = Number(t.progress) || 0;

                    return (
                      <TableRow key={t.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {t.task_title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                            <Chip label={t.project_name} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 11, height: 20, borderRadius: '4px' }} />
                            {t.description && (
                              <Typography variant="caption" sx={{ color: '#64748b', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.description}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {isAdmin && (
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                              {t.assigned_to_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              by {t.assigned_by_name || 'Admin'}
                            </Typography>
                          </TableCell>
                        )}

                        <TableCell>{getPriorityBadge(t.priority)}</TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: isOverdue ? '#dc2626' : '#0f172a' }}>
                            {t.due_date || '--'}
                          </Typography>
                          {isOverdue && (
                            <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 800, display: 'block' }}>
                              OVERDUE
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ minWidth: 120 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={progressNum}
                                color={progressNum >= 100 ? 'success' : progressNum >= 50 ? 'primary' : 'warning'}
                                sx={{ height: 6, borderRadius: '4px' }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', minWidth: 32 }}>
                              {progressNum}%
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                          <strong>{t.estimated_hours || 0}h</strong> est / <strong>{t.actual_hours || 0}h</strong> act
                        </TableCell>

                        <TableCell>{getStatusBadge(t.status)}</TableCell>

                        <TableCell align="right">
                          {/* Employee Controls */}
                          {!isAdmin && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
                              {t.status === 'Assigned' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  startIcon={<StartIcon />}
                                  onClick={() => handleQuickStart(t)}
                                  sx={{ fontWeight: 700, borderRadius: '4px', fontSize: 11, py: 0.3 }}
                                >
                                  Start
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => handleOpenProgressModal(t)}
                                sx={{ fontWeight: 700, borderRadius: '4px', fontSize: 11, py: 0.3 }}
                              >
                                Update Progress
                              </Button>
                              {t.status !== 'Completed' && (
                                <IconButton size="small" color="success" onClick={() => handleQuickComplete(t)} title="Mark 100% Completed">
                                  <CompleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          )}

                          {/* Admin Controls */}
                          {isAdmin && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleOpenProgressModal(t)}
                                sx={{ fontWeight: 700, borderRadius: '4px', fontSize: 11, py: 0.3 }}
                              >
                                Edit Progress
                              </Button>
                              <IconButton size="small" color="error" onClick={() => handleDeleteTask(t.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
      )}

      {/* Manager Assign Task Modal */}
      <Dialog open={openAssignModal} onClose={() => setOpenAssignModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAssignTask}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>
            Assign New Task / Deliverable
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Assign To Staff"
                  required
                  value={assignForm.assigned_to_id}
                  onChange={(e) => setAssignForm({ ...assignForm, assigned_to_id: e.target.value })}
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name} — {emp.designation} ({emp.id})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Project Name"
                  required
                  placeholder="e.g. HRMS 2026, Core API"
                  value={assignForm.project_name}
                  onChange={(e) => setAssignForm({ ...assignForm, project_name: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Title / Objective"
                  required
                  placeholder="e.g. Implement edge test cases for GPS Geofencing"
                  value={assignForm.task_title}
                  onChange={(e) => setAssignForm({ ...assignForm, task_title: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Detailed Description & Specifications"
                  placeholder="Include requirements, expected outputs, or documentation links..."
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Priority"
                  value={assignForm.priority}
                  onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                >
                  <MenuItem value="Urgent">Urgent (P0) 🔴</MenuItem>
                  <MenuItem value="High">High (P1) 🟠</MenuItem>
                  <MenuItem value="Medium">Medium (P2) 🟡</MenuItem>
                  <MenuItem value="Low">Low (P3) 🟢</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Due Date"
                  InputLabelProps={{ shrink: true }}
                  required
                  value={assignForm.due_date}
                  onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ min: '0.5', step: '0.5' }}
                  label="Est Hours"
                  required
                  value={assignForm.estimated_hours}
                  onChange={(e) => setAssignForm({ ...assignForm, estimated_hours: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
            <Button onClick={() => setOpenAssignModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 800 }}>
              Assign Task
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Employee Update Progress Modal */}
      <Dialog open={openProgressModal} onClose={() => setOpenProgressModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleUpdateProgress}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>
            Update Progress: {activeTask?.task_title}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mb: 1 }}>
                Completion Percentage: <strong>{progressForm.progress}%</strong>
              </Typography>
              <Slider
                value={progressForm.progress}
                onChange={(e, val) => setProgressForm({ ...progressForm, progress: val })}
                valueLabelDisplay="auto"
                step={5}
                marks
                min={0}
                max={100}
                sx={{ color: '#133829' }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Task Status"
                  value={progressForm.status}
                  onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}
                >
                  <MenuItem value="Assigned">Assigned</MenuItem>
                  <MenuItem value="In-Progress">In-Progress</MenuItem>
                  <MenuItem value="Under Review">Under Review</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Blocked">Blocked / Pending Info</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ min: '0', step: '0.5' }}
                  label="Actual Time Spent (Hours)"
                  value={progressForm.actual_hours}
                  onChange={(e) => setProgressForm({ ...progressForm, actual_hours: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Deliverables / Work Notes / Comments"
                  placeholder="Describe progress made, deliverables completed, or blocker details..."
                  value={progressForm.work_notes}
                  onChange={(e) => setProgressForm({ ...progressForm, work_notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
            <Button onClick={() => setOpenProgressModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 800 }}>
              Save Progress
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
