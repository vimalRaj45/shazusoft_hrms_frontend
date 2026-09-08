import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Chip,
  Grid,
  Tooltip
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Login as PunchInIcon,
  Logout as PunchOutIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  HelpOutline as RegularizeIcon,
  WorkOutline as WorkIcon,
  Event as EventIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import confetti from 'canvas-confetti';
import toast from '../utils/muiToast';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AttendanceRegularizationModal from './AttendanceRegularizationModal';
import { formatTime12h } from '../utils/timeUtils';
import { format } from 'date-fns';

export default function GeofencePunch({ todayData, onRefresh }) {
  const { user } = useAuth();
  const isWfh = user?.work_mode === 'wfh';
  const isAdmin = user?.role === 'admin';
  const isExempt = isWfh || isAdmin;

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(!isExempt);
  const [actionLoading, setActionLoading] = useState(false);
  const [openRegularizeModal, setOpenRegularizeModal] = useState(false);
  const [todayHoliday, setTodayHoliday] = useState(null); // null = not a holiday, object = holiday info
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isTodaySunday = new Date().getDay() === 0;

  const [timingInfo, setTimingInfo] = useState(null);

  // Fetch holidays to check if today is a holiday or a Working Sunday
  useEffect(() => {
    attendanceAPI.getHolidays().then(res => {
      const holidays = res?.data?.holidays || [];
      const match = holidays.find(h => {
        if (!h.date) return false;
        return h.date.toString().trim().slice(0, 10) === todayStr;
      });
      setTodayHoliday(match || null);
    }).catch(() => {}); // silently ignore

    // Load dynamic shift timings & target working hours
    attendanceAPI.getOfficeTimings().then(res => {
      if (res?.data?.timings) {
        setTimingInfo(res.data);
      }
    }).catch(() => {});
  }, [todayStr, todayData]);

  const captureLocation = () => {
    if (isExempt) {
      // In WFH or Admin mode, we try to capture coords if available, but do not block user
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {},
          { timeout: 5000 }
        );
      }
      setLoadingLocation(false);
      return;
    }

    setLoadingLocation(true);

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const currentCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy)
        };
        setCoords(currentCoords);

        try {
          const res = await attendanceAPI.checkGeofence({
            lat: currentCoords.lat,
            lng: currentCoords.lng
          });
          setGeoStatus(res.data);
        } catch (err) {
          console.error('Geofence check error:', err);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        setLoadingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied. Please allow GPS access.');
        } else {
          toast.error(`Unable to retrieve GPS: ${error.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    captureLocation();
    if (!isWfh) {
      const interval = setInterval(captureLocation, 60000);
      return () => clearInterval(interval);
    }
  }, [isWfh]);

  const handlePunchIn = async () => {
    if (!isExempt && !coords) {
      toast.error('Please wait for GPS location to be detected.');
      return;
    }
    setActionLoading(true);

    try {
      const res = await attendanceAPI.punchIn({
        lat: coords?.lat || null,
        lng: coords?.lng || null
      });
      toast.success(res.data.message || 'Punched in successfully!');
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to punch in.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!isExempt && !coords) {
      toast.error('Please wait for GPS location to be detected.');
      return;
    }
    setActionLoading(true);

    try {
      const res = await attendanceAPI.punchOut({
        lat: coords?.lat || null,
        lng: coords?.lng || null
      });
      toast.success(res.data.message || 'Punched out successfully!');
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to punch out.');
    } finally {
      setActionLoading(false);
    }
  };

  const attendance = todayData?.attendance;
  const isPunchedIn = todayData?.isPunchedIn;
  const isPunchedOut = todayData?.isPunchedOut;

  const formatHoursAndMinutes = (decimalHours) => {
    const totalMinutes = Math.max(0, Math.round((decimalHours || 0) * 60));
    
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const calculateElapsedHours = () => {
    if (!attendance || !attendance.login_time) return 0;
    try {
      const [lh, lm] = attendance.login_time.split(':').map(Number);
      const loginDate = new Date();
      loginDate.setHours(lh, lm, 0, 0);

      let endDate = currentTime;
      if (attendance.logout_time) {
        const [eh, em] = attendance.logout_time.split(':').map(Number);
        endDate = new Date();
        endDate.setHours(eh, em, 0, 0);
      }
      const diffMs = Math.max(0, endDate - loginDate);
      return diffMs / (1000 * 60 * 60);
    } catch (e) {
      return parseFloat(attendance.net_hours) || 0;
    }
  };

  const cachedUser = user || (() => {
    try {
      return JSON.parse(localStorage.getItem('shazusoft_user') || '{}');
    } catch (e) {
      return {};
    }
  })();

  const isIntern = Boolean(
    timingInfo?.employment_type === 'internship' ||
    cachedUser?.employment_type === 'internship' ||
    cachedUser?.designation?.toLowerCase()?.includes('intern') ||
    cachedUser?.role === 'intern'
  );

  const displayOpeningTime = (isIntern && (!timingInfo || timingInfo?.employment_type !== 'internship'))
    ? '10:00'
    : (timingInfo?.timings?.opening_time || (isIntern ? '10:00' : '09:30'));
  const displayClosingTime = (isIntern && (!timingInfo || timingInfo?.employment_type !== 'internship'))
    ? '16:30'
    : (timingInfo?.timings?.closing_time || (isIntern ? '16:30' : '18:30'));
  const displayGraceTime = (isIntern && (!timingInfo || timingInfo?.employment_type !== 'internship'))
    ? '10:15'
    : (timingInfo?.timings?.late_grace_time || (isIntern ? '10:15' : '09:45'));
  const targetNeededHours = isIntern
    ? (timingInfo?.employment_type === 'internship' && timingInfo?.timings?.avg_daily_hours ? parseFloat(timingInfo.timings.avg_daily_hours) : 6.0)
    : parseFloat(timingInfo?.timings?.avg_daily_hours || timingInfo?.timings?.full_day_hours || 8.5);

  const elapsedHours = calculateElapsedHours();
  const progressPercent = Math.min(100, Math.round((elapsedHours / targetNeededHours) * 100));
  const isGoalReached = elapsedHours >= targetNeededHours;
  const remainingHours = Math.max(0, targetNeededHours - elapsedHours);

  // Determine if today is a configured Working Sunday override
  const isSunday = new Date().getDay() === 0;
  const isWorkingSunday = isSunday && todayHoliday && (
    todayHoliday.type === 'Working Sunday' ||
    todayHoliday.type?.toLowerCase().includes('working') ||
    todayHoliday.name?.toLowerCase().includes('working')
  );

  // ─── NON-WORKING DAY OVERRIDE ──────────────────────────────
  const isBlockedNonWorkingDay = (isSunday && !isWorkingSunday) || (
    todayHoliday &&
    !isWorkingSunday &&
    todayHoliday.type !== 'Working Sunday' &&
    !todayHoliday.type?.toLowerCase().includes('working') &&
    !todayHoliday.name?.toLowerCase().includes('working')
  );

  if (isBlockedNonWorkingDay && !attendance) {
    const label = isSunday && !isWorkingSunday ? 'Sunday Weekend' : todayHoliday?.name || 'Company Holiday';
    const subtitle = isSunday && !isWorkingSunday
      ? 'Today is Sunday. Attendance check-in is closed unless scheduled as a Working Sunday.'
      : `Official holiday: "${todayHoliday?.name}" (${todayHoliday?.type || 'Gazetted Holiday'}). Enjoy your day!`;

    return (
      <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
        <Box sx={{ height: 4, bgcolor: '#8b5cf6' }} />
        <CardContent sx={{ p: { xs: 2.5, sm: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, textAlign: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.5, bgcolor: '#f3e8ff', borderRadius: '50%', color: '#7c3aed', display: 'flex' }}>
            <EventIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#6d28d9' }}>{label} — Non-Working Day</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 360 }}>{subtitle}</Typography>
          <Chip label="No check-in required" size="small" sx={{ fontWeight: 700, bgcolor: '#ede9fe', color: '#6d28d9', borderRadius: '6px', mt: 0.5 }} />
        </CardContent>
      </Card>
    );
  }
  // ───────────────────────────────────────────────────────────

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
      {/* Decorative gradient bar */}
      <Box
        sx={{
          height: 4,
          bgcolor: isPunchedIn ? '#10b981' : isWfh ? '#0284c7' : '#133829'
        }}
      />
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAdmin ? <LocationIcon sx={{ color: '#133829' }} /> : isWfh ? <HomeIcon color="secondary" /> : <LocationIcon color="primary" />}
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {isAdmin ? 'Executive Management Attendance & GPS Punch' : isWfh ? 'Work From Home (WFH) Attendance' : 'Office Location Attendance'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Live Date & Time Display Badge (Identical to TopNavbar) */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.2,
                px: 1.5,
                py: 0.6,
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                bgcolor: '#f8fafc'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <CalendarIcon sx={{ fontSize: 15, color: '#133829' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: 11.5, sm: 12.5 }, color: '#0f172a' }}>
                  {format(currentTime, 'EEE, dd MMM yyyy')}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 800 }}>|</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon sx={{ fontSize: 14, color: '#059669' }} />
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: { xs: 11.5, sm: 12.5 }, color: '#059669', fontFamily: 'monospace' }}>
                  {format(currentTime, 'hh:mm:ss a')}
                </Typography>
              </Box>
            </Box>

            {isWorkingSunday && (
              <Chip
                label="Working Sunday Active"
                size="small"
                sx={{ fontWeight: 700, bgcolor: '#dcfce7', color: '#15803d', borderRadius: '6px' }}
              />
            )}
            {!isExempt && (
              <Tooltip title="Refresh Location">
                <span>
                  <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={captureLocation}
                    disabled={loadingLocation}
                    sx={{ color: 'text.secondary', fontSize: '0.75rem', borderRadius: '8px' }}
                  >
                    Refresh
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Status Box: Admin Mode vs WFH Mode vs Office GPS */}
        {isAdmin ? (
          <Box
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: '10px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 26 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#15803d' }}>
                  Executive Administrator Mode Active
                </Typography>
                <Typography variant="caption" sx={{ color: '#166534' }}>
                  Authorized to punch in and punch out directly with executive audit verification.
                </Typography>
              </Box>
            </Box>
            <Chip
              size="small"
              label="EXECUTIVE ACCESS"
              sx={{ fontWeight: 800, borderRadius: '6px', fontSize: 10, bgcolor: '#dcfce7', color: '#15803d' }}
            />
          </Box>
        ) : isWfh ? (
          <Box
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: '10px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircleIcon color="secondary" sx={{ fontSize: 26 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0369a1' }}>
                  Work From Home Mode Active
                </Typography>
                <Typography variant="caption" sx={{ color: '#0284c7' }}>
                  GPS geofencing bypassed. Check in & out directly from home.
                </Typography>
              </Box>
            </Box>
            <Chip
              size="small"
              label="REMOTE ALLOWED"
              color="secondary"
              sx={{ fontWeight: 800, borderRadius: '6px', fontSize: 10 }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: '10px',
              backgroundColor: geoStatus?.inside ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: geoStatus?.inside ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {loadingLocation ? (
                <CircularProgress size={22} thickness={5} />
              ) : geoStatus?.inside ? (
                <CheckCircleIcon color="success" sx={{ fontSize: 26 }} />
              ) : (
                <CancelIcon color="error" sx={{ fontSize: 26 }} />
              )}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {loadingLocation
                    ? 'Detecting GPS Office Location...'
                    : geoStatus?.inside
                    ? 'Within Verified Office Geofence'
                    : 'Outside Office Geofence Radius'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {loadingLocation
                    ? 'Triangulating high-accuracy latitude & longitude...'
                    : geoStatus?.inside
                    ? `You are inside the permitted radius (${geoStatus?.distanceMeters ?? '0'}m from center).`
                    : `You are ${geoStatus?.distanceMeters ?? 'N/A'}m away. Must be within ${geoStatus?.allowedRadiusMeters ?? 150}m to punch.`}
                </Typography>
              </Box>
            </Box>

            <Chip
              size="small"
              label={geoStatus?.inside ? 'VERIFIED' : 'LOCATION CHECK REQUIRED'}
              color={geoStatus?.inside ? 'success' : 'error'}
              sx={{ fontWeight: 700, borderRadius: '6px' }}
            />
          </Box>
        )}

        {/* Applicable Shift & Required Hours Indicator */}
        <Box sx={{ mb: 2, p: 1.5, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              size="small"
              label={isIntern ? 'INTERNSHIP SHIFT' : 'FULL-TIME SHIFT'}
              sx={{
                fontWeight: 800,
                fontSize: 10,
                borderRadius: '6px',
                bgcolor: isIntern ? '#f3e8ff' : '#dcfce7',
                color: isIntern ? '#7e22ce' : '#15803d'
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
              {formatTime12h(displayOpeningTime)} – {formatTime12h(displayClosingTime)} (Grace until {formatTime12h(displayGraceTime)})
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            Target Needed: <strong>{targetNeededHours} hrs/day</strong>
          </Typography>
        </Box>

        {/* Working Hours Target & Live Progress Meter (When punched in today) */}
        {attendance && (
          <Box sx={{ mb: 2.5, p: 2, borderRadius: '10px', bgcolor: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Today's Working Hours Progress:
                </Typography>
                <Chip
                  size="small"
                  label={timingInfo?.employment_type === 'internship' ? 'INTERN TARGET' : 'STAFF TARGET'}
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 800,
                    bgcolor: timingInfo?.employment_type === 'internship' ? '#f3e8ff' : '#dcfce7',
                    color: timingInfo?.employment_type === 'internship' ? '#7e22ce' : '#15803d'
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ fontWeight: 800, color: isGoalReached ? '#15803d' : '#0284c7' }}>
                {formatHoursAndMinutes(elapsedHours)} / {targetNeededHours}h needed ({progressPercent}%)
              </Typography>
            </Box>

            {/* Visual Progress Bar */}
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: isGoalReached ? '#10b981' : (timingInfo?.employment_type === 'internship' ? '#a855f7' : '#3b82f6')
                }
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                {isPunchedOut ? 'Shift Completed' : 'Tracking in real-time...'}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: isGoalReached ? '#15803d' : '#d97706' }}>
                {isGoalReached
                  ? `Target Completed! (+${formatHoursAndMinutes(elapsedHours - targetNeededHours)} extra)`
                  : `${formatHoursAndMinutes(remainingHours)} remaining to reach target`}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Punch In / Out Action Buttons */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <PunchInIcon />}
              onClick={handlePunchIn}
              disabled={actionLoading || (!isExempt && (loadingLocation || !geoStatus?.inside)) || !!attendance}
              sx={{
                py: { xs: 1.2, sm: 1.5 },
                fontWeight: 700,
                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                bgcolor: isWfh ? '#0284c7' : '#133829',
                '&:hover': { bgcolor: isWfh ? '#0369a1' : '#0b2319' },
                opacity: attendance ? 0.6 : 1
              }}
            >
              {attendance ? `Punched In at ${formatTime12h(attendance.login_time)}` : isAdmin ? 'Punch In (Executive Punch)' : isWfh ? 'Punch In (WFH Home)' : 'Punch In (Office GPS)'}
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              size="large"
              startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <PunchOutIcon />}
              onClick={handlePunchOut}
              disabled={actionLoading || (!isExempt && (loadingLocation || !geoStatus?.inside)) || !isPunchedIn || isPunchedOut}
              sx={{
                py: { xs: 1.2, sm: 1.5 },
                fontWeight: 700,
                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                borderWidth: 2,
                '&:hover': { borderWidth: 2 }
              }}
            >
              {isPunchedOut ? `Punched Out at ${formatTime12h(attendance.logout_time)}` : isAdmin ? 'Punch Out (Executive Punch)' : isWfh ? 'Punch Out (WFH Home)' : 'Punch Out (Office GPS)'}
            </Button>
          </Grid>
        </Grid>

        {/* Current Day Stats summary */}
        {attendance && (
          <Box
            sx={{
              mt: 2.5,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-around',
              textAlign: 'center'
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                LOGIN TIME
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {formatTime12h(attendance.login_time)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                STATUS
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: attendance.status === 'Late' ? 'warning.main' : 'success.main'
                }}
              >
                {attendance.status} {attendance.in_geofence === 'WFH' ? '(WFH)' : ''}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                TIME WORKED
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                {formatHoursAndMinutes(elapsedHours)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                DAILY TARGET
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isGoalReached ? '#15803d' : '#334155' }}>
                {targetNeededHours}h {isGoalReached ? '✓' : ''}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Regularization Prompt for edge cases */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            size="small"
            startIcon={<RegularizeIcon fontSize="small" />}
            onClick={() => setOpenRegularizeModal(true)}
            sx={{
              fontSize: { xs: 11, sm: 12 },
              fontWeight: 700,
              textTransform: 'none',
              color: '#64748b',
              '&:hover': { color: '#133829', bgcolor: '#f1f5f9' }
            }}
          >
            Missed punch or attendance issue? Request Regularization →
          </Button>
        </Box>
      </CardContent>

      <AttendanceRegularizationModal
        open={openRegularizeModal}
        onClose={() => setOpenRegularizeModal(false)}
        onSuccess={onRefresh}
      />
    </Card>
  );
}
