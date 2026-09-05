import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { formatTime12h } from './timeUtils.js';

/**
 * Loads an image URL into an HTMLImageElement and converts to base64 DataURL
 */
function loadImageAsDataUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 120;
        canvas.height = img.naturalHeight || img.height || 120;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Could not convert logo to DataURL:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('Failed to load logo image:', url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Generates an executive, black-and-white / dark corporate PDF report
 * with official company branding, timesheets, work logs, and signature sign-offs.
 */
export async function generateCorporatePDFReport(reportData) {
  if (!reportData) return;

  const {
    employee = {},
    summaryMetrics = {},
    projectBreakdown = [],
    dailyActivityTimeline = [],
    leaveSummary = {},
    monthYear = format(new Date(), 'yyyy-MM')
  } = reportData;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Attempt to load official logo
  const logoDataUrl = await loadImageAsDataUrl('/logo.png');

  let currentY = 14;

  // 1. BRAND HEADER & DOCUMENT TITLE
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin, currentY, 15, 15);
    } catch (e) {
      // fallback if image add fails
    }
  }

  const headerTextLeft = logoDataUrl ? margin + 18 : margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39); // Deep corporate black
  doc.text('SHAZU SOFT', headerTextLeft, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text('HUMAN RESOURCES MANAGEMENT SYSTEM', headerTextLeft, currentY + 9.5);

  // Document Reference & Generation Timestamp on Top Right
  const timestamp = format(new Date(), 'yyyy-MM-dd hh:mm:ss a');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);
  doc.text(`REPORT REF: SS-HRMS-${(employee.id || 'EMP').toUpperCase()}-${monthYear}`, pageWidth - margin, currentY + 4.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${timestamp}`, pageWidth - margin, currentY + 9, { align: 'right' });
  doc.text(`Status: OFFICIAL AUDIT RECORD`, pageWidth - margin, currentY + 13.5, { align: 'right' });

  currentY += 18;

  // Top Divider Line
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // Title Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('EMPLOYEE MONTHLY ATTENDANCE & PERFORMANCE REPORT', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  // 2. EMPLOYEE INFORMATION MATRIX (Monochrome Table)
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    head: [
      [
        { content: 'EMPLOYEE IDENTIFICATION', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [15, 23, 42] } },
        { content: 'RECORD SPECIFICATIONS', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [15, 23, 42] } }
      ]
    ],
    body: [
      [
        { content: 'Employee Name:', styles: { fontStyle: 'bold', width: 32 } },
        { content: employee.name || 'N/A' },
        { content: 'Report Month / Period:', styles: { fontStyle: 'bold', width: 36 } },
        { content: monthYear }
      ],
      [
        { content: 'Employee ID:', styles: { fontStyle: 'bold' } },
        { content: employee.id || 'N/A' },
        { content: 'Assigned Work Mode:', styles: { fontStyle: 'bold' } },
        { content: (employee.work_mode || 'office').toUpperCase() === 'WFH' ? 'Work From Home (Remote)' : 'In-Office (GPS Verified)' }
      ],
      [
        { content: 'Department:', styles: { fontStyle: 'bold' } },
        { content: employee.department || 'N/A' },
        { content: 'Role / Designation:', styles: { fontStyle: 'bold' } },
        { content: `${employee.designation || 'Staff'} (${(employee.role || 'employee').toUpperCase()})` }
      ],
      [
        { content: 'Email Address:', styles: { fontStyle: 'bold' } },
        { content: employee.email || 'N/A' },
        { content: 'Record Integrity:', styles: { fontStyle: 'bold' } },
        { content: 'System-Authenticated & Timestamped' }
      ]
    ]
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 3. EXECUTIVE SUMMARY METRICS (Monochrome Clean Grid)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text('I. EXECUTIVE ATTENDANCE & HOURS SUMMARY', margin, currentY);
  currentY += 2;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.3
    },
    head: [
      [
        'Total Logged Days',
        'Present (On-Time)',
        'Late Entries',
        'Gross Hours',
        'Net Work Hours',
        'Daily Avg Net',
        'Tasks Logged',
        'Completion Rate'
      ]
    ],
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    body: [
      [
        String(summaryMetrics.totalDaysLogged || 0),
        String(summaryMetrics.presentDays || 0),
        String(summaryMetrics.lateDays || 0),
        `${parseFloat(summaryMetrics.totalHoursGross || 0).toFixed(1)} hrs`,
        `${parseFloat(summaryMetrics.totalNetHours || 0).toFixed(1)} hrs`,
        `${parseFloat(summaryMetrics.avgDailyNetHours || 0).toFixed(1)} hrs/day`,
        String(summaryMetrics.totalTasks || 0),
        `${summaryMetrics.taskCompletionRate || 0}%`
      ]
    ],
    bodyStyles: {
      halign: 'center',
      fillColor: [248, 250, 252],
      fontStyle: 'bold'
    }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // 4. CHRONOLOGICAL TIMESHEET TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text('II. DAILY ATTENDANCE & PUNCH TIMESHEET', margin, currentY);
  currentY += 2;

  const timesheetRows = (dailyActivityTimeline || []).map((day) => {
    let dayName = '';
    try {
      dayName = format(new Date(day.date), 'EEE');
    } catch (e) {
      dayName = '';
    }

    return [
      day.date,
      dayName,
      day.loginTime ? formatTime12h(day.loginTime) : '—',
      day.logoutTime ? formatTime12h(day.logoutTime) : '—',
      day.netHours ? `${parseFloat(day.netHours).toFixed(1)} hrs` : '0.0 hrs',
      (day.workMode || 'Office').toUpperCase(),
      day.attendanceStatus || 'Absent'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    head: [
      ['Date', 'Day', 'Punch In', 'Punch Out', 'Net Hours', 'Mode', 'Attendance Status']
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold' },
      1: { cellWidth: 16 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 22, fontStyle: 'bold' },
      6: { cellWidth: 'auto', fontStyle: 'bold' }
    },
    body: timesheetRows.length > 0 ? timesheetRows : [['No attendance records logged for this period', '', '', '', '', '', '']]
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // 5. PROJECT & TASK LOG SUMMARY (if page space allows or auto-page breaks)
  if (projectBreakdown && projectBreakdown.length > 0) {
    // Check remaining page height, add page if tight
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text('III. PROJECT & TASK EXECUTION SUMMARY', margin, currentY);
    currentY += 2;

    const projectRows = projectBreakdown.map((proj) => [
      proj.projectName,
      String(proj.totalTasks || 0),
      String(proj.completedTasks || 0),
      `${proj.estimatedHours || 0} hrs`,
      `${proj.actualHours || 0} hrs`,
      `${proj.completionRate || 0}%`,
      `${proj.percentageShare || 0}%`
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15
      },
      head: [
        ['Project Name', 'Total Tasks', 'Completed', 'Est. Time', 'Actual Time', 'Completion %', 'Time Share']
      ],
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      body: projectRows
    });

    currentY = doc.lastAutoTable.finalY + 6;
  }

  // 6. FORMAL SIGN-OFF & CERTIFICATION BLOCK
  // Ensure enough room for signature block; add page if needed
  if (currentY > pageHeight - 48) {
    doc.addPage();
    currentY = 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('IV. OFFICIAL VERIFICATION & AUTHORIZATION', margin, currentY);
  currentY += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  const declarationText = 'I hereby verify that the above attendance log, recorded work hours, and daily operational logs represent an authentic and complete record of activities performed during the designated billing/payroll cycle.';
  const splitDeclaration = doc.splitTextToSize(declarationText, contentWidth);
  doc.text(splitDeclaration, margin, currentY);
  currentY += splitDeclaration.length * 3.5 + 4;

  // Signature lines table
  const generatedDateStr = format(new Date(), 'yyyy-MM-dd');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.4
    },
    body: [
      [
        {
          content: `\n\n_____________________________________\nEMPLOYEE SIGNATURE\nName: ${employee.name || 'Staff'}\nDate: ${generatedDateStr}`,
          styles: { width: contentWidth / 2 - 2, fontStyle: 'bold' }
        },
        {
          content: `\n\n_____________________________________\nAUTHORIZED MANAGEMENT SIGNATORY\nFor: SHAZU SOFT HR & OPERATIONS\nDate: ${generatedDateStr}`,
          styles: { width: contentWidth / 2 - 2, fontStyle: 'bold' }
        }
      ]
    ]
  });

  // 7. RUNNING HEADER & FOOTER ON ALL PAGES
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header (from page 2 onwards)
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('SHAZU SOFT HRMS — OFFICIAL CONFIDENTIAL RECORD', margin, 9);
      doc.text(`Employee: ${employee.name} (${employee.id}) • Month: ${monthYear}`, pageWidth - margin, 9, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, 10.5, pageWidth - margin, 10.5);
    }

    // Running Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Document Ref: SS-HRMS-${(employee.id || 'EMP').toUpperCase()}-${monthYear} • Confidential Internal Company Document`, margin, pageHeight - 5.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
  }

  // Save / Download PDF file
  const filename = `SHAZU_HRMS_Report_${(employee.id || 'EMP').replace(/\s+/g, '_')}_${monthYear}.pdf`;
  doc.save(filename);
}

