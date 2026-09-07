import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Grid,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  CircularProgress,
  Tooltip,
  IconButton,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Divider,
  Paper,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Campaign as MemoIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  NotificationsActive as RemindIcon,
  Print as PrintIcon,
  CheckCircle as SignedIcon,
  HourglassEmpty as PendingIcon,
  Person as PersonIcon,
  Groups as DeptIcon,
  Public as AllIcon,
  Close as CloseIcon,
  PriorityHigh as UrgentIcon,
  Article as ArticleIcon,
  AutoStories as TemplateIcon
} from '@mui/icons-material';
import { memosAPI, adminAPI } from '../services/api';
import toast from '../utils/muiToast';

const CATEGORIES = [
  'Official Directive',
  'Policy Revision',
  'Appraisal / Performance',
  'Disciplinary & Conduct',
  'Company Announcement',
  'General'
];

const DEPARTMENTS = [
  'Engineering',
  'Quality Assurance',
  'Product Design',
  'Marketing & Growth',
  'Human Resources',
  'Finance & Accounts',
  'Operations'
];

const QUICK_TEMPLATES = [
  {
    name: 'Code of Conduct & Punctuality',
    category: 'Disciplinary & Conduct',
    priority: 'High',
    title: 'Executive Directive: Adherence to Core Office Hours & Punctuality',
    content: `All personnel are reminded that consistent punctuality and adherence to designated shift timings are fundamental operational requirements at Shazusoft Technologies.

1. Daily Arrival & Punch-In:
Employees must record their presence within the designated geofenced perimeter before the designated shift cutoff.

2. Punctuality & Leave Regularizations:
Any missed punch or unavoidable delay must be formally submitted for manager review via the HRMS portal within 24 hours.

3. Professional Responsibility:
Persistent unexcused delays impact team workflow and project deliverables. Continued non-compliance may lead to disciplinary review as per company policy.

Please review this directive and record your digital acknowledgment below.`
  },
  {
    name: 'Confidentiality & Data Protection',
    category: 'Policy Revision',
    priority: 'Urgent',
    title: 'Corporate Security Directive: Client Confidentiality & Intellectual Property',
    content: `In alignment with our ISO-27001 data governance standards and client non-disclosure agreements, this memorandum reinforces all security protocols across company infrastructure.

Key Protocols:
• Proprietary Code & Data: Company codebases, credentials, and customer datasets must never be transferred to unauthorized personal devices or public cloud storage.
• Device Security: All workstations must remain locked when unattended and adhere to multi-factor authentication (MFA) requirements.
• Incident Reporting: Any suspected security compromise or unauthorized disclosure must be reported immediately to the IT & Security Team.

Acknowledgment is mandatory for all personnel within 48 hours of issuance.`
  },
  {
    name: 'Project Milestone & Sprint Delivery',
    category: 'Official Directive',
    priority: 'Normal',
    title: 'Operational Notice: Sprint Deliverables & Code Review Checkpoints',
    content: `As we prepare for upcoming release deliverables, all engineering and product teams are requested to align on the following checkpoints:

1. Daily Work Logs: Ensure all daily task deliverables and estimated vs. actual hours are kept current in the HRMS Daily Plan.
2. Code Reviews & QA Sign-off: No feature branch may merge to staging without peer review and verified QA pass.
3. Blocker Escalation: Any critical dependencies or blockers should be raised immediately during standup or via the HRMS Task Hub.

Thank you for your sustained dedication to delivering excellence.`
  },
  {
    name: 'Individual Performance Alignment',
    category: 'Appraisal / Performance',
    priority: 'High',
    title: 'Official Memorandum: Key Performance Milestone & Deliverable Expectations',
    content: `This official memorandum sets forth specific milestone expectations and operational deliverables discussed regarding your role.

Core Objectives & Focus Areas:
1. Complete designated high-priority tasks and sprint milestones on schedule.
2. Maintain prompt communication and daily work progress updates in the HRMS system.
3. Adhere to code quality, documentation guidelines, and peer collaboration standards.

Your manager will review progress against these benchmarks during the upcoming appraisal cycle. Please acknowledge receipt and alignment with these objectives.`
  }
];

