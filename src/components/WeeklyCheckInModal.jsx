import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Chip,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  DateRange as WeekIcon,
  CloudDownload as AutoImportIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  EmojiEvents as TrophyIcon,
  ReportProblemOutlined as BlockerIcon,
  LightbulbOutlined as LightbulbIcon,
  TrendingUp as NextGoalIcon,
  Send as SendIcon
} from '@mui/icons-material';
import toast, { muiToast } from '../utils/muiToast';
import confetti from 'canvas-confetti';
import { evaluationsAPI } from '../services/api';

export default function WeeklyCheckInModal({ open, onClose, user, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [weekInfo, setWeekInfo] = useState(null);

  const [formData, setFormData] = useState({
    accomplishments: '',
    challenges_blockers: '',
    learnings_skills: '',
    next_week_goals: ''
  });

  const fetchWeekData = async () => {
    try {
      setImporting(true);
      const res = await evaluationsAPI.getPrefillWeeklyTasks();
      if (res.data) {
        setWeekInfo(res.data);
        if (!formData.accomplishments && res.data.summaryText) {
          setFormData((prev) => ({
            ...prev,
            accomplishments: res.data.summaryText
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching weekly prefill:', err);
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchWeekData();
    }
  }, [open]);

  const handleAutoImport = async () => {
    setImporting(true);
    try {
      const res = await evaluationsAPI.getPrefillWeeklyTasks();
      if (res.data?.summaryText) {
        setFormData((prev) => ({
          ...prev,
          accomplishments: res.data.summaryText
        }));
        toast.success(`Imported ${res.data.tasksCount} task(s) logged this week.`);
      } else {
        toast.info('No logged tasks found for the current week.');
      }
    } catch (err) {
      toast.error('Failed to import weekly tasks.');
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accomplishments.trim() || !formData.challenges_blockers.trim() || !formData.next_week_goals.trim()) {
      toast.error('Please fill in Key Accomplishments, Challenges, and Next Week Goals.');
      return;
    }

    const confirmed = await muiToast.confirm({
      title: 'Submit Weekly Check-in?',
      message: `You are submitting your concise weekly progress report for ${weekInfo?.weekLabel || 'this week'} to Google Sheets.`,
      confirmText: 'Submit Check-in',
      cancelText: 'Keep Editing',
      severity: 'info'
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const payload = {
        week_number: weekInfo?.weekNumber,
        year: weekInfo?.year,
        week_label: weekInfo?.weekLabel,
        ...formData
      };
      const res = await evaluationsAPI.submitWeekly(payload);
      toast.success(res.data.message || 'Weekly check-in submitted successfully!');
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setFormData({
        accomplishments: '',
        challenges_blockers: '',
        learnings_skills: '',
        next_week_goals: ''
      });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit weekly check-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        {/* Modal Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2.5,
            bgcolor: '#133829',
            color: '#ffffff'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '4px',
                bgcolor: 'rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}
            >
              <WeekIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
                Weekly Check-in Report
              </Typography>
              <Typography variant="caption" sx={{ color: '#a7f3d0', fontWeight: 600 }}>
                {weekInfo?.weekLabel || 'Fast & Focused Weekly Progress Sync • Google Sheets'}
              </Typography>
            </Box>
          </Box>

          <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)', borderRadius: '4px' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Modal Content */}
        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#ffffff' }}>
          {/* Quick Notice Banner with 1-Click Task Auto-Import */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1.5,
              mb: 3,
              bgcolor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '4px',
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label="Always Open"
                size="small"
                color="success"
                sx={{ fontWeight: 800, borderRadius: '4px', fontSize: 11 }}
              />
              <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600 }}>
                Submit anytime each week. Focused strictly on your key highlights, blockers & next goals.
              </Typography>
            </Box>

            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={importing ? <CircularProgress size={14} color="inherit" /> : <AutoImportIcon />}
              onClick={handleAutoImport}
              disabled={importing}
              sx={{ fontWeight: 700, borderRadius: '4px', textTransform: 'none' }}
            >
              {importing ? 'Importing...' : "Auto-Import This Week's Tasks"}
            </Button>
          </Box>

          <Grid container spacing={2.5}>
            {/* 1. Key Accomplishments */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrophyIcon sx={{ color: '#10b981', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  1. Key Accomplishments & Work Done (Mandatory)
                </Typography>
              </Box>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                size="small"
                placeholder="List major features built, bugs resolved, client deliverables completed this week..."
                value={formData.accomplishments}
                onChange={(e) => setFormData({ ...formData, accomplishments: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
              />
            </Grid>

            {/* 2. Challenges & Blockers */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BlockerIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  2. Challenges, Blockers & Issues Encountered (Mandatory)
                </Typography>
              </Box>
              <TextField
                fullWidth
                required
                multiline
                rows={2}
                size="small"
                placeholder="Any technical hurdles, dependency delays, or operational blockers faced this week..."
                value={formData.challenges_blockers}
                onChange={(e) => setFormData({ ...formData, challenges_blockers: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
              />
            </Grid>

            {/* 3. Learnings & Skills */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LightbulbIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  3. Key Learnings & Skills Applied
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="New tools, techniques, best practices, or architectural patterns explored..."
                value={formData.learnings_skills}
                onChange={(e) => setFormData({ ...formData, learnings_skills: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
              />
            </Grid>

            {/* 4. Next Week Goals */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <NextGoalIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  4. Top Priorities & Goals for Next Week (Mandatory)
                </Typography>
              </Box>
              <TextField
                fullWidth
                required
                multiline
                rows={2}
                size="small"
                placeholder="What are your top 2-3 target deliverables for next week?"
                value={formData.next_week_goals}
                onChange={(e) => setFormData({ ...formData, next_week_goals: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        {/* Modal Actions */}
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
          <Button
            onClick={onClose}
            color="inherit"
            sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            sx={{
              borderRadius: '4px',
              bgcolor: '#133829',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              '&:hover': { bgcolor: '#0f291e' }
            }}
          >
            {loading ? 'Submitting...' : 'Submit Weekly Check-in'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