// Named export for executive timesheet PDF generation (delegates to generateCorporatePDFReport)
export async function generateExecutivePDFReport(reportData) {
  return generateCorporatePDFReport(reportData);
}

/**
 * Generates an executive corporate monochrome Appraisal PDF document
 */
export async function generateAppraisalPDFReport(evaluation) {
  if (!evaluation) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, currentY, contentWidth, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('SHAZU SOFT TECHNOLOGIES — PERFORMANCE APPRAISAL', margin + 4, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Period: ${evaluation.review_period || 'Monthly Appraisal'} | Month: ${evaluation.review_month || 'August 2026'}`, margin + 4, currentY + 13);

  currentY += 23;

  // 1. Employee Details Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    body: [
      [
        { content: 'Employee Name:', styles: { fontStyle: 'bold', width: 30 } },
        { content: evaluation.employee_name || '—', styles: { width: 55 } },
        { content: 'Employee ID:', styles: { fontStyle: 'bold', width: 30 } },
        { content: evaluation.employee_id || '—', styles: { width: 55 } }
      ],
      [
        { content: 'Designation:', styles: { fontStyle: 'bold' } },
        { content: evaluation.designation || '—' },
        { content: 'Department:', styles: { fontStyle: 'bold' } },
        { content: evaluation.department || '—' }
      ],
      [
        { content: 'Reporting Person:', styles: { fontStyle: 'bold' } },
        { content: evaluation.reporting_person || '—' },
        { content: 'Submission Date:', styles: { fontStyle: 'bold' } },
        { content: evaluation.submission_date || evaluation.created_at || '—' }
      ]
    ]
  });

  currentY = doc.lastAutoTable.finalY + 4;

  // 2. Targets & Key Accomplishments Table
  const targets = Array.isArray(evaluation.targets_tasks) ? evaluation.targets_tasks : [];
  if (targets.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TARGETS & WORK DELIVERABLES', margin, currentY);
    currentY += 2;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 1.8, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.1 },
      head: [['#', 'Target / Task Description', 'Target Date', 'Actual Date', 'Progress', 'Status']],
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      body: targets.map((t, idx) => [
        String(idx + 1),
        t.description || t.task || '—',
        t.target_date || '—',
        t.actual_date || '—',
        `${t.progress || 0}%`,
        t.status || 'Done'
      ])
    });

    currentY = doc.lastAutoTable.finalY + 4;
  }

  // 3. Performance Ratings Table
  const ratings = evaluation.ratings || {};
  const ratingKeys = Object.keys(ratings);
  if (ratingKeys.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`PERFORMANCE RATINGS (Overall Score: ${evaluation.overall_rating || '5'}/5)`, margin, currentY);
    currentY += 2;

    const ratingRows = ratingKeys.map(k => [
      k.replace(/_/g, ' ').toUpperCase(),
      `${ratings[k]}/5 Stars`
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.6, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.1 },
      head: [['Assessment Criteria', 'Self Rating']],
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      body: ratingRows
    });

    currentY = doc.lastAutoTable.finalY + 4;
  }

  // 4. Narrative Sections
  const narrativeSections = [
    { title: 'Key Accomplishments', content: evaluation.key_accomplishments },
    { title: 'Challenges Faced & Solutions', content: evaluation.challenges_faced },
    { title: 'Learning & Skill Development', content: evaluation.learning_development },
    { title: 'Areas for Improvement', content: evaluation.areas_for_improvement },
    { title: 'Support Required from Management', content: evaluation.support_required },
    { title: 'Goals for Next Period', content: evaluation.goals_next_month }
  ].filter(s => s.content && s.content.trim().length > 0);

  narrativeSections.forEach(sec => {
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(sec.title.toUpperCase(), margin, currentY);
    currentY += 2;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: { fontSize: 7.2, cellPadding: 2, textColor: [51, 65, 85], lineColor: [226, 232, 240], lineWidth: 0.1 },
      body: [[sec.content]]
    });

    currentY = doc.lastAutoTable.finalY + 3;
  });

  // 5. Sign-off block
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = margin;
  }

  const generatedDateStr = format(new Date(), 'yyyy-MM-dd');

  autoTable(doc, {
    startY: currentY + 4,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 3, textColor: [30, 41, 59], lineColor: [203, 213, 225], lineWidth: 0.3 },
    body: [
      [
        {
          content: `\n\n_____________________________________\nEMPLOYEE SIGNATURE\nName: ${evaluation.employee_name || 'Staff'}\nDate: ${evaluation.submission_date || generatedDateStr}`,
          styles: { width: contentWidth / 2 - 2, fontStyle: 'bold' }
        },
        {
          content: `\n\n_____________________________________\nREVIEWING MANAGER SIGNATURE\nFor: SHAZU SOFT MANAGEMENT\nDate: ${generatedDateStr}`,
          styles: { width: contentWidth / 2 - 2, fontStyle: 'bold' }
        }
      ]
    ]
  });

  // Running footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Official Appraisal Document • Shazu Soft Technologies • Confidential`, margin, pageHeight - 4.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 4.5, { align: 'right' });
  }

  const filename = `SHAZU_Appraisal_${(evaluation.employee_id || 'EMP').replace(/\s+/g, '_')}_${evaluation.review_month || 'August_2026'}.pdf`;
  doc.save(filename);
}
