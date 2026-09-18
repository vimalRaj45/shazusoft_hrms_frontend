import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Paper,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
  Badge,
  Alert,
  Menu,
  MenuItem,
  LinearProgress
} from '@mui/material';
import {
  Terminal as TerminalIcon,
  Security as SecurityIcon,
  VpnKey as KeyIcon,
  Storage as DbIcon,
  HistoryEdu as AuditIcon,
  Speed as TelemetryIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restore as RollbackIcon,
  Download as ExportIcon,
  Search as SearchIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  CheckCircle as SuccessIcon,
  ErrorOutline as ErrorIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  CleaningServices as CleanIcon,
  Tune as OverrideIcon,
  ArrowBack as BackIcon,
  CompareArrows as DiffIcon,
  Code as JsonIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import kernelAPI from '../services/kernelApi';
import toast from '../utils/muiToast';

export default function KernelAdminPortal({ onExitToApp }) {
  // ─── AUTHENTICATION STATE ───
  const [token, setToken] = useState(() => localStorage.getItem('shazusoft_kernel_token'));
  const [kernelUser, setKernelUser] = useState(() => {
    try {
      const saved = localStorage.getItem('shazusoft_kernel_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Login Form States
  const [loginMode, setLoginMode] = useState('masterKey'); // 'masterKey' | 'credentials'
  const [masterKey, setMasterKey] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // ─── CONSOLE NAVIGATION & DATA STATES ───
  const [activeTab, setActiveTab] = useState(0); // 0: Table Explorer, 1: Audit Ledger, 2: Diagnostics
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('Employees');
  const [tableData, setTableData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [tableTotal, setTableTotal] = useState(0);
  const [tablePage, setTablePage] = useState(0);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(25);
  const [tableSearch, setTableSearch] = useState('');
  const [tableLoading, setTableLoading] = useState(false);

  // ─── AUDIT LEDGER STATES ───
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(0);
  const [auditRowsPerPage, setAuditRowsPerPage] = useState(25);
  const [auditFilterTable, setAuditFilterTable] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedDiffLog, setSelectedDiffLog] = useState(null);

  // ─── CRUD MODALS ───
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT' | 'VIEW'
  const [currentRecord, setCurrentRecord] = useState({});
  const [originalRecord, setOriginalRecord] = useState({});
  const [operatorReason, setOperatorReason] = useState('');
  const [crudSubmitting, setCrudSubmitting] = useState(false);

  // Delete Dialog
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Rollback Dialog
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [logToRollback, setLogToRollback] = useState(null);
  const [rollbackReason, setRollbackReason] = useState('');

  // Diagnostics State
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagLoading, setDiagLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────
  //  SESSION VALIDATION
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      kernelAPI.getMe()
        .then(res => {
          setKernelUser(res.data.user);
          localStorage.setItem('shazusoft_kernel_user', JSON.stringify(res.data.user));
          fetchTablesList();
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, [token]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const payload = loginMode === 'masterKey'
        ? { masterKey }
        : { email: adminEmail, password: adminPassword, passcode: masterKey };

      const res = await kernelAPI.login(payload);
      const { token: jwtToken, user } = res.data;

      localStorage.setItem('shazusoft_kernel_token', jwtToken);
      localStorage.setItem('shazusoft_kernel_user', JSON.stringify(user));
      setToken(jwtToken);
      setKernelUser(user);
      toast.success(res.data.message || 'Kernel Root Console Authorized');
      fetchTablesList();
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
      toast.error('Kernel Access Denied');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    kernelAPI.logout();
    setToken(null);
    setKernelUser(null);
    toast.info('Kernel Session Terminated');
  };

  // ─────────────────────────────────────────────────────────────
  //  DATA FETCHING
  // ─────────────────────────────────────────────────────────────
  const fetchTablesList = async () => {
    try {
      const res = await kernelAPI.getTables();
      if (res.data?.tables) {
        setTables(res.data.tables);
        if (!selectedTable && res.data.tables.length > 0) {
          setSelectedTable(res.data.tables[0].modelName);
        }
      }
    } catch (err) {
      console.error('Failed to load tables list:', err);
    }
  };

  const fetchTableData = async () => {
    if (!token || !selectedTable) return;
    setTableLoading(true);
    try {
      const res = await kernelAPI.getTableData(selectedTable, {
        page: tablePage + 1,
        limit: tableRowsPerPage,
        search: tableSearch
      });
      setTableData(res.data.data || []);
      setTableColumns(res.data.columns || []);
      setTableTotal(res.data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to read table ${selectedTable}`);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (token && selectedTable && activeTab === 0) {
      fetchTableData();
    }
  }, [token, selectedTable, tablePage, tableRowsPerPage, activeTab]);

  const fetchAuditLogs = async () => {
    if (!token) return;
    setAuditLoading(true);
    try {
      const res = await kernelAPI.getAuditLogs({
        limit: auditRowsPerPage,
        offset: auditPage * auditRowsPerPage,
        tableName: auditFilterTable,
        actionType: auditFilterAction,
        search: auditSearch
      });
      setAuditLogs(res.data.logs || []);
      setAuditTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === 1) {
      fetchAuditLogs();
    }
  }, [token, activeTab, auditPage, auditRowsPerPage, auditFilterTable, auditFilterAction]);

  const fetchDiagnostics = async () => {
    if (!token) return;
    setDiagLoading(true);
    try {
      const res = await kernelAPI.getDiagnostics();
      setDiagnostics(res.data);
    } catch (err) {
      toast.error('Failed to load system diagnostics');
    } finally {
      setDiagLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === 2) {
      fetchDiagnostics();
    }
  }, [token, activeTab]);

  // ─────────────────────────────────────────────────────────────
  //  CRUD ACTIONS (CREATE / EDIT / DELETE / ROLLBACK)
  // ─────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    const initial = {};
    tableColumns.forEach(c => {
      initial[c] = '';
    });
    // Generate default ID
    const prefix = selectedTable.substring(0, 3).toUpperCase();
    initial.id = `${prefix}-${Date.now()}`;
    setCurrentRecord(initial);
    setOriginalRecord({});
    setModalMode('CREATE');
    setOperatorReason('');
    setRecordModalOpen(true);
  };

  const openEditModal = (record) => {
    setCurrentRecord({ ...record });
    setOriginalRecord({ ...record });
    setModalMode('EDIT');
    setOperatorReason('');
    setRecordModalOpen(true);
  };

  const handleSaveRecord = async () => {
    if (!operatorReason.trim()) {
      toast.error('Audit justification reason is mandatory for Kernel modifications.');
      return;
    }

    setCrudSubmitting(true);
    try {
      if (modalMode === 'CREATE') {
        await kernelAPI.createRecord(selectedTable, currentRecord, operatorReason);
        toast.success(`Record created in ${selectedTable} and logged to Audit Ledger.`);
      } else if (modalMode === 'EDIT') {
        await kernelAPI.updateRecord(selectedTable, currentRecord.id, currentRecord, operatorReason);
        toast.success(`Record ${currentRecord.id} updated and logged with state diff.`);
      }
      setRecordModalOpen(false);
      fetchTableData();
      fetchTablesList();
    } catch (err) {
      toast.error(err.response?.data?.error || 'CRUD operation failed.');
    } finally {
      setCrudSubmitting(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    if (!deleteReason.trim()) {
      toast.error('Deletion justification reason is required for security compliance.');
      return;
    }

    setCrudSubmitting(true);
    try {
      await kernelAPI.deleteRecord(selectedTable, recordToDelete.id, deleteReason);
      toast.success(`Record ${recordToDelete.id} deleted. Historical snapshot archived in Audit Ledger.`);
      setDeleteModalOpen(false);
      setRecordToDelete(null);
      fetchTableData();
      fetchTablesList();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete record.');
    } finally {
      setCrudSubmitting(false);
    }
  };

  const handleExecuteRollback = async () => {
    if (!logToRollback) return;
    setCrudSubmitting(true);
    try {
      await kernelAPI.rollbackRecord(logToRollback.id, rollbackReason || 'Kernel Administrator Snapshot Restoration');
      toast.success(`Rollback executed successfully from log ${logToRollback.id}!`);
      setRollbackModalOpen(false);
      setLogToRollback(null);
      fetchAuditLogs();
      fetchTableData();
      fetchTablesList();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rollback failed.');
    } finally {
      setCrudSubmitting(false);
    }
  };

  const handleExportAuditLogs = async () => {
    try {
      const res = await kernelAPI.exportAuditLogs('csv');
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kernel_audit_ledger_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Audit Ledger exported to CSV.');
    } catch (err) {
      toast.error('Failed to export audit logs');
    }
  };

  const handlePurgeCache = async () => {
    try {
      await kernelAPI.clearCache(selectedTable);
      toast.success(`Cache purged for ${selectedTable || 'all tables'}.`);
      fetchTableData();
    } catch (err) {
      toast.error('Failed to purge cache');
    }
  };

  // Helper for computing diffs in Modal
  const recordDiffs = useMemo(() => {
    if (modalMode !== 'EDIT') return [];
    const diffs = [];
    Object.keys(currentRecord).forEach(k => {
      const oldVal = originalRecord[k];
      const newVal = currentRecord[k];
      if (String(oldVal ?? '') !== String(newVal ?? '')) {
        diffs.push({ field: k, oldVal, newVal });
      }
    });
    return diffs;
  }, [currentRecord, originalRecord, modalMode]);

  // ─────────────────────────────────────────────────────────────
  //  RENDER: STANDALONE LOGIN GATEWAY
  // ─────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090d16 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          color: '#f8fafc',
          fontFamily: 'monospace'
        }}
      >
        <Card
          sx={{
            maxWidth: 520,
            width: '100%',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.2)',
            borderRadius: '16px',
            overflow: 'hidden'
          }}
        >
          {/* Terminal Header Bar */}
          <Box
            sx={{
              background: '#0b0f19',
              px: 3,
              py: 1.8,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
              <Typography sx={{ ml: 1, fontSize: '0.8rem', color: '#94a3b8', letterSpacing: 1, fontWeight: 700 }}>
                SHAZUSOFT_HRMS // KERNEL_GATEWAY
              </Typography>
            </Box>
            <Chip
              label="ROOT PRIVILEGE"
              size="small"
              sx={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                border: '1px solid #ef4444',
                fontWeight: 700,
                fontSize: '0.65rem'
              }}
            />
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)'
                }}
              >
                <TerminalIcon sx={{ fontSize: 32, color: '#fff' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>
                Kernel Command Center
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                Direct low-level system access & immutable audit logging
              </Typography>
            </Box>

            {authError && (
              <Alert severity="error" sx={{ mb: 3, background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid #ef4444' }}>
                {authError}
              </Alert>
            )}

            {/* Switch Mode Tabs */}
            <Box sx={{ display: 'flex', background: '#0b0f19', p: 0.5, borderRadius: '8px', mb: 3 }}>
              <Button
                fullWidth
                size="small"
                onClick={() => setLoginMode('masterKey')}
                sx={{
                  py: 0.8,
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  background: loginMode === 'masterKey' ? '#4f46e5' : 'transparent',
                  color: loginMode === 'masterKey' ? '#fff' : '#64748b'
                }}
              >
                Master Root Key
              </Button>
              <Button
                fullWidth
                size="small"
                onClick={() => setLoginMode('credentials')}
                sx={{
                  py: 0.8,
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  background: loginMode === 'credentials' ? '#4f46e5' : 'transparent',
                  color: loginMode === 'credentials' ? '#fff' : '#64748b'
                }}
              >
                Admin Credentials Gate
              </Button>
            </Box>

            <form onSubmit={handleLogin}>
              {loginMode === 'masterKey' ? (
                <TextField
                  fullWidth
                  type="password"
                  label="Master Root Key / Passphrase"
                  placeholder="Enter system master root key..."
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyIcon sx={{ color: '#818cf8' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      background: '#0b0f19',
                      borderRadius: '8px',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                      '&:hover fieldset': { borderColor: '#818cf8' },
                      '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' }
                  }}
                />
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="Administrator Email"
                    placeholder="admin@shazusofttechnologies.org"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        background: '#0b0f19',
                        borderRadius: '8px',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                        '&:hover fieldset': { borderColor: '#818cf8' }
                      },
                      '& .MuiInputLabel-root': { color: '#94a3b8' }
                    }}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="Root Passcode / Password"
                    placeholder="Enter admin passcode"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        background: '#0b0f19',
                        borderRadius: '8px',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                        '&:hover fieldset': { borderColor: '#818cf8' }
                      },
                      '& .MuiInputLabel-root': { color: '#94a3b8' }
                    }}
                  />
                </>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={authLoading}
                sx={{
                  py: 1.5,
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)'
                  }
                }}
              >
                {authLoading ? <CircularProgress size={24} color="inherit" /> : 'INITIALIZE KERNEL ACCESS'}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                size="small"
                onClick={onExitToApp}
                startIcon={<BackIcon />}
                sx={{ color: '#64748b', '&:hover': { color: '#94a3b8' }, textTransform: 'none' }}
              >
                Return to Standard HRMS Portal
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ─────────────────────────────────────────────────────────────
  //  RENDER: AUTHORIZED KERNEL COMMAND CONSOLE
  // ─────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#090d16',
        color: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Telemetry & Control Bar */}
      <Box
        sx={{
          background: '#0f172a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          px: { xs: 2, sm: 3 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)'
            }}
          >
            <TerminalIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              SHAZUSOFT KERNEL ACCESS CONSOLE
            </Typography>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
              ● ROOT ELEVATION ACTIVE • IMMUTABLE AUDIT ENABLED
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<SecurityIcon sx={{ color: '#818cf8 !important' }} />}
            label={`ACTOR: ${kernelUser?.name || 'Root Admin'} (${kernelUser?.id || 'ROOT'})`}
            size="small"
            sx={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#c7d2fe',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontWeight: 700
            }}
          />

          <Button
            size="small"
            variant="outlined"
            onClick={onExitToApp}
            startIcon={<BackIcon />}
            sx={{
              color: '#94a3b8',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': { borderColor: '#fff', color: '#fff' }
            }}
          >
            Standard Portal
          </Button>

          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ fontWeight: 700 }}
          >
            Lock / Exit
          </Button>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ background: '#0b0f19', px: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              color: '#94a3b8',
              fontWeight: 700,
              fontSize: '0.85rem',
              py: 2,
              '&.Mui-selected': { color: '#818cf8' }
            }
          }}
        >
          <Tab icon={<DbIcon />} iconPosition="start" label={`Master Table Explorer (${tables.length})`} />
          <Tab icon={<AuditIcon />} iconPosition="start" label="Kernel Audit & Activity Ledger" />
          <Tab icon={<TelemetryIcon />} iconPosition="start" label="System Telemetry & Diagnostics" />
        </Tabs>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1 }}>
        {/* ─── TAB 0: MASTER TABLE EXPLORER (UNIVERSAL CRUD) ─── */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Table Selection Sidebar */}
            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: 0.5 }}>
                    SYSTEM TABLES ({tables.length})
                  </Typography>
                  <IconButton size="small" onClick={fetchTablesList} sx={{ color: '#818cf8' }}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ maxHeight: '72vh', overflowY: 'auto', p: 1 }}>
                  {tables.map(tbl => {
                    const isSelected = selectedTable === tbl.modelName;
                    return (
                      <Box
                        key={tbl.modelName}
                        onClick={() => {
                          setSelectedTable(tbl.modelName);
                          setTablePage(0);
                        }}
                        sx={{
                          p: 1.5,
                          mb: 0.8,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          border: isSelected ? '1px solid #6366f1' : '1px solid transparent',
                          transition: 'all 0.2s',
                          '&:hover': { background: 'rgba(255, 255, 255, 0.05)' }
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? '#fff' : '#cbd5e1', fontSize: '0.85rem' }}>
                            {tbl.modelName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {tbl.sqlName}
                          </Typography>
                        </Box>
                        <Chip
                          label={tbl.rowCount}
                          size="small"
                          sx={{
                            background: isSelected ? '#4f46e5' : '#1e293b',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            </Grid>

            {/* Table Data Grid & CRUD Toolbar */}
            <Grid item xs={12} md={9}>
              <Card
                sx={{
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Action Bar */}
                <Box
                  sx={{
                    p: 2,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#fff' }}>
                      {selectedTable}
                    </Typography>
                    <Chip
                      label={`${tableTotal} Total Rows`}
                      size="small"
                      sx={{ background: '#1e293b', color: '#38bdf8', fontWeight: 700 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <TextField
                      size="small"
                      placeholder={`Search in ${selectedTable}...`}
                      value={tableSearch}
                      onChange={(e) => {
                        setTableSearch(e.target.value);
                        setTablePage(0);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#64748b', fontSize: 20 }} />
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        width: { xs: '100%', sm: 220 },
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          background: '#0b0f19',
                          borderRadius: '8px',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }
                        }
                      }}
                    />

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handlePurgeCache}
                      startIcon={<CleanIcon />}
                      sx={{ color: '#94a3b8', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                    >
                      Purge Cache
                    </Button>

                    <Button
                      variant="contained"
                      size="small"
                      onClick={openCreateModal}
                      startIcon={<AddIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        fontWeight: 800,
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      Add Record
                    </Button>
                  </Box>
                </Box>

                {/* Table Data View */}
                {tableLoading && <LinearProgress sx={{ background: '#1e293b', '& .MuiLinearProgress-bar': { background: '#6366f1' } }} />}

                <TableContainer sx={{ maxHeight: '62vh' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ background: '#0b0f19', color: '#94a3b8', fontWeight: 800, width: 90 }}>
                          ACTIONS
                        </TableCell>
                        {tableColumns.map(col => (
                          <TableCell key={col} sx={{ background: '#0b0f19', color: '#94a3b8', fontWeight: 800 }}>
                            {col.toUpperCase()}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={tableColumns.length + 1} sx={{ textAlign: 'center', py: 6, color: '#64748b' }}>
                            {tableLoading ? 'Querying database...' : 'No records found in this table.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableData.map((row, idx) => (
                          <TableRow
                            key={row.id || idx}
                            sx={{
                              '&:hover': { background: 'rgba(255, 255, 255, 0.03)' },
                              '& td': { borderColor: 'rgba(255, 255, 255, 0.05)', color: '#e2e8f0', fontSize: '0.8rem' }
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Edit Record with Diff Log">
                                  <IconButton
                                    size="small"
                                    onClick={() => openEditModal(row)}
                                    sx={{ color: '#38bdf8', '&:hover': { background: 'rgba(56, 189, 248, 0.15)' } }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Audited Delete">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setRecordToDelete(row);
                                      setDeleteReason('');
                                      setDeleteModalOpen(true);
                                    }}
                                    sx={{ color: '#f87171', '&:hover': { background: 'rgba(248, 113, 113, 0.15)' } }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                            {tableColumns.map(col => {
                              const val = row[col];
                              const isJson = typeof val === 'string' && (val.startsWith('{') || val.startsWith('['));
                              return (
                                <TableCell key={col} sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {isJson ? (
                                    <Chip
                                      label="JSON DATA"
                                      size="small"
                                      sx={{ background: '#1e1b4b', color: '#a5b4fc', fontSize: '0.65rem', height: 20 }}
                                    />
                                  ) : val === null || val === undefined || val === '' ? (
                                    <span style={{ color: '#475569' }}>-</span>
                                  ) : (
                                    String(val)
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={tableTotal}
                  page={tablePage}
                  onPageChange={(_, p) => setTablePage(p)}
                  rowsPerPage={tableRowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setTableRowsPerPage(parseInt(e.target.value, 10));
                    setTablePage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  sx={{
                    color: '#94a3b8',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    '& .MuiSelect-icon': { color: '#94a3b8' }
                  }}
                />
              </Card>
            </Grid>
          </Grid>
        )}

        {/* ─── TAB 1: KERNEL AUDIT & ACTIVITY LEDGER ─── */}
        {activeTab === 1 && (
          <Card
            sx={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px'
            }}
          >
            {/* Audit Filter Toolbar */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#fff' }}>
                  Immutable Kernel Audit Ledger
                </Typography>
                <Chip
                  label={`${auditTotal} Events Recorded`}
                  size="small"
                  sx={{ background: '#1e293b', color: '#10b981', fontWeight: 700 }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder="Search logs & reasons..."
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    setAuditPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#64748b', fontSize: 20 }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    width: 220,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      background: '#0b0f19',
                      borderRadius: '8px',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }
                    }
                  }}
                />

                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchAuditLogs}
                  startIcon={<RefreshIcon />}
                  sx={{ color: '#94a3b8', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                >
                  Refresh
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleExportAuditLogs}
                  startIcon={<ExportIcon />}
                  sx={{ background: '#4f46e5', fontWeight: 700 }}
                >
                  Export CSV
                </Button>
              </Box>
            </Box>

            {auditLoading && <LinearProgress sx={{ background: '#1e293b', '& .MuiLinearProgress-bar': { background: '#10b981' } }} />}

            {/* Audit Log Table */}
            <TableContainer sx={{ maxHeight: '68vh' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ background: '#0b0f19', color: '#94a3b8', fontWeight: 800 }}>TIMESTAMP</TableCell>
                    <TableCell sx={{ background: '#0b0f19', color: '#94a3b8', fontWeight: 800 }}>ACTION</TableCell>
                    <TableCell sx={{ background: '#0b0f19', color: '#94a3b8', fontWeight: 800 }}>TABLE</TableCell>
                    <TableCell sx={{ background: '#0b0f19', color: '#94a3b8', fontWeight: 800 }}>RECORD ID</TableCell>
                    <TableCell sx={{ background: '#0b0f19', color: '#94a3b8', fontWeight: 800 }}>ACTOR</TableCell>
                    <TableCell sx={{ background: '#0b0f19', color: '#94a3b8', fontWeight: 800 }}>REASON / JUSTIFICATION</TableCell>
                    <TableCell sx={{ background: '#0b0f19', color: '#94a3b8', fontWeight: 800 }}>DIFF & ROLLBACK</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: '#64748b' }}>
                        No audit events recorded matching current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => {
                      const actionColors = {
                        CREATE: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: '#10b981' },
                        UPDATE: { bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8', border: '#0284c7' },
                        DELETE: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: '#dc2626' },
                        ROLLBACK: { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc', border: '#9333ea' },
                        ROOT_LOGIN: { bg: 'rgba(99, 102, 241, 0.2)', text: '#818cf8', border: '#4f46e5' }
                      };
                      const color = actionColors[log.action_type] || { bg: '#1e293b', text: '#cbd5e1', border: '#475569' };

                      return (
                        <TableRow
                          key={log.id}
                          sx={{
                            '&:hover': { background: 'rgba(255, 255, 255, 0.03)' },
                            '& td': { borderColor: 'rgba(255, 255, 255, 0.05)', color: '#e2e8f0', fontSize: '0.8rem' }
                          }}
                        >
                          <TableCell sx={{ whiteSpace: 'nowrap', color: '#94a3b8 !important' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.action_type}
                              size="small"
                              sx={{
                                background: color.bg,
                                color: color.text,
                                border: `1px solid ${color.border}`,
                                fontWeight: 800,
                                fontSize: '0.65rem'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#f8fafc !important' }}>
                            {log.table_name}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', color: '#38bdf8 !important' }}>
                            {log.record_id || '-'}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{log.actor_name}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>{log.actor_role}</Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 280 }}>
                            {log.reason || '-'}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {log.diff_summary && log.diff_summary !== '[]' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setSelectedDiffLog(log)}
                                  startIcon={<DiffIcon fontSize="small" />}
                                  sx={{
                                    py: 0.2,
                                    px: 1,
                                    fontSize: '0.7rem',
                                    color: '#38bdf8',
                                    borderColor: 'rgba(56, 189, 248, 0.4)'
                                  }}
                                >
                                  View Diff
                                </Button>
                              )}

                              {log.previous_state && log.action_type !== 'ROLLBACK' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => {
                                    setLogToRollback(log);
                                    setRollbackReason('');
                                    setRollbackModalOpen(true);
                                  }}
                                  startIcon={<RollbackIcon fontSize="small" />}
                                  sx={{
                                    py: 0.2,
                                    px: 1,
                                    fontSize: '0.7rem',
                                    background: '#7c3aed',
                                    '&:hover': { background: '#6d28d9' }
                                  }}
                                >
                                  Rollback
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={auditTotal}
              page={auditPage}
              onPageChange={(_, p) => setAuditPage(p)}
              rowsPerPage={auditRowsPerPage}
              onRowsPerPageChange={(e) => {
                setAuditRowsPerPage(parseInt(e.target.value, 10));
                setAuditPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              sx={{
                color: '#94a3b8',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                '& .MuiSelect-icon': { color: '#94a3b8' }
              }}
            />
          </Card>
        )}

        {/* ─── TAB 2: SYSTEM TELEMETRY & DIAGNOSTICS ─── */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', mb: 2 }}>
                  Database Engine Health
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>PostgreSQL Pool Status</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#10b981' }}>
                    {diagnostics?.status?.database || 'Neon PostgreSQL (Connected)'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Total System Tables</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff' }}>
                    {diagnostics?.database?.totalTables || tables.length} Tables
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Total System Records</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#38bdf8' }}>
                    {diagnostics?.database?.totalRecords || 0} Records
                  </Typography>
                </Box>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={fetchDiagnostics}
                  startIcon={<RefreshIcon />}
                  sx={{ mt: 1, color: '#818cf8', borderColor: '#6366f1' }}
                >
                  Refresh Diagnostics
                </Button>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', mb: 2 }}>
                  Table Volume Distribution
                </Typography>
                <Grid container spacing={2}>
                  {tables.map(tbl => (
                    <Grid item xs={6} sm={4} md={3} key={tbl.modelName}>
                      <Box
                        sx={{
                          p: 1.5,
                          background: '#0b0f19',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1' }} noWrap>
                          {tbl.modelName}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#818cf8' }}>
                          {tbl.rowCount}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT RECORD WITH VISUAL DIFF
      ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {modalMode === 'CREATE' ? <AddIcon sx={{ color: '#10b981' }} /> : <EditIcon sx={{ color: '#38bdf8' }} />}
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {modalMode === 'CREATE' ? `Add Record to "${selectedTable}"` : `Edit Record (${currentRecord.id}) in "${selectedTable}"`}
            </Typography>
          </Box>
          <Chip label="AUDITED CRUD" size="small" sx={{ background: '#1e1b4b', color: '#a5b4fc', fontWeight: 700 }} />
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Live Visual Diff Bar for Edits */}
          {modalMode === 'EDIT' && recordDiffs.length > 0 && (
            <Alert
              severity="info"
              icon={<DiffIcon />}
              sx={{
                mb: 3,
                background: 'rgba(56, 189, 248, 0.1)',
                color: '#bae6fd',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Pending Changes Detected ({recordDiffs.length} field{recordDiffs.length > 1 ? 's' : ''}):
              </Typography>
              <Box sx={{ mt: 1, maxHeight: 120, overflowY: 'auto' }}>
                {recordDiffs.map(d => (
                  <Typography key={d.field} variant="caption" sx={{ display: 'block', fontFamily: 'monospace' }}>
                    <strong>{d.field}</strong>: <span style={{ color: '#f87171' }}>"{String(d.oldVal ?? '')}"</span> → <span style={{ color: '#4ade80' }}>"{String(d.newVal ?? '')}"</span>
                  </Typography>
                ))}
              </Box>
            </Alert>
          )}

          {/* Dynamic Form Fields */}
          <Grid container spacing={2}>
            {tableColumns.map(col => {
              const isIdField = col === 'id' && modalMode === 'EDIT';
              return (
                <Grid item xs={12} sm={col === 'description' || col === 'remarks' || col === 'content' ? 12 : 6} key={col}>
                  <TextField
                    fullWidth
                    size="small"
                    disabled={isIdField}
                    label={col.toUpperCase()}
                    value={currentRecord[col] ?? ''}
                    onChange={(e) => {
                      setCurrentRecord(prev => ({
                        ...prev,
                        [col]: e.target.value
                      }));
                    }}
                    multiline={['description', 'remarks', 'content', 'reason', 'work_notes'].includes(col)}
                    rows={['description', 'remarks', 'content'].includes(col) ? 3 : 1}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        background: isIdField ? '#1e293b' : '#0b0f19',
                        borderRadius: '8px',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                        '&:hover fieldset': { borderColor: '#818cf8' }
                      },
                      '& .MuiInputLabel-root': { color: '#94a3b8' }
                    }}
                  />
                </Grid>
              );
            })}
          </Grid>

          <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Mandatory Operator Justification Reason */}
          <TextField
            fullWidth
            required
            label="Operator Justification / Audit Reason (Required)"
            placeholder="e.g. Corrected attendance punch-in timestamp per HR manager authorization..."
            value={operatorReason}
            onChange={(e) => setOperatorReason(e.target.value)}
            multiline
            rows={2}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                background: '#0b0f19',
                borderRadius: '8px',
                '& fieldset': { borderColor: '#f59e0b' }
              },
              '& .MuiInputLabel-root': { color: '#f59e0b', fontWeight: 700 }
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Button onClick={() => setRecordModalOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={crudSubmitting || !operatorReason.trim()}
            onClick={handleSaveRecord}
            sx={{
              background: modalMode === 'CREATE' ? '#10b981' : '#4f46e5',
              fontWeight: 800,
              px: 3
            }}
          >
            {crudSubmitting ? <CircularProgress size={20} color="inherit" /> : 'COMMIT WITH AUDIT LOG'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: DESTRUCTIVE DELETE CONFIRMATION
      ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid #ef4444',
            borderRadius: '16px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DeleteIcon /> Confirm Audited Record Deletion
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
            You are deleting record <strong>"{recordToDelete?.id}"</strong> from table <strong>"{selectedTable}"</strong>.
          </Typography>
          <Alert severity="warning" sx={{ mb: 3, background: 'rgba(245, 158, 11, 0.15)', color: '#fde68a' }}>
            A complete historical snapshot of this record will be archived in the Kernel Audit Ledger for one-click rollback.
          </Alert>

          <TextField
            fullWidth
            required
            label="Deletion Justification (Required)"
            placeholder="Explain why this record is being removed..."
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            multiline
            rows={2}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                background: '#0b0f19',
                borderRadius: '8px',
                '& fieldset': { borderColor: '#ef4444' }
              },
              '& .MuiInputLabel-root': { color: '#f87171', fontWeight: 700 }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteModalOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={crudSubmitting || !deleteReason.trim()}
            onClick={handleDeleteRecord}
            sx={{ fontWeight: 800 }}
          >
            {crudSubmitting ? <CircularProgress size={20} color="inherit" /> : 'CONFIRM AUDITED DELETION'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ONE-CLICK ROLLBACK RESTORATION
      ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={rollbackModalOpen}
        onClose={() => setRollbackModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid #a855f7',
            borderRadius: '16px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <RollbackIcon /> Rollback Record to Historical Snapshot
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
            Restoring record <strong>"{logToRollback?.record_id}"</strong> in table <strong>"{logToRollback?.table_name}"</strong> back to its pre-modification snapshot.
          </Typography>

          <TextField
            fullWidth
            label="Rollback Reason / Remarks"
            placeholder="e.g. Reverted accidental record modification..."
            value={rollbackReason}
            onChange={(e) => setRollbackReason(e.target.value)}
            multiline
            rows={2}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                background: '#0b0f19',
                borderRadius: '8px',
                '& fieldset': { borderColor: '#a855f7' }
              },
              '& .MuiInputLabel-root': { color: '#c084fc' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRollbackModalOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={crudSubmitting}
            onClick={handleExecuteRollback}
            sx={{ background: '#9333ea', fontWeight: 800 }}
          >
            {crudSubmitting ? <CircularProgress size={20} color="inherit" /> : 'EXECUTE SNAPSHOT ROLLBACK'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: SIDE-BY-SIDE DIFF VIEWER
      ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(selectedDiffLog)}
        onClose={() => setSelectedDiffLog(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DiffIcon sx={{ color: '#38bdf8' }} /> Audit Diff Inspector ({selectedDiffLog?.id})
          </Box>
          <Chip label={selectedDiffLog?.table_name} size="small" sx={{ background: '#1e293b', color: '#fff' }} />
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 2 }}>
            <strong>Operator:</strong> {selectedDiffLog?.actor_name} • <strong>Action:</strong> {selectedDiffLog?.action_type} • <strong>Time:</strong> {selectedDiffLog?.timestamp}
          </Typography>

          <Box sx={{ background: '#0b0f19', p: 2, borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', mb: 3 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>JUSTIFICATION REASON</Typography>
            <Typography variant="body2" sx={{ color: '#f8fafc', mt: 0.5 }}>{selectedDiffLog?.reason || 'No justification recorded'}</Typography>
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#38bdf8', mb: 1 }}>
            FIELD-LEVEL MODIFICATION DIFF
          </Typography>
          <TableContainer sx={{ background: '#0b0f19', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 800 }}>FIELD</TableCell>
                  <TableCell sx={{ color: '#f87171', fontWeight: 800 }}>OLD VALUE</TableCell>
                  <TableCell sx={{ color: '#4ade80', fontWeight: 800 }}>NEW VALUE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  try {
                    const diffs = typeof selectedDiffLog?.diff_summary === 'string'
                      ? JSON.parse(selectedDiffLog.diff_summary)
                      : selectedDiffLog?.diff_summary || [];
                    if (!Array.isArray(diffs) || diffs.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={3} sx={{ color: '#64748b', textAlign: 'center', py: 3 }}>
                            No individual field diff available.
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return diffs.map((d, i) => (
                      <TableRow key={i} sx={{ '& td': { borderColor: 'rgba(255, 255, 255, 0.05)', color: '#fff', fontSize: '0.8rem' } }}>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{d.field}</TableCell>
                        <TableCell sx={{ color: '#fca5a5 !important', fontFamily: 'monospace' }}>{String(d.oldValue ?? '')}</TableCell>
                        <TableCell sx={{ color: '#86efac !important', fontFamily: 'monospace' }}>{String(d.newValue ?? '')}</TableCell>
                      </TableRow>
                    ));
                  } catch (e) {
                    return (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ color: '#f87171' }}>Failed to parse diff.</TableCell>
                      </TableRow>
                    );
                  }
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedDiffLog(null)} sx={{ color: '#fff' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
