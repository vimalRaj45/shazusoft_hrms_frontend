import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  Rating,
  Divider,
  CircularProgress,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  AssignmentTurnedIn as EvalIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudDownload as AutoImportIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  EditNote as FormIcon
} from '@mui/icons-material';
import toast, { muiToast } from '../utils/muiToast';
import confetti from 'canvas-confetti';
import { evaluationsAPI } from '../services/api';
import { format } from 'date-fns';

const RATING_CATEGORIES = [
  { key: 'quality_of_work', label: 'Quality of Work' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'meeting_deadlines', label: 'Meeting Deadlines' },
  { key: 'technical_skills', label: 'Technical / Job Skills' },
  { key: 'communication', label: 'Communication' },
  { key: 'teamwork', label: 'Teamwork & Collaboration' },
  { key: 'problem_solving', label: 'Problem Solving' },
  { key: 'initiative_ownership', label: 'Initiative & Ownership' },
  { key: 'learning_development', label: 'Learning & Skill Development' },
  { key: 'attendance_punctuality', label: 'Attendance & Punctuality' },
  { key: 'professional_behaviour', label: 'Professional Behaviour' }
];

export default function MonthlySelfEvaluationModal({ open = false, onClose, user, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // 1. Employee Details
  const [details, setDetails] = useState({
    employee_name: '',
    employee_id: '',
    designation: '',
    department: '',
    reporting_person: 'Operations & Engineering Lead',
    review_month: format(new Date(), 'MMMM yyyy'),
    review_period: `01-${format(new Date(), 'MMM-yyyy')} to ${format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'dd-MMM-yyyy')}`,
    submission_date: formatTodayDate()
  });

  function formatTodayDate() {
    try {
      return new Date().toISOString().split('T')[0];
    } catch {
      return '2026-08-31';
    }
  }

  // 2. Monthly Work Summary
  const [workSummary, setWorkSummary] = useState('');

  // 3. Targets / Tasks
  const [targets, setTargets] = useState([
    { task: '', description: '', progress: '100%', status: 'Completed', remarks: '' }
  ]);

  // 4. Self-Rating (1-5 scale)
  const [ratings, setRatings] = useState({
    quality_of_work: 5,
    productivity: 5,
    meeting_deadlines: 4,
    technical_skills: 5,
    communication: 4,
    teamwork: 5,
    problem_solving: 5,
    initiative_ownership: 5,
    learning_development: 4,
    attendance_punctuality: 5,
    professional_behaviour: 5
  });

  // 5. Key Accomplishments
  const [keyAccomplishments, setKeyAccomplishments] = useState('');

  // 6. Challenges Faced
  const [challengesFaced, setChallengesFaced] = useState('');

  // 7. Learning & Development
  const [learningDev, setLearningDev] = useState('');

  // 8. Areas for Improvement
  const [areasImprovement, setAreasImprovement] = useState('');

  // 9. Support Required
  const [supportRequired, setSupportRequired] = useState('');

  // 10. Goals for Next Month
  const [goalsNextMonth, setGoalsNextMonth] = useState('Edge testing, cross-browser testing, remaining website improvements, and performance optimization.');

  // 11. Employee Comments
  const [employeeComments, setEmployeeComments] = useState('');

  // 12. Employee Declaration
  const [declaration, setDeclaration] = useState(true);

  // 13. Signature
  const [signature, setSignature] = useState('');

  // Sync user details on load
  useEffect(() => {
    if (user) {
      setDetails((prev) => ({
        ...prev,
        employee_name: user.name || '',
        employee_id: user.id || '',
        designation: user.designation || '',
        department: user.department || ''
      }));
      setSignature(user.name || '');
    }
  }, [user, open]);

  // Calculate real-time overall rating average
  const ratingValues = Object.values(ratings);
  const overallAverage = (ratingValues.reduce((a, b) => a + b, 0) / (ratingValues.length || 1)).toFixed(1);

  // Auto-import tasks from Google Sheets WorkDone log
  const handleAutoImportTasks = async () => {
    setImporting(true);
    try {
      const res = await evaluationsAPI.getPrefillTasks({ month_year: '2026-08' });
      if (res.data.prefilledTargets && res.data.prefilledTargets.length > 0) {
        setTargets(res.data.prefilledTargets);

        const taskListStr = res.data.prefilledTargets.map((t, idx) => `${idx + 1}. ${t.task}`).join(', ');
        if (!workSummary) {
          setWorkSummary(`During August 2026, successfully delivered key technical objectives across projects: ${taskListStr}. Focused on core architecture, real-time Google Sheets synchronization, and high performance.`);
        }
        if (!keyAccomplishments) {
          setKeyAccomplishments(`- Completed ${res.data.prefilledTargets.length} key engineering deliverables on schedule.\n- Maintained stable architecture with zero data loss in Google Sheets.\n- Ensured high cross-platform compatibility.`);
        }
        toast.success(`Auto-imported ${res.data.prefilledTargets.length} tasks from your August WorkDone log!`);
      } else {
        toast.error('No logged tasks found for August. Please enter them manually below.');
      }
    } catch (err) {
      toast.error('Could not auto-fetch tasks. You can still enter them manually.');
    } finally {
      setImporting(false);
    }
  };

  const handleAddTargetRow = () => {
    setTargets([
      ...targets,
      { task: '', description: '', progress: '100%', status: 'Completed', remarks: '' }
    ]);
  };

  const handleRemoveTargetRow = (index) => {
    if (targets.length === 1) return;
    setTargets(targets.filter((_, i) => i !== index));
  };

  const handleTargetChange = (index, field, value) => {
    const updated = [...targets];
    updated[index][field] = value;
    setTargets(updated);
  };

  const handleRatingChange = (categoryKey, value) => {
    setRatings((prev) => ({ ...prev, [categoryKey]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!declaration) {
      toast.error('Please accept the employee declaration checkbox.');
      return;
    }

    if (!signature.trim()) {
      toast.error('Please provide your digital signature (full name).');
      return;
    }

    const confirmed = await muiToast.confirm({
      title: 'Submit Appraisal Evaluation',
      message: `You are about to submit your official August Self-Evaluation (Score: ${overallAverage}/5) to Google Sheets. Would you like to proceed?`,
      confirmText: 'Submit Appraisal',
      cancelText: 'Keep Editing',
      severity: 'info'
    });
    if (!confirmed) return;

    setLoading(true);

    const payload = {
      ...details,
      monthly_work_summary: workSummary,
      targets_tasks: targets.filter((t) => t.task.trim() !== ''),
      self_ratings: ratings,
      overall_rating: overallAverage,
      key_accomplishments: keyAccomplishments,
      challenges_faced: challengesFaced,
      learning_development: learningDev,
      areas_for_improvement: areasImprovement,
      support_required: supportRequired,
      goals_next_month: goalsNextMonth,
      employee_comments: employeeComments,
      employee_declaration: declaration,
      employee_signature: signature
    };

    try {
      const res = await evaluationsAPI.submit(payload);
      toast.success(res.data.message || 'August Self-Evaluation submitted successfully!');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit self-evaluation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: '1px solid #e5e7eb' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                bgcolor: '#e8f5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#133829'
              }}
            >
              <EvalIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#0f172a' }}>
                Monthly Employee Self-Evaluation Appraisal
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                13 Official Review Sections • {details.review_month} Review Cycle • Direct Google Sheets
              </Typography>
            </Box>
          </Box>

          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <AutoImportIcon />}
            onClick={handleAutoImportTasks}
            disabled={importing}
            sx={{ fontWeight: 700 }}
          >
            {importing ? 'Importing...' : 'Auto-Import Monthly Tasks'}
          </Button>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, sm: 3.5 }, bgcolor: '#ffffff' }}>
          {/* SECTION 1: Employee Details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormIcon fontSize="small" /> 1. Employee Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Employee Name" required value={details.employee_name} onChange={(e) => setDetails({ ...details, employee_name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Employee ID" required value={details.employee_id} onChange={(e) => setDetails({ ...details, employee_id: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Designation" required value={details.designation} onChange={(e) => setDetails({ ...details, designation: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Department" required value={details.department} onChange={(e) => setDetails({ ...details, department: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Reporting Person" value={details.reporting_person} onChange={(e) => setDetails({ ...details, reporting_person: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Review Month" value={details.review_month} onChange={(e) => setDetails({ ...details, review_month: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Review Period" value={details.review_period} onChange={(e) => setDetails({ ...details, review_period: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" type="date" label="Date of Submission" InputLabelProps={{ shrink: true }} value={details.submission_date} onChange={(e) => setDetails({ ...details, submission_date: e.target.value })} />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* SECTION 2: Monthly Work Summary */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829', mb: 0.5 }}>
              2. Monthly Work Summary <span style={{ color: '#dc2626' }}>*</span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              Briefly describe the key technical work, milestones, and deliverables completed during August.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              required
              placeholder="e.g. In August, completed project milestones, client deliverables, team sprint coordination, and operations performance tracking..."
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* SECTION 3: Targets / Tasks */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829' }}>
                  3. Targets / Tasks Delivered
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Specific target breakdown with progress percentage, status, and comments.
                </Typography>
              </Box>
              <Button size="small" startIcon={<AddIcon />} onClick={handleAddTargetRow} sx={{ fontWeight: 700 }}>
                Add Target Row
              </Button>
            </Box>

            <Box sx={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, width: '25%' }}>Task / Target</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '30%' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '12%' }}>Progress %</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '15%' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '15%' }}>Remarks</TableCell>
                    <TableCell align="right" sx={{ width: '3%' }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {targets.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="e.g. Backend API"
                          value={row.task}
                          onChange={(e) => handleTargetChange(idx, 'task', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Details of deliverable"
                          value={row.description}
                          onChange={(e) => handleTargetChange(idx, 'description', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="100%"
                          value={row.progress}
                          onChange={(e) => handleTargetChange(idx, 'progress', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={row.status}
                          onChange={(e) => handleTargetChange(idx, 'status', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Remarks"
                          value={row.remarks}
                          onChange={(e) => handleTargetChange(idx, 'remarks', e.target.value)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveTargetRow(idx)}
                          disabled={targets.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* SECTION 4: Self-Rating (1-5 scale) */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829' }}>
                  4. Self-Rating (1 to 5 Stars)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Rate your performance across the 11 key criteria for August 2026.
                </Typography>
              </Box>

              <Chip
                icon={<StarIcon />}
                label={`Overall Rating: ${overallAverage} / 5.0 ⭐`}
                color="primary"
                sx={{ fontWeight: 800, fontSize: 13, py: 2 }}
              />
            </Box>

            <Grid container spacing={2}>
              {RATING_CATEGORIES.map((cat) => (
                <Grid item xs={12} sm={6} md={4} key={cat.key}>
                  <Box sx={{ p: 1.8, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e5e7eb' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                        {cat.label}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#133829' }}>
                        {ratings[cat.key]} / 5
                      </Typography>
                    </Box>
                    <Rating
                      value={ratings[cat.key]}
                      precision={1}
                      onChange={(e, val) => handleRatingChange(cat.key, val || 1)}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* SECTION 5: Key Accomplishments */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829', mb: 0.5 }}>
              5. Key Accomplishments <span style={{ color: '#dc2626' }}>*</span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              Major work completed, important achievements, and significant contributions.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              required
              placeholder="e.g. Successfully architected GPS geofence punch system, zero Google Sheets rate-limit errors, delivered 100% on-time..."
              value={keyAccomplishments}
              onChange={(e) => setKeyAccomplishments(e.target.value)}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* SECTION 6: Challenges Faced */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829', mb: 0.5 }}>
              6. Challenges Faced
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              Difficulties encountered and how they were handled.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="e.g. Handling mobile GPS coordinate accuracy across different devices, resolved using high accuracy fallback threshold."
              value={challengesFaced}
              onChange={(e) => setChallengesFaced(e.target.value)}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* SECTION 7: Learning & Skill Development */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829', mb: 0.5 }}>
              7. Learning & Skill Development
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              New skills acquired, tools learned, or certifications gained.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="e.g. Google Sheets API v4 service account credentials, Fastify server optimization, Material UI alert and confirmation patterns..."
              value={learningDev}
              onChange={(e) => setLearningDev(e.target.value)}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* SECTION 8: Areas for Improvement */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829', mb: 0.5 }}>
              8. Areas for Improvement
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              Skills or processes you want to improve.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="e.g. Automated E2E test coverage and faster task estimation accuracy."
              value={areasImprovement}
              onChange={(e) => setAreasImprovement(e.target.value)}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* SECTION 9: Support Required from Team / Management */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829', mb: 0.5 }}>
              9. Support Required from Team / Management
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              Tools, training, or guidance needed.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="e.g. Access to cloud staging environments, regular architecture review syncs..."
              value={supportRequired}
              onChange={(e) => setSupportRequired(e.target.value)}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* SECTION 10: Goals for Next Month */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829', mb: 0.5 }}>
              10. Goals for Next Month <span style={{ color: '#dc2626' }}>*</span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              What you plan to complete/improve next month (e.g. Edge testing, cross-browser testing, remaining website improvements).
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              required
              placeholder="e.g. Edge testing, cross-browser testing, remaining website improvements, automated CI deployment..."
              value={goalsNextMonth}
              onChange={(e) => setGoalsNextMonth(e.target.value)}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* SECTION 11: Employee Comments */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829', mb: 0.5 }}>
              11. Employee Comments
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              Your overall thoughts about the month.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Overall productive month with strong team collaboration and on-time project milestones."
              value={employeeComments}
              onChange={(e) => setEmployeeComments(e.target.value)}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* SECTION 12: Employee Declaration & 13. Signature */}
          <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e5e7eb' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#133829', mb: 1 }}>
              12. Employee Declaration & 13. Signature
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                  I hereby declare that all information, achievements, targets, and self-ratings provided in this August Self-Evaluation are true and correct to the best of my knowledge.
                </Typography>
              }
            />

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Digital Signature (Full Name)"
                  required
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date"
                  disabled
                  value={details.submission_date}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
            sx={{ fontWeight: 800, px: 3 }}
          >
            {loading ? 'Saving to Google Sheets...' : 'Submit August Self-Evaluation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
