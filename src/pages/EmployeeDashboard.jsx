import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  Assessment as ReportIcon,
  AssignmentTurnedIn as EvalIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, reportsAPI, evaluationsAPI } from '../services/api';
import GeofencePunch from '../components/GeofencePunch';
import WorkDoneSection from '../components/WorkDoneSection';
import LeavesSection from '../components/LeavesSection';
import EmployeeReportViewer from '../components/EmployeeReportViewer';
import MonthlySelfEvaluationModal from '../components/MonthlySelfEvaluationModal';
import SelfEvaluationViewer from '../components/SelfEvaluationViewer';
import { DocumentViewerSkeleton } from '../components/SkeletonLoaders';
import { format } from 'date-fns';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);

  // Full Personal Monthly Report Modal (Without AI)
  const [openReportModal, setOpenReportModal] = useState(false);
  const [reportMonth, setReportMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [fullReportData, setFullReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Monthly Self-Evaluation Form & Viewer
  const [openEvalModal, setOpenEvalModal] = useState(false);
  const [myEvaluations, setMyEvaluations] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [openEvalViewerModal, setOpenEvalViewerModal] = useState(false);

  const fetchTodayData = async () => {
    try {
      const res = await attendanceAPI.getToday();
      setTodayData(res.data);
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await attendanceAPI.getMyHistory();
      setHistoryRecords(res.data.records || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const fetchMyEvaluations = async () => {
    try {
      const res = await evaluationsAPI.getMyEvaluations();
      setMyEvaluations(res.data.evaluations || []);
    } catch (err) {
      console.error('Error fetching evaluations:', err);
    }
  };

  const handleGenerateMyReport = async () => {
    setLoadingReport(true);
    try {
      const res = await reportsAPI.getEmployeeFullReport({
        employee_id: user.id,
        month_year: reportMonth
      });
      setFullReportData(res.data);
    } catch (err) {
      console.error('Error generating personal report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchTodayData();
    fetchHistory();
    fetchMyEvaluations();
  }, []);

  const currentDateFormatted = format(new Date(), 'EEEE, MMMM do, yyyy');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, color: 'text.secondary' }}>
            <CalendarIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {currentDateFormatted} • <strong>{user?.designation || 'Staff'}</strong> ({user?.department})
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={() => {
              fetchHistory();
              setOpenHistoryModal(true);
            }}
            sx={{ fontWeight: 600 }}
          >
            My Attendance Log
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<ReportIcon />}
            onClick={() => {
              setOpenReportModal(true);
              handleGenerateMyReport();
            }}
            sx={{ fontWeight: 700 }}
          >
            Monthly Timesheet
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<EvalIcon />}
            onClick={() => setOpenEvalModal(true)}
            sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
          >
            August Self-Evaluation
          </Button>
        </Box>
      </Box>

      {/* Submitted Evaluations Banner (if any) */}
      {myEvaluations.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EvalIcon color="success" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#15803d' }}>
                  August Self-Evaluation Submitted
                </Typography>
                <Typography variant="caption" sx={{ color: '#166534' }}>
                  Submitted on {myEvaluations[0].submission_date} • Overall Rating: <strong>{myEvaluations[0].overall_rating} / 5.0 ⭐</strong>
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={() => {
                setSelectedEvaluation(myEvaluations[0]);
                setOpenEvalViewerModal(true);
              }}
              sx={{ fontWeight: 700 }}
            >
              View & Export Submitted Appraisal (PDF)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Top: Geofence Punch */}
      <Box sx={{ mb: 3 }}>
        <GeofencePunch todayData={todayData} onRefresh={fetchTodayData} />
      </Box>

      {/* Daily WorkDone Task Logger Section */}
      <WorkDoneSection />

      {/* Leaves & Permissions Section */}
      <LeavesSection />

      {/* Attendance History Modal */}
      <Dialog open={openHistoryModal} onClose={() => setOpenHistoryModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" /> My Monthly Attendance Records
        </DialogTitle>
        <DialogContent dividers>
          {historyRecords.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
              No past attendance records found in Google Sheets.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Login Time</TableCell>
                  <TableCell>Logout Time</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Net Working Hours</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyRecords.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.date}</TableCell>
                    <TableCell>{r.login_time || '--'}</TableCell>
                    <TableCell>{r.logout_time || 'Active / Not punched out'}</TableCell>
                    <TableCell>{r.total_hours || '0'}h</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{r.net_hours || '0'}h</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={r.status || 'Present'}
                        color={r.status === 'Late' ? 'warning' : 'success'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenHistoryModal(false)} color="primary" variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Personal Report Modal (Without AI) */}
      <Dialog open={openReportModal} onClose={() => setOpenReportModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportIcon color="primary" /> My Complete Performance & Timesheet Report (Google Sheets)
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              size="small"
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              size="small"
              variant="contained"
              onClick={handleGenerateMyReport}
              disabled={loadingReport}
            >
              {loadingReport ? 'Loading...' : 'Refresh'}
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          {loadingReport ? (
            <DocumentViewerSkeleton />
          ) : fullReportData ? (
            <EmployeeReportViewer reportData={fullReportData} />
          ) : (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              No report data available for the selected period.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenReportModal(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* 13-Section Monthly Self-Evaluation Form Modal */}
      <MonthlySelfEvaluationModal
        open={openEvalModal}
        onClose={() => setOpenEvalModal(false)}
        user={user}
        onSuccess={() => {
          fetchMyEvaluations();
        }}
      />

      {/* Submitted Self-Evaluation Document Viewer Modal */}
      <Dialog open={openEvalViewerModal} onClose={() => setOpenEvalViewerModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Submitted Performance Appraisal Document
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          <SelfEvaluationViewer evaluation={selectedEvaluation} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEvalViewerModal(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
