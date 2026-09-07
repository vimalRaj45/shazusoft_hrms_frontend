import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Badge,
  Divider,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Campaign as MemoIcon,
  Search as SearchIcon,
  CheckCircle as SignedIcon,
  HourglassEmpty as PendingIcon,
  Print as PrintIcon,
  Close as CloseIcon,
  Create as SignIcon,
  Article as ArticleIcon,
  Person as PersonIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { memosAPI } from '../services/api';
import toast from '../utils/muiToast';

export default function StaffMemosViewer({ user }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'SIGNED'
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Memo Dialog
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [signing, setSigning] = useState(false);
  const [userRemarks, setUserRemarks] = useState('');

  const fetchMemos = async () => {
    setLoading(true);
    try {
      const res = await memosAPI.getMemos();
      if (res.data?.success) {
        setMemos(res.data.memos || []);
      }
    } catch (err) {
      console.error('Failed to load memos:', err);
      toast.error('Failed to fetch memorandums');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, []);

  const pendingCount = useMemo(() => {
    return memos.filter(m => m.requires_acknowledgment && !m.acknowledged).length;
  }, [memos]);

  const signedCount = useMemo(() => {
    return memos.filter(m => m.acknowledged).length;
  }, [memos]);

  const filteredMemos = useMemo(() => {
    return memos.filter(m => {
      const matchesSearch =
        !searchTerm ||
        (m.title && m.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.memo_number && m.memo_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.content && m.content.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesTab = true;
      if (activeTab === 'PENDING') {
        matchesTab = m.requires_acknowledgment && !m.acknowledged;
      } else if (activeTab === 'SIGNED') {
        matchesTab = !!m.acknowledged;
      }

      return matchesSearch && matchesTab;
    });
  }, [memos, searchTerm, activeTab]);

  const handleOpenMemo = (memo) => {
    setSelectedMemo(memo);
    setUserRemarks('');
    setOpenDialog(true);
  };

  const handleAcknowledge = async () => {
    if (!selectedMemo) return;
    setSigning(true);
    try {
      const res = await memosAPI.acknowledgeMemo(selectedMemo.id, { remarks: userRemarks });
      if (res.data?.success) {
        toast.success('Memorandum digitally signed and acknowledged successfully!');
        setOpenDialog(false);
        fetchMemos();
      }
    } catch (err) {
      console.error('Failed to acknowledge memo:', err);
      toast.error(err.response?.data?.error || 'Failed to acknowledge memo');
    } finally {
      setSigning(false);
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

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <MemoIcon sx={{ fontSize: 32, color: '#133829' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Official Corporate Memorandums
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Executive directives, corporate policies, and official notices issued to you by Management
          </Typography>
        </Box>

        {pendingCount > 0 && (
          <Alert
            severity="warning"
            icon={<PendingIcon fontSize="inherit" />}
            sx={{ borderRadius: '10px', fontWeight: 700, bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
          >
            Action Required: You have {pendingCount} memorandum{pendingCount === 1 ? '' : 's'} awaiting your digital signature
          </Alert>
        )}
      </Box>

      {/* Tabs and Search Bar */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', mb: 3, p: 1.5 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: 'none',
                  minHeight: 40,
                  py: 1
                },
                '& .Mui-selected': {
                  color: '#133829 !important'
                },
                '& .MuiTabs-indicator': {
                  bgcolor: '#133829'
                }
              }}
            >
              <Tab value="ALL" label={`All Memorandums (${memos.length})`} />
              <Tab
                value="PENDING"
                label={
                  <Badge badgeContent={pendingCount} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }}>
                    <Box sx={{ pr: pendingCount > 0 ? 1.5 : 0 }}>Pending Signature</Box>
                  </Badge>
                }
              />
              <Tab value="SIGNED" label={`Signed (${signedCount})`} />
            </Tabs>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search memorandums by ref number, title, content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Memos List */}
      {loading ? (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#133829' }} />
          <Typography variant="body2" sx={{ color: '#64748b', mt: 2 }}>
            Loading your memorandums...
          </Typography>
        </Box>
      ) : filteredMemos.length === 0 ? (
        <Card sx={{ border: '1.5px dashed #cbd5e1', borderRadius: '12px', p: 6, textAlign: 'center', bgcolor: '#ffffff' }}>
          <ArticleIcon sx={{ fontSize: 52, color: '#cbd5e1', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#334155' }}>
            No Memorandums Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 460, mx: 'auto', mt: 0.5 }}>
            {activeTab === 'PENDING'
              ? 'Great! You have no pending memorandums requiring your signature.'
              : 'There are currently no memorandums issued under this filter.'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredMemos.map((memo) => {
            const isSigned = memo.acknowledged;
            const requiresAck = memo.requires_acknowledgment;

            return (
              <Grid item xs={12} md={6} key={memo.id}>
                <Card
                  sx={{
                    border: '1px solid',
                    borderColor: !isSigned && requiresAck ? '#fcd34d' : '#e2e8f0',
                    borderRadius: '12px',
                    bgcolor: '#ffffff',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      borderColor: '#133829'
                    }
                  }}
                >
                  {/* Pending Accent Indicator */}
                  {!isSigned && requiresAck && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        bgcolor: '#f59e0b'
                      }}
                    />
                  )}

                  <CardContent sx={{ p: 2.5 }}>
                    {/* Top Meta Bar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#133829',
                            bgcolor: '#f0fdf4',
                            px: 1,
                            py: 0.3,
                            borderRadius: '4px',
                            border: '1px solid #bbf7d0'
                          }}
                        >
                          {memo.memo_number}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {memo.issued_date}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.8 }}>
                        <Chip size="small" label={memo.category} sx={{ bgcolor: '#f1f5f9', fontWeight: 600, fontSize: 11 }} />
                        {getPriorityChip(memo.priority)}
                      </Box>
                    </Box>

                    {/* Memo Title */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, lineHeight: 1.3 }}>
                      {memo.title}
                    </Typography>

                    {/* Target Scope Badge */}
                    <Box sx={{ mb: 1.5 }}>
                      <Chip
                        size="small"
                        icon={<PersonIcon fontSize="small" />}
                        label={
                          memo.target_type === 'INDIVIDUAL'
                            ? 'Issued Directly to You'
                            : memo.target_type === 'DEPARTMENT'
                            ? `Issued to ${memo.target_department} Dept`
                            : 'All Personnel Directive'
                        }
                        sx={{
                          bgcolor: memo.target_type === 'INDIVIDUAL' ? '#eff6ff' : '#f8fafc',
                          color: memo.target_type === 'INDIVIDUAL' ? '#1d4ed8' : '#475569',
                          fontWeight: 700,
                          fontSize: 11
                        }}
                      />
                    </Box>

                    {/* Content Excerpt */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#475569',
                        mb: 2,
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {memo.content}
                    </Typography>

                    <Divider sx={{ my: 1.5, borderColor: '#f1f5f9' }} />

                    {/* Status & Action */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        {requiresAck ? (
                          isSigned ? (
                            <Chip
                              icon={<SignedIcon fontSize="small" sx={{ color: '#15803d !important' }} />}
                              label={`Signed: ${memo.acknowledged_at ? new Date(memo.acknowledged_at).toLocaleDateString() : 'Confirmed'}`}
                              size="small"
                              sx={{ bgcolor: '#f0fdf4', color: '#166534', fontWeight: 800, border: '1px solid #bbf7d0' }}
                            />
                          ) : (
                            <Chip
                              icon={<PendingIcon fontSize="small" sx={{ color: '#b45309 !important' }} />}
                              label="Signature Required"
                              size="small"
                              sx={{ bgcolor: '#fffbeb', color: '#b45309', fontWeight: 800, border: '1px solid #fde68a' }}
                            />
                          )
                        ) : (
                          <Chip size="small" label="For Information Only" sx={{ bgcolor: '#f8fafc', color: '#64748b' }} />
                        )}
                      </Box>

                      <Button
                        variant={!isSigned && requiresAck ? 'contained' : 'outlined'}
                        size="small"
                        startIcon={!isSigned && requiresAck ? <SignIcon /> : <ArticleIcon />}
                        onClick={() => handleOpenMemo(memo)}
                        sx={{
                          bgcolor: !isSigned && requiresAck ? '#133829' : 'transparent',
                          color: !isSigned && requiresAck ? '#ffffff' : '#133829',
                          borderColor: '#133829',
                          fontWeight: 700,
                          borderRadius: '8px',
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: !isSigned && requiresAck ? '#0b2319' : 'rgba(19, 56, 41, 0.05)',
                            borderColor: '#133829'
                          }
                        }}
                      >
                        {!isSigned && requiresAck ? 'Review & Sign' : 'View Document'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ---------------- EXECUTIVE LETTERHEAD & SIGNATURE MODAL ---------------- */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
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
            Official Executive Memorandum
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 700, borderColor: '#cbd5e1', color: '#0f172a', px: { xs: 1, sm: 2 }, fontSize: { xs: 12, sm: 13 } }}
            >
              {isMobile ? 'Print' : 'Print / Save'}
            </Button>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 1.2, sm: 2.5, md: 4 } }}>
          {selectedMemo && (
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
              {/* Header Letterhead */}
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
                      EXECUTIVE HUMAN RESOURCES & COMPLIANCE DIRECTIVE
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right', fontFamily: 'sans-serif' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#133829', display: 'block' }}>
                    REF NO: {selectedMemo.memo_number}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    DATE: {selectedMemo.issued_date}
                  </Typography>
                </Box>
              </Box>

              {/* Title */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '0.1em', color: '#0f172a', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
                  EXECUTIVE MEMORANDUM
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'sans-serif' }}>
                  Classification: {selectedMemo.category} | Priority: {selectedMemo.priority}
                </Typography>
              </Box>

              {/* Meta Box */}
              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '6px', border: '1px solid #e2e8f0', mb: 3, fontFamily: 'sans-serif' }}>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                      TO:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {selectedMemo.target_type === 'INDIVIDUAL'
                        ? selectedMemo.target_employee_name || user?.name
                        : selectedMemo.target_type === 'DEPARTMENT'
                        ? `${selectedMemo.target_department} Department`
                        : 'All Staff Members'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                      FROM:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {selectedMemo.issued_by_name || 'Executive Directorate'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                      EFFECTIVE DATE:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {selectedMemo.effective_date || selectedMemo.issued_date}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                      SUBJECT:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#133829' }}>
                      {selectedMemo.title}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Body Content */}
              <Box sx={{ mb: 4, lineHeight: 1.8, fontSize: '0.98rem', color: '#1e293b', whiteSpace: 'pre-line' }}>
                {selectedMemo.content}
              </Box>

              {selectedMemo.attachment_url && (
                <Box sx={{ mb: 3, p: 1.5, bgcolor: '#f1f5f9', borderRadius: '6px', fontFamily: 'sans-serif' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                    Reference Document Link:
                  </Typography>{' '}
                  <a href={selectedMemo.attachment_url} target="_blank" rel="noreferrer" style={{ color: '#133829', fontWeight: 700 }}>
                    {selectedMemo.attachment_url}
                  </a>
                </Box>
              )}

              {/* Digital Acknowledgment Section */}
              {selectedMemo.requires_acknowledgment && (
                <Box sx={{ mt: 4, p: 2.5, bgcolor: selectedMemo.acknowledged ? '#f0fdf4' : '#fffbeb', borderRadius: '8px', border: '1.5px solid', borderColor: selectedMemo.acknowledged ? '#bbf7d0' : '#fde68a', fontFamily: 'sans-serif' }}>
                  {selectedMemo.acknowledged ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SignedIcon sx={{ color: '#15803d' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534' }}>
                          Memorandum Digitally Signed & Acknowledged
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#166534', display: 'block' }}>
                        Confirmed by: <strong>{user?.name}</strong> on{' '}
                        {new Date(selectedMemo.acknowledged_at).toLocaleString()}
                      </Typography>
                      {selectedMemo.userRemarks && (
                        <Typography variant="caption" sx={{ color: '#166534', display: 'block', mt: 0.5 }}>
                          Your Remarks: "{selectedMemo.userRemarks}"
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SecurityIcon sx={{ color: '#b45309' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400e' }}>
                          Formal Digital Acknowledgment Required
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#78350f', mb: 2, fontSize: 13 }}>
                        By clicking <strong>"Sign & Acknowledge Memorandum"</strong> below, you legally confirm that you have read, comprehended, and agree to adhere strictly to all directives and stipulations documented herein.
                      </Typography>

                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Optional remarks or notes regarding acknowledgment..."
                        value={userRemarks}
                        onChange={(e) => setUserRemarks(e.target.value)}
                        sx={{ bgcolor: '#ffffff', mb: 2 }}
                      />

                      <Button
                        variant="contained"
                        disabled={signing}
                        startIcon={signing ? <CircularProgress size={16} color="inherit" /> : <SignIcon />}
                        onClick={handleAcknowledge}
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          bgcolor: '#133829',
                          color: '#ffffff',
                          fontWeight: 800,
                          borderRadius: '8px',
                          px: 3,
                          py: 1,
                          '&:hover': { bgcolor: '#0b2319' }
                        }}
                      >
                        {signing ? 'Recording Signature...' : 'Sign & Acknowledge Memorandum'}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#64748b', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
