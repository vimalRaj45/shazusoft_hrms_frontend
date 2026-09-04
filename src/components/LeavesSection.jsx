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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  EventBusy as LeaveIcon,
  Add as AddIcon,
  Timer as PermissionIcon,
  AccountBalance as BalanceIcon
} from '@mui/icons-material';
import toast from '../utils/muiToast';
import { leavesAPI } from '../services/api';
import { TableRowsSkeleton } from './SkeletonLoaders';

export default function LeavesSection() {
  const [activeTab, setActiveTab] = useState(0); // 0 = Leave Requests, 1 = Short Permissions
  const [leaves, setLeaves] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [openLeaveModal, setOpenLeaveModal] = useState(false);
  const [openPermModal, setOpenPermModal] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'Casual Leave',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const [permForm, setPermForm] = useState({
    date: '',
    start_time: '15:00',
    end_time: '16:30',
    duration_hours: '1.5',
    reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, permsRes, balanceRes] = await Promise.all([
        leavesAPI.getMyLeaves(),
        leavesAPI.getMyPermissions(),
        leavesAPI.getBalances()
      ]);
      setLeaves(leavesRes.data.leaves || []);
      setPermissions(permsRes.data.permissions || []);
      setBalanceData(balanceRes.data);
    } catch (err) {
      console.error('Error fetching leaves & permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await leavesAPI.apply(leaveForm);
      toast.success(res.data.message || 'Leave applied successfully!');
      setOpenLeaveModal(false);
      setLeaveForm({
        leave_type: 'Casual Leave',
        start_date: '',
        end_date: '',
        reason: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit leave.');
    }
  };

  const handleApplyPermission = async (e) => {
    e.preventDefault();
    try {
      const res = await leavesAPI.applyPermission(permForm);
      toast.success(res.data.message || 'Permission requested successfully!');
      setOpenPermModal(false);
      setPermForm({
        date: '',
        start_time: '15:00',
        end_time: '16:30',
        duration_hours: '1.5',
        reason: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit permission.');
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Approved':
        return <Chip label="Approved" color="success" size="small" sx={{ fontWeight: 700 }} />;
      case 'Rejected':
        return <Chip label="Rejected" color="error" size="small" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label="Pending" color="warning" size="small" sx={{ fontWeight: 700 }} />;
    }
  };

  const balances = balanceData?.balances || {};
  const permPolicy = balanceData?.permissionPolicy || { monthlyLimit: 2, usedThisMonth: 0, remainingThisMonth: 2 };

  return (
    <Card sx={{ mt: 3, border: '1px solid #e5e7eb', borderRadius: '4px' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BalanceIcon color="primary" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Leave Quota & Short Permission Pass
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                View remaining annual leave balances and submit short permission requests
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PermissionIcon />}
              onClick={() => setOpenPermModal(true)}
              sx={{ fontWeight: 600 }}
            >
              Request Permission (1-2h)
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenLeaveModal(true)}
              sx={{ fontWeight: 700 }}
            >
              Apply for Leave
            </Button>
          </Box>
        </Box>

        {/* Real-time Leave Balance KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>CASUAL LEAVE (CL)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#3b82f6', mt: 0.5 }}>
                {balances['Casual Leave']?.remainingDays ?? 12} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {balances['Casual Leave']?.totalQuota ?? 12}d</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {balances['Casual Leave']?.approvedDays ?? 0} days used
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>SICK LEAVE (SL)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981', mt: 0.5 }}>
                {balances['Sick Leave']?.remainingDays ?? 12} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {balances['Sick Leave']?.totalQuota ?? 12}d</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {balances['Sick Leave']?.approvedDays ?? 0} days used
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>PAID ANNUAL LEAVE (PL)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0284c7', mt: 0.5 }}>
                {balances['Paid Leave']?.remainingDays ?? 12} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {balances['Paid Leave']?.totalQuota ?? 12}d</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {balances['Paid Leave']?.approvedDays ?? 0} days used
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>MONTHLY PERMISSION PASS</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f59e0b', mt: 0.5 }}>
                {permPolicy.remainingThisMonth} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {permPolicy.monthlyLimit} left</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {permPolicy.usedThisMonth} used this month
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Sub Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label={`Leave Applications (${leaves.length})`} icon={<LeaveIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label={`Short Permissions (${permissions.length})`} icon={<PermissionIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>

        {/* TAB 0: Leaves Table */}
        {activeTab === 0 && (
          loading ? (
            <TableRowsSkeleton rows={3} cols={6} />
          ) : leaves.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#f8fafc', borderRadius: '4px', border: '1px dashed #cbd5e1' }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>No leave applications submitted yet.</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Leave Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Total Days</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Reviewed By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.map((l) => (
                    <TableRow key={l.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{l.leave_type}</TableCell>
                      <TableCell>{l.start_date} to {l.end_date}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{l.total_days} day(s)</TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: 13, maxWidth: 240 }}>
                        <div>{l.reason}</div>
                        {l.review_remarks && (
                          <Typography variant="caption" sx={{ color: l.status === 'Rejected' ? '#dc2626' : '#059669', fontWeight: 600, display: 'block', mt: 0.5 }}>
                            Management: {l.review_remarks}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{getStatusChip(l.status)}</TableCell>
                      <TableCell sx={{ color: '#64748b' }}>{l.reviewed_by || '--'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )
        )}

        {/* TAB 1: Permissions Table */}
        {activeTab === 1 && (
          loading ? (
            <TableRowsSkeleton rows={3} cols={6} />
          ) : permissions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#f8fafc', borderRadius: '4px', border: '1px dashed #cbd5e1' }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>No permission requests submitted yet.</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Time Window</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Reason / Feedback</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Reviewed By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{p.date}</TableCell>
                      <TableCell>{p.start_time} - {p.end_time}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{p.duration_hours} hrs</TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: 13, maxWidth: 240 }}>
                        <div>{p.reason}</div>
                        {p.review_remarks && (
                          <Typography variant="caption" sx={{ color: p.status === 'Rejected' ? '#dc2626' : '#059669', fontWeight: 600, display: 'block', mt: 0.5 }}>
                            Management: {p.review_remarks}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{getStatusChip(p.status)}</TableCell>
                      <TableCell sx={{ color: '#64748b' }}>{p.reviewed_by || '--'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )
        )}
      </CardContent>

      {/* Apply Leave Modal */}
      <Dialog open={openLeaveModal} onClose={() => setOpenLeaveModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleApplyLeave}>
          <DialogTitle sx={{ fontWeight: 700 }}>Apply for Leave</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Leave Type"
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                >
                  <MenuItem value="Casual Leave">Casual Leave ({balances['Casual Leave']?.remainingDays ?? 12} days left)</MenuItem>
                  <MenuItem value="Sick Leave">Sick Leave ({balances['Sick Leave']?.remainingDays ?? 12} days left)</MenuItem>
                  <MenuItem value="Paid Leave">Paid Annual Leave ({balances['Paid Leave']?.remainingDays ?? 12} days left)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  InputLabelProps={{ shrink: true }}
                  required
                  value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  InputLabelProps={{ shrink: true }}
                  required
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Reason for Leave"
                  required
                  placeholder="Explain reason for absence..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenLeaveModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              Submit Leave Request
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Request Permission Modal (1-2 Hours pass) */}
      <Dialog open={openPermModal} onClose={() => setOpenPermModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleApplyPermission}>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PermissionIcon color="secondary" /> Request Short Permission Pass (Max 2 hrs)
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Monthly Limit: <strong>{permPolicy.monthlyLimit} passes allowed per month</strong>. You have <strong>{permPolicy.remainingThisMonth} remaining</strong>.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Permission Date"
                  InputLabelProps={{ shrink: true }}
                  required
                  value={permForm.date}
                  onChange={(e) => setPermForm({ ...permForm, date: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Time"
                  InputLabelProps={{ shrink: true }}
                  required
                  value={permForm.start_time}
                  onChange={(e) => setPermForm({ ...permForm, start_time: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="time"
                  label="End Time"
                  InputLabelProps={{ shrink: true }}
                  required
                  value={permForm.end_time}
                  onChange={(e) => setPermForm({ ...permForm, end_time: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ step: '0.5', max: '2.5', min: '0.5' }}
                  label="Duration (Hours)"
                  required
                  value={permForm.duration_hours}
                  onChange={(e) => setPermForm({ ...permForm, duration_hours: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Reason / Errand Details"
                  required
                  placeholder="e.g. Bank visit, Doctor appointment, Personal emergency..."
                  value={permForm.reason}
                  onChange={(e) => setPermForm({ ...permForm, reason: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenPermModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" sx={{ fontWeight: 700 }}>
              Submit Permission Request
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Card>
  );
}
