import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { applyShazuWatermark } from './documentWatermark.js';

/**
 * Formats a number cleanly for PDF generation using standard ASCII characters.
 * Eliminates the Unicode Rupee symbol (₹) encoding corruption (¹) in jsPDF standard fonts.
 */
export function formatPDFAmount(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Loads an image URL into an HTMLImageElement and converts to base64 DataURL.
 * Safely guards against Node.js / SSR environments.
 */
function loadImageAsDataUrl(url) {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
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
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch (e) {
      resolve(null);
    }
  });
}

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
 * Generates an executive, professional, monochrome / dark corporate PDF payslip
 * precisely aligned with Shazu Soft's corporate reporting standards.
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
    working_sundays = 0,
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

  // Attempt to load official logo
  const logoDataUrl = await loadImageAsDataUrl('/logo.png');

  let currentY = 14;
  const isPartTime = ['part_time', 'parttime', 'internship'].includes(String(payslipData.employment_type || '').toLowerCase()) ||
    String(employee_id || '').startsWith('PT-') ||
    String(employee_id || '').startsWith('INT-') ||
    /(?:part-time|part\s*time|intern)/i.test(designation || '');

  // 1. BRAND HEADER & REPORT REFERENCE (Exact reference match)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin, currentY, 15, 15);
    } catch (e) {
      // fallback
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

  // Top Right Meta Block
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);
  doc.text(
    `REPORT REF: SS-HRMS-${isPartTime ? 'PT' : 'PAY'}-${(employee_id || 'EMP').toUpperCase()}-${payroll_month}`,
    pageWidth - margin,
    currentY + 4.5,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${timestamp}`, pageWidth - margin, currentY + 9, { align: 'right' });
  doc.text(
    `Status: ${status === 'Paid' ? 'OFFICIAL DISBURSED RECORD' : (isPartTime ? 'OFFICIAL PART-TIME RECORD' : 'OFFICIAL SALARY RECORD')}`,
    pageWidth - margin,
    currentY + 13.5,
    { align: 'right' }
  );

  currentY += 18;

  // Thin Top Divider Line
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // Centered Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isPartTime
      ? 'PART-TIME MONTHLY SALARY VOUCHER & REMUNERATION STATEMENT'
      : 'EMPLOYEE MONTHLY SALARY PAYSLIP & REMUNERATION STATEMENT',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 5;

  // 2. EMPLOYEE IDENTIFICATION & RECORD SPECIFICATIONS MATRIX
  const maskedAccount = account_number
    ? (account_number.length > 4 ? `•••• •••• ${account_number.slice(-4)}` : account_number)
    : '—';

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
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
        { content: 'Employee Name:', styles: { fontStyle: 'bold', cellWidth: 32 } },
        { content: employee_name || 'N/A' },
        { content: 'Payroll Month / Period:', styles: { fontStyle: 'bold', cellWidth: 38 } },
        { content: `${payroll_month} (${formattedMonth})` }
      ],
      [
        { content: 'Employee ID:', styles: { fontStyle: 'bold' } },
        { content: employee_id || 'N/A' },
        { content: 'Disbursement Status:', styles: { fontStyle: 'bold' } },
        { content: status === 'Paid' ? 'Paid / Settled' : 'Pending Settlement' }
      ],
      [
        { content: 'Department:', styles: { fontStyle: 'bold' } },
        { content: department || 'General' },
        { content: 'Role & Classification:', styles: { fontStyle: 'bold' } },
        { content: `${designation || 'Staff'} • ${isPartTime ? 'Part-Time Staff' : 'Full-Time Staff'}` }
      ],
      [
        { content: 'Bank Name & A/C:', styles: { fontStyle: 'bold' } },
        { content: bank_name ? `${bank_name} (${maskedAccount})` : 'Not Configured' },
        { content: 'IFSC / UPI ID:', styles: { fontStyle: 'bold' } },
        { content: `${ifsc_code || '—'} / ${upi_id || '—'}` }
      ],
      [
        { content: 'PAN Identification:', styles: { fontStyle: 'bold' } },
        { content: pan_number || '—' },
        { content: 'Corporate Entity:', styles: { fontStyle: 'bold' } },
        { content: 'Shazu Soft Technologies (MSME Recognized)' }
      ]
    ]
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 3. SECTION I: ATTENDANCE & WORKING DAYS SUMMARY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text('I. EXECUTIVE ATTENDANCE & WORKING DAYS SUMMARY', margin, currentY);
  currentY += 2;

  const payableDays = Math.max(0, (total_working_days || 0) - (lop_days || 0));

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
        'Total Working Days',
        'Working Sundays',
        'Present (Attended)',
        'Approved Leaves',
        'Loss of Pay (LOP)',
        'Net Payable Days'
      ]
    ],
    headStyles: {
      fillColor: [30, 41, 59], // Dark corporate navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    body: [
      [
        String(total_working_days || 0),
        String(working_sundays || 0),
        String(present_days || 0),
        String(paid_leaves || 0),
        String(lop_days || 0),
        String(payableDays)
      ]
    ],
    bodyStyles: {
      halign: 'center',
      fillColor: [248, 250, 252],
      fontStyle: 'bold'
    }
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 4. SECTION II: EARNINGS & DEDUCTIONS BREAKDOWN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text('II. EARNINGS & DEDUCTIONS STATEMENT', margin, currentY);
  currentY += 2;

  const lopTitle = lop_days > 0
    ? `Loss of Pay (LOP: ${lop_days} days @ Rs. ${formatPDFAmount(daily_rate)}/day)`
    : 'Loss of Pay (LOP: 0 days)';

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.2, right: 3, bottom: 2.2, left: 3 },
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    head: [
      [
        { content: 'Earnings Component', styles: { halign: 'left' } },
        { content: 'Amount (INR)', styles: { halign: 'right' } },
        { content: 'Deductions Component', styles: { halign: 'left' } },
        { content: 'Amount (INR)', styles: { halign: 'right' } }
      ]
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.30, halign: 'left' },
      1: { cellWidth: contentWidth * 0.20, halign: 'right' },
      2: { cellWidth: contentWidth * 0.30, halign: 'left' },
      3: { cellWidth: contentWidth * 0.20, halign: 'right' }
    },
    body: [
      [
        isPartTime ? 'Monthly Part-Time Salary' : 'Monthly Base Salary',
        formatPDFAmount(monthly_salary),
        lopTitle,
        formatPDFAmount(lop_deduction)
      ],
      [
        'Special Startup Allowances',
        formatPDFAmount(0),
        'Provident Fund (PF - Startup Exempt)',
        formatPDFAmount(0)
      ],
      [
        'Overtime / Performance Incentive',
        formatPDFAmount(0),
        'Professional Tax / TDS',
        formatPDFAmount(0)
      ],
      [
        { content: 'Total Gross Earnings', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: formatPDFAmount(monthly_salary), styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } },
        { content: 'Total Deductions', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: formatPDFAmount(lop_deduction), styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } }
      ]
    ]
  });

  currentY = doc.lastAutoTable.finalY + 3;

  // Net Salary Disbursed Highlight Block
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.3
    },
    head: [
      [
        {
          content: 'NET SALARY REMUNERATION (TAKE-HOME DISBURSEMENT)',
          colSpan: 2,
          styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 }
        }
      ]
    ],
    body: [
      [
        {
          content: `NET PAYABLE: Rs. ${formatPDFAmount(net_payable)}`,
          styles: { fontStyle: 'bold', fontSize: 10, textColor: [15, 23, 42] }
        },
        {
          content: `Currency: INR (Indian Rupee)`,
          styles: { halign: 'right', fontStyle: 'bold', textColor: [75, 85, 99] }
        }
      ],
      [
        {
          content: `Amount in Words: ${numberToWordsINR(net_payable)}`,
          colSpan: 2,
          styles: { fontStyle: 'italic', textColor: [51, 65, 85], fontSize: 7.5 }
        }
      ]
    ]
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 5. SECTION III: DISBURSEMENT TRANSACTION RECORD
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text('III. DISBURSEMENT TRANSACTION RECORD', margin, currentY);
  currentY += 2;

  const defaultRef = status === 'Paid'
    ? (payment_reference || `UTR-SS-${payroll_month.replace('-', '')}-${employee_id || '001'}`)
    : 'Pending Settlement';

  const defaultDate = payment_date || (status === 'Paid' ? format(new Date(), 'yyyy-MM-dd') : '—');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    head: [
      ['Disbursement Mode', 'Transaction / UTR Reference', 'Disbursement Date', 'Payment Status', 'Authorized By']
    ],
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    body: [
      [
        payment_mode || 'Bank Transfer / NEFT',
        defaultRef,
        defaultDate,
        status.toUpperCase(),
        'Corporate HR & Finance'
      ]
    ]
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 6. SECTION IV: OFFICIAL VERIFICATION & AUTHORIZATION (Exact reference match)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('IV. OFFICIAL VERIFICATION & AUTHORIZATION', margin, currentY);
  currentY += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  const declarationText = 'I hereby verify that the above salary computation, recorded attendance metrics, loss-of-pay deductions, and bank disbursement represent an authentic and verified record of remuneration for the designated payroll cycle.';
  const splitDeclaration = doc.splitTextToSize(declarationText, contentWidth);
  doc.text(splitDeclaration, margin, currentY);
  currentY += splitDeclaration.length * 3.5 + 2;

  const generatedDateStr = format(new Date(), 'yyyy-MM-dd');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.4
    },
    body: [
      [
        {
          content: `\n\n_____________________________________\nEMPLOYEE ACKNOWLEDGEMENT\nName: ${employee_name || 'Staff'}\nDate: ${generatedDateStr}`,
          styles: { cellWidth: contentWidth / 2 - 2, fontStyle: 'bold' }
        },
        {
          content: `\n\n_____________________________________\nAUTHORIZED MANAGEMENT SIGNATORY\nFor: SHAZU SOFT TECHNOLOGIES HR & OPERATIONS\nHQ: Salem, Tamil Nadu – 636001\nDate: ${generatedDateStr}`,
          styles: { cellWidth: contentWidth / 2 - 2, fontStyle: 'bold' }
        }
      ]
    ]
  });

  // 7. CORPORATE RUNNING FOOTER
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  const footerLine1 = 'SHAZU SOFT TECHNOLOGIES • 2nd Agraharam, Chairman Rajarathinam Street, Near Kamala Hospital, Salem, Tamil Nadu – 636001';
  const footerLine2 = 'MSME Recognized Business Entity (Govt. of India)  |  info@shazusofttechnologies.org  |  +91 93616 80077';
  doc.text(footerLine1, pageWidth / 2, pageHeight - 9, { align: 'center' });
  doc.text(footerLine2, pageWidth / 2, pageHeight - 5.5, { align: 'center' });

  // 8. APPLY OFFICIAL CORPORATE WATERMARK
  applyShazuWatermark(doc);

  // Save the PDF
  const filename = `Payslip_${(employee_id || 'EMP').replace(/\s+/g, '_')}_${payroll_month}.pdf`;
  doc.save(filename);
}
