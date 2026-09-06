import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button
} from '@mui/material';
import {
  ArrowForward as ArrowRightIcon
} from '@mui/icons-material';

export default function MetricCards({
  daysCount = 0,
  netHours = '0',
  tasksCompleted = 0,
  leaveRemaining = 0,
  onViewAttendance,
  onViewTasks
}) {
  return (
    <Box sx={{ mb: 3.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
        Monthly Attendance & Activity Metrics
      </Typography>

      <Grid container spacing={2} alignItems="stretch">
        {/* Card 1: Blue Top Border */}
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                bgcolor: '#3b82f6', // Royal Blue
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px'
              }
            }}
          >
            <CardContent sx={{ p: 2.5, pt: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.04em', minHeight: 20, display: 'flex', alignItems: 'center' }}>
                  TOTAL DAYS LOGGED
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', my: 1 }}>
                  {daysCount}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={onViewAttendance}
                endIcon={<ArrowRightIcon sx={{ fontSize: 14 }} />}
                sx={{
                  mt: 0.5,
                  fontSize: 12,
                  fontWeight: 700,
                  borderColor: '#e5e7eb',
                  color: '#0f172a',
                  py: 0.4,
                  borderRadius: '8px',
                  alignSelf: 'flex-start'
                }}
              >
                View Attendance
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 2: Sky Blue Top Border */}
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                bgcolor: '#0284c7', // Sky Blue
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px'
              }
            }}
          >
            <CardContent sx={{ p: 2.5, pt: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.04em', minHeight: 20, display: 'flex', alignItems: 'center' }}>
                  NET WORKING TIME
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', my: 1 }}>
                  {netHours}<span style={{ fontSize: '1.2rem', fontWeight: 600 }}>h</span>
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 1.2 }}>
                Total logged working time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3: Emerald Green Top Border */}
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                bgcolor: '#10b981', // Emerald Green
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px'
              }
            }}
          >
            <CardContent sx={{ p: 2.5, pt: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.04em', minHeight: 20, display: 'flex', alignItems: 'center' }}>
                  TASKS COMPLETED
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', my: 1 }}>
                  {tasksCompleted}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block', mt: 1.2 }}>
                Logged this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 4: Warm Amber Top Border */}
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                bgcolor: '#f59e0b', // Amber Orange
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px'
              }
            }}
          >
            <CardContent sx={{ p: 2.5, pt: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.04em', minHeight: 20, display: 'flex', alignItems: 'center' }}>
                  LEAVES & PERMISSIONS
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', my: 1 }}>
                  {leaveRemaining}<span style={{ fontSize: '1.2rem', fontWeight: 600 }}>d</span>
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 1.2 }}>
                Monthly quota remaining
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
