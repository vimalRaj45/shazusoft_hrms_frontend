import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  LocationOn as GpsIcon,
  Storage as CloudIcon,
  PlaylistAddCheck as TasksIcon,
  AssignmentTurnedIn as AppraisalIcon,
  ArrowForward as ArrowRightIcon,
  Email as MailIcon,
  CheckCircle as VerifyIcon,
  Refresh as ResendIcon
} from '@mui/icons-material';
import toast from '../utils/muiToast';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function Login() {
  const { loginWithOTP } = useAuth();

  // OTP Login State
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState(''); // DEV_TESTING_OTP: Remove in production
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle Send OTP
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.trim()) {
      toast.error('Please enter your work email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.sendOTP({ email: email.trim() });
      toast.success(res.data.message || `Verification code sent to ${email}!`);
      // DEV_TESTING_OTP: Capture OTP from response for UI testing. Remove in production.
      if (res.data.dev_otp) {
        setDevOtp(res.data.dev_otp);
        setOtpCode(res.data.dev_otp); // Auto-fill for ultra fast testing
      }
      setStep(2);
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deliver verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      await loginWithOTP(email.trim(), otpCode.trim());
      toast.success('Signed in successfully. Welcome to your workspace!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const featurePills = [
    { icon: <GpsIcon sx={{ fontSize: 16 }} />, title: 'Workplace Verified', desc: 'Secure location-based attendance check-in' },
    { icon: <CloudIcon sx={{ fontSize: 16 }} />, title: 'Cloud Data Records', desc: 'Real-time company database synchronization' },
    { icon: <TasksIcon sx={{ fontSize: 16 }} />, title: 'Task Assign & Track', desc: 'Full delegation workflow with live progress updates' },
    { icon: <AppraisalIcon sx={{ fontSize: 16 }} />, title: 'Annual Appraisal', desc: 'Comprehensive monthly self-evaluation portal' }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: { md: '100vh' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f1f5f9',
        p: { xs: 1.5, sm: 2, md: 3 },
        position: 'relative',
        overflowY: 'auto'
      }}
    >
      {/* Background Decorative Gradient Orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(19, 56, 41, 0.15) 0%, rgba(2, 132, 199, 0.05) 70%, transparent 100%)',
          filter: 'blur(60px)',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          right: '-5%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(19, 56, 41, 0.08) 70%, transparent 100%)',
          filter: 'blur(70px)',
          zIndex: 0
        }}
      />

      {/* Main Split-Screen Container */}
      <Card
        sx={{
          width: '100%',
          maxWidth: { xs: 440, sm: 500, md: 940 },
          maxHeight: { xs: 'none', md: '92vh' },
          borderRadius: '4px',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08), 0 4px 16px rgba(15, 23, 42, 0.04)',
          backdropFilter: 'blur(20px)',
          bgcolor: 'rgba(255, 255, 255, 0.96)',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden'
        }}
      >
        <Grid container sx={{ height: '100%' }}>
          {/* LEFT SIDE: Brand Showcase Panel (Hidden on Mobile) */}
          <Grid
            item
            xs={12}
            md={5.2}
            sx={{
              display: { xs: 'none', md: 'flex' },
              bgcolor: '#133829', // Deep Forest Green
              color: '#ffffff',
              p: 3.5,
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 250,
                height: 250,
                borderRadius: '50%',
                background: 'rgba(52, 211, 153, 0.18)',
                filter: 'blur(40px)'
              }}
            />

            {/* Top Brand Emblem */}
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  component="img"
                  src="/logo.png"
                  alt="Shazu Soft Logo"
                  sx={{
                    width: 44,
                    height: 44,
                    objectFit: 'contain',
                    bgcolor: '#ffffff',
                    borderRadius: '4px',
                    p: 0.5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#ffffff', fontSize: '1.05rem' }}>
                    SHAZU SOFT
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontWeight: 700, letterSpacing: '0.08em', fontSize: 10 }}>
                    HRMS PORTAL 2026
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', mb: 1.2, lineHeight: 1.25 }}>
                Enterprise Staff Presence & Work Tracking
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5, mb: 3, fontSize: '0.85rem' }}>
                Secure corporate workspace with location check-in verification, live database synchronization, and task tracking.
              </Typography>

              {/* Feature Showcase Cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {featurePills.map((f, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.2,
                      borderRadius: '4px',
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Box sx={{ color: '#34d399', display: 'flex' }}>{f.icon}</Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.825rem' }}>
                        {f.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.725rem' }}>
                        {f.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Bottom Status Indicator */}
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1, position: 'relative', zIndex: 2 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 700, fontSize: 10.5 }}>
                Live Cloud Sync Active • Secure Corporate Mail Authentication
              </Typography>
            </Box>
          </Grid>

          {/* RIGHT SIDE: Pure OTP Authentication Form (Only form on mobile) */}
          <Grid
            item
            xs={12}
            md={6.8}
            sx={{
              p: { xs: 3, sm: 4, md: 4.5 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.98)'
            }}
          >
            {/* Mobile-Only Header with Official Logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box
                component="img"
                src="/logo.png"
                alt="Shazu Soft Logo"
                sx={{
                  width: 42,
                  height: 42,
                  objectFit: 'contain',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#0f172a', fontSize: '1.05rem' }}>
                  SHAZU SOFT
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.08em', fontSize: 10 }}>
                  HRMS PORTAL 2026
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5, fontSize: { xs: '1.25rem', md: '1.4rem' } }}>
                Sign In with One-Time Password
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Enter your registered work email to receive a secure 6-digit login verification code.
              </Typography>
            </Box>

            {/* STEP 1: Enter Email */}
            {step === 1 ? (
              <form onSubmit={handleSendOTP}>
                <Box sx={{ mb: 2.5 }}>
                  <TextField
                    fullWidth
                    label="Work Email Address"
                    type="email"
                    required
                    size="small"
                    placeholder="e.g. vimalraj5207@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MailIcon fontSize="small" sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '4px',
                        bgcolor: '#ffffff'
                      }
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowRightIcon />}
                  sx={{
                    py: 1.2,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    borderRadius: '4px',
                    bgcolor: '#133829',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(19, 56, 41, 0.2)',
                    '&:hover': { bgcolor: '#0b2319' }
                  }}
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
              </form>
            ) : (
              /* STEP 2: Enter OTP */
              <form onSubmit={handleVerifyOTP}>
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600, display: 'block' }}>
                      Verification code sent to:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#15803d' }}>
                      {email}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => {
                      setStep(1);
                      setOtpCode('');
                      setDevOtp('');
                    }}
                    sx={{ fontSize: 11, fontWeight: 700, textTransform: 'none', color: '#15803d' }}
                  >
                    Change
                  </Button>
                </Box>

                {/* DEV_TESTING_OTP: Development Testing Helper - Remove in production */}
                {devOtp && (
                  <Box
                    onClick={() => setOtpCode(devOtp)}
                    sx={{
                      mb: 2,
                      p: 1.5,
                      bgcolor: '#eff6ff',
                      border: '1px dashed #3b82f6',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: '#dbeafe', borderColor: '#2563eb' }
                    }}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 800, display: 'block', fontSize: 10, letterSpacing: '0.04em' }}>
                        DEV TESTING OTP CODE:
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#1d4ed8', fontWeight: 900, letterSpacing: '3px', fontFamily: 'monospace', lineHeight: 1.2 }}>
                        {devOtp}
                      </Typography>
                    </Box>
                    <Chip
                      label="Auto-Filled"
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 800, borderRadius: '4px', height: 22, fontSize: 10 }}
                    />
                  </Box>
                )}

                <Box sx={{ mb: 2.5 }}>
                  <TextField
                    fullWidth
                    label="6-Digit Verification Code"
                    required
                    size="small"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputProps={{
                      maxLength: 6,
                      style: {
                        textAlign: 'center',
                        letterSpacing: '8px',
                        fontWeight: 900,
                        fontSize: '1.25rem'
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '4px',
                        bgcolor: '#ffffff'
                      }
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || otpCode.length < 6}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <VerifyIcon />}
                  sx={{
                    py: 1.2,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    borderRadius: '4px',
                    bgcolor: '#133829',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(19, 56, 41, 0.2)',
                    '&:hover': { bgcolor: '#0b2319' }
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Access Workspace'}
                </Button>

                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 1 }}>
                  {countdown > 0 ? (
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Resend code in <strong>{countdown}s</strong>
                    </Typography>
                  ) : (
                    <Button
                      size="small"
                      startIcon={<ResendIcon fontSize="small" />}
                      onClick={handleSendOTP}
                      disabled={loading}
                      sx={{ fontSize: 12, fontWeight: 700, textTransform: 'none', color: '#133829' }}
                    >
                      Resend Verification Code
                    </Button>
                  )}
                </Box>
              </form>
            )}

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 11 }}>
                Protected by Encrypted Email Delivery & Location Verified Access.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}
