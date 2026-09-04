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
  daysCount = 7,
  netHours = '56.5',
  tasksCompleted = 12,
  leaveRemaining = 11,
  onViewAttendance,
  onViewTasks
}) {
  return (
    <Box sx={{ mb: 3.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
        Monthly Attendance & Activity Metrics
      </Typography>

      <Grid container spacing={2}>
        {/* Card 1: Blue Top Border */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              bgcolor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                bgcolor: '#3b82f6', // Royal Blue
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px'
              }
            }}
          >
            <CardContent sx={{ p: 2.5, pt: 3 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.04em' }}>
                TOTAL DAYS LOGGED
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', my: 1 }}>
                {daysCount}
              </Typography>
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
                  borderRadius: '4px'
                }}
              >
                View Attendance
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 2: Sky Blue Top Border */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              bgcolor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                bgcolor: '#0284c7', // Sky Blue
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px'
              }
            }}
          >
            <CardContent sx={{ p: 2.5, pt: 3 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.04em' }}>
                NET WORKING TIME
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', my: 1 }}>
                {netHours}<span style={{ fontSize: '1.2rem', fontWeight: 600 }}>h</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 1.2 }}>
                Total logged working time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3: Emerald Green Top Border */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              bgcolor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                bgcolor: '#10b981', // Emerald Green
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px'
              }
            }}
          >
            <CardContent sx={{ p: 2.5, pt: 3 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.04em' }}>
                TASKS COMPLETED
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', my: 1 }}>
                {tasksCompleted}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block', mt: 1.2 }}>
                Logged this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 4: Warm Amber Top Border */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              bgcolor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                bgcolor: '#f59e0b', // Amber Orange
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px'
              }
            }}
          >
            <CardContent sx={{ p: 2.5, pt: 3 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.04em' }}>
                LEAVES & PERMISSIONS
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', my: 1 }}>
                {leaveRemaining}<span style={{ fontSize: '1.2rem', fontWeight: 600 }}>d</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 1.2 }}>
                Annual quota remaining
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
