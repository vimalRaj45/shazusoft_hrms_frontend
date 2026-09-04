import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as TaskIcon,
  CheckCircle as CompleteIcon,
  Pending as PendingIcon,
  Autorenew as InProgressIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import toast, { muiToast } from '../utils/muiToast';
import confetti from 'canvas-confetti';
import { workDoneAPI } from '../services/api';
import { TableRowsSkeleton } from './SkeletonLoaders';

export default function WorkDoneSection() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [formData, setFormData] = useState({
    project_name: '',
    task_title: '',
    description: '',
    estimated_hours: '2',
    actual_hours: '2',
    status: 'Completed',
    remarks: ''
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await workDoneAPI.getMyTasks();
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        project_name: task.project_name || '',
        task_title: task.task_title || '',
        description: task.description || '',
        estimated_hours: task.estimated_hours || '1',
        actual_hours: task.actual_hours || '1',
        status: task.status || 'Completed',
        remarks: task.remarks || ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        project_name: '',
        task_title: '',
        description: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await workDoneAPI.update(editingTask.id, formData);
        toast.success('Task updated successfully!');
      } else {
        await workDoneAPI.create(formData);
        toast.success('Task logged successfully to Google Sheets!');
        confetti({ particleCount: 50, spread: 50 });
      }
      handleCloseModal();
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task.');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await muiToast.confirm({
      title: 'Delete Task Record',
      message: 'Are you sure you want to permanently delete this daily task entry? This will update your records in Google Sheets.',
      confirmText: 'Delete Task',
      cancelText: 'Cancel',
      isDestructive: true
    });
    if (confirmed) {
      try {
        await workDoneAPI.delete(id);
        toast.success('Task deleted successfully.');
        fetchTasks();
      } catch (err) {
        toast.error('Failed to delete task.');
      }
    }
  };

  const handleQuickStatusToggle = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'In-Progress' : 'Completed';
    try {
      await workDoneAPI.update(task.id, { status: nextStatus });
      toast.success(`Task status updated to ${nextStatus}`);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const totalEstHours = tasks.reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);
  const totalActHours = tasks.reduce((acc, t) => acc + (parseFloat(t.actual_hours) || 0), 0);
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  const getStatusChip = (status) => {
    switch (status) {
      case 'Completed':
        return <Chip icon={<CompleteIcon fontSize="small" />} label="Completed" color="success" size="small" sx={{ fontWeight: 700 }} />;
      case 'In-Progress':
        return <Chip icon={<InProgressIcon fontSize="small" />} label="In-Progress" color="primary" size="small" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip icon={<PendingIcon fontSize="small" />} label={status || 'Pending'} color="warning" size="small" sx={{ fontWeight: 700 }} />;
    }
  };

  return (
    <Card sx={{ mt: 3, border: '1px solid #e5e7eb', borderRadius: '4px' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TaskIcon color="primary" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Daily Work & Activity Log
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Record daily achievements, client deliverables, and project milestones
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{ fontWeight: 700, borderRadius: '4px' }}
          >
            Log New Task
          </Button>
        </Box>

        {/* Task Summary Badges */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>COMPLETED TASKS</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981', mt: 0.5 }}>
                {completedCount} / {tasks.length}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>ESTIMATED HOURS</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#3b82f6', mt: 0.5 }}>
                {totalEstHours.toFixed(1)} hrs
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>ACTUAL HOURS</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#133829', mt: 0.5 }}>
                {totalActHours.toFixed(1)} hrs
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Task Table */}
        {loading ? (
          <TableRowsSkeleton rows={4} cols={6} />
        ) : tasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: '4px', border: '1px dashed #cbd5e1' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No tasks logged yet. Click <strong>"Log New Task"</strong> to add your daily activities!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Task Title & Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Est / Act Hrs</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>{task.date}</TableCell>
                    <TableCell>
                      <Chip label={task.project_name} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 12 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {task.task_title}
                      </Typography>
                      {task.description && (
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          {task.description}
                        </Typography>
                      )}
                      {task.remarks && (
                        <Typography variant="caption" sx={{ color: '#d97706', display: 'block' }}>
                          Note: {task.remarks}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                      <strong>{task.estimated_hours}h</strong> est / <strong>{task.actual_hours}h</strong> act
                    </TableCell>
                    <TableCell onClick={() => handleQuickStatusToggle(task)} sx={{ cursor: 'pointer' }}>
                      <Tooltip title="Click to toggle status">
                        <span>{getStatusChip(task.status)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleOpenModal(task)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(task.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>

      {/* Add / Edit Task Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingTask ? 'Edit WorkDone Entry' : 'Log Daily Task / Activity'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Project Name"
                  required
                  placeholder="e.g. HRMS Portal, Mobile App"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Task Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="In-Progress">In-Progress</MenuItem>
                  <MenuItem value="Pending/Blocked">Pending / Blocked</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Title"
                  required
                  placeholder="e.g. Implemented Google Sheets sync and auth flow"
                  value={formData.task_title}
                  onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Detailed Work Description"
                  placeholder="Detailed breakdown of activities performed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ step: '0.5', min: '0' }}
                  label="Estimated Time (Hours)"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ step: '0.5', min: '0' }}
                  label="Actual Time Taken (Hours)"
                  value={formData.actual_hours}
                  onChange={(e) => setFormData({ ...formData, actual_hours: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks / Blockers (Optional)"
                  placeholder="Any dependencies, blockers, or notes..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              {editingTask ? 'Save Changes' : 'Submit WorkDone'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Card>
  );
}
