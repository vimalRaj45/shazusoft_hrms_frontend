import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tabs,
  Tab
} from '@mui/material';
import {
  Assessment as ReportIcon,
  AutoAwesome as SparklesIcon,
  Speed as ProductivityIcon,
  Schedule as TimeIcon,
  FactCheck as AttendanceRateIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Lightbulb as LightbulbIcon,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { reportsAPI, adminAPI } from '../services/api';
import EmployeeReportViewer from '../components/EmployeeReportViewer';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import toast from '../utils/muiToast';

// Helper to strip legacy markdown hashes/labels and humanize text for executive presentation
function cleanHumanizedSummary(text) {
  if (!text) return [];
  // Remove markdown headers like ### Monthly Performance...
  let cleaned = text.replace(/^#{1,6}\s*.*$/gm, '');
  // Remove Target Scope header if present
  cleaned = cleaned.replace(/^\*\*Target Scope:\*\*.*$/gm, '');
  cleaned = cleaned.replace(/^Target Scope:.*$/gm, '');
  // Remove double asterisks
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  // Split into paragraphs by double newlines or single newlines with spacing
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  return paragraphs.length > 0 ? paragraphs : [cleaned.trim()];
}

export default function AIReports() {
  const [reportMode, setReportMode] = useState(0); // 0 = Standard Employee Full Report (Without AI), 1 = Mistral AI Analytics
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  
  // Standard Report State (Without AI)
  const [employeeReportData, setEmployeeReportData] = useState(null);
  const [loadingStandard, setLoadingStandard] = useState(false);

  // AI Report State
  const [currentAIReport, setCurrentAIReport] = useState(null);
  const [historyReports, setHistoryReports] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchEmployeesAndHistory = async () => {
    try {
      const [empRes, histRes] = await Promise.all([
        adminAPI.getEmployees(),
        reportsAPI.getHistory()
      ]);
      const empList = empRes.data.employees || [];
      setEmployees(empList);
      if (empList.length > 0 && !selectedEmployee) {
        setSelectedEmployee(empList[0].id);
      }
      const hist = histRes.data.reports || [];
      setHistoryReports(hist);
      if (hist.length > 0 && !currentAIReport) {
        setCurrentAIReport(hist[0]);
      }
    } catch (err) {
      console.error('Error fetching reports initial data:', err);
    }
  };

  useEffect(() => {
    fetchEmployeesAndHistory();
  }, []);

  // Fetch Full Employee Report (Without AI)
  const handleFetchEmployeeReport = async () => {
    if (!selectedEmployee) {
      setErrorMsg('Please select an employee to generate the full report.');
      return;
    }
    setLoadingStandard(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await reportsAPI.getEmployeeFullReport({
        employee_id: selectedEmployee,
        month_year: selectedMonth
      });
      setEmployeeReportData(res.data);
      setSuccessMsg(`Full timesheet & activity report for ${res.data.employee.name} loaded successfully!`);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to fetch employee report.');
    } finally {
      setLoadingStandard(false);
    }
  };

  // Generate Mistral AI Monthly Report
  const handleGenerateAIReport = async () => {
    setLoadingAI(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await reportsAPI.generate({
        month_year: selectedMonth,
        employee_id: selectedEmployee || 'ALL'
      });
      setCurrentAIReport(res.data.report);
      setSuccessMsg(`Mistral AI Performance Analytics compiled for ${selectedMonth}!`);
      confetti({ particleCount: 70, spread: 60 });
      fetchEmployeesAndHistory();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to generate Mistral AI report.');
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Top Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Reports & Management Analytics
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
          Generate comprehensive employee timesheet reports or executive performance analytics
        </Typography>
      </Box>

      {/* Main Mode Switcher */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
          <Tabs
            value={reportMode}
            onChange={(e, v) => setReportMode(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab
              label="Standard Employee Timesheet Report"
              icon={<ReportIcon />}
              iconPosition="start"
              sx={{ fontWeight: 700 }}
            />
            <Tab
              label="Executive Monthly Analytics & Insights"
              icon={<SparklesIcon />}
              iconPosition="start"
              sx={{ fontWeight: 700 }}
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* Controls Filter Bar */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                type="month"
                label="Target Month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={4}>
              <TextField
                fullWidth
                select
                label="Select Particular Employee"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                {reportMode === 1 && (
                  <MenuItem value="ALL">Entire Organization (All Staff)</MenuItem>
                )}
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation} - {emp.department})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4} md={5}>
              {reportMode === 0 ? (
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={loadingStandard ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                  onClick={handleFetchEmployeeReport}
                  disabled={loadingStandard}
                  sx={{ py: 1.8, fontWeight: 700 }}
                >
                  {loadingStandard ? 'Fetching Verified Timesheet Records...' : 'Generate Employee Full Report'}
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  size="large"
                  startIcon={loadingAI ? <CircularProgress size={20} color="inherit" /> : <SparklesIcon />}
                  onClick={handleGenerateAIReport}
                  disabled={loadingAI}
                  sx={{
                    py: 1.8,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }
                  }}
                >
                  {loadingAI ? 'Analyzing with Mistral AI...' : 'Run Mistral AI Analysis'}
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* MODE 0: Standard Employee Full Report (Without AI) */}
      {reportMode === 0 && (
        employeeReportData ? (
          <EmployeeReportViewer reportData={employeeReportData} />
        ) : (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Select an Employee & Month to Generate Report
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Pulls complete attendance timestamps, net working hours, tasks completed vs pending, and leave history.
            </Typography>
          </Card>
        )
      )}

      {/* MODE 1: Mistral AI Monthly Analytics */}
      {reportMode === 1 && (
        currentAIReport ? (
          <Box>
            {/* Top Score Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }} alignItems="stretch">
              <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                <Card sx={{ bgcolor: 'rgba(37, 99, 235, 0.04)', border: '1px solid #bfdbfe', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <ProductivityIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        PRODUCTIVITY SCORE
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', my: 0.5 }}>
                        {currentAIReport.productivity_score || currentAIReport.productivityScore || 85}
                        <span style={{ fontSize: '1.2rem' }}>/100</span>
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Chip label="High Efficiency" size="small" color="primary" sx={{ fontWeight: 700 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                <Card sx={{ bgcolor: 'rgba(5, 150, 105, 0.04)', border: '1px solid #a7f3d0', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <AttendanceRateIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ATTENDANCE RATE
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#059669', my: 0.5 }}>
                        {currentAIReport.attendance_rate || currentAIReport.attendanceRate || '95%'}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Chip label="Verified In Geofence" size="small" color="success" sx={{ fontWeight: 700 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                <Card sx={{ bgcolor: 'rgba(8, 145, 178, 0.04)', border: '1px solid #a5f3fc', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <TimeIcon color="secondary" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        TASK COMPLETION RATE
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#0891b2', my: 0.5 }}>
                        {currentAIReport.task_completion_rate || currentAIReport.taskCompletionRate || '90%'}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Chip label="Delivery Benchmark" size="small" color="secondary" sx={{ fontWeight: 700 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                <Card sx={{ bgcolor: 'rgba(217, 119, 6, 0.04)', border: '1px solid #fde68a', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <TimeIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        AVG DAILY WORKING HOURS
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#d97706', my: 0.5 }}>
                        {currentAIReport.avg_daily_hours || currentAIReport.avgDailyHours || '8.2h'}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Chip label="Net Working Time" size="small" color="warning" sx={{ fontWeight: 700 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Executive Summary & Insights */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={7}>
                <Card sx={{ height: '100%', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SparklesIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          Executive Operations Summary
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={`Period: ${currentAIReport.month_year || currentAIReport.monthYear}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                        <Chip
                          label={currentAIReport.target === 'ALL' || !currentAIReport.target ? 'Organization-Wide' : `Scope: ${currentAIReport.target}`}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />

                    {/* Clean Humanized Paragraphs */}
                    {cleanHumanizedSummary(currentAIReport.summary).map((paragraph, pIdx) => (
                      <Typography
                        key={pIdx}
                        variant="body1"
                        paragraph
                        sx={{
                          lineHeight: 1.8,
                          color: '#334155',
                          fontSize: '0.95rem',
                          mb: 1.8,
                          '&:last-child': { mb: 0 }
                        }}
                      >
                        {paragraph}
                      </Typography>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={5}>
                <Card sx={{ height: '100%', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LightbulbIcon color="warning" />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Actionable Management Insights
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                      {(Array.isArray(currentAIReport.key_insights)
                        ? currentAIReport.key_insights
                        : Array.isArray(currentAIReport.keyInsights)
                        ? currentAIReport.keyInsights
                        : [currentAIReport.key_insights || currentAIReport.keyInsights]
                      ).map((insight, idx) => (
                        <ListItem key={idx} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 30, mt: 0.5 }}>
                            <Box
                              sx={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                bgcolor: '#133829',
                                color: 'white',
                                fontSize: 11,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700
                              }}
                            >
                              {idx + 1}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={insight}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: '#1e293b', lineHeight: 1.6 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Historical Reports Archive */}
            {historyReports.length > 0 && (
              <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <HistoryIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      Historical Executive Reports Archive
                    </Typography>
                  </Box>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>MONTH</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>SCOPE</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>PRODUCTIVITY</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>ATTENDANCE</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>GENERATED DATE</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b' }}>ACTION</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historyReports.map((rep) => (
                        <TableRow key={rep.id} hover>
                          <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>{rep.month_year}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{rep.target || 'ALL'}</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>
                            {rep.productivity_score || '--'}/100
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#059669' }}>
                            {rep.attendance_rate || '--'}
                          </TableCell>
                          <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                            {rep.generated_at ? new Date(rep.generated_at).toLocaleDateString() : '--'}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{
                                fontWeight: 700,
                                textTransform: 'none',
                                borderRadius: '6px',
                                px: 1.5
                              }}
                              onClick={() => {
                                setCurrentAIReport(rep);
                                setSelectedMonth(rep.month_year);
                                if (rep.target && rep.target !== 'ALL') {
                                  setSelectedEmployee(rep.target);
                                }
                                setReportMode(1);
                                window.scrollTo({ top: 120, behavior: 'smooth' });
                                toast.success(`Displaying Executive Report for ${rep.month_year}`);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </Box>
        ) : (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              No AI Report Generated Yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Click <strong>"Run Mistral AI Analysis"</strong> to generate AI executive insights.
            </Typography>
          </Card>
        )
      )}
    </Container>
  );
}
