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
  MenuItem,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
  Avatar
} from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as PresentIcon,
  ExitToApp as LogoutIcon,
  Cancel as AbsentIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  AccessTime as TimeIcon,
  Assessment as TimesheetIcon
} from '@mui/icons-material';
import { adminAPI } from '../services/api';
import toast from '../utils/muiToast';

export default function LivePresenceBoard({ onSelectEmployeeTimesheet }) {
  const [boardData, setBoardData] = useState([]);
  const [counts, setCounts] = useState({ totalStaff: 0, present: 0, punchedOut: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [todayDate, setTodayDate] = useState('');

  const fetchLiveStatus = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getLiveStatus();
      if (res.data) {
        setBoardData(res.data.board || []);
        setCounts(res.data.counts || { totalStaff: 0, present: 0, punchedOut: 0, absent: 0 });
        setTodayDate(res.data.date || '');
      }
    } catch (err) {
      console.error('Failed to load live status:', err);
      toast.error('Failed to load live attendance presence board.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    // Auto-refresh every 30 seconds for live board
    const timer = setInterval(() => {
      adminAPI.getLiveStatus().then(res => {
        if (res.data) {
          setBoardData(res.data.board || []);
          setCounts(res.data.counts || { totalStaff: 0, present: 0, punchedOut: 0, absent: 0 });
        }
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const allDepartments = Array.from(
    new Set(boardData.map(b => b.department).filter(Boolean))
  ).sort();

  const filteredBoard = boardData.filter(item => {
    if (filterDepartment !== 'ALL' && item.department !== filterDepartment) return false;
    if (filterStatus === 'PRESENT' && item.statusToday !== 'Present & Working') return false;
    if (filterStatus === 'PUNCHED_OUT' && item.statusToday !== 'Punched Out') return false;
    if (filterStatus === 'ABSENT' && item.statusToday !== 'Absent') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const match =
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q)) ||
        (item.designation && item.designation.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <Box>
      {/* Header Banner */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', mb: 3, bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                bgcolor: '#133829',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PeopleIcon />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Live Office Attendance & Presence Board
                </Typography>
                <Chip
                  size="small"
                  label="LIVE TODAY"
                  sx={{ fontWeight: 800, bgcolor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', height: 22, fontSize: 10 }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Real-time check-in, check-out, and active presence monitor across all employees {todayDate && `(${todayDate})`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchLiveStatus}
              disabled={loading}
              sx={{ fontWeight: 700, borderRadius: '8px', textTransform: 'none', borderColor: '#cbd5e1', color: '#334155' }}
            >
              {loading ? 'Refreshing...' : 'Refresh Live Status'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 4 KPI Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: '10px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Active Staff
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', my: 0.5 }}>
                {counts.totalStaff}
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                All registered employees
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: '10px', border: '1px solid #86efac', bgcolor: '#f0fdf4' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Present & Working
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#15803d', my: 0.5 }}>
                {counts.present}
              </Typography>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                Currently logged in
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: '10px', border: '1px solid #bae6fd', bgcolor: '#f0f9ff' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Punched Out
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0284c7', my: 0.5 }}>
                {counts.punchedOut}
              </Typography>
              <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 600 }}>
                Completed workday
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: '10px', border: '1px solid #fed7aa', bgcolor: '#fffbeb' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Absent / Not Punched
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#b45309', my: 0.5 }}>
                {counts.absent}
              </Typography>
              <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
                Not checked in today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter & Search Toolbar */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', mb: 3, bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search staff by name, email, employee ID, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#64748b', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ bgcolor: '#f8fafc', borderRadius: '8px' }}
              />
            </Grid>

            <Grid item xs={6} sm={3} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Department"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                sx={{ bgcolor: '#f8fafc', borderRadius: '8px' }}
              >
                <MenuItem value="ALL">All Departments</MenuItem>
                {allDepartments.map(d => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6} sm={3} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Presence Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ bgcolor: '#f8fafc', borderRadius: '8px' }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PRESENT">Present & Working</MenuItem>
                <MenuItem value="PUNCHED_OUT">Punched Out</MenuItem>
                <MenuItem value="ABSENT">Absent / Not Punched</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Live Table */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', bgcolor: '#ffffff', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={36} sx={{ color: '#133829' }} />
            <Typography variant="body2" sx={{ color: '#64748b', mt: 1.5, fontWeight: 600 }}>
              Fetching real-time attendance presence records...
            </Typography>
          </Box>
        ) : filteredBoard.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PeopleIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#475569' }}>
              No staff members match the current filter criteria
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Try clearing your search query or changing the department filter.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem' }}>EMPLOYEE</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem' }}>DEPARTMENT & ROLE</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem' }}>TODAY STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem' }}>PUNCH IN</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem' }}>PUNCH OUT</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem' }}>NET HOURS</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '0.8rem', textAlign: 'right' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBoard.map((row) => {
                  const isPresent = row.statusToday === 'Present & Working';
                  const isPunchedOut = row.statusToday === 'Punched Out';

                  return (
                    <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: isPresent ? '#133829' : (isPunchedOut ? '#0284c7' : '#e2e8f0'),
                              color: isPresent || isPunchedOut ? '#ffffff' : '#64748b',
                              fontWeight: 700,
                              fontSize: 14
                            }}
                          >
                            {row.name?.charAt(0)?.toUpperCase() || 'U'}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                {row.name}
                              </Typography>
                              <Chip
                                label={row.id}
                                size="small"
                                sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569' }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {row.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                          {row.designation || 'Staff'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {row.department || 'General'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {isPresent && (
                          <Chip
                            icon={<PresentIcon sx={{ fontSize: '16px !important' }} />}
                            label="Present & Working"
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}
                          />
                        )}
                        {isPunchedOut && (
                          <Chip
                            icon={<LogoutIcon sx={{ fontSize: '16px !important' }} />}
                            label="Punched Out"
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' }}
                          />
                        )}
                        {!isPresent && !isPunchedOut && (
                          <Chip
                            icon={<AbsentIcon sx={{ fontSize: '16px !important' }} />}
                            label="Absent"
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: row.loginTime ? '#0f172a' : '#94a3b8' }}>
                          {row.loginTime || '--'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: row.logoutTime ? '#0f172a' : '#94a3b8' }}>
                          {row.logoutTime || '--'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon sx={{ fontSize: 16, color: '#64748b' }} />
                          <Typography variant="body2" sx={{ fontWeight: 800, color: parseFloat(row.netHours) > 0 ? '#133829' : '#94a3b8' }}>
                            {row.netHours} hrs
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ textAlign: 'right' }}>
                        {onSelectEmployeeTimesheet && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<TimesheetIcon sx={{ fontSize: 15 }} />}
                            onClick={() => onSelectEmployeeTimesheet(row.id)}
                            sx={{
                              fontWeight: 700,
                              borderRadius: '8px',
                              fontSize: 11,
                              textTransform: 'none',
                              color: '#133829',
                              borderColor: '#cbd5e1',
                              '&:hover': { bgcolor: '#f0fdf4', borderColor: '#86efac' }
                            }}
                          >
                            Timesheet
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>
    </Box>
  );
}
