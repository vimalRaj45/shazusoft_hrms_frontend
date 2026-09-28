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
  Paper,
  Alert
} from '@mui/material';
import {
  FactCheck as RegularizeIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Schedule as TimeIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  FilterList as FilterIcon,
  Email as EmailIcon,
  Info as InfoIcon,
  WarningAmber as PendingIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { communicationsAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/muiToast';
import { formatTime12h } from '../utils/timeUtils';
import { TableRowsSkeleton } from './SkeletonLoaders';

export default function StaffRegularizationsViewer({ onStatsUpdate }) {
  const { user, isAdmin, isTeamLeadOrManager } = useAuth();

  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Review & Rejection Modals
  const [selectedReq, setSelectedReq] = useState(null);
  const [openResolveModal, setOpenResolveModal] = useState(false);
  const [resolveAction, setResolveAction] = useState('Approved');
  const [resolveRemarks, setResolveRemarks] = useState('Verified and regularized.');
  const [openRejectionModal, setOpenRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Requests and Staff List
  const fetchRequests = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [reqRes, empRes] = await Promise.all([
        communicationsAPI.getRequests().catch(() => ({ data: { requests: [] } })),
        adminAPI.getEmployees().catch(() => ({ data: { employees: [] } }))
      ]);

      const reqList = reqRes?.data?.requests || [];
      setRequests(reqList);
      setEmployees(empRes?.data?.employees || []);

      if (onStatsUpdate) {
        const pendingCount = reqList.filter(r => r.status === 'Pending').length;
        onStatsUpdate(prev => ({ ...prev, pendingRegs: pendingCount }));
      }
    } catch (err) {
      console.error('Failed to load regularizations:', err);
      toast.error('Unable to load regularization requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filtered List
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Status Filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }

      // Month Filter (YYYY-MM)
      if (selectedMonth && r.date) {
        if (!r.date.startsWith(selectedMonth)) {
          return false;
        }
      }

      // Search Term (Employee Name, ID, Reason, Date)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const empName = (r.employee_name || '').toLowerCase();
        const empId = (r.employee_id || '').toLowerCase();
        const reason = (r.reason || '').toLowerCase();
        const date = (r.date || '').toLowerCase();

        return empName.includes(query) || empId.includes(query) || reason.includes(query) || date.includes(query);
      }

      return true;
    });
  }, [requests, statusFilter, selectedMonth, searchTerm]);

  // KPIs
  const kpis = useMemo(() => {
    const pending = requests.filter(r => r.status === 'Pending').length;
    const approved = requests.filter(r => r.status === 'Approved').length;
    const rejected = requests.filter(r => r.status === 'Rejected').length;
    const total = requests.length;
    return { pending, approved, rejected, total };
  }, [requests]);

  // Handle Approve Submission
  const handleApproveSubmit = async () => {
    if (!selectedReq) return;
    setActionLoading(true);
    try {
      const res = await communicationsAPI.resolveRequest({
        request_id: selectedReq.id,
        action: 'Approved',
        review_remarks: resolveRemarks || 'Verified and approved.'
      });
      toast.success(res.data?.message || 'Attendance regularized and saved successfully!');
      setOpenResolveModal(false);
      setSelectedReq(null);
      setResolveRemarks('Verified and regularized.');
      fetchRequests(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve regularization.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Submission
  const handleRejectSubmit = async () => {
    if (!selectedReq) return;
    if (!rejectionReason.trim()) {
      toast.warning('Please provide a specific reason for rejection.');
      return;
    }
    setActionLoading(true);
    try {
      await communicationsAPI.resolveRequest({
        request_id: selectedReq.id,
        action: 'Rejected',
        review_remarks: rejectionReason.trim()
      });
      toast.success('Regularization declined. Professional feedback dispatched to staff.');
      setOpenRejectionModal(false);
      setSelectedReq(null);
      setRejectionReason('');
      fetchRequests(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to decline regularization.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Approved':
        return <Chip label="Approved" size="small" sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 800, border: '1px solid #a7f3d0' }} />;
      case 'Rejected':
        return <Chip label="Declined" size="small" sx={{ bgcolor: '#fff1f2', color: '#9f1239', fontWeight: 800, border: '1px solid #fecdd3' }} />;
      default:
        return <Chip label="Pending Review" size="small" sx={{ bgcolor: '#fffbeb', color: '#92400e', fontWeight: 800, border: '1px solid #fde68a' }} />;
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#133829', color: '#fff', width: 44, height: 44 }}>
              <RegularizeIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Attendance Regularization Queue
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                {isAdmin ? 'Administrative master review of employee punch corrections' : 'Team Lead supervisor review of punch corrections & edge cases'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon className={refreshing ? 'animate-spin' : ''} />}
            onClick={() => fetchRequests(true)}
            disabled={refreshing}
            sx={{ fontWeight: 700, borderRadius: '8px', color: '#133829', borderColor: '#cbd5e1' }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh List'}
          </Button>
        </Box>
      </Box>

      {/* KPI Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card
            onClick={() => setStatusFilter('Pending')}
            sx={{
              borderRadius: '12px',
              cursor: 'pointer',
              border: statusFilter === 'Pending' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              bgcolor: statusFilter === 'Pending' ? '#fffbeb' : '#fff',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                  Pending Review
                </Typography>
                <PendingIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#b45309' }}>
                {kpis.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            onClick={() => setStatusFilter('Approved')}
            sx={{
              borderRadius: '12px',
              cursor: 'pointer',
              border: statusFilter === 'Approved' ? '2px solid #10b981' : '1px solid #e2e8f0',
              bgcolor: statusFilter === 'Approved' ? '#ecfdf5' : '#fff',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>
                  Approved
                </Typography>
                <ApproveIcon sx={{ color: '#10b981', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#047857' }}>
                {kpis.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            onClick={() => setStatusFilter('Rejected')}
            sx={{
              borderRadius: '12px',
              cursor: 'pointer',
              border: statusFilter === 'Rejected' ? '2px solid #ef4444' : '1px solid #e2e8f0',
              bgcolor: statusFilter === 'Rejected' ? '#fff1f2' : '#fff',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#9f1239', textTransform: 'uppercase' }}>
                  Declined
                </Typography>
                <RejectIcon sx={{ color: '#ef4444', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#be123c' }}>
                {kpis.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            onClick={() => setStatusFilter('ALL')}
            sx={{
              borderRadius: '12px',
              cursor: 'pointer',
              border: statusFilter === 'ALL' ? '2px solid #6366f1' : '1px solid #e2e8f0',
              bgcolor: statusFilter === 'ALL' ? '#eef2ff' : '#fff',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#4338ca', textTransform: 'uppercase' }}>
                  Total Requests
                </Typography>
                <HistoryIcon sx={{ color: '#6366f1', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#3730a3' }}>
                {kpis.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search Input */}
            <Grid item xs={12} sm={5} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by staff name, ID, date, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />
            </Grid>

            {/* Status Dropdown */}
            <Grid item xs={6} sm={4} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status Filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses ({kpis.total})</MenuItem>
                <MenuItem value="Pending">Pending Review ({kpis.pending})</MenuItem>
                <MenuItem value="Approved">Approved ({kpis.approved})</MenuItem>
                <MenuItem value="Rejected">Declined ({kpis.rejected})</MenuItem>
              </TextField>
            </Grid>

            {/* Month Selector */}
            <Grid item xs={6} sm={3} md={3}>
              <TextField
                type="month"
                fullWidth
                size="small"
                label="Filter Month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Requests Table */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <TableRowsSkeleton rows={5} columns={6} />
          </Box>
        ) : filteredRequests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            <Avatar sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <RegularizeIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155', mb: 0.5 }}>
              No Regularization Requests Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 440, mx: 'auto', mb: 2 }}>
              {statusFilter === 'Pending'
                ? 'Great job! There are currently no pending attendance regularization requests requiring your review.'
                : 'No punch correction requests match the selected filters.'}
            </Typography>
            {(statusFilter !== 'ALL' || searchTerm || selectedMonth) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setStatusFilter('ALL');
                  setSearchTerm('');
                  setSelectedMonth('');
                }}
                sx={{ borderRadius: '8px' }}
              >
                Reset All Filters
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Staff Member</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Requested Times</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Reason & Justification</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Review Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow
                    key={req.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#f8fafc' },
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Staff Name & ID */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#e2e8f0', color: '#1e293b', width: 34, height: 34, fontWeight: 700, fontSize: 13 }}>
                          {(req.employee_name || req.employee_id || 'U')[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {req.employee_name || req.employee_id}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            ID: {req.employee_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {req.date}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Requested Times */}
                    <TableCell>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: '#f1f5f9', px: 1.2, py: 0.5, borderRadius: '6px' }}>
                        <TimeIcon sx={{ fontSize: 15, color: '#0369a1' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0369a1', fontSize: 13 }}>
                          {formatTime12h(req.requested_login_time)} → {req.requested_logout_time ? formatTime12h(req.requested_logout_time) : 'End of Day'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Reason */}
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500, fontSize: 13 }}>
                        {req.reason}
                      </Typography>
                      {req.review_remarks && req.status !== 'Pending' && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#64748b', fontStyle: 'italic' }}>
                          Note: "{req.review_remarks}"
                        </Typography>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {getStatusChip(req.status)}
                    </TableCell>

                    {/* Management Actions */}
                    <TableCell align="right">
                      {req.status === 'Pending' ? (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => {
                              setSelectedReq(req);
                              setResolveRemarks('Verified and regularized.');
                              setOpenResolveModal(true);
                            }}
                            sx={{
                              fontWeight: 700,
                              borderRadius: '8px',
                              bgcolor: '#059669',
                              '&:hover': { bgcolor: '#047857' }
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => {
                              setSelectedReq(req);
                              setRejectionReason('');
                              setOpenRejectionModal(true);
                            }}
                            sx={{ fontWeight: 700, borderRadius: '8px' }}
                          >
                            Decline
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                            {req.status} by {req.reviewed_by_name || 'Management'}
                          </Typography>
                          {req.updated_at && (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 11 }}>
                              {new Date(req.updated_at).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {/* APPROVAL MODAL */}
      <Dialog
        open={openResolveModal}
        onClose={() => !actionLoading && setOpenResolveModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 1 }}>
          Approve Attendance Regularization
        </DialogTitle>
        <DialogContent>
          {selectedReq && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="success" icon={<ApproveIcon />} sx={{ mb: 2, borderRadius: '8px' }}>
                Approving will immediately update <strong>{selectedReq.employee_name || selectedReq.employee_id}</strong>'s attendance for <strong>{selectedReq.date}</strong> to Regularized status.
              </Alert>

              <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: '#f8fafc', borderRadius: '8px' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                  Requested Timings:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {formatTime12h(selectedReq.requested_login_time)} to {selectedReq.requested_logout_time ? formatTime12h(selectedReq.requested_logout_time) : 'End of Day'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 1 }}>
                  Staff Reason:
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155' }}>
                  {selectedReq.reason}
                </Typography>
              </Paper>

              <TextField
                fullWidth
                size="small"
                label="Approval Remarks / Note"
                value={resolveRemarks}
                onChange={(e) => setResolveRemarks(e.target.value)}
                placeholder="e.g., Verified with operational records."
                helperText="This note will be recorded permanently in the compliance audit trail."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenResolveModal(false)}
            disabled={actionLoading}
            sx={{ fontWeight: 700, color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApproveSubmit}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <ApproveIcon />}
            sx={{ fontWeight: 800, borderRadius: '8px', bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
          >
            {actionLoading ? 'Approving...' : 'Confirm Approval'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* REJECTION MODAL */}
      <Dialog
        open={openRejectionModal}
        onClose={() => !actionLoading && setOpenRejectionModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#991b1b', pb: 1 }}>
          Decline Regularization Request
        </DialogTitle>
        <DialogContent>
          {selectedReq && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="warning" icon={<InfoIcon />} sx={{ mb: 2, borderRadius: '8px' }}>
                A structured notification email and in-app alert with your constructive explanation will be dispatched to <strong>{selectedReq.employee_name || selectedReq.employee_id}</strong>.
              </Alert>

              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                required
                label="Reason for Declining"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Timings do not match site visitor log / missing client confirmation."
                helperText="Please provide clear context for why this punch correction is declined."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenRejectionModal(false)}
            disabled={actionLoading}
            sx={{ fontWeight: 700, color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectSubmit}
            disabled={actionLoading || !rejectionReason.trim()}
            startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <RejectIcon />}
            sx={{ fontWeight: 800, borderRadius: '8px' }}
          >
            {actionLoading ? 'Declining...' : 'Confirm Decline'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
