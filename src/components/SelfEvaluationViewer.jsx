import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Rating
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
  Description as DocIcon
} from '@mui/icons-material';
import { generateAppraisalPDFReport } from '../utils/pdfReportGenerator';
import toast from '../utils/muiToast';

const RATING_LABELS = {
  quality_of_work: 'Quality of Work',
  productivity: 'Productivity',
  meeting_deadlines: 'Meeting Deadlines',
  technical_skills: 'Technical / Job Skills',
  communication: 'Communication',
  teamwork: 'Teamwork & Collaboration',
  problem_solving: 'Problem Solving',
  initiative_ownership: 'Initiative & Ownership',
  learning_development: 'Learning & Skill Development',
  attendance_punctuality: 'Attendance & Punctuality',
  professional_behaviour: 'Professional Behaviour'
};

export default function SelfEvaluationViewer({ evaluation, onAddReview }) {
  if (!evaluation) return null;

  const targets = evaluation.targets_tasks || [];
  const ratings = evaluation.ratings || {};

  const handleDownloadPDF = async () => {
    try {
      await generateAppraisalPDFReport(evaluation);
      toast.success('Appraisal PDF downloaded successfully!');
    } catch (err) {
      console.error('Appraisal PDF Error:', err);
      toast.error('Failed to export appraisal PDF.');
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Card sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
        {/* Document Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DocIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Monthly Employee Self-Evaluation & Performance Appraisal
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mt: 0.5 }}>
              REVIEW MONTH: {evaluation.review_month || 'August 2026'} • PERIOD: {evaluation.review_period || '01-Aug to 31-Aug'}
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
            sx={{ fontWeight: 700, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
          >
            Download Appraisal PDF
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 1. Employee Details */}
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
            1. EMPLOYEE DETAILS
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>NAME</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{evaluation.employee_name}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>EMPLOYEE ID</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{evaluation.employee_id}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>DESIGNATION</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{evaluation.designation}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>DEPARTMENT</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{evaluation.department}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>REPORTING PERSON</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{evaluation.reporting_person}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>SUBMISSION DATE</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{evaluation.submission_date}</Typography>
            </Grid>
            <Grid item xs={6} sm={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>STATUS</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip label={evaluation.status || 'Submitted'} size="small" color="success" sx={{ fontWeight: 700 }} />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* 2. Monthly Work Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
            2. MONTHLY WORK SUMMARY
          </Typography>
          <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
              {evaluation.monthly_work_summary}
            </Typography>
          </Box>
        </Box>

        {/* 3. Targets / Tasks */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
            3. TARGETS & TASKS COMPLETED ({targets.length})
          </Typography>
          <Table size="small" sx={{ border: '1px solid #e2e8f0' }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Target / Task</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {targets.map((t, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontWeight: 700 }}>{t.task}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{t.description || '--'}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t.progress || '100%'}</TableCell>
                  <TableCell>
                    <Chip label={t.status || 'Completed'} size="small" color="success" sx={{ fontWeight: 700, fontSize: 11 }} />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{t.remarks || '--'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* 4. Self-Rating */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
              4. COMPETENCY SELF-RATINGS
            </Typography>
            <Chip
              label={`OVERALL SCORE: ${evaluation.overall_rating || '4.5'} / 5.0 ⭐`}
              color="primary"
              sx={{ fontWeight: 800 }}
            />
          </Box>
          <Grid container spacing={1.5}>
            {Object.entries(RATING_LABELS).map(([key, label]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Box sx={{ p: 1.2, border: '1px solid #e2e8f0', borderRadius: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{label}</Typography>
                  <Rating value={parseFloat(ratings[key]) || 5} readOnly size="small" />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 5, 6, 7: Accomplishments, Challenges, Learning */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#059669', mb: 0.5 }}>
                5. KEY ACCOMPLISHMENTS
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                {evaluation.key_accomplishments || '--'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#d97706', mb: 0.5 }}>
                6. CHALLENGES FACED
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                {evaluation.challenges_faced || 'None reported.'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#2563eb', mb: 0.5 }}>
                7. LEARNING & DEVELOPMENT
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                {evaluation.learning_development || '--'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* 8, 9, 10: Improvement, Support, Goals for Next Month */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                8. AREAS FOR IMPROVEMENT
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {evaluation.areas_for_improvement || 'Continuous refinement.'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                9. SUPPORT REQUIRED
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {evaluation.support_required || 'Standard peer feedback.'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#eff6ff', height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af', mb: 0.5 }}>
                10. GOALS FOR NEXT MONTH
              </Typography>
              <Typography variant="body2" sx={{ color: '#1e3a8a', fontWeight: 600 }}>
                {evaluation.goals_next_month || '--'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* 11. Comments, 12. Declaration & 13. Signature */}
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>11. EMPLOYEE COMMENTS</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>{evaluation.employee_comments || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>12. DECLARATION & 13. SIGNATURE</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: 'primary.main' }}>
                Signed by: {evaluation.signature} • {evaluation.submission_date}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Box>
  );
}