export default function AdminMemoManagement({ employees: propEmployees = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [memos, setMemos] = useState([]);
  const [employees, setEmployees] = useState(propEmployees || []);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedTargetType, setSelectedTargetType] = useState('ALL');

  // Modals
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openRecipientsModal, setOpenRecipientsModal] = useState(false);
  const [activeMemo, setActiveMemo] = useState(null);

  // Form State for New Memo
  const [formData, setFormData] = useState({
    title: '',
    category: 'Official Directive',
    priority: 'Normal',
    target_type: 'INDIVIDUAL', // Default to 'INDIVIDUAL' for "admin set to staff"
    target_employee_id: '',
    target_employee_name: '',
    target_department: 'Engineering',
    content: '',
    effective_date: new Date().toISOString().split('T')[0],
    requires_acknowledgment: true,
    attachment_url: ''
  });

  // Sync propEmployees if passed from parent
  useEffect(() => {
    if (propEmployees && propEmployees.length > 0) {
      setEmployees(propEmployees);
    }
  }, [propEmployees]);

  // Automatically select first employee if not set
  useEffect(() => {
    if (employees.length > 0 && !formData.target_employee_id) {
      const first = employees.find(e => e.role !== 'admin') || employees[0];
      if (first) {
        setFormData(prev => ({
          ...prev,
          target_employee_id: first.id,
          target_employee_name: first.name
        }));
      }
    }
  }, [employees]);

  const fetchMemos = async () => {
    setLoading(true);
    try {
      const res = await memosAPI.getMemos();
      if (res.data?.success) {
        setMemos(res.data.memos || []);
      }
    } catch (err) {
      console.error('Failed to load memos:', err);
      toast.error('Failed to load official memos');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await adminAPI.getEmployees();
      const rawList = res.data?.employees || (Array.isArray(res.data) ? res.data : []);
      if (rawList && rawList.length > 0) {
        setEmployees(rawList);
      }
    } catch (err) {
      console.error('Failed to load employees for memo target:', err);
    }
  };

  useEffect(() => {
    fetchMemos();
    fetchEmployees();
  }, []);

  // Filtered Memos
  const filteredMemos = useMemo(() => {
    return memos.filter(m => {
      const matchesSearch =
        !searchTerm ||
        (m.title && m.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.memo_number && m.memo_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.target_employee_name && m.target_employee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.content && m.content.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === 'ALL' || m.category === selectedCategory;
      const matchesPri = selectedPriority === 'ALL' || m.priority === selectedPriority;
      const matchesTarget = selectedTargetType === 'ALL' || m.target_type === selectedTargetType;

      return matchesSearch && matchesCat && matchesPri && matchesTarget;
    });
  }, [memos, searchTerm, selectedCategory, selectedPriority, selectedTargetType]);

  // Statistics calculation
  const metrics = useMemo(() => {
    const totalMemos = memos.length;
    const individualMemos = memos.filter(m => m.target_type === 'INDIVIDUAL').length;
    const activeDirectives = memos.filter(m => m.status === 'Active').length;

    let totalRecipients = 0;
    let totalAcks = 0;
    memos.forEach(m => {
      totalRecipients += m.totalTargetCount || 0;
      totalAcks += m.acknowledgedCount || 0;
    });

    const complianceRate = totalRecipients > 0 ? Math.round((totalAcks / totalRecipients) * 100) : 100;

    return { totalMemos, individualMemos, activeDirectives, complianceRate, totalRecipients, totalAcks };
  }, [memos]);

  const handleApplyTemplate = (tmpl) => {
    setFormData(prev => ({
      ...prev,
      title: tmpl.title,
      category: tmpl.category,
      priority: tmpl.priority,
      content: tmpl.content
    }));
    toast.info(`Loaded template: "${tmpl.name}"`);
  };

  const handleCreateMemo = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a memo title');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Please enter memo content');
      return;
    }
    if (formData.target_type === 'INDIVIDUAL' && !formData.target_employee_id) {
      toast.error('Please select the target staff member');
      return;
    }
    if (formData.target_type === 'DEPARTMENT' && !formData.target_department) {
      toast.error('Please select target department');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.target_type === 'INDIVIDUAL') {
        const emp = employees.find(e => e.id === payload.target_employee_id);
        if (emp) {
          payload.target_employee_name = emp.name;
        }
      }

      const res = await memosAPI.createMemo(payload);
      if (res.data?.success) {
        toast.success(`Memo ${res.data.memo?.memo_number} issued and dispatched!`);
        setOpenCreateModal(false);
        // Reset form
        setFormData({
          title: '',
          category: 'Official Directive',
          priority: 'Normal',
          target_type: 'INDIVIDUAL',
          target_employee_id: employees.length > 0 ? employees[0].id : '',
          target_employee_name: employees.length > 0 ? employees[0].name : '',
          target_department: 'Engineering',
          content: '',
          effective_date: new Date().toISOString().split('T')[0],
          requires_acknowledgment: true,
          attachment_url: ''
        });
        fetchMemos();
      }
    } catch (err) {
      console.error('Failed to issue memo:', err);
      toast.error(err.response?.data?.error || 'Failed to issue memo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMemo = async (id, memoNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete Memo ${memoNumber}?`)) {
      return;
    }
    try {
      const res = await memosAPI.deleteMemo(id);
      if (res.data?.success) {
        toast.success(`Memo ${memoNumber} deleted`);
        fetchMemos();
      }
    } catch (err) {
      console.error('Failed to delete memo:', err);
      toast.error('Failed to delete memo');
    }
  };

  const handleSendReminder = async (memoId, memoNumber) => {
    try {
      const res = await memosAPI.remindMemo(memoId);
      if (res.data?.success) {
        toast.success(res.data.message || 'Reminder sent to pending recipients');
      }
    } catch (err) {
      console.error('Failed to send reminder:', err);
      toast.error(err.response?.data?.error || 'Failed to send reminder');
    }
  };

  const getPriorityChip = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <Chip size="small" label="URGENT" sx={{ bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 800, border: '1px solid #fecaca' }} />;
      case 'High':
        return <Chip size="small" label="HIGH" sx={{ bgcolor: '#fffbeb', color: '#b45309', fontWeight: 800, border: '1px solid #fde68a' }} />;
      default:
        return <Chip size="small" label="NORMAL" sx={{ bgcolor: '#f0fdf4', color: '#166534', fontWeight: 700, border: '1px solid #bbf7d0' }} />;
    }
  };

  const getTargetBadge = (memo) => {
    if (memo.target_type === 'INDIVIDUAL') {
      return (
        <Chip
          icon={<PersonIcon fontSize="small" sx={{ color: '#1d4ed8 !important' }} />}
          label={memo.target_employee_name ? `Staff: ${memo.target_employee_name}` : 'Individual Staff'}
          size="small"
          sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700, border: '1px solid #bfdbfe' }}
        />
      );
    }
    if (memo.target_type === 'DEPARTMENT') {
      return (
        <Chip
          icon={<DeptIcon fontSize="small" sx={{ color: '#7c3aed !important' }} />}
          label={`Dept: ${memo.target_department}`}
          size="small"
          sx={{ bgcolor: '#f5f3ff', color: '#6d28d9', fontWeight: 700, border: '1px solid #ddd6fe' }}
        />
      );
    }
    return (
      <Chip
        icon={<AllIcon fontSize="small" sx={{ color: '#047857 !important' }} />}
        label="All Workforce"
        size="small"
        sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 700, border: '1px solid #a7f3d0' }}
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: { xs: 2, md: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MemoIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: '#133829' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.15rem', sm: '1.45rem' } }}>
              Official Memorandums & Directives
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.4, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Issue binding corporate directives to specific staff, departments, or entire workforce
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth={isMobile}
          startIcon={<AddIcon />}
          onClick={() => {
            if (employees.length > 0 && !formData.target_employee_id) {
              setFormData(prev => ({
                ...prev,
                target_employee_id: employees[0].id,
                target_employee_name: employees[0].name
              }));
            }
            setOpenCreateModal(true);
          }}
          sx={{
            bgcolor: '#133829',
            color: '#fff',
            fontWeight: 800,
            px: 2.5,
            py: 1,
            borderRadius: '8px',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(19, 56, 41, 0.2)',
            '&:hover': { bgcolor: '#0b2319' }
          }}
        >
          Issue Official Memo
        </Button>
      </Box>

      {/* Metric Cards: 2x2 on mobile, 4 columns on desktop */}
      <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.2, sm: 2 } }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: { xs: 10, sm: 11 } }}>
                Total Memos
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', mt: 0.3, fontSize: { xs: '1.4rem', sm: '1.9rem' } }}>
                {metrics.totalMemos}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'block', mt: 0.3, fontSize: { xs: 10, sm: 11 } }}>
                Corporate record
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.2, sm: 2 } }}>
              <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase', fontSize: { xs: 10, sm: 11 } }}>
                Targeted to Staff
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#1d4ed8', mt: 0.3, fontSize: { xs: '1.4rem', sm: '1.9rem' } }}>
                {metrics.individualMemos}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 0.3, fontSize: { xs: 10, sm: 11 } }}>
                Direct 1-on-1 memos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.2, sm: 2 } }}>
              <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 700, textTransform: 'uppercase', fontSize: { xs: 10, sm: 11 } }}>
                Signature Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#15803d', mt: 0.3, fontSize: { xs: '1.4rem', sm: '1.9rem' } }}>
                {metrics.complianceRate}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 0.3, fontSize: { xs: 10, sm: 11 } }}>
                {metrics.totalAcks} of {metrics.totalRecipients} signed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.2, sm: 2 } }}>
              <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 700, textTransform: 'uppercase', fontSize: { xs: 10, sm: 11 } }}>
                Active Directives
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#133829', mt: 0.3, fontSize: { xs: '1.4rem', sm: '1.9rem' } }}>
                {metrics.activeDirectives}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 0.3, fontSize: { xs: 10, sm: 11 } }}>
                In force now
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', mb: { xs: 2, md: 3 }, p: { xs: 1.2, sm: 1.8 } }}>
        <Grid container spacing={1.2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search memo number, title, recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 19 }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={6} sm={3} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Target Scope"
              value={selectedTargetType}
              onChange={(e) => setSelectedTargetType(e.target.value)}
            >
              <MenuItem value="ALL">All Targets</MenuItem>
              <MenuItem value="INDIVIDUAL">Staff Only</MenuItem>
              <MenuItem value="DEPARTMENT">Department</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} sm={3} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="ALL">All Categories</MenuItem>
              {CATEGORIES.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={8} sm={3} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Priority"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <MenuItem value="ALL">All Priorities</MenuItem>
              <MenuItem value="Urgent">Urgent</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={4} sm={3} md={1} sx={{ textAlign: 'right' }}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              onClick={fetchMemos}
              sx={{ minHeight: 40, color: '#133829', borderColor: '#cbd5e1', fontWeight: 700, textTransform: 'none' }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Memos Table */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#133829' }} />
            <Typography variant="body2" sx={{ color: '#64748b', mt: 2 }}>
              Loading official memorandums...
            </Typography>
          </Box>
        ) : filteredMemos.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <ArticleIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
              No Memos Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 460, mx: 'auto', mt: 0.5 }}>
              No memorandums matched your search filters. Click "Issue Official Memo" above to distribute a new directive.
            </Typography>
          </Box>
        ) : isMobile ? (
          /* Mobile Memos Card View */
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredMemos.map((memo) => {
              const ackCount = memo.acknowledgedCount || 0;
              const totalCount = memo.totalTargetCount || (memo.target_type === 'INDIVIDUAL' ? 1 : employees.length);
              const pct = totalCount > 0 ? Math.round((ackCount / totalCount) * 100) : 0;
              const isFullyAcked = ackCount >= totalCount && totalCount > 0;

              return (
                <Card key={memo.id} sx={{ p: 1.8, border: '1px solid #e2e8f0', borderRadius: '10px', bgcolor: '#ffffff' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#133829', bgcolor: '#f0fdf4', px: 0.8, py: 0.2, borderRadius: '4px', border: '1px solid #bbf7d0', display: 'inline-block' }}>
                        {memo.memo_number}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.4 }}>
                        Issued: {memo.issued_date}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {getPriorityChip(memo.priority)}
                    </Box>
                  </Box>

                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5, lineHeight: 1.3 }}>
                    {memo.title}
                  </Typography>

                  <Box sx={{ mb: 1.2 }}>
                    {getTargetBadge(memo)}
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      color: '#475569',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1.5,
                      lineHeight: 1.5
                    }}
                  >
                    {memo.content}
                  </Typography>

                  {memo.requires_acknowledgment && (
                    <Box sx={{ mb: 1.5, p: 1, bgcolor: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: isFullyAcked ? '#15803d' : '#b45309' }}>
                          {ackCount} / {totalCount} Signed
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                          {pct}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 5,
                          borderRadius: 3,
                          bgcolor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: isFullyAcked ? '#15803d' : pct > 0 ? '#3b82f6' : '#cbd5e1'
                          }
                        }}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
                        onClick={() => {
                          setActiveMemo(memo);
                          setOpenViewModal(true);
                        }}
                        sx={{ fontSize: 11, fontWeight: 700, borderColor: '#cbd5e1', color: '#133829', py: 0.3, px: 1, textTransform: 'none' }}
                      >
                        Letterhead
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setActiveMemo(memo);
                          setOpenRecipientsModal(true);
                        }}
                        sx={{ fontSize: 11, fontWeight: 700, borderColor: '#bfdbfe', color: '#1d4ed8', py: 0.3, px: 1, textTransform: 'none' }}
                      >
                        Status ({ackCount}/{totalCount})
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {memo.requires_acknowledgment && !isFullyAcked && (
                        <IconButton
                          size="small"
                          onClick={() => handleSendReminder(memo.id, memo.memo_number)}
                          sx={{ color: '#d97706', p: 0.5 }}
                          title="Remind pending"
                        >
                          <RemindIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMemo(memo.id, memo.memo_number)}
                        sx={{ color: '#ef4444', p: 0.5 }}
                        title="Delete memo"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>
        ) : (
          /* Desktop Table View */
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: 12 }}>MEMO REF & DATE</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: 12 }}>TITLE & DIRECTIVE</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: 12 }}>TARGET RECIPIENT</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: 12 }}>CATEGORY / PRIORITY</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: 12 }}>SIGNATURE TRACKING</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: 12, textAlign: 'right' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMemos.map((memo) => {
                  const ackCount = memo.acknowledgedCount || 0;
                  const totalCount = memo.totalTargetCount || (memo.target_type === 'INDIVIDUAL' ? 1 : employees.length);
                  const pct = totalCount > 0 ? Math.round((ackCount / totalCount) * 100) : 0;
                  const isFullyAcked = ackCount >= totalCount && totalCount > 0;

                  return (
                    <TableRow key={memo.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                          {memo.memo_number}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Issued: {memo.issued_date}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {memo.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#64748b',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {memo.content}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {getTargetBadge(memo)}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                          <Chip
                            size="small"
                            label={memo.category}
                            sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 600, fontSize: 11 }}
                          />
                          {getPriorityChip(memo.priority)}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ minWidth: 160 }}>
                        {memo.requires_acknowledgment ? (
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: isFullyAcked ? '#15803d' : '#b45309' }}>
                                {ackCount} / {totalCount} Signed
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                                {pct}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#e2e8f0',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: isFullyAcked ? '#15803d' : pct > 0 ? '#3b82f6' : '#cbd5e1'
                                }
                              }}
                            />
                            <Button
                              size="small"
                              onClick={() => {
                                setActiveMemo(memo);
                                setOpenRecipientsModal(true);
                              }}
                              sx={{ fontSize: 11, p: 0, mt: 0.5, textTransform: 'none', color: '#133829', fontWeight: 700 }}
                            >
                              View Recipients Status →
                            </Button>
                          </Box>
                        ) : (
                          <Chip size="small" label="No Signature Req." sx={{ bgcolor: '#f8fafc', color: '#64748b' }} />
                        )}
                      </TableCell>

                      <TableCell sx={{ textAlign: 'right' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="View Official Letterhead & Print">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setActiveMemo(memo);
                                setOpenViewModal(true);
                              }}
                              sx={{ color: '#133829' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {memo.requires_acknowledgment && !isFullyAcked && (
                            <Tooltip title="Send Reminder to Pending Staff">
                              <IconButton
                                size="small"
                                onClick={() => handleSendReminder(memo.id, memo.memo_number)}
                                sx={{ color: '#d97706' }}
                              >
                                <RemindIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Delete Memo">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteMemo(memo.id, memo.memo_number)}
                              sx={{ color: '#ef4444' }}
                            >
                              <DeleteIcon fontSize="small" />
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

      {/* ---------------- MODAL 1: ISSUE OFFICIAL MEMO ---------------- */}
      <Dialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '14px',
            m: isMobile ? 0 : 2,
            height: isMobile ? '100%' : 'auto',
            maxHeight: isMobile ? '100%' : '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: { xs: 1.5, sm: 2 }, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MemoIcon sx={{ color: '#133829', fontSize: { xs: 22, sm: 26 } }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
              Issue Executive Memorandum
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenCreateModal(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleCreateMemo} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2.5 }, flex: 1, overflowY: 'auto' }}>
            {/* Quick Template Picker: Dropdown on Mobile, Chips on Desktop */}
            <Box sx={{ mb: 2, p: 1.2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              {isMobile ? (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Load Quick Executive Template..."
                  value=""
                  onChange={(e) => {
                    const tmpl = QUICK_TEMPLATES.find(t => t.name === e.target.value);
                    if (tmpl) handleApplyTemplate(tmpl);
                  }}
                  sx={{ bgcolor: '#ffffff' }}
                >
                  <MenuItem value="" disabled>-- Select a pre-written template --</MenuItem>
                  {QUICK_TEMPLATES.map(tmpl => (
                    <MenuItem key={tmpl.name} value={tmpl.name}>{tmpl.name}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TemplateIcon fontSize="small" sx={{ color: '#133829' }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                      Load Executive Template:
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {QUICK_TEMPLATES.map(tmpl => (
                      <Chip
                        key={tmpl.name}
                        label={tmpl.name}
                        clickable
                        size="small"
                        onClick={() => handleApplyTemplate(tmpl)}
                        sx={{ bgcolor: '#ffffff', border: '1px solid #cbd5e1', fontWeight: 600, '&:hover': { bgcolor: '#e2e8f0' } }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>

            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              {/* Target Audience Scope */}
              <Grid item xs={12}>
                <FormControl component="fieldset" fullWidth sx={{ p: { xs: 1.2, sm: 1.8 }, bgcolor: '#f0fdf4', borderRadius: '10px', border: '1.5px solid #bbf7d0' }}>
                  <FormLabel component="legend" sx={{ fontWeight: 800, color: '#166534', fontSize: { xs: 11, sm: 12 }, mb: 0.5 }}>
                    🎯 TARGET AUDIENCE SCOPE ("ADMIN SET TO STAFF")
                  </FormLabel>
                  <RadioGroup
                    row={!isMobile}
                    value={formData.target_type}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                    sx={{ gap: { xs: 0.5, sm: 1 } }}
                  >
                    <FormControlLabel
                      value="INDIVIDUAL"
                      control={<Radio size="small" sx={{ color: '#166534', '&.Mui-checked': { color: '#133829' } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: 13, sm: 14 } }}>Specific Staff Member(s)</Typography>}
                    />
                    <FormControlLabel
                      value="DEPARTMENT"
                      control={<Radio size="small" sx={{ color: '#166534', '&.Mui-checked': { color: '#133829' } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: 13, sm: 14 } }}>Specific Department</Typography>}
                    />
                    <FormControlLabel
                      value="ALL"
                      control={<Radio size="small" sx={{ color: '#166534', '&.Mui-checked': { color: '#133829' } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: 13, sm: 14 } }}>Entire Workforce (All Staff)</Typography>}
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Conditional Target Picker */}
              {formData.target_type === 'INDIVIDUAL' && (
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Select Target Employee"
                    value={formData.target_employee_id || ''}
                    onChange={(e) => {
                      const empId = e.target.value;
                      const emp = employees.find(x => x.id === empId);
                      setFormData({
                        ...formData,
                        target_employee_id: empId,
                        target_employee_name: emp ? emp.name : ''
                      });
                    }}
                    helperText={employees.length === 0 ? "Loading employee list from server..." : "This memo will be issued directly and exclusively to this staff member"}
                  >
                    {employees.length === 0 ? (
                      <MenuItem disabled value="">
                        <em>Loading employees...</em>
                      </MenuItem>
                    ) : (
                      employees.map(emp => (
                        <MenuItem key={emp.id} value={emp.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: '#133829' }}>
                              {emp.name ? emp.name.charAt(0) : 'E'}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {emp.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              ({emp.department || 'General'} • {emp.designation || 'Staff'})
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                </Grid>
              )}

              {formData.target_type === 'DEPARTMENT' && (
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Select Target Department"
                    value={formData.target_department}
                    onChange={(e) => setFormData({ ...formData, target_department: e.target.value })}
                    helperText="Every employee in this department will receive and be required to sign this memo"
                  >
                    {DEPARTMENTS.map(d => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

              {/* Category & Priority */}
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Priority Level"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Urgent">Urgent</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="Effective Date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Memorandum Subject / Title"
                  placeholder="e.g. Official Directive on Daily Sprint Checkpoints & Code Quality"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>

              {/* Content */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={isMobile ? 5 : 7}
                  label="Memorandum Directive & Detailed Text"
                  placeholder="Draft the official contents, clauses, guidelines, and binding instructions..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </Grid>

              {/* Optional Attachment */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Reference URL or Document Link (Optional)"
                  placeholder="https://drive.google.com/... or company document link"
                  value={formData.attachment_url}
                  onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                />
              </Grid>

              {/* Require Acknowledgment Checkbox */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requires_acknowledgment}
                      onChange={(e) => setFormData({ ...formData, requires_acknowledgment: e.target.checked })}
                      sx={{ color: '#133829', '&.Mui-checked': { color: '#133829' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: 13, sm: 14 } }}>
                        Mandate Digital Signature & Acknowledgment
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Target staff must confirm understanding of this memorandum
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={() => setOpenCreateModal(false)}
              sx={{ color: '#64748b', fontWeight: 600, px: { xs: 1.5, sm: 2.5 } }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              sx={{
                bgcolor: '#133829',
                color: '#fff',
                fontWeight: 700,
                borderRadius: '8px',
                px: { xs: 2, sm: 3 },
                '&:hover': { bgcolor: '#0b2319' }
              }}
            >
              {submitting ? 'Issuing...' : 'Issue & Notify Staff'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ---------------- MODAL 2: OFFICIAL LETTERHEAD DOCUMENT PREVIEW & PRINT ---------------- */}
      <Dialog
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '12px',
            m: isMobile ? 0 : 2
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
            Official Letterhead View
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 700, borderColor: '#cbd5e1', color: '#0f172a', px: { xs: 1, sm: 2 }, fontSize: { xs: 12, sm: 13 } }}
            >
              {isMobile ? 'Print' : 'Print / PDF'}
            </Button>
            <IconButton onClick={() => setOpenViewModal(false)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 1.2, sm: 2.5, md: 4 } }}>
          {activeMemo && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2.5, md: 4 },
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                bgcolor: '#ffffff',
                fontFamily: 'Georgia, serif'
              }}
            >
              {/* Letterhead Header */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-start' }, gap: 1.5, borderBottom: '2px solid #133829', pb: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    component="img"
                    src="/logo.png"
                    alt="Shazu Soft"
                    sx={{ width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 }, objectFit: 'contain' }}
                  />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#133829', letterSpacing: '0.05em', fontFamily: 'sans-serif', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      SHAZUSOFT TECHNOLOGIES
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontFamily: 'sans-serif', display: 'block', fontSize: { xs: 10, sm: 12 } }}>
                      HUMAN RESOURCES & EXECUTIVE OPERATIONS • ISO-27001 COMPLIANT
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, fontFamily: 'sans-serif' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#133829', display: 'block' }}>
                    MEMO REF: {activeMemo.memo_number}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    DATE: {activeMemo.issued_date}
                  </Typography>
                </Box>
              </Box>

              {/* Title Banner */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '0.08em', color: '#0f172a', fontFamily: 'sans-serif', textTransform: 'uppercase', fontSize: { xs: '0.95rem', sm: '1.2rem' } }}>
                  OFFICIAL EXECUTIVE MEMORANDUM
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'sans-serif' }}>
                  Category: {activeMemo.category} | Priority: {activeMemo.priority}
                </Typography>
              </Box>

              {/* Metadata Grid */}
              <Box sx={{ bgcolor: '#f8fafc', p: { xs: 1.5, sm: 2 }, borderRadius: '6px', border: '1px solid #e2e8f0', mb: 3, fontFamily: 'sans-serif' }}>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                      TO:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {activeMemo.target_type === 'INDIVIDUAL'
                        ? activeMemo.target_employee_name || activeMemo.target_employee_id
                        : activeMemo.target_type === 'DEPARTMENT'
                        ? `${activeMemo.target_department} Department`
                        : 'All Employees & Staff Members'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                      FROM:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {activeMemo.issued_by_name || 'Executive HR Administration'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                      EFFECTIVE DATE:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {activeMemo.effective_date || activeMemo.issued_date}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                      SUBJECT:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#133829' }}>
                      {activeMemo.title}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Body Content */}
              <Box sx={{ mb: 4, lineHeight: 1.8, fontSize: { xs: '0.9rem', sm: '0.98rem' }, color: '#1e293b', whiteSpace: 'pre-line' }}>
                {activeMemo.content}
              </Box>

              {activeMemo.attachment_url && (
                <Box sx={{ mb: 3, p: 1.5, bgcolor: '#f1f5f9', borderRadius: '6px', fontFamily: 'sans-serif' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                    Reference Attachment:
                  </Typography>{' '}
                  <a href={activeMemo.attachment_url} target="_blank" rel="noreferrer" style={{ color: '#133829', fontWeight: 700, wordBreak: 'break-all' }}>
                    {activeMemo.attachment_url}
                  </a>
                </Box>
              )}

              {/* Signature Block & Stamp */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 2, pt: 3, borderTop: '1px solid #e2e8f0', fontFamily: 'sans-serif' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    Issued by Authority:
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#133829' }}>
                    {activeMemo.issued_by_name || 'HR Management Directorate'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    Shazusoft Technologies Pvt. Ltd.
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', p: 1.5, border: '2px dashed #133829', borderRadius: '8px', color: '#133829', alignSelf: { xs: 'flex-start', sm: 'flex-end' } }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', letterSpacing: '0.08em' }}>
                    ★ OFFICIAL SEAL ★
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, display: 'block' }}>
                    VALIDATED SYSTEM DIRECTIVE
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------------- MODAL 3: RECIPIENT SIGNATURE STATUS TRACKER ---------------- */}
      <Dialog
        open={openRecipientsModal}
        onClose={() => setOpenRecipientsModal(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '12px',
            m: isMobile ? 0 : 2
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid #e2e8f0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
              Recipient Signature Tracking
            </Typography>
            {activeMemo && (
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                {activeMemo.memo_number} — {activeMemo.title}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => setOpenRecipientsModal(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {activeMemo && (
            <Box>
              {/* Summary Bar */}
              <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: 13, sm: 14 } }}>
                    Compliance: {activeMemo.acknowledgedCount || 0} of {activeMemo.recipientStatus?.length || activeMemo.totalTargetCount || 0} Staff Signed
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RemindIcon />}
                  onClick={() => handleSendReminder(activeMemo.id, activeMemo.memo_number)}
                  sx={{ color: '#d97706', borderColor: '#fcd34d', fontWeight: 700, fontSize: { xs: 11, sm: 13 } }}
                >
                  Send Reminder
                </Button>
              </Box>

              {/* Recipients Display: Clean Cards on Mobile, Table on Desktop */}
              {isMobile ? (
                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {(activeMemo.recipientStatus || []).map((rec) => (
                    <Card key={rec.employee_id} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            {rec.employee_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {rec.department || 'General'} • ID: {rec.employee_id}
                          </Typography>
                        </Box>
                        {rec.acknowledged ? (
                          <Chip
                            icon={<SignedIcon fontSize="small" sx={{ color: '#15803d !important' }} />}
                            label="Signed"
                            size="small"
                            sx={{ bgcolor: '#f0fdf4', color: '#166534', fontWeight: 800, border: '1px solid #bbf7d0' }}
                          />
                        ) : (
                          <Chip
                            icon={<PendingIcon fontSize="small" sx={{ color: '#b45309 !important' }} />}
                            label="Pending"
                            size="small"
                            sx={{ bgcolor: '#fffbeb', color: '#b45309', fontWeight: 700, border: '1px solid #fde68a' }}
                          />
                        )}
                      </Box>
                      {rec.acknowledged_at && (
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                          Acknowledged: {new Date(rec.acknowledged_at).toLocaleString()}
                        </Typography>
                      )}
                      {rec.remarks && (
                        <Box sx={{ mt: 0.8, p: 0.8, bgcolor: '#f8fafc', borderRadius: '4px', borderLeft: '3px solid #133829' }}>
                          <Typography variant="caption" sx={{ color: '#334155', fontStyle: 'italic', display: 'block' }}>
                            "{rec.remarks}"
                          </Typography>
                        </Box>
                      )}
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>EMPLOYEE</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>DEPARTMENT</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>STATUS</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>ACKNOWLEDGED AT</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>STAFF REMARKS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(activeMemo.recipientStatus || []).map((rec) => (
                        <TableRow key={rec.employee_id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                              {rec.employee_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              ID: {rec.employee_id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {rec.department || 'General'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {rec.acknowledged ? (
                              <Chip
                                icon={<SignedIcon fontSize="small" sx={{ color: '#15803d !important' }} />}
                                label="Signed"
                                size="small"
                                sx={{ bgcolor: '#f0fdf4', color: '#166534', fontWeight: 800, border: '1px solid #bbf7d0' }}
                              />
                            ) : (
                              <Chip
                                icon={<PendingIcon fontSize="small" sx={{ color: '#b45309 !important' }} />}
                                label="Pending"
                                size="small"
                                sx={{ bgcolor: '#fffbeb', color: '#b45309', fontWeight: 700, border: '1px solid #fde68a' }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                              {rec.acknowledged_at ? new Date(rec.acknowledged_at).toLocaleString() : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ color: '#475569', fontStyle: rec.remarks ? 'normal' : 'italic' }}>
                              {rec.remarks || 'None'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
