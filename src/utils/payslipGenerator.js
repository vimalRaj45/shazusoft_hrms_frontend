import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Helper to convert numbers to Indian Rupee Words
 */
export function numberToWordsINR(num) {
  if (num === null || num === undefined || isNaN(num) || num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'overflow';
    const nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArr) return '';
    let str = '';
    str += Number(nArr[1]) !== 0 ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'Crore ' : '';
    str += Number(nArr[2]) !== 0 ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'Lakh ' : '';
    str += Number(nArr[3]) !== 0 ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'Thousand ' : '';
    str += Number(nArr[4]) !== 0 ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'Hundred ' : '';
    str += Number(nArr[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
    return str.trim();
  }

  const rounded = Math.round(num);
  const words = inWords(rounded);
  return words ? `${words} Rupees Only` : 'Zero Rupees Only';
}

/**
 * Format currency with Indian Comma style
 */
export function formatINR(val) {
  const num = Number(val) || 0;
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/**
 * Generates an official, corporate, single-page PDF payslip
 */
export async function generatePayslipPDF(payslipData) {
  if (!payslipData) return;

  const {
    employee_name = 'Employee',
    employee_id = '',
    department = 'General',
    designation = 'Staff',
    payroll_month = format(new Date(), 'yyyy-MM'),
    monthly_salary = 0,
    daily_rate = 0,
    total_working_days = 0,
    present_days = 0,
    paid_leaves = 0,
    lop_days = 0,
    lop_deduction = 0,
    net_payable = 0,
    status = 'Pending',
    bank_name = '',
    account_number = '',
    ifsc_code = '',
    upi_id = '',
    pan_number = '',
    payment_mode = '',
    payment_date = '',
    payment_reference = ''
  } = payslipData;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Month formatting (e.g., '2026-09' -> 'September 2026')
  let formattedMonth = payroll_month;
  try {
    const [y, m] = payroll_month.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    formattedMonth = format(dateObj, 'MMMM yyyy');
  } catch (e) {}

  let y = margin;

  // Outer border with subtle double-line elegance
  doc.setDrawColor(200, 210, 225);
  doc.setLineWidth(0.6);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8);
  doc.setLineWidth(0.2);
  doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - margin * 2 + 4);

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // Deep navy slate
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SHAZU SOFT TECHNOLOGIES', margin + 6, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(56, 189, 248); // Cyan
  doc.text('Software Services • Research & Development • Education & Internships (MSME Recognized Entity)', margin + 6, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text('2nd Agraharam, Chairman Rajarathinam Street, Near Kamala Hospital, Salem, Tamil Nadu – 636001', margin + 6, y + 17);
  doc.text('Email: info@shazusofttechnologies.org  |  HR Helpline: +91 93616 80077  |  Web: shazusofttechnologies.org', margin + 6, y + 21.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Monthly Salary Remuneration Advice & Confidential Statement of Earnings', margin + 6, y + 26);

  // Month & MSME Badge (Right side of banner)
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - margin - 52, y + 4, 46, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(56, 189, 248);
  doc.text('PAYSLIP PERIOD', pageWidth - margin - 49, y + 9.5);
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(formattedMonth.toUpperCase(), pageWidth - margin - 49, y + 15.5);
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text('MSME RECOGNIZED', pageWidth - margin - 49, y + 21);

  y += 36;

  // 2. Employee & Bank Information Grid (2 columns)
  const colWidth = (contentWidth - 6) / 2;

  // Left Column Box: Employee Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, 42, 2, 2, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, colWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('EMPLOYEE DETAILS', margin + 4, y + 5);

  const empDetails = [
    ['Employee Name:', employee_name],
    ['Employee ID:', employee_id],
    ['Designation:', designation],
    ['Department:', department],
    ['Status:', status === 'Paid' ? 'PAID / DISBURSED' : 'PENDING APPROVAL']
  ];

  let empY = y + 12;
  empDetails.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, margin + 4, empY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    if (lbl === 'Status:') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(status === 'Paid' ? 16 : 217, status === 'Paid' ? 149 : 119, status === 'Paid' ? 193 : 6);
    }
    doc.text(String(val || '—'), margin + 34, empY);
    empY += 6;
  });

  // Right Column Box: Bank & Disbursement Details
  const rightX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, y, colWidth, 42, 2, 2, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(rightX, y, colWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('BANK & DISBURSEMENT INFO', rightX + 4, y + 5);

  const maskedAccount = account_number
    ? (account_number.length > 4 ? `•••• •••• ${account_number.slice(-4)}` : account_number)
    : '—';

  const bankDetails = [
    ['Bank Name:', bank_name || '—'],
    ['Account No:', maskedAccount],
    ['IFSC Code:', ifsc_code || '—'],
    ['Payment Mode:', payment_mode || 'Bank Transfer / UPI'],
    ['Ref / Txn ID:', payment_reference || '—']
  ];

  let bankY = y + 12;
  bankDetails.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, rightX + 4, bankY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(val || '—'), rightX + 34, bankY);
    bankY += 6;
  });

  y += 48;

  // 3. Attendance & Working Days Summary Strip
  doc.setFillColor(240, 253, 250); // Mint/teal tint
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  const metricW = contentWidth / 4;
  const metrics = [
    { label: 'Total Working Days', value: total_working_days, hint: '(Incl. Working Sundays)' },
    { label: 'Days Present', value: present_days, hint: '(Biometric/Geo Verified)' },
    { label: 'Approved Paid Leaves', value: paid_leaves, hint: '(Casual/Sick/Paid)' },
    { label: 'Loss of Pay (LOP) Days', value: lop_days, hint: '(Unpaid / Absent)' }
  ];

  metrics.forEach((m, idx) => {
    const mx = margin + idx * metricW;
    if (idx > 0) {
      doc.setDrawColor(204, 251, 241);
      doc.line(mx, y + 2, mx, y + 18);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(13, 148, 136); // Teal
    doc.text(m.label.toUpperCase(), mx + metricW / 2, y + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(String(m.value), mx + metricW / 2, y + 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(m.hint, mx + metricW / 2, y + 16.5, { align: 'center' });
  });

  y += 26;

  // 4. Earnings & Deductions AutoTable
  const earningsData = [
    ['Monthly Base Salary', formatINR(monthly_salary)],
    ['Special Startup Allowances', formatINR(0)],
    ['Overtime / Bonus', formatINR(0)],
    ['Gross Earnings', formatINR(monthly_salary)]
  ];

  const deductionsData = [
    [`Loss of Pay (LOP: ${lop_days} days @ ${formatINR(daily_rate)}/day)`, formatINR(lop_deduction)],
    ['Provident Fund (PF - Startup Exempt)', formatINR(0)],
    ['Professional Tax / TDS', formatINR(0)],
    ['Total Deductions', formatINR(lop_deduction)]
  ];

  // Combine row by row
  const tableRows = [];
  for (let i = 0; i < 4; i++) {
    const isLast = i === 3;
    tableRows.push([
      earningsData[i][0],
      earningsData[i][1],
      deductionsData[i][0],
      deductionsData[i][1]
    ]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [[
      { content: 'EARNINGS & REMUNERATION', colSpan: 2, styles: { halign: 'left', fillColor: [30, 41, 59] } },
      { content: 'DEDUCTIONS & RECOVERIES', colSpan: 2, styles: { halign: 'left', fillColor: [71, 85, 105] } }
    ], [
      'Description', 'Amount (INR)', 'Description', 'Amount (INR)'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 57 },
      3: { cellWidth: 35, halign: 'right' }
    },
    didParseCell: (data) => {
      // Highlight totals row (index 3)
      if (data.row.index === 3 && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // 5. Net Payable Banner
  doc.setFillColor(238, 242, 255); // Indigo light
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(67, 56, 202); // Indigo dark
  doc.text('NET PAYABLE REMUNERATION (TAKE-HOME SALARY)', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Amount in Words: ${numberToWordsINR(net_payable)}`, margin + 6, y + 16);

  // Big Amount in Net Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 27, 75);
  doc.text(formatINR(net_payable), pageWidth - margin - 6, y + 15, { align: 'right' });

  y += 32;

  // 6. Notes & Digital Signature Block
  const noteW = contentWidth * 0.58;
  const sigW = contentWidth * 0.38;

  // Left: Calculation note
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CALCULATION NOTE & DISCLOSURE:', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  const noteLines = [
    '• Daily Rate is computed as Monthly Base Salary ÷ Total Working Days in calendar month.',
    '• Total Working Days strictly includes company-scheduled Working Sundays and excludes paid holidays.',
    '• Loss of Pay (LOP) = max(0, Total Working Days - Days Present - Approved Paid Leaves).',
    '• This is an authentic computer-generated digital payslip and requires no manual physical signature.'
  ];
  let noteY = y + 5;
  noteLines.forEach(line => {
    doc.text(line, margin, noteY);
    noteY += 4.2;
  });

  // Right: Signature Stamp Area
  const sigX = pageWidth - margin - sigW;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(sigX, y - 2, sigW, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('FOR SHAZU SOFT TECHNOLOGIES', sigX + sigW / 2, y + 4, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129); // Green digital verified tag
  doc.text('[DIGITALLY SIGNED & VERIFIED]', sigX + sigW / 2, y + 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory  |  Salem HQ, Tamil Nadu', sigX + sigW / 2, y + 20, { align: 'center' });

  // 7. Footer line at the very bottom
  const footerY = pageHeight - margin + 1;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Confidential Remuneration Record — Shazu Soft Technologies (MSME Recognized Entity | Salem, TN)', margin, footerY);
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageWidth - margin, footerY, { align: 'right' });

  // Save the PDF
  const filename = `Payslip_${(employee_name || 'Staff').replace(/\s+/g, '_')}_${payroll_month}.pdf`;
  doc.save(filename);
}
