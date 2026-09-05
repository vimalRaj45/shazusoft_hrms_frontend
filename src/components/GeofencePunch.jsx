import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
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
  WorkOutline as WorkIcon
} from '@mui/icons-material';
import confetti from 'canvas-confetti';
import toast from '../utils/muiToast';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AttendanceRegularizationModal from './AttendanceRegularizationModal';
import { formatTime12h } from '../utils/timeUtils';

export default function GeofencePunch({ todayData, onRefresh }) {
  const { user } = useAuth();
  const isWfh = user?.work_mode === 'wfh';

  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(!isWfh);
  const [actionLoading, setActionLoading] = useState(false);
  const [openRegularizeModal, setOpenRegularizeModal] = useState(false);
  const [todayHoliday, setTodayHoliday] = useState(null); // null = not a holiday, object = holiday info
  const [isTodaySunday] = useState(() => new Date().getDay() === 0);

  // Fetch holidays to check if today is a holiday or a Working Sunday
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    attendanceAPI.getHolidays().then(res => {
      const holidays = res?.data?.holidays || [];
      const match = holidays.find(h => h.date === todayStr);
      if (match) setTodayHoliday(match);
    }).catch(() => {}); // silently ignore
  }, []);

  const captureLocation = () => {
    if (isWfh) {
      // In WFH mode, we try to capture coords if easily available, but do not block user
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
    if (!isWfh && !coords) {
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
    if (!isWfh && !coords) {
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

  // Determine if today is a configured Working Sunday override
  const isWorkingSunday = isTodaySunday && todayHoliday && (
    todayHoliday.type === 'Working Sunday' ||
    todayHoliday.name?.toLowerCase().includes('working')
  );

  // ── Non-working day banner (Shown only if it is a non-working Sunday or non-working holiday) ──
  if ((isTodaySunday && !isWorkingSunday) || (todayHoliday && !isWorkingSunday && todayHoliday.type !== 'Working Sunday')) {
    const label = isTodaySunday ? 'Sunday' : todayHoliday?.name || 'Holiday';
    const subtitle = isTodaySunday
      ? 'Today is Sunday — official non-working day.'
      : `Today is a scheduled company holiday: "${todayHoliday?.name}" (${todayHoliday?.type || 'Holiday'}). No check-in required.`;
    return (
      <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
        <Box sx={{ height: 4, bgcolor: '#8b5cf6' }} />
        <CardContent sx={{ p: { xs: 2.5, sm: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, textAlign: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.5, bgcolor: '#f3e8ff', borderRadius: '50%', color: '#7c3aed', display: 'flex' }}>
            <EventIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#6d28d9' }}>{label} — Non-Working Day</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 360 }}>{subtitle}</Typography>
          <Chip label="No check-in required" size="small" sx={{ fontWeight: 700, bgcolor: '#ede9fe', color: '#6d28d9', borderRadius: '4px', mt: 0.5 }} />
        </CardContent>
      </Card>
    );
  }
  // ───────────────────────────────────────────────────────────

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
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
            {isWfh ? <HomeIcon color="secondary" /> : <LocationIcon color="primary" />}
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {isWfh ? 'Work From Home (WFH) Attendance' : 'Office Location Attendance'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isWorkingSunday && (
              <Chip
                label="Working Sunday Active"
                size="small"
                sx={{ fontWeight: 700, bgcolor: '#dcfce7', color: '#15803d', borderRadius: '4px' }}
              />
            )}
            {!isWfh && (
              <Tooltip title="Refresh Location">
                <span>
                  <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={captureLocation}
                    disabled={loadingLocation}
                    sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
                  >
                    Refresh
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Status Box: WFH Mode vs Office GPS */}
        {isWfh ? (
          <Box
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: '4px',
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
              sx={{ fontWeight: 800, borderRadius: '4px', fontSize: 10 }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: '4px',
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
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {loadingLocation
                    ? 'Detecting work location...'
                    : geoStatus?.inside
                    ? 'Inside Office Premises'
                    : 'Outside Office Location'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {coords
                    ? `Distance: ${geoStatus?.distanceMeters ?? '--'}m (Allowed: ${geoStatus?.allowedRadiusMeters ?? 150}m)`
                    : 'Waiting for location check...'}
                </Typography>
              </Box>
            </Box>

            <Chip
              size="small"
              label={geoStatus?.inside ? 'VERIFIED' : 'LOCATION CHECK REQUIRED'}
              color={geoStatus?.inside ? 'success' : 'error'}
              sx={{ fontWeight: 700, borderRadius: '4px' }}
            />
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
              disabled={actionLoading || (!isWfh && (loadingLocation || !geoStatus?.inside)) || !!attendance}
              sx={{
                py: { xs: 1.2, sm: 1.5 },
                fontWeight: 700,
                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                bgcolor: isWfh ? '#0284c7' : '#133829',
                '&:hover': { bgcolor: isWfh ? '#0369a1' : '#0b2319' },
                opacity: attendance ? 0.6 : 1
              }}
            >
              {attendance ? `Punched In at ${formatTime12h(attendance.login_time)}` : isWfh ? 'Punch In (WFH Home)' : 'Punch In (Office GPS)'}
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
              disabled={actionLoading || (!isWfh && (loadingLocation || !geoStatus?.inside)) || !isPunchedIn || isPunchedOut}
              sx={{
                py: { xs: 1.2, sm: 1.5 },
                fontWeight: 700,
                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                borderWidth: 2,
                '&:hover': { borderWidth: 2 }
              }}
            >
              {isPunchedOut ? `Punched Out at ${formatTime12h(attendance.logout_time)}` : isWfh ? 'Punch Out (WFH Home)' : 'Punch Out (Office GPS)'}
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
                NET HOURS
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                {attendance.net_hours ? `${attendance.net_hours}h` : 'In Progress'}
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
