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
  Login as PunchInIcon,
  Logout as PunchOutIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  HelpOutline as RegularizeIcon
} from '@mui/icons-material';
import confetti from 'canvas-confetti';
import toast from '../utils/muiToast';
import { attendanceAPI } from '../services/api';
import AttendanceRegularizationModal from './AttendanceRegularizationModal';

export default function GeofencePunch({ todayData, onRefresh }) {
  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [openRegularizeModal, setOpenRegularizeModal] = useState(false);
  const [todayHoliday, setTodayHoliday] = useState(null); // null = not a holiday, object = holiday info
  const [isTodaySunday] = useState(() => new Date().getDay() === 0);

  // Fetch holidays to check if today is a holiday
  useEffect(() => {
    if (isTodaySunday) return; // Already blocked for Sunday
    const todayStr = new Date().toISOString().slice(0, 10);
    attendanceAPI.getHolidays().then(res => {
      const holidays = res?.data?.holidays || [];
      const match = holidays.find(h => h.date === todayStr);
      if (match) setTodayHoliday(match);
    }).catch(() => {}); // silently ignore
  }, [isTodaySunday]);

  const captureLocation = () => {
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
    const interval = setInterval(captureLocation, 60000);
    return () => clearInterval(interval);
  }, []);

  const handlePunchIn = async () => {
    if (!coords) {
      toast.error('Please wait for GPS location to be detected.');
      return;
    }
    setActionLoading(true);

    try {
      const res = await attendanceAPI.punchIn({
        lat: coords.lat,
        lng: coords.lng
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
    if (!coords) {
      toast.error('Please wait for GPS location to be detected.');
      return;
    }
    setActionLoading(true);

    try {
      const res = await attendanceAPI.punchOut({
        lat: coords.lat,
        lng: coords.lng
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

  // ── Non-working day banner ──────────────────────────────────
  if (isTodaySunday || todayHoliday) {
    const label = isTodaySunday ? 'Sunday' : todayHoliday?.name || 'Holiday';
    const subtitle = isTodaySunday
      ? 'Today is Sunday — enjoy your well-deserved rest!'
      : `Today is a company holiday: "${todayHoliday?.name}" (${todayHoliday?.type || 'Holiday'}). No check-in required.`;
    return (
      <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ height: 5, background: 'linear-gradient(90deg, #8b5cf6, #a855f7)' }} />
        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, textAlign: 'center', gap: 1.5 }}>
          <Typography variant="h2" sx={{ lineHeight: 1 }}>🎉</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#6d28d9' }}>{label} — Non-Working Day</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 340 }}>{subtitle}</Typography>
          <Chip label="No check-in required" size="small" sx={{ fontWeight: 700, bgcolor: '#ede9fe', color: '#6d28d9', borderRadius: '4px', mt: 1 }} />
        </CardContent>
      </Card>
    );
  }
  // ───────────────────────────────────────────────────────────

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative gradient bar */}
      <Box
        sx={{
          height: 5,
          background: isPunchedIn
            ? 'linear-gradient(90deg, #10b981, #06b6d4)'
            : 'linear-gradient(90deg, #6366f1, #a855f7)'
        }}
      />
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Office Location Attendance
            </Typography>
          </Box>
          <Tooltip title="Refresh Location">
            <span>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={captureLocation}
                disabled={loadingLocation}
                sx={{ color: 'text.secondary' }}
              >
                Refresh
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* GPS Location Status Box */}
        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '4px',
            backgroundColor: geoStatus?.inside ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: geoStatus?.inside ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
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
              disabled={actionLoading || loadingLocation || !geoStatus?.inside || !!attendance}
              sx={{
                py: 1.6,
                fontWeight: 700,
                fontSize: '1rem',
                opacity: attendance ? 0.6 : 1
              }}
            >
              {attendance ? `Punched In at ${attendance.login_time}` : 'Punch In (GPS)'}
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
              disabled={actionLoading || loadingLocation || !isPunchedIn || isPunchedOut || !geoStatus?.inside}
              sx={{
                py: 1.6,
                fontWeight: 700,
                fontSize: '1rem',
                borderWidth: 2,
                '&:hover': { borderWidth: 2 }
              }}
            >
              {isPunchedOut ? `Punched Out at ${attendance.logout_time}` : 'Punch Out (GPS)'}
            </Button>
          </Grid>
        </Grid>

        {/* Current Day Stats summary */}
        {attendance && (
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-around',
              textAlign: 'center'
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                LOGIN TIME
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {attendance.login_time || '--:--'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                STATUS
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: attendance.status === 'Late' ? 'warning.main' : 'success.main'
                }}
              >
                {attendance.status}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                NET HOURS
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {attendance.net_hours ? `${attendance.net_hours}h` : 'In Progress'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Regularization Prompt for edge cases */}
        <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'center' }}>
          <Button
            size="small"
            startIcon={<RegularizeIcon fontSize="small" />}
            onClick={() => setOpenRegularizeModal(true)}
            sx={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'none',
              color: '#64748b',
              '&:hover': { color: '#133829', bgcolor: '#f1f5f9' }
            }}
          >
            Missed punch or GPS issue? Request Regularization →
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
