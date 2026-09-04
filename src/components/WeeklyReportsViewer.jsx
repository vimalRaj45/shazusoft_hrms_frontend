import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  Divider,
  IconButton
} from '@mui/material';
import {
  DateRange as WeekIcon,
  EmojiEvents as TrophyIcon,
  ReportProblemOutlined as BlockerIcon,
  LightbulbOutlined as LightbulbIcon,
  TrendingUp as NextGoalIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Add as AddIcon
} from '@mui/icons-material';

export default function WeeklyReportsViewer({ reports = [], onNewReport, isAdmin = false }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.employee_name?.toLowerCase().includes(q) ||
      r.week_label?.toLowerCase().includes(q) ||
      r.accomplishments?.toLowerCase().includes(q) ||
      r.challenges_blockers?.toLowerCase().includes(q)
    );
  });

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="Search by employee, week, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', sm: 300 }, '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
          />
          <Chip
            label={`${filteredReports.length} Report(s)`}
            size="small"
            sx={{ fontWeight: 700, borderRadius: '4px', bgcolor: '#f1f5f9' }}
          />
        </Box>

        {onNewReport && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewReport}
            sx={{
              borderRadius: '4px',
              bgcolor: '#133829',
              color: '#ffffff',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: '#0f291e' }
            }}
          >
            Submit This Week's Check-in
          </Button>
        )}
      </Box>

      {filteredReports.length === 0 ? (
        <Card sx={{ borderRadius: '4px', border: '1px dashed #cbd5e1', bgcolor: '#f8fafc', p: 4, textAlign: 'center' }}>
          <WeekIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#475569' }}>
            No Weekly Check-in Reports Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, mb: 2 }}>
            Weekly reports are fast, lightweight summaries of key accomplishments, blockers, and next week goals.
          </Typography>
          {onNewReport && (
            <Button
              variant="outlined"
              color="success"
              onClick={onNewReport}
              sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 700 }}
            >
              Submit Your First Weekly Report
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {filteredReports.map((report) => (
            <Grid item xs={12} key={report.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: '#cbd5e1', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }
                }}
              >
                {/* Card Header */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '4px',
                        bgcolor: 'rgba(19, 56, 41, 0.1)',
                        color: '#133829',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <WeekIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {report.week_label || `Week ${report.week_number}`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {report.employee_name} ({report.department || 'Operations'}) • Submitted on {report.submission_date}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label="Weekly Sync"
                    size="small"
                    color="success"
                    sx={{ fontWeight: 700, borderRadius: '4px', fontSize: 11 }}
                  />
                </Box>

                {/* 4 Pillars Grid */}
                <CardContent sx={{ p: 2.5 }}>
                  <Grid container spacing={2}>
                    {/* 1. Key Accomplishments */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <TrophyIcon sx={{ color: '#16a34a', fontSize: 18 }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Key Accomplishments & Completed Tasks
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#14532d', whiteSpace: 'pre-line', fontSize: '0.88rem', lineHeight: 1.6 }}>
                          {report.accomplishments}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* 2. Challenges & Blockers */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 1.5, bgcolor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '4px', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <BlockerIcon sx={{ color: '#dc2626', fontSize: 18 }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Challenges, Blockers & Issues
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#7f1d1d', whiteSpace: 'pre-line', fontSize: '0.88rem', lineHeight: 1.6 }}>
                          {report.challenges_blockers}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* 3. Learnings & Skills */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 1.5, bgcolor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '4px', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <LightbulbIcon sx={{ color: '#d97706', fontSize: 18 }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Key Learnings & Applied Skills
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#78350f', whiteSpace: 'pre-line', fontSize: '0.88rem', lineHeight: 1.6 }}>
                          {report.learnings_skills || 'Standard operational workflows executed.'}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* 4. Next Week Goals */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 1.5, bgcolor: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '4px', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <NextGoalIcon sx={{ color: '#2563eb', fontSize: 18 }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Top Priorities & Goals for Next Week
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#1e3a8a', whiteSpace: 'pre-line', fontSize: '0.88rem', lineHeight: 1.6 }}>
                          {report.next_week_goals}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
