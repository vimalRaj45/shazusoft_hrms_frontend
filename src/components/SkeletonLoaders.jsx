import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';

/**
 * Shimmering skeleton for 4 KPI Metric Cards
 */
export function MetricCardsSkeleton() {
  return (
    <Box sx={{ mb: 3.5 }}>
      <Skeleton variant="text" width={240} height={28} sx={{ mb: 2, borderRadius: '4px' }} />
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ border: '1px solid #e5e7eb', borderRadius: '4px', bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
              <CardContent sx={{ p: 2.5, pt: 3 }}>
                <Skeleton variant="text" width="60%" height={16} sx={{ borderRadius: '4px' }} />
                <Skeleton variant="text" width="40%" height={48} sx={{ my: 1, borderRadius: '4px' }} />
                <Skeleton variant="rectangular" width="70%" height={24} sx={{ borderRadius: '4px' }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/**
 * Shimmering skeleton for Task Tracker Table
 */
export function TaskTrackerSkeleton() {
  return (
    <Card sx={{ border: '1px solid #e5e7eb', borderRadius: '4px', bgcolor: '#ffffff' }}>
      <CardContent sx={{ p: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell><Skeleton variant="text" width={100} height={18} /></TableCell>
              <TableCell><Skeleton variant="text" width={80} height={18} /></TableCell>
              <TableCell><Skeleton variant="text" width={60} height={18} /></TableCell>
              <TableCell><Skeleton variant="text" width={70} height={18} /></TableCell>
              <TableCell><Skeleton variant="text" width={90} height={18} /></TableCell>
              <TableCell><Skeleton variant="text" width={60} height={18} /></TableCell>
              <TableCell align="right"><Skeleton variant="text" width={70} height={18} sx={{ ml: 'auto' }} /></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map((idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Skeleton variant="text" width="80%" height={20} sx={{ borderRadius: '4px' }} />
                  <Skeleton variant="rectangular" width={70} height={16} sx={{ mt: 0.5, borderRadius: '4px' }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: '4px' }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={80} height={18} sx={{ borderRadius: '4px' }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width="90%" height={8} sx={{ borderRadius: '4px' }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={60} height={18} sx={{ borderRadius: '4px' }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={70} height={22} sx={{ borderRadius: '4px' }} />
                </TableCell>
                <TableCell align="right">
                  <Skeleton variant="rectangular" width={90} height={26} sx={{ ml: 'auto', borderRadius: '4px' }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/**
 * Generic Table Rows Skeleton
 */
export function TableRowsSkeleton({ rows = 4, cols = 6 }) {
  return (
    <Box sx={{ overflowX: 'auto', p: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f8fafc' }}>
            {Array.from({ length: cols }).map((_, c) => (
              <TableCell key={c}><Skeleton variant="text" width="70%" height={18} /></TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <TableCell key={c}>
                  <Skeleton variant="text" width={c === 0 ? '85%' : '65%'} height={20} sx={{ borderRadius: '4px' }} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

/**
 * Geofence Attendance Skeleton
 */
export function GeofenceSkeleton() {
  return (
    <Card sx={{ border: '1px solid #e5e7eb', borderRadius: '4px', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="text" width={180} height={24} sx={{ borderRadius: '4px' }} />
          <Skeleton variant="rectangular" width={50} height={24} sx={{ borderRadius: '4px' }} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 3, borderRadius: '4px' }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Skeleton variant="rectangular" width="100%" height={44} sx={{ borderRadius: '4px' }} />
          </Grid>
          <Grid item xs={6}>
            <Skeleton variant="rectangular" width="100%" height={44} sx={{ borderRadius: '4px' }} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

/**
 * Document Viewer Skeleton (for Performance Report / Appraisal Sheet)
 */
export function DocumentViewerSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 2.5, borderRadius: '4px' }} />
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={3}><Skeleton variant="rectangular" width="100%" height={70} sx={{ borderRadius: '4px' }} /></Grid>
        <Grid item xs={3}><Skeleton variant="rectangular" width="100%" height={70} sx={{ borderRadius: '4px' }} /></Grid>
        <Grid item xs={3}><Skeleton variant="rectangular" width="100%" height={70} sx={{ borderRadius: '4px' }} /></Grid>
        <Grid item xs={3}><Skeleton variant="rectangular" width="100%" height={70} sx={{ borderRadius: '4px' }} /></Grid>
      </Grid>
      <Skeleton variant="rectangular" width="100%" height={240} sx={{ borderRadius: '4px' }} />
    </Box>
  );
}
