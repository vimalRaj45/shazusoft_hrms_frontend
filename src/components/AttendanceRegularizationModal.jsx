import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Schedule as ClockIcon,
  HelpOutline as ReasonIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from '../utils/muiToast';
import { communicationsAPI } from '../services/api';

const COMMON_REASONS = [
  'GPS / Location Device Glitch',
  'Forgot to Punch In / Punch Out',
  'Client Site Visit / Field Duty',
  'Network / Connectivity Outage',
  'Approved Late Entry by Manager',
  'Work From Home / Remote Approval'
];

export default function AttendanceRegularizationModal({ open, onClose, onSuccess }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loginTime, setLoginTime] = useState('09:30');
  const [logoutTime, setLogoutTime] = useState('18:30');
  const [reasonCategory, setReasonCategory] = useState(COMMON_REASONS[0]);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !loginTime) {
      toast.error('Please select the date and requested login time.');
      return;
    }

    const fullReason = explanation.trim()
      ? `[${reasonCategory}] ${explanation.trim()}`
      : `[${reasonCategory}] Correction requested.`;

    setLoading(true);
    try {
      const res = await communicationsAPI.requestRegularization({
        date,
        requested_login_time: loginTime,
        requested_logout_time: logoutTime,
        reason: fullReason
      });
      toast.success(res.data.message || 'Regularization request sent to management!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit regularization request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 45px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #f1f5f9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ClockIcon sx={{ color: '#133829', fontSize: 22 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
              Request Attendance Regularization
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Submit punch-in/out corrections for management review
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ py: 2.5 }}>
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600, display: 'block' }}>
              ℹ️ Management will verify your request against office records before regularizing your attendance.
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date of Attendance Discrepancy"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="time"
                label="Requested Punch-In Time"
                required
                value={loginTime}
                onChange={(e) => setLoginTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="time"
                label="Requested Punch-Out Time"
                value={logoutTime}
                onChange={(e) => setLogoutTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Reason Category"
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
              >
                {COMMON_REASONS.map((r) => (
                  <MenuItem key={r} value={r} sx={{ fontSize: 13, borderRadius: '4px' }}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="Detailed Explanation / Management Note"
                placeholder="Provide details about why regular check-in was missed..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600, borderRadius: '4px' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            sx={{
              bgcolor: '#133829',
              fontWeight: 700,
              borderRadius: '4px',
              px: 2.5,
              '&:hover': { bgcolor: '#0b2319' }
            }}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
