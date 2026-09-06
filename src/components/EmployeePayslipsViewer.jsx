import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Payments as PayrollIcon,
  Download as DownloadIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ClockIcon,
  AccountBalance as BankIcon,
  ReceiptLong as PayslipIcon
} from '@mui/icons-material';
import { payrollAPI } from '../services/api';
import { generatePayslipPDF, formatINR, numberToWordsINR } from '../utils/payslipGenerator';

export default function EmployeePayslipsViewer({ user }) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const fetchMyPayslips = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await payrollAPI.getMyPayslips();
      const list = res.data.payslips || [];
      setPayslips(list);
      if (list.length > 0) {
        setSelectedPayslip(list[0]);
      }
    } catch (err) {
      console.error('Error fetching employee payslips:', err);
      setError('Failed to load payslip records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPayslips();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Header Card */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, '&:last-child': { pb: 2.5 } }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PayrollIcon sx={{ color: '#133829' }} /> My Salary Payslips
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Access your monthly salary remuneration statements and download official signed PDF payslips.
            </Typography>
          </Box>

          {selectedPayslip && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => generatePayslipPDF(selectedPayslip)}
              sx={{
                fontWeight: 800,
                borderRadius: '8px',
                bgcolor: '#133829',
                color: '#ffffff',
                '&:hover': { bgcolor: '#0b2319' }
              }}
            >
              Download Latest Payslip (PDF)
            </Button>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={36} sx={{ color: '#133829' }} />
          <Typography variant="body2" sx={{ color: '#64748b', mt: 1.5, fontWeight: 600 }}>
            Loading your payslip history...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: '10px' }}>
          {error}
        </Alert>
      ) : payslips.length === 0 ? (
        <Card sx={{ border: '1px dashed #cbd5e1', borderRadius: '10px', p: 6, textAlign: 'center', bgcolor: '#f8fafc' }}>
          <PayslipIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#334155' }}>
            No Payslips Published Yet
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 460, mx: 'auto', mt: 0.5 }}>
            Your monthly salary payslips will appear here once computed and published by company administration.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* Left Column: Payslip History Cards */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Monthly Payslip History ({payslips.length})
              </Typography>

              {payslips.map((p) => {
                const isSelected = selectedPayslip?.id === p.id;
                const netPay = parseFloat(p.net_payable) || 0;

                return (
                  <Card
                    key={p.id || p.payroll_month}
                    onClick={() => setSelectedPayslip(p)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #133829' : '1px solid #e2e8f0',
                      bgcolor: isSelected ? '#f0fdf4' : '#ffffff',
                      transition: 'all 0.15s ease',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#133829' }
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon fontSize="small" sx={{ color: '#133829' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            {p.payroll_month}
                          </Typography>
                        </Box>
                        <Chip
                          label={p.status || 'Pending'}
                          size="small"
                          sx={{
                            height: 20,
                            fontWeight: 800,
                            borderRadius: '6px',
                            bgcolor: p.status === 'Paid' ? '#dcfce7' : '#fef3c7',
                            color: p.status === 'Paid' ? '#15803d' : '#b45309'
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1.5 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                            Take-Home Salary
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f172a' }}>
                            {formatINR(netPay)}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadIcon fontSize="small" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            generatePayslipPDF(p);
                          }}
                          sx={{ fontWeight: 700, borderRadius: '6px', fontSize: 11, borderColor: '#cbd5e1', color: '#133829' }}
                        >
                          PDF
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Grid>

          {/* Right Column: Selected Payslip Detail Card */}
          {selectedPayslip && (
            <Grid item xs={12} md={8}>
              <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, pb: 2.5, borderBottom: '1px solid #e2e8f0' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={selectedPayslip.payroll_month} size="small" sx={{ fontWeight: 800, bgcolor: '#f0fdf4', color: '#166534', borderRadius: '6px' }} />
                        <Chip
                          label={selectedPayslip.status === 'Paid' ? 'Disbursed / Paid' : 'Pending Payment'}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            borderRadius: '6px',
                            bgcolor: selectedPayslip.status === 'Paid' ? '#dcfce7' : '#fef3c7',
                            color: selectedPayslip.status === 'Paid' ? '#15803d' : '#b45309'
                          }}
                        />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mt: 1 }}>
                        Official Salary Slip — {selectedPayslip.payroll_month}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => generatePayslipPDF(selectedPayslip)}
                      sx={{
                        fontWeight: 800,
                        borderRadius: '8px',
                        bgcolor: '#133829',
                        '&:hover': { bgcolor: '#0b2319' }
                      }}
                    >
                      Download 1-Page PDF
                    </Button>
                  </Box>

                  {/* Attendance & Days Summary Strip */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Working Days & Attendance Metrics
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>Total Working Days</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>{selectedPayslip.total_working_days}</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>Incl. Working Sundays</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>Days Present</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#15803d' }}>{selectedPayslip.present_days}</Typography>
                          <Typography variant="caption" sx={{ color: '#16a34a', fontSize: 10 }}>Verified Attendance</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 1.5, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700 }}>Paid Leaves</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#2563eb' }}>{selectedPayslip.paid_leaves}</Typography>
                          <Typography variant="caption" sx={{ color: '#3b82f6', fontSize: 10 }}>Casual/Sick/Paid</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 700 }}>Loss of Pay (LOP)</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#dc2626' }}>{selectedPayslip.lop_days}</Typography>
                          <Typography variant="caption" sx={{ color: '#ef4444', fontSize: 10 }}>Unpaid Absent Days</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Earnings & Deductions Breakdown Cards */}
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {/* Earnings Card */}
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, pb: 1, borderBottom: '1px solid #e2e8f0' }}>
                          EARNINGS & REMUNERATION
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#475569' }}>Monthly Base Salary</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{formatINR(selectedPayslip.monthly_salary)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>Daily Salary Rate</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>{formatINR(selectedPayslip.daily_rate)}/day</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>Gross Earnings</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>{formatINR(selectedPayslip.monthly_salary)}</Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Deductions Card */}
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, pb: 1, borderBottom: '1px solid #e2e8f0' }}>
                          DEDUCTIONS & RECOVERIES
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#dc2626' }}>Loss of Pay (LOP: {selectedPayslip.lop_days} days)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#dc2626' }}>-{formatINR(selectedPayslip.lop_deduction)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>PF / Professional Tax</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>₹0 (Startup Exempt)</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>Total Deductions</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>-{formatINR(selectedPayslip.lop_deduction)}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Net Take-Home Highlight Banner */}
                  <Box sx={{ mt: 3, p: 2.5, bgcolor: '#133829', color: '#ffffff', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#86efac', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Net Take-Home Remuneration
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.2 }}>
                        {formatINR(selectedPayslip.net_payable)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', mt: 0.5 }}>
                        {numberToWordsINR(selectedPayslip.net_payable)}
                      </Typography>
                    </Box>

                    {selectedPayslip.account_number && (
                      <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        <Typography variant="caption" sx={{ color: '#86efac', fontWeight: 700, display: 'block' }}>
                          Credited To Bank Account
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                          {selectedPayslip.bank_name || 'Bank'} •••• {selectedPayslip.account_number.slice(-4)}
                        </Typography>
                        {selectedPayslip.payment_date && (
                          <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block' }}>
                            Disbursed on {selectedPayslip.payment_date}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
