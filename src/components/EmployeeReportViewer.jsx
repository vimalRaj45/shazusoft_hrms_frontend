import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  CheckCircle as PresentIcon,
  AccessTime as TimeIcon,
  Assignment as TaskIcon,
  EventBusy as LeaveIcon,
  Coffee as BreakIcon,
  TrendingUp as TrendIcon,
  Warning as WarningIcon,
  PieChart as ChartIcon,
  Timeline as TimelineIcon,
  Timer as PermissionIcon
} from '@mui/icons-material';
import { generateCorporatePDFReport } from '../utils/pdfReportGenerator';
import toast from '../utils/muiToast';
import { formatTime12h } from '../utils/timeUtils';

export default function EmployeeReportViewer({ reportData }) {
  const [activeTab, setActiveTab] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  if (!reportData) return null;

  const {
    employee,
    summaryMetrics,
    projectBreakdown = [],
    estimationAnalysis = {},
    dailyActivityTimeline = [],
    leaveSummary = {},
    details = {},
    monthYear
  } = reportData;

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      await generateCorporatePDFReport(reportData);
      toast.success('Official Executive PDF Report downloaded successfully.');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Report Header Card */}
      <Card sx={{ mb: 3, borderLeft: '6px solid #133829', borderRadius: '4px' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {employee?.name}
                </Typography>
                <Chip
                  label={employee?.id}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, borderRadius: '4px' }}
                />
                <Chip
                  label={employee?.role?.toUpperCase()}
                  size="small"
                  color={employee?.role === 'admin' ? 'secondary' : 'default'}
                  sx={{ fontWeight: 600, borderRadius: '4px' }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {employee?.designation} • <strong>{employee?.department}</strong> • {employee?.email}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Report Period: <strong>{monthYear}</strong> • Status: <strong>Verified Company Records</strong>
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={handleDownloadPDF}
                disabled={isExporting}
                sx={{
                  fontWeight: 700,
                  bgcolor: '#133829',
                  color: '#ffffff',
                  borderRadius: '4px',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#0f2b20' }
                }}
              >
                {isExporting ? 'Generating PDF...' : 'Download Executive PDF Report'}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* High-Level Metric Tiles */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3} md={2.4}>
              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>DAYS LOGGED</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                  {summaryMetrics?.totalDaysLogged}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {summaryMetrics?.presentDays} on-time, {summaryMetrics?.lateDays} late
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3} md={3}>
              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>NET WORKING TIME</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669', mt: 0.5 }}>
                  {summaryMetrics?.totalNetHours} hrs
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Avg {summaryMetrics?.avgDailyNetHours} hrs/day
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3} md={3}>
              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>TASKS COMPLETED</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563eb', mt: 0.5 }}>
                  {summaryMetrics?.completedTasks} / {summaryMetrics?.totalTasks}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {summaryMetrics?.taskCompletionRate} completion
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3} md={3}>
              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>EFFORT VARIANCE</Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    mt: 0.5,
                    color: parseFloat(summaryMetrics?.timeVarianceHours) > 0 ? '#dc2626' : '#059669'
                  }}
                >
                  {summaryMetrics?.timeVarianceHours > 0 ? `+${summaryMetrics?.timeVarianceHours}` : summaryMetrics?.timeVarianceHours} hrs
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {summaryMetrics?.totalActualHours}h act / {summaryMetrics?.totalEstimatedHours}h est
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Deep Task Analysis: Project Effort Breakdown & Time Estimation Accuracy */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Project Effort Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ChartIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Project Effort & Time Distribution
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {projectBreakdown.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                  No project tasks logged for this month.
                </Typography>
              ) : (
                <Box>
                  {projectBreakdown.map((proj, idx) => (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {proj.projectName}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {proj.actualHours} hrs ({proj.percentageShare}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={proj.percentageShare}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', mb: 0.5 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {proj.completedTasks} of {proj.totalTasks} tasks completed ({proj.completionRate}%)
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Est: {proj.estimatedHours}h
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Time Estimation Accuracy & Overrun Analysis */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendIcon color="warning" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Time Estimation Accuracy & Variance Audit
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Box sx={{ p: 1, bgcolor: '#fef2f2', borderRadius: 1.5, textAlign: 'center', border: '1px solid #fecaca' }}>
                    <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>OVERRUNS</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#dc2626' }}>
                      {estimationAnalysis.overrunCount || 0} tasks
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 1, bgcolor: '#f0fdf4', borderRadius: 1.5, textAlign: 'center', border: '1px solid #bbf7d0' }}>
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>EFFICIENT</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669' }}>
                      {estimationAnalysis.aheadCount || 0} tasks
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>EXACT ON TIME</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {estimationAnalysis.onTargetCount || 0} tasks
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Overrun Tasks with employee remarks */}
              {estimationAnalysis.overrunTasks?.length > 0 ? (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    Tasks Requiring Extra Time (Scope & Blockers):
                  </Typography>
                  <List dense sx={{ mt: 0.5, p: 0 }}>
                    {estimationAnalysis.overrunTasks.slice(0, 3).map((t, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.5, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 24, mt: 0.3 }}>
                          <WarningIcon sx={{ fontSize: 16, color: '#dc2626' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.title}</Typography>
                              <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>
                                +{t.difference}h overrun
                              </Typography>
                            </Box>
                          }
                          secondary={t.remarks ? `Blocker Note: ${t.remarks}` : `Actual: ${t.actual}h vs Est: ${t.estimated}h`}
                          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600, textAlign: 'center', py: 2 }}>
                  All tasks delivered on or ahead of estimated timelines.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detail Breakdown Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label={`Daily Activity Timeline (${dailyActivityTimeline.length} Days)`} icon={<TimelineIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label={`Detailed Work Done (${details?.workDoneLogs?.length || 0})`} icon={<TaskIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label={`Attendance Timesheet (${details?.attendanceLogs?.length || 0})`} icon={<PresentIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label={`Leaves & Permissions Audit`} icon={<LeaveIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 2.5 }}>
          {/* TAB 0: Daily Activity Timeline */}
          {activeTab === 0 && (
            <Box>
              {dailyActivityTimeline.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  No daily activity logged for this month.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Attendance (GPS)</TableCell>
                      <TableCell>Net Hours</TableCell>
                      <TableCell>Tasks Executed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyActivityTimeline.map((day, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{day.date}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {day.loginTime || '--'} - {day.logoutTime || 'Active'}
                          </Typography>
                          <Chip
                            label={day.attendanceStatus}
                            size="small"
                            color={day.attendanceStatus === 'Late' ? 'warning' : day.attendanceStatus === 'Present' ? 'success' : 'default'}
                            sx={{ fontWeight: 700, height: 20, fontSize: 10, mt: 0.3 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {day.netHours} hrs
                        </TableCell>
                        <TableCell>
                          {day.tasks.length === 0 ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>No tasks logged</Typography>
                          ) : (
                            day.tasks.map((t, tIdx) => (
                              <Box key={tIdx} sx={{ mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  • {t.title} <Chip label={t.project} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {t.act}h actual ({t.est}h est) • Status: <strong>{t.status}</strong>
                                </Typography>
                              </Box>
                            ))
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}

          {/* TAB 1: Detailed Work Done Log */}
          {activeTab === 1 && (
            <Box sx={{ overflowX: 'auto' }}>
              {details?.workDoneLogs?.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  No tasks recorded for this period.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell>Task Title & Description</TableCell>
                      <TableCell>Est. Hours</TableCell>
                      <TableCell>Actual Hours</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Remarks / Blockers</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {details.workDoneLogs.map((task) => (
                      <TableRow key={task.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>{task.date}</TableCell>
                        <TableCell>
                          <Chip label={task.project_name} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{task.task_title}</Typography>
                          {task.description && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {task.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{task.estimated_hours}h</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{task.actual_hours}h</TableCell>
                        <TableCell>
                          <Chip
                            label={task.status}
                            size="small"
                            color={task.status === 'Completed' ? 'success' : task.status === 'In-Progress' ? 'primary' : 'warning'}
                            sx={{ fontWeight: 700, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{task.remarks || '--'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}

          {/* TAB 2: Attendance Timesheet */}
          {activeTab === 2 && (
            <Box sx={{ overflowX: 'auto' }}>
              {details?.attendanceLogs?.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  No attendance records found for this period.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Punch In (GPS)</TableCell>
                      <TableCell>Punch Out (GPS)</TableCell>
                      <TableCell>Gross Time</TableCell>
                      <TableCell>Net Working Time</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {details.attendanceLogs.map((att) => (
                      <TableRow key={att.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{att.date}</TableCell>
                        <TableCell>{formatTime12h(att.login_time)}</TableCell>
                        <TableCell>{att.logout_time ? formatTime12h(att.logout_time) : 'Not punched out'}</TableCell>
                        <TableCell>{att.total_hours || '0'} hrs</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {att.net_hours || '0'} hrs
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={att.status || 'Present'}
                            size="small"
                            color={att.status === 'Late' ? 'warning' : 'success'}
                            sx={{ fontWeight: 700, fontSize: 11 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}

          {/* TAB 3: Breaks & Leaves Audit */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  Leaves Taken This Month ({leaveSummary.leavesList?.length || 0})
                </Typography>
                {leaveSummary.leavesList?.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>No leaves taken.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Dates</TableCell>
                        <TableCell>Days</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaveSummary.leavesList.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell sx={{ fontWeight: 600 }}>{l.leave_type}</TableCell>
                          <TableCell>{l.start_date} to {l.end_date}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{l.total_days}d</TableCell>
                          <TableCell>
                            <Chip label={l.status} size="small" color={l.status === 'Approved' ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'secondary.main' }}>
                  Short Permissions Taken ({leaveSummary.permissionsList?.length || 0})
                </Typography>
                {leaveSummary.permissionsList?.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>No permission passes requested.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Hours</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaveSummary.permissionsList.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell sx={{ fontWeight: 600 }}>{p.date}</TableCell>
                          <TableCell>{p.duration_hours}h</TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>{p.reason}</TableCell>
                          <TableCell>
                            <Chip label={p.status} size="small" color={p.status === 'Approved' ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
