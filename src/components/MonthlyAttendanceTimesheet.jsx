import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  CheckCircle as PresentIcon,
  Schedule as TimeIcon,
  WarningAmber as LateIcon,
  EventBusy as LeaveIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
  FactCheck as RegularizeIcon,
  FileDownload as DownloadIcon,
  TrendingUp as MetricIcon
} from '@mui/icons-material';
import { attendanceAPI } from '../services/api';
import { formatTime12h } from '../utils/timeUtils';
import toast from '../utils/muiToast';
import AttendanceRegularizationModal from './AttendanceRegularizationModal';
import { format } from 'date-fns';

/** Convert decimal hours → precise "Xh Ym" or "Ym Zs" label */
function formatDuration(decimalHours) {
  if (decimalHours === null || decimalHours === undefined || decimalHours === '' || isNaN(Number(decimalHours))) {
    return '0h 0m';
  }
  const totalSeconds = Math.round(Number(decimalHours) * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function MonthlyAttendanceTimesheet({ onRefreshParent }) {
  const currentMonthKey = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [timesheetData, setTimesheetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'PRESENT' | 'LATE' | 'LEAVE_ABSENT'

  // Regularization modal state
  const [openRegModal, setOpenRegModal] = useState(false);
  const [selectedPastDate, setSelectedPastDate] = useState('');

  const fetchMonthlyTimesheet = async (monthKey) => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getMyMonthlyHistory(monthKey);
      setTimesheetData(res.data);
    } catch (err) {
      console.error('Error fetching monthly timesheet:', err);
      toast.error('Failed to load monthly attendance history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyTimesheet(selectedMonth);
  }, [selectedMonth]);

  const handleMonthChange = (e) => {
    const val = e.target.value;
    if (val > currentMonthKey) {
      toast.info('Future months cannot be selected. Bounded to current month and past months.');
      return;
    }
    setSelectedMonth(val);
  };

  const handleOpenRegularization = (dateStr) => {
    setSelectedPastDate(dateStr);
    setOpenRegModal(true);
  };

  const days = timesheetData?.days || [];

  const filteredDays = days.filter((d) => {
    if (filterType === 'PRESENT') {
      return d.status === 'Present' || d.status === 'Late';
    }
    if (filterType === 'LATE') {
      return d.status === 'Late';
    }
    if (filterType === 'LEAVE_ABSENT') {
      return d.status === 'Approved Leave' || d.status === 'Absent' || d.status === 'Not Punched Yet';
    }
    return true;
  });

  return (
    <Box>
      {/* Month Picker & Header Bar */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '4px', mb: 3, bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '4px',
                bgcolor: '#133829',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CalendarIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {timesheetData?.month_label || 'Monthly Attendance Timesheet'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Daily login and logout timestamps • Verified strictly for past calendar days
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              size="small"
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              inputProps={{ max: currentMonthKey }}
              sx={{
                bgcolor: '#f8fafc',
                borderRadius: '4px',
                '& .MuiOutlinedInput-root': { borderRadius: '4px', fontWeight: 700 }
              }}
            />
            <Tooltip title="Refresh timesheet">
              <IconButton
                onClick={() => fetchMonthlyTimesheet(selectedMonth)}
                sx={{ border: '1px solid #e2e8f0', borderRadius: '4px' }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* 4 Monthly KPI Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e2e8f0', borderTop: '3px solid #133829', borderRadius: '4px' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                PRESENT / WORKING DAYS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#133829', mt: 0.5 }}>
                {timesheetData?.present_days ?? '--'}{' '}
                <Typography component="span" variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  / {timesheetData?.past_days_count ?? '--'} past days
                </Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e2e8f0', borderTop: '3px solid #0284c7', borderRadius: '4px' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                TOTAL LOGGED HOURS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0284c7', mt: 0.5 }}>
                {formatDuration(timesheetData?.total_hours)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '4px' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                AVERAGE DAILY WORKING TIME
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981', mt: 0.5 }}>
                {formatDuration(timesheetData?.avg_hours_per_day)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e2e8f0', borderTop: '3px solid #f59e0b', borderRadius: '4px' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                ON-TIME ARRIVAL RATE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#d97706', mt: 0.5 }}>
                {timesheetData?.on_time_percent !== undefined ? `${timesheetData.on_time_percent}%` : '--'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Timesheet Table & Filter Bar */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '4px', bgcolor: '#ffffff' }}>
        <Box sx={{ borderBottom: '1px solid #e2e8f0', px: 2, pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Tabs
            value={filterType}
            onChange={(e, v) => setFilterType(v)}
            sx={{ minHeight: 44, '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 700, fontSize: 13 } }}
          >
            <Tab label={`All Days (${days.length})`} value="ALL" />
            <Tab label={`Present Days (${timesheetData?.present_days || 0})`} value="PRESENT" />
            <Tab label={`Late Logins (${timesheetData?.late_days || 0})`} value="LATE" />
            <Tab label={`Leaves & Absences (${(timesheetData?.leave_days || 0) + (days.filter(d => d.status === 'Absent').length)})`} value="LEAVE_ABSENT" />
          </Tabs>

          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            {selectedMonth === currentMonthKey ? 'Past days active • Future days locked' : 'Historical month archive'}
          </Typography>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress size={36} sx={{ color: '#133829' }} />
              <Typography variant="body2" sx={{ color: '#64748b', mt: 1.5, fontWeight: 600 }}>
                Loading {selectedMonth} attendance records...
              </Typography>
            </Box>
          ) : filteredDays.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No attendance logs match the selected filter.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Date & Day</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Login Time</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Logout Time</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Working Hours</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Action / Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDays.map((row) => {
                    const isFuture = row.is_future;
                    const isToday = row.is_today;

                    return (
                      <TableRow
                        key={row.date}
                        hover={!isFuture}
                        sx={{
                          bgcolor: isToday ? '#f0fdf4' : isFuture ? '#fafafa' : 'inherit',
                          opacity: isFuture ? 0.65 : 1
                        }}
                      >
                        {/* Date & Day */}
                        <TableCell sx={{ fontWeight: 700, color: isFuture ? '#94a3b8' : '#0f172a' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{row.date}</span>
                            <Chip
                              label={row.day_name}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                fontWeight: 800,
                                bgcolor: row.is_weekend ? '#fee2e2' : '#f1f5f9',
                                color: row.is_weekend ? '#991b1b' : '#475569',
                                borderRadius: '4px'
                              }}
                            />
                            {isToday && (
                              <Chip label="Today" size="small" color="success" sx={{ height: 18, fontSize: 9.5, fontWeight: 800, borderRadius: '4px' }} />
                            )}
                          </Box>
                        </TableCell>

                        {/* Login Time */}
                        <TableCell>
                          {isFuture ? (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              --
                            </Typography>
                          ) : row.login_time ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <TimeIcon sx={{ fontSize: 16, color: row.status === 'Late' ? '#d97706' : '#15803d' }} />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {formatTime12h(row.login_time)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              --:--
                            </Typography>
                          )}
                        </TableCell>

                        {/* Logout Time */}
                        <TableCell>
                          {isFuture ? (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              --
                            </Typography>
                          ) : row.logout_time ? (
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: row.logout_time === 'In Progress' ? '#0284c7' : 'inherit'
                              }}
                            >
                              {row.logout_time === 'In Progress' ? 'In Progress' : formatTime12h(row.logout_time)}
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              --:--
                            </Typography>
                          )}
                        </TableCell>

                        {/* Working Hours */}
                        <TableCell>
                          {isFuture ? (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              --
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#133829' }}>
                              {formatDuration(row.net_hours)}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {isFuture ? (
                            <Chip
                              icon={<LockIcon sx={{ fontSize: 13 }} />}
                              label={row.is_working_sunday ? 'Working Sunday (Upcoming)' : (row.is_weekend ? 'Weekend' : 'Upcoming')}
                              size="small"
                              sx={{ fontWeight: 700, borderRadius: '4px', height: 22, fontSize: 11, bgcolor: row.is_working_sunday ? '#dcfce7' : '#e2e8f0', color: row.is_working_sunday ? '#15803d' : '#64748b' }}
                            />
                          ) : row.status === 'Working Sunday' ? (
                            <Chip label="Working Sunday (Shift Open)" size="small" sx={{ fontWeight: 700, borderRadius: '4px', height: 22, bgcolor: '#dcfce7', color: '#15803d' }} />
                          ) : row.status === 'Sunday' ? (
                            <Chip label="Sunday" size="small" sx={{ fontWeight: 700, borderRadius: '4px', height: 22, bgcolor: '#e2e8f0', color: '#475569' }} />
                          ) : row.status === 'Holiday' ? (
                            <Chip label={row.holiday_name || 'Holiday'} size="small" sx={{ fontWeight: 700, borderRadius: '4px', height: 22, bgcolor: '#ede9fe', color: '#6d28d9' }} />
                          ) : row.status === 'Present' ? (
                            <Chip label={row.in_geofence === 'WFH' ? 'Present (WFH)' : 'Present'} color="success" size="small" sx={{ fontWeight: 700, borderRadius: '4px', height: 22 }} />
                          ) : row.status === 'Late' ? (
                            <Chip label="Late Arrival" color="warning" size="small" sx={{ fontWeight: 700, borderRadius: '4px', height: 22 }} />
                          ) : (row.status === 'Approved Leave' || row.status?.startsWith('On Leave')) ? (
                            <Chip label={`Leave (${row.leave_type || 'Approved'})`} color="info" size="small" sx={{ fontWeight: 700, borderRadius: '4px', height: 22 }} />
                          ) : row.status === 'Weekend' ? (
                            <Chip label="Weekend" size="small" sx={{ fontWeight: 700, borderRadius: '4px', height: 22, bgcolor: '#f1f5f9', color: '#64748b' }} />
                          ) : (row.status === 'Not Punched Yet' || row.status === 'Pending / Not Punched In') ? (
                            <Chip label={isToday ? "Shift Open" : "Not Punched"} size="small" color="default" sx={{ fontWeight: 700, borderRadius: '4px', height: 22 }} />
                          ) : (
                            <Chip label="Absent" color="error" size="small" sx={{ fontWeight: 700, borderRadius: '4px', height: 22 }} />
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          {isFuture ? (
                            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                              Locked
                            </Typography>
                          ) : (row.status === 'Absent' || (row.status === 'Not Punched Yet' && !isToday)) ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<RegularizeIcon fontSize="small" />}
                              onClick={() => handleOpenRegularization(row.date)}
                              sx={{ fontWeight: 700, borderRadius: '4px', textTransform: 'none', py: 0.2, fontSize: 11.5 }}
                            >
                              Regularize
                            </Button>
                          ) : row.login_time && !row.logout_time && !isToday ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<RegularizeIcon fontSize="small" />}
                              onClick={() => handleOpenRegularization(row.date)}
                              sx={{ fontWeight: 700, borderRadius: '4px', textTransform: 'none', py: 0.2, fontSize: 11.5 }}
                            >
                              Missed Logout
                            </Button>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                              {row.in_geofence === 'TRUE' ? 'GPS Verified' : row.in_geofence === 'OVERRIDE' ? 'Admin Override' : 'Recorded'}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Attendance Regularization Modal */}
      <AttendanceRegularizationModal
        open={openRegModal}
        onClose={() => setOpenRegModal(false)}
        onSuccess={() => {
          fetchMonthlyTimesheet(selectedMonth);
          if (onRefreshParent) onRefreshParent();
        }}
        initialDate={selectedPastDate}
      />
    </Box>
  );
}
