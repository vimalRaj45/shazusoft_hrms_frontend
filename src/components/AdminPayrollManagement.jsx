import React, { useState, useEffect } from 'react';
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
  IconButton
} from '@mui/material';
import {
  Payments as PayrollIcon,
  CalendarMonth as CalendarIcon,
  People as StaffIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ClockIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Shield as ShieldIcon,
  Search as SearchIcon,
  AttachMoney as DollarIcon
} from '@mui/icons-material';
import { payrollAPI } from '../services/api';
import { generatePayslipPDF, formatINR } from '../utils/payslipGenerator';
import toast from '../utils/muiToast';

export default function AdminPayrollManagement() {
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'structures'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [workingDaysMeta, setWorkingDaysMeta] = useState(null);
  const [records, setRecords] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing Structure State
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [structureForm, setStructureForm] = useState({
    monthly_salary: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    pan_number: ''
  });
  const [savingStructure, setSavingStructure] = useState(false);

  // Mark Paid Modal State
  const [payingRecord, setPayingRecord] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_mode: 'Bank Transfer / NEFT',
    payment_reference: '',
    payment_date: new Date().toISOString().slice(0, 10),
    remarks: 'Disbursed via corporate payroll'
  });
  const [savingPayment, setSavingPayment] = useState(false);

  // 1. Fetch Month Records & Working Days metadata
  const fetchMonthData = async (month) => {
    setLoading(true);
    try {
      const res = await payrollAPI.getMonthRecords(month);
      setRecords(res.data.records || []);
      setWorkingDaysMeta(res.data.workingDaysMeta || null);
    } catch (err) {
      console.error('Error fetching payroll month records:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Salary Structures
  const fetchSalaryStructures = async () => {
    try {
      const res = await payrollAPI.getSalaryStructures();
      setSalaryStructures(res.data.salary_structures || []);
    } catch (err) {
      console.error('Error fetching salary structures:', err);
    }
  };

  useEffect(() => {
    fetchMonthData(selectedMonth);
    fetchSalaryStructures();
  }, [selectedMonth]);

  // 3. Preview Month Calculation (On-the-fly preview)
  const handlePreviewCalculation = async () => {
    setCalculating(true);
    try {
      const res = await payrollAPI.calculateMonth(selectedMonth);
      setRecords(res.data.records || []);
      setWorkingDaysMeta(res.data.workingDaysMeta || null);
      toast.success(`Calculation preview computed for ${selectedMonth}! Review line items before committing.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to calculate month payroll');
    } finally {
      setCalculating(false);
    }
  };

  // 4. Commit & Publish Month Payroll
  const handleCommitPayroll = async () => {
    if (!window.confirm(`Are you sure you want to commit and publish payroll for ${selectedMonth}? Active employees will be able to view their official payslips.`)) {
      return;
    }
    setCommitting(true);
    try {
      const res = await payrollAPI.generateMonth(selectedMonth);
      setRecords(res.data.records || []);
      setWorkingDaysMeta(res.data.workingDaysMeta || null);
      toast.success(`Payroll for ${selectedMonth} published successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to commit payroll');
    } finally {
      setCommitting(false);
    }
  };

  // 5. Save Salary Structure
  const handleSaveStructure = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setSavingStructure(true);
    try {
      await payrollAPI.updateSalaryStructure(editingEmployee.employee_id, structureForm);
      toast.success(`Salary package saved for ${editingEmployee.employee_name}!`);
      setEditingEmployee(null);
      await fetchSalaryStructures();
      fetchMonthData(selectedMonth);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save salary structure');
    } finally {
      setSavingStructure(false);
    }
  };

  // 6. Mark Record as Paid
  const handleMarkAsPaid = async (e) => {
    e.preventDefault();
    if (!payingRecord) return;
    setSavingPayment(true);
    try {
      await payrollAPI.updateRecordStatus(payingRecord.id, {
        status: 'Paid',
        ...paymentForm
      });
      toast.success(`Marked ${payingRecord.employee_name}'s payslip as Paid!`);
      setPayingRecord(null);
      fetchMonthData(selectedMonth);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update payment status');
    } finally {
      setSavingPayment(false);
    }
  };

  // Quick Stats
  const totalPayrollAmount = records.reduce((acc, r) => acc + (parseFloat(r.net_payable) || 0), 0);
  const totalEmployeesWithPay = records.filter(r => (parseFloat(r.monthly_salary) || 0) > 0).length;
  const totalPaidCount = records.filter(r => r.status === 'Paid').length;
  const totalPendingCount = records.filter(r => r.status !== 'Paid').length;

  const filteredStructures = salaryStructures.filter(s =>
    (s.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Header & Sub-Tabs Switcher */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
            <PayrollIcon sx={{ color: '#133829' }} /> Automated Payroll & PDF Payslips
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Formula-based salary calculation with dynamic Working Sundays & instant 1-click PDF payslips.
          </Typography>
        </Box>

        {/* View Switcher Tabs */}
        <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', p: 0.5, borderRadius: '10px' }}>
          <Button
            variant={activeTab === 'register' ? 'contained' : 'text'}
            onClick={() => setActiveTab('register')}
            startIcon={<CalendarIcon fontSize="small" />}
            sx={{
              fontWeight: 800,
              fontSize: '0.8rem',
              borderRadius: '8px',
              bgcolor: activeTab === 'register' ? '#133829' : 'transparent',
              color: activeTab === 'register' ? '#ffffff' : '#64748b',
              '&:hover': { bgcolor: activeTab === 'register' ? '#0b2319' : '#e2e8f0' }
            }}
          >
            Monthly Payroll Register
          </Button>
          <Button
            variant={activeTab === 'structures' ? 'contained' : 'text'}
            onClick={() => setActiveTab('structures')}
            startIcon={<StaffIcon fontSize="small" />}
            sx={{
              fontWeight: 800,
              fontSize: '0.8rem',
              borderRadius: '8px',
              bgcolor: activeTab === 'structures' ? '#133829' : 'transparent',
              color: activeTab === 'structures' ? '#ffffff' : '#64748b',
              '&:hover': { bgcolor: activeTab === 'structures' ? '#0b2319' : '#e2e8f0' }
            }}
          >
            Salary Packages ({salaryStructures.length})
          </Button>
        </Box>
      </Box>

      {activeTab === 'register' && (
        <>
          {/* Controls Bar: Month Picker & Action Buttons */}
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  type="month"
                  size="small"
                  label="Payroll Month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 170, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontWeight: 700 } }}
                />

                {/* Working Days Breakdown Chip */}
                {workingDaysMeta && (
                  <Chip
                    color="primary"
                    variant="outlined"
                    label={`${workingDaysMeta.totalWorkingDays} Working Days • ${workingDaysMeta.workingSundaysCount} Working Sun • ${workingDaysMeta.holidaysCount} Holidays`}
                    sx={{ fontWeight: 800, borderRadius: '8px', bgcolor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={handlePreviewCalculation}
                  disabled={calculating}
                  startIcon={calculating ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon fontSize="small" />}
                  sx={{ fontWeight: 800, borderRadius: '8px', borderColor: '#cbd5e1', color: '#334155' }}
                >
                  {calculating ? 'Computing...' : 'Preview Month'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCommitPayroll}
                  disabled={committing}
                  startIcon={committing ? <CircularProgress size={16} color="inherit" /> : <ShieldIcon fontSize="small" />}
                  sx={{
                    fontWeight: 800,
                    borderRadius: '8px',
                    bgcolor: '#133829',
                    color: '#ffffff',
                    '&:hover': { bgcolor: '#0b2319' }
                  }}
                >
                  {committing ? 'Publishing...' : 'Commit & Publish Payroll'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Metric Cards Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Net Disbursable
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#15803d', mt: 0.5 }}>
                    {formatINR(totalPayrollAmount)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Total net payable for {selectedMonth}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Active Salaried Staff
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mt: 0.5 }}>
                    {totalEmployeesWithPay} Staff
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Configured salary packages
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Disbursed (Paid)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#166534', mt: 0.5 }}>
                    {totalPaidCount} Paid
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#16a34a' }}>
                    Disbursement confirmed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Pending Payment
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#b45309', mt: 0.5 }}>
                    {totalPendingCount} Pending
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#d97706' }}>
                    Awaiting bank settlement
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Payroll Calculation Register Table */}
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: 'none' }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Payroll Calculation Register ({selectedMonth})
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Daily Rate = Monthly Base ÷ Working Days (including Working Sundays). LOP = Working Days - Present - Leaves.
                  </Typography>
                </Box>
                <Chip label={`${records.length} Records`} size="small" sx={{ fontWeight: 700, borderRadius: '6px' }} />
              </Box>

              <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Base Salary</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Working Days</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Attended</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Leaves</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>LOP Days</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>LOP Deduction</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Net Payable</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            No payroll records computed for {selectedMonth}.
                          </Typography>
                          <Typography variant="caption">
                            Click "Preview Month" or "Commit & Publish Payroll" above.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((rec) => {
                        const baseSal = parseFloat(rec.monthly_salary) || 0;
                        const lopDed = parseFloat(rec.lop_deduction) || 0;
                        const netPay = parseFloat(rec.net_payable) || 0;
                        const lopDays = parseFloat(rec.lop_days) || 0;

                        return (
                          <TableRow key={rec.employee_id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                {rec.employee_name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                {rec.employee_id} • {rec.designation}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                                {formatINR(baseSal)}
                              </Typography>
                              {baseSal === 0 && (
                                <Chip label="Not Set" size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 800, bgcolor: '#fef3c7', color: '#b45309', borderRadius: '4px' }} />
                              )}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              {rec.total_working_days}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#16a34a' }}>
                              {rec.present_days}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, color: '#2563eb' }}>
                              {rec.paid_leaves}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={lopDays}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontWeight: 800,
                                  borderRadius: '6px',
                                  bgcolor: lopDays > 0 ? '#fee2e2' : '#f1f5f9',
                                  color: lopDays > 0 ? '#991b1b' : '#64748b'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: lopDed > 0 ? '#dc2626' : '#64748b' }}>
                              {lopDed > 0 ? `-${formatINR(lopDed)}` : '₹0'}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                                {formatINR(netPay)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={rec.status || 'Pending'}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  borderRadius: '6px',
                                  bgcolor: rec.status === 'Paid' ? '#dcfce7' : '#fef3c7',
                                  color: rec.status === 'Paid' ? '#15803d' : '#b45309'
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                {rec.status !== 'Paid' && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    onClick={() => {
                                      setPayingRecord(rec);
                                      setPaymentForm({
                                        payment_mode: 'Bank Transfer / NEFT',
                                        payment_reference: '',
                                        payment_date: new Date().toISOString().slice(0, 10),
                                        remarks: 'Salary paid via corporate banking'
                                      });
                                    }}
                                    sx={{ fontWeight: 700, borderRadius: '6px', fontSize: 11 }}
                                  >
                                    Mark Paid
                                  </Button>
                                )}
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<DownloadIcon fontSize="small" />}
                                  onClick={() => generatePayslipPDF(rec)}
                                  sx={{
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    fontSize: 11,
                                    bgcolor: '#133829',
                                    '&:hover': { bgcolor: '#0b2319' }
                                  }}
                                >
                                  Payslip
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'structures' && (
        <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Employee Base Salary Packages & Bank Details
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Configure base monthly compensation and banking information for all active staff members.
                </Typography>
              </Box>
              <TextField
                size="small"
                placeholder="Search staff name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                }}
                sx={{ width: 240, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Box>

            <Box sx={{ overflowX: 'auto', width: '100%' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Monthly Base Salary</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Bank Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Account Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>IFSC Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>UPI ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>PAN Number</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStructures.map((struct) => (
                    <TableRow key={struct.employee_id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {struct.employee_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {struct.employee_id} • {struct.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {struct.monthly_salary > 0 ? (
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#133829' }}>
                            {formatINR(struct.monthly_salary)}
                          </Typography>
                        ) : (
                          <Chip label="Not Configured" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#fef3c7', color: '#b45309', borderRadius: '6px' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>{struct.bank_name || '—'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#475569' }}>
                        {struct.account_number ? `•••• ${struct.account_number.slice(-4)}` : '—'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#475569' }}>{struct.ifsc_code || '—'}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{struct.upi_id || '—'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#475569' }}>{struct.pan_number || '—'}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon fontSize="small" />}
                          onClick={() => {
                            setEditingEmployee(struct);
                            setStructureForm({
                              monthly_salary: struct.monthly_salary || '',
                              bank_name: struct.bank_name || '',
                              account_number: struct.account_number || '',
                              ifsc_code: struct.ifsc_code || '',
                              upi_id: struct.upi_id || '',
                              pan_number: struct.pan_number || ''
                            });
                          }}
                          sx={{
                            fontWeight: 700,
                            borderRadius: '6px',
                            fontSize: 11,
                            borderColor: '#cbd5e1',
                            color: '#133829'
                          }}
                        >
                          Edit Package
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Edit Salary Structure Modal */}
      <Dialog open={Boolean(editingEmployee)} onClose={() => setEditingEmployee(null)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveStructure}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
            Configure Employee Salary Package
          </DialogTitle>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2, borderRadius: '10px', fontWeight: 600 }}>
              Configuring remuneration for <strong>{editingEmployee?.employee_name}</strong> ({editingEmployee?.employee_id}).
              Daily rate will automatically be computed as Base Salary ÷ Monthly Working Days (including Working Sundays).
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Monthly Base Salary (INR)"
                  value={structureForm.monthly_salary}
                  onChange={(e) => setStructureForm({ ...structureForm, monthly_salary: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                  helperText="e.g. 25000, 35000, 45000"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontWeight: 700 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={structureForm.bank_name}
                  onChange={(e) => setStructureForm({ ...structureForm, bank_name: e.target.value })}
                  placeholder="e.g. HDFC Bank"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  value={structureForm.account_number}
                  onChange={(e) => setStructureForm({ ...structureForm, account_number: e.target.value })}
                  placeholder="e.g. 50100234567890"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={structureForm.ifsc_code}
                  onChange={(e) => setStructureForm({ ...structureForm, ifsc_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. HDFC0001234"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="UPI ID"
                  value={structureForm.upi_id}
                  onChange={(e) => setStructureForm({ ...structureForm, upi_id: e.target.value })}
                  placeholder="e.g. staff@okhdfc"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="PAN Number"
                  value={structureForm.pan_number}
                  onChange={(e) => setStructureForm({ ...structureForm, pan_number: e.target.value.toUpperCase() })}
                  placeholder="e.g. ABCDE1234F"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditingEmployee(null)} color="inherit">Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingStructure}
              startIcon={savingStructure ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              sx={{ fontWeight: 800, bgcolor: '#133829', '&:hover': { bgcolor: '#0b2319' } }}
            >
              {savingStructure ? 'Saving...' : 'Save Salary Package'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Mark Paid Modal */}
      <Dialog open={Boolean(payingRecord)} onClose={() => setPayingRecord(null)} maxWidth="xs" fullWidth>
        <form onSubmit={handleMarkAsPaid}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
            Record Salary Disbursement
          </DialogTitle>
          <DialogContent dividers>
            <Alert severity="success" sx={{ mb: 2, borderRadius: '10px', fontWeight: 600 }}>
              Disbursing <strong>{formatINR(payingRecord?.net_payable)}</strong> to <strong>{payingRecord?.employee_name}</strong>.
            </Alert>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Payment Mode"
                value={paymentForm.payment_mode}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              >
                <MenuItem value="Bank Transfer / NEFT">Bank Transfer / NEFT</MenuItem>
                <MenuItem value="IMPS / Instant Transfer">IMPS / Instant Transfer</MenuItem>
                <MenuItem value="UPI / QR Code">UPI / QR Code</MenuItem>
                <MenuItem value="Corporate Cheque">Corporate Cheque</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
              </TextField>

              <TextField
                type="date"
                fullWidth
                size="small"
                label="Payment Date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              <TextField
                fullWidth
                size="small"
                label="UTR / Transaction Ref ID"
                value={paymentForm.payment_reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                placeholder="e.g. UTR202609060123"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />

              <TextField
                fullWidth
                size="small"
                label="Disbursement Remarks"
                value={paymentForm.remarks}
                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPayingRecord(null)} color="inherit">Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={savingPayment}
              startIcon={savingPayment ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon fontSize="small" />}
              sx={{ fontWeight: 800 }}
            >
              {savingPayment ? 'Confirming...' : 'Confirm Disbursed'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
